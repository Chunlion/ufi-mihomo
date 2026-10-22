'use strict';

const test = require('node:test');
const { fs, path, assert, slice, run, shell, subContext, subscriptionApi, plain, quote, temp, write } = require('./optimization_harness');
const sources = [{ url: 'https://one.example/sub', name: 'Provider1' }, { url: 'https://two.example/sub', name: 'Provider2' }];
const result = (failed = false) => ({ ok: !failed, failed: failed ? 1 : 0,
  providers: sources.map(s => ({ name: s.name, ok: !failed, message: failed ? 'failed' : '', proxyCount: failed ? 0 : 2 })) });

test('subscription URLs retain path names and trailing query characters', () => {
  const { normalizeSubUrl, buildSubUrlsFileText, parseStoredSubSourcesFromText } = subscriptionApi('({normalizeSubUrl,buildSubUrlsFileText,parseStoredSubSourcesFromText})');
  for (const url of [
    'https://airport.example/clash/config.yaml',
    'https://asn-airport.example/subscribe',
    'https://airport.example/api/subscribe?token=abcasnxyz',
    'https://airport.example/api/subscribe?filename=geosite.dat',
    'https://airport.example/api/subscribe?token=ruleset',
    'https://airport.example/geoip-subscription',
    'https://airport.example/api/subscribe?token=fixture,',
    'https://airport.example/api/subscribe?token=fixture]',
    'https://airport.example/api/subscribe?token=fixture}',
  ]) {
    assert.equal(normalizeSubUrl(' ' + url + ' '), url);
    assert.equal(parseStoredSubSourcesFromText(buildSubUrlsFileText([{ url }]))[0].url, url);
  }
});

test('template source imports retain URLs regardless of path names', async () => {
  const read = subscriptionApi(slice('const readTemplateProviderSubSources', 'const persistSubSourcesForTemplate') + 'readTemplateProviderSubSources', {
    CLASH_DIR: '/fixture', prepareYqRuntimeCmd: () => ':',
    runShellWithRoot: async () => ({ success: true, content: 'https://airport.example/geoip-subscription\nhttps://airport.example/rules/nodes.yaml\n' }),
  });
  assert.deepEqual(plain(await read('/base.yaml', '/template.yaml')).map(s => s.url), [
    'https://airport.example/geoip-subscription', 'https://airport.example/rules/nodes.yaml',
  ]);
});

for (const mode of ['provider', 'local']) {
  for (const ready of [true, false]) {
    test(`${mode} update, runtime matches=${ready}`, async () => {
      const calls = [];
      const update = subscriptionApi(slice('const updateSubProviders = async', 'const readCurrentSubSources = async') + 'updateSubProviders', {
        ensureCompatBackend: async () => true, readConfigSource: async () => 'template.yaml',
        readYamlObject: async () => ({ ok: true, value: { 'proxy-providers': Object.fromEntries(sources.map(s => [s.name, { type: ready ? (mode === 'local' ? 'file' : 'http') : (mode === 'local' ? 'http' : 'file'), ...(ready ? (mode === 'provider' ? { url: s.url } : { path: `./proxies/${s.name}.yaml` }) : {}) }])) } }),
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
          { name: 'Remote', ok: failure !== 'other-provider', proxyCount: 1, message: failure === 'other-provider' ? 'HTTP 500' : '' },
        ] };
      },
      createToast: (message, color) => toasts.push({ message, color }),
      saveSubSources: async () => { throw new Error('custom configuration must stay intact'); },
    });
    assert.equal(await update([], 'template', 'local'), !failure);
    assert.deepEqual(calls, failure === 'download' ? ['download'] : ['download', 'load']);
    assert.deepEqual(config, before);
    assert.deepEqual(toasts.map(toast => toast.color), [failure ? 'red' : 'green']);
    if (failure === 'stale') assert.match(toasts[0].message, /Provider1.*3.*2/);
    if (failure === 'other-provider') assert.match(toasts[0].message, /Remote.*HTTP 500/);
  });
}

