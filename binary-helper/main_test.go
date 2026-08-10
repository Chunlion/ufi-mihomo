package main

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

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

func TestYAMLScalar(t *testing.T) {
	tests := map[string]string{
		"127.0.0.1:7788":                   "127.0.0.1:7788",
		`"0.0.0.0:7788" # controller`:      "0.0.0.0:7788",
		`'secret-with-#-character' # note`: "secret-with-#-character",
		"plain-secret # note":              "plain-secret",
		"null":                             "",
	}
	for input, expected := range tests {
		if actual := yamlScalar(input); actual != expected {
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
	controller, secret, count := parseConfigSummary(config)
	if controller != "0.0.0.0:7788" || secret != "abc#123" || count != 2 {
		t.Fatalf("controller=%q secret=%q count=%d", controller, secret, count)
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
