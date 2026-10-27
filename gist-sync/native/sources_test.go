package main

import (
	"context"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
)

func sourceConfig() map[string]any {
	return map[string]any{
		"proxy-providers": map[string]any{"remote": map[string]any{"type": "http", "url": "https://example.test/remote?token=a", "path": "./proxies/remote.yaml", "filter": "HK"}},
		"proxies":         []any{map[string]any{"name": "inline", "type": "ss", "server": "example.test", "port": 443, "cipher": "aes-128-gcm", "password": "fixture"}},
		"proxy-groups": []any{
			map[string]any{"name": "main", "type": "select", "proxies": []any{"auto", "DIRECT"}},
			map[string]any{"name": "auto", "type": "url-test", "use": []any{"remote"}, "proxies": []any{"inline"}, "filter": "HK", "url": "https://example.test/check", "interval": 300},
			map[string]any{"name": "direct", "type": "select", "proxies": []any{"DIRECT"}},
			map[string]any{"name": "all", "type": "select", "include-all": true},
		},
		"rules": []any{"MATCH,main"},
	}
}

func TestManualSourcesMergePreservesGistAndDeduplicates(t *testing.T) {
	sources := []ManualSource{{"https://EXAMPLE.test:443/remote?token=a#alias", true}, {"https://example.test/manual?token=b", true}, {"https://example.test/manual?token=b#alias", true}, {"https://example.test/disabled", false}}
	var expected string
	for i := 0; i < 50; i++ {
		m := sourceConfig()
		original := clone(m).(map[string]any)
		if e := mergeManualSources(m, sources); e != nil {
			t.Fatal(e)
		}
		providers := obj(m["proxy-providers"])
		if len(providers) != 2 || !same(providers["remote"], obj(original["proxy-providers"])["remote"]) {
			t.Fatal("remote overwritten or duplicate URL")
		}
		if !same(m["rules"], original["rules"]) || !same(m["proxies"], original["proxies"]) {
			t.Fatal("remote rules/nodes changed")
		}
		groups := m["proxy-groups"].([]any)
		refs, _ := stringList(obj(groups[1])["use"])
		if len(refs) != 2 || refs[0] != "remote" || obj(groups[1])["filter"] != "HK" {
			t.Fatal("group references/filter replaced")
		}
		for _, n := range []int{0, 2, 3} {
			if !same(groups[n], original["proxy-groups"].([]any)[n]) {
				t.Fatal("unrelated group modified")
			}
		}
		if expected != "" && expected != canonical(m) {
			t.Fatal("unstable overlay across syncs")
		}
		expected = canonical(m)
	}
	m := sourceConfig()
	if e := mergeManualSources(m, nil); e != nil {
		t.Fatal(e)
	}
	if len(obj(m["proxy-providers"])) != 1 || has(m, manualMeta) {
		t.Fatal("removal left managed providers")
	}
}

func TestManualSourcesCollisionsAndInlineOnly(t *testing.T) {
	u := "https://example.test/manual"
	name := "GistManual_" + hashBytes([]byte(u))[:16]
	m := sourceConfig()
	obj(m["proxy-providers"])[name] = map[string]any{"type": "file", "path": "./proxies/original.yaml"}
	if e := mergeManualSources(m, []ManualSource{{u, true}}); e != nil {
		t.Fatal(e)
	}
	if !has(obj(m["proxy-providers"]), name+"_") || str(obj(obj(m["proxy-providers"])[name])["path"]) != "./proxies/original.yaml" {
		t.Fatal("provider name collision overwrote original")
	}
	m = sourceConfig()
	delete(m, "proxy-providers")
	m["proxy-groups"] = []any{map[string]any{"name": "main", "type": "select", "proxies": []any{"inline"}}}
	if e := mergeManualSources(m, []ManualSource{{u, true}}); e != nil {
		t.Fatal(e)
	}
	if len(obj(m["proxy-groups"].([]any)[0])["use"].([]any)) != 1 || len(m["proxies"].([]any)) != 1 {
		t.Fatal("inline nodes not retained/connected")
	}
}

func TestManualSourcesStoredOnceAndValidated(t *testing.T) {
	a := fixture(t)
	if e := a.saveManualSources([]ManualSource{{"https://EXAMPLE.test:443/a#one", true}, {"https://example.test/a#two", true}, {"https://example.test/off", false}}); e != nil {
		t.Fatal(e)
	}
	s, e := a.manualSources()
	if e != nil || len(s) != 2 || s[1].Enabled {
		t.Fatal("source settings roundtrip", e)
	}
	st, _ := os.Stat(a.sourcesPath())
	if st.Mode().Perm() != 0600 {
		t.Fatal("source credentials permissions")
	}
	before, _ := fileHash(a.sourcesPath())
	for _, u := range []string{"", "file:///tmp/x", "https://example.test/a\nhttps://evil.test/", "https://", "http://a.test/a b"} {
		if e := a.saveManualSources([]ManualSource{{u, true}}); code(e) != "manual_source_invalid" {
			t.Fatal("invalid source accepted")
		}
		after, _ := fileHash(a.sourcesPath())
		if after != before {
			t.Fatal("invalid save replaced settings")
		}
	}
	if e := os.Remove(a.sourcesPath()); e != nil {
		t.Fatal(e)
	}
	if e := os.Symlink(a.cfg(), a.sourcesPath()); e != nil {
		t.Fatal(e)
	}
	if _, e := a.manualSources(); code(e) != "manual_sources_unreadable" {
		t.Fatal("symlink read accepted")
	}
}

