'use strict';

const test = require('node:test');
const { fs, path, assert, slice, run, shell, subContext, subscriptionApi, plain, quote, temp, write } = require('./optimization_harness');
const sources = [{ url: 'https://one.example/sub', name: 'Provider1' }, { url: 'https://two.example/sub', name: 'Provider2' }];
const result = (failed = false) => ({ ok: !failed, failed: failed ? 1 : 0,
  providers: sources.map(s => ({ name: s.name, ok: !failed, message: failed ? 'failed' : '', proxyCount: failed ? 0 : 2 })) });

for (const mode of ['provider', 'local']) {
  for (const ready of [true, false]) {
    test(`${mode} update, runtime matches=${ready}`, async () => {
      const calls = [];
      const update = subscriptionApi(slice('const updateSubProviders = async', 'const readCurrentSubSources = async') + 'updateSubProviders', {
        ensureCompatBackend: async () => true, readConfigSource: async () => 'template.yaml',
        readYamlObject: async () => ({ ok: true, value: { 'proxy-providers': Object.fromEntries(sources.map(s => [s.name, { type: ready ? (mode === 'local' ? 'file' : 'http') : (mode === 'local' ? 'http' : 'file') }])) } }),
        readCurrentSubSources: async () => sources,
        saveSubSources: async (...args) => { calls.push(['save', ...args]); return true; },
        forceUpdateProvidersFromConfig: async () => { calls.push(['http']); return result(); },
        convertSubscriptionsLocally: async () => { calls.push(['convert']); return result(); },
        reloadLocalSubscriptionProviders: async () => { calls.push(['reload']); return result(); },
        providerUpdateNeedsLocalFallback: () => false,
        showSubscriptionUpdateSelfCheck: async () => true, getCorePid: async () => '123',
      });
      assert.equal(await update(sources, 'template', mode), true);
      if (!ready) assert.equal(calls[0][3], mode, 'rebuild passes selected mode');
      else assert.deepEqual(calls.map(c => c[0]), mode === 'provider' ? ['http'] : ['convert', 'reload']);
    });
  }
}

for (const configSource of ['uploaded_config', 'subscription_original']) {
  test(configSource + ' retains its dedicated update path', async () => {
    let method;
    const update = subscriptionApi(slice('const updateSubProviders = async', 'const readCurrentSubSources = async') + 'updateSubProviders', {
      ensureCompatBackend: async () => true, readConfigSource: async () => configSource,
      readCurrentSubSources: async () => sources.slice(0, 1),
      forceUpdateProvidersFromConfig: async () => { method = 'refresh-custom'; return result(); },
      saveSubSources: async (...args) => { method = args[1]; return true; },
    });
    assert.equal(await update(sources.slice(0, 1), 'template', 'provider'), true);
    assert.equal(method, configSource === 'uploaded_config' ? 'refresh-custom' : 'original');
  });
}

for (const status of [200, 390, 500]) {
  test(`Mihomo HTTP Provider API status ${status}`, async () => {
    const calls = [];
    const refresh = run(slice('const forceUpdateProvidersFromConfig', 'const convertSubscriptionsLocally') + 'forceUpdateProvidersFromConfig', {
      ...subContext, buildControllerInfo: async () => ({}), getCorePid: async () => '123',
      mapWithConcurrency: async (items, limit, worker) => { assert.equal(limit, 2); return Promise.all(items.map(worker)); },
      buildProviderUpdateResult: (providers, meta) => ({ providers, failed: providers.filter(p => !p.ok).length, ...meta }),
      callMihomoApi: async (url, method) => {
        calls.push([url, method]);
        return { success: status === 200, statusCode: status, responseText: status === 200 ? '{"proxies":[{"name":"Node"}]}' : `{"message":"HTTP ${status}"}` };
      },
    });
    const updated = await refresh({ config: { 'proxy-providers': { Provider1: { type: 'http' } } } });
    assert.equal(updated.failed, status === 200 ? 0 : 1);
    assert.equal(updated.via, 'http');
    assert.equal(calls[0][1], 'PUT');
    if (status === 200) assert.equal(calls[1][1], 'GET');
    if (status === 390) assert.equal(updated.providers[0].errorType, 'upstream_390');
  });
}

