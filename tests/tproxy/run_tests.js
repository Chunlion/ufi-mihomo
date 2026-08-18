'use strict';
// 把统一版 猫猫TProxy.js 当成真实插件加载起来（DOM + 宿主 API 全部打桩），
// 然后针对本轮修复的每个函数做行为断言。宿主 shell 调用被拦截并按用例返回伪造结果。
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = {
  plugin: path.join(ROOT, '猫猫TProxy.js'),
  helper: path.join(ROOT, 'dist', 'kano-f50-helper-linux-arm64'),
  package: path.join(ROOT, 'tproxy-yq.zip'),
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
    Date, Math, JSON, String, Number, Boolean, Array, Object, Promise, RegExp, Error, Set, Map, URL,
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
function loadPlugin(file, shellHandler, exportNames, { lexicalHostOnly = false } = {}) {
  let src = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  src = src.replace(/^\/\/<script>/, '').replace(/\/\/<\/script\s*>\s*$/, '');
  // 待测函数都定义在最外层 IIFE 的顶层作用域。把导出钩子插到最外层 IIFE 的收尾之前，
  // 且必须在其内部所有嵌套 IIFE 之后，这样定义已全部执行完毕。
  const hook = `\n;globalThis.__captured = { ${exportNames.map((n) => `${n}: (typeof ${n} !== 'undefined' ? ${n} : undefined)`).join(', ')} };\n`;
  const tailMarker = '})(runShellWithRoot);';
  const tail = src.lastIndexOf(tailMarker);
  if (tail < 0) throw new Error('IIFE tail not found in ' + file);
  src = src.slice(0, tail) + hook + src.slice(tail);

  const ctx = buildContext(shellHandler);
  if (lexicalHostOnly) {
    ctx.__hostRunShellWithRoot = ctx.runShellWithRoot;
    delete ctx.runShellWithRoot;
    src = `((runShellWithRoot) => {\n${src}\n})(globalThis.__hostRunShellWithRoot);`;
  }
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
  'validateConfigObjectStructure', 'applyManagedDashboardFields', 'applyRequiredF50Fields',
  'yamlHasGeneratedMarker', 'createConfigRollbackPoint', 'buildManagedFallbackRules',
  'buildManagedRuleProviders', 'isPlainYamlObject', 'parseInstallToolboxResult',
  'ensureInstallToolbox', 'sanitizeSubscriptionSecrets',
];
const RUNTIME_EXPORTS = [
  'parseRuntimePreflightResult', 'deriveRuntimeState', 'classifyMihomoApiError',
  'parseBootIntegrationResult', 'buildApiCurl', 'callMihomoApi', 'buildRuntimeManagerScript',
  'deriveSubscriptionUpdateOutcome', 'addBootLinesCmd', 'removeBootLinesCmd', 'checkAdvanceFunc',
  'readCurrentModeStatus',
];

function runFor(label, file) {
  console.log(`\n######## ${label} (${path.basename(file)}) ########`);
  const source = fs.readFileSync(file, 'utf8');
  let shellReply = { success: true, content: '' };
  let lastShellCommand = '';
  let shellCallCount = 0;
  const handler = async (command) => {
    shellCallCount++;
    lastShellCommand = String(command || '');
    return shellReply;
  };
  const hasBinaryHelper = source.includes('const KANO_HELPER_PATH =');
  const exportNames = [
    ...EXPORTS,
    ...RUNTIME_EXPORTS,
    'probeBinaryHelperState', 'installBinaryHelperFromDevicePath',
    'convertSubscriptionsLocally', 'validateLocalSubscriptionUrl',
  ];
  const { api } = loadPlugin(file, handler, exportNames);
  let goBehaviorPromise = Promise.resolve();

  const missing = exportNames.filter((n) => typeof api[n] === 'undefined');
  chk(missing, [], `全部待测函数均已导出 (${exportNames.length} 个)`);
  if (missing.length) return;

  const controllerSettingsSource = source.slice(
    source.indexOf('const showControllerSettingsDialog = async'),
    source.indexOf('const showStatusDiagnostic = async'),
  );
  chk(
    controllerSettingsSource.includes('const secretToggleId =')
      && controllerSettingsSource.includes('type="password"')
      && controllerSettingsSource.includes("secretInput.type = show ? 'text' : 'password'")
      && controllerSettingsSource.includes("secretToggleBtn.setAttribute('aria-pressed'"),
    true,
    'Web panel secret input has a show/hide toggle',
  );

  chk(
    source.includes("boot_on.textContent = '开机自启';")
      && !source.includes('开机自启（已托管）')
      && !source.includes('开机自启（直接执行）')
      && !source.includes('开机自启（管理器异常）'),
    true,
    '开机自启按钮不再追加状态提示词',
  );

  const panelUiStart = source.indexOf("style.id = 'kano_mm_style'");
  const panelUiSource = source.slice(
    panelUiStart,
    source.indexOf('collapseGen(', panelUiStart),
  );
  const actionGroupButtonLists = [
    'quickRunBtn, btn_restart, stopBtn, boot_on, webPanelToggleBtn, refresh, open, controllerSettingsBtn',
    'subBtn, updateSubBtn, userAgentBtn, templateOverrideBtn, editBtn, backupBtn',
    'policyToolsBtn, macBypassBtn, rescueBtn, showLogBtn',
    'binaryHelperBtn, binaryHelperUploadBtn, clearCacheBtn, btn_disabled',
  ];
  const actionGroupButtonCounts = actionGroupButtonLists
    .filter((buttons) => panelUiSource.includes(`[${buttons}]`))
    .map((buttons) => buttons.split(',').length);
  chk(
    panelUiSource.includes('grid-template-columns:repeat(4,minmax(0,1fr))')
      && panelUiSource.includes('@media (max-width:1100px){#mm_action_box{grid-template-columns:repeat(2,minmax(0,1fr))')
      && panelUiSource.includes('@media (max-width:600px){#mm_action_box{grid-template-columns:1fr;}')
      && !panelUiSource.includes('repeat(auto-fit,minmax(220px,1fr))'),
    true,
    '四组折叠面板按 4/2/1 列稳定换行，不产生 3+1 布局',
  );
  chk(
    actionGroupButtonCounts,
    [8, 6, 4, 4],
    '四组操作按钮均保持成对数量',
  );
  chk(
    panelUiSource.includes('.kano-action-inner button{display:flex;align-items:center;justify-content:center;width:100%;min-width:0;min-height:32px;')
      && panelUiSource.includes('.kano-dialog-actions>button{flex:0 0 auto;width:auto;min-width:68px;min-height:30px;padding:5px 10px;}'),
    true,
    '主面板按钮收紧高度，二级操作按钮按文案自适应宽度',
  );
  chk(
    source.includes("const statusEl = document.querySelector('#mm_task_status');")
      && source.includes("statusEl.textContent = label ? `任务：${label}` : '任务：空闲';")
      && source.includes('activeCriticalOperation = { label: String(label')
      && source.includes('activeCriticalOperation = null;\n      syncCriticalOperationStatus();'),
    true,
    '任务状态只显示当前关键操作或空闲状态',
  );
  chk(
    panelUiSource.includes('.kano-dialog-actions{display:flex;justify-content:flex-end;align-items:center;gap:8px;flex-wrap:wrap;')
      && panelUiSource.includes('.kano-dialog-actions.kano-actions-4{display:grid;grid-template-columns:repeat(2,max-content);}')
      && panelUiSource.includes('.kano-log-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));')
      && source.includes('#kano_policy_shell .kp-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;}')
      && source.includes("row.style.gridTemplateColumns = 'minmax(0,1fr) repeat(2,56px)';"),
    true,
    '二级菜单紧凑排列，四操作区、三标签和订阅行保持对称',
  );
  chk(
    panelUiSource.includes("open.textContent = '打开新窗口';")
      && panelUiSource.includes("refresh.textContent = '刷新面板';")
      && panelUiSource.includes("controllerSettingsBtn.textContent = '面板连接';")
      && panelUiSource.includes("showLogBtn.textContent = '状态与日志';")
      && panelUiSource.includes("quickRunBtn.textContent = '安装 / 启动';")
      && panelUiSource.includes("templateOverrideBtn.textContent = '配置与规则';")
      && panelUiSource.includes("policyToolsBtn.textContent = '流量接管';")
      && panelUiSource.includes("userAgentBtn.textContent = '订阅请求头';")
      && !panelUiSource.includes('新窗口打开 Web 面板')
      && !/setButtonBusy\([^\n]*\.\.\./.test(source),
    true,
    '按钮文案去除重复词，并统一进行中状态标点',
  );
  chk(
    panelUiSource.includes("appendActionGroup('\\u6838\\u5fc3\\u4e0e\\u9762\\u677f'")
      && panelUiSource.includes("appendActionGroup('\\u8ba2\\u9605\\u4e0e\\u914d\\u7f6e'")
      && panelUiSource.includes("appendActionGroup('\\u7f51\\u7edc\\u4e0e\\u8bca\\u65ad'")
      && panelUiSource.includes("appendActionGroup('\\u7ec4\\u4ef6\\u4e0e\\u7ef4\\u62a4'")
      && source.includes('<div class="kano-dialog-menu-title">规则覆写</div>')
      && source.includes('<div class="kano-dialog-menu-title">配置文件</div>')
      && source.includes('>保存并应用</button>')
      && source.includes('>上传模板</button>')
      && source.includes('>导入配置</button>'),
    true,
    '主菜单按任务重新分类，配置二级菜单按规则与文件分区',
  );

  const modeStatusSource = source.slice(
    source.indexOf('const readCurrentModeStatus = async () => {'),
    source.indexOf('const refreshRuleModeStatus = async () => {'),
  );
  chk(
    (modeStatusSource.match(/\$YQ"? e /g) || []).length,
    1,
    'configuration summary uses a single yq process',
  );
  const policyReaderSource = source.slice(
    source.indexOf('const readPolicyState = async () => {'),
    source.indexOf('const updateModeBadge = (mode) => {'),
  );
  chk(
    policyReaderSource.includes('syncUnifiedDeviceBypassStorage'),
    false,
    'reading policy state does not rewrite files or scan firewall chains',
  );
  const runningStatusSource = source.slice(
    source.indexOf('const isMMRunning = async () => {'),
    source.indexOf('const askConfirm = ('),
  );
  chk(
    runningStatusSource.includes("{ corePid: pid }"),
    true,
    'API health check reuses the already detected core PID',
  );
  chk(hasBinaryHelper, true, 'unified plugin includes the optional Go helper capability');

  console.log('--- Zashboard UI path normalization ---');
  const duplicatedDashboard = {
    'external-ui': 'WebUI/zashboard',
    'external-ui-name': 'zashboard',
    'external-ui-url': 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
  };
  chk(api.applyManagedDashboardFields(duplicatedDashboard), true, 'duplicate Zashboard update path is detected');
  chk(duplicatedDashboard['external-ui'], 'WebUI/zashboard', 'managed dashboard keeps the served UI directory');
  chk(Object.prototype.hasOwnProperty.call(duplicatedDashboard, 'external-ui-name'), false,
    'managed dashboard removes the name that caused a nested update directory');

  const packagedDashboard = {
    'external-ui': 'ui',
    'external-ui-name': 'zashboard',
    'external-ui-url': 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist-no-fonts.zip',
  };
  api.applyRequiredF50Fields(packagedDashboard);
  chk(packagedDashboard['external-ui'], 'WebUI/zashboard', 'packaged UI path is normalized before config commit');
  chk(packagedDashboard['external-ui-url'].endsWith('/dist-no-fonts.zip'), true,
    'an existing Zashboard release variant is preserved');
  chk(Object.prototype.hasOwnProperty.call(packagedDashboard, 'external-ui-name'), false,
    'packaged UI name is removed before core start');

  const customDashboard = {
    'external-ui': '/custom/dashboard',
    'external-ui-name': 'custom-ui',
    'external-ui-url': 'https://example.test/custom.zip',
  };
  chk(api.applyManagedDashboardFields(customDashboard), false, 'custom dashboard configuration is not rewritten');
  chk(customDashboard['external-ui-name'], 'custom-ui', 'custom dashboard name is preserved');
  if (hasBinaryHelper) {
    const controllerReaderSource = source.slice(
      source.indexOf('const readControllerInfo = async ({ fresh = false } = {}) => {'),
      source.indexOf('const buildControllerInfo = async ('),
    );
    chk(
      controllerReaderSource.includes('const snapshot = await readBinarySnapshot({ fresh })')
        && controllerReaderSource.includes('const res = await runShellWithRoot(')
        && source.includes('const loadPromise = readControllerInfo({ fresh })'),
      true,
      'controller settings propagate fresh reads and retain their Shell fallback',
    );
    const snapshotReaderSource = source.slice(
      source.indexOf('const readBinarySnapshot = async ('),
      source.indexOf('const invalidateBinarySnapshot = () => {'),
    );
    chk(
      !snapshotReaderSource.includes("'--device'")
        && !snapshotReaderSource.includes("'--direct-domain'")
        && policyReaderSource.includes("runBinaryHelperJson('policy-read'"),
      true,
      'hot-path snapshot omits policy files that are loaded on demand',
    );
    const clientReaderSource = source.slice(
      source.indexOf('const readClientListText = async () => {'),
      source.indexOf('const showPolicyStatus = async () => {'),
    );
    chk(
      clientReaderSource.includes("runBinaryHelperJson('clients')")
        && clientReaderSource.includes('runShellWithRoot(')
        && !clientReaderSource.includes('readBinarySnapshot'),
      true,
      'client discovery uses Go first and retains its Shell fallback',
    );
    const networkReaderSource = source.slice(
      source.indexOf('const collectNetworkStatus = async () => {'),
      source.indexOf('const networkRescue = async ('),
    );
    chk(
      networkReaderSource.includes("runBinaryHelperJson('network-status'")
        && networkReaderSource.includes('runShellWithRoot(')
        && policyReaderSource.includes("runBinaryHelperJson('policy-read'")
        && policyReaderSource.includes('runShellWithRoot('),
      true,
      'network and policy reads use Go first and retain their Shell fallbacks',
    );
  }

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
  const stagedProbe = source.indexOf('controller_probe="$("$CONTROLLER" --help 2>&1)"');
  const packageCommit = source.indexOf('INSTALL_PACKAGE_COMMITTED', stagedProbe);
  chk(stagedProbe >= 0 && packageCommit > stagedProbe, true, 'staged controller is probed before package commit');
  chk(
    source.includes('INSTALL_PERMISSION_FAILED: Clash.Service is not executable')
      && source.includes('INSTALL_PERMISSION_FAILED: Clash.Core is not executable')
      && source.includes('INSTALL_PERMISSION_FAILED: Clash.Service cannot execute'),
    true,
    'installed core and service wrapper are checked after chmod',
  );
  chk(
    source.includes('${shellQuote(KANO_HELPER_CONVERTER_PATH)}; do'),
    true,
    'package installation restores execute permission on the bundled subscription converter',
  );
  const bootLines = api.addBootLinesCmd();
  const removeBootLines = api.removeBootLinesCmd();
  chk(
    bootLines.includes('mkdir -p "/data/clash/Clash" && inotifyd /data/clash/Scripts/Clash.Inotify')
      && source.includes("mkdir -p ${shellQuote(CLASH_INOTIFY_DIR)} || exit 1"),
    true,
    'installer and boot entry create the inotify watch directory before starting the watcher',
  );
  chk(
    removeBootLines.includes('-v legacy_inotify=')
      && removeBootLines.includes('$0 != legacy_inotify'),
    true,
    'boot integration removes the legacy inotify entry before writing the repaired one',
  );
  const permissionProbe = source.indexOf('INSTALL_PERMISSION_FAILED: Clash.Service cannot execute');
  const serviceStart = source.indexOf('await startClashServiceClean({ stopFirst: false', permissionProbe);
  chk(
    permissionProbe >= 0 && serviceStart >= 0 && permissionProbe < serviceStart,
    true,
    'service preflight runs before the first service start',
  );
  chk(
    source.includes('const archive = await downloadCoreArchive({ allowCached: false })')
      && source.includes('command -v unzip >/dev/null 2>&1'),
    true,
    'required download and archive tools are checked at their use sites',
  );
  chk(
    source.includes("const KANO_INSTALL_TOOLBOX_DIR = '/data/kano_tproxy_tools'")
      && source.includes("export PATH='${KANO_INSTALL_TOOLBOX_BIN}':\"$PATH\""),
    true,
    'managed toolbox PATH is applied to every plugin shell call',
  );

  {
    console.log('--- unified runtime preflight / API / boot behavior ---');
    const runtimeManager = api.buildRuntimeManagerScript();
    const runtimeSyntax = spawnSync('sh', ['-n'], {
      input: runtimeManager,
      encoding: 'utf8',
    });
    const bashSyntax = runtimeSyntax.status === 0 ? null : spawnSync('bash', ['-n'], {
      input: runtimeManager,
      encoding: 'utf8',
    });
    const syntaxDetail = [runtimeSyntax.stderr, bashSyntax && bashSyntax.stderr].filter(Boolean).join(' ').trim();
    chk(runtimeSyntax.status, 0, `generated runtime manager passes sh -n${syntaxDetail ? `: ${syntaxDetail}` : ''}`);
    chk(
      runtimeManager.includes('TOOLBOX_BIN=/data/kano_tproxy_tools/bin')
        && runtimeManager.includes('[ ! -d "$TOOLBOX_BIN" ] || PATH="$TOOLBOX_BIN:$PATH"')
        && runtimeManager.includes('export PATH TMPDIR'),
      true,
      'boot runtime restores the managed toolbox PATH before probing curl',
    );
    chk(
      runtimeManager.includes('CURL_BIN=/data/data/com.minikano.f50_sms/files/curl')
        && runtimeManager.includes('[ -x "$CURL_BIN" ] || CURL_BIN="$TOOLBOX_BIN/curl"'),
      true,
      'boot runtime probes the UFI-TOOLS curl binary before PATH fallbacks',
    );
    chk(
      runtimeManager.includes('[ "$action" != "--boot" ] || attempt_limit=60'),
      true,
      'boot runtime allows a longer API startup window',
    );
    chk(
      runtimeManager.includes('if [ "$action" = "--boot" ] && [ -n "$pid" ]; then')
        && runtimeManager.includes('核心进程已启动，开机阶段保留运行并交由后台继续检查'),
      true,
      'boot runtime never kills an already-running core only because API probing is unavailable',
    );
    const startVerificationSource = source.slice(
      source.indexOf('const waitForRunningCoreApi = async'),
      source.indexOf('const createConfigRollbackPoint = async'),
    );
    const restartSource = source.slice(
      source.indexOf('const restartClash = async'),
      source.indexOf('const btn_restart ='),
    );
    chk(
      startVerificationSource.includes('return await waitForCoreApi(12, 1000)')
        && !startVerificationSource.includes('acceptRunningCoreWithSlowApi')
        && restartSource.includes('const trafficModeOk = await ensureRuntimeTrafficMode')
        && restartSource.includes('const rulesOk = await reapplyPolicyRulesSilent()')
        && restartSource.includes('return false;'),
      true,
      'runtime success requires API readiness, traffic-mode convergence, and policy application',
    );
    const stopped = api.parseRuntimePreflightResult({
      success: true,
      content: 'PREFLIGHT_STATE=installed_stopped\nABI=arm64\nCONFIG_VALID=1\nREPAIRED=controller:chmod\nCORE_PID=\n',
    });
    chk(stopped.state, 'installed_stopped', 'complete installation with no PID is installed_stopped');
    chk(stopped.repaired, ['controller:chmod'], 'permission repair is reported structurally');
    chk(api.deriveRuntimeState(stopped, null), 'installed_stopped', 'API is not consulted when core is stopped');

    const running = api.parseRuntimePreflightResult({
      success: true,
      content: 'PREFLIGHT_STATE=running_api_unavailable\nABI=arm64\nCONFIG_VALID=1\nCORE_PID=123\n',
    });
    chk(api.deriveRuntimeState(running, { success: false }), 'running_api_unavailable', 'running core with unavailable API is classified separately');
    chk(api.deriveRuntimeState(running, { success: true }), 'healthy', 'running core with healthy API is healthy');

    const damaged = api.parseRuntimePreflightResult({
      success: false,
      content: 'PREFLIGHT_STATE=damaged\nABI=arm64\nMISSING=controller\nPROBE_ERRORS=controller_architecture\nCONFIG_VALID=1\nREPAIRABLE=1\n',
    });
    chk(damaged.state, 'damaged', 'missing or wrong-architecture controller is damaged');
    chk(damaged.probeErrors, ['controller_architecture'], 'wrong ELF architecture is exposed as a probe error');

    chk(api.classifyMihomoApiError({ corePid: '' }).errorType, 'core_not_running', 'stopped core is not reported as an HTTP failure');
    chk(api.classifyMihomoApiError({ corePid: '1', curlStatus: 7 }).errorType, 'connection_refused', 'curl refusal is classified');
    chk(api.classifyMihomoApiError({ corePid: '1', curlStatus: 28 }).errorType, 'timeout', 'curl timeout is classified');
    chk(api.classifyMihomoApiError({ corePid: '1', statusCode: 401 }).errorType, 'auth_failed', 'API authentication failure is not called a subscription failure');

    const noSecretCurl = api.buildApiCurl('/version', 'GET', null, {
      apiBase: 'http://127.0.0.1:7788', secret: '', secretSet: false,
    });
    chk(noSecretCurl.includes('Authorization: Bearer'), false, 'unset config secret does not inject a fake Authorization header');
    const actualSecretCurl = api.buildApiCurl('/version', 'GET', null, {
      apiBase: 'http://127.0.0.1:7788', secret: 'configured-secret', secretSet: true,
    });
    chk(actualSecretCurl.includes('Authorization: Bearer configured-secret'), true, 'configured API secret is used');

    const shellBeforeStoppedApi = lastShellCommand;
    goBehaviorPromise = Promise.resolve(api.callMihomoApi('/version', 'GET', null, {
      apiBase: 'http://127.0.0.1:7788', secret: '', secretSet: false,
    }, 2, { corePid: '' })).then(async (apiStopped) => {
      chk(apiStopped.errorType, 'core_not_running', 'provider/control API request is not run when core is stopped');
      chk(lastShellCommand, shellBeforeStoppedApi, 'stopped-core API check does not invoke curl');

      chk(api.parseBootIntegrationResult({ content: 'BOOT_STATE=managed\nMANAGER_VERSION=2.2.0\n' }).state,
        'managed', 'boot manager state is parsed');
      chk(api.parseBootIntegrationResult({ content: 'BOOT_STATE=direct\n' }).state,
        'direct', 'direct boot state is distinguished');
      chk(api.parseBootIntegrationResult({ content: 'BOOT_STATE=manager_damaged\n' }).state,
        'manager_damaged', 'damaged boot manager state is distinguished');

      chk(source.includes('Clash.KanoStart} --boot') || source.includes('CLASH_RUNTIME_MANAGER} --boot'),
        true, 'boot and manual operations share the runtime preflight starter');
      chk(source.includes("sed -i '/\\/data\\/clash\\/Scripts\\/Clash.Service start/d'"), false,
        'boot cleanup does not use fuzzy service-line deletion');
      chk(source.includes("LEGACY_BOOT_FIX_WRAPPER_LINE") && source.includes("$0 != legacy_wrapper"), true,
        'boot cleanup precisely removes the obsolete boot-fix wrapper');
      chk(source.includes("migrateLegacyBootIntegration"), true,
        'legacy boot integration is migrated automatically');
      chk(
        source.includes('REPAIR_USER_BACKUP=') && source.includes('REPAIR_ROLLBACK=restored_previous'),
        true,
        'self-heal preserves user data and has rollback',
      );
      chk(
        source.includes('controller_from_cached_archive')
          && source.includes('"$UNZIP" -p "$RECOVERY_ARCHIVE" "$ARCHIVE_CONTROLLER"'),
        true,
        'runtime preflight can restore a missing ABI controller from the validated cached archive',
      );
      chk(source.includes('not_run_core_stopped') && source.includes('ok: configCheck.ok'),
        true, 'subscription config health remains independent from core/API health');
      const stoppedProviderOutcome = api.deriveSubscriptionUpdateOutcome(
        { ok: true, providerCount: 1 },
        {
          total: 1,
          success: 0,
          failed: 1,
          providers: [{
            name: 'Provider1', ok: false, errorType: 'not_run_core_stopped',
            proxyCount: null,
          }],
          notRunReason: '未执行：核心未运行',
        },
      );
      chk(stoppedProviderOutcome.configOk, true,
        'stopped core does not turn a valid subscription config into a config failure');
      chk(stoppedProviderOutcome.allOk, false,
        'provider refresh is still reported as not completed when the core is stopped');
      chk(stoppedProviderOutcome.title, '订阅配置正常 · 节点来源未更新',
        'subscription result title separates config health from provider runtime state');
      chk(stoppedProviderOutcome.color, 'yellow',
        'stopped-core provider refresh is a warning instead of a config error');
      if (hasBinaryHelper) {
        shellReply = {
          success: true,
          content: 'KANO_HELPER_STATE=present\n{"ok":true,"version":"0.3.2","commands":["version","snapshot","clients","network-status","policy-read","convert-subscription"]}\nKANO_HELPER_RC=0\n',
        };
        chk((await api.probeBinaryHelperState()).state, 'installed',
          'helper probe accepts a healthy executable protocol');
        shellReply = {
          success: true,
          content: 'KANO_HELPER_STATE=present\n{"ok":true,"version":"0.3.4","commands":["version","snapshot","clients","network-status","policy-read","convert-subscription"]}\nKANO_HELPER_RC=0\n',
        };
        chk((await api.probeBinaryHelperState()).state, 'installed',
          'helper probe accepts a healthy newer helper version');
        shellReply = {
          success: true,
          content: 'KANO_HELPER_STATE=present\n{"ok":true,"version":"0.3.1","commands":["version","snapshot","clients","network-status","policy-read","convert-subscription"]}\nKANO_HELPER_RC=0\n',
        };
        chk((await api.probeBinaryHelperState()).state, 'installed',
          'helper probe accepts a healthy older semantic version without a fixed floor');
        shellReply = {
          success: true,
          content: 'KANO_HELPER_STATE=present\n/system/bin/sh: helper: inaccessible\nKANO_HELPER_RC=126\n',
        };
        chk((await api.probeBinaryHelperState()).state, 'invalid',
          'helper probe rejects a file whose version command cannot execute');
        shellReply = {
          success: false,
          content: 'KANO_HELPER_STATE=present\n{"ok":true,"version":"0.3.2","commands":["version","snapshot","clients","network-status","policy-read","convert-subscription"]}\nKANO_HELPER_RC=0\n',
        };
        chk((await api.probeBinaryHelperState()).state, 'invalid',
          'helper probe rejects incomplete root-shell transactions');
        shellReply = { success: true, content: 'HELPER_INSTALLED=1\n' };
        chk(await api.installBinaryHelperFromDevicePath({ sourcePath: '/data/helper-test' }), true,
          'helper installer accepts a successfully validated staged executable');
        const helperInstallSyntax = spawnSync('sh', ['-n'], {
          input: lastShellCommand,
          encoding: 'utf8',
        });
        chk(helperInstallSyntax.status, 0,
          `generated helper-install shell passes sh -n: ${helperInstallSyntax.stderr.trim()}`);
        const helperInstallSource = lastShellCommand;
        const versionValidation = helperInstallSource.indexOf('HELPER_VERSION_NOT_NEWER');
        const protocolValidation = helperInstallSource.indexOf('HELPER_COMMAND_MISSING');
        const helperCommit = helperInstallSource.indexOf('mv -f "$STAGE" "$TARGET"');
        chk(
          versionValidation >= 0 && protocolValidation > versionValidation
            && helperCommit > protocolValidation,
          true,
          'helper update requires a version newer than the installed helper before activation',
        );
        const helperButtonSource = source.slice(
          source.indexOf('binaryHelperBtn.onclick = async () => {'),
          source.indexOf('binaryHelperUploadBtn.onclick = async () => {'),
        );
        chk(
          helperButtonSource.includes("const isUpdate = current.state != 'missing'")
            && helperButtonSource.includes("healthy ? '检查更新' : '更新修复'")
            && helperButtonSource.includes('preferGitee: isUpdate')
            && !helperButtonSource.includes("createToast('辅助内核已安装'"),
          true,
          'helper update uses the confirmed Gitee-first reinstall path',
        );
        const helperStateSource = source.slice(
          source.indexOf('const applyBinaryHelperButtonState ='),
          source.indexOf('const refreshBinaryHelperButton ='),
        );
        chk(
          helperStateSource.includes("binaryHelperBtn.textContent = '安装转换组件'")
            && helperStateSource.includes("binaryHelperBtn.textContent = '修复转换组件'")
            && helperStateSource.includes('使用 Shell 兼容模式'),
          true,
          '缺失或异常的转换组件仍明确提示 Shell 兼容模式',
        );
        const helperPreferredSource = source.slice(
          source.indexOf('const installBinaryHelperPreferred = async'),
          source.indexOf('let autoEnsureHelperDone = false'),
        );
        const firstGitee = helperPreferredSource.indexOf('installBinaryHelperFromGitee');
        const firstBundled = helperPreferredSource.indexOf('installBinaryHelperFromBundled');
        const fallbackGitee = helperPreferredSource.lastIndexOf('installBinaryHelperFromGitee');
        chk(
          helperPreferredSource.includes('if (preferGitee)')
            && firstGitee >= 0 && firstGitee < firstBundled && firstBundled < fallbackGitee
            && helperPreferredSource.includes('return giteeOk || bundledOk'),
          true,
          'helper update compares the Gitee result with the bundled release',
        );
        const localConverterSource = source.slice(
          source.indexOf('const ensureLocalSubscriptionConverter = async'),
          source.indexOf('const readCurrentModeStatus = async'),
        );
        chk(api.validateLocalSubscriptionUrl('https://example.com/sub').ok, true,
          'local conversion accepts a public HTTPS subscription URL');
        for (const blockedUrl of [
          'http://example.com/sub',
          'https://user:pass@example.com/sub',
          'https://localhost/sub',
          'https://2130706433/sub',
          'https://0x7f000001/sub',
          'https://127.0.0.1/sub',
          'https://192.168.1.1/sub',
          'https://[::1]/sub',
        ]) {
          chk(api.validateLocalSubscriptionUrl(blockedUrl).ok, false,
            `local conversion rejects unsafe URL: ${blockedUrl}`);
        }
        chk(api.validateLocalSubscriptionUrl('https://203.0.1.1/sub').ok, true,
          'local conversion does not over-block an ordinary public IPv4 literal');
        chk(api.validateLocalSubscriptionUrl('https://[2001:4860:4860::8888]/sub').ok, true,
          'local conversion accepts a public IPv6 literal');
        const shellCallsBeforeBlockedUrl = shellCallCount;
        const blockedLocalConversion = await api.convertSubscriptionsLocally([
          { url: 'http://example.com/subscription' },
        ]);
        chk(blockedLocalConversion.providers[0].errorType, 'url_policy',
          'local conversion reports an HTTPS policy failure before download');
        chk(shellCallCount, shellCallsBeforeBlockedUrl,
          'blocked local subscription URLs never reach the root shell');
        chk(
          localConverterSource.includes('chmod 700 "$CONVERTER" || exit 1')
            && localConverterSource.includes('if http_code="$("$CURL_BIN"')
            && localConverterSource.includes('2>"$err_tmp")"; then')
            && localConverterSource.includes('if CONVERT_JSON="$("$HELPER"')
            && localConverterSource.includes('2>"$conv_err")"; then'),
          true,
          'local conversion repairs sidecar permissions and handles expected curl/converter failures under set -e',
        );
        const cacheProbe = localConverterSource.indexOf('${cacheProbeCommands}');
        const downloads = localConverterSource.indexOf('${downloadCommands}');
        const snapshots = localConverterSource.indexOf('${snapshotCommands}');
        const commits = localConverterSource.indexOf('${commitCommands}');
        chk(
          cacheProbe >= 0 && downloads > cacheProbe && snapshots > downloads && commits > snapshots
            && localConverterSource.includes('last_stage=download')
            && localConverterSource.includes('last_stage=convert')
            && localConverterSource.includes('existingCache.get(source.name) === true')
            && localConverterSource.includes('${restoreCommands}'),
          true,
          'local conversion classifies failures and commits all provider caches transactionally',
        );
        chk(
          localConverterSource.includes("--proto '=https'")
            && localConverterSource.includes('--max-redirs 0')
            && localConverterSource.includes('--max-filesize ${LOCAL_SUBSCRIPTION_MAX_FILE_BYTES}')
            && localConverterSource.includes('--resolve "$resolve_spec"')
            && localConverterSource.includes('resolve_public_address()')
            && localConverterSource.includes('is_public_ipv6()')
            && localConverterSource.includes('command -v ping6')
            && localConverterSource.includes('getent hosts "$resolve_host"')
            && localConverterSource.includes('LOCAL_TOTAL_BYTES=0')
            && localConverterSource.includes('LOCAL_SUBSCRIPTION_TOTAL_BYTES'),
          true,
          'local conversion pins a public IPv4 target, rejects redirects, and enforces file and total quotas',
        );
        chk(
          localConverterSource.includes("downloadCoreArchive({ allowCached: true })")
            && localConverterSource.includes('CONVERTER_ARCHIVE_ENTRY_INVALID')
            && localConverterSource.includes('CONVERTER_REPAIRED'),
          true,
          'missing subscription converter is repaired from a validated installation archive',
        );
        shellReply = {
          success: true,
          content: 'KANO_HELPER_STATE=present\n{"ok":true,"version":"0.3.2","commands":["version","snapshot","clients","network-status","policy-read","convert-subscription"]}\nKANO_HELPER_RC=0\n',
        };
        await api.convertSubscriptionsLocally([{ url: 'https://example.test/subscription' }]);
        const localConversionSyntax = spawnSync('sh', ['-n'], {
          input: lastShellCommand,
          encoding: 'utf8',
        });
        chk(
          localConversionSyntax.status,
          0,
          `generated local-conversion shell passes sh -n: ${localConversionSyntax.stderr.trim()}`,
        );
        const mainInstallSource = source.slice(
          source.indexOf('btn_enabled.onclick = async () => {'),
          source.indexOf('btn_disabled.onclick = async () => {'),
        );
        const helperAutoInstall = mainInstallSource.indexOf('installBinaryHelperPreferred({ quiet: true })');
        const helperButtonRefresh = mainInstallSource.indexOf('scheduleBinaryHelperButtonRefresh()');
        chk(
          helperAutoInstall >= 0 && helperButtonRefresh > helperAutoInstall,
          true,
          'main installation activates the bundled helper and schedules its button refresh',
        );
        const delayedHelperRefreshSource = source.slice(
          source.indexOf('const scheduleBinaryHelperButtonRefresh ='),
          source.indexOf('helperUploadEl.onchange = async'),
        );
        chk(
          delayedHelperRefreshSource.includes('delay = 1000')
            && delayedHelperRefreshSource.includes('retryDelay = 1500')
            && delayedHelperRefreshSource.includes('setTimeout(() => run(true), delay)')
            && delayedHelperRefreshSource.includes("probe.state != 'installed'"),
          true,
          'post-install helper status refresh is delayed, non-blocking, and retried once',
        );
        const helperBinary = fs.readFileSync(FILES.helper);
        chk(
          helperBinary.length > 1024
            && helperBinary.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))
            && helperBinary.readUInt16LE(18) === 0xb7,
          true,
          'bundled Go helper is a non-empty AArch64 ELF binary',
        );
        const archivedHelper = spawnSync(
          'unzip',
          ['-p', FILES.package, 'Tools/kano-f50-helper-bundled'],
          { encoding: null, maxBuffer: 16 * 1024 * 1024 },
        );
        chk(
          archivedHelper.status === 0 && Buffer.isBuffer(archivedHelper.stdout)
            && archivedHelper.stdout.equals(helperBinary),
          true,
          'installation package embeds the same helper binary as dist',
        );
        const helperSource = fs.readFileSync(path.join(ROOT, 'binary-helper', 'main.go'), 'utf8');
        const packageEntries = spawnSync(
          'unzip',
          ['-l', FILES.package],
          { encoding: 'utf8' },
        );
        chk(
          helperSource.includes('const version = "0.3.4"')
            && packageEntries.status === 0
            && !packageEntries.stdout.includes('kano-f50-helper-bundled-armv7'),
          true,
          'helper performance changes have a deployable version without unused ARMv7 payloads',
        );
        chk(
          source.includes('const CONTROLLER_INFO_CACHE_TTL = 1500')
            && source.includes('const KANO_HELPER_SNAPSHOT_TTL = 1500'),
          true,
          'panel status reads use a shared 1.5-second cache',
        );
        chk(
          source.includes('https://gitee.com/womye/123/releases/download/v1/kano-f50-helper-linux-arm64')
            && !source.includes('raw.githubusercontent.com/Chunlion/ufi-mihomo'),
          true,
          'runtime downloads the Go helper only from the Gitee release',
        );
        chk(
          source.includes('const configPromise = readBinarySnapshot().then((snapshot) => {')
            && source.includes('snapshot.configExists === true')
            && source.includes('Number(snapshot.configSize)'),
          true,
          'status diagnostics reuse config metadata from the shared Go snapshot',
        );
      }
      chk(source.includes('df -k /data /tmp'), false, 'diagnostics do not pass a missing /tmp to df');
      chk(source.includes('RECOVERY_ARCHIVE_STATUS=retained') && source.includes('离线自愈包：已保留'),
        true, 'cache cleanup preserves a valid offline recovery archive');
      chk(source.includes("item.errorType == 'core_not_running'"),
        true, 'cache cleanup treats stopped-core API flushes as skipped');
      chk(source.includes('iptables -F') || source.includes('iptables -t nat -F'), false,
        'network rescue does not globally flush firewall tables');
    });
  }

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

  console.log('--- config.yaml 结构检查 ---');
  chk(api.validateConfigObjectStructure({
    proxies: [],
    'proxy-groups': [{ name: 'Proxy', type: 'select', proxies: ['DIRECT'] }],
    rules: ['MATCH,Proxy'],
    'proxy-providers': {},
    dns: { enable: true },
  }), true, '合法配置结构通过');
  threw = '';
  try {
    api.validateConfigObjectStructure({ 'proxy-groups': {}, rules: [] });
  } catch (e) { threw = e.message; }
  chk(/proxy-groups 必须是数组/.test(threw), true, '拒绝错误的 proxy-groups 类型');
  threw = '';
  try {
    api.validateConfigObjectStructure({
      'proxy-groups': [{ name: 'Proxy' }, { name: 'Proxy' }],
      rules: [],
    });
  } catch (e) { threw = e.message; }
  chk(/重复组名/.test(threw), true, '拒绝重复策略组名');
  const configFileValidationSource = source.slice(
    source.indexOf('const validateConfigFileStructure = async'),
    source.indexOf('const buildDefaultOverrideJs ='),
  );
  chk(
    configFileValidationSource.includes('const read = await readYamlObject(configPath, label)')
      && configFileValidationSource.includes('validateConfigObjectStructure(read.value, label)'),
    true,
    '配置文件检查会解析 YAML 并校验结构',
  );
  chk(source.includes('testConfigWithCore'), false, '不再把结构检查描述为核心校验');
  chk(source.includes('config.yaml 已校验并热加载'), false, '热加载结果文案不再声称已完成核心校验');
  chk(
    !source.includes('CONFIG_TEST_SKIPPED')
      && !source.includes('CORE_TEST_SKIPPED')
      && !source.includes('coreTestResult')
      && !source.includes('coreTest:')
      && !source.includes('coreTimeout:'),
    true,
    '删除未执行核心校验却写入跳过或通过状态的历史分支',
  );
  const packageRestoreSource = source.slice(
    source.indexOf('const restoreConfigPackageFromFile = async'),
    source.indexOf('const packageUploadEl ='),
  );
  chk(
    packageRestoreSource.includes('package contains unsupported file types')
      && packageRestoreSource.includes("jq -e 'type == \"object\"'")
      && packageRestoreSource.includes('override.js exceeds 20 KiB')
      && packageRestoreSource.includes('validateConfigFileStructure(CLASH_CONFIG'),
    true,
    '配置包导入检查归档文件类型、JSON 根类型、脚本大小和 config.yaml 结构',
  );
  const localEditorSource = source.slice(
    source.indexOf('const writeEditableLocalFile = async'),
    source.indexOf('const showEditableLocalFilesDialog = async'),
  );
  chk(
    localEditorSource.includes('return await saveJsOverrideText(content)')
      && localEditorSource.includes('JSON.parse(content)')
      && localEditorSource.includes('invalidLineIndex')
      && localEditorSource.includes('safeTextToHtml'),
    true,
    '本地文件编辑器复用 JS、订阅和 JSON 校验并对错误输出脱敏',
  );
  const sanitizedLog = api.sanitizeSubscriptionSecrets(
    'url=https://example.test/sub/token?key=value Authorization: Bearer abc secret=xyz',
  );
  chk(
    sanitizedLog.includes('https://example.test/sub/***?key=***')
      && !sanitizedLog.includes('value')
      && !sanitizedLog.includes('Bearer abc')
      && !sanitizedLog.includes('secret=xyz'),
    true,
    '界面和下载日志会隐藏订阅地址及访问密钥',
  );

  console.log('--- #18 yamlHasGeneratedMarker 三态 ---');
  return (async () => {
    await goBehaviorPromise;
    shellReply = { success: true, content: 'root' };
    chk(await api.checkAdvanceFunc({ fresh: true }), true, 'advanced access probe detects root');
    const callsAfterFreshAccessProbe = shellCallCount;
    chk(await api.checkAdvanceFunc(), true, 'advanced access cache preserves the successful result');
    chk(shellCallCount, callsAfterFreshAccessProbe, 'cached advanced access avoids a second root shell call');

    shellReply = { success: true, content: '' };
    await api.readCurrentModeStatus();
    const modeStatusSyntax = spawnSync('sh', ['-n'], { input: lastShellCommand, encoding: 'utf8' });
    chk(modeStatusSyntax.status, 0, `generated configuration-summary shell passes sh -n: ${modeStatusSyntax.stderr.trim()}`);

    shellReply = { success: true, content: '0' };
    const lexicalOnly = loadPlugin(file, handler, ['yamlHasGeneratedMarker'], { lexicalHostOnly: true });
    chk(
      await lexicalOnly.api.yamlHasGeneratedMarker('/x'),
      false,
      '宿主 root 接口仅存在于插件加载作用域时仍可调用',
    );

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

    console.log('--- install toolbox preflight ---');
    shellReply = {
      success: true,
      content: 'TOOLBOX_ADDED= unzip timeout\nTOOLBOX_MISSING= \nTOOLBOX_OPTIONAL_MISSING= zip jq\nTOOLBOX_READY\n',
    };
    const toolboxReady = await api.ensureInstallToolbox();
    chk(toolboxReady.success, true, 'ready marker and shell success are both required');
    chk(toolboxReady.added, ['unzip', 'timeout'], 'auto-completed tools are parsed');
    chk(toolboxReady.optionalMissing, ['zip', 'jq'], 'optional missing tools are reported separately');
    chk(
      lastShellCommand.includes('for tool in curl unzip timeout')
        && lastShellCommand.includes('cmp ip inotifyd')
        && lastShellCommand.includes('command -v iptables')
        && lastShellCommand.includes('/system/bin/toybox'),
      true,
      'preflight checks required tools, firewall capability, and multicall fallbacks',
    );
    shellReply = {
      success: false,
      content: 'TOOLBOX_ADDED=\nTOOLBOX_MISSING= unzip iptables\nTOOLBOX_OPTIONAL_MISSING=\n',
    };
    const toolboxFailed = await api.ensureInstallToolbox();
    chk(toolboxFailed.success, false, 'missing required tools fail the preflight');
    chk(toolboxFailed.missing, ['unzip', 'iptables'], 'required missing tools are returned to the UI');
  })();
}

(async () => {
  chk(fs.existsSync(FILES.plugin), true, 'repository contains the unified plugin file');
  chk(fs.existsSync(path.join(ROOT, '猫猫TProxy_Go.js')), false, 'legacy _Go plugin filename has been removed');
  await runFor('统一版', FILES.plugin);
  console.log(`\n================ 结果: ${pass} 通过 / ${fail} 失败 ================`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('harness error:', e.message); process.exit(2); });
