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

test('every emitted installation failure has a Chinese diagnostic', () => {
  const labels = vm.runInNewContext(slice('const F50_DIAGNOSTIC_LABELS =', 'function f50Diagnostic') + '\nF50_DIAGNOSTIC_LABELS');
  const codes = new Set(Array.from(source.matchAll(/\bf50_install_fail\s+([a-z][a-z0-9_]*)/g), match => match[1]));
  for (const match of source.matchAll(/\bF50_INSTALL_CODE=([a-z][a-z0-9_]*)/g)) codes.add(match[1]);
  assert.ok(codes.size >= 52);
  for (const code of codes) assert.match(labels[code] || '', /[\u4e00-\u9fff]/, code);
});

function harness(overrides = {}, realShell = false) {
  const dialogs = [];
  // 诊断现在是「先开窗、后填充」：showInfoDialog 立即拿到骨架，各区块随后写 innerHTML/textContent。
  // 这里把骨架和填充结果合成回一份 HTML，保持原有断言按内容顺序切片的方式。
  const openDialog = (id, title, skeleton) => {
    const nodes = new Map();
    const node = (sel) => {
      if (!nodes.has(sel)) nodes.set(sel, { innerHTML: '', textContent: '' });
      return nodes.get(sel);
    };
    const fill = (source, cls, tag) => {
      const entry = nodes.get('.' + cls);
      if (!entry) return source;
      const body = (tag === 'text' ? entry.textContent : entry.innerHTML) || '';
      const element = tag === 'text' ? 'pre' : 'div';
      const pattern = new RegExp(`(<${element} class="${cls}"[^>]*>)[\\s\\S]*?(</${element}>)`);
      return source.replace(pattern, (match, head, tail) => head + body + tail);
    };
    dialogs.push({
      id, title, skeleton,
      get html() {
        let out = fill(skeleton, 'kano-diag-summary');
        out = fill(out, 'kano-diag-detail');
        return fill(out, 'kano-diag-log', 'text');
      },
    });
    return { el: { querySelector: node }, close() {} };
  };
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
    showInfoDialog: openDialog,
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
  // 诊断只读探测走独立通道（不拿租约、不产生任务收据）；未单独注入时沿用同一个桩，
  // 既有用例仍可按脚本内容分流。
  if (!overrides.probeShell) base.probeShell = (script, timeout) => base.runShellWithRoot(script, timeout);
  const shellCode = realShell ? [
    'let activeCriticalOperation = null; let taskCommandSequence = 0;',
    slice('    let transientShellOperation =', '  const shellQuote ='),
    slice('  const parseRuntimePreflightResult =', '  const downloadCoreArchive ='),
    slice('  let runtimePreflightCache =', '  const ensureInstalled ='),
    slice('  const readPolicyState =', '  const updateModeBadge ='),
  ].join('\n') : '';
  const code = shellCode + slice('  const showStatusDiagnostic = async () => {', '  const sanitizeConfigForTProxy =');
  const exports = realShell
    ? '({run: showStatusDiagnostic, write: runShellWithRoot, uncertain: () => deviceTaskUncertain})'
    : '({run: showStatusDiagnostic})';
  return { dialogs, api: vm.runInNewContext(code + '\n' + exports, base) };
}

test('all probes healthy renders the diagnostic dialog', async () => {
  const h = harness();
  await h.api.run();
  assert.equal(h.dialogs.length, 1);
  assert.equal(h.dialogs[0].id, 'mm_status_diagnostic');
  assert.match(h.dialogs[0].html, /TProxy/);
  assert.doesNotMatch(h.dialogs[0].html, /读取降级/);
});

test('diagnostics read through the lease-free probe channel', async () => {
  const leased = [];
  const h = harness({
    // 租约通道一旦被诊断用到就会置 deviceTaskUncertain 并误报“请执行恢复网络”，
    // 所以这里直接让它失败：诊断必须全部走 probeShell。
    runShellWithRoot: async script => { leased.push(script); throw new Error('lease channel must not be used'); },
    probeShell: async script => ({
      success: true,
      content: script.includes('STALE_TEST_PIDS=') ? 'STALE_TEST_PIDS=' : 'exists=1\nsize=2048',
    }),
  });
  await h.api.run();
  assert.deepEqual(leased, [], 'diagnostics must not use the leased shell channel');
  assert.doesNotMatch(h.dialogs[0].html, /读取降级/);
});

