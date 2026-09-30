'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', '..', '猫猫TProxy.js'), 'utf8');
const slice = (start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing source: ${start}`);
  return source.slice(from, to);
};
const updateFunction = slice('const updateSubProviders = async', 'const readCurrentSubSources = async');
const clickHandler = slice('updateSubBtn.onclick = async', 'const applySavedOverrides = async');

for (const configSource of ['uploaded_config', 'subscription_original']) {
  for (const saved of [true, false]) {
    test(`original YAML update from ${configSource}, save=${saved}`, async () => {
      const sources = [{ name: 'Provider1', url: 'https://example.com/config.yaml', enabled: true }];
      const calls = [];
      const finished = [];
      const sandbox = {
        SUB_RULE_MODE_TEMPLATE: 'template',
        SUB_RULE_MODE_ORIGINAL: 'original',
        SUB_CONVERT_MODE_LOCAL: 'local',
        CLASH_CONFIG: '/data/clash/Proxy/config.yaml',
        updateSubBtn: {},
        acquireCriticalOperation: () => ({}),
        releaseCriticalOperation() {},
        setButtonBusy() {},
        operationStage() {},
        operationFinish: (ok) => finished.push(ok),
        ensureReady: async () => true,
        ensureCompatBackend: async () => true,
        readConfigSource: async () => configSource,
        readCurrentSubRuleMode: async () => 'original',
        readSavedSubConvertMode: async () => 'local',
        readCurrentSubSources: async () => sources,
        normalizeSubSourceList: (value) => value,
        normalizeSubRuleModeValue: (value) => value,
        validateSubscriptionMode() {},
        createToast() {},
        safeTextToHtml: (value) => value,
        readYamlObject: async () => ({ ok: true, value: { proxies: [{ name: 'Old' }] } }),
        saveSubSources: async (...args) => { calls.push(args); return saved; },
        forceUpdateProvidersFromConfig: async () => { throw new Error('YAML update must download the saved URL'); },
      };
      vm.runInNewContext(`${updateFunction}\n${clickHandler}`, sandbox);
      await sandbox.updateSubBtn.onclick();
      assert.equal(calls.length, 1);
      assert.equal(calls[0][0], sources);
      assert.deepEqual(calls[0].slice(1, 3), ['original', 'local']);
      assert.equal(calls[0][3].applyToCustom, true);
      assert.deepEqual(finished, [saved]);
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
