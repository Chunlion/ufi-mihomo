package main

import (
	"bufio"
	"cmp"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"maps"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"slices"
	"strconv"
	"strings"

	"github.com/metacubex/mihomo/common/convert"
	"gopkg.in/yaml.v3"
)

const (
	name                = "kano-f50-helper"
	version             = "0.2.1"
	defaultConfigPath   = "/data/clash/Proxy/config.yaml"
	maxSubscriptionSize = 32 * 1024 * 1024
)

type result struct {
	OK      bool   `json:"ok"`
	Version string `json:"version,omitempty"`
	Error   string `json:"error,omitempty"`
}

func ok() result { return result{OK: true, Version: version} }

type controllerFields struct {
	ExternalController string `json:"externalController"`
	Secret             string `json:"secret"`
	SecretSet          bool   `json:"secretSet"`
}

type policyFields struct {
	Options      string `json:"options"`
	DeviceBypass string `json:"deviceBypass"`
	DirectDomain string `json:"directDomain"`
	DirectIP     string `json:"directIp"`
	ProxyDomain  string `json:"proxyDomain"`
	RejectDomain string `json:"rejectDomain"`
}

type controllerInfo struct {
	result
	controllerFields
}

type pidInfo struct {
	result
	PID string `json:"pid"`
}

type policyState struct {
	result
	policyFields
}

type textResult struct {
	result
	Text string `json:"text"`
}

type subscriptionResult struct {
	result
	Format     string `json:"format"`
	ProxyCount int    `json:"proxyCount"`
}

type probeResult struct {
	result
	GOARCH     string            `json:"goarch"`
	UID        int               `json:"uid"`
	AndroidSDK string            `json:"androidSdk,omitempty"`
	CPUABI     string            `json:"cpuAbi,omitempty"`
	Commands   map[string]string `json:"commands"`
}

type snapshotResult struct {
	result
	controllerFields
	policyFields
	PID          string `json:"pid"`
	ConfigExists bool   `json:"configExists"`
	ConfigSize   int64  `json:"configSize"`
	Clients      string `json:"clients"`
}

func main() {
	if len(os.Args) < 2 {
		fail(errors.New("missing command"))
	}

	switch os.Args[1] {
	case "version":
		writeJSON(ok())
	case "probe":
		runProbe()
	case "core-pid":
		writeJSON(pidInfo{result: ok(), PID: findCorePID()})
	case "controller-info":
		runControllerInfo(os.Args[2:])
	case "policy-read":
		runPolicyRead(os.Args[2:])
	case "clients":
		runClients()
	case "network-status":
		runNetworkStatus(os.Args[2:])
	case "snapshot":
		runSnapshot(os.Args[2:])
	case "convert-subscription":
		runConvertSubscription(os.Args[2:])
	default:
		fail(fmt.Errorf("unsupported command: %s", os.Args[1]))
	}
}

func runConvertSubscription(args []string) {
	fs := flag.NewFlagSet("convert-subscription", flag.ContinueOnError)
	inputPath := fs.String("input", "", "")
	outputPath := fs.String("output", "", "")
	if err := fs.Parse(args); err != nil {
		fail(err)
	}
	if *inputPath == "" || *outputPath == "" {
		fail(errors.New("input and output are required"))
	}

	format, count, err := convertSubscriptionFile(*inputPath, *outputPath)
	if err != nil {
		fail(err)
	}
	writeJSON(subscriptionResult{
		result:     ok(),
		Format:     format,
		ProxyCount: count,
	})
}

