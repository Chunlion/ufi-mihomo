// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"os"
	"path/filepath"
	"strings"
	"time"
)

func (a *App) newWork(prefix string) (string, error) {
	p, e := os.MkdirTemp(a.data()+"/work", prefix)
	if e != nil {
		return "", e
	}
	if e = writeJSON(p+"/.owner.json", selfRecord()); e != nil {
		secureRemove(p)
		return "", e
	}
	return p, nil
}

// Only reclaims positively identified dead workers; unknown files are left for review.
func (a *App) reapPrivateWork() error {
	entries, e := os.ReadDir(a.data() + "/work")
	if e != nil {
		return e
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		p := a.data() + "/work/" + entry.Name()
		var r processRecord
		if readJSON(p+"/.owner.json", &r) == nil && r.KnownDead() {
			if e = secureRemove(p); e != nil {
				return e
			}
		}
	}
	entries, e = os.ReadDir(a.data() + "/jobs")
	if e != nil {
		return e
	}
	for _, entry := range entries {
		name := entry.Name()
		if !strings.HasSuffix(name, ".json") {
			continue
		}
		var j Job
		if readJSON(a.data()+"/jobs/"+name, &j) != nil {
			continue
		}
		if !j.Process.KnownDead() || time.Since(j.StartedAt) < 24*time.Hour {
			continue
		}
		if e = secureRemove(a.data() + "/jobs/" + strings.TrimSuffix(name, ".json") + ".request"); e != nil {
			return e
		}
		if time.Since(j.StartedAt) > 7*24*time.Hour {
			if e = secureRemove(a.data() + "/jobs/" + name); e != nil {
				return e
			}
		}
	}
	return nil
}

// Completed installer backups must not retain a second copy of the age identity.
// Unfinished installs are rejected by the shared operation gate before this call.
func (a *App) clearRetainedIdentities() error {
	paths, e := filepath.Glob(a.Root + ".rollback.install.*")
	if e != nil {
		return e
	}
	for _, p := range paths {
		if !exists(p + "/.f50-install-receipt") {
			continue
		}
		if e = noLinks(p); e != nil {
			return e
		}
		if e = secureRemove(p + "/Tools/gist-sync"); e != nil {
			return e
		}
	}
	return nil
}
