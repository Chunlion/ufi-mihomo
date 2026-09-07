package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"gopkg.in/yaml.v3"
)

func TestSnapshotJSONOmitsOnDemandData(t *testing.T) {
	content, err := json.Marshal(snapshotResult{OK: true, Version: version})
	if err != nil {
		t.Fatal(err)
	}
	for _, field := range []string{"clients", "deviceBypass", "directDomain", "directIp", "proxyDomain", "rejectDomain"} {
		if strings.Contains(string(content), field) {
			t.Fatalf("snapshot unexpectedly includes on-demand field %q: %s", field, content)
		}
	}
}

func TestBoundedOutput(t *testing.T) {
	w := &limitedOutput{limit: 16}
	_, err := io.Copy(w, strings.NewReader(strings.Repeat("x", 1000)))
	if err != nil || !w.exceeded || len(w.Bytes()) != 16 {
		t.Fatalf("capture not bounded: %d %v", len(w.Bytes()), err)
	}
}

func TestReadStatuses(t *testing.T) {
	if fileReadStatus(os.ErrPermission) != "permission_denied" || fileReadStatus(os.ErrNotExist) != "missing" {
		t.Fatal("wrong read status")
	}
	path := filepath.Join(t.TempDir(), "large")
	if err := os.WriteFile(path, []byte("12345"), 0600); err != nil {
		t.Fatal(err)
	}
	_, err := readLimited(path, 2)
	if fileReadStatus(err) != "too_large" {
		t.Fatal("missing size status")
	}
}

func TestLightConversionFirst(t *testing.T) {
	dir := t.TempDir()
	input, output := filepath.Join(dir, "input"), filepath.Join(dir, "output")
	for _, data := range []string{
		"proxies: [{name: test, type: ss, server: example.com, port: 443, cipher: aes-128-gcm, password: test}]",
		`{"proxies":[{"name":"test","type":"ss","server":"example.com","port":443,"cipher":"aes-128-gcm","password":"test"}]}`,
	} {
		if err := os.WriteFile(input, []byte(data), 0600); err != nil {
			t.Fatal(err)
		}
		result, err := convertSubscription(input, output, filepath.Join(dir, "missing-converter"))
		if err != nil || !result.OK || result.ProxyCount != 1 {
			t.Fatalf("light path: %v %v", result, err)
		}
		b, err := os.ReadFile(output)
		if err != nil {
			t.Fatal(err)
		}
		var before, after map[string]any
		if err = yaml.Unmarshal([]byte(data), &before); err != nil {
			t.Fatal(err)
		}
		if err = yaml.Unmarshal(b, &after); err != nil {
			t.Fatal(err)
		}
		original, _ := json.Marshal(before["proxies"])
		converted, _ := json.Marshal(after["proxies"])
		if string(original) != string(converted) {
			t.Fatal("proxy fields changed")
		}
	}
	if err := os.WriteFile(input, []byte("vless://unsupported"), 0600); err != nil {
		t.Fatal(err)
	}
	_, err := convertSubscription(input, output, filepath.Join(dir, "missing-converter"))
	if err == nil || !strings.Contains(err.Error(), "converter=execution_failed") {
		t.Fatalf("lost converter failure: %v", err)
	}
}

func TestSummaryScalar(t *testing.T) {
	tests := map[string]string{
		"127.0.0.1:7788":                   "127.0.0.1:7788",
		`"0.0.0.0:7788" # controller`:      "0.0.0.0:7788",
		`'secret-with-#-character' # note`: "secret-with-#-character",
		"plain-secret # note":              "plain-secret",
		"null":                             "",
	}
	for input, expected := range tests {
		_, actual, _, err := parseConfigSummary("secret: " + input)
		if err != nil || actual != expected {
			t.Fatalf("yamlScalar(%q) = %q, want %q", input, actual, expected)
		}
	}
}

func TestParseConfigSummary(t *testing.T) {
	config := `external-controller: "0.0.0.0:7788" # API
secret: 'abc#123' # keep the hash inside quotes
proxies:
  - {name: one, type: ss}
  - name: two
    type: vless
proxy-groups: []
`
	controller, secret, count, err := parseConfigSummary(config)
	if err != nil {
		t.Fatal(err)
	}
	if controller != "0.0.0.0:7788" || secret != "abc#123" || count != 2 {
		t.Fatalf("controller=%q secret=%q count=%d", controller, secret, count)
	}
}

