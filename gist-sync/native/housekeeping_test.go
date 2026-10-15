package main

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestDeadPrivateWorkCleanup(t *testing.T) {
	a := fixture(t)
	p, e := a.newWork("live-")
	if e != nil {
		t.Fatal(e)
	}
	if e = a.reapPrivateWork(); e != nil {
		t.Fatal(e)
	}
	if !exists(p) {
		t.Fatal("active work removed")
	}
	r := selfRecord()
	r.Boot = "prior-boot"
	writeJSON(p+"/.owner.json", r)
	atomicWrite(p+"/identity.txt", []byte("sensitive"), 0600)
	if e = a.reapPrivateWork(); e != nil {
		t.Fatal(e)
	}
	if exists(p) {
		t.Fatal("dead work retained")
	}
}
func TestCompletedBackupIdentityDeletion(t *testing.T) {
	a := fixture(t)
	p := a.Root + ".rollback.install.test"
	os.MkdirAll(p+"/Tools/gist-sync", 0700)
	os.WriteFile(p+"/.f50-install-receipt", []byte("complete"), 0600)
	os.WriteFile(p+"/Tools/gist-sync/identity.txt", []byte("secret"), 0600)
	if e := a.clearRetainedIdentities(); e != nil {
		t.Fatal(e)
	}
	if exists(p + "/Tools/gist-sync") {
		t.Fatal("backup identity retained")
	}
	if !exists(p + "/.f50-install-receipt") {
		t.Fatal("unrelated backup removed")
	}
}
func TestStaleRequestRetentionBound(t *testing.T) {
	a := fixture(t)
	id := nonce()
	r := selfRecord()
	r.Boot = "prior-boot"
	writeJSON(a.jobPath(id), Job{ID: id, Process: r, Status: "running", StartedAt: time.Now().Add(-48 * time.Hour)})
	os.WriteFile(filepath.Join(a.data(), "jobs", id+".request"), []byte("secret"), 0600)
	if e := a.reapPrivateWork(); e != nil {
		t.Fatal(e)
	}
	if exists(filepath.Join(a.data(), "jobs", id+".request")) {
		t.Fatal("stale request retained")
	}
}
func TestStatusReportsInvalidSyncState(t *testing.T) {
	a := fixture(t)
	os.WriteFile(a.data()+"/state.json", []byte("invalid"), 0600)
	s, e := a.status(context.Background())
	if e != nil {
		t.Fatal(e)
	}
	if s["stateError"] != "sync_state_unreadable" {
		t.Fatal(s)
	}
}

func TestUnknownWorkRetainedForReview(t *testing.T) {
	a := fixture(t)
	id := nonce()
	writeJSON(a.jobPath(id), Job{ID: id, Status: "queued", StartedAt: time.Now().Add(-48 * time.Hour)})
	path := filepath.Join(a.data(), "jobs", id+".request")
	os.WriteFile(path, []byte("private"), 0600)
	if e := a.reapPrivateWork(); e != nil {
		t.Fatal(e)
	}
	if !exists(path) {
		t.Fatal("unknown process request removed without exit proof")
	}
}