for (const observation of [
  { provider: { name: 'Provider1', ok: true, proxyCount: 2, cacheAvailable: true }, count: 2, cache: true, error: 'provider_count_mismatch' },
  { provider: { name: 'Provider1', ok: false, proxyCount: 2, cacheAvailable: true, errorType: 'provider_update_failed', message: 'update failed' }, count: 2, cache: true, error: 'provider_update_failed' },
  { provider: { name: 'Provider1', ok: false, proxyCount: null, cacheAvailable: false, errorType: 'provider_snapshot_failed', message: 'snapshot failed' }, count: null, cache: null, error: 'provider_snapshot_failed' },
  { provider: null, count: null, cache: null, error: 'provider_reload_missing' },
]) test('local refresh keeps observed cache state / ' + observation.error, () => {
  const merge = subscriptionApi(slice('const buildProviderUpdateResult', 'const mapWithConcurrency')
    + slice('const mergeLocalConversionReloadResult', 'const reloadLocalSubscriptionProviders') + 'mergeLocalConversionReloadResult');
  const merged = merge({ committed: true, providers: [{ name: 'Provider1', ok: true, proxyCount: 3 }] },
    { providers: observation.provider ? [observation.provider] : [] });
  assert.equal(merged.failed, 1);
  assert.equal(merged.committed, true);
  assert.equal(merged.providers[0].proxyCount, observation.count);
  assert.equal(merged.providers[0].cacheAvailable, observation.cache);
  assert.equal(merged.providers[0].errorType, observation.error);
});

for (const configSource of ['uploaded_config', 'template.yaml']) {
  test(configSource + ' does not promise cache preservation for an unconfirmed download', async () => {
    const toasts = [];
    const update = subscriptionApi(slice('const updateSubProviders = async', 'const readCurrentSubSources = async') + 'updateSubProviders', {
      ensureCompatBackend: async () => true, readConfigSource: async () => configSource,
      readYamlObject: async () => ({ ok: true, value: { 'proxy-providers': { Provider1: { type: 'file', path: './proxies/Provider1.yaml' } } } }),
      convertSubscriptionsLocally: async () => ({ ok: false, failed: 1, providers: [{ name: 'Provider1', ok: false, message: '无法确认订阅下载结果，请检查设备连接后重试' }] }),
      forceUpdateProvidersFromConfig: async () => { throw new Error('unconfirmed download must not reload providers'); },
      createToast: message => toasts.push(message),
    });
    assert.equal(await update(sources.slice(0, 1), 'template', 'local'), false);
    assert.equal(toasts.length, 1);
    assert.match(toasts[0], /无法确认订阅下载结果/);
    assert.doesNotMatch(toasts[0], /原节点和核心运行状态保留/);
  });
}

test('a changed subscription address rebuilds the config instead of re-downloading the old one', async () => {
  // 配置里还是旧地址时直接更新，只会重复下载旧地址并报成功（假更新）。
  const calls = [];
  const config = { 'proxy-providers': { Provider1: { type: 'http', url: 'https://old.example/sub' } } };
  const update = subscriptionApi(slice('const updateSubProviders = async', 'const readCurrentSubSources = async') + 'updateSubProviders', {
    ensureCompatBackend: async () => true, readConfigSource: async () => 'template.yaml',
    readYamlObject: async () => ({ ok: true, value: config }),
    readCurrentSubSources: async () => sources,
    saveSubSources: async (...args) => { calls.push(['save', args[1]]); return true; },
    forceUpdateProvidersFromConfig: async () => { calls.push(['http']); return result(); },
    convertSubscriptionsLocally: async () => { calls.push(['convert']); return result(); },
    providerUpdateNeedsLocalFallback: () => false,
    showSubscriptionUpdateSelfCheck: async () => true, getCorePid: async () => '123',
    createToast: () => {},
  });
  assert.equal(await update(sources, 'template', 'provider'), true);
  assert.deepEqual(calls, [['save', 'template']], 'address drift must rebuild before updating');
});

