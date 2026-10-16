package main

import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"net/netip"
	"strings"
	"testing"
	"time"
)

type doFunc func(*http.Request) (*http.Response, error)

func (f doFunc) Do(r *http.Request) (*http.Response, error) { return f(r) }
func response(status int, body string) *http.Response {
	return &http.Response{StatusCode: status, ContentLength: int64(len(body)), Header: http.Header{}, Body: io.NopCloser(strings.NewReader(body))}
}

const goodURL = "https://gist.githubusercontent.com/fixture/0123456789abcdef/raw/config.yaml.age"

func TestURLValidation(t *testing.T) {
	for _, s := range []string{goodURL, goodURL + "?raw=1", strings.Replace(goodURL, "raw/", "raw/"+strings.Repeat("a", 40)+"/", 1), strings.Replace(goodURL, "config.yaml.age", "another..name.age", 1), strings.Replace(goodURL, "config.yaml.age", "%E9%85%8D%E7%BD%AE.age", 1)} {
		t.Run("valid_"+s[len(s)-12:], func(t *testing.T) {
			if _, _, e := validateURL(s); e != nil {
				t.Fatal(e)
			}
		})
	}
	for name, s := range map[string]string{"http": strings.Replace(goodURL, "https:", "http:", 1), "userinfo": strings.Replace(goodURL, "https://", "https://user@", 1), "port": strings.Replace(goodURL, ".com/", ".com:443/", 1), "query": goodURL + "?x=1", "fragment": goodURL + "#x", "evil_host": strings.Replace(goodURL, ".com/", ".com.evil.test/", 1), "IP": "https://127.0.0.1/a/abcde/raw/a.age", "page": "https://gist.github.com/a/abcde", "bad_id": strings.Replace(goodURL, "0123456789abcdef", "hello", 1), "slash": strings.Replace(goodURL, "config.yaml.age", "%2Ftmp.age", 1), "traversal": strings.Replace(goodURL, "raw/", "raw/../", 1), "backslash": goodURL + "\\x", "CRLF": goodURL + "\r\n", "NUL": strings.Replace(goodURL, "config.yaml.age", "%00.age", 1), "no_age": strings.TrimSuffix(goodURL, ".age"), "bad_revision": strings.Replace(goodURL, "raw/", "raw/xyz/", 1)} {
		t.Run(name, func(t *testing.T) {
			if _, _, e := validateURL(s); e == nil {
				t.Fatal("accepted unsafe URL")
			}
		})
	}
	_, p, e := validateURL(strings.Replace(goodURL, "raw/", "raw/"+strings.Repeat("a", 40)+"/", 1))
	if e != nil || !p {
		t.Fatal("pinned revision not detected")
	}
}
func TestSSRFAddressBoundary(t *testing.T) {
	for _, ip := range []string{"127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "169.254.169.254", "100.64.1.1", "0.0.0.0", "192.0.2.1", "198.18.0.1", "224.0.0.1", "255.255.255.255", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "2001:db8::1", "2002:7f00:1::"} {
		t.Run(ip, func(t *testing.T) {
			if publicIP(netip.MustParseAddr(ip)) {
				t.Fatal("allowed reserved address")
			}
		})
	}
	for _, ip := range []string{"1.1.1.1", "8.8.8.8", "185.199.108.133", "2606:50c0:8000::154"} {
		if !publicIP(netip.MustParseAddr(ip)) {
			t.Fatal(ip)
		}
	}
}
func TestDownloadPolicy(t *testing.T) {
	c := secureClient()
	tr := c.Transport.(*http.Transport)
	if tr.Proxy != nil || tr.TLSClientConfig.InsecureSkipVerify || !tr.DisableCompression || c.Timeout <= 0 {
		t.Fatal("unsafe transport")
	}
	req, _ := http.NewRequest("GET", goodURL, nil)
	if c.CheckRedirect(req, []*http.Request{req}) != http.ErrUseLastResponse {
		t.Fatal("redirect followed")
	}
	for _, u := range []string{"http://github.com/a", "https://evil.test/a", "https://github.com:443/a", "https://user@github.com/a"} {
		r, _ := http.NewRequest("GET", u, nil)
		if secureClient().CheckRedirect(r, []*http.Request{req}) == nil {
			t.Fatal(u)
		}
	}
}
func TestDownloadResponses(t *testing.T) {
	cases := []struct {
		name  string
		res   *http.Response
		want  string
		limit int64
	}{
		{"normal", response(200, "abc"), "", 100}, {"empty", response(200, ""), "download_empty", 100}, {"404", response(404, "x"), "http_404", 100}, {"redirect", response(302, "x"), "http_302", 100}, {"oversized_length", response(200, "abcd"), "download_too_large", 3},
	}
	mismatch := response(200, "abc")
	mismatch.ContentLength = 9
	cases = append(cases, struct {
		name  string
		res   *http.Response
		want  string
		limit int64
	}{"incomplete", mismatch, "download_incomplete", 100})
	chunk := response(200, "abcdef")
	chunk.ContentLength = -1
	cases = append(cases, struct {
		name  string
		res   *http.Response
		want  string
		limit int64
	}{"oversized_chunked", chunk, "download_too_large", 3})
	enc := response(200, "abc")
	enc.Header.Set("Content-Encoding", "gzip")
	cases = append(cases, struct {
		name  string
		res   *http.Response
		want  string
		limit int64
	}{"compressed", enc, "unexpected_content_encoding", 100})
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			_, _, e := fetchOnce(context.Background(), doFunc(func(r *http.Request) (*http.Response, error) {
				if r.Header.Get("Authorization") != "" || r.Body != nil {
					t.Fatal("unexpected secrets/body")
				}
				return c.res, nil
			}), goodURL, c.limit)
			if code(e) != c.want {
				t.Fatalf("got %s want %s", code(e), c.want)
			}
		})
	}
}
func TestDownloadRetryAndCache(t *testing.T) {
	a := defaultApp()
	count := 0
	queries := map[string]bool{}
	a.HTTPClient = doFunc(func(r *http.Request) (*http.Response, error) {
		count++
		if r.URL.Host != "gist.githubusercontent.com" || r.Header.Get("Cache-Control") == "" || r.URL.Query().Get("kano_sync") == "" {
			t.Fatal("cache policy missing")
		}
		if queries[r.URL.RawQuery] {
			t.Fatal("nonce reused")
		}
		queries[r.URL.RawQuery] = true
		if count == 1 {
			return response(503, "bad"), nil
		}
		return response(200, "cipher"), nil
	})
	b, e := a.download(context.Background(), goodURL)
	if e != nil || string(b) != "cipher" || count != 2 {
		t.Fatal(e, count)
	}
}
func TestDownloadFailureTypes(t *testing.T) {
	for name, er := range map[string]error{"network": errors.New("network broken"), "timeout": &net.DNSError{IsTimeout: true}} {
		t.Run(name, func(t *testing.T) {
			_, _, e := fetchOnce(context.Background(), doFunc(func(*http.Request) (*http.Response, error) { return nil, er }), goodURL, 100)
			want := "download_transport_failed"
			if name == "timeout" {
				want = "download_timeout"
			}
			if code(e) != want {
				t.Fatal(code(e))
			}
		})
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, _, e := fetchOnce(ctx, doFunc(func(r *http.Request) (*http.Response, error) { return nil, r.Context().Err() }), goodURL, 100)
	if !errors.Is(e, context.Canceled) {
		t.Fatal(e)
	}
}
func TestSchedule(t *testing.T) {
	now := time.Now().UTC()
	for _, h := range []int{1, 6, 12, 24} {
		s := Settings{Generation: "a", IntervalHours: h, SavedAt: now}
		if nextDue(s, State{}, now) != now.Add(time.Duration(h)*time.Hour) {
			t.Fatal(h)
		}
	}
	s := Settings{Generation: "a", IntervalHours: 6, SavedAt: now.Add(-time.Hour)}
	st := State{Generation: "a", LastChecked: now, Last: Outcome{Code: "download_timeout"}}
	if nextDue(s, st, now) != now.Add(5*time.Minute) {
		t.Fatal("retry")
	}
}