func convertSubscriptionFile(inputPath, outputPath string) (string, int, error) {
	info, err := os.Stat(inputPath)
	if err != nil {
		return "", 0, fmt.Errorf("read subscription: %w", err)
	}
	if info.Size() <= 0 {
		return "", 0, errors.New("subscription is empty")
	}
	if info.Size() > maxSubscriptionSize {
		return "", 0, fmt.Errorf("subscription exceeds %d bytes", maxSubscriptionSize)
	}

	content, err := os.ReadFile(inputPath)
	if err != nil {
		return "", 0, fmt.Errorf("read subscription: %w", err)
	}

	proxies, format := clashSubscriptionProxies(content)
	if len(proxies) == 0 {
		proxies, err = convert.ConvertsV2Ray(content)
		if err != nil {
			return "", 0, errors.New("unsupported subscription format")
		}
		format = "share-links"
	}
	if err := validateSubscriptionProxies(proxies); err != nil {
		return "", 0, err
	}

	output, err := yaml.Marshal(map[string]any{"proxies": proxies})
	if err != nil {
		return "", 0, fmt.Errorf("encode provider yaml: %w", err)
	}
	if err := writeFileAtomic(outputPath, output, 0600); err != nil {
		return "", 0, err
	}
	return format, len(proxies), nil
}

func clashSubscriptionProxies(content []byte) ([]map[string]any, string) {
	var document struct {
		Proxies []map[string]any `yaml:"proxies"`
	}
	if err := yaml.Unmarshal(content, &document); err != nil || len(document.Proxies) == 0 {
		return nil, ""
	}
	return document.Proxies, "clash-yaml"
}

func validateSubscriptionProxies(proxies []map[string]any) error {
	if len(proxies) == 0 {
		return errors.New("subscription contains no proxies")
	}
	names := make(map[string]struct{}, len(proxies))
	for index, proxy := range proxies {
		name, _ := proxy["name"].(string)
		name = strings.TrimSpace(name)
		proxyType, _ := proxy["type"].(string)
		proxyType = strings.TrimSpace(proxyType)
		if name == "" || proxyType == "" {
			return fmt.Errorf("proxy %d is missing name or type", index+1)
		}
		if _, exists := names[name]; exists {
			return fmt.Errorf("duplicate proxy name at item %d", index+1)
		}
		names[name] = struct{}{}
	}
	return nil
}

func writeFileAtomic(path string, content []byte, mode os.FileMode) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return fmt.Errorf("create output directory: %w", err)
	}
	temp, err := os.CreateTemp(dir, "."+filepath.Base(path)+".tmp-*")
	if err != nil {
		return fmt.Errorf("create temporary output: %w", err)
	}
	tempPath := temp.Name()
	committed := false
	defer func() {
		_ = temp.Close()
		if !committed {
			_ = os.Remove(tempPath)
		}
	}()
	if err := temp.Chmod(mode); err != nil {
		return fmt.Errorf("set output permissions: %w", err)
	}
	if _, err := temp.Write(content); err != nil {
		return fmt.Errorf("write output: %w", err)
	}
	if err := temp.Sync(); err != nil {
		return fmt.Errorf("sync output: %w", err)
	}
	if err := temp.Close(); err != nil {
		return fmt.Errorf("close output: %w", err)
	}
	if err := os.Rename(tempPath, path); err != nil {
		return fmt.Errorf("commit output: %w", err)
	}
	committed = true
	return nil
}

func runSnapshot(args []string) {
	fs := flag.NewFlagSet("snapshot", flag.ContinueOnError)
	configPath := fs.String("config", defaultConfigPath, "")
	policy := registerPolicyFlags(fs)
	if err := fs.Parse(args); err != nil {
		fail(err)
	}

	controller, err := readControllerFields(*configPath)
	if err != nil {
		fail(err)
	}
	var configExists bool
	var configSize int64
	if info, statErr := os.Stat(*configPath); statErr == nil {
		configExists = true
		configSize = info.Size()
	}
	writeJSON(snapshotResult{
		result:           ok(),
		controllerFields: controller,
		policyFields:     policy.read(),
		PID:              findCorePID(),
		ConfigExists:     configExists,
		ConfigSize:       configSize,
		Clients:          clientListText(),
	})
}

func runProbe() {
	commands := make(map[string]string)
	for _, command := range []string{"sh", "iptables", "ip6tables", "curl", "timeout"} {
		if path, err := exec.LookPath(command); err == nil {
			commands[command] = path
		}
	}
	writeJSON(probeResult{
		result:     ok(),
		GOARCH:     runtime.GOARCH,
		UID:        os.Getuid(),
		AndroidSDK: commandOutput("getprop", "ro.build.version.sdk"),
		CPUABI:     commandOutput("getprop", "ro.product.cpu.abi"),
		Commands:   commands,
	})
}

