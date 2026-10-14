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
      readYamlObject: async () => ({ ok: true, value: { 'proxy-providers': { Provider1: { type: 'http' } } } }),
      forceUpdateProvidersFromConfig: async () => { method = 'refresh-custom'; return result(); },
      saveSubSources: async (...args) => { method = args[1]; return true; },
    });
    assert.equal(await update(sources.slice(0, 1), 'template', 'provider'), configSource === 'uploaded_config');
    assert.equal(method, configSource === 'uploaded_config' ? 'refresh-custom' : undefined);
  });
}

for (const failure of ['', 'download', 'stale', 'other-provider']) {
  test('uploaded local provider downloads its saved subscription / ' + (failure || 'success'), async () => {
    const calls = [], toasts = [];
    const config = { 'proxy-providers': {
      Provider1: { type: 'file', path: './proxies/Provider1.yaml' },
      Provider2: { type: 'file', path: './custom.yaml' },
      Remote: { type: 'http', url: 'https://remote.example/sub' },
    }, rules: ['MATCH,DIRECT'], dns: { enable: false } };
    const before = plain(config);
    const update = subscriptionApi(slice('const buildProviderUpdateResult', 'const mapWithConcurrency')
      + slice('const mergeLocalConversionReloadResult', 'const reloadLocalSubscriptionProviders')
      + slice('const updateSubProviders = async', 'const readCurrentSubSources = async') + 'updateSubProviders', {
      ensureCompatBackend: async () => true, readConfigSource: async () => 'uploaded_config',
      readCurrentSubSources: async () => sources,
      readYamlObject: async () => ({ ok: true, value: config }),
      convertSubscriptionsLocally: async (items, options) => {
        calls.push('download');
        assert.deepEqual(plain(items), sources.slice(0, 1));
        assert.equal(options.preserveNames, true);
        return { ok: failure !== 'download', failed: failure === 'download' ? 1 : 0,
          committed: failure !== 'download', providers: [{ name: 'Provider1', ok: failure !== 'download', proxyCount: 3, message: 'download failed' }] };
      },
      forceUpdateProvidersFromConfig: async options => {
        calls.push('load');
        assert.equal(options.config, config);
        assert.equal(options.refreshRemote, true);
        assert.equal(options.showToast, false);
        return { failed: failure === 'other-provider' ? 1 : 0, providers: [
          { name: 'Provider1', ok: true, proxyCount: failure === 'stale' ? 2 : 3 },
          { name: 'Remote', ok: failure !== 'other-provider', proxyCount: 1 },
        ] };
      },
      createToast: (message, color) => toasts.push(color),
      saveSubSources: async () => { throw new Error('custom configuration must stay intact'); },
    });
    assert.equal(await update([], 'template', 'local'), !failure);
    assert.deepEqual(calls, failure === 'download' ? ['download'] : ['download', 'load']);
    assert.deepEqual(config, before);
    assert.deepEqual(toasts, [failure ? 'red' : 'green']);
  });
}

test('refreshing a subset keeps its existing provider filename', async () => {
  let request;
  const convert = subscriptionApi(slice('const buildProviderUpdateResult', 'const mapWithConcurrency')
    + slice('const formatSubscriptionDownloadError', 'const mergeLocalConversionReloadResult') + 'convertSubscriptionsLocally', {
    validateLocalSubscriptionUrl: () => ({ ok: true }), ensureCompatBackend: async () => true,
    createRandomString: () => 'fixture', loadProviderUserAgent: async () => 'clash.meta',
    stageTextBesideTarget: async (target, text) => { request = JSON.parse(text); return { ok: true, stagePath: target }; },
    f50Command: async () => ({ success: true, content: 'F50_FETCH_RESULT=' + JSON.stringify({ ok: true, committed: true,
      providers: [{ name: 'Provider2', ok: true, proxyCount: 3 }] }) }),
    runShellWithRoot: async () => ({ success: true }),
  });
  const converted = await convert(sources.slice(1), { preserveNames: true });
  assert.deepEqual(request.sources, sources.slice(1));
  assert.equal(converted.providers[0].name, 'Provider2');
  assert.equal(converted.providers[0].ok, true);
});

test('a configuration without providers cannot report a successful subscription refresh', async () => {
  const refresh = run(slice('const buildProviderUpdateResult', 'const mapWithConcurrency')
    + slice('const forceUpdateProvidersFromConfig', 'const convertSubscriptionsLocally') + 'forceUpdateProvidersFromConfig', {
    ...subContext,
    buildControllerInfo: async () => { throw new Error('no provider to update'); },
  });
  const updated = await refresh({ config: { proxies: [{ name: 'Old' }] } });
  assert.equal(updated.failed, 1);
  assert.equal(updated.providers[0].errorType, 'provider_missing');
});

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

