'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const source = fs.readFileSync(path.resolve(__dirname, '..', '..', process.env.F50_PLUGIN || '猫猫TProxy.js'), 'utf8');
const slice = (start, end, text = source) => {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing source: ${start}`);
  return text.slice(from, to);
};
const updateFunction = slice('const updateSubProviders = async', 'const readCurrentSubSources = async');
const clickHandler = slice('updateSubBtn.onclick = async', 'const applySavedOverrides = async');

for (const configSource of ['uploaded_config', 'subscription_original']) {
  for (const saved of [true, false]) {
    test(`legacy config protection / custom provider refresh from ${configSource}, providerOK=${saved}`, async () => {
      const sources = [{ name: 'Provider1', url: 'https://example.com/config.yaml', enabled: true }];
      const calls = [];
      const finished = [];
      const sandbox = {
        SUB_RULE_MODE_TEMPLATE: 'template',
        SUB_RULE_MODE_ORIGINAL: 'original',
        SUB_CONVERT_MODE_LOCAL: 'local',
        SUB_CONVERT_MODE_PROVIDER: 'provider',
        CLASH_CONFIG: '/data/clash/Proxy/config.yaml',
        updateSubBtn: {},
        acquireCriticalOperation: () => ({}),
        releaseCriticalOperation() {},
        setButtonBusy() {},
        operationStage() {},
        operationFinish: (ok) => finished.push(ok),
        ensureReady: async () => true,
        ensureCompatBackend: async () => true,
        f50GistManaged: async () => null,
        readConfigSource: async () => configSource,
        readCurrentSubRuleMode: async () => 'original',
        readSavedSubConvertMode: async () => 'local',
        readCurrentSubSources: async () => sources,
        normalizeSubSourceList: (value) => value,
        normalizeSubRuleModeValue: (value) => value,
        normalizeSubConvertModeValue: (value) => value,
        validateSubscriptionMode() {},
        createToast() {},
        safeTextToHtml: (value) => value,
        readYamlObject: async () => ({ ok: true, value: { 'proxy-providers': { Provider1: { type: 'http' } } } }),
        saveSubSources: async (...args) => { calls.push(args); return saved; },
        forceUpdateProvidersFromConfig: async () => { calls.push('providers'); return { failed: saved ? 0 : 1 }; },
      };
      vm.runInNewContext(`${updateFunction}\n${clickHandler}`, sandbox);
      await sandbox.updateSubBtn.onclick();
      assert.deepEqual(calls, configSource === 'uploaded_config' ? ['providers'] : []);
      assert.deepEqual(finished, [configSource === 'uploaded_config' && saved]);
    });
  }
}

test('uploaded config in template mode only refreshes its providers', async () => {
  let refreshed = false;
  const sandbox = {
    SUB_RULE_MODE_ORIGINAL: 'original',
    updateSubBtn: {},
    acquireCriticalOperation: () => ({}),
    releaseCriticalOperation() {},
    setButtonBusy() {},
    operationStage() {},
    operationFinish: (ok) => assert.equal(ok, true),
    ensureReady: async () => true,
    readCurrentSubRuleMode: async () => 'template',
    readConfigSource: async () => 'uploaded_config',
    readCurrentSubSources: async () => { throw new Error('custom providers do not use saved subscriptions'); },
    updateSubProviders: async (sources) => {
      assert.equal(sources.length, 0);
      refreshed = true;
      return true;
    },
  };
  vm.runInNewContext(clickHandler, sandbox);
  await sandbox.updateSubBtn.onclick();
  assert.equal(refreshed, true);
});

const configApi = vm.runInNewContext(`${slice('const F50_PORTS', 'const F50_COMPAT_VERSION')}
  ${slice('const F50_ORIGINAL_MANAGED_KEYS', 'let f50BackendReady')}
  ${slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later')}
  ({ runtime: createPrivateRouteLogic().runtime, profiles: F50_FIXED_PROFILES, delta: PROFILE_DELTA,
     functions: buildF50OriginalConfigFunctions, install: ensureOriginalSubscriptionService,
     panelCheck: typeof buildF50PanelConfigCheck === 'function' ? buildF50PanelConfigCheck() : null })`, {
  F50_ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
});
const originalConfig = {
  mode: 'global',
  'log-level': 'debug', 'unified-delay': false, 'tcp-concurrent': true,
  'geodata-mode': false, 'external-controller-tls': '0.0.0.0:9999',
  'interface-name': 'DesktopEthernet', 'routing-mark': 1234,
  'x-format-test': { booleanString: 'true', numericString: '00123', booleanValue: false, numberValue: 7 },
  sniffer: { enable: false }, profile: { 'store-selected': false },
  dns: { enable: false, listen: '127.0.0.1:53', ipv6: true,
    nameserver: ['https://example.com/dns-query'], 'enhanced-mode': 'fake-ip',
    'nameserver-policy': { 'rule-set:cn_domain': ['1.1.1.1'] },
    'proxy-server-nameserver-policy': {
      'cdn-hk.example.com': ['dns-hk.example.com:1066', 'dns-jp.example.com:1066', 'https://dns-jp.example.com/dns-query'],
      'cdn-jp.example.com': ['dns-hk.example.com:1066', 'dns-jp.example.com:1066', 'https://dns-jp.example.com/dns-query'],
    } },
  tun: { enable: true, mtu: 9000, 'route-exclude-address': ['203.0.113.0/24'] },
  proxies: [{ name: 'Test', type: 'socks5', server: 'example.com', port: 1080 }],
  'proxy-groups': [{ name: 'Proxy', type: 'select', proxies: ['Test'] }],
  rules: ['MATCH,Proxy'],
  'rule-providers': { cn_domain: { type: 'http', behavior: 'domain', proxy: 'Proxy' } },
};
const plain = (value) => JSON.parse(JSON.stringify(value));

function airportApi(overrides = {}) {
  const context = {
    cloneJsonValue: plain,
    isPlainYamlObject: value => value !== null && typeof value === 'object' && !Array.isArray(value),
    assertYamlRootMap: value => value,
    PROFILE_BASE: { dns: { 'proxy-server-nameserver': ['223.5.5.5'] } },
    CLASH_TEMPLATE_BASE: '/data/clash/Tools/template.base.yaml',
    CLASH_TEMPLATE: '/data/clash/Tools/template.yaml',
    CLASH_CONFIG: '/data/clash/Proxy/config.yaml',
    GENERATED_TEMPLATE_MARKER: '# generated',
    shellQuote: value => `'${value}'`,
    createToast() {}, safeTextToHtml: value => value,
    ...overrides,
  };
  return vm.runInNewContext(slice('const updateAirportDnsTemplate =', 'const readRuleOverrideConfig =') +
    '\n({update:updateAirportDnsTemplate,extract:extractAirportDnsPolicy,save:saveAirportDnsPolicy,parse:parseAirportDnsText,read:readAirportDnsTemplate})', context);
}
const airportPolicy = {
  'node-a.example.com': ['dns-a.example.com:1066', 'https://dns-b.example.com/dns-query'],
  '+.example.net': ['dns-a.example.com:1066'],
};
function airportDialogHarness(initialPolicy = {}, runtimePolicy = airportPolicy) {
  let template = { dns: { 'proxy-server-nameserver-policy': plain(initialPolicy) }, rules: ['MATCH,DIRECT'] };
  let elements;
  const writes = [];
  const read = async file => ({ ok: true, value: file === '/data/clash/Tools/template.base.yaml'
    ? plain(template) : { dns: { 'proxy-server-nameserver-policy': plain(runtimePolicy) } } });
  const api = airportApi({
    runShellWithRoot: async () => ({ success: true, content: 'base' }),
    readYamlObject: read, yamlHasGeneratedMarker: async () => false,
    writeYamlObjectAtomic: async (file, value) => {
      assert.equal(file, '/data/clash/Tools/template.base.yaml');
      template = plain(value); writes.push(template); return { ok: true };
    },
  });
  const element = () => ({ value: '', textContent: '', style: {}, children: [],
    append(...items) { this.children.push(...items); }, appendChild(item) { this.children.push(item); } });
  const open = vm.runInNewContext(slice('const showAirportDnsDialog = async', 'const templateOverrideBtn =') + '\nshowAirportDnsDialog', {
    CLASH_CONFIG: '/data/clash/Proxy/config.yaml', readAirportDnsTemplate: api.read, readYamlObject: read,
    isPlainYamlObject: value => value !== null && typeof value === 'object' && !Array.isArray(value),
    updateAirportDnsTemplate: api.update, extractAirportDnsPolicy: api.extract, saveAirportDnsPolicy: api.save,
    createToast() {}, safeTextToHtml: String, document: { createElement: element },
    createFixedToast: () => {
      elements = new Map();
      return { close() {}, el: { querySelector(id) {
        if (!elements.has(id)) elements.set(id, element());
        return elements.get(id);
      } } };
    },
    resetChildren: node => { node.children = []; },
    runCriticalButtonOperation: async (label, button, loading, action) => action(),
  });
  return { open, writes, get: id => elements.get('#mm_airport_dns_' + id) };
}

test('cleared node DNS policy stays empty after save and reopen before applying', async () => {
  const h = airportDialogHarness(airportPolicy);
  await h.open();
  while (h.get('list').children.length) h.get('list').children[0].children[2].onclick();
  await h.get('save').onclick();
  assert.equal(h.writes[0].dns['proxy-server-nameserver-policy'], undefined);
  await h.open();
  assert.equal(h.get('list').children.length, 0);
});

test('deleting an edited node DNS entry clears its draft before saving', async () => {
  const h = airportDialogHarness(airportPolicy);
  await h.open();
  const row = h.get('list').children[0];
  row.children[1].onclick();
  row.children[2].onclick();
  assert.equal(h.get('domains').value, '');
  assert.equal(h.get('servers').value, '');
  await h.get('save').onclick();
  assert.equal(h.writes[0].dns['proxy-server-nameserver-policy']['node-a.example.com'], undefined);
  assert.deepEqual(h.writes[0].dns['proxy-server-nameserver-policy']['+.example.net'], airportPolicy['+.example.net']);
});

test('deleting another node DNS entry preserves the current edit', async () => {
  const h = airportDialogHarness(airportPolicy);
  await h.open();
  const [editing, other] = h.get('list').children;
  editing.children[1].onclick();
  other.children[2].onclick();
  assert.equal(h.get('domains').value, 'node-a.example.com');
  await h.get('save').onclick();
  assert.deepEqual(h.writes[0].dns['proxy-server-nameserver-policy'], { 'node-a.example.com': airportPolicy['node-a.example.com'] });
});

test('empty saved node DNS policy imports the running policy only on request', async () => {
  const h = airportDialogHarness();
  await h.open();
  assert.equal(h.get('list').children.length, 0);
  h.get('current').onclick();
  assert.equal(h.get('list').children.length, Object.keys(airportPolicy).length);
  await h.get('save').onclick();
  assert.deepEqual(h.writes[0].dns['proxy-server-nameserver-policy'], airportPolicy);
});

test('airport DNS edits preserve the rest of the template and survive runtime generation', () => {
  const api = airportApi();
  const before = plain(originalConfig);
  const next = plain(api.update(before, airportPolicy));
  assert.deepEqual(before, originalConfig);
  const expected = plain(originalConfig);
  expected.dns['proxy-server-nameserver-policy'] = airportPolicy;
  expected.dns['proxy-server-nameserver'] = ['223.5.5.5'];
  assert.deepEqual(next, expected);
  assert.deepEqual(plain(configApi.runtime(next).dns['proxy-server-nameserver-policy']), airportPolicy);
  const removed = plain(api.update(next, {}));
  assert.equal(removed.dns['proxy-server-nameserver-policy'], undefined);
  assert.deepEqual(removed.dns['proxy-server-nameserver'], next.dns['proxy-server-nameserver']);
});
test('airport DNS supplies required node resolver defaults only when missing', () => {
  const api = airportApi();
  const defaults = ['dns-default.example.com:5353'];
  assert.deepEqual(plain(api.update({ dns: { 'proxy-server-nameserver': defaults } }, airportPolicy).dns['proxy-server-nameserver']), defaults);
  assert.deepEqual(plain(api.update({}, airportPolicy).dns['proxy-server-nameserver']), ['223.5.5.5']);
});
test('airport DNS imports full configuration, named section and domain mapping', () => {
  const api = airportApi();
  for (const input of [airportPolicy, { 'proxy-server-nameserver-policy': airportPolicy }, { dns: { 'proxy-server-nameserver-policy': airportPolicy } }]) {
    assert.deepEqual(plain(api.extract(input)), airportPolicy);
  }
  for (const input of [{}, { dns: { enable: true } }, { 'https://example.com/sub?token=example': ['223.5.5.5'] }, { 'node.example.com': [] }, { 'node.example.com': [42] }]) {
    assert.throws(() => api.extract(input));
  }
});
test('airport DNS saves only the base template, preserving its generation marker', async () => {
  const writes = [];
  const fresh = { ...plain(originalConfig), 'log-level': 'warning' };
  const api = airportApi({
    runShellWithRoot: async () => ({ success: true, content: 'base' }),
    readYamlObject: async () => ({ ok: true, value: fresh }),
    yamlHasGeneratedMarker: async () => true,
    writeYamlObjectAtomic: async (...args) => { writes.push(args); return { ok: true }; },
  });
  assert.equal(await api.save(airportPolicy), true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0][0], '/data/clash/Tools/template.base.yaml');
  assert.equal(writes[0][1]['log-level'], 'warning');
  assert.equal(writes[0][2].marker, '# generated');
  assert.equal(writes[0][2].backup, true);
});
test('airport DNS does not write when reading the template fails', async () => {
  const api = airportApi({
    runShellWithRoot: async () => ({ success: false }),
    writeYamlObjectAtomic: async () => { throw new Error('must not write'); },
  });
  assert.equal(await api.save(airportPolicy), false);
});
test('airport DNS can create a base template from the current configuration', async () => {
  let saved = false;
  const api = airportApi({
    runShellWithRoot: async () => ({ success: true, content: 'runtime' }),
    readYamlObject: async path => {
      assert.equal(path, '/data/clash/Proxy/config.yaml');
      return { ok: true, value: plain(originalConfig) };
    },
    yamlHasGeneratedMarker: async () => false,
    writeYamlObjectAtomic: async path => {
      assert.equal(path, '/data/clash/Tools/template.base.yaml');
      saved = true; return { ok: true };
    },
  });
  assert.equal(await api.save(airportPolicy), true);
  assert.equal(saved, true);
});
test('airport DNS paste errors are readable and temporary files are cleaned', async () => {
  const calls = [];
  const api = airportApi({
    stageTextBesideTarget: async () => ({ ok: true, stagePath: '/data/clash/Tools/example.stage' }),
    readYamlObject: async () => ({ ok: false, message: 'parser internal details' }),
    runShellWithRoot: async command => { calls.push(command); return { success: true }; },
  });
  await assert.rejects(api.parse('invalid: ['), /请检查 YAML/);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /rm -f .*example\.stage/);
});

const downloadSources = [{ name: 'Provider1', url: 'https://example.com/sub' }];
for (const [statusCode, detail, expected] of [
  [302, 'dial tcp: i/o timeout', /重定向/],
  [403, 'dial tcp: i/o timeout', /拒绝访问/],
  [404, 'not found', /链接不存在/],
  [500, 'dial tcp: i/o timeout', /服务器暂时不可用/],
  [200, 'HTML is not a subscription', /内容无法识别/],
  [0, 'dial tcp: i/o timeout', /下载超时/],
]) test(`local subscription failure ${statusCode} has a readable message and cleans its request`, async () => {
  const cleaned = [];
  const download = vm.runInNewContext(slice('const formatSubscriptionDownloadError =', 'const mergeLocalConversionReloadResult =') + 'convertSubscriptionsLocally', {
    normalizeSubSourceList: value => value, validateLocalSubscriptionUrl: () => ({ ok: true }),
    ensureCompatBackend: async () => true, loadProviderUserAgent: async () => 'clash.meta',
    createRandomString: () => 'example', operationStage() {}, shellQuote: value => `'${value}'`,
    stageTextBesideTarget: async () => ({ ok: true, stagePath: '/data/request.stage' }),
    f50Command: async () => ({ success: false, content: 'F50_FETCH_RESULT=' + JSON.stringify({ ok: false, committed: false,
      providers: [{ name: 'Provider1', ok: false, statusCode, message: detail }] }) }),
    runShellWithRoot: async command => { cleaned.push(command); return { success: true }; },
    buildProviderUpdateResult: (providers, options) => ({ providers, ...options }),
  });
  const output = await download(downloadSources);
  assert.equal(output.ok, false);
  assert.equal(output.committed, false);
  assert.match(output.providers[0].message, expected);
  assert.doesNotMatch(output.message, /dial tcp|i\/o timeout|F50_ERROR/);
  assert.deepEqual(cleaned, ["rm -f '/data/request.stage'"]);
});
test('local subscription transport exceptions report an unconfirmed result', async () => {
  let cleaned = false;
  const download = vm.runInNewContext(slice('const formatSubscriptionDownloadError =', 'const mergeLocalConversionReloadResult =') + 'convertSubscriptionsLocally', {
    normalizeSubSourceList: value => value, validateLocalSubscriptionUrl: () => ({ ok: true }),
    ensureCompatBackend: async () => true, loadProviderUserAgent: async () => 'clash.meta',
    createRandomString: () => 'example', operationStage() {}, shellQuote: value => `'${value}'`,
    stageTextBesideTarget: async () => ({ ok: true, stagePath: '/data/request.stage' }),
    f50Command: async () => { throw new Error('Unexpected end of JSON input'); },
    runShellWithRoot: async () => { cleaned = true; return { success: true }; },
    buildProviderUpdateResult: (providers, options) => ({ providers, ...options }),
  });
  const output = await download(downloadSources);
  assert.equal(output.ok, false);
  assert.match(output.message, /无法确认.*检查设备连接/);
  assert.doesNotMatch(output.message, /JSON|未写入/);
  assert.equal(cleaned, true);
});

for (const mode of ['tproxy', 'tun', 'off']) {
  test(`original config retains custom settings in ${mode} mode`, () => {
    const original = plain(originalConfig);
    const result = plain(configApi.runtime(original, { traffic_mode: mode, ipv6: 'off' }, [], true));
    for (const key of ['log-level', 'sniffer', 'profile', 'unified-delay', 'tcp-concurrent', 'geodata-mode',
      'proxies', 'proxy-groups', 'rules', 'rule-providers']) assert.deepEqual(result[key], original[key], key);
    assert.deepEqual(result.dns.nameserver, original.dns.nameserver);
    assert.deepEqual(result.dns['nameserver-policy'], original.dns['nameserver-policy']);
    assert.deepEqual(result.dns['proxy-server-nameserver-policy'], original.dns['proxy-server-nameserver-policy']);
    assert.equal(result.dns['enhanced-mode'], 'fake-ip');
    assert.deepEqual([result.dns.enable, result.dns.listen, result.dns.ipv6], [true, '0.0.0.0:1053', true]);
    assert.equal(result.tun.enable, mode === 'tun');
    assert.equal(result['tproxy-port'], mode === 'tproxy' ? 7895 : 0);
    assert.equal(result['external-controller'], '0.0.0.0:7788');
    assert.equal(result.mode, original.mode);
    assert.equal(result['external-controller-tls'], undefined);
    assert.equal(result['interface-name'], undefined);
    assert.equal(result['routing-mark'], undefined);
    assert.deepEqual(original, originalConfig, 'input remains unchanged');
    const updated = { ...original, 'log-level': 'warning', sniffer: { enable: true } };
    assert.equal(configApi.runtime(updated, { traffic_mode: mode }, [], true)['log-level'], 'warning');
    assert.equal(configApi.runtime(updated, { traffic_mode: mode }, [], true).sniffer.enable, true);
  });
}

test('template mode keeps user tunables while capture fields stay fixed', () => {
  const result = configApi.runtime(originalConfig, { traffic_mode: 'tproxy', ipv6: 'off' });
  // 日志级别、嗅探、延迟统计不影响接管与校验，保留用户显式值。
  assert.equal(result['log-level'], 'debug');
  assert.equal(result.sniffer.enable, false);
  assert.equal(result['unified-delay'], false);
  assert.equal(result['rule-providers'].cn_domain.proxy, 'DIRECT');
  assert.deepEqual(plain(result.dns['proxy-server-nameserver-policy']), originalConfig.dns['proxy-server-nameserver-policy']);
  const updated = plain(originalConfig);
  updated.dns['proxy-server-nameserver-policy'] = { 'new.example.com': ['dns-new.example.com:1066'] };
  assert.deepEqual(plain(configApi.runtime(updated).dns['proxy-server-nameserver-policy']), updated.dns['proxy-server-nameserver-policy']);
  delete updated.dns['proxy-server-nameserver-policy'];
  assert.equal(configApi.runtime(updated).dns['proxy-server-nameserver-policy'], undefined);
});

test('original config keeps its own mode instead of forcing rule', () => {
  for (const mode of ['global', 'direct', 'Rule', undefined]) {
    const original = { ...originalConfig, mode };
    assert.equal(configApi.runtime(original, {}, [], true).mode, mode);
    assert.equal(original.mode, mode);
  }
});

test('policy reapplication synchronizes core mode and stops on API failure', async () => {
  for (const success of [true, false]) {
    const calls = [];
    const sandbox = {
      ensurePolicyToolsScript: async () => true,
      callMihomoApi: async (...args) => { calls.push(plain(args)); return { success, message: 'API failed' }; },
      runShellWithRoot: async () => { calls.push('policy'); return { success: true, content: 'POLICY_APPLY_OK' }; },
      shellQuote: (value) => value, CLASH_POLICY_SCRIPT: 'policy', activeCriticalOperation: {},
      sanitizeSubscriptionSecrets: (value) => value, safeTextToHtml: (value) => value,
      createToast() {},
    };
    const apply = vm.runInNewContext(`${slice('const reapplyPolicyRulesSilent = async', 'const readClientListText = async')} reapplyPolicyRulesSilent`, sandbox);
    assert.equal(await apply(), success);
    assert.deepEqual(calls, success ? [['/configs', 'PATCH', { mode: 'rule' }], 'policy'] : [['/configs', 'PATCH', { mode: 'rule' }]]);
    if (!success) assert.match(sandbox.activeCriticalOperation.failure, /API failed/);
  }
});

test('panel guard detects runtime delay settings that differ from the saved config', async () => {
  for (const [saved, live, running, expected] of [
    [true, false, true, false], [true, true, true, true],
    [false, false, true, true], [false, true, true, false],
    [true, false, false, true],
  ]) {
    const sandbox = {
      CLASH_CONFIG: 'config.yaml', CLASH_DIR: '/data/clash', CLASH_PROXY_DIR: '/data/clash/Proxy',
      CLASH_CONFIG_SOURCE_FILE: 'source.conf', ZASHBOARD_UI_DIR: 'WebUI/zashboard', ZASHBOARD_UI_URL: 'https://example.com/ui.zip',
      buildF50ZashboardValidationFunction: () => '', shellQuote: (value) => value,
      hostRunShellWithRoot: async () => ({ success: true, content: `F50_ZASHBOARD_GUARD_OK=1\nF50_UNIFIED_DELAY=${saved}\n` }),
      getCorePid: async () => running ? '1234' : '',
      callMihomoApi: async () => {
        assert.ok(running, 'stopped core does not require an API probe');
        return { success: true, responseText: JSON.stringify({ 'unified-delay': live }) };
      },
    };
    const probe = vm.runInNewContext(`${slice('const probeZashboardGuard = async', 'let zashboardGuardPromise')} probeZashboardGuard`, sandbox);
    assert.equal(await probe(), expected);
  }
});

test('switching original config from IPv6 TUN to IPv4 keeps DNS settings and clears IPv6 TUN addresses', () => {
  const v6 = configApi.runtime(originalConfig, { traffic_mode: 'tun', ipv6: 'on' }, [], true);
  assert.equal(v6.dns.ipv6, true);
  assert.equal(v6.dns.listen, '[::]:1053');
  assert.ok(v6.tun['inet6-address']);
  const v4 = configApi.runtime(v6, { traffic_mode: 'tun', ipv6: 'off' }, [], true);
  assert.equal(v4.tun['inet6-address'], undefined);
  assert.deepEqual(plain(v4.dns.nameserver), originalConfig.dns.nameserver);
});

test('first original config write and later network changes select preservation', async () => {
  const calls = [];
  const sandbox = {
    KPR: { fromOptions: () => ({ enabled: false }), runtime: (...args) => { calls.push(args); return args[0]; } },
    kprReadOptions: async () => ({ traffic_mode: 'tproxy' }),
    verifyF50TunStack: async () => 'mips',
    readConfigSource: async () => 'subscription_original',
    ensureOriginalSubscriptionService: async () => true,
    CLASH_CONFIG: 'config.yaml',
    kprBaseWriteYamlObjectAtomic: async (target, value) => ({ ok: true, value }),
  };
  vm.runInNewContext(`${slice('async function kprShapeRuntimeConfig', 'async function savePolicyState')}
    this.write = writeYamlObjectAtomic; this.shape = kprShapeRuntimeConfig;`, sandbox);
  await sandbox.write('config.yaml', originalConfig, { configSource: 'subscription_original' });
  const options = { traffic_mode: 'tun', tun_stack: 'auto' };
  await sandbox.shape(originalConfig, options);
  await sandbox.write('config.yaml', originalConfig, { configSource: 'template.yaml' });
  assert.deepEqual(calls.map((args) => args[3]), [true, true, false]);
  assert.deepEqual(calls.map((args) => args[4]), [{ enabled: false }, { enabled: false }, { enabled: false }]);
  assert.equal(calls[1][1].tun_stack, 'mips');
  assert.equal(options.tun_stack, 'auto');
});

const yq = process.env.F50_TEST_YQ;
const uniqueYamlKeys = '[.. | select(tag == "!!map") | ((keys | length) == (keys | unique | length))] | all';
test('YAML validation rejects duplicate mapping keys', { skip: !yq }, () => {
  for (const input of ['allow-lan: true\nallow-lan: false\n', 'dns:\n  enable: true\n  enable: false\n']) {
    const result = spawnSync(yq, ['eval', '-e', uniqueYamlKeys, '-'], { input, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
  }
});
test('restored config validation failures include the core reason in diagnostics', () => {
  const diagnostic = vm.runInNewContext(`${slice('const F50_DIAGNOSTIC_LABELS', 'function f50Error')}\nf50Diagnostic`, {
    sanitizeSubscriptionSecrets: (value) => String(value),
  });
  const markers = 'F50_ERROR=original_config_invalid\nSTART_SERVICE_RC=0\nF50_START_CODE=service_failed\nF50_START_OK=0';
  assert.match(diagnostic(markers).summary, /用户配置恢复后未通过核心校验/);
  const detailed = diagnostic(markers + '\nF50_CONFIG_TEST_DETAIL=level=info msg="Initial configuration"\nF50_CONFIG_TEST_DETAIL=level=error msg="Parse config error: invalid DNS server"');
  assert.match(detailed.summary, /invalid DNS server/);
  assert.ok(!detailed.summary.includes('Initial configuration'));
});
test('service preserves original YAML after controller preparation and reloads it', { skip: !yq }, async () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-original-config-'));
  const root = path.join(work, 'clash');
  const shellPath = (value) => value.replace(/\\/g, '/').replace(/^([A-Za-z]):\//, (_, drive) => `/${drive.toLowerCase()}/`);
  const quote = (value) => `'${value.replace(/'/g, `'"'"'`)}'`;
  const run = (args, extraEnv = {}) => spawnSync('sh', args[0] === '-c' ? ['-s', '--', ...args.slice(3)] : args, {
    input: args[0] === '-c' ? args[1] : undefined, encoding: 'utf8',
    env: { ...process.env, CLASH_ROOT: shellPath(root), F50_OPERATION_LOCK: shellPath(path.join(work, 'operation.lock')),
      F50_TASK_DIR: shellPath(path.join(work, 'tasks')), ...extraEnv } });
  const write = (relative, content) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return file;
  };
  try {
    const archive = spawnSync('tar', ['-xOf', path.join(__dirname, '..', '..', 'tproxy-yq.zip'), 'Scripts/Clash.Service'], { encoding: 'utf8' });
    assert.equal(archive.status, 0, archive.stderr);
    const functions = configApi.functions();
    const packaged = archive.stdout.replace(/\r\n/g, '\n');
    const functionsStart = packaged.indexOf('# KANO_ORIGINAL_CONFIG_PRESERVATION=');
    const functionsEnd = packaged.indexOf('f50_check_mips_version() {', functionsStart);
    assert.ok(functionsStart >= 0 && functionsEnd > functionsStart, 'package contains preservation functions');
    const packageFunctions = packaged.slice(functionsStart, functionsEnd);
    const originalWrapper = packaged.replace(packageFunctions, '')
      .replace('f50_save_original_config "$action" || exit 1\n', '')
      .replace('f50_restore_original_config || exit 1\n', '')
      .replace('  start|restart|boot)', '  start|restart)')
      .replace('  "$yq" eval -P -o=yaml -I=2 ', '  "$yq" eval ')
      .replace(/    \(select\(strenv\(F50_CONFIG_SOURCE\).*\n/, '    ."unified-delay" = true |\n');
    const service = write('Scripts/Clash.Service', originalWrapper);
    const installer = vm.runInNewContext(`${slice('const F50_ORIGINAL_MANAGED_KEYS', 'let f50BackendReady')}
      ${slice('function buildF50NetworkCompatHelpers()', 'function buildF50InspectHelpers()')}
      ensureOriginalSubscriptionService`, {
      PROFILE_DELTA: configApi.delta,
      F50_MIPS_MIN_VERSION: '1.19.31',
      F50_ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
      CLASH_SERVICE: shellPath(service), shellQuote: quote,
      runShellWithRoot: async (script) => { const result = run(['-c', script]);
        assert.equal(result.status, 0, result.stdout + result.stderr); return { success: true }; },
    });
    assert.equal(await installer(), true);
    const installed = fs.readFileSync(service, 'utf8');
    const stripHelpers = (text, block) => text.replace(block, '').replace(/\n{2,}/g, '\n');
    // DNS 兼容段在安装时会被整体升级并改写 controller 调用，比较周边时两边都先归一化。
    const stripDnsCompat = (text) => text
      .replace(/^f50_disable_unsupported_ipv6_dns_hijack\(\) \{[\s\S]*?^# KANO_IPV6_DNS_SPLIT=\d+$/gm, '')
      .replace(/f50_run_controller "\$@"/g, '"$binary" "$@"')
      .replace(/\n{2,}/g, '\n');
    // TUN 兼容段同理：安装时整段替换（含新增的状态读取函数与阶段错误码）。
    const stripTunCompat = (text) => text
      .replace(/^f50_(?:load_tun_state|check_mips_version)\(\) \{[\s\S]*?^# KANO_TUN_IPV6_RETURN=\d+$/gm, '')
      .replace(/^# KANO_TUN_(?:STACK_COMPAT|AUTO_MIPS|IPV6_RETURN)=\d+$/gm, '')
      .replace(/\n{2,}/g, '\n');
    const normalize = (text, block) => stripTunCompat(stripDnsCompat(stripHelpers(text, block)));
    assert.ok(installed.includes(functions), 'installed preservation helpers match the source');
    assert.equal(normalize(installed, functions), normalize(packaged, packageFunctions), 'all surrounding service functions and calls remain intact');
    assert.equal(await installer(), true);
    assert.equal(fs.readFileSync(service, 'utf8'), installed, 'installation is idempotent');
    const currentVersion = (functions.match(/KANO_ORIGINAL_CONFIG_PRESERVATION=(\d+)/) || [])[1];
    write('Scripts/Clash.Service', installed.replace(`KANO_ORIGINAL_CONFIG_PRESERVATION=${currentVersion}`, 'KANO_ORIGINAL_CONFIG_PRESERVATION=11')
      .replace('KANO_PANEL_WRITE_GUARD=2', 'KANO_PANEL_WRITE_GUARD=1')
      .replace('    if [ "${F50_CONFIG_RELOAD_REQUIRED:-0}" != 1 ]; then echo F50_PANEL_CONFIG_UNCHANGED=1; return 0; fi\n', '')
      .replace('  F50_CONFIG_RELOAD_REQUIRED=0\n  echo F50_PANEL_CONFIG_RELOADED=1', '  echo F50_PANEL_CONFIG_RELOADED=1'));
    assert.equal(await installer(), true);
    assert.equal(fs.readFileSync(service, 'utf8'), installed.replace('  echo F50_PANEL_CONFIG_RELOADED=1',
      '  F50_CONFIG_RELOAD_REQUIRED=0\n  echo F50_PANEL_CONFIG_RELOADED=1'), 'version 11 panel guard upgrades without duplication');
    for (let version = 1; version < Number(currentVersion); version++) {
      write('Scripts/Clash.Service', installed.replace(`KANO_ORIGINAL_CONFIG_PRESERVATION=${currentVersion}`, `KANO_ORIGINAL_CONFIG_PRESERVATION=${version}`)
        .replace('  start|restart|boot)', '  start|restart)')
        .replace('original_config_merge_failed', 'old_original_config_merge_failed')
        .replace('  "$yq" eval -P -o=yaml -I=2 ', '  "$yq" eval '));
      assert.equal(await installer(), true);
      assert.equal(fs.readFileSync(service, 'utf8'), installed, 'old preservation functions and hooks are replaced without duplication');
    }
    assert.equal(run(['-n', service]).status, 0);
    // Map the device curl path to the fixture; boot cannot rely on the browser's PATH.
    write('Scripts/Clash.Service', installed.replace('/data/data/com.minikano.f50_sms/files/curl', shellPath(path.join(root, 'bin/curl'))));
    write('Tools/yq_linux_arm64', `#!/bin/sh\nexec ${quote(shellPath(yq))} "$@"\n`);
    write('Proxy/Clash.Core', `#!/bin/sh\nif [ "\${FAIL_VALIDATE:-0}" != 0 ]; then
  printf '%s\\n' 'level=error msg="Parse config error: invalid DNS server"' 'https://example.com/private?key=test-secret' 'password=test-password' 'uuid=test-uuid' 'private-key=test-private-key' >&2
fi
[ "\${FAIL_VALIDATE:-0}" = 0 ] || exit "$FAIL_VALIDATE"
while [ "$#" -gt 0 ]; do
  case "$1" in -f) shift; config=$1 ;; esac
  shift
done
"$CLASH_ROOT/Tools/yq_linux_arm64" eval -e ${quote(uniqueYamlKeys)} "$config" >/dev/null || { echo 'yaml: duplicate mapping key' >&2; exit 1; }
`);
    write('Scripts/clashctl', '#!/bin/sh\ncp "$CLASH_ROOT/fixed.json" "$CLASH_ROOT/Proxy/config.yaml"\nexit "${FAIL_CONTROLLER:-0}"\n');
    write('bin/curl', '#!/bin/sh\n[ "$1" != --version ] || exit 0\nprintf "%s\\n" "$@" > "$CLASH_ROOT/reload.args"\nif [ "${FAIL_RELOAD:-0}" != 0 ]; then printf 000; exit "$FAIL_RELOAD"; fi\ncp "$CLASH_ROOT/Proxy/config.yaml" "$CLASH_ROOT/reloaded.json"\nprintf 204\n');
    write('Proxy/WebUI/zashboard/index.html', '<title>zashboard</title>');
    write('Proxy/WebUI/zashboard/manifest.webmanifest', '{}');
    write('Proxy/WebUI/zashboard/registerSW.js', 'void 0');
    fs.mkdirSync(path.join(root, 'Proxy/WebUI/zashboard/assets'));
    write('fixed.json', JSON.stringify(plain(configApi.profiles.tproxy4)));
    const chmod = run(['-c', 'chmod +x "$CLASH_ROOT/Tools/yq_linux_arm64" "$CLASH_ROOT/Proxy/Clash.Core" "$CLASH_ROOT/Scripts/clashctl" "$CLASH_ROOT/bin/curl"']);
    assert.equal(chmod.status, 0, chmod.stderr);
    const env = { PATH: `${path.join(root, 'bin')}${path.delimiter}${process.env.PATH}` };
    for (const action of ['prepare', 'start', 'restart', 'boot']) {
      write('Tools/config_source.conf', 'KANO_CONFIG_SOURCE=subscription_original\n');
      write('Proxy/config.yaml', JSON.stringify(originalConfig));
      fs.rmSync(path.join(root, 'reloaded.json'), { force: true });
      const result = run([service, action], env);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const parsed = spawnSync(yq, ['-o=json', '.', path.join(root, 'Proxy/config.yaml')], { encoding: 'utf8' });
      assert.equal(parsed.status, 0, parsed.stderr);
      const config = JSON.parse(parsed.stdout);
      const text = fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8');
      assert.match(text, /^log-level: debug$/m);
      assert.match(text, /^dns:\r?\n/m);
      assert.match(text, /^\s+- https:\/\/example.com\/dns-query$/m);
      assert.deepEqual(config['x-format-test'], originalConfig['x-format-test'], 'formatting preserves scalar types');
      assert.equal(config['log-level'], 'debug');
      assert.equal(config.mode, originalConfig.mode, 'user mode survives Service restore');
      assert.equal(config.sniffer.enable, false);
      assert.equal(config['unified-delay'], false);
      assert.equal(config['interface-name'], undefined);
      assert.equal(config['routing-mark'], undefined);
      assert.deepEqual(config.dns.nameserver, originalConfig.dns.nameserver);
      assert.deepEqual(config.dns['proxy-server-nameserver-policy'], originalConfig.dns['proxy-server-nameserver-policy']);
      assert.equal(config.dns.listen, '0.0.0.0:1053');
      assert.deepEqual(config['rule-providers'], originalConfig['rule-providers']);
      if (action !== 'prepare') {
        assert.equal(fs.readFileSync(path.join(root, 'reloaded.json'), 'utf8'),
          fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), 'core reload uses preserved config');
        assert.equal(fs.readFileSync(path.join(work, 'kano_clash_start.log'), 'utf8'),
          result.stdout.replace(/^F50_LEASE_(ACQUIRED|RELEASED)=1\r?\n/gm, ''), 'manual and boot service output persists');
        const reloadArgs = fs.readFileSync(path.join(root, 'reload.args'), 'utf8').trim().split(/\r?\n/);
        assert.equal(reloadArgs[reloadArgs.indexOf('--noproxy') + 1], '*', 'local reload bypasses environment proxies');
      }
    }
    const gistConfig = plain(configApi.runtime({
      ...plain(configApi.profiles.tproxy4),
      'x-f50-gist-sync': true,
      'x-f50-gist-manual-providers': ['Manual'],
      'x-f50-provider-sources': { Gist: 'https://example.com/gist-provider.yaml' },
      'proxy-providers': {
        Gist: { type: 'http', url: 'https://example.com/gist-provider.yaml', path: './proxies/Gist.yaml' },
        Manual: { type: 'http', url: 'https://example.com/manual-provider.yaml', path: './proxies/Manual.yaml' },
      },
    }));
    for (const action of ['prepare', 'start', 'restart', 'boot']) {
      write('Tools/config_source.conf', 'KANO_CONFIG_SOURCE=uploaded_config\n');
      write('Proxy/config.yaml', JSON.stringify(gistConfig));
      const result = run([service, action], env);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const parsed = spawnSync(yq, ['-o=json', '.', path.join(root, 'Proxy/config.yaml')], { encoding: 'utf8' });
      assert.equal(parsed.status, 0, parsed.stderr);
      assert.deepEqual(JSON.parse(parsed.stdout), gistConfig, action + ': Gist fingerprint input survives controller preparation');
    }
    write('Tools/config_source.conf', 'KANO_CONFIG_SOURCE=template.yaml\n');
    write('Proxy/config.yaml', JSON.stringify(plain(configApi.profiles.tproxy4)));
    fs.rmSync(path.join(root, 'reloaded.json'), { force: true });
    const formattingOnly = run([service, 'restart'], env);
    assert.equal(formattingOnly.status, 0, formattingOnly.stdout + formattingOnly.stderr);
    assert.match(formattingOnly.stdout, /F50_PANEL_CONFIG_UNCHANGED=1/);
    assert.ok(!fs.existsSync(path.join(root, 'reloaded.json')), 'JSON to YAML formatting alone does not require a reload');
    if (configApi.panelCheck) {
      write('Proxy/config.yaml', JSON.stringify(configApi.profiles.tproxy4));
      const configFile = path.join(root, 'Proxy/config.yaml');
      const beforePanel = fs.statSync(configFile);
      fs.rmSync(path.join(root, 'reloaded.json'), { force: true });
      const fixtureService = fs.readFileSync(service, 'utf8');
      const panelFunction = fixtureService.slice(fixtureService.indexOf('# KANO_CURL_ABSOLUTE=1'), fixtureService.indexOf('disable_unsupported_ipv6_dns_hijack() {'));
      const configFunctions = functions.slice(0, functions.indexOf('umask 077\nF50_OPERATION_LOCK='));
      const checkPanel = (extraEnv = {}) => run(['-c', configFunctions + panelFunction + '\nrepair_panel_config && repair_panel_config\n'],
        { ...env, F50_CONFIG_SOURCE: 'template.yaml', ...extraEnv });
      const unchangedPanel = checkPanel();
      assert.equal(unchangedPanel.status, 0, unchangedPanel.stderr + unchangedPanel.stdout);
      assert.equal(fs.statSync(configFile).ino, beforePanel.ino);
      assert.equal(fs.statSync(configFile).mtimeMs, beforePanel.mtimeMs, 'matching native panel config is not rewritten');
      assert.ok(!fs.existsSync(path.join(root, 'reloaded.json')), 'unchanged config does not trigger a forced reload');
      assert.match(unchangedPanel.stdout, /F50_PANEL_CONFIG_UNCHANGED=1/);
      const invalidPanel = checkPanel({ FAIL_VALIDATE: '1' });
      assert.equal(invalidPanel.status, 1, 'core validation is still required for unchanged panel fields');
      assert.match(invalidPanel.stdout, /F50_ERROR=panel_config_invalid/);
      const reloadFailure = checkPanel({ F50_CONFIG_RELOAD_REQUIRED: '1', FAIL_RELOAD: '28' });
      assert.equal(reloadFailure.status, 1, 'a required reload timeout still fails');
      assert.match(reloadFailure.stdout, /F50_ERROR=panel_config_reload_failed:http_000:curl_28/);
    }
    write('Tools/config_source.conf', 'KANO_CONFIG_SOURCE=subscription_original\n');
    const remoteUrl = 'https://example.com/nodes.yaml';
    const converted = { ...plain(configApi.profiles.tproxy4),
      'proxy-providers': { Remote: { type: 'file', path: './proxies/Remote.yaml' } },
      'x-f50-provider-sources': { Remote: remoteUrl },
    };
    write('fixed.json', JSON.stringify(converted));
    write('Proxy/config.yaml', JSON.stringify({ ...originalConfig,
      'proxy-providers': { Remote: { type: 'http', url: remoteUrl, path: './old.yaml' } },
      'x-f50-provider-sources': { Removed: 'https://example.com/removed.yaml' },
    }));
    const providerRun = run([service, 'restart'], env);
    assert.equal(providerRun.status, 0, providerRun.stdout + providerRun.stderr);
    const providerRead = spawnSync(yq, ['-o=json', '.', path.join(root, 'Proxy/config.yaml')], { encoding: 'utf8' });
    assert.equal(providerRead.status, 0, providerRead.stderr);
    const providerConfig = JSON.parse(providerRead.stdout);
    assert.deepEqual(providerConfig['proxy-providers'], converted['proxy-providers'], 'converted file providers keep their current type and cache path');
    assert.deepEqual(providerConfig['x-f50-provider-sources'], converted['x-f50-provider-sources'], 'remote metadata is replaced without retaining removed sources');
    assert.deepEqual(providerConfig.dns.nameserver, originalConfig.dns.nameserver);
    assert.equal(providerConfig['log-level'], 'debug');
    if (source.includes('F50_PRESERVE_HTTP_PROVIDER')) {
      write('Tools/config_source.conf', 'KANO_CONFIG_SOURCE=template.yaml\n');
      write('Proxy/subscription_urls.txt', '# KANO_SUB_CONVERT_MODE=provider\n');
      const httpProviders = { Remote: { type: 'http', url: remoteUrl, path: './proxies/Remote.yaml', header: { 'User-Agent': ['custom-agent'] } } };
      for (const action of ['prepare', 'start', 'restart', 'boot']) {
        write('Proxy/config.yaml', JSON.stringify({ ...plain(configApi.profiles.tproxy4), 'proxy-providers': httpProviders }));
        const httpRun = run([service, action], env);
        assert.equal(httpRun.status, 0, httpRun.stdout + httpRun.stderr);
        const parsed = spawnSync(yq, ['-o=json', '.', path.join(root, 'Proxy/config.yaml')], { encoding: 'utf8' });
        assert.equal(parsed.status, 0, parsed.stderr);
        const httpConfig = JSON.parse(parsed.stdout);
        assert.deepEqual(httpConfig['proxy-providers'], httpProviders, action + ': saved HTTP mode survives controller preparation');
        assert.equal(httpConfig['x-f50-provider-sources'], undefined);
        if (action !== 'prepare') assert.equal(fs.readFileSync(path.join(root, 'reloaded.json'), 'utf8'), fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'));
      }
      write('Tools/config_source.conf', 'KANO_CONFIG_SOURCE=subscription_original\n');
      fs.rmSync(path.join(root, 'Proxy/subscription_urls.txt'));
    }
    for (const action of ['prepare', 'boot']) for (const failure of ['FAIL_BACKUP', 'FAIL_VALIDATE', 'FAIL_CONTROLLER']) {
      const before = JSON.stringify(originalConfig);
      write('Proxy/config.yaml', before);
      const result = failure === 'FAIL_BACKUP'
        ? run(['-c', 'cp() { printf partial > "$2"; return 1; }; . "$1" "$2"', 'sh', shellPath(service), action], env)
        : run([service, action], { ...env, [failure]: '1' });
      assert.notEqual(result.status, 0, failure);
      assert.equal(fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), before);
      if (failure === 'FAIL_VALIDATE') {
        assert.match(result.stdout, /^F50_ERROR=original_config_invalid$/m);
        assert.match(result.stdout, /^F50_CONFIG_TEST_DETAIL=.*Parse config error: invalid DNS server/m);
        assert.match(result.stdout, /F50_CONFIG_TEST_DETAIL=\[URL_REDACTED\]/);
        assert.match(result.stdout, /F50_CONFIG_TEST_DETAIL=\[SENSITIVE_ERROR_REDACTED\]/);
        assert.ok(!/test-secret|test-password|test-uuid|test-private-key|https:\/\/example.com\/private/.test(result.stdout));
        if (action !== 'prepare') assert.equal(fs.readFileSync(path.join(work, 'kano_clash_start.log'), 'utf8'),
          result.stdout.replace(/^F50_LEASE_(ACQUIRED|RELEASED)=1\r?\n/gm, ''), 'failed starts persist only redacted output');
      }
    }
    write('Tools/config_source.conf', 'KANO_CONFIG_SOURCE=template.yaml\n');
    for (const action of ['prepare', 'start', 'restart', 'boot']) {
      write('Proxy/config.yaml', `dns:\n  proxy-server-nameserver-policy:\n    cdn-hk.example.com: &airport_dns\n      - dns-hk.example.com:1066\n      - dns-jp.example.com:1066\n      - https://dns-jp.example.com/dns-query\n    cdn-jp.example.com: *airport_dns\n`);
      fs.rmSync(path.join(root, 'reloaded.json'), { force: true });
      const result = run([service, action], env);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const templateRead = spawnSync(yq, ['-o=json', '.', path.join(root, 'Proxy/config.yaml')], { encoding: 'utf8' });
      assert.equal(templateRead.status, 0, templateRead.stderr);
      const config = JSON.parse(templateRead.stdout);
      assert.equal(config['log-level'], 'info');
      assert.equal(config.dns['enhanced-mode'], 'redir-host');
      assert.deepEqual(config.dns['proxy-server-nameserver-policy'], originalConfig.dns['proxy-server-nameserver-policy']);
      assert.match(fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), /^log-level: info$/m);
      if (action !== 'prepare') assert.equal(fs.readFileSync(path.join(root, 'reloaded.json'), 'utf8'),
        fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), 'core reload retains node DNS policies');
    }
    // 控制器会整份重建配置；模板/生成模式也必须按与 JS 整形相同的受控边界保留用户自定义项。
    const rebuilt = plain(configApi.profiles.tproxy4);
    write('Proxy/config.yaml', JSON.stringify({ ...rebuilt,
      'log-level': 'debug', sniffer: { enable: false }, profile: { 'store-selected': false },
      'unified-delay': false, 'tcp-concurrent': true, 'mixed-port': 7899,
      dns: { ...rebuilt.dns, nameserver: ['https://example.com/dns-query'] } }));
    const userRun = run([service, 'start'], env);
    assert.equal(userRun.status, 0, userRun.stdout + userRun.stderr);
    const userRead = spawnSync(yq, ['-o=json', '.', path.join(root, 'Proxy/config.yaml')], { encoding: 'utf8' });
    assert.equal(userRead.status, 0, userRead.stderr);
    const userConfig = JSON.parse(userRead.stdout);
    assert.equal(userConfig['log-level'], 'debug', 'custom log level survives controller rebuild');
    assert.equal(userConfig.sniffer.enable, false, 'custom sniffer survives controller rebuild');
    assert.equal(userConfig.profile['store-selected'], false);
    assert.equal(userConfig['unified-delay'], false);
    assert.equal(userConfig['tcp-concurrent'], true);
    assert.equal(userConfig['mixed-port'], 7899, 'custom local proxy port survives controller rebuild');
    assert.deepEqual(userConfig.dns.nameserver, ['https://example.com/dns-query']);
    assert.equal(userConfig.dns.listen, rebuilt.dns.listen, 'controlled dns keys stay managed by the profile');
    assert.deepEqual(userConfig['proxy-groups'], rebuilt['proxy-groups'], 'generated groups are not overwritten by the pre-rebuild copy');
    assert.ok(!fs.readdirSync(path.join(root, 'Proxy')).some((name) => name.includes('.original.')));
    // 手改出的非 map 值不能让合并直接把启动打死：按空表处理，用控制器生成的值兜底。
    write('Tools/config_source.conf', 'KANO_CONFIG_SOURCE=template.yaml\n');
    write('Proxy/config.yaml', 'sniffer: on\nprofile:\n  - a\n  - b\ndns: not-a-map\nlog-level: warning\n');
    const malformed = run([service, 'start'], env);
    assert.equal(malformed.status, 0, malformed.stdout + malformed.stderr);
    const malformedRead = spawnSync(yq, ['-o=json', '.', path.join(root, 'Proxy/config.yaml')], { encoding: 'utf8' });
    assert.equal(malformedRead.status, 0, malformedRead.stderr);
    const malformedConfig = JSON.parse(malformedRead.stdout);
    assert.equal(malformedConfig['log-level'], 'warning', 'scalar keys are still restored');
    assert.equal(typeof malformedConfig.sniffer, 'object', 'a scalar sniffer falls back to the generated value');
    assert.equal(malformedConfig.sniffer.enable, rebuilt.sniffer.enable);
    assert.ok(!Array.isArray(malformedConfig.profile), 'a sequence profile falls back to the generated value');
    assert.equal(malformedConfig.profile['store-selected'], rebuilt.profile['store-selected']);
    assert.equal(malformedConfig.dns.listen, rebuilt.dns.listen, 'a scalar dns falls back to the generated value');
    assert.ok(!fs.readdirSync(path.join(root, 'Proxy')).some((name) => name.includes('.original.')));
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
});
