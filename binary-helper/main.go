package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"gopkg.in/yaml.v3"
)

const version = "0.3.3"

var commands = []string{"version", "snapshot", "clients", "network-status", "policy-read", "convert-subscription"}

type result struct {
	OK       bool     `json:"ok"`
	Version  string   `json:"version,omitempty"`
	Goarch   string   `json:"goarch,omitempty"`
	GOOS     string   `json:"goos,omitempty"`
	Commands []string `json:"commands,omitempty"`
	Error    string   `json:"error,omitempty"`
}

type snapshotResult struct {
	OK                 bool   `json:"ok"`
	Version            string `json:"version,omitempty"`
	PID                int    `json:"pid"`
	ExternalController string `json:"externalController"`
	Secret             string `json:"secret"`
	SecretSet          bool   `json:"secretSet"`
	Options            string `json:"options"`
	ConfigExists       bool   `json:"configExists"`
	ConfigSize         int64  `json:"configSize"`
	ProxyCount         int    `json:"proxyCount"`
	CPUABI             string `json:"cpuAbi,omitempty"`
	AndroidSDK         string `json:"androidSdk,omitempty"`
	Error              string `json:"error,omitempty"`
}

type textResult struct {
	OK    bool   `json:"ok"`
	Text  string `json:"text"`
	Error string `json:"error,omitempty"`
}

type policyState struct {
	OK           bool   `json:"ok"`
	Options      string `json:"options"`
	DeviceBypass string `json:"deviceBypass"`
	DirectDomain string `json:"directDomain"`
	DirectIP     string `json:"directIp"`
	ProxyDomain  string `json:"proxyDomain"`
	RejectDomain string `json:"rejectDomain"`
	Error        string `json:"error,omitempty"`
}

type subscriptionResult struct {
	OK         bool   `json:"ok"`
	ProxyCount int    `json:"proxyCount"`
	Format     string `json:"format"`
	Error      string `json:"error,omitempty"`
}