function saveCase({ failAt = '', running = true, fallback = false, disabled = false, custom = false, legacy = false, migrateLegacy = false, ruleMode = 'template', convertMode = 'local' } = {}) {
  const dir = temp();
  const constants = { CLASH_DIR: dir, CLASH_PROXY_DIR: path.join(dir, 'Proxy'), CLASH_POLICY_DIR: path.join(dir, 'Policy') };
  for (const [key, file] of Object.entries({ CLASH_CONFIG: 'Proxy/config.yaml', CLASH_SUB_URLS: 'Proxy/subscription_urls.txt',
    CLASH_SUB_RULE_MODE_FILE: 'Tools/sub_rule_mode.conf', CLASH_POLICY_OPTIONS_FILE: 'Policy/options.conf',
    CLASH_CONFIG_SOURCE_FILE: 'Tools/config_source.conf', CLASH_TEMPLATE: 'Tools/template.yaml',
    CLASH_TEMPLATE_BASE: 'Tools/template.base.yaml', CLASH_RULE_OVERRIDE_APPLIED_JSON: 'Tools/rule_override_applied.json' })) {
    constants[key] = write(dir, file, key === 'CLASH_SUB_URLS' ? '# KANO_SUB_RULE_MODE=template\n# KANO_SUB_CONVERT_MODE=provider\nhttps://one.example/sub Provider1\n' : 'old:' + key);
  }
  for (const s of sources) write(dir, 'Proxy/proxies/' + s.name + '.yaml', 'old cache:' + s.name);
  if (legacy) {
    fs.writeFileSync(constants.CLASH_CONFIG_SOURCE_FILE, 'KANO_CONFIG_SOURCE=subscription_original\n');
    fs.writeFileSync(constants.CLASH_SUB_URLS, '# KANO_SUB_RULE_MODE=original\nhttps://one.example/sub Provider1\n');
  }
  const before = Object.fromEntries(Object.values(constants).filter(f => fs.statSync(f).isFile()).map(f => [f, fs.readFileSync(f, 'utf8')]));
  for (const s of sources) before[path.join(dir, 'Proxy/proxies/' + s.name + '.yaml')] = 'old cache:' + s.name;
  let restarts = 0, configWrites = 0;
  const stored = (ruleMode === 'original' ? sources.slice(0, 1) : sources).map(s => ({ ...s, enabled: !disabled }));
  const extra = slice('function validateSubscriptionMode', 'function buildF50CleanupScript')
    + slice('const fileSnapshotHelpersCmd', 'const setSubRuleMode')
    + slice('const switchHttpProviderToLocal', 'const readLegacySubscriptionSources')
    + slice('const saveSubSources = async', 'const overwriteConfigByTemplate')
    + '({saveSubSources,switchHttpProviderToLocal})';
  const api = subscriptionApi(extra, {
    ...constants, activeCriticalOperation: null, createRandomString: () => 'fixture',
    validateLocalSubscriptionUrl: () => ({ ok: true }), showSuspiciousSubSourcesError: () => false,
    readCurrentSubSources: async () => stored, readConfigSource: async () => legacy ? 'subscription_original' : custom ? 'uploaded_config' : 'template.yaml',
    readCurrentSubRuleMode: async () => legacy ? 'original' : 'template',
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
      fs.writeFileSync(constants.CLASH_CONFIG_SOURCE_FILE, 'KANO_CONFIG_SOURCE=template.yaml\n');
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
    execute: () => fallback ? api.switchHttpProviderToLocal(stored, ruleMode) : api.saveSubSources(stored, ruleMode, convertMode, { migrateLegacy }) };
}

for (const options of [{ legacy: true }, { legacy: true, migrateLegacy: true },
  { legacy: true, migrateLegacy: true, failAt: 'write' }, { legacy: true, migrateLegacy: true, failAt: 'start' }]) {
  test('legacy original migration is explicit, backed up and rollback-safe ' + JSON.stringify(options), async () => {
    const c = saveCase(options);
    try {
      assert.equal(await c.execute(), options.migrateLegacy === true && !options.failAt);
      if (!options.migrateLegacy || options.failAt) {
        for (const [file, text] of Object.entries(c.before)) assert.equal(fs.readFileSync(file, 'utf8'), text);
      }
      const backups = fs.readdirSync(c.dir).filter(name => name.startsWith('kano_subscription_save_'));
      assert.equal(backups.length, options.migrateLegacy ? 1 : 0);
      if (backups.length) {
        const backup = path.join(c.dir, backups[0]);
        assert.equal(fs.readFileSync(path.join(backup, '0'), 'utf8'), c.before[c.constants.CLASH_CONFIG]);
        assert.ok(fs.existsSync(path.join(backup, 'committed')));
      }
    } finally { fs.rmSync(c.dir, { recursive: true, force: true }); }
  });
}

test('an original header with no URLs prevents automatic legacy-source migration', async () => {
  const read = subscriptionApi(slice('const readCurrentSubSources = async', 'const writeSubConfigByMode =') + 'readCurrentSubSources', {
    runShellWithRoot: async () => ({ success: true, content: '# KANO_SUB_RULE_MODE=original\n' }),
    readConfigSource: async () => { throw new Error('header already identifies protected state'); },
    migrateLegacySubscriptionSources: async () => { throw new Error('must not migrate protected state'); },
  });
  assert.deepEqual(plain(await read()), []);
});

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
      assert.equal(await c.execute(), options.ruleMode !== 'original');
      if (options.ruleMode === 'original') {
        assert.equal(c.configWrites(), 0);
        for (const [file, text] of Object.entries(c.before)) assert.equal(fs.readFileSync(file, 'utf8'), text);
        return;
      }
      assert.equal(c.configWrites(), options.disabled || options.custom ? 0 : 1);
      assert.match(fs.readFileSync(c.constants.CLASH_SUB_URLS, 'utf8'), new RegExp('^# KANO_SUB_CONVERT_MODE=' + (options.convertMode || 'local') + '$', 'm'));
      if (options.disabled) assert.match(fs.readFileSync(c.constants.CLASH_SUB_URLS, 'utf8'), /^# KANO_DISABLED_SUB=/m);
    } finally { fs.rmSync(c.dir, { recursive: true, force: true }); }
  });
}
