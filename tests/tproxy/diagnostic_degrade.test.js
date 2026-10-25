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
    f50HealthLayers: () => ({ core: '进程存在', api: '可访问', panel: '可访问', providers: '', providerProblems: [], unverified: '数据面接管、代理连通性' }),
    showInfoDialog: (id, title, html) => dialogs.push({ id, title, html }),
    escapeHtml: (value) => String(value),
    sanitizeSubscriptionSecrets: (value) => String(value),
    parseKeyValueOutput: () => ({
      PROCESS_KIND: 'runtime', PORT_CONTROLLER: '1', CORE_ELF: '1', CORE_SIZE: '1024',
      CMDLINE: '/data/clash/Proxy/Clash.Core -d /data/clash/Proxy',
    }),
    F50_PORTS: { http: 7890, socks: 7891, mixed: 7892, tproxy: 7895, dns: 1053, controller: 7788 },
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

test('the main list stays compact and field details are collapsed', async () => {
  const h = harness();
  await h.api.run();
  const html = h.dialogs[0].html;
  const main = html.slice(0, html.indexOf('<details'));
  const rowCount = (main.match(/display:grid;grid-template-columns:minmax\(96px/g) || []).length;
  assert.ok(rowCount <= 10, `main list should stay short, got ${rowCount} rows`);
  assert.match(main, /总览/);
  assert.match(main, /核心进程/);
  assert.match(main, /运行配置/);
  assert.match(main, /未实测/);
  assert.doesNotMatch(main, /接管有效性/, 'two always-untested rows are merged into 未实测');
  assert.match(html, /<details[^>]*><summary>详细信息<\/summary>/);
  assert.match(html, /核心命令行/, 'raw fields remain available in the details block');
});

test('a probe failure is reported once in the summary, not as extra rows', async () => {
  const h = harness({ readPolicyState: async () => { throw new Error('policy read failed'); } });
  await h.api.run();
  const html = h.dialogs[0].html;
  assert.match(html, /需注意：[^<]*1 项读取失败/);
});

test('a synchronous helper throw inside the panel probe is degraded, not propagated', async () => {
  const h = harness({ buildF50ShellBase: () => { throw new Error('base build failed'); } });
  await h.api.run();
  assert.equal(h.dialogs.length, 1);
  assert.match(h.dialogs[0].html, /Zashboard：base build failed/);
});

test('provider anomalies reach the summary even when the request succeeds', async () => {
  for (const problem of ['节点来源响应格式不正确', '2 个节点来源状态无法读取']) {
    const h = harness({
      callMihomoApi: async () => ({ success: true, statusCode: 200, responseText: '{"providers":{}}' }),
      f50HealthLayers: () => ({ core: '进程存在', api: '可访问', panel: '可访问', providers: problem, providerProblems: [problem], unverified: '数据面接管、代理连通性' }),
    });
    await h.api.run();
    // 请求成功不等于结果正常：解析结论必须进总览，否则健康设备会显示“正常”。
    assert.match(h.dialogs[0].html, new RegExp(`需注意：[^<]*${problem}`));
  }
});

test('f50HealthLayers classifies provider snapshots into problems', () => {
  const { layers } = vm.runInNewContext(
    slice('function f50HealthLayers(', 'const F50_TRUSTED_SERVICE_HASHES') + '\n({layers: f50HealthLayers})', {});
  // 数组来自另一个 VM realm，比较前先复制到本 realm。
  const problems = (input) => [...(layers(input).providerProblems || [])];
  assert.deepEqual(problems({ provider: { success: false } }), ['节点来源读取失败']);
  assert.deepEqual(problems({ provider: { success: true, responseText: 'null' } }), ['节点来源响应格式不正确']);
  assert.equal(layers({ provider: { success: true, responseText: 'null' } }).providers, '响应格式不正确');
  assert.deepEqual(problems({ provider: { success: true, responseText: '{"providers":{"a":{"proxies":[]},"b":{}}}' } }),
    ['1 个节点来源状态无法读取']);
  assert.deepEqual(problems({ provider: { success: true, responseText: '{"providers":{"a":{"proxies":[1,2]}}}' } }), []);
  assert.equal(layers({ provider: { success: true, responseText: '{"providers":{"a":{"proxies":[1,2]}}}' } }).providers,
    '1 个来源，2 个已加载节点');
});
