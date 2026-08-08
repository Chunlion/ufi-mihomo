'use strict';
// 把 猫猫TProxy.js / 猫猫TProxy_Go.js 当成真实插件加载起来（DOM + 宿主 API 全部打桩），
// 然后针对本轮修复的每个函数做行为断言。宿主 shell 调用被拦截并按用例返回伪造结果。
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = {
  shell: path.join(ROOT, '猫猫TProxy.js'),
  go: path.join(ROOT, '猫猫TProxy_Go.js'),
  helper: path.join(ROOT, 'dist', 'kano-f50-helper-linux-arm64'),
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
  'yamlHasGeneratedMarker', 'createConfigRollbackPoint', 'buildManagedFallbackRules',
  'buildManagedRuleProviders', 'isPlainYamlObject', 'parseInstallToolboxResult',
  'ensureInstallToolbox',
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
  const isGo = file === FILES.go;
  const exportNames = [
    ...EXPORTS,
    ...RUNTIME_EXPORTS,
    ...(isGo ? ['probeBinaryHelperState', 'installBinaryHelperFromDevicePath'] : []),
  ];
  const { api } = loadPlugin(file, handler, exportNames);
  let goBehaviorPromise = Promise.resolve();

  const missing = exportNames.filter((n) => typeof api[n] === 'undefined');
  chk(missing, [], `全部待测函数均已导出 (${exportNames.length} 个)`);
  if (missing.length) return;

  chk(
    source.includes("boot_on.textContent = '开机自启';")
      && !source.includes('开机自启（已托管）')
      && !source.includes('开机自启（直接执行）')
      && !source.includes('开机自启（管理器异常）'),
    true,
    '开机自启按钮不再追加状态提示词',
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
  if (isGo) {
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
        && !clientReaderSource.includes('readBinarySnapshot'),
      true,
      'client discovery runs only when the client list is requested',
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
    isGo
      ? source.includes('const archive = await downloadCoreArchive({ allowCached: false })')
        && source.includes('command -v unzip >/dev/null 2>&1')
      : source.includes('const res0 = await runShellWithRoot')
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
    console.log(`--- ${isGo ? 'Go' : 'Shell'} runtime preflight / API / boot behavior ---`);
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
      if (isGo) {
        shellReply = {
          success: true,
          content: 'KANO_HELPER_STATE=present\n{"ok":true,"version":"0.3.2","commands":["version","snapshot","clients","network-status","policy-read","convert-subscription"]}\nKANO_HELPER_RC=0\n',
        };
        chk((await api.probeBinaryHelperState()).state, 'installed',
          'helper probe accepts a healthy executable protocol');
        shellReply = {
          success: true,
          content: 'KANO_HELPER_STATE=present\n{"ok":true,"version":"0.3.3","commands":["version","snapshot","clients","network-status","policy-read","convert-subscription"]}\nKANO_HELPER_RC=0\n',
        };
        chk((await api.probeBinaryHelperState()).state, 'installed',
          'helper probe accepts a healthy newer helper version');
        shellReply = {
          success: true,
          content: 'KANO_HELPER_STATE=present\n{"ok":true,"version":"0.3.1","commands":["version","snapshot","clients","network-status","policy-read","convert-subscription"]}\nKANO_HELPER_RC=0\n',
        };
        chk((await api.probeBinaryHelperState()).state, 'outdated',
          'helper probe marks a healthy older helper as outdated');
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
        const versionValidation = helperInstallSource.indexOf('HELPER_VERSION_TOO_OLD');
        const protocolValidation = helperInstallSource.indexOf('HELPER_COMMAND_MISSING');
        const helperCommit = helperInstallSource.indexOf('mv -f "$STAGE" "$TARGET"');
        chk(
          versionValidation >= 0 && protocolValidation > versionValidation
            && helperCommit > protocolValidation,
          true,
          'helper minimum version and command protocol are checked before activation',
        );
        const helperButtonSource = source.slice(
          source.indexOf('binaryHelperBtn.onclick = async () => {'),
          source.indexOf('binaryHelperUploadBtn.onclick = async () => {'),
        );
        chk(
          helperButtonSource.includes("const isUpdate = current.state != 'missing'")
            && helperButtonSource.includes("healthy ? '重新安装' : '更新修复'")
            && helperButtonSource.includes('preferGitee: isUpdate')
            && !helperButtonSource.includes("createToast('Go内核已安装'"),
          true,
          'helper update uses the confirmed Gitee-first reinstall path',
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
            && firstGitee >= 0 && firstGitee < firstBundled && firstBundled < fallbackGitee,
          true,
          'helper update is Gitee-first while initial installation remains bundled-first',
        );
        const mainInstallSource = source.slice(
          source.indexOf('btn_enabled.onclick = async () => {'),
          source.indexOf('btn_disabled.onclick = async () => {'),
        );
        const helperAutoInstall = mainInstallSource.indexOf('installBinaryHelperPreferred({ quiet: true })');
        const helperButtonRefresh = mainInstallSource.indexOf('await refreshBinaryHelperButton()');
        chk(
          helperAutoInstall >= 0 && helperButtonRefresh > helperAutoInstall,
          true,
          'main installation activates the bundled helper and refreshes its button state',
        );
        const helperBinary = fs.readFileSync(FILES.helper);
        chk(
          helperBinary.length > 1024
            && helperBinary.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))
            && helperBinary.readUInt16LE(18) === 0xb7,
          true,
          'bundled Go helper is a non-empty AArch64 ELF binary',
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
  await runFor('Shell 版', FILES.shell);
  await runFor('Go 版', FILES.go);
  console.log(`\n================ 结果: ${pass} 通过 / ${fail} 失败 ================`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('harness error:', e.message); process.exit(2); });
