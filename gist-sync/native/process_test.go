package main

import (
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"testing"
	"time"
)

// Only the test executable recognizes these variables. No production CLI path override exists.
func TestMain(m *testing.M) {
	if integrationCLI() {
		return
	}
	root := os.Getenv("F50_TEST_CHILD_ROOT")
	if root != "" && len(os.Args) > 1 {
		if filepath.Base(os.Args[0]) == "Clash.Core" {
			os.Exit(fakeCore(root))
		}
		action := os.Args[1]
		if action == "worker" || action == "daemon" {
			base := filepath.Dir(root)
			a := &App{Root: root, Dev: base + "/dev", Boot: base + "/public/ufi_tools_boot.sh", Upload: base + "/uploads"}
			ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
			defer cancel()
			a.HTTPClient = doFunc(func(r *http.Request) (*http.Response, error) {
				for exists(base + "/pause-download") {
					select {
					case <-r.Context().Done():
						return nil, r.Context().Err()
					case <-time.After(20 * time.Millisecond):
					}
				}
				b, e := os.ReadFile(base + "/remote.sim")
				if e != nil {
					return nil, e
				}
				return response(200, string(b)), nil
			})
			a.Hook = func(p string) error {
				if p == "after_commit" && exists(base+"/crash-after-commit") {
					_ = syscall.Kill(os.Getpid(), syscall.SIGKILL)
					select {}
				}
				return nil
			}
			e := a.init()
			if e == nil {
				if action == "worker" {
					e = a.worker(ctx, os.Args[2], os.Args[3])
				} else {
					e = a.daemon(ctx)
				}
			}
			if e != nil {
				os.Exit(1)
			}
			os.Exit(0)
		}
	}
	os.Exit(m.Run())
}
func fakeCore(root string) int {
	args := os.Args[1:]
	test := false
	path := root + "/Proxy/config.yaml"
	for i, arg := range args {
		if arg == "-v" {
			os.Stdout.WriteString("Mihomo Meta v1.19.31 TEST_DOUBLE\n")
			return 0
		}
		if arg == "-t" {
			test = true
		}
		if arg == "-f" && i+1 < len(args) {
			path = args[i+1]
		}
	}
	load := func(p string) (map[string]any, error) {
		b, e := os.ReadFile(p)
		if e != nil {
			return nil, e
		}
		v, e := parseJSON(b)
		if e != nil {
			return nil, e
		}
		if strings.Contains(string(b), "TEST_CORE_INVALID") {
			return nil, io.ErrUnexpectedEOF
		}
		return obj(v), nil
	}
	config, e := load(path)
	if e != nil {
		return 1
	}
	if test {
		return 0
	}
	var mu sync.Mutex
	srv := &http.Server{Addr: "127.0.0.1:7788", ReadHeaderTimeout: 3 * time.Second}
	srv.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		if r.Header.Get("Authorization") != "Bearer "+str(config["secret"]) {
			w.WriteHeader(401)
			return
		}
		f, _ := os.OpenFile(root+"/api-events", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
		if f != nil {
			_, _ = f.WriteString(r.Method + " " + r.URL.Path + "\n")
			f.Close()
		}
		switch r.URL.Path {
		case "/configs":
			if r.Method == "PUT" {
				var v map[string]string
				if json.NewDecoder(r.Body).Decode(&v) != nil {
					w.WriteHeader(400)
					return
				}
				m, e := load(v["path"])
				if e != nil {
					w.WriteHeader(400)
					return
				}
				config = m
				w.WriteHeader(204)
				return
			}
			if r.Method == "PATCH" {
				var v map[string]any
				_ = json.NewDecoder(r.Body).Decode(&v)
				for k, value := range v {
					config[k] = value
				}
				w.WriteHeader(204)
				return
			}
			_ = json.NewEncoder(w).Encode(config)
		case "/proxies":
			p := map[string]any{}
			for _, node := range config["proxies"].([]any) {
				n := obj(node)
				p[str(n["name"])] = map[string]any{"type": n["type"]}
			}
			_ = json.NewEncoder(w).Encode(map[string]any{"proxies": p})
		default:
			w.WriteHeader(404)
		}
	})
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer cancel()
	ln, e := net.Listen("tcp", srv.Addr)
	if e != nil {
		return 1
	}
	go func() { <-ctx.Done(); _ = srv.Close() }()
	e = srv.Serve(ln)
	if e != nil && e != http.ErrServerClosed {
		return 1
	}
	return 0
}
func processFixture(t *testing.T) *App {
	a := fixture(t)
	exe, e := os.Executable()
	if e != nil {
		t.Fatal(e)
	}
	copyFixture(t, exe, a.Root+"/Tools/kano-gist-sync")
	t.Setenv("F50_TEST_CHILD_ROOT", a.Root)
	saveFixture(t, a)
	mustWrite(t, filepath.Dir(a.Root)+"/remote.sim", simulatedCipher(fixtureKey, remoteConfig(1)), 0600)
	t.Cleanup(func() {
		ctx, c := context.WithTimeout(context.Background(), 12*time.Second)
		defer c()
		_ = a.stopDaemon(ctx)
		_ = a.stopOtherJobs(ctx)
	})
	return a
}
func startFakeCore(t *testing.T, a *App) {
	t.Helper()
	exe, e := os.Executable()
	if e != nil {
		t.Fatal(e)
	}
	copyFixture(t, exe, a.Root+"/Proxy/Clash.Core")
	cmd := exec.Command(a.Root+"/Proxy/Clash.Core", "-d", a.Root+"/Proxy", "-f", a.cfg())
	cmd.Env = append(os.Environ(), "F50_TEST_CHILD_ROOT="+a.Root)
	cmd.Stderr = io.Discard
	if e = cmd.Start(); e != nil {
		t.Fatal(e)
	}
	t.Cleanup(func() { _ = cmd.Process.Signal(syscall.SIGTERM); _ = cmd.Wait() })
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if _, e = a.api(context.Background(), "local-protected-secret", "GET", "/configs", nil); e == nil {
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatal("fake core did not listen")
}
func waitJob(t *testing.T, a *App, id string) Job {
	t.Helper()
	deadline := time.Now().Add(12 * time.Second)
	for time.Now().Before(deadline) {
		j, e := a.readJob(id)
		if e == nil && (j.Status == "finished" || j.Status == "completion_unknown") {
			return j
		}
		time.Sleep(30 * time.Millisecond)
	}
	t.Fatal("job deadline")
	return Job{}
}
func TestDetachedManualJobAndReceiptLoss(t *testing.T) {
	a := processFixture(t)
	id, e := a.dispatch(context.Background(), "sync", "")
	if e != nil {
		t.Fatal(e)
	}
	// The dispatch caller does no further work; the detached native child must finish alone.
	j := waitJob(t, a, id)
	if j.Status != "finished" || !j.Result.OK || j.Result.Code != "saved_stopped" {
		t.Fatal(j)
	}
	if e = os.Remove(a.jobPath(id)); e != nil {
		t.Fatal(e)
	}
	if _, e = a.readJob(id); code(e) != "task_receipt_missing" {
		t.Fatal(e)
	}
	out, e := a.syncConfig(context.Background(), Request{}, false)
	if e != nil || out.Code != "up_to_date" {
		t.Fatal(out, e)
	}
}
func TestOldDownloadAfterSourceSwitch(t *testing.T) {
	a := processFixture(t)
	base := filepath.Dir(a.Root)
	mustWrite(t, base+"/pause-download", []byte("1"), 0600)
	id, e := a.dispatch(context.Background(), "sync", "")
	if e != nil {
		t.Fatal(e)
	}
	before, _ := fileHash(a.cfg())
	setRemote(a, fixtureKey, remoteConfig(2))
	out, e := a.validateSave(context.Background(), Request{URL: strings.Replace(goodURL, "Bettbox.yaml.age", "switched.age", 1)}, true)
	if e != nil || !out.Saved {
		t.Fatal(out, e)
	}
	_ = os.Remove(base + "/pause-download")
	j := waitJob(t, a, id)
	if j.Result.Code != "source_changed" || j.Result.Written {
		t.Fatal(j)
	}
	after, _ := fileHash(a.cfg())
	if before != after {
		t.Fatal("stale task committed")
	}
}
func TestNativeCancellation(t *testing.T) {
	a := processFixture(t)
	base := filepath.Dir(a.Root)
	mustWrite(t, base+"/pause-download", []byte("1"), 0600)
	before, _ := fileHash(a.cfg())
	id, e := a.dispatch(context.Background(), "sync", "")
	if e != nil {
		t.Fatal(e)
	}
	if e = a.cancelJob(context.Background(), id); e != nil {
		t.Fatal(e)
	}
	j := waitJob(t, a, id)
	if j.Result.OK || j.Result.Written || j.Result.Code != "cancelled" {
		t.Fatal(j)
	}
	after, _ := fileHash(a.cfg())
	if before != after {
		t.Fatal("cancel changed config")
	}
}
func TestSIGKILLJournalRecovery(t *testing.T) {
	a := processFixture(t)
	ctx := context.Background()
	before, _ := a.fingerprint(ctx)
	mustWrite(t, filepath.Dir(a.Root)+"/crash-after-commit", []byte("1"), 0600)
	id, e := a.dispatch(ctx, "sync", "")
	if e != nil {
		t.Fatal(e)
	}
	j := waitJob(t, a, id)
	if j.Status != "completion_unknown" || !exists(a.journalDir()) {
		t.Fatal(j)
	}
	l, e := a.acquireLease(ctx, false)
	if e != nil {
		t.Fatal("dead own lease not recoverable", e)
	}
	out, e := a.recoverActivation(ctx, l, true)
	if e != nil {
		t.Fatal(out, e)
	}
	if e = l.Release(); e != nil {
		t.Fatal(e)
	}
	after, _ := a.fingerprint(ctx)
	if before != after {
		t.Fatal("crash recovery changed baseline")
	}
}
func TestRunningCoreManualAndNoop(t *testing.T) {
	a := processFixture(t)
	startFakeCore(t, a)
	out, e := a.syncConfig(context.Background(), Request{}, false)
	if e != nil || !out.OK || !out.Loaded || !out.RuntimeVerified {
		t.Fatal(out, e)
	}
	before, _ := os.ReadFile(a.Root + "/api-events")
	out, e = a.syncConfig(context.Background(), Request{}, false)
	if e != nil || out.Code != "up_to_date" {
		t.Fatal(out, e)
	}
	after, _ := os.ReadFile(a.Root + "/api-events")
	if strings.Count(string(before), "PUT /configs") != strings.Count(string(after), "PUT /configs") {
		t.Fatal("noop reloaded core")
	}
}
func TestRuntimeFailureRollback(t *testing.T) {
	for _, stage := range []string{"hot_reload", "policy_apply", "runtime_verify"} {
		t.Run(stage, func(t *testing.T) {
			a := processFixture(t)
			startFakeCore(t, a)
			before, _ := a.fingerprint(context.Background())
			used := false
			a.Hook = func(p string) error {
				if p == stage && !used {
					used = true
					return fail("runtime_injected")
				}
				if stage == "hot_reload" && p == "restart" {
					return fail("restart_injected")
				}
				return nil
			}
			out, e := a.syncConfig(context.Background(), Request{}, false)
			if e == nil || out.OK || out.Warning != "old_config_restored" {
				t.Fatal(out, e)
			}
			after, _ := a.fingerprint(context.Background())
			if before != after {
				t.Fatal("runtime rollback failed")
			}
		})
	}
}
func TestDaemonSingletonAndDisable(t *testing.T) {
	a := processFixture(t)
	startFakeCore(t, a)
	s, _ := a.readSettings()
	s.Auto = true
	s.SavedAt = time.Now().Add(-7 * time.Hour)
	if e := writeJSON(a.settingsPath(), s); e != nil {
		t.Fatal(e)
	}
	if e := a.startDaemon(context.Background()); e != nil {
		t.Fatal(e)
	}
	var first processRecord
	_ = readJSON(a.runtime()+"/daemon.json", &first)
	if e := a.startDaemon(context.Background()); e != nil {
		t.Fatal(e)
	}
	var second processRecord
	_ = readJSON(a.runtime()+"/daemon.json", &second)
	if first != second {
		t.Fatal("duplicate daemon")
	}
	deadline := time.Now().Add(12 * time.Second)
	for a.readState().LastSuccess.IsZero() && time.Now().Before(deadline) {
		time.Sleep(50 * time.Millisecond)
	}
	if a.readState().LastSuccess.IsZero() {
		t.Fatal("daemon did not sync", a.readState())
	}
	if exists(a.operationLock()) {
		time.Sleep(100 * time.Millisecond)
	}
	if exists(a.operationLock()) {
		t.Fatal("daemon retained operation lease while sleeping")
	}
	out, e := a.disableAuto(context.Background())
	if e != nil {
		t.Fatal(out, e)
	}
	if e = a.stopDaemon(context.Background()); e != nil {
		t.Fatal(e)
	}
	if a.daemonAlive() {
		t.Fatal("disabled daemon remains")
	}
}
func TestBoundedProcessOutput(t *testing.T) {
	b := &boundedBuffer{max: 4}
	_, e := io.Copy(b, strings.NewReader("12345"))
	if e == nil || b.Len() > 4 {
		t.Fatal("io.Copy bypassed output limit")
	}
}
