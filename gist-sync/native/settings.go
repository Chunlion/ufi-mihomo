// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Settings struct {
	Version       int         `json:"version"`
	Revision      uint64      `json:"revision"`
	Generation    string      `json:"generation"`
	URL           string      `json:"url"`
	Auto          bool        `json:"auto"`
	IntervalHours int         `json:"intervalHours"`
	SavedAt       time.Time   `json:"savedAt"`
	Baseline      Fingerprint `json:"baseline"`
	Deleted       bool        `json:"deleted,omitempty"`
}
type Request struct {
	URL           string          `json:"url"`
	Identity      string          `json:"identity"`
	Auto          *bool           `json:"auto,omitempty"`
	IntervalHours *int            `json:"intervalHours,omitempty"`
	Revision      *uint64         `json:"revision,omitempty"`
	ReplaceLocal  bool            `json:"replaceLocal,omitempty"`
	ExpectedLocal *Fingerprint    `json:"expectedLocal,omitempty"`
	ManualSources *[]ManualSource `json:"manualSources,omitempty"`
}
type Outcome struct {
	OK              bool        `json:"ok"`
	Code            string      `json:"code"`
	Generation      string      `json:"generation,omitempty"`
	Downloaded      bool        `json:"downloaded"`
	Decrypted       bool        `json:"decrypted"`
	Validated       bool        `json:"validated"`
	Written         bool        `json:"written"`
	Loaded          bool        `json:"loaded"`
	RuntimeVerified bool        `json:"runtimeVerified"`
	Saved           bool        `json:"settingsSaved,omitempty"`
	CipherHash      string      `json:"cipherHash,omitempty"`
	CandidateHash   string      `json:"candidateHash,omitempty"`
	Applied         Fingerprint `json:"applied,omitempty"`
	CompletedAt     time.Time   `json:"completedAt"`
	Warning         string      `json:"warning,omitempty"`
}
type State struct {
	Generation    string      `json:"generation"`
	LastChecked   time.Time   `json:"lastChecked"`
	LastSuccess   time.Time   `json:"lastSuccess"`
	CandidateHash string      `json:"candidateHash"`
	CipherHash    string      `json:"cipherHash"`
	Applied       Fingerprint `json:"applied"`
	Last          Outcome     `json:"last"`
}

