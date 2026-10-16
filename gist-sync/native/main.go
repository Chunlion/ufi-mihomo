// SPDX-License-Identifier: AGPL-3.0-or-later
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/signal"
	"runtime"
	"strings"
	"syscall"
	"time"
)

func emit(v any) { e := json.NewEncoder(os.Stdout); e.SetEscapeHTML(false); _ = e.Encode(v) }

var makeApp = defaultApp

func main() {
	args := os.Args[1:]
	if len(args) == 0 {
		emit(map[string]any{"ok": false, "code": "missing_command"})
		os.Exit(2)
	}
	if args[0] == "version" {
		emit(map[string]any{"ok": true, "version": version, "goos": runtime.GOOS, "goarch": runtime.GOARCH, "goVersion": runtime.Version(), "protocol": 1})
		return
	}
	if os.Geteuid() != 0 {
		emit(map[string]any{"ok": false, "code": "root_required"})
		os.Exit(1)
	}
	if err := prependTrustedPath("/data/kano_tproxy_tools/bin"); err != nil {
		emit(map[string]any{"ok": false, "code": code(err)})
		os.Exit(1)
	}
	a := makeApp()
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT, syscall.SIGHUP)
	defer cancel()
	readOnly := args[0] == "status" || args[0] == "job" || args[0] == "cancel" || args[0] == "stop-daemon" || args[0] == "stop-jobs"
	a.ReadOnly = readOnly
	if !exists(a.Root + "/Scripts/Clash.Service") {
		emit(map[string]any{"ok": false, "code": "base_components_missing"})
		os.Exit(1)
	}
	if !readOnly {
		if e := a.init(); e != nil {
			emit(map[string]any{"ok": false, "code": code(e)})
			os.Exit(1)
		}
	}
	var result any
	var err error
	switch args[0] {
	case "status":
		result, err = a.status(ctx)
	case "request-key":
		result, err = a.requestKey()
	case "dispatch":
		if len(args) != 2 || !validAction(args[1]) {
			err = fail("invalid_arguments")
			break
		}
		var req Request
		d := json.NewDecoder(io.LimitReader(os.Stdin, maxRequest+1))
		d.DisallowUnknownFields()
		if err = d.Decode(&req); err != nil {
			err = fail("request_json_invalid")
			break
		}
		if req.Identity != "" || req.ManualSources != nil {
			err = fail("sealed_request_required")
			break
		}
		var id string
		id, err = a.dispatchRequest(ctx, args[1], req)
		result = map[string]any{"ok": err == nil, "job": id, "code": code(err)}
	case "dispatch-sealed":
		if len(args) != 2 || !validAction(args[1]) {
			err = fail("invalid_arguments")
			break
		}
		var req Request
		req, err = a.openRequest(os.Stdin, args[1])
		if err != nil {
			break
		}
		var id string
		id, err = a.dispatchRequest(ctx, args[1], req)
		req.Identity = ""
		result = map[string]any{"ok": err == nil, "job": id, "code": code(err)}
	case "worker":
		if len(args) != 3 {
			err = fail("invalid_arguments")
			break
		}
		err = a.worker(ctx, args[1], args[2])
	case "job":
		if len(args) != 2 {
			err = fail("invalid_arguments")
			break
		}
		result, err = a.readJob(args[1])
	case "cancel":
		if len(args) != 2 {
			err = fail("invalid_arguments")
			break
		}
		err = a.cancelJob(ctx, args[1])
	case "daemon":
		err = a.daemon(ctx)
	case "start-daemon":
		err = a.startDaemon(ctx)
	case "stop-jobs":
		err = a.stopOtherJobs(ctx)
	case "remove-boot":
		err = a.editBoot(false)
	case "stop-daemon":
		err = a.stopDaemon(ctx)
	case "boot":
		err = a.boot(ctx)
	case "recover":
		l, e := a.acquireLease(ctx, true)
		if e != nil {
			err = e
			break
		}
		result, err = a.recoverActivation(ctx, l, false)
		if e = l.Release(); e != nil {
			err = e
		}
	case "recover-stopped":
		// Only the existing emergency owner may use the cancelled lease for file-only rollback.
		owner, e := readFile(a.operationLock()+"/owner", 512)
		if e != nil {
			err = e
			break
		}
		b, e := readFile(a.recoveryLock()+"/owner", 128)
		var pid int
		var start string
		if e != nil {
			err = e
			break
		}
		_, e = fmt.Sscanf(string(b), "%d %s", &pid, &start)
		core, ce := a.corePID()
		if e != nil || !alive(pid, start) || !exists(a.operationLock()+"/cancelled") || ce != nil || core != 0 {
			err = fail("recovery_fence_required")
			break
		}
		l := &Lease{app: a, Tag: strings.TrimSpace(string(owner)), Recovery: true}
		result, err = a.recoverActivation(ctx, l, true)
	default:
		err = fail("invalid_command")
	}
	if result == nil {
		result = map[string]any{"ok": err == nil, "code": code(err), "completedAt": time.Now().UTC()}
	}
	if err != nil {
		if _, ok := result.(map[string]any); !ok {
			result = map[string]any{"ok": false, "code": code(err), "result": result}
		}
	}
	emit(result)
	if err != nil {
		os.Exit(1)
	}
}
