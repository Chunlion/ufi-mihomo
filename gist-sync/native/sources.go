// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

const manualMeta = "x-f50-gist-manual-providers"
const gistMeta = "x-f50-gist-sync"

type ManualSource struct {
	URL     string `json:"url"`
	Enabled bool   `json:"enabled"`
}

func sourceURL(raw string) (string, error) {
	if strings.ContainsAny(raw, " \t\r\n") || len(raw) > 8192 {
		return "", fail("manual_source_invalid")
	}
	u, e := url.Parse(raw)
	if e != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Hostname() == "" || u.Opaque != "" {
		return "", fail("manual_source_invalid")
	}
	u.Fragment = ""
	u.Host = strings.ToLower(u.Host)
	if (u.Scheme == "https" && u.Port() == "443") || (u.Scheme == "http" && u.Port() == "80") {
		u.Host = strings.TrimSuffix(u.Host, ":"+u.Port())
	}
	if u.Path == "" {
		u.Path = "/"
	}
	return u.String(), nil
}

func (a *App) sourcesPath() string { return a.Root + "/Proxy/subscription_urls.txt" }

func (a *App) manualSources() ([]ManualSource, error) {
	b, e := readFile(a.sourcesPath(), 1<<20)
	if os.IsNotExist(e) {
		return nil, nil
	}
	if e != nil {
		return nil, fail("manual_sources_unreadable")
	}
	sources := []ManualSource{}
	for _, line := range strings.Split(string(b), "\n") {
		line = strings.TrimSpace(line)
		enabled := !strings.HasPrefix(line, "# KANO_SUB_DISABLED ")
		if !enabled {
			line = strings.TrimPrefix(line, "# KANO_SUB_DISABLED ")
		}
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		sources = append(sources, ManualSource{strings.Fields(line)[0], enabled})
	}
	return sources, nil
}

func encodeManualSources(sources []ManualSource) ([]byte, error) {
	if len(sources) > 100 {
		return nil, fail("manual_source_limit")
	}
	text := "# KANO_SUB_RULE_MODE=template\n# KANO_SUB_CONVERT_MODE=provider\n"
	seen := map[string]bool{}
	for _, source := range sources {
		u, e := sourceURL(source.URL)
		if e != nil {
			return nil, e
		}
		if seen[u] {
			continue
		}
		seen[u] = true
		if !source.Enabled {
			text += "# KANO_SUB_DISABLED "
		}
		text += u + "\n"
	}
	return []byte(text), nil
}

func (a *App) saveManualSources(sources []ManualSource) error {
	data, e := encodeManualSources(sources)
	if e != nil {
		return e
	}
	return atomicWrite(a.sourcesPath(), data, 0600)
}

// Rebuild from the downloaded document, never from last sync's additions.
func mergeManualSources(config map[string]any, sources []ManualSource) error {
	delete(config, manualMeta)
	providers := obj(config["proxy-providers"])
	if has(config, "proxy-providers") && providers == nil {
		return fail("provider_mapping_required")
	}
	if providers == nil {
		providers = map[string]any{}
	}
	seen := map[string]bool{}
	paths := map[string]bool{}
	for _, raw := range providers {
		paths[filepath.Base(str(obj(raw)["path"]))] = true
		if u, e := sourceURL(str(obj(raw)["url"])); e == nil {
			seen[u] = true
		}
	}
	for _, raw := range obj(config["x-f50-provider-sources"]) {
		u := str(raw)
		if m := obj(raw); m != nil {
			u = str(m["url"])
		}
		if u, e := sourceURL(u); e == nil {
			seen[u] = true
		}
	}
	added := []string{}
	for _, source := range sources {
		if !source.Enabled {
			continue
		}
		u, e := sourceURL(source.URL)
		if e != nil {
			return e
		}
		if seen[u] {
			continue
		}
		seen[u] = true
		name := "GistManual_" + hashBytes([]byte(u))[:16]
		for has(providers, name) || paths[name+".yaml"] {
			name += "_"
		}
		providers[name] = map[string]any{"type": "http", "url": u, "path": "./proxies/" + name + ".yaml", "interval": 3600, "proxy": "DIRECT",
			"health-check": map[string]any{"enable": true, "url": "https://www.gstatic.com/generate_204", "interval": 300, "lazy": true}}
		added = append(added, name)
	}
	if len(added) == 0 {
		return nil
	}
	config["proxy-providers"] = providers
	config[manualMeta] = anyList(added)
	groups, e := array(config["proxy-groups"])
	if config["proxy-groups"] == nil {
		groups, e = []any{}, nil
	}
	if e != nil {
		return e
	}
	nodes := map[string]bool{}
	if list, ok := config["proxies"].([]any); ok {
		for _, p := range list {
			nodes[str(obj(p)["name"])] = true
		}
	}
	used := false
	for _, raw := range groups {
		g := obj(raw)
		switch str(g["type"]) {
		case "select", "url-test", "fallback", "load-balance":
		default:
			continue
		}
		if g["include-all"] == true || g["include-all-providers"] == true {
			used = true
			continue
		}
		refs, e := stringList(g["use"])
		if e != nil {
			return e
		}
		ps, e := stringList(g["proxies"])
		if e != nil {
			return e
		}
		eligible := len(refs) > 0
		for _, n := range ps {
			eligible = eligible || nodes[n]
		}
		if !eligible {
			continue
		}
		for _, name := range added {
			found := false
			for _, n := range refs {
				found = found || n == name
			}
			if !found {
				refs = append(refs, name)
			}
		}
		g["use"] = anyList(refs)
		used = true
	}
	if !used {
		name := "手动订阅"
		for {
			collision := nodes[name]
			for _, raw := range groups {
				collision = collision || str(obj(raw)["name"]) == name
			}
			if !collision {
				break
			}
			name += "_"
		}
		groups = append(groups, map[string]any{"name": name, "type": "select", "use": anyList(added)})
	}
	config["proxy-groups"] = groups
	return nil
}
