// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

type httpDoer interface {
	Do(*http.Request) (*http.Response, error)
}

var userRE = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9-]{0,38}$`)
var gistRE = regexp.MustCompile(`^[0-9a-fA-F]{5,64}$`)
var revisionRE = regexp.MustCompile(`^[0-9a-fA-F]{40}$`)
var keyRE = regexp.MustCompile(`^AGE-SECRET-KEY-1[0-9A-Z]{58}$`)

func validateURL(s string) (string, bool, error) {
	if len(s) > 2048 || strings.TrimSpace(s) != s || strings.ContainsAny(s, "\r\n\t\\") {
		return "", false, fail("invalid_gist_url")
	}
	u, e := url.Parse(s)
	if e != nil || u.Scheme != "https" || u.Host != "gist.githubusercontent.com" || u.User != nil || u.RawQuery != "" || u.ForceQuery || u.Fragment != "" || u.Opaque != "" {
		return "", false, fail("invalid_gist_url")
	}
	parts := strings.Split(u.EscapedPath(), "/")
	if len(parts) != 5 && len(parts) != 6 {
		return "", false, fail("invalid_gist_path")
	}
	if parts[0] != "" || !userRE.MatchString(parts[1]) || !gistRE.MatchString(parts[2]) || parts[3] != "raw" {
		return "", false, fail("invalid_gist_path")
	}
	fixed := len(parts) == 6
	if fixed && !revisionRE.MatchString(parts[4]) {
		return "", false, fail("invalid_gist_revision")
	}
	file, e := url.PathUnescape(parts[len(parts)-1])
	if e != nil || len(file) == 0 || len(file) > 255 || strings.ContainsAny(file, "/\\\x00\r\n") || !strings.HasSuffix(strings.ToLower(file), ".age") {
		return "", false, fail("invalid_gist_filename")
	}
	for _, r := range file {
		if r < 32 || r == 127 {
			return "", false, fail("invalid_gist_filename")
		}
	}
	return u.String(), fixed, nil
}

var deniedNetworks = []netip.Prefix{}

func init() {
	for _, s := range []string{"0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16", "172.16.0.0/12", "192.0.0.0/24", "192.0.2.0/24", "192.168.0.0/16", "198.18.0.0/15", "198.51.100.0/24", "203.0.113.0/24", "224.0.0.0/4", "240.0.0.0/4", "2001:db8::/32", "2001::/32", "2002::/16"} {
		deniedNetworks = append(deniedNetworks, netip.MustParsePrefix(s))
	}
}
func publicIP(ip netip.Addr) bool {
	ip = ip.Unmap()
	if !ip.IsGlobalUnicast() || ip.IsPrivate() || ip.IsLoopback() || ip.IsLinkLocalUnicast() {
		return false
	}
	if ip.Is6() && !netip.MustParsePrefix("2000::/3").Contains(ip) {
		return false
	}
	for _, p := range deniedNetworks {
		if p.Contains(ip) {
			return false
		}
	}
	return true
}
func trustRoots() *x509.CertPool {
	roots, e := x509.SystemCertPool()
	if e != nil || roots == nil {
		roots = x509.NewCertPool()
	}
	// Linux-targeted static Go binaries do not reliably discover Android's store.
	for _, dir := range []string{"/system/etc/security/cacerts", "/apex/com.android.conscrypt/cacerts"} {
		entries, e := os.ReadDir(dir)
		if e != nil {
			continue
		}
		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}
			b, e := os.ReadFile(filepath.Join(dir, entry.Name()))
			if e == nil {
				roots.AppendCertsFromPEM(b)
			}
		}
	}
	return roots
}
func secureClient() *http.Client {
	dial := func(ctx context.Context, network, address string) (net.Conn, error) {
		host, port, e := net.SplitHostPort(address)
		if e != nil || port != "443" || host != "gist.githubusercontent.com" {
			return nil, fail("blocked_download_destination")
		}
		ips, e := resolveDownloadHost(ctx, host)
		if e != nil {
			return nil, fail("dns_failed")
		}
		if len(ips) == 0 {
			return nil, fail("dns_failed")
		}
		for _, ip := range ips {
			if !publicIP(ip) {
				return nil, fail("blocked_dns_address")
			}
		}
		var last error
		for _, ip := range ips {
			d := net.Dialer{Timeout: 8 * time.Second, KeepAlive: -1}
			c, e := d.DialContext(ctx, "tcp", net.JoinHostPort(ip.String(), port))
			if e == nil {
				return c, nil
			}
			last = e
		}
		return nil, last
	}
	t := &http.Transport{Proxy: nil, DialContext: dial, TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12, RootCAs: trustRoots()}, TLSHandshakeTimeout: 10 * time.Second, ResponseHeaderTimeout: 15 * time.Second, DisableCompression: true, DisableKeepAlives: true, MaxResponseHeaderBytes: 64 << 10}
	return &http.Client{Transport: t, Timeout: 60 * time.Second, CheckRedirect: func(r *http.Request, via []*http.Request) error {
		return http.ErrUseLastResponse
	}}
}
func fetchOnce(ctx context.Context, client httpDoer, s string, limit int64) ([]byte, int, error) {
	req, e := http.NewRequestWithContext(ctx, "GET", s, nil)
	if e != nil {
		return nil, 0, fail("invalid_url")
	}
	req.Header.Set("Cache-Control", "no-cache, no-store, max-age=0")
	req.Header.Set("Pragma", "no-cache")
	req.Header.Set("Accept-Encoding", "identity")
	req.Header.Set("User-Agent", "Kano-GistSync/"+version)
	res, e := client.Do(req)
	if e != nil {
		if ctx.Err() != nil {
			return nil, 0, ctx.Err()
		}
		var te net.Error
		if errors.As(e, &te) && te.Timeout() {
			return nil, 0, fail("download_timeout")
		}
		var ca x509.UnknownAuthorityError
		var cn x509.HostnameError
		var ci x509.CertificateInvalidError
		if errors.As(e, &ca) || errors.As(e, &cn) || errors.As(e, &ci) {
			return nil, 0, fail("tls_verification_failed")
		}
		var ce codedError
		if errors.As(e, &ce) {
			return nil, 0, ce
		}
		return nil, 0, fail("download_transport_failed")
	}
	defer res.Body.Close()
	if ctx.Err() != nil {
		return nil, 0, ctx.Err()
	}
	if res.StatusCode != http.StatusOK {
		return nil, res.StatusCode, fail(fmt.Sprintf("http_%d", res.StatusCode))
	}
	if res.ContentLength > limit {
		return nil, 200, fail("download_too_large")
	}
	if enc := res.Header.Get("Content-Encoding"); enc != "" && enc != "identity" {
		return nil, 200, fail("unexpected_content_encoding")
	}
	b, e := io.ReadAll(io.LimitReader(res.Body, limit+1))
	if e != nil {
		return nil, 200, fail("download_incomplete")
	}
	if int64(len(b)) > limit {
		return nil, 200, fail("download_too_large")
	}
	if len(b) == 0 {
		return nil, 200, fail("download_empty")
	}
	if res.ContentLength >= 0 && int64(len(b)) != res.ContentLength {
		return nil, 200, fail("download_incomplete")
	}
	return b, 200, nil
}
func (a *App) download(ctx context.Context, s string) ([]byte, error) {
	valid, _, e := validateURL(s)
	if e != nil {
		return nil, e
	}
	client := a.HTTPClient
	if client == nil {
		client = secureClient()
	}
	var last error
	for i := 0; i < 3; i++ {
		if e := ctx.Err(); e != nil {
			return nil, e
		}
		u, _ := url.Parse(valid)
		q := u.Query()
		q.Set("kano_sync", nonce())
		u.RawQuery = q.Encode()
		b, status, e := fetchOnce(ctx, client, u.String(), maxConfig)
		if e == nil {
			return b, nil
		}
		last = e
		c := code(e)
		retry := status == 429 || status >= 500 || c == "download_timeout" || c == "download_transport_failed" || c == "download_incomplete" || c == "dns_failed"
		if !retry || i == 2 {
			return nil, e
		}
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(time.Duration(1<<i) * time.Second):
		}
	}
	return nil, last
}
func (a *App) decrypt(ctx context.Context, encrypted []byte, identity, work string) (string, error) {
	key := strings.TrimSpace(identity)
	if !keyRE.MatchString(key) {
		return "", fail("invalid_age_identity")
	}
	if e := atomicWrite(work+"/identity.txt", []byte(key+"\n"), 0600); e != nil {
		return "", e
	}
	defer os.Remove(work + "/identity.txt")
	if e := atomicWrite(work+"/cipher.age", encrypted, 0600); e != nil {
		return "", e
	}
	age := filepath.Join(a.Root, "Tools/age")
	if e := noLinks(age); e != nil {
		return "", e
	}
	v, e := run(ctx, 5*time.Second, nil, age, "--version")
	if e != nil || strings.TrimSpace(string(v)) == "" {
		return "", fail("age_missing_or_wrong_version")
	}
	plain, e := run(ctx, 30*time.Second, nil, age, "--decrypt", "--identity", work+"/identity.txt", work+"/cipher.age")
	if e != nil {
		if ctx.Err() != nil {
			return "", ctx.Err()
		}
		return "", fail("age_decrypt_failed")
	}
	if len(plain) == 0 || int64(len(plain)) > maxConfig {
		return "", fail("plaintext_size_invalid")
	}
	path := work + "/plain.yaml"
	if e = atomicWrite(path, plain, 0600); e != nil {
		return "", e
	}
	return path, nil
}

// Static Linux binaries cannot use Android netd through libc. Use public DNS only
// when the system resolver fails; TLS and post-resolution address checks still apply.
func resolveDownloadHost(ctx context.Context, host string) ([]netip.Addr, error) {
	c, cancel := context.WithTimeout(ctx, 8*time.Second)
	ips, e := net.DefaultResolver.LookupNetIP(c, "ip", host)
	cancel()
	if e == nil && len(ips) > 0 {
		return ips, nil
	}
	for _, server := range []string{"223.5.5.5:53", "119.29.29.29:53", "1.1.1.1:53"} {
		c, cancel := context.WithTimeout(ctx, 8*time.Second)
		r := &net.Resolver{PreferGo: true, Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			d := net.Dialer{Timeout: 5 * time.Second}
			return d.DialContext(ctx, network, server)
		}}
		ips, e = r.LookupNetIP(c, "ip", host)
		cancel()
		if e == nil && len(ips) > 0 {
			return ips, nil
		}
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
	}
	return nil, fail("dns_failed")
}
