'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { Sandbox, DASH } = require('../boot-fix/harness');

const source = fs.readFileSync(path.resolve(__dirname, '../../USB网络模式切换插件.js'), 'utf8');
const marker = "  const mainBtn = document.createElement('button');";
assert(source.includes(marker));
const context = {};
vm.runInNewContext(source.replace(marker,
  `globalThis.scripts = { MANAGER_SCRIPT, DAEMON_SCRIPT }; return;\n${marker}`), context);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-usb-mode-'));
const sandbox = new Sandbox(root);
let passed = 0;

function run(name, script) {
  const result = sandbox.runShell(script, 10000);
  assert.equal(result.status, 0, `${name}\n${result.stdout}`);
  passed++;
  console.log(`PASS ${name}`);
}

try {
  sandbox.reset();
  for (const [name, script] of Object.entries(context.scripts)) {
    const mapped = sandbox.rewrite(script).replace(/\/sys\/class\//g, `${sandbox.posix}/sys/class/`)
      .replace(/\/config\//g, `${sandbox.posix}/config/`);
    fs.writeFileSync(sandbox.p(`${name}.sh`), mapped);
    fs.writeFileSync(sandbox.p(`${name}.functions.sh`), mapped.slice(0, mapped.lastIndexOf('case "$1" in')));
    run(`${name} shell syntax`, `${DASH} -n '${sandbox.posix}/${name}.sh'`);
  }
  const manager = `. '${sandbox.posix}/MANAGER_SCRIPT.functions.sh'\n`;
  const daemon = `. '${sandbox.posix}/DAEMON_SCRIPT.functions.sh'\n`;
  const net = `${sandbox.posix}/sys/class/net`;
  fs.mkdirSync(sandbox.p('sys/class/net/usb0'), { recursive: true });
  run('bridge appears late and attachment retries transient failures', manager + `
    sleeps=0
    attempts=0
    master_of() { cat "$BASE_DIR/test_master" 2>/dev/null; }
    sleep() { sleeps=$((sleeps + 1)); mkdir -p '${net}/br0/bridge'; }
    ip() {
      if [ "$4" = master ]; then
        attempts=$((attempts + 1))
        [ "$attempts" -ge 3 ] || return 1
        echo br0 > "$BASE_DIR/test_master"
      fi
      return 0
    }
    attach_to_bridge usb0 || exit 1
    [ "$attempts" -eq 3 ] && [ "$sleeps" -eq 3 ]
  `);
  run('unverified bridge membership fails within the retry limit', manager + `
    sleeps=0
    master_of() { echo other; }
    ip() { return 0; }
    sleep() { sleeps=$((sleeps + 1)); }
    if attach_to_bridge usb0; then exit 1; fi
    [ "$sleeps" -eq 20 ]
  `);
  run('automatic pause survives a daemon restart but expires after reboot', daemon + `
    pause_until_reboot
    clear_previous_boot_pause
    [ -f "$PAUSE_FILE" ] || exit 1
    printf 'next-boot\\n' > /proc/sys/kernel/random/boot_id
    clear_previous_boot_pause
    [ ! -f "$PAUSE_FILE" ]
  `);
  run('legacy or manual pause remains and unknown boot identity does not clear pauses', daemon + `
    : > "$PAUSE_FILE"
    clear_previous_boot_pause
    [ -f "$PAUSE_FILE" ] || exit 1
    printf 'auto:previous-boot\\n' > "$PAUSE_FILE"
    : > /proc/sys/kernel/random/boot_id
    clear_previous_boot_pause
    [ -f "$PAUSE_FILE" ]
  `);
  sandbox.setBootId('current-boot');
  run('manual pause replaces an automatic pause marker', `
    ${DASH} '${sandbox.posix}/MANAGER_SCRIPT.sh' pause || exit 1
    [ -f /data/kano_usb_mode_manager_v2/paused ] && [ ! -s /data/kano_usb_mode_manager_v2/paused ]
  `);
  run('readiness timeout does not switch USB; failure pauses only the current boot', daemon + `
    rm -f "$PAUSE_FILE" "$BASE_DIR/calls"
    ready_calls=0
    wait_boot_ready() { ready_calls=$((ready_calls + 1)); [ "$ready_calls" -ge 2 ]; }
    load_config() { PERMANENT=1; PATROL_ENABLED=0; POLL_INTERVAL_SECONDS=8; }
    sh() {
      [ "$ready_calls" -ge 2 ] || exit 8
      echo "$2" >> "$BASE_DIR/calls"
      [ "$2" != apply-config ]
    }
    sleep() {
      if [ "$1" = 5 ]; then [ ! -f "$BASE_DIR/calls" ] || exit 9; return; fi
      [ "$(cat "$PAUSE_FILE")" = auto:current-boot ] || exit 10
      [ "$(wc -l < "$BASE_DIR/calls")" -eq 2 ] || exit 11
      exit 0
    }
    start_loop
  `);
  run('missing boot dependencies return failure without invoking the manager', daemon + `
    load_config() { BOOT_DELAY_SECONDS=0; }
    sleep() { :; }
    if wait_boot_ready; then exit 1; fi
    exit 0
  `);
  console.log(`${passed} tests passed`);
} finally {
  assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
  assert(path.basename(root).startsWith('f50-usb-mode-'));
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
}
