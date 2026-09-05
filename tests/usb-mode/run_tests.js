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
    console.log(`${passed} tests passed`);
  } finally {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert(path.basename(root).startsWith('f50-usb-mode-'));
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