func TestManualSourcesConcurrentFileEditCannotCommit(t *testing.T) {
	a := fixture(t)
	ctx := context.Background()
	saveFixture(t, a)
	a.Hook = func(point string) error {
		if point == "before_commit" {
			return os.WriteFile(a.sourcesPath(), []byte("https://example.test/changed\n"), 0600)
		}
		return nil
	}
	before, _ := fileHash(a.cfg())
	out, e := a.syncConfig(ctx, Request{}, false)
	if code(e) != "manual_sources_changed" || out.Written {
		t.Fatalf("race result: %s %+v", code(e), out)
	}
	after, _ := fileHash(a.cfg())
	if before != after {
		t.Fatal("race changed config")
	}
	if b, _ := os.ReadFile(a.sourcesPath()); !strings.Contains(string(b), "changed") {
		t.Fatal("new desired sources lost")
	}
}

func TestManualProviderPlaceholderIsNotALoadedNode(t *testing.T) {
	for _, v := range []any{nil, map[string]any{}, map[string]any{"proxies": []any{}}, map[string]any{"proxies": []any{map[string]any{"name": "COMPATIBLE", "type": "Direct"}}}} {
		if manualProviderReady(v) {
			t.Fatal("missing/placeholder nodes reported loaded")
		}
	}
	if !manualProviderReady(map[string]any{"proxies": []any{map[string]any{"name": "actual", "type": "Shadowsocks"}}}) {
		t.Fatal("real node rejected")
	}
}

func TestManualSourcesFollowActivationTransaction(t *testing.T) {
	for _, stage := range []string{"core_test", "after_commit", "before_state_record", "state_write", "finalize"} {
		t.Run(stage, func(t *testing.T) {
			a := fixture(t)
			ctx := context.Background()
			saveFixture(t, a)
			if e := a.saveManualSources([]ManualSource{{"https://old.example.test/sub", true}}); e != nil {
				t.Fatal(e)
			}
			before, _ := fileHash(a.sourcesPath())
			configBefore, _ := fileHash(a.cfg())
			s, _ := a.readSettings()
			sources := []ManualSource{{"https://new.example.test/sub", true}}
			a.Hook = func(point string) error {
				if point == stage {
					return fail("activation_injected")
				}
				return nil
			}
			out, e := a.syncConfig(ctx, Request{Revision: &s.Revision, ManualSources: &sources}, false)
			if code(e) != "activation_injected" || out.OK {
				t.Fatal(out, e)
			}
			after, _ := fileHash(a.sourcesPath())
			if stage == "core_test" || stage == "after_commit" {
				configAfter, _ := fileHash(a.cfg())
				if before != after || configBefore != configAfter || exists(a.journalDir()) {
					t.Fatal("failed activation changed the source list or configuration")
				}
				return
			}
			if stage == "before_state_record" && before != after {
				t.Fatal("unfinalized activation published source settings")
			}
			a.Hook = nil
			a.HTTPClient = doFunc(func(*http.Request) (*http.Response, error) {
				t.Fatal("finalization downloaded the configuration again")
				return nil, io.EOF
			})
			out, e = a.syncConfig(ctx, Request{}, false)
			stored, se := a.manualSources()
			if e != nil || se != nil || !out.OK || out.Code != "commit_finalized" || exists(a.journalDir()) || len(stored) != 1 || stored[0] != sources[0] {
				t.Fatal("source settings did not follow recovered activation", out, e, se)
			}
		})
	}
}

func TestManualSourcesNoopPublishesDisabledAndEmptyLists(t *testing.T) {
	a := fixture(t)
	ctx := context.Background()
	saveFixture(t, a)
	s, _ := a.readSettings()
	for i, sources := range [][]ManualSource{{{"https://one.example.test/sub", false}}, {{"https://two.example.test/sub", false}}, {}} {
		before, _ := fileHash(a.cfg())
		out, e := a.syncConfig(ctx, Request{Revision: &s.Revision, ManualSources: &sources}, false)
		stored, se := a.manualSources()
		if e != nil || se != nil || !out.OK || !same(stored, sources) {
			t.Fatal(out, e, se)
		}
		if i > 0 {
			after, _ := fileHash(a.cfg())
			if out.Code != "up_to_date" || out.Written || before != after || exists(a.journalDir()) {
				t.Fatal("source-only save rewrote the configuration", out)
			}
		}
	}
}

func TestManualSourcesFinalizePreservesConcurrentEdit(t *testing.T) {
	a := fixture(t)
	ctx := context.Background()
	saveFixture(t, a)
	s, _ := a.readSettings()
	external := []ManualSource{{"https://external.example.test/sub", true}}
	a.Hook = func(point string) error {
		if point == "before_state_record" {
			return a.saveManualSources(external)
		}
		return nil
	}
	sources := []ManualSource{{"https://new.example.test/sub", true}}
	out, e := a.syncConfig(ctx, Request{Revision: &s.Revision, ManualSources: &sources}, false)
	stored, _ := a.manualSources()
	if code(e) != "manual_sources_changed" || out.OK || out.Code != "committed_pending_finalize" || !same(stored, external) {
		t.Fatal("concurrent source edit was overwritten", out, e)
	}
}
