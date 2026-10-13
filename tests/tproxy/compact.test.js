'use strict';

const test = require('node:test');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { compact } = require('../../scripts/compact_plugin');
const { assert, original, shellApi, slice, run, quote, syntax } = require('./optimization_harness');
const compacted = compact(original).source;
function generators(text) {
  return run(slice('const F50_ZASHBOARD_UI_URL', 'let f50BackendReady', text)
    + slice('const rotateClashLogCmd', 'async function installF50PackageAtDevicePath', text)
    + '\n({install:buildF50InstallScript,start:buildF50StartScript,emergency:buildF50EmergencyScript,service:buildF50OriginalServicePatchScript,http:buildF50HttpSubscriptionPatchScript,tun6:buildF50Tun6CompatFunctions,dns:buildF50Ipv6DnsCompatFunctions,lease:buildF50LeaseFunctions,transaction:buildF50ConfigTransactionFunctions})', {
      shellQuote: quote, F50_FILES_DIR: '/data/data/com.minikano.f50_sms/files',
      KANO_INSTALL_TOOLBOX_BIN: '/data/kano_tproxy_tools/bin',
    });
}
function outputs(text) {
  const api = generators(text), maintenance = shellApi(text);
  return {
    install: api.install('/data/upload.zip'), start: api.start('start'), restart: api.start('restart'),
    emergency: api.emergency('', true), service: api.service("'/data/clash/Scripts/Clash.Service'"),
    http: api.http(), tun6: api.tun6(), dns: api.dns(), lease: api.lease(),
    transaction: api.transaction(), cleanup: maintenance.cleanup(),
  };
}
test('pure compaction preserves all 11 generated shell groups byte for byte', () => {
  const before = outputs(original), after = outputs(compacted);
  for (const name of Object.keys(before)) {
    assert.equal(after[name], before[name], name);
    syntax(after[name]);
    const ash = spawnSync(process.env.F50_BUSYBOX || 'busybox', ['ash', '-n'], { input: after[name], encoding: 'utf8' });
    assert.ifError(ash.error);
    assert.equal(ash.status, 0, ash.stderr);
    console.log(name, Buffer.byteLength(after[name]), crypto.createHash('sha256').update(after[name]).digest('hex'));
  }
  assert.ok(!compacted.includes('\r'));
  assert.ok(!compacted.includes('const setConfigSourceCmd'));
  assert.ok(!compacted.includes('const componentsGroup'));
  assert.ok(compacted.includes("appendActionGroup('组件与维护'"));
  assert.ok(compacted.endsWith('//</script >\n'));
});
test('compaction leaves tagged raw strings, escaped backslashes and regular expressions intact', () => {
  const input = '//<script>\r\nconst tag = parts => parts.raw;\r\nconst a = "\\u4e2d";\r\nconst b = "\\\\u4e2d";\r\nconst c = /\\u4e2d/;\r\nconst d = tag`\\u4e2d`;\r\n//</script >\r\n/* GNU AFFERO GENERAL PUBLIC LICENSE */\r\n';
  const result = compact(input).source;
  assert.ok(result.includes('const a = "中"'));
  assert.ok(result.includes('const b = "\\\\u4e2d"'));
  assert.ok(result.includes('const c = /\\u4e2d/'));
  assert.ok(result.includes('tag`\\u4e2d`'));
});
module.exports = { generators, outputs };
