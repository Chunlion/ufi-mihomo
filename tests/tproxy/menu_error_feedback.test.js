'use strict';

// 「订阅与配置」「网络与诊断」的只读入口在设备读取失败时必须给出提示，
// 不能出现“点了没反应”：处理器要吞掉异常并弹出错误提示。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../..', '猫猫TProxy.js'), 'utf8');

function handler(marker) {
  const from = source.indexOf(marker);
  assert.ok(from >= 0, `missing handler: ${marker}`);
  const open = source.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') { depth--; if (depth === 0) return source.slice(open, i + 1); }
  }
  throw new Error(`unbalanced handler: ${marker}`);
}

function run(marker, mocks) {
  const toasts = [];
  const sandbox = {
    createToast: (...args) => toasts.push(args),
    safeTextToHtml: (value) => String(value),
    escapeHtml: (value) => String(value),
    setButtonBusy: () => {},
    lastInstallDiagnostic: null,
    showInfoDialog: () => {},
    console: { error() {} },
    ...mocks,
  };
  const fn = vm.runInNewContext('(async () => ' + handler(marker) + ')', sandbox);
  return { toasts, promise: fn() };
}

const fail = (message) => async () => { throw new Error(message); };

test('状态与日志: 诊断抛错时给出提示而不是静默失败', async () => {
  const { toasts, promise } = run('showLogBtn.onclick = async () => {', {
    ensureAdvanced: async () => true,
    showStatusDiagnostic: fail('status failed'),
    showLogBtn: { dataset: {}, disabled: false, textContent: '状态与日志' },
  });
  await promise;
  assert.equal(toasts.length, 1);
  assert.match(toasts[0][0], /诊断读取失败/);
  assert.match(toasts[0][0], /status failed/);
});

test('订阅 User-Agent: 权限校验抛错时给出提示', async () => {
  const { toasts, promise } = run('userAgentBtn.onclick = async () => {', {
    ensureReady: fail('ready failed'),
  });
  await promise;
  assert.equal(toasts.length, 1);
  assert.match(toasts[0][0], /无法读取订阅 User-Agent/);
  assert.match(toasts[0][0], /ready failed/);
});

test('订阅 User-Agent: 读取抛错时给出提示', async () => {
  const { toasts, promise } = run('userAgentBtn.onclick = async () => {', {
    ensureReady: async () => true,
    loadProviderUserAgent: fail('ua failed'),
  });
  await promise;
  assert.equal(toasts.length, 1);
  assert.match(toasts[0][0], /无法读取订阅 User-Agent/);
  assert.match(toasts[0][0], /ua failed/);
});

test('配置与规则: 读取抛错时给出提示', async () => {
  const { toasts, promise } = run('templateOverrideBtn.onclick = async () => {', {
    ensureReady: async () => true,
    readRuleOverrideConfig: fail('override failed'),
    hasSavedJsOverride: async () => false,
  });
  await promise;
  assert.equal(toasts.length, 1);
  assert.match(toasts[0][0], /无法读取配置与规则/);
});

test('网络设置: 权限校验抛错时给出提示', async () => {
  const { toasts, promise } = run('policyToolsBtn.onclick = async () => {', {
    ensureReady: fail('ready failed'),
  });
  await promise;
  assert.equal(toasts.length, 1);
  assert.match(toasts[0][0], /无法打开网络设置/);
});

test('配置文件: 权限校验抛错时给出提示', async () => {
  const { toasts, promise } = run('editBtn.onclick = async () => {', {
    ensureReady: fail('ready failed'),
  });
  await promise;
  assert.equal(toasts.length, 1);
  assert.match(toasts[0][0], /无法打开配置文件/);
});

test('权限校验失败时不弹错误提示, 保持原有静默返回', async () => {
  const { toasts, promise } = run('policyToolsBtn.onclick = async () => {', {
    ensureReady: async () => false,
  });
  await promise;
  assert.equal(toasts.length, 0);
});

for (const ok of [true, false]) test('卸载后只在成功时重新读取自启状态 / ' + ok, async () => {
  let refreshes = 0;
  const { promise } = run('btn_disabled.onclick = async () => {', {
    confirmF50OperationNotInFlight: () => true, window: { confirm: () => true },
    acquireCriticalOperation: () => ({}), markF50OperationInFlight() {}, clearF50OperationInFlight() {},
    btn_disabled: {}, templateFlowTimer: null, templateFlowMessages: [],
    performF50Uninstall: async () => ({ ok, summary: 'uninstall result' }),
    refreshBootButtonState: async () => { refreshes++; },
    invalidateBinarySnapshot() {}, invalidateStatusSnapshot() {},
    localStorage: { removeItem() {} }, document: { getElementById: () => null, querySelector: () => null },
    renderRuntimeStatus() {}, operationFinish() {}, releaseCriticalOperation: async () => {},
  });
  await promise;
  assert.equal(refreshes, ok ? 1 : 0);
});

for (const ok of [true, false]) test('安装后只在确认完成时重新读取自启状态 / ' + ok, async () => {
  let refreshes = 0, requests = 0;
  const start = source.indexOf('async function installF50PackageAtDevicePath(');
  const code = source.slice(start, source.indexOf('async function ensureF50InstallLease()', start));
  const install = vm.runInNewContext(code + '\ninstallF50PackageAtDevicePath', {
    operationStage() {}, buildF50InspectScript: () => 'inspect', buildF50InstallScript: () => 'install',
    runShellWithRoot: async () => ++requests === 1 ? { success: true, content: 'F50_INSPECT_OK=1' }
      : { success: ok, deviceCompleted: true, deviceExitCode: ok ? 0 : 1,
        content: ok ? 'F50_INSTALL_COMPONENTS_OK=1\nF50_INSTALL_TRANSACTION_STATE=complete\nKANO_INSTALL_OK=1\nF50_INSTALL_STATUS=installed_running'
          : 'F50_INSTALL_CODE=unzip_failed' },
    refreshBootButtonState: async () => { refreshes++; },
    invalidateStatusSnapshot() {}, invalidateBinarySnapshot() {},
    f50Diagnostic: details => ({ details }), clearF50OperationInFlight() {},
    operationFinish() {}, createToast() {}, safeTextToHtml: String,
  });
  assert.equal(await install('/fixture/package.zip'), ok);
  assert.equal(refreshes, ok ? 1 : 0);
});

for (const state of ['direct', 'disabled']) test('自启按钮解除忙碌时保留新状态文案 / ' + state, () => {
  const button = { textContent: '处理中…', disabled: true, style: {},
    dataset: { kanoBusy: '1', rawText: state === 'direct' ? '开机自启' : '已开启自启', rawDisabled: '0' } };
  const applyStart = source.indexOf('const applyBootButtonState =');
  const busyStart = source.indexOf('const setButtonBusy =');
  const api = vm.runInNewContext(
    source.slice(applyStart, source.indexOf("boot_on.addEventListener('click'", applyStart))
    + source.slice(busyStart, source.indexOf('let activeCriticalOperation', busyStart))
    + '\n({apply:applyBootButtonState,busy:setButtonBusy})', { boot_on: button });
  api.apply({ state });
  api.busy(button, false);
  assert.equal(button.dataset.bootState, state);
  assert.equal(button.textContent, state === 'direct' ? '已开启自启' : '开机自启');
  assert.equal(button.disabled, false);
});