test('an unchanged address still updates the providers directly', async () => {
  const calls = [];
  const config = { 'proxy-providers': { Provider1: { type: 'http', url: sources[0].url } } };
  const update = subscriptionApi(slice('const updateSubProviders = async', 'const readCurrentSubSources = async') + 'updateSubProviders', {
    ensureCompatBackend: async () => true, readConfigSource: async () => 'template.yaml',
    readYamlObject: async () => ({ ok: true, value: config }),
    readCurrentSubSources: async () => sources.slice(0, 1),
    saveSubSources: async () => { calls.push(['save']); return true; },
    forceUpdateProvidersFromConfig: async () => { calls.push(['http']); return result(); },
    convertSubscriptionsLocally: async () => { calls.push(['convert']); return result(); },
    providerUpdateNeedsLocalFallback: () => false,
    showSubscriptionUpdateSelfCheck: async () => true, getCorePid: async () => '123',
    createToast: () => {},
  });
  assert.equal(await update(sources.slice(0, 1), 'template', 'provider'), true);
  assert.deepEqual(calls, [['http']], 'matching address updates without a rebuild');
});

for (const [mode, definitions] of [
  ['provider', { Provider1: { type: 'http', url: sources[0].url }, Provider2: { type: 'http', url: sources[1].url } }],
  ['local', { Provider1: { type: 'file', path: './old.yaml' } }],
]) test(`template ${mode} update rebuilds stale provider definitions`, async () => {
  const calls = [];
  const update = subscriptionApi(slice('const updateSubProviders = async', 'const readCurrentSubSources = async') + 'updateSubProviders', {
    ensureCompatBackend: async () => true, readConfigSource: async () => 'template.yaml',
    readYamlObject: async () => ({ ok: true, value: { 'proxy-providers': definitions } }),
    readCurrentSubSources: async () => sources.slice(0, 1),
    saveSubSources: async (...args) => { calls.push(plain(args)); return true; },
    forceUpdateProvidersFromConfig: async () => { throw new Error('stale definitions must be rebuilt'); },
    convertSubscriptionsLocally: async () => { throw new Error('stale file path must be rebuilt'); },
  });
  assert.equal(await update(sources.slice(0, 1), 'template', mode), true);
  assert.deepEqual(calls, [[sources.slice(0, 1), 'template', mode, { applyToCustom: true }]]);
});

for (const configSource of ['uploaded_config', 'template.yaml', 'subscription_original']) {
  for (const mode of ['template', 'original']) test(`restored ${configSource} / ${mode} uses the subscription update path`, async () => {
    const calls = [];
    const refresh = run('let refreshSubscriptionAfterRestore;'
      + slice('refreshSubscriptionAfterRestore = async', 'const updateSubProviders = async') + 'refreshSubscriptionAfterRestore', {
      ...subContext,
      readCurrentSubSources: async () => sources,
      readCurrentSubRuleMode: async () => mode, readSavedSubConvertMode: async () => 'local',
      readConfigSource: async () => configSource,
      updateSubProviders: async (...args) => { calls.push(plain(args)); return true; },
      forceUpdateProvidersFromConfig: async () => { throw new Error('restore must not bypass subscription downloads'); },
    });
    await refresh();
    assert.deepEqual(calls, configSource === 'uploaded_config' ? [[[]]]
      : configSource === 'subscription_original' || mode === 'original' ? [] : [[sources, mode, 'local']]);
  });
}

test('equal node counts do not claim identical node contents', () => {
  let html;
  const show = run(slice('const buildProviderUpdateResult', 'const mapWithConcurrency')
    + slice('const deriveSubscriptionUpdateOutcome', 'const forceUpdateProvidersFromConfig')
    + slice('const showSubscriptionUpdateResultDialog', 'const showSubscriptionUpdateSelfCheck') + 'showSubscriptionUpdateResultDialog', {
    ...subContext, createRandomString: () => 'fixture', textToHtml: String,
    createFixedToast: (id, content) => { html = content; return { el: { querySelector: () => null }, close() {} }; },
  });
  show({ configValidationResult: { ok: true }, providerUpdateResult: { total: 1, success: 1, failed: 0,
    providers: [{ name: 'Provider1', ok: true, previousProxyCount: 1, proxyCount: 1, countUnchanged: true }] } });
  assert.match(html, /数量与更新前一致/);
  assert.doesNotMatch(html, /节点内容与更新前一致/);
});

