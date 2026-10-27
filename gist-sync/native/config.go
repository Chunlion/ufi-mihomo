// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type Fingerprint struct {
	Config string `json:"config"`
	Source string `json:"source"`
	Policy string `json:"policy"`
}

func (a *App) yamlEnv() ([]string, error) {
	p := a.data() + "/yq-runtime"
	if a.ReadOnly {
		if e := noLinks(p); e != nil {
			return nil, e
		}
		if !exists(p) {
			return nil, fail("yaml_runtime_not_ready")
		}
	} else if e := privateDir(p); e != nil {
		return nil, e
	}
	return []string{"HOME=" + p, "XDG_CONFIG_HOME=" + p, "TMPDIR=" + p, "TMP=" + p, "TEMP=" + p, "F50_YQ_RUNTIME=" + p}, nil
}
func (a *App) readYAML(ctx context.Context, path string) (map[string]any, error) {
	if _, e := readFile(path, maxConfig); e != nil {
		return nil, e
	}
	env, e := a.yamlEnv()
	if e != nil {
		return nil, e
	}
	yq := filepath.Join(a.Root, "Tools/yq_linux_arm64")
	if e = noLinks(yq); e != nil {
		return nil, e
	}
	// Same merge-anchor switch as the browser bridge, when the installed yq has it.
	args := []string{"eval", "-o=json", "-I=0"}
	help, _ := run(ctx, 5*time.Second, env, yq, "--help")
	if strings.Contains(string(help), "--yaml-fix-merge-anchor-to-spec") {
		args = append(args, "--yaml-fix-merge-anchor-to-spec")
	}
	args = append(args, ".", path)
	b, e := run(ctx, 15*time.Second, env, yq, args...)
	if e != nil {
		return nil, fail("yaml_parse_failed")
	}
	vobj, e := parseJSON(b)
	if e != nil {
		return nil, e
	}
	m := obj(vobj)
	if m == nil {
		return nil, fail("yaml_root_mapping_required")
	}
	return m, nil
}
func (a *App) fingerprint(ctx context.Context) (Fingerprint, error) {
	m, e := a.readYAML(ctx, a.cfg())
	if e != nil {
		return Fingerprint{}, fail("current_config_unreadable")
	}
	return a.fingerprintYAML(m)
}
func (a *App) fingerprintYAML(m map[string]any) (Fingerprint, error) {
	s, e := fileHash(a.source())
	if e != nil {
		return Fingerprint{}, e
	}
	p, e := a.policyHash()
	if e != nil {
		return Fingerprint{}, e
	}
	return Fingerprint{canonical(m), s, p}, nil
}
func (a *App) policyHash() (string, error) {
	m := map[string]string{}
	for _, p := range []string{"options.conf", "device_bypass.txt", "direct_domain.list", "direct_ip.list", "proxy_domain.list", "reject_domain.list"} {
		h, e := fileHash(filepath.Join(a.Root, "Policy", p))
		if e != nil {
			return "", e
		}
		m[p] = h
	}
	return canonical(m), nil
}
func (a *App) options(ctx context.Context) (map[string]string, []string, error) {
	b, e := readFile(filepath.Join(a.Root, "Policy/options.conf"), 64<<10)
	if e != nil && !os.IsNotExist(e) {
		return nil, nil, e
	}
	o := parseOptions(string(b))
	if o["traffic_mode"] == "tun" {
		stack := o["tun_stack"]
		if stack == "auto" || stack == "mips" || stack == "" {
			v, e := run(ctx, 5*time.Second, nil, filepath.Join(a.Root, "Proxy/Clash.Core"), "-v")
			if e != nil {
				return nil, nil, fail("core_version_unavailable")
			}
			m := regexp.MustCompile(`[vV]([0-9]+)\.([0-9]+)\.([0-9]+)`).FindSubmatch(v)
			modern := false
			if len(m) == 4 {
				a, _ := strconv.Atoi(string(m[1]))
				b, _ := strconv.Atoi(string(m[2]))
				c, _ := strconv.Atoi(string(m[3]))
				modern = a > 1 || a == 1 && (b > 19 || b == 19 && c >= 31)
			}
			if stack == "mips" && !modern {
				return nil, nil, fail("mips_requires_mihomo_1_19_31")
			}
			if modern {
				o["tun_stack"] = "mips"
			} else if o["ipv6"] == "on" {
				o["tun_stack"] = "gvisor"
			} else {
				o["tun_stack"] = "mixed"
			}
		}
	}
	connected := []string{}
	if o["private_route_enabled"] == "on" && o["traffic_mode"] != "off" {
		families := []string{"-4"}
		if o["ipv6"] == "on" {
			families = append(families, "-6")
		}
		re := regexp.MustCompile(`^\s*\d+:\s+(\S+)\s+inet6?\s+(\S+)`)
		skip := regexp.MustCompile(`(?i)^(KanoTun|Mihomo|Meta|utun\d*|tun\d*)$`)
		for _, family := range families {
			b, e := run(ctx, 5*time.Second, nil, "ip", "-o", family, "addr", "show")
			if e != nil {
				return nil, nil, fail("connected_networks_unreadable")
			}
			for _, line := range strings.Split(string(b), "\n") {
				m := re.FindStringSubmatch(line)
				if len(m) == 3 && !skip.MatchString(strings.Split(m[1], "@")[0]) {
					connected = append(connected, m[2])
				}
			}
		}
		if len(connected) == 0 {
			return nil, nil, fail("connected_networks_empty")
		}
	}
	return o, connected, nil
}
func (a *App) candidate(ctx context.Context, plain, work string, manualSources *[]ManualSource) (string, string, error) {
	m, e := a.readYAML(ctx, plain)
	if e != nil {
		return "", "", e
	}
	var sources []ManualSource
	if manualSources != nil {
		sources = *manualSources
	} else {
		sources, e = a.manualSources()
		if e != nil {
			return "", "", e
		}
	}
	if e = mergeManualSources(m, sources); e != nil {
		return "", "", e
	}
	m[gistMeta] = true
	o, c, e := a.options(ctx)
	if e != nil {
		return "", "", e
	}
	m, e = normalizeConfig(m, o, c)
	if e != nil {
		return "", "", e
	}
	live, e := a.readYAML(ctx, a.cfg())
	if e != nil {
		return "", "", fail("live_secret_read_failed")
	}
	if raw, ok := live["secret"]; ok && raw != nil {
		if _, valid := raw.(string); !valid {
			return "", "", fail("live_secret_type_invalid")
		}
	}
	secret := str(live["secret"])
	if strings.TrimSpace(secret) == "" {
		secret = "123456"
	}
	m["secret"] = secret
	if e = a.checkProviderPaths(m); e != nil {
		return "", "", e
	}
	input := work + "/candidate.json"
	if e = atomicWrite(input, jsonBytes(m), 0600); e != nil {
		return "", "", e
	}
	env, e := a.yamlEnv()
	if e != nil {
		return "", "", e
	}
	b, e := run(ctx, 15*time.Second, env, filepath.Join(a.Root, "Tools/yq_linux_arm64"), "eval", "-p=json", "-P", "-o=yaml", "-I=2", ".", input)
	if e != nil {
		return "", "", fail("yaml_render_failed")
	}
	path := work + "/candidate.yaml"
	if e = atomicWrite(path, b, 0600); e != nil {
		return "", "", e
	}
	actual, e := a.readYAML(ctx, path)
	if e != nil {
		return "", "", e
	}
	if canonical(actual) != canonical(m) {
		return "", "", fail("yaml_roundtrip_mismatch")
	}
	if e = a.testCore(ctx, path); e != nil {
		return "", "", e
	}
	return path, canonical(m), nil
}
func (a *App) testCore(ctx context.Context, path string) error {
	if e := a.point("core_test"); e != nil {
		return e
	}
	_, e := run(ctx, 45*time.Second, nil, filepath.Join(a.Root, "Proxy/Clash.Core"), "-t", "-d", filepath.Join(a.Root, "Proxy"), "-f", path)
	if e != nil {
		return fail("mihomo_config_invalid")
	}
	return nil
}
func (a *App) corePID() (int, error) {
	entries, e := os.ReadDir("/proc")
	if e != nil {
		return 0, fail("process_table_unreadable")
	}
	found := 0
	for _, entry := range entries {
		pid, e := strconv.Atoi(entry.Name())
		if e != nil {
			continue
		}
		exe, e := os.Readlink(fmt.Sprintf("/proc/%d/exe", pid))
		if e != nil {
			continue
		}
		if strings.TrimSuffix(exe, " (deleted)") != filepath.Join(a.Root, "Proxy/Clash.Core") {
			continue
		}
		if _, e = processStart(pid); e != nil {
			continue
		}
		args, e := os.ReadFile(fmt.Sprintf("/proc/%d/cmdline", pid))
		if e != nil {
			return 0, fail("core_state_unreadable")
		}
		test := false
		for _, arg := range strings.Split(string(args), "\x00") {
			if arg == "-t" || arg == "--test" {
				test = true
			}
		}
		if test {
			continue
		}
		if found != 0 {
			return 0, fail("multiple_core_processes")
		}
		found = pid
	}
	return found, nil
}
func (a *App) service(ctx context.Context, l *Lease, tx string, args ...string) error {
	if e := l.Check(); e != nil {
		return e
	}
	argv := append([]string{a.scripts("Clash.Service")}, args...)
	b, e := run(ctx, 100*time.Second, l.Env(tx), "sh", argv...)
	if e != nil {
		return fail("service_operation_failed")
	}
	if regexp.MustCompile(`(?m)^F50_ERROR=`).Match(b) {
		return fail("service_operation_failed")
	}
	if len(args) > 0 && (args[0] == "start" || args[0] == "restart") && !strings.Contains(string(b), "START_STATE=started_verified_process") {
		return fail("service_start_unverified")
	}
	return nil
}
func (a *App) commitPair(ctx context.Context, l *Lease, stage, sourceStage string, removeSource, protect, backup bool, tx string) error {
	if e := l.Check(); e != nil {
		return e
	}
	if e := a.point("commit"); e != nil {
		return e
	}
	env, _ := a.yamlEnv()
	env = append(env, l.Env(tx)...)
	flag := func(v bool) string {
		if v {
			return "1"
		}
		return "0"
	}
	env = append(env, "TARGET="+a.cfg(), "STAGE="+stage, "SOURCE_FILE="+a.source(), "SOURCE_VALUE=uploaded_config", "WITH_SOURCE=1", "SOURCE_STAGE="+sourceStage, "SOURCE_DELETE="+flag(removeSource), "PROTECT_SECRET="+flag(protect), "BACKUP_REQUESTED="+flag(backup), "BACKUP_TAG=gist_sync", "YQ="+filepath.Join(a.Root, "Tools/yq_linux_arm64"))
	b, e := run(ctx, 50*time.Second, env, "sh", a.scripts("Clash.ConfigCommit"))
	if e != nil {
		return fail("config_commit_failed")
	}
	if !regexp.MustCompile(`(?m)^YAML_COMMIT_(OK|UNCHANGED)=1$`).Match(b) {
		return fail("config_commit_unconfirmed")
	}
	return nil
}
func (a *App) recoverGeneric(ctx context.Context, l *Lease) error {
	if !exists(a.cfg() + ".kano_tx") {
		return nil
	}
	env := append(l.Env(""), "TARGET="+a.cfg(), "SOURCE_FILE="+a.source())
	_, e := run(ctx, 20*time.Second, env, "sh", a.scripts("Clash.ConfigCommit"), "recover")
	if e != nil {
		return fail("config_journal_recovery_failed")
	}
	return nil
}
func safeJSONString(v any) string { b, _ := json.Marshal(v); return string(b) }
