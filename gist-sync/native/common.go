// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"
)

const version = "1.0.0-rc4"
const maxConfig int64 = 8 << 20
const maxRequest int64 = 16 << 10
const ageVersion = "v1.3.2"

// Public error codes, never subprocess output, URLs, YAML, or identities.
type codedError string

func (e codedError) Error() string { return string(e) }
func code(e error) string {
	if e == nil {
		return ""
	}
	var c codedError
	if errors.As(e, &c) {
		return string(c)
	}
	if errors.Is(e, context.Canceled) {
		return "cancelled"
	}
	if errors.Is(e, context.DeadlineExceeded) {
		return "timeout"
	}
	if errors.Is(e, syscall.ENOSPC) {
		return "disk_full"
	}
	return "io_or_process_error"
}
func fail(s string) error { return codedError(s) }
func nonce() string {
	var b [16]byte
	if _, e := rand.Read(b[:]); e != nil {
		panic("random_source_failed")
	}
	return hex.EncodeToString(b[:])
}
func hashBytes(b []byte) string { h := sha256.Sum256(b); return hex.EncodeToString(h[:]) }
func jsonBytes(v any) []byte {
	b, e := json.Marshal(v)
	if e != nil {
		panic(e)
	}
	return append(b, '\n')
}
func exists(p string) bool     { _, e := os.Lstat(p); return e == nil }
func canonical(v any) string   { return hashBytes(jsonBytes(v)) }
func str(v any) string         { s, _ := v.(string); return s }
func obj(v any) map[string]any { m, _ := v.(map[string]any); return m }
func clone(v any) any {
	b := jsonBytes(v)
	n, e := parseJSON(b)
	if e != nil {
		panic(e)
	}
	return n
}

// A root-owned /data tree is a prerequisite. Refuse symlinked ancestors too.
func noLinks(p string) error {
	p = filepath.Clean(p)
	for {
		st, e := os.Lstat(p)
		if e == nil && st.Mode()&os.ModeSymlink != 0 {
			return fail("unsafe_symlink")
		}
		if e != nil && !os.IsNotExist(e) {
			return e
		}
		n := filepath.Dir(p)
		if n == p {
			break
		}
		p = n
	}
	return nil
}
func privateDir(p string) error {
	if e := noLinks(p); e != nil {
		return e
	}
	if e := os.MkdirAll(p, 0700); e != nil {
		return e
	}
	return os.Chmod(p, 0700)
}
func readFile(p string, limit int64) ([]byte, error) {
	if e := noLinks(p); e != nil {
		return nil, e
	}
	f, e := os.OpenFile(p, os.O_RDONLY|syscall.O_NOFOLLOW, 0)
	if e != nil {
		return nil, e
	}
	defer f.Close()
	st, e := f.Stat()
	if e != nil {
		return nil, e
	}
	if !st.Mode().IsRegular() {
		return nil, fail("not_regular_file")
	}
	if st.Size() > limit {
		return nil, fail("file_too_large")
	}
	b, e := io.ReadAll(io.LimitReader(f, limit+1))
	if e != nil {
		return nil, e
	}
	if int64(len(b)) > limit {
		return nil, fail("file_too_large")
	}
	return b, nil
}
func fileHash(p string) (string, error) {
	b, e := readFile(p, maxConfig*4)
	if os.IsNotExist(e) {
		return "absent", nil
	}
	if e != nil {
		return "", e
	}
	return hashBytes(b), nil
}
func dirSync(p string) error {
	f, e := os.Open(p)
	if e != nil {
		return e
	}
	defer f.Close()
	return f.Sync()
}
func atomicWrite(p string, b []byte, mode os.FileMode) error {
	if e := noLinks(p); e != nil {
		return e
	}
	f, e := os.OpenFile(p+".new."+nonce(), os.O_WRONLY|os.O_CREATE|os.O_EXCL|syscall.O_NOFOLLOW, mode)
	if e != nil {
		return e
	}
	tmp := f.Name()
	defer os.Remove(tmp)
	if _, e = f.Write(b); e == nil {
		e = f.Sync()
	}
	ce := f.Close()
	if e == nil {
		e = ce
	}
	if e != nil {
		return e
	}
	if e = os.Rename(tmp, p); e != nil {
		return e
	}
	return dirSync(filepath.Dir(p))
}
func writeJSON(p string, v any) error { return atomicWrite(p, jsonBytes(v), 0600) }
func readJSON(p string, v any) error {
	b, e := readFile(p, maxConfig)
	if e != nil {
		return e
	}
	return json.Unmarshal(b, v)
}
func copyPrivate(src, dst string) error {
	b, e := readFile(src, maxConfig*4)
	if e != nil {
		return e
	}
	return atomicWrite(dst, b, 0600)
}
func secureRemove(p string) error {
	if e := noLinks(p); e != nil {
		return e
	}
	return os.RemoveAll(p)
}

