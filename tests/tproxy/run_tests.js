'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PLUGIN = path.join(ROOT, '猫猫TProxy.js');
const source = fs.readFileSync(PLUGIN, 'utf8').replace(/\r\n/g, '\n');
let pass = 0;
let fail = 0;

function check(condition, message, detail = '') {
  if (condition) {
    pass++;
    console.log(`  ✅ ${message}`);
    return;
  }
  fail++;
  console.log(`  ❌ ${message}${detail ? `: ${detail}` : ''}`);
}

function equal(actual, expected, message) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  check(left === right, message, `got=${left} want=${right}`);
}

function slice(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`missing source markers: ${start} -> ${end}`);
  return source.slice(from, to);
}

function runBlock(code, context = {}) {
  const sandbox = { console, ...context };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { timeout: 10000 });
  return sandbox;
}

console.log('--- source and package contract ---');
check(fs.existsSync(PLUGIN), '统一插件文件存在');
check(!fs.existsSync(path.join(ROOT, 'MaomaoTProxy_v7.4.5-rc3.js')), '旧 rc3 插件文件已移除');
try {
  new vm.Script(source, { filename: '猫猫TProxy.js' });
  check(true, '插件 JavaScript 语法有效');
} catch (error) {
  check(false, '插件 JavaScript 语法有效', error.message);
}
check(source.includes('猫猫TProxy v8.0.0-compat.2.3'), '插件版本为 v8.0.0-compat.2.3');
check(source.includes("const F50_COMPAT_VERSION = '8.0.0-compat.2.3'"), '前后端兼容版本固定');
check(source.includes('[ -s "$CFG" ] || { f50_install_fail configuration_missing; exit 1; }'), '安装要求初始 config.yaml 存在');
check(source.includes('sh -n "$PKG/Scripts/Clash.Service"'), '安装前校验 Clash.Service 语法');
check(source.includes('f50_install_fail panel_candidate_rejected'), '安装前拒绝错误面板');
check(source.includes('f50_install_fail panel_postcheck_failed'), '替换后再次校验面板');
check(source.includes('F50_ROLLBACK=restored'), '安装失败包含回滚确认');
check(!source.includes('F50 后台单文件上传上限为 10 MiB'), '未保留错误的 10 MiB 组件包提示');
check(source.includes('# KANO_DETACHED_TUN_CLEANUP=1'), '服务包装器包含 detached TUN 规则兼容清理');
check(source.includes('# KANO_IPV6_NAT_COMPAT=1'), '服务包装器包含 IPv6 NAT 能力降级');
check(source.includes('await normalizeIpv6DnsCapability(next)'), '保存网络设置前检查 IPv6 NAT 能力');
const packageService = spawnSync('tar', ['-xOf', path.join(ROOT, 'tproxy-yq.zip'), 'Scripts/Clash.Service'], { encoding: 'utf8' });
check(packageService.status === 0 && packageService.stdout.includes('# KANO_DETACHED_TUN_CLEANUP=1'), '组件包服务包装器同步包含兼容清理', packageService.stderr.trim());
check(packageService.status === 0 && packageService.stdout.includes('# KANO_IPV6_NAT_COMPAT=1'), '组件包支持缺少 IPv6 NAT 的设备', packageService.stderr.trim());

console.log('--- Zashboard identity and routing ---');
check(source.includes("const F50_ZASHBOARD_UI_URL = 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip'"), '面板更新源固定为 Zashboard');
check(source.includes("const ZASHBOARD_UI_DIR = 'WebUI/zashboard'"), '面板目录固定为 WebUI/zashboard');
check(source.includes("profile['unified-delay'] = true"), '固定运行配置启用 unified-delay');
check(source.includes("delete profile['external-ui-name']"), '固定运行配置删除 external-ui-name');
check(source.includes("/ui/?_f50=${Date.now()}#/"), '面板缓存参数位于 Hash 路由之前');
check(!source.includes('/ui/#/?t='), '旧的无效缓存参数路径已移除');
check(!source.includes('/settings?section=generalSettings'), '没有 MetaCubeXD settings 路由');
const panelValidator = slice('function buildF50ZashboardValidationFunction()', 'function buildF50MaintenanceFunctions()');
check(panelValidator.includes("<title>[[:space:]]*zashboard"), '面板校验要求 Zashboard 标题');
check(panelValidator.includes("<title>[[:space:]]*metacubexd"), '面板校验拒绝 MetaCubeXD');
check(panelValidator.includes('manifest.webmanifest') && panelValidator.includes('registerSW.js') && panelValidator.includes('missing_main_asset'), '面板校验覆盖入口、PWA 和主资源');