test('a custom configuration update says the saved address is not the one in use', async () => {
  const toasts = [], calls = [];
  const config = { 'proxy-providers': { Provider1: { type: 'http', url: 'https://old.example/sub' } } };
  const update = subscriptionApi(slice('const updateSubProviders = async', 'const readCurrentSubSources = async') + 'updateSubProviders', {
    ensureCompatBackend: async () => true, readConfigSource: async () => 'uploaded_config',
    readYamlObject: async () => ({ ok: true, value: config }),
    readCurrentSubSources: async () => sources.slice(0, 1),
    forceUpdateProvidersFromConfig: async () => { calls.push('load'); return result(); },
    saveSubSources: async () => { calls.push('save'); return true; },
    createToast: (message, color) => toasts.push({ message, color }),
  });
  assert.equal(await update(sources.slice(0, 1), 'template', 'provider'), true);
  assert.deepEqual(calls, ['load'], 'the running configuration still decides which address is downloaded');
  assert.equal(toasts[0].color, 'yellow');
  assert.match(toasts[0].message, /不一致/);
  assert.match(toasts[0].message, /应用到自定义配置/);
});

test('template local refresh reports the provider and both mismatched counts', async () => {
  const toasts = [];
  const config = { 'proxy-providers': { Provider1: { type: 'file', path: './proxies/Provider1.yaml' } }, rules: ['MATCH,DIRECT'], dns: { enable: false } };
  const before = plain(config);
  const api = subscriptionApi(slice('const buildProviderUpdateResult', 'const mapWithConcurrency')
    + slice('const mergeLocalConversionReloadResult', 'const reloadLocalSubscriptionProviders')
    + slice('const updateSubProviders = async', 'const readCurrentSubSources = async') + '({ update: updateSubProviders, merge: mergeLocalConversionReloadResult })', {
    ensureCompatBackend: async () => true, readConfigSource: async () => 'template.yaml',
    readYamlObject: async () => ({ ok: true, value: config }), getCorePid: async () => '123',
    convertSubscriptionsLocally: async () => ({ ok: true, failed: 0, committed: true, providers: [{ name: 'Provider1', ok: true, proxyCount: 3 }] }),
    reloadLocalSubscriptionProviders: async (items, converted) => api.merge(converted, { providers: [{ name: 'Provider1', ok: true, proxyCount: 2 }] }),
    saveSubSources: async () => { throw new Error('ready template must not be rebuilt'); },
    createToast: (message, color) => toasts.push({ message, color }),
  });
  assert.equal(await api.update(sources.slice(0, 1), 'template', 'local'), false);
  assert.deepEqual(config, before);
  assert.equal(toasts[0].color, 'red');
  assert.match(toasts[0].message, /Provider1.*3.*2/);
});

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
    // 更新前后的节点数量分别来自两次快照。
    assert.equal(calls[0][1], 'GET');
    assert.equal(calls[1][1], 'PUT');
    if (status === 200) {
      assert.equal(calls[2][1], 'GET');
      assert.equal(updated.providers[0].previousProxyCount, 1);
      assert.equal(updated.providers[0].countUnchanged, true);
    }
    if (status === 390) assert.equal(updated.providers[0].errorType, 'upstream_390');
  });
}

