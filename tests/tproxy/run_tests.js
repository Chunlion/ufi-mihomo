'use strict';
// 把 猫猫TProxy.js / 猫猫TProxy_Go.js 当成真实插件加载起来（DOM + 宿主 API 全部打桩），
// 然后针对本轮修复的每个函数做行为断言。宿主 shell 调用被拦截并按用例返回伪造结果。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = {
  shell: path.join(ROOT, '猫猫TProxy.js'),
  go: path.join(ROOT, '猫猫TProxy_Go.js'),
};

let pass = 0;
let fail = 0;
const chk = (actual, expected, msg) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✅' : '❌'} ${msg}${ok ? '' : `  got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`}`);
};

// ---- 最小 DOM / 宿主打桩 ------------------------------------------------
function makeElement(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
    children: [], style: {}, classList: { add() {}, remove() {}, contains: () => false },
    dataset: {}, _text: '', _html: '',
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._html; }, set innerHTML(v) { this._html = String(v); },
    get value() { return this._value || ''; }, set value(v) { this._value = v; },
    appendChild(c) { this.children.push(c); return c; },
    insertAdjacentHTML() {}, insertAdjacentElement() {}, addEventListener() {},
    removeEventListener() {}, remove() {}, click() {}, setAttribute() {}, getAttribute: () => null,
    querySelector: () => null, querySelectorAll: () => [], closest: () => null, focus() {}, blur() {},
  };
  return el;
}

function buildContext(shellHandler) {
  const doc = {
    createElement: (t) => makeElement(t),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    head: makeElement('head'),
    body: makeElement('body'),
    addEventListener() {},
    documentElement: makeElement('html'),
  };
  const ctx = {
    console: { log() {}, error() {}, warn() {}, info() {} },
    document: doc,
    window: null,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: { hostname: '192.168.0.1', href: 'http://192.168.0.1:2333/' },
    navigator: { userAgent: 'test' },
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 0; },
    clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    fetch: async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => '' }),
    FormData: class { append() {} },
    Date, Math, JSON, String, Number, Boolean, Array, Object, Promise, RegExp, Error, Set, Map,
    encodeURIComponent, decodeURIComponent, parseInt, parseFloat, isNaN,
    // 宿主 API
    runShellWithRoot: async (cmd, timeout) => shellHandler(cmd, timeout),
    runDangerousShellWithRoot: async (cmd, timeout) => shellHandler(cmd, timeout),
    createToast: (...a) => { ctx.__toasts.push(a[0]); },
    UFI_DATA: { lan_ipaddr: '192.168.0.1' },
    __toasts: [],
    __captured: null,
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  return ctx;
}

// 插件是 IIFE，内部函数不外泄。用「在源码尾部注入导出钩子」的方式取出待测函数。
function loadPlugin(file, shellHandler, exportNames) {
  let src = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  src = src.replace(/^\/\/<script>/, '').replace(/\/\/<\/script\s*>\s*$/, '');
  // 待测函数都定义在最外层 IIFE 的顶层作用域。把导出钩子插到最外层 IIFE 的收尾 '})();' 之前，
  // 且必须在其内部所有嵌套 IIFE 之后，这样定义已全部执行完毕。
  const hook = `\n;globalThis.__captured = { ${exportNames.map((n) => `${n}: (typeof ${n} !== 'undefined' ? ${n} : undefined)`).join(', ')} };\n`;
  const tail = src.lastIndexOf('})();');
  if (tail < 0) throw new Error('IIFE tail not found in ' + file);
  src = src.slice(0, tail) + hook + src.slice(tail);

  const ctx = buildContext(shellHandler);
  vm.createContext(ctx);
  try {
    vm.runInContext(src, ctx, { filename: path.basename(file), timeout: 20000 });
  } catch (e) {
    throw new Error(`plugin threw during load: ${e.message}`);
  }
  return { ctx, api: ctx.__captured || {} };
}

// ---- 用例 ---------------------------------------------------------------
const EXPORTS = [
  'removeLegacyManagedRulePrefix', 'applyManagedRules', 'validateManagedConfigObject',
  'yamlHasGeneratedMarker', 'createConfigRollbackPoint', 'buildManagedFallbackRules',
  'buildManagedRuleProviders', 'isPlainYamlObject',
];