const dashboardCode = slice('const applyManagedDashboardFields', 'const applyRequiredF50Fields');
const dashboard = runBlock(`${dashboardCode}; this.apply = applyManagedDashboardFields;`, {
  ZASHBOARD_UI_DIR: 'WebUI/zashboard',
  ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
  assertYamlRootMap(value) { if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('not map'); },
});
const managedPanel = { 'external-ui': 'ui', 'external-ui-name': 'zashboard', 'external-ui-url': 'https://example.invalid/ui.zip' };
check(dashboard.apply(managedPanel), '旧托管面板配置会被修正');
equal([managedPanel['external-ui'], managedPanel['external-ui-url'], managedPanel['unified-delay']], [
  'WebUI/zashboard', 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip', true,
], '托管面板字段统一');
check(!Object.hasOwn(managedPanel, 'external-ui-name'), '托管面板不再生成嵌套目录');
const customPanel = { 'external-ui': '/custom/panel', 'external-ui-url': 'https://example.test/custom.zip' };
check(!dashboard.apply(customPanel) && customPanel['external-ui'] === '/custom/panel', '自定义面板路径不被误改');

console.log('--- generated maintenance shell ---');
const maintenanceSource = slice('function buildF50ZashboardValidationFunction()', 'function buildF50InspectScript()');
const maintenance = runBlock(`${maintenanceSource}; this.build = buildF50MaintenanceFunctions;`, {
  shellQuote: (value) => `'${String(value).replace(/'/g, `'"'"'`)}'`,
  F50_FILES_DIR: '/data/data/com.minikano.f50_sms/files',
  KANO_INSTALL_TOOLBOX_BIN: '/data/kano_tproxy_tools/bin',
});
const maintenanceShell = maintenance.build();
const shellSyntax = spawnSync('sh', ['-n'], { input: maintenanceShell, encoding: 'utf8' });
check(shellSyntax.status === 0, '维护和卸载 Shell 通过 sh -n', shellSyntax.stderr && shellSyntax.stderr.trim());
check(maintenanceShell.includes('f50_verify_zashboard_endpoint'), '启动验收包含面板 HTTP 检查');
check(maintenanceShell.includes('http://127.0.0.1:7788/ui/?_f50=$$'), '面板验收请求实际 /ui/ 服务入口');
check(maintenanceShell.includes('F50_START_CODE=panel_http_failed'), '面板不可访问会使启动失败');
check(maintenanceShell.includes('arg("iif");arg(d);arg("lookup");arg(t);print "!"'), 'TUN 规则删除只重建受支持字段');
check(!maintenanceShell.includes('for(i=2;i<=NF;i++)arg($i);'), '不把 ip rule 展示注释回放到删除命令');
check(maintenanceShell.includes('f50_drop_detached_tun_rules || return 1'), '启动前先清理 detached TUN 规则');
check(maintenanceShell.includes("grep -Fq 'iif KanoTun [detached] lookup 17667'"), 'detached 标记使用固定字符串匹配');
check(maintenanceShell.includes('f50_disable_unsupported_ipv6_dns_hijack || return 1'), '启动前降级不受支持的 IPv6 DNS 劫持');
const routePlanDir = fs.mkdtempSync(path.join(ROOT, '.tproxy-route-plan-'));
try {
  const ruleFile = path.join(routePlanDir, 'rules');
  const routeFile = path.join(routePlanDir, 'routes');
  const planFile = path.join(routePlanDir, 'plan');
  fs.writeFileSync(ruleFile, [
    '1776: from all iif KanoTun [detached] lookup 17667 proto static',
    '1777: from all fwmark 0x10000000/0x10000000 lookup 17666 proto static',
    '',
  ].join('\n'));
  fs.writeFileSync(routeFile, '');
  const routePlan = spawnSync('sh', ['-c', `${maintenanceShell}\nf50_routes_plan -4 "$1" "$2" "$3"\ncat "$3"`, 'sh', ruleFile, routeFile, planFile], { encoding: 'utf8' });
  check(routePlan.status === 0 && !routePlan.stdout.includes('[detached]') && routePlan.stdout.includes('aiif\naKanoTun\nalookup\na17667'), '含 [detached] 的 TUN 规则生成可执行删除计划', routePlan.stderr.trim());
  check(!routePlan.stdout.includes('proto') && routePlan.stdout.includes('afwmark\na0x10000000/0x10000000\nalookup\na17666'), 'TProxy 规则同样忽略展示附加字段', routePlan.stderr.trim());
  const compatRoot = path.join(routePlanDir, 'clash');
  const compatBin = path.join(routePlanDir, 'bin');
  fs.mkdirSync(path.join(compatRoot, 'Policy'), { recursive: true });
  fs.mkdirSync(compatBin, { recursive: true });
  const detachedLog = path.join(routePlanDir, 'detached.log');
  fs.writeFileSync(path.join(compatBin, 'ip'), `#!/bin/sh
case "$*" in
  "-4 rule show") echo "1776: from all iif KanoTun [detached] lookup 17667" ;;
  "-6 rule show") ;;
  "-4 rule del pref 1776 iif KanoTun lookup 17667") echo "$*" > "$F50_IP_LOG" ;;
  *) exit 9 ;;
esac
`);
  fs.chmodSync(path.join(compatBin, 'ip'), 0o755);
  const detached = spawnSync('sh', ['-c', `${maintenanceShell}
export PATH="$2:$PATH" F50_IP_LOG="$3"
f50_drop_detached_tun_rules
cat "$3"`, 'sh', compatRoot, compatBin, detachedLog], { encoding: 'utf8' });
  check(detached.status === 0 && detached.stdout.includes('-4 rule del pref 1776 iif KanoTun lookup 17667'), '启动兜底能删除带 [detached] 的 TUN 规则', detached.stderr.trim());
  fs.writeFileSync(path.join(compatRoot, 'Policy', 'options.conf'), 'traffic_mode=tproxy\nipv6=on\ndns_hijack=on\n');
  fs.writeFileSync(path.join(compatBin, 'ip6tables'), '#!/bin/sh\necho "ip6tables: Table does not exist" >&2\nexit 3\n');
  fs.chmodSync(path.join(compatBin, 'ip6tables'), 0o755);
  const compat = spawnSync('sh', ['-c', `${maintenanceShell}\nPATH="$2:$PATH" F50_ROOT="$1" f50_disable_unsupported_ipv6_dns_hijack\ncat "$1/Policy/options.conf"`, 'sh', compatRoot, compatBin], { encoding: 'utf8' });
  check(compat.status === 0 && compat.stdout.includes('F50_WARNING=ipv6_nat_unavailable_dns_hijack_disabled') && compat.stdout.includes('dns_hijack=off'), '缺少 IPv6 NAT 时自动关闭 DNS 劫持', compat.stderr.trim());
  fs.writeFileSync(path.join(compatRoot, 'Policy', 'options.conf'), 'traffic_mode=tproxy\nipv6=on\ndns_hijack=on\n');
  fs.writeFileSync(path.join(compatBin, 'ip6tables'), '#!/bin/sh\necho "xtables lock is busy" >&2\nexit 4\n');
  const transient = spawnSync('sh', ['-c', `${maintenanceShell}\nPATH="$2:$PATH" F50_ROOT="$1" f50_disable_unsupported_ipv6_dns_hijack\ncat "$1/Policy/options.conf"`, 'sh', compatRoot, compatBin], { encoding: 'utf8' });
  check(transient.status === 0 && !transient.stdout.includes('F50_WARNING=') && transient.stdout.includes('dns_hijack=on'), '临时 ip6tables 错误不会关闭 DNS 劫持', transient.stderr.trim());
} finally {
  fs.rmSync(routePlanDir, { recursive: true, force: true });
}
check(source.includes('F50_UNINSTALL_STATE=clean'), '卸载包含最终清洁状态');

