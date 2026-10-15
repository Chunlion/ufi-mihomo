package main

import (
	"bytes"
	"context"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

const realAge = "../../.cache/gist-sync/tools/age-amd64/age"
const realKeygen = "../../.cache/gist-sync/tools/age-amd64/age-keygen"

func generatedIdentity(t *testing.T) (string, string) {
	t.Helper()
	p := filepath.Join(t.TempDir(), "key.txt")
	if b, e := exec.Command(realKeygen, "-o", p).CombinedOutput(); e != nil {
		t.Fatalf("keygen %v %s", e, b)
	}
	b, _ := os.ReadFile(p)
	key := ""
	for _, line := range strings.Split(string(b), "\n") {
		if strings.HasPrefix(line, "AGE-SECRET-KEY-1") {
			key = line
		}
	}
	pub, e := exec.Command(realKeygen, "-y", p).Output()
	if e != nil || key == "" {
		t.Fatal(e)
	}
	return key, strings.TrimSpace(string(pub))
}
func encryptReal(t *testing.T, public string, plain []byte, armor bool) []byte {
	t.Helper()
	args := []string{"--encrypt", "--recipient", public}
	if armor {
		args = append(args, "--armor")
	}
	c := exec.Command(realAge, args...)
	c.Stdin = bytes.NewReader(plain)
	b, e := c.Output()
	if e != nil {
		t.Fatal(e)
	}
	return b
}
func TestRealAgeEndToEnd(t *testing.T) {
	if _, e := os.Stat(realAge); e != nil {
		t.Fatal("supplied genuine age test component missing")
	}
	a := fixture(t)
	copyFixture(t, realAge, a.Root+"/Tools/age")
	key, pub := generatedIdentity(t)
	wrong, _ := generatedIdentity(t)
	plain := []byte("proxies: []\nrules:\n  - MATCH,DIRECT\n")
	for _, armor := range []bool{false, true} {
		name := "binary"
		if armor {
			name = "ASCII_Armor"
		}
		t.Run(name, func(t *testing.T) {
			cipher := encryptReal(t, pub, plain, armor)
			work, _ := a.newWork("real-age-")
			defer secureRemove(work)
			path, e := a.decrypt(context.Background(), cipher, key, work)
			if e != nil {
				t.Fatal(e)
			}
			got, _ := os.ReadFile(path)
			if !bytes.Equal(got, plain) {
				t.Fatal("plaintext mismatch")
			}
			if _, e = a.decrypt(context.Background(), cipher, wrong, work); code(e) != "age_decrypt_failed" {
				t.Fatal("wrong key", e)
			}
			broken := append([]byte(nil), cipher...)
			broken[len(broken)/2] ^= 1
			if _, e = a.decrypt(context.Background(), broken, key, work); e == nil {
				t.Fatal("corruption accepted")
			}
			if _, e = a.decrypt(context.Background(), cipher[:len(cipher)-32], key, work); e == nil {
				t.Fatal("truncation accepted")
			}
		})
	}
}
func TestRealAgeReencryptionNoEffectiveChange(t *testing.T) {
	a := fixture(t)
	copyFixture(t, realAge, a.Root+"/Tools/age")
	key, pub := generatedIdentity(t)
	plain := remoteConfig(7)
	cipher := encryptReal(t, pub, plain, true)
	a.HTTPClient = doFunc(func(*http.Request) (*http.Response, error) { return response(200, string(cipher)), nil })
	out, e := a.validateSave(context.Background(), Request{URL: goodURL, Identity: key}, true)
	if e != nil || !out.OK {
		t.Fatal(out, e)
	}
	out, e = a.syncConfig(context.Background(), Request{}, false)
	if e != nil || !out.Written {
		t.Fatal(out, e)
	}
	first := out
	cipher = encryptReal(t, pub, plain, false)
	out, e = a.syncConfig(context.Background(), Request{}, false)
	if e != nil || out.Code != "up_to_date" || out.Written {
		t.Fatal(out, e)
	}
	if first.CipherHash == out.CipherHash || first.CandidateHash != out.CandidateHash {
		t.Fatal("reencryption effective hash handling")
	}
}
