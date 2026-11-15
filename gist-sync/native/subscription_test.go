package main

import (
	"bufio"
	"context"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestSubscriptionSettingsAndStoppedCore(t *testing.T) {
	a := fixture(t)
	s, e := a.subscriptionStatus()
	if e != nil || s["configured"] != false || s["intervalHours"] != 24 {
		t.Fatal(s, e)
	}
	writeJSON(a.subscriptionSettingsPath(), SubscriptionSettings{Auto: false, IntervalHours: 6, Rescue: map[string]any{"name": "rescue", "password": "PRIVATE_TEST_VALUE"}})
	s, e = a.subscriptionStatus()
	if e != nil || strings.Contains(string(jsonBytes(s)), "PRIVATE_TEST_VALUE") {
		t.Fatal(s, e)
	}
	if e = a.updateLocalSubscriptions(context.Background()); code(e) != "auto_paused_core_stopped" {
		t.Fatal(e)
	}
	if exists(a.operationLock()) {
		t.Fatal("stopped update retained the operation lease")
	}
	writeJSON(a.subscriptionSettingsPath(), SubscriptionSettings{IntervalHours: 2})
	if _, e = a.subscriptionSettings(); code(e) != "invalid_sync_interval" {
		t.Fatal(e)
	}
}
func TestSubscriptionCachesRestoreFailedBatch(t *testing.T) {
	a := fixture(t)
	ctx := context.Background()
	l, e := a.acquireLease(ctx, false)
	if e != nil {
		t.Fatal(e)
	}
	defer l.Release()
	os.MkdirAll(a.Root+"/Proxy/proxies", 0700)
	old := a.Root + "/Proxy/proxies/Provider1.yaml"
	mustWrite(t, old, []byte("old nodes"), 0600)
	n := 0
	a.Hook = func(point string) error {
		if point == "subscription_commit" {
			n++
			if n == 2 {
				return fail("disk_full")
			}
		}
		return nil
	}
	e = a.commitSubscriptionCaches(l, []SubscriptionSource{{Name: "Provider1"}, {Name: "Provider2"}}, [][]byte{[]byte("new one"), []byte("new two")})
	if code(e) != "disk_full" {
		t.Fatal(e)
	}
	got, _ := os.ReadFile(old)
	if string(got) != "old nodes" || exists(a.Root+"/Proxy/proxies/Provider2.yaml") {
		t.Fatal("failed batch changed caches")
	}
}
func TestSubscriptionDirectFetchAndRejection(t *testing.T) {
	for _, status := range []int{200, 401, 404} {
		t.Run(fmt.Sprint(status), func(t *testing.T) {
			a := fixture(t)
			ctx := context.Background()
			mustWrite(t, a.scripts("clashctl_arm64"), []byte(fmt.Sprintf("#!/bin/sh\nprintf 'F50_FETCH_RESULT={\"ok\":%t,\"committed\":%t,\"providers\":[{\"name\":\"Provider1\",\"ok\":%t,\"proxyCount\":1,\"statusCode\":%d}]}\\n'\nexit %d\n", status == 200, status == 200, status == 200, status, map[bool]int{true: 0, false: 1}[status == 200])), 0755)
			writeJSON(a.subscriptionSettingsPath(), SubscriptionSettings{Auto: false, IntervalHours: 6, Rescue: map[string]any{"name": "rescue"}})
			path := a.Root + "/request.json"
			writeJSON(path, SubscriptionFetch{Sources: []SubscriptionSource{{Name: "Provider1", URL: "https://example.com/sub"}}})
			r, e := a.fetchSubscriptions(ctx, path)
			if status == 200 {
				if e != nil || !r.Committed || r.Rescued {
					t.Fatal(r, e)
				}
			} else if code(e) != "subscription_download_rejected" {
				t.Fatal(r, e)
			}
		})
	}
}
func TestSubscriptionRejectsUnsafeSources(t *testing.T) {
	a := fixture(t)
	for _, s := range []SubscriptionSource{{Name: "../escape", URL: "https://example.com"}, {Name: "Provider1", URL: "http://127.0.0.1/"}, {Name: "Provider1", URL: "https://user:password@example.com/"}} {
		path := a.Root + "/request.json"
		writeJSON(path, SubscriptionFetch{Sources: []SubscriptionSource{s}})
		if _, e := a.fetchSubscriptions(context.Background(), path); e == nil {
			t.Fatal("accepted", s.Name)
		}
	}
}
func TestSubscriptionDaemonStopsWithoutStartingCore(t *testing.T) {
	a := fixture(t)
	writeJSON(a.subscriptionSettingsPath(), SubscriptionSettings{Auto: true, IntervalHours: 1, SavedAt: time.Now().Add(-2 * time.Hour)})
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- a.subscriptionDaemon(ctx) }()
	t.Cleanup(cancel)
	deadline := time.Now().Add(3 * time.Second)
	for {
		var st SubscriptionState
		if readJSON(a.Root+"/Tools/subscription-state.json", &st) == nil {
			if st.Code != "auto_paused_core_stopped" {
				t.Fatal(st)
			}
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("scheduler did not record stopped state")
		}
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	if e := <-done; code(e) != "cancelled" {
		t.Fatal(e)
	}
	if exists(a.runtime() + "/subscription-daemon.json") {
		t.Fatal("scheduler record retained")
	}
}

func TestSubscriptionRescueEndToEnd(t *testing.T) {
	core, helper, yq := os.Getenv("F50_TEST_MIHOMO"), os.Getenv("F50_TEST_SUB_HELPER"), os.Getenv("F50_TEST_YQ")
	if core == "" || helper == "" || yq == "" {
		t.Skip("requires local Mihomo, subscription helper and yq binaries")
	}
	a := fixture(t)
	copyFixture(t, core, a.Root+"/Proxy/Clash.Core")
	copyFixture(t, helper, a.Root+"/Tools/kano-f50-helper")
	copyFixture(t, yq, a.Root+"/Tools/yq_linux_arm64")
	body := `proxies:
  - {name: Downloaded, type: socks5, server: example.com, port: 1080}
`
	proxyCalls := 0
	var proxyMu sync.Mutex
	proxy := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "CONNECT" {
			t.Error("expected CONNECT")
			http.Error(w, "bad method", 405)
			return
		}
		conn, _, e := w.(http.Hijacker).Hijack()
		if e != nil {
			return
		}
		defer conn.Close()
		conn.SetDeadline(time.Now().Add(10 * time.Second))
		fmt.Fprint(conn, "HTTP/1.1 200 Connection established\r\n\r\n")
		request, e := http.ReadRequest(bufio.NewReader(conn))
		if e != nil {
			return
		}
		defer request.Body.Close()
		proxyMu.Lock()
		proxyCalls++
		responseBody := body
		proxyMu.Unlock()
		fmt.Fprintf(conn, "HTTP/1.1 200 OK\r\nContent-Length: %d\r\nConnection: close\r\n\r\n%s", len(responseBody), responseBody)
	}))
	defer proxy.Close()
	host, port, _ := net.SplitHostPort(strings.TrimPrefix(proxy.URL, "http://"))
	node := fmt.Sprintf("name: Independent\ntype: http\nserver: %s\nport: %s\npassword: 'https://fixture.invalid/password'\n", host, port)
	requestPath := a.Root + "/settings-request.json"
	writeJSON(requestPath, map[string]any{"auto": false, "intervalHours": 6, "rescueText": node})
	s, e := a.saveSubscriptionSettings(context.Background(), requestPath)
	if e != nil || s["rescueConfigured"] != true {
		t.Fatal(s, e)
	}
	before, _ := os.ReadFile(a.cfg())
	mustWrite(t, a.scripts("clashctl_arm64"), []byte("#!/bin/sh\necho 'F50_FETCH_RESULT={\"ok\":false,\"committed\":false,\"providers\":[{\"name\":\"Provider1\",\"ok\":false,\"statusCode\":403}]}'\nexit 1\n"), 0755)
	path := a.Root + "/fetch-request.json"
	writeJSON(path, SubscriptionFetch{Sources: []SubscriptionSource{{Name: "Provider1", URL: "http://sub.example.test/sub"}}, UserAgent: "FixtureAgent"})
	r, e := a.fetchSubscriptions(context.Background(), path)
	if e != nil || !r.OK || !r.Rescued || !r.Committed || r.Providers[0].ProxyCount != 1 {
		t.Fatal(r, e)
	}
	proxyMu.Lock()
	calls := proxyCalls
	proxyMu.Unlock()
	if calls != 1 {
		t.Fatal("proxy requests", calls)
	}
	after, _ := os.ReadFile(a.cfg())
	if string(before) != string(after) {
		t.Fatal("rescue changed the main configuration")
	}
	if pid, e := a.corePID(); e != nil || pid != 0 {
		t.Fatal("rescue left a core process", pid, e)
	}
	cache, _ := os.ReadFile(a.Root + "/Proxy/proxies/Provider1.yaml")
	if !strings.Contains(string(cache), "Downloaded") {
		t.Fatal("missing downloaded nodes")
	}
	entries, _ := os.ReadDir(a.data() + "/work")
	if len(entries) != 0 {
		t.Fatal("private work retained")
	}
	// A failed rescue conversion must retain the successfully installed cache.
	proxyMu.Lock()
	body = "<html>not a subscription</html>"
	proxyMu.Unlock()
	r, e = a.fetchSubscriptions(context.Background(), path)
	if e == nil || r.Committed {
		t.Fatal("accepted HTML", r, e)
	}
	unchanged, _ := os.ReadFile(filepath.Join(a.Root, "Proxy/proxies/Provider1.yaml"))
	if string(unchanged) != string(cache) {
		t.Fatal("failed rescue replaced usable nodes")
	}
}