function runFor(label, file) {
  console.log(`\n######## ${label} (${path.basename(file)}) ########`);
  const source = fs.readFileSync(file, 'utf8');
  let shellReply = { success: true, content: '' };
  const handler = async () => shellReply;
  const { api } = loadPlugin(file, handler, EXPORTS);

  const missing = EXPORTS.filter((n) => typeof api[n] === 'undefined');
  chk(missing, [], `全部待测函数均已导出 (${EXPORTS.length} 个)`);
  if (missing.length) return;

  console.log('--- installer controller hardening ---');
  chk(
    source.includes('arm64-v8a|aarch64|armv8*|*arm64*')
      && source.includes('armeabi-v7a|armeabi|armv7*|armv6*'),
    true,
    'ABI mapping covers Android and uname ARM variants',
  );
  chk(
    source.includes('FALLBACK_CONTROLLER="$PACKAGE_ROOT/Scripts/clashctl"')
      && source.includes('ln -s "$controller_name" "$FALLBACK_CONTROLLER"'),
    true,
    'package creates a compatible generic controller fallback',
  );
  const stagedProbe = source.indexOf('INSTALL_VERIFY_FAILED: clash controller cannot execute on ABI');
  const packageCommit = source.indexOf('INSTALL_PACKAGE_COMMITTED', stagedProbe);
  chk(stagedProbe >= 0 && packageCommit > stagedProbe, true, 'staged controller is executed before package commit');
  chk(
    source.includes('INSTALL_PERMISSION_FAILED: controller is not executable')
      && source.includes('INSTALL_PERMISSION_FAILED: Clash.Service cannot resolve controller'),
    true,
    'installed controller and service wrapper are checked after chmod',
  );
  const permissionProbe = source.indexOf('INSTALL_PERMISSION_FAILED: Clash.Service cannot resolve controller');
  const serviceStart = source.indexOf('${shellQuote(CLASH_SERVICE)} start', permissionProbe);
  chk(
    permissionProbe >= 0 && serviceStart >= 0 && permissionProbe < serviceStart,
    true,
    'controller preflight runs before the first service start',
  );

  console.log('--- #9 托管规则清理 ---');
  const fb = api.buildManagedFallbackRules('Proxy'); // 13 条，末条即 MATCH,<group>
  chk(fb.length, 13, 'buildManagedFallbackRules 返回 13 条（末条为 MATCH）');
  chk(api.removeLegacyManagedRulePrefix(['MATCH,Proxy', 'DOMAIN,a.com,DIRECT'], 'Proxy'),
    ['MATCH,Proxy', 'DOMAIN,a.com,DIRECT'], '用户模板的 MATCH,Proxy 不再被误删');
  chk(api.removeLegacyManagedRulePrefix(['DOMAIN,x,DIRECT', 'RULE-SET,kano_direct_ip,DIRECT'], 'Proxy'),
    ['DOMAIN,x,DIRECT'], '悬空 RULE-SET,kano_* 被清除');
  chk(api.removeLegacyManagedRulePrefix([...fb, 'DOMAIN,keep,DIRECT'], 'Proxy'),
    ['DOMAIN,keep,DIRECT'], '完整托管前缀+MATCH 正确剥离');
  chk(api.removeLegacyManagedRulePrefix([...fb], 'Proxy'), [], '纯托管规则 -> 空（交由调用方重建）');

  console.log('--- #9 空规则触发重建而非提交空配置 ---');
  const cfg = { rules: [...fb], 'rule-providers': { kano_direct_ip: { path: 'x' } } };
  api.applyManagedRules(cfg, { generated: false, proxyGroup: 'Proxy' });
  chk(cfg.rules.length > 0, true, '清空后自动重建托管规则（不提交空 rules）');
  chk(api.isPlainYamlObject(cfg['rule-providers']) && Object.keys(cfg['rule-providers']).length > 0,
    true, '同时重建 rule-providers');

  console.log('--- #9 validate 拒绝空 rules ---');
  let threw = '';
  try {
    api.validateManagedConfigObject({ proxies: [], 'proxy-groups': [{ name: 'Proxy' }], rules: [], 'proxy-providers': {} },
      { expectedProviderCount: 0, requireProviderUrls: false });
  } catch (e) { threw = e.message; }
  chk(/rules 为空/.test(threw), true, '空 rules 被拒绝: ' + (threw || '(未抛出)'));

  console.log('--- #18 yamlHasGeneratedMarker 三态 ---');
  return (async () => {
    shellReply = { success: true, content: '1' };
    chk(await api.yamlHasGeneratedMarker('/x'), true, 'shell 成功且有标记 -> true');
    shellReply = { success: true, content: '0' };
    chk(await api.yamlHasGeneratedMarker('/x'), false, 'shell 成功无标记 -> false');
    shellReply = { success: false, content: '' };
    chk(await api.yamlHasGeneratedMarker('/x'), null, 'shell 失败 -> null（旧版会误判为 false 并抹掉标记）');

    console.log('--- #20 createConfigRollbackPoint 三态 ---');
    shellReply = { success: true, content: 'CONFIG_ROLLBACK=/data/clash/Proxy/config.yaml.before_x' };
    chk(await api.createConfigRollbackPoint('x'), '/data/clash/Proxy/config.yaml.before_x', '有旧配置 -> 备份路径');
    shellReply = { success: true, content: 'CONFIG_ROLLBACK=' };
    chk(await api.createConfigRollbackPoint('x'), '', '无旧配置 -> 空串（合法，非失败）');
    shellReply = { success: false, content: 'boom' };
    chk(await api.createConfigRollbackPoint('x'), null, 'shell 失败 -> null（可与"无旧配置"区分）');
    shellReply = { success: true, content: 'garbage-without-marker' };
    chk(await api.createConfigRollbackPoint('x'), null, '输出缺少标记行 -> null');
  })();
}

(async () => {
  await runFor('Shell 版', FILES.shell);
  await runFor('Go 版', FILES.go);
  console.log(`\n================ 结果: ${pass} 通过 / ${fail} 失败 ================`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('harness error:', e.message); process.exit(2); });