func writeJSON(v any) {
	enc := json.NewEncoder(os.Stdout)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

func fail(msg string) {
	writeJSON(result{OK: false, Version: version, Error: msg})
	os.Exit(1)
}

func main() {
	if len(os.Args) < 2 {
		fail("missing command")
	}
	switch os.Args[1] {
	case "version":
		writeJSON(result{OK: true, Version: version, Goarch: runtime.GOARCH, GOOS: runtime.GOOS, Commands: commands})
	case "snapshot":
		runSnapshot(os.Args[2:])
	case "clients":
		runClients(os.Args[2:])
	case "network-status":
		runNetworkStatus(os.Args[2:])
	case "policy-read":
		runPolicyRead(os.Args[2:])
	case "convert-subscription":
		runConvertSubscription(os.Args[2:])
	default:
		fail("unknown command: " + os.Args[1])
	}
}

func runSnapshot(args []string) {
	fs := flag.NewFlagSet("snapshot", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	config := fs.String("config", "/data/clash/Proxy/config.yaml", "")
	options := fs.String("options", "", "")
	if err := fs.Parse(args); err != nil {
		fail(err.Error())
	}

	out := snapshotResult{OK: true, Version: version, PID: findCorePID()}
	if st, err := os.Stat(*config); err == nil && !st.IsDir() {
		out.ConfigExists = true
		out.ConfigSize = st.Size()
		if b, err := readLimited(*config, 8<<20); err == nil {
			out.ExternalController, out.Secret, out.ProxyCount = parseConfigSummary(string(b))
			out.SecretSet = out.Secret != ""
		}
	}
	if *options != "" {
		if b, err := readLimited(*options, 2<<20); err == nil {
			out.Options = string(b)
		}
	}
	out.CPUABI = getProp("ro.product.cpu.abi")
	out.AndroidSDK = getProp("ro.build.version.sdk")
	writeJSON(out)
}

func parseConfigSummary(text string) (controller, secret string, proxyCount int) {
	s := bufio.NewScanner(strings.NewReader(text))
	s.Buffer(make([]byte, 64*1024), 1024*1024)
	inProxies := false
	for s.Scan() {
		raw := strings.TrimRight(s.Text(), "\r")
		trimmed := strings.TrimSpace(raw)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		indent := len(raw) - len(strings.TrimLeft(raw, " \t"))
		if indent == 0 {
			inProxies = false
			if k, v, ok := splitYAMLKV(trimmed); ok {
				switch k {
				case "external-controller":
					controller = yamlScalar(v)
				case "secret":
					secret = yamlScalar(v)
				case "proxies":
					inProxies = true
					if strings.HasPrefix(strings.TrimSpace(v), "[") && strings.TrimSpace(v) != "[]" {
						proxyCount++
					}
				}
			}
			continue
		}
		if inProxies && strings.HasPrefix(strings.TrimSpace(raw), "-") {
			proxyCount++
		}
	}
	return
}

func splitYAMLKV(s string) (string, string, bool) {
	i := strings.IndexByte(s, ':')
	if i <= 0 {
		return "", "", false
	}
	return strings.TrimSpace(s[:i]), strings.TrimSpace(s[i+1:]), true
}

func yamlScalar(v string) string {
	v = strings.TrimSpace(v)
	if v == "" || v == "null" || v == "~" {
		return ""
	}
	quote := byte(0)
	escaped := false
	comment := -1
	for i := 0; i < len(v); i++ {
		c := v[i]
		if quote == 0 {
			if c == '\'' || c == '"' {
				quote = c
				continue
			}
			if c == '#' && (i == 0 || v[i-1] == ' ' || v[i-1] == '\t') {
				comment = i
				break
			}
			continue
		}
		if quote == '"' && c == '\\' && !escaped {
			escaped = true
			continue
		}
		if c == quote && !escaped {
			quote = 0
		}
		escaped = false
	}
	if comment >= 0 {
		v = strings.TrimSpace(v[:comment])
	}
	if len(v) >= 2 && ((v[0] == '\'' && v[len(v)-1] == '\'') || (v[0] == '"' && v[len(v)-1] == '"')) {
		v = v[1 : len(v)-1]
	}
	return strings.TrimSpace(v)
}

func findCorePID() int {
	ents, err := os.ReadDir("/proc")
	if err != nil {
		return 0
	}
	type candidate struct{ pid, score int }
	var cands []candidate
	for _, e := range ents {
		if !e.IsDir() {
			continue
		}
		pid, err := strconv.Atoi(e.Name())
		if err != nil || pid <= 0 {
			continue
		}
		comm, _ := os.ReadFile(filepath.Join("/proc", e.Name(), "comm"))
		cmd, _ := os.ReadFile(filepath.Join("/proc", e.Name(), "cmdline"))
		name := strings.TrimSpace(string(comm))
		cmdline := strings.ReplaceAll(string(cmd), "\x00", " ")
		low := strings.ToLower(name + " " + cmdline)
		score := 0
		switch {
		case strings.Contains(low, "/data/clash/proxy/clash.core"):
			score = 100
		case strings.EqualFold(name, "Clash.Core"):
			score = 90
		case strings.EqualFold(name, "mihomo"):
			score = 80
		case strings.Contains(low, "mihomo"):
			score = 60
		}
		if score > 0 {
			cands = append(cands, candidate{pid: pid, score: score})
		}
	}
	sort.Slice(cands, func(i, j int) bool {
		if cands[i].score != cands[j].score {
			return cands[i].score > cands[j].score
		}
		return cands[i].pid < cands[j].pid
	})
	if len(cands) == 0 {
		return 0
	}
	return cands[0].pid
}

func runClients(args []string) {
	_ = args
	seen := map[string]bool{}
	rows := []string{"IP MAC SOURCE"}
	if f, err := os.Open("/proc/net/arp"); err == nil {
		s := bufio.NewScanner(f)
		first := true
		for s.Scan() {
			if first {
				first = false
				continue
			}
			p := strings.Fields(s.Text())
			if len(p) < 4 || p[3] == "00:00:00:00:00:00" {
				continue
			}
			key := p[0] + " " + strings.ToLower(p[3])
			if !seen[key] {
				seen[key] = true
				rows = append(rows, key+" arp")
			}
		}
		_ = f.Close()
	}
	if out, _ := commandOutput(1500*time.Millisecond, "ip", "neigh"); out != "" {
		s := bufio.NewScanner(strings.NewReader(out))
		for s.Scan() {
			p := strings.Fields(s.Text())
			if len(p) < 5 {
				continue
			}
			ip, mac := p[0], ""
			for i := 1; i+1 < len(p); i++ {
				if p[i] == "lladdr" {
					mac = strings.ToLower(p[i+1])
					break
				}
			}
			if mac == "" || mac == "00:00:00:00:00:00" {
				continue
			}
			key := ip + " " + mac
			if !seen[key] {
				seen[key] = true
				rows = append(rows, key+" neigh")
			}
		}
	}
	writeJSON(textResult{OK: true, Text: strings.Join(rows, "\n")})
}

func runPolicyRead(args []string) {
	fs := flag.NewFlagSet("policy-read", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	options := fs.String("options", "", "")
	device := fs.String("device", "", "")
	directDomain := fs.String("direct-domain", "", "")
	directIP := fs.String("direct-ip", "", "")
	proxyDomain := fs.String("proxy-domain", "", "")
	rejectDomain := fs.String("reject-domain", "", "")
	if err := fs.Parse(args); err != nil {
		fail(err.Error())
	}
	read := func(path string) string {
		if path == "" {
			return ""
		}
		b, err := readLimited(path, 2<<20)
		if err != nil {
			return ""
		}
		return string(b)
	}
	writeJSON(policyState{
		OK: true, Options: read(*options), DeviceBypass: read(*device),
		DirectDomain: read(*directDomain), DirectIP: read(*directIP),
		ProxyDomain: read(*proxyDomain), RejectDomain: read(*rejectDomain),
	})
}

func runNetworkStatus(args []string) {
	fs := flag.NewFlagSet("network-status", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	logPath := fs.String("log", "", "")
	yqRuntime := fs.String("yq-runtime", "", "")
	clashDir := fs.String("clash-dir", "/data/clash", "")
	if err := fs.Parse(args); err != nil {
		fail(err.Error())
	}
	var b strings.Builder
	fmt.Fprintf(&b, "[helper]\nversion=%s goos=%s goarch=%s\n", version, runtime.GOOS, runtime.GOARCH)
	fmt.Fprintf(&b, "clash_dir=%s\nyq_runtime=%s\n\n", *clashDir, *yqRuntime)
	fmt.Fprintf(&b, "[process]\npid=%d\n\n", findCorePID())
	fmt.Fprintf(&b, "[listen ports]\n%s\n", listenPortsText())
	type probe struct {
		name string
		args []string
	}
	probes := []probe{{name: "ip", args: []string{"rule", "show"}}}
	var firewallStart, firewallEnd int
	if ipt := selectExecutable([]string{"iptables", "iptables-legacy", "iptables-nft", "/system/bin/iptables", "/system/xbin/iptables", "/vendor/bin/iptables"}); ipt != "" {
		fmt.Fprintf(&b, "\n[IPv4 firewall: %s]\n", ipt)
		firewallStart = len(probes)
		for _, spec := range [][]string{{"-t", "mangle", "-S", "PREROUTING"}, {"-t", "mangle", "-S", "OUTPUT"}, {"-t", "nat", "-S"}} {
			probes = append(probes, probe{name: ipt, args: spec})
		}
		firewallEnd = len(probes)
	} else {
		b.WriteString("\n[IPv4 firewall]\nunavailable\n")
	}
	requests := make([]commandRequest, len(probes))
	for i, item := range probes {
		requests[i] = commandRequest{name: item.name, args: item.args}
	}
	outputs := commandOutputBatch(2*time.Second, requests)
	for _, out := range outputs[firewallStart:firewallEnd] {
		if out != "" {
			b.WriteString(out)
			if !strings.HasSuffix(out, "\n") {
				b.WriteByte('\n')
			}
		}
	}
	if out := outputs[0]; out != "" {
		b.WriteString("\n[ip rule]\n")
		b.WriteString(out)
		if !strings.HasSuffix(out, "\n") {
			b.WriteByte('\n')
		}
	}
	if *logPath != "" {
		b.WriteString("\n[log tail]\n")
		b.WriteString(tailFile(*logPath, 80, 256<<10))
	}
	writeJSON(textResult{OK: true, Text: b.String()})
}

func listenPortsText() string {
	wanted := map[int]bool{7788: true, 7890: true, 7891: true, 7892: true, 7893: true, 7895: true, 1053: true}
	var rows []string
	for _, path := range []string{"/proc/net/tcp", "/proc/net/tcp6", "/proc/net/udp", "/proc/net/udp6"} {
		f, err := os.Open(path)
		if err != nil {
			continue
		}
		s := bufio.NewScanner(f)
		first := true
		for s.Scan() {
			if first {
				first = false
				continue
			}
			p := strings.Fields(s.Text())
			if len(p) < 4 {
				continue
			}
			hp := strings.Split(p[1], ":")
			if len(hp) != 2 {
				continue
			}
			n, err := strconv.ParseInt(hp[1], 16, 32)
			if err != nil || !wanted[int(n)] {
				continue
			}
			rows = append(rows, fmt.Sprintf("%s port=%d state=%s", filepath.Base(path), n, p[3]))
		}
		_ = f.Close()
	}
	if len(rows) == 0 {
		return "none"
	}
	sort.Strings(rows)
	return strings.Join(rows, "\n")
}

func runConvertSubscription(args []string) {
	fs := flag.NewFlagSet("convert-subscription", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	input := fs.String("input", "", "")
	output := fs.String("output", "", "")
	if err := fs.Parse(args); err != nil {
		fail(err.Error())
	}
	if *input == "" || *output == "" {
		fail("input and output are required")
	}

	// Preserve the full 0.2.3 Mihomo-backed converter as a cold sidecar. It is only
	// launched for subscription conversion; all status/diagnostic hot paths stay lightweight.
	if sidecar := findConverterSidecar(); sidecar != "" {
		cmd := exec.Command(sidecar, "convert-subscription", "--input", *input, "--output", *output)
		cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
		if err := cmd.Run(); err == nil {
			return
		}
	}

	// Lightweight fallback: many providers already return a Clash/Mihomo YAML or JSON
	// document. Extract/pass through its top-level proxies collection without pulling the
	// entire Mihomo dependency graph into this Android helper.
	b, err := readLimited(*input, 16<<20)
	if err != nil {
		fail(err.Error())
	}
	out, count, format, err := normalizeProviderDocument(b)
	if err != nil {
		fail("converter sidecar unavailable and input is not a Clash provider document: " + err.Error())
	}
	if err := writeFileAtomic(*output, out, 0600); err != nil {
		fail(err.Error())
	}
	writeJSON(subscriptionResult{OK: true, ProxyCount: count, Format: format})
}

func findConverterSidecar() string {
	self, _ := os.Executable()
	self, _ = filepath.EvalSymlinks(self)
	var cands []string
	if p := os.Getenv("KANO_HELPER_CONVERTER"); p != "" {
		cands = append(cands, p)
	}
	cands = append(cands,
		"/data/clash/Tools/kano-f50-helper-converter",
		"/data/clash/Tools/kano-f50-helper-legacy",
	)
	for _, p := range cands {
		st, err := os.Stat(p)
		if err != nil || st.IsDir() || st.Mode()&0111 == 0 {
			continue
		}
		q, _ := filepath.EvalSymlinks(p)
		if q != "" && q == self {
			continue
		}
		return p
	}
	return ""
}

func normalizeProviderDocument(b []byte) ([]byte, int, string, error) {
	return normalizeProviderDocumentDepth(b, 0)
}

func normalizeProviderDocumentDepth(b []byte, depth int) ([]byte, int, string, error) {
	if depth > 3 {
		return nil, 0, "", errors.New("nested subscription wrapper is too deep")
	}
	b = bytes.TrimPrefix(b, []byte{0xEF, 0xBB, 0xBF})
	trimmed := bytes.TrimSpace(b)
	if len(trimmed) == 0 {
		return nil, 0, "", errors.New("empty input")
	}

	// JSON provider, proxy array, or common API wrapper. Some subscription panels
	// return HTTP 200 JSON wrappers instead of the final provider document.
	if trimmed[0] == '{' {
		var obj map[string]json.RawMessage
		if err := json.Unmarshal(trimmed, &obj); err == nil {
			if raw, ok := obj["proxies"]; ok {
				var arr []json.RawMessage
				if json.Unmarshal(raw, &arr) == nil {
					if err := validateJSONProxies(arr); err != nil {
						return nil, 0, "", err
					}
					normalized, _ := json.Marshal(map[string]json.RawMessage{"proxies": raw})
					normalized = append(normalized, '\n')
					return normalized, len(arr), "json", nil
				}
			}
			for _, key := range []string{"data", "content", "subscription", "config", "result"} {
				raw, ok := obj[key]
				if !ok || len(raw) == 0 || bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
					continue
				}
				// Nested JSON object/array.
				if raw[0] == '{' || raw[0] == '[' {
					if out, count, format, err := normalizeProviderDocumentDepth(raw, depth+1); err == nil {
						return out, count, "json-wrapper/" + format, nil
					}
				}
				// String wrapper, often Base64 or an embedded YAML document.
				var str string
				if json.Unmarshal(raw, &str) == nil && strings.TrimSpace(str) != "" {
					if out, count, format, err := normalizeProviderDocumentDepth([]byte(str), depth+1); err == nil {
						return out, count, "json-wrapper/" + format, nil
					}
				}
			}
		}
	}
	if trimmed[0] == '[' {
		var arr []json.RawMessage
		if err := json.Unmarshal(trimmed, &arr); err == nil && len(arr) > 0 {
			allObjects := true
			for _, item := range arr {
				if len(bytes.TrimSpace(item)) == 0 || bytes.TrimSpace(item)[0] != '{' {
					allObjects = false
					break
				}
			}
			if allObjects {
				if err := validateJSONProxies(arr); err != nil {
					return nil, 0, "", err
				}
				raw, _ := json.Marshal(arr)
				normalized, _ := json.Marshal(map[string]json.RawMessage{"proxies": raw})
				normalized = append(normalized, '\n')
				return normalized, len(arr), "json-array", nil
			}
		}
	}

	// Standard Clash/Mihomo YAML: parse the document and keep only the top-level
	// proxies sequence so unrelated settings cannot leak into a file provider.
	if out, count, found, err := normalizeYAMLProvider(trimmed); found {
		if err != nil {
			return nil, 0, "", err
		}
		return out, count, "yaml", nil
	}

	// Base64-wrapped Clash YAML/JSON is common on subscription endpoints. Try all
	// standard and URL-safe encodings, with whitespace stripped, then recurse.
	compact := make([]byte, 0, len(trimmed))
	for _, c := range trimmed {
		if c != ' ' && c != '\t' && c != '\r' && c != '\n' {
			compact = append(compact, c)
		}
	}
	if len(compact) >= 16 {
		encodings := []*base64.Encoding{
			base64.StdEncoding, base64.RawStdEncoding,
			base64.URLEncoding, base64.RawURLEncoding,
		}
		for _, enc := range encodings {
			decoded := make([]byte, enc.DecodedLen(len(compact)))
			n, err := enc.Decode(decoded, compact)
			if err != nil || n == 0 {
				continue
			}
			decoded = decoded[:n]
			if out, count, format, err := normalizeProviderDocumentDepth(decoded, depth+1); err == nil {
				return out, count, "base64/" + format, nil
			}
		}
	}

	return nil, 0, "", errors.New("proxies section not found; response is not a supported Clash provider document")
}

func normalizeYAMLProvider(input []byte) ([]byte, int, bool, error) {
	var document yaml.Node
	if err := yaml.Unmarshal(input, &document); err != nil || len(document.Content) == 0 {
		return nil, 0, false, nil
	}
	root := document.Content[0]
	if root.Kind != yaml.MappingNode {
		return nil, 0, false, nil
	}

	var proxies *yaml.Node
	for i := 0; i+1 < len(root.Content); i += 2 {
		if root.Content[i].Value == "proxies" {
			proxies = root.Content[i+1]
			break
		}
	}
	if proxies == nil {
		return nil, 0, false, nil
	}
	if proxies.Kind != yaml.SequenceNode || len(proxies.Content) == 0 {
		return nil, 0, true, errors.New("subscription contains no proxies")
	}

	names := make(map[string]struct{}, len(proxies.Content))
	for i, item := range proxies.Content {
		if item.Kind != yaml.MappingNode {
			return nil, 0, true, fmt.Errorf("proxy %d is not a mapping", i+1)
		}
		name, proxyType := "", ""
		for j := 0; j+1 < len(item.Content); j += 2 {
			value := item.Content[j+1]
			if value.Kind != yaml.ScalarNode || value.Tag != "!!str" {
				continue
			}
			switch item.Content[j].Value {
			case "name":
				name = strings.TrimSpace(value.Value)
			case "type":
				proxyType = strings.TrimSpace(value.Value)
			}
		}
		if name == "" || proxyType == "" {
			return nil, 0, true, fmt.Errorf("proxy %d requires non-empty name and type", i+1)
		}
		if _, exists := names[name]; exists {
			return nil, 0, true, fmt.Errorf("duplicate proxy name: %s", name)
		}
		names[name] = struct{}{}
	}

	provider := &yaml.Node{
		Kind: yaml.MappingNode,
		Tag:  "!!map",
		Content: []*yaml.Node{
			{Kind: yaml.ScalarNode, Tag: "!!str", Value: "proxies"},
			proxies,
		},
	}
	out, err := yaml.Marshal(&yaml.Node{Kind: yaml.DocumentNode, Content: []*yaml.Node{provider}})
	if err != nil {
		return nil, 0, true, err
	}
	return out, len(proxies.Content), true, nil
}

func validateJSONProxies(items []json.RawMessage) error {
	if len(items) == 0 {
		return errors.New("subscription contains no proxies")
	}
	names := make(map[string]struct{}, len(items))
	for i, raw := range items {
		var proxy map[string]json.RawMessage
		if err := json.Unmarshal(raw, &proxy); err != nil {
			return fmt.Errorf("proxy %d is not an object", i+1)
		}
		var name, proxyType string
		_ = json.Unmarshal(proxy["name"], &name)
		_ = json.Unmarshal(proxy["type"], &proxyType)
		name = strings.TrimSpace(name)
		proxyType = strings.TrimSpace(proxyType)
		if name == "" || proxyType == "" {
			return fmt.Errorf("proxy %d is missing name or type", i+1)
		}
		if _, exists := names[name]; exists {
			return fmt.Errorf("duplicate proxy name at item %d", i+1)
		}
		names[name] = struct{}{}
	}
	return nil
}

func writeFileAtomic(path string, data []byte, perm os.FileMode) error {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	tmp := path + ".kano_new_" + strconv.Itoa(os.Getpid())
	if err := os.WriteFile(tmp, data, perm); err != nil {
		return err
	}
	if err := os.Chmod(tmp, perm); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	if err := os.Rename(tmp, path); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	return nil
}

func readLimited(path string, max int64) ([]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	r := io.LimitReader(f, max+1)
	b, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	if int64(len(b)) > max {
		return nil, fmt.Errorf("file too large: %s", path)
	}
	return b, nil
}

func getProp(key string) string {
	out, _ := commandOutput(1200*time.Millisecond, "getprop", key)
	return strings.TrimSpace(out)
}

func commandOutput(timeout time.Duration, name string, args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	return commandOutputContext(ctx, name, args...)
}

func commandOutputContext(ctx context.Context, name string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	b, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		return string(b), ctx.Err()
	}
	return string(b), err
}

type commandRequest struct {
	name string
	args []string
}

func commandOutputBatch(timeout time.Duration, requests []commandRequest) []string {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	outputs := make([]string, len(requests))
	var wg sync.WaitGroup
	for i, request := range requests {
		wg.Add(1)
		go func(index int, item commandRequest) {
			defer wg.Done()
			outputs[index], _ = commandOutputContext(ctx, item.name, item.args...)
		}(i, request)
	}
	wg.Wait()
	return outputs
}

func selectExecutable(cands []string) string {
	for _, p := range cands {
		if strings.Contains(p, "/") {
			if st, err := os.Stat(p); err == nil && !st.IsDir() && st.Mode()&0111 != 0 {
				return p
			}
			continue
		}
		if q, err := exec.LookPath(p); err == nil {
			return q
		}
	}
	return ""
}

func tailFile(path string, lines int, maxBytes int64) string {
	b, err := readLimited(path, maxBytes)
	if err != nil {
		return ""
	}
	parts := strings.Split(strings.TrimRight(string(b), "\r\n"), "\n")
	if len(parts) > lines {
		parts = parts[len(parts)-lines:]
	}
	return strings.Join(parts, "\n")
}

// Keep net imported on Android builds as a cheap runtime sanity check for the stdlib network stack.
var _ = net.IPv4len
