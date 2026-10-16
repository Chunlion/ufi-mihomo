package main

import (
	"bytes"
	"encoding/json"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"
)

func sealedFixture(t *testing.T, a *App, action string, req Request) []byte {
	t.Helper()
	key, e := a.requestKey()
	if e != nil {
		t.Fatal(e)
	}
	c := exec.Command("node", "tests/gist-sync/seal-request.js")
	c.Dir = "../.."
	c.Stdin = bytes.NewReader(jsonBytes(map[string]any{"key": key, "action": action, "request": req}))
	b, e := c.Output()
	if e != nil {
		t.Fatal("browser crypto bridge failed", e)
	}
	if req.Identity != "" && bytes.Contains(b, []byte(req.Identity)) {
		t.Fatal("plaintext in transport")
	}
	return b
}
func TestSealedRequests(t *testing.T) {
	for _, interval := range []int{1, 6, 12, 24} {
		a := fixture(t)
		auto := true
		req := Request{URL: goodURL, Identity: fixtureKey, IntervalHours: &interval, Auto: &auto}
		b := sealedFixture(t, a, "save", req)
		got, e := a.openRequest(bytes.NewReader(b), "save")
		if e != nil || !bytes.Equal(jsonBytes(got), jsonBytes(req)) {
			t.Fatal("round trip", e)
		}
		_, e = a.openRequest(bytes.NewReader(b), "save")
		if code(e) != "request_key_expired" {
			t.Fatal("replay", e)
		}
	}
	for _, what := range []string{"action", "ciphertext", "key", "mac", "expiry", "permissions", "unknown_field", "oversized"} {
		t.Run(what, func(t *testing.T) {
			a := fixture(t)
			b := sealedFixture(t, a, "save", Request{Identity: fixtureKey})
			action := "save"
			var v map[string]any
			json.Unmarshal(b, &v)
			switch what {
			case "action":
				action = "delete"
			case "ciphertext":
				v["data"] = "AAAAAAAAAAAAAAAAAAAAAA=="
			case "key":
				v["key"] = "AAAA"
			case "mac":
				v["mac"] = "AAAA"
			case "expiry":
				p := a.runtime() + "/requests/" + str(v["id"])
				old := time.Now().Add(-3 * time.Minute)
				os.Chtimes(p, old, old)
			case "permissions":
				os.Chmod(a.runtime()+"/requests/"+str(v["id"]), 0644)
			case "unknown_field":
				v["identity"] = fixtureKey
			case "oversized":
				v["data"] = strings.Repeat("A", 50<<10)
			}
			_, e := a.openRequest(bytes.NewReader(jsonBytes(v)), action)
			if e == nil {
				t.Fatal("accepted invalid envelope")
			}
		})
	}
}
func TestSealedKeyPermissionsAndExpiryCleanup(t *testing.T) {
	a := fixture(t)
	key, e := a.requestKey()
	if e != nil {
		t.Fatal(e)
	}
	p := a.runtime() + "/requests/" + str(key["id"])
	info, e := os.Stat(p)
	if e != nil || info.Mode().Perm() != 0600 {
		t.Fatal("private key permissions", e)
	}
	dir, _ := os.Stat(a.runtime() + "/requests")
	if dir.Mode().Perm() != 0700 {
		t.Fatal("private directory permissions")
	}
	old := time.Now().Add(-3 * time.Minute)
	os.Chtimes(p, old, old)
	if _, e = a.requestKey(); e != nil || exists(p) {
		t.Fatal("expired key cleanup", e)
	}
	if validAction("install-age") {
		t.Fatal("standalone install still enabled")
	}
}

func TestHTTPHostSealedRequest(t *testing.T) {
	a := fixture(t)
	key, e := a.requestKey()
	if e != nil {
		t.Fatal(e)
	}
	c := exec.Command("node", "tests/gist-sync/seal-request.js", "--http")
	c.Dir = "../.."
	c.Stdin = bytes.NewReader(jsonBytes(map[string]any{"key": key, "action": "save", "request": Request{Identity: "AGE-SECRET-KEY-1" + strings.Repeat("A", 58)}}))
	b, e := c.Output()
	if e != nil {
		t.Fatal(e)
	}
	req, e := a.openRequest(bytes.NewReader(b), "save")
	if e != nil || req.Identity != "AGE-SECRET-KEY-1"+strings.Repeat("A", 58) {
		t.Fatal("HTTP transport failed", e)
	}
}