func TestSummaryStructures(t *testing.T) {
	for _, input := range []string{
		"proxies: [{name: one}, {name: two}]",
		"proxies:\n- name: one\n  alpn: [h2, http/1.1]\n- name: two\n",
		"nodes: &nodes [{name: one}, {name: two}]\nproxies: *nodes",
	} {
		_, _, count, err := parseConfigSummary(input)
		if err != nil || count != 2 {
			t.Fatalf("count=%d err=%v", count, err)
		}
	}
	for _, input := range []string{"proxies: [", "secret: a\nsecret: b", "proxies: wrong", "secret: a\n---\nsecret: b"} {
		if _, _, _, err := parseConfigSummary(input); err == nil {
			t.Fatal("accepted malformed summary")
		}
	}
}

func TestCorePIDSelection(t *testing.T) {
	proc := t.TempDir()
	for pid, args := range map[string]string{
		"10": "/data/clash/Proxy/Clash.Core\x00-t\x00-f\x00config.yaml\x00",
		"11": "/system/bin/sh\x00-c\x00echo mihomo\x00",
		"12": "/data/clash/Proxy/Clash.Core\x00--test=true\x00",
	} {
		if err := os.Mkdir(filepath.Join(proc, pid), 0700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(proc, pid, "cmdline"), []byte(args), 0600); err != nil {
			t.Fatal(err)
		}
	}
	if pid := findCorePIDIn(proc); pid != 0 {
		t.Fatalf("false core PID: %d", pid)
	}
	if err := os.Mkdir(filepath.Join(proc, "20"), 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(proc, "20", "cmdline"), []byte("/data/clash/Proxy/Clash.Core\x00-f\x00config.yaml\x00"), 0600); err != nil {
		t.Fatal(err)
	}
	if pid := findCorePIDIn(proc); pid != 20 {
		t.Fatalf("missing core: %d", pid)
	}
}

func TestLargeLogTail(t *testing.T) {
	path := filepath.Join(t.TempDir(), "large.log")
	if err := os.WriteFile(path, []byte(strings.Repeat("old\n", 100000)+"latest1\nlatest2\n"), 0600); err != nil {
		t.Fatal(err)
	}
	for _, limit := range []int64{16, 64, 256 << 10} {
		if got := tailFile(path, 2, limit); got != "latest1\nlatest2" {
			t.Fatalf("limit=%d tail=%q", limit, got)
		}
	}
}

func TestCommandTimeoutAndMissing(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := commandOutputContext(ctx, os.Args[0], "-test.run=^$"); err == nil {
		t.Fatal("cancelled command succeeded")
	}
	result := commandOutputBatch(time.Second, []commandRequest{{name: filepath.Join(t.TempDir(), "missing")}})
	if !strings.Contains(result[0], "command_missing") {
		t.Fatalf("missing error: %q", result)
	}
}

func TestNormalizeYAMLProvider(t *testing.T) {
	input := []byte("mixed-port: 7890\nproxies:\n  - {name: test-node, type: ss}\nproxy-groups: []\n")
	output, count, format, err := normalizeProviderDocument(input)
	if err != nil {
		t.Fatal(err)
	}
	if format != "yaml" || count != 1 {
		t.Fatalf("format=%q count=%d", format, count)
	}
	var document map[string][]map[string]any
	if err := yaml.Unmarshal(output, &document); err != nil {
		t.Fatal(err)
	}
	if len(document) != 1 || len(document["proxies"]) != 1 || document["proxies"][0]["name"] != "test-node" {
		t.Fatalf("unexpected output: %s", output)
	}
}

func TestNormalizeJSONWrapper(t *testing.T) {
	input := []byte(`{"data":{"proxies":[{"name":"node","type":"vless"}]}}`)
	output, count, format, err := normalizeProviderDocument(input)
	if err != nil {
		t.Fatal(err)
	}
	if format != "json-wrapper/json" || count != 1 {
		t.Fatalf("format=%q count=%d", format, count)
	}
	var document struct {
		Proxies []map[string]any `json:"proxies"`
	}
	if err := json.Unmarshal(output, &document); err != nil {
		t.Fatal(err)
	}
	if len(document.Proxies) != 1 || document.Proxies[0]["name"] != "node" {
		t.Fatalf("unexpected output: %s", output)
	}
}

func TestNormalizeBase64YAML(t *testing.T) {
	raw := []byte("proxies:\n  - {name: encoded, type: trojan}\n")
	input := []byte(base64.StdEncoding.EncodeToString(raw))
	_, count, format, err := normalizeProviderDocument(input)
	if err != nil {
		t.Fatal(err)
	}
	if format != "base64/yaml" || count != 1 {
		t.Fatalf("format=%q count=%d", format, count)
	}
}

