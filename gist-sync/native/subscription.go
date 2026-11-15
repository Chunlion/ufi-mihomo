// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"syscall"
	"time"
)

type SubscriptionSettings struct {
	Auto          bool           `json:"auto"`
	IntervalHours int            `json:"intervalHours"`
	Rescue        map[string]any `json:"rescue,omitempty"`
	SavedAt       time.Time      `json:"savedAt"`
}
type SubscriptionSource struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}
type SubscriptionFetch struct {
	Sources   []SubscriptionSource `json:"sources"`
	UserAgent string               `json:"userAgent"`
}
type SubscriptionProvider struct {
	Name       string `json:"name"`
	OK         bool   `json:"ok"`
	ProxyCount int    `json:"proxyCount"`
	StatusCode int    `json:"statusCode"`
	Format     string `json:"format,omitempty"`
}
type SubscriptionResult struct {
	OK        bool                   `json:"ok"`
	Committed bool                   `json:"committed"`
	Rescued   bool                   `json:"rescued"`
	Providers []SubscriptionProvider `json:"providers"`
}
type SubscriptionState struct {
	CheckedAt time.Time `json:"checkedAt"`
	Code      string    `json:"code"`
}

func (a *App) subscriptionSettingsPath() string { return a.Root + "/Tools/subscription-settings.json" }
func (a *App) subscriptionSettings() (SubscriptionSettings, error) {
	s := SubscriptionSettings{Auto: true, IntervalHours: 24}
	e := readJSON(a.subscriptionSettingsPath(), &s)
	if os.IsNotExist(e) {
		return s, nil
	}
	if e != nil {
		return s, fail("subscription_settings_invalid")
	}
	switch s.IntervalHours {
	case 1, 6, 12, 24:
	default:
		return s, fail("invalid_sync_interval")
	}
	return s, nil
}
func (a *App) subscriptionStatus() (map[string]any, error) {
	s, e := a.subscriptionSettings()
	if e != nil {
		return nil, e
	}
	var st SubscriptionState
	if e = readJSON(a.Root+"/Tools/subscription-state.json", &st); e != nil && !os.IsNotExist(e) {
		return nil, e
	}
	var daemon processRecord
	running := readJSON(a.runtime()+"/subscription-daemon.json", &daemon) == nil && daemon.Alive()
	return map[string]any{"ok": true, "configured": exists(a.subscriptionSettingsPath()), "auto": s.Auto, "intervalHours": s.IntervalHours, "rescueConfigured": len(s.Rescue) > 0, "rescueName": str(s.Rescue["name"]), "state": st, "schedulerRunning": running}, nil
}
func (a *App) saveSubscriptionSettings(ctx context.Context, path string) (out map[string]any, err error) {
	l, e := a.acquireLease(ctx, true)
	if e != nil {
		return nil, e
	}
	defer func() {
		if e := l.Release(); err == nil && e != nil {
			out = nil
			err = e
		}
	}()
	var req struct {
		Auto          bool   `json:"auto"`
		IntervalHours int    `json:"intervalHours"`
		RescueText    string `json:"rescueText"`
		ClearRescue   bool   `json:"clearRescue"`
	}
	if e = readJSON(path, &req); e != nil {
		return nil, fail("request_json_invalid")
	}
	s, e := a.subscriptionSettings()
	if e != nil {
		return nil, e
	}
	switch req.IntervalHours {
	case 1, 6, 12, 24:
	default:
		return nil, fail("invalid_sync_interval")
	}
	s.Auto = req.Auto
	s.IntervalHours = req.IntervalHours
	s.SavedAt = time.Now().UTC()
	if req.ClearRescue {
		s.Rescue = nil
	}
	if strings.TrimSpace(req.RescueText) != "" {
		work, e := a.newWork("rescue-validate-")
		if e != nil {
			return nil, e
		}
		defer secureRemove(work)
		input := work + "/node.txt"
		if e = atomicWrite(input, []byte(req.RescueText), 0600); e != nil {
			return nil, e
		}
		if node, err := a.readYAML(ctx, input); err == nil && node["proxies"] == nil && str(node["type"]) != "" {
			if e = writeJSON(input, map[string]any{"proxies": []any{node}}); e != nil {
				return nil, e
			}
		}
		nodes, _, e := a.convertSubscription(ctx, input, work+"/node.yaml")
		if e != nil {
			return nil, e
		}
		if len(nodes) != 1 {
			return nil, fail("rescue_single_node_required")
		}
		s.Rescue = obj(nodes[0])
		if s.Rescue == nil {
			return nil, fail("rescue_single_node_required")
		}
		// The rescue node must work before any subscription or main-core configuration exists.
		if str(s.Rescue["server"]) == "" || str(s.Rescue["dialer-proxy"]) != "" {
			return nil, fail("rescue_independent_node_required")
		}
		s.Rescue["name"] = "F50-Rescue"
		candidate := work + "/test.json"
		if e = writeJSON(candidate, rescueConfig(s.Rescue, 0)); e != nil {
			return nil, e
		}
		if e = a.testCore(ctx, candidate); e != nil {
			return nil, fail("rescue_node_invalid")
		}
	}
	if e = l.Check(); e != nil {
		return nil, e
	}
	// The boot hook stays only while some scheduler needs it; saving with automatic updates off
	// must not add an autostart a user never enabled for a Gist schedule that is off as well.
	keepBoot := s.Auto
	if !keepBoot {
		gist, err := a.readSettings()
		// An unreadable Gist setting says nothing about autostart, so leave the hook untouched.
		keepBoot = err != nil || (gist.Auto && !gist.Deleted)
	}
	if e = a.editBoot(keepBoot); e != nil {
		return nil, e
	}
	if e = writeJSON(a.subscriptionSettingsPath(), s); e != nil {
		return nil, e
	}
	if e = a.startSubscriptionDaemon(ctx); e != nil {
		return nil, e
	}
	return a.subscriptionStatus()
}

