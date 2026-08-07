package main

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestSnapshotJSONOmitsOnDemandData(t *testing.T) {
	content, err := json.Marshal(snapshotResult{result: ok()})
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
	}
	for input, expected := range tests {
		if actual := yamlScalar(input); actual != expected {
			t.Fatalf("yamlScalar(%q) = %q, want %q", input, actual, expected)
		}
	}
}

func TestTailLines(t *testing.T) {
	if actual := tailLines("a\nb\nc\n", 2); actual != "b\nc" {
		t.Fatalf("tailLines returned %q", actual)
	}
}

func TestExistingFilesystemPaths(t *testing.T) {
	dir := t.TempDir()
	missing := filepath.Join(dir, "missing")
	actual := existingFilesystemPaths(dir, missing)
	if len(actual) != 1 || actual[0] != dir {
		t.Fatalf("existingFilesystemPaths returned %#v", actual)
	}
}

func TestConvertClashSubscription(t *testing.T) {
	input, err := os.ReadFile(filepath.Join("testdata", "clash.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	format, count, output := convertSubscriptionForTest(t, input)
	if format != "clash-yaml" || count != 1 {
		t.Fatalf("format=%q count=%d", format, count)
	}
	assertProviderOutput(t, output, "test-node", "ss")
}

func TestConvertBase64ShareLinks(t *testing.T) {
	link, err := os.ReadFile(filepath.Join("testdata", "vless.txt"))
	if err != nil {
		t.Fatal(err)
	}
	input := []byte(base64.StdEncoding.EncodeToString([]byte(strings.TrimSpace(string(link)))))
	format, count, output := convertSubscriptionForTest(t, input)
	if format != "share-links" || count != 1 {
		t.Fatalf("format=%q count=%d", format, count)
	}
	assertProviderOutput(t, output, "test-vless", "vless")
}

func TestConvertSubscriptionRejectsInvalidInput(t *testing.T) {
	dir := t.TempDir()
	inputPath := filepath.Join(dir, "input.txt")
	outputPath := filepath.Join(dir, "provider.yaml")
	if err := os.WriteFile(inputPath, []byte("not a subscription"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, _, err := convertSubscriptionFile(inputPath, outputPath); err == nil {
		t.Fatal("expected invalid subscription to fail")
	}
	if _, err := os.Stat(outputPath); !os.IsNotExist(err) {
		t.Fatalf("output should not exist after failure: %v", err)
	}
}

func TestConvertSubscriptionRejectsDuplicateNames(t *testing.T) {
	input := []byte("proxies:\n  - {name: duplicate, type: ss}\n  - {name: duplicate, type: trojan}\n")
	dir := t.TempDir()
	inputPath := filepath.Join(dir, "input.yaml")
	outputPath := filepath.Join(dir, "provider.yaml")
	if err := os.WriteFile(inputPath, input, 0600); err != nil {
		t.Fatal(err)
	}
	if _, _, err := convertSubscriptionFile(inputPath, outputPath); err == nil || !strings.Contains(err.Error(), "duplicate") {
		t.Fatalf("expected duplicate-name error, got %v", err)
	}
}

func convertSubscriptionForTest(t *testing.T, input []byte) (string, int, []byte) {
	t.Helper()
	dir := t.TempDir()
	inputPath := filepath.Join(dir, "input.txt")
	outputPath := filepath.Join(dir, "provider.yaml")
	if err := os.WriteFile(inputPath, input, 0600); err != nil {
		t.Fatal(err)
	}
	format, count, err := convertSubscriptionFile(inputPath, outputPath)
	if err != nil {
		t.Fatal(err)
	}
	output, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatal(err)
	}
	return format, count, output
}

func assertProviderOutput(t *testing.T, content []byte, expectedName, expectedType string) {
	t.Helper()
	var document struct {
		Proxies []map[string]any `yaml:"proxies"`
	}
	if err := yaml.Unmarshal(content, &document); err != nil {
		t.Fatal(err)
	}
	if len(document.Proxies) != 1 {
		t.Fatalf("proxy count=%d", len(document.Proxies))
	}
	if document.Proxies[0]["name"] != expectedName || document.Proxies[0]["type"] != expectedType {
		t.Fatalf("unexpected proxy: %#v", document.Proxies[0])
	}
}