for (const failure of ['rejected', 'unsuccessful']) test('real diagnostic queries fail without blocking the next write / ' + failure, async () => {
  const calls = [], toasts = [];
  const toolboxBin = '/data/clash/toolbox/bin';
  let writing = false;
  const h = harness({
    hostRunShellWithRoot: async script => {
      calls.push({ script, writing });
      if (script.includes('f50_lease_acquire ')) return { success: true, content: 'F50_LEASE_ACQUIRED=1' };
      if (script.includes('f50_lease_release ')) return { success: true, content: 'F50_LEASE_RELEASED=1' };
      const request = script.match(/F50_TASK_NOT_STARTED=(mm_[A-Za-z0-9_.-]+)/);
      if (request) return { success: true, content: 'write-ok\nF50_TASK_FINISHED=' + request[1] + ':0\n' };
      if (script.includes('STALE_TEST_PIDS=') || script.includes('BOOT_STATE=') || script.includes('START_LOG=')) {
        if (failure === 'rejected') throw new Error('query timed out');
        return { success: false, content: 'query timed out' };
      }
      if (script.includes('PREFLIGHT_STATE=')) return { success: true, content: 'PREFLIGHT_STATE=running_api_unavailable\nCORE_PID=1234' };
      if (script.includes('KANO_POLICY_')) return { success: true, content: 'KANO_POLICY_options=traffic_mode=tproxy' };
      return { data: { success: true, content: 'exists=1\nsize=2048' } };
    },
    KANO_INSTALL_TOOLBOX_BIN: toolboxBin,
    CLASH_SERVICE: '/data/clash/Scripts/Clash.Service',
    BOOT_FILE: '/sdcard/ufi_tools_boot.sh',
    BOOT_ASYNC_LINE: 'boot-async', BOOT_SERVICE_LINE: 'boot-service',
    BOOT_POLICY_TOOLS_LINE: 'boot-policy', BOOT_INOTIFY_LINE: 'boot-inotify',
    LEGACY_BOOT_INOTIFY_LINE: 'legacy-inotify', LEGACY_BOOT_SERVICE_LINE: 'legacy-service',
    LEGACY_BOOT_FIX_WRAPPER_LINE: 'legacy-wrapper', CLASH_SERVICE_WRAPPER_VERSION: 'test',
    CLASH_POLICY_SCRIPT: '/data/clash/policy.sh', CLASH_DIR: '/data/clash',
    CLASH_POLICY_OPTIONS_FILE: '/data/clash/options', CLASH_DEVICE_BYPASS_FILE: '/data/clash/devices',
    CLASH_DEVICE_NOTES_FILE: '/data/clash/notes', CLASH_DIRECT_DOMAIN_FILE: '/data/clash/direct-domain',
    CLASH_DIRECT_IP_FILE: '/data/clash/direct-ip', CLASH_PROXY_DOMAIN_FILE: '/data/clash/proxy-domain',
    CLASH_REJECT_DOMAIN_FILE: '/data/clash/reject-domain',
    buildOwnedCoreFunctions: () => '', buildF50LeaseFunctions: () => '', buildF50GistFence: () => '',
    parseKeyValueOutput: content => Object.fromEntries(content.split('\n').filter(line => line.includes('=')).map(line => {
      const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)];
    })),
    parsePolicyOptionsText: () => ({ traffic_mode: 'tproxy', ipv6: 'on' }),
    parseDeviceBypassLine: () => ({ address: '' }), readDeviceBypassNotes: () => [],
    createRandomString: () => 'test', setInterval, clearInterval,
    operationCancelled: () => new Error('operation cancelled'),
    f50Diagnostic: () => ({}), syncCriticalOperationStatus() {},
    safeTextToHtml: String, createToast: message => toasts.push(message),
  }, true);
  await h.api.run();
  assert.match(h.dialogs[0].html, /遗留测试进程：query timed out/);
  assert.match(h.dialogs[0].html, /开机自启：query timed out/);
  assert.match(h.dialogs[0].html, /日志读取失败：query timed out/);
  assert.equal(h.api.uncertain(), false);
  assert.deepEqual(toasts, []);
  assert.ok(calls.every(call => call.script.includes(`export PATH='${toolboxBin}'`)), '诊断与写通道使用同一 PATH 前缀');
  assert.ok(calls.every(call => !/f50_lease_acquire |f50_writer_enter|F50_TASK_FINISHED=/.test(call.script)));
  writing = true;
  const result = await h.api.write('echo write-ok', 5000);
  assert.equal(result.success, true);
  assert.equal(result.deviceCompleted, true);
  assert.match(result.content, /write-ok/);
  assert.equal(h.api.uncertain(), false);
  assert.ok(calls.some(call => call.writing && call.script.includes('f50_lease_release ')));
});

