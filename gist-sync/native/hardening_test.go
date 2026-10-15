// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDirectHostToolPath(t *testing.T) {
	p := filepath.Join(t.TempDir(), "bin")
	if e := os.Mkdir(p, 0700); e != nil {
		t.Fatal(e)
	}
	t.Setenv("PATH", "/system/bin:"+p+":/usr/bin")
	if e := prependTrustedPath(p); e != nil {
		t.Fatal(e)
	}
	if got := os.Getenv("PATH"); got != p+":/system/bin:/usr/bin" {
		t.Fatal(got)
	}
	os.Chmod(p, 0777)
	if e := prependTrustedPath(p); code(e) != "toolbox_path_untrusted" {
		t.Fatal(e)
	}
	link := filepath.Join(t.TempDir(), "link")
	os.Symlink(p, link)
	if e := prependTrustedPath(link); e == nil {
		t.Fatal("accepted symlink")
	}
}
func TestUnknownProcessIsNotDead(t *testing.T) {
	r := selfRecord()
	if r.KnownDead() {
		t.Fatal("current process considered dead")
	}
	invalid := []processRecord{{}, {PID: 1, Start: "1", Boot: "unknown"}, {PID: 1, Start: "", Boot: bootID()}}
	for _, v := range invalid {
		if v.KnownDead() {
			t.Fatal(v)
		}
	}
	r.Start += "0"
	if !r.KnownDead() {
		t.Fatal("PID start mismatch not detected")
	}
}
func TestCoreConfigTestBlocksReclaim(t *testing.T) {
	for _, args := range [][]string{{"Clash.Core", "-t", "-f", "x"}, {"Clash.Core", "--test"}} {
		if !coreIsTest([]byte(strings.Join(args, "\x00"))) {
			t.Fatal(args)
		}
	}
	if coreIsTest([]byte("Clash.Core\x00-d\x00/data/clash/Proxy\x00")) {
		t.Fatal("normal core")
	}
}

func TestProcScanCandidateBounds(t *testing.T) {
	if !possiblyOwnedWorker("/data/clash", "/data/clash/Tools/age", "age") {
		t.Fatal("owned age")
	}
	if !possiblyOwnedWorker("/data/clash", "/system/bin/sh", "sh") {
		t.Fatal("shell worker")
	}
	if possiblyOwnedWorker("/data/clash", "/usr/bin/python3", "python") {
		t.Fatal("unrelated process")
	}
}