// Strict JSON bridge rejects duplicate keys, multi-document output and unsafe JS integers.
func parseJSON(b []byte) (any, error) {
	d := json.NewDecoder(bytes.NewReader(b))
	d.UseNumber()
	var value func(int) (any, error)
	value = func(depth int) (any, error) {
		if depth > 128 {
			return nil, fail("yaml_depth_limit")
		}
		t, e := d.Token()
		if e != nil {
			return nil, fail("yaml_invalid")
		}
		switch x := t.(type) {
		case json.Delim:
			if x == '{' {
				m := map[string]any{}
				for d.More() {
					k, e := d.Token()
					if e != nil {
						return nil, fail("yaml_invalid")
					}
					s, ok := k.(string)
					if !ok {
						return nil, fail("yaml_invalid")
					}
					if _, ok = m[s]; ok {
						return nil, fail("yaml_duplicate_key")
					}
					v, e := value(depth + 1)
					if e != nil {
						return nil, e
					}
					m[s] = v
				}
				t, e = d.Token()
				if e != nil || t != json.Delim('}') {
					return nil, fail("yaml_invalid")
				}
				return m, nil
			}
			if x == '[' {
				a := []any{}
				for d.More() {
					v, e := value(depth + 1)
					if e != nil {
						return nil, e
					}
					a = append(a, v)
				}
				t, e = d.Token()
				if e != nil || t != json.Delim(']') {
					return nil, fail("yaml_invalid")
				}
				return a, nil
			}
			return nil, fail("yaml_invalid")
		case json.Number:
			n, e := strconv.ParseFloat(string(x), 64)
			if e != nil {
				return nil, fail("yaml_number_range")
			}
			if n > 9007199254740991 || n < -9007199254740991 {
				return nil, fail("yaml_number_range")
			}
			return n, nil
		default:
			return t, nil
		}
	}
	v, e := value(0)
	if e != nil {
		return nil, e
	}
	if _, e = d.Token(); e != io.EOF {
		return nil, fail("yaml_multiple_documents")
	}
	return v, nil
}

type boundedBuffer struct {
	buffer bytes.Buffer
	max    int
}

