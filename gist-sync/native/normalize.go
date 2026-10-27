// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"net/netip"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// Generated from the uploaded plugin, not a separately maintained port table.
//
//go:embed profiles.json
var profileJSON []byte
var profiles map[string]any

func init() {
	v, e := parseJSON(profileJSON)
	if e != nil {
		panic(e)
	}
	profiles = obj(v)
}

var privateRanges = []string{"10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "fc00::/7"}

const privateMeta = "x-kano-private-route"

func same(a, b any) bool                  { return canonical(a) == canonical(b) }
func has(m map[string]any, k string) bool { _, ok := m[k]; return ok }
func array(v any) ([]any, error) {
	a, ok := v.([]any)
	if !ok {
		return nil, fail("yaml_expected_list")
	}
	return a, nil
}
func stringList(v any) ([]string, error) {
	if v == nil {
		return []string{}, nil
	}
	a, e := array(v)
	if e != nil {
		return nil, e
	}
	r := []string{}
	for _, n := range a {
		s, ok := n.(string)
		if !ok {
			return nil, fail("yaml_expected_string_list")
		}
		r = append(r, s)
	}
	return r, nil
}
func anyList(a []string) []any {
	r := make([]any, len(a))
	for i, s := range a {
		r[i] = s
	}
	return r
}
func parseOptions(text string) map[string]string {
	o := map[string]string{"traffic_mode": "", "transparent": "on", "ipv6": "off", "tun_stack": "auto", "quic_block": "off", "dns_hijack": "on", "dns_port": "1053", "tproxy_port": "7895", "proxy_group": "Proxy"}
	for _, line := range strings.Split(text, "\n") {
		k, v, ok := strings.Cut(strings.TrimSuffix(line, "\r"), "=")
		if ok && regexp.MustCompile(`^[A-Za-z0-9_]+$`).MatchString(k) {
			o[k] = v
		}
	}
	switch o["traffic_mode"] {
	case "tproxy", "tun", "off":
	default:
		if o["transparent"] == "off" {
			o["traffic_mode"] = "off"
		} else {
			o["traffic_mode"] = "tproxy"
		}
	}
	o["dns_port"] = "1053"
	o["tproxy_port"] = "7895"
	return o
}

// 网络层里改了会直接断链的键：iptables 的 TPROXY 端口、DNS 劫持端口，以及 TUN 路由参数。
// 其余键（enhanced-mode、nameserver、fake-ip-*、sniffer、profile、端口等）一律跟随来源配置。
var controlledNetworkKeys = map[string][]string{
	"dns": {"enable", "listen"},
	"tun": {"enable", "device", "auto-route", "auto-redirect", "strict-route", "dns-hijack"},
}

// applySourceNetwork 用来源配置覆盖网络层，再把断链键从内置 profile 回填。
// 除 controlledNetworkKeys 之外的字段全部尊重用户配置，不再由插件强制还原。
func applySourceNetwork(out, source map[string]any) map[string]any {
	for _, k := range []string{"dns", "tun", "sniffer", "profile"} {
		user := obj(source[k])
		if user == nil {
			continue
		}
		base := obj(out[k])
		merged := map[string]any{}
		if base != nil {
			merged = clone(base).(map[string]any)
		}
		for key, value := range user {
			merged[key] = clone(value)
		}
		for _, key := range controlledNetworkKeys[k] {
			if base != nil && has(base, key) {
				merged[key] = clone(base[key])
			} else {
				delete(merged, key)
			}
		}
		out[k] = merged
	}
	return out
}
func stripPrivate(config map[string]any) map[string]any {
	out := clone(config).(map[string]any)
	m := obj(out[privateMeta])
	if m == nil {
		return out
	}
	vers := fmt.Sprint(m["version"])
	if vers != "1" && vers != "2" {
		return out
	}
	rules, _ := out["rules"].([]any)
	if rules == nil {
		rules = []any{}
	}
	inserted, _ := m["rules"].([]any)
	prefix := len(inserted) <= len(rules)
	if prefix {
		for i, v := range inserted {
			if !same(v, rules[i]) {
				prefix = false
				break
			}
		}
	}
	if prefix {
		rules = rules[len(inserted):]
	} else {
		for _, v := range inserted {
			for i, r := range rules {
				if same(v, r) {
					rules = append(rules[:i], rules[i+1:]...)
					break
				}
			}
		}
	}
	if len(rules) > 0 || m["rulesPresent"] != false {
		out["rules"] = rules
	} else {
		delete(out, "rules")
	}
	tun := obj(out["tun"])
	for k, v := range obj(m["tun"]) {
		saved := obj(v)
		if tun == nil || saved == nil || !same(tun[k], saved["applied"]) {
			continue
		}
		if saved["present"] == true {
			tun[k] = clone(saved["before"])
		} else {
			delete(tun, k)
		}
	}
	if tun != nil && len(tun) == 0 && m["tunPresent"] == false {
		delete(out, "tun")
	}
	delete(out, privateMeta)
	return out
}
func normalizeConfig(config map[string]any, options map[string]string, connected []string) (map[string]any, error) {
	source := stripPrivate(config)
	mode := options["traffic_mode"]
	if mode == "" {
		mode = "tproxy"
	}
	if mode != "tproxy" && mode != "tun" && mode != "off" {
		return nil, fail("invalid_traffic_mode")
	}
	key := mode + "4"
	if options["ipv6"] == "on" {
		key = mode + "6"
	}
	out := clone(profiles[key]).(map[string]any)
	for k, v := range source {
		switch k {
		case "bind-address", "allow-lan", "external-controller", "tproxy-port", "external-ui-name", "dns", "tun", "sniffer", "profile":
			continue
		}
		out[k] = clone(v)
	}
	applySourceNetwork(out, source)
	ports := map[int]bool{numeric(out["tproxy-port"]): true}
	for _, listen := range []any{obj(out["dns"])["listen"], out["external-controller"]} {
		parts := strings.Split(fmt.Sprint(listen), ":")
		port, _ := strconv.Atoi(parts[len(parts)-1])
		ports[port] = true
	}
	for _, name := range []string{"port", "socks-port", "mixed-port"} {
		port, err := strconv.ParseFloat(strings.TrimSpace(fmt.Sprint(out[name])), 64)
		if err != nil || port <= 0 || port != float64(int(port)) {
			continue
		}
		if ports[int(port)] {
			return nil, fail("local_port_conflict")
		}
		ports[int(port)] = true
	}
	if mode == "tun" {
		stack := options["tun_stack"]
		if stack == "" || stack == "auto" {
			if options["ipv6"] == "on" {
				stack = "gvisor"
			} else {
				stack = "mixed"
			}
		}
		switch stack {
		case "mixed", "gvisor", "system", "mips":
		default:
			return nil, fail("invalid_tun_stack")
		}
		obj(out["tun"])["stack"] = stack
	}
	for _, k := range []string{"proxies", "proxy-groups", "rules"} {
		if has(out, k) {
			if _, e := array(out[k]); e != nil {
				return nil, e
			}
		} else if k == "rules" {
			out[k] = []any{"MATCH,DIRECT"}
		} else {
			out[k] = []any{}
		}
	}
	for _, k := range []string{"proxies", "proxy-groups"} {
		for _, v := range out[k].([]any) {
			if m := obj(v); m != nil {
				delete(m, "interface-name")
				delete(m, "routing-mark")
			}
		}
	}
	for _, k := range []string{"proxy-providers", "rule-providers"} {
		if has(out, k) && obj(out[k]) == nil {
			return nil, fail("provider_mapping_required")
		}
		for _, v := range obj(out[k]) {
			p := obj(v)
			if p == nil {
				return nil, fail("provider_mapping_required")
			}
			if o := obj(p["override"]); o != nil {
				delete(o, "interface-name")
				delete(o, "routing-mark")
			}
			if k == "rule-providers" && p["type"] == "http" {
				p["proxy"] = "DIRECT"
			}
		}
	}
	for _, name := range []string{"cn_domain", "private_domain", "add_direct_domain"} {
		if p := obj(obj(out["rule-providers"])[name]); p != nil && p["behavior"] == "domain" {
			dns := obj(out["dns"])
			policy := obj(dns["nameserver-policy"])
			if policy == nil {
				policy = map[string]any{}
				dns["nameserver-policy"] = policy
			}
			if !has(policy, "rule-set:"+name) {
				policy["rule-set:"+name] = []any{"https://dns.alidns.com/dns-query", "https://doh.pub/dns-query"}
			}
		}
	}
	out["x-f50-profile"] = "8.0.0-compat.2.3"
	return applyPrivate(out, options, connected)
}
func prefix(s string) (netip.Prefix, error) {
	if !strings.Contains(s, "/") {
		a, e := netip.ParseAddr(s)
		if e != nil {
			return netip.Prefix{}, fail("invalid_cidr")
		}
		return netip.PrefixFrom(a, a.BitLen()), nil
	}
	p, e := netip.ParsePrefix(s)
	if e != nil {
		return p, fail("invalid_cidr")
	}
	return p.Masked(), nil
}
func prefixText(p netip.Prefix) string {
	a := p.Addr()
	if !a.Is4In6() {
		return p.String()
	}
	b := a.As16()
	g := make([]string, 8)
	for i := range g {
		g[i] = strconv.FormatUint(uint64(b[2*i])<<8|uint64(b[2*i+1]), 16)
	}
	best, n := -1, 1
	for i := 0; i < 8; {
		if g[i] != "0" {
			i++
			continue
		}
		j := i
		for j < 8 && g[j] == "0" {
			j++
		}
		if j-i > n {
			best, n = i, j-i
		}
		i = j
	}
	v := strings.Join(g, ":")
	if best >= 0 {
		v = strings.Join(g[:best], ":") + "::" + strings.Join(g[best+n:], ":")
	}
	return v + "/" + strconv.Itoa(p.Bits())
}
func compactCIDR(values []string) ([]string, error) {
	ps := []netip.Prefix{}
	for _, s := range values {
		p, e := prefix(s)
		if e != nil {
			return nil, e
		}
		ps = append(ps, p)
	}
	sort.Slice(ps, func(i, j int) bool {
		a, b := ps[i], ps[j]
		if a.Addr().BitLen() != b.Addr().BitLen() {
			return a.Addr().BitLen() < b.Addr().BitLen()
		}
		if a.Bits() != b.Bits() {
			return a.Bits() < b.Bits()
		}
		return a.Addr().Less(b.Addr())
	})
	out := []netip.Prefix{}
	for _, p := range ps {
		covered := false
		for _, q := range out {
			if q.Bits() <= p.Bits() && q.Contains(p.Addr()) {
				covered = true
				break
			}
		}
		if !covered {
			out = append(out, p)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		a, b := out[i], out[j]
		if a.Addr().BitLen() != b.Addr().BitLen() {
			return a.Addr().BitLen() < b.Addr().BitLen()
		}
		if a.Addr() != b.Addr() {
			return a.Addr().Less(b.Addr())
		}
		return a.Bits() < b.Bits()
	})
	r := []string{}
	for _, p := range out {
		r = append(r, prefixText(p))
	}
	return r, nil
}
func subtractPrefix(base, cut netip.Prefix) []netip.Prefix {
	if !base.Overlaps(cut) {
		return []netip.Prefix{base}
	}
	if cut.Bits() <= base.Bits() {
		return nil
	}
	bits := base.Bits() + 1
	left := netip.PrefixFrom(base.Addr(), bits)
	a := base.Addr()
	var right netip.Addr
	if a.Is4() {
		b := a.As4()
		b[base.Bits()/8] |= 1 << uint(7-base.Bits()%8)
		right = netip.AddrFrom4(b)
	} else {
		b := a.As16()
		b[base.Bits()/8] |= 1 << uint(7-base.Bits()%8)
		right = netip.AddrFrom16(b)
	}
	return append(subtractPrefix(left, cut), subtractPrefix(netip.PrefixFrom(right, bits), cut)...)
}
func subtractCIDR(bases, cuts []string) ([]string, error) {
	r, e := compactCIDR(bases)
	if e != nil {
		return nil, e
	}
	for _, s := range cuts {
		cut, e := prefix(s)
		if e != nil {
			return nil, e
		}
		next := []string{}
		for _, b := range r {
			p, _ := prefix(b)
			for _, q := range subtractPrefix(p, cut) {
				next = append(next, prefixText(q))
			}
		}
		if len(next) > 4096 {
			return nil, fail("cidr_expansion_limit")
		}
		r = next
	}
	return compactCIDR(r)
}
func applyPrivate(out map[string]any, o map[string]string, connected []string) (map[string]any, error) {
	enabled := o["private_route_enabled"] == "on"
	mode := o["traffic_mode"]
	if mode == "" {
		mode = "tproxy"
	}
	text := regexp.MustCompile(`#[^\n]*`).ReplaceAllString(o["private_route_cidrs"], "")
	fields := strings.FieldsFunc(text, func(r rune) bool { return r == ' ' || r == '\t' || r == '\r' || r == '\n' || r == ',' || r == ';' })
	if len(fields) > 64 {
		return nil, fail("private_cidr_limit")
	}
	cidrs, e := compactCIDR(fields)
	if e != nil {
		return nil, e
	}
	for _, s := range cidrs {
		p, _ := prefix(s)
		valid := false
		for _, v := range privateRanges {
			q, _ := prefix(v)
			if q.Bits() <= p.Bits() && q.Contains(p.Addr()) {
				valid = true
				break
			}
		}
		if !valid {
			return nil, fail("private_cidr_required")
		}
	}
	policy := strings.TrimSpace(o["private_route_policy"])
	if regexp.MustCompile(`[,\x00-\x1f\x7f]`).MatchString(policy) {
		return nil, fail("private_policy_invalid")
	}
	if enabled && (len(cidrs) == 0 || policy == "") {
		return nil, fail("private_route_incomplete")
	}
	if enabled {
		switch strings.ToUpper(policy) {
		case "DIRECT", "REJECT", "REJECT-DROP", "PASS", "COMPATIBLE", "GLOBAL":
			return nil, fail("private_policy_invalid")
		}
	}
	if !enabled || mode == "off" {
		return out, nil
	}
	for _, s := range cidrs {
		p, _ := prefix(s)
		for _, c := range connected {
			q, e := prefix(c)
			if e != nil {
				return nil, e
			}
			if p.Overlaps(q) {
				return nil, fail("private_route_connected_overlap")
			}
		}
		if p.Addr().Is6() && out["ipv6"] != true {
			return nil, fail("private_route_requires_ipv6")
		}
	}
	if strings.ToLower(str(out["mode"])) != "rule" {
		return nil, fail("private_route_requires_rule_mode")
	}
	found := false
	for _, k := range []string{"proxy-groups", "proxies"} {
		a, _ := out[k].([]any)
		for _, v := range a {
			m := obj(v)
			if m != nil && m["name"] == policy {
				switch strings.ToLower(str(m["type"])) {
				case "direct", "reject", "reject-drop", "pass":
					return nil, fail("private_policy_not_proxy")
				}
				found = true
				break
			}
		}
	}
	if !found {
		return nil, fail("private_policy_missing")
	}
	meta := map[string]any{"version": 2, "mode": mode, "cidrs": anyList(cidrs), "policy": policy, "rules": []any{}, "tun": map[string]any{}, "rulesPresent": has(out, "rules"), "tunPresent": has(out, "tun")}
	rules := []any{}
	add := func(s, policy string) {
		p, _ := prefix(s)
		kind := "IP-CIDR"
		if p.Addr().Is6() {
			kind = "IP-CIDR6"
		}
		rules = append(rules, kind+","+s+","+policy+",no-resolve")
	}
	for _, s := range cidrs {
		add(s, policy)
	}
	for _, s := range privateRanges {
		add(s, "DIRECT")
	}
	meta["rules"] = clone(rules)
	old, _ := out["rules"].([]any)
	out["rules"] = append(rules, old...)
	if mode == "tun" {
		tun := obj(out["tun"])
		if tun == nil {
			return nil, fail("tun_mapping_required")
		}
		set := func(k string, v any) {
			saved := map[string]any{"present": has(tun, k), "applied": clone(v)}
			if has(tun, k) {
				saved["before"] = clone(tun[k])
			}
			obj(meta["tun"])[k] = saved
			tun[k] = v
		}
		excluded := append([]string{}, privateRanges...)
		for _, k := range []string{"route-exclude-address", "inet4-route-exclude-address", "inet6-route-exclude-address"} {
			a, e := stringList(tun[k])
			if e != nil {
				return nil, e
			}
			excluded = append(excluded, a...)
		}
		v, e := subtractCIDR(excluded, cidrs)
		if e != nil {
			return nil, e
		}
		set("route-exclude-address", anyList(v))
		for _, k := range []string{"inet4-route-exclude-address", "inet6-route-exclude-address"} {
			if has(tun, k) {
				set(k, []any{})
			}
		}
		included := []string{}
		for _, k := range []string{"route-address", "inet4-route-address", "inet6-route-address"} {
			a, e := stringList(tun[k])
			if e != nil {
				return nil, e
			}
			included = append(included, a...)
		}
		if len(included) > 0 {
			v, e := compactCIDR(append(included, cidrs...))
			if e != nil {
				return nil, e
			}
			set("route-address", anyList(v))
			for _, k := range []string{"inet4-route-address", "inet6-route-address"} {
				if has(tun, k) {
					set(k, []any{})
				}
			}
		}
		set("dns-hijack", []any{})
	}
	out[privateMeta] = meta
	return out, nil
}
func (a *App) checkProviderPaths(m map[string]any) error {
	root := filepath.Join(a.Root, "Proxy")
	for _, kind := range []string{"proxy-providers", "rule-providers"} {
		for _, v := range obj(m[kind]) {
			p := obj(v)
			s := str(p["path"])
			if s == "" {
				continue
			}
			path := s
			if !filepath.IsAbs(path) {
				path = filepath.Join(root, path)
			}
			path = filepath.Clean(path)
			rel, e := filepath.Rel(root, path)
			if e != nil || rel == "." || strings.HasPrefix(rel, "../") {
				return fail("unsafe_provider_path")
			}
			first := strings.Split(rel, string(filepath.Separator))[0]
			switch first {
			case "config.yaml", "Clash.Core", "WebUI", "cache.db":
				return fail("unsafe_provider_path")
			}
			if strings.Contains(rel, ".kano_") {
				return fail("unsafe_provider_path")
			}
			if e := noLinks(path); e != nil {
				return e
			}
		}
	}
	return nil
}
func numeric(v any) int {
	switch n := v.(type) {
	case json.Number:
		i, _ := strconv.Atoi(string(n))
		return i
	case float64:
		return int(n)
	case int:
		return n
	}
	return 0
}
