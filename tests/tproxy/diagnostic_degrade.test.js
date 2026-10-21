'use strict';

// 诊断入口在单个探测失败时必须仍然可用：降级项要能显示，且不能整体 reject。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../..', '猫猫TProxy.js'), 'utf8');

function slice(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing markers: ${start} -> ${end}`);
  return source.slice(from, to);
}

function harness(overrides = {}) {
  const dialogs = [];
  const base = {
    buildControllerInfo: async () => ({ externalController: '127.0.0.1:7788', apiBase: 'http://127.0.0.1:7788', secretSet: true, usingFallbackController: false }),
    getCorePid: async () => '1234',
    checkInstallState: async () => ({ state: 'healthy', message: '' }),
    inspectBootIntegration: async () => ({ state: 'direct', message: '' }),
    readBinarySnapshot: async () => null,
    runShellWithRoot: async () => ({ success: true, content: 'exists=1\nsize=2048' }),
    readPolicyState: async () => ({ options: { traffic_mode: 'tproxy', ipv6: 'on' } }),
    callMihomoApi: async () => ({ success: true, statusCode: 200, responseText: '{"connections":[]}' }),
    f50HealthLayers: () => ({ core: '进程存在', api: '可访问', takeover: '', panel: '可访问', providers: '', connectivity: '' }),
    showInfoDialog: (id, title, html) => dialogs.push({ id, title, html }),
    escapeHtml: (value) => String(value),
    sanitizeSubscriptionSecrets: (value) => String(value),
    parseKeyValueOutput: () => ({}),
    shellQuote: (value) => `'${value}'`,
    buildF50ShellBase: () => '',
    buildF50PanelHelpers: () => '',
    lastInstallDiagnostic: null,
    CLASH_CONFIG: '/data/clash/Proxy/config.yaml',
    LOG_FILE: '/data/clash/kano_clash.log',
    CLASH_CORE: '/data/clash/Proxy/Clash.Core',
    console: { error() {} },
    ...overrides,
  };
  const code = slice('  const showStatusDiagnostic = async () => {', '  const sanitizeConfigForTProxy =');
  return { dialogs, api: vm.runInNewContext(code + '\n({run: showStatusDiagnostic})', base) };
}

test('all probes healthy renders the diagnostic dialog', async () => {
  const h = harness();
  await h.api.run();
  assert.equal(h.dialogs.length, 1);
  assert.equal(h.dialogs[0].id, 'mm_status_diagnostic');
  assert.match(h.dialogs[0].html, /TProxy/);
  assert.doesNotMatch(h.dialogs[0].html, /读取降级/);
});

test('a failing probe degrades that row instead of aborting the dialog', async () => {
  const h = harness({ readPolicyState: async () => { throw new Error('policy read failed'); } });
  await h.api.run();
  assert.equal(h.dialogs.length, 1);
  assert.match(h.dialogs[0].html, /读取降级/);
  assert.match(h.dialogs[0].html, /网络设置：policy read failed/);
  assert.match(h.dialogs[0].html, /未读取/);
});

test('every probe failing still renders one dialog with all failures listed', async () => {
  const fail = async () => { throw new Error('device offline'); };
  const h = harness({
    buildControllerInfo: fail, getCorePid: fail, checkInstallState: fail, inspectBootIntegration: fail,
    readBinarySnapshot: fail, runShellWithRoot: fail, readPolicyState: fail, callMihomoApi: fail,
  });
  await h.api.run();
  assert.equal(h.dialogs.length, 1);
  assert.match(h.dialogs[0].html, /读取降级/);
  for (const label of ['运行状态', '开机自启', '核心进程', '控制地址', '网络设置', '运行日志', '控制 API', '活动连接']) {
    assert.match(h.dialogs[0].html, new RegExp(label));
  }
});

test('a synchronous helper throw inside the panel probe is degraded, not propagated', async () => {
  const h = harness({ buildF50ShellBase: () => { throw new Error('base build failed'); } });
  await h.api.run();
  assert.equal(h.dialogs.length, 1);
  assert.match(h.dialogs[0].html, /Zashboard：base build failed/);
});
