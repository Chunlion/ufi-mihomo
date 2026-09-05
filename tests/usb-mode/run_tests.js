'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { Sandbox, DASH } = require('../boot-fix/harness');
const source = fs.readFileSync(path.resolve(__dirname, '../../USB网络模式切换插件.js'), 'utf8');
const backend = Buffer.from(source.match(/const BACKEND_DATA = '([^']+)'/)[1], 'base64').toString();
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-usb-mode-'));
const sandbox = new Sandbox(root);
let passed = 0;
function run(name, script) {
  const result = sandbox.runShell(script, 10000);
  assert.equal(result.status, 0, `${name}\n${result.stdout}`);
  passed++;
  console.log(`PASS ${name}`);
}
(async () => {
  try {
    new vm.Script(source);
    sandbox.reset();
    const mapped = sandbox.rewrite(backend).replace(/\/sys\/class\//g, `${sandbox.posix}/sys/class/`)
      .replace(/\/config\/usb_gadget\//g, `${sandbox.posix}/config/usb_gadget/`);
    fs.writeFileSync(sandbox.p('backend.sh'), mapped);
    fs.writeFileSync(sandbox.p('functions.sh'), mapped.slice(0, mapped.lastIndexOf('\nSHELL_BIN=')));
    const functions = `. '${sandbox.posix}/functions.sh'\nmkdir -p "$BASE"\n`;
    run('embedded shell syntax', `${DASH} -n '${sandbox.posix}/backend.sh'`);
    fs.writeFileSync(sandbox.p('raw-backend.sh'), backend);
    const sum = source.match(/const BACKEND_SUM = '([^']+)'/)[1];
    run('embedded payload matches the installed checksum contract', `set -- $(cksum '${sandbox.posix}/raw-backend.sh'); [ "$1:$2" = '${sum}' ]`);
    assert.equal(Buffer.byteLength(backend), Number(source.match(/const BACKEND_BYTES = (\d+)/)[1]));
    fs.mkdirSync(sandbox.p('data/kano_usb_mode_manager_v3'), { recursive: true });
    fs.writeFileSync(sandbox.p('data/kano_usb_mode_manager_v3/config.env'),
      'MODE="ncm"\r\nMODE=ecm\r\nWIRED_ADB="1"\r\nPERMANENT=1\r\nPATROL_ENABLED=0\r\nAUTO_ROLLBACK=0\r\nBOOT_DELAY_SECONDS=45\r\nPOLL_INTERVAL_SECONDS=8\r\nBRIDGE=br0');
    run('single-pass configuration preserves CRLF, quotes, first duplicate and final unterminated line', functions + `
      value() { exit 99; }
      load_config
      [ "$MODE:$WIRED_ADB:$PERMANENT:$PATROL_ENABLED:$AUTO_ROLLBACK:$BOOT_DELAY_SECONDS:$POLL_INTERVAL_SECONDS:$BRIDGE_OVERRIDE" = ncm:1:1:0:0:45:8:br0 ]
    `);
    fs.writeFileSync(sandbox.p('data/kano_usb_mode_manager_v3/config.env'),
      'MODE=$(touch "$BASE/injected")\nBOOT_DELAY_SECONDS=no\nPOLL_INTERVAL_SECONDS=999\nBRIDGE=bad/name\n');
    run('configuration remains data and invalid values use existing defaults', functions + `
      load_config
      [ ! -f "$BASE/injected" ] || exit 1
      [ "$MODE:$WIRED_ADB:$PERMANENT:$PATROL_ENABLED:$AUTO_ROLLBACK:$BOOT_DELAY_SECONDS:$POLL_INTERVAL_SECONDS:$BRIDGE_OVERRIDE" = rndis:0:0:1:1:120:10: ]
    `);
    run('missing configuration uses defaults', functions + `
      CONFIG="$BASE/absent"
      load_config
      [ "$MODE:$BOOT_DELAY_SECONDS:$POLL_INTERVAL_SECONDS" = rndis:120:10 ]
    `);
    run('healthy bridge does not issue network writes', functions + `
      discover() { BRIDGE=br0; }
      get_ifname() { echo usb0; }
      master_of() { echo br0; }
      link_up() { return 0; }
      attach() { echo unexpected > "$BASE/network-write"; return 1; }
      [ "$(repair_network ncm 2)" = usb0 ] && [ ! -f "$BASE/network-write" ]
    `);
    const persistence = functions + `
      PERMANENT=1; MODE=ncm; WIRED_ADB=0
      discover() { :; }
      composition_active() { return 0; }
      prop() { if [ "$1" = sys.usb.config ]; then echo ncm,mtp; else echo rndis; fi; }
    `;
    run('persistent write requires a successful original-value backup', persistence + `
      remember_original_persist() { return 1; }
      setprop() { echo unexpected > "$BASE/persist-write"; }
      if sync_persist_verified; then exit 1; fi
      [ ! -f "$BASE/persist-write" ]
    `);
    run('persistent write is not confirmed until readback matches', persistence + `
      remember_original_persist() { return 0; }
      setprop() { return 0; }
      if sync_persist_verified; then exit 1; fi
      exit 0
    `);
    run('daemon waits for the bridge, retries a busy first attempt and maintains bridge with patrol off', functions + `
      rm -f "$STOPFILE" "$PAUSE" "$BASE/applied.boot"
      ticks=0; applies=0; reconciles=0; SHELL_BIN=worker
      load_config() { PERMANENT=1; MODE=ncm; WIRED_ADB=0; PATROL_ENABLED=0; BOOT_DELAY_SECONDS=0; POLL_INTERVAL_SECONDS=1; }
      discover() { G=gadget; C=config; BRIDGE=''; [ "$ticks" -lt 4 ] || BRIDGE=br0; }
      prop() { echo ncm,mtp; }
      now() { echo 1000; }
      sleep() { ticks=$((ticks + 1)); [ "$ticks" -lt 15 ] || exit 88; }
      worker() {
        [ -n "$BRIDGE" ] || exit 89
        if [ "$2" = apply ]; then
          applies=$((applies + 1))
          if [ "$applies" -eq 1 ]; then return 6; fi
          [ ! -f "$BASE/applied.boot" ] || exit 90
        else reconciles=$((reconciles + 1)); : > "$STOPFILE"; fi
        return 0
      }
      daemon
      [ "$applies:$reconciles" = 2:1 ] && [ "$(read_one "$BASE/applied.boot")" = "$(boot_id)" ]
    `);
    run('manual pause survives daemon start without switching USB', functions + `
      rm -f "$STOPFILE"
      printf 'manual\n' > "$PAUSE"
      ticks=0; SHELL_BIN=worker
      load_config() { PERMANENT=1; }
      worker() { exit 91; }
      sleep() { ticks=$((ticks + 1)); [ "$ticks" -lt 3 ] || : > "$STOPFILE"; }
      daemon
      [ "$(read_one "$PAUSE")" = manual ]
    `);
    run('disabled patrol repairs bridges but never switches a mismatched USB mode', functions + `
      load_config() { PERMANENT=1; PATROL_ENABLED=0; MODE=ncm; WIRED_ADB=0; }
      rm -f "$PAUSE"
      lock_claim() { return 0; }
      discover() { C=config; }
      link_snapshot() { :; }
      composition_active() { return 1; }
      active_mode() { echo ecm; }
      repair_network() { echo repair >> "$BASE/repairs"; return 0; }
      get_cooldown() { echo 0; }
      prop() { echo ecm,mtp; }
      now() { echo 1000; }
      apply_locked() { echo unexpected > "$BASE/switch"; }
      printf '%s\n' "BOOT=$(boot_id)" SIGNATURE=ncm:0:ecm,mtp:ecm,mtp:ecm SINCE=900 > "$BASE/drift.env"
      reconcile; rc=$?
      [ "$rc" = 2 ] && [ -s "$BASE/repairs" ] && [ ! -f "$BASE/switch" ]
    `);
    let callback, requests = 0, finish;
    const ctx = { document: { hidden: false }, setInterval: fn => { callback = fn; return 1; }, clearInterval() {},
      runShellWithRoot: () => { requests++; return new Promise(resolve => { finish = resolve; }); } };
    const marker = "  const button = document.createElement('button');";
    assert(source.includes(marker));
    vm.runInNewContext(source.replace(marker, `globalThis.api = { session, startStatusRefresh }; return;\n${marker}`), ctx);
    ctx.api.session.modal = { isConnected: true };
    ctx.api.startStatusRefresh();
    const pending = callback();
    await Promise.resolve(); await Promise.resolve();
    await callback();
    assert.equal(requests, 1, 'slow status refresh must not queue another request');
    finish(''); await pending;
    ctx.document.hidden = true;
    await callback();
    assert.equal(requests, 1, 'hidden page must not request status');
    passed++; console.log('PASS status polling coalesces slow requests and pauses in hidden pages');

    const rpcReply = (script, body = 'ok', code = 0) => {
      const begin = script.match(/__K3_B_[a-z0-9]+__/i)?.[0];
      const end = script.match(/__K3_E_[a-z0-9]+__=/i)?.[0];
      assert(begin && end, 'RPC markers must be present');
      return { success: true, content: `${begin}\n${body}\n${end}${code}\n` };
    };
    let rpcCalls = 0;
    const retryContext = {
      document: { hidden: false }, setInterval() { return 1; }, clearInterval() {},
      setTimeout(fn) { fn(); return 1; }, Date, Math, Promise,
      runShellWithRoot: async script => {
        rpcCalls++;
        if (rpcCalls === 1) throw new Error('signal is aborted without reason');
        return rpcCalls === 2 ? { success: false, content: 'signal is aborted without reason' } : rpcReply(script);
      },
    };
    vm.runInNewContext(source.replace(marker, `globalThis.api = { rpc, install, legacyScan, session }; return;\n${marker}`), retryContext);
    const retryResult = await retryContext.api.rpc('echo ok', 100, { transientRetries: 2 });
    assert.equal(retryResult.text, 'ok');
    assert.equal(rpcCalls, 3, 'read-only RPC must retry the bounded number of transient aborts');
    passed++; console.log('PASS read-only RPC recovers from transient host aborts');

    rpcCalls = 0;
    retryContext.runShellWithRoot = async () => {
      rpcCalls++;
      return { success: false, content: 'signal is aborted without reason' };
    };
    let mutationError;
    try { await retryContext.api.rpc('touch /data/test', 100); } catch (error) { mutationError = error; }
    assert.equal(rpcCalls, 1, 'mutating RPC must not be replayed automatically');
    assert.equal(mutationError?.transient, true);
    assert(!mutationError.message.includes('signal is aborted'), 'internal abort text must not reach the UI');
    assert(!/USB|重连|通信.*中断/.test(mutationError.message), 'request cancellation must not be reported as a USB disconnect');
    assert.equal(retryContext.api.session.transport, 'signal is aborted without reason');
    passed++; console.log('PASS mutating RPC aborts are concise and never replayed');

    await assert.rejects(retryContext.api.install(true), /读取后台状态：后台请求被取消或超时/);
    assert.equal(retryContext.api.session.transport, '读取后台状态: signal is aborted without reason');
    passed++; console.log('PASS installation reports the failing step and retains host diagnostics');

    const processRoot = sandbox.p('scan-proc');
    const cmdlines = {
      901: ['sh', '/data/kano_usb_mode_manager_v3/backend.sh', 'daemon'],
      902: ['sh', '/data/kano_usb_mode_manager_v3/backend.sh', 'apply'],
      903: ['sh', '/data/kano_usb_mode_manager_v2/usb_mode_daemon.sh'],
      904: ['sh', '/data/kano_usb_mode_manager_v2/usb_mode_manager.sh'],
      905: ['sh', '-c', 'echo /data/kano_usb_mode_manager_v3/backend.sh daemon'],
      906: ['sh', '/data/kano_usb_mode_manager_v3/backend.sh.bak', 'daemon'],
      907: ['sh', '/data/kano_usb_network_manager/usb_network_daemon.sh'],
    };
    for (const [pid, args] of Object.entries(cmdlines)) {
      fs.mkdirSync(path.join(processRoot, pid), { recursive: true });
      fs.writeFileSync(path.join(processRoot, pid, 'cmdline'), sandbox.rewrite(args.join('\0')) + '\0');
    }
    const scan = signal => retryContext.api.legacyScan(signal).replace('/proc/[0-9]*', `${sandbox.posix}/scan-proc/[0-9]*`);
    run('process scan matches exact arguments and only stops daemon processes', `
      result=$(${scan(false)})
      [ "$result" = 'DAEMON_BUSY=901
WORKER_BUSY=901
WORKER_BUSY=902
DAEMON_BUSY=903
WORKER_BUSY=904
DAEMON_BUSY=907' ] || exit 1
      kill() { echo "STOP=$1"; }
      result=$(${scan(true)})
      [ "$result" = 'STOP=901
STOP=903
STOP=907' ]
    `);

    let pollAttempts = 0;
    const launchContext = {
      document: { hidden: false }, setInterval() { return 1; }, clearInterval() {},
      setTimeout(fn) { fn(); return 1; }, Date, Math, Promise,
      runShellWithRoot: async script => {
        if (script.includes('JOB_RUNNING=1')) {
          pollAttempts++;
          if (pollAttempts <= 2) return { success: false, content: 'signal is aborted without reason' };
          return rpcReply(script, 'JOB_DONE=0');
        }
        return rpcReply(script);
      },
    };
    vm.runInNewContext(source.replace(marker, `globalThis.api = { launch }; return;\n${marker}`), launchContext);
    assert.equal(await launchContext.api.launch(['repair'], 'repair'), 0);
    assert.equal(pollAttempts, 3, 'job polling must resume after a cancelled query');
    passed++; console.log('PASS submitted jobs keep polling after a cancelled query');
    console.log(`${passed} tests passed`);
  } finally {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert(path.basename(root).startsWith('f50-usb-mode-'));
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
