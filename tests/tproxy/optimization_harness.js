'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const original = fs.readFileSync(path.join(root, '猫猫TProxy.js'), 'utf8').replace(/\r\n/g, '\n');
const source = fs.readFileSync(path.join(root, '猫猫TProxy_Optimized.js'), 'utf8').replace(/\r\n/g, '\n');
const quote = value => `'${String(value).replace(/\\/g, '/').replace(/'/g, `'"'"'`)}'`;
const plain = value => JSON.parse(JSON.stringify(value));
function slice(start, end, text = source) {
  const from = text.indexOf(start), to = text.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing markers: ${start} -> ${end}`);
  return text.slice(from, to);
}
function run(code, context = {}) {
  return vm.runInNewContext(code, { console, ...context }, { timeout: 10000 });
}
function shell(input, env = {}) {
  const result = spawnSync('sh', ['-s'], { input, encoding: 'utf8', timeout: 30000,
    env: { ...process.env, ...env } });
  assert.ifError(result.error);
  return result;
}
function syntax(input) {
  const result = spawnSync('sh', ['-n'], { input, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
function shellApi(text = source, extra = '') {
  return run(slice('const F50_PORTS', 'const F50_COMPAT_VERSION', text)
    + slice('const F50_ORIGINAL_MANAGED_KEYS', 'let f50BackendReady', text)
    + slice('const rotateClashLogCmd', 'async function installF50PackageAtDevicePath', text)
      .replace('const rotateClashLogCmd =', 'let rotateClashLogCmd =')
      .replace('const dataSpaceGuardCmd =', 'let dataSpaceGuardCmd =')
    + slice('function buildF50CleanupScript()', 'let refreshDashboardAfterModeChange', text)
    + extra + '\n({maintenance:buildF50MaintenanceFunctions, start:buildF50StartScript, inspect:buildF50InspectScript, install:buildF50InstallScript, cleanup:buildF50CleanupScript, final:buildF50FinalCheckScript, uninstall:buildUninstallStages})', {
      shellQuote: quote, F50_FILES_DIR: '/data/data/com.minikano.f50_sms/files',
      KANO_INSTALL_TOOLBOX_BIN: '/data/kano_tproxy_tools/bin', BOOT_FILE: '/sdcard/ufi_tools_boot.sh',
      F50_ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
      removeBootLinesCmd: () => ':', removePluginOwnedArtifactsCmd: () => ':',
    });
}
const subContext = {
  SUB_RULE_MODE_TEMPLATE: 'template', SUB_RULE_MODE_ORIGINAL: 'original',
  SUB_CONVERT_MODE_PROVIDER: 'provider', SUB_CONVERT_MODE_LOCAL: 'local',
  SUB_DISABLED_MARKER: '# KANO_DISABLED_SUB=', CLASH_CONFIG: '/data/clash/Proxy/config.yaml',
  CLASH_SUB_URLS: '/data/clash/Proxy/subscription_urls.txt',
  isHttpUrl: value => /^https?:\/\//.test(value),
  operationStage() {}, operationFinish() {}, createToast() {}, appendTemplateFlowDebug() {},
  safeTextToHtml: String, escapeHtml: String, sanitizeSubscriptionSecrets: String,
};
function subscriptionApi(extra = '', context = {}) {
  return run(slice('const providerNameFor', 'const readConfigSource')
    + slice('const normalizeSubConvertModeValue', 'const fileSnapshotHelpersCmd')
    + extra, { ...subContext, shellQuote: quote, ...context });
}
function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'f50-optimization-')); }
function write(dir, relative, text) {
  const file = path.join(dir, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return file;
}
module.exports = { fs, path, vm, assert, root, source, original, slice, run, shell, syntax, shellApi,
  subContext, subscriptionApi, plain, quote, temp, write };
