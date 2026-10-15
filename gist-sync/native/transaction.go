// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"context"
	"os"
	"strings"
	"time"
)

type Journal struct {
	Version       int         `json:"version"`
	ID            string      `json:"id"`
	Generation    string      `json:"generation"`
	Boot          string      `json:"boot"`
	Phase         string      `json:"phase"`
	HadSource     bool        `json:"hadSource"`
	Running       bool        `json:"running"`
	Before        Fingerprint `json:"before"`
	CandidateHash string      `json:"candidateHash"`
	Result        Outcome     `json:"result"`
}

func (a *App) journalDir() string { return a.data() + "/activation" }
func (a *App) journal() (Journal, error) {
	var j Journal
	if e := noLinks(a.journalDir()); e != nil {
		return j, e
	}
	if e := readJSON(a.journalDir()+"/journal.json", &j); e != nil {
		return j, fail("activation_journal_unreadable")
	}
	if j.Version != 1 || !idRE.MatchString(j.ID) || !idRE.MatchString(j.Generation) {
		return j, fail("activation_journal_invalid")
	}
	switch j.Phase {
	case "prepared", "written", "verified":
	default:
		return j, fail("activation_journal_invalid")
	}
	b, e := readFile(a.journalDir()+"/id", 64)
	if e != nil || strings.TrimSpace(string(b)) != j.ID {
		return j, fail("activation_journal_invalid")
	}
	return j, nil
}
func (a *App) writeJournal(j Journal) error { return writeJSON(a.journalDir()+"/journal.json", j) }
func (a *App) makeJournal(s Settings, before Fingerprint, hash string, running bool) (Journal, error) {
	j := Journal{Version: 1, ID: nonce(), Generation: s.Generation, Boot: bootID(), Phase: "prepared", Before: before, CandidateHash: hash, Running: running}
	tmp := a.data() + "/activation.new." + j.ID
	if exists(a.journalDir()) {
		return j, fail("config_transaction_pending")
	}
	if e := privateDir(tmp); e != nil {
		return j, e
	}
	defer secureRemove(tmp)
	if e := copyPrivate(a.cfg(), tmp+"/config.yaml"); e != nil {
		return j, e
	}
	if exists(a.source()) {
		j.HadSource = true
		if e := copyPrivate(a.source(), tmp+"/source.conf"); e != nil {
			return j, e
		}
	}
	if e := atomicWrite(tmp+"/id", []byte(j.ID+"\n"), 0600); e != nil {
		return j, e
	}
	if e := writeJSON(tmp+"/journal.json", j); e != nil {
		return j, e
	}
	if e := os.Rename(tmp, a.journalDir()); e != nil {
		return j, e
	}
	return j, dirSync(a.data())
}
func (a *App) cleanJournal() error {
	if e := a.point("finalize"); e != nil {
		return e
	}
	done := a.data() + "/activation.done." + nonce()
	if e := os.Rename(a.journalDir(), done); e != nil {
		return e
	}
	if e := dirSync(a.data()); e != nil {
		return e
	}
	if e := secureRemove(done); e != nil {
		return fail("completed_journal_cleanup_failed")
	}
	return dirSync(a.data())
}
func (a *App) rollback(ctx context.Context, l *Lease, j Journal, stopped bool) error {
	if e := l.Check(); e != nil {
		return e
	}
	if e := a.recoverGeneric(ctx, l); e != nil {
		return e
	}
	current, e := a.fingerprint(ctx)
	if e != nil {
		return e
	}
	if current.Config != j.Before.Config && current.Config != j.CandidateHash {
		return fail("rollback_external_config_conflict")
	}
	if current.Policy != j.Before.Policy {
		return fail("rollback_policy_conflict")
	}
	stage := a.journalDir() + "/restore.yaml"
	if e := copyPrivate(a.journalDir()+"/config.yaml", stage); e != nil {
		return e
	}
	if e := a.testCore(ctx, stage); e != nil {
		return fail("rollback_config_invalid")
	}
	source := ""
	if j.HadSource {
		source = a.journalDir() + "/source.conf"
	}
	if e := a.commitPair(ctx, l, stage, source, !j.HadSource, false, false, j.ID); e != nil {
		return fail("rollback_write_failed")
	}
	restored, e := a.fingerprint(ctx)
	if e != nil || restored != j.Before {
		return fail("rollback_verification_failed")
	}
	if j.Running && !stopped {
		m, e := a.readYAML(ctx, a.cfg())
		if e != nil {
			return e
		}
		pid, e := a.corePID()
		if e != nil {
			return e
		}
		if pid == 0 {
			if e = a.service(ctx, l, j.ID, "start"); e != nil {
				return fail("rollback_start_failed")
			}
		}
		if e = a.applyRuntime(ctx, l, j.ID, m); e != nil {
			return fail("rollback_runtime_unverified")
		}
	}
	return a.cleanJournal()
}
func (a *App) recoverActivation(ctx context.Context, l *Lease, stopped bool) (Outcome, error) {
	var out Outcome
	if !exists(a.journalDir()) {
		out.OK = true
		out.Code = "no_transaction_pending"
		return out, nil
	}
	j, e := a.journal()
	if e != nil {
		return out, e
	}
	if e = a.recoverGeneric(ctx, l); e != nil {
		return out, e
	}
	if j.Phase == "verified" {
		fp, e := a.fingerprint(ctx)
		if e != nil {
			return out, e
		}
		if fp != j.Result.Applied {
			return j.Result, fail("committed_config_changed")
		}
		// A verified marker survives status/receipt loss. Do not reload or undo it.
		out = j.Result
		if e = a.finishState(out); e != nil {
			out.OK = false
			out.Code = "committed_pending_finalize"
			return out, e
		}
		if e = a.cleanJournal(); e != nil {
			out.OK = false
			out.Code = "committed_pending_finalize"
			return out, e
		}
		out.Code = "commit_finalized"
		return out, nil
	}
	if e = a.rollback(ctx, l, j, stopped); e != nil {
		return out, e
	}
	out.OK = true
	out.Code = "interrupted_transaction_restored"
	out.Generation = j.Generation
	return out, nil
}
func (a *App) syncConfig(ctx context.Context, req Request, automatic bool) (out Outcome, err error) {
	// A lost success receipt is reconciled before another download or configuration write.
	if exists(a.journalDir()) {
		l, e := a.acquireLease(ctx, false)
		if e != nil {
			return out, e
		}
		sl, e := lockFile(a.runtime() + "/settings.lock")
		if e != nil {
			_ = l.Release()
			return out, e
		}
		out, e = a.recoverActivation(ctx, l, false)
		sl.Close()
		re := l.Release()
		if re != nil {
			return out, re
		}
		if e != nil || out.Code == "commit_finalized" {
			return out, e
		}
	}
	s, key, e := a.snapshot()
	if e != nil {
		return out, e
	}
	if s.Generation == "" || s.Deleted {
		return out, fail("not_configured")
	}
	if req.Revision != nil && *req.Revision != s.Revision {
		return out, fail("settings_changed")
	}
	out.Generation = s.Generation
	if automatic && !s.Auto {
		return out, fail("auto_disabled")
	}
	defer func() {
		out.CompletedAt = time.Now().UTC()
		if err != nil && out.Code == "" {
			out.Code = code(err)
		}
		if !out.OK || out.Code == "up_to_date" {
			_ = a.recordAttempt(s.Generation, out)
		}
	}()
	if e = a.space(); e != nil {
		return out, e
	}
	work, e := a.newWork("sync-")
	if e != nil {
		return out, e
	}
	defer func() {
		if e := secureRemove(work); e != nil {
			out.Warning = "private_work_cleanup_failed"
			out.OK = false
			if err == nil {
				err = e
			}
		}
	}()
	cipher, e := a.download(ctx, s.URL)
	if e != nil {
		return out, e
	}
	out.Downloaded = true
	out.CipherHash = hashBytes(cipher)
	if e = a.point("download_complete"); e != nil {
		return out, e
	}
	plain, e := a.decrypt(ctx, cipher, key, work)
	key = ""
	if e != nil {
		return out, e
	}
	out.Decrypted = true
	if e = a.point("decrypt_complete"); e != nil {
		return out, e
	}
	if e = a.point("after_download"); e != nil {
		return out, e
	}
	l, e := a.acquireLease(ctx, false)
	if e != nil {
		return out, e
	}
	defer func() {
		if e := l.Release(); e != nil {
			out.OK = false
			out.Warning = "lease_cleanup_unverified"
			if err == nil {
				err = e
			}
		}
	}()
	sl, e := lockFile(a.runtime() + "/settings.lock")
	if e != nil {
		return out, e
	}
	defer sl.Close()
	active, e := a.readSettings()
	if e != nil {
		return out, e
	}
	if active.Generation != s.Generation || active.Deleted {
		return out, fail("source_changed")
	}
	if req.Revision != nil && *req.Revision != active.Revision {
		return out, fail("settings_changed")
	}
	if automatic && !active.Auto {
		return out, fail("auto_disabled")
	}
	if exists(a.journalDir()) {
		return out, fail("config_transaction_pending")
	}
	if exists(a.cfg()+".kano_tx") || exists(a.Root+"/Tools/template.yaml.kano_tx") || exists(a.Root+"/Tools/template.base.yaml.kano_tx") {
		return out, fail("config_transaction_pending")
	}
	pid, e := a.corePID()
	if e != nil {
		return out, e
	}
	if automatic && (pid == 0 || exists(a.Root+"/Policy/stopped")) {
		return out, fail("auto_paused_core_stopped")
	}
	before, e := a.fingerprint(ctx)
	if e != nil {
		return out, e
	}
	state, e := a.readStateChecked()
	if e != nil {
		return out, e
	}
	baseline := s.Baseline
	if state.Generation == s.Generation && state.Applied.Config != "" {
		baseline = state.Applied
	}
	out.Applied = before
	if before != baseline {
		if automatic || !req.ReplaceLocal || req.ExpectedLocal == nil || *req.ExpectedLocal != before {
			return out, fail("local_config_conflict")
		}
	}
	if req.ManualSources != nil {
		if req.Revision == nil {
			return out, fail("settings_changed")
		}
		if e = a.saveManualSources(*req.ManualSources); e != nil {
			return out, e
		}
	}
	sourcesHash, e := fileHash(a.sourcesPath())
	if e != nil {
		return out, e
	}
	candidate, hash, e := a.candidate(ctx, plain, work)
	if e != nil {
		return out, e
	}
	out.Validated = true
	out.CandidateHash = hash
	after, e := a.fingerprint(ctx)
	if e != nil {
		return out, e
	}
	if after != before {
		return out, fail("local_config_changed")
	}
	if h, e := fileHash(a.sourcesPath()); e != nil || h != sourcesHash {
		return out, fail("manual_sources_changed")
	}
	source, _ := readFile(a.source(), 4096)
	if before.Config == hash && strings.TrimSpace(string(source)) == "KANO_CONFIG_SOURCE=uploaded_config" {
		if pid != 0 {
			m, e := a.readYAML(ctx, a.cfg())
			if e != nil {
				return out, e
			}
			if e = a.runtimeVerify(ctx, m); e != nil {
				return out, e
			}
			if e = a.service(ctx, l, "", "policy", "verify"); e != nil {
				return out, e
			}
			out.Loaded = true
			out.RuntimeVerified = true
		}
		out.OK = true
		out.Code = "up_to_date"
		out.CompletedAt = time.Now().UTC()
		if e = a.finishState(out); e != nil {
			out.OK = false
			return out, e
		}
		return out, nil
	}
	if e = l.Check(); e != nil {
		return out, e
	}
	j, e := a.makeJournal(s, before, hash, pid != 0)
	if e != nil {
		return out, e
	}
	committedVerified := false
	defer func() {
		if err == nil || committedVerified {
			return
		}
		// Cancellation by emergency recovery is a fence, not permission to restore network rules.
		if e := l.Check(); e != nil {
			out.Warning = "recovery_required"
			return
		}
		rctx, cancel := context.WithTimeout(context.Background(), 150*time.Second)
		defer cancel()
		if e := a.rollback(rctx, l, j, false); e != nil {
			out.Warning = code(e)
		} else {
			out.Warning = "old_config_restored"
		}
	}()
	if e = a.point("before_commit"); e != nil {
		return out, e
	}
	if h, e := fileHash(a.sourcesPath()); e != nil || h != sourcesHash {
		return out, fail("manual_sources_changed")
	}
	if e = a.commitPair(ctx, l, candidate, "", false, true, true, j.ID); e != nil {
		return out, e
	}
	out.Written = true
	j.Phase = "written"
	if e = a.writeJournal(j); e != nil {
		return out, e
	}
	if e = a.point("after_commit"); e != nil {
		return out, e
	}
	m, e := a.readYAML(ctx, a.cfg())
	if e != nil {
		return out, e
	}
	if canonical(m) != hash {
		return out, fail("committed_candidate_mismatch")
	}
	if pid != 0 {
		if e = a.applyRuntime(ctx, l, j.ID, m); e != nil {
			return out, e
		}
		out.Loaded = true
		out.RuntimeVerified = true
	}
	if e = l.Check(); e != nil {
		return out, e
	}
	out.Applied, e = a.fingerprint(ctx)
	if e != nil {
		return out, e
	}
	if out.Applied.Config != hash || out.Applied.Policy != before.Policy {
		return out, fail("runtime_changed_candidate")
	}
	out.OK = true
	out.Code = "synced"
	if pid == 0 {
		out.Code = "saved_stopped"
	}
	out.CompletedAt = time.Now().UTC()
	j.Phase = "verified"
	j.Result = out
	if e = a.writeJournal(j); e != nil {
		// A rename may have committed even when directory fsync reports failure.
		read, re := a.journal()
		if re == nil && read.Phase == "verified" {
			committedVerified = true
			out.Code = "committed_pending_finalize"
			out.OK = false
		}
		return out, e
	}
	committedVerified = true
	if e = a.point("before_state_record"); e != nil {
		out.OK = false
		out.Code = "committed_pending_finalize"
		return out, e
	}
	if e = a.finishState(out); e != nil {
		out.OK = false
		out.Code = "committed_pending_finalize"
		return out, e
	}
	if e = a.cleanJournal(); e != nil {
		out.OK = false
		out.Code = "committed_pending_finalize"
		return out, e
	}
	return out, nil
}
