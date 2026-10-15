package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

const fixtureKey = "AGE-SECRET-KEY-1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const otherKey = "AGE-SECRET-KEY-1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"

func mustWrite(t *testing.T, p string, b []byte, mode os.FileMode) {
	t.Helper()
	if e := os.WriteFile(p, b, mode); e != nil {
		t.Fatal(e)
	}
}
func copyFixture(t *testing.T, src, dst string) {
	t.Helper()
	b, e := os.ReadFile(src)
	if e != nil {
		t.Fatal(e)
	}
	mustWrite(t, dst, b, 0755)
}
func simulatedCipher(key string, plain []byte) []byte {
	return []byte("SIM-AGE-TEST-ONLY\n" + hashBytes([]byte(key)) + "\n" + hashBytes(plain) + "\n" + string(plain))
}
func fixture(t *testing.T) *App {
	t.Helper()
	base := t.TempDir()
	a := &App{Root: base + "/clash", Dev: base + "/dev", Boot: base + "/public/ufi_tools_boot.sh", Upload: base + "/uploads"}
	for _, p := range []string{a.Root + "/Proxy", a.Root + "/Tools", a.Root + "/Scripts", a.Root + "/Policy", a.Dev, filepath.Dir(a.Boot), a.Upload} {
		if e := os.MkdirAll(p, 0700); e != nil {
			t.Fatal(e)
		}
	}
	if e := a.init(); e != nil {
		t.Fatal(e)
	}
	copyFixture(t, "../../tests/gist-sync/mock-yq.py", a.Root+"/Tools/yq_linux_arm64")
	copyFixture(t, "../../tests/gist-sync/mock-age.py", a.Root+"/Tools/age")
	copyFixture(t, "../../build/gist-sync/clash/Scripts/Clash.ConfigCommit", a.scripts("Clash.ConfigCommit"))
	mustWrite(t, a.Root+"/Proxy/Clash.Core", []byte("#!/bin/sh\ncase \"$1\" in -v) echo 'Mihomo Meta v1.19.31'; exit 0;; esac\nfile=; while [ $# -gt 0 ]; do if [ \"$1\" = -f ]; then shift; file=$1; fi; shift; done\n! grep -q TEST_CORE_INVALID \"$file\"\n"), 0755)
	mustWrite(t, a.scripts("Clash.Service"), []byte("#!/bin/sh\necho POLICY_APPLY_OK\necho START_STATE=started_verified_process\n"), 0755)
	mustWrite(t, a.Boot, []byte("#!/bin/sh\necho preserve_other_app\n"), 0644)
	mustWrite(t, a.Root+"/Policy/options.conf", []byte("traffic_mode=tproxy\nipv6=off\n"), 0600)
	m, e := normalizeConfig(map[string]any{}, map[string]string{"traffic_mode": "tproxy"}, nil)
	if e != nil {
		t.Fatal(e)
	}
	m["secret"] = "local-protected-secret"
	mustWrite(t, a.cfg(), jsonBytes(m), 0600)
	mustWrite(t, a.source(), []byte("KANO_CONFIG_SOURCE=template.yaml\n"), 0600)
	return a
}
func remoteConfig(n int) []byte {
	return jsonBytes(map[string]any{"secret": "DO_NOT_IMPORT_THIS_SECRET", "external-controller": "127.0.0.1:9999", "tproxy-port": 7777, "tun": map[string]any{"enable": true, "auto-route": true}, "proxies": []any{map[string]any{"name": fmt.Sprintf("node%d", n), "type": "ss", "server": "example.test", "port": 443, "cipher": "aes-128-gcm", "password": "fixture"}}, "rules": []any{"MATCH,DIRECT"}, "x-fixture": n})
}
func setRemote(a *App, key string, plain []byte) {
	a.HTTPClient = doFunc(func(*http.Request) (*http.Response, error) {
		return response(200, string(simulatedCipher(key, plain))), nil
	})
}
func saveFixture(t *testing.T, a *App) {
	t.Helper()
	setRemote(a, fixtureKey, remoteConfig(1))
	out, e := a.validateSave(context.Background(), Request{URL: goodURL, Identity: fixtureKey}, true)
	if e != nil || !out.Saved || !out.OK {
		t.Fatalf("save: %+v %v", out, e)
	}
}
func TestManualWorkflow(t *testing.T) {
	a := fixture(t)
	setRemote(a, fixtureKey, remoteConfig(1))
	ctx := context.Background()
	before, _ := fileHash(a.cfg())
	source, _ := fileHash(a.source())
	out, e := a.validateSave(ctx, Request{URL: goodURL, Identity: fixtureKey}, false)
	if e != nil || !out.OK || out.Written {
		t.Fatal(out, e)
	}
	if exists(a.settingsPath()) {
		t.Fatal("test saved settings")
	}
	after, _ := fileHash(a.cfg())
	if before != after {
		t.Fatal("test changed runtime config")
	}
	out, e = a.validateSave(ctx, Request{URL: goodURL, Identity: fixtureKey}, true)
	if e != nil || !out.Saved {
		t.Fatal(out, e)
	}
	after, _ = fileHash(a.cfg())
	afterSource, _ := fileHash(a.source())
	if before != after || source != afterSource {
		t.Fatal("save applied config")
	}
	s, e := a.readSettings()
	if e != nil || s.Auto || s.IntervalHours != 6 {
		t.Fatal(s, e)
	}
	st, e := os.Stat(a.data() + "/sources/" + s.Generation + "/identity.txt")
	if e != nil || st.Mode().Perm() != 0600 {
		t.Fatal("identity permission", e)
	}
	out, e = a.syncConfig(ctx, Request{}, false)
	if e != nil || !out.OK || !out.Written || out.Loaded || out.Code != "saved_stopped" {
		t.Fatal(out, e)
	}
	live, e := a.readYAML(ctx, a.cfg())
	if e != nil || live["secret"] != "local-protected-secret" || numeric(live["tproxy-port"]) != 7895 || str(live["external-controller"]) != "0.0.0.0:7788" {
		t.Fatal(live, e)
	}
	out, e = a.syncConfig(ctx, Request{}, false)
	if e != nil || !out.OK || out.Written || out.Code != "up_to_date" {
		t.Fatal(out, e)
	}
	if exists(a.journalDir()) || exists(a.cfg()+".kano_tx") || exists(a.operationLock()) {
		t.Fatal("transaction residue")
	}
	state := a.readState()
	if state.LastSuccess.IsZero() || state.CipherHash == "" || state.CandidateHash == "" {
		t.Fatal(state)
	}
}
func TestSourceAndIdentityChange(t *testing.T) {
	a := fixture(t)
	ctx := context.Background()
	saveFixture(t, a)
	old, _ := a.readSettings()
	newURL := strings.Replace(goodURL, "Bettbox.yaml.age", "other.age", 1)
	setRemote(a, fixtureKey, []byte("not a YAML mapping"))
	out, e := a.validateSave(ctx, Request{URL: newURL}, true)
	if e == nil || out.Saved {
		t.Fatal(out, e)
	}
	current, _ := a.readSettings()
	if current != old {
		t.Fatal("bad source replaced settings")
	}
	setRemote(a, fixtureKey, remoteConfig(2))
	out, e = a.validateSave(ctx, Request{URL: newURL}, true)
	if e != nil || !out.Saved {
		t.Fatal(out, e)
	}
	current, _ = a.readSettings()
	key, _ := a.identity(current)
	if current.Generation == old.Generation || key != fixtureKey || current.Auto != old.Auto || current.IntervalHours != old.IntervalHours {
		t.Fatal("source fields not preserved")
	}
	if exists(a.data() + "/sources/" + old.Generation) {
		t.Fatal("old identity retained")
	}
	generation := current.Generation
	setRemote(a, otherKey, remoteConfig(3))
	out, e = a.validateSave(ctx, Request{URL: newURL, Identity: otherKey}, true)
	if e != nil {
		t.Fatal(out, e)
	}
	current, _ = a.readSettings()
	if generation == current.Generation {
		t.Fatal("key change reused generation")
	}
	// Identical settings save preserves generation and does not fetch again.
	a.HTTPClient = doFunc(func(*http.Request) (*http.Response, error) {
		t.Fatal("same-source save fetched remote")
		return nil, io.EOF
	})
	hours := 12
	out, e = a.validateSave(ctx, Request{URL: newURL, IntervalHours: &hours}, true)
	if e != nil {
		t.Fatal(out, e)
	}
	after, _ := a.readSettings()
	if after.Generation != current.Generation || after.IntervalHours != 12 {
		t.Fatal("schedule save")
	}
}
func TestConfigurationFailuresPreserveOriginal(t *testing.T) {
	cases := []struct {
		name  string
		plain []byte
		key   string
		hook  string
	}{
		{"wrong_key", remoteConfig(1), otherKey, ""}, {"yaml_invalid", []byte("bad: ["), fixtureKey, ""}, {"yaml_array", []byte("[1,2]"), fixtureKey, ""}, {"core_invalid", []byte(`{"x-fixture":"TEST_CORE_INVALID"}`), fixtureKey, ""}, {"disk_space", remoteConfig(1), fixtureKey, "space"}, {"commit_failure", remoteConfig(1), fixtureKey, "commit"}, {"after_commit_interruption", remoteConfig(1), fixtureKey, "after_commit"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			a := fixture(t)
			saveFixture(t, a)
			before, _ := a.fingerprint(context.Background())
			setRemote(a, c.key, c.plain)
			if c.hook != "" {
				used := false
				a.Hook = func(p string) error {
					if p == c.hook && !used {
						used = true
						return fail("injected_failure")
					}
					return nil
				}
			}
			out, e := a.syncConfig(context.Background(), Request{}, false)
			if e == nil || out.OK {
				t.Fatal(out, e)
			}
			after, ae := a.fingerprint(context.Background())
			if ae != nil || after != before {
				t.Fatal("old config not preserved", ae)
			}
		})
	}
}
func TestLocalConflictAndExplicitReplace(t *testing.T) {
	a := fixture(t)
	saveFixture(t, a)
	ctx := context.Background()
	m, _ := a.readYAML(ctx, a.cfg())
	m["x-local-edit"] = "keep"
	mustWrite(t, a.cfg(), jsonBytes(m), 0600)
	before, _ := a.fingerprint(ctx)
	out, e := a.syncConfig(ctx, Request{}, false)
	if code(e) != "local_config_conflict" || out.Written {
		t.Fatal(out, e)
	}
	wrong := Fingerprint{}
	_, e = a.syncConfig(ctx, Request{ReplaceLocal: true, ExpectedLocal: &wrong}, false)
	if code(e) != "local_config_conflict" {
		t.Fatal(e)
	}
	out, e = a.syncConfig(ctx, Request{ReplaceLocal: true, ExpectedLocal: &before}, false)
	if e != nil || !out.OK {
		t.Fatal(out, e)
	}
}
func TestSourceGenerationFence(t *testing.T) {
	a := fixture(t)
	saveFixture(t, a)
	ctx := context.Background()
	old, _ := a.readSettings()
	before, _ := fileHash(a.cfg())
	a.Hook = func(point string) error {
		if point != "after_download" {
			return nil
		}
		next := old
		next.Generation = nonce()
		next.Revision++
		next.URL = strings.Replace(goodURL, "Bettbox.yaml.age", "new.age", 1)
		dir := a.data() + "/sources/" + next.Generation
		_ = privateDir(dir)
		_ = atomicWrite(dir+"/identity.txt", []byte(fixtureKey+"\n"), 0600)
		return writeJSON(a.settingsPath(), next)
	}
	out, e := a.syncConfig(ctx, Request{}, false)
	if code(e) != "source_changed" || out.Written {
		t.Fatal(out, e)
	}
	after, _ := fileHash(a.cfg())
	if after != before {
		t.Fatal("old download overwrote source")
	}
}
func TestStateLossAfterCommit(t *testing.T) {
	for _, point := range []string{"state_write", "finalize"} {
		t.Run(point, func(t *testing.T) {
			a := fixture(t)
			saveFixture(t, a)
			ctx := context.Background()
			a.Hook = func(p string) error {
				if p == point {
					return fail("injected_finalization")
				}
				return nil
			}
			out, e := a.syncConfig(ctx, Request{}, false)
			if e == nil || out.OK || !out.Written || out.Code != "committed_pending_finalize" || !exists(a.journalDir()) {
				t.Fatal(out, e)
			}
			applied, _ := fileHash(a.cfg())
			a.Hook = nil
			a.HTTPClient = doFunc(func(*http.Request) (*http.Response, error) {
				t.Fatal("reconciliation fetched remote")
				return nil, io.EOF
			})
			out, e = a.syncConfig(ctx, Request{}, false)
			if e != nil || !out.OK || out.Code != "commit_finalized" {
				t.Fatal(out, e)
			}
			after, _ := fileHash(a.cfg())
			if applied != after || exists(a.journalDir()) {
				t.Fatal("reconciliation changed applied config")
			}
		})
	}
}
func TestLeaseAndSettingsCAS(t *testing.T) {
	a := fixture(t)
	saveFixture(t, a)
	ctx := context.Background()
	s, _ := a.readSettings()
	old := s.Revision - 1
	out, e := a.validateSave(ctx, Request{URL: goodURL, Revision: &old}, true)
	if code(e) != "settings_changed" || out.Saved {
		t.Fatal(out, e)
	}
	if e = os.Mkdir(a.operationLock(), 0700); e != nil {
		t.Fatal(e)
	}
	mustWrite(t, a.operationLock()+"/owner", []byte("mm_browser_other\n"), 0600)
	_, e = a.syncConfig(ctx, Request{}, false)
	if code(e) != "operation_busy" {
		t.Fatal(e)
	}
	owner, _ := os.ReadFile(a.operationLock() + "/owner")
	if string(owner) != "mm_browser_other\n" {
		t.Fatal("stole lease")
	}
}
func TestInterruptedJournalAndDeletedSettings(t *testing.T) {
	a := fixture(t)
	saveFixture(t, a)
	ctx := context.Background()
	s, _ := a.readSettings()
	before, _ := a.fingerprint(ctx)
	l, e := a.acquireLease(ctx, false)
	if e != nil {
		t.Fatal(e)
	}
	work, e := os.MkdirTemp(a.data()+"/work", "fixture-")
	if e != nil {
		t.Fatal(e)
	}
	plain := work + "/plain.yaml"
	mustWrite(t, plain, remoteConfig(2), 0600)
	candidate, hash, e := a.candidate(ctx, plain, work)
	if e != nil {
		t.Fatal(e)
	}
	j, e := a.makeJournal(s, before, hash, false)
	if e != nil {
		t.Fatal(e)
	}
	if e = a.commitPair(ctx, l, candidate, "", false, true, false, j.ID); e != nil {
		t.Fatal(e)
	}
	if e = l.Release(); e != nil {
		t.Fatal(e)
	}
	l, e = a.acquireLease(ctx, false)
	if e != nil {
		t.Fatal(e)
	}
	out, e := a.recoverActivation(ctx, l, true)
	if e != nil || out.Code != "interrupted_transaction_restored" {
		t.Fatal(out, e)
	}
	if e = l.Release(); e != nil {
		t.Fatal(e)
	}
	after, _ := a.fingerprint(ctx)
	if before != after {
		t.Fatal("recovery mismatch")
	}
	out, e = a.deleteSettings(ctx)
	if e != nil || !out.OK {
		t.Fatal(out, e)
	}
	if exists(a.data() + "/sources") {
		t.Fatal("identities not removed")
	}
	b, _ := os.ReadFile(a.Boot)
	if strings.Contains(string(b), "KANO_GIST_SYNC") || !strings.Contains(string(b), "preserve_other_app") {
		t.Fatal("boot cleanup altered foreign entry")
	}
}
func TestAutomaticDisabledAndStopped(t *testing.T) {
	a := fixture(t)
	saveFixture(t, a)
	out, e := a.syncConfig(context.Background(), Request{}, true)
	if code(e) != "auto_disabled" || out.Written {
		t.Fatal(out, e)
	}
	s, _ := a.readSettings()
	s.Auto = true
	s.SavedAt = time.Now().Add(-7 * time.Hour)
	if e = writeJSON(a.settingsPath(), s); e != nil {
		t.Fatal(e)
	}
	out, e = a.syncConfig(context.Background(), Request{}, true)
	if code(e) != "auto_paused_core_stopped" || out.Written {
		t.Fatal(out, e)
	}
}
func TestSecretNotInStatusAndRequestsConsumed(t *testing.T) {
	a := fixture(t)
	saveFixture(t, a)
	status, e := a.status(context.Background())
	if e != nil {
		t.Fatal(e)
	}
	if strings.Contains(string(jsonBytes(status)), fixtureKey) {
		t.Fatal("identity in status")
	}
	p := a.Upload + "/request.json"
	mustWrite(t, p, jsonBytes(Request{URL: goodURL, Identity: fixtureKey}), 0600)
	r, e := a.uploadRequest(p)
	if e != nil || r.Identity != fixtureKey || exists(p) {
		t.Fatal("request not consumed", e)
	}
	_, e = a.uploadRequest(a.cfg())
	if code(e) != "request_path_invalid" {
		t.Fatal(e)
	}
}
func TestRealF50Hardware(t *testing.T) {
	t.Skip("Not executed: no real F50 Android ARM64 device accessed.")
}
