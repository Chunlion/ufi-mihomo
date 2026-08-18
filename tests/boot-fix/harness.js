'use strict';
// 沙盒测试台：把 猫猫开机自启修复.js 当成真实插件跑起来，
// 但把 /sdcard /data /proc 重定向到沙盒目录，用 dash + busybox 模拟设备环境。
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const vm = require('vm');

// 仓库根目录下的插件文件；测试台跑在 tests/boot-fix/ 里
const PLUGIN = path.resolve(__dirname, '..', '..', '开机自启修复.js');
const IS_WINDOWS = process.platform === 'win32';
const WINDOWS_BASH_CANDIDATES = [
  'D:\\Program Files\\Git\\bin\\bash.exe',
  'C:\\Program Files\\Git\\bin\\bash.exe',
];
const POSIX_USER_PROFILE = String(process.env.USERPROFILE || '')
  .replace(/^([A-Za-z]):\\/, (_, drive) => `/${drive.toLowerCase()}/`)
  .replace(/\\/g, '/');
const DASH = process.env.F50_DASH || '/usr/bin/dash';
const BUSYBOX = process.env.F50_BUSYBOX || (IS_WINDOWS && POSIX_USER_PROFILE
  ? `${POSIX_USER_PROFILE}/scoop/shims/busybox`
  : 'busybox');
const BASH_EXE = process.env.F50_BASH || (IS_WINDOWS
  ? WINDOWS_BASH_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || 'bash'
  : 'bash');

const winToPosix = (p) => {
  const abs = path.resolve(p).replace(/\\/g, '/');
  const m = abs.match(/^([A-Za-z]):\/(.*)$/);
  return m ? `/${m[1].toLowerCase()}/${m[2]}` : abs;
};

// 注：这里不能用 busybox.exe 当工具集 —— 它是原生 Windows 程序，
// MSYS 会把命令行里以 / 开头的参数改写成 Windows 路径（`tr "|" "/"` 会变成 `tr "|" "D:/..."`），
// 造成假失败。工具集用 MSYS 自带的 GNU 版本，applet/参数兼容性另行单独校验。
const BB_APPLETS = [];

class Sandbox {
  constructor(root) {
    this.root = root;
    this.posix = winToPosix(root);
    this.shellLog = [];
  }