func runControllerInfo(args []string) {
	fs := flag.NewFlagSet("controller-info", flag.ContinueOnError)
	configPath := fs.String("config", defaultConfigPath, "")
	if err := fs.Parse(args); err != nil {
		fail(err)
	}

	controller, err := readControllerFields(*configPath)
	if err != nil {
		fail(err)
	}
	writeJSON(controllerInfo{result: ok(), controllerFields: controller})
}

func runPolicyRead(args []string) {
	fs := flag.NewFlagSet("policy-read", flag.ContinueOnError)
	policy := registerPolicyFlags(fs)
	if err := fs.Parse(args); err != nil {
		fail(err)
	}
	writeJSON(policyState{result: ok(), policyFields: policy.read()})
}

type policyFlags struct {
	options, device, directDomain, directIP, proxyDomain, rejectDomain *string
}

func registerPolicyFlags(fs *flag.FlagSet) policyFlags {
	return policyFlags{
		options:      fs.String("options", "", ""),
		device:       fs.String("device", "", ""),
		directDomain: fs.String("direct-domain", "", ""),
		directIP:     fs.String("direct-ip", "", ""),
		proxyDomain:  fs.String("proxy-domain", "", ""),
		rejectDomain: fs.String("reject-domain", "", ""),
	}
}

func (p policyFlags) read() policyFields {
	return policyFields{
		Options:      readText(*p.options),
		DeviceBypass: readText(*p.device),
		DirectDomain: readText(*p.directDomain),
		DirectIP:     readText(*p.directIP),
		ProxyDomain:  readText(*p.proxyDomain),
		RejectDomain: readText(*p.rejectDomain),
	}
}

func readControllerFields(configPath string) (controllerFields, error) {
	controller, secret, err := readController(configPath)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return controllerFields{}, err
	}
	return controllerFields{
		ExternalController: controller,
		Secret:             secret,
		SecretSet:          secret != "",
	}, nil
}

func runClients() {
	writeJSON(textResult{result: ok(), Text: clientListText()})
}

func clientListText() string {
	rows := map[string]string{}
	if file, err := os.Open("/proc/net/arp"); err == nil {
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			fields := strings.Fields(scanner.Text())
			if len(fields) >= 4 && fields[0] != "IP" && fields[3] != "00:00:00:00:00:00" {
				rows[fields[0]+" "+strings.ToUpper(fields[3])] = "arp"
			}
		}
		_ = file.Close()
	}

	if output, err := exec.Command("ip", "neigh").Output(); err == nil {
		scanner := bufio.NewScanner(strings.NewReader(string(output)))
		for scanner.Scan() {
			fields := strings.Fields(scanner.Text())
			if len(fields) < 5 {
				continue
			}
			for i := 1; i+1 < len(fields); i++ {
				if fields[i] == "lladdr" {
					rows[fields[0]+" "+strings.ToUpper(fields[i+1])] = "neigh"
					break
				}
			}
		}
	}

	keys := slices.Sorted(maps.Keys(rows))
	var output strings.Builder
	output.WriteString("IP MAC SOURCE\n")
	for _, key := range keys {
		fmt.Fprintf(&output, "%s %s\n", key, rows[key])
	}
	return strings.TrimSpace(output.String())
}

