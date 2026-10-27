// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

func (a *App) api(ctx context.Context, secret, method, path string, body any) (map[string]any, error) {
	var data []byte
	if body != nil {
		data = jsonBytes(body)
	}
	req, e := http.NewRequestWithContext(ctx, method, "http://127.0.0.1:7788"+path, bytes.NewReader(data))
	if e != nil {
		return nil, e
	}
	req.Header.Set("Authorization", "Bearer "+secret)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 25 * time.Second, Transport: &http.Transport{Proxy: nil, DisableKeepAlives: true}, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	resp, e := client.Do(req)
	if e != nil {
		return nil, fail("controller_unreachable")
	}
	defer resp.Body.Close()
	b, e := io.ReadAll(io.LimitReader(resp.Body, maxConfig+1))
	if e != nil || int64(len(b)) > maxConfig {
		return nil, fail("controller_response_invalid")
	}
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return nil, fail("controller_request_rejected")
	}
	if len(bytes.TrimSpace(b)) == 0 {
		return map[string]any{}, nil
	}
	v, e := parseJSON(b)
	if e != nil || obj(v) == nil {
		return nil, fail("controller_response_invalid")
	}
	return obj(v), nil
}
func (a *App) runtimeVerify(ctx context.Context, m map[string]any) error {
	if e := a.point("runtime_verify"); e != nil {
		return e
	}
	pid, e := a.corePID()
	if e != nil {
		return e
	}
	if pid == 0 {
		return fail("core_not_running")
	}
	got, e := a.api(ctx, str(m["secret"]), "GET", "/configs", nil)
	if e != nil {
		return e
	}
	for _, k := range []string{"port", "socks-port", "mixed-port", "tproxy-port", "allow-lan", "ipv6", "mode", "unified-delay"} {
		expected, ok := m[k]
		if !ok {
			continue
		}
		actual, ok := got[k]
		if !ok || string(jsonBytes(actual)) != string(jsonBytes(expected)) {
			return fail("runtime_config_mismatch")
		}
	}
	// Follow the same private-route selection proof as kprVerifySelection(), not a node-count guess.
	if meta := obj(m["x-kano-private-route"]); meta != nil {
		proxies, e := a.api(ctx, str(m["secret"]), "GET", "/proxies", nil)
		if e != nil {
			return e
		}
		if e = resolveSelection(obj(proxies["proxies"]), str(meta["policy"])); e != nil {
			return e
		}
	}
	manual, e := stringList(m[manualMeta])
	if e != nil {
		return e
	}
	if len(manual) > 0 {
		loaded, e := a.api(ctx, str(m["secret"]), "GET", "/providers/proxies", nil)
		if e != nil {
			return e
		}
		for _, name := range manual {
			if manualProviderReady(obj(loaded["providers"])[name]) {
				continue
			}
			if _, e = a.api(ctx, str(m["secret"]), "PUT", "/providers/proxies/"+url.PathEscape(name), nil); e != nil {
				return fail("manual_provider_update_failed")
			}
			loaded, e = a.api(ctx, str(m["secret"]), "GET", "/providers/proxies", nil)
			if e != nil {
				return e
			}
			if !manualProviderReady(obj(loaded["providers"])[name]) {
				return fail("manual_provider_empty")
			}
		}
	}
	return nil
}

func manualProviderReady(value any) bool {
	p := obj(value)
	nodes, ok := p["proxies"].([]any)
	if !ok {
		return false
	}
	for _, node := range nodes {
		n := obj(node)
		if str(n["name"]) != "" && !(str(n["name"]) == "COMPATIBLE" && strings.EqualFold(str(n["type"]), "Direct")) {
			return true
		}
	}
	return false
}
func resolveSelection(proxies map[string]any, name string) error {
	seen := map[string]bool{}
	for {
		if seen[name] {
			return fail("private_route_selection_cycle")
		}
		seen[name] = true
		switch strings.ToUpper(name) {
		case "DIRECT", "REJECT", "REJECT-DROP", "PASS", "COMPATIBLE":
			return fail("private_route_not_proxy")
		}
		p := obj(proxies[name])
		if p == nil {
			return fail("private_route_target_unloaded")
		}
		if next := str(p["now"]); next != "" {
			name = next
			continue
		}
		t := strings.ToLower(str(p["type"]))
		switch t {
		case "direct", "reject", "reject-drop", "pass", "compatible":
			return fail("private_route_not_proxy")
		}
		t = strings.NewReplacer("-", "", "_", "").Replace(t)
		if _, ok := p["all"].([]any); ok || regexp.MustCompile(`^(selector|select|urltest|fallback|loadbalance|relay)$`).MatchString(t) {
			return fail("private_route_selection_unknown")
		}
		return nil
	}
}
func (a *App) applyRuntime(ctx context.Context, l *Lease, tx string, m map[string]any) error {
	if e := l.Check(); e != nil {
		return e
	}
	hot := a.point("hot_reload")
	if hot == nil {
		_, hot = a.api(ctx, str(m["secret"]), "PUT", "/configs?force=true", map[string]string{"path": a.cfg()})
	}
	if hot != nil {
		if e := a.point("restart"); e != nil {
			return e
		}
		if e := a.service(ctx, l, tx, "restart"); e != nil {
			return e
		}
	}
	if e := l.Check(); e != nil {
		return e
	}
	// The pinned Service wrapper owns TUN route repair and IPv6 DNS compatibility.
	if e := a.point("policy_apply"); e != nil {
		return e
	}
	mode := str(m["mode"])
	if mode == "" {
		mode = "rule"
	}
	if _, e := a.api(ctx, str(m["secret"]), "PATCH", "/configs", map[string]string{"mode": mode}); e != nil {
		return e
	}
	if e := a.service(ctx, l, tx, "policy", "apply"); e != nil {
		return e
	}
	if e := a.service(ctx, l, tx, "policy", "verify"); e != nil {
		return e
	}
	return a.runtimeVerify(ctx, m)
}
