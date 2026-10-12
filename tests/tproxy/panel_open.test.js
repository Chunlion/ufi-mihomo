'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../..', '猫猫TProxy.js'), 'utf8');
function slice(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from);
  return source.slice(from, to);
}
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function harness({ guard = async () => ({ ok: true }), info = async () => ({ port: 7788 }), blocked = false } = {}) {
  const windows = [], toasts = [];
  let checks = 0, clock = 0;
  const open = {};
  const api = vm.runInNewContext(slice('  let statusSnapshotCache =', '  function shouldShowOperationProgress(')
    + 'let controllerInfoCache = null, controllerInfoCacheExpiresAt = 0, controllerInfoLoadPromise = null;\n'
    + slice('  function invalidateStatusSnapshot()', '  // One read-only device request')
    + source.match(/  const invalidateControllerInfo = \(\) => \{[\s\S]*?\n  \};/)[0]
    + slice('  const buildPanelUrl =', '  function renderRuntimeStatus(')
    + slice('    open.onclick = async () => {', '    const controllerSettingsBtn =')
    + '\n({build:buildPanelUrl, open:open.onclick, statusChanged:invalidateStatusSnapshot, controllerChanged:invalidateControllerInfo, cached:()=>zashboardPanelUrl})', {
      open, F50_PORTS: { controller: 7788 }, Date: { now: () => ++clock },
      console: { error() {} }, safeTextToHtml: String,
      createToast: (...args) => toasts.push(args),
      ensureZashboardPanelReady: async () => { checks++; return guard(); },
      waitForLanHost: async () => '192.168.0.1', buildControllerInfo: info,
      window: { open(url, target) {
        if (blocked) return null;
        const item = { url, target, replacements: [], closed: false, opener: {},
          location: { replace(next) { item.replacements.push(next); } }, close() { item.closed = true; } };
        windows.push(item);
        return item;
      } },
    });
  return { api, windows, toasts, checks: () => checks };
}

test('repeated new windows open the validated URL synchronously without new checks', async () => {
  const h = harness();
  const url = await h.api.build();
  for (let i = 0; i < 2; i++) {
    const pending = h.api.open();
    assert.equal(h.windows[i].url, url);
    assert.equal(h.windows[i].opener, null);
    assert.equal(h.windows[i].replacements.length, 0);
    await pending;
  }
  assert.equal(h.checks(), 1);
});

test('cold opening reserves the popup and shares an in-flight panel check', async () => {
  const gate = deferred(), h = harness({ guard: () => gate.promise });
  const panel = h.api.build();
  const opening = h.api.open();
  assert.equal(h.windows[0].url, 'about:blank');
  assert.equal(h.checks(), 1);
  gate.resolve({ ok: true });
  const url = await panel;
  await opening;
  assert.deepEqual(h.windows[0].replacements, [url]);
  assert.equal(h.api.cached(), url);
});

test('explicit panel refresh rechecks readiness and renews the URL', async () => {
  const h = harness();
  const first = await h.api.build(), second = await h.api.build();
  assert.notEqual(second, first);
  assert.equal(h.checks(), 2);
  assert.equal(h.api.cached(), second);
});

for (const invalidate of ['statusChanged', 'controllerChanged']) {
  test(`${invalidate} makes the next new window revalidate`, async () => {
    const h = harness();
    await h.api.build();
    h.api[invalidate]();
    assert.equal(h.api.cached(), '');
    await h.api.open();
    assert.equal(h.windows[0].url, 'about:blank');
    assert.equal(h.windows[0].replacements.length, 1);
    assert.equal(h.checks(), 2);
  });

  test(`${invalidate} prevents an older in-flight result from restoring the cache`, async () => {
    const gate = deferred(), h = harness({ guard: () => gate.promise });
    const pending = h.api.build();
    h.api[invalidate]();
    gate.resolve({ ok: true });
    await pending;
    assert.equal(h.api.cached(), '');
  });
}

test('a failed readiness check closes the reserved popup and retains the error', async () => {
  const h = harness({ guard: async () => ({ ok: false, message: 'panel invalid' }) });
  await h.api.open();
  assert.equal(h.windows[0].closed, true);
  assert.match(h.toasts[0][0], /panel invalid/);
  assert.equal(h.api.cached(), '');
});

for (const [name, info] of [
  ['unavailable controller', async () => { throw new Error('controller unavailable'); }],
  ['fallback controller', async () => ({ port: 7788, usingFallbackController: true })],
]) {
  test(`${name} is not cached as a verified address`, async () => {
    const h = harness({ info });
    await h.api.open();
    assert.match(h.windows[0].replacements[0], /^http:\/\/192\.168\.0\.1:7788\/ui\//);
    assert.equal(h.api.cached(), '');
    await h.api.open();
    assert.equal(h.checks(), 2);
  });
}

test('a blocked popup does not start panel checks', async () => {
  const h = harness({ blocked: true });
  await h.api.open();
  assert.equal(h.checks(), 0);
  assert.equal(h.toasts.length, 1);
});
