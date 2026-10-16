// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

var currentJobID string

type Job struct {
	ID        string        `json:"id"`
	Action    string        `json:"action"`
	Process   processRecord `json:"process"`
	Status    string        `json:"status"`
	StartedAt time.Time     `json:"startedAt"`
	Result    Outcome       `json:"result"`
}

func validAction(action string) bool {
	switch action {
	case "test", "save", "apply", "sync", "disable", "delete":
		return true
	}
	return false
}
func (a *App) jobPath(id string) string { return a.data() + "/jobs/" + id + ".json" }
func (a *App) uploadRequest(path string) (Request, error) {
	var req Request
	clean := filepath.Clean(path)
	rel, e := filepath.Rel(a.Upload, clean)
	if e != nil || rel == "." || strings.HasPrefix(rel, "../") || filepath.IsAbs(rel) {
		return req, fail("request_path_invalid")
	}
	b, e := readFile(clean, maxRequest)
	if e != nil {
		return req, e
	}
	// Deletion is mandatory; never acknowledge a sensitive upload that was left behind.
	if e = os.Remove(clean); e != nil {
		return req, fail("uploaded_request_cleanup_failed")
	}
	if _, e = parseJSON(b); e != nil {
		return req, fail("request_json_invalid")
	}
	d := json.NewDecoder(strings.NewReader(string(b)))
	d.DisallowUnknownFields()
	if e = d.Decode(&req); e != nil {
		return req, fail("request_json_invalid")
	}
	return req, nil
}
func (a *App) dispatch(ctx context.Context, action, path string) (string, error) {
	if !validAction(action) {
		return "", fail("invalid_action")
	}
	req := Request{}
	var e error
	if path != "" {
		req, e = a.uploadRequest(path)
		if e != nil {
			return "", e
		}
	}
	return a.dispatchRequest(ctx, action, req)
}
func (a *App) dispatchRequest(ctx context.Context, action string, req Request) (string, error) {
	if !validAction(action) {
		return "", fail("invalid_action")
	}
	var e error
	if exists(a.operationLock()) {
		return "", fail("operation_busy")
	}
	lock, e := lockFile(a.runtime() + "/dispatch.lock")
	if e != nil {
		return "", e
	}
	defer lock.Close()
	entries, e := os.ReadDir(a.data() + "/jobs")
	if e != nil {
		return "", e
	}
	count := 0
	for _, entry := range entries {
		if !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		var j Job
		if readJSON(a.data()+"/jobs/"+entry.Name(), &j) == nil && j.Status == "running" && j.Process.Alive() {
			count++
		}
	}
	if count >= 4 {
		return "", fail("too_many_tasks")
	}
	id := nonce()
	request := a.data() + "/jobs/" + id + ".request"
	if e = writeJSON(request, req); e != nil {
		return "", e
	}
	if e = writeJSON(a.jobPath(id), Job{ID: id, Action: action, Status: "queued", StartedAt: time.Now().UTC()}); e != nil {
		os.Remove(request)
		return "", e
	}
	if e = a.spawn("worker", id, action); e != nil {
		os.Remove(request)
		return "", fail("task_start_failed")
	}
	for i := 0; i < 40; i++ {
		var j Job
		if readJSON(a.jobPath(id), &j) == nil && (j.Status == "finished" || j.Status == "running" && j.Process.Alive()) {
			return id, nil
		}
		select {
		case <-ctx.Done():
			return id, fail("task_start_unconfirmed")
		case <-time.After(50 * time.Millisecond):
		}
	}
	return id, fail("task_start_unconfirmed")
}
func (a *App) worker(ctx context.Context, id, action string) error {
	if !idRE.MatchString(id) || !validAction(action) {
		return fail("invalid_job")
	}
	currentJobID = id
	request := a.data() + "/jobs/" + id + ".request"
	defer os.Remove(request)
	var req Request
	if e := readJSON(request, &req); e != nil {
		return fail("request_unreadable")
	}
	if e := os.Remove(request); e != nil {
		return fail("request_cleanup_failed")
	}
	job := Job{ID: id, Action: action, Process: selfRecord(), Status: "running", StartedAt: time.Now().UTC()}
	if e := writeJSON(a.jobPath(id), job); e != nil {
		return e
	}
	var out Outcome
	var err error
	if exists(a.operationLock()) {
		err = fail("operation_busy")
	} else {
		switch action {
		case "test":
			out, err = a.validateSave(ctx, req, false)
		case "save":
			out, err = a.validateSave(ctx, req, true)
		case "apply":
			out, err = a.applyConfig(ctx, req)
		case "sync":
			out, err = a.syncConfig(ctx, req, false)
		case "disable":
			out, err = a.disableAuto(ctx)
		case "delete":
			out, err = a.deleteSettings(ctx)

		}
	}
	req.Identity = ""
	if err != nil {
		out.OK = false
		if out.Code == "" {
			out.Code = code(err)
		}
	}
	if out.Saved && action != "delete" {
		s, e := a.readSettings()
		if e == nil {
			if s.Auto {
				e = a.startDaemon(ctx)
			} else {
				e = a.stopDaemon(ctx)
			}
		}
		if e != nil {
			out.Warning = code(e)
			out.OK = false
		}
	}
	out.CompletedAt = time.Now().UTC()
	job.Status = "finished"
	job.Result = out
	if e := writeJSON(a.jobPath(id), job); e != nil {
		return fail("task_receipt_write_failed")
	}
	return err
}
func (a *App) readJob(id string) (Job, error) {
	var j Job
	if !idRE.MatchString(id) {
		return j, fail("invalid_job")
	}
	if e := readJSON(a.jobPath(id), &j); e != nil {
		return j, fail("task_receipt_missing")
	}
	if j.Status == "running" && !j.Process.Alive() {
		j.Status = "completion_unknown"
		j.Result.OK = false
		j.Result.Code = "task_receipt_missing"
	}
	if j.Status == "queued" && time.Since(j.StartedAt) > 10*time.Second {
		j.Status = "completion_unknown"
		j.Result.Code = "task_start_unconfirmed"
	}
	return j, nil
}
func (a *App) cancelJob(ctx context.Context, id string) error {
	j, e := a.readJob(id)
	if e != nil {
		return e
	}
	if j.Status == "finished" {
		return nil
	}
	return a.stopRecord(ctx, j.Process)
}
func (a *App) stopOtherJobs(ctx context.Context) error {
	entries, e := os.ReadDir(a.data() + "/jobs")
	if e != nil {
		return e
	}
	for _, entry := range entries {
		if !strings.HasSuffix(entry.Name(), ".json") || entry.Name() == currentJobID+".json" {
			continue
		}
		var j Job
		if e = readJSON(a.data()+"/jobs/"+entry.Name(), &j); e != nil {
			return fail("task_record_invalid")
		}
		if j.Status == "finished" {
			continue
		}
		if e = a.stopRecord(ctx, j.Process); e != nil {
			return e
		}
		if e = secureRemove(a.data() + "/jobs/" + j.ID + ".request"); e != nil {
			return e
		}
	}
	return nil
}
func (a *App) status(ctx context.Context) (map[string]any, error) {
	s, e := a.readSettings()
	if e != nil {
		return nil, e
	}
	_, pinned, _ := validateURL(s.URL)
	keySet := false
	if s.Generation != "" && !s.Deleted {
		_, e = a.identity(s)
		keySet = e == nil
	}
	fp, ferr := a.fingerprint(ctx)
	jobs := []Job{}
	entries, _ := os.ReadDir(a.data() + "/jobs")
	for i := len(entries) - 1; i >= 0; i-- {
		name := entries[i].Name()
		if strings.HasSuffix(name, ".json") {
			j, e := a.readJob(strings.TrimSuffix(name, ".json"))
			if e == nil {
				jobs = append(jobs, j)
			}
		}
	}
	sort.Slice(jobs, func(i, j int) bool { return jobs[i].StartedAt.After(jobs[j].StartedAt) })
	if len(jobs) > 20 {
		jobs = jobs[:20]
	}
	state, stateErr := a.readStateChecked()
	live, liveErr := a.readYAML(ctx, a.cfg())
	source, sourceErr := readFile(a.source(), 4096)
	gistActive := liveErr == nil && sourceErr == nil && strings.TrimSpace(string(source)) == "KANO_CONFIG_SOURCE=uploaded_config" &&
		(live[gistMeta] == true || (stateErr == nil && ferr == nil && state.Applied.Config != "" && state.Applied.Config == fp.Config))
	age, e := run(ctx, 4*time.Second, nil, filepath.Join(a.Root, "Tools/age"), "--version")
	return map[string]any{"ok": true, "manualSources": 1, "gistActive": gistActive, "version": version, "protocol": 1, "settings": s, "identitySet": keySet, "pinnedURL": pinned, "schedulerRunning": a.daemonAlive(), "state": state, "stateError": code(stateErr), "currentFingerprint": fp, "fingerprintError": code(ferr), "activationPending": exists(a.journalDir()), "ageReady": e == nil && strings.TrimSpace(string(age)) != "", "jobs": jobs}, nil
}