func TestNormalizeAcceptedWrappers(t *testing.T) {
	urlSafe := base64.RawURLEncoding.EncodeToString([]byte("proxies:\n  - {name: wrapped\U0010FFFF, type: vless}\n"))
	if !strings.ContainsAny(urlSafe, "-_") {
		t.Fatal("URL-safe Base64 fixture does not exercise the URL-safe alphabet")
	}
	tests := map[string]struct {
		input      string
		wantFormat string
	}{
		"URL-safe Base64": {
			input:      urlSafe,
			wantFormat: "base64/yaml",
		},
		"JSON string wrapper": {
			input:      `{"content":"proxies:\n  - {name: wrapped, type: vless}\n"}`,
			wantFormat: "json-wrapper/yaml",
		},
		"JSON proxy array": {
			input:      `[{"name":"wrapped","type":"vless"}]`,
			wantFormat: "json-array",
		},
	}
	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			_, count, format, err := normalizeProviderDocument([]byte(test.input))
			if err != nil {
				t.Fatal(err)
			}
			if count != 1 || format != test.wantFormat {
				t.Fatalf("format=%q count=%d", format, count)
			}
		})
	}
}

func TestNormalizeRejectsInvalidProviders(t *testing.T) {
	tests := map[string]string{
		"empty yaml":          "proxies: []\n",
		"empty json":          `{"proxies":[]}`,
		"missing JSON type":   `{"proxies":[{"name":"node"}]}`,
		"duplicate JSON name": `{"proxies":[{"name":"node","type":"ss"},{"name":"node","type":"trojan"}]}`,
		"missing YAML type":   "proxies:\n  - name: node\n",
		"null YAML name":      "proxies:\n  - {name: null, type: ss}\n",
		"duplicate YAML name": "proxies:\n  - {name: node, type: ss}\n  - {name: node, type: trojan}\n",
		"HTML response":       "<!doctype html><html><body>login required</body></html>",
		"Base64 HTML":         base64.StdEncoding.EncodeToString([]byte("<html>not a subscription</html>")),
		"not provider":        "not a subscription",
	}
	for name, input := range tests {
		t.Run(name, func(t *testing.T) {
			if _, _, _, err := normalizeProviderDocument([]byte(input)); err == nil {
				t.Fatal("expected input to be rejected")
			}
		})
	}
}

func TestNormalizeRejectsDeepJSONWrappers(t *testing.T) {
	input := "proxies:\n  - {name: node, type: ss}\n"
	for range 5 {
		wrapped, err := json.Marshal(map[string]string{"data": input})
		if err != nil {
			t.Fatal(err)
		}
		input = string(wrapped)
	}
	if _, _, _, err := normalizeProviderDocument([]byte(input)); err == nil {
		t.Fatal("expected deeply nested wrapper to be rejected")
	}
}

func TestNormalizeRegressionFixtures(t *testing.T) {
	provider, err := os.ReadFile(filepath.Join("testdata", "clash.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	if _, count, format, err := normalizeProviderDocument(provider); err != nil || count != 1 || format != "yaml" {
		t.Fatalf("Clash fixture: format=%q count=%d err=%v", format, count, err)
	}
	shareLinks, err := os.ReadFile(filepath.Join("testdata", "vless.txt"))
	if err != nil {
		t.Fatal(err)
	}
	if _, _, _, err := normalizeProviderDocument(shareLinks); err == nil {
		t.Fatal("share-link fixture must be delegated to the converter sidecar")
	}
}

func TestFindConverterSidecarRequiresExecutableFile(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Windows does not expose Unix executable permission bits")
	}
	dir := t.TempDir()
	path := filepath.Join(dir, "converter")
	if err := os.WriteFile(path, []byte("#!/bin/sh\nexit 0\n"), 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("KANO_HELPER_CONVERTER", path)
	if found := findConverterSidecar(); found != "" {
		t.Fatalf("non-executable sidecar selected: %q", found)
	}
	if err := os.Chmod(path, 0700); err != nil {
		t.Fatal(err)
	}
	if found := findConverterSidecar(); found != path {
		t.Fatalf("findConverterSidecar() = %q, want %q", found, path)
	}
}

func TestWriteFileAtomic(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "nested", "provider.yaml")
	if err := writeFileAtomic(path, []byte("first"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := writeFileAtomic(path, []byte("second"), 0600); err != nil {
		t.Fatal(err)
	}
	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(content) != "second" {
		t.Fatalf("content=%q", content)
	}
}

func TestReadLimitedAndTailFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "log.txt")
	if err := os.WriteFile(path, []byte("a\nb\nc\n"), 0600); err != nil {
		t.Fatal(err)
	}
	if actual := tailFile(path, 2, 1024); actual != "b\nc" {
		t.Fatalf("tailFile returned %q", actual)
	}
	if _, err := readLimited(path, 3); err == nil {
		t.Fatal("expected size limit error")
	}
}
