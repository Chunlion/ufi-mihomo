//go:build live

package main

import (
	"context"
	"os"
	"testing"
	"time"
)

func TestLiveGistDownload(t *testing.T) {
	raw := os.Getenv("F50_GIST_LIVE_URL")
	if raw == "" {
		t.Fatal("A user-supplied Raw URL is required in F50_GIST_LIVE_URL")
	}
	if _, _, e := validateURL(raw); e != nil {
		t.Fatal(code(e))
	}
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	first, status, e := fetchOnce(ctx, secureClient(), raw, maxConfig)
	if e != nil {
		t.Fatalf("LIVE_DOWNLOAD_FAILED code=%s status=%d", code(e), status)
	}
	if status != 200 || len(first) == 0 {
		t.Fatal("LIVE expected non-empty HTTP 200 body")
	}
	a := defaultApp()
	second, e := a.download(ctx, raw)
	if e != nil {
		t.Fatal("LIVE_REPEAT_FAILED " + code(e))
	}
	if len(second) == 0 {
		t.Fatal("LIVE empty repeat download")
	}
	t.Logf("LIVE_TLS_VERIFIED=true HTTP_STATUS=%d BYTES=%d SHA256=%s REPEAT_SHA256=%s CHANGED=%t", status, len(first), hashBytes(first), hashBytes(second), hashBytes(first) != hashBytes(second))
}
