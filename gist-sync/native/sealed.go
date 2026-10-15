// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"time"
)

// One-use transport keys live outside config exports and component backups.
func (a *App) requestKey() (map[string]any, error) {
	lock, e := lockFile(a.runtime() + "/sealed.lock")
	if e != nil {
		return nil, e
	}
	defer lock.Close()
	dir := a.runtime() + "/requests"
	if e := privateDir(dir); e != nil {
		return nil, e
	}
	entries, e := os.ReadDir(dir)
	if e != nil {
		return nil, e
	}
	count := 0
	for _, entry := range entries {
		info, e := entry.Info()
		if e != nil {
			return nil, e
		}
		if time.Since(info.ModTime()) > 2*time.Minute {
			if e = secureRemove(dir + "/" + entry.Name()); e != nil {
				return nil, e
			}
		} else {
			count++
		}
	}
	if count >= 8 {
		return nil, fail("operation_busy")
	}
	key, e := rsa.GenerateKey(rand.Reader, 2048)
	if e != nil {
		return nil, e
	}
	id := nonce()
	if e = atomicWrite(dir+"/"+id, x509.MarshalPKCS1PrivateKey(key), 0600); e != nil {
		return nil, e
	}
	return map[string]any{"ok": true, "protocol": 1, "apply": true, "id": id, "modulus": fmt.Sprintf("%x", key.N), "exponent": key.E}, nil
}

type sealedRequest struct {
	Protocol int    `json:"protocol"`
	ID       string `json:"id"`
	Key      string `json:"key"`
	IV       string `json:"iv"`
	Data     string `json:"data"`
	MAC      string `json:"mac"`
}

func (a *App) openRequest(input io.Reader, action string) (Request, error) {
	var req Request
	b, e := io.ReadAll(io.LimitReader(input, 48<<10+1))
	if e != nil || len(b) > 48<<10 {
		return req, fail("sealed_request_invalid")
	}
	var env sealedRequest
	d := json.NewDecoder(bytes.NewReader(b))
	d.DisallowUnknownFields()
	if d.Decode(&env) != nil || d.Decode(new(any)) != io.EOF || env.Protocol != 1 || !idRE.MatchString(env.ID) {
		return req, fail("sealed_request_invalid")
	}
	lock, e := lockFile(a.runtime() + "/sealed.lock")
	if e != nil {
		return req, e
	}
	defer lock.Close()
	path := a.runtime() + "/requests/" + env.ID
	info, e := os.Lstat(path)
	if e != nil {
		return req, fail("request_key_expired")
	}
	raw, e := readFile(path, 4096)
	if e != nil {
		return req, e
	}
	// Remove before decoding: replay and malformed envelopes cannot reuse this key.
	if e = os.Remove(path); e != nil {
		return req, fail("request_key_cleanup_failed")
	}
	if time.Since(info.ModTime()) > 2*time.Minute || info.Mode().Perm() != 0600 {
		return req, fail("request_key_expired")
	}
	private, e := x509.ParsePKCS1PrivateKey(raw)
	if e != nil {
		return req, fail("sealed_request_invalid")
	}
	wrapped, e := base64.StdEncoding.DecodeString(env.Key)
	if e != nil {
		return req, fail("sealed_request_invalid")
	}
	secret, e := rsa.DecryptOAEP(sha256.New(), rand.Reader, private, wrapped, []byte("Maomao-GistSync-RC3"))
	if e != nil || len(secret) != 64 {
		return req, fail("sealed_request_invalid")
	}
	defer func() {
		for i := range secret {
			secret[i] = 0
		}
	}()
	iv, e := base64.StdEncoding.DecodeString(env.IV)
	if e != nil || len(iv) != aes.BlockSize {
		return req, fail("sealed_request_invalid")
	}
	data, e := base64.StdEncoding.DecodeString(env.Data)
	if e != nil || len(data) == 0 || len(data)%aes.BlockSize != 0 {
		return req, fail("sealed_request_invalid")
	}
	mac, e := base64.StdEncoding.DecodeString(env.MAC)
	if e != nil {
		return req, fail("sealed_request_invalid")
	}
	auth := hmac.New(sha256.New, secret[32:])
	auth.Write([]byte("1\n" + env.ID + "\n" + action + "\n" + env.Key + "\n" + env.IV + "\n" + env.Data))
	if !hmac.Equal(mac, auth.Sum(nil)) {
		return req, fail("sealed_request_invalid")
	}
	block, e := aes.NewCipher(secret[:32])
	if e != nil {
		return req, e
	}
	cipher.NewCBCDecrypter(block, iv).CryptBlocks(data, data)
	pad := int(data[len(data)-1])
	if pad < 1 || pad > aes.BlockSize || !bytes.Equal(data[len(data)-pad:], bytes.Repeat([]byte{byte(pad)}, pad)) {
		return req, fail("sealed_request_invalid")
	}
	plain := data[:len(data)-pad]
	defer func() {
		for i := range data {
			data[i] = 0
		}
	}()
	if len(plain) > int(maxRequest) {
		return req, fail("request_json_invalid")
	}
	d = json.NewDecoder(bytes.NewReader(plain))
	d.DisallowUnknownFields()
	if d.Decode(&req) != nil || d.Decode(new(any)) != io.EOF {
		return Request{}, fail("request_json_invalid")
	}
	return req, nil
}