console.log('--- subscription sources ---');
const subscriptionHelpers = slice('const providerNameFor', 'const normalizeSubRuleModeValue');
const providerBuilder = slice('const buildManagedProxyProviders', 'const buildManagedRuleProviders');
const subscriptions = runBlock(`${subscriptionHelpers}\n${providerBuilder}; this.api = { normalizeStoredSubSourceList, normalizeSubSourceList, buildSubUrlsFileText, parseStoredSubSourcesFromText, buildManagedProxyProviders };`, {
  SUB_RULE_MODE_TEMPLATE: 'template',
  SUB_RULE_MODE_ORIGINAL: 'original',
  SUB_CONVERT_MODE_PROVIDER: 'provider',
  SUB_DISABLED_MARKER: '# KANO_DISABLED_SUB=',
  normalizeSubRuleModeValue(value) { return value === 'original' ? 'original' : 'template'; },
  normalizeSubConvertModeValue(value) { return value === 'local' ? 'local' : 'provider'; },
  isHttpUrl(value) { return /^https?:\/\//.test(String(value)); },
  currentProviderUserAgent: 'mihomo',
});
const multipleSources = [
  { url: 'https://one.example/sub', enabled: true },
  { url: 'https://two.example/sub', enabled: true },
  { url: 'https://three.example/sub', enabled: true },
  { url: 'https://four.example/sub', enabled: true },
];
const providers = subscriptions.api.buildManagedProxyProviders(multipleSources);
equal(Object.keys(providers), ['Provider1', 'Provider2', 'Provider3', 'Provider4'], '任意多个订阅按顺序生成 Provider');
equal(Object.values(providers).map((provider) => provider.url), multipleSources.map((item) => item.url), '所有 Provider 保留各自订阅地址');
equal(Object.values(providers).map((provider) => provider.path), [
  './proxies/Provider1.yaml', './proxies/Provider2.yaml', './proxies/Provider3.yaml', './proxies/Provider4.yaml',
], '所有 Provider 使用独立缓存文件');
const storedText = subscriptions.api.buildSubUrlsFileText([...multipleSources, { url: 'https://off.example/sub', enabled: false }]);
check(multipleSources.every((item, index) => storedText.includes(`${item.url} Provider${index + 1}`)), '订阅文件连续命名全部启用来源');
check(storedText.includes('# KANO_DISABLED_SUB=https://off.example/sub'), '订阅文件保留禁用来源');
equal(subscriptions.api.parseStoredSubSourcesFromText(storedText).map((item) => item.enabled), [true, true, true, true, false], '订阅文件可无损读回全部启用状态');
check(source.includes('\\u591a\\u6761\\u94fe\\u63a5\\u53ea\\u80fd\\u4f7f\\u7528\\u672c\\u5730\\u6a21\\u677f'), '界面明确说明多订阅使用本地模板');

console.log('--- provider groups and traffic modes ---');
const groupsSource = slice('const normalizeManagedProxyGroups', 'const MANAGED_RULE_SET_PATTERN');
const groups = runBlock(`${groupsSource}; this.normalize = normalizeManagedProxyGroups;`, {
  cloneJsonValue: (value) => JSON.parse(JSON.stringify(value)),
  isPlainYamlObject: (value) => !!value && typeof value === 'object' && !Array.isArray(value),
});
const groupConfig = { 'proxy-groups': [{ name: 'Proxy', type: 'select', use: ['Old'] }] };
groups.normalize(groupConfig, ['Provider1', 'Provider2', 'Provider3', 'Provider4']);
equal(groupConfig['proxy-groups'][0].use, ['Provider1', 'Provider2', 'Provider3', 'Provider4'], '策略组同时引用全部 Provider');

const profileMatch = source.match(/^const F50_FIXED_PROFILES = (.+);$/m);
if (!profileMatch) throw new Error('missing F50_FIXED_PROFILES');
const profiles = JSON.parse(profileMatch[1]);
equal(Object.keys(profiles), ['tproxy4', 'tproxy6', 'tun4', 'tun6', 'off4', 'off6'], '固定配置覆盖三种模式和双栈');
check(Object.values(profiles).every((profile) => profile['external-ui'] === 'WebUI/zashboard'), '所有固定配置使用同一面板目录');
const kprSource = slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later');
const kpr = runBlock(`${kprSource}; this.KPR = createPrivateRouteLogic();`, { F50_FIXED_PROFILES: profiles }).KPR;
const baseConfig = {
  proxies: [],
  'proxy-groups': [{ name: 'Proxy', type: 'select', proxies: ['DIRECT'] }],
  rules: ['MATCH,Proxy'],
};
const tproxy = kpr.runtime(baseConfig, { traffic_mode: 'tproxy', ipv6: 'off' });
equal([tproxy['tproxy-port'], tproxy.tun.enable, tproxy.ipv6], [7895, false, false], 'TProxy IPv4 使用固定端口并关闭 TUN');
const tun = kpr.runtime(baseConfig, { traffic_mode: 'tun', ipv6: 'on' });
check(tun.tun.enable === true && tun.tun.device === 'KanoTun' && tun.ipv6 === true, 'TUN IPv6 配置完整');
const off = kpr.runtime(baseConfig, { traffic_mode: 'off', ipv6: 'off' });
check(off.tun.enable === false && off['tproxy-port'] === 0, '关闭接管时停用 TUN 和 TProxy');
const privateRoute = kpr.runtime(baseConfig, {
  traffic_mode: 'tproxy', ipv6: 'off', private_route_enabled: 'on',
  private_route_cidrs: '192.168.11.0/24', private_route_policy: 'Proxy',
});
check(privateRoute.rules[0] === 'IP-CIDR,192.168.11.0/24,Proxy,no-resolve', '私网定向代理规则位于规则首部');
check(privateRoute['x-kano-private-route']?.policy === 'Proxy', '私网定向代理写入可回滚元数据');

console.log('--- diagnostics and uninstall verdict ---');
const diagnosticSource = slice('let lastInstallDiagnostic', 'async function performF50Uninstall()');
const diagnostics = runBlock(`${diagnosticSource}; this.api = { f50Diagnostic, f50StartResult, f50UninstallVerdict };`, {
  sanitizeSubscriptionSecrets: (value) => String(value),
  buildF50MaintenanceFunctions: () => '',
  shellQuote: (value) => `'${value}'`,
});
const started = diagnostics.api.f50StartResult({ success: true, content: 'START_STATE=started_verified_process\nF50_START_CODE=started\nF50_START_OK=1' });
check(started.ok && started.code === 'started', '启动结果必须包含稳定进程和成功标记');
const panelFailed = diagnostics.api.f50StartResult({ success: true, content: 'F50_ERROR=panel_http_status_404\nF50_START_OK=0\nF50_START_CODE=panel_http_failed' });
check(!panelFailed.ok && panelFailed.code === 'panel_http_failed', '面板 404 不会被报告为启动成功');
const clean = diagnostics.api.f50UninstallVerdict({ content: 'F50_UNINSTALL_STATE=clean\nUNINSTALL_VERIFIED' });
check(clean.ok && clean.code === 'clean', '卸载仅在最终复查干净时成功');
const residual = diagnostics.api.f50UninstallVerdict({ content: 'F50_REMAINS=process:123\nF50_UNINSTALL_STATE=residual' });
check(!residual.ok && residual.code === 'residual', '卸载发现残留时失败');

console.log(`\n================ ${pass} passed / ${fail} failed ================`);
process.exit(fail ? 1 : 0);