func runNetworkStatus(args []string) {
	fs := flag.NewFlagSet("network-status", flag.ContinueOnError)
	logPath := fs.String("log", "", "")
	yqRuntime := fs.String("yq-runtime", "", "")
	clashDir := fs.String("clash-dir", "/data/clash", "")
	if err := fs.Parse(args); err != nil {
		fail(err)
	}

	var output strings.Builder
	fmt.Fprintf(&output, "[process]\npid=%s\n\n", findCorePID())
	output.WriteString("[listen ports]\n")
	listeners := commandOutput("ss", "-lntup")
	if listeners == "" {
		listeners = commandOutput("netstat", "-lntup")
	}
	for _, line := range strings.Split(listeners, "\n") {
		if containsAny(line, ":7788", ":7890", ":7891", ":7892", ":7893", ":7895", ":1053") {
			output.WriteString(line + "\n")
		}
	}

	for _, family := range []struct {
		name string
		bin  string
	}{
		{name: "IPv4", bin: selectIPTables("iptables")},
		{name: "IPv6", bin: selectIPTables("ip6tables")},
	} {
		fmt.Fprintf(&output, "\n[%s firewall: %s]\n", family.name, cmp.Or(family.bin, "unavailable"))
		if family.bin == "" {
			continue
		}
		appendFilteredCommand(&output, family.bin, []string{"-t", "mangle", "-S", "PREROUTING"}, "KANO", "TPROXY", "7895", "clash", "mihomo")
		appendFilteredCommand(&output, family.bin, []string{"-t", "nat", "-S", "PREROUTING"}, "KANO", "1053", "789")
		appendFilteredCommand(&output, family.bin, []string{"-t", "filter", "-S", "FORWARD"}, "KANO", "--dport 443", "443")
	}

	output.WriteString("\n[filesystem]\n")
	if mounts := readText("/proc/mounts"); mounts != "" {
		for _, line := range strings.Split(mounts, "\n") {
			fields := strings.Fields(line)
			if len(fields) >= 2 && (fields[1] == "/data" || fields[1] == "/tmp") {
				output.WriteString(line + "\n")
			}
		}
	}
	output.WriteString(commandOutput("df", "-k", "/data", "/tmp") + "\n")

	output.WriteString("\n[yq runtime]\n")
	if info, err := os.Stat(*yqRuntime); err == nil {
		fmt.Fprintf(&output, "%s mode=%s\n", *yqRuntime, info.Mode())
	}

	output.WriteString("\n[geodata]\n")
	for _, base := range []string{filepath.Join(*clashDir, "Proxy"), *clashDir} {
		for _, fileName := range []string{"Country.mmdb", "GeoIP.dat", "geoip.dat", "GeoSite.dat", "geosite.dat"} {
			path := filepath.Join(base, fileName)
			if info, err := os.Stat(path); err == nil {
				fmt.Fprintf(&output, "%s %d bytes\n", path, info.Size())
			}
		}
	}

	output.WriteString("\n[last logs]\n")
	output.WriteString(tailLines(readText(*logPath), 80))
	writeJSON(textResult{result: ok(), Text: strings.TrimSpace(output.String())})
}

func readController(path string) (string, string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", "", err
	}
	defer file.Close()

	var controller, secret string
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 64*1024), 4*1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if controller == "" && strings.HasPrefix(line, "external-controller:") {
			controller = yamlScalar(strings.TrimPrefix(line, "external-controller:"))
		}
		if secret == "" && strings.HasPrefix(line, "secret:") {
			secret = yamlScalar(strings.TrimPrefix(line, "secret:"))
		}
		if controller != "" && secret != "" {
			break
		}
	}
	return controller, secret, scanner.Err()
}

func yamlScalar(value string) string {
	value = strings.TrimSpace(value)
	var quote rune
	var escaped bool
	for index, current := range value {
		if index == 0 && (current == '\'' || current == '"') {
			quote = current
			continue
		}
		if current == '\\' && quote == '"' && !escaped {
			escaped = true
			continue
		}
		if current == quote && !escaped {
			value = value[:index+1]
			break
		}
		if current == '#' && quote == 0 {
			value = value[:index]
			break
		}
		escaped = false
	}
	value = strings.TrimSpace(value)
	if len(value) >= 2 && ((value[0] == '\'' && value[len(value)-1] == '\'') || (value[0] == '"' && value[len(value)-1] == '"')) {
		value = value[1 : len(value)-1]
	}
	return strings.TrimSpace(value)
}

