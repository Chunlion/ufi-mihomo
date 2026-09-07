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

const version = "0.3.6"

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
	ConfigStatus       string `json:"configStatus"`
	OptionsStatus      string `json:"optionsStatus"`
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

	out := snapshotResult{OK: true, Version: version, PID: findCorePID(), OptionsStatus: "not_requested"}
	if st, err := os.Stat(*config); err == nil && !st.IsDir() {
		out.ConfigStatus = "ready"
		out.ConfigExists = true
		out.ConfigSize = st.Size()
		if b, err := readLimited(*config, 8<<20); err == nil {
			var parseErr error
			out.ExternalController, out.Secret, out.ProxyCount, parseErr = parseConfigSummary(string(b))
			if parseErr != nil {
				out.ConfigStatus = "invalid_yaml"
				out.OK, out.Error = false, "config summary parsing failed"
			}
			out.SecretSet = out.Secret != ""
		} else {
			out.ConfigStatus = fileReadStatus(err)
			out.OK, out.Error = false, "config summary read failed"
		}
	} else {
		out.ConfigStatus = fileReadStatus(err)
		if err == nil {
			out.ConfigStatus = "not_file"
		}
		if out.ConfigStatus != "missing" {
			out.OK, out.Error = false, "config: "+out.ConfigStatus
		}
	}
	if *options != "" {
		if b, err := readLimited(*options, 2<<20); err == nil {
			out.Options = string(b)
			out.OptionsStatus = "ready"
		} else {
			out.OptionsStatus = fileReadStatus(err)
			if out.OptionsStatus != "missing" {
				out.OK = false
				out.Error = strings.TrimSpace(out.Error + " options: " + out.OptionsStatus)
			}
		}
	}
	props := commandOutputBatch(1200*time.Millisecond, []commandRequest{
		{name: "getprop", args: []string{"ro.product.cpu.abi"}},
		{name: "getprop", args: []string{"ro.build.version.sdk"}},
	})
	if !strings.HasPrefix(props[0], "ERROR:") {
		out.CPUABI = strings.TrimSpace(props[0])
	}
	if !strings.HasPrefix(props[1], "ERROR:") {
		out.AndroidSDK = strings.TrimSpace(props[1])
	}
	writeJSON(out)
}

type summaryProxyCount int

func (count *summaryProxyCount) UnmarshalYAML(node *yaml.Node) error {
	if node.Kind != yaml.SequenceNode {
		return errors.New("proxies must be a sequence")
	}
	for _, item := range node.Content {
		if item.Kind == yaml.AliasNode {
			item = item.Alias
		}
		if item == nil || item.Kind != yaml.MappingNode {
			return errors.New("proxy must be a mapping")
		}
	}
	*count = summaryProxyCount(len(node.Content))
	return nil
}

func parseConfigSummary(text string) (controller, secret string, proxyCount int, err error) {
	var summary struct {
		Controller string            `yaml:"external-controller"`
		Secret     string            `yaml:"secret"`
		Proxies    summaryProxyCount `yaml:"proxies"`
	}
	decoder := yaml.NewDecoder(strings.NewReader(text))
	var document yaml.Node
	if err = decoder.Decode(&document); err != nil {
		return "", "", 0, err
	}
	if len(document.Content) != 1 || document.Content[0].Kind != yaml.MappingNode {
		return "", "", 0, errors.New("config must be a mapping")
	}
	if err = document.Decode(&summary); err != nil {
		return "", "", 0, err
	}
	var extra yaml.Node
	if err = decoder.Decode(&extra); err != io.EOF {
		return "", "", 0, errors.New("expected one YAML document")
	}
	return summary.Controller, summary.Secret, int(summary.Proxies), nil
}

func findCorePID() int {
	return findCorePIDIn("/proc")
}

