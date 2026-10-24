package main

import (
	"bytes"
	"encoding/json"
	"os/exec"
	"testing"
)

func TestNormalizationDifferential(t *testing.T) {
	type Case struct {
		Config    map[string]any    `json:"config"`
		Options   map[string]string `json:"options"`
		Connected []string          `json:"connected"`
	}
	cases := []Case{}
	for _, mode := range []string{"tproxy", "tun", "off"} {
		for _, ipv6 := range []string{"off", "on"} {
			for _, stack := range []string{"auto", "mixed", "gvisor", "system", "mips"} {
				for _, private := range []bool{false, true} {
					m := map[string]any{"secret": "remote-must-be-protected-at-commit", "external-controller": "127.0.0.1:9090", "tun": map[string]any{"enable": true, "auto-route": true}, "dns": map[string]any{"enhanced-mode": "fake-ip", "proxy-server-nameserver-policy": map[string]any{"node.example": "223.5.5.5"}}, "proxies": []any{map[string]any{"name": "node", "type": "ss", "interface-name": "bad", "routing-mark": 42}}, "proxy-groups": []any{map[string]any{"name": "Proxy", "type": "select", "proxies": []any{"node"}}}, "rules": []any{"MATCH,Proxy"}, "rule-providers": map[string]any{"cn_domain": map[string]any{"type": "http", "behavior": "domain", "url": "https://example.test/rules", "override": map[string]any{"interface-name": "bad"}}}, "x-user": map[string]any{"keep": true}}
					o := map[string]string{"traffic_mode": mode, "ipv6": ipv6, "tun_stack": stack}
					if private {
						o["private_route_enabled"] = "on"
						o["private_route_cidrs"] = "10.123.4.0/24,172.29.0.0/16"
						o["private_route_policy"] = "Proxy"
						if ipv6 == "on" {
							o["private_route_cidrs"] += ",fdff:1234::/48"
						}
					}
					cases = append(cases, Case{m, o, []string{"192.168.0.1/24", "192.168.6.1/24", "2408:1::1/64"}})
				}
			}
		}
	}
	input := jsonBytes(cases)
	cmd := exec.Command("node", "../../tests/gist-sync/normalize-reference.js")
	cmd.Stdin = bytes.NewReader(input)
	b, e := cmd.Output()
	if e != nil {
		t.Fatal(e)
	}
	var expected []struct {
		OK    bool           `json:"ok"`
		Value map[string]any `json:"value"`
	}
	if e = json.Unmarshal(b, &expected); e != nil {
		t.Fatal(e)
	}
	for i, c := range cases {
		t.Run(c.Options["traffic_mode"]+"_"+c.Options["ipv6"]+"_"+c.Options["tun_stack"]+"_private_"+c.Options["private_route_enabled"], func(t *testing.T) {
			got, e := normalizeConfig(c.Config, c.Options, c.Connected)
			if (e == nil) != expected[i].OK {
				t.Fatalf("acceptance mismatch %v", e)
			}
			if e == nil && !same(got, expected[i].Value) {
				t.Fatalf("profile differs\ngot=%s\nwant=%s", jsonBytes(got), jsonBytes(expected[i].Value))
			}
		})
	}
}

func TestNormalizationUserOverrides(t *testing.T) {
	for _, mode := range []string{"tproxy", "tun", "off"} {
		t.Run(mode, func(t *testing.T) {
			config := map[string]any{
				"mode": "global", "ipv6": true, "port": 18080, "log-level": "debug", "unified-delay": false,
				"external-ui": "WebUI/custom", "external-ui-url": "https://example.test/ui.zip",
				"dns":            map[string]any{"listen": "127.0.0.1:5353", "nameserver-policy": map[string]any{"rule-set:cn_domain": []any{"1.1.1.1"}}},
				"sniffer":        map[string]any{"sniff": map[string]any{"TLS": map[string]any{"ports": []any{8443}}}},
				"rule-providers": map[string]any{"cn_domain": map[string]any{"type": "http", "behavior": "domain"}},
			}
			before := canonical(config)
			out, err := normalizeConfig(config, map[string]string{"traffic_mode": mode, "ipv6": "off"}, nil)
			if err != nil {
				t.Fatal(err)
			}
			for _, key := range []string{"mode", "ipv6", "port", "log-level", "unified-delay", "external-ui", "external-ui-url"} {
				if !same(out[key], config[key]) {
					t.Errorf("user field %s was changed: %v", key, out[key])
				}
			}
			if obj(out["dns"])["listen"] != "0.0.0.0:1053" || obj(out["tun"])["enable"] != (mode == "tun") {
				t.Fatal("capture fields must remain controlled")
			}
			if !same(obj(out["dns"])["nameserver-policy"], obj(config["dns"])["nameserver-policy"]) {
				t.Fatal("custom DNS policy was changed")
			}
			if !same(obj(out["sniffer"])["sniff"], obj(config["sniffer"])["sniff"]) {
				t.Fatal("nested sniffer config was changed")
			}
			if canonical(config) != before {
				t.Fatal("source config was mutated")
			}
		})
	}
}
func TestJSONGuards(t *testing.T) {
	for _, s := range []string{`{"a":1,"a":2}`, `{} {}`, `{"n":9007199254740992}`, `{"n":NaN}`} {
		if _, e := parseJSON([]byte(s)); e == nil {
			t.Fatal(s)
		}
	}
	a, _ := parseJSON([]byte(`{"x":1.0}`))
	b, _ := parseJSON([]byte(`{"x":1}`))
	if !same(a, b) {
		t.Fatal("cosmetic numeric change")
	}
}
func TestPrivateSelection(t *testing.T) {
	for name, p := range map[string]map[string]any{"direct": {"Proxy": map[string]any{"now": "DIRECT"}}, "cycle": {"Proxy": map[string]any{"now": "Proxy"}}, "unloaded": {}, "unselected": {"Proxy": map[string]any{"type": "LoadBalance", "all": []any{"node"}}}} {
		t.Run(name, func(t *testing.T) {
			if resolveSelection(p, "Proxy") == nil {
				t.Fatal("unsafe selection")
			}
		})
	}
	if e := resolveSelection(map[string]any{"Proxy": map[string]any{"now": "node"}, "node": map[string]any{"type": "Shadowsocks"}}, "Proxy"); e != nil {
		t.Fatal(e)
	}
}
