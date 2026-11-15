'use strict';
const test = require('node:test');
const { vm, assert, source, slice, subscriptionApi } = require('./optimization_harness');

test('all four action groups retain independent open and closed states', () => {
  const storage = new Map();
  const document = { createElement: () => ({ open: false, classList: { add() {} }, appendChild() {}, addEventListener(name, fn) { this[name] = fn; } }) };
  const create = () => vm.runInNewContext(slice('const appendActionGroup =', 'const coreGroup =') + 'appendActionGroup', {
    document, mmBox: { appendChild() {} }, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  const titles = ['核心与面板', '订阅与配置', '网络与诊断', '组件与维护'];
  const append = create();
  titles.forEach((title, i) => { const el = append(title, []); assert.equal(el.open, false); el.open = i % 2 === 0; el.toggle(); });
  const reopened = create();
  titles.forEach((title, i) => assert.equal(reopened(title, []).open, i % 2 === 0));
});

test('unavailable browser storage does not block action groups', () => {
  const append = vm.runInNewContext(slice('const appendActionGroup =', 'const coreGroup =') + 'appendActionGroup', {
    document: { createElement: () => ({ classList: { add() {} }, appendChild() {}, addEventListener() {} }) },
    mmBox: { appendChild() {} }, localStorage: { getItem() { throw Error('blocked'); } },
  });
  assert.equal(append('核心与面板', [], true).open, true);
});

test('configured intervals and disabled automatic updates reach generated HTTP providers', () => {
  const build = auto => subscriptionApi(slice('const buildManagedProxyProviders', 'const buildManagedRuleProviders')
    + `subscriptionPreferences={configured:true,auto:${auto},intervalHours:6};buildManagedProxyProviders`, { currentProviderUserAgent: 'test' });
  assert.equal(build(true)([{ url: 'https://example.com/sub' }]).Provider1.interval, 21600);
  assert.equal(build(false)([{ url: 'https://example.com/sub' }]).Provider1.interval, 0);
});

test('a failed preference read cannot silently overwrite stored settings', async () => {
  const load = subscriptionApi('loadSubscriptionPreferences', { f50GistExec: async () => ({ ok: false, code: 'subscription_settings_invalid' }), f50GistMessage: String });
  await assert.rejects(load(), /subscription_settings_invalid/);
});

test('rescue local downloads use the device lease and preserve the fetch result contract', async () => {
  const calls = [], toasts = [];
  const convert = subscriptionApi(slice('const buildProviderUpdateResult', 'const mapWithConcurrency')
    + slice('const formatSubscriptionDownloadError', 'const mergeLocalConversionReloadResult') + 'convertSubscriptionsLocally', {
    validateLocalSubscriptionUrl: () => ({ ok: true }), ensureCompatBackend: async () => true,
    createRandomString: () => 'fixture', stageTextBesideTarget: async () => ({ ok: true, stagePath: '/staged/request.json' }),
    loadProviderUserAgent: async () => 'FixtureAgent', createToast: (message, color) => toasts.push([message, color]),
    runShellWithRoot: async () => ({ success: true, content: '' }),
    f50GistExec: async (args, timeout, input, run) => {
      if (args[0] === 'subscription-status') return { ok: true, rescueConfigured: true };
      calls.push({ args, run });
      return { ok: true, committed: true, rescued: true, providers: [{ name: 'Provider1', ok: true, proxyCount: 3, statusCode: 200 }] };
    },
    f50Command: async () => { throw Error('must use rescue-aware downloader'); },
  });
  const r = await convert([{ url: 'https://example.com/sub' }]);
  assert.equal(r.committed, true); assert.equal(r.providers[0].proxyCount, 3);
  assert.equal(calls[0].args[0], 'subscription-fetch'); assert.equal(typeof calls[0].run, 'function');
  assert.deepEqual(toasts[0], ['直连下载失败；已通过备用节点更新订阅', 'yellow']);
});