func findCorePID() string {
	for _, processName := range []string{"Clash.Core", "Clash", "mihomo"} {
		fields := strings.Fields(commandOutput("pidof", processName))
		if len(fields) > 0 {
			return fields[0]
		}
	}

	entries, err := os.ReadDir("/proc")
	if err != nil {
		return ""
	}
	type candidate struct {
		pid  int
		text string
	}
	var candidates []candidate
	for _, entry := range entries {
		pid, err := strconv.Atoi(entry.Name())
		if err != nil || pid <= 0 {
			continue
		}
		comm := strings.TrimSpace(readText(filepath.Join("/proc", entry.Name(), "comm")))
		cmdlineBytes, _ := os.ReadFile(filepath.Join("/proc", entry.Name(), "cmdline"))
		cmdline := strings.ReplaceAll(string(cmdlineBytes), "\x00", " ")
		text := strings.ToLower(comm + " " + cmdline)
		if strings.Contains(text, "clash.core") || strings.Contains(text, "/data/clash") || strings.Contains(text, "mihomo") {
			candidates = append(candidates, candidate{pid: pid, text: text})
		}
	}
	slices.SortFunc(candidates, func(a, b candidate) int { return cmp.Compare(a.pid, b.pid) })
	for _, item := range candidates {
		if !strings.Contains(item.text, name) {
			return strconv.Itoa(item.pid)
		}
	}
	return ""
}

func selectIPTables(name string) string {
	var first string
	for _, candidate := range commandCandidates(name) {
		if first == "" {
			first = candidate
		}
		output := commandOutput(candidate, "-t", "mangle", "-S", "PREROUTING")
		if containsAny(strings.ToLower(output), "kano", "tproxy", "clash", "mihomo") {
			return candidate
		}
	}
	return first
}

func commandCandidates(name string) []string {
	variants := []string{name, name + "-legacy", name + "-nft"}
	seen := map[string]bool{}
	var result []string
	for _, command := range variants {
		if path, err := exec.LookPath(command); err == nil && !seen[path] {
			seen[path] = true
			result = append(result, path)
		}
	}
	for _, base := range []string{"/system/bin", "/system/xbin", "/vendor/bin", "/sbin"} {
		for _, command := range variants {
			path := filepath.Join(base, command)
			if info, err := os.Stat(path); err == nil && info.Mode().IsRegular() && info.Mode().Perm()&0111 != 0 && !seen[path] {
				seen[path] = true
				result = append(result, path)
			}
		}
	}
	return result
}

func appendFilteredCommand(output *strings.Builder, command string, args []string, markers ...string) {
	lowered := lowerAll(markers...)
	text := commandOutput(command, args...)
	for _, line := range strings.Split(text, "\n") {
		if containsAny(strings.ToLower(line), lowered...) {
			output.WriteString(line + "\n")
		}
	}
}

func commandOutput(command string, args ...string) string {
	path, err := exec.LookPath(command)
	if err != nil && !filepath.IsAbs(command) {
		return ""
	}
	if err == nil {
		command = path
	}
	output, err := exec.Command(command, args...).CombinedOutput()
	if err != nil && len(output) == 0 {
		return ""
	}
	return strings.TrimSpace(string(output))
}

func readText(path string) string {
	if path == "" {
		return ""
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return strings.TrimRight(string(content), "\r\n")
}

func tailLines(text string, count int) string {
	lines := strings.Split(strings.TrimRight(text, "\r\n"), "\n")
	if len(lines) > count {
		lines = lines[len(lines)-count:]
	}
	return strings.Join(lines, "\n")
}

func containsAny(value string, markers ...string) bool {
	for _, marker := range markers {
		if strings.Contains(value, marker) {
			return true
		}
	}
	return false
}

func lowerAll(values ...string) []string {
	result := make([]string, len(values))
	for index, value := range values {
		result[index] = strings.ToLower(value)
	}
	return result
}

func writeJSON(value any) {
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetEscapeHTML(false)
	if err := encoder.Encode(value); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func fail(err error) {
	writeJSON(result{OK: false, Version: version, Error: err.Error()})
	os.Exit(1)
}
