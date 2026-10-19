'use strict';

const test = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');
const { parse, visit } = require('../../scripts/compact_plugin');
const { fs, assert, source, slice, run, shell, shellApi, syntax, plain, quote, temp, write } = require('./optimization_harness');
const baseline = execFileSync('git', ['show', 'b21155e:猫猫TProxy.js'], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 }).replace(/\r\n/g, '\n');
const contracts=require('../gist-sync/expected-contracts.json');
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
  test('generated Shell parses / ' + name, () => {
    for (const args of variants[name] || [[]]) {
      const actual = after[name](...args);
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

for (const committed of [false, true]) test('configuration recovery ' + (committed ? 'keeps committed files' : 'restores both files'), () => {
  const dir = temp();
  try {
    const target = write(dir, 'config.yaml', 'new config\n'), sourceFile = write(dir, 'source.conf', 'new source\n');
    const tx = target + '.kano_tx';
    write(tx, 'format', 'F50_CONFIG_TX_V1\n');
    for (const marker of ['ready', 'with_source', 'config.had', 'source.had', ...(committed ? ['committed'] : [])]) write(tx, marker, '');
    write(tx, 'config', 'old config\n');
    write(tx, 'source', 'old source\n');
    const result = shell(after.buildF50ConfigTransactionFunctions() + `\nf50_config_tx_recover ${quote(target)} ${quote(sourceFile)}\n`);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(fs.readFileSync(target, 'utf8'), committed ? 'new config\n' : 'old config\n');
    assert.equal(fs.readFileSync(sourceFile, 'utf8'), committed ? 'new source\n' : 'old source\n');
    assert.deepEqual(fs.readdirSync(dir).sort(), ['config.yaml', 'source.conf']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('cleanup preserves all diagnostic labels and result fields', () => {
  const expectedLabels = run(slice('  const labels = {', '  let summary', baseline) + '\nlabels');
  for (const key of contracts.removedLabels) delete expectedLabels[key];
  const actualLabels = run(slice('const F50_DIAGNOSTIC_LABELS', 'function f50Diagnostic') + '\nF50_DIAGNOSTIC_LABELS');
  assert.deepEqual(plain(actualLabels), {...plain(expectedLabels),...contracts.labels});
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
  // 文案允许随产品调整；标签表由上面的契约断言锁定，这里锁定诊断字段与特殊分支语义。
  for (const input of inputs) {
    const beforeFields = plain(oldDiagnostic(input, 'fallback'));
    const afterFields = plain(newDiagnostic(input, 'fallback'));
    const summary = afterFields.summary;
    delete beforeFields.summary;
    delete afterFields.summary;
    assert.deepEqual(afterFields, beforeFields, input.slice(0, 80));
    assert.equal(typeof summary, 'string');
    assert.ok(summary.trim().length > 0);
    assert.ok(summary.length <= 280);
  }
  // 文案可以调整，但特殊分支仍必须描述正确的失败原因。
  for (const [input, pattern] of [
    ['timed out', /超时/],
    ['F50_ERROR=original_config_invalid\nF50_CONFIG_TEST_DETAIL=yaml: invalid mapping', /核心校验/],
    ['F50_ERROR=subscription URL must use HTTP(S), no userinfo.', /订阅地址/],
    ['START_SERVICE_RC=124', /超时/],
    ['F50_ERROR=unknown_cleanup_code\nF50_ROLLBACK=blocked_by_cleanup', /回滚失败.*blocked_by_cleanup/],
    ['F50_ERROR=unknown_cleanup_code\nF50_ROLLBACK=restored', /已恢复安装前状态/],
    ['F50_INSTALL_COMPONENTS_OK=1\nF50_INSTALL_TRANSACTION_STATE=finalize_failed\nF50_INSTALL_STATUS=installed_running', /组件已安装并启动.*事务收尾失败.*组件未回滚/],
    ['F50_INSTALL_COMPONENTS_OK=1\nF50_INSTALL_TRANSACTION_STATE=finalize_failed\nF50_INSTALL_STATUS=installed_stopped', /组件已安装，核心保持停止.*事务收尾失败.*组件未回滚/],
  ]) assert.match(newDiagnostic(input, 'fallback').summary, pattern);
  assert.doesNotMatch(
    newDiagnostic('secret: fixture-value\nhttps://example.invalid/private', 'fallback').summary,
    /fixture-value|example\.invalid/,
  );
  console.log(`diagnostic field equivalence: ${inputs.length} inputs`);
});