test('optional snapshot failure falls back to the config file probe', async () => {
  const h = harness({ readBinarySnapshot: async () => { throw new Error('helper unavailable'); } });
  await h.api.run();
  assert.match(h.dialogs[0].html, /config.yaml 2.0 KB/);
  assert.doesNotMatch(h.dialogs[0].html, /配置文件：helper unavailable/);
});

test('a throwing helper probe reads as unavailable, so the negative cache still applies', async () => {
  // 只读通道失败若直接冒泡，readBinarySnapshot 就设不了 binarySnapshotUnavailableUntil，
  // 每次开诊断都会为一个不存在的 helper 多跑一次 shell。
  const api = vm.runInNewContext(
    slice('  const runBinaryHelperJson =', '  const readBinarySnapshot =') + '\n({run: runBinaryHelperJson})',
    { shellQuote: value => `'${value}'`, KANO_HELPER_PATH: '/data/clash/Tools/f50-helper', parseBinaryHelperJsonOutput: () => ({ ok: true }) },
  );
  assert.equal(await api.run('snapshot', [], 1000, async () => { throw new Error('probe failed'); }), null);
  assert.equal(await api.run('snapshot', [], 1000, async () => ({ success: false, content: 'exit 127' })), null);
  assert.deepEqual(await api.run('snapshot', [], 1000, async () => ({ success: true, content: '{"ok":true}' })), { ok: true });
});

test('a failing probe degrades that row instead of aborting the dialog', async () => {
  const h = harness({ readPolicyState: async () => { throw new Error('policy read failed'); } });
  await h.api.run();
  assert.equal(h.dialogs.length, 1);
  assert.match(h.dialogs[0].html, /读取降级/);
  assert.match(h.dialogs[0].html, /网络设置：policy read failed/);
  assert.match(h.dialogs[0].html, /未读取/);
});

for (const timing of ['early', 'late', 'nonzero']) test('stale-process failures remain visible without blocking dialog opening / ' + timing, async () => {
  let releasePanel, resolveScan, rejectScan;
  const panel = new Promise(resolve => { releasePanel = resolve; });
  const scan = new Promise((resolve, reject) => { resolveScan = resolve; rejectScan = reject; });
  const h = harness({ runShellWithRoot: async script => {
    if (script.includes('STALE_TEST_PIDS=')) return scan;
    if (script.includes('f50_verify_zashboard_endpoint') && timing !== 'late') return panel;
    return { success: true, content: 'exists=1\nsize=2048' };
  } });
  const running = h.api.run();
  assert.equal(h.dialogs.length, 1, 'dialog must open before probes finish');
  await new Promise(setImmediate);
  if (timing === 'nonzero') resolveScan({ success: false, content: 'scan failed' });
  else rejectScan(new Error('scan failed'));
  await new Promise(setImmediate);
  releasePanel({ success: true, content: '' });
  await running;
  assert.match(h.dialogs[0].html, /遗留测试进程：scan failed/);
  assert.match(h.dialogs[0].html, /需注意：[^<]*1 项读取失败/);
  assert.match(h.dialogs[0].html, /遗留测试进程<\/strong><span[^>]*>读取失败/);
});

test('failed runtime preflight still checks the controller API independently', async () => {
  const requests = [];
  const h = harness({
    checkInstallState: async () => { throw new Error('preflight unavailable'); },
    callMihomoApi: async route => { requests.push(route); return { success: true, statusCode: 200, responseText: '{"connections":[]}' }; },
  });
  await h.api.run();
  assert.equal(requests.filter(route => route === '/version').length, 1);
  assert.match(h.dialogs[0].html, /运行状态：preflight unavailable/);
  assert.match(h.dialogs[0].html, /控制 API<\/strong><span[^>]*>正常（HTTP 200）/);
  assert.doesNotMatch(h.dialogs[0].html, /控制 API：preflight unavailable/);
});

test('diagnostics reuse the version response from successful runtime preflight', async () => {
  const requests = [];
  const h = harness({
    checkInstallState: async () => ({ state: 'healthy', api: { success: true, statusCode: 200 } }),
    callMihomoApi: async route => { requests.push(route); return { success: true, statusCode: 200, responseText: '{"connections":[]}' }; },
  });
  await h.api.run();
  assert.ok(!requests.includes('/version'));
  assert.match(h.dialogs[0].html, /正常（HTTP 200）/);
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