func (a *App) convertSubscription(ctx context.Context, input, output string) ([]any, string, error) {
	b, e := run(ctx, 50*time.Second, nil, a.Root+"/Tools/kano-f50-helper", "convert-subscription", "--input", input, "--output", output)
	var r struct {
		OK     bool   `json:"ok"`
		Format string `json:"format"`
	}
	if e != nil || json.Unmarshal(b, &r) != nil || !r.OK {
		return nil, "", fail("subscription_conversion_failed")
	}
	m, e := a.readYAML(ctx, output)
	if e != nil {
		return nil, "", e
	}
	nodes, ok := m["proxies"].([]any)
	if !ok || len(nodes) == 0 {
		return nil, "", fail("subscription_empty")
	}
	return nodes, r.Format, nil
}
func rescueConfig(node map[string]any, port int) map[string]any {
	return map[string]any{"mixed-port": port, "allow-lan": false, "bind-address": "127.0.0.1", "mode": "rule", "log-level": "silent", "ipv6": true, "external-controller": "", "tun": map[string]any{"enable": false}, "dns": map[string]any{"enable": false}, "profile": map[string]any{"store-selected": false}, "proxies": []any{node}, "rules": []string{"MATCH," + str(node["name"])}}
}
func (a *App) rescueClient(ctx context.Context, work string, node map[string]any) (*http.Client, func(), error) {
	listener, e := net.Listen("tcp4", "127.0.0.1:0")
	if e != nil {
		return nil, nil, e
	}
	port := listener.Addr().(*net.TCPAddr).Port
	listener.Close()
	config := work + "/rescue.json"
	if e = writeJSON(config, rescueConfig(node, port)); e != nil {
		return nil, nil, e
	}
	// A distinct executable path keeps corePID and recovery from mistaking this helper for the main core.
	binary := work + "/Clash.Rescue"
	if e = os.Link(a.Root+"/Proxy/Clash.Core", binary); e != nil {
		return nil, nil, e
	}
	cmd := exec.CommandContext(ctx, binary, "-d", work, "-f", config)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true, Pdeathsig: syscall.SIGKILL}
	cmd.Cancel = func() error { return syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL) }
	cmd.WaitDelay = 2 * time.Second
	if e = cmd.Start(); e != nil {
		return nil, nil, fail("rescue_start_failed")
	}
	done := make(chan error, 1)
	go func() { done <- cmd.Wait() }()
	stopped := false
	stop := func() {
		if !stopped {
			stopped = true
			_ = syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
			<-done
		}
	}
	proxy, _ := url.Parse(fmt.Sprintf("http://127.0.0.1:%d", port))
	transport := &http.Transport{Proxy: http.ProxyURL(proxy), TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12, RootCAs: trustRoots()}, DisableKeepAlives: true}
	deadline := time.NewTimer(10 * time.Second)
	defer deadline.Stop()
	for {
		conn, err := net.DialTimeout("tcp", proxy.Host, 100*time.Millisecond)
		if err == nil {
			conn.Close()
			break
		}
		select {
		case <-done:
			stopped = true
			return nil, nil, fail("rescue_start_failed")
		case <-deadline.C:
			stop()
			return nil, nil, fail("rescue_start_failed")
		case <-ctx.Done():
			stop()
			return nil, nil, ctx.Err()
		case <-time.After(50 * time.Millisecond):
		}
	}
	return &http.Client{Transport: transport, Timeout: 45 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}, func() { transport.CloseIdleConnections(); stop() }, nil
}
func subscriptionURL(raw string) error {
	u, e := url.Parse(raw)
	if e != nil || u.Hostname() == "" || (u.Scheme != "http" && u.Scheme != "https") || u.User != nil {
		return fail("manual_source_invalid")
	}
	host := strings.ToLower(strings.TrimSuffix(u.Hostname(), "."))
	if host == "localhost" {
		return fail("blocked_download_destination")
	}
	for _, suffix := range []string{".localhost", ".local", ".lan", ".home.arpa"} {
		if strings.HasSuffix(host, suffix) {
			return fail("blocked_download_destination")
		}
	}
	if ip, e := netip.ParseAddr(host); e == nil && !publicIP(ip) {
		return fail("blocked_download_destination")
	}
	return nil
}
func (a *App) fetchSubscriptions(ctx context.Context, path string) (result SubscriptionResult, err error) {
	ctx, cancel := context.WithTimeout(ctx, 4*time.Minute)
	defer cancel()
	l, e := a.acquireLease(ctx, true)
	if e != nil {
		return result, e
	}
	defer func() {
		if e := l.Release(); err == nil && e != nil {
			result.OK = false
			err = e
		}
	}()
	var request SubscriptionFetch
	if e = readJSON(path, &request); e != nil {
		return result, fail("request_json_invalid")
	}
	seen := map[string]bool{}
	for _, s := range request.Sources {
		if !regexp.MustCompile(`^Provider[1-9][0-9]*$`).MatchString(s.Name) || seen[s.Name] {
			return result, fail("manual_source_invalid")
		}
		seen[s.Name] = true
		if e = subscriptionURL(s.URL); e != nil {
			return result, e
		}
	}
	if len(request.Sources) == 0 {
		return result, fail("subscription_empty")
	}
	s, e := a.subscriptionSettings()
	if e != nil {
		return result, e
	}
	b, directErr := run(ctx, 90*time.Second, l.Env(""), "sh", "-c", `"$1" fetch-batch "$2"; exit 0`, "sh", a.Root+"/Scripts/clashctl_arm64", path)
	for _, line := range strings.Split(string(b), "\n") {
		if strings.HasPrefix(line, "F50_FETCH_RESULT=") {
			_ = json.Unmarshal([]byte(strings.TrimPrefix(line, "F50_FETCH_RESULT=")), &result)
		}
	}
	if directErr == nil && result.OK && result.Committed {
		return result, nil
	}
	if len(s.Rescue) == 0 {
		return result, fail("subscription_download_failed")
	}
	for _, p := range result.Providers {
		if p.StatusCode >= 300 && p.StatusCode < 500 && p.StatusCode != 403 && p.StatusCode != 408 && p.StatusCode != 429 {
			return result, fail("subscription_download_rejected")
		}
	}
	if e = l.Check(); e != nil {
		return result, e
	}
	work, e := a.newWork("subscription-rescue-")
	if e != nil {
		return result, e
	}
	defer secureRemove(work)
	client, stop, e := a.rescueClient(ctx, work, s.Rescue)
	if e != nil {
		return result, e
	}
	defer stop()
	result = SubscriptionResult{Rescued: true}
	cache := make([][]byte, len(request.Sources))
	for i, s := range request.Sources {
		req, e := http.NewRequestWithContext(ctx, "GET", s.URL, nil)
		if e != nil {
			return result, e
		}
		req.Header.Set("User-Agent", request.UserAgent)
		resp, e := client.Do(req)
		if e != nil {
			return result, fail("subscription_download_failed")
		}
		body, e := io.ReadAll(io.LimitReader(resp.Body, maxConfig+1))
		resp.Body.Close()
		if e != nil || int64(len(body)) > maxConfig {
			return result, fail("download_incomplete")
		}
		if resp.StatusCode != http.StatusOK {
			return result, fail("subscription_download_rejected")
		}
		input := fmt.Sprintf("%s/input-%d", work, i)
		output := fmt.Sprintf("%s/provider-%d.yaml", work, i)
		if e = atomicWrite(input, body, 0600); e != nil {
			return result, e
		}
		nodes, format, e := a.convertSubscription(ctx, input, output)
		if e != nil {
			return result, e
		}
		test := fmt.Sprintf("%s/test-%d.json", work, i)
		if e = writeJSON(test, map[string]any{"proxies": nodes, "rules": []string{"MATCH,DIRECT"}}); e != nil {
			return result, e
		}
		if e = a.testCore(ctx, test); e != nil {
			return result, e
		}
		cache[i], e = readFile(output, maxConfig)
		if e != nil {
			return result, e
		}
		result.Providers = append(result.Providers, SubscriptionProvider{Name: s.Name, ProxyCount: len(nodes), StatusCode: 200, Format: format})
	}
	if e = a.commitSubscriptionCaches(l, request.Sources, cache); e != nil {
		return result, e
	}
	for i := range result.Providers {
		result.Providers[i].OK = true
	}
	result.OK = true
	result.Committed = true
	return result, nil
}
func (a *App) commitSubscriptionCaches(l *Lease, sources []SubscriptionSource, cache [][]byte) error {
	dir := a.Root + "/Proxy/proxies"
	if e := privateDir(dir); e != nil {
		return e
	}
	before := make([][]byte, len(sources))
	had := make([]bool, len(sources))
	for i, s := range sources {
		b, e := readFile(dir+"/"+s.Name+".yaml", maxConfig)
		if e != nil && !os.IsNotExist(e) {
			return e
		}
		before[i] = b
		had[i] = e == nil
	}
	for i, s := range sources {
		if e := l.Check(); e != nil {
			return e
		}
		e := a.point("subscription_commit")
		if e == nil {
			e = atomicWrite(dir+"/"+s.Name+".yaml", cache[i], 0600)
		}
		if e != nil {
			for j := i; j >= 0; j-- {
				if re := l.Check(); re != nil {
					return re
				}
				p := dir + "/" + sources[j].Name + ".yaml"
				var re error
				if had[j] {
					re = atomicWrite(p, before[j], 0600)
				} else {
					re = os.Remove(p)
					if os.IsNotExist(re) {
						re = nil
					}
				}
				if re != nil {
					return fail("subscription_cache_restore_failed")
				}
			}
			return e
		}
	}
	return nil
}

