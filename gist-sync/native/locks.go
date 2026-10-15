// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type fileLock struct{ f *os.File }

func lockFile(path string) (*fileLock, error) {
	if e := noLinks(path); e != nil {
		return nil, e
	}
	f, e := os.OpenFile(path, os.O_CREATE|os.O_RDWR|syscall.O_NOFOLLOW, 0600)
	if e != nil {
		return nil, e
	}
	if e = syscall.Flock(int(f.Fd()), syscall.LOCK_EX|syscall.LOCK_NB); e != nil {
		f.Close()
		return nil, fail("busy")
	}
	return &fileLock{f}, nil
}
func (l *fileLock) Close() { syscall.Flock(int(l.f.Fd()), syscall.LOCK_UN); l.f.Close() }

type processRecord struct {
	PID   int    `json:"pid"`
	Start string `json:"start"`
	Boot  string `json:"boot"`
	Tag   string `json:"tag,omitempty"`
}

func selfRecord() processRecord {
	s, e := processStart(os.Getpid())
	if e != nil {
		panic("process_identity_unknown")
	}
	return processRecord{PID: os.Getpid(), Start: s, Boot: bootID()}
}
func (r processRecord) Alive() bool { return r.Boot == bootID() && alive(r.PID, r.Start) }

// An unreadable procfs record is not proof of exit.
func (r processRecord) KnownDead() bool {
	currentBoot := bootID()
	if r.PID < 1 || r.Start == "" || r.Boot == "" || r.Boot == "unknown" || currentBoot == "unknown" {
		return false
	}
	if r.Boot != currentBoot {
		return true
	}
	start, err := processStart(r.PID)
	if err == nil {
		return start != r.Start
	}
	return os.IsNotExist(err) || code(err) == "process_dead"
}

type Lease struct {
	app      *App
	Tag      string
	Owned    bool
	Recovery bool
	record   processRecord
}