func findCorePIDIn(proc string) int {
	ents, err := os.ReadDir(proc)
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
		cmd, _ := os.ReadFile(filepath.Join(proc, e.Name(), "cmdline"))
		args := strings.Split(strings.TrimRight(string(cmd), "\x00"), "\x00")
		if len(args) == 0 || args[0] == "" {
			continue
		}
		testing := false
		for _, arg := range args[1:] {
			if arg == "-t" || arg == "--test" || strings.HasPrefix(arg, "--test=") || strings.HasPrefix(arg, "-t=") {
				testing = true
			}
		}
		if testing {
			continue
		}
		exe, err := os.Readlink(filepath.Join(proc, e.Name(), "exe"))
		if err != nil {
			exe = args[0]
		}
		exe = strings.TrimSuffix(exe, " (deleted)")
		score := 0
		switch {
		case exe == "/data/clash/Proxy/Clash.Core":
			score = 100
		case filepath.Base(exe) == "Clash.Core":
			score = 90
		case filepath.Base(exe) == "mihomo":
			score = 80
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

	converted, err := convertSubscription(*input, *output, findConverterSidecar())
	if err != nil {
		fail(err.Error())
	}
	writeJSON(converted)
}

func convertSubscription(input, output, sidecar string) (subscriptionResult, error) {
	b, err := readLimited(input, 16<<20)
	if err != nil {
		return subscriptionResult{}, fmt.Errorf("input: %s", fileReadStatus(err))
	}
	out, count, format, lightErr := normalizeProviderDocument(b)
	if lightErr == nil {
		if err := writeFileAtomic(output, out, 0600); err != nil {
			return subscriptionResult{}, fmt.Errorf("output: %s", fileReadStatus(err))
		}
		return subscriptionResult{OK: true, ProxyCount: count, Format: format}, nil
	}
	cause := "unavailable"
	if sidecar != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
		cmd := exec.CommandContext(ctx, sidecar, "convert-subscription", "--input", input, "--output", output)
		cmd.WaitDelay = time.Second
		capture := &limitedOutput{limit: 64 << 10}
		cmd.Stdout, cmd.Stderr = capture, io.Discard
		runErr := cmd.Run()
		deadline := ctx.Err()
		cancel()
		var converted subscriptionResult
		switch {
		case deadline == context.DeadlineExceeded:
			cause = "timeout"
		case capture.exceeded:
			cause = "output_limit"
		case runErr != nil:
			cause = "execution_failed"
		case json.Unmarshal(capture.Bytes(), &converted) != nil:
			cause = "invalid_response"
		case !converted.OK || converted.ProxyCount <= 0:
			cause = "conversion_failed"
		default:
			return converted, nil
		}
	}
	return subscriptionResult{}, fmt.Errorf("converter=%s; lightweight input unsupported or invalid", cause)
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

var errFileTooLarge = errors.New("file too large")
var errOutputLimit = errors.New("output limit exceeded")

func fileReadStatus(err error) string {
	switch {
	case err == nil:
		return "ready"
	case errors.Is(err, os.ErrNotExist):
		return "missing"
	case errors.Is(err, os.ErrPermission):
		return "permission_denied"
	case errors.Is(err, errFileTooLarge):
		return "too_large"
	default:
		return "io_error"
	}
}

type limitedOutput struct {
	buffer   bytes.Buffer
	limit    int
	exceeded bool
}

func (w *limitedOutput) Bytes() []byte  { return w.buffer.Bytes() }
func (w *limitedOutput) String() string { return w.buffer.String() }

func (w *limitedOutput) Write(p []byte) (int, error) {
	n := len(p)
	remaining := w.limit - w.buffer.Len()
	if len(p) > remaining {
		p = p[:remaining]
		w.exceeded = true
	}
	_, _ = w.buffer.Write(p)
	return n, nil
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
		return nil, fmt.Errorf("%w: %s", errFileTooLarge, path)
	}
	return b, nil
}

func commandOutput(timeout time.Duration, name string, args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	return commandOutputContext(ctx, name, args...)
}

func commandOutputContext(ctx context.Context, name string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	cmd.WaitDelay = time.Second
	capture := &limitedOutput{limit: 256 << 10}
	cmd.Stdout, cmd.Stderr = capture, capture
	err := cmd.Run()
	if ctx.Err() == context.DeadlineExceeded {
		return capture.String(), ctx.Err()
	}
	if capture.exceeded {
		return capture.String(), errOutputLimit
	}
	return capture.String(), err
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
			out, err := commandOutputContext(ctx, item.name, item.args...)
			if err != nil {
				status := "execution_failed"
				if errors.Is(err, errOutputLimit) {
					status = "output_limit"
				}
				if errors.Is(err, context.DeadlineExceeded) {
					status = "timeout"
				}
				if errors.Is(err, exec.ErrNotFound) || errors.Is(err, os.ErrNotExist) {
					status = "command_missing"
				}
				out = fmt.Sprintf("ERROR: %s %s\n%s", item.name, status, out)
			}
			outputs[index] = out
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
	if lines <= 0 || maxBytes <= 0 {
		return ""
	}
	f, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer f.Close()
	st, err := f.Stat()
	if err != nil {
		return ""
	}
	offset := st.Size() - maxBytes
	truncated := offset > 0
	if offset < 0 {
		offset = 0
	}
	if truncated {
		offset--
		maxBytes++
	}
	if _, err = f.Seek(offset, io.SeekStart); err != nil {
		return ""
	}
	b, err := io.ReadAll(io.LimitReader(f, maxBytes))
	if err != nil {
		return ""
	}
	if truncated {
		if i := bytes.IndexByte(b, '\n'); i >= 0 {
			b = b[i+1:]
		}
	}
	parts := strings.Split(strings.TrimRight(string(b), "\r\n"), "\n")
	if len(parts) > lines {
		parts = parts[len(parts)-lines:]
	}
	return strings.Join(parts, "\n")
}

// Keep net imported on Android builds as a cheap runtime sanity check for the stdlib network stack.
var _ = net.IPv4len