func (a *App) settingsPath() string { return a.data() + "/settings.conf" }
func (a *App) readSettings() (Settings, error) {
	var s Settings
	e := readJSON(a.settingsPath(), &s)
	if os.IsNotExist(e) {
		return Settings{Version: 1, IntervalHours: 6}, nil
	}
	if e != nil {
		return s, fail("settings_unreadable")
	}
	if s.Version != 1 || !idRE.MatchString(s.Generation) {
		return s, fail("settings_invalid")
	}
	switch s.IntervalHours {
	case 1, 6, 12, 24:
	default:
		return s, fail("settings_invalid")
	}
	if !s.Deleted {
		if _, _, e = validateURL(s.URL); e != nil {
			return s, e
		}
	}
	return s, nil
}
func (a *App) identity(s Settings) (string, error) {
	if s.Deleted || !idRE.MatchString(s.Generation) {
		return "", fail("age_identity_missing")
	}
	b, e := readFile(a.data()+"/sources/"+s.Generation+"/identity.txt", 512)
	if e != nil {
		return "", fail("age_identity_missing")
	}
	key := strings.TrimSpace(string(b))
	if !keyRE.MatchString(key) {
		return "", fail("invalid_age_identity")
	}
	return key, nil
}
func (a *App) snapshot() (Settings, string, error) {
	lock, e := lockFile(a.runtime() + "/settings.lock")
	if e != nil {
		return Settings{}, "", e
	}
	defer lock.Close()
	s, e := a.readSettings()
	if e != nil {
		return s, "", e
	}
	if s.Generation == "" || s.Deleted {
		return s, "", nil
	}
	key, e := a.identity(s)
	return s, key, e
}
func (a *App) readStateChecked() (State, error) {
	var s State
	e := readJSON(a.data()+"/state.json", &s)
	if os.IsNotExist(e) {
		return s, nil
	}
	if e != nil {
		return s, fail("sync_state_unreadable")
	}
	return s, nil
}
func (a *App) readState() State { s, _ := a.readStateChecked(); return s }
func (a *App) recordAttempt(generation string, out Outcome) error {
	lock, e := lockFile(a.runtime() + "/state.lock")
	if e != nil {
		return e
	}
	defer lock.Close()
	active, e := a.readSettings()
	if e != nil {
		return e
	}
	if active.Generation != generation || active.Deleted {
		return nil
	}
	s, e := a.readStateChecked()
	if e != nil {
		return e
	}
	if s.Generation != generation {
		s = State{Generation: generation}
	}
	s.LastChecked = time.Now().UTC()
	s.Last = out
	return writeJSON(a.data()+"/state.json", s)
}
func (a *App) finishState(out Outcome) error {
	if e := a.point("state_write"); e != nil {
		return e
	}
	lock, e := lockFile(a.runtime() + "/state.lock")
	if e != nil {
		return e
	}
	defer lock.Close()
	s := State{Generation: out.Generation, LastChecked: out.CompletedAt, LastSuccess: out.CompletedAt, CandidateHash: out.CandidateHash, CipherHash: out.CipherHash, Applied: out.Applied, Last: out}
	return writeJSON(a.data()+"/state.json", s)
}
func (a *App) validateSave(ctx context.Context, req Request, save bool) (out Outcome, err error) {
	old, oldKey, e := a.snapshot()
	if e != nil {
		return out, e
	}
	if req.Revision != nil && *req.Revision != old.Revision {
		return out, fail("settings_changed")
	}
	u, _, e := validateURL(strings.TrimSpace(req.URL))
	if e != nil {
		return out, e
	}
	key := strings.TrimSpace(req.Identity)
	if key == "" {
		key = oldKey
	}
	if !keyRE.MatchString(key) {
		return out, fail("invalid_age_identity")
	}
	next := old
	next.Version = 1
	next.URL = u
	next.Deleted = false
	if req.Auto != nil {
		next.Auto = *req.Auto
	}
	if req.IntervalHours != nil {
		next.IntervalHours = *req.IntervalHours
	}
	switch next.IntervalHours {
	case 1, 6, 12, 24:
	default:
		return out, fail("invalid_sync_interval")
	}
	sameSource := old.Generation != "" && !old.Deleted && old.URL == u && oldKey == key
	var work, plain string
	if !save {
		work, e = a.newWork("validate-")
		if e != nil {
			return out, e
		}
		defer func() {
			if e := secureRemove(work); e != nil {
				out.Warning = "private_work_cleanup_failed"
				out.OK = false
				if err == nil {
					err = e
				}
			}
		}()
		if e = a.space(); e != nil {
			return out, e
		}
		cipher, e := a.download(ctx, u)
		if e != nil {
			return out, e
		}
		out.Downloaded = true
		out.CipherHash = hashBytes(cipher)
		plain, e = a.decrypt(ctx, cipher, key, work)
		if e != nil {
			return out, e
		}
		out.Decrypted = true
	}
	lease, e := a.acquireLease(ctx, false)
	if e != nil {
		return out, e
	}
	defer func() {
		if e := lease.Release(); e != nil {
			if out.Saved {
				out.Warning = "settings_saved_lease_cleanup_failed"
			}
			out.OK = false
			if err == nil {
				err = e
			}
		}
	}()
	sl, e := lockFile(a.runtime() + "/settings.lock")
	if e != nil {
		return out, e
	}
	defer sl.Close()
	current, e := a.readSettings()
	if e != nil {
		return out, e
	}
	if current.Revision != old.Revision || current.Generation != old.Generation {
		return out, fail("settings_changed")
	}
	if exists(a.data() + "/activation") {
		return out, fail("config_transaction_pending")
	}
	if plain != "" {
		_, hash, e := a.candidate(ctx, plain, work)
		if e != nil {
			return out, e
		}
		out.Validated = true
		out.CandidateHash = hash
	}
	if !save {
		out.OK = true
		out.Code = "test_passed"
		out.Generation = old.Generation
		return out, nil
	}
	if e = lease.Check(); e != nil {
		return out, e
	}
	if e = a.editBoot(true); e != nil {
		return out, e
	}
	if !sameSource {
		next.Generation = nonce()
		next.Baseline, e = a.fingerprint(ctx)
		if e != nil {
			return out, e
		}
		dir := a.data() + "/sources/" + next.Generation
		if e = privateDir(dir); e != nil {
			return out, e
		}
		if e = atomicWrite(dir+"/identity.txt", []byte(key+"\n"), 0600); e != nil {
			return out, e
		}
	}
	next.Revision = old.Revision + 1
	next.SavedAt = time.Now().UTC()
	if e = a.point("settings_write"); e != nil {
		return out, e
	}
	e = writeJSON(a.settingsPath(), next)
	if e != nil {
		check, re := a.readSettings()
		if re == nil && check.Revision == next.Revision && check.Generation == next.Generation {
			out.Saved = true
			out.Warning = "settings_saved_durability_unconfirmed"
		}
		return out, e
	}
	out.Saved = true
	out.Generation = next.Generation
	out.Code = "settings_saved"
	out.OK = true
	// Readers snapshot identities before releasing settings.lock.
	entries, _ := os.ReadDir(a.data() + "/sources")
	for _, entry := range entries {
		if idRE.MatchString(entry.Name()) && entry.Name() != next.Generation {
			if e = secureRemove(a.data() + "/sources/" + entry.Name()); e != nil {
				out.Warning = "old_identity_cleanup_failed"
			}
		}
	}
	return out, nil
}
func (a *App) applyConfig(ctx context.Context, req Request) (Outcome, error) {
	if tested, err := a.validateSave(ctx, req, false); err != nil || !tested.OK {
		return tested, err
	}
	saved, err := a.validateSave(ctx, req, true)
	if err != nil || !saved.OK {
		return saved, err
	}
	active, err := a.readSettings()
	if err == nil && (active.Generation != saved.Generation || req.Revision != nil && active.Revision != *req.Revision+1) {
		err = fail("settings_changed")
	}
	if err != nil {
		saved.OK, saved.Code = false, code(err)
		return saved, err
	}
	req.Identity = ""
	req.Revision = &active.Revision
	out, err := a.syncConfig(ctx, req, false)
	out.Saved = true
	if out.Generation == "" {
		out.Generation = saved.Generation
	}
	if out.Warning == "" {
		out.Warning = saved.Warning
	}
	return out, err
}
func (a *App) disableAuto(ctx context.Context) (out Outcome, err error) {
	lease, e := a.acquireLease(ctx, false)
	if e != nil {
		return out, e
	}
	defer func() {
		if e := lease.Release(); err == nil && e != nil {
			err = e
			out.OK = false
		}
	}()
	lock, e := lockFile(a.runtime() + "/settings.lock")
	if e != nil {
		return out, e
	}
	defer lock.Close()
	s, e := a.readSettings()
	if e != nil {
		return out, e
	}
	if s.Generation == "" || s.Deleted {
		out.OK = true
		out.Code = "not_configured"
		return out, nil
	}
	s.Auto = false
	s.Revision++
	s.SavedAt = time.Now().UTC()
	if e = writeJSON(a.settingsPath(), s); e != nil {
		return out, e
	}
	out.Saved = true
	out.Generation = s.Generation
	out.OK = true
	out.Code = "auto_disabled"
	return out, nil
}
func (a *App) deleteSettings(ctx context.Context) (out Outcome, err error) {
	lease, e := a.acquireLease(ctx, false)
	if e != nil {
		return out, e
	}
	defer func() {
		if e := lease.Release(); err == nil && e != nil {
			err = e
			out.OK = false
		}
	}()
	lock, e := lockFile(a.runtime() + "/settings.lock")
	if e != nil {
		return out, e
	}
	defer lock.Close()
	if exists(a.data() + "/activation") {
		return out, fail("config_transaction_pending")
	}
	s, e := a.readSettings()
	if e != nil {
		return out, e
	}
	s = Settings{Version: 1, Revision: s.Revision + 1, Generation: nonce(), Deleted: true, IntervalHours: 6, SavedAt: time.Now().UTC()}
	if e = writeJSON(a.settingsPath(), s); e != nil {
		return out, e
	}
	out.Saved = true
	if e = a.stopDaemon(ctx); e != nil {
		return out, e
	}
	if e = a.stopOtherJobs(ctx); e != nil {
		return out, e
	}
	for _, name := range []string{"sources", "work", "state.json", "yq-runtime"} {
		if e = secureRemove(filepath.Join(a.data(), name)); e != nil {
			return out, e
		}
	}
	// Completed receipts contain no key; delete request spools and old result history as well.
	entries, _ := os.ReadDir(a.data() + "/jobs")
	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), currentJobID+".") {
			continue
		}
		if e = secureRemove(a.data() + "/jobs/" + entry.Name()); e != nil {
			return out, e
		}
	}
	for _, pattern := range []string{"activation.done.*", "activation.new.*"} {
		paths, _ := filepath.Glob(a.data() + "/" + pattern)
		for _, p := range paths {
			if e = secureRemove(p); e != nil {
				return out, e
			}
		}
	}
	if e = a.clearRetainedIdentities(); e != nil {
		return out, e
	}
	if e = a.editBoot(false); e != nil {
		return out, e
	}
	out.OK = true
	out.Code = "sync_settings_deleted"
	return out, nil
}
