'use strict';

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const { parse, visit, compact } = require('./compact_plugin');
const { shellApi, original, source, root } = require('../tests/tproxy/optimization_harness');
const baseline = execFileSync('git', ['show', 'e5e8568:猫猫TProxy.js'], { cwd: root, encoding: 'utf8' });
function definitions(text) {
  const out = new Map();
  visit(parse(text), node => {
    let name;
    if (node.type === 'FunctionDeclaration') name = node.id?.name;
    if (node.type === 'VariableDeclarator' && ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.init?.type)) name = node.id.name;
    if (node.type === 'AssignmentExpression' && ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.right?.type)) name = node.left.type === 'Identifier' ? node.left.name : text.slice(node.left.start, node.left.end);
    if (name) out.set(name, [node.start, node.end]);
  });
  return out;
}
const groups = {
  '旧模式与显式迁移': ['validateSubscriptionMode', 'normalizeSubRuleModeValue', 'validateOriginalSubscriptionConfig', 'writeOriginalSubscriptionConfig', 'convertSubscriptionsLocally', 'inspectSubscriptionRuntimeConfig', 'showSubscriptionUpdateSelfCheck', 'refreshSubscriptionAfterRestore', 'updateSubProviders', 'readCurrentSubSources', 'writeSubConfigByMode', 'saveSubSources', 'overwriteConfigByTemplate', 'importSub', 'updateSubBtn.onclick'],
  'UI / 覆写配置去重': ['saveRuleOverrideConfig', 'saveOverrideText', 'saveJsOverrideText'],
  'Service 兼容层与安装调用': ['buildF50OriginalConfigFunctions', 'buildF50OriginalServicePatchScript', 'buildF50ServiceCurlPatchScript', 'buildF50HttpSubscriptionPatchScript', 'buildF50Tun6CompatFunctions', 'buildF50Ipv6DnsCompatFunctions', 'buildF50StartHelpers', 'buildF50InstallScript'],
  '模板事务': ['prepareTemplateFromBase', 'applyJsOverrideToTemplate', 'ensureTemplateForF50', 'commitStagedYaml', 'ensureTemplateProviders', 'saveTemplate'],
  '任务回执与恢复': ['buildF50RecoveryEligibilityFunctions', 'buildF50EmergencyScript', 'runShellWithRoot'],
  'JS 覆写能力校验': ['normalizeOverrideJs', 'validateOverrideJsSafety', 'runJsOverrideOnConfig'],
  '面板 manifest': ['buildF50ZashboardValidationFunction'],
  '旧模式删除后的死代码': ['ensureYqRuntime'],
};
const beforeDefinitions = definitions(baseline), afterDefinitions = definitions(source);
const bytes = (text, map, names) => names.reduce((sum, name) => { const range = map.get(name); return sum + (range ? Buffer.byteLength(text.slice(...range)) : 0); }, 0);
const modules = Object.entries(groups).map(([module, names]) => ({ module, before: bytes(baseline, beforeDefinitions, names), after: bytes(source, afterDefinitions, names) }));
modules.push({ module: '其余调用点与常量', before: Buffer.byteLength(baseline) - modules.reduce((sum, row) => sum + row.before, 0), after: Buffer.byteLength(source) - modules.reduce((sum, row) => sum + row.after, 0) });
for (const row of modules) row.saved = row.before - row.after;
function outputs(text) {
  const api = shellApi(text, 'buildF50InstallScript.outputHelpers = {http:buildF50HttpSubscriptionPatchScript,tun6:buildF50Tun6CompatFunctions,dns:buildF50Ipv6DnsCompatFunctions};');
  const helpers = api.install.outputHelpers;
  return { install: api.install('/data/upload.zip'), start: api.start('start'), restart: api.start('restart'),
    emergency: api.emergency('', true), service: api.patch("'/data/clash/Scripts/Clash.Service'"),
    http: helpers.http(), tun6: helpers.tun6(), dns: helpers.dns(), lease: api.lease(), transaction: api.transaction(), cleanup: api.cleanup() };
}
const before = outputs(original), after = outputs(source);
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const shell = Object.keys(before).map(name => ({ name, before: Buffer.byteLength(before[name]), after: Buffer.byteLength(after[name]), saved: Buffer.byteLength(before[name]) - Buffer.byteLength(after[name]), beforeSHA256: hash(before[name]), afterSHA256: hash(after[name]) }));
const functions = text => { let count = 0; visit(parse(text), node => { if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) count++; }); return count; };
const metrics = { baseline: 'd89be0133be57d17fd667e4e6f48f239d626e5e5', pureCommit: 'e5e8568',
  sourceBaseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  format: compact(original.replace(/\n/g, '\r\n')).sizes, final: Buffer.byteLength(source), sha256: hash(source),
  functionsBefore: functions(original), functionsAfter: functions(source), modules, shell };
fs.writeFileSync(require('node:path').join(root, 'reports/v9.0.0-size.json'), JSON.stringify(metrics, null, 2) + '\n');
console.log(JSON.stringify({ format: metrics.format, final: metrics.final, functions: [metrics.functionsBefore, metrics.functionsAfter], modules,
  shell: shell.map(({ name, before, after, saved }) => ({ name, before, after, saved })) }));
