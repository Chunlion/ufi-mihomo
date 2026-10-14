'use strict';

const test = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');
const { parse, visit, semantics } = require('../../scripts/compact_plugin');
const { assert, source, slice, run, shellApi, syntax, plain, quote } = require('./optimization_harness');
const baseline = execFileSync('git', ['show', 'b21155e:猫猫TProxy.js'], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 }).replace(/\r\n/g, '\n');
const names = [];
visit(parse(baseline), node => {
  if (node.type === 'FunctionDeclaration' && node.id.name.startsWith('build')) names.push(node.id.name);
});
names.push('buildOwnedCoreFunctions', 'buildApiCurl');
function builders(text) {
  const extra = `const CLASH_DIR='/data/clash', CLASH_CORE=CLASH_DIR+'/Proxy/Clash.Core', CLASH_SERVICE=CLASH_DIR+'/Scripts/Clash.Service';\n`
    + slice('const buildOwnedCoreFunctions', 'const removePluginOwnedArtifactsCmd', text)
    + slice('function buildStatusSnapshotCommand()', 'async function readStatusSnapshot', text)
    + slice('const buildApiCurl =', 'const callMihomoApi =', text)
    + `\nbuildF50InstallScript.cleanupBuilders = {${names.join(',')}};`;
  return shellApi(text, extra).install.cleanupBuilders;
}
const before = builders(baseline);
const after = builders(source);
const service = quote('/data/clash/Scripts/Clash.Service');
const variants = {
  buildF50EmergencyScript: [[], ['', true], ['mm_fixture', true]],
  buildF50LeaseFunctions: [[true], [false]],
  buildF50ServiceCurlPatchScript: [[service]],
  buildF50OriginalServicePatchScript: [[service]],
  buildF50StartScript: [['start'], ['restart']],
  buildF50MaintenanceFunctions: ['all', 'start', 'inspect', 'install', 'cleanup', 'final', 'remove'].map(name => [name]),
  buildF50InstallScript: [['/data/upload.zip']],
  buildApiCurl: [['/version', 'GET', null, { apiBase: 'http://127.0.0.1:7788', secret: 'fixture' }],
    ['/configs', 'PATCH', { fixture: true }, { apiBase: 'http://127.0.0.1:7788', secret: 'fixture' }, '/data/api.out']],
};
for (const name of names) {
  test('cleanup preserves generated output / ' + name, () => {
    for (const args of variants[name] || [[]]) {
      const expected = before[name](...args), actual = after[name](...args);
      assert.deepEqual(plain(actual), plain(expected), name);
      if (name === 'buildF50PanelConfigCheck') continue;
      for (const script of Array.isArray(actual) ? actual.map(stage => stage.script) : [actual]) {
        syntax(script);
        const result = spawnSync(process.env.F50_BUSYBOX || 'busybox', ['ash', '-n'], { input: script, encoding: 'utf8' });
        assert.ifError(result.error);
        assert.equal(result.status, 0, result.stderr);
      }
    }
  });
}

test('cleanup changes only patch registry, diagnostic labels and Service text composition', () => {
  const functions = new Set(['buildF50HttpSubscriptionPatchScript', 'buildF50OriginalServicePatchScript', 'f50Diagnostic']);
  const constants = new Set(['F50_HTTP_CONTROLLER_PATCHES', 'F50_HTTP_CONTROLLER_PATCHED_HASH', 'F50_DIAGNOSTIC_LABELS']);
  function normalize(value) {
    if (Array.isArray(value)) return value.map(normalize).filter(value => value !== null);
    if (!value || typeof value !== 'object' || value instanceof RegExp) return value;
    if (value.type === 'FunctionDeclaration' && functions.has(value.id.name)) return { type: value.type, name: value.id.name };
    if (value.type === 'VariableDeclaration' && value.declarations.every(node => constants.has(node.id.name))) return null;
    return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, normalize(value)]));
  }
  assert.equal(semantics(normalize(parse(source))), semantics(normalize(parse(baseline))));
});

test('cleanup preserves all diagnostic labels and result fields', () => {
  const expectedLabels = run(slice('  const labels = {', '  let summary', baseline) + '\nlabels');
  const actualLabels = run(slice('const F50_DIAGNOSTIC_LABELS', 'function f50Diagnostic') + '\nF50_DIAGNOSTIC_LABELS');
  assert.deepEqual(plain(actualLabels), plain(expectedLabels));
  const context = { sanitizeSubscriptionSecrets: String };
  const oldDiagnostic = run(slice('function f50Diagnostic', 'function f50Error', baseline) + '\nf50Diagnostic', context);
  const newDiagnostic = run(slice('const F50_DIAGNOSTIC_LABELS', 'function f50Error') + '\nf50Diagnostic', context);
  const inputs = ['', 'timed out', 'F50_ERROR=unknown_cleanup_code', 'F50_ERROR=original_config_invalid\nF50_CONFIG_TEST_DETAIL=yaml: invalid mapping',
    'F50_ERROR=subscription URL must use HTTP(S), no userinfo.', 'secret: fixture-value\nhttps://example.invalid/private',
    'START_SERVICE_RC=124', 'F50_INSTALL_COMPONENTS_OK=1\nF50_INSTALL_TRANSACTION_STATE=finalize_failed\nF50_INSTALL_STATUS=installed_running',
    'ordinary output\n'.repeat(600)];
  for (const code of Object.keys(expectedLabels)) {
    for (const marker of ['F50_INSTALL_CODE', 'F50_START_CODE', 'F50_CLEAN_ERROR', 'KANO_INSTALL_ERROR', 'F50_ERROR']) {
      for (const rollback of ['', 'restored', 'restored_stopped', 'blocked_by_cleanup']) {
        inputs.push(`${marker}=${code}\nF50_ROLLBACK=${rollback}`);
      }
    }
  }
  for (const input of inputs) assert.deepEqual(plain(newDiagnostic(input, 'fallback')), plain(oldDiagnostic(input, 'fallback')));
  console.log(`diagnostic equivalence: ${inputs.length} inputs`);
});
