package main

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
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
	if string(output) != "proxies:\n  - {name: test-node, type: ss}\n" {
		t.Fatalf("unexpected output: %q", output)
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

func TestNormalizeRejectsInvalidProviders(t *testing.T) {
	tests := map[string]string{
		"empty yaml":     "proxies: []\n",
		"empty json":     `{"proxies":[]}`,
		"missing type":   `{"proxies":[{"name":"node"}]}`,
		"duplicate name": `{"proxies":[{"name":"node","type":"ss"},{"name":"node","type":"trojan"}]}`,
		"not provider":   "not a subscription",
	}
	for name, input := range tests {
		t.Run(name, func(t *testing.T) {
			if _, _, _, err := normalizeProviderDocument([]byte(input)); err == nil {
				t.Fatal("expected input to be rejected")
			}
		})
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