func (a *App) operationLock() string { return filepath.Join(a.Dev, "kano_tproxy_operation.lock") }
func (a *App) recoveryLock() string  { return filepath.Join(a.Dev, "kano_tproxy_recovery.lock") }
func (a *App) withRecovery(ctx context.Context, fn func() error) (err error) {
	path := a.recoveryLock()
	if e := noLinks(path); e != nil {
		return e
	}
	r := selfRecord()
	deadline := time.Now().Add(2 * time.Second)
	for {
		e := os.Mkdir(path, 0700)
		if e == nil {
			break
		}
		if !os.IsExist(e) {
			return e
		}
		if time.Now().After(deadline) {
			return fail("recovery_busy")
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(50 * time.Millisecond):
		}
	}
	owner := fmt.Sprintf("%d %s\n", r.PID, r.Start)
	if e := os.WriteFile(path+"/owner", []byte(owner), 0600); e != nil {
		os.Remove(path)
		return e
	}
	defer func() {
		b, e := os.ReadFile(path + "/owner")
		if e != nil || string(b) != owner {
			err = fail("recovery_lock_owner_changed")
			return
		}
		if e = os.Remove(path + "/owner"); e == nil {
			e = os.Remove(path)
		}
		if e != nil {
			err = fail("recovery_lock_cleanup_failed")
		}
	}()
	return fn()
}
func (a *App) acquireLease(ctx context.Context, borrow bool) (*Lease, error) {
	if e := privateDir(a.runtime() + "/leases"); e != nil {
		return nil, e
	}
	r := selfRecord()
	r.Tag = "mm_service_" + strconv.Itoa(r.PID)
	l := &Lease{app: a, Tag: r.Tag, Owned: true, record: r}
	err := a.withRecovery(ctx, func() error {
		if exists(filepath.Dir(a.Root) + "/clash.install.lock.d") {
			return fail("installation_busy")
		}
		path := a.operationLock()
		if e := noLinks(path); e != nil {
			return e
		}
		if exists(path) {
			b, e := readFile(path+"/owner", 512)
			if e != nil {
				return fail("operation_busy")
			}
			owner := strings.TrimSpace(string(b))
			if borrow && owner != "" && owner == os.Getenv("KANO_TPROXY_TASK") && !exists(path+"/cancelled") {
				l.Tag = owner
				l.Owned = false
				return nil
			}
			if e := a.reclaimOwnLease(owner); e != nil {
				return e
			}
		}
		if e := writeJSON(a.runtime()+"/leases/"+l.Tag+".json", r); e != nil {
			return e
		}
		if e := os.Mkdir(path, 0700); e != nil {
			return fail("operation_busy")
		}
		if e := os.WriteFile(path+"/owner", []byte(l.Tag+"\n"), 0600); e != nil {
			os.Remove(path)
			return e
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return l, nil
}
func (a *App) reclaimOwnLease(owner string) error {
	if !strings.HasPrefix(owner, "mm_service_") {
		return fail("operation_busy")
	}
	pid, e := strconv.Atoi(strings.TrimPrefix(owner, "mm_service_"))
	if e != nil || pid < 1 {
		return fail("operation_busy")
	}
	var r processRecord
	if e = readJSON(a.runtime()+"/leases/"+owner+".json", &r); e != nil || r.Tag != owner || r.PID != pid || !r.KnownDead() {
		return fail("operation_busy")
	}
	entries, e := os.ReadDir(a.operationLock())
	if e != nil {
		return e
	}
	for _, p := range entries {
		if p.Name() != "owner" {
			return fail("operation_recovery_required")
		}
	}
	tasks, e := os.ReadDir(filepath.Join(a.Dev, "kano_tproxy_tasks"))
	if e != nil && !os.IsNotExist(e) {
		return e
	}
	if len(tasks) > 0 {
		return fail("operation_recovery_required")
	}
	// A dead manager is not proof that its children stopped.
	dirs, e := os.ReadDir("/proc")
	if e != nil {
		return fail("process_table_unreadable")
	}
	for _, p := range dirs {
		pid, e := strconv.Atoi(p.Name())
		if e != nil || pid == os.Getpid() {
			continue
		}
		comm, ce := os.ReadFile(fmt.Sprintf("/proc/%d/comm", pid))
		if ce != nil {
			if os.IsNotExist(ce) {
				continue
			}
			return fail("process_identity_unknown")
		}
		exe, _ := os.Readlink(fmt.Sprintf("/proc/%d/exe", pid))
		if !possiblyOwnedWorker(a.Root, exe, strings.TrimSpace(string(comm))) {
			continue
		}
		if _, e = processStart(pid); e != nil {
			if os.IsNotExist(e) || code(e) == "process_dead" {
				continue
			}
			return fail("process_identity_unknown")
		}
		env, e := os.ReadFile(fmt.Sprintf("/proc/%d/environ", pid))
		if e != nil {
			if os.IsNotExist(e) {
				continue
			}
			return fail("process_identity_unknown")
		}
		if !strings.Contains(string(env), "KANO_TPROXY_TASK="+owner+"\x00") {
			continue
		}
		if strings.TrimSuffix(exe, " (deleted)") == filepath.Join(a.Root, "Proxy/Clash.Core") {
			args, err := os.ReadFile(fmt.Sprintf("/proc/%d/cmdline", pid))
			if err != nil {
				return fail("process_identity_unknown")
			}
			if !coreIsTest(args) {
				continue
			}
		}
		return fail("operation_worker_remains")
	}
	if e = os.Remove(a.operationLock() + "/owner"); e != nil {
		return e
	}
	if e = os.Remove(a.operationLock()); e != nil {
		return e
	}
	return os.Remove(a.runtime() + "/leases/" + owner + ".json")
}
func (l *Lease) Check() error {
	if l.Recovery {
		b, e := readFile(l.app.operationLock()+"/owner", 512)
		if e != nil || strings.TrimSpace(string(b)) != l.Tag || !exists(l.app.operationLock()+"/cancelled") || !exists(l.app.recoveryLock()+"/owner") {
			return fail("recovery_fence_changed")
		}
		return nil
	}

	p := l.app.operationLock()
	if e := noLinks(p); e != nil {
		return e
	}
	if exists(p + "/cancelled") {
		return fail("operation_cancelled_by_recovery")
	}
	b, e := readFile(p+"/owner", 512)
	if e != nil || strings.TrimSpace(string(b)) != l.Tag {
		return fail("operation_owner_changed")
	}
	if exists(filepath.Dir(l.app.Root) + "/clash.install.lock.d") {
		return fail("installation_busy")
	}
	return nil
}
func (l *Lease) Release() error {
	if !l.Owned {
		return l.Check()
	}
	return l.app.withRecovery(context.Background(), func() error {
		if e := l.Check(); e != nil {
			return e
		}
		tasks, e := os.ReadDir(filepath.Join(l.app.Dev, "kano_tproxy_tasks"))
		if e != nil && !os.IsNotExist(e) {
			return e
		}
		for _, p := range tasks {
			if strings.HasPrefix(p.Name(), l.Tag+".") {
				return fail("operation_worker_remains")
			}
		}
		entries, e := os.ReadDir(l.app.operationLock())
		if e != nil {
			return e
		}
		for _, p := range entries {
			if p.Name() != "owner" {
				return fail("operation_lock_unknown_file")
			}
		}
		if e = os.Remove(l.app.operationLock() + "/owner"); e != nil {
			return e
		}
		if e = os.Remove(l.app.operationLock()); e != nil {
			return e
		}
		if e = os.Remove(l.app.runtime() + "/leases/" + l.Tag + ".json"); e != nil && !os.IsNotExist(e) {
			return e
		}
		return nil
	})
}
func (l *Lease) Env(tx string) []string {
	return []string{"KANO_TPROXY_TASK=" + l.Tag, "F50_SERVICE_LEASED=1", "CLASH_ROOT=" + l.app.Root, "F50_ROOT=" + l.app.Root, "KANO_GIST_TRANSACTION=" + tx, "F50_OPERATION_LOCK=" + l.app.operationLock(), "F50_RECOVERY_LOCK=" + l.app.recoveryLock(), "F50_TASK_DIR=" + l.app.Dev + "/kano_tproxy_tasks", fmt.Sprintf("F50_GIST_RECOVERY=%d", map[bool]int{false: 0, true: 1}[l.Recovery])}
}

func coreIsTest(cmdline []byte) bool {
	for _, arg := range strings.Split(string(cmdline), "\x00") {
		if arg == "-t" || arg == "--test" {
			return true
		}
	}
	return false
}

func possiblyOwnedWorker(root, exe, comm string) bool {
	if strings.HasPrefix(strings.TrimSuffix(exe, " (deleted)"), root+"/") {
		return true
	}
	switch comm {
	case "sh", "bash", "dash", "mksh", "busybox", "toybox", "timeout", "curl", "wget", "age", "Clash.Core", "kano-gist-sync", "yq_linux_arm64":
		return true
	}
	return false
}