  reset() {
    fs.rmSync(this.root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
    for (const d of ['sdcard', 'data', 'data/local/tmp', 'proc', 'proc/sys/kernel/random',
      'bin', 'tmp', 'prop', 'probe']) {
      fs.mkdirSync(path.join(this.root, d), { recursive: true });
    }
    for (const applet of BB_APPLETS) {
      const f = path.join(this.root, 'bin', applet);
      fs.writeFileSync(f, `#!${DASH}\nexec ${BUSYBOX} ${applet} "$@"\n`);
      fs.chmodSync(f, 0o755);
    }
    this.writeBin('whoami', 'echo root');
    this.writeBin('sync', 'exit 0');
    this.writeBin('getprop', `cat "${this.posix}/prop/sys.boot_completed" 2>/dev/null; exit 0`);
    this.writeBin('sh', `exec ${DASH} "$@"`);
    this.setUptime(5);
    this.setBootCompleted('0');
    this.setBootId('11111111-2222-3333-4444-555555555555');
    fs.writeFileSync(path.join(this.root, 'proc', 'stat'), 'cpu 1 2 3\nbtime 1700000000\n');
    this.shellLog = [];
  }

  writeBin(name, body) {
    const f = path.join(this.root, 'bin', name);
    fs.writeFileSync(f, `#!${DASH}\n${body}\n`);
    fs.chmodSync(f, 0o755);
  }

  setUptime(seconds) {
    fs.writeFileSync(path.join(this.root, 'proc', 'uptime'), `${seconds}.42 ${seconds}.00\n`);
  }

  setBootCompleted(v) {
    fs.writeFileSync(path.join(this.root, 'prop', 'sys.boot_completed'), `${v}\n`);
  }

  setBootId(id) {
    fs.writeFileSync(path.join(this.root, 'proc', 'sys', 'kernel', 'random', 'boot_id'), `${id}\n`);
  }

  p(rel) { return path.join(this.root, rel); }

  bootFile() { return this.p('sdcard/ufi_tools_boot.sh'); }

  writeBoot(content) {
    fs.mkdirSync(path.dirname(this.bootFile()), { recursive: true });
    fs.writeFileSync(this.bootFile(), content, { encoding: 'utf8' });
  }

  readBoot() {
    try { return fs.readFileSync(this.bootFile(), 'utf8'); } catch (e) { return null; }
  }

  read(rel) {
    try { return fs.readFileSync(this.p(rel), 'utf8'); } catch (e) { return null; }
  }

  exists(rel) { return fs.existsSync(this.p(rel)); }

  // 把设备上的绝对路径改写到沙盒里
  rewrite(script) {
    return String(script)
      .replace(/#!\/system\/bin\/sh/g, `#!${DASH}`)
      .replace(/\/system\/bin\/sh/g, DASH)
      .replace(/\/sdcard\//g, `${this.posix}/sdcard/`)
      .replace(/\/data\//g, `${this.posix}/data/`)
      .replace(/\/proc\//g, `${this.posix}/proc/`);
  }

  // 直接跑一段 shell（模拟 runShellWithRoot）
  runShell(script, timeoutMs = 30000, { rewrite = true } = {}) {
    const body = rewrite ? this.rewrite(script) : script;
    const file = path.join(this.root, 'tmp', `run_${this.shellLog.length}.sh`);
    fs.writeFileSync(file, body);
    // Long-running plugin commands intentionally outlive the manager timeout. Keep their
    // cwd outside the sandbox so Windows can remove the previous test directory safely.
    const cmd = `export PATH="${this.posix}/bin:/usr/bin:/bin"; cd /; exec ${DASH} "${winToPosix(file)}" 2>&1`;
    const res = spawnSync(BASH_EXE, ['-c', cmd], {
      encoding: 'utf8',
      timeout: timeoutMs,
      windowsHide: true,
    });
    const entry = {
      script: body,
      stdout: (res.stdout || '') + (res.stderr || ''),
      status: res.status,
      timedOut: !!res.error && res.error.code === 'ETIMEDOUT',
    };
    this.shellLog.push(entry);
    return entry;
  }
}

// ---------------------------------------------------------------------------
// 极简 DOM shim：让插件的 IIFE 能正常挂载，并把按钮的 onclick 暴露出来
// ---------------------------------------------------------------------------
function loadPlugin(sandbox, { rootExpected = true } = {}) {
  const elements = new Map();
  const makeEl = (tag = 'div') => {
    const el = {
      tag,
      style: {},
      dataset: {},
      innerHTML: '',
      textContent: '',
      disabled: false,
      id: '',
      appendChild() {},
      insertAdjacentElement(position, node) { this.insertedElement = node; },
      addEventListener() {},
      querySelector(sel) {
        if (!elements.has(sel)) elements.set(sel, makeEl('button'));
        return elements.get(sel);
      },
    };
    return el;
  };

  const container = makeEl('div');
  const document = {
    getElementById: () => null,
    querySelector: (sel) => (sel === '.functions-container' ? container : null),
    createElement: (tag) => makeEl(tag),
  };

  const calls = [];
  const runShellWithRoot = async (script, timeout) => {
    const r = sandbox.runShell(script, Math.max(timeout || 15000, 15000));
    calls.push({ script, timeout, result: r });
    if (!rootExpected && /whoami/.test(script)) return { success: true, content: 'shell' };
    return { success: true, content: r.stdout };
  };

  const toasts = [];
  const createToast = (msg, color, ms) => { toasts.push({ msg: String(msg), color, ms }); };

  const context = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Promise,
    document,
    runShellWithRoot,
    createToast,
    alert: (m) => toasts.push({ msg: String(m), color: 'alert' }),
    window: { confirm: () => true },
  };
  context.globalThis = context;
  vm.createContext(context);
  const src = fs.readFileSync(PLUGIN, 'utf8')
    .replace(/^\/\/<script>\s*/, '')
    .replace(/\/\/<\/script>\s*$/, '');
  vm.runInContext(src, context, { filename: 'plugin.js' });

  const click = async (name) => {
    const sel = `#f50_boot_fix_standalone_${name}`;
    const el = elements.get(sel);
    if (!el || typeof el.onclick !== 'function') throw new Error(`按钮 ${name} 未挂载`);
    await el.onclick();
    return el;
  };

  return { click, toasts, calls, elements, container };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForState(sandbox, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = sandbox.read('data/f50_boot_fix/last_run.txt');
    if (state && /(^|\n)DONE=1(\n|$)/.test(state)) return state;
    await sleep(250);
  }
  return sandbox.read('data/f50_boot_fix/last_run.txt');
}

module.exports = { Sandbox, loadPlugin, waitForState, sleep, winToPosix, DASH, BUSYBOX, BASH_EXE };