func (b *boundedBuffer) Len() int      { return b.buffer.Len() }
func (b *boundedBuffer) Bytes() []byte { return b.buffer.Bytes() }
func (b *boundedBuffer) Write(p []byte) (int, error) {
	if b.Len()+len(p) > b.max {
		return 0, fail("process_output_limit")
	}
	return b.buffer.Write(p)
}
func run(ctx context.Context, timeout time.Duration, env []string, name string, args ...string) ([]byte, error) {
	cctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	c := exec.CommandContext(cctx, name, args...)
	c.Env = append(os.Environ(), env...)
	// Kill the complete short-lived command tree, not just its shell parent.
	c.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	c.Cancel = func() error {
		if c.Process == nil {
			return nil
		}
		e := syscall.Kill(-c.Process.Pid, syscall.SIGKILL)
		if e == syscall.ESRCH {
			return os.ErrProcessDone
		}
		return e
	}
	c.WaitDelay = 2 * time.Second
	out := &boundedBuffer{max: int(maxConfig + 1)}
	c.Stdout = out
	c.Stderr = io.Discard
	e := c.Run()
	if cctx.Err() != nil {
		return nil, cctx.Err()
	}
	if e != nil {
		return nil, e
	}
	return out.Bytes(), nil
}
func processStart(pid int) (string, error) {
	b, e := os.ReadFile(fmt.Sprintf("/proc/%d/stat", pid))
	if e != nil {
		return "", e
	}
	i := strings.LastIndex(string(b), ") ")
	if i < 0 {
		return "", fail("process_identity_unknown")
	}
	f := strings.Fields(string(b[i+2:]))
	if len(f) < 20 || f[0] == "Z" || f[0] == "X" {
		return "", fail("process_dead")
	}
	return f[19], nil
}
func alive(pid int, start string) bool { s, e := processStart(pid); return e == nil && s == start }
func bootID() string {
	b, e := os.ReadFile("/proc/sys/kernel/random/boot_id")
	if e != nil {
		return "unknown"
	}
	return strings.TrimSpace(string(b))
}

var idRE = regexp.MustCompile(`^[0-9a-f]{32}$`)

type App struct {
	Root, Dev, Boot, Upload string
	HTTPClient              httpDoer
	ReadOnly                bool
	Hook                    func(string) error // Internal fault injection; no environment-variable bypass.
}

func defaultApp() *App {
	return &App{Root: "/data/clash", Dev: "/dev", Boot: "/sdcard/ufi_tools_boot.sh", Upload: "/data/data/com.minikano.f50_sms/files"}
}
func (a *App) data() string            { return filepath.Join(a.Root, "Tools/gist-sync") }
func (a *App) runtime() string         { return filepath.Join(a.Dev, "kano_gist_sync") }
func (a *App) cfg() string             { return filepath.Join(a.Root, "Proxy/config.yaml") }
func (a *App) source() string          { return filepath.Join(a.Root, "Tools/config_source.conf") }
func (a *App) scripts(s string) string { return filepath.Join(a.Root, "Scripts", s) }
func (a *App) point(s string) error {
	if a.Hook != nil {
		return a.Hook(s)
	}
	return nil
}
func (a *App) init() error {
	for _, p := range []string{a.data(), a.runtime(), a.data() + "/sources", a.data() + "/jobs", a.data() + "/work", a.data() + "/yq-runtime"} {
		if e := privateDir(p); e != nil {
			return e
		}
	}
	return a.reapPrivateWork()
}
func (a *App) space() error {
	var s syscall.Statfs_t
	if e := syscall.Statfs(a.Root, &s); e != nil {
		return e
	}
	if uint64(s.Bavail)*uint64(s.Bsize) < 64<<20 {
		return fail("insufficient_disk_space")
	}
	return a.point("space")
}

// Direct host launches do not inherit the browser wrapper's toolbox PATH.
func prependTrustedPath(path string) error {
	if e := noLinks(path); e != nil {
		return e
	}
	st, e := os.Stat(path)
	if os.IsNotExist(e) {
		return nil
	}
	if e != nil {
		return e
	}
	owner, ok := st.Sys().(*syscall.Stat_t)
	if !st.IsDir() || st.Mode().Perm()&0022 != 0 || !ok || owner.Uid != uint32(os.Geteuid()) {
		return fail("toolbox_path_untrusted")
	}
	parts := []string{path}
	for _, p := range strings.Split(os.Getenv("PATH"), string(os.PathListSeparator)) {
		if p != "" && p != path {
			parts = append(parts, p)
		}
	}
	return os.Setenv("PATH", strings.Join(parts, string(os.PathListSeparator)))
}