function saveCase({ failAt = '', running = true, fallback = false, disabled = false, custom = false, ruleMode = 'template', convertMode = 'local' } = {}) {
  const dir = temp();
  const constants = { CLASH_DIR: dir, CLASH_PROXY_DIR: path.join(dir, 'Proxy'), CLASH_POLICY_DIR: path.join(dir, 'Policy') };
  for (const [key, file] of Object.entries({ CLASH_CONFIG: 'Proxy/config.yaml', CLASH_SUB_URLS: 'Proxy/subscription_urls.txt',
    CLASH_SUB_RULE_MODE_FILE: 'Tools/sub_rule_mode.conf', CLASH_POLICY_OPTIONS_FILE: 'Policy/options.conf',
    CLASH_CONFIG_SOURCE_FILE: 'Tools/config_source.conf', CLASH_TEMPLATE: 'Tools/template.yaml',
    CLASH_TEMPLATE_BASE: 'Tools/template.base.yaml', CLASH_RULE_OVERRIDE_APPLIED_JSON: 'Tools/rule_override_applied.json' })) {
    constants[key] = write(dir, file, key === 'CLASH_SUB_URLS' ? '# KANO_SUB_RULE_MODE=template\n# KANO_SUB_CONVERT_MODE=provider\nhttps://one.example/sub Provider1\n' : 'old:' + key);
  }
  for (const s of sources) write(dir, 'Proxy/proxies/' + s.name + '.yaml', 'old cache:' + s.name);
  const before = Object.fromEntries(Object.values(constants).filter(f => fs.statSync(f).isFile()).map(f => [f, fs.readFileSync(f, 'utf8')]));
  for (const s of sources) before[path.join(dir, 'Proxy/proxies/' + s.name + '.yaml')] = 'old cache:' + s.name;
  let restarts = 0, configWrites = 0;
  const stored = (ruleMode === 'original' ? sources.slice(0, 1) : sources).map(s => ({ ...s, enabled: !disabled }));
  const extra = slice('function validateSubscriptionMode', 'function buildF50CleanupScript')
    + slice('const fileSnapshotHelpersCmd', 'const setConfigSourceCmd')
    + slice('const switchHttpProviderToLocal', 'const readLegacySubscriptionSources')
    + slice('const saveSubSources = async', 'const overwriteConfigByTemplate')
    + '({saveSubSources,switchHttpProviderToLocal})';
  const api = subscriptionApi(extra, {
    ...constants, activeCriticalOperation: null, createRandomString: () => 'fixture',
    validateLocalSubscriptionUrl: () => ({ ok: true }), showSuspiciousSubSourcesError: () => false,
    readCurrentSubSources: async () => stored, readConfigSource: async () => custom ? 'uploaded_config' : 'template.yaml',
    runShellWithRoot: async script => {
      const mapped = script.replaceAll('/data/', dir.replace(/\\/g, '/') + '/');
      const r = shell(mapped);
      return { success: r.status === 0, content: r.stdout + r.stderr };
    },
    getCorePid: async () => running ? '123' : '',
    convertSubscriptionsLocally: async () => {
      if (failAt === 'download') return result(true);
      for (const s of stored.filter(s => s.enabled)) write(dir, 'Proxy/proxies/' + s.name + '.yaml', 'new cache');
      return result();
    },
    writeSubConfigByMode: async (items, mode, options) => {
      configWrites++;
      fs.writeFileSync(constants.CLASH_CONFIG, 'new config:' + mode + ':' + options.convertMode);
      if (failAt === 'write') throw new Error('config write failed');
      return true;
    },
    f50Command: async () => ({ success: failAt !== 'prepare' }), f50Error: String,
    restartClashOk: async () => { restarts++; return failAt !== 'start' || restarts > 1; },
    reloadLocalSubscriptionProviders: async () => result(failAt === 'reload'),
    forceUpdateProvidersFromConfig: async () => result(failAt === 'reload'),
    providerUpdateNeedsLocalFallback: () => false,
    invalidateStatusSnapshot() {}, networkRescue: async () => true,
    buildProviderUpdateResult: () => result(), showSubscriptionUpdateSelfCheck: async () => true,
  });
  return { dir, constants, before, stored, api, configWrites: () => configWrites,
    execute: () => fallback ? api.switchHttpProviderToLocal(stored, ruleMode) : api.saveSubSources(stored, ruleMode, convertMode) };
}

for (const failAt of ['', 'download', 'write', 'start', 'reload']) {
  test('HTTP 390 fallback transaction / ' + (failAt || 'success'), async () => {
    const c = saveCase({ fallback: true, failAt });
    try {
      assert.equal((await c.execute()).ok, !failAt);
      if (failAt) for (const [file, text] of Object.entries(c.before)) assert.equal(fs.readFileSync(file, 'utf8'), text, file);
      else assert.match(fs.readFileSync(c.constants.CLASH_SUB_URLS, 'utf8'), /^# KANO_SUB_CONVERT_MODE=local$/m);
      assert.equal(fs.readdirSync(c.dir).some(name => name.startsWith('kano_subscription_save')), false);
    } finally { fs.rmSync(c.dir, { recursive: true, force: true }); }
  });
}

for (const options of [{ disabled: true }, { custom: true }, { running: false }, { ruleMode: 'original' },
  { convertMode: 'provider' }, { ruleMode: 'original', convertMode: 'provider' }]) {
  test('subscription save protections ' + JSON.stringify(options), async () => {
    const c = saveCase(options);
    try {
      assert.equal(await c.execute(), true);
      assert.equal(c.configWrites(), options.disabled || options.custom ? 0 : 1);
      assert.match(fs.readFileSync(c.constants.CLASH_SUB_URLS, 'utf8'), new RegExp('^# KANO_SUB_CONVERT_MODE=' + (options.convertMode || 'local') + '$', 'm'));
      if (options.disabled) assert.match(fs.readFileSync(c.constants.CLASH_SUB_URLS, 'utf8'), /^# KANO_DISABLED_SUB=/m);
    } finally { fs.rmSync(c.dir, { recursive: true, force: true }); }
  });
}
