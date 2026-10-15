// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
)

func (a *App) editBoot(enable bool) (err error) {
	lock := filepath.Join(a.Dev, "kano_boot_write.lock")
	if e := noLinks(lock); e != nil {
		return e
	}
	if e := os.Mkdir(lock, 0700); e != nil {
		return fail("boot_write_busy")
	}
	pid := strconv.Itoa(os.Getpid()) + "\n"
	if e := os.WriteFile(lock+"/pid", []byte(pid), 0600); e != nil {
		os.Remove(lock)
		return e
	}
	defer func() {
		b, e := os.ReadFile(lock + "/pid")
		if e != nil || string(b) != pid {
			err = fail("boot_lock_owner_changed")
			return
		}
		if e = os.Remove(lock + "/pid"); e == nil {
			e = os.Remove(lock)
		}
		if e != nil {
			err = fail("boot_lock_cleanup_failed")
		}
	}()
	// /sdcard is an Android-managed symlink; resolve this public script's parent only.
	parent, e := filepath.EvalSymlinks(filepath.Dir(a.Boot))
	if e != nil {
		return fail("boot_directory_unavailable")
	}
	path := filepath.Join(parent, filepath.Base(a.Boot))
	if e = noLinks(path); e != nil {
		return e
	}
	b, e := readFile(path, 2<<20)
	if e != nil && !os.IsNotExist(e) {
		return e
	}
	begin := "# KANO_GIST_SYNC_BEGIN"
	end := "# KANO_GIST_SYNC_END"
	lines := []string{}
	inside := false
	blocks := 0
	for _, line := range strings.Split(strings.ReplaceAll(string(b), "\r\n", "\n"), "\n") {
		if line == begin {
			if inside {
				return fail("boot_block_invalid")
			}
			inside = true
			blocks++
			continue
		}
		if line == end {
			if !inside {
				return fail("boot_block_invalid")
			}
			inside = false
			continue
		}
		if !inside {
			lines = append(lines, line)
		}
	}
	if inside || blocks > 1 {
		return fail("boot_block_invalid")
	}
	text := strings.TrimRight(strings.Join(lines, "\n"), "\n") + "\n"
	if enable {
		hook := begin + "\n[ ! -x /data/clash/Scripts/Clash.GistSync ] || sh /data/clash/Scripts/Clash.GistSync boot </dev/null >/dev/null 2>&1\n" + end + "\n"
		if strings.HasPrefix(text, "#!") {
			i := strings.Index(text, "\n") + 1
			text = text[:i] + hook + text[i:]
		} else {
			text = hook + text
		}
	}
	tmp := path + ".gist." + nonce()
	defer os.Remove(tmp)
	if e = atomicWrite(tmp, []byte(text), 0644); e != nil {
		return e
	}
	if _, e = run(context.Background(), 5*time.Second, nil, "sh", "-n", tmp); e != nil {
		return fail("boot_script_invalid")
	}
	if e = os.Rename(tmp, path); e != nil {
		return e
	}
	// Android emulated storage may not implement directory fsync; do not imply crash durability.
	if e = dirSync(parent); e != nil {
		return fail("boot_saved_durability_unconfirmed")
	}
	return nil
}
func (a *App) spawn(args ...string) error {
	binary := filepath.Join(a.Root, "Tools/kano-gist-sync")
	if e := noLinks(binary); e != nil {
		return e
	}
	f, e := os.OpenFile(os.DevNull, os.O_RDWR, 0)
	if e != nil {
		return e
	}
	defer f.Close()
	cmd := exec.Command(binary, args...)
	cmd.Stdin = f
	cmd.Stdout = f
	cmd.Stderr = f
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
	for _, v := range os.Environ() {
		if !strings.HasPrefix(v, "KANO_TPROXY_TASK=") && !strings.HasPrefix(v, "F50_SERVICE_LEASED=") && !strings.HasPrefix(v, "KANO_GIST_TRANSACTION=") {
			cmd.Env = append(cmd.Env, v)
		}
	}
	if e = cmd.Start(); e != nil {
		return e
	}
	return cmd.Process.Release()
}
func (a *App) daemonAlive() bool {
	var r processRecord
	return readJSON(a.runtime()+"/daemon.json", &r) == nil && r.Alive()
}
func (a *App) startDaemon(ctx context.Context) error {
	s, e := a.readSettings()
	if e != nil {
		return e
	}
	if !s.Auto || s.Deleted || s.Generation == "" {
		return nil
	}
	if a.daemonAlive() {
		return nil
	}
	if e = a.spawn("daemon"); e != nil {
		return fail("scheduler_start_failed")
	}
	for i := 0; i < 40; i++ {
		if a.daemonAlive() {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(50 * time.Millisecond):
		}
	}
	return fail("scheduler_start_unconfirmed")
}
func (a *App) stopRecord(ctx context.Context, r processRecord) error {
	if r.PID == os.Getpid() || r.KnownDead() {
		return nil
	}
	if !r.Alive() {
		return fail("process_identity_unknown")
	}
	exe, e := os.Readlink(fmt.Sprintf("/proc/%d/exe", r.PID))
	if e != nil || strings.TrimSuffix(exe, " (deleted)") != filepath.Join(a.Root, "Tools/kano-gist-sync") {
		return fail("process_owner_unconfirmed")
	}
	if e = syscall.Kill(r.PID, syscall.SIGTERM); e != nil && e != syscall.ESRCH {
		return e
	}
	for i := 0; i < 100; i++ {
		if r.KnownDead() {
			return nil
		}
		if !r.Alive() {
			return fail("process_identity_unknown")
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(100 * time.Millisecond):
		}
	}
	return fail("task_cancel_pending")
}
func (a *App) stopDaemon(ctx context.Context) error {
	var r processRecord
	e := readJSON(a.runtime()+"/daemon.json", &r)
	if os.IsNotExist(e) {
		return nil
	}
	if e != nil {
		return fail("scheduler_record_invalid")
	}
	return a.stopRecord(ctx, r)
}
func nextDue(s Settings, st State, now time.Time) time.Time {
	due := s.SavedAt.Add(time.Duration(s.IntervalHours) * time.Hour)
	if st.Generation == s.Generation && st.LastChecked.After(s.SavedAt) {
		d := time.Duration(s.IntervalHours) * time.Hour
		switch st.Last.Code {
		case "dns_failed", "download_timeout", "download_transport_failed", "network_error", "download_failed", "download_incomplete", "timeout", "http_429", "http_500", "http_502", "http_503", "http_504", "operation_busy", "busy", "auto_paused_core_stopped":
			d = 5 * time.Minute
		}
		due = st.LastChecked.Add(d)
	}
	if due.After(now.Add(24 * time.Hour)) {
		return now.Add(time.Duration(s.IntervalHours) * time.Hour)
	}
	return due
}
func (a *App) daemon(ctx context.Context) error {
	lock, e := lockFile(a.runtime() + "/daemon.lock")
	if e != nil {
		return e
	}
	defer lock.Close()
	record := selfRecord()
	if e = writeJSON(a.runtime()+"/daemon.json", record); e != nil {
		return e
	}
	defer func() {
		var r processRecord
		if readJSON(a.runtime()+"/daemon.json", &r) == nil && r == record {
			os.Remove(a.runtime() + "/daemon.json")
		}
	}()
	cooldown := time.Time{}
	for {
		s, e := a.readSettings()
		if e != nil {
			return e
		}
		if !s.Auto || s.Deleted || s.Generation == "" {
			return nil
		}
		if !time.Now().Before(cooldown) && !nextDue(s, a.readState(), time.Now()).After(time.Now()) {
			cooldown = time.Now().Add(5 * time.Minute)
			out, e := a.syncConfig(ctx, Request{}, true)
			if e != nil {
				out.OK = false
				if out.Code == "" {
					out.Code = code(e)
				}
			}
			out.CompletedAt = time.Now().UTC()
			if out.Generation == "" {
				out.Generation = s.Generation
			}
			_ = a.recordAttempt(s.Generation, out)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(5 * time.Second):
		}
	}
}
func (a *App) boot(ctx context.Context) error {
	if exists(a.journalDir()) {
		l, e := a.acquireLease(ctx, false)
		if e != nil {
			return e
		}
		pid, pe := a.corePID()
		if pe != nil {
			_ = l.Release()
			return pe
		}
		_, e = a.recoverActivation(ctx, l, pid == 0)
		re := l.Release()
		if e != nil {
			return e
		}
		if re != nil {
			return re
		}
	}
	return a.startDaemon(ctx)
}