func (a *App) updateLocalSubscriptions(ctx context.Context) (err error) {
	l, e := a.acquireLease(ctx, false)
	if e != nil {
		return e
	}
	defer func() {
		if e := l.Release(); err == nil && e != nil {
			err = e
		}
	}()
	pid, e := a.corePID()
	if e != nil {
		return e
	}
	if pid == 0 || exists(a.Root+"/Policy/stopped") {
		return fail("auto_paused_core_stopped")
	}
	config, e := a.readYAML(ctx, a.cfg())
	if e != nil {
		return e
	}
	// Gist owns its configured sources and schedule; this job only refreshes saved local Provider slots.
	if config[gistMeta] == true {
		return fail("subscription_managed_by_gist")
	}
	b, e := readFile(a.sourcesPath(), 1<<20)
	if e != nil {
		return e
	}
	request := SubscriptionFetch{UserAgent: "clash.meta"}
	ua, e := readFile(a.Root+"/Tools/sub_user_agent.conf", 2048)
	if e != nil && !os.IsNotExist(e) {
		return e
	}
	if value := strings.TrimSpace(strings.SplitN(strings.ReplaceAll(string(ua), "\r", ""), "\n", 2)[0]); value != "" {
		value = strings.TrimSpace(strings.TrimPrefix(value, "KANO_SUB_USER_AGENT="))
		request.UserAgent = strings.Trim(value, "\"'")
	}
	defs := obj(config["proxy-providers"])
	coreManaged := 0
	for _, line := range strings.Split(string(b), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 || strings.HasPrefix(fields[0], "#") {
			continue
		}
		name := fields[1]
		p := obj(defs[name])
		if str(p["type"]) == "file" && str(p["path"]) == "./proxies/"+name+".yaml" {
			request.Sources = append(request.Sources, SubscriptionSource{Name: name, URL: fields[0]})
		} else if str(p["type"]) == "http" && str(p["url"]) != "" {
			coreManaged++
		}
	}
	if len(request.Sources) == 0 {
		// HTTP providers carry their own interval, so the core already refreshes them; only
		// file providers need this job to download. Report that instead of a failure.
		if coreManaged > 0 {
			return fail("subscription_core_managed")
		}
		return fail("subscription_no_local_sources")
	}
	work, e := a.newWork("subscription-auto-")
	if e != nil {
		return e
	}
	defer secureRemove(work)
	path := work + "/request.json"
	if e = writeJSON(path, request); e != nil {
		return e
	}
	// Borrow the same device lease through the child, just as the browser's local-conversion request does.
	output, e := run(ctx, 5*time.Minute, l.Env(""), a.Root+"/Tools/kano-gist-sync", "subscription-fetch", path)
	if e != nil {
		return fail("subscription_download_failed")
	}
	var fetched SubscriptionResult
	if json.Unmarshal(output, &fetched) != nil || !fetched.OK || !fetched.Committed {
		return fail("subscription_download_failed")
	}
	for _, s := range request.Sources {
		if e = l.Check(); e != nil {
			return e
		}
		if _, e = a.api(ctx, str(config["secret"]), "PUT", "/providers/proxies/"+url.PathEscape(s.Name), nil); e != nil {
			return e
		}
		loaded, e := a.api(ctx, str(config["secret"]), "GET", "/providers/proxies/"+url.PathEscape(s.Name), nil)
		if e != nil {
			return e
		}
		nodes, ok := loaded["proxies"].([]any)
		if !ok || len(nodes) == 0 {
			return fail("manual_provider_empty")
		}
		for _, provider := range fetched.Providers {
			if provider.Name == s.Name && len(nodes) != provider.ProxyCount {
				return fail("manual_provider_update_failed")
			}
		}
	}
	return nil
}
func (a *App) startSubscriptionDaemon(ctx context.Context) error {
	s, e := a.subscriptionSettings()
	if e != nil {
		return e
	}
	var r processRecord
	if !s.Auto || !exists(a.subscriptionSettingsPath()) {
		if readJSON(a.runtime()+"/subscription-daemon.json", &r) == nil && r.Alive() {
			return a.stopRecord(ctx, r)
		}
		return nil
	}
	if readJSON(a.runtime()+"/subscription-daemon.json", &r) == nil && r.Alive() {
		return nil
	}
	if e = a.spawn("subscription-daemon"); e != nil {
		return e
	}
	for i := 0; i < 40; i++ {
		if readJSON(a.runtime()+"/subscription-daemon.json", &r) == nil && r.Alive() {
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
func (a *App) subscriptionDaemon(ctx context.Context) error {
	lock, e := lockFile(a.runtime() + "/subscription-daemon.lock")
	if e != nil {
		return e
	}
	defer lock.Close()
	if e = writeJSON(a.runtime()+"/subscription-daemon.json", selfRecord()); e != nil {
		return e
	}
	defer os.Remove(a.runtime() + "/subscription-daemon.json")
	for {
		s, e := a.subscriptionSettings()
		if e != nil {
			return e
		}
		if !s.Auto || !exists(a.subscriptionSettingsPath()) {
			return nil
		}
		var st SubscriptionState
		if e = readJSON(a.Root+"/Tools/subscription-state.json", &st); e != nil && !os.IsNotExist(e) {
			return e
		}
		base := s.SavedAt
		interval := time.Duration(s.IntervalHours) * time.Hour
		if st.CheckedAt.After(base) {
			base = st.CheckedAt
			switch st.Code {
			case "auto_paused_core_stopped", "operation_busy", "installation_busy", "busy",
				"subscription_download_failed", "download_incomplete", "timeout":
				interval = 5 * time.Minute
			}
		}
		now := time.Now()
		if !now.Before(base.Add(interval)) {
			e = a.updateLocalSubscriptions(ctx)
			if e = writeJSON(a.Root+"/Tools/subscription-state.json", SubscriptionState{CheckedAt: time.Now().UTC(), Code: code(e)}); e != nil {
				return e
			}
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(5 * time.Second):
		}
	}
}