func TestSubscriptionAutoRefreshAndSingleton(t *testing.T) {
	a := processFixture(t)
	ctx := context.Background()
	m, e := a.readYAML(ctx, a.cfg())
	if e != nil {
		t.Fatal(e)
	}
	m["proxy-providers"] = map[string]any{"Provider1": map[string]any{"type": "file", "path": "./proxies/Provider1.yaml"}, "Provider2": map[string]any{"type": "http", "path": "./proxies/Provider2.yaml", "url": "https://example.com/http"}}
	writeJSON(a.cfg(), m)
	mustWrite(t, a.sourcesPath(), []byte("# KANO_SUB_CONVERT_MODE=local\nhttps://example.com/local Provider1\nhttps://example.com/http Provider2\n# KANO_SUB_DISABLED https://example.com/disabled\n"), 0600)
	mustWrite(t, a.Root+"/Tools/sub_user_agent.conf", []byte("FixtureUA\n"), 0600)
	mustWrite(t, a.scripts("clashctl_arm64"), []byte("#!/bin/sh\ncp \"$2\" \"$CLASH_ROOT/fetch-request-seen.json\"\necho 'F50_FETCH_RESULT={\"ok\":true,\"committed\":true,\"providers\":[{\"name\":\"Provider1\",\"ok\":true,\"proxyCount\":1,\"statusCode\":200}]}'\n"), 0755)
	startFakeCore(t, a)
	before, _ := os.ReadFile(a.cfg())
	writeJSON(a.subscriptionSettingsPath(), SubscriptionSettings{Auto: true, IntervalHours: 1, SavedAt: time.Now().Add(-2 * time.Hour)})
	if e = a.startSubscriptionDaemon(ctx); e != nil {
		t.Fatal(e)
	}
	var first processRecord
	readJSON(a.runtime()+"/subscription-daemon.json", &first)
	t.Cleanup(func() { _ = a.stopRecord(ctx, first) })
	if e = a.startSubscriptionDaemon(ctx); e != nil {
		t.Fatal(e)
	}
	var second processRecord
	readJSON(a.runtime()+"/subscription-daemon.json", &second)
	if first != second {
		t.Fatal("duplicate scheduler")
	}
	deadline := time.Now().Add(5 * time.Second)
	for {
		var state SubscriptionState
		if readJSON(a.Root+"/Tools/subscription-state.json", &state) == nil {
			if state.Code != "" {
				t.Fatal(state)
			}
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("background refresh did not complete")
		}
		time.Sleep(20 * time.Millisecond)
	}
	var request SubscriptionFetch
	if e = readJSON(a.Root+"/fetch-request-seen.json", &request); e != nil || len(request.Sources) != 1 || request.Sources[0].Name != "Provider1" || request.UserAgent != "FixtureUA" {
		t.Fatal(request, e)
	}
	after, _ := os.ReadFile(a.cfg())
	if string(before) != string(after) {
		t.Fatal("background refresh changed configuration")
	}
	events, _ := os.ReadFile(a.Root + "/api-events")
	if !strings.Contains(string(events), "PUT /providers/proxies/Provider1") {
		t.Fatal("nodes were not reloaded")
	}
	path := a.Root + "/disable-request.json"
	writeJSON(path, map[string]any{"auto": false, "intervalHours": 6})
	if _, e = a.saveSubscriptionSettings(ctx, path); e != nil {
		t.Fatal(e)
	}
	if first.Alive() {
		t.Fatal("disabled scheduler remained alive")
	}
}