function saveCase({ failAt = '', running = true, fresh = false, fallback = false, disabled = false, custom = false, legacy = false, migrateLegacy = false, ruleMode = 'template', convertMode = 'local' } = {}) {
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
  const absent = fresh ? [constants.CLASH_SUB_URLS, constants.CLASH_SUB_RULE_MODE_FILE, constants.CLASH_CONFIG_SOURCE_FILE,
    ...sources.map(s => path.join(dir, 'Proxy/proxies/' + s.name + '.yaml'))] : [];
  if (fresh) {
    fs.writeFileSync(constants.CLASH_CONFIG, 'proxies: []\nrules: [MATCH,DIRECT]\n');
    for (const file of absent) fs.rmSync(file);
  }
  const before = Object.fromEntries(Object.values(constants).filter(f => fs.existsSync(f) && fs.statSync(f).isFile()).map(f => [f, fs.readFileSync(f, 'utf8')]));
  if (!fresh) for (const s of sources) before[path.join(dir, 'Proxy/proxies/' + s.name + '.yaml')] = 'old cache:' + s.name;
  let restarts = 0, configWrites = 0;
  const commands = [];
  const stored = (ruleMode === 'original' ? sources.slice(0, 1) : sources).map(s => ({ ...s, enabled: !disabled }));
  const extra = slice('function validateSubscriptionMode', 'function buildF50CleanupScript')
    + slice('const fileSnapshotHelpersCmd', 'const setSubRuleMode')
    + slice('const switchHttpProviderToLocal', 'const readLegacySubscriptionSources')
    + slice('const saveSubSources = async', 'const overwriteConfigByTemplate')
    + '({saveSubSources,switchHttpProviderToLocal})';
  const api = subscriptionApi(extra, {
    ...constants, activeCriticalOperation: null, createRandomString: () => 'fixture',
    validateLocalSubscriptionUrl: () => ({ ok: true }),
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
    f50Command: async command => { commands.push(command); return { success: failAt !== 'prepare' }; }, f50Error: String,
    restartClashOk: async () => { restarts++; return failAt !== 'start' || restarts > 1; },
    reloadLocalSubscriptionProviders: async () => result(failAt === 'reload'),
    forceUpdateProvidersFromConfig: async () => result(failAt === 'reload'),
    providerUpdateNeedsLocalFallback: () => false,
    invalidateStatusSnapshot() {}, networkRescue: async () => true,
    buildProviderUpdateResult: () => result(), showSubscriptionUpdateSelfCheck: async () => true,
  });
  return { dir, constants, before, absent, stored, api, commands, restarts: () => restarts, configWrites: () => configWrites,
    execute: () => fallback ? api.switchHttpProviderToLocal(stored, ruleMode) : api.saveSubSources(stored, ruleMode, convertMode, { migrateLegacy }) };
}

test('saving an enabled subscription retains its URL and ignores a disabled source', async () => {
  const c = saveCase();
  try {
    c.stored[0].url = 'https://airport.example/geoip-subscription?token=fixture,';
    c.stored[1].url = 'https://rules.example/direct.mrs';
    c.stored[1].enabled = false;
    assert.equal(await c.execute(), true);
    const saved = fs.readFileSync(c.constants.CLASH_SUB_URLS, 'utf8');
    assert.ok(saved.includes(c.stored[0].url + ' Provider1\n'));
    assert.ok(saved.includes('# KANO_DISABLED_SUB=' + c.stored[1].url + '\n'));
    assert.equal(fs.readFileSync(path.join(c.dir, 'Proxy/proxies/Provider2.yaml'), 'utf8'), 'old cache:Provider2');
  } finally { fs.rmSync(c.dir, { recursive: true, force: true }); }
});

for (const convertMode of ['provider', 'local']) {
  for (const failAt of ['', 'write', 'prepare']) {
    test(`first subscription save / ${convertMode} / ${failAt || 'success'}`, async () => {
      const c = saveCase({ fresh: true, running: false, convertMode, failAt });
      try {
        assert.equal(await c.execute(), !failAt);
        assert.equal(c.restarts(), 0, 'saving the first subscription keeps the core stopped');
        assert.deepEqual(c.commands, failAt === 'write' ? [] : ['prepare']);
        if (failAt) {
          for (const [file, text] of Object.entries(c.before)) assert.equal(fs.readFileSync(file, 'utf8'), text, file);
          for (const file of c.absent) assert.equal(fs.existsSync(file), false, file);
        } else {
          assert.match(fs.readFileSync(c.constants.CLASH_CONFIG, 'utf8'), new RegExp('new config:template:' + convertMode));
          assert.match(fs.readFileSync(c.constants.CLASH_SUB_URLS, 'utf8'), new RegExp('^# KANO_SUB_CONVERT_MODE=' + convertMode + '$', 'm'));
        }
      } finally { fs.rmSync(c.dir, { recursive: true, force: true }); }
    });
  }
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
