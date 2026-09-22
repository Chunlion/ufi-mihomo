//<script>
// 猫猫TProxy v8.0.0-compat.2.3 - IPv4/IPv6 private routing; based on Chunlion/ufi-mihomo (AGPL-3.0-or-later)
((hostRunShellWithRoot) => {
const F50_ZASHBOARD_UI_URL = 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip';
const F50_FIXED_PROFILES = {"tproxy4":{"allow-lan":true,"bind-address":"0.0.0.0","dns":{"default-nameserver":["223.5.5.5","119.29.29.29"],"direct-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"direct-nameserver-follow-policy":true,"enable":true,"enhanced-mode":"redir-host","ipv6":false,"listen":"0.0.0.0:1053","nameserver":["https://1.1.1.1/dns-query#RULES","https://8.8.8.8/dns-query#RULES"],"nameserver-policy":{"+.lan":["223.5.5.5","119.29.29.29"],"+.local":["223.5.5.5","119.29.29.29"]},"prefer-h3":false,"proxy-server-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"respect-rules":false,"use-hosts":true,"use-system-hosts":false},"external-controller":"0.0.0.0:7788","external-ui":"WebUI/zashboard","find-process-mode":"off","geo-auto-update":false,"geodata-loader":"memconservative","geodata-mode":true,"ipv6":false,"log-level":"info","mixed-port":7892,"mode":"rule","port":7890,"profile":{"store-fake-ip":false,"store-selected":true},"redir-port":0,"sniffer":{"enable":true,"force-dns-mapping":true,"override-destination":true,"parse-pure-ip":true,"skip-domain":["Mijia Cloud","dlg.io.mi.com"],"skip-dst-address":["0.0.0.0/8","10.0.0.0/8","100.64.0.0/10","127.0.0.0/8","169.254.0.0/16","172.16.0.0/12","192.168.0.0/16","::1/128","fc00::/7","fe80::/10"],"sniff":{"HTTP":{"override-destination":true,"ports":[80,"8080-8880"]},"QUIC":{"override-destination":true,"ports":[443,8443]},"TLS":{"override-destination":true,"ports":[443,8443]}}},"socks-port":7891,"tproxy-port":7895,"tun":{"enable":false},"secret":"123456"},"tproxy6":{"allow-lan":true,"bind-address":"*","dns":{"default-nameserver":["223.5.5.5","119.29.29.29"],"direct-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"direct-nameserver-follow-policy":true,"enable":true,"enhanced-mode":"redir-host","ipv6":true,"listen":"[::]:1053","nameserver":["https://1.1.1.1/dns-query#RULES","https://8.8.8.8/dns-query#RULES"],"nameserver-policy":{"+.lan":["223.5.5.5","119.29.29.29"],"+.local":["223.5.5.5","119.29.29.29"]},"prefer-h3":false,"proxy-server-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"respect-rules":false,"use-hosts":true,"use-system-hosts":false},"external-controller":"0.0.0.0:7788","external-ui":"WebUI/zashboard","find-process-mode":"off","geo-auto-update":false,"geodata-loader":"memconservative","geodata-mode":true,"ipv6":true,"log-level":"info","mixed-port":7892,"mode":"rule","port":7890,"profile":{"store-fake-ip":false,"store-selected":true},"redir-port":0,"sniffer":{"enable":true,"force-dns-mapping":true,"override-destination":true,"parse-pure-ip":true,"skip-domain":["Mijia Cloud","dlg.io.mi.com"],"skip-dst-address":["0.0.0.0/8","10.0.0.0/8","100.64.0.0/10","127.0.0.0/8","169.254.0.0/16","172.16.0.0/12","192.168.0.0/16","::1/128","fc00::/7","fe80::/10"],"sniff":{"HTTP":{"override-destination":true,"ports":[80,"8080-8880"]},"QUIC":{"override-destination":true,"ports":[443,8443]},"TLS":{"override-destination":true,"ports":[443,8443]}}},"socks-port":7891,"tproxy-port":7895,"tun":{"enable":false},"secret":"123456"},"tun4":{"allow-lan":true,"bind-address":"0.0.0.0","dns":{"default-nameserver":["223.5.5.5","119.29.29.29"],"direct-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"direct-nameserver-follow-policy":true,"enable":true,"enhanced-mode":"redir-host","ipv6":false,"listen":"0.0.0.0:1053","nameserver":["https://1.1.1.1/dns-query#RULES","https://8.8.8.8/dns-query#RULES"],"nameserver-policy":{"+.lan":["223.5.5.5","119.29.29.29"],"+.local":["223.5.5.5","119.29.29.29"]},"prefer-h3":false,"proxy-server-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"respect-rules":false,"use-hosts":true,"use-system-hosts":false},"external-controller":"0.0.0.0:7788","external-ui":"WebUI/zashboard","find-process-mode":"off","geo-auto-update":false,"geodata-loader":"memconservative","geodata-mode":true,"ipv6":false,"log-level":"info","mixed-port":7892,"mode":"rule","port":7890,"profile":{"store-fake-ip":false,"store-selected":true},"redir-port":0,"sniffer":{"enable":true,"force-dns-mapping":true,"override-destination":true,"parse-pure-ip":true,"skip-domain":["Mijia Cloud","dlg.io.mi.com"],"skip-dst-address":["0.0.0.0/8","10.0.0.0/8","100.64.0.0/10","127.0.0.0/8","169.254.0.0/16","172.16.0.0/12","192.168.0.0/16","::1/128","fc00::/7","fe80::/10"],"sniff":{"HTTP":{"override-destination":true,"ports":[80,"8080-8880"]},"QUIC":{"override-destination":true,"ports":[443,8443]},"TLS":{"override-destination":true,"ports":[443,8443]}}},"socks-port":7891,"tproxy-port":0,"tun":{"auto-detect-interface":true,"auto-redirect":false,"auto-route":false,"device":"KanoTun","dns-hijack":[],"enable":true,"mtu":1500,"stack":"mixed","strict-route":false},"secret":"123456"},"tun6":{"allow-lan":true,"bind-address":"*","dns":{"default-nameserver":["223.5.5.5","119.29.29.29"],"direct-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"direct-nameserver-follow-policy":true,"enable":true,"enhanced-mode":"redir-host","ipv6":true,"listen":"[::]:1053","nameserver":["https://1.1.1.1/dns-query#RULES","https://8.8.8.8/dns-query#RULES"],"nameserver-policy":{"+.lan":["223.5.5.5","119.29.29.29"],"+.local":["223.5.5.5","119.29.29.29"]},"prefer-h3":false,"proxy-server-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"respect-rules":false,"use-hosts":true,"use-system-hosts":false},"external-controller":"0.0.0.0:7788","external-ui":"WebUI/zashboard","find-process-mode":"off","geo-auto-update":false,"geodata-loader":"memconservative","geodata-mode":true,"ipv6":true,"log-level":"info","mixed-port":7892,"mode":"rule","port":7890,"profile":{"store-fake-ip":false,"store-selected":true},"redir-port":0,"sniffer":{"enable":true,"force-dns-mapping":true,"override-destination":true,"parse-pure-ip":true,"skip-domain":["Mijia Cloud","dlg.io.mi.com"],"skip-dst-address":["0.0.0.0/8","10.0.0.0/8","100.64.0.0/10","127.0.0.0/8","169.254.0.0/16","172.16.0.0/12","192.168.0.0/16","::1/128","fc00::/7","fe80::/10"],"sniff":{"HTTP":{"override-destination":true,"ports":[80,"8080-8880"]},"QUIC":{"override-destination":true,"ports":[443,8443]},"TLS":{"override-destination":true,"ports":[443,8443]}}},"socks-port":7891,"tproxy-port":0,"tun":{"auto-detect-interface":true,"auto-redirect":false,"auto-route":false,"device":"KanoTun","dns-hijack":[],"enable":true,"inet6-address":["fdfe:dcba:9876::1/126"],"mtu":1500,"stack":"mixed","strict-route":false},"secret":"123456"},"off4":{"allow-lan":true,"bind-address":"0.0.0.0","dns":{"default-nameserver":["223.5.5.5","119.29.29.29"],"direct-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"direct-nameserver-follow-policy":true,"enable":true,"enhanced-mode":"redir-host","ipv6":false,"listen":"0.0.0.0:1053","nameserver":["https://1.1.1.1/dns-query#RULES","https://8.8.8.8/dns-query#RULES"],"nameserver-policy":{"+.lan":["223.5.5.5","119.29.29.29"],"+.local":["223.5.5.5","119.29.29.29"]},"prefer-h3":false,"proxy-server-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"respect-rules":false,"use-hosts":true,"use-system-hosts":false},"external-controller":"0.0.0.0:7788","external-ui":"WebUI/zashboard","find-process-mode":"off","geo-auto-update":false,"geodata-loader":"memconservative","geodata-mode":true,"ipv6":false,"log-level":"info","mixed-port":7892,"mode":"rule","port":7890,"profile":{"store-fake-ip":false,"store-selected":true},"redir-port":0,"sniffer":{"enable":true,"force-dns-mapping":true,"override-destination":true,"parse-pure-ip":true,"skip-domain":["Mijia Cloud","dlg.io.mi.com"],"skip-dst-address":["0.0.0.0/8","10.0.0.0/8","100.64.0.0/10","127.0.0.0/8","169.254.0.0/16","172.16.0.0/12","192.168.0.0/16","::1/128","fc00::/7","fe80::/10"],"sniff":{"HTTP":{"override-destination":true,"ports":[80,"8080-8880"]},"QUIC":{"override-destination":true,"ports":[443,8443]},"TLS":{"override-destination":true,"ports":[443,8443]}}},"socks-port":7891,"tproxy-port":0,"tun":{"enable":false},"secret":"123456"},"off6":{"allow-lan":true,"bind-address":"*","dns":{"default-nameserver":["223.5.5.5","119.29.29.29"],"direct-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"direct-nameserver-follow-policy":true,"enable":true,"enhanced-mode":"redir-host","ipv6":true,"listen":"[::]:1053","nameserver":["https://1.1.1.1/dns-query#RULES","https://8.8.8.8/dns-query#RULES"],"nameserver-policy":{"+.lan":["223.5.5.5","119.29.29.29"],"+.local":["223.5.5.5","119.29.29.29"]},"prefer-h3":false,"proxy-server-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"respect-rules":false,"use-hosts":true,"use-system-hosts":false},"external-controller":"0.0.0.0:7788","external-ui":"WebUI/zashboard","find-process-mode":"off","geo-auto-update":false,"geodata-loader":"memconservative","geodata-mode":true,"ipv6":true,"log-level":"info","mixed-port":7892,"mode":"rule","port":7890,"profile":{"store-fake-ip":false,"store-selected":true},"redir-port":0,"sniffer":{"enable":true,"force-dns-mapping":true,"override-destination":true,"parse-pure-ip":true,"skip-domain":["Mijia Cloud","dlg.io.mi.com"],"skip-dst-address":["0.0.0.0/8","10.0.0.0/8","100.64.0.0/10","127.0.0.0/8","169.254.0.0/16","172.16.0.0/12","192.168.0.0/16","::1/128","fc00::/7","fe80::/10"],"sniff":{"HTTP":{"override-destination":true,"ports":[80,"8080-8880"]},"QUIC":{"override-destination":true,"ports":[443,8443]},"TLS":{"override-destination":true,"ports":[443,8443]}}},"socks-port":7891,"tproxy-port":0,"tun":{"enable":false},"secret":"123456"}};
for (const profile of Object.values(F50_FIXED_PROFILES)) {
  profile['external-ui'] = 'WebUI/zashboard';
  profile['external-ui-url'] = F50_ZASHBOARD_UI_URL;
  profile['unified-delay'] = true;
  delete profile['external-ui-name'];
}
const F50_COMPAT_VERSION = '8.0.0-compat.2.3';
const F50_DEFAULT_SECRET = '123456';
let f50BackendReady = false;
async function ensureCompatBackend() {
  if (f50BackendReady) return true;
  const r = await runShellWithRoot(`set -e
[ "$(cat /data/clash/Tools/f50-controller.version 2>/dev/null)" = '8.0.0-compat.2.3' ] || { echo F50_BACKEND_REQUIRED; exit 1; }
sh /data/clash/Scripts/Clash.Service version`, 5000);
  f50BackendReady = !!r.success && String(r.content || '').includes('F50_CONTROLLER=8.0.0-compat.2.3');
  if (!f50BackendReady) createToast('请先点击“在线安装/更新”或“导入组件包”。', 'red', 9000);
  return f50BackendReady;
}

let lastInstallDiagnostic = null;
function f50Diagnostic(content, fallback = '操作未完成') {
  const safe = sanitizeSubscriptionSecrets(String(content || ''))
    .replace(/(?:https?|ss|ssr|vmess|vless|trojan|tuic|hysteria2?):\/\/[^\s"'<>]+/gi, '[URL_REDACTED]')
    .split(/\r?\n/).map(line => /["']?(?:password|passwd|secret|token|authorization|access_token)["']?\s*[:=]/i.test(line) ? '[SENSITIVE_ERROR_REDACTED]' : line).join('\n');
  const lines = safe.split(/\r?\n/);
  const get = key => { const row = lines.find(s => s.startsWith(key + '=')); return row ? row.slice(key.length + 1).trim() : ''; };
  const code = get('F50_INSTALL_CODE') || get('F50_START_CODE') || get('F50_CLEAN_ERROR') || get('KANO_INSTALL_ERROR');
  const backend = get('F50_INSTALL_CAUSE') || get('F50_ERROR');
  const cleanup = get('F50_CLEAN_ERROR');
  const cause = backend || cleanup || code;
  const labels = {
    zip_missing_or_empty: '安装包不存在或为空，请重新上传。',
    unzip_missing: '设备缺少解压程序，安装未执行。',
    archive_list_failed: '无法读取 ZIP 目录，请重新上传有效的组件包。',
    unsafe_archive_path: '安装包含越界路径，已拒绝解压。',
    archive_symlink: '安装包含符号链接，未替换现有组件。',
    unzip_failed: '安装包解压失败或超时，旧组件尚未替换。',
    missing_controller: '安装包缺少控制器，旧组件尚未替换。',
    missing_core: '全新安装需要包含 Mihomo 内核的完整组件包。',
    controller_not_executable: '控制器无法执行，请检查架构和执行权限。',
    core_not_executable: 'Mihomo 内核无法执行，请检查架构和执行权限。',
    yaml_parser_not_executable: '配置解析组件无法执行，请检查 yq 架构和权限。',
    service_script_invalid: 'Clash.Service 存在 Shell 语法错误，旧组件尚未替换。',
    service_script_failed: 'Clash.Service 无法调用控制器，旧组件尚未替换。',
    controller_protocol_mismatch: '控制器与当前 JS 的接口版本不兼容。',
    service_protocol_mismatch: '服务脚本与控制器不配套。',
    panel_candidate_rejected: '组件包中的面板不是有效 Zashboard，已保留原面板。',
    panel_postcheck_failed: 'Zashboard 替换后校验失败，已回滚安装。',
    missing_service_wrapper: '组件包缺少启动包装器 Clash.Service，已停止安装。',
    invalid_subscription: '订阅地址未配置或无效，请填写不含账号信息的 HTTPS 订阅地址。',
    invalid_config: '用户配置格式错误，请修正 YAML/JSON；原配置未被覆盖。',
    configuration_missing: '组件包没有初始配置，原安装保持不变。',
    old_environment_inspection_failed: '无法确认旧运行环境，已停止安装。',
    old_environment_cleanup_failed: '旧运行环境清理未完成，已停止替换组件。',
    installation_busy: '另一个安装事务仍在运行或未结束，未修改现有安装。',
    preserve_user_data_failed: '保留用户配置失败，已取消安装。',
    commit_failed: '组件目录替换失败，请查看回滚结果。',
    network_apply_failed: '\u7f51\u7edc\u63a5\u7ba1\u5e94\u7528\u5931\u8d25\uff0c\u8bf7\u67e5\u770b\u5177\u4f53\u9632\u706b\u5899\u6216\u8def\u7531\u9519\u8bef\u3002',
    service_failed: '\u670d\u52a1\u811a\u672c\u6267\u884c\u5931\u8d25\u3002',
    start_timeout: '\u6838\u5fc3\u542f\u52a8\u8d85\u65f6\uff0c\u672a\u786e\u8ba4\u542f\u52a8\u6210\u529f\u3002',
    activation_unverified: '\u670d\u52a1\u672a\u8fd4\u56de\u542f\u52a8\u786e\u8ba4\uff0c\u672a\u786e\u8ba4\u542f\u52a8\u6210\u529f\u3002',
    activation_failed: '\u65b0\u7ec4\u4ef6\u542f\u52a8\u5931\u8d25\uff0c\u8bf7\u67e5\u770b\u540e\u7aef\u5177\u4f53\u539f\u56e0\u3002',
    interrupted: '安装被中断，未确认完成。',
    transaction_interrupted: '安装事务未完整执行，请查看设备状态。',
    config_probe_failed: '配置读取超时或解析组件执行失败，未覆盖用户配置。',
    process_respawned: '停止后仍检测到猫猫进程，已停止安装。',
    process_table_unreadable: '无法读取进程表，不能确认旧进程已停止。',
    journal_restore_incomplete: '网络参数或配置事务恢复未完成，已停止安装。',
    network_rules_remain: '猫猫网络规则仍有残留，已停止安装。',
    owned_route_table_still_used_by_foreign_rule: '猫猫路由表仍被其他规则引用，未删除共享路由。',
  };
  let summary = labels[code] || cause || lines.find(line => line.trim()) || fallback;
  if (code === 'old_environment_cleanup_failed' && cleanup) summary += ' ' + (labels[cleanup] || cleanup);
  if (!code && /timeout|timed out|超时/i.test(safe)) summary = '设备命令超时，未确认安装完成；请查看状态与日志。';
  if (/subscription URL must be HTTPS without userinfo|empty provider URL/i.test(cause)) summary = labels.invalid_subscription;
  else if (/CONFIG_TEST_FAILED|configuration is not a YAML mapping|yq parse failed|rules must be a list/i.test(cause)) summary = '配置校验未通过，请检查配置格式和策略引用。';
  else if (/policy|iptables|ip6tables|route|downstream|network|TUN|listener/i.test(cause) && code === 'activation_failed') summary = '网络接管规则应用失败：' + cause;
  else if (['activation_failed','service_failed','network_apply_failed'].includes(code) && backend) summary = '\u542f\u52a8\u672a\u5b8c\u6210\uff1a' + backend;
  const serviceRc = (lines.filter(line => line.startsWith('START_SERVICE_RC=')).pop() || '').slice('START_SERVICE_RC='.length).trim();
  if (!backend && (serviceRc === '124' || serviceRc === '137')) summary = '\u6838\u5fc3\u542f\u52a8\u8d85\u65f6\uff0c\u672a\u786e\u8ba4\u542f\u52a8\u6210\u529f\u3002';
  const rollback = get('F50_ROLLBACK');
  if (rollback && !['restored', 'restored_stopped'].includes(rollback)) summary += ' 回滚未完成：' + rollback;
  else if (rollback === 'restored') summary += ' 已恢复安装前状态。';
  const keyLines = lines.filter(line => /^(F50_(?:INSTALL_(?:CODE|CAUSE)|ERROR|START_(?:CODE|OK)|ROLLBACK|RECOVERY_[A-Z_]+)|START_SERVICE_RC|START_STATE)=/.test(line));
  const details = safe.length <= 6000 ? safe : keyLines.slice(0, 12).join('\n').slice(0, 2500) + '\n[OUTPUT_TRUNCATED]\n' + safe.slice(-3500);
  return {code, summary: summary.slice(0, 280), details, serviceRc, rollback, ok: false};
}
function f50Error(content) { return f50Diagnostic(content).summary; }

function f50StartResult(response = {}, fallback = '') {
  const diagnostic = f50Diagnostic(response.content || fallback, '\u670d\u52a1\u672a\u8fd4\u56de\u542f\u52a8\u786e\u8ba4');
  const text = diagnostic.details;
  const marked = /^F50_START_OK=1$/m.test(text) && /^START_STATE=started_verified_process$/m.test(text);
  const ok = marked && !/^F50_ERROR=|^F50_START_OK=0$/m.test(text);
  const code = (text.match(/^F50_START_CODE=(.+)$/m) || [])[1] || diagnostic.code || (ok ? 'started' : 'start_result_unknown');
  return {...response, ok, success: ok, code, detail: text, content: text,
    summary: ok ? '\u6838\u5fc3\u4e0e\u63a5\u7ba1\u89c4\u5219\u5df2\u542f\u52a8' : diagnostic.summary,
    serviceRc: diagnostic.serviceRc, transportOk: response.success === true};
}
function buildF50StartScript(action) {
  if (!['start', 'restart'].includes(action)) throw new Error('invalid_start_action');
  return buildF50MaintenanceFunctions() + '\nf50_start_service ' + shellQuote(action) + ' 85\n';
}
function f50UninstallVerdict(response = {}) {
  const detail = f50Diagnostic(response.content || '').details;
  const remains = detail.split(/\r?\n/).filter(line => line.startsWith('F50_REMAINS='));
  const unknown = /^F50_CHECK_UNKNOWN=|^F50_UNINSTALL_STATE=unknown$/m.test(detail);
  const clean = /^F50_UNINSTALL_STATE=clean$/m.test(detail) && /^UNINSTALL_VERIFIED$/m.test(detail);
  if (remains.length) return {ok:false, code:'residual', detail, remains};
  if (clean && !unknown) return {ok:true, code:'clean', detail, remains};
  return {ok:false, code:'unknown', detail, remains};
}
async function performF50Uninstall() {
  const diagnostics = [];
  const stages = buildUninstallStages();
  for (let i=0; i<stages.length; i++) {
    operationStage(stages[i].title, i, stages.length+1);
    try {
      const response = await runShellWithRoot(stages[i].script, stages[i].timeout);
      diagnostics.push({stage:stages[i].title, transportOk:response?.success === true,
        detail:f50Diagnostic(response?.content || 'F50_STAGE_ERROR=empty_response').details});
    } catch (error) {
      if (error?.name === 'OperationCancelled') throw error;
      diagnostics.push({stage:stages[i].title, transportOk:false,
        detail:f50Diagnostic(error?.message || String(error)).details});
    }
  }
  operationStage('\u590d\u67e5\u5378\u8f7d\u7ed3\u679c', stages.length, stages.length+1);
  let finalResponse;
  try {
    // Independent read-only proof: no new cancellable worker or plugin directory is created by the wrapper.
    finalResponse = await hostRunShellWithRoot.call(globalThis, buildF50FinalCheckScript(), 25000);
  } catch (error) {
    finalResponse = {success:false, content:'F50_CHECK_UNKNOWN=final_transport\n' + f50Diagnostic(error?.message || String(error)).details};
  }
  const verdict = f50UninstallVerdict(finalResponse);
  const details = diagnostics.map(item => 'STAGE=' + item.stage + '\nTRANSPORT_OK=' + Number(item.transportOk) + '\n' + item.detail).join('\n')
    + '\nFINAL_TRANSPORT_OK=' + Number(finalResponse?.success === true) + '\n' + verdict.detail;
  const summary = verdict.ok ? '\u732b\u732b\u53ca\u5168\u90e8\u7ec4\u4ef6\u6570\u636e\u5df2\u5378\u8f7d'
    : verdict.code === 'residual' ? '\u6700\u7ec8\u590d\u67e5\u53d1\u73b0\u732b\u732b\u6b8b\u7559\uff0c\u8be6\u7ec6\u9879\u89c1\u201c\u72b6\u6001\u4e0e\u65e5\u5fd7\u201d'
    : '\u5378\u8f7d\u7ed3\u679c\u672a\u786e\u8ba4\uff1a\u6700\u7ec8\u72b6\u6001\u8bfb\u53d6\u5931\u8d25\uff0c\u4e0d\u7b49\u4e8e\u5b58\u5728\u6b8b\u7559';
  lastInstallDiagnostic = {...verdict, summary, details, diagnostics};
  return {...verdict, summary, details};
}

async function f50Command(action, timeout = 60000) {
  if (!(await ensureCompatBackend())) return { success: false, content: 'F50_BACKEND_REQUIRED' };
  return runShellWithRoot("[ \"$(cat /data/clash/Tools/f50-controller.version 2>/dev/null)\" = '8.0.0-compat.2.3' ] || { echo F50_BACKEND_REQUIRED; exit 1; }\nsh " + shellQuote(CLASH_SERVICE) + ' ' + action, timeout);
}
let f50PackageInput = null;
function buildF50ZashboardValidationFunction() { return `
f50_validate_zashboard() {
  ui_dir=$1
  [ -d "$ui_dir" ] || { echo F50_PANEL_CODE=missing_directory; return 1; }
  [ -s "$ui_dir/index.html" ] || { echo F50_PANEL_CODE=missing_index; return 1; }
  [ -s "$ui_dir/manifest.webmanifest" ] || { echo F50_PANEL_CODE=missing_manifest; return 1; }
  [ -s "$ui_dir/registerSW.js" ] || { echo F50_PANEL_CODE=missing_register_sw; return 1; }
  [ -d "$ui_dir/assets" ] || { echo F50_PANEL_CODE=missing_assets; return 1; }
  [ ! -d "$ui_dir/_nuxt" ] || { echo F50_PANEL_CODE=wrong_identity; return 1; }
  if grep -Eiq '<title>[[:space:]]*metacubexd[[:space:]]*</title>' "$ui_dir/index.html"; then
    echo F50_PANEL_CODE=wrong_identity; return 1
  fi
  grep -Eiq '<title>[[:space:]]*zashboard[[:space:]]*</title>' "$ui_dir/index.html" || { echo F50_PANEL_CODE=wrong_identity; return 1; }
  manifest_compact=$(tr -d '[:space:]' < "$ui_dir/manifest.webmanifest" 2>/dev/null)
  case "$manifest_compact" in
    *'"name":"zashboard"'*'"short_name":"zashboard"'*) ;;
    *) echo F50_PANEL_CODE=wrong_manifest; return 1 ;;
  esac
  main_asset=$(sed -n 's/.*src="\\.\\/\\(assets\\/[^"?]*\\.js\\)[^"]*".*/\\1/p' "$ui_dir/index.html" | head -n 1)
  [ -n "$main_asset" ] && [ -s "$ui_dir/$main_asset" ] || { echo F50_PANEL_CODE=missing_main_asset; return 1; }
  grep -qi 'zashboard' "$ui_dir/$main_asset" || { echo F50_PANEL_CODE=wrong_bundle; return 1; }
  echo F50_PANEL_VALIDATED=1
  return 0
}
`; }
function buildF50MaintenanceFunctions() { return `# Shared bootstrap maintenance: no installed helper is required.
F50_ROOT=\${F50_ROOT:-/data/clash}
F50_PROC=\${F50_PROC:-/proc}
F50_SYSNET=\${F50_SYSNET:-/sys/class/net}
F50_DATA=\${F50_ROOT%/*}
F50_BOOT=\${F50_BOOT:-/sdcard/ufi_tools_boot.sh}
F50_TASK=\${KANO_TPROXY_TASK:-}
umask 077
${buildF50ZashboardValidationFunction()}
f50_limit() {
  f50_seconds=$1; shift
  if command -v timeout >/dev/null 2>&1; then
    timeout -k 2 "$f50_seconds" "$@"
  else
    "$@" & f50_child=$!
    ( sleep "$f50_seconds"; kill -TERM "$f50_child" 2>/dev/null; sleep 2; kill -KILL "$f50_child" 2>/dev/null ) & f50_guard=$!
    wait "$f50_child"; f50_rc=$?
    kill "$f50_guard" 2>/dev/null; wait "$f50_guard" 2>/dev/null
    return "$f50_rc"
  fi
}
f50_redact() {
  awk '{
    low=tolower($0)
    if(low ~ /bearer[ \\t]|["\\047]?(secret|password|passwd|token|authorization|access_token)["\\047]?[ \\t]*[:=]/){print "[SENSITIVE_ERROR_REDACTED]";next}
    gsub(/(https?|ss|ssr|vmess|vless|trojan|tuic|hysteria2?):\\/\\/[^ \\t"<>]+/,"[URL_REDACTED]")
    print
  }'
}
f50_stat() {
  F50_STAT_START=; F50_STAT_PARENT=; F50_STAT_STATE=
  { IFS= read -r ps_stat < "$F50_PROC/$1/stat"; } 2>/dev/null || return 1
  ps_stat=\${ps_stat##*) }
  set -f; set -- $ps_stat; set +f
  [ "$#" -ge 20 ] || return 1
  F50_STAT_STATE=$1; F50_STAT_PARENT=$2
  shift 19; F50_STAT_START=$1
  case "$F50_STAT_START:$F50_STAT_PARENT" in *[!0-9:]*) return 1 ;; esac
}
f50_owned_exe() {
  case "$1" in
    "$F50_ROOT"/*|"$F50_ROOT".rollback-*/*|"$F50_ROOT".rollback.*/*|"$F50_ROOT".stage-*/*|"$F50_ROOT".stage.*/*|"$F50_ROOT".before_install.*/*|"$F50_ROOT".before_repair.*/*|"$F50_ROOT".failed_repair.*/*|"$F50_DATA"/kano_tproxy_tools/*|"$F50_DATA"/kano_yq_runtime/*) return 0 ;;
  esac
  return 1
}
f50_scan() {
  # Only candidate comm values incur readlink/tr. Ancestors and read-only probes are excluded.
  [ -r "$F50_PROC" ] && [ -x "$F50_PROC" ] || { echo F50_CLEAN_ERROR=process_table_unreadable; return 1; }
  ps_out=$1; ps_graph="$ps_out.graph"; ps_protected=" 1 $$ "
  ps_parent=$$
  while f50_stat "$ps_parent"; do
    ps_parent=$F50_STAT_PARENT
    case "$ps_parent" in ''|0|1) break ;; esac
    case "$ps_protected" in *" $ps_parent "*) break ;; esac
    ps_protected="$ps_protected$ps_parent "
  done
  : > "$ps_graph" || return 1
  for ps_dir in "$F50_PROC"/[0-9]*; do
    ps_pid=\${ps_dir##*/}; ps_owned=0; ps_kind=child; ps_excluded=0
    { IFS= read -r ps_name < "$ps_dir/comm"; } 2>/dev/null || continue
    f50_stat "$ps_pid" || continue
    case "$ps_protected" in *" $ps_pid "*) ps_excluded=1 ;; esac
    case "$F50_STAT_STATE" in Z|X) ps_excluded=1 ;; esac
    if [ "$ps_excluded" = 0 ]; then
      case "$ps_name" in
        Clash.Core|Clash|clash|mihomo|clashctl*|kano-f50*|mosdns*|yq_linux*|Clash.*|sh|bash|dash|mksh|toybox|busybox|inotifyd|curl|wget|unzip|tar|gzip|xz|timeout)
          ps_exe=$(readlink "$ps_dir/exe" 2>/dev/null)
          ps_exe=\${ps_exe% (deleted)}
          if f50_owned_exe "$ps_exe"; then
            ps_owned=1; ps_kind=binary
            case "\${ps_exe##*/}" in Clash.Core|mihomo) ps_kind=core ;; esac
          fi
          case "\${ps_exe##*/}" in
            clashctl*|Clash.*|sh|bash|dash|mksh|toybox|busybox|inotifyd)
              ps_args=$(tr '\\000' '\\n' < "$ps_dir/cmdline" 2>/dev/null)
              ps_index=0; ps_script=0; ps_action=
              while IFS= read -r ps_arg; do
                if [ "$ps_index" = 1 ]; then
                  case "\${ps_exe##*/}" in clashctl*) ps_action=$ps_arg ;; esac
                fi
                [ "$ps_script" = 2 ] && { ps_action=$ps_arg; ps_script=3; }
                case "$ps_arg" in
                  -c) break ;;
                  */Scripts/Clash.Service|*/Scripts/Clash.Inotify|*/Scripts/Clash.KanoStart|*/Scripts/Clash.PolicyTools|*/Scripts/Clash.MacBypass)
                    if f50_owned_exe "$ps_arg"; then ps_owned=1; ps_kind=service; ps_script=2; fi ;;
                esac
                ps_index=$((ps_index+1))
              done <<EOF_F50_ARGS
$ps_args
EOF_F50_ARGS
              case "$ps_action" in snapshot|status|version|--version|help|--help|profile|verify-clean|verify-stopped) ps_owned=0; ps_excluded=1 ;; esac
              ;;
          esac
          if [ "$ps_owned:$ps_excluded" = 0:0 ]; then
            case "\${ps_exe##*/}" in sh|bash|dash|mksh|toybox|busybox|curl|wget|unzip|tar|gzip|xz|timeout)
              ps_env=$(tr '\\000' '\\n' < "$ps_dir/environ" 2>/dev/null)
              while IFS= read -r ps_var; do
                case "$ps_var" in KANO_TPROXY_TASK=mm_*)
                  ps_tag=\${ps_var#KANO_TPROXY_TASK=}
                  [ "$ps_tag" = "$F50_TASK" ] || { ps_owned=1; ps_kind=worker; }
                  break ;;
                esac
              done <<EOF_F50_ENV
$ps_env
EOF_F50_ENV
              ;;
            esac
          fi
          ;;
      esac
    fi
    printf '%s %s %s %s %s %s\\n' "$ps_pid" "$F50_STAT_PARENT" "$F50_STAT_START" "$ps_owned" "$ps_excluded" "$ps_kind" >> "$ps_graph"
  done
  awk '{par[$1]=$2; start[$1]=$3; own[$1]=$4; skip[$1]=$5; kind[$1]=$6}
    END{ do {changed=0; for(p in par) if(!skip[p]&&!own[p]&&own[par[p]]&&!skip[par[p]]){own[p]=1;changed=1}}while(changed);
      for(p in par)if(own[p]&&!skip[p])print p,start[p],kind[p] }' "$ps_graph" > "$ps_out"
  ps_rc=$?; rm -f "$ps_graph"; return "$ps_rc"
}
f50_same_process() {
  f50_stat "$1" || return 1
  [ "$F50_STAT_START" = "$2" ] || return 1
  case "$F50_STAT_STATE" in Z|X) return 1 ;; esac
}
f50_stop_recorded() {
  ps_list=$1
  [ -s "$ps_list" ] || { echo PROCESSES_STOPPED; return 0; }
  while read -r ps_pid ps_start ps_kind; do
    f50_same_process "$ps_pid" "$ps_start" && kill -TERM "$ps_pid" 2>/dev/null
  done < "$ps_list"
  sleep 1
  ps_killed=0
  while read -r ps_pid ps_start ps_kind; do
    if f50_same_process "$ps_pid" "$ps_start"; then
      kill -KILL "$ps_pid" 2>/dev/null; ps_killed=1
    fi
  done < "$ps_list"
  [ "$ps_killed" = 0 ] || sleep 1
  ps_remaining=0
  while read -r ps_pid ps_start ps_kind; do
    if f50_same_process "$ps_pid" "$ps_start"; then
      printf 'PROCESS_REMAINS=%s\\n' "$ps_pid"; ps_remaining=1
    fi
  done < "$ps_list"
  [ "$ps_remaining" = 0 ] || return 1
  echo PROCESSES_STOPPED
}
f50_table_absent() {
  case "$1" in *'Table does not exist'*|*'table does not exist'*|*'Address family not supported'*|*'address family not supported'*|*'FIB table does not exist'*) return 0 ;; esac
  return 1
}
f50_save() {
  fw_ipt=$1; fw_out=$2; fw_save="\${fw_ipt}-save"
  if command -v "$fw_save" >/dev/null 2>&1; then
    if f50_limit 5 "$fw_save" > "$fw_out" 2> "$fw_out.err"; then rm -f "$fw_out.err"; return 0; fi
    fw_err=$(cat "$fw_out.err"); rm -f "$fw_out.err"
    f50_table_absent "$fw_err" && { : > "$fw_out"; return 0; }
    printf 'F50_CLEAN_ERROR=%s_snapshot_failed\\n' "$fw_ipt"; return 1
  fi
  if ! command -v "$fw_ipt" >/dev/null 2>&1; then
    if [ "$fw_ipt" = ip6tables ] && [ ! -e "$F50_PROC/net/if_inet6" ]; then : > "$fw_out"; return 0; fi
    printf 'F50_CLEAN_ERROR=%s_missing\\n' "$fw_ipt"; return 1
  fi
  : > "$fw_out"
  for fw_table in mangle nat filter raw; do
    fw_text=$(f50_limit 4 "$fw_ipt" -t "$fw_table" -S 2>&1); fw_rc=$?
    if [ "$fw_rc" != 0 ]; then
      f50_table_absent "$fw_text" && continue
      printf 'F50_CLEAN_ERROR=%s_%s_unreadable\\n' "$fw_ipt" "$fw_table"; return 1
    fi
    printf '*%s\\n%s\\nCOMMIT\\n' "$fw_table" "$fw_text" >> "$fw_out"
  done
}
f50_firewall_plan() {
  # Tokenize save/-S output without eval; comments can contain spaces, quotes and fake '-j' text.
  awk -v bin="$1" '
  function owned(c){return c ~ /^KANO_F50_[A-Za-z0-9_]+$/ || c ~ /^KANO_(POLICY_PRE|POLICY|DNS_HIJACK|DNS|QUIC_BLOCK|QUIC|MAC_BYPASS|PR_FWD)(_A|_B)?$/}
  function words(s,a, i,c,q,esc,k,v,started){
    for(i in a)delete a[i]; k=0;v="";q="";esc=0;started=0;
    for(i=1;i<=length(s);i++){c=substr(s,i,1);
      if(esc){v=v c;esc=0;started=1;continue}
      if(c=="\\\\"&&q!="\\047"){esc=1;started=1;continue}
      if(q!=""){if(c==q)q="";else v=v c;started=1;continue}
      if(c=="\\047"||c=="\\042"){q=c;started=1;continue}
      if(c==" "||c=="\\t"){if(started){a[++k]=v;v="";started=0};continue}
      v=v c;started=1
    }
    if(q!=""||esc)return -1; if(started)a[++k]=v;return k
  }
  function arg(s){if(s ~ /[\\r\\n]/){bad=1;return};print "a" s}
  function begin(){print "@";arg(bin);arg("-t");arg(table)}
  /^\\*/{table=substr($0,2);if(table !~ /^(mangle|nat|filter|raw|security)$/)bad=1;next}
  /^:/ {c=substr($1,2);if(owned(c))chains[table SUBSEP c]=1;next}
  /^-N /{if(owned($2))chains[table SUBSEP $2]=1;next}
  /^-A /{
    n=words($0,a);if(n<2){bad=1;next};target="";mark="";port="";
    for(i=3;i<n;i++){if(a[i]=="--comment"){i++;continue};if(a[i]=="-j"||a[i]=="-g")target=a[i+1];if(a[i]=="--on-port")port=a[i+1];if(a[i]=="--tproxy-mark")mark=a[i+1]}
    native=(target=="TPROXY"&&port=="7895"&&(mark=="0x10000000/0x10000000"||mark=="268435456/268435456"));
    if(!owned(a[2])&&(owned(target)||native)){begin();arg("-D");for(i=2;i<=n;i++)arg(a[i]);print "!"}
  }
  END{
    for(c in chains){split(c,p,SUBSEP);table=p[1];begin();arg("-F");arg(p[2]);print "!"}
    for(c in chains){split(c,p,SUBSEP);table=p[1];begin();arg("-X");arg(p[2]);print "!"}
    if(bad)exit 2
  }' "$2" > "$3" || { echo F50_CLEAN_ERROR=firewall_snapshot_parse_failed; return 1; }
}
f50_ip_snapshot() {
  rt_file=$1; shift
  if f50_limit 4 ip "$@" > "$rt_file" 2> "$rt_file.err"; then rm -f "$rt_file.err"; return 0; fi
  rt_err=$(cat "$rt_file.err"); rm -f "$rt_file.err"
  f50_table_absent "$rt_err" && { : > "$rt_file"; return 0; }
  echo F50_CLEAN_ERROR=route_snapshot_failed; return 1
}
f50_drop_detached_tun_rules() {
  for detached_family in 4 6; do
    detached_rules=$(ip -"$detached_family" rule show 2>/dev/null) || continue
    if printf '%s\n' "$detached_rules" | grep -Fq 'iif KanoTun [detached] lookup 17667'; then
      ip -"$detached_family" rule del pref 1776 iif KanoTun lookup 17667 || {
        echo "F50_ERROR=detached_tun_rule_cleanup_failed_ipv$detached_family"
        return 1
      }
    fi
  done
}
f50_disable_unsupported_ipv6_dns_hijack() {
  compat_options="$F50_ROOT/Policy/options.conf"
  [ -r "$compat_options" ] || return 0
  grep -qx 'ipv6=on' "$compat_options" || return 0
  grep -qx 'dns_hijack=on' "$compat_options" || return 0
  compat_nat_probe=$(ip6tables -t nat -S 2>&1); compat_nat_rc=$?
  [ "$compat_nat_rc" = 0 ] && return 0
  printf '%s\n' "$compat_nat_probe" | grep -Eiq "can't initialize ip6tables table.*nat|Table does not exist" || return 0
  compat_tmp="$compat_options.kano_compat.$$"
  awk '{if($0=="dns_hijack=on") print "dns_hijack=off"; else print}' "$compat_options" > "$compat_tmp" || {
    rm -f "$compat_tmp" 2>/dev/null || true
    echo F50_ERROR=ipv6_nat_compat_write_failed
    return 1
  }
  chmod 600 "$compat_tmp" 2>/dev/null || true
  mv -f "$compat_tmp" "$compat_options" || {
    rm -f "$compat_tmp" 2>/dev/null || true
    echo F50_ERROR=ipv6_nat_compat_commit_failed
    return 1
  }
  echo F50_WARNING=ipv6_nat_unavailable_dns_hijack_disabled
}
f50_routes_plan() {
  awk -v family="$1" '
  function val(k, i){for(i=2;i<NF;i++)if($i==k)return $(i+1);return ""}
  function arg(s){print "a" s}
  function begin(){print "@";arg("ip");arg(family)}
  FNR==NR{
    t=val("lookup");p=$1;sub(/:$/,"",p);m=val("fwmark");d=val("iif");
    # ip rule show may append display-only tokens such as [detached]; rebuild commands from owned fields only.
    if(p=="1777"&&t=="17666"&&(m=="0x10000000/0x10000000"||m=="268435456/268435456")){
      begin();arg("rule");arg("del");arg("pref");arg(p);arg("fwmark");arg(m);arg("lookup");arg(t);print "!"
    } else if(p=="1776"&&t=="17667"&&(d=="lo"||d=="KanoTun")){
      begin();arg("rule");arg("del");arg("pref");arg(p);arg("iif");arg(d);arg("lookup");arg(t);print "!"
    }
    else if(t=="17666"||t=="17667")foreign[t]=1;
    next
  }
  {t=val("table");if((t=="17666"||t=="17667")&&val("proto")=="242")routes[t]=1}
  END{for(t in routes){if(foreign[t]){bad=1;continue};begin();arg("route");arg("flush");arg("table");arg(t);arg("proto");arg("242");print "!"};if(bad)exit 3}
  ' "$2" "$3" > "$4" || { echo F50_CLEAN_ERROR=owned_route_table_still_used_by_foreign_rule; return 1; }
}
f50_network_snapshot() {
  nw_dir=$1
  mkdir -p "$nw_dir" || return 1
  : > "$nw_dir/plan"
  for nw_bin in iptables ip6tables; do
    f50_save "$nw_bin" "$nw_dir/$nw_bin.save" || return 1
    f50_firewall_plan "$nw_bin" "$nw_dir/$nw_bin.save" "$nw_dir/$nw_bin.plan" || return 1
    cat "$nw_dir/$nw_bin.plan" >> "$nw_dir/plan" || return 1
  done
  for nw_family in 4 6; do
    f50_ip_snapshot "$nw_dir/rules$nw_family" -"$nw_family" rule show || return 1
    f50_ip_snapshot "$nw_dir/routes$nw_family" -"$nw_family" route show table all || return 1
    # A sentinel ensures NR/FNR still distinguishes an empty rule set from the route file.
    printf '\\n' >> "$nw_dir/rules$nw_family"
    f50_routes_plan -"$nw_family" "$nw_dir/rules$nw_family" "$nw_dir/routes$nw_family" "$nw_dir/ip$nw_family.plan" || return 1
    cat "$nw_dir/ip$nw_family.plan" >> "$nw_dir/plan" || return 1
  done
  f50_ip_snapshot "$nw_dir/links" -o link show || return 1
  awk '$2 ~ /^KanoTun(:|@)/{print "@\\naip\\nalink\\nadelete\\naKanoTun\\n!"}' "$nw_dir/links" >> "$nw_dir/plan"
}
f50_execute_plan() {
  plan_file=$1; plan_bad=0; set --
  while IFS= read -r plan_line; do
    case "$plan_line" in
      @) set -- ;;
      a*) set -- "$@" "\${plan_line#a}" ;;
      '!')
        case "$1" in ip|iptables|ip6tables) ;; *) echo F50_CLEAN_ERROR=invalid_cleanup_command; return 1 ;; esac
        plan_output=$(f50_limit 4 "$@" 2>&1); plan_rc=$?
        if [ "$plan_rc" != 0 ]; then
          printf 'F50_CLEAN_ERROR=network_delete_failed:%s:rc=%s\\n' "$1" "$plan_rc"
          printf '%s\\n' "$plan_output" | f50_redact
          plan_bad=1
        fi
        ;;
    esac
  done < "$plan_file"
  [ "$plan_bad" = 0 ]
}
f50_inspect() {
  f50_scan "$F50_WORK/pids" || return 1
  f50_network_snapshot "$F50_WORK/net" || return 1
  F50_OLD_INSTALL=0; F50_OLD_BOOT=0; F50_OLD_RUNNING=0; F50_OLD_FOUND=0
  for inspect_file in Proxy/Clash.Core Scripts/Clash.Service Scripts/clashctl_arm64 Scripts/clashctl_armv7; do
    [ ! -s "$F50_ROOT/$inspect_file" ] || F50_OLD_INSTALL=1
  done
  while read -r inspect_pid inspect_start inspect_kind; do [ "$inspect_kind" != core ] || F50_OLD_RUNNING=1; done < "$F50_WORK/pids"
  if [ -f "$F50_BOOT" ] && awk '/\\/data\\/clash\\/Scripts\\/Clash\\.|\\/data\\/f50_boot_fix\\/clash_boot\\.sh/{f=1} END{exit !f}' "$F50_BOOT"; then F50_OLD_BOOT=1; fi
  if [ "$F50_OLD_INSTALL:$F50_OLD_BOOT" != 0:0 ] || [ -s "$F50_WORK/pids" ] || [ -s "$F50_WORK/net/plan" ]; then F50_OLD_FOUND=1; fi
  printf 'F50_OLD_FOUND=%s\\nF50_OLD_INSTALL=%s\\nF50_OLD_RUNNING=%s\\nF50_OLD_BOOT=%s\\n' "$F50_OLD_FOUND" "$F50_OLD_INSTALL" "$F50_OLD_RUNNING" "$F50_OLD_BOOT"
  echo F50_INSPECT_OK=1
}
f50_clean_environment() {
  clean_recover=missing; clean_detail=
  # Never invoke a missing installation on a clean device: recover itself creates Policy/.
  if [ -s "$F50_ROOT/Scripts/Clash.Service" ]; then
    clean_detail=$(CLASH_ROOT="$F50_ROOT" f50_limit 35 sh "$F50_ROOT/Scripts/Clash.Service" recover 2>&1); clean_rc=$?
    if [ "$clean_rc" = 0 ]; then clean_recover=ok; else clean_recover=failed; fi
    printf 'F50_RECOVER_RC=%s\\n' "$clean_rc"
    [ "$clean_recover" = ok ] || printf '%s\\n' "$clean_detail" | f50_redact
  fi
  f50_scan "$F50_WORK/pids" || return 1
  f50_network_snapshot "$F50_WORK/net" || return 1
  # Native recovery failed or left evidence: only the captured candidates/rules are touched.
  if [ -s "$F50_WORK/pids" ]; then
    if [ -s "$F50_ROOT/Scripts/Clash.Service" ] || [ -s "$F50_ROOT/Proxy/Clash.Core" ]; then
      mkdir -p "$F50_ROOT/Policy" && printf '%s\\n' 'maintenance' > "$F50_ROOT/Policy/stopped" || { echo F50_CLEAN_ERROR=stop_latch_failed; return 1; }
    fi
    f50_stop_recorded "$F50_WORK/pids" || return 1
  fi
  if [ -s "$F50_WORK/net/plan" ]; then
    clean_plan_rc=0
    f50_execute_plan "$F50_WORK/net/plan" || clean_plan_rc=$?
    f50_network_snapshot "$F50_WORK/check" || return 1
    [ ! -s "$F50_WORK/check/plan" ] || { echo F50_CLEAN_ERROR=network_rules_remain; return 1; }
    [ "$clean_plan_rc" = 0 ] || echo F50_CLEAN_WARNING=delete_error_final_network_clean
  fi
  # A failed native recovery may include journal/sysctl restoration beyond the firewall.
  for clean_journal in download.transaction.json rp-filter.json legacy-policy.json; do
      if [ -s "$F50_ROOT/Policy/$clean_journal" ]; then echo F50_CLEAN_ERROR=journal_restore_incomplete; return 1; fi
  done
  [ "$clean_recover" != failed ] || echo F50_CLEAN_WARNING=native_recovery_failed_fallback_verified
  echo F50_CLEAN_OK=1
}
f50_artifact_paths() {
  # Bounded plugin paths only. Never enumerate or remove the shared UFI uploads folder.
  for artifact in \\
    "$F50_ROOT" "$F50_ROOT".rollback-* "$F50_ROOT".rollback.* \\
    "$F50_ROOT".stage-* "$F50_ROOT".stage.* "$F50_ROOT".before_install.* \\
    "$F50_ROOT".before_repair.* "$F50_ROOT".failed_repair.* \\
    "$F50_DATA"/.f50-check.* "$F50_DATA"/.f50-clean.* "$F50_DATA"/.f50-delete.* \\
    "$F50_DATA"/.f50-verify.* "$F50_DATA"/.f50-install.* \\
    "$F50_DATA"/clash.install.lock "$F50_DATA"/clash.install.lock.d \\
    "$F50_DATA"/kano_tproxy_tools "$F50_DATA"/kano_yq_runtime \\
    "$F50_DATA"/kano_clash.zip "$F50_DATA"/kano_clash.zip.new.* "$F50_DATA"/kano_clash.source \\
    "$F50_DATA"/kano_mihomo_latest.dlog "$F50_DATA"/kano_mihomo_latest.dlog.verify \\
    "$F50_DATA"/kano_subscription_config.raw "$F50_DATA"/kano_subscription_config.yaml \\
    "$F50_DATA"/kano_subscription_mode_check.out "$F50_DATA"/kano_template_write_check.out \\
    "$F50_DATA"/kano_template_flow_debug.out "$F50_DATA"/kano_policy_boot.log \\
    "$F50_DATA"/kano_policy_boot.previous.log "$F50_DATA"/kano_clash_config_test.log \\
    "$F50_DATA"/kano_clash_start.log "$F50_DATA"/kano_clash_repair_zip_test.out \\
    "$F50_DATA"/kano_clash_repair_unzip.out "$F50_DATA"/kano_clash_repair_config.err \\
    "$F50_DATA"/kano_yq_expression_smoke.err "$F50_DATA"/kano_yq_repair.zip \\
    "$F50_DATA"/kano_yq_repair.zip.new.* "$F50_DATA"/kano_template_node_check.err \\
    "$F50_DATA"/kano_template_upload_check.err "$F50_DATA"/kano_clash_zip_test.out \\
    "$F50_DATA"/kano_clash_unzip.out "$F50_DATA"/kano_policy_script_check.out \\
    "$F50_DATA"/kano_config_package_archive_test.out "$F50_DATA"/kano_config_package_archive_list.out \\
    "$F50_DATA"/kano_config_package_yaml_test.out "$F50_DATA"/kano_runtime_landed_check.err \\
    "$F50_DATA"/kano_yaml_after_override.yaml "$F50_DATA"/kano_ui_rules_patch.yaml \\
    "$F50_DATA"/mm_uninstall_backup.err "$F50_DATA"/kano_mihomo_api_*.out \\
    "$F50_DATA"/kano_mihomo_api_*.err "$F50_DATA"/kano_ui_rules_*.txt \\
    "$F50_DATA"/kano_helper_bundled_* "$F50_DATA"/kano_helper_gitee_* \\
    "$F50_DATA"/kano_clash_install.* "$F50_DATA"/kano_clash_repair.* \\
    "$F50_DATA"/kano_clash_user_backup.* "$F50_DATA"/kano_policy_save.* \\
    "$F50_DATA"/kano_sub_persist.* "$F50_DATA"/kano_template_upload_* \\
    "$F50_DATA"/kano_subscription_save_* "$F50_DATA"/kano_subscription_urls_before_template_* \\
    "$F50_DATA"/kano_config_package_restore_* "$F50_DATA"/kano_compat_*.json \\
    "$F50_DATA"/kano_compat_bootstrap_* "$F50_DATA"/kano_install_unzip.log \\
    "$F50_DATA"/kano_uninstall_recover.log "$F50_DATA"/kano_uninstall_boot.log \\
    "$F50_DATA"/kano_uninstall_artifacts.log "$F50_DATA"/f50_boot_fix/clash_boot.sh; do
    [ "$artifact" != "$F50_WORK" ] || continue
    if [ -e "$artifact" ] || [ -L "$artifact" ]; then printf '%s\\n' "$artifact"; fi
  done
}
f50_root_has_data() {
  [ -d "$F50_ROOT" ] || return 1
  # A latch left by an old uninstaller is not an installation worth backing up.
  root_files=$(find "$F50_ROOT" \\( -type f -o -type l \\) ! -path "$F50_ROOT/Policy/stopped" -print 2>/dev/null)
  [ -n "$root_files" ]
}
f50_runtime_guard() {
  f50_scan "$F50_WORK/guard.pids" || return 1
  f50_network_snapshot "$F50_WORK/guard.net" || return 1
  if [ -s "$F50_WORK/guard.pids" ]; then echo F50_DELETE_BLOCKED=owned_process_alive; return 1; fi
  if [ -s "$F50_WORK/guard.net/plan" ]; then echo F50_DELETE_BLOCKED=owned_network_active; return 1; fi
}
f50_remove_artifacts() {
  delete_failed=0
  f50_artifact_paths > "$F50_WORK/artifacts" || return 1
  while IFS= read -r artifact; do
    rm -rf "$artifact" 2>/dev/null || delete_failed=1
    if [ -e "$artifact" ] || [ -L "$artifact" ]; then
      printf 'F50_ARTIFACT_DELETE_FAILED=%s\\n' "$artifact"; delete_failed=1
    fi
  done < "$F50_WORK/artifacts"
  [ "$delete_failed" = 0 ]
}
f50_final_probe() {
  F50_FINAL_REMAINS=0; F50_FINAL_UNKNOWN=0
  if f50_scan "$F50_WORK/final.pids"; then
    while read -r final_pid final_start final_kind; do
      printf 'F50_REMAINS=process:%s:%s\\n' "$final_pid" "$final_kind"; F50_FINAL_REMAINS=1
    done < "$F50_WORK/final.pids"
  else
    echo F50_CHECK_UNKNOWN=processes; F50_FINAL_UNKNOWN=1
  fi
  if f50_network_snapshot "$F50_WORK/final.net"; then
    for final_family in iptables ip6tables ip4 ip6; do
      if [ -s "$F50_WORK/final.net/$final_family.plan" ]; then
        printf 'F50_REMAINS=network:%s\\n' "$final_family"; F50_FINAL_REMAINS=1
      fi
    done
    if awk '$2 ~ /^KanoTun(:|@)/{f=1} END{exit !f}' "$F50_WORK/final.net/links"; then
      echo F50_REMAINS=interface:KanoTun; F50_FINAL_REMAINS=1
    fi
  else
    echo F50_CHECK_UNKNOWN=network; F50_FINAL_UNKNOWN=1
  fi
  if [ ! -r "$F50_DATA" ] || [ ! -x "$F50_DATA" ]; then
    echo F50_CHECK_UNKNOWN=data_directory; F50_FINAL_UNKNOWN=1
  else
    f50_artifact_paths > "$F50_WORK/final.artifacts"
    while IFS= read -r artifact; do
      printf 'F50_REMAINS=path:%s\\n' "$artifact"; F50_FINAL_REMAINS=1
    done < "$F50_WORK/final.artifacts"
  fi
  if [ -f "$F50_BOOT" ]; then
    if [ ! -r "$F50_BOOT" ]; then echo F50_CHECK_UNKNOWN=boot_file; F50_FINAL_UNKNOWN=1
    elif awk '/\\/data\\/clash\\/Scripts\\/Clash\\.|\\/data\\/f50_boot_fix\\/clash_boot\\.sh/{f=1} END{exit !f}' "$F50_BOOT"; then
      printf 'F50_REMAINS=autostart:%s\\n' "$F50_BOOT"; F50_FINAL_REMAINS=1
    fi
  fi
}
f50_verify_zashboard_endpoint() {
  panel_probe=$(f50_validate_zashboard "$F50_ROOT/Proxy/WebUI/zashboard" 2>&1)
  panel_rc=$?
  printf '%s\n' "$panel_probe"
  if [ "$panel_rc" != 0 ]; then
    echo F50_ERROR=panel_disk_identity_mismatch
    return 1
  fi
  panel_tmp="$F50_DATA/kano_f50_panel_probe.$$"
  panel_curl=
  for panel_curl_candidate in ${shellQuote(`${F50_FILES_DIR}/curl`)} ${shellQuote(`${KANO_INSTALL_TOOLBOX_BIN}/curl`)} "$(command -v curl 2>/dev/null)"; do
    [ -n "$panel_curl_candidate" ] && [ -x "$panel_curl_candidate" ] || continue
    panel_curl="$panel_curl_candidate"
    break
  done
  [ -n "$panel_curl" ] || { echo F50_ERROR=panel_probe_curl_missing; return 1; }
  panel_status=$("$panel_curl" -fsS --noproxy '*' --connect-timeout 3 --max-time 6 \
    -o "$panel_tmp" -w '%{http_code}' "http://127.0.0.1:7788/ui/?_f50=$$" 2>/dev/null)
  panel_rc=$?
  if [ "$panel_rc" != 0 ] || [ "$panel_status" != 200 ]; then
    rm -f "$panel_tmp" 2>/dev/null || true
    echo "F50_ERROR=panel_http_status_\${panel_status:-unavailable}"
    return 1
  fi
  rm -f "$panel_tmp" 2>/dev/null || true
  echo F50_PANEL_HTTP_STATUS=200
  return 0
}
f50_start_service() {
  start_action=$1; start_budget=$2
  case "$start_action" in start|restart) ;; *) echo F50_ERROR=invalid_start_action; return 2 ;; esac
  start_log="$F50_DATA/kano_clash_start.log"
  log_before=$(cksum "$start_log" 2>/dev/null)
  f50_disable_unsupported_ipv6_dns_hijack || return 1
  f50_drop_detached_tun_rules || return 1
  start_raw=$(CLASH_ROOT="$F50_ROOT" f50_limit "$start_budget" sh "$F50_ROOT/Scripts/Clash.Service" "$start_action" 2>&1)
  F50_START_RC=$?
  F50_START_DETAIL=$(printf '%s\\n' "$start_raw" | f50_redact)
  # Read only a log changed by this invocation; a previous failed install is not current evidence.
  log_after=$(cksum "$start_log" 2>/dev/null)
  case "$F50_START_DETAIL" in *F50_ERROR=*) ;; *)
    if [ -n "$log_after" ] && [ "$log_after" != "$log_before" ]; then
      log_detail=$(tail -n 80 "$start_log" 2>/dev/null | f50_redact | awk '/^F50_ERROR=|^START_SERVICE_RC=|^START_STATE=|^F50_START_CODE=/{print}')
      [ -z "$log_detail" ] || F50_START_DETAIL="$F50_START_DETAIL
$log_detail"
    fi ;;
  esac
  start_cause=$(printf '%s\\n' "$F50_START_DETAIL" | awk '/^F50_ERROR=/{sub(/^F50_ERROR=/,"");print;exit}')
  F50_START_CODE=service_failed; F50_START_OK=0
  case "$start_cause" in
    *'subscription URL must be HTTPS without userinfo'*|*'empty provider URL'*) F50_START_CODE=invalid_subscription ;;
    *CONFIG_TEST_FAILED*|*'configuration is not a YAML mapping'*|*'yq parse failed'*|*'rules must be a list'*) F50_START_CODE=invalid_config ;;
    *iptables*|*ip6tables*|*policy*|*route*|*downstream*|*network*|*TUN*|*listener*) F50_START_CODE=network_apply_failed ;;
    *) case "$F50_START_RC" in 124|137) F50_START_CODE=start_timeout ;; esac ;;
  esac
  if [ "$F50_START_RC" = 0 ] && [ -z "$start_cause" ]; then
    case "$F50_START_DETAIL" in
      *START_STATE=started_verified_process*) F50_START_OK=1; F50_START_CODE=started ;;
      *) F50_START_CODE=activation_unverified ;;
    esac
  fi
  if [ "$F50_START_OK" = 1 ] && ! f50_verify_zashboard_endpoint; then
    F50_START_OK=0
    F50_START_CODE=panel_http_failed
  fi
  printf '%s\\n' "$F50_START_DETAIL"
  printf 'START_SERVICE_RC=%s\\nF50_START_CODE=%s\\nF50_START_OK=%s\\n' "$F50_START_RC" "$F50_START_CODE" "$F50_START_OK"
  [ "$F50_START_OK" = 1 ]
}
`; }
function buildF50InspectScript() {
  return buildF50MaintenanceFunctions() + `
F50_WORK=$(mktemp -d "$F50_DATA/.f50-check.XXXXXX") || exit 1
trap 'rm -rf "$F50_WORK"' EXIT
f50_inspect
`;
}
function buildF50InstallScript(uploaded) {
  return buildF50MaintenanceFunctions() + '\nZIP=' + shellQuote(uploaded) + '\n' + `# The transaction owns staging, backup, activation and rollback until a terminal result.
set +e
F50_WORK=$(mktemp -d "$F50_DATA/.f50-install.XXXXXX") || { echo F50_INSTALL_CODE=stage_create_failed; exit 1; }
STAGE="$F50_WORK/unpacked"; PKG=; BACKUP=; HAD_OLD=0; MOVED_OLD=0; COMMITTED=0; SUCCESS=0
OLD_RUNNING=0; OLD_LATCH=0; CLEAN_ATTEMPTED=0; NEEDS_CONFIG=; HAD_USER_CONFIG=0
F50_INSTALL_CODE=; F50_INSTALL_DETAIL=; KEEP_WORK=0; LOCKED=0
LOCK="$F50_DATA/clash.install.lock.d"

f50_install_fail() {
  F50_INSTALL_CODE=$1; F50_INSTALL_DETAIL=\${2:-}; return 1
}
f50_restore_previous() {
  # Refuse to overwrite a live new runtime. The backup stays available if cleanup fails.
  if [ "$COMMITTED" = 1 ]; then
    if ! f50_clean_environment; then echo F50_ROLLBACK=blocked_by_cleanup; KEEP_WORK=1; return 1; fi
    if ! mv "$F50_ROOT" "$F50_WORK/failed-new"; then echo F50_ROLLBACK=move_new_failed; KEEP_WORK=1; return 1; fi
    if [ "$HAD_OLD" = 1 ]; then
      if ! mv "$BACKUP" "$F50_ROOT"; then echo F50_ROLLBACK=restore_directory_failed; KEEP_WORK=1; return 1; fi
      BACKUP=
    fi
    COMMITTED=0; MOVED_OLD=0
  elif [ "$MOVED_OLD" = 1 ]; then
    if ! mv "$BACKUP" "$F50_ROOT"; then echo F50_ROLLBACK=restore_directory_failed; KEEP_WORK=1; return 1; fi
    BACKUP=; MOVED_OLD=0
  fi
  if [ "$OLD_RUNNING" = 1 ] && [ "$CLEAN_ATTEMPTED" = 1 ] && [ -s "$F50_ROOT/Scripts/Clash.Service" ]; then
    case "$F50_INSTALL_CODE" in interrupted|transport_unknown)
      echo F50_ROLLBACK=restored_stopped; return 0 ;;
    esac
    restore_output=$(CLASH_ROOT="$F50_ROOT" f50_limit 55 sh "$F50_ROOT/Scripts/Clash.Service" start 2>&1); restore_rc=$?
    if [ "$restore_rc" != 0 ]; then
      printf '%s\\n' "$restore_output" | f50_redact
      printf 'F50_ROLLBACK=old_start_failed\\nROLLBACK_SERVICE_RC=%s\\n' "$restore_rc"; return 1
    fi
    case "$restore_output" in *START_STATE=started_verified_process*) ;; *) echo F50_ROLLBACK=old_start_unverified; return 1 ;; esac
  elif [ "$OLD_LATCH" = 0 ] && [ "$HAD_OLD" = 1 ] && [ "$CLEAN_ATTEMPTED" = 1 ]; then
    rm -f "$F50_ROOT/Policy/stopped" || { echo F50_ROLLBACK=restore_latch_failed; return 1; }
  fi
  echo F50_ROLLBACK=restored
}
f50_install_finish() {
  finish_rc=$?
  trap - EXIT HUP INT TERM
  if [ "$SUCCESS" != 1 ]; then
    [ -n "$F50_INSTALL_CODE" ] || F50_INSTALL_CODE=transaction_interrupted
    printf 'F50_INSTALL_CODE=%s\\n' "$F50_INSTALL_CODE"
    if [ -n "$F50_INSTALL_DETAIL" ]; then
      printf '%s\\n' "$F50_INSTALL_DETAIL" | f50_redact | awk '/^F50_ERROR=/{sub(/^F50_ERROR=/,"F50_INSTALL_CAUSE=");print;exit}'
      printf '%s\\n' "$F50_INSTALL_DETAIL" | f50_redact
    fi
    if [ "$COMMITTED" = 1 ] || [ "$MOVED_OLD" = 1 ] || [ "$CLEAN_ATTEMPTED" = 1 ]; then
      f50_restore_previous || finish_rc=1
    fi
    [ -z "$BACKUP" ] || printf 'F50_RECOVERY_BACKUP=%s\\n' "$BACKUP"
    finish_rc=1
  fi
  if [ "$KEEP_WORK" = 0 ]; then
    rm -rf "$F50_WORK" || { echo F50_INSTALL_WARNING=staging_cleanup_failed; finish_rc=1; }
  else
    printf 'F50_RECOVERY_WORK=%s\\n' "$F50_WORK"
  fi
  if [ "$LOCKED" = 1 ]; then
    rm -f "$LOCK/pid"
    rmdir "$LOCK" || { echo F50_INSTALL_WARNING=lock_cleanup_failed; finish_rc=1; }
  fi
  if [ "$SUCCESS" = 1 ]; then
    printf 'F50_INSTALL_STATUS=%s\nF50_CONFIG_STATE=%s\nKANO_INSTALL_OK=1\n' "$status" "$NEEDS_CONFIG"
    [ -z "$BACKUP" ] || printf 'F50_BACKUP_LEFT=%s\n' "$BACKUP"
    finish_rc=0
  fi
  exit "$finish_rc"
}
trap f50_install_finish EXIT
trap 'F50_INSTALL_CODE=interrupted; exit 130' HUP INT TERM
if ! mkdir "$LOCK" 2>/dev/null; then f50_install_fail installation_busy; exit 1; fi
LOCKED=1
printf '%s\\n' "$$" > "$LOCK/pid" || { f50_install_fail lock_write_failed; exit 1; }
[ ! -L "$F50_ROOT" ] || { f50_install_fail target_symlink; exit 1; }
[ -s "$ZIP" ] || { f50_install_fail zip_missing_or_empty; exit 1; }
command -v unzip >/dev/null 2>&1 || { f50_install_fail unzip_missing; exit 1; }
# No fixed ZIP hash, resource list or template/UI fingerprints.
names=$(unzip -Z1 "$ZIP" 2>/dev/null); list_rc=$?
if [ "$list_rc" != 0 ]; then
  listing=$(unzip -l "$ZIP" 2>/dev/null); list_rc=$?
  names=$(printf '%s\\n' "$listing" | awk '/^[ \\t]*[0-9]+[ \\t]+[-0-9]+[ \\t]+[0-9:]+[ \\t]+/ {sub(/^[ \\t]*[0-9]+[ \\t]+[-0-9]+[ \\t]+[0-9:]+[ \\t]+/,"");print}')
fi
[ "$list_rc" = 0 ] && [ -n "$names" ] || { f50_install_fail archive_list_failed; exit 1; }
while IFS= read -r member; do
  case "$member" in /*|../*|*/../*|*/..|..|*\\\\*) f50_install_fail unsafe_archive_path; exit 1 ;; esac
  # Symlink-bearing archives are checked after staging; no archive scripts are run by unzip.
done <<EOF_F50_MEMBERS
$names
EOF_F50_MEMBERS
mkdir -p "$STAGE" || { f50_install_fail stage_create_failed; exit 1; }
unzip_output=$(f50_limit 35 unzip -q "$ZIP" -d "$STAGE" 2>&1); unzip_rc=$?
[ "$unzip_rc" = 0 ] || { f50_install_fail unzip_failed "$unzip_output"; exit 1; }
links=$(find "$STAGE" -type l 2>/dev/null)
[ -z "$links" ] || { f50_install_fail archive_symlink; exit 1; }
CTL=$(find "$STAGE" -type f -name clashctl_arm64 | head -n 1)
[ -n "$CTL" ] || { f50_install_fail missing_controller; exit 1; }
PKG=\${CTL%/Scripts/clashctl_arm64}
case "$PKG" in "$STAGE"|"$STAGE"/*) ;; *) f50_install_fail invalid_package_root; exit 1 ;; esac
if [ ! -s "$PKG/Proxy/Clash.Core" ]; then
  [ -s "$F50_ROOT/Proxy/Clash.Core" ] || { f50_install_fail missing_core; exit 1; }
  MERGED="$F50_WORK/merged"
  cp -pR "$F50_ROOT" "$MERGED" && cp -pR "$PKG/." "$MERGED/" || { f50_install_fail patch_merge_failed; exit 1; }
  PKG=$MERGED
fi
mkdir -p "$PKG/Scripts" "$PKG/Proxy" "$PKG/Tools" "$PKG/Policy" || { f50_install_fail package_directory_failed; exit 1; }
[ -s "$PKG/Scripts/Clash.Service" ] || { f50_install_fail missing_service_wrapper; exit 1; }
for file in "$PKG"/Scripts/* "$PKG"/Tools/kano-f50-helper* "$PKG"/Tools/yq_linux_arm64 "$PKG"/Tools/mosdns_arm64 "$PKG"/Proxy/Clash.Core; do
  [ ! -f "$file" ] || chmod 755 "$file" || { f50_install_fail executable_permission_failed; exit 1; }
done
probe=$(CLASH_ROOT="$PKG" f50_limit 5 "$PKG/Scripts/clashctl_arm64" version 2>&1); probe_rc=$?
[ "$probe_rc" = 0 ] || { f50_install_fail controller_not_executable "$probe"; exit 1; }
case "$probe" in *F50_CONTROLLER=8.0.0-compat.2.3*) ;; *) f50_install_fail controller_protocol_mismatch; exit 1 ;; esac
probe=$(f50_limit 5 "$PKG/Proxy/Clash.Core" -v 2>&1); probe_rc=$?
[ "$probe_rc" = 0 ] || { f50_install_fail core_not_executable "$probe"; exit 1; }
sh -n "$PKG/Scripts/Clash.Service" || { f50_install_fail service_script_invalid; exit 1; }
probe=$(CLASH_ROOT="$PKG" f50_limit 5 sh "$PKG/Scripts/Clash.Service" version 2>&1); probe_rc=$?
[ "$probe_rc" = 0 ] || { f50_install_fail service_script_failed "$probe"; exit 1; }
case "$probe" in *F50_CONTROLLER=8.0.0-compat.2.3*) ;; *) f50_install_fail service_protocol_mismatch; exit 1 ;; esac
panel_probe=$(f50_validate_zashboard "$PKG/Proxy/WebUI/zashboard" 2>&1); panel_rc=$?
printf '%s\\n' "$panel_probe"
[ "$panel_rc" = 0 ] || { f50_install_fail panel_candidate_rejected "$panel_probe"; exit 1; }
[ ! -e "$PKG/Proxy/WebUI/metacubexd" ] || { f50_install_fail unexpected_panel_payload metacubexd; exit 1; }
printf 'F50_BINARY_PROBES=ok\\n'

# Repeat detection after unpacking: an old service may have started while uploading.
f50_inspect || { f50_install_fail old_environment_inspection_failed; exit 1; }
OLD_RUNNING=$F50_OLD_RUNNING
[ ! -e "$F50_ROOT/Policy/stopped" ] || OLD_LATCH=1
if f50_root_has_data; then HAD_OLD=1; fi
[ ! -s "$F50_ROOT/Proxy/config.yaml" ] || HAD_USER_CONFIG=1
f50_preserve_user_data() {
# Preserve templates too: they are user-editable, not disposable executable resources.
for rel in Proxy/config.yaml Proxy/subscription_urls.txt Proxy/cache.db Proxy/rules Proxy/rule-providers Proxy/proxies Proxy/mac_bypass.txt Proxy/Policy Tools/template.yaml Tools/template.base.yaml Tools/override.js Tools/rule_override.json Tools/rule_override_applied.json Tools/sub_rule_mode.conf Tools/sub_user_agent.conf Policy/options.conf Policy/device_bypass.txt Policy/direct_domain.list Policy/direct_ip.list Policy/proxy_domain.list Policy/reject_domain.list; do
  src="$F50_ROOT/$rel"; dst="$PKG/$rel"
  [ -e "$src" ] || continue
  [ ! -L "$src" ] || { f50_install_fail user_data_symlink; return 1; }
  mkdir -p "\${dst%/*}" && rm -rf "$dst" && cp -pR "$src" "$dst" || { f50_install_fail preserve_user_data_failed; return 1; }
done
# Custom provider/rule files under Proxy are user data, not part of executable/UI replacement.
for src in "$F50_ROOT"/Proxy/*; do
  [ -e "$src" ] || continue
  case "\${src##*/}" in Clash.Core|GeoIP.dat|GeoSite.dat|WebUI|Clash.log|config.yaml|subscription_urls.txt|cache.db|rules|rule-providers|proxies|mac_bypass.txt|Policy) continue ;; esac
  [ ! -L "$src" ] || { f50_install_fail user_data_symlink; return 1; }
  dst="$PKG/Proxy/\${src##*/}"
  rm -rf "$dst" && cp -pR "$src" "$dst" || { f50_install_fail preserve_user_data_failed; return 1; }
done
}
f50_preserve_user_data || exit 1

YQ="$PKG/Tools/yq_linux_arm64"
CFG="$PKG/Proxy/config.yaml"
[ -s "$CFG" ] || { f50_install_fail configuration_missing; exit 1; }
probe=$(f50_limit 5 "$YQ" --version 2>&1); probe_rc=$?
[ "$probe_rc" = 0 ] || { f50_install_fail yaml_parser_not_executable; exit 1; }
for template_file in "$PKG/Tools/template.yaml" "$PKG/Tools/template.base.yaml"; do
  [ -s "$template_file" ] || { f50_install_fail template_missing "$(basename "$template_file")"; exit 1; }
  "$YQ" e -e 'tag == "!!map"' "$template_file" >/dev/null 2>&1 || {
    f50_install_fail template_not_yaml_map "$(basename "$template_file")"
    exit 1
  }
done
# Panel fields are repaired by Clash.Service only after clashctl start/restart succeeds.
f50_preflight_config() {
  NEEDS_CONFIG=ready
  f50_limit 5 "$YQ" e -e 'tag == "!!map" and ((.proxies // []) | tag == "!!seq") and ((."proxy-providers" // {}) | tag == "!!map")' "$CFG" >/dev/null 2>&1
  parse_rc=$?
  case "$parse_rc" in 124|137|126|127) f50_install_fail config_probe_failed; return 1 ;; esac
  if [ "$parse_rc" != 0 ]; then NEEDS_CONFIG=invalid_config; return 0; fi
  urls=$(f50_limit 5 "$YQ" e -r '."proxy-providers"[] | select(.type == "http") | (.url // "")' "$CFG" 2>/dev/null); urls_rc=$?
  case "$urls_rc" in 124|137|126|127) f50_install_fail config_probe_failed; return 1 ;; esac
  if [ "$urls_rc" != 0 ]; then NEEDS_CONFIG=invalid_config; return 0; fi
  http_count=$(f50_limit 5 "$YQ" e -r '[."proxy-providers"[] | select(.type == "http")] | length' "$CFG" 2>/dev/null); count_rc=$?
  [ "$count_rc" = 0 ] || { f50_install_fail config_probe_failed; return 1; }
  case "$http_count" in ''|*[!0-9]*) f50_install_fail config_probe_failed; return 1 ;; esac
  if [ "$http_count" != 0 ]; then
    while IFS= read -r url; do
      case "$url" in
        https://*) authority=\${url#https://}; authority=\${authority%%[/?#]*}
          case "$authority" in ''|*@*|*[[:space:]]*) NEEDS_CONFIG=invalid_subscription ;; esac ;;
        *) NEEDS_CONFIG=invalid_subscription ;;
      esac
    done <<EOF_F50_URLS
$urls
EOF_F50_URLS
  fi
  if [ "$NEEDS_CONFIG" = ready ]; then
    sources=$(f50_limit 5 "$YQ" e -r '((.proxies // []) | length) + ((."proxy-providers" // {}) | length)' "$CFG" 2>/dev/null); sources_rc=$?
    [ "$sources_rc" = 0 ] || { f50_install_fail config_probe_failed; return 1; }
    case "$sources" in ''|*[!0-9]*) f50_install_fail config_probe_failed; return 1 ;; esac
    [ "$sources" != 0 ] || NEEDS_CONFIG=missing_subscription
  fi
}
f50_preflight_config || exit 1
# URL syntax is preflighted here; the unchanged Controller remains authoritative (HTTPS + no userinfo).
case "$NEEDS_CONFIG" in invalid_config|invalid_subscription)
  if [ "$HAD_USER_CONFIG" = 0 ] || [ "$OLD_RUNNING" = 1 ]; then f50_install_fail "$NEEDS_CONFIG"; exit 1; fi ;;
esac
if [ "$F50_OLD_FOUND" = 1 ]; then
  CLEAN_ATTEMPTED=1
  f50_clean_environment || { f50_install_fail old_environment_cleanup_failed; exit 1; }
  # Native recovery may repair both the config and cached providers from a prior transaction.
  f50_preserve_user_data || exit 1
  f50_preflight_config || exit 1
    case "$NEEDS_CONFIG" in invalid_config|invalid_subscription)
    if [ "$HAD_USER_CONFIG" = 0 ] || [ "$OLD_RUNNING" = 1 ]; then f50_install_fail "$NEEDS_CONFIG"; exit 1; fi ;;
  esac
else
  echo F50_CLEAN_STATE=skipped_no_old_environment
fi
printf '%s\\n' 'explicit start required' > "$PKG/Policy/stopped" || { f50_install_fail stopped_latch_failed; exit 1; }
if [ "$HAD_OLD" = 0 ] && [ -d "$F50_ROOT" ]; then
  # Remove only the known latch and empty directory scaffold; unexpected new data blocks the transaction.
  rm -f "$F50_ROOT/Policy/stopped" || { f50_install_fail stale_latch_remove_failed; exit 1; }
  find "$F50_ROOT" -depth -type d -exec rmdir {} \\; 2>/dev/null
  [ ! -e "$F50_ROOT" ] || { f50_install_fail target_changed_during_install; exit 1; }
fi
if [ "$HAD_OLD" = 1 ]; then
  BACKUP="$F50_ROOT.rollback.install.\${F50_WORK##*.}"
  [ ! -e "$BACKUP" ] || { f50_install_fail backup_already_exists; exit 1; }
  mv "$F50_ROOT" "$BACKUP" || { BACKUP=; f50_install_fail backup_rename_failed; exit 1; }
  MOVED_OLD=1
fi
if ! mv "$PKG" "$F50_ROOT"; then
  f50_install_fail commit_failed; exit 1
fi
COMMITTED=1
panel_probe=$(f50_validate_zashboard "$F50_ROOT/Proxy/WebUI/zashboard" 2>&1); panel_rc=$?
printf '%s\\n' "$panel_probe"
[ "$panel_rc" = 0 ] || { f50_install_fail panel_postcheck_failed "$panel_probe"; exit 1; }
if f50_start_service start 85; then
  status=installed_running
else
  f50_install_fail "$F50_START_CODE" "$F50_START_DETAIL"
  exit 1
fi
if [ -n "$BACKUP" ]; then
  if rm -rf "$BACKUP"; then BACKUP=; else echo F50_INSTALL_WARNING=backup_cleanup_failed; fi
fi
SUCCESS=1
exit 0
`;
}
async function installF50PackageAtDevicePath(uploaded) {
  lastInstallDiagnostic = null;
  try {
    operationStage('检查旧运行环境');
    const checked = await runShellWithRoot(buildF50InspectScript(), 25000);
    const text = String(checked?.content || '');
    if (!checked?.success || !text.includes('F50_INSPECT_OK=1')) {
      throw new Error(text || 'F50_INSTALL_CODE=old_environment_inspection_failed');
    }
    const hasOld = /^F50_OLD_FOUND=1$/m.test(text);
    operationStage(hasOld ? '安装组件并清理已检测到的旧环境' : '解压、验证并安装组件');
    const result = await runShellWithRoot(buildF50InstallScript(uploaded), 150000);
    const output = String(result?.content || '');
    if (!result?.success || !/^KANO_INSTALL_OK=1$/m.test(output)) {
      throw new Error(output || 'F50_INSTALL_CODE=transaction_interrupted');
    }
    pluginArtifactsRemoved = false; f50BackendReady = false;
    invalidateStatusSnapshot(); invalidateBinarySnapshot(); runtimePreflightCache = null;
    const state = (output.match(/^F50_INSTALL_STATUS=(.+)$/m) || [])[1];
    const configState = (output.match(/^F50_CONFIG_STATE=(.+)$/m) || [])[1];
    let message = state === 'installed_running' ? '组件已安装，核心与接管规则已启动'
      : state === 'installed_stopped' ? '组件已更新，保持原来的停止状态'
      : configState === 'invalid_subscription' ? '组件已安装；订阅地址无效，请配置无账号信息的 HTTPS 地址'
      : configState === 'invalid_config' ? '组件已安装；请修正原配置格式后启动'
      : '组件已安装，请先配置订阅（核心未启动）';
    const warning = (output.match(/^F50_INSTALL_WARNING=(.+)$/m) || [])[1];
    const recoveredWithFallback = /^F50_CLEAN_WARNING=/m.test(output);
    if (recoveredWithFallback) message += '；旧恢复报错后已通过兜底清理复查';
    if (warning) message += '；临时文件清理警告：' + warning;
    lastInstallDiagnostic = {...f50Diagnostic(output), summary: message, ok: true};
    operationFinish(true, message);
    createToast(safeTextToHtml(message), warning || recoveredWithFallback ? 'yellow' : 'green', 9000);
    return true;
  } catch (error) {
    lastInstallDiagnostic = f50Diagnostic(error?.message || String(error), '安装未完成');
    operationFinish(false, lastInstallDiagnostic.summary);
    if (error?.name !== 'OperationCancelled') createToast(safeTextToHtml(lastInstallDiagnostic.summary) + '<br>详细信息见“状态与日志”。', 'red', 15000);
    return false;
  }
}

async function installF50PackageFromNetwork() {
  return runCriticalOperation('安装核心', async () => {
    operationStage('下载组件包');
    const archive = await downloadCoreArchive({ allowCached: false });
    if (!archive.ok) {
      const detail = archive.content || archive.message || '下载安装包失败';
      operationFinish(false, '下载安装包失败');
      createToast('下载安装包失败<br>' + safeTextToHtml(detail), 'red', 15000);
      return false;
    }
    try { return await installF50PackageAtDevicePath(DOWNLOAD_ZIP); }
    finally {
      const removed = await runShellWithRoot('rm -f ' + shellQuote(DOWNLOAD_ZIP) + ' ' + shellQuote(DOWNLOAD_LOG) + ' ' + shellQuote(DOWNLOAD_SOURCE_FILE), 5000)
        .catch(error => ({success:false, content:f50Diagnostic(error?.message || String(error)).details}));
      if (!removed?.success && lastInstallDiagnostic) lastInstallDiagnostic.details += '\nF50_INSTALL_WARNING=download_cache_cleanup_failed';
    }
  });
}

async function chooseF50Package() {
  if (!f50PackageInput) {
    f50PackageInput = document.createElement('input');
    f50PackageInput.type = 'file';
    f50PackageInput.accept = '.zip,application/zip';
    f50PackageInput.hidden = true;
    document.body.appendChild(f50PackageInput);
    f50PackageInput.onchange = async () => {
      const file = f50PackageInput.files && f50PackageInput.files[0];
    f50PackageInput.value = '';
    if (!file) return;
    await runCriticalOperation('安装核心', async () => {
        let uploaded = '';
        try {
          operationStage('上传组件包');
          uploaded = await uploadFileToDevice(file);
          return await installF50PackageAtDevicePath(uploaded);
        } catch (error) {
          const message = f50Error(error && (error.message || String(error))) || '上传组件包失败';
          operationFinish(false, message);
          createToast('安装未完成<br>' + safeTextToHtml(message), 'red', 15000);
          return false;
        } finally {
          if (uploaded) {
            try {
              const removed = await runShellWithRoot('rm -f ' + shellQuote(uploaded), 5000);
              if (!removed?.success) throw new Error('uploaded_package_cleanup_failed');
            } catch (cleanupError) {
              if (cleanupError?.name !== 'OperationCancelled') {
                if (lastInstallDiagnostic) lastInstallDiagnostic.details += '\nF50_INSTALL_WARNING=uploaded_package_cleanup_failed';
                createToast('上传包临时文件删除失败，未改变安装结果。', 'yellow', 7000);
              }
            }
          }
        }
      });
    };
  }
  f50PackageInput.click();
}


  // KPR: dual-stack private routing; disabled until explicitly enabled.
// SPDX-License-Identifier: AGPL-3.0-or-later
// CIDR arithmetic uses bit strings so IPv6 never passes through a JS Number.
function createPrivateRouteLogic() {
  'use strict';
  const PRIVATE = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'fc00::/7'];
  const META = 'x-kano-private-route';
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function address(bits, family) {
    if (family === 4) return bits.match(/.{8}/g).map((b) => parseInt(b, 2)).join('.');
    const groups = bits.match(/.{16}/g).map((b) => parseInt(b, 2).toString(16));
    let best = -1, length = 1;
    for (let i = 0; i < 8;) {
      if (groups[i] !== '0') { i++; continue; }
      let j = i; while (j < 8 && groups[j] === '0') j++;
      if (j - i > length) { best = i; length = j - i; }
      i = j;
    }
    return best < 0 ? groups.join(':') : groups.slice(0, best).join(':') + '::' + groups.slice(best + length).join(':');
  }
  function cidr(value) {
    const text = String(value == null ? '' : value).trim();
    const parts = text.split('/');
    if (!parts[0] || parts.length > 2 || (parts.length === 2 && !/^(0|[1-9]\d{0,2})$/.test(parts[1]))) throw new Error('Invalid IP/CIDR: ' + text);
    let raw = parts[0], family = raw.includes(':') ? 6 : 4, bits;
    if (family === 4) {
      const octets = raw.split('.');
      if (octets.length !== 4 || octets.some((s) => !/^(0|[1-9]\d{0,2})$/.test(s) || Number(s) > 255)) throw new Error('Invalid IPv4: ' + text);
      bits = octets.map((s) => Number(s).toString(2).padStart(8, '0')).join('');
    } else {
      if (raw.includes('.')) {
        const pos = raw.lastIndexOf(':');
        const v4 = cidr(raw.slice(pos + 1));
        if (v4.family !== 4) throw new Error('Invalid embedded IPv4');
        raw = raw.slice(0, pos + 1) + [v4.bits.slice(0, 16), v4.bits.slice(16)].map((b) => parseInt(b, 2).toString(16)).join(':');
      }
      if (!/^[0-9a-f:]+$/i.test(raw) || raw.split('::').length > 2) throw new Error('Invalid IPv6: ' + text);
      const halves = raw.split('::');
      const left = halves[0] ? halves[0].split(':') : [];
      const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
      if ([...left, ...right].some((s) => !/^[0-9a-f]{1,4}$/i.test(s)) ||
          (halves.length === 1 ? left.length !== 8 : left.length + right.length >= 8)) throw new Error('Invalid IPv6: ' + text);
      bits = [...left, ...Array(8 - left.length - right.length).fill('0'), ...right]
        .map((s) => parseInt(s, 16).toString(2).padStart(16, '0')).join('');
    }
    const width = family === 4 ? 32 : 128;
    const prefix = parts.length === 2 ? Number(parts[1]) : width;
    if (prefix > width) throw new Error('Invalid prefix: ' + text);
    bits = bits.slice(0, prefix).padEnd(width, '0');
    return { family, prefix, bits, text: address(bits, family) + '/' + prefix };
  }
  const contains = (a, b) => a.family === b.family && a.prefix <= b.prefix && a.bits.slice(0, a.prefix) === b.bits.slice(0, a.prefix);
  const overlaps = (a, b) => contains(a, b) || contains(b, a);
  function compact(values) {
    const nets = values.map((v) => typeof v === 'string' ? cidr(v) : v)
      .sort((a, b) => a.family - b.family || a.prefix - b.prefix || a.bits.localeCompare(b.bits));
    const result = [];
    for (const n of nets) if (!result.some((p) => contains(p, n))) result.push(n);
    return result.sort((a, b) => a.family - b.family || a.bits.localeCompare(b.bits) || a.prefix - b.prefix).map((n) => n.text);
  }
  function subtractOne(base, cut) {
    if (!overlaps(base, cut)) return [base.text];
    if (contains(cut, base)) return [];
    return ['0', '1'].flatMap((bit) => {
      const bits = (base.bits.slice(0, base.prefix) + bit).padEnd(base.bits.length, '0');
      return subtractOne(cidr(address(bits, base.family) + '/' + (base.prefix + 1)), cut);
    });
  }
  function subtract(bases, exceptions) {
    let result = compact(bases);
    for (const target of exceptions.map(cidr)) {
      result = result.flatMap((base) => subtractOne(cidr(base), target));
      if (result.length > 4096) throw new Error('CIDR expansion exceeds 4096 entries');
    }
    return compact(result);
  }
  function normalize(input = {}) {
    const enabled = input.enabled === true || input.enabled === 'on';
    const raw = Array.isArray(input.cidrs) ? input.cidrs : String(input.cidrs || '').replace(/#[^\n]*/g, '').split(/[\s,;]+/);
    const values = raw.map((v) => String(v).trim()).filter(Boolean);
    if (values.length > 64) throw new Error('\u6700\u591a\u914d\u7f6e 64 \u4e2a\u79c1\u7f51\u7f51\u6bb5');
    const cidrs = compact(values);
    for (const n of cidrs) if (!PRIVATE.some((p) => contains(cidr(p), cidr(n)))) {
      throw new Error('\u4ec5\u652f\u6301 IPv4 RFC1918 \u6216 IPv6 ULA\uff08fc00::/7\uff09\uff1a' + n);
    }
    const policy = String(input.policy || '').trim();
    if (policy.length > 128 || /[,\r\n\x00-\x1f\x7f]/.test(policy)) throw new Error('\u4ee3\u7406\u7ec4\u540d\u542b\u4e0d\u652f\u6301\u7684\u5b57\u7b26');
    if (enabled && (!cidrs.length || !policy)) throw new Error('\u542f\u7528\u524d\u8bf7\u586b\u5199\u7f51\u6bb5\u5e76\u9009\u62e9\u4ee3\u7406\u51fa\u7ad9');
    if (enabled && ['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE', 'GLOBAL'].includes(policy.toUpperCase())) throw new Error('\u4e0d\u80fd\u9009\u62e9\u5185\u7f6e\u7b56\u7565 ' + policy);
    return { enabled, cidrs, policy };
  }
  function fromOptions(o = {}) {
    return normalize({ enabled: o.private_route_enabled, cidrs: o.private_route_cidrs || '', policy: o.private_route_policy || '' });
  }
  function checkConnected(state, connected) {
    for (const t of state.cidrs.map(cidr)) for (const item of connected) {
      const local = cidr(typeof item === 'string' ? item : item.cidr);
      if (overlaps(t, local)) throw new Error('\u8fdc\u7aef\u7f51\u6bb5 ' + t.text + ' \u4e0e F50 \u76f4\u8fde\u7f51\u6bb5 ' + local.text + ' \u91cd\u53e0');
    }
  }
  function strip(config) {
    const out = clone(config), meta = out[META];
    if (!meta || ![1, 2].includes(meta.version)) return out;
    const rules = Array.isArray(out.rules) ? out.rules.slice() : [];
    const inserted = Array.isArray(meta.rules) ? meta.rules : [];
    if (inserted.every((r, i) => rules[i] === r)) rules.splice(0, inserted.length);
    else for (const r of inserted) { const i = rules.indexOf(r); if (i >= 0) rules.splice(i, 1); }
    if (rules.length || meta.rulesPresent !== false) out.rules = rules; else delete out.rules;
    for (const [key, saved] of Object.entries(meta.tun || {})) {
      if (!out.tun || !equal(out.tun[key], saved.applied)) continue;
      if (saved.present) out.tun[key] = clone(saved.before); else delete out.tun[key];
    }
    if (out.tun && !Object.keys(out.tun).length && meta.tunPresent === false) delete out.tun;
    delete out[META];
    return out;
  }
  function list(tun, key) {
    if (tun[key] == null) return [];
    if (!Array.isArray(tun[key]) || tun[key].some((v) => typeof v !== 'string')) throw new Error('tun.' + key + ' must be a string array');
    return tun[key];
  }
  function transform(config, input, mode = 'tproxy', connected = []) {
    const state = normalize(input);
    if (!['tproxy', 'tun', 'off'].includes(mode)) throw new Error('Invalid traffic mode');
    const out = strip(config);
    if (!state.enabled || mode === 'off') return out;
    checkConnected(state, connected);
    if (String(out.mode || 'rule').toLowerCase() !== 'rule') throw new Error('\u79c1\u7f51\u5b9a\u5411\u4ee3\u7406\u9700\u8981 Mihomo \u89c4\u5219\u6a21\u5f0f');
    if (state.cidrs.some((n) => cidr(n).family === 6) && out.ipv6 !== true) throw new Error('\u8fdc\u7aef\u7f51\u6bb5\u5305\u542b IPv6\uff0c\u8bf7\u5148\u52fe\u9009 IPv6 \u63a5\u7ba1');
    const groups = out['proxy-groups'] || [], proxies = out.proxies || [];
    if (!Array.isArray(groups) || !Array.isArray(proxies)) throw new Error('Invalid proxy definitions');
    const target = [...groups, ...proxies].find((p) => p && p.name === state.policy);
    if (!target) throw new Error('\u914d\u7f6e\u4e2d\u4e0d\u5b58\u5728\u51fa\u7ad9\uff1a' + state.policy);
    if (['direct', 'reject', 'reject-drop', 'pass'].includes(String(target.type || '').toLowerCase())) throw new Error('\u6240\u9009\u51fa\u7ad9\u4e0d\u662f\u4ee3\u7406');
    if (own(out, 'rules') && !Array.isArray(out.rules)) throw new Error('rules must be an array');
    const meta = { version: 2, mode, cidrs: state.cidrs, policy: state.policy, rules: [], tun: {}, rulesPresent: own(out, 'rules'), tunPresent: own(out, 'tun') };
    const rule = (n, policy) => (cidr(n).family === 4 ? 'IP-CIDR,' : 'IP-CIDR6,') + n + ',' + policy + ',no-resolve';
    meta.rules = [...state.cidrs.map((n) => rule(n, state.policy)), ...PRIVATE.map((n) => rule(n, 'DIRECT'))];
    out.rules = [...meta.rules, ...(out.rules || [])];
    if (mode === 'tun') {
      if (out.tun != null && (typeof out.tun !== 'object' || Array.isArray(out.tun))) throw new Error('tun must be an object');
      const tun = out.tun || (out.tun = {});
      const set = (key, value) => {
        meta.tun[key] = { present: own(tun, key), ...(own(tun, key) ? { before: clone(tun[key]) } : {}), applied: clone(value) };
        tun[key] = value;
      };
      const excluded = [...PRIVATE, ...list(tun, 'route-exclude-address')];
      set('route-exclude-address', subtract(excluded, state.cidrs));
      for (const key of ['inet4-route-exclude-address', 'inet6-route-exclude-address']) if (own(tun, key)) set(key, []);
      const included = [...list(tun, 'route-address'), ...list(tun, 'inet4-route-address'), ...list(tun, 'inet6-route-address')];
      if (included.length) {
        set('route-address', compact([...included, ...state.cidrs]));
        for (const key of ['inet4-route-address', 'inet6-route-address']) if (own(tun, key)) set(key, []);
      }
      set('dns-hijack', []);
    }
    out[META] = meta;
    return out;
  }
  function runtime(config, options = {}, connected = []) {
  const source = strip(config);
  const mode = options.traffic_mode || 'tproxy';
  if (!['tproxy', 'tun', 'off'].includes(mode)) throw new Error('Invalid traffic mode');
  const out = clone(F50_FIXED_PROFILES[mode + (options.ipv6 === 'on' ? '6' : '4')]);
  for (const key of ['proxies', 'proxy-providers', 'proxy-groups', 'rules', 'rule-providers', 'sub-rules', 'hosts', 'secret', 'x-f50-provider-sources']) {
    if (own(source, key)) out[key] = clone(source[key]);
  }
  if (own(out,'proxies') && !Array.isArray(out.proxies)) throw new Error('proxies must be a list');
  if (!own(out,'proxies')) out.proxies = [];
  if (own(out,'proxy-groups') && !Array.isArray(out['proxy-groups'])) throw new Error('proxy-groups must be a list');
  if (!own(out,'proxy-groups')) out['proxy-groups'] = [];
  if (own(out,'rules') && !Array.isArray(out.rules)) throw new Error('rules must be a list');
  if (!own(out,'rules')) out.rules = ['MATCH,DIRECT'];
  for (const key of ['proxies','proxy-groups']) for(const node of out[key] || []) {
    if(node && typeof node==='object'){delete node['interface-name'];delete node['routing-mark'];}
  }
  for(const key of ['proxy-providers','rule-providers']) for(const provider of Object.values(out[key]||{})) {
    if(provider && typeof provider==='object'){
      if(provider.override){delete provider.override['interface-name'];delete provider.override['routing-mark'];}
      if(key==='rule-providers' && provider.type==='http')provider.proxy='DIRECT';
    }
  }
  for (const name of ['cn_domain', 'private_domain', 'add_direct_domain']) {
    if (out['rule-providers']?.[name]?.behavior === 'domain') {
      out.dns['nameserver-policy']['rule-set:' + name] = ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'];
    }
  }
  out['x-f50-profile'] = '8.0.0-compat.2.3';
  // Only rule content is injected here. All kernel routing belongs to clashctl.
  const feature = fromOptions(options);
  if (!feature.enabled || mode === 'off') return out;
  const transformed = transform(out, feature, 'tproxy', connected);
  transformed[META].mode = mode;
  return transformed;
}
  function resolveSelection(proxies, name) {
    const visited = new Set();
    let current = name;
    for (let i = 0; i < 32; i++) {
      if (visited.has(current)) throw new Error('Proxy group cycle: ' + current);
      visited.add(current);
      if (['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE'].includes(String(current).toUpperCase())) throw new Error('\u4ee3\u7406\u7ec4\u5f53\u524d\u6307\u5411 ' + current);
      const value = proxies[current];
      if (!value) throw new Error('\u6838\u5fc3\u672a\u52a0\u8f7d\u51fa\u7ad9 ' + current);
      if (value.now) { current = value.now; continue; }
      if (['direct', 'reject', 'reject-drop', 'pass', 'compatible'].includes(String(value.type || '').toLowerCase())) throw new Error('\u6240\u9009\u51fa\u7ad9\u4e3a\u76f4\u8fde\u6216\u62d2\u7edd');
      if (Array.isArray(value.all) || /^(selector|select|urltest|fallback|loadbalance|relay)$/i.test(String(value.type || '').replace(/[-_]/g, ''))) throw new Error('\u8bf7\u9009\u62e9\u56fa\u5b9a\u8282\u70b9\u6216\u80fd\u786e\u8ba4\u5f53\u524d\u51fa\u7ad9\u7684\u624b\u52a8\u9009\u62e9\u7ec4');
      return current;
    }
    throw new Error('Proxy group nesting exceeds 32');
  }
  return { PRIVATE, META, cidr, address, compact, contains, overlaps, subtract, normalize, fromOptions, checkConnected, strip, transform, runtime, resolveSelection };
}
// SPDX-License-Identifier: AGPL-3.0-or-later
function buildPortListenerFunction() {
  return `is_port_listening() {
  PORT="$1"; FAMILY="$2"; HEX="$(printf '%04X' "$PORT")"
  case "$PORT" in ''|*[!0-9]*) return 1 ;; esac
  [ "$PORT" -ge 1 ] && [ "$PORT" -le 65535 ] || return 1
  for proto in udp tcp; do
    found=0; suffix="";[ "$FAMILY" != 6 ] || suffix=6
    if awk -v hex="$HEX" -v proto="$proto" 'NR>1 {split($2,a,":");if(a[1]~/^0+$/&&toupper(a[2])==hex&&((proto=="udp"&&$4=="07")||(proto=="tcp"&&$4=="0A")))ok=1} END{exit !ok}' "/proc/net/$proto$suffix" 2>/dev/null;then found=1;fi
    if [ "$found:$FAMILY" = 0:4 ] && [ "$(cat /proc/sys/net/ipv6/bindv6only 2>/dev/null)" = 0 ];then
      if awk -v hex="$HEX" -v proto="$proto" 'NR>1 {split($2,a,":");if(a[1]~/^0+$/&&toupper(a[2])==hex&&((proto=="udp"&&$4=="07")||(proto=="tcp"&&$4=="0A")))ok=1} END{exit !ok}' "/proc/net/$\u007bproto\u007d6" 2>/dev/null;then found=1;fi
    fi
    [ "$found" = 1 ] || return 1
  done
}`;
}


// SPDX-License-Identifier: AGPL-3.0-or-later
// Embedded inside the original plugin closure; no new runtime dependency.
const KPR = createPrivateRouteLogic();

function readF50TproxyPortCmd() { return 'printf \"tproxy_port=7895\\ndns_port=1053\\n\"'; }

async function kprReadOptions() {
  const result = await runShellWithRoot('if [ -f ' + shellQuote(CLASH_POLICY_OPTIONS_FILE) + ' ]; then cat ' + shellQuote(CLASH_POLICY_OPTIONS_FILE) + ' || exit 1; fi\n' + readF50TproxyPortCmd(), 10000);
  if (!result.success) throw new Error('无法读取网络设置，未修改配置');
  return parsePolicyOptionsText(String(result.content || ''));
}

async function kprReadConnected(config = {}, options = {}) {
  const v6 = options.ipv6 === 'on';
  const result = await runShellWithRoot('ip -o -4 addr show' + (v6 ? ' && ip -o -6 addr show' : ''), 10000);
  if (!result.success) throw new Error('\u65e0\u6cd5\u68c0\u67e5 F50 \u76f4\u8fde\u7f51\u6bb5');
  const tun = String(config.tun && config.tun.device || 'KanoTun');
  const addresses = String(result.content || '').split('\n').map((line) => {
    const match = line.match(/^\s*\d+:\s+(\S+)\s+inet6?\s+(\S+)/);
    return match ? { iface: match[1].split('@')[0], cidr: match[2] } : null;
  }).filter((item) => item && item.iface !== tun && !/^(Mihomo|Meta|utun\d*|tun\d*)$/i.test(item.iface));
  if (!addresses.length) throw new Error('\u6ca1\u6709\u8bfb\u5230\u7f51\u7edc\u63a5\u53e3');
  return addresses;
}

async function kprShapeRuntimeConfig(value, options = null) {
  options = options || await kprReadOptions();
  const feature = KPR.fromOptions(options);
  const connected = feature.enabled && options.traffic_mode !== 'off' ? await kprReadConnected(value, options) : [];
  return KPR.runtime(value, options, connected);
}

async function writeYamlObjectAtomic(yamlPath, objectValue, options = {}) {
  try {
    const value = yamlPath === CLASH_CONFIG ? await kprShapeRuntimeConfig(objectValue, options.runtimeOptions) : objectValue;
    return await kprBaseWriteYamlObjectAtomic(yamlPath, value, options);
  } catch (error) {
    return { ok: false, content: String(error && error.message || error), shell: null };
  }
}

async function savePolicyState(state, options = {}) {
  try {
    const previous = options.replaceOptions ? {} : await kprReadOptions();
    const next = { ...state, options: { ...previous, ...state.options } };
    const feature = KPR.fromOptions(next.options);
    next.options.private_route_enabled = feature.enabled ? 'on' : 'off';
    next.options.private_route_cidrs = feature.cidrs.join(' ');
    next.options.private_route_policy = feature.policy;
    if (feature.enabled && next.options.traffic_mode !== 'off') {
      const config = await readYamlObject(CLASH_CONFIG, 'config.yaml');
      if (!config.ok) throw new Error(config.message || 'Cannot read config.yaml');
      KPR.checkConnected(feature, await kprReadConnected(config.value, next.options));

    }
    return await kprBaseSavePolicyState(next, options);
  } catch (error) {
    createToast(safeTextToHtml(error.message || String(error)), 'red', 10000);
    return false;
  }
}

async function kprVerifySelection(options) {
  const feature = KPR.fromOptions(options);
  if (!feature.enabled || options.traffic_mode === 'off') return '';
  const live = await callMihomoApi('/configs', 'GET', null, null, 5);
  if (!live.success || String(JSON.parse(live.responseText || '{}').mode).toLowerCase() !== 'rule') throw new Error('私网定向代理需要核心实际运行在规则模式');
  const response = await callMihomoApi('/proxies', 'GET', null, null, 8);
  if (!response.success) throw new Error('无法确认代理组的实际出站');
  const payload = JSON.parse(response.responseText || '{}');
  return KPR.resolveSelection(payload.proxies || {}, feature.policy);
}

function networkStateKey(state, runtimeOnly = false) {
  const keys = ['traffic_mode', 'ipv6', 'dns_hijack', 'dns_port', 'private_route_enabled', 'private_route_cidrs', 'private_route_policy', 'tproxy_port'];
  if (!runtimeOnly) keys.push('quic_block', 'proxy_group');
  const options = state.options || {};
  const values = keys.map((key) => String(options[key] == null ? '' : options[key]).trim());
  if (!runtimeOnly) for (const key of ['deviceBypass', 'directDomain', 'directIp', 'proxyDomain', 'rejectDomain']) values.push(String(state[key] || '').trim());
  return JSON.stringify(values);
}

async function normalizeIpv6DnsCapability(state) {
  if (!state?.options || state.options.ipv6 !== 'on' || state.options.dns_hijack !== 'on') return false;
  const probe = await runShellWithRoot("probe=$(ip6tables -t nat -S 2>&1); rc=$?; if [ \"$rc\" = 0 ]; then echo F50_IPV6_NAT=1; elif printf '%s\\n' \"$probe\" | grep -Eiq \"can't initialize ip6tables table.*nat|Table does not exist\"; then echo F50_IPV6_NAT=0; else echo F50_IPV6_NAT=unknown; fi", 5000);
  if (!probe?.success || !/^F50_IPV6_NAT=0$/m.test(String(probe.content || ''))) return false;
  state.options.dns_hijack = 'off';
  createToast('内核不支持 IPv6 NAT，已关闭 DNS 劫持；IPv6 接管保持启用。', 'yellow', 10000);
  return true;
}

async function kprSaveNetworkState(previous, next) {
  let backup = '', saved = false, restartAttempted = false, wasRunning = false, configChanged = false;
  try {
    operationStage('\u68c0\u67e5\u6a21\u5f0f\u548c\u7f51\u7edc\u8bbe\u7f6e', 0, 4);
    next = { ...next, options: { ...next.options } };
    const feature = KPR.fromOptions(next.options);
    next.options.private_route_enabled = feature.enabled ? 'on' : 'off';
    next.options.private_route_cidrs = feature.cidrs.join(' ');
    next.options.private_route_policy = feature.policy;
    next.options.transparent = next.options.traffic_mode === 'tproxy' ? 'on' : 'off';
    if (next.options.traffic_mode === 'off') next.options.dns_hijack = 'off';
    await normalizeIpv6DnsCapability(next);
    if (networkStateKey(previous) === networkStateKey(next)) {
      createToast('\u8bbe\u7f6e\u672a\u53d8\u66f4', 'green');
      return true;
    }
    configChanged = networkStateKey(previous, true) !== networkStateKey(next, true);
    const devices = normalizeDeviceBypassText(next.deviceBypass || '');
    if (devices.invalid.length) throw new Error('\u8bbe\u5907\u5217\u8868\u683c\u5f0f\u9519\u8bef\uff1a' + devices.invalid.join('; '));
    // Preserve the list; PolicyTools disables its effect outside TProxy.
    next.deviceBypass = devices.text;
    const source = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    if (!source.ok) throw new Error(source.message || '\u65e0\u6cd5\u8bfb\u53d6\u8fd0\u884c\u914d\u7f6e');
    const connected = feature.enabled && next.options.traffic_mode !== 'off' ? await kprReadConnected(source.value, next.options) : [];
    const prepared = KPR.runtime(source.value, next.options, connected);
    wasRunning = !!(await getCorePid());
    if (wasRunning) await kprVerifySelection(next.options);
    if (configChanged) {
      backup = await createConfigRollbackPoint('network');
      if (!backup) throw new Error('\u65e0\u6cd5\u521b\u5efa\u914d\u7f6e\u56de\u6eda\u70b9');
    }
    operationStage('\u5199\u5165\u8bbe\u7f6e\u4e0e\u8fd0\u884c\u914d\u7f6e', 1, 4);
    if (!(await savePolicyState(next, { apply: false }))) throw new Error('\u7f51\u7edc\u8bbe\u7f6e\u672a\u4fdd\u5b58');
    saved = true;
    if (configChanged) {
      const written = await kprBaseWriteYamlObjectAtomic(CLASH_CONFIG, prepared, { label: 'config.yaml', backup: false });
      if (!written.ok) throw new Error(written.content || '\u914d\u7f6e\u5199\u5165\u5931\u8d25');
    }
    if (wasRunning) {
      operationStage('\u540c\u6b65\u5185\u6838\u6a21\u5f0f\u4e0e\u63a5\u7ba1\u89c4\u5219', 2, 4);
      restartAttempted = true;
      const ok = configChanged
        ? await restartClashOk({ skipCheck: true, preferReload: false, policyReady: true, preparedConfig: prepared })
        : await reapplyPolicyRulesSilent({ ensureScript: false });
      if (!ok) throw new Error('\u65b0\u8bbe\u7f6e\u672a\u901a\u8fc7\u8fd0\u884c\u68c0\u67e5');
      await kprVerifySelection(next.options);
    }
    operationStage('\u786e\u8ba4\u6a21\u5f0f\u5df2\u751f\u6548', 3, 4);
    invalidateStatusSnapshot();
    Object.assign(previous, JSON.parse(JSON.stringify(next)));
    if (wasRunning && typeof refreshDashboardAfterModeChange === 'function') {
      try { await refreshDashboardAfterModeChange(); } catch (_) {}
    }
    if (next.options.traffic_mode === 'tun' && devices.text.trim()) createToast('TUN \u5df2\u6682\u505c\u8bbe\u5907\u7ed5\u8fc7\uff0c\u540d\u5355\u4fdd\u7559\uff1b\u5207\u56de TProxy \u81ea\u52a8\u6062\u590d', 'yellow', 8000);
    operationFinish(true, wasRunning ? '\u7f51\u7edc\u8bbe\u7f6e\u5df2\u5e94\u7528' : '\u5df2\u4fdd\u5b58\uff0c\u6838\u5fc3\u4fdd\u6301\u505c\u6b62');
    createToast(wasRunning ? '\u7f51\u7edc\u8bbe\u7f6e\u5df2\u5e94\u7528' : '\u8bbe\u7f6e\u5df2\u4fdd\u5b58\uff1b\u6838\u5fc3\u4fdd\u6301\u505c\u6b62', 'green', 8000);
    return true;
  } catch (error) {
    if (error.name === 'OperationCancelled') return false;
    operationStage('\u5e94\u7528\u5931\u8d25\uff0c\u6062\u590d\u539f\u8bbe\u7f6e');
    let recovered = !saved;
    if (saved) {
      let restoredSettings = false, restoredConfig = !backup;
      try { restoredSettings = await savePolicyState(previous, { apply: false, replaceOptions: true }); } catch (_) {}
      try { if (backup) restoredConfig = await restoreConfigRollbackPoint(backup, '\u7f51\u7edc\u8bbe\u7f6e', { showToast: false }); } catch (_) {}
      recovered = restoredSettings && restoredConfig;
      if (recovered && wasRunning && restartAttempted) {
        try {
          recovered = configChanged
            ? await restartClashOk({ skipCheck: true, preferReload: true, policyReady: true })
            : await reapplyPolicyRulesSilent({ ensureScript: false });
        } catch (_) { recovered = false; }
      }
      if (!recovered) {
        try { await networkRescue({ stopService: true, showOutput: false, reason: '\u7f51\u7edc\u8bbe\u7f6e\u56de\u6eda\u5931\u8d25' }); } catch (_) {}
      }
    }
    operationFinish(false, recovered ? '\u5e94\u7528\u5931\u8d25\uff0c\u5df2\u6062\u590d\u539f\u8bbe\u7f6e' : '\u5e94\u7528\u4e0e\u56de\u6eda\u5931\u8d25');
    createToast(safeTextToHtml(error.message || String(error)) + '<br>' +
      (recovered ? (saved ? '\u5df2\u6062\u590d\u539f\u8bbe\u7f6e\u548c\u914d\u7f6e' : '\u672a\u5e94\u7528\u65b0\u8bbe\u7f6e') : '\u56de\u6eda\u672a\u5b8c\u6210\uff0c\u5df2\u5c1d\u8bd5\u505c\u6b62\u6838\u5fc3\u5e76\u6e05\u7406\u89c4\u5219'), recovered ? 'yellow' : 'red', 14000);
    return false;
  }
}


function buildPolicyToolsScript() { return "#!/system/bin/sh\n# KANO_POLICY_SCRIPT_VERSION=" + F50_COMPAT_VERSION + "\n# SPDX-License-Identifier: AGPL-3.0-or-later\n: \"${CLASH_ROOT:=/data/clash}\"\ncase \"$1\" in\n  apply|boot-apply) action=apply ;;\n  flush|private-cleanup) action=flush ;;\n  verify|status|private-status) action=verify ;;\n  *) echo \"F50_POLICY_UNKNOWN_ACTION\"; exit 2 ;;\nesac\nexec \"$CLASH_ROOT/Scripts/Clash.Service\" policy \"$action\"\n"; }

function flushGeneratedRulesCmd() {return 'sh ' + shellQuote(CLASH_SERVICE) + ' policy flush';}
function verifyGeneratedRulesFlushedCmd() {return 'sh ' + shellQuote(CLASH_SERVICE) + ' verify-clean';}

  // Progress advances only at completed checkpoints; a moving bar is not a device heartbeat.
  let operationProgress = null;
  let recoveryInProgress = false;
  let pluginArtifactsRemoved = false;
  let taskCommandSequence = 0;
  let statusSnapshotCache = null;
  let statusSnapshotPromise = null;
  let statusSnapshotGeneration = 0;

  function shouldShowOperationProgress(label = '') {
    return /^(?:\u5b89\u88c5\u6838\u5fc3|\u5b89\u88c5\u732b\u732b|\u5378\u8f7d\u732b\u732b|\u5378\u8f7d\u6838\u5fc3|\u6062\u590d\u7f51\u7edc|\u66f4\u65b0\u8ba2\u9605|\u4fdd\u5b58\u66f4\u65b0\u8ba2\u9605|\u91cd\u65b0\u66f4\u65b0\u5931\u8d25\u8282\u70b9\u6765\u6e90|\u4fee\u590d\u8ba2\u9605\u914d\u7f6e|\u4fdd\u5b58\u7f51\u7edc\u4e0e\u79c1\u7f51\u8bbe\u7f6e|\u91cd\u542f\u6838\u5fc3|\u505c\u6b62\u6838\u5fc3|\u4fee\u590d\u4ee3\u7406\u914d\u7f6e|\u4fee\u590d\u7b56\u7565\u89c4\u5219|\u5e94\u7528\u6a21\u677f|\u5e94\u7528\u56fe\u5f62\u89c4\u5219|\u5e94\u7528 JS \u8986\u5199|\u68c0\u67e5\u5e76\u542f\u52a8\u732b\u732b|\u5bfc\u5165\u8f6c\u6362\u7ec4\u4ef6|\u5b89\u88c5\u6216\u66f4\u65b0\u8f6c\u6362\u7ec4\u4ef6|\u5bfc\u5165\u914d\u7f6e\u5305|\u5bfc\u51fa\u914d\u7f6e\u5305|\u4e0a\u4f20\u6a21\u677f|\u6e05\u7406\u7f13\u5b58|\u4fdd\u5b58 config\.yaml)$/.test(String(label));
  }

  function createOperationProgress(label, { enabled = shouldShowOperationProgress(label), delayMs = 800 } = {}) {
    if (operationProgress) operationProgress.dispose();
    const element = document.createElement('section');
    element.id = 'mm_operation_progress';
    element.setAttribute('aria-label', '\u4efb\u52a1\u8fdb\u5ea6');
    element.innerHTML = '<div class="mm-op-head"><span class="mm-op-title"></span><button type="button" aria-label="\u6536\u8d77">&#8722;</button></div>' +
      '<div class="mm-op-body"><div class="mm-op-phase" role="status" aria-live="polite"></div>' +
      '<div class="mm-op-track" role="progressbar" aria-label="\u4efb\u52a1\u8fdb\u5ea6"><div class="mm-op-fill"></div></div>' +
      '<div class="mm-op-foot"><span class="mm-op-count"></span><span class="mm-op-time"></span></div></div>';
    const get = (selector) => element.querySelector(selector);
    setText(get('.mm-op-title'), label);
    let started = 0, terminal = false, disposed = false, shown = false, suspended = false;
    let pending = 0, timer = null, revealTimer = null, closeTimer = null, collapsed = false;
    const tick = () => {
      if (disposed || !started) return;
      const seconds = Math.floor((Date.now() - started) / 1000);
      setText(get('.mm-op-time'), Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'));
    };
    const reveal = () => {
      revealTimer = null;
      if (!enabled || terminal || disposed || suspended) return;
      if (!document.getElementById('mm_operation_progress_style')) {
        const style = document.createElement('style');
        style.id = 'mm_operation_progress_style';
        style.textContent = `
#mm_operation_progress{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(310px,calc(100vw - 32px));z-index:2147483646;box-sizing:border-box;background:#172131f5;color:#edf2fa;border:1px solid #3b4b63;border-radius:14px;padding:14px 16px;box-shadow:0 14px 48px #0006;font:13px/1.5 "Microsoft YaHei","PingFang SC",system-ui,sans-serif;backdrop-filter:blur(12px)}
#mm_operation_progress .mm-op-head{display:flex;align-items:center;justify-content:space-between;gap:10px;font-weight:600}
#mm_operation_progress button{border:0;background:transparent;color:#b9c7d9;padding:0 4px;border-radius:5px;cursor:pointer;font:18px/1.2 system-ui}
#mm_operation_progress .mm-op-title,#mm_operation_progress .mm-op-phase{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#mm_operation_progress .mm-op-phase{margin:8px 0 10px;color:#c2cee0;font-size:12px}
#mm_operation_progress .mm-op-track{height:5px;border-radius:6px;background:#ffffff16;overflow:hidden}
#mm_operation_progress .mm-op-fill{height:100%;width:0;border-radius:6px;background:linear-gradient(90deg,#69b7ef,#81d7bf);transition:width .2s ease}
#mm_operation_progress[data-pending=true] .mm-op-fill{width:30%!important;animation:mm_op_wait 1.6s ease-in-out infinite}
#mm_operation_progress[data-result=failed] .mm-op-fill{background:#ec8189;animation:none}
#mm_operation_progress[data-result=done] .mm-op-fill{background:#81d7a4;animation:none}
#mm_operation_progress .mm-op-foot{display:flex;justify-content:space-between;gap:8px;color:#9caec6;font-size:11px;margin-top:6px}
@keyframes mm_op_wait{0%{transform:translateX(-100%)}100%{transform:translateX(440%)}}
@media(prefers-reduced-motion:reduce){#mm_operation_progress .mm-op-fill{animation:none!important;transition:none}}
`;
        (document.head || document.body).appendChild(style);
      }
      if (!shown) { document.body.appendChild(element); shown = true; }
      element.hidden = false;
      tick();
    };
    const arm = () => {
      if (!enabled || terminal || disposed || suspended) return;
      if (!started) { started = Date.now(); timer = setInterval(tick, 1000); }
      if (!shown && revealTimer === null) revealTimer = setTimeout(reveal, delayMs);
    };
    const progress = {
      element,
      get visible() { return shown && !disposed && !suspended; },
      stage(text, completed = null, total = null) {
        if (terminal || disposed) return;
        const safe = sanitizeSubscriptionSecrets(String(text || ''));
        setText(get('.mm-op-phase'), safe);
        get('.mm-op-phase').title = safe;
        const known = Number.isFinite(completed) && Number.isFinite(total) && total > 0;
        element.dataset.pending = known ? 'false' : 'true';
        element.setAttribute('aria-busy', 'true');
        if (known) {
          const percent = Math.max(0, Math.min(99, Math.floor(completed / total * 100)));
          get('.mm-op-fill').style.width = percent + '%';
          get('.mm-op-track').setAttribute('aria-valuenow', String(percent));
          setText(get('.mm-op-count'), Math.min(completed, total) + '/' + total);
        } else {
          get('.mm-op-track').removeAttribute('aria-valuenow');
          setText(get('.mm-op-count'), '');
        }
        arm(); tick();
      },
      request(delta) { pending = Math.max(0, pending + delta); if (delta > 0) arm(); tick(); },
      pause(value) {
        suspended = !!value;
        if (suspended) { clearTimeout(revealTimer); revealTimer = null; element.hidden = true; }
        else if (shown && !disposed) element.hidden = false;
        else if (pending) arm();
      },
      finish(ok, message) {
        if (disposed || terminal) return;
        terminal = true;
        clearInterval(timer); clearTimeout(revealTimer); revealTimer = null;
        if (!shown) {
          if (ok === false && message) createToast(safeTextToHtml(message), 'red', 7000);
          return;
        }
        collapsed = false; get('.mm-op-body').hidden = false;
        element.dataset.pending = 'false';
        element.dataset.result = ok === true ? 'done' : ok === false ? 'failed' : 'ended';
        element.setAttribute('aria-busy', 'false');
        const safe = sanitizeSubscriptionSecrets(message || (ok === true ? '\u5df2\u5b8c\u6210' : ok === false ? '\u672a\u5b8c\u6210\uff0c\u8bf7\u67e5\u770b\u9519\u8bef\u8be6\u60c5' : '\u5df2\u7ed3\u675f'));
        setText(get('.mm-op-phase'), safe); get('.mm-op-phase').title = safe;
        if (ok === true) { get('.mm-op-fill').style.width = '100%'; get('.mm-op-track').setAttribute('aria-valuenow', '100'); }
        else get('.mm-op-track').removeAttribute('aria-valuenow');
        setText(get('.mm-op-count'), ok === true ? '100%' : '');
        setText(get('button'), '\u00d7');
        get('button').setAttribute('aria-label', '\u5173\u95ed');
        tick();
        if (ok !== false) closeTimer = setTimeout(() => progress.dispose(), 1600);
      },
      dispose() { disposed = true; clearInterval(timer); clearTimeout(revealTimer); clearTimeout(closeTimer); element.remove(); },
    };
    get('button').onclick = () => {
      if (terminal) progress.dispose();
      else { collapsed = !collapsed; get('.mm-op-body').hidden = collapsed; setText(get('button'), collapsed ? '+' : '\u2212'); }
    };
    element.dataset.pending = 'true';
    setText(get('.mm-op-phase'), '\u5904\u7406\u4e2d');
    operationProgress = progress;
    return progress;
  }

  function operationStage(label, completed = null, total = null) {
    const op = activeCriticalOperation;
    if (op && !op.token.cancelled && op.progress) op.progress.stage(label, completed, total);
  }
  function operationFinish(ok, detail = '') {
    const op = activeCriticalOperation;
    if (op && !op.token.cancelled && op.progress) op.progress.finish(ok, detail);
  }
  function operationCancelled() {
    const error = new Error('\u5df2\u88ab\u6062\u590d\u7f51\u7edc\u4e2d\u6b62\uff0c\u4e0d\u518d\u7ee7\u7eed\u5b89\u88c5\u6216\u91cd\u542f');
    error.name = 'OperationCancelled';
    return error;
  }
  function invalidateStatusSnapshot() {
    statusSnapshotGeneration++;
    statusSnapshotCache = null;
    statusSnapshotPromise = null;
    controllerInfoCache = null;
    controllerInfoCacheExpiresAt = 0;
    controllerInfoLoadPromise = null;
  }

  // One read-only device request supplies the status widgets and controller metadata.
  function decodeYamlRootScalar(value) {
    const raw = String(value || '').trim();
    if (raw.length >= 2 && raw[0] == '"' && raw[raw.length - 1] == '"') {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed == 'string') return parsed;
      } catch (_) {}
    }
    if (raw.length >= 2 && raw[0] == "'" && raw[raw.length - 1] == "'") {
      return raw.slice(1, -1).replace(/''/g, "'");
    }
    return raw;
  }


  function buildStatusSnapshotCommand() {
    return `set +e
if [ -r /data/clash/Scripts/Clash.Service ]; then
  sh /data/clash/Scripts/Clash.Service snapshot
  rc=$?
  printf '\nF50_SNAPSHOT_RC=%s\n' "$rc"
  exit 0
fi
${buildOwnedCoreFunctions()}
printf 'F50_SNAPSHOT_FALLBACK=1\nF50_CORE_PID=%s\n' "$(find_runtime_pid)"
if [ -d /data/clash ]; then echo F50_INSTALL_STATE=damaged; else echo F50_INSTALL_STATE=missing; fi
exit 0`;
  }
  async function readStatusSnapshot({fresh=false} = {}) {
    if (!fresh && statusSnapshotCache && statusSnapshotCache.expires > Date.now()) return statusSnapshotCache.value;
    if (statusSnapshotPromise) return statusSnapshotPromise;
    const generation = statusSnapshotGeneration;
    const pending = (async () => {
      // Read probes are not cancellable workers of an install/recovery operation.
      const r = await hostRunShellWithRoot.call(globalThis, buildStatusSnapshotCommand(), 8000);
      const text = String(r?.content || '');
      const line = text.split(/\r?\n/).find(s => s.startsWith('F50_SNAPSHOT='));
      let value;
      if (line) {
        value = JSON.parse(line.slice('F50_SNAPSHOT='.length));
        if (typeof value.corePid !== 'string' || typeof value.apiOk !== 'boolean') throw new Error('Invalid runtime snapshot');
      } else if (r?.success && text.includes('F50_SNAPSHOT_FALLBACK=1')) {
        const fields = Object.fromEntries(text.split(/\r?\n/).filter(l => l.includes('=')).map(l => {const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
        value = {corePid: fields.F50_CORE_PID || '', apiOk: false, processReadStatus: 'ok',
          configReadStatus: fields.F50_INSTALL_STATE === 'missing' ? 'missing' : 'unavailable',
          installState: fields.F50_INSTALL_STATE, trafficMode: 'unknown',
          configError: '\u8fd0\u884c\u7ec4\u4ef6\u7f3a\u5931', apiError: '\u65e0\u6cd5\u8bfb\u53d6\u9762\u677f\u8fde\u63a5\u914d\u7f6e'};
      } else {
        throw new Error(f50Error(text) || '\u72b6\u6001\u547d\u4ee4\u672a\u8fd4\u56de\u7ed3\u679c\uff08\u8d85\u65f6\u6216\u6267\u884c\u5931\u8d25\uff09');
      }
      return value;
    })();
    statusSnapshotPromise = pending;
    try {
      const value = await pending;
      if (generation !== statusSnapshotGeneration) return readStatusSnapshot({fresh:true});
      statusSnapshotCache = {value, expires: Date.now()+2000};
      return value;
    } finally { if (statusSnapshotPromise === pending) statusSnapshotPromise = null; }
  }

  function validateSubscriptionMode(sources, mode) {
    const stored = normalizeStoredSubSourceList(sources);
    const enabled = normalizeSubSourceList(stored);
    if (normalizeSubRuleModeValue(mode) === SUB_RULE_MODE_ORIGINAL && (stored.length !== 1 || enabled.length !== 1)) {
      throw new Error('\u8ba2\u9605\u81ea\u5e26\u914d\u7f6e\u53ea\u5141\u8bb8\u4e00\u6761\u5df2\u542f\u7528\u7684\u8ba2\u9605\u94fe\u63a5\uff1b\u591a\u6761\u94fe\u63a5\u8bf7\u9009\u62e9\u672c\u5730\u6a21\u677f');
    }
    return { stored, enabled };
  }

  function buildRelatedProcessFunctions() {
    return `${buildOwnedCoreFunctions()}
kano_is_related() (
  PID="$1"
  case "$PID" in ''|*[!0-9]*|1|"$$") exit 1 ;; esac
  [ -r "/proc/$PID/status" ] || exit 1
  exe="$(readlink "/proc/$PID/exe" 2>/dev/null)"
  case "$exe" in
    ${CLASH_CORE}|'${CLASH_CORE} (deleted)'|${CLASH_DIR}/Tools/kano-f50-helper*|${CLASH_DIR}/Tools/mosdns*|${CLASH_DIR}/Tools/yq_linux_*|${CLASH_DIR}/Scripts/clashctl*) exit 0 ;;
  esac
  # Only these workers can outlive a cancelled plugin shell request.
  case "\${exe##*/}" in sh|bash|dash|mksh|toybox|busybox|inotifyd|curl|wget|unzip|tar|gzip|xz) ;; *) exit 1 ;; esac
  # The marker is inherited by the plugin's downloads and child processes, not by the host shell.
  task="$(tr '\\0' '\\n' < "/proc/$PID/environ" 2>/dev/null | sed -n 's/^KANO_TPROXY_TASK=mm_/mm_/p' | head -n 1)"
  if [ -n "$task" ] && [ "$task" != "$KANO_TPROXY_TASK" ]; then exit 0; fi
  case "\${exe##*/}" in sh|bash|dash|mksh|toybox|busybox|inotifyd) ;; *) exit 1 ;; esac
  args="$(tr '\\0' '\\n' < "/proc/$PID/cmdline" 2>/dev/null)"
  printf '%s\\n' "$args" | grep -qx -- '-c' && exit 1
  # Match whole argv entries. Never match a path embedded in sh -c command text.
  printf '%s\\n' "$args" | grep -Eq '^${CLASH_DIR}/Scripts/Clash\\.(Inotify|MacBypass|PolicyTools|KanoStart)$' && exit 0
  if printf '%s\\n' "$args" | grep -qxF '${CLASH_SERVICE}'; then
    printf '%s\\n' "$args" | grep -Eq '^(boot|start|restart)$' && exit 0
  fi
  exit 1
)
kano_related_pids() (
  for p in /proc/[0-9]*; do
    # comm is read by the shell; avoid spawning several tools for every Android process.
    IFS= read -r name < "$p/comm" 2>/dev/null || continue
    case "$name" in Clash.Core|mihomo|clashctl*|kano-f50*|mosdns*|yq_linux*|sh|bash|dash|mksh|toybox|busybox|inotifyd|curl|wget|unzip|tar|gzip|xz|Clash.*) ;; *) continue ;; esac
    n="\${p##*/}"; kano_is_related "$n" && printf '%s\\n' "$n"
  done
  exit 0
)
kano_verify_related_stopped() (
  remaining="$(kano_related_pids)"
  [ -n "$remaining" ] || { echo KANO_RELATED_STOPPED; exit 0; }
  for n in $remaining; do printf 'RELATED_PROCESS_REMAINS=%s %s\\n' "$n" "$(readlink "/proc/$n/exe" 2>/dev/null)"; done
  exit 1
)
kano_stop_related() (
  for signal in TERM KILL; do
    remaining="$(kano_related_pids)"
    [ -n "$remaining" ] || { echo KANO_RELATED_STOPPED; exit 0; }
    for n in $remaining; do kano_is_related "$n" && kill -"$signal" "$n" 2>/dev/null || true; done
    # The next phase rescans once to catch children created before TERM.
    sleep 0.2 2>/dev/null || sleep 1
  done
  kano_verify_related_stopped
)
`;
  }


function buildF50CleanupScript() {
  return buildF50MaintenanceFunctions() + `
F50_WORK=$(mktemp -d "$F50_DATA/.f50-clean.XXXXXX") || exit 1
trap 'rm -rf "$F50_WORK"' EXIT
f50_inspect || exit 1
if [ "$F50_OLD_FOUND" = 1 ]; then
  f50_clean_environment || exit 1
else
  echo F50_CLEAN_STATE=skipped_no_old_environment
fi
echo F50_CLEAN_OK=1
`;
}
function buildF50FinalCheckScript() {
  return buildF50MaintenanceFunctions() + `
F50_WORK=$(mktemp -d "$F50_DATA/.f50-verify.XXXXXX") || { echo F50_CHECK_UNKNOWN=verify_workdir; echo F50_UNINSTALL_STATE=unknown; exit 1; }
trap 'rm -rf "$F50_WORK"' EXIT
f50_final_probe
if ! rm -rf "$F50_WORK"; then echo F50_REMAINS=verification_workdir; F50_FINAL_REMAINS=1; fi
trap - EXIT
if [ "$F50_FINAL_REMAINS" = 1 ]; then echo F50_UNINSTALL_STATE=residual; exit 1; fi
if [ "$F50_FINAL_UNKNOWN" = 1 ]; then echo F50_UNINSTALL_STATE=unknown; exit 1; fi
echo F50_UNINSTALL_STATE=clean
echo UNINSTALL_VERIFIED
`;
}
function buildUninstallStages() { return [
  {title:'\u505c\u6b62\u732b\u732b\u5e76\u6062\u590d\u7f51\u7edc', timeout:60000, script:buildF50CleanupScript()},
  {title:'\u79fb\u9664\u732b\u732b\u5f00\u673a\u542f\u52a8\u9879', timeout:15000, script:`set -e
if [ -f ${shellQuote(BOOT_FILE)} ]; then
  ${removeBootLinesCmd()}
fi
if [ -f /data/f50_boot_fix/clash_boot.sh ]; then rm -f /data/f50_boot_fix/clash_boot.sh; fi
echo F50_BOOT_REMOVED
`},
  {title:'\u5220\u9664\u732b\u732b\u7ec4\u4ef6\u548c\u6570\u636e', timeout:45000, script:buildF50MaintenanceFunctions() + `
F50_WORK=$(mktemp -d "$F50_DATA/.f50-delete.XXXXXX") || exit 1
trap 'rm -rf "$F50_WORK"' EXIT
# Do not erase recoverable runtime files while owned processes or interception are demonstrably active.
f50_runtime_guard || exit 1
f50_remove_artifacts
delete_rc=$?
${removePluginOwnedArtifactsCmd()} || delete_rc=1
[ "$delete_rc" = 0 ] && echo UNINSTALL_NO_BACKUP_DONE
exit "$delete_rc"
`},
]; }
  let refreshDashboardAfterModeChange = null;

function verifyTunReleasedCmd() {return 'sh ' + shellQuote(CLASH_SERVICE) + ' verify-clean';}


  // ===== Constants =====
  const CLASH_DIR = '/data/clash';
  const CLASH_SERVICE = `${CLASH_DIR}/Scripts/Clash.Service`;
  const CLASH_PROXY_DIR = `${CLASH_DIR}/Proxy`;
  const CLASH_CONFIG = `${CLASH_PROXY_DIR}/config.yaml`;
  const CLASH_SUB_URLS = `${CLASH_PROXY_DIR}/subscription_urls.txt`;
  const CLASH_TEMPLATE = `${CLASH_DIR}/Tools/template.yaml`;
  const CLASH_TEMPLATE_BASE = `${CLASH_DIR}/Tools/template.base.yaml`;
  const CLASH_OVERRIDE_JS = `${CLASH_DIR}/Tools/override.js`;
  const CLASH_RULE_OVERRIDE_JSON = `${CLASH_DIR}/Tools/rule_override.json`;
  const CLASH_RULE_OVERRIDE_APPLIED_JSON = `${CLASH_DIR}/Tools/rule_override_applied.json`;
  const CLASH_CORE = `${CLASH_PROXY_DIR}/Clash.Core`;
  const CLASH_MAC_BYPASS_FILE = `${CLASH_PROXY_DIR}/mac_bypass.txt`;
  const CLASH_MAC_BYPASS_SCRIPT = `${CLASH_DIR}/Scripts/Clash.MacBypass`;
  const CLASH_MAC_BYPASS_CHAIN = 'KANO_MAC_BYPASS';
  const CLASH_POLICY_DIR = `${CLASH_DIR}/Policy`;
  const CLASH_POLICY_SCRIPT = `${CLASH_DIR}/Scripts/Clash.PolicyTools`;
  const CLASH_DEVICE_BYPASS_FILE = `${CLASH_POLICY_DIR}/device_bypass.txt`;
  const CLASH_DIRECT_DOMAIN_FILE = `${CLASH_POLICY_DIR}/direct_domain.list`;
  const CLASH_DIRECT_IP_FILE = `${CLASH_POLICY_DIR}/direct_ip.list`;
  const CLASH_PROXY_DOMAIN_FILE = `${CLASH_POLICY_DIR}/proxy_domain.list`;
  const CLASH_REJECT_DOMAIN_FILE = `${CLASH_POLICY_DIR}/reject_domain.list`;
  const CLASH_POLICY_OPTIONS_FILE = `${CLASH_POLICY_DIR}/options.conf`;
  const CLASH_SUB_RULE_MODE_FILE = `${CLASH_DIR}/Tools/sub_rule_mode.conf`;
  const CLASH_SUB_USER_AGENT_FILE = `${CLASH_DIR}/Tools/sub_user_agent.conf`;
  const CLASH_CONFIG_SOURCE_FILE = `${CLASH_DIR}/Tools/config_source.conf`;
  const KANO_SUBSCRIPTION_RAW = '/data/kano_subscription_config.raw';
  const KANO_SUBSCRIPTION_YAML = '/data/kano_subscription_config.yaml';
  const KANO_SUBSCRIPTION_MODE_CHECK = '/data/kano_subscription_mode_check.out';
  const CLASH_SAFE_POLICY_DIR = `${CLASH_PROXY_DIR}/Policy`;
  const CLASH_SAFE_DIRECT_DOMAIN_FILE = `${CLASH_SAFE_POLICY_DIR}/direct_domain.list`;
  const CLASH_SAFE_DIRECT_IP_FILE = `${CLASH_SAFE_POLICY_DIR}/direct_ip.list`;
  const CLASH_SAFE_PROXY_DOMAIN_FILE = `${CLASH_SAFE_POLICY_DIR}/proxy_domain.list`;
  const CLASH_SAFE_REJECT_DOMAIN_FILE = `${CLASH_SAFE_POLICY_DIR}/reject_domain.list`;
  const KANO_TEMPLATE_WRITE_CHECK = '/data/kano_template_write_check.out';
  const KANO_TEMPLATE_FLOW_DEBUG = '/data/kano_template_flow_debug.out';
  const KANO_YQ_RUNTIME_DIR = '/data/kano_yq_runtime';
  const BOOT_FILE = '/sdcard/ufi_tools_boot.sh';
  const F50_FILES_DIR = '/data/data/com.minikano.f50_sms/files';
  const KANO_INSTALL_TOOLBOX_DIR = '/data/kano_tproxy_tools';
  const KANO_INSTALL_TOOLBOX_BIN = `${KANO_INSTALL_TOOLBOX_DIR}/bin`;
  const LOG_FILE = '/data/clash/Proxy/Clash.log';
  const DOWNLOAD_ZIP = '/data/kano_clash.zip';
  const DOWNLOAD_LOG = '/data/kano_mihomo_latest.dlog';
  const CLASH_PACKAGE_URL = 'https://pan.kanokano.cn/d/UFI-TOOLS-UPDATE/plugins/mihomo-tproxy.zip';
  const CLASH_PACKAGE_FALLBACK_URL = 'https://gitee.com/womye/123/releases/download/v1/tproxy-yq.zip';
  const ZASHBOARD_UI_DIR = 'WebUI/zashboard';
  const ZASHBOARD_UI_URL = F50_ZASHBOARD_UI_URL;
  // tproxy-yq.zip is intentionally updateable. Do not pin package size/hash/core hash in the plugin.
  // Installation only requires a readable ZIP with the expected base layout; deeper features fail locally if incompatible.
  const DOWNLOAD_SOURCE_FILE = '/data/kano_clash.source';
  // Official yq is a lazy fallback for advanced YAML features only.
  // It is never required for basic Mihomo install/start.
  const YQ_OFFICIAL_ARM64_URL =
    'https://github.com/mikefarah/yq/releases/download/v4.53.3/yq_linux_arm64';
  const CLASH_RUNTIME_MANAGER = `${CLASH_DIR}/Scripts/Clash.KanoStart`;
  const CLASH_SERVICE_WRAPPER_VERSION = F50_COMPAT_VERSION;
  const BOOT_CLEANUP_LINE = `[ -x ${CLASH_POLICY_SCRIPT} ] && ${CLASH_POLICY_SCRIPT} flush >/dev/null 2>&1 || true`;
  // UFI-TOOLS 原生 samba_exec.sh 会在开机窗口直接执行: sh /sdcard/ufi_tools_boot.sh
  // 因此基础自启保持 1.3 已验证语义，不再要求 Clash.KanoStart / boot manager 作为必经路径。
  const BOOT_SERVICE_LINE = `${CLASH_SERVICE} boot`;
  const BOOT_ASYNC_LINE = `nohup ${CLASH_SERVICE} boot </dev/null >/dev/null 2>&1 &`;
  const LEGACY_BOOT_SERVICE_LINE = `${CLASH_RUNTIME_MANAGER} --boot`;
  const LEGACY_BOOT_FIX_WRAPPER_LINE = '/data/f50_boot_fix/clash_boot.sh >/dev/null 2>&1 &';
  const CLASH_INOTIFY_DIR = `${CLASH_DIR}/Clash`;
  const LEGACY_BOOT_INOTIFY_LINE =
    `mkdir -p "${CLASH_INOTIFY_DIR}" && inotifyd ${CLASH_DIR}/Scripts/Clash.Inotify "${CLASH_INOTIFY_DIR}" >> /dev/null &`;
  const BOOT_INOTIFY_LINE =
    `inotifyd ${CLASH_DIR}/Scripts/Clash.Inotify "${CLASH_INOTIFY_DIR}" >> /dev/null &`;
  const LEGACY_BOOT_POLICY_TOOLS_LINE = `sleep 8; ${CLASH_POLICY_SCRIPT} apply`;
  const BOOT_POLICY_TOOLS_LINE =
    `[ -x ${CLASH_POLICY_SCRIPT} ] && ${CLASH_POLICY_SCRIPT} boot-apply >/data/kano_policy_boot.log 2>&1 || true`;
  const LEGACY_BOOT_MAC_BYPASS_LINE = `sleep 10; ${CLASH_MAC_BYPASS_SCRIPT}`;
  const SUB_RULE_MODE_TEMPLATE = 'template';
  const SUB_RULE_MODE_ORIGINAL = 'original';
  const SUB_CONVERT_MODE_PROVIDER = 'provider';
  const SUB_CONVERT_MODE_LOCAL = 'local';
  const SUB_DISABLED_MARKER = '# KANO_SUB_DISABLED ';
  const LOCAL_SUBSCRIPTION_MAX_FILE_BYTES = 8 * 1024 * 1024;
  const LOCAL_SUBSCRIPTION_TOTAL_BYTES = 32 * 1024 * 1024;
  const KANO_PROVIDER_USER_AGENT = 'clash.meta';
  const POLICY_SCRIPT_VERSION = F50_COMPAT_VERSION;
  // Controller settings and the helper snapshot are shared by several widgets during panel refresh.
  // Explicit actions still request a fresh value after they change the configuration.
  const CONTROLLER_INFO_CACHE_TTL = 1500;
  const ADVANCED_ACCESS_CACHE_TTL = 30 * 1000;
  const ADVANCED_ACCESS_FAILURE_CACHE_TTL = 2 * 1000;
  const KANO_HELPER_PATH = `${CLASH_DIR}/Tools/kano-f50-helper`;
  const KANO_HELPER_BUNDLED_DIR = `${CLASH_DIR}/Tools`;
  const KANO_HELPER_CONVERTER_PATH = `${CLASH_DIR}/Tools/kano-f50-helper-converter`;
  const KANO_HELPER_REQUIRED_COMMANDS = [
    'version', 'snapshot', 'clients', 'network-status', 'policy-read', 'convert-subscription',
  ];
  // Size and SHA remain updateable, but the executable protocol version is checked before activation.
  const KANO_HELPER_DOWNLOAD_URL =
    'https://gitee.com/womye/123/releases/download/v1/kano-f50-helper-linux-arm64';
  const KANO_HELPER_SNAPSHOT_TTL = 1500;

  // ===== Basic helpers =====
  const runShellWithRoot = async (script = '', timeout) => {
  if (typeof script !== 'string' || script.includes(String.fromCharCode(0))) {
    return { success: false, content: 'SHELL_INVALID_TEXT: command contains NUL or is not a string' };
  }
  const op = activeCriticalOperation;
  if (op && op.token.cancelled) throw operationCancelled();
  const base = `if [ -d '${KANO_INSTALL_TOOLBOX_BIN}' ]; then export PATH='${KANO_INSTALL_TOOLBOX_BIN}':"$PATH"; fi\n${script}`;
  let command = base;
  if (op) {
    const tag = 'mm_' + String(op.token.id).replace(/[^A-Za-z0-9_-]/g, '_');
    const file = '/dev/kano_tproxy_tasks/' + tag + '.' + (++taskCommandSequence);
    command = `set +e
mkdir -p /dev/kano_tproxy_tasks || exit 1
env KANO_TPROXY_TASK=${shellQuote(tag)} sh -c ${shellQuote(base)} &
kano_task_pid=$!
printf '%s\\n' "$kano_task_pid" > ${shellQuote(file)}
wait "$kano_task_pid"
kano_task_rc=$?
rm -f ${shellQuote(file)}
rmdir /dev/kano_tproxy_tasks 2>/dev/null || true
exit "$kano_task_rc"`;
    if (op.progress) op.progress.request(1);
  }
  try {
    const result = await hostRunShellWithRoot.call(globalThis, command, timeout);
    if (op && op.token.cancelled) throw operationCancelled();
    return result;
  } finally { if (op && op.progress) op.progress.request(-1); }
};


  const shellQuote = (value) =>
    "'" + String(value).replace(/'/g, "'\\''") + "'";

  const templateFlowMessages = [];
  let templateFlowTimer = null;
  let templateFlowWriting = false;
  let templateFlowWritePromise = null;
  const flushTemplateFlowDebug = async () => {
    templateFlowTimer = null;
    if (pluginArtifactsRemoved || templateFlowWriting || !templateFlowMessages.length) return;
    templateFlowWriting = true;
    const messages = templateFlowMessages.splice(0);
    try {
      templateFlowWritePromise = runShellWithRoot(`
        FLOW=${shellQuote(KANO_TEMPLATE_FLOW_DEBUG)}
        if [ -f "$FLOW" ] && [ "$(wc -c < "$FLOW")" -gt 262144 ]; then
          tail -c 131072 "$FLOW" > "$FLOW.trim.$$" && mv "$FLOW.trim.$$" "$FLOW"
        fi
        printf '%s\\n' ${messages.map(shellQuote).join(' ')} >> "$FLOW"
      `, 5000);
      await templateFlowWritePromise;
    } catch (e) {
      console.error(e);
    } finally {
      templateFlowWriting = false;
      templateFlowWritePromise = null;
      if (templateFlowMessages.length && templateFlowTimer === null) {
        templateFlowTimer = setTimeout(flushTemplateFlowDebug, 250);
      }
    }
  };
  const appendTemplateFlowDebug = (message = '') => {
    if (pluginArtifactsRemoved || (activeCriticalOperation && activeCriticalOperation.token.cancelled)) return;
    templateFlowMessages.push(`${new Date().toISOString()} ${sanitizeSubscriptionSecrets(String(message || '')).replace(/[\r\n]+/g, ' ').slice(0, 2000)}`);
    if (templateFlowMessages.length > 100) templateFlowMessages.shift();
    if (templateFlowTimer === null && !templateFlowWriting) {
      templateFlowTimer = setTimeout(flushTemplateFlowDebug, 250);
    }
  };

  const runDangerousShellWithRoot = async (script = '', timeout = 20 * 1000, label = 'dangerous') => {
    appendTemplateFlowDebug(`dangerous_shell ${label}`);
    return runShellWithRoot(script, timeout);
  };

  const escapeHtml = (value = '') =>
    String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));

  const textToHtml = (value = '') => escapeHtml(value).replace(/\n/g, '<br>');

  const maskSubscriptionUrl = (value = '') => {
    try {
      const parsed = new URL(String(value || ''));
      const segments = parsed.pathname.split('/').filter(Boolean);
      const safePrefix = segments.length > 0 && /^(?:api|link|sub|subscribe|subscription|client|clash|v[1-9])$/i.test(segments[0])
        ? `/${segments[0]}`
        : '';
      const maskedPath = segments.length > 0 ? `${safePrefix}/***` : '/';
      const maskedQuery = String(parsed.search || '').replace(/^\?/, '').split('&').filter(Boolean).map((item) => {
        const separator = item.indexOf('=');
        const key = separator >= 0 ? item.slice(0, separator) : item;
        return `${key || 'param'}=***`;
      });
      return `${parsed.protocol}//${parsed.host}${maskedPath}${maskedQuery.length > 0 ? `?${maskedQuery.join('&')}` : ''}`;
    } catch {
      return '';
    }
  };

  const sanitizeSubscriptionSecrets = (value = '') => String(value || '')
    .replace(/https?:\/\/[^\s"'<>)}\]]+/gi, (url) => maskSubscriptionUrl(url) || '[订阅地址已隐藏]')
    .replace(/\bbearer\s+[^\s,;"']+/gi, 'Bearer ***')
    .replace(/(["']?(?:token|secret|authorization|access[_-]?(?:key|token))["']?\s*[=:]\s*["']?)[^\s,;&}"']+/gi, '$1***');

  const safeTextToHtml = (value = '') => textToHtml(sanitizeSubscriptionSecrets(value));

  const setText = (el, value = '') => {
    if (el) el.textContent = String(value || '');
  };

  const resetChildren = (el) => {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  };

  const isHttpUrl = (value = '') => {
    try {
      const url = new URL(value);
      return url.protocol == 'http:' || url.protocol == 'https:';
    } catch {
      return false;
    }
  };

  const isPrivateOrReservedIpv4 = (hostname = '') => {
    const parts = String(hostname || '').split('.');
    if (parts.length != 4 || parts.some((part) => !/^\d+$/.test(part) || Number(part) > 255)) return false;
    const [a, b, c] = parts.map(Number);
    return a == 0 || a == 10 || a == 127 || a >= 224
      || (a == 100 && b >= 64 && b <= 127)
      || (a == 169 && b == 254)
      || (a == 172 && b >= 16 && b <= 31)
      || (a == 192 && b == 0 && (c == 0 || c == 2))
      || (a == 192 && b == 168)
      || (a == 198 && (b == 18 || b == 19))
      || (a == 198 && b == 51 && c == 100)
      || (a == 203 && b == 0 && c == 113);
  };

  const isPrivateOrReservedIpv6 = (hostname = '') => {
    const value = String(hostname || '').replace(/^\[|\]$/g, '').toLowerCase();
    if (!value || !/^[0-9a-f:.]+$/.test(value)) return true;
    if (value.includes('.')) return true;
    return value == '::' || value == '::1'
      || value.startsWith('fc') || value.startsWith('fd')
      || /^fe[89ab]/.test(value) || value.startsWith('ff')
      || value.startsWith('2001:db8:');
  };

  const validateLocalSubscriptionUrl = (value = '') => {
    let url;
    try {
      url = new URL(String(value || '').trim());
    } catch {
      return { ok: false, message: '\u672c\u5730\u8f6c\u6362\u7684\u8ba2\u9605\u5730\u5740\u65e0\u6548' };
    }
    if (url.protocol != 'https:') {
      return { ok: false, message: '\u672c\u5730\u8f6c\u6362\u53ea\u5141\u8bb8 HTTPS \u8ba2\u9605\u5730\u5740' };
    }
    if (url.username || url.password) {
      return { ok: false, message: '\u8ba2\u9605\u5730\u5740\u4e0d\u5f97\u5728 URL \u4e2d\u643a\u5e26\u7528\u6237\u540d\u6216\u5bc6\u7801' };
    }
    const hostname = String(url.hostname || '').replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
    if (!hostname) {
      return { ok: false, message: '\u8ba2\u9605\u5730\u5740\u7f3a\u5c11\u4e3b\u673a\u540d' };
    }
    if (
      hostname == 'localhost'
      || hostname.endsWith('.localhost')
      || hostname.endsWith('.local')
      || hostname.endsWith('.lan')
      || hostname.endsWith('.home.arpa')
      || isPrivateOrReservedIpv4(hostname)
      || (hostname.includes(':') && isPrivateOrReservedIpv6(hostname))
    ) {
      return { ok: false, message: '\u672c\u5730\u8f6c\u6362\u62d2\u7edd\u56de\u73af\u3001\u79c1\u7f51\u6216\u4fdd\u7559\u5730\u5740' };
    }
    return {
      ok: true,
      url: url.toString(),
      hostname,
      port: url.port || '443',
      addressFamily: hostname.includes(':') ? 'ipv6' : 'auto',
      message: '',
    };
  };

  const getUploadedPath = (url) => {
    const normalized = String(url || '').replace(/^\/+/, '');
    if (!normalized || normalized.includes('..')) {
      throw new Error('\u4e0a\u4f20\u8def\u5f84\u5f02\u5e38');
    }
    return `${F50_FILES_DIR}/${normalized}`;
  };

  const uploadFileToDevice = async (file) => {
    const operation = activeCriticalOperation;
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${KANO_baseURL}/upload_img`, {
      method: 'POST',
      headers: common_headers,
      body: formData,
    });
    if (operation && operation.token.cancelled) throw operationCancelled();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!result || typeof result.url !== 'string' || !result.url.trim()) {
      throw new Error((result && result.error) || '上传失败');
    }
    return getUploadedPath(result.url);
  };

  // ===== File and boot helpers =====

  const configPackageBackupFiles = () => [
    { label: 'config.yaml', path: CLASH_CONFIG },
    { label: 'template.yaml', path: CLASH_TEMPLATE },
    { label: 'template.base.yaml', path: CLASH_TEMPLATE_BASE },
    { label: 'subscription_urls.txt', path: CLASH_SUB_URLS },
    { label: 'override.js', path: CLASH_OVERRIDE_JS },
    { label: 'rule_override.json', path: CLASH_RULE_OVERRIDE_JSON },
    { label: 'rule_override_applied.json', path: CLASH_RULE_OVERRIDE_APPLIED_JSON },
    { label: 'sub_rule_mode.conf', path: CLASH_SUB_RULE_MODE_FILE },
    { label: 'sub_user_agent.conf', path: CLASH_SUB_USER_AGENT_FILE },
    { label: 'config_source.conf', path: CLASH_CONFIG_SOURCE_FILE },
    { label: 'options.conf', path: CLASH_POLICY_OPTIONS_FILE },
    { label: 'mac_bypass.txt', path: CLASH_MAC_BYPASS_FILE },
  ];

  const editableLocalFiles = () => [
    { label: 'config.yaml', path: CLASH_CONFIG, restart: true, allowEmpty: false },
    { label: 'subscription_urls.txt', path: CLASH_SUB_URLS, restart: false, allowEmpty: true },
    { label: 'template.yaml', path: CLASH_TEMPLATE, restart: false, allowEmpty: true },
    { label: 'template.base.yaml', path: CLASH_TEMPLATE_BASE, restart: false, allowEmpty: true },
    { label: 'override.js', path: CLASH_OVERRIDE_JS, restart: false, allowEmpty: true },
    { label: 'rule_override.json', path: CLASH_RULE_OVERRIDE_JSON, restart: false, allowEmpty: true },
    { label: 'rule_override_applied.json', path: CLASH_RULE_OVERRIDE_APPLIED_JSON, restart: false, allowEmpty: true },
    { label: 'sub_rule_mode.conf', path: CLASH_SUB_RULE_MODE_FILE, restart: false, allowEmpty: true },
    { label: 'options.conf', path: CLASH_POLICY_OPTIONS_FILE, restart: false, allowEmpty: true },
    { label: 'config_source.conf', path: CLASH_CONFIG_SOURCE_FILE, restart: false, allowEmpty: true },
  ];

  const findEditableLocalFile = (path = '') =>
    editableLocalFiles().find((fileInfo) => fileInfo.path == path) || null;


  const removeBootLinesCmd = ({ enable = false } = {}) => `
        (
          set -e
          BOOT_LOCK=/dev/kano_boot_write.lock
          if ! mkdir "$BOOT_LOCK" 2>/dev/null; then
            mkdir "$BOOT_LOCK/recover" 2>/dev/null || { echo BOOT_WRITE_BUSY; exit 1; }
            owner=$(cat "$BOOT_LOCK/pid" 2>/dev/null || true)
            case "$owner" in
              ''|*[!0-9]*)
                sleep 1
                owner=$(cat "$BOOT_LOCK/pid" 2>/dev/null || true)
                case "$owner" in ''|*[!0-9]*) ;; *) rmdir "$BOOT_LOCK/recover"; echo BOOT_WRITE_BUSY; exit 1 ;; esac
                rm -f "$BOOT_LOCK/pid"
                rmdir "$BOOT_LOCK/recover"; rmdir "$BOOT_LOCK" 2>/dev/null || { echo BOOT_WRITE_BUSY; exit 1; } ;;
              *)
                if kill -0 "$owner" 2>/dev/null; then
                  rmdir "$BOOT_LOCK/recover"
                  echo BOOT_WRITE_BUSY; exit 1
                fi
                rm -f "$BOOT_LOCK/pid"
                rmdir "$BOOT_LOCK/recover"
                rmdir "$BOOT_LOCK" || exit 1
                ;;
            esac
            mkdir "$BOOT_LOCK" 2>/dev/null || { echo BOOT_WRITE_BUSY; exit 1; }
          fi
          printf '%s\\n' "$$" > "$BOOT_LOCK/pid" || exit 1
          BOOT_TMP=${shellQuote(`${BOOT_FILE}.kano`)}.$$
          trap 'rm -f "$BOOT_TMP" "$BOOT_LOCK/pid"; rmdir "$BOOT_LOCK"' EXIT
          trap 'exit 1' HUP INT TERM
          BOOT_SOURCE=${shellQuote(BOOT_FILE)}
          [ -f "$BOOT_SOURCE" ] || BOOT_SOURCE=/dev/null
          awk \
            -v async=${shellQuote(BOOT_ASYNC_LINE)} \
            -v cleanup=${shellQuote(BOOT_CLEANUP_LINE)} \
            -v runtime=${shellQuote(LEGACY_BOOT_SERVICE_LINE)} \
            -v service=${shellQuote(BOOT_SERVICE_LINE)} \
            -v legacy_wrapper=${shellQuote(LEGACY_BOOT_FIX_WRAPPER_LINE)} \
            -v legacy_inotify=${shellQuote(LEGACY_BOOT_INOTIFY_LINE)} \
            -v inotify=${shellQuote(BOOT_INOTIFY_LINE)} \
            -v legacy_policy=${shellQuote(LEGACY_BOOT_POLICY_TOOLS_LINE)} \
            -v policy=${shellQuote(BOOT_POLICY_TOOLS_LINE)} \
            -v mac=${shellQuote(LEGACY_BOOT_MAC_BYPASS_LINE)} \
            '{ sub(/\\r$/, ""); line=$0; gsub(/^[ \t]+|[ \t]+$/, "", line); if(line != "/data/clash/Scripts/Clash.Service start" && line != async && line != cleanup && line != runtime && line != service && line != legacy_wrapper && line != legacy_inotify && line != inotify && line != legacy_policy && line != policy && line != mac) print }' \
            "$BOOT_SOURCE" > "$BOOT_TMP" || exit 1
          ${enable ? `printf '%s\\n' ${shellQuote(BOOT_ASYNC_LINE)} >> "$BOOT_TMP" || exit 1` : ''}
          sh -n "$BOOT_TMP" || exit 1
          mv "$BOOT_TMP" ${shellQuote(BOOT_FILE)} || exit 1
        ) || exit $?
        `;

  // 策略脚本仍保留为高级功能，但不再成为基础开机自启的必需项。
  const addPolicyToolsBootLineCmd = () => addBootLinesCmd();

  const syncSafePolicyFilesCmd = () => `
        mkdir -p ${shellQuote(CLASH_POLICY_DIR)} ${shellQuote(CLASH_SAFE_POLICY_DIR)}
        sync_policy_file() {
          src="$1"
          dst="$2"
          [ -f "$src" ] || printf '# empty\\n' > "$src"
          cp "$src" "$dst" 2>/dev/null || printf '# empty\\n' > "$dst"
          chmod 600 "$src" 2>/dev/null || true
          chmod 644 "$dst" 2>/dev/null || true
        }
        sync_policy_file ${shellQuote(CLASH_REJECT_DOMAIN_FILE)} ${shellQuote(CLASH_SAFE_REJECT_DOMAIN_FILE)}
        sync_policy_file ${shellQuote(CLASH_DIRECT_DOMAIN_FILE)} ${shellQuote(CLASH_SAFE_DIRECT_DOMAIN_FILE)}
        sync_policy_file ${shellQuote(CLASH_DIRECT_IP_FILE)} ${shellQuote(CLASH_SAFE_DIRECT_IP_FILE)}
        sync_policy_file ${shellQuote(CLASH_PROXY_DOMAIN_FILE)} ${shellQuote(CLASH_SAFE_PROXY_DOMAIN_FILE)}
        `;


  const prepareYqRuntimeCmd = () => `
        KANO_YQ_RUNTIME=/data/kano_yq_runtime
        KANO_YQ_TMP="$KANO_YQ_RUNTIME/tmp"
        KANO_YQ_HOME="$KANO_YQ_RUNTIME/home"
        mkdir -p "$KANO_YQ_TMP" "$KANO_YQ_HOME" || {
          echo "YQ_RUNTIME_PREPARE_FAILED: cannot create $KANO_YQ_RUNTIME"
          exit 1
        }
        chmod 700 "$KANO_YQ_RUNTIME" "$KANO_YQ_TMP" "$KANO_YQ_HOME" 2>/dev/null || true
        export TMPDIR="$KANO_YQ_TMP"
        export TMP="$KANO_YQ_TMP"
        export TEMP="$KANO_YQ_TMP"
        export HOME="$KANO_YQ_HOME"
        export XDG_CONFIG_HOME="$KANO_YQ_HOME"
        `;

  const requireMikeFarahYqV4Cmd = () => `
        [ -x "$YQ" ] || {
          echo "YQ_MISSING: yq_linux_arm64 不存在或不可执行"
          exit 1
        }
        KANO_YQ_VERSION="$("$YQ" --version 2>&1)" || {
          echo "YQ_EXEC_FAILED: 无法执行 yq_linux_arm64 --version"
          exit 1
        }
        echo "YQ_VERSION=$KANO_YQ_VERSION"
        echo "YQ_EXEC_MODE=json_bridge_read_only"
        echo "YQ_TMPDIR=$TMPDIR"
        echo "$KANO_YQ_VERSION" | grep -Eiq 'version[[:space:]]+v?4\\.' || {
          echo "YQ_VERSION_UNSUPPORTED: 需要 Mike Farah yq v4，当前为 $KANO_YQ_VERSION"
          exit 1
        }
        KANO_YQ_SMOKE="$KANO_YQ_TMP/yq_json_bridge_smoke.$$"
        KANO_YQ_SMOKE_JSON="$KANO_YQ_TMP/yq_json_bridge_smoke.$$.json"
        cat > "$KANO_YQ_SMOKE" <<'KANO_YQ_SMOKE_EOF'
root:
  list:
    - ok
  number: 7895
KANO_YQ_SMOKE_EOF
        "$YQ" e -o=json '.' "$KANO_YQ_SMOKE" > "$KANO_YQ_SMOKE_JSON" 2>/data/kano_yq_expression_smoke.err || {
          echo "YQ_JSON_BRIDGE_PREFLIGHT_FAILED"
          cat /data/kano_yq_expression_smoke.err 2>/dev/null || true
          rm -f "$KANO_YQ_SMOKE" "$KANO_YQ_SMOKE_JSON" 2>/dev/null || true
          exit 1
        }
        grep -q '"root"' "$KANO_YQ_SMOKE_JSON" || {
          echo "YQ_JSON_BRIDGE_VERIFY_FAILED"
          cat "$KANO_YQ_SMOKE_JSON" 2>/dev/null || true
          rm -f "$KANO_YQ_SMOKE" "$KANO_YQ_SMOKE_JSON" 2>/dev/null || true
          exit 1
        }
        rm -f "$KANO_YQ_SMOKE" "$KANO_YQ_SMOKE_JSON" /data/kano_yq_expression_smoke.err 2>/dev/null || true
        echo "YQ_JSON_BRIDGE_PREFLIGHT=ok"
        `;

  const pruneKanoBackupsCmd = (keep = 8) => `
        prune_kano_backup_series() {
          base="$1"
          max_keep="$2"
          count=0
          for stale in $(ls -1t "\${base}".before_* 2>/dev/null); do
            case "$stale" in *.source|*.source.absent) continue ;; esac
            count=$((count + 1))
            [ "$count" -le "$max_keep" ] || rm -f "$stale" "$stale.source" "$stale.source.absent" 2>/dev/null || true
          done
        }
        prune_kano_backup_series ${shellQuote(CLASH_CONFIG)} ${shellQuote(String(keep))}
        prune_kano_backup_series ${shellQuote(CLASH_TEMPLATE)} ${shellQuote(String(keep))}
        prune_kano_backup_series ${shellQuote(CLASH_TEMPLATE_BASE)} ${shellQuote(String(keep))}
        `;

  const addBootLinesCmd = () => `
        [ -x ${shellQuote(CLASH_SERVICE)} ] && grep -qxF ${shellQuote(`# KANO_SERVICE_WRAPPER_VERSION=${CLASH_SERVICE_WRAPPER_VERSION}`)} ${shellQuote(CLASH_SERVICE)} || exit 1
        ${removeBootLinesCmd({ enable: true })}
        `;

  const parseKeyValueOutput = (content = '') => {
    const values = {};
    String(content || '').split(/\r?\n/).forEach((line) => {
      const separator = line.indexOf('=');
      if (separator <= 0) return;
      values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    });
    return values;
  };

  const buildServiceWrapperScript = () => `#!/system/bin/sh
# KANO_SERVICE_WRAPPER_VERSION=8.0.0-compat.2.3
# KANO_DETACHED_TUN_CLEANUP=1
# KANO_IPV6_NAT_COMPAT=1
# SPDX-License-Identifier: AGPL-3.0-or-later
: "\${CLASH_ROOT:=/data/clash}"
export CLASH_ROOT
export PATH=/system/bin:/system/xbin:/vendor/bin:/data/kano_tproxy_tools/bin:$PATH
case "$(getprop ro.product.cpu.abi 2>/dev/null) $(uname -m 2>/dev/null)" in
  *arm64*|*aarch64*|*armv8*) binary="$CLASH_ROOT/Scripts/clashctl_arm64" ;;
  *armeabi*|*armv7*) binary="$CLASH_ROOT/Scripts/clashctl_armv7" ;;
  *) binary="$CLASH_ROOT/Scripts/clashctl" ;;
esac
[ -x "$binary" ] || { echo F50_BACKEND_MISSING; exit 1; }
case "$1:$2" in
  start:*|restart:*|policy:apply|policy:boot-apply)
    compat_options="$CLASH_ROOT/Policy/options.conf"
    if [ -r "$compat_options" ] && grep -qx 'ipv6=on' "$compat_options" && grep -qx 'dns_hijack=on' "$compat_options"; then
      compat_nat_probe=$(ip6tables -t nat -S 2>&1); compat_nat_rc=$?
      if [ "$compat_nat_rc" != 0 ] && printf '%s\\n' "$compat_nat_probe" | grep -Eiq "can't initialize ip6tables table.*nat|Table does not exist"; then
        compat_tmp="$compat_options.kano_compat.$$"
        awk '{if($0=="dns_hijack=on") print "dns_hijack=off"; else print}' "$compat_options" > "$compat_tmp" || exit 1
        chmod 600 "$compat_tmp" 2>/dev/null || true
        mv -f "$compat_tmp" "$compat_options" || { rm -f "$compat_tmp" 2>/dev/null || true; exit 1; }
        echo F50_WARNING=ipv6_nat_unavailable_dns_hijack_disabled
      fi
    fi
    ;;
esac
case "$1" in
  start|restart|stop|recover)
    for detached_family in 4 6; do
      detached_rules=$(ip -"$detached_family" rule show 2>/dev/null) || continue
      if printf '%s\\n' "$detached_rules" | grep -Eq '^[[:space:]]*1776:.*[[:space:]]iif[[:space:]]KanoTun[[:space:]]+\\[detached\\][[:space:]]+lookup[[:space:]]+17667([[:space:]]|$)'; then
        ip -"$detached_family" rule del pref 1776 iif KanoTun lookup 17667 || {
          echo "F50_ERROR=detached_tun_rule_cleanup_failed_ipv$detached_family"
          exit 1
        }
      fi
    done
    ;;
esac
exec "$binary" "$@"
`;

  const ensureServiceWrapper = async () => { const ok=await ensureCompatBackend(); return {success:ok,content:ok?'F50_CONTROLLER='+F50_COMPAT_VERSION:'F50_BACKEND_REQUIRED'}; };

  const parseRuntimePreflightResult = (result = {}) => {
    const values = parseKeyValueOutput(result.content || '');
    const state = ['not_installed', 'damaged', 'installed_stopped', 'running_api_unavailable', 'healthy']
      .includes(values.PREFLIGHT_STATE)
      ? values.PREFLIGHT_STATE
      : 'damaged';
    return {
      state,
      abi: values.ABI || 'unknown',
      controller: values.CONTROLLER || '',
      missing: String(values.MISSING || '').split(',').filter(Boolean),
      permissionErrors: String(values.PERMISSION_ERRORS || '').split(',').filter(Boolean),
      probeErrors: String(values.PROBE_ERRORS || '').split(',').filter(Boolean),
      configValid: values.CONFIG_VALID == '1',
      repairable: values.REPAIRABLE == '1',
      repaired: String(values.REPAIRED || '').split(',').filter(Boolean),
      corePid: values.CORE_PID || '',
      message: values.MESSAGE || '',
      shellSuccess: !!result.success,
      content: String(result.content || ''),
    };
  };

  const classifyMihomoApiError = ({ corePid = '', curlStatus = 0, statusCode = 0, responseText = '' } = {}) => {
    if (!String(corePid || '').trim()) return { errorType: 'core_not_running', message: '核心未运行' };
    if (statusCode == 401 || statusCode == 403) return { errorType: 'auth_failed', message: `控制 API 鉴权失败（HTTP ${statusCode}）` };
    if (Number(curlStatus) == 7) return { errorType: 'connection_refused', message: '控制 API 拒绝连接' };
    if (Number(curlStatus) == 28) return { errorType: 'timeout', message: '控制 API 连接超时' };
    if (statusCode >= 400) return { errorType: 'http_error', message: `控制 API 返回 HTTP ${statusCode}` };
    const lower = String(responseText || '').toLowerCase();
    if (lower.includes('connection refused')) return { errorType: 'connection_refused', message: '控制 API 拒绝连接' };
    if (lower.includes('timed out') || lower.includes('timeout')) return { errorType: 'timeout', message: '控制 API 连接超时' };
    return { errorType: 'unavailable', message: '控制 API 不可用' };
  };

  const deriveRuntimeState = (preflight = {}, apiResult = null) => {
    if (preflight.state == 'not_installed' || preflight.state == 'damaged') return preflight.state;
    if (!preflight.corePid) return 'installed_stopped';
    return apiResult && apiResult.success ? 'healthy' : 'running_api_unavailable';
  };

  const runtimePreflight = async ({ freshController = true } = {}) => {
    // Basic preflight must stay non-invasive. In particular, never run `Clash.Core -t`
    // from page/status refresh: on some F50 builds a slow config-test process can outlive
    // the UFI root-shell request and then be mistaken for the real proxy core.
    const shellResult = await runShellWithRoot(`
      set +e
      SERVICE=${shellQuote(CLASH_SERVICE)}
      CORE=${shellQuote(CLASH_CORE)}
      CONFIG=${shellQuote(CLASH_CONFIG)}
      abi="$(getprop ro.product.cpu.abi 2>/dev/null | head -n 1 | tr '[:upper:]' '[:lower:]')"
      [ -n "$abi" ] || abi="$(uname -m 2>/dev/null | tr '[:upper:]' '[:lower:]')"
      [ -e "$SERVICE" ] || {
        echo "PREFLIGHT_STATE=not_installed"
        echo "ABI=\${abi:-unknown}"
        echo "CONFIG_VALID=0"
        echo "REPAIRABLE=0"
        echo "CORE_PID="
        echo "MESSAGE=未找到 Clash.Service"
        exit 0
      }
      missing=""
      [ -s "$CORE" ] || missing="core"
      [ -s "$CONFIG" ] || missing="\${missing:+$missing,}config"
      [ -x "$SERVICE" ] || chmod 755 "$SERVICE" 2>/dev/null || true
      [ -x "$CORE" ] || chmod 755 "$CORE" 2>/dev/null || true
      if [ -n "$missing" ]; then
        echo "PREFLIGHT_STATE=damaged"
        echo "ABI=\${abi:-unknown}"
        echo "MISSING=$missing"
        echo "CONFIG_VALID=0"
        echo "REPAIRABLE=1"
        echo "CORE_PID="
        echo "MESSAGE=基础运行文件缺失"
        exit 0
      fi

      ${buildOwnedCoreFunctions()}
      pid="$(find_runtime_pid)"
      state=installed_stopped
      [ -z "$pid" ] || state=running_api_unavailable
      echo "PREFLIGHT_STATE=$state"
      echo "ABI=\${abi:-unknown}"
      echo "CONTROLLER="
      echo "MISSING="
      echo "PERMISSION_ERRORS="
      echo "PROBE_ERRORS="
      echo "CONFIG_VALID=1"
      echo "REPAIRABLE=0"
      echo "REPAIRED="
      echo "CORE_PID=$pid"
      echo "MESSAGE=基础文件已就绪；状态刷新不再执行阻塞式 Core -t 预检"
      exit 0
    `, 15 * 1000);
    const preflight = parseRuntimePreflightResult(shellResult);
    if (preflight.state != 'running_api_unavailable') return preflight;
    const controllerInfo = await buildControllerInfo({ fresh: freshController });
    const api = await callMihomoApi('/version', 'GET', null, controllerInfo, 3, { corePid: preflight.corePid });
    return { ...preflight, state: deriveRuntimeState(preflight, api), api };
  };

  const parseBootIntegrationResult = (result = {}) => {
    const values = parseKeyValueOutput(result.content || '');
    const state = ['disabled', 'direct', 'managed', 'manager_damaged', 'incomplete'].includes(values.BOOT_STATE)
      ? values.BOOT_STATE
      : 'disabled';
    return {
      state,
      enabled: state != 'disabled',
      managerVersion: values.MANAGER_VERSION || '',
      formatCurrent: values.BOOT_FORMAT_CURRENT == '1',
      message: values.BOOT_MESSAGE || '',
      content: String(result.content || ''),
    };
  };

  const inspectBootIntegration = async () => {
    const result = await runShellWithRoot(`
      BOOT=${shellQuote(BOOT_FILE)}
      if [ ! -f "$BOOT" ]; then
        echo "BOOT_STATE=disabled"
        echo "BOOT_MESSAGE=猫猫未写入开机启动命令"
        exit 0
      fi
      if grep -qxF ${shellQuote(BOOT_ASYNC_LINE)} "$BOOT"; then
        if sh -n "$BOOT" && [ -x ${shellQuote(CLASH_SERVICE)} ] &&
            grep -qxF ${shellQuote(`# KANO_SERVICE_WRAPPER_VERSION=${CLASH_SERVICE_WRAPPER_VERSION}`)} ${shellQuote(CLASH_SERVICE)} &&
            sh -n ${shellQuote(CLASH_SERVICE)} && [ -x ${shellQuote(CLASH_POLICY_SCRIPT)} ] &&
            [ -r ${shellQuote(`${CLASH_DIR}/Scripts/Clash.Inotify`)} ]; then
          echo "BOOT_STATE=direct"
          echo "BOOT_FORMAT_CURRENT=1"
          echo "BOOT_MESSAGE=原生后台自启；启动结果见日志 kano_policy_boot.log"
        else
          echo "BOOT_STATE=incomplete"
          echo "BOOT_MESSAGE=自启组件缺失或脚本校验失败，请修复"
        fi
        exit 0
      fi
      if grep -qxF ${shellQuote(BOOT_SERVICE_LINE)} "$BOOT"; then
        if ! grep -qxF ${shellQuote(BOOT_POLICY_TOOLS_LINE)} "$BOOT" ||
            ! { grep -qxF ${shellQuote(BOOT_INOTIFY_LINE)} "$BOOT" || grep -qxF ${shellQuote(LEGACY_BOOT_INOTIFY_LINE)} "$BOOT"; }; then
          echo "BOOT_STATE=incomplete"
          echo "BOOT_MESSAGE=旧版自启项不完整，请修复"
          exit 0
        fi
        echo "BOOT_STATE=direct"
        echo "BOOT_MESSAGE=UFI 原生开机启动（Clash.Service start）"
        exit 0
      fi
      if grep -qxF ${shellQuote(LEGACY_BOOT_SERVICE_LINE)} "$BOOT" || grep -qxF ${shellQuote(LEGACY_BOOT_FIX_WRAPPER_LINE)} "$BOOT"; then
        echo "BOOT_STATE=managed"
        echo "BOOT_MESSAGE=检测到旧版接管式自启；下次重新开启自启时会自动恢复为 UFI 原生方式"
        exit 0
      fi
      echo "BOOT_STATE=disabled"
      echo "BOOT_MESSAGE=猫猫未写入开机启动命令"
    `, 10 * 1000);
    if (!result.success || !/(^|\n)BOOT_STATE=/.test(String(result.content || ''))) {
      throw new Error('未能读取开机自启状态，请重试');
    }
    return parseBootIntegrationResult(result);
  };

  const migrateBootPolicyIntegration = async () => {
    const state = await inspectBootIntegration();
    if (!state.enabled) return true;
    if (state.formatCurrent && state.state == 'direct') return true;
    if (!(await ensurePolicyToolsScript())) return false;
    const migrated = await runShellWithRoot(addPolicyToolsBootLineCmd(), 10 * 1000);
    return !!migrated.success;
  };

  const downloadCoreArchive = async ({ allowCached = false } = {}) => {
    // UFI root-shell requests have a finite request window. Keep every foreground
    // download attempt below that window and try sources one-by-one from JS.
    operationStage('\u68c0\u67e5\u5b89\u88c5\u5305\u7f13\u5b58');
    if (allowCached) {
      const cached = await runShellWithRoot(`
        ZIP=${shellQuote(DOWNLOAD_ZIP)}
        LOG=${shellQuote(DOWNLOAD_LOG)}
        [ -s "$ZIP" ] || exit 1
        command -v unzip >/dev/null 2>&1 || exit 1
        unzip -t "$ZIP" >"$LOG" 2>&1 || exit 1
        echo "ARCHIVE_READY=cached"
      `, 20 * 1000);
      if (cached.success && String(cached.content || '').includes('ARCHIVE_READY=cached')) {
        return { ok: true, stage: 'ready', source: 'cached', message: '', content: String(cached.content || '') };
      }
    }

    const sources = [CLASH_PACKAGE_FALLBACK_URL, CLASH_PACKAGE_URL].filter(Boolean);
    const errors = [];
    for (const packageUrl of sources) {
      operationStage('\u4e0b\u8f7d\u5e76\u6821\u9a8c\u5b89\u88c5\u5305\uff1a\u6765\u6e90 ' + (sources.indexOf(packageUrl) + 1) + '/' + sources.length);
      const result = await runShellWithRoot(`
        set +e
        ZIP=${shellQuote(DOWNLOAD_ZIP)}
        NEW="$ZIP.new.$$"
        LOG=${shellQuote(DOWNLOAD_LOG)}
        rm -f "$NEW" 2>/dev/null || true
        ${getCurlBinCmd()}
        command -v unzip >/dev/null 2>&1 || { echo "ARCHIVE_VERIFY_FAILED=unzip_missing"; exit 1; }

        echo "TRY_PACKAGE_URL=${packageUrl ? shellQuote(packageUrl) : "''"}" > "$LOG"
        "$CURL_BIN" -fsSL --connect-timeout 8 --max-time 60 --retry 0 --speed-time 12 --speed-limit 1024 \
          ${shellQuote(packageUrl)} -o "$NEW" >>"$LOG" 2>&1
        download_rc=$?
        if [ "$download_rc" -ne 0 ]; then
          rm -f "$NEW" 2>/dev/null || true
          echo "ARCHIVE_DOWNLOAD_FAILED=$download_rc"
          cat "$LOG" 2>/dev/null || true
          exit 1
        fi
        [ -s "$NEW" ] || {
          rm -f "$NEW" 2>/dev/null || true
          echo "ARCHIVE_VERIFY_FAILED=empty"
          exit 1
        }
        size="$(wc -c < "$NEW" 2>/dev/null || echo 0)"
        unzip -t "$NEW" >"$LOG.verify" 2>&1 || {
          rm -f "$NEW" 2>/dev/null || true
          echo "ARCHIVE_VERIFY_FAILED=zip"
          cat "$LOG.verify" 2>/dev/null || true
          exit 1
        }
        # v7.3.4 FINAL: do not reject an otherwise valid ZIP by exact internal path names here.
        # Package-root/component discovery happens after extraction, where nested/case-varied layouts can be normalized.
        mv -f "$NEW" "$ZIP" || exit 1
        printf '%s\n' ${shellQuote(packageUrl)} > ${shellQuote(DOWNLOAD_SOURCE_FILE)}
        chmod 600 ${shellQuote(DOWNLOAD_SOURCE_FILE)} 2>/dev/null || true
        rm -f "$LOG.verify" 2>/dev/null || true
        echo "ARCHIVE_READY=downloaded"
        echo "ARCHIVE_SOURCE=${shellQuote(packageUrl)}"
        echo "ARCHIVE_BYTES=$size"
      `, 80 * 1000);
      const content = String(result.content || '');
      if (result.success && content.includes('ARCHIVE_READY=downloaded')) {
        return { ok: true, stage: 'ready', source: packageUrl, message: '', content };
      }
      errors.push(`[${packageUrl}]\n${content || 'download failed'}`);
    }
    const content = errors.join('\n---\n');
    return {
      ok: false,
      stage: /ARCHIVE_DOWNLOAD_FAILED/.test(content) ? 'download' : 'archive_verify',
      source: '',
      message: '所有安装包来源均下载或校验失败',
      content,
    };
  };

  const stageAndCommitRepairArchive = async () => {
    const result = await runDangerousShellWithRoot(`
      set +e
      ${buildF50ZashboardValidationFunction()}
      ZIP=${shellQuote(DOWNLOAD_ZIP)}
      TARGET=${shellQuote(CLASH_DIR)}
      STAGE="/data/kano_clash_repair.$$"
      PACKAGE_ROOT=""
      TARGET_BACKUP=""
      USER_BACKUP=""
      committed=0
      cleanup_repair() {
        rc=$?
        trap - EXIT
        [ -d "$STAGE" ] && rm -rf "$STAGE" 2>/dev/null || true
        if [ "$rc" -ne 0 ] && [ "$committed" = "1" ]; then
          [ -x "$TARGET/Scripts/Clash.Service" ] && "$TARGET/Scripts/Clash.Service" stop >/dev/null 2>&1 || true
          [ -d "$TARGET" ] && rm -rf "$TARGET" 2>/dev/null || true
          [ -d "$TARGET_BACKUP" ] && mv "$TARGET_BACKUP" "$TARGET" 2>/dev/null || true
        fi
        exit "$rc"
      }
      trap cleanup_repair EXIT
      [ -s "$ZIP" ] || { echo "REPAIR_FAILED=archive_missing"; exit 1; }
      unzip -t "$ZIP" >/data/kano_clash_repair_zip_test.out 2>&1 || {
        echo "REPAIR_FAILED=archive_integrity"
        cat /data/kano_clash_repair_zip_test.out 2>/dev/null || true
        exit 1
      }
      names="$(unzip -Z1 "$ZIP" 2>/dev/null || true)"
      if [ -n "$names" ] && printf '%s\\n' "$names" | grep -Eq '(^/|(^|/)\\.\\.(/|$))'; then
        echo "REPAIR_FAILED=unsafe_archive_path"
        exit 1
      fi
      mkdir -p "$STAGE" || exit 1
      unzip -q "$ZIP" -d "$STAGE" >/data/kano_clash_repair_unzip.out 2>&1 || {
        echo "REPAIR_FAILED=unzip"
        cat /data/kano_clash_repair_unzip.out 2>/dev/null || true
        exit 1
      }
      if find "$STAGE" -type l 2>/dev/null | grep -q .; then
        command -v readlink >/dev/null 2>&1 || { echo "REPAIR_FAILED=symlink_reader_missing"; exit 1; }
        unsafe_link=0
        while IFS= read -r link_path; do
          link_target="$(readlink "$link_path" 2>/dev/null)"
          case "$link_target" in
            /*) unsafe_link=1 ;;
            *../*|../*|*/..|..) unsafe_link=1 ;;
          esac
          [ "$unsafe_link" = "0" ] || break
        done <<EOF_SAFE_LINKS
$(find "$STAGE" -type l 2>/dev/null)
EOF_SAFE_LINKS
        [ "$unsafe_link" = "0" ] || { echo "REPAIR_FAILED=unsafe_archive_symlink"; exit 1; }
      fi
      repair_unpacked="$(unzip -l "$ZIP" 2>/dev/null | tail -n 1 | awk '{print $1}')"
      if echo "$repair_unpacked" | grep -Eq '^[0-9]+$'; then
        [ "$repair_unpacked" -le 314572800 ] || { echo "REPAIR_FAILED=archive_expands_over_300MiB"; exit 1; }
      fi
      expanded="$(du -sk "$STAGE" 2>/dev/null | awk '{print $1}')"
      if echo "$expanded" | grep -Eq '^[0-9]+$' && [ "$expanded" -gt 0 ]; then
        [ "$expanded" -le 307200 ] || { echo "REPAIR_FAILED=expanded_size"; exit 1; }
      else
        echo "REPAIR_ADVANCED_WARNING=du_unavailable_size_checked_from_zip"
      fi
      service_candidate="$(find "$STAGE" -type f -iname 'Clash.Service' 2>/dev/null | head -n 1)"
      core_candidate="$(find "$STAGE" -type f -iname 'Clash.Core' 2>/dev/null | head -n 1)"
      if [ -n "$service_candidate" ]; then
        PACKAGE_ROOT="$(dirname "$(dirname "$service_candidate")")"
      elif [ -n "$core_candidate" ]; then
        PACKAGE_ROOT="$(dirname "$(dirname "$core_candidate")")"
      fi
      [ -n "$PACKAGE_ROOT" ] || { echo "REPAIR_FAILED=package_root"; exit 1; }
      for canonical in Scripts Proxy Tools; do
        if [ ! -d "$PACKAGE_ROOT/$canonical" ]; then
          actual_dir="$(find "$PACKAGE_ROOT" -maxdepth 1 -type d -iname "$canonical" 2>/dev/null | head -n 1)"
          if [ -n "$actual_dir" ] && [ "$actual_dir" != "$PACKAGE_ROOT/$canonical" ]; then
            mv "$actual_dir" "$PACKAGE_ROOT/$canonical" 2>/dev/null || true
          fi
        fi
      done
      mkdir -p "$PACKAGE_ROOT/Scripts" "$PACKAGE_ROOT/Proxy" "$PACKAGE_ROOT/Tools" 2>/dev/null || true
      if [ ! -f "$PACKAGE_ROOT/Proxy/Clash.Core" ]; then
        core_candidate="$(find "$PACKAGE_ROOT" -type f -iname 'Clash.Core' 2>/dev/null | head -n 1)"
        [ -n "$core_candidate" ] && [ "$core_candidate" != "$PACKAGE_ROOT/Proxy/Clash.Core" ] && mv "$core_candidate" "$PACKAGE_ROOT/Proxy/Clash.Core" 2>/dev/null || true
      fi
      if [ ! -f "$PACKAGE_ROOT/Scripts/Clash.Service" ]; then
        service_candidate="$(find "$PACKAGE_ROOT" -type f -iname 'Clash.Service' 2>/dev/null | head -n 1)"
        [ -n "$service_candidate" ] && [ "$service_candidate" != "$PACKAGE_ROOT/Scripts/Clash.Service" ] && mv "$service_candidate" "$PACKAGE_ROOT/Scripts/Clash.Service" 2>/dev/null || true
      fi
      SERVICE="$PACKAGE_ROOT/Scripts/Clash.Service"
      CORE="$PACKAGE_ROOT/Proxy/Clash.Core"
      YQ="$PACKAGE_ROOT/Tools/yq_linux_arm64"
      abi="$(getprop ro.product.cpu.abi 2>/dev/null | head -n 1 | tr '[:upper:]' '[:lower:]')"
      abilist="$(getprop ro.product.cpu.abilist 2>/dev/null | head -n 1 | tr '[:upper:]' '[:lower:]')"
      machine="$(uname -m 2>/dev/null | tr '[:upper:]' '[:lower:]')"
      case "$abi $abilist $machine" in
        *arm64-v8a*|*aarch64*|*armv8*) CONTROLLER="$PACKAGE_ROOT/Scripts/clashctl_arm64"; ELF_CLASS=2; ELF_MACHINE=183 ;;
        *armeabi-v7a*|*armeabi*|*armv7*|*armv6*) CONTROLLER="$PACKAGE_ROOT/Scripts/clashctl_armv7"; ELF_CLASS=1; ELF_MACHINE=40 ;;
        *) echo "REPAIR_FAILED=unsupported_abi"; exit 1 ;;
      esac
      if [ ! -s "$SERVICE" ] && [ -s "$CONTROLLER" ]; then
        cat > "$SERVICE" <<'EOF_KANO_SERVICE'
#!/system/bin/sh
case "$(getprop ro.product.cpu.abi 2>/dev/null)" in
  arm64-v8a) binary=/data/clash/Scripts/clashctl_arm64 ;;
  armeabi-v7a|armeabi) binary=/data/clash/Scripts/clashctl_armv7 ;;
  *) binary=/data/clash/Scripts/clashctl ;;
esac
if [ ! -x "$binary" ]; then
  echo "找不到适用于当前架构的 clashctl: $binary"
  exit 1
fi
exec "$binary" "$@"
EOF_KANO_SERVICE
        chmod 755 "$SERVICE" 2>/dev/null || true
        echo "REPAIR_COMPAT_SERVICE_REBUILT=1"
      fi
      [ -s "$SERVICE" ] || { echo "REPAIR_FAILED=required_component:Clash.Service_or_clashctl"; exit 1; }
      [ -s "$CORE" ] || { echo "REPAIR_FAILED=required_component:$CORE"; exit 1; }
      chmod 755 "$SERVICE" "$CORE" || { echo "REPAIR_FAILED=chmod_base"; exit 1; }
      advanced_missing=""
      if [ -s "$YQ" ]; then
        chmod 755 "$YQ" 2>/dev/null || true
        yq_version="$("$YQ" --version 2>&1)"
        echo "$yq_version" | grep -Eiq 'version[[:space:]]+v?4\\.' || advanced_missing="\${advanced_missing} yq_invalid"
      else
        advanced_missing="\${advanced_missing} yq"
      fi
      if [ -s "$CONTROLLER" ]; then
        chmod 755 "$CONTROLLER" 2>/dev/null || true
        if command -v od >/dev/null 2>&1; then
          magic="$(od -An -t x1 -N 4 "$CONTROLLER" 2>/dev/null | tr -d ' \\n')"
          class="$(od -An -t u1 -j 4 -N 1 "$CONTROLLER" 2>/dev/null | tr -d ' ')"
          elf_machine="$(od -An -t u1 -j 18 -N 2 "$CONTROLLER" 2>/dev/null | awk '{print $1 + ($2 * 256)}')"
          if [ "$magic" != "7f454c46" ] || [ "$class" != "$ELF_CLASS" ] || [ "$elf_machine" != "$ELF_MACHINE" ]; then
            advanced_missing="\${advanced_missing} controller_architecture"
          fi
        fi
        probe="$("$CONTROLLER" --help 2>&1)"
        probe_rc=$?
        case "$probe_rc:$probe" in
          126:*|127:*|*:*Exec\\ format*|*:*not\\ found*) advanced_missing="\${advanced_missing} controller_unusable" ;;
          *)
            rm -f "$PACKAGE_ROOT/Scripts/clashctl" 2>/dev/null || true
            ln -s "$(basename "$CONTROLLER")" "$PACKAGE_ROOT/Scripts/clashctl" 2>/dev/null || {
              cp "$CONTROLLER" "$PACKAGE_ROOT/Scripts/clashctl" 2>/dev/null && chmod 755 "$PACKAGE_ROOT/Scripts/clashctl" 2>/dev/null || true
            }
            ;;
        esac
      else
        advanced_missing="\${advanced_missing} controller"
      fi
      "$CORE" -v >/dev/null 2>&1 || "$CORE" -h >/dev/null 2>&1 || { echo "REPAIR_FAILED=core_probe"; exit 1; }
      echo "REPAIR_ADVANCED_MISSING=$advanced_missing"
      panel_probe="$(f50_validate_zashboard "$PACKAGE_ROOT/Proxy/WebUI/zashboard" 2>&1)"; panel_rc=$?
      printf '%s\\n' "$panel_probe"
      [ "$panel_rc" = 0 ] || { echo "REPAIR_FAILED=panel_candidate_rejected"; exit 1; }

      stamp="$(date +%Y%m%d%H%M%S 2>/dev/null)"
      [ -n "$stamp" ] || stamp="$(cat /proc/uptime 2>/dev/null | cut -d. -f1)"
      USER_BACKUP="/data/kano_clash_user_backup.$stamp"
      mkdir -p "$USER_BACKUP" || { echo "REPAIR_FAILED=user_backup_directory"; exit 1; }
      for relative in \
        Proxy/config.yaml Proxy/subscription_urls.txt Proxy/mac_bypass.txt Proxy/proxies Proxy/Policy \
        Tools/template.yaml Tools/template.base.yaml Tools/override.js Tools/rule_override.json \
        Tools/rule_override_applied.json Tools/sub_rule_mode.conf Tools/sub_user_agent.conf Policy; do
        source="$TARGET/$relative"
        [ -e "$source" ] || continue
        mkdir -p "$USER_BACKUP/$(dirname "$relative")" "$PACKAGE_ROOT/$(dirname "$relative")" || exit 1
        cp -pR "$source" "$USER_BACKUP/$relative" || { echo "REPAIR_FAILED=user_backup:$relative"; exit 1; }
        rm -rf "$PACKAGE_ROOT/$relative" 2>/dev/null || true
        cp -pR "$source" "$PACKAGE_ROOT/$relative" || { echo "REPAIR_FAILED=user_restore_to_stage:$relative"; exit 1; }
      done
      if [ -s "$PACKAGE_ROOT/Proxy/config.yaml" ]; then
        if [ -x "$YQ" ] && "$YQ" --version 2>&1 | grep -Eiq 'version[[:space:]]+v?4\\.'; then
          "$YQ" e '.' "$PACKAGE_ROOT/Proxy/config.yaml" >/dev/null 2>/data/kano_clash_repair_config.err || {
            echo "REPAIR_FAILED=preserved_yaml_invalid"
            cat /data/kano_clash_repair_config.err 2>/dev/null || true
            exit 1
          }
        fi
      else
        echo "REPAIR_FAILED=preserved_config_missing"
        exit 1
      fi

      [ -x "$TARGET/Scripts/Clash.Service" ] && "$TARGET/Scripts/Clash.Service" stop >/dev/null 2>&1 || true
      [ -x "$TARGET/Scripts/Clash.PolicyTools" ] && "$TARGET/Scripts/Clash.PolicyTools" flush >/dev/null 2>&1 || true
      TARGET_BACKUP="/data/clash.before_repair.$stamp"
      mv "$TARGET" "$TARGET_BACKUP" || { echo "REPAIR_FAILED=target_backup"; exit 1; }
      mv "$PACKAGE_ROOT" "$TARGET" || {
        mv "$TARGET_BACKUP" "$TARGET" 2>/dev/null || true
        echo "REPAIR_FAILED=atomic_commit"
        exit 1
      }
      committed=1
      panel_probe="$(f50_validate_zashboard "$TARGET/Proxy/WebUI/zashboard" 2>&1)"; panel_rc=$?
      printf '%s\\n' "$panel_probe"
      [ "$panel_rc" = 0 ] || { echo "REPAIR_FAILED=panel_postcheck_failed"; exit 1; }
      [ "$PACKAGE_ROOT" = "$STAGE" ] || rm -rf "$STAGE" 2>/dev/null || true
      sync 2>/dev/null || true
      echo "REPAIR_TARGET_BACKUP=$TARGET_BACKUP"
      echo "REPAIR_USER_BACKUP=$USER_BACKUP"
      echo "REPAIR_COMMITTED=1"
    `, 92 * 1000, 'damaged_install_repair');
    const values = parseKeyValueOutput(result.content || '');
    return {
      ok: !!(result.success && values.REPAIR_COMMITTED == '1'),
      targetBackup: values.REPAIR_TARGET_BACKUP || '',
      userBackup: values.REPAIR_USER_BACKUP || '',
      content: String(result.content || ''),
    };
  };

  const rollbackRepairedInstall = async (backupPath = '', reason = '') => {
    if (!/^\/data\/clash\.before_repair\.[A-Za-z0-9_.-]+$/.test(String(backupPath || ''))) {
      return { success: false, content: 'REPAIR_ROLLBACK_BACKUP_INVALID' };
    }
    return runDangerousShellWithRoot(`
      set -e
      TARGET=${shellQuote(CLASH_DIR)}
      BACKUP=${shellQuote(backupPath)}
      [ -d "$BACKUP" ] || { echo "REPAIR_ROLLBACK_BACKUP_MISSING"; exit 1; }
      [ -x "$TARGET/Scripts/Clash.Service" ] && "$TARGET/Scripts/Clash.Service" stop >/dev/null 2>&1 || true
      [ -x "$TARGET/Scripts/Clash.PolicyTools" ] && "$TARGET/Scripts/Clash.PolicyTools" flush >/dev/null 2>&1 || true
      FAILED="$TARGET.failed_repair.$(date +%Y%m%d%H%M%S 2>/dev/null)"
      [ -d "$TARGET" ] && mv "$TARGET" "$FAILED"
      mv "$BACKUP" "$TARGET"
      printf 'REPAIR_ROLLBACK_REASON=%s\\n' ${shellQuote(reason)}
      echo "REPAIR_ROLLBACK=restored_previous"
    `, 60 * 1000, 'damaged_install_rollback');
  };

  const selfHealDamagedInstall = async () => { createToast('请使用本版组件包修复，不会重装旧守护器。','red',9000); return false; };

  const setButtonBusy = (button, busy, busyText = '') => {
    if (!button) return;
    if (busy) {
      button.dataset.rawText = button.textContent || '';
      button.disabled = true;
      if (busyText) button.textContent = busyText;
    } else {
      button.disabled = false;
      if (button.dataset.rawText) {
        button.textContent = button.dataset.rawText;
        delete button.dataset.rawText;
      }
    }
  };

  let activeCriticalOperation = null;
  let refreshSubscriptionAfterRestore = null;
  const syncCriticalOperationStatus = () => {
    const statusEl = document.querySelector('#mm_task_status');
    if (!statusEl) return;
    const label = activeCriticalOperation && activeCriticalOperation.label
      ? activeCriticalOperation.label
      : '';
    statusEl.dataset.state = label ? 'running' : 'idle';
    statusEl.textContent = label ? `任务：${label}` : '任务：空闲';
  };
  const acquireCriticalOperation = (label = '关键操作', token = null) => {
    if (recoveryInProgress) {
      createToast('\u7f51\u7edc\u6062\u590d\u6b63\u5728\u6267\u884c', 'yellow');
      return null;
    }
    if (activeCriticalOperation) {
      if (token && activeCriticalOperation.token === token) return token;
      createToast(`“${escapeHtml(activeCriticalOperation.label)}”正在执行，请完成后再试。`, 'yellow', 5000);
      return null;
    }
    const operationToken = token || { id: `${Date.now()}_${createRandomString(6)}` };
    activeCriticalOperation = { label: String(label || '\u5173\u952e\u64cd\u4f5c'), token: operationToken, progress: createOperationProgress(label) };
    invalidateStatusSnapshot();
    syncCriticalOperationStatus();
    return operationToken;
  };

  const releaseCriticalOperation = (token) => {
    if (activeCriticalOperation && activeCriticalOperation.token === token) {
      if (activeCriticalOperation.progress && !token.cancelled) activeCriticalOperation.progress.finish(null);
      activeCriticalOperation = null;
      invalidateStatusSnapshot();
      syncCriticalOperationStatus();
    }
  };

  const runCriticalOperation = async (label, action, token = null) => {
    const reentrant = !!(token && activeCriticalOperation && activeCriticalOperation.token === token);
    const operationToken = acquireCriticalOperation(label, token);
    if (!operationToken) return false;
    const ownsLock = !reentrant;
    try {
      const result = await action(operationToken);
      if (ownsLock) operationFinish(typeof result === 'boolean' ? result : null);
      return result;
    } catch (error) {
      if (ownsLock) operationFinish(false, sanitizeSubscriptionSecrets(error.message || String(error)));
      if (error.name !== 'OperationCancelled') throw error;
      return false;
    } finally {
      if (ownsLock) releaseCriticalOperation(operationToken);
    }
  };

  let advancedAccessCache = null;
  let advancedAccessCacheExpiresAt = 0;
  let advancedAccessLoadPromise = null;

  const checkAdvanceFunc = async ({ fresh = false } = {}) => {
    const now = Date.now();
    if (!fresh && advancedAccessCache !== null && advancedAccessCacheExpiresAt > now) {
      return advancedAccessCache;
    }
    if (!fresh && advancedAccessLoadPromise) return advancedAccessLoadPromise;
    const loadPromise = (async () => {
      try {
        const res = await runShellWithRoot('whoami');
        return !!(res.success && String(res.content || '').includes('root'));
      } catch (e) {
        console.error(e);
        return false;
      }
    })();
    if (!fresh) advancedAccessLoadPromise = loadPromise;
    try {
      const allowed = await loadPromise;
      advancedAccessCache = allowed;
      advancedAccessCacheExpiresAt = Date.now() + (allowed
        ? ADVANCED_ACCESS_CACHE_TTL
        : ADVANCED_ACCESS_FAILURE_CACHE_TTL);
      return allowed;
    } finally {
      if (advancedAccessLoadPromise == loadPromise) advancedAccessLoadPromise = null;
    }
  };

  // ===== Subscription helpers =====

  const ensureAdvanced = async () => {
    if (await checkAdvanceFunc()) return true;
    createToast('\u6ca1\u6709\u5f00\u542f\u9ad8\u7ea7\u529f\u80fd\uff0c\u65e0\u6cd5\u4f7f\u7528\uff01', 'red');
    return false;
  };

  let currentProviderUserAgent = KANO_PROVIDER_USER_AGENT;
  let providerUserAgentLoaded = false;

  const normalizeProviderUserAgent = (value = '') => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    if (/[\x00-\x1f\x7f]/.test(normalized)) throw new Error('User-Agent 不能包含控制字符');
    if (normalized.length > 512) throw new Error('User-Agent 不能超过 512 个字符');
    return normalized;
  };

  const parseStoredProviderUserAgent = (value = '') => {
    let normalized = String(value || '').replace(/\r/g, '').split('\n')[0].trim();
    const legacyMatch = normalized.match(/^KANO_SUB_USER_AGENT\s*=\s*(.*)$/);
    if (legacyMatch) normalized = legacyMatch[1].trim();
    if (
      normalized.length >= 2 &&
      ((normalized.startsWith("'") && normalized.endsWith("'")) ||
        (normalized.startsWith('"') && normalized.endsWith('"')))
    ) {
      normalized = normalized.slice(1, -1).trim();
    }
    return normalizeProviderUserAgent(normalized);
  };

  const loadProviderUserAgent = async ({ fresh = false } = {}) => {
    if (!fresh && providerUserAgentLoaded) return currentProviderUserAgent;
    const res = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_SUB_USER_AGENT_FILE)} ]; then
          sed -n '1p' ${shellQuote(CLASH_SUB_USER_AGENT_FILE)}
        fi
        `, 10 * 1000);
    if (!res.success) throw new Error('\u8bfb\u53d6\u8ba2\u9605\u8bf7\u6c42\u5934\u5931\u8d25\uff0c\u672a\u7ee7\u7eed\u66f4\u65b0');
    try {
      currentProviderUserAgent =
        parseStoredProviderUserAgent(res.content || '') ||
        KANO_PROVIDER_USER_AGENT;
    } catch {
      currentProviderUserAgent = KANO_PROVIDER_USER_AGENT;
    }
    providerUserAgentLoaded = true;
    return currentProviderUserAgent;
  };

  const persistProviderUserAgent = async (value = '') => {
    let customValue = '';
    try {
      customValue = normalizeProviderUserAgent(value);
    } catch (e) {
      return { ok: false, value: currentProviderUserAgent, message: e.message || String(e) };
    }
    const res = await runShellWithRoot(`
        set -e
        TARGET=${shellQuote(CLASH_SUB_USER_AGENT_FILE)}
        mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)}
        if [ -z ${shellQuote(customValue)} ]; then
          rm -f "$TARGET"
        else
          NEW="$TARGET.kano_new.$$"
          trap 'rm -f "$NEW" 2>/dev/null || true' EXIT
          printf '%s\\n' ${shellQuote(customValue)} > "$NEW"
          chmod 600 "$NEW"
          mv -f "$NEW" "$TARGET"
          trap - EXIT
          stored="$(sed -n '1p' "$TARGET" 2>/dev/null | tr -d '\\r')"
          [ "$stored" = ${shellQuote(customValue)} ] || { echo "USER_AGENT_WRITE_VERIFY_FAILED"; exit 1; }
        fi
        echo USER_AGENT_SAVED
        `, 15 * 1000);
    if (!res.success) {
      return { ok: false, value: currentProviderUserAgent, message: res.content || '写入失败' };
    }
    currentProviderUserAgent = customValue || KANO_PROVIDER_USER_AGENT;
    providerUserAgentLoaded = true;
    return { ok: true, value: currentProviderUserAgent, custom: !!customValue, message: '' };
  };

  //\u521b\u5efa\u968f\u673a\u6570
  const createRandomString = (length = 8) => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  const createRandomSecret = (length = 20) => {
    const size = Math.max(12, Math.floor(Number(length) || 20));
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    try {
      if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues != 'function') throw new Error('crypto unavailable');
      const bytes = new Uint8Array(size);
      globalThis.crypto.getRandomValues(bytes);
      return Array.from(bytes, (value) => characters[value % characters.length]).join('');
    } catch (e) {
      console.error('secure secret generation unavailable', e);
      return `${createRandomString(size)}${Date.now().toString(36)}`.slice(0, size);
    }
  };

  const wait = (ms = 1000) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const runShellWithRootRetry = async (script = '', timeout = 20 * 1000, attempts = 3) => {
    let lastResult = { success: false, content: '' };
    const maxAttempts = Math.max(1, Math.floor(Number(attempts) || 1));
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        lastResult = await runShellWithRoot(script, timeout);
      } catch (e) {
        lastResult = { success: false, content: e && e.message ? e.message : String(e || '') };
      }
      if (lastResult && lastResult.success) return lastResult;
      const detail = String((lastResult && lastResult.content) || '');
      if (!/(failed to fetch|networkerror|load failed|aborterror|request.*timeout|\u8bf7\u6c42\u8d85\u65f6)/i.test(detail) || attempt >= maxAttempts) {
        return lastResult;
      }
      await wait(attempt * 800);
    }
    return lastResult;
  };

  let binarySnapshotCache = null;
  let binarySnapshotExpiresAt = 0;
  let binarySnapshotLoadPromise = null;
  let binarySnapshotUnavailableUntil = 0;

  const parseBinaryHelperJsonOutput = (content = '') => {
    const text = String(content || '').trim();
    if (!text) return null;
    const candidates = [text, ...text.split('\n').map((line) => line.trim()).filter(Boolean).reverse()];
    for (const candidate of candidates) {
      const attempts = [candidate];
      const firstBrace = candidate.indexOf('{');
      const lastBrace = candidate.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const sliced = candidate.slice(firstBrace, lastBrace + 1);
        if (sliced != candidate) attempts.push(sliced);
      }
      for (const attempt of attempts) {
        try {
          const value = JSON.parse(attempt);
          if (value && typeof value == 'object' && value.ok === true) return value;
        } catch (_) {}
      }
    }
    return null;
  };

  const runBinaryHelperJson = async (command, args = [], timeout = 15 * 1000) => {
    const commandArgs = [command, ...args].map((value) => shellQuote(String(value))).join(' ');
    const res = await runShellWithRoot(
      `[ -x ${shellQuote(KANO_HELPER_PATH)} ] || exit 127; ${shellQuote(KANO_HELPER_PATH)} ${commandArgs}`,
      timeout,
    );
    if (!res.success) return null;
    return parseBinaryHelperJsonOutput(res.content || '');
  };

  const probeBinaryHelperState = async (timeout = 12 * 1000) => {
    const res = await runShellWithRoot(`
      TARGET=${shellQuote(KANO_HELPER_PATH)}
      if [ ! -f "$TARGET" ]; then
        echo "KANO_HELPER_STATE=missing"
        exit 0
      fi
      chmod 700 "$TARGET" 2>/dev/null || true
      if [ ! -x "$TARGET" ]; then
        echo "KANO_HELPER_STATE=not_executable"
        exit 0
      fi
      echo "KANO_HELPER_STATE=present"
      VERSION_OUT="$("$TARGET" version 2>&1)"
      helper_rc=$?
      printf '%s\n' "$VERSION_OUT"
      echo "KANO_HELPER_RC=$helper_rc"
      exit 0
    `, timeout);
    const content = String(res.content || '');
    const info = parseBinaryHelperJsonOutput(content);
    const stateMatches = [...content.matchAll(/(?:^|\n)KANO_HELPER_STATE=([^\r\n]+)/g)];
    const stateMatch = stateMatches.length ? stateMatches[stateMatches.length - 1] : null;
    const rcMatch = content.match(/(?:^|\n)KANO_HELPER_RC=(\d+)/);
    const rc = rcMatch ? Number(rcMatch[1]) : null;
    let state = stateMatch ? stateMatch[1].trim() : (res.success ? 'unknown' : 'probe_failed');
    if (state == 'present') {
      if (!res.success || rc !== 0 || !info || info.ok !== true || !info.version) {
        state = 'invalid';
      } else if (!/^\d+\.\d+\.\d+$/.test(String(info.version).trim())) {
        state = 'invalid';
      } else {
        const commands = Array.isArray(info.commands) ? info.commands.map(String) : [];
        state = KANO_HELPER_REQUIRED_COMMANDS.every((command) => commands.includes(command))
          ? 'installed'
          : 'invalid';
      }
    }
    return { state, info, rc, content, shellSuccess: !!res.success };
  };

  const readBinarySnapshot = async ({ fresh = false } = {}) => {
    const now = Date.now();
    if (!fresh && binarySnapshotCache && binarySnapshotExpiresAt > now) return binarySnapshotCache;
    // Missing/failed optional helper is negative-cached briefly so a clean install does not
    // spawn repeated root-shell probes while several status widgets initialize together.
    if (!fresh && binarySnapshotUnavailableUntil > now) return null;
    if (!fresh && binarySnapshotLoadPromise) return binarySnapshotLoadPromise;
    const loadPromise = runBinaryHelperJson('snapshot', [
      '--config', CLASH_CONFIG,
      '--options', CLASH_POLICY_OPTIONS_FILE,
    ]);
    binarySnapshotLoadPromise = loadPromise;
    try {
      const snapshot = await loadPromise;
      if (binarySnapshotLoadPromise != loadPromise) return snapshot;
      if (snapshot) {
        binarySnapshotCache = snapshot;
        binarySnapshotExpiresAt = Date.now() + KANO_HELPER_SNAPSHOT_TTL;
        binarySnapshotUnavailableUntil = 0;
      } else if (!fresh) {
        binarySnapshotUnavailableUntil = Date.now() + 5000;
      }
      return snapshot;
    } finally {
      if (binarySnapshotLoadPromise == loadPromise) binarySnapshotLoadPromise = null;
    }
  };

  const invalidateBinarySnapshot = () => {
    binarySnapshotCache = null;
    binarySnapshotExpiresAt = 0;
    binarySnapshotLoadPromise = null;
    binarySnapshotUnavailableUntil = 0;
  };

  const installBinaryHelperFromDevicePath = async ({
    sourcePath, prepareCommand = '', timeout = 30 * 1000,
    label = 'install_binary_helper', successMessage = '转换组件已安装', quiet = false,
  } = {}) => {
    if (!sourcePath) return false;
    const stagePath = `${KANO_HELPER_PATH}.kano_new_${Date.now()}_${createRandomString(4)}`;
    const installResult = await runDangerousShellWithRoot(`
      set -e
      SOURCE=${shellQuote(sourcePath)}
      STAGE=${shellQuote(stagePath)}
      TARGET=${shellQuote(KANO_HELPER_PATH)}
      CONVERTER=${shellQuote(KANO_HELPER_CONVERTER_PATH)}
      cleanup_helper_install() {
        rc=$?
        rm -f "$SOURCE" "$STAGE" 2>/dev/null || true
        trap - EXIT
        exit "$rc"
      }
      trap cleanup_helper_install EXIT
      ${prepareCommand}
      mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)}
      [ -s "$SOURCE" ] || { echo "HELPER_SOURCE_EMPTY"; exit 1; }
      helper_extract_version() {
        printf '%s\n' "$1" | sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\\([0-9][0-9]*\\.[0-9][0-9]*\\.[0-9][0-9]*\\)".*/\\1/p' | head -n 1
      }
      CURRENT_INFO=""
      CURRENT_VERSION=""
      if [ -x "$TARGET" ]; then
        CURRENT_INFO="$(timeout -k 1 3 "$TARGET" version 2>/dev/null || true)"
        CURRENT_VERSION="$(helper_extract_version "$CURRENT_INFO")"
      fi
      # Best-effort migration only: if an older helper advertises 0.2.3, retain it as converter.
      # Failure to identify/copy it never blocks installing the new helper.
      if [ -f "$TARGET" ] && [ ! -s "$CONVERTER" ]; then
        old_info="$CURRENT_INFO"
        [ -n "$old_info" ] || old_info="$(timeout -k 1 3 "$TARGET" version 2>/dev/null || true)"
        if printf '%s\n' "$old_info" | grep -q '0\.2\.3'; then
          cp "$TARGET" "$CONVERTER.new.$$" 2>/dev/null && \
            chmod 700 "$CONVERTER.new.$$" 2>/dev/null && \
            mv -f "$CONVERTER.new.$$" "$CONVERTER" 2>/dev/null || true
        fi
      fi
      mv -f "$SOURCE" "$STAGE"
      chmod 700 "$STAGE" || { echo "HELPER_CHMOD_FAILED"; exit 1; }
      [ -x "$STAGE" ] || { echo "HELPER_NOT_EXECUTABLE"; exit 1; }
      VERSION_OUT="$(timeout -k 1 3 "$STAGE" version 2>&1)" || {
        helper_rc=$?
        printf '%s\n' "$VERSION_OUT"
        echo "HELPER_VERSION_PROBE_FAILED=$helper_rc"
        exit 1
      }
      HELPER_VERSION="$(helper_extract_version "$VERSION_OUT")"
      [ -n "$HELPER_VERSION" ] || {
        printf '%s\n' "$VERSION_OUT"
        echo "HELPER_VERSION_INVALID"
        exit 1
      }
      helper_version_is_newer() {
        awk -v candidate="$1" -v current="$2" 'BEGIN {
          split(candidate, c, "."); split(current, m, ".")
          for (i = 1; i <= 3; i++) {
            if ((c[i] + 0) > (m[i] + 0)) exit 0
            if ((c[i] + 0) < (m[i] + 0)) exit 1
          }
          exit 1
        }'
      }
      if [ -n "$CURRENT_VERSION" ] && ! helper_version_is_newer "$HELPER_VERSION" "$CURRENT_VERSION"; then
        echo "HELPER_VERSION_NOT_NEWER=candidate_$HELPER_VERSION,current_$CURRENT_VERSION"
        exit 1
      fi
      for expected_command in ${KANO_HELPER_REQUIRED_COMMANDS.map((command) => shellQuote(command)).join(' ')}; do
        printf '%s\n' "$VERSION_OUT" | grep -Fq "\"$expected_command\"" || {
          echo "HELPER_COMMAND_MISSING=$expected_command"
          exit 1
        }
      done
      mv -f "$STAGE" "$TARGET"
      chmod 700 "$TARGET" || { echo "HELPER_TARGET_CHMOD_FAILED"; exit 1; }
      rm -f "$TARGET.verified" 2>/dev/null || true
      trap - EXIT
      rm -f "$SOURCE" 2>/dev/null || true
      echo "HELPER_INSTALLED=1"
    `, timeout, label);
    if (!installResult.success) {
      if (quiet) console.error('binary helper install failed', installResult.content || '');
      else createToast(`转换组件安装失败<br>${safeTextToHtml(installResult.content || '')}`, 'red', 9000);
      return false;
    }
    invalidateBinarySnapshot();
    if (!quiet) createToast(successMessage, 'green', 5000);
    return true;
  };

  const installBinaryHelperFromBundled = async ({ quiet = false } = {}) => {
    const sourcePath = `/data/kano_helper_bundled_${Date.now()}_${createRandomString(4)}`;
    return installBinaryHelperFromDevicePath({
      quiet, sourcePath,
      prepareCommand: `
        TOOLS=${shellQuote(KANO_HELPER_BUNDLED_DIR)}
        BUNDLED=""
        for candidate in \
          "$TOOLS/kano-f50-helper-bundled" \
          "$TOOLS/kano-f50-helper-android-arm64"; do
          [ -s "$candidate" ] && { BUNDLED="$candidate"; break; }
        done
        if [ -z "$BUNDLED" ]; then
          BUNDLED="$(find "$TOOLS" -maxdepth 1 -type f -name 'kano-f50-helper-v*-android-arm64' 2>/dev/null | head -n 1)"
        fi
        [ -n "$BUNDLED" ] && [ -s "$BUNDLED" ] || { echo "HELPER_BUNDLED_MISSING"; exit 1; }
        cp "$BUNDLED" "$SOURCE"
      `,
      timeout: 35 * 1000, label: 'install_binary_helper_bundled',
      successMessage: '转换组件已从本地安装包安装',
    });
  };

  const installBinaryHelperFromGitee = async ({ quiet = false } = {}) => {
    const sourcePath = `/data/kano_helper_gitee_${Date.now()}_${createRandomString(4)}`;
    return installBinaryHelperFromDevicePath({
      quiet,
      sourcePath,
      prepareCommand: `
        ${getCurlBinCmd()}
        "$CURL_BIN" -fL --connect-timeout 8 --max-time 50 --retry 0 --speed-time 12 --speed-limit 1024 \
          ${shellQuote(KANO_HELPER_DOWNLOAD_URL)} -o "$SOURCE"
      `,
      timeout: 75 * 1000,
      label: 'install_binary_helper_gitee',
      successMessage: '转换组件已从 Gitee 安装',
    });
  };

  const installBinaryHelperPreferred = async ({ quiet = true } = {}) => {
    const probe = await probeBinaryHelperState(5000);
    if (probe.state == 'installed') return true;
    return installBinaryHelperFromBundled({ quiet });
  };

  const installBinaryHelperFromFile = async (file) => {
    if (!file) return false;
    if (file.size === 0) {
      createToast('转换组件文件为空', 'red', 5000);
      return false;
    }
    let uploadedPath = '';
    try {
      uploadedPath = await uploadFileToDevice(file);
    } catch (e) {
      createToast(`转换组件上传失败<br>${safeTextToHtml(e && e.message ? e.message : e)}`, 'red', 8000);
      return false;
    }

    return installBinaryHelperFromDevicePath({
      sourcePath: uploadedPath,
      label: 'install_binary_helper_file',
    });
  };

  const providerNameFor = (index = 0) => `Provider${index + 1}`;

  const normalizeSubUrl = (value = '') =>
    String(value).trim().replace(/[,\]}]+$/g, '');

  const normalizeStoredSubSourceList = (sources = []) => {
    const rows = [];
    const seen = new Set();
    (sources || []).forEach((source) => {
      const raw = typeof source == 'string' ? source : (source && source.url);
      const url = normalizeSubUrl(raw || '');
      if (!url || seen.has(url)) return;
      seen.add(url);
      rows.push({
        url,
        name: providerNameFor(rows.length),
        enabled: !(source && typeof source == 'object' && source.enabled === false),
      });
    });
    return rows;
  };

  const normalizeSubSourceList = (sources = []) => normalizeStoredSubSourceList(sources)
    .filter((source) => source.enabled)
    .map((source, index) => ({
      url: source.url,
      name: providerNameFor(index),
    }));

  const detectSuspiciousSubSources = (sources = []) => {
    const nonSubPatterns = [
      /generate_204/i,
      /\/dns-query/i,
      /geoip|geosite|geodata|mmdb|asn/i,
      /(?:^|[/?#&_.@-])(?:rule-?set|ruleset|rule-?provider|meta-?rules-?dat|v2ray-?rules-?dat|clash-?rules|ios_rule_script|acl4ssr|domain-list-community|gfwlist)(?:[/?#&_.=@-]|$)/i,
      /\/(?:rule|rules|rule-set|rule-providers?)\/[^?#]+\.(?:yaml|yml|txt|list|mrs|json)(?:[?#].*)?$/i,
      /\/(?:clash|surge|loon|quantumultx)\/[^?#]+\.(?:yaml|yml|txt|list|conf|mrs)(?:[?#].*)?$/i,
      /\.mrs(?:[?#].*)?$/i,
      /\.(png|jpg|jpeg|gif|svg|webp)$/i,
    ];
    return normalizeStoredSubSourceList(sources).some((source) =>
      nonSubPatterns.some((pattern) => pattern.test(source.url)),
    );
  };

  const buildSubUrlsFileText = (
    sources = [],
    mode = SUB_RULE_MODE_TEMPLATE,
    convertMode = SUB_CONVERT_MODE_PROVIDER,
  ) => {
    const storedSources = normalizeStoredSubSourceList(sources);
    const cleanMode = normalizeSubRuleModeValue(mode);
    const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
    let activeIndex = 0;
    return [
      `# KANO_SUB_RULE_MODE=${cleanMode}`,
      `# KANO_SUB_CONVERT_MODE=${cleanConvertMode}`,
      ...storedSources.map((source) => source.enabled
        ? `${source.url} ${providerNameFor(activeIndex++)}`
        : `${SUB_DISABLED_MARKER}${source.url}`),
    ].join('\n') + '\n';
  };

  const providerNamesForTemplate = (sources = []) => {
    const cleanSources = normalizeSubSourceList(sources);
    return cleanSources.map((source) => source.name);
  };

  const parseStoredSubSourcesFromText = (content = '') => {
    const sources = [];
    String(content || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const disabled = line.startsWith(SUB_DISABLED_MARKER);
        if (line.startsWith('#') && !disabled) return;
        const storedLine = disabled ? line.slice(SUB_DISABLED_MARKER.length).trim() : line;
        const parts = storedLine.split(/\s+/).filter(Boolean);
        const url = normalizeSubUrl(parts[0] || '');
        if (isHttpUrl(url)) {
          sources.push({
            url,
            name: providerNameFor(sources.length),
            enabled: !disabled,
          });
        }
      });
    return normalizeStoredSubSourceList(sources);
  };


  const normalizeSubRuleModeValue = (value = '') =>
    String(value || '').trim().toLowerCase() == SUB_RULE_MODE_ORIGINAL
      ? SUB_RULE_MODE_ORIGINAL : SUB_RULE_MODE_TEMPLATE;
  const parseSubRuleModeFromText = (content = '') => {
    const match = String(content || '').match(/^# KANO_SUB_RULE_MODE=(\S+)\s*$/m);
    return normalizeSubRuleModeValue(match ? match[1] : '');
  };

  const readConfigSource = async () => {
    const res = await runShellWithRoot(`
      if [ -f ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} ]; then
        sed -n 's/^KANO_CONFIG_SOURCE=//p' ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} | head -n 1
      fi
    `, 10 * 1000);
    if (!res.success) throw new Error('读取配置来源失败，未修改配置');
    return String(res.content || '').trim();
  };
  const normalizeSubConvertModeValue = () => SUB_CONVERT_MODE_LOCAL;

  const parseSubConvertModeFromText = (content = '') => {
    const match = String(content || '').match(/^# KANO_SUB_CONVERT_MODE=(\S+)\s*$/m);
    return normalizeSubConvertModeValue(match ? match[1] : '');
  };

  const readSavedSubConvertMode = async () => SUB_CONVERT_MODE_LOCAL;

  const fileTransactionHelpersCmd = () => `
        snapshot_transaction_file() {
          name="$1"
          path="$2"
          if [ -e "$path" ]; then
            cp -p "$path" "$TX/$name" 2>/dev/null || cp "$path" "$TX/$name" || return 1
            touch "$TX/$name.had" || return 1
          else
            touch "$TX/$name.absent" || return 1
          fi
        }
        restore_transaction_file() {
          name="$1"
          path="$2"
          if [ -f "$TX/$name.had" ] && [ -f "$TX/$name" ]; then
            mkdir -p "$(dirname "$path")" || return 1
            restored="$path.kano_restore.$$"
            cp -p "$TX/$name" "$restored" 2>/dev/null || cp "$TX/$name" "$restored" || return 1
            mv -f "$restored" "$path" || return 1
          elif [ -f "$TX/$name.absent" ]; then
            rm -f "$path" || return 1
          else
            return 1
          fi
          return 0
        }
        recover_stale_transactions() {
          tx_prefix="$1"
          restore_callback="$2"
          current_tx="$TX"
          now="$(date +%s 2>/dev/null || echo 0)"
          for stale_tx in /data/"$tx_prefix".*; do
            [ -d "$stale_tx" ] || continue
            [ "$stale_tx" = "$current_tx" ] && continue
            stale_pid="\${stale_tx##*.}"
            case "$stale_pid" in
              ''|*[!0-9]*) ;;
              *) [ -d "/proc/$stale_pid" ] && continue ;;
            esac
            if [ -f "$stale_tx/committed" ]; then
              rm -rf "$stale_tx" 2>/dev/null || true
              continue
            fi
            if [ -f "$stale_tx/pending" ]; then
              pending_time="$(stat -c %Y "$stale_tx/pending" 2>/dev/null || echo 0)"
              if [ "$now" -gt 0 ] && [ "$pending_time" -gt 0 ] && [ $((now - pending_time)) -lt 300 ]; then
                continue
              fi
            fi
            TX="$stale_tx"
            if "$restore_callback"; then
              echo "TRANSACTION_RECOVERY=restored:$stale_tx"
              rm -rf "$stale_tx" 2>/dev/null || true
            else
              echo "KANO_ERROR_STAGE=transaction_recovery"
              echo "KANO_ERROR_CODE=restore_failed"
              TX="$current_tx"
              return 1
            fi
          done
          TX="$current_tx"
          return 0
        }
        `;


  const subRuleModePersistSidecarsCmd = (mode = SUB_RULE_MODE_TEMPLATE) => `
        KANO_MODE=${shellQuote(normalizeSubRuleModeValue(mode))}
        mkdir -p ${shellQuote(CLASH_POLICY_DIR)} ${shellQuote(`${CLASH_DIR}/Tools`)}
        printf 'KANO_SUB_RULE_MODE=%s\n' "$KANO_MODE" > ${shellQuote(CLASH_SUB_RULE_MODE_FILE)}
        touch ${shellQuote(CLASH_POLICY_OPTIONS_FILE)}
        if grep -q '^KANO_SUB_RULE_MODE=' ${shellQuote(CLASH_POLICY_OPTIONS_FILE)} 2>/dev/null; then
          sed -i "s/^KANO_SUB_RULE_MODE=.*/KANO_SUB_RULE_MODE=$KANO_MODE/" ${shellQuote(CLASH_POLICY_OPTIONS_FILE)}
        else
          printf 'KANO_SUB_RULE_MODE=%s\n' "$KANO_MODE" >> ${shellQuote(CLASH_POLICY_OPTIONS_FILE)}
        fi
        chmod 600 ${shellQuote(CLASH_SUB_RULE_MODE_FILE)} ${shellQuote(CLASH_POLICY_OPTIONS_FILE)} 2>/dev/null || true
        `;

  const persistSubSourceState = async (
    sources,
    mode = SUB_RULE_MODE_TEMPLATE,
    convertMode = SUB_CONVERT_MODE_PROVIDER,
    { allowEmpty = false } = {},
  ) => {
    const cleanMode = normalizeSubRuleModeValue(mode);
    const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
    const storedSources = normalizeStoredSubSourceList(sources);
    if (!allowEmpty && storedSources.length == 0) return false;
    const subUrlsText = buildSubUrlsFileText(storedSources, cleanMode, cleanConvertMode);
    const sourceRes = await runShellWithRoot(`
        set -e
        TX=/data/kano_sub_persist.$$
        SUB=${shellQuote(CLASH_SUB_URLS)}
        MODE=${shellQuote(CLASH_SUB_RULE_MODE_FILE)}
        OPTIONS=${shellQuote(CLASH_POLICY_OPTIONS_FILE)}
        ${fileTransactionHelpersCmd()}
        restore_sub_transaction() {
          restore_rc=0
          restore_transaction_file options "$OPTIONS" || restore_rc=1
          restore_transaction_file mode "$MODE" || restore_rc=1
          restore_transaction_file subscription "$SUB" || restore_rc=1
          [ "$restore_rc" -eq 0 ]
        }
        finish_sub_persist() {
          rc=$?
          trap - EXIT
          if [ "$rc" -ne 0 ]; then
            set +e
            restore_sub_transaction || rc=1
          fi
          rm -f "$SUB.kano_new.$$" 2>/dev/null || true
          rm -rf "$TX" 2>/dev/null || true
          exit "$rc"
        }
        recover_stale_transactions kano_sub_persist restore_sub_transaction
        rm -rf "$TX" 2>/dev/null || true
        mkdir -p "$TX"
        trap finish_sub_persist EXIT
        snapshot_transaction_file subscription "$SUB"
        snapshot_transaction_file mode "$MODE"
        snapshot_transaction_file options "$OPTIONS"
        mkdir -p ${shellQuote(CLASH_PROXY_DIR)}
        ${subRuleModePersistSidecarsCmd(cleanMode)}
        SUB_NEW="$SUB.kano_new.$$"
        printf '%s' ${shellQuote(subUrlsText)} > "$SUB_NEW"
        chmod 600 "$SUB_NEW"
        mv -f "$SUB_NEW" "$SUB"
        first_line="$(sed -n '1p' "$SUB" 2>/dev/null | tr -d '\r')"
        [ "$first_line" = ${shellQuote(`# KANO_SUB_RULE_MODE=${cleanMode}`)} ] || {
          echo "KANO_ERROR_STAGE=subscription_commit"
          echo "KANO_ERROR_CODE=mode_header_mismatch"
          exit 1
        }
        touch "$TX/committed"
        echo SUB_SOURCES_COMMITTED
        trap - EXIT
        rm -rf "$TX" 2>/dev/null || true
        `, 20 * 1000);
    return !!(sourceRes.success && String(sourceRes.content || '').includes('SUB_SOURCES_COMMITTED'));
  };

  const setConfigSourceCmd = (source = 'unknown') => `
        (
          umask 077
          TARGET=${shellQuote(CLASH_CONFIG_SOURCE_FILE)}
          TMP="$TARGET.new.$$"
          trap 'rm -f "$TMP"' EXIT
          trap 'exit 1' HUP INT TERM
          mkdir -p ${shellQuote(CLASH_DIR + '/Tools')} || exit 1
          printf 'KANO_CONFIG_SOURCE=%s\nKANO_CONFIG_SOURCE_TIME=%s\n' ${shellQuote(String(source || 'unknown'))} "$(date +%Y-%m-%dT%H:%M:%S%z 2>/dev/null)" > "$TMP" || exit 1
          chmod 600 "$TMP" && mv -f "$TMP" "$TARGET" || exit 1
        ) || { echo CONFIG_SOURCE_WRITE_FAILED; exit 1; }
        `;

  const setSubRuleMode = async (mode = SUB_RULE_MODE_TEMPLATE) => {
    const cleanMode = normalizeSubRuleModeValue(mode);
    const current = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_SUB_URLS)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_SUB_URLS)}; fi
        `, 10 * 1000);
    if (!current.success) {
      createToast(`\u89c4\u5219\u6a21\u5f0f\u72b6\u6001\u8bfb\u53d6\u5931\u8d25<br>${safeTextToHtml(current.content || '')}`, 'red', 9000);
      return false;
    }
    const storedSources = parseStoredSubSourcesFromText(current.content || '');
    const convertMode = parseSubConvertModeFromText(current.content || '');
    const saved = await persistSubSourceState(storedSources, cleanMode, convertMode, { allowEmpty: true });
    if (!saved) {
      createToast('\u89c4\u5219\u6a21\u5f0f\u72b6\u6001\u5199\u5165\u5931\u8d25', 'red', 9000);
    }
    return saved;
  };



  const readSavedSubSourcesForTemplate = async () => {
    const res = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_SUB_URLS)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_SUB_URLS)}; fi
        `);
    return res.success ? normalizeSubSourceList(parseStoredSubSourcesFromText(res.content || '')) : [];
  };


  const readTemplateProviderSubSources = async (
    templateBasePath = CLASH_TEMPLATE_BASE,
    templatePath = CLASH_TEMPLATE,
    { includeSuspicious = false } = {},
  ) => {
    const res = await runShellWithRoot(`
        TEMPLATE_SOURCE=${shellQuote(templateBasePath)}
        [ -s "$TEMPLATE_SOURCE" ] || TEMPLATE_SOURCE=${shellQuote(templatePath)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        [ -s "$TEMPLATE_SOURCE" ] || exit 0
        if [ -x "$YQ" ]; then
          "$YQ" e -r '[(."proxy-providers" // {})[] | (.url // "")] | .[]' "$TEMPLATE_SOURCE" 2>/dev/null |
            grep -E '^https?://' || true
        fi
        `);
    const sources = res.success ? parseStoredSubSourcesFromText(res.content || '') : [];
    const suspiciousSources = sources.filter((source) => detectSuspiciousSubSources([source]));
    const cleanSources = sources.filter((source) => !detectSuspiciousSubSources([source]));
    return includeSuspicious ? { sources: cleanSources, suspiciousSources } : cleanSources;
  };

  const persistSubSourcesForTemplate = async (
    sources = [],
    mode = SUB_RULE_MODE_TEMPLATE,
    convertMode = SUB_CONVERT_MODE_PROVIDER,
  ) => {
    const storedSources = normalizeStoredSubSourceList(sources);
    if (storedSources.length == 0 || normalizeSubSourceList(storedSources).length == 0) return false;
    return await persistSubSourceState(storedSources, mode, convertMode);
  };

  const hasUserTemplateYaml = async () => {
    const res = await runShellWithRoot(`
        TEMPLATE=${shellQuote(CLASH_TEMPLATE)}
        TEMPLATE_BASE=${shellQuote(CLASH_TEMPLATE_BASE)}
        if [ -s "$TEMPLATE_BASE" ]; then
          echo 1
          exit 0
        fi
        if [ -s "$TEMPLATE" ] &&
          grep -qF 'kano_reject_domain' "$TEMPLATE" 2>/dev/null &&
          grep -qF './proxies/Provider1.yaml' "$TEMPLATE" 2>/dev/null &&
          grep -qF 'RULE-SET,kano_proxy_domain,Proxy' "$TEMPLATE" 2>/dev/null; then
          echo 0
          exit 0
        fi
        if [ -s "$TEMPLATE" ] && ! grep -qF '# F50 mihomo template - generated by Kano policy tools' "$TEMPLATE" 2>/dev/null; then
          echo 1
          exit 0
        fi
        echo 0
        `);
    return String(res.content || '').trim() == '1';
  };

  const ensureTemplateForF50 = async (
    sources = [],
    { forceDefault = false, showToast = false, templatePath = CLASH_TEMPLATE } = {},
  ) => {
    await loadProviderUserAgent();
    const cleanSources = normalizeSubSourceList(sources);
    const storage = await ensurePolicyStorage();
    if (!storage.ok) {
      createToast(`准备模板目录失败<br>${safeTextToHtml(storage.content || '')}`, 'red', 9000);
      return false;
    }

    const tproxyPort = await detectF50TproxyPort();
    const existsRes = await runShellWithRoot(`[ -s ${shellQuote(templatePath)} ] && echo 1 || echo 0`, 10 * 1000);
    if (!existsRes.success) {
      createToast('模板状态探测失败，已中止且未改写原模板。', 'red', 9000);
      return false;
    }
    const exists = String(existsRes.content || '').trim() == '1';
    let generated = !!forceDefault || !exists;
    let baseObject = null;

    if (generated) {
      const controllerInfo = await buildControllerInfo();
      baseObject = buildF50TemplateObject(cleanSources, {
        controller: controllerInfo.externalController,
        secret: controllerInfo.secretSet ? controllerInfo.secret : F50_DEFAULT_SECRET,
      });
    } else {
      const read = await readYamlObject(templatePath, 'template.yaml');
      if (!read.ok) {
        createToast(`模板自动处理失败<br>${safeTextToHtml(read.message || '')}`, 'red', 10000);
        return false;
      }
      baseObject = read.value;
      generated = await yamlHasGeneratedMarker(templatePath);
      if (generated === null) {
        createToast('template.yaml 生成标记读取失败，已中止且未改写原文件。', 'red', 9000);
        return false;
      }
    }

    let normalized;
    try {
      normalized = normalizeManagedTemplateObject(baseObject, cleanSources, {
        generated,
        emptyProviderUrls: true,
        tproxyPort,
      });
    } catch (e) {
      createToast(`模板结构不兼容，未改写原文件<br>${safeTextToHtml(e.message || e)}`, 'red', 10000);
      return false;
    }

    const write = await writeYamlObjectAtomic(templatePath, normalized.config, {
      label: 'template.yaml',
      marker: generated ? GENERATED_TEMPLATE_MARKER : '',
      backup: exists,
      backupTag: 'f50_template',
    });
    if (!write.ok) {
      createToast(`模板自动处理失败，原文件未被覆盖<br>${safeTextToHtml(write.content || '')}`, 'red', 10000);
      return false;
    }

    if (showToast) {
      createToast(
        `模板已处理为 F50 可用格式，节点来源 ${normalized.providerNames.length} 个`,
        'green',
        7000,
      );
    }
    return true;
  };

  const RULE_OVERRIDE_TYPES = new Set([
    'DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'DOMAIN-REGEX',
    'GEOSITE', 'GEOIP', 'IP-CIDR', 'IP-CIDR6', 'SRC-IP-CIDR',
    'DST-PORT', 'SRC-PORT', 'RULE-SET', 'PROCESS-NAME', 'PROCESS-PATH',
  ]);

  const defaultRuleOverrideConfig = () => ({
    enabled: true,
    rules: [],
  });

  const normalizeRuleOverrideRule = (rule = {}) => {
    if (!rule || typeof rule != 'object' || Array.isArray(rule)) return null;
    const type = String(rule.type || 'DOMAIN-SUFFIX').trim().toUpperCase();
    const content = String(rule.content || '').trim();
    const policy = String(rule.policy || 'DIRECT').trim();
    const position = String(rule.position || 'prepend').trim() == 'append' ? 'append' : 'prepend';
    const noResolve = !!rule.noResolve;
    if (!RULE_OVERRIDE_TYPES.has(type) || !content || !policy) return null;
    return { type, content, policy, position, noResolve };
  };

  const normalizeRuleOverrideConfig = (config = {}) => {
    const source = config && typeof config == 'object' && !Array.isArray(config)
      ? config
      : defaultRuleOverrideConfig();
    const rules = Array.isArray(source.rules)
      ? source.rules.map(normalizeRuleOverrideRule).filter(Boolean)
      : [];
    return {
      enabled: source.enabled !== false,
      rules,
    };
  };

  const hasActiveRuleOverride = (config = {}) => {
    const normalized = normalizeRuleOverrideConfig(config);
    return !!(normalized.enabled && normalized.rules.length > 0);
  };

  const formatRuleOverrideRule = (rule = {}) => {
    const normalized = normalizeRuleOverrideRule(rule);
    if (!normalized) return '';
    const parts = [normalized.type, normalized.content, normalized.policy];
    if (normalized.noResolve) parts.push('no-resolve');
    return parts.join(',');
  };

  const collectRuleOverrideTexts = (...configs) => {
    const texts = [];
    configs.forEach((cfg) => {
      const normalized = normalizeRuleOverrideConfig(cfg || {});
      normalized.rules.forEach((rule) => {
        const text = formatRuleOverrideRule(rule);
        if (text) texts.push(text);
      });
    });
    return [...new Set(texts)];
  };

  const applyUiRuleOverridesToConfig = (config = {}, overrideConfig = {}, cleanupConfig = null) => {
    const normalized = normalizeRuleOverrideConfig(overrideConfig);
    const out = JSON.parse(JSON.stringify(config || {}));
    const currentRules = Array.isArray(out.rules) ? out.rules.slice() : [];
    const prependRules = [];
    const appendRules = [];
    normalized.rules.forEach((rule) => {
      const text = formatRuleOverrideRule(rule);
      if (!text) return;
      if (rule.position == 'append') appendRules.push(text);
      else prependRules.push(text);
    });
    const cleanupSet = new Set(collectRuleOverrideTexts(normalized, cleanupConfig));
    const middleRules = currentRules.filter((rule) => !cleanupSet.has(String(rule || '').trim()));
    out.rules = hasActiveRuleOverride(normalized)
      ? [...prependRules, ...middleRules, ...appendRules]
      : middleRules;
    return out;
  };


  const yamlScalar = (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value == 'number' || typeof value == 'boolean') return String(value);
    return JSON.stringify(String(value));
  };

  const yamlKey = (key = '') => {
    const text = String(key);
    const reserved = /^(?:null|~|true|false|yes|no|on|off|nan|inf|-inf)$/i.test(text);
    const numericLike = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text);
    const dateLike = /^\d{4}-\d{1,2}-\d{1,2}(?:[Tt ].*)?$/.test(text);
    return /^[A-Za-z_][A-Za-z0-9_.-]*$/.test(text) && !reserved && !numericLike && !dateLike
      ? text
      : JSON.stringify(text);
  };

  const isPlainYamlObject = (value) =>
    !!value && typeof value == 'object' && !Array.isArray(value);

  const dumpYamlValue = (value, indent = 0) => {
    const pad = ' '.repeat(indent);
    if (Array.isArray(value)) {
      if (value.length == 0) return '[]';
      return value.map((item) => {
        if (Array.isArray(item) || isPlainYamlObject(item)) {
          const renderedLines = dumpYamlValue(item, indent + 2).split('\n');
          const firstLine = (renderedLines.shift() || '').trimStart();
          return `${pad}- ${firstLine}${renderedLines.length ? `\n${renderedLines.join('\n')}` : ''}`;
        }
        return `${pad}- ${yamlScalar(item)}`;
      }).join('\n');
    }
    if (isPlainYamlObject(value)) {
      const entries = Object.entries(value);
      if (entries.length == 0) return '{}';
      return entries.map(([key, item]) => {
        if (Array.isArray(item)) {
          return `${pad}${yamlKey(key)}:${item.length ? `\n${dumpYamlValue(item, indent + 2)}` : ' []'}`;
        }
        if (isPlainYamlObject(item)) {
          return `${pad}${yamlKey(key)}:${Object.keys(item).length ? `\n${dumpYamlValue(item, indent + 2)}` : ' {}'}`;
        }
        return `${pad}${yamlKey(key)}: ${yamlScalar(item)}`;
      }).join('\n');
    }
    return yamlScalar(value);
  };

  const dumpConfigYaml = (config = {}) => `${dumpYamlValue(config, 0)}\n`;

  // ===== Compatibility-first YAML JSON bridge =====
  // yq is used only as a read-only YAML parser/validator. All mutations happen
  // on plain JavaScript objects, then a complete YAML document is staged,
  // validated and atomically committed beside the target file.
  const YAML_BRIDGE_VERSION = '1';
  const YAML_BRIDGE_MAX_BYTES = 8 * 1024 * 1024;
  const GENERATED_TEMPLATE_MARKER = '# F50 mihomo template - generated by Kano policy tools';

  const cloneJsonValue = (value) => JSON.parse(JSON.stringify(value));

  const assertYamlRootMap = (value, label = 'YAML') => {
    if (!isPlainYamlObject(value)) {
      throw new Error(`${label} 顶层必须是映射对象`);
    }
    return value;
  };

  

  const getPositivePort = (value, fallback = 7895) => {
    const port = Number(value);
    return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : fallback;
  };

  const utf8ByteLength = (text = '') => {
    const value = String(text || '');
    if (typeof TextEncoder != 'undefined') return new TextEncoder().encode(value).length;
    try {
      return unescape(encodeURIComponent(value)).length;
    } catch (_) {
      return value.length;
    }
  };

  let yqRuntimeReadyUntil = 0;
  let yqRuntimeEnsurePromise = null;

  // yq is an advanced-feature dependency, not a prerequisite for installing/starting Mihomo.
  // On a clean UFI environment, repair it lazily only when a YAML-backed feature is actually used.
  const ensureYqRuntime = async ({quiet=false}={}) => {
 if (!(await ensureCompatBackend())) return false;
 const r=await runShellWithRoot('test -x /data/clash/Tools/yq_linux_arm64 && /data/clash/Tools/yq_linux_arm64 --version',5000);
 const ok=!!r.success && /version\s+v?4\./i.test(r.content||'');
 if(!ok&&!quiet)createToast('YAML 组件不可用，请重新安装本版组件包','red');return ok;
};

  const readYamlObject = async (yamlPath, label = 'YAML', { allowDownload = true } = {}) => {
    if (!(await ensureYqRuntime({ quiet: true, allowDownload }))) {
      return { ok: false, value: null, message: `${label} \u9700\u8981 yq v4\uff0c\u8bf7\u5148\u4fee\u590d YAML \u7ec4\u4ef6`, shell: null };
    }
    const res = await runShellWithRoot(`
        set -e
        FILE=${shellQuote(yamlPath)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        [ -s "$FILE" ] || { echo "YAML_FILE_MISSING: $FILE"; exit 1; }
        [ -x "$YQ" ] || { echo "YQ_MISSING: $YQ"; exit 1; }
        version="$(timeout -k 1 3 "$YQ" --version 2>&1)"
        echo "$version" | grep -Eiq 'version[[:space:]]+v?4\\.' || {
          echo "YQ_VERSION_UNSUPPORTED: $version"
          exit 1
        }
        size="$(wc -c < "$FILE" 2>/dev/null || echo 0)"
        echo "$size" | grep -Eq '^[0-9]+$' || size=0
        [ "$size" -le ${YAML_BRIDGE_MAX_BYTES} ] || {
          echo "YAML_FILE_TOO_LARGE: bytes=$size limit=${YAML_BRIDGE_MAX_BYTES}"
          exit 1
        }
        timeout -k 1 15 "$YQ" e -o=json '.' "$FILE"
        `, 20 * 1000);
    if (!res.success) {
      return {
        ok: false,
        value: null,
        message: `${label} 读取或解析失败\n${res.content || ''}`.trim(),
        shell: res,
      };
    }
    try {
      const value = JSON.parse(String(res.content || '').trim());
      assertYamlRootMap(value, label);
      return { ok: true, value, message: '', shell: res };
    } catch (e) {
      return {
        ok: false,
        value: null,
        message: `${label} 转换为单个 JSON 映射失败：${e.message || e}`,
        shell: res,
      };
    }
  };

  const yamlHasGeneratedMarker = async (yamlPath) => {
    const res = await runShellWithRoot(`
        [ -s ${shellQuote(yamlPath)} ] && grep -qF ${shellQuote(GENERATED_TEMPLATE_MARKER)} ${shellQuote(yamlPath)} && echo 1 || echo 0
        `, 10 * 1000);
    if (!res || !res.success) return null;
    return String(res.content || '').trim() == '1';
  };

  const stageTextBesideTarget = async (targetPath, text, label = 'YAML') => {
    const value = String(text || '');
    const expectedBytes = utf8ByteLength(value);
    if (expectedBytes <= 0) {
      return { ok: false, stagePath: '', message: `${label} 输出为空，已拒绝写入` };
    }
    if (expectedBytes > YAML_BRIDGE_MAX_BYTES) {
      return {
        ok: false,
        stagePath: '',
        message: `${label} 输出过大：${expectedBytes} bytes，限制 ${YAML_BRIDGE_MAX_BYTES} bytes`,
      };
    }
    const token = `${Date.now()}_${createRandomString(8)}`;
    const stagePath = `${targetPath}.kano_stage_${token}`;
    let uploadedPath = '';
    try {
      uploadedPath = await uploadFileToDevice(
        new File([value], `kano_yaml_stage_${token}.yaml`, { type: 'text/yaml' }),
      );
    } catch (e) {
      return {
        ok: false,
        stagePath: '',
        message: `${label} 上传暂存失败：${e && e.message ? e.message : e}`,
      };
    }

    const stageRes = await runShellWithRootRetry(`
        set -e
        TARGET=${shellQuote(targetPath)}
        STAGE=${shellQuote(stagePath)}
        UPLOADED=${shellQuote(uploadedPath)}
        DIR="${stagePath.replace(/\/[^/]*$/, '')}"
        expected=${expectedBytes}
        cleanup_yaml_upload() {
          rc=$?
          rm -f "$UPLOADED" 2>/dev/null || true
          if [ "$rc" -ne 0 ]; then rm -f "$STAGE" 2>/dev/null || true; fi
          trap - EXIT
          exit "$rc"
        }
        trap cleanup_yaml_upload EXIT
        [ -d "$DIR" ] || { echo "YAML_STAGE_DIR_MISSING: $DIR"; exit 1; }
        [ ! -L "$TARGET" ] || { echo "YAML_TARGET_SYMLINK_REJECTED: $TARGET"; exit 1; }
        if [ -s "$STAGE" ]; then
          staged_size="$(wc -c < "$STAGE" 2>/dev/null || echo 0)"
          if [ "$staged_size" = "$expected" ]; then
            echo "YAML_STAGE_BYTES=$staged_size"
            exit 0
          fi
          rm -f "$STAGE"
        fi
        [ -s "$UPLOADED" ] || { echo "YAML_UPLOAD_MISSING: $UPLOADED"; exit 1; }
        uploaded_size="$(wc -c < "$UPLOADED" 2>/dev/null || echo 0)"
        [ "$uploaded_size" = "$expected" ] || {
          echo "YAML_UPLOAD_SIZE_MISMATCH: expected=$expected actual=$uploaded_size"
          exit 1
        }
        umask 077
        mv -f "$UPLOADED" "$STAGE" || { echo "YAML_STAGE_MOVE_FAILED: $STAGE"; exit 1; }
        staged_size="$(wc -c < "$STAGE" 2>/dev/null || echo 0)"
        [ "$staged_size" = "$expected" ] || {
          echo "YAML_STAGE_SIZE_MISMATCH: expected=$expected actual=$staged_size"
          exit 1
        }
        echo "YAML_STAGE_BYTES=$staged_size"
        `, 20 * 1000, 3);
    if (!stageRes.success) {
      return { ok: false, stagePath: '', message: stageRes.content || `${label} 上传暂存提交失败` };
    }
    return { ok: true, stagePath, message: stageRes.content || '' };
  };

  const commitStagedYaml = async ({
    targetPath,
    stagePath,
    label = 'YAML',
    backup = true,
    backupTag = 'yaml_bridge',
  }) => {
    const safeTag = String(backupTag || 'yaml_bridge').replace(/[^A-Za-z0-9_.-]+/g, '_');
    const res = await runShellWithRoot(`
        set -e
        TARGET=${shellQuote(targetPath)}
        STAGE=${shellQuote(stagePath)}
        LABEL=${shellQuote(label)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        PARSE_OUT="$STAGE.kano_parse.$$"
        ${prepareYqRuntimeCmd()}
        cleanup_yaml_bridge() {
          rc=$?
          rm -f "$PARSE_OUT" 2>/dev/null || true
          if [ "$rc" -ne 0 ]; then rm -f "$STAGE" 2>/dev/null || true; fi
          trap - EXIT
          exit "$rc"
        }
        trap cleanup_yaml_bridge EXIT
        [ -s "$STAGE" ] || { echo "YAML_STAGE_MISSING: $STAGE"; exit 1; }
        [ ! -L "$TARGET" ] || { echo "YAML_TARGET_SYMLINK_REJECTED: $TARGET"; exit 1; }
        [ -x "$YQ" ] || { echo "YQ_MISSING: $YQ"; exit 1; }
        version="$(timeout -k 1 3 "$YQ" --version 2>&1)"
        echo "$version" | grep -Eiq 'version[[:space:]]+v?4\\.' || {
          echo "YQ_VERSION_UNSUPPORTED: $version"
          exit 1
        }
        "$YQ" e '.' "$STAGE" >/dev/null 2>"$PARSE_OUT" || {
          echo "YAML_STAGE_PARSE_FAILED: $LABEL"
          cat "$PARSE_OUT" 2>/dev/null || true
          exit 1
        }
        hash_file() {
          file="$1"
          if command -v sha256sum >/dev/null 2>&1; then sha256sum "$file" 2>/dev/null | awk '{print $1}'
          elif command -v md5sum >/dev/null 2>&1; then md5sum "$file" 2>/dev/null | awk '{print $1}'
          else cksum "$file" 2>/dev/null | awk '{print $1 ":" $2}'
          fi
        }
        old_hash="$(hash_file "$TARGET")"
        old_size="$(wc -c < "$TARGET" 2>/dev/null || echo 0)"
        stage_hash="$(hash_file "$STAGE")"
        stage_size="$(wc -c < "$STAGE" 2>/dev/null || echo 0)"
        if [ -f "$TARGET" ] && cmp -s "$TARGET" "$STAGE" 2>/dev/null; then
          rm -f "$STAGE"
          echo "YAML_COMMIT_UNCHANGED=1"
          echo "YAML_OLD_HASH=$old_hash"
          echo "YAML_NEW_HASH=$old_hash"
          echo "YAML_OLD_SIZE=$old_size"
          echo "YAML_NEW_SIZE=$old_size"
          exit 0
        fi
        stamp="$(date +%Y%m%d%H%M%S 2>/dev/null)"
        [ -n "$stamp" ] || stamp="$(cat /proc/uptime 2>/dev/null | cut -d. -f1)"
        backup_path=""
        if [ ${backup ? '1' : '0'} = '1' ] && [ -f "$TARGET" ]; then
          backup_path="$TARGET.before_${safeTag}_$stamp"
          cp "$TARGET" "$backup_path" || {
            echo "YAML_BACKUP_FAILED: $backup_path"
            exit 1
          }
        fi
        chmod 600 "$STAGE" || exit 1
        mv -f "$STAGE" "$TARGET" || {
          echo "YAML_COMMIT_FAILED: $TARGET"
          exit 1
        }
        new_hash="$(hash_file "$TARGET")"
        new_size="$(wc -c < "$TARGET" 2>/dev/null || echo 0)"
        [ -z "$stage_hash" ] || [ "$stage_hash" = "$new_hash" ] || {
          echo "YAML_COMMIT_CHECKSUM_MISMATCH: stage=$stage_hash target=$new_hash"
          [ -n "$backup_path" ] && cp "$backup_path" "$TARGET" 2>/dev/null || true
          exit 1
        }
        ${pruneKanoBackupsCmd()}
        echo "YAML_COMMIT_OK=1"
        echo "YAML_BACKUP=$backup_path"
        echo "YAML_OLD_HASH=$old_hash"
        echo "YAML_NEW_HASH=$new_hash"
        echo "YAML_OLD_SIZE=$old_size"
        echo "YAML_NEW_SIZE=$new_size"
        echo "YAML_STAGE_SIZE=$stage_size"
        `, 45 * 1000);
    if (res.success) invalidateStatusSnapshot();
    const content = String(res.content || '');
    return {
      ok: !!res.success && (/YAML_COMMIT_OK=1/.test(content) || /YAML_COMMIT_UNCHANGED=1/.test(content)),
      unchanged: /YAML_COMMIT_UNCHANGED=1/.test(content),
      backupPath: ((content.split('\n').find((line) => line.startsWith('YAML_BACKUP=')) || '').replace(/^YAML_BACKUP=/, '').trim()),
      oldHash: ((content.split('\n').find((line) => line.startsWith('YAML_OLD_HASH=')) || '').replace(/^YAML_OLD_HASH=/, '').trim()),
      newHash: ((content.split('\n').find((line) => line.startsWith('YAML_NEW_HASH=')) || '').replace(/^YAML_NEW_HASH=/, '').trim()),
      content,
      shell: res,
    };
  };

  const kprBaseWriteYamlObjectAtomic = async (yamlPath, objectValue, {
    label = 'YAML',
    marker = '',
    backup = true,
    backupTag = 'yaml_bridge',
  } = {}) => {
    try {
      assertYamlRootMap(objectValue, label);
    } catch (e) {
      return { ok: false, content: e.message || String(e), shell: null };
    }
    const yamlBody = dumpConfigYaml(objectValue);
    const text = marker ? `${marker}\n${yamlBody}` : yamlBody;
    const staged = await stageTextBesideTarget(yamlPath, text, label);
    if (!staged.ok) return { ok: false, content: staged.message || '', shell: null };
    return commitStagedYaml({
      targetPath: yamlPath,
      stagePath: staged.stagePath,
      label,
      backup,
      backupTag,
    });
  };

  const ensurePolicyStorage = async () => {
    const res = await runShellWithRoot(`
        set -e
        mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)} ${shellQuote(`${CLASH_PROXY_DIR}/proxies`)} ${shellQuote(CLASH_POLICY_DIR)} ${shellQuote(CLASH_SAFE_POLICY_DIR)}
        for POLICY_FILE in ${shellQuote(CLASH_REJECT_DOMAIN_FILE)} ${shellQuote(CLASH_DIRECT_DOMAIN_FILE)} ${shellQuote(CLASH_DIRECT_IP_FILE)} ${shellQuote(CLASH_PROXY_DOMAIN_FILE)}; do
          [ -f "$POLICY_FILE" ] || printf '# empty\\n' > "$POLICY_FILE"
          chmod 600 "$POLICY_FILE" 2>/dev/null || true
        done
        ${syncSafePolicyFilesCmd()}
        echo "POLICY_STORAGE_READY"
        `, 20 * 1000);
    return { ok: !!res.success, content: res.content || '', shell: res };
  };

  const detectF50TproxyPort = async () => 7895;

  const buildManagedProxyProviders = (
    sources = [],
    { emptyUrls = false, ensureOne = false, localFiles = false } = {},
  ) => {
    let cleanSources = normalizeSubSourceList(sources);
    // A template without configured sources is an empty mapping, never a live URL placeholder.
    const providers = {};
    cleanSources.forEach((source) => {
      const provider = {
        type: localFiles || emptyUrls ? 'file' : 'http',
        path: `./proxies/${source.name}.yaml`,
        'health-check': {
          enable: true,
          url: 'https://www.gstatic.com/generate_204',
          interval: 900,
        },
      };
      if (!localFiles && !emptyUrls) {
        provider.url = source.url;
        provider.interval = 86400;
        provider.header = {
          'User-Agent': [currentProviderUserAgent],
        };
      }
      providers[source.name] = provider;
    });
    return providers;
  };

  const buildManagedRuleProviders = () => ({
    kano_reject_domain: {
      type: 'file',
      behavior: 'classical',
      path: CLASH_SAFE_REJECT_DOMAIN_FILE,
      format: 'text',
    },
    kano_direct_domain: {
      type: 'file',
      behavior: 'classical',
      path: CLASH_SAFE_DIRECT_DOMAIN_FILE,
      format: 'text',
    },
    kano_direct_ip: {
      type: 'file',
      behavior: 'classical',
      path: CLASH_SAFE_DIRECT_IP_FILE,
      format: 'text',
    },
    kano_proxy_domain: {
      type: 'file',
      behavior: 'classical',
      path: CLASH_SAFE_PROXY_DOMAIN_FILE,
      format: 'text',
    },
  });

  const buildManagedFallbackRules = (proxyGroup = 'Proxy') => [
    'RULE-SET,kano_reject_domain,REJECT',
    'RULE-SET,kano_direct_domain,DIRECT',
    'RULE-SET,kano_direct_ip,DIRECT',
    `RULE-SET,kano_proxy_domain,${proxyGroup}`,
    'GEOSITE,private,DIRECT',
    'GEOSITE,cn,DIRECT',
    'GEOIP,cn,DIRECT,no-resolve',
    'GEOSITE,apple@cn,DIRECT',
    'GEOSITE,microsoft@cn,DIRECT',
    'GEOSITE,steam@cn,DIRECT',
    `GEOSITE,geolocation-!cn,${proxyGroup}`,
    `MATCH,${proxyGroup}`,
  ];

  const applyManagedDashboardFields = (config) => {
    assertYamlRootMap(config, '配置');
    const externalUi = String(config['external-ui'] || '').trim().replace(/\\/g, '/');
    const externalUiName = String(config['external-ui-name'] || '').trim().toLowerCase();
    const externalUiUrl = String(config['external-ui-url'] || '').trim();
    const normalizedUi = externalUi.replace(/^\.\//, '').replace(/\/+$/, '').toLowerCase();
    const managedUiPaths = new Set([
      '',
      'ui',
      'ui/zashboard',
      'webui',
      'webui/zashboard',
      '/data/clash/proxy/webui/zashboard',
    ]);
    if (!managedUiPaths.has(normalizedUi)) return false;

    const changed = externalUi != ZASHBOARD_UI_DIR
      || Object.prototype.hasOwnProperty.call(config, 'external-ui-name')
      || externalUiUrl != ZASHBOARD_UI_URL
      || config['unified-delay'] !== true;
    config['external-ui'] = ZASHBOARD_UI_DIR;
    config['external-ui-url'] = ZASHBOARD_UI_URL;
    config['unified-delay'] = true;
    delete config['external-ui-name'];
    return changed;
  };

  const applyRequiredF50Fields = (config, {
    managedDashboard = false,
    preservedSecret = '',
  } = {}) => {
    assertYamlRootMap(config, '配置');
    if (typeof config['external-controller'] != 'string' || !config['external-controller'].trim()) {
      config['external-controller'] = '0.0.0.0:7788';
    }
    if (managedDashboard) {
      applyManagedDashboardFields(config);
    }
    if (typeof config.secret != 'string' || !config.secret.trim()) config.secret = preservedSecret || F50_DEFAULT_SECRET;
    if (!Object.prototype.hasOwnProperty.call(config, 'proxies')) config.proxies = [];
    return config;
  };

  const applyOverrideSafetyFields = (config, preservedSecret = '') => {
    return applyRequiredF50Fields(config, { preservedSecret });
  };

  const normalizeManagedProxyGroups = (config, providerNames = []) => {
    if (Object.prototype.hasOwnProperty.call(config, 'proxy-groups') && !Array.isArray(config['proxy-groups'])) {
      throw new Error('proxy-groups 必须是数组');
    }
    let groups = Array.isArray(config['proxy-groups']) ? cloneJsonValue(config['proxy-groups']) : [];
    let createdFallback = false;
    if (groups.length == 0) {
      createdFallback = true;
      groups = [
        {
          name: 'Proxy',
          type: 'select',
          proxies: ['Auto', 'DIRECT'],
          use: providerNames.slice(),
        },
        {
          name: 'Auto',
          type: 'url-test',
          url: 'https://www.gstatic.com/generate_204',
          interval: 900,
          tolerance: 80,
          use: providerNames.slice(),
        },
      ];
    }
    const names = new Set();
    groups.forEach((group, index) => {
      if (!isPlainYamlObject(group)) throw new Error(`proxy-groups[${index}] 必须是映射对象`);
      const name = String(group.name || '').trim();
      if (!name) throw new Error(`proxy-groups[${index}] 缺少非空 name`);
      if (names.has(name)) throw new Error(`proxy-groups 存在重复组名：${name}`);
      names.add(name);
      group.name = name;
      if (
        Object.prototype.hasOwnProperty.call(group, 'use') ||
        group['include-all'] === true ||
        Object.prototype.hasOwnProperty.call(group, 'filter')
      ) {
        group.use = providerNames.slice();
      }
    });
    if (createdFallback) {
      const proxy = groups.find((group) => group.name == 'Proxy');
      if (proxy) {
        proxy.use = providerNames.slice();
        proxy.proxies = [...new Set([...(Array.isArray(proxy.proxies) ? proxy.proxies : []), 'Auto', 'DIRECT'])];
      }
      const auto = groups.find((group) => group.name == 'Auto');
      if (auto) {
        auto.use = providerNames.slice();
        auto.url = 'https://www.gstatic.com/generate_204';
        auto.interval = 900;
      }
    }
    config['proxy-groups'] = groups;
    return { groups, proxyGroup: groups[0] ? groups[0].name : 'Proxy', createdFallback };
  };

  const MANAGED_RULE_SET_PATTERN = /^RULE-SET\s*,\s*kano_(reject_domain|direct_domain|direct_ip|proxy_domain)\s*,/;
  const UNSUPPORTED_CATEGORY_GEOIP_RULE = /^GEOIP\s*,\s*(private|netflix|telegram|google)\s*,/i;

  const removeUnsupportedCategoryGeoipRules = (rules = []) =>
    rules.filter((rule) => !UNSUPPORTED_CATEGORY_GEOIP_RULE.test(String(rule).trim()));

  const removeLegacyManagedRulePrefix = (rules = [], proxyGroup = 'Proxy') => {
    let output = removeUnsupportedCategoryGeoipRules(rules);
    const expected = buildManagedFallbackRules(proxyGroup);
    const legacyProxy = buildManagedFallbackRules('Proxy');
    const prefixMatches = output.length >= expected.length && output.slice(0, expected.length).every((rule, index) => {
      return rule === expected[index] || rule === legacyProxy[index];
    });
    if (prefixMatches) {
      output = output.slice(expected.length);
      if (output[0] === `MATCH,${proxyGroup}` || output[0] === 'MATCH,Proxy') output = output.slice(1);
    }
    return output.filter((rule) => !MANAGED_RULE_SET_PATTERN.test(String(rule).trim()));
  };

  const applyManagedRules = (config, { generated = false, proxyGroup = 'Proxy' } = {}) => {
    if (Object.prototype.hasOwnProperty.call(config, 'rules') && !Array.isArray(config.rules)) {
      throw new Error('rules 必须是数组');
    }
    const rules = Array.isArray(config.rules) ? config.rules.slice() : [];
    if (rules.length == 0 || generated) {
      if (Object.prototype.hasOwnProperty.call(config, 'rule-providers') && !isPlainYamlObject(config['rule-providers'])) {
        throw new Error('rule-providers 必须是映射对象');
      }
      config['rule-providers'] = {
        ...(isPlainYamlObject(config['rule-providers']) ? config['rule-providers'] : {}),
        ...buildManagedRuleProviders(),
      };
      config.rules = buildManagedFallbackRules(proxyGroup);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(config, 'rule-providers')) {
      if (!isPlainYamlObject(config['rule-providers'])) throw new Error('rule-providers 必须是映射对象');
      const providers = { ...config['rule-providers'] };
      delete providers.kano_reject_domain;
      delete providers.kano_direct_domain;
      delete providers.kano_direct_ip;
      delete providers.kano_proxy_domain;
      if (Object.keys(providers).length > 0) config['rule-providers'] = providers;
      else delete config['rule-providers'];
    }
    const cleaned = removeLegacyManagedRulePrefix(rules, proxyGroup);
    if (cleaned.length == 0) {
      config['rule-providers'] = {
        ...(isPlainYamlObject(config['rule-providers']) ? config['rule-providers'] : {}),
        ...buildManagedRuleProviders(),
      };
      config.rules = buildManagedFallbackRules(proxyGroup);
      return;
    }
    config.rules = cleaned;
  };

  const validateManagedConfigObject = (config, {
    expectedProviderCount = null,
    requireProviderUrls = false,
  } = {}) => {
    assertYamlRootMap(config, '配置');
    if (!isPlainYamlObject(config['proxy-providers'])) throw new Error('proxy-providers 必须是映射对象');
    const providerEntries = Object.entries(config['proxy-providers']);
    if (expectedProviderCount != null && providerEntries.length != expectedProviderCount) {
      throw new Error(`proxy-providers 数量不匹配：expected=${expectedProviderCount} actual=${providerEntries.length}`);
    }
    providerEntries.forEach(([name, provider]) => {
      if (!name.trim() || !isPlainYamlObject(provider)) throw new Error(`proxy-provider ${name || '<empty>'} 格式无效`);
      if (provider.type == 'http' && requireProviderUrls && !isHttpUrl(provider.url || '')) {
        throw new Error(`proxy-provider ${name} 缺少有效 http/https URL`);
      }
      if (provider.type == 'file' && !String(provider.path || '').trim()) {
        throw new Error(`proxy-provider ${name} 缺少本地 path`);
      }
      if (!['http', 'file'].includes(provider.type)) {
        throw new Error(`proxy-provider ${name} 类型不支持：${provider.type || '<empty>'}`);
      }
    });
    if (!Array.isArray(config['proxy-groups'])) throw new Error('proxy-groups 必须是数组');
    const names = new Set();
    config['proxy-groups'].forEach((group, index) => {
      if (!isPlainYamlObject(group)) throw new Error(`proxy-groups[${index}] 必须是映射对象`);
      const name = String(group.name || '').trim();
      if (!name) throw new Error(`proxy-groups[${index}] 缺少 name`);
      if (names.has(name)) throw new Error(`proxy-groups 存在重复组名：${name}`);
      names.add(name);
    });
    if (!Array.isArray(config.rules)) throw new Error('rules 必须是数组');
    if (config.rules.length == 0) throw new Error('rules 为空，拒绝生成无规则配置');
    if (!Array.isArray(config.proxies)) throw new Error('proxies 必须是数组');
    if (Object.prototype.hasOwnProperty.call(config, 'rule-providers') && !isPlainYamlObject(config['rule-providers'])) {
      throw new Error('rule-providers 必须是映射对象');
    }
    return true;
  };

  const normalizeManagedTemplateObject = (rawConfig, sources = [], {
    generated = false,
    emptyProviderUrls = true,
    localProviderFiles = false,
  } = {}) => {
    const config = cloneJsonValue(assertYamlRootMap(rawConfig, 'template.yaml'));
    const providerNames = providerNamesForTemplate(sources);
    applyRequiredF50Fields(config, { managedDashboard: generated });
    delete config['Proxy-Providers'];
    delete config['proxy-Providers'];
    delete config['Proxy-providers'];
    config['proxy-providers'] = buildManagedProxyProviders(sources, {
      emptyUrls: emptyProviderUrls,
      ensureOne: emptyProviderUrls,
      localFiles: localProviderFiles,
    });
    const groupResult = normalizeManagedProxyGroups(config, providerNames);
    applyManagedRules(config, { generated, proxyGroup: groupResult.proxyGroup });
    validateManagedConfigObject(config, {
      expectedProviderCount: providerNames.length,
      requireProviderUrls: !emptyProviderUrls,
    });
    return {
      config,
      providerNames,
      proxyGroup: groupResult.proxyGroup,
      rulesCount: config.rules.length,
      groupCount: config['proxy-groups'].length,
    };
  };

  const buildF50TemplateObject = (sources = [], controllerSettings = {}) => ({
    port: 7890,
    'socks-port': 7891,
    'mixed-port': 7892,
    'redir-port': 7893,
    'tproxy-port': 7895,
    'allow-lan': true,
    'bind-address': '*',
    mode: 'rule',
    'log-level': 'info',
    ipv6: false,
    'external-controller': String(controllerSettings.controller || '0.0.0.0:7788'),
    'external-ui': ZASHBOARD_UI_DIR,
    'external-ui-url': ZASHBOARD_UI_URL,
    'unified-delay': true,
    secret: String(controllerSettings.secret || F50_DEFAULT_SECRET),
    profile: {
      'store-selected': true,
      'store-fake-ip': false,
    },
    dns: {
      enable: true,
      listen: '0.0.0.0:1053',
      ipv6: false,
      'enhanced-mode': 'redir-host',
      'default-nameserver': ['223.5.5.5', '119.29.29.29'],
      nameserver: ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'],
    },
    'proxy-providers': buildManagedProxyProviders(sources, { emptyUrls: true, ensureOne: true }),
    'proxy-groups': [],
    'rule-providers': {},
    rules: [],
    proxies: [],
  });


  const readRuleOverrideConfig = async () => {
    const res = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_RULE_OVERRIDE_JSON)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_RULE_OVERRIDE_JSON)}; fi
        `);
    const text = res.success ? String(res.content || '').trim() : '';
    if (!text) return defaultRuleOverrideConfig();
    try {
      return normalizeRuleOverrideConfig(JSON.parse(text));
    } catch (e) {
      console.error(e);
      return defaultRuleOverrideConfig();
    }
  };

  const saveRuleOverrideConfig = async (config = {}) => {
    const normalized = normalizeRuleOverrideConfig(config);
    const text = JSON.stringify(normalized, null, 2) + '\n';
    const res = await runShellWithRoot(`
        set -e
        mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)}
        TARGET=${shellQuote(CLASH_RULE_OVERRIDE_JSON)}
        TMP="$TARGET.kano_new.$$"
        trap 'rm -f "$TMP" 2>/dev/null || true' EXIT
        printf '%s' ${shellQuote(text)} > "$TMP"
        chmod 600 "$TMP"
        mv -f "$TMP" "$TARGET"
        trap - EXIT
        `);
    if (!res.success) {
      createToast(`保存图形规则失败<br>${safeTextToHtml(res.content || '')}`, 'red', 8000);
    }
    return !!res.success;
  };


  const validateOriginalSubscriptionConfig = (config) => {
    if (!Array.isArray(config.rules) || config.rules.length == 0
      || !Array.isArray(config['proxy-groups']) || config['proxy-groups'].length == 0
      || (!(Array.isArray(config.proxies) && config.proxies.length > 0)
        && Object.keys(config['proxy-providers'] || {}).length == 0)) {
      throw new Error('订阅需返回带规则、策略组和节点来源的完整 Mihomo YAML/JSON；仅节点订阅请使用模板模式');
    }
    return true;
  };

  const writeOriginalSubscriptionConfig = async (sources, { backup = true } = {}) => {
    let cleanSources;
    try { cleanSources = validateSubscriptionMode(sources, SUB_RULE_MODE_ORIGINAL).enabled; }
    catch (error) { createToast(safeTextToHtml(error.message), 'red', 9000); return false; }
    if (cleanSources.length != 1) {
      createToast('使用订阅原配置时，只能启用一个完整配置订阅', 'red', 8000);
      return false;
    }
    const stagePath = `${CLASH_CONFIG}.kano_original_${Date.now()}_${createRandomString(6)}`;
    try {
      if (!(await ensureYqRuntime({ quiet: true }))) throw new Error('YAML \u89e3\u6790\u7ec4\u4ef6\u4e0d\u53ef\u7528');
      const fetched = await convertSubscriptionsLocally(cleanSources, { rawConfigPath: stagePath });
      if (!fetched.ok) throw new Error(fetched.message || '原配置下载失败，未修改运行配置');
      const read = await readYamlObject(stagePath, '订阅原配置');
      if (!read.ok) throw new Error('订阅不是有效的 YAML/JSON 完整配置，请检查返回格式');
      validateOriginalSubscriptionConfig(read.value);
      const info = await buildControllerInfo();
      const adapted = applyRequiredF50Fields(read.value, { managedDashboard: true, preservedSecret: info.secret || '' });
      // The subscription supplies policy, not credentials for the local control plane.
      adapted['external-controller'] = info.externalController || '0.0.0.0:7788';
      if (typeof info.secret === 'string') adapted.secret = info.secret;
      for (const key of ['external-controller-tls', 'external-controller-unix', 'external-controller-pipe']) delete adapted[key];
      const written = await writeYamlObjectAtomic(CLASH_CONFIG, adapted, { label: '\u8ba2\u9605\u539f\u914d\u7f6e', backup, backupTag: 'subscription_original' });
      if (!written.ok) throw new Error(written.content || '订阅原配置写入失败');
      const marked = await runShellWithRoot(`
        ${setConfigSourceCmd('subscription_original')}
        grep -qx 'KANO_CONFIG_SOURCE=subscription_original' ${shellQuote(CLASH_CONFIG_SOURCE_FILE)}
      `, 10 * 1000);
      if (!marked.success) throw new Error('保存原配置来源失败');
      invalidateStatusSnapshot();
      return true;
    } catch (error) {
      if (activeCriticalOperation) activeCriticalOperation.failure = sanitizeSubscriptionSecrets(error.message || String(error));
      createToast(safeTextToHtml(sanitizeSubscriptionSecrets(error.message || String(error))), 'red', 10000);
      return false;
    } finally {
      await runShellWithRoot(`rm -f ${shellQuote(stagePath)}`, 10 * 1000);
    }
  };


  const buildDefaultOverrideJs = () => [
    '/**',
    ' * F50 JS \u8986\u5199\uff1a\u5199\u6cd5\u5c3d\u91cf\u8d34\u8fd1\u684c\u9762\u7aef mihomo/Clash Verge \u8986\u5199\u811a\u672c\u3002',
    ' * \u4fdd\u5b58\u540e\u4f1a\u57fa\u4e8e template.base.yaml \u751f\u6210 template.yaml\uff0c\u4e0d\u4f1a\u76f4\u63a5\u628a\u6574\u4efd\u6a21\u677f\u66ff\u6362\u6210\u56fa\u5b9a\u5185\u5bb9\u3002',
    ' * \u5e38\u7528\u5199\u6cd5\uff1a\u53ea\u6539 config.rules\uff0c\u6216\u5c11\u91cf\u6539 proxy-groups\u3002',
    ' */',
    'function main(config) {',
    '  config.rules = config.rules || [];',
    '',
    '  // \u793a\u4f8b 1\uff1a\u8ba9\u67d0\u4e2a\u57df\u540d\u76f4\u8fde\uff0c\u653e\u5230\u89c4\u5219\u6700\u524d\u9762',
    '  // config.rules.unshift("DOMAIN-SUFFIX,apple.com,DIRECT");',
    '',
    '  // \u793a\u4f8b 2\uff1a\u8ba9\u67d0\u4e2a\u57df\u540d\u5f3a\u5236\u8d70\u4ee3\u7406\u7ec4 Proxy',
    '  // config.rules.unshift("DOMAIN-SUFFIX,google.com,Proxy");',
    '',
    '  // \u793a\u4f8b 3\uff1a\u62e6\u622a\u5e7f\u544a\u57df\u540d',
    '  // config.rules.unshift("DOMAIN-SUFFIX,doubleclick.net,REJECT");',
    '',
    '  return config;',
    '}',
    '',
  ].join('\n');

  const normalizeOverrideJs = (code = '') => String(code || '')
    .replace(/export\s+default\s+function\s+main\s*\(/g, 'function main(')
    .replace(/export\s+default\s+function\s*\(/g, 'function main(');

  const validateOverrideJsSafety = (code = '') => {
    const safeCode = normalizeOverrideJs(code);
    const blockedPattern = /\b(eval|Function|fetch|XMLHttpRequest|WebSocket|EventSource|WebTransport|Worker|SharedWorker|importScripts|document|window|globalThis|localStorage|sessionStorage|indexedDB|caches|navigator|location|history|opener|parent|top|frames|runShellWithRoot|KANO_baseURL|common_headers|constructor|__proto__|prototype)\b/;
    if (safeCode.length > 20000) {
      throw new Error('JS 覆写过长，请精简后再保存');
    }
    if (blockedPattern.test(safeCode)) {
      throw new Error('JS 覆写包含被禁止的浏览器、网络、动态执行或原型访问能力');
    }
    return safeCode;
  };

  const readJsOverrideText = async () => {
    const res = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_OVERRIDE_JS)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_OVERRIDE_JS)}; fi
        `);
    const text = res.success ? String(res.content || '') : '';
    return text.trim() ? text : buildDefaultOverrideJs();
  };

  const saveJsOverrideText = async (text = '') => {
    let code;
    try {
      code = validateOverrideJsSafety(String(text || '').replace(/\r\n/g, '\n'));
    } catch (e) {
      createToast(textToHtml(e.message || e), 'red', 8000);
      return false;
    }
    const output = code.trim() ? `${code.replace(/\s+$/, '')}\n` : '';
    const res = await runShellWithRoot(`
        set -e
        mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)}
        TARGET=${shellQuote(CLASH_OVERRIDE_JS)}
        TMP="$TARGET.kano_new.$$"
        trap 'rm -f "$TMP" 2>/dev/null || true' EXIT
        printf '%s' ${shellQuote(output)} > "$TMP"
        chmod 600 "$TMP"
        mv -f "$TMP" "$TARGET"
        trap - EXIT
        `);
    if (!res.success) {
      createToast(`保存 JS 覆写失败<br>${safeTextToHtml(res.content || '')}`, 'red', 8000);
    }
    return !!res.success;
  };


  const hasSavedJsOverride = async () => {
    const res = await runShellWithRoot(`[ -s ${shellQuote(CLASH_OVERRIDE_JS)} ] && echo 1 || echo 0`);
    return String(res.content || '').trim() == '1';
  };

  const runJsOverrideOnConfig = async (code = '', config = {}) => {
    const safeCode = validateOverrideJsSafety(code);
    if (typeof Worker != 'function' || typeof Blob != 'function' || !globalThis.URL || typeof globalThis.URL.createObjectURL != 'function') {
      throw new Error('当前浏览器不支持隔离 Worker，已拒绝在管理页面主线程执行 JS 覆写');
    }

    const input = JSON.parse(JSON.stringify(config || {}));
    const workerSource = `
      "use strict";
      const safePostMessage = self.postMessage.bind(self);
      const blockedGlobals = [
        "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "WebTransport",
        "Worker", "SharedWorker", "importScripts", "indexedDB", "caches",
        "navigator", "location", "postMessage", "close"
      ];
      for (const name of blockedGlobals) {
        try {
          Object.defineProperty(self, name, {
            value: undefined,
            writable: false,
            configurable: false,
            enumerable: false
          });
        } catch (_) {
          try { self[name] = undefined; } catch (_) {}
        }
      }
      self.onmessage = (event) => {
        try {
          const code = String(event.data && event.data.code || "");
          const config = event.data && event.data.config;
          const module = { exports: null };
          const exports = {};
          const runnerBody =
            '\"use strict\";\\n' + code + '\\n' +
            'let fn = null;\\n' +
            'if (typeof main === "function") fn = main;\\n' +
            'else if (typeof module.exports === "function") fn = module.exports;\\n' +
            'else if (module.exports && typeof module.exports.default === "function") fn = module.exports.default;\\n' +
            'else if (typeof exports.default === "function") fn = exports.default;\\n' +
            'if (!fn) return config;\\n' +
            'const out = fn(config);\\n' +
            'return out || config;\\n';
          const runner = new Function("config", "module", "exports", runnerBody);
          const output = runner(config, module, exports);
          safePostMessage({ ok: true, output });
        } catch (error) {
          safePostMessage({
            ok: false,
            error: String(error && (error.stack || error.message) || error)
          });
        }
      };
    `;

    const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    let worker = null;
    try {
      worker = new Worker(blobUrl);
      const output = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          try { worker.terminate(); } catch (_) {}
          reject(new Error('JS 覆写执行超时（3.5 秒），已终止隔离 Worker'));
        }, 3500);
        worker.onmessage = (event) => {
          clearTimeout(timer);
          const data = event.data || {};
          if (!data.ok) {
            reject(new Error(data.error || 'JS 覆写执行失败'));
            return;
          }
          resolve(data.output);
        };
        worker.onerror = (event) => {
          clearTimeout(timer);
          reject(new Error(event.message || '隔离 Worker 启动失败'));
        };
        worker.postMessage({ code: safeCode, config: input });
      });
      if (!output || typeof output != 'object' || Array.isArray(output)) {
        throw new Error('JS 覆写必须返回配置对象');
      }
      if (output.rules && !Array.isArray(output.rules)) {
        throw new Error('config.rules 必须是数组');
      }
      if (output['proxy-groups'] && !Array.isArray(output['proxy-groups'])) {
        throw new Error('config["proxy-groups"] 必须是数组');
      }
      const serialized = JSON.stringify(output);
      if (serialized.length > 5 * 1024 * 1024) {
        throw new Error('JS 覆写输出超过 5 MiB，已拒绝写入');
      }
      return JSON.parse(serialized);
    } finally {
      if (worker) {
        try { worker.terminate(); } catch (_) {}
      }
      URL.revokeObjectURL(blobUrl);
    }
  };

  const prepareTemplateFromBase = async (
    sources = [],
    { templateBasePath = CLASH_TEMPLATE_BASE, templatePath = CLASH_TEMPLATE } = {},
  ) => {
    const cleanSources = normalizeSubSourceList(sources);
    const pre = await runShellWithRoot(`
        mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)}
        if [ -s ${shellQuote(templateBasePath)} ]; then
          cp ${shellQuote(templateBasePath)} ${shellQuote(templatePath)} || exit 1
          echo "BASE_TEMPLATE_RESTORED"
        elif [ -s ${shellQuote(templatePath)} ]; then
          cp ${shellQuote(templatePath)} ${shellQuote(templateBasePath)} || exit 1
          echo "BASE_TEMPLATE_CREATED_FROM_CURRENT"
        else
          echo "BASE_TEMPLATE_EMPTY"
        fi
        `, 20 * 1000);
    if (!pre.success) {
      createToast(`\u51c6\u5907\u57fa\u7840\u6a21\u677f\u5931\u8d25<br>${safeTextToHtml(pre.content || '')}`, 'red', 8000);
      return false;
    }
    return await ensureTemplateForF50(cleanSources, { showToast: false, templatePath });
  };

  const applyJsOverrideToTemplate = async ({
    showToast = false,
    restart = false,
    sources = null,
    prepareTemplate = true,
    templateBasePath = CLASH_TEMPLATE_BASE,
    templatePath = CLASH_TEMPLATE,
  } = {}) => {
    const saved = await hasSavedJsOverride();
    const ruleOverrideConfig = await readRuleOverrideConfig();
    const hasUiOverride = hasActiveRuleOverride(ruleOverrideConfig);
    if (!saved && !hasUiOverride) {
      if (showToast) createToast('还没有保存界面规则或 JS 规则', 'yellow', 5000);
      return true;
    }

    const templateRes = await runShellWithRoot(`[ -s ${shellQuote(templatePath)} ] && echo 1 || echo 0`);
    if (String(templateRes.content || '').trim() != '1') {
      if (showToast) createToast('没有 template.yaml，覆写未应用', 'yellow', 6000);
      return true;
    }

    const cleanSources = sources ? normalizeSubSourceList(sources) : await readSavedSubSourcesForTemplate();
    if (prepareTemplate && !(await prepareTemplateFromBase(cleanSources, { templateBasePath, templatePath }))) return false;

    const read = await readYamlObject(templatePath, 'template.yaml');
    if (!read.ok) {
      createToast(`读取模板失败<br>${safeTextToHtml(read.message || '')}`, 'red', 9000);
      return false;
    }

    let outputObj = read.value;
    const preservedSecret = typeof read.value.secret == 'string' ? read.value.secret.trim() : '';
    try {
      if (hasUiOverride) outputObj = applyUiRuleOverridesToConfig(outputObj, ruleOverrideConfig);
      if (saved) {
        const code = await readJsOverrideText();
        outputObj = await runJsOverrideOnConfig(code, outputObj);
      }
      applyOverrideSafetyFields(outputObj, preservedSecret);
      assertYamlRootMap(outputObj, 'template.yaml 覆写结果');
    } catch (e) {
      createToast(`覆写执行失败<br>${safeTextToHtml(e.message || e)}`, 'red', 9000);
      return false;
    }

    const generated = await yamlHasGeneratedMarker(templatePath);
    if (generated === null) {
      createToast('template.yaml 生成标记读取失败，已中止且未改写原文件。', 'red', 9000);
      return false;
    }
    const write = await writeYamlObjectAtomic(templatePath, outputObj, {
      label: 'template.yaml',
      marker: generated ? GENERATED_TEMPLATE_MARKER : '',
      backup: true,
      backupTag: 'override',
    });
    if (!write.ok) {
      createToast(`写入覆写结果失败，原模板未被覆盖<br>${safeTextToHtml(write.content || '')}`, 'red', 10000);
      return false;
    }
    if (showToast) {
      createToast('覆写已应用到 template.yaml', 'green', 7000);
    }
    if (restart) return await restartClashOk({ skipCheck: true });
    return true;
  };




  const writeRuntimeConfigFromTemplate = async (
    sources = [],
    {
      backup = true,
      showToast = false,
      forceTemplate = false,
      localProviderFiles = false,
    } = {},
  ) => {
    await loadProviderUserAgent();
    const cleanSources = normalizeSubSourceList(sources);
    appendTemplateFlowDebug(`enter writeRuntimeConfigFromTemplate json_bridge=1 forceTemplate=${forceTemplate ? '1' : '0'} sources=${cleanSources.length}`);

    const writeCheckStart = async () => {
      await runShellWithRoot(`
        cat > ${shellQuote(KANO_TEMPLATE_WRITE_CHECK)} <<'KANO_WRITE_CHECK_EOF'
mode=template
step=enter
sources_count=${cleanSources.length}
forceTemplate=${forceTemplate ? '1' : '0'}
template=${CLASH_TEMPLATE}
config=${CLASH_CONFIG}
yaml_bridge=${YAML_BRIDGE_VERSION}
KANO_WRITE_CHECK_EOF
        printf 'time=%s\\n' "$(date +%Y-%m-%dT%H:%M:%S%z 2>/dev/null)" >> ${shellQuote(KANO_TEMPLATE_WRITE_CHECK)}
        `, 10 * 1000);
    };

    let configCommitted = false;
    const fail = async (step, message) => {
      const detail = sanitizeSubscriptionSecrets(String(message || 'unknown error'));
      await runShellWithRoot(`
        {
          echo 'failed_rc=1'
          echo ${shellQuote(`failed_step=${step}`)}
          printf 'failed_time=%s\\n' "$(date +%Y-%m-%dT%H:%M:%S%z 2>/dev/null)"
        } >> ${shellQuote(KANO_TEMPLATE_WRITE_CHECK)}
        `, 10 * 1000);
      appendTemplateFlowDebug(`writeRuntimeConfigFromTemplate failed step=${step} detail=${detail.replace(/[\r\n]+/g, ' ').slice(0, 500)}`);
      const checkRes = await runShellWithRoot(`cat ${shellQuote(KANO_TEMPLATE_WRITE_CHECK)} 2>/dev/null || true`, 10 * 1000);
      createToast(
        `${configCommitted ? "配置已写入，但来源标记提交失败；本次应用未完成" : "生成运行配置失败，config.yaml 未提交"}<br>${safeTextToHtml(detail)}<br><br>[kano_template_write_check.out]<br>${safeTextToHtml(checkRes.content || '')}`,
        'red',
        12000,
      );
      return false;
    };

    await writeCheckStart();

    if (cleanSources.length == 0) return fail('validate_sources', '没有订阅链接，无法生成运行配置');
    const invalidSource = cleanSources.find((source) => !isHttpUrl(source.url));
    if (invalidSource) return fail('validate_sources', `订阅链接格式不正确：${invalidSource.url}`);

    const storage = await ensurePolicyStorage();
    if (!storage.ok) return fail('prepare_policy_storage', storage.content || '策略文件目录准备失败');

    const read = await readYamlObject(CLASH_TEMPLATE, 'template.yaml');
    if (!read.ok) return fail('read_template', read.message || 'template.yaml 读取失败');

    const generated = await yamlHasGeneratedMarker(CLASH_TEMPLATE);
    if (generated === null) return fail('read_template_marker', 'template.yaml 生成标记读取失败');
    const tproxyPort = await detectF50TproxyPort();
    let normalized;
    try {
      normalized = normalizeManagedTemplateObject(read.value, cleanSources, {
        generated,
        emptyProviderUrls: false,
        localProviderFiles,
        tproxyPort,
      });
    } catch (e) {
      return fail('normalize_runtime_object', e.message || String(e));
    }

    const write = await writeYamlObjectAtomic(CLASH_CONFIG, normalized.config, {
      label: 'config.yaml',
      marker: generated ? GENERATED_TEMPLATE_MARKER : '',
      backup,
      backupTag: 'runtime',
    });
    if (!write.ok) return fail('validate_or_commit_runtime', write.content || '运行配置验证或提交失败');

    configCommitted = true;
    const sourceRes = await runShellWithRoot(`
        ${setConfigSourceCmd('template.yaml')}
        echo 'CONFIG_SOURCE_COMMITTED=template.yaml'
        `, 15 * 1000);
    if (!sourceRes.success || !String(sourceRes.content || '').includes('CONFIG_SOURCE_COMMITTED=template.yaml')) {
      return fail('commit_config_source', sourceRes.content || '配置来源写入失败');
    }

    const oldSize = ((write.content.split('\n').find((line) => line.startsWith('YAML_OLD_SIZE=')) || '').replace(/^YAML_OLD_SIZE=/, '').trim());
    const newSize = ((write.content.split('\n').find((line) => line.startsWith('YAML_NEW_SIZE=')) || '').replace(/^YAML_NEW_SIZE=/, '').trim());
    await runShellWithRoot(`
        {
          echo ${shellQuote(`old_sha=${write.oldHash || ''}`)}
          echo ${shellQuote(`old_size=${oldSize || '0'}`)}
          echo ${shellQuote(`new_sha=${write.newHash || ''}`)}
          echo ${shellQuote(`new_size=${newSize || '0'}`)}
          echo 'step=committed'
          echo ${shellQuote(`provider_count=${cleanSources.length}`)}
          echo ${shellQuote(`provider_url_count=${cleanSources.length}`)}
          echo ${shellQuote(`runtime_rules_count=${normalized.rulesCount}`)}
          echo ${shellQuote(`runtime_group_count=${normalized.groupCount}`)}
          echo ${shellQuote(`providers=${normalized.providerNames.join(',')}`)}
          echo ${shellQuote(`commit_unchanged=${write.unchanged ? '1' : '0'}`)}
          printf 'committed_time=%s\\n' "$(date +%Y-%m-%dT%H:%M:%S%z 2>/dev/null)"
        } >> ${shellQuote(KANO_TEMPLATE_WRITE_CHECK)}
        `, 15 * 1000);

    appendTemplateFlowDebug(`writeRuntimeConfigFromTemplate committed json_bridge=1 providers=${normalized.providerNames.join(',')} unchanged=${write.unchanged ? '1' : '0'}`);
    if (showToast) {
      createToast(
        '运行配置已通过结构检查并原子写入',
        'green',
        8000,
      );
    }
    return true;
  };


  const inspectTemplateNodeSources = async () => {
    const res = await runShellWithRoot(`
        TEMPLATE=${shellQuote(CLASH_TEMPLATE)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        if [ ! -s "$TEMPLATE" ]; then
          echo "TEMPLATE_NODE_CHECK=missing"
          exit 0
        fi
        if [ ! -x "$YQ" ]; then
          if grep -Eq '^[[:space:]]*-[[:space:]]*name[[:space:]]*:' "$TEMPLATE" 2>/dev/null || grep -Eq '^[[:space:]]*url[[:space:]]*:[[:space:]]*https?://' "$TEMPLATE" 2>/dev/null; then
            echo "TEMPLATE_NODE_CHECK=has_nodes"
          else
            echo "TEMPLATE_NODE_CHECK=no_nodes"
          fi
          exit 0
        fi
        "$YQ" e '.' "$TEMPLATE" >/dev/null 2>/data/kano_template_node_check.err || {
          echo "TEMPLATE_NODE_CHECK=invalid"
          cat /data/kano_template_node_check.err 2>/dev/null
          rm -f /data/kano_template_node_check.err
          exit 0
        }
        rm -f /data/kano_template_node_check.err
        proxy_count="$("$YQ" e '(.proxies // []) | length' "$TEMPLATE" 2>/dev/null)"
        provider_url_count="$("$YQ" e '[(."proxy-providers" // {})[] | (.url // "")] | .[]' "$TEMPLATE" 2>/dev/null | grep -Ec '^https?://' || true)"
        echo "$proxy_count" | grep -Eq '^[0-9]+$' || proxy_count=0
        echo "$provider_url_count" | grep -Eq '^[0-9]+$' || provider_url_count=0
        if [ "$proxy_count" -gt 0 ] || [ "$provider_url_count" -gt 0 ]; then
          echo "TEMPLATE_NODE_CHECK=has_nodes"
        else
          echo "TEMPLATE_NODE_CHECK=no_nodes"
        fi
        echo "proxy_count=$proxy_count"
        echo "provider_url_count=$provider_url_count"
        `);
    const status = ((String(res.content || '').split('\n').find((line) => line.startsWith('TEMPLATE_NODE_CHECK=')) || '')
      .replace(/^TEMPLATE_NODE_CHECK=/, '')
      .trim());
    return {
      ok: res.success,
      status,
      hasNodes: status == 'has_nodes',
      content: res.content || '',
    };
  };


  const getCurlBinCmd = () => `
        CURL_BIN=${shellQuote(`${F50_FILES_DIR}/curl`)}
        [ -x "$CURL_BIN" ] || CURL_BIN=${shellQuote(`${KANO_INSTALL_TOOLBOX_BIN}/curl`)}
        [ -x "$CURL_BIN" ] || CURL_BIN="$(command -v curl 2>/dev/null)"
        if [ -z "$CURL_BIN" ] || [ ! -x "$CURL_BIN" ]; then
          echo "curl 不存在（已检查 UFI 内置路径和系统 PATH）"
          exit 1
        fi
        `;

  const getCorePid = async () => (await readStatusSnapshot()).corePid;

  const normalizeController = (value = '') => {
    let controller = String(value || '').trim() || '127.0.0.1:7788';
    controller = controller.replace(/^['"]|['"]$/g, '').replace(/\/+$/g, '');
    if (controller.startsWith(':')) controller = `127.0.0.1${controller}`;
    if (!/^https?:\/\//i.test(controller)) controller = `http://${controller}`;
    try {
      const url = new URL(controller);
      if (
        ['0.0.0.0', '::', '[::]', 'localhost'].includes(url.hostname)
      ) {
        url.hostname = '127.0.0.1';
      }
      url.pathname = url.pathname.replace(/\/+$/g, '');
      return {
        raw: String(value || '').trim(),
        apiBase: url.toString().replace(/\/+$/g, ''),
        port: url.port || (url.protocol == 'https:' ? '443' : '80'),
      };
    } catch {
      return {
        raw: String(value || '').trim(),
        apiBase: 'http://127.0.0.1:7788',
        port: '7788',
      };
    }
  };

  let controllerInfoCache = null;
  let controllerInfoCacheExpiresAt = 0;
  let controllerInfoLoadPromise = null;

  const readControllerInfo = async ({ fresh = false } = {}) => {
    const data = await readStatusSnapshot({ fresh });
    const controller = data.externalController || '127.0.0.1:7788';
    return { ...normalizeController(controller), externalController: controller, secret: data.secret || '', secretSet: !!data.secret,
      usingFallbackController: !data.externalController, usingFallbackSecret: !data.secret, configSource: data.externalController ? 'config' : 'controller_fallback' };
  };

  const buildControllerInfo = async ({ fresh = false } = {}) => {
    const now = Date.now();
    if (!fresh && controllerInfoCache && controllerInfoCacheExpiresAt > now) {
      return controllerInfoCache;
    }
    if (controllerInfoLoadPromise) return controllerInfoLoadPromise;

    const loadPromise = readControllerInfo({ fresh });
    controllerInfoLoadPromise = loadPromise;
    try {
      const info = await loadPromise;
      if (controllerInfoLoadPromise == loadPromise) {
        controllerInfoCache = info;
        controllerInfoCacheExpiresAt = Date.now() + CONTROLLER_INFO_CACHE_TTL;
      }
      return info;
    } finally {
      if (controllerInfoLoadPromise == loadPromise) controllerInfoLoadPromise = null;
    }
  };

  const invalidateControllerInfo = () => {
    controllerInfoCache = null;
    controllerInfoCacheExpiresAt = 0;
    controllerInfoLoadPromise = null;
  };

  const yamlSingleQuote = (value = '') =>
    `'${String(value).replace(/'/g, "''")}'`;

  const validateControllerSettings = (controller = '', secret = '') => {
    const rawController = String(controller || '').trim().replace(/\/+$/g, '');
    const rawSecret = String(secret || '').trim();
    if (!rawController) {
      return { ok: false, message: 'external-controller \u4e0d\u80fd\u4e3a\u7a7a' };
    }
    if (!rawSecret) {
      return { ok: false, message: 'secret \u4e0d\u80fd\u4e3a\u7a7a' };
    }
    if (/[\r\n]/.test(rawController) || /[\r\n]/.test(rawSecret)) {
      return { ok: false, message: 'external-controller \u548c secret \u4e0d\u80fd\u5305\u542b\u6362\u884c' };
    }
    let parsed = null;
    try {
      const probe = rawController.startsWith(':')
        ? `http://127.0.0.1${rawController}`
        : (/^https?:\/\//i.test(rawController) ? rawController : `http://${rawController}`);
      parsed = new URL(probe);
    } catch {
      return { ok: false, message: 'external-controller \u683c\u5f0f\u4e0d\u6b63\u786e' };
    }
    if (!parsed.port) {
      return { ok: false, message: 'external-controller \u5fc5\u987b\u5305\u542b\u7aef\u53e3' };
    }
    if (parsed.pathname && parsed.pathname != '/') {
      return { ok: false, message: 'external-controller \u4e0d\u8981\u586b\u5199\u8def\u5f84' };
    }
    const controllerForConfig = /^https?:\/\//i.test(rawController)
      ? parsed.host
      : rawController;
    const normalized = normalizeController(controllerForConfig);
    if (!normalized || !normalized.port || Number(normalized.port) < 1 || Number(normalized.port) > 65535) {
      return { ok: false, message: 'external-controller \u7aef\u53e3\u4e0d\u6b63\u786e' };
    }
    return {
      ok: true,
      controller: controllerForConfig,
      secret: rawSecret,
      info: {
        ...normalized,
        externalController: controllerForConfig,
        secret: rawSecret,
        secretSet: true,
        usingFallbackController: false,
        usingFallbackSecret: false,
        configSource: 'real',
      },
    };
  };

  const saveControllerSettings = async (controller = '', secret = '') => {
    const checked = validateControllerSettings(controller, secret);
    if (!checked.ok) return checked;

    const oldInfo = await buildControllerInfo();
    const rollbackPath = await createConfigRollbackPoint('controller_settings');
    if (rollbackPath === null) {
      return { ...checked, ok: false, message: '无法创建 config.yaml 回滚点，未保存设置' };
    }
    const configRead = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    if (!configRead.ok) {
      return { ...checked, ok: false, message: configRead.message || 'config.yaml 读取失败' };
    }

    const configObject = cloneJsonValue(configRead.value);
    configObject['external-controller'] = checked.controller;
    configObject.secret = checked.secret;

    let templateObject = null;
    let templateGenerated = false;
    const templateExistsRes = await runShellWithRoot(`[ -s ${shellQuote(CLASH_TEMPLATE)} ] && echo 1 || echo 0`, 10 * 1000);
    const templateExists = String(templateExistsRes.content || '').trim() == '1';
    if (templateExists) {
      const templateRead = await readYamlObject(CLASH_TEMPLATE, 'template.yaml');
      if (!templateRead.ok) {
        return { ...checked, ok: false, message: templateRead.message || 'template.yaml 读取失败' };
      }
      templateObject = cloneJsonValue(templateRead.value);
      templateObject['external-controller'] = checked.controller;
      templateObject.secret = checked.secret;
      templateGenerated = await yamlHasGeneratedMarker(CLASH_TEMPLATE);
      if (templateGenerated === null) {
        return { ...checked, ok: false, message: 'template.yaml 生成标记读取失败，未改写原文件' };
      }
    }

    let templateWrite = null;
    const restoreTemplateWrite = async () => {
      if (!templateWrite || templateWrite.unchanged) return true;
      if (!templateWrite.backupPath) return false;
      const restored = await runShellWithRoot(`
        set -e
        BACKUP=${shellQuote(templateWrite.backupPath)}
        TARGET=${shellQuote(CLASH_TEMPLATE)}
        RESTORE="$TARGET.kano_restore.$$"
        trap 'rm -f "$RESTORE" 2>/dev/null || true' EXIT
        [ -s "$BACKUP" ] || exit 1
        cp "$BACKUP" "$RESTORE"
        chmod 644 "$RESTORE" 2>/dev/null || true
        mv -f "$RESTORE" "$TARGET"
        trap - EXIT
        echo TEMPLATE_ROLLBACK_RESTORED
      `, 20 * 1000);
      return restored.success && String(restored.content || '').includes('TEMPLATE_ROLLBACK_RESTORED');
    };
    if (templateObject) {
      templateWrite = await writeYamlObjectAtomic(CLASH_TEMPLATE, templateObject, {
        label: 'template.yaml',
        marker: templateGenerated ? GENERATED_TEMPLATE_MARKER : '',
        backup: true,
        backupTag: 'controller',
      });
      if (!templateWrite.ok) {
        return {
          ...checked,
          ok: false,
          message: `保存 template.yaml 控制 API 设置失败\n${templateWrite.content || ''}`.trim(),
        };
      }
    }

    const configWrite = await writeYamlObjectAtomic(CLASH_CONFIG, configObject, {
      label: 'config.yaml',
      backup: true,
      backupTag: 'controller',
    });
    if (!configWrite.ok) {
      const templateRestored = await restoreTemplateWrite();
      const configRestored = rollbackPath
        ? await restoreConfigRollbackPoint(rollbackPath, '控制 API 设置', { showToast: false })
        : false;
      return {
        ...checked,
        ok: false,
        message: sanitizeSubscriptionSecrets([
          '保存 config.yaml 控制 API 设置失败',
          configRestored && templateRestored ? '已恢复原配置' : '原配置回滚未完整完成',
          configWrite.content || '',
        ].filter(Boolean).join('\n')),
      };
    }

    const res = {
      success: true,
      content: [
        'CONTROLLER_SETTINGS_SAVED',
        `TEMPLATE_CONTROLLER_BACKUP=${templateWrite ? templateWrite.backupPath || '' : ''}`,
        configWrite.content || '',
      ].filter(Boolean).join('\n'),
    };

    const reloadRes = await reloadConfigHot(oldInfo);
    const checkRes = reloadRes.success
      ? await callMihomoApi('/version', 'GET', null, checked.info, 8, { corePid: reloadRes.corePid })
      : { success: false, statusCode: 0, responseText: 'reload failed' };
    if (!reloadRes.success || !checkRes.success) {
      const configRestored = rollbackPath
        ? await restoreConfigRollbackPoint(rollbackPath, '控制 API 设置', { showToast: false })
        : false;
      const templateRestored = await restoreTemplateWrite();
      const rollbackReload = configRestored ? await reloadConfigHot(oldInfo) : { success: false };
      const runtimeRecovered = rollbackReload.success || (configRestored && await restartClashOk({ skipCheck: true }));
      const rollbackSummary = configRestored && templateRestored
        ? (runtimeRecovered ? '已恢复原配置，核心运行正常' : '已恢复原配置，但核心未能恢复运行')
        : '原配置回滚未完整完成';
      return {
        ...checked,
        ok: false,
        saved: false,
        shell: res,
        reload: reloadRes,
        connectivity: checkRes,
        message: sanitizeSubscriptionSecrets(`新控制 API 设置无法生效；${rollbackSummary}\n${reloadRes.responseText || checkRes.responseText || ''}`.trim()),
      };
    }
    invalidateBinarySnapshot();
    invalidateControllerInfo();
    return {
      ...checked,
      saved: true,
      shell: res,
      reload: reloadRes,
      connectivity: checkRes,
    };
  };

  const buildApiCurl = (
    urlPath = '/',
    method = 'GET',
    body = null,
    controllerInfo = null,
    outputFile = null,
    requestTimeout = 8,
  ) => {
    const info = controllerInfo || normalizeController();
    const path = String(urlPath || '/').startsWith('/')
      ? String(urlPath || '/')
      : `/${urlPath}`;
    const url = `${info.apiBase}${path}`;
    const bodyArg = body == null ? '' : `--data-binary ${shellQuote(body)}`;
    const typeArg = body == null ? '' : `-H ${shellQuote('Content-Type: application/json')}`;
    const outputArg = outputFile
      ? `-o ${shellQuote(outputFile)} -w ${shellQuote('%{http_code}')}`
      : '';
    const authorizationArgs = info.secretSet || info.secret
      ? `-H ${shellQuote(`Authorization: Bearer ${info.secret}`)}`
      : '';
    return [
      '"$CURL_BIN"',
      '-sS',
      "--noproxy '*' --connect-timeout 2",
      `-m ${Math.max(1, Number(requestTimeout) || 8)}`,
      outputArg,
      '-X',
      shellQuote(String(method || 'GET').toUpperCase()),
      authorizationArgs,
      typeArg,
      bodyArg,
      shellQuote(url),
    ].filter(Boolean).join(' ');
  };

  const callMihomoApi = async (
    urlPath = '/',
    method = 'GET',
    body = null,
    controllerInfo = null,
    requestTimeout = 8,
    { corePid = null } = {},
  ) => {
    const detectedCorePid = corePid == null ? await getCorePid() : String(corePid || '');
    const info = controllerInfo || await buildControllerInfo();
    if (!detectedCorePid) {
      const classified = classifyMihomoApiError({ corePid: '' });
      return {
        success: false,
        statusCode: 0,
        curlStatus: 0,
        responseText: '',
        controllerInfo: info,
        corePid: '',
        ...classified,
      };
    }
    const suffix = `${Date.now()}_${createRandomString(6)}`;
    const outFile = `/data/kano_mihomo_api_${suffix}.out`;
    const errFile = `/data/kano_mihomo_api_${suffix}.err`;
    const curlCmd = buildApiCurl(urlPath, method, body, info, outFile, requestTimeout);
    const res = await runShellWithRoot(`
        ${getCurlBinCmd()}
        HTTP_CODE="$(${curlCmd} 2>${shellQuote(errFile)})"
        CURL_STATUS=$?
        if [ -f ${shellQuote(outFile)} ]; then
          cat ${shellQuote(outFile)}
        fi
        if [ -s ${shellQuote(errFile)} ]; then
          echo
          cat ${shellQuote(errFile)}
        fi
        echo
        echo "__HTTP_CODE:\${HTTP_CODE:-000}__"
        echo "__CURL_STATUS:\${CURL_STATUS:-1}__"
        rm -f ${shellQuote(outFile)} ${shellQuote(errFile)}
        if [ "$CURL_STATUS" -eq 0 ] && [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
          exit 0
        fi
        exit 1
        `, (Math.max(1, Number(requestTimeout) || 8) + 8) * 1000);
    const raw = String(res.content || '');
    const codeMatch = raw.match(/__HTTP_CODE:(\d{3})__/);
    const curlMatch = raw.match(/__CURL_STATUS:(\d+)__/);
    const statusCode = codeMatch ? Number(codeMatch[1]) : 0;
    const curlStatus = curlMatch ? Number(curlMatch[1]) : 1;
    const responseText = raw
      .replace(/\n?__HTTP_CODE:\d{3}__\s*/, '')
      .replace(/\n?__CURL_STATUS:\d+__\s*$/, '')
      .trim();
    const success = !!(res.success && curlStatus == 0 && statusCode >= 200 && statusCode < 300);
    const classified = success
      ? { errorType: '', message: `控制 API 正常（HTTP ${statusCode}）` }
      : classifyMihomoApiError({
        corePid: detectedCorePid,
        curlStatus,
        statusCode,
        responseText,
      });
    return {
      ...res,
      success,
      statusCode,
      curlStatus,
      responseText,
      controllerInfo: info,
      corePid: detectedCorePid,
      ...classified,
    };
  };

  const flushMihomoRuntimeCaches = async () => {
    const [controllerInfo, corePid] = await Promise.all([
      buildControllerInfo(),
      getCorePid(),
    ]);
    const targets = [
      { label: 'DNS', path: '/cache/dns/flush' },
      { label: 'Fake-IP', path: '/cache/fakeip/flush' },
    ];
    const responses = await Promise.all(
      targets.map(async (target) => {
        try {
          return await callMihomoApi(target.path, 'POST', null, controllerInfo, 5, { corePid });
        } catch (e) {
          return {
            success: false,
            statusCode: 0,
            responseText: e && e.message ? e.message : String(e || ''),
          };
        }
      }),
    );
    return targets.map((target, index) => ({
      ...target,
      success: !!responses[index].success,
      statusCode: responses[index].statusCode || 0,
      errorType: responses[index].errorType || '',
      message: sanitizeSubscriptionSecrets(
        responses[index].message || responses[index].responseText || responses[index].content || '',
      ),
    }));
  };

  const reloadConfigHot = async (controllerInfo = null, configPath = CLASH_CONFIG) =>
    callMihomoApi(
      '/configs?force=true',
      'PUT',
      JSON.stringify({ path: configPath }),
      controllerInfo,
      25,
    );

  const parseProviderNamesFromYamlText = (content = '') => {
    const proxyProviders = [];
    const ruleProviders = [];
    let section = '';
    let sectionIndent = 0;
    String(content || '').split('\n').forEach((line) => {
      const sectionMatch = line.match(/^(\s*)(proxy-providers|rule-providers)\s*:/);
      if (sectionMatch) {
        section = sectionMatch[2] == 'proxy-providers' ? 'proxy' : 'rule';
        sectionIndent = sectionMatch[1].replace(/\t/g, '  ').length;
        return;
      }
      if (/^[^\s#][^:]*:/.test(line)) {
        section = '';
        return;
      }
      if (!section) return;
      const itemMatch = line.match(/^(\s*)([^\s#][^:]*):/);
      if (!itemMatch || itemMatch[1].replace(/\t/g, '  ').length != sectionIndent + 2) return;
      const name = itemMatch[2].trim().replace(/^['"]|['"]$/g, '');
      if (name) (section == 'proxy' ? proxyProviders : ruleProviders).push(name);
    });
    return { proxyProviders, ruleProviders };
  };

  const readProviderNamesFromCurrentConfig = async (config = null) => {
    try {
      if (config) return { ok: true, proxyProviders: Object.keys(config['proxy-providers'] || {}), ruleProviders: Object.keys(config['rule-providers'] || {}) };
      const res = await runShellWithRoot(`
        set -e
        CONFIG=${shellQuote(CLASH_CONFIG)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        [ -s "$CONFIG" ] || { echo CONFIG_MISSING; exit 1; }
        [ -x "$YQ" ] || { echo YQ_MISSING; exit 1; }
        timeout -k 1 6 "$YQ" e -o=json -I=0 '{"proxy": ((.\"proxy-providers\" // {}) | keys), "rule": ((.\"rule-providers\" // {}) | keys)}' "$CONFIG" || exit 1
        echo KANO_PROVIDER_NAMES_END
      `, 9000);
      const content = String(res.content || '');
      if (!res.success || !content.includes('KANO_PROVIDER_NAMES_END')) throw new Error(content || 'No provider list returned');
      const value = JSON.parse(content.slice(0, content.indexOf('KANO_PROVIDER_NAMES_END')).trim());
      if (!Array.isArray(value.proxy) || !Array.isArray(value.rule) || [...value.proxy, ...value.rule].some(n => typeof n !== 'string')) throw new Error('Invalid provider list');
      return { ok: true, proxyProviders: [...new Set(value.proxy)], ruleProviders: [...new Set(value.rule)] };
    } catch (error) {
      if (error.name === 'OperationCancelled') throw error;
      return { ok: false, proxyProviders: [], ruleProviders: [], message: '\u8282\u70b9\u6765\u6e90\u8bfb\u53d6\u5931\u8d25\uff1a' + sanitizeSubscriptionSecrets(error.message || String(error)).slice(0, 500) };
    }
  };

  const classifyProviderUpdateError = (rawError = '', statusCode = 0) => {
    const raw = String(rawError || '');
    const lower = raw.toLowerCase();
    let detail = raw;
    try { detail = String(JSON.parse(raw).message || raw); } catch (_) {}
    const embeddedStatus = Number((detail.match(/(?:status(?: code)?|http)[^0-9]{0,8}(\d{3})/i) || detail.match(/^\s*(\d{3})(?:\s|$)/) || [])[1] || 0);
    const status = embeddedStatus || Number(statusCode) || 0;
    if (Number(statusCode) === 401 || Number(statusCode) === 403) {
      return { type: 'api_auth', message: `Mihomo 控制 API 鉴权失败${status ? `（HTTP ${status}）` : ''}`, retryable: false };
    }
    if (status === 401 || status === 403 || /(?:unauthorized|forbidden|token[^\n]*(?:invalid|expired))/.test(lower)) {
      return { type: 'upstream_auth', message: '\u8ba2\u9605\u670d\u52a1\u5668\u62d2\u7edd\u8bf7\u6c42' + (status ? '\uff08HTTP ' + status + '\uff09' : ''), retryable: false };
    }
    if (status == 404 || /provider[^\n]*(?:not found|does not exist)/.test(lower)) {
      const providerMissing = /provider[^\n]*(?:not found|does not exist)/.test(lower);
      return {
        type: providerMissing ? 'provider_missing' : 'not_found',
        message: providerMissing ? '运行配置中未找到该节点来源' : '订阅地址不存在',
        retryable: false,
      };
    }
    if (status == 390) {
      return {
        type: 'upstream_390',
        message: 'HTTP Provider 更新失败（HTTP 390）',
        retryable: false,
        autoLocalFallback: true,
      };
    }
    if (status == 400 || /(?:invalid request|bad request|invalid parameter|yaml|syntax error)/.test(lower)) {
      return { type: 'configuration', message: '节点来源配置或 API 参数错误', retryable: false };
    }
    if (/\beof\b/.test(lower)) return { type: 'eof', message: '连接被远端提前关闭', retryable: true };
    if (/(?:timed? out|timeout|deadline exceeded)/.test(lower)) return { type: 'timeout', message: '连接订阅服务器超时', retryable: true };
    if (/(?:no such host|could not resolve|name or service not known|dns)/.test(lower)) {
      return { type: 'dns', message: '无法解析订阅服务器域名', retryable: true };
    }
    if (/(?:tls|ssl|certificate|x509)/.test(lower)) return { type: 'tls', message: '订阅服务器 TLS 连接失败', retryable: true };
    if (/(?:connection reset|connection refused|temporary failure|unexpected close)/.test(lower)) {
      return { type: 'connection', message: '订阅服务器连接异常', retryable: true };
    }
    if (status == 429) return { type: 'rate_limit', message: '请求过于频繁，请稍后再试', retryable: true };
    if ([500, 502, 503, 504].includes(status)) return { type: 'server', message: '订阅服务器暂时不可用', retryable: true };
    if (!status || /(?:mihomo|control).*(?:unavailable|unreachable)|failed to connect/.test(lower)) {
      return { type: 'api_unavailable', message: 'Mihomo 控制 API 暂不可用', retryable: true };
    }
    return { type: 'unknown', message: `节点来源更新失败${status ? `（HTTP ${status}）` : ''}`, retryable: false };
  };

  const parseProviderApiSnapshot = (responseText = '') => {
    try {
      const parsed = JSON.parse(String(responseText || '').trim());
      if (!parsed || !parsed.providers || typeof parsed.providers !== 'object' || Array.isArray(parsed.providers)) return null;
      const providers = parsed.providers;
      return Object.keys(providers).reduce((result, name) => {
        const item = providers[name] || {};
        result[name] = {
          proxyCount: Array.isArray(item.proxies) ? item.proxies.length : null,
          updatedAt: item.updatedAt || item.updated_at || '',
        };
        return result;
      }, {});
    } catch {
      return null;
    }
  };

  const waitForProviderApiReady = async (
    providerNames = [],
    tries = 3,
    delayMs = 300,
    { corePid = '' } = {},
  ) => {
    const targets = [...new Set((providerNames || []).filter(Boolean))];
    tries = Math.max(1, Math.min(3, Number(tries) || 3));
    const deadline = Date.now() + 10000;
    const controllerInfo = await buildControllerInfo();
    let lastResponse = null;
    let snapshot = null;
    let detectedCorePid = String(corePid || '');
    for (let attempt = 1; attempt <= tries; attempt++) {
      if (Date.now() >= deadline) break;
      if (!detectedCorePid) detectedCorePid = await getCorePid();
      if (detectedCorePid || attempt == tries) {
        lastResponse = await callMihomoApi('/providers/proxies', 'GET', null, controllerInfo, 3, {
          corePid: detectedCorePid,
        });
        if (lastResponse.errorType === 'auth_failed') break;
        snapshot = lastResponse.success ? parseProviderApiSnapshot(lastResponse.responseText) : null;
        if (snapshot && targets.every((name) => Object.prototype.hasOwnProperty.call(snapshot, name))) {
          return { ok: true, controllerInfo, corePid: detectedCorePid, snapshot, response: lastResponse };
        }
        if (lastResponse.success) break;
      }
      if (attempt < tries) await wait(delayMs);
    }
    return { ok: false, controllerInfo, corePid: detectedCorePid, snapshot, response: lastResponse };
  };

  const buildProviderUpdateResult = (providers = [], metadata = {}) => {
    const results = Array.isArray(providers) ? providers : [];
    const success = results.filter((item) => item.ok).length;
    const total = results.length;
    return { ...metadata, total, success, failed: total - success, providers: results, okCount: success, results };
  };

  const mapWithConcurrency = async (items = [], limit = 2, worker = async (item) => item) => {
    const source = Array.isArray(items) ? items : [];
    if (source.length == 0) return [];
    const results = new Array(source.length);
    let cursor = 0;
    const runNext = async () => {
      while (cursor < source.length) {
        const index = cursor++;
        results[index] = await worker(source[index], index);
      }
    };
    const workerCount = Math.min(source.length, Math.max(1, Number(limit) || 1));
    await Promise.all(Array.from({ length: workerCount }, () => runNext()));
    return results;
  };

  const deriveSubscriptionUpdateOutcome = (
    configValidationResult = {},
    providerUpdateResult = null,
  ) => {
    const providerResult = providerUpdateResult || buildProviderUpdateResult([]);
    const providerNotRun = !!providerResult.notRunReason;
    const providerExpected = Number(configValidationResult.providerCount || 0) > 0;
    const providerOk = providerResult.total > 0
      ? providerResult.failed == 0
      : !providerExpected;
    const failedProviders = providerResult.providers.filter((item) => !item.ok);
    const confirmedNoCache = failedProviders.length > 0 && failedProviders.every((item) => item.proxyCount === 0);
    const noUsableProvider = providerResult.total > 0 && providerResult.success == 0 && failedProviders.every(
      (item) => item.proxyCount === 0 || item.errorType == 'provider_missing',
    );
    const configOk = !!configValidationResult.ok;
    const allOk = configOk && providerOk;
    const title = !configOk
      ? '订阅配置检查异常'
      : providerNotRun
        ? '订阅配置正常 · 节点来源未更新'
        : allOk
          ? '订阅更新成功'
          : providerResult.success > 0
            ? '订阅配置正常 · 节点来源部分更新'
            : '订阅配置正常 · 节点来源更新失败';
    const color = !configOk || (!providerNotRun && (confirmedNoCache || noUsableProvider))
      ? 'red'
      : allOk
        ? 'green'
        : 'yellow';
    const summary = !configOk
      ? '订阅配置检查异常，请查看详细结果。'
      : providerNotRun
        ? `配置检查通过；${providerResult.notRunReason || '节点来源更新未执行'}。`
        : allOk
          ? `订阅更新成功：节点来源 ${providerResult.success}/${providerResult.total}`
          : `配置检查通过；节点来源更新 ${providerResult.success}/${providerResult.total}`;
    return {
      providerResult,
      providerNotRun,
      providerExpected,
      providerOk,
      failedProviders,
      confirmedNoCache,
      noUsableProvider,
      configOk,
      allOk,
      title,
      color,
      summary,
    };
  };

  const forceUpdateProvidersFromConfig = async ({ showToast = false, providerNames = null, config = null, refreshRemote = false } = {}) => {
  const read = config ? {ok:true,value:config} : await readYamlObject(CLASH_CONFIG, 'config.yaml');
  if (!read.ok) return buildProviderUpdateResult([{name:'config.yaml',ok:false,message:read.message || 'config read failed'}]);
  const defs = read.value['proxy-providers'] || {};
  const names = Object.keys(defs).filter(n => !providerNames || providerNames.includes(n));
  if(refreshRemote && Object.keys(read.value['x-f50-provider-sources'] || {}).some(n => names.includes(n))) {
    const refreshed = await f50Command('refresh-remote-providers',100000);
    if(!refreshed.success)return buildProviderUpdateResult(names.map(name=>({name,ok:false,message:f50Error(refreshed.content)})));
  }
  const info = await buildControllerInfo({fresh:true});
  const pid = await getCorePid();
  const results = [];
  for (const name of names) {
    if (defs[name].type === 'http') {
      results.push({type:'proxy-provider',name,ok:false,message:'\u65e7 HTTP Provider \u5c1a\u672a\u8fc1\u79fb\uff0c\u8bf7\u91cd\u65b0\u5bfc\u5165\u8ba2\u9605\u6216\u91cd\u542f\u6838\u5fc3',errorType:'legacy_http_provider'});
      continue;
    }
    if (!pid) { results.push({type:'proxy-provider',name,ok:false,message:'\u6838\u5fc3\u672a\u8fd0\u884c'}); continue; }
    const updated = await callMihomoApi('/providers/proxies/' + encodeURIComponent(name), 'PUT', null, info, 5, {corePid:pid});
    const snap = updated.success ? await callMihomoApi('/providers/proxies/' + encodeURIComponent(name), 'GET', null, info, 5, {corePid:pid}) : updated;
    let count = 0;
    try { const value = JSON.parse(snap.responseText || '{}'); count = Array.isArray(value.proxies) ? value.proxies.length : 0; } catch (_) {}
    const ok = !!updated.success && !!snap.success && count > 0;
    results.push({type:'proxy-provider',name,ok,attempts:1,proxyCount:count,statusCode:snap.statusCode || 0,
      message:ok ? '' : '\u672c\u5730\u8282\u70b9\u672a\u6210\u529f\u52a0\u8f7d\uff0c\u672a\u91cd\u8bd5\u8fdc\u7aef\u4e0b\u8f7d',errorType:ok ? '' : 'local_reload_failed'});
  }
  const result = buildProviderUpdateResult(results, {controllerInfo:info,corePid:pid,via:'file'});
  if (showToast) createToast(result.failed ? '\u90e8\u5206\u672c\u5730\u8282\u70b9\u672a\u52a0\u8f7d' : '\u672c\u5730\u8282\u70b9\u5df2\u52a0\u8f7d', result.failed ? 'red':'green');
  return result;
};

  const ensureLocalSubscriptionConverter = async () => { if(!(await ensureCompatBackend()))return false;const r=await runShellWithRoot('test -x /data/clash/Tools/kano-f50-helper-converter',4000);return !!r.success; };

  const convertSubscriptionsLocally = async (sources = [], { rawConfigPath = '' } = {}) => {
  const clean = normalizeSubSourceList(sources);
  if (!clean.length) return buildProviderUpdateResult([]);
  if (!(await ensureCompatBackend())) return buildProviderUpdateResult(clean.map(s => ({name:s.name,ok:false,message:'F50_BACKEND_REQUIRED'})));
  const path = '/data/kano_compat_fetch_' + Date.now() + '_' + createRandomString(6) + '.json';
  const staged = await stageTextBesideTarget(path, JSON.stringify({ sources: clean.map(s => ({name:s.name,url:s.url})), userAgent: await loadProviderUserAgent(), rawConfigPath }), 'subscription request');
  if (!staged.ok) return buildProviderUpdateResult(clean.map(s => ({name:s.name,ok:false,message:staged.message || 'request staging failed'})));
  let r;
  try {
    operationStage('\u4e0b\u8f7d\u5e76\u9a8c\u8bc1\u8ba2\u9605');
    r = await f50Command('fetch-batch ' + shellQuote(staged.stagePath), 100000);
    const line = String(r.content || '').split(/\r?\n/).find(s => s.startsWith('F50_FETCH_RESULT='));
    let data = null;
    try { if (line) data = JSON.parse(line.slice('F50_FETCH_RESULT='.length)); } catch (_) {}
    const committed = !!r.success && data && data.ok === true && data.committed === true;
    const results = clean.map(s => {
      const found = data && Array.isArray(data.providers) && data.providers.find(p => p.name === s.name);
      return {type:'proxy-provider',name:s.name,ok:!!(committed && found && found.ok),attempts:1,
        proxyCount:found ? found.proxyCount : null,statusCode:found ? found.statusCode : 0,
        message:committed ? '' : (found && found.message || f50Error(r.content)),errorType:committed ? '' : 'local_download_failed',
        rawMessage:'',cacheAvailable:null};
    });
    return buildProviderUpdateResult(results, {ok:!!committed,via:'local',committed:!!committed, message:committed ? '' : f50Error(r.content)});
  } finally {
    await runShellWithRoot('rm -f ' + shellQuote(staged.stagePath), 5000).catch(() => {});
  }
};

  const mergeLocalConversionReloadResult = (conversionResult = {}, reloadResult = {}) => {
    const reloadByName = new Map(((reloadResult && reloadResult.providers) || [])
      .map((item) => [item.name, item]));
    const providers = ((conversionResult && conversionResult.providers) || []).map((converted) => {
      if (!converted.ok) return converted;
      const reloaded = reloadByName.get(converted.name);
      if (!reloaded) {
        return {
          ...converted,
          ok: false,
          attempts: 0,
          errorType: 'provider_reload_missing',
          message: '本地转换已提交，但运行核心未返回节点来源刷新结果',
          cacheAvailable: true,
        };
      }
      const proxyCount = Number.isInteger(reloaded.proxyCount)
        ? reloaded.proxyCount
        : converted.proxyCount;
      const emptyProvider = reloaded.ok && proxyCount === 0;
      const ok = reloaded.ok && !emptyProvider;
      return {
        ...converted,
        ...reloaded,
        ok,
        errorType: ok ? '' : (emptyProvider ? 'empty_provider' : reloaded.errorType),
        message: ok ? '' : (emptyProvider ? '节点来源已刷新，但没有可用节点' : reloaded.message),
        proxyCount,
        cacheAvailable: ok || (!reloaded.ok && converted.cacheAvailable),
        format: converted.format,
        via: 'local+mihomo',
      };
    });
    return buildProviderUpdateResult(providers, {
      controllerInfo: reloadResult && reloadResult.controllerInfo || null,
      corePid: reloadResult && reloadResult.corePid || '',
      apiStatusCode: reloadResult && reloadResult.apiStatusCode || 0,
      apiErrorType: reloadResult && reloadResult.apiErrorType || '',
      notRunReason: reloadResult && reloadResult.notRunReason || '',
      runtimeState: reloadResult && reloadResult.runtimeState || '',
      via: 'local+mihomo',
      committed: !!(conversionResult && conversionResult.committed),
    });
  };

  const reloadLocalSubscriptionProviders = async (sources = [], conversionResult = null) => {
    const conversion = conversionResult || buildProviderUpdateResult([]);
    if (conversion.failed > 0 || conversion.total == 0) return conversion;
    const runtimeReload = await forceUpdateProvidersFromConfig({
      showToast: false,
      providerNames: normalizeSubSourceList(sources).map((source) => source.name),
    });
    return mergeLocalConversionReloadResult(conversion, runtimeReload);
  };

  const readCurrentModeStatus = async () => readStatusSnapshot();

  let ruleModeStatusRequestId = 0;
  const refreshRuleModeStatus = async () => {
    if (!document.querySelector('#mm_rule_mode_status')) return null;
    const requestId = ++ruleModeStatusRequestId;
    const status = await readCurrentModeStatus();
    if (requestId != ruleModeStatusRequestId) return status;
    const el = document.querySelector('#mm_rule_mode_status');
    if (!el) return status;
    const configLabel = status.configReadStatus == 'missing'
      ? '\u8fd0\u884c\u914d\u7f6e\u672a\u627e\u5230'
      : status.configReadStatus == 'invalid'
        ? '\u8fd0\u884c\u914d\u7f6e\u89e3\u6790\u5931\u8d25'
        : status.configReadStatus === 'unavailable' ? '\u672a\u80fd\u89e3\u6790\u914d\u7f6e' : '\u8fd0\u884c\u914d\u7f6e\u5df2\u52a0\u8f7d';
    const parts = [
      status.configSource == 'uploaded_config' ? '自定义配置' : status.mode == SUB_RULE_MODE_ORIGINAL ? '订阅原配置' : '模板规则',
      configLabel,
      status.failedStage ? `\u5931\u8d25\u9636\u6bb5\uff1a${status.failedStage}` : '',
    ].filter(Boolean);
    setText(el, parts.join(' · '));
    return status;
  };


  const waitForLanHost = async (tries = 20) => {
    for (let i = 0; i < tries; i++) {
      const data = typeof UFI_DATA !== 'undefined' ? UFI_DATA : window.UFI_DATA;
      if (data && data.lan_ipaddr) return data.lan_ipaddr;
      const host = (window.location && window.location.hostname) || '';
      if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.startsWith('[')) return host;
      await wait(100);
    }
    return (window.location && window.location.hostname) || '127.0.0.1';
  };

  const buildPanelUrl = async () => {
    const hostPromise = waitForLanHost();
    try {
      const [host, info] = await Promise.all([hostPromise, buildControllerInfo()]);
      return `http://${host}:${info.port || '7788'}/ui/?_f50=${Date.now()}#/`;
    } catch (e) {
      console.error(e);
      const host = await hostPromise;
      return `http://${host}:7788/ui/?_f50=${Date.now()}#/`;
    }
  };

  function renderRuntimeStatus(state, text, label = document.querySelector('#running_mm')) {
    if (!label) return;
    resetChildren(label);
    const dot = document.createElement('span');
    dot.className = 'mm-status-dot';
    dot.setAttribute('aria-hidden', 'true');
    const color = { healthy: '#38c878', stopped: '#ef646a', error: '#ef646a', checking: '#e6b652', unknown: '#8b96a6' }[state] || '#8b96a6';
    Object.assign(dot.style, { display: 'inline-block', flex: '0 0 10px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, boxShadow: '0 0 0 3px ' + color + '20' });
    const caption = document.createElement('span');
    caption.className = 'mm-status-text'; caption.textContent = text;
    Object.assign(label.style, { display: 'inline-flex', alignItems: 'center', gap: '8px' });
    label.dataset.state = state;
    label.setAttribute('aria-label', text);
    label.appendChild(dot); label.appendChild(caption);
  }

  let runningStatusRequestId = 0;
  const isMMRunning = async (runtimeSnapshot = null) => {
    const requestId = ++runningStatusRequestId;
    const label = document.querySelector('#running_mm');
    try {
      const snapshot = runtimeSnapshot && Object.prototype.hasOwnProperty.call(runtimeSnapshot, 'corePid')
        ? runtimeSnapshot : await readStatusSnapshot();
      const pid = String(snapshot.corePid || '');
      if (requestId !== runningStatusRequestId) return !!pid;
      if (label) label.title = [snapshot.processError, snapshot.configError, snapshot.optionsError, snapshot.apiError, snapshot.networkWarning].filter(Boolean).join('\n');
      if (snapshot.processReadStatus === 'unavailable') {
        renderRuntimeStatus('unknown', '\u732b\u732b - \u8fdb\u7a0b\u72b6\u6001\u4e0d\u53ef\u8bfb', label);
        return false;
      }
      if (!pid && snapshot.installState === 'missing') {
        renderRuntimeStatus('stopped', '\u732b\u732b - \u672a\u5b89\u88c5', label);
        return false;
      }
      renderRuntimeStatus(pid ? 'checking' : 'stopped', pid ? '\u732b\u732b - \u68c0\u67e5 API' : '\u732b\u732b - \u5df2\u505c\u6b62', label);
      // Badges are supplementary: they must not delay the API indicator.
      Promise.allSettled([refreshRuleModeStatus(), refreshModeBadge()]).catch(() => {});
      let apiOk = snapshot.apiOk === true;
      if (pid && typeof snapshot.apiOk !== 'boolean') {
        const info = snapshot.externalController !== undefined ? { ...normalizeController(snapshot.externalController || '127.0.0.1:7788'), secret: snapshot.secret || '', secretSet: !!snapshot.secret } : null;
        const version = await callMihomoApi('/version', 'GET', null, info, 3, { corePid: pid });
        apiOk = !!version.success;
      }
      if (requestId === runningStatusRequestId) renderRuntimeStatus(apiOk ? 'healthy' : pid ? 'error' : 'stopped',
        apiOk ? '\u732b\u732b - API \u6b63\u5e38' : pid ? '\u732b\u732b - API \u672a\u901a' : '\u732b\u732b - \u5df2\u505c\u6b62', label);
      return !!pid;
    } catch (error) {
      if (requestId === runningStatusRequestId && label) label.title = f50Error(error?.message || error);
      if (requestId === runningStatusRequestId) renderRuntimeStatus('unknown', '\u732b\u732b - \u72b6\u6001\u8bfb\u53d6\u5931\u8d25', label);
      return false;
    }
  };

  const askConfirm = (id, title, body, ok = '\u786e\u8ba4', cancel = '\u53d6\u6d88') => new Promise((resolve) => {
    const progress = activeCriticalOperation && activeCriticalOperation.progress;
    if (progress) progress.pause(true);
    const { el, close } = createFixedToast(
      id,
      `<div style="pointer-events:all;width:90vw;max-width:520px;">
        <div class="title" style="margin:0">${escapeHtml(title)}</div>
        <div style="margin-top:10px;font-size:.7rem;line-height:1.75">${body}</div>
        <div class="kano-dialog-actions kano-actions-2" style="--kano-action-count:2;margin-top:14px;">
          <button class="ok">${escapeHtml(ok)}</button>
          <button class="cancel">${escapeHtml(cancel)}</button>
        </div>
      </div>`,
    );
    const done = (value) => {
      close();
      if (progress) progress.pause(false);
      resolve(value);
    };
    const okBtn = el.querySelector('.ok');
    const cancelBtn = el.querySelector('.cancel');
    if (okBtn) okBtn.addEventListener('click', () => done(true));
    if (cancelBtn) cancelBtn.addEventListener('click', () => done(false));
  });

  // \u68c0\u6d4b\u662f\u5426\u5f00\u673a\u81ea\u542f
  const checkIsBootUp = async () => {
    const state = await inspectBootIntegration();
    return state.enabled;
  };

  let runtimePreflightCache = null;
  let runtimePreflightCacheExpiresAt = 0;
  let runtimePreflightLoadPromise = null;
  const checkInstallState = async ({ fresh = false } = {}) => {
    if (!fresh && runtimePreflightCache && runtimePreflightCacheExpiresAt > Date.now()) {
      return runtimePreflightCache;
    }
    if (!fresh && runtimePreflightLoadPromise) return runtimePreflightLoadPromise;
    const loadPromise = runtimePreflight();
    runtimePreflightLoadPromise = loadPromise;
    try {
      const state = await loadPromise;
      if (runtimePreflightLoadPromise == loadPromise) {
        runtimePreflightCache = state;
        runtimePreflightCacheExpiresAt = Date.now() + 1500;
      }
      return state;
    } finally {
      if (runtimePreflightLoadPromise == loadPromise) runtimePreflightLoadPromise = null;
    }
  };

  //\u76d1\u6d4b\u662f\u5426\u5df2\u7ecf\u5b89\u88c5\u8fc7\u4e86
  const checkIsInstalled = async () => {
    const res = await runShellWithRoot(`
      if [ -s ${shellQuote(CLASH_SERVICE)} ]; then echo 1; else echo 0; fi
    `, 5000);
    return !!(res.success && String(res.content || '').trim().split(/\s+/).includes('1'));
  };

  const ensureInstalled = async () => await ensureCompatBackend();

  const ensureReady = async (options = {}) =>
    (await ensureAdvanced()) && (await ensureInstalled(options));

  const buildManagedFirewallFunctions = () => `list_cleanup_ipt() (
  NAME="$1"
  {
    command -v "$NAME" 2>/dev/null || true
    command -v "\${NAME}-legacy" 2>/dev/null || true
    command -v "\${NAME}-nft" 2>/dev/null || true
    for BASE in /system/bin /system/xbin /vendor/bin /sbin; do
      for BIN in "$BASE/$NAME" "$BASE/\${NAME}-legacy" "$BASE/\${NAME}-nft"; do
        [ ! -x "$BIN" ] || echo "$BIN"
      done
    done
  } | awk 'NF && !seen[$0]++'
)
kano_table_read() (
  rules="$("$1" -t "$2" -S 2>&1)"
  rc=$?
  if [ "$rc" -ne 0 ]; then
    case "$rules" in
      *"Table does not exist"*|*"table does not exist"*|*"Address family not supported"*) exit 3 ;;
    esac
    printf 'FIREWALL_READ_FAILED:%s:%s:%s\\n' "$1" "$2" "$rules" >&2
    exit 1
  fi
  printf '%s\\n' "$rules" | grep -Eq '^-(P|N|A) ' || { echo "FIREWALL_EMPTY_SNAPSHOT:$1:$2" >&2; exit 1; }
  printf '%s\\n' "$rules"
)
kano_rule_records() {
  awk -v mode="$1" -v tproxy="$2" -v redirect="$3" '
  function owned(s) {if(mode=="private")return s ~ /^(KANO_PR_FWD|KANO_PR_FWD_A|KANO_PR_FWD_B)$/;return s ~ /^(KANO_MAC_BYPASS|KANO_POLICY_PRE|KANO_POLICY_A|KANO_POLICY_B|KANO_DNS_HIJACK|KANO_DNS_A|KANO_DNS_B|KANO_QUIC_BLOCK|KANO_QUIC_A|KANO_QUIC_B|KANO_PR_FWD|KANO_PR_FWD_A|KANO_PR_FWD_B)$/}
  function unquoted(s, out,q,escape,i,c) {
    out="";q="";escape=0
    for(i=1;i<=length(s);i++) {
      c=substr(s,i,1)
      if(escape){escape=0;if(q=="")out=out "_";continue}
      if(c=="\\\\"){escape=1;continue}
      if(q!=""){if(c==q)q="";continue}
      if(c=="\\""||c==sprintf("%c",39)){q=c;out=out "_";continue}
      out=out c
    }
    return out
  }
  BEGIN {split(tproxy,a,",");for(i in a)tp[a[i]]=1;split(redirect,a,",");for(i in a)rp[a[i]]=1}
  {
    $0=unquoted($0)
    if(mode=="native") {
      target="";port=""
      for(i=3;i<NF;i++){if($i=="-j")target=$(i+1);if($i=="--on-port"||$i=="--to-ports")port=$(i+1)}
      if((target=="TPROXY"&&tp[port])||(target=="REDIRECT"&&rp[port]))print
      next
    }
  }
  $1=="-N" && owned($2) {print "C",$2}
  $1=="-A" {
    n[$2]++
    if(!owned($2))for(i=3;i<NF;i++)if(($i=="-j"||$i=="-g")&&owned($(i+1))){print "J",$2,n[$2];break}
  }'
}
kano_firewall() (
  mode="$1"; tp="$2"; rp="$3"; failed=0; found=0
  for name in iptables ip6tables; do
    for ipt in $(list_cleanup_ipt "$name"); do
      found=$((found + 1))
      for table in mangle nat filter; do
        rules="$(kano_table_read "$ipt" "$table")"; rc=$?
        [ "$rc" -ne 3 ] || continue
        if [ "$rc" -ne 0 ]; then failed=1; continue; fi
        if [ "$mode" = native ]; then
          native="$(printf '%s\\n' "$rules" | kano_rule_records native "$tp" "$rp")"
          if [ -n "$native" ]; then echo "NATIVE_CAPTURE_REMAINS:$ipt:$table:$native"; failed=1; fi
          continue
        fi
        records="$(printf '%s\\n' "$rules" | kano_rule_records "$mode")"
        [ -n "$records" ] || continue
        if [ "$mode" = verify ]; then
          echo "FIREWALL_REMAINS:$ipt:$table:$records"; failed=1; continue
        fi
        # Remove external references first, descending indices within each chain.
        jumps="$(printf '%s\\n' "$records" | awk '$1=="J" {print $2,$3}' | sort -k1,1 -k2,2nr)"
        while read chain index; do
          [ -n "$chain" ] || continue
          case "$chain" in *[!A-Za-z0-9_.:+-]*) failed=1; continue ;; esac
          current="$("$ipt" -t "$table" -S "$chain" 2>/dev/null)" || { failed=1; continue; }
          expected="$(printf '%s\\n' "$rules" | awk -v c="$chain" -v n="$index" '$1=="-A"&&$2==c {if(++i==n)print}')"
          actual="$(printf '%s\\n' "$current" | awk -v c="$chain" -v n="$index" '$1=="-A"&&$2==c {if(++i==n)print}')"
          if [ -z "$expected" ] || [ "$actual" != "$expected" ]; then
            echo "FIREWALL_CONCURRENT_CHANGE:$ipt:$table:$chain"; failed=1; continue
          fi
          "$ipt" -t "$table" -D "$chain" "$index" || failed=1
        done <<KANO_JUMPS_EOF
$jumps
KANO_JUMPS_EOF
        chains="$(printf '%s\\n' "$records" | awk '$1=="C" {print $2}')"
        for chain in $chains; do "$ipt" -t "$table" -F "$chain" || failed=1; done
        for chain in $chains; do "$ipt" -t "$table" -X "$chain" || failed=1; done
        remaining="$(kano_table_read "$ipt" "$table")" || { failed=1; continue; }
        if [ -n "$(printf '%s\\n' "$remaining" | kano_rule_records "$mode")" ]; then
          echo "FIREWALL_CLEANUP_INCOMPLETE:$ipt:$table"; failed=1
        fi
      done
    done
  done
  [ "$found" -gt 0 ] || { echo FIREWALL_BACKEND_MISSING; exit 1; }
  [ "$failed" -eq 0 ]
)
`;
const verifyNativeTrafficReleasedCmd = () => 'sh ' + shellQuote(CLASH_SERVICE) + ' verify-clean';


  

  const buildOwnedCoreFunctions = () => `
CORE=${shellQuote(CLASH_CORE)}
kano_is_owned_core() (
  case "$1" in ''|*[!0-9]*) exit 1 ;; esac
  exe="$(readlink "/proc/$1/exe" 2>/dev/null)"
  case "$exe" in "$CORE"|"$CORE (deleted)") ;; *) exit 1 ;; esac
  if [ "$2" != all ]; then
    cmd="$(tr '\\0' ' ' < "/proc/$1/cmdline" 2>/dev/null)"
    case " $cmd " in *" -t "*|*" --test "*) exit 1 ;; esac
  fi
)
kano_core_pids() (
  found=0
  candidates="$(pidof Clash.Core 2>/dev/null) $(pidof mihomo 2>/dev/null)"
  for pid in $candidates; do
    if kano_is_owned_core "$pid" "$1"; then printf '%s\\n' "$pid"; found=1; fi
  done
  [ "$found" = 0 ] || exit 0
  for p in /proc/[0-9]*; do
    IFS= read -r name < "$p/comm" 2>/dev/null || continue
    case "$name" in Clash.Core|mihomo) ;; *) continue ;; esac
    pid="\${p##*/}"
    kano_is_owned_core "$pid" "$1" && printf '%s\\n' "$pid"
  done
  exit 0
)
find_runtime_pid() {
  kano_core_pids runtime | head -n 1
}
kano_stop_core() (
  for signal in TERM KILL; do
    pids="$(kano_core_pids all)"
    [ -n "$pids" ] || exit 0
    for pid in $pids; do
      kano_is_owned_core "$pid" all && kill -"$signal" "$pid" 2>/dev/null
    done
    count=0
    while [ "$count" -lt 4 ]; do
      [ -n "$(kano_core_pids all)" ] || exit 0
      count=$((count + 1)); sleep 1
    done
  done
  echo KANO_CORE_STOP_FAILED
  exit 1
)
kano_stop_watchers() (
  for p in /proc/[0-9]*; do
    [ -r "$p/cmdline" ] || continue
    # Check executable and complete argv, never text embedded in a shell -c script.
    exe="$(readlink "$p/exe" 2>/dev/null)"
    case "\${exe##*/}" in inotifyd|busybox|sh|bash|dash|mksh|toybox) ;; *) continue ;; esac
    args="$(tr '\\0' '\\n' < "$p/cmdline" 2>/dev/null)"
    if printf '%s\\n' "$args" | grep -qxF ${shellQuote(`${CLASH_DIR}/Scripts/Clash.Inotify`)}; then
      kill -TERM "\${p##*/}" 2>/dev/null || true
    elif printf '%s\\n' "$args" | grep -qxF ${shellQuote(CLASH_SERVICE)} && printf '%s\\n' "$args" | grep -qxF boot; then
      kill -TERM "\${p##*/}" 2>/dev/null || true
    fi
  done
)
`;

const stopOwnedClashCmd = () => 'sh ' + shellQuote(CLASH_SERVICE) + ' recover';

const verifyCoreStoppedCmd = () => 'sh ' + shellQuote(CLASH_SERVICE) + ' verify-stopped';


  const removePluginOwnedArtifactsCmd = () => `(
  cleanup_rc=0
  for artifact in \
    ${shellQuote(KANO_SUBSCRIPTION_RAW)} ${shellQuote(KANO_SUBSCRIPTION_YAML)} \
    ${shellQuote(KANO_SUBSCRIPTION_MODE_CHECK)} ${shellQuote(KANO_TEMPLATE_WRITE_CHECK)} \
    ${shellQuote(KANO_TEMPLATE_FLOW_DEBUG)} ${shellQuote(DOWNLOAD_ZIP)} ${shellQuote(DOWNLOAD_LOG)} \
    ${shellQuote(DOWNLOAD_SOURCE_FILE)} ${shellQuote(LOG_FILE)} \
    /data/kano_policy_boot.log /data/kano_policy_boot.previous.log \
    /data/kano_clash_config_test.log /data/kano_clash_start.log \
    /data/kano_clash_repair_zip_test.out /data/kano_clash_repair_unzip.out /data/kano_clash_repair_config.err \
    /data/kano_yq_expression_smoke.err /data/kano_yq_repair.zip \
    /data/kano_template_node_check.err /data/kano_template_upload_check.err \
    /data/kano_clash_zip_test.out /data/kano_clash_unzip.out /data/kano_policy_script_check.out \
    /data/kano_config_package_archive_test.out /data/kano_config_package_archive_list.out /data/kano_config_package_yaml_test.out \
    /data/kano_runtime_landed_check.err /data/kano_yaml_after_override.yaml /data/kano_ui_rules_patch.yaml \
    /data/mm_uninstall_backup.err       /data/kano_yq_repair.zip.new.* /data/kano_clash.zip.new.* /data/kano_mihomo_latest.dlog.verify \
    /data/kano_mihomo_api_*.out /data/kano_mihomo_api_*.err /data/kano_ui_rules_*.txt \
    /data/kano_helper_bundled_* /data/kano_helper_gitee_* \
    /data/kano_clash_install.* /data/kano_clash_repair.* /data/kano_clash_user_backup.* \
    /data/clash.before_install.* /data/clash.before_repair.* /data/clash.failed_repair.* \
    /data/kano_policy_save.* /data/kano_sub_persist.* /data/kano_template_upload_* \
    /data/kano_subscription_save_* /data/kano_subscription_urls_before_template_* \
    /data/kano_config_package_restore_* \
    ${shellQuote(KANO_YQ_RUNTIME_DIR)} ${shellQuote(KANO_INSTALL_TOOLBOX_DIR)}; do
    [ -e "$artifact" ] || [ -L "$artifact" ] || continue
    rm -rf "$artifact" || cleanup_rc=1
    if [ -e "$artifact" ] || [ -L "$artifact" ]; then
      printf 'UNINSTALL_ARTIFACT_REMAINS:%s\\n' "$artifact"
      cleanup_rc=1
    fi
  done
  # Never remove the shared UFI upload directory or another plugin's boot entries.
  for lock in /dev/kano_boot_write.lock /dev/kano_clash_boot.lock /dev/kano_policy_apply.lock /dev/kano_tproxy_tasks; do
    [ -d "$lock" ] || continue
    owner="$(cat "$lock/pid" 2>/dev/null)"
    case "$owner" in
      ''|*[!0-9]*) rm -rf "$lock" || cleanup_rc=1 ;;
      *) if kill -0 "$owner" 2>/dev/null; then echo "UNINSTALL_LOCK_BUSY:$lock"; cleanup_rc=1
         else rm -rf "$lock" || cleanup_rc=1; fi ;;
    esac
  done
  [ "$cleanup_rc" -eq 0 ] || { echo KANO_ERROR_STAGE=uninstall_artifact_cleanup; echo KANO_ERROR_CODE=artifact_remains; }
  exit "$cleanup_rc"
)`;

  const collectNetworkStatus = async () => {
    const helperResult = await runBinaryHelperJson('network-status', [
      '--log', LOG_FILE,
      '--yq-runtime', KANO_YQ_RUNTIME_DIR,
      '--clash-dir', CLASH_DIR,
    ], 15 * 1000);
    if (helperResult) return sanitizeSubscriptionSecrets(helperResult.text || '');
    const res = await runShellWithRoot(`
        get_diag_ipt() {
          NAME="$1"
          FIRST=""
          for BIN in \
            "$(command -v "$NAME" 2>/dev/null || true)" \
            "$(command -v "\${NAME}-legacy" 2>/dev/null || true)" \
            "$(command -v "\${NAME}-nft" 2>/dev/null || true)"; do
            [ -n "$BIN" ] && [ -x "$BIN" ] || continue
            [ -n "$FIRST" ] || FIRST="$BIN"
            if "$BIN" -t mangle -S PREROUTING 2>/dev/null | grep -Eiq 'KANO|TPROXY|clash|mihomo'; then
              echo "$BIN"
              return
            fi
          done
          for BASE in /system/bin /system/xbin /vendor/bin /sbin; do
            for BIN in "$BASE/$NAME" "$BASE/\${NAME}-legacy" "$BASE/\${NAME}-nft"; do
              [ -x "$BIN" ] || continue
              [ -n "$FIRST" ] || FIRST="$BIN"
              if "$BIN" -t mangle -S PREROUTING 2>/dev/null | grep -Eiq 'KANO|TPROXY|clash|mihomo'; then
                echo "$BIN"
                return
              fi
            done
          done
          [ -z "$FIRST" ] || echo "$FIRST"
        }
        IPT="$(get_diag_ipt iptables)"
        IP6T="$(get_diag_ipt ip6tables)"
        echo "[process]"
        (pidof Clash.Core 2>/dev/null || pidof Clash 2>/dev/null || pidof mihomo 2>/dev/null || true) | awk 'NF{print "pid=" $0}'
        echo
        echo "[listen ports]"
        (ss -lntup 2>/dev/null || netstat -lntup 2>/dev/null || true) | grep -E '(:7788|:7890|:7891|:7892|:7893|:7895|:1053)' || true
        echo
        echo "[IPv4 firewall: \${IPT:-unavailable}]"
        if [ -n "$IPT" ]; then
          echo "[mangle PREROUTING]"
          "$IPT" -t mangle -S PREROUTING 2>/dev/null | grep -E 'KANO|TPROXY|7895|clash|mihomo' || true
          echo "[nat PREROUTING]"
          "$IPT" -t nat -S PREROUTING 2>/dev/null | grep -E 'KANO|1053|789' || true
          echo "[filter FORWARD]"
          "$IPT" -t filter -S FORWARD 2>/dev/null | grep -E 'KANO|udp.*443|443.*udp' || true
        fi
        echo
        echo "[IPv6 firewall: \${IP6T:-unavailable}]"
        if [ -n "$IP6T" ]; then
          echo "[mangle PREROUTING]"
          "$IP6T" -t mangle -S PREROUTING 2>/dev/null | grep -E 'KANO|TPROXY|7895|clash|mihomo' || true
          echo "[nat PREROUTING]"
          "$IP6T" -t nat -S PREROUTING 2>/dev/null | grep -E 'KANO|1053|789' || true
          echo "[filter FORWARD]"
          "$IP6T" -t filter -S FORWARD 2>/dev/null | grep -E 'KANO|udp.*443|443.*udp' || true
        fi
        echo
        echo "[filesystem]"
        (mount 2>/dev/null | grep -E ' on /(tmp|data) | /(tmp|data) ' || true)
        DF_PATHS="/data"
        if [ -e /tmp ]; then
          DF_PATHS="$DF_PATHS /tmp"
        else
          echo "note: /tmp is unavailable; managed runtime directories under /data are used"
        fi
        df -k $DF_PATHS 2>/dev/null || true
        echo
        echo "[yq runtime]"
        ls -ld ${shellQuote(KANO_YQ_RUNTIME_DIR)} ${shellQuote(`${KANO_YQ_RUNTIME_DIR}/tmp`)} 2>/dev/null || true
        echo
        echo "[geodata]"
        for GEO_FILE in \
          ${shellQuote(`${CLASH_PROXY_DIR}/Country.mmdb`)} \
          ${shellQuote(`${CLASH_PROXY_DIR}/GeoIP.dat`)} \
          ${shellQuote(`${CLASH_PROXY_DIR}/geoip.dat`)} \
          ${shellQuote(`${CLASH_PROXY_DIR}/GeoSite.dat`)} \
          ${shellQuote(`${CLASH_PROXY_DIR}/geosite.dat`)} \
          ${shellQuote(`${CLASH_DIR}/Country.mmdb`)} \
          ${shellQuote(`${CLASH_DIR}/GeoIP.dat`)} \
          ${shellQuote(`${CLASH_DIR}/geoip.dat`)} \
          ${shellQuote(`${CLASH_DIR}/GeoSite.dat`)} \
          ${shellQuote(`${CLASH_DIR}/geosite.dat`)}; do
          [ -f "$GEO_FILE" ] && ls -l "$GEO_FILE" 2>/dev/null || true
        done
        echo
        echo "[last logs]"
        [ -f ${shellQuote(LOG_FILE)} ] && tail -n 80 ${shellQuote(LOG_FILE)} 2>/dev/null || true
        `, 15 * 1000);
    return sanitizeSubscriptionSecrets(res.content || '');
  };

  const networkRescue = async ({ stopService = true, showOutput = true, reason = '\u6062\u590d\u7f51\u7edc', preempt = false } = {}) => {
  if (recoveryInProgress) return false;
  if (!(await ensureCompatBackend())) return false;
  recoveryInProgress = true;
  if (preempt && activeCriticalOperation) activeCriticalOperation.token.cancelled = true;
  const own = preempt || !activeCriticalOperation;
  const progress = own ? createOperationProgress('\u6062\u590d\u7f51\u7edc') : activeCriticalOperation.progress;
  try {
    if (progress) progress.stage('\u505c\u6b62\u8fdb\u7a0b\u5e76\u91ca\u653e\u63a5\u7ba1\u89c4\u5219');
    const r = await hostRunShellWithRoot.call(globalThis, 'sh ' + shellQuote(CLASH_SERVICE) + ' recover', 65000);
    const ok = !!r.success && String(r.content || '').includes('RECOVERY_VERIFIED');
    invalidateStatusSnapshot(); invalidateBinarySnapshot(); runtimePreflightCache = null;
    if (progress) progress.finish(ok, ok ? '\u5df2\u505c\u6b62\u5e76\u91ca\u653e\u7f51\u7edc' : '\u4ecd\u6709\u6b8b\u7559\uff0c\u8bf7\u67e5\u770b\u8be6\u60c5');
    if (ok) renderRuntimeStatus('stopped', '\u732b\u732b - \u5df2\u505c\u6b62', document.querySelector('#running_mm'));
    createToast(ok ? '\u7f51\u7edc\u63a5\u7ba1\u5df2\u91ca\u653e' : '\u6062\u590d\u672a\u5b8c\u6210<br>' + safeTextToHtml(f50Error(r.content)), ok ? 'green':'red', ok ? 5000:15000);
    if (showOutput || !ok) showInfoDialog('mm_network_rescue', ok ? '\u6062\u590d\u5b8c\u6210':'\u6e05\u7406\u6b8b\u7559', '<pre style="white-space:pre-wrap;max-height:400px;overflow:auto">' + safeTextToHtml(sanitizeSubscriptionSecrets(r.content || '')) + '</pre>');
    return ok;
  } catch (error) {
    if (progress) progress.finish(false, '\u8bf7\u6c42\u5931\u8d25\uff0c\u72b6\u6001\u672a\u77e5');
    createToast(safeTextToHtml(error.message || String(error)), 'red', 12000); return false;
  } finally { recoveryInProgress = false; syncCriticalOperationStatus(); }
};

  const startClashServiceClean = async ({stopFirst=false}={}) => {
    let response;
    try {
      if (!(await ensureCompatBackend())) response = {success:false, content:'F50_BACKEND_REQUIRED'};
      else response = await runShellWithRoot(buildF50StartScript(stopFirst ? 'restart' : 'start'), 120000);
    } catch (error) {
      if (error?.name === 'OperationCancelled') throw error;
      response = {success:false, content:error?.message || String(error)};
    }
    invalidateStatusSnapshot();
    return f50StartResult(response);
  };

  const waitForCoreApi = async (tries = 12, delayMs = 1000) => {
    const info = await buildControllerInfo();
    for (let i = 0; i < tries; i++) {
      const pid = await getCorePid();
      if (pid || i % 3 == 2 || i == tries - 1) {
        const version = await callMihomoApi('/version', 'GET', null, info, 2, { corePid: pid });
        if (version.success) return true;
      }
      await wait(delayMs);
    }
    return false;
  };

  const isCorePidAlive = async (pid) => {
    if (!pid) return false;
    const res = await runShellWithRoot(`
        PID=${shellQuote(String(pid))}
        CORE=${shellQuote(CLASH_CORE)}
        [ -r "/proc/$PID/cmdline" ] || { echo 0; exit 0; }
        cmdline="$(tr '\\0' ' ' < "/proc/$PID/cmdline" 2>/dev/null)"
        case " $cmdline " in *" -t "*|*" --test "*) echo 0; exit 0 ;; esac
        if printf '%s' "$cmdline" | grep -qF "$CORE"; then echo 1; else echo 0; fi
        `, 8 * 1000);
    return !!(res && res.success && String(res.content || '').trim() == '1');
  };

  const waitForRunningCoreApi = async (context = '\u542f\u52a8') => {
    const pid = await getCorePid();
    if (!pid) return false;
    if (!(await isCorePidAlive(pid))) return false;
    await wait(1500);
    if (!(await isCorePidAlive(pid))) return false;
    appendTemplateFlowDebug(`core process ready before api context=${context} pid=${pid}`);
    createToast(
      `${escapeHtml(context)}\u540e\u6838\u5fc3\u8fdb\u7a0b\u5df2\u542f\u52a8\uff0c\u6b63\u5728\u7ee7\u7eed\u7b49\u5f85\u63a7\u5236 API...`,
      'yellow',
      10000,
    );
    return await waitForCoreApi(12, 1000);
  };

  const inspectGeodataBootstrap = async () => {
    const res = await runShellWithRoot(`
        LOG=${shellQuote(LOG_FILE)}
        in_progress=0
        recent=""
        if [ -f "$LOG" ]; then
          recent="$(tail -n 160 "$LOG" 2>/dev/null)"
          if printf '%s\n' "$recent" | grep -Eiq '(can.t find|not found|missing).*(mmdb|geoip|geosite|geodata|asn)|start(ing)? download|download(ing)?.*(mmdb|geoip|geosite|geodata|asn)'; then
            in_progress=1
          fi
        fi
        found=0
        for GEO_FILE in \
          ${shellQuote(`${CLASH_PROXY_DIR}/Country.mmdb`)} \
          ${shellQuote(`${CLASH_PROXY_DIR}/GeoIP.dat`)} \
          ${shellQuote(`${CLASH_PROXY_DIR}/geoip.dat`)} \
          ${shellQuote(`${CLASH_PROXY_DIR}/GeoSite.dat`)} \
          ${shellQuote(`${CLASH_PROXY_DIR}/geosite.dat`)} \
          ${shellQuote(`${CLASH_DIR}/Country.mmdb`)} \
          ${shellQuote(`${CLASH_DIR}/GeoIP.dat`)} \
          ${shellQuote(`${CLASH_DIR}/geoip.dat`)} \
          ${shellQuote(`${CLASH_DIR}/GeoSite.dat`)} \
          ${shellQuote(`${CLASH_DIR}/geosite.dat`)}; do
          if [ -s "$GEO_FILE" ]; then
            found=$((found + 1))
            size="$(wc -c < "$GEO_FILE" 2>/dev/null || echo 0)"
            echo "GEODATA_FILE=$GEO_FILE size=$size"
          fi
        done
        echo "GEODATA_BOOTSTRAP=$in_progress"
        echo "GEODATA_FOUND=$found"
        `, 10 * 1000);
    const text = String(res.content || '');
    return {
      inProgress: /(^|\n)GEODATA_BOOTSTRAP=1(\n|$)/.test(text),
      found: Number((text.match(/(?:^|\n)GEODATA_FOUND=(\d+)/) || [])[1] || 0),
      content: text,
    };
  };

  const verifyStartOrRollback = async (context = '\u542f\u52a8') => {
    const apiOk = await waitForCoreApi();
    if (apiOk) return true;
    if (await waitForRunningCoreApi(context)) return true;
    const geodataState = await inspectGeodataBootstrap();
    if (geodataState.inProgress) {
      createToast('检测到 Mihomo 正在初始化 MMDB/Geo 数据，已延长等待，避免误判启动失败。', 'yellow', 12000);
      appendTemplateFlowDebug(`geodata bootstrap grace context=${context} found=${geodataState.found}`);
      if (await waitForCoreApi(20, 1000)) {
        createToast('Geo 数据初始化完成，Mihomo API 已恢复。', 'green', 8000);
        return true;
      }
      if (await waitForRunningCoreApi(context)) return true;
    }
    const firstStatusText = await collectNetworkStatus();
    const retryRes = await startClashServiceClean({
      stopFirst: true,
      reason: `${context}\u540e\u9996\u6b21\u9a8c\u6d3b\u5931\u8d25\uff0c\u81ea\u52a8\u5e72\u51c0\u91cd\u8bd5`,
    });
    if (retryRes.success) {
      if (await waitForCoreApi(10, 1000)) {
        createToast(`${escapeHtml(context)}\u540e\u6838\u5fc3\u542f\u52a8\u8f83\u6162\uff0c\u5df2\u81ea\u52a8\u91cd\u8bd5\u6062\u590d\u3002`, 'yellow', 9000);
        return true;
      }
      if (await waitForRunningCoreApi(context)) return true;
    }
    const secondStatusText = await collectNetworkStatus();
    const statusText = [
      firstStatusText,
      `[retry]\n${retryRes.content || ''}`.trim(),
      '[after retry]',
      secondStatusText,
    ].filter(Boolean).join('\n\n');
    await networkRescue({
      stopService: true,
      showOutput: false,
      reason: `${context}\u540e API \u672a\u901a\u8fc7\u5065\u5eb7\u68c0\u67e5`,
    });
    createToast(`${escapeHtml(context)}\u540e\u6838\u5fc3 API \u672a\u901a\uff0c\u5df2\u81ea\u52a8\u505c\u6b62\u6838\u5fc3\u5e76\u6e05\u7406\u63d2\u4ef6\u89c4\u5219\uff0c\u907f\u514d\u7ee7\u7eed\u65ad\u7f51\u3002`, 'red', 10000);
    showInfoDialog(
      'mm_start_health_failed',
      `${escapeHtml(context)}\u5931\u8d25\uff1a\u5df2\u56de\u6eda\u7f51\u7edc\u89c4\u5219`,
      `<div style="font-size:.62rem;line-height:1.65;margin-bottom:8px;">\u6838\u5fc3\u8fdb\u7a0b\u6216\u63a7\u5236 API \u6ca1\u6709\u6b63\u5e38\u8d77\u6765\u3002\u63d2\u4ef6\u5df2\u6267\u884c\u505c\u6b62\u4e0e\u6e05\u7406\uff0c\u9632\u6b62 TProxy/DNS \u6b8b\u7559\u7ee7\u7eed\u52ab\u6301\u6d41\u91cf\u3002</div>
       <pre style="white-space:pre-wrap;background:rgba(0,0,0,.78);color:#0f0;padding:10px;max-height:420px;overflow:auto;">${escapeHtml(statusText || '\u6682\u65e0\u72b6\u6001\u8f93\u51fa')}</pre>`,
    );
    return false;
  };

  const createConfigRollbackPoint = async (label = 'runtime') => {
    const safeLabel = String(label || 'runtime').replace(/[^A-Za-z0-9_]/g, '_');
    const res = await runShellWithRoot(`
        CONFIG=${shellQuote(CLASH_CONFIG)}
        stamp="$(date +%Y%m%d%H%M%S 2>/dev/null)"
        [ -n "$stamp" ] || stamp="$(cat /proc/uptime 2>/dev/null | cut -d. -f1)"
        backup="$CONFIG.before_${safeLabel}_$stamp"
        if [ -f "$CONFIG" ]; then
          cp "$CONFIG" "$backup" || exit 1
          rm -f "$backup.source" "$backup.source.absent" || exit 1
          if [ -f ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} ]; then
            cp ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} "$backup.source" || exit 1
          else
            touch "$backup.source.absent" || exit 1
          fi
          chmod 644 "$backup" 2>/dev/null || true
          echo "CONFIG_ROLLBACK=$backup"
        else
          echo "CONFIG_ROLLBACK="
        fi
        `);
    if (!res.success) return null;
    const line = String(res.content || '').split('\n').find((item) => item.startsWith('CONFIG_ROLLBACK='));
    if (line === undefined) return null;
    return line.replace(/^CONFIG_ROLLBACK=/, '').trim();
  };

  const restoreConfigRollbackPoint = async (rollbackPath = '', context = '\u56de\u6eda', { showToast = true } = {}) => {
    if (!rollbackPath) return false;
    const res = await runShellWithRoot(`
        CONFIG=${shellQuote(CLASH_CONFIG)}
        BACKUP=${shellQuote(rollbackPath)}
        if [ ! -s "$BACKUP" ]; then
          echo "ROLLBACK_MISSING: $BACKUP"
          exit 1
        fi
        RESTORE_NEW="$CONFIG.kano_restore.$$"
        cleanup_restore() {
          rc=$?
          trap - EXIT
          rm -f "$RESTORE_NEW" 2>/dev/null || true
          exit "$rc"
        }
        trap cleanup_restore EXIT
        cp "$BACKUP" "$RESTORE_NEW" || exit 1
        chmod 644 "$RESTORE_NEW" 2>/dev/null || true
        mv -f "$RESTORE_NEW" "$CONFIG" || exit 1
        if [ -f "$BACKUP.source" ]; then
          cp "$BACKUP.source" ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} || exit 1
        elif [ -f "$BACKUP.source.absent" ]; then
          rm -f ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} || exit 1
        fi
        sync 2>/dev/null || true
        echo "CONFIG_ROLLBACK_RESTORED: $BACKUP"
        `);
    if (showToast) {
      createToast(
        res.success
          ? `${escapeHtml(context)}\u5931\u8d25\uff0c\u5df2\u6062\u590d\u4e0a\u4e00\u4efd config.yaml`
          : `${escapeHtml(context)}\u5931\u8d25\uff0c\u4e14 config.yaml \u56de\u6eda\u5931\u8d25<br>${safeTextToHtml(res.content || '')}`,
        res.success ? 'yellow' : 'red',
        9000,
      );
    }
    return res.success;
  };

  const restartClashWithConfigRollback = async (rollbackPath = null, context = '\u91cd\u542f') => {
    appendTemplateFlowDebug(`enter restartClashWithConfigRollback context=${context}`);
    const ok = await restartClashOk({ skipCheck: true });
    appendTemplateFlowDebug(`leave restartClashWithConfigRollback ok=${ok ? '1' : '0'} context=${context}`);
    if (ok) return true;

    if (rollbackPath === null) {
      createToast(
        `${escapeHtml(context)}失败，且没有可用的 config.yaml 回滚点。已清理运行规则以避免断网。`,
        'red',
        12000,
      );
      await isMMRunning();
      return false;
    }

    if (rollbackPath === '') {
      const removed = await runShellWithRoot(`
        rm -f ${shellQuote(CLASH_CONFIG)} 2>/dev/null || exit 1
        [ ! -e ${shellQuote(CLASH_CONFIG)} ] || exit 1
        echo CONFIG_ROLLBACK_RESTORED_ABSENT
      `, 15 * 1000);
      await networkRescue({ stopService: true, showOutput: false, reason: `${context}回滚到无配置状态` });
      createToast(
        removed.success
          ? `${escapeHtml(context)}失败；写入前没有 config.yaml，已移除新配置并清理网络规则。`
          : `${escapeHtml(context)}失败；写入前没有 config.yaml，但新配置移除失败。`,
        removed.success ? 'yellow' : 'red',
        12000,
      );
      await isMMRunning();
      return false;
    }

    appendTemplateFlowDebug(`restart failed, restoring config rollback=${rollbackPath}`);
    const restored = await restoreConfigRollbackPoint(rollbackPath, context, { showToast: false });
    if (!restored) {
      createToast(`${escapeHtml(context)}失败，且上一份 config.yaml 回滚失败。`, 'red', 12000);
      await isMMRunning();
      return false;
    }

    createToast('新配置启动失败，正在尝试用上一份 config.yaml 恢复核心…', 'yellow', 9000);
    const recoveryOk = await restartClashOk({ skipCheck: true });
    appendTemplateFlowDebug(`rollback recovery restart result=${recoveryOk ? '1' : '0'} context=${context}`);
    if (recoveryOk) {
      createToast(`${escapeHtml(context)}失败；上一份 config.yaml 已恢复，核心已重新启动。`, 'yellow', 12000);
    } else {
      await networkRescue({ stopService: true, showOutput: false, reason: `${context}回滚后仍无法启动` });
      createToast(`${escapeHtml(context)}失败；旧配置也未能启动，已停止核心并清理 TProxy/DNS 规则。`, 'red', 12000);
    }
    await isMMRunning();
    return false;
  };


  const saveTemplate = async (file) => {
    const txId = `${Date.now()}_${createRandomString(6)}`;
    const txBase = `/data/kano_template_upload_${txId}.base.yaml`;
    const txTemplate = `/data/kano_template_upload_${txId}.yaml`;
    let subRollbackPath = '';
    let subSourcesPersisted = false;
    try {
      const preserveSubscription = ['uploaded_config', 'subscription_original'].includes(await readConfigSource());
      const uploadedPath = await uploadFileToDevice(file);
      const foundFile = await runShellWithRoot(`
                        [ -s ${shellQuote(uploadedPath)} ] && echo 1 || echo 0
                    `);
      if (String(foundFile.content || '').trim() != '1') {
        throw '\u4e0a\u4f20\u5931\u8d25';
      }

      const stageRes = await runShellWithRoot(`
        set -e
        mkdir -p /data ${shellQuote(`${CLASH_DIR}/Tools`)}
        mv ${shellQuote(uploadedPath)} ${shellQuote(txBase)}
        cp ${shellQuote(txBase)} ${shellQuote(txTemplate)}
        chmod 644 ${shellQuote(txBase)} ${shellQuote(txTemplate)}
        [ -s ${shellQuote(txBase)} ] && [ -s ${shellQuote(txTemplate)} ] && echo TEMPLATE_STAGED
      `);
      if (!stageRes.success || !String(stageRes.content || '').includes('TEMPLATE_STAGED')) {
        throw stageRes.content || '\u6a21\u677f\u4e34\u65f6\u843d\u76d8\u5931\u8d25';
      }
      const yamlCheckRes = await runShellWithRoot(`
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        TEMPLATE=${shellQuote(txBase)}
        ${requireMikeFarahYqV4Cmd()}
        "$YQ" e '.' "$TEMPLATE" >/dev/null 2>/data/kano_template_upload_check.err || {
          echo "TEMPLATE_YAML_INVALID:"
          cat /data/kano_template_upload_check.err 2>/dev/null
          rm -f /data/kano_template_upload_check.err
          exit 1
        }
        upload_root_type="$("$YQ" e 'type' "$TEMPLATE" 2>/dev/null)"
        [ "$upload_root_type" = "!!map" ] || {
          echo "TEMPLATE_ROOT_NOT_MAP: 上传模板顶层必须是 YAML 映射，当前类型=$upload_root_type"
          exit 1
        }
        rm -f /data/kano_template_upload_check.err
        echo "TEMPLATE_YAML_OK"
      `, 30 * 1000);
      if (!yamlCheckRes.success) {
        throw yamlCheckRes.content || '\u6a21\u677f YAML \u6821\u9a8c\u5931\u8d25\uff0c\u5df2\u4fdd\u7559\u539f template.base.yaml / template.yaml';
      }

      let savedSources = await readSavedSubSourcesForTemplate();
      let templateSubSourcesToPersist = [];
      let templateSubSyncMessage = '';
      const providerCheck = await readTemplateProviderSubSources(txBase, txTemplate, { includeSuspicious: true });
      if (providerCheck.suspiciousSources.length > 0) {
        throw `\u6a21\u677f proxy-providers \u5305\u542b\u7591\u4f3c\u975e\u8282\u70b9\u8ba2\u9605\u94fe\u63a5\uff1a${providerCheck.suspiciousSources[0].url}\n\u8bf7\u4e0d\u8981\u628a DNS\u3001\u89c4\u5219\u96c6\u3001GeoIP/GeoSite/MMDB/ASN \u6216\u56fe\u6807\u94fe\u63a5\u653e\u5728 proxy-providers.url`;
      }
      const templateSources = providerCheck.sources;
      if (preserveSubscription) {
        savedSources = templateSources;
      } else if (templateSources.length > 0) {
        const savedKey = normalizeSubSourceList(savedSources).map((source) => source.url).join('\n');
        const templateKey = normalizeSubSourceList(templateSources).map((source) => source.url).join('\n');
        if (savedSources.length == 0) {
          savedSources = templateSources;
          templateSubSourcesToPersist = templateSources;
          templateSubSyncMessage = '\u5df2\u4ece\u6a21\u677f proxy-providers \u5bfc\u5165\u8ba2\u9605\u94fe\u63a5\uff0c\u5e76\u7edf\u4e00\u547d\u540d\u4e3a Provider1/Provider2\u3002';
        } else if (savedKey != templateKey) {
          const oldSources = normalizeSubSourceList(savedSources);
          const newSources = normalizeSubSourceList(templateSources);
          const confirmed = await askConfirm(
            `mm_template_sub_replace_confirm_${createRandomString(4)}`,
            '\u66ff\u6362\u8ba2\u9605\u94fe\u63a5\uff1f',
            `模板包含 ${newSources.length} 个订阅链接，将替换当前 ${oldSources.length} 个已保存链接。`,
            '\u66ff\u6362',
            '\u53d6\u6d88',
          );
          if (!confirmed) return false;
          const oldCount = savedSources.length;
          savedSources = templateSources;
          templateSubSourcesToPersist = templateSources;
          templateSubSyncMessage = `\u5df2\u6309\u65b0\u6a21\u677f proxy-providers \u66ff\u6362\u8ba2\u9605\u94fe\u63a5\uff1a${oldCount} \u2192 ${templateSources.length}\u3002`;
        } else {
          savedSources = templateSources;
        }
      }
      if (!(await prepareTemplateFromBase(savedSources, { templateBasePath: txBase, templatePath: txTemplate }))) {
        throw '\u51c6\u5907\u6a21\u677f\u5931\u8d25\uff0c\u5df2\u4fdd\u7559\u539f template.base.yaml / template.yaml';
      }
      if (!(await applyJsOverrideToTemplate({
        showToast: false,
        restart: false,
        sources: savedSources,
        prepareTemplate: false,
        templateBasePath: txBase,
        templatePath: txTemplate,
      }))) {
        throw 'JS/UI \u8986\u5199\u5e94\u7528\u5931\u8d25\uff0c\u5df2\u4fdd\u7559\u539f template.base.yaml / template.yaml';
      }
      if (templateSubSourcesToPersist.length > 0) {
        const subBackupRes = await runShellWithRoot(`
          SUB=${shellQuote(CLASH_SUB_URLS)}
          BACKUP=${shellQuote(`/data/kano_subscription_urls_before_template_${txId}.txt`)}
          if [ -f "$SUB" ]; then
            cp "$SUB" "$BACKUP" || exit 1
            echo "SUB_ROLLBACK=$BACKUP"
          else
            echo "SUB_ROLLBACK="
          fi
        `, 10 * 1000);
        if (!subBackupRes.success) {
          throw `\u5907\u4efd\u65e7\u8ba2\u9605\u94fe\u63a5\u5931\u8d25\n${subBackupRes.content || ''}`.trim();
        }
        subRollbackPath = ((String(subBackupRes.content || '').split('\n').find((line) => line.startsWith('SUB_ROLLBACK=')) || '')
          .replace(/^SUB_ROLLBACK=/, '')
          .trim());
        subSourcesPersisted = true;
        if (!(await persistSubSourcesForTemplate(
          templateSubSourcesToPersist,
          SUB_RULE_MODE_TEMPLATE,
          await readSavedSubConvertMode(),
        ))) {
          throw '\u5199\u5165\u65b0\u6a21\u677f\u5bf9\u5e94\u7684\u8ba2\u9605\u94fe\u63a5\u5931\u8d25\uff0c\u5df2\u4fdd\u7559\u539f template.base.yaml / template.yaml';
        }
      }
      const commitRes = await runShellWithRoot(`
        set -e
        BASE=${shellQuote(CLASH_TEMPLATE_BASE)}
        TEMPLATE=${shellQuote(CLASH_TEMPLATE)}
        TX_BASE=${shellQuote(txBase)}
        TX_TEMPLATE=${shellQuote(txTemplate)}
        stamp="$(date +%Y%m%d%H%M%S 2>/dev/null)"
        [ -n "$stamp" ] || stamp="$(cat /proc/uptime 2>/dev/null | cut -d. -f1)"
        backup_base="$BASE.before_template_upload_$stamp"
        backup_template="$TEMPLATE.before_template_upload_$stamp"
        base_had=0
        template_had=0
        [ -s "$TX_BASE" ] || { echo "TX_BASE_MISSING"; exit 1; }
        [ -s "$TX_TEMPLATE" ] || { echo "TX_TEMPLATE_MISSING"; exit 1; }
        if [ -f "$BASE" ]; then cp "$BASE" "$backup_base" || exit 1; base_had=1; fi
        if [ -f "$TEMPLATE" ]; then cp "$TEMPLATE" "$backup_template" || exit 1; template_had=1; fi
        rollback_template_pair() {
          if [ "$base_had" = "1" ]; then cp "$backup_base" "$BASE" 2>/dev/null || true; else rm -f "$BASE" 2>/dev/null || true; fi
          if [ "$template_had" = "1" ]; then cp "$backup_template" "$TEMPLATE" 2>/dev/null || true; else rm -f "$TEMPLATE" 2>/dev/null || true; fi
        }
        cp "$TX_BASE" "$BASE.new" && cp "$TX_TEMPLATE" "$TEMPLATE.new" || {
          rollback_template_pair
          exit 1
        }
        mv "$BASE.new" "$BASE" && mv "$TEMPLATE.new" "$TEMPLATE" || {
          rollback_template_pair
          exit 1
        }
        chmod 644 "$BASE" "$TEMPLATE"
        echo "TEMPLATE_OK"
        echo "backup_base=$backup_base"
        echo "backup_template=$backup_template"
      `);
      if (!commitRes.success || !String(commitRes.content || '').includes('TEMPLATE_OK')) {
        throw commitRes.content || '\u63d0\u4ea4\u6a21\u677f\u5931\u8d25\uff0c\u5df2\u5c1d\u8bd5\u6062\u590d\u539f\u6a21\u677f';
      }
      if (templateSubSyncMessage) {
        createToast(templateSubSyncMessage, 'yellow', 7000);
      }
      createToast('\u6a21\u677f\u5df2\u4fdd\u5b58\uff1b\u70b9\u51fb\u201c\u5e94\u7528\u6a21\u677f\u4e0e\u8986\u5199\u201d\u5199\u5165 config.yaml\u3002', 'green');
      return true;
    } catch (e) {
      console.error(e);
      if (subSourcesPersisted) {
        await runShellWithRoot(`
          SUB=${shellQuote(CLASH_SUB_URLS)}
          BACKUP=${shellQuote(subRollbackPath)}
          mkdir -p ${shellQuote(CLASH_PROXY_DIR)}
          if [ -n "$BACKUP" ] && [ -f "$BACKUP" ]; then
            cp "$BACKUP" "$SUB" 2>/dev/null || true
          else
            : > "$SUB"
          fi
          chmod 600 "$SUB" 2>/dev/null || true
        `, 10 * 1000);
      }
      createToast(
        `\u6a21\u677f\u4e0a\u4f20\u5931\u8d25<br>${textToHtml(sanitizeSubscriptionSecrets(e && e.message ? e.message : e || '\u672a\u77e5\u9519\u8bef'))}`,
        'red',
        9000,
      );
      return false;
    } finally {
      await runShellWithRoot(`
        rm -f ${shellQuote(txBase)} ${shellQuote(txTemplate)} ${shellQuote(`${txBase}.new`)} ${shellQuote(`${txTemplate}.new`)} ${shellQuote(subRollbackPath)} 2>/dev/null || true
      `, 5000);
    }
  };

  const showInfoDialog = (id, title, bodyHtml) => {
    const closeId = `close_${id}_${createRandomString(4)}`;
    const { el, close } = createFixedToast(
      `${id}_${createRandomString(4)}`,
      `<div style="pointer-events:all;width:92vw;max-width:760px;">
        <div class="title" style="margin:0">${escapeHtml(title)}</div>
        <div style="margin-top:10px;font-size:.66rem;line-height:1.65;max-height:70vh;overflow:auto;">${bodyHtml}</div>
        <div class="kano-dialog-actions kano-actions-1" style="--kano-action-count:1;margin-top:12px;">
          <button style="font-size:.64rem" id="${closeId}">\u5173\u95ed</button>
        </div>
      </div>`,
    );
    const closeBtn = el.querySelector(`#${closeId}`);
    if (closeBtn) closeBtn.onclick = close;
  };

  const showControllerSettingsDialog = async ({ afterSave = null } = {}) => {
    const info = await buildControllerInfo();
    const id = `kano_controller_settings_${createRandomString(4)}`;
    const controllerId = `${id}_controller`;
    const secretId = `${id}_secret`;
    const secretToggleId = `${id}_secret_toggle`;
    const statusId = `${id}_status`;
    const checkId = `${id}_check`;
    const saveId = `${id}_save`;
    const closeId = `${id}_close`;
    const sourceRows = [
      info.usingFallbackController
        ? '\u63a7\u5236\u5730\u5740\uff1a\u4f7f\u7528\u9ed8\u8ba4\u503c'
        : '\u63a7\u5236\u5730\u5740\uff1a\u5df2\u8bfb\u53d6\u914d\u7f6e',
      info.usingFallbackSecret
        ? '\u8bbf\u95ee\u5bc6\u94a5\uff1a\u914d\u7f6e\u4e2d\u672a\u8bbe\u7f6e'
        : '\u8bbf\u95ee\u5bc6\u94a5\uff1a\u5df2\u8bfb\u53d6\u914d\u7f6e',
    ].join('<br>');
    const { el, close } = createFixedToast(
      id,
      `<div style="pointer-events:all;width:92vw;max-width:620px;">
        <div class="title" style="margin:0">\u9762\u677f\u8fde\u63a5</div>
        <div style="margin-top:10px;font-size:.66rem;line-height:1.65;">
          <div id="${statusId}" style="margin-bottom:10px;padding:8px;border:1px solid rgba(148,163,184,.25);border-radius:10px;background:rgba(15,23,42,.45);">${sourceRows}</div>
          <label style="display:block;margin-bottom:8px;">
            <span style="display:block;margin-bottom:4px;">\u63a7\u5236\u5730\u5740</span>
            <input id="${controllerId}" type="text" autocomplete="off" style="width:100%;box-sizing:border-box;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:#0f172a;color:#dbeafe;padding:8px;font-size:.66rem;" />
          </label>
          <div style="display:block;margin-bottom:8px;">
            <span style="display:block;margin-bottom:4px;">\u8bbf\u95ee\u5bc6\u94a5</span>
            <div style="display:flex;gap:8px;align-items:center;">
              <input id="${secretId}" type="password" autocomplete="off" style="flex:1;min-width:0;box-sizing:border-box;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:#0f172a;color:#dbeafe;padding:8px;font-size:.66rem;" />
              <button id="${secretToggleId}" type="button" aria-controls="${secretId}" aria-pressed="false" title="\u663e\u793a\u5bc6\u7801" style="flex:0 0 auto;font-size:.64rem;white-space:nowrap;">\u663e\u793a</button>
            </div>
          </div>
        </div>
        <div class="kano-dialog-actions kano-actions-3" style="--kano-action-count:3;margin-top:12px;">
          <button style="font-size:.64rem" id="${checkId}">\u6d4b\u8bd5</button>
          <button style="font-size:.64rem;background:var(--dark-btn-color-active)" id="${saveId}">\u4fdd\u5b58</button>
          <button style="font-size:.64rem" id="${closeId}">\u5173\u95ed</button>
        </div>
      </div>`,
    );
    const controllerInput = el.querySelector(`#${controllerId}`);
    const secretInput = el.querySelector(`#${secretId}`);
    const secretToggleBtn = el.querySelector(`#${secretToggleId}`);
    const statusEl = el.querySelector(`#${statusId}`);
    const checkBtn = el.querySelector(`#${checkId}`);
    const saveBtn = el.querySelector(`#${saveId}`);
    const closeBtn = el.querySelector(`#${closeId}`);
    if (!controllerInput || !secretInput || !secretToggleBtn || !statusEl || !checkBtn || !saveBtn || !closeBtn) {
      close();
      return;
    }
    controllerInput.value = info.externalController;
    secretInput.value = info.secret;
    closeBtn.onclick = close;
    secretToggleBtn.onclick = () => {
      const show = secretInput.type === 'password';
      secretInput.type = show ? 'text' : 'password';
      secretToggleBtn.textContent = show ? '\u9690\u85cf' : '\u663e\u793a';
      secretToggleBtn.title = show ? '\u9690\u85cf\u5bc6\u7801' : '\u663e\u793a\u5bc6\u7801';
      secretToggleBtn.setAttribute('aria-pressed', show ? 'true' : 'false');
    };

    const setStatus = (message, color = '') => {
      statusEl.innerHTML = textToHtml(message);
      statusEl.style.color = color || '';
    };

    checkBtn.onclick = async () => {
      const checked = validateControllerSettings(controllerInput.value, secretInput.value);
      if (!checked.ok) {
        setStatus(checked.message, '#fecaca');
        return;
      }
      setButtonBusy(checkBtn, true, '\u68c0\u67e5\u4e2d\u2026');
      try {
        const res = await callMihomoApi('/version', 'GET', null, checked.info);
        setStatus(
          res.success
            ? `\u8fde\u901a\u6027\u6b63\u5e38\uff1aHTTP ${res.statusCode}`
            : `\u8fde\u901a\u6027\u5931\u8d25\uff1aHTTP ${res.statusCode || '\u65e0'}\n${res.responseText || ''}`.trim(),
          res.success ? '#bbf7d0' : '#fecaca',
        );
      } finally {
        setButtonBusy(checkBtn, false);
      }
    };

    saveBtn.onclick = async () => {
      const operationToken = acquireCriticalOperation('保存面板连接');
      if (!operationToken) return;
      setButtonBusy(saveBtn, true, '\u4fdd\u5b58\u4e2d\u2026');
      try {
        const res = await saveControllerSettings(controllerInput.value, secretInput.value);
        if (!res.ok) {
          setStatus(res.message || '\u4fdd\u5b58\u5931\u8d25', '#fecaca');
          return;
        }
        const checkText = res.connectivity && res.connectivity.success
          ? `\u8fde\u901a\u6027\u6b63\u5e38\uff1aHTTP ${res.connectivity.statusCode}`
          : `\u8fde\u901a\u6027\u5931\u8d25\uff1aHTTP ${(res.connectivity && res.connectivity.statusCode) || '\u65e0'}`;
        setStatus(`\u5df2\u4fdd\u5b58\n${checkText}`, res.connectivity && res.connectivity.success ? '#bbf7d0' : '#fde68a');
        createToast(res.connectivity && res.connectivity.success ? 'Web \u9762\u677f\u8fde\u63a5\u5df2\u4fdd\u5b58' : 'Web \u9762\u677f\u8fde\u63a5\u5df2\u4fdd\u5b58\uff0c\u4f46\u6d4b\u8bd5\u5931\u8d25', res.connectivity && res.connectivity.success ? 'green' : 'yellow', 6000);
        if (afterSave) await afterSave();
      } finally {
        setButtonBusy(saveBtn, false);
        releaseCriticalOperation(operationToken);
      }
    };
  };

  const showStatusDiagnostic = async () => {
    const controllerInfoPromise = buildControllerInfo();
    const pidPromise = getCorePid();
    const runtimeStatePromise = checkInstallState({ fresh: true });
    const bootStatePromise = inspectBootIntegration();
    const configPromise = readBinarySnapshot().then((snapshot) => {
      if (snapshot) {
        return {
          success: true,
          content: `exists=${snapshot.configExists === true ? 1 : 0}\nsize=${Number(snapshot.configSize) || 0}`,
        };
      }
      return runShellWithRoot(`
          if [ -f ${shellQuote(CLASH_CONFIG)} ]; then
            size="$(wc -c < ${shellQuote(CLASH_CONFIG)} 2>/dev/null | tr -d ' ')"
            echo "exists=1"
            echo "size=\${size:-0}"
          else
            echo "exists=0"
            echo "size=0"
          fi
          `);
    });
    const processPromise = pidPromise.then((pid) => runShellWithRoot(`
        PID=${shellQuote(String(pid || ''))}
        CORE=${shellQuote(CLASH_CORE)}
        echo "PID=$PID"
        if [ -n "$PID" ] && [ -r "/proc/$PID/cmdline" ]; then
          cmdline="$(tr '\\0' ' ' < "/proc/$PID/cmdline" 2>/dev/null)"
          comm="$(cat "/proc/$PID/comm" 2>/dev/null | tr -d '\\r\\n')"
          exe="$(readlink "/proc/$PID/exe" 2>/dev/null)"
          echo "COMM=$comm"
          echo "EXE=$exe"
          echo "CMDLINE=$cmdline"
          case " $cmdline " in *" -t "*|*" --test "*) echo "PROCESS_KIND=config_test" ;; *) echo "PROCESS_KIND=runtime" ;; esac
        else
          echo "COMM="
          echo "EXE="
          echo "CMDLINE="
          echo "PROCESS_KIND=none"
        fi
        listen=0
        if command -v ss >/dev/null 2>&1; then
          ss -lnt 2>/dev/null | grep -Eq '(^|[.:])7788[[:space:]]' && listen=1
        elif command -v netstat >/dev/null 2>&1; then
          netstat -lnt 2>/dev/null | grep -Eq '(^|[.:])7788[[:space:]]' && listen=1
        else
          awk '$2 ~ /:1E6C$/ && $4 == "0A" {found=1} END {exit found ? 0 : 1}' /proc/net/tcp /proc/net/tcp6 2>/dev/null && listen=1
        fi
        echo "PORT_7788=$listen"
        if [ -s "$CORE" ]; then
          core_size="$(wc -c < "$CORE" 2>/dev/null | tr -d ' ')"
          magic=""
          command -v od >/dev/null 2>&1 && magic="$(od -An -t x1 -N 4 "$CORE" 2>/dev/null | tr -d ' \\n')"
          echo "CORE_SIZE=\${core_size:-0}"
          [ "$magic" = "7f454c46" ] && echo "CORE_ELF=1" || echo "CORE_ELF=0"
        else
          echo "CORE_SIZE=0"
          echo "CORE_ELF=0"
        fi
        stale=""
        for p in /proc/[0-9]*; do
          [ -r "$p/cmdline" ] || continue
          exe="$(readlink "$p/exe" 2>/dev/null)"
          case "$exe" in "$CORE"|*/Clash.Core|*/mihomo) ;; *) continue ;; esac
          c="$(tr '\\0' ' ' < "$p/cmdline" 2>/dev/null)"
          case " $c " in
            *" -t "*|*" --test "*) n="\${p##*/}"; stale="\${stale:+$stale,}$n" ;;
          esac
        done
        echo "STALE_TEST_PIDS=$stale"
        `, 8 * 1000));
    const logPromise = runShellWithRoot(`
        START_LOG=${shellQuote('/data/kano_clash_start.log')}
        RUN_LOG=${shellQuote(LOG_FILE)}
        echo "[Clash.Service 启动输出]"
        if [ -f "$START_LOG" ]; then tail -n 100 "$START_LOG" 2>/dev/null; else echo "（暂无启动输出）"; fi
        echo
        echo "[Clash 内核运行日志]"
        if [ -f "$RUN_LOG" ]; then tail -n 100 "$RUN_LOG" 2>/dev/null; else echo "（暂无内核日志）"; fi
        `);
    const versionPromise = Promise.all([controllerInfoPromise, pidPromise]).then(([info, pid]) =>
      callMihomoApi('/version', 'GET', null, info, 8, { corePid: pid }));
    const connectionsPromise = Promise.all([controllerInfoPromise, pidPromise]).then(([info, pid]) =>
      callMihomoApi('/connections', 'GET', null, info, 5, { corePid: pid }));
    const [
      runtimeState,
      bootState,
      pid,
      controllerInfo,
      policyState,
      configRes,
      processRes,
      logRes,
      versionRes,
      connectionsRes,
    ] = await Promise.all([
      runtimeStatePromise,
      bootStatePromise,
      pidPromise,
      controllerInfoPromise,
      readPolicyState(),
      configPromise,
      processPromise,
      logPromise,
      versionPromise,
      connectionsPromise,
    ]);
    const configLines = String(configRes.content || '').split('\n');
    const configExists = (configLines.find((line) => line == 'exists=1'));
    const configSize = (configLines.find((line) => line.startsWith('size=')) || 'size=0')
      .replace(/^size=/, '');
    const proc = parseKeyValueOutput(processRes.content || '');
    let connectionStatus = pid
      ? (connectionsRes.success ? '已连接' : '读取失败')
      : '核心未运行';
    if (connectionsRes.success) {
      try {
        const connectionData = JSON.parse(connectionsRes.responseText || '{}');
        connectionStatus = `${Array.isArray(connectionData.connections) ? connectionData.connections.length : 0} 个`;
      } catch {
        connectionStatus = '响应格式不支持';
      }
    }
    const rows = [
      ['安装/运行状态', runtimeState.state],
      ['预检信息', runtimeState.message || '无'],
      ['开机自启', `${bootState.state}${bootState.message ? `：${bootState.message}` : ''}`],
      ['核心进程 PID', pid || '未运行'],
      ['进程类型', proc.PROCESS_KIND == 'runtime' ? '真实运行核心' : (proc.PROCESS_KIND == 'config_test' ? '配置测试进程（不计为运行）' : '无')],
      ['核心命令行', proc.CMDLINE || '无'],
      ['7788 监听', proc.PORT_7788 == '1' ? '已监听' : '未监听'],
      ['遗留测试进程', proc.STALE_TEST_PIDS || '无'],
      ['Core 文件', `${proc.CORE_SIZE || 0} bytes${proc.CORE_ELF == '1' ? '，ELF' : '，非ELF/不可识别'}`],
      ['流量接管', policyState.options.traffic_mode == 'tun' ? 'TUN' : (policyState.options.traffic_mode == 'off' ? '已关闭' : 'TProxy')],
      ['IPv6', policyState.options.ipv6 == 'on' ? '已开启' : '未开启'],
      ['config.yaml', configExists ? `存在，${configSize || 0} bytes` : '不存在'],
      ['控制地址', `${controllerInfo.externalController}${controllerInfo.usingFallbackController ? '（默认值）' : '（已读取配置）'}`],
      ['API 地址', controllerInfo.apiBase],
      ['访问密钥', controllerInfo.secretSet ? '已读取配置' : '配置中未设置'],
      ['API 连接', !pid
        ? '核心未运行'
        : (versionRes.success ? `正常（HTTP ${versionRes.statusCode}）` : versionRes.message || '控制 API 不可用')],
      ['活动连接', connectionStatus],
    ];
    const rowHtml = rows.map(([key, value]) =>
      `<div style="display:grid;grid-template-columns:minmax(96px,34%) 1fr;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.12);">
        <strong>${escapeHtml(key)}</strong><span style="word-break:break-all;">${escapeHtml(value)}</span>
      </div>`).join('');
    showInfoDialog(
      'mm_status_diagnostic',
      '运行日志/诊断',
      `${rowHtml}
      ${lastInstallDiagnostic ? '<details><summary>最近一次安装/清理详情</summary><pre style="white-space:pre-wrap">' + escapeHtml(lastInstallDiagnostic.details) + '</pre></details>' : ''}
      <div style="margin-top:12px;font-weight:700;">启动输出 + 运行日志</div>
      <pre style="white-space:pre-wrap;background:rgba(0,0,0,.78);color:#0f0;padding:10px;max-height:320px;overflow:auto;">${escapeHtml(sanitizeSubscriptionSecrets(logRes.content || '暂无日志'))}</pre>`,
    );
  };



  const sanitizeConfigForTProxy = async ({ showToast = false, errorToast = true } = {}) => {
    let runtimeOptions;
    try {
      runtimeOptions = await kprReadOptions();
    } catch (error) {
      if (errorToast) createToast(safeTextToHtml(error.message || String(error)), 'red', 9000);
      return false;
    }
    const runtimeRes = await runShellWithRoot(`
        echo "config_source=$(sed -n 's/^KANO_CONFIG_SOURCE=//p' ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} 2>/dev/null | head -n 1)"
        `, 15 * 1000);
    if (!runtimeRes.success) {
      if (errorToast) createToast(`配置自检环境读取失败<br>${safeTextToHtml(runtimeRes.content || '')}`, 'red', 9000);
      return false;
    }
    const values = {};
    String(runtimeRes.content || '').split('\n').forEach((line) => {
      const index = line.indexOf('=');
      if (index > 0) values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    });
    const trafficMode = runtimeOptions.traffic_mode;
    const ipv6Enabled = runtimeOptions.ipv6 == 'on';
    const tproxyPort = getPositivePort(runtimeOptions.tproxy_port, 7895);
    const storage = await ensurePolicyStorage();
    if (!storage.ok) {
      if (errorToast) createToast(`配置自检失败<br>${safeTextToHtml(storage.content || '')}`, 'red', 9000);
      return false;
    }

    const read = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    if (!read.ok) {
      if (errorToast) createToast(`配置自检/修复失败，原 config.yaml 未被改写<br>${safeTextToHtml(read.message || '')}`, 'red', 10000);
      return false;
    }

    let config;
    try {
      config = cloneJsonValue(read.value);
      applyRequiredF50Fields(config);

      const preserveUserRules = ['subscription_original', 'uploaded_config'].includes(values.config_source);
      if (!preserveUserRules && Array.isArray(config.rules)) {
        config.rules = removeUnsupportedCategoryGeoipRules(config.rules);
      }
      if (Object.prototype.hasOwnProperty.call(config, 'rule-providers')) {
        if (!isPlainYamlObject(config['rule-providers'])) throw new Error('rule-providers 必须是映射对象');
        const managedPaths = {
          kano_reject_domain: CLASH_SAFE_REJECT_DOMAIN_FILE,
          kano_direct_domain: CLASH_SAFE_DIRECT_DOMAIN_FILE,
          kano_direct_ip: CLASH_SAFE_DIRECT_IP_FILE,
          kano_proxy_domain: CLASH_SAFE_PROXY_DOMAIN_FILE,
        };
        if (!preserveUserRules) {
          Object.entries(managedPaths).forEach(([name, path]) => {
            if (isPlainYamlObject(config['rule-providers'][name])) config['rule-providers'][name].path = path;
          });
        }
      }
    } catch (e) {
      if (errorToast) createToast(`配置自检/修复失败，原 config.yaml 未被改写<br>${safeTextToHtml(e.message || e)}`, 'red', 10000);
      return false;
    }

    let shaped;
    try { shaped = await kprShapeRuntimeConfig(config, runtimeOptions); }
    catch (error) { if (errorToast) createToast(safeTextToHtml(error.message || String(error)), 'red', 9000); return false; }
    const write = JSON.stringify(shaped) === JSON.stringify(read.value)
      ? { ok: true }
      : await kprBaseWriteYamlObjectAtomic(CLASH_CONFIG, shaped, { label: 'config.yaml', backup: true, backupTag: 'f50_sanitize' });
    if (!write.ok) {
      if (errorToast) createToast(`配置自检/修复失败，原 config.yaml 未被改写<br>${safeTextToHtml(write.content || '')}`, 'red', 12000);
      return false;
    }
    if (showToast) {
      createToast(
        `配置已整理<br>${escapeHtml(trafficMode.toUpperCase())} · IPv6 ${ipv6Enabled ? '开启' : '关闭'} · 端口 ${tproxyPort}`,
        'green',
        6000,
      );
    }
    return true;
  };

  const buildBootstrapConfig = (secret = F50_DEFAULT_SECRET) => [
    'port: 7890',
    'socks-port: 7891',
    'mixed-port: 7892',
    'redir-port: 7893',
    'tproxy-port: 7895',
    'allow-lan: true',
    'bind-address: "*"',
    'mode: rule',
    'log-level: info',
    'ipv6: false',
    'external-controller: 0.0.0.0:7788',
    `external-ui: ${ZASHBOARD_UI_DIR}`,
    `external-ui-url: ${ZASHBOARD_UI_URL}`,
    'unified-delay: true',
    `secret: ${yamlSingleQuote(secret)}`,
    'profile:',
    '  store-selected: true',
    '  store-fake-ip: false',
    'dns:',
    '  enable: true',
    '  listen: 0.0.0.0:1053',
    '  ipv6: false',
    '  enhanced-mode: redir-host',
    '  default-nameserver:',
    '    - 223.5.5.5',
    '    - 119.29.29.29',
    '  nameserver:',
    '    - https://dns.alidns.com/dns-query',
    '    - https://doh.pub/dns-query',
    'proxies: []',
    'proxy-providers: {}',
    'proxy-groups:',
    '  - name: Proxy',
    '    type: select',
    '    proxies:',
    '      - DIRECT',
    'rules:',
    '  - IP-CIDR,0.0.0.0/8,DIRECT,no-resolve',
    '  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve',
    '  - IP-CIDR,100.64.0.0/10,DIRECT,no-resolve',
    '  - IP-CIDR,127.0.0.0/8,DIRECT,no-resolve',
    '  - IP-CIDR,169.254.0.0/16,DIRECT,no-resolve',
    '  - IP-CIDR,172.16.0.0/12,DIRECT,no-resolve',
    '  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve',
    '  - IP-CIDR,224.0.0.0/4,DIRECT,no-resolve',
    '  - GEOSITE,private,DIRECT',
    '  - GEOSITE,cn,DIRECT',
    '  - GEOIP,cn,DIRECT,no-resolve',
    '  - MATCH,DIRECT',
    '',
  ].join('\n');

  const ensureBootstrapConfig = async () => {
    const bootstrapSecret = F50_DEFAULT_SECRET;
    const yaml = buildBootstrapConfig(bootstrapSecret);
    const res = await runShellWithRoot(`
        CONFIG=${shellQuote(CLASH_CONFIG)}
        RAW=${shellQuote(KANO_SUBSCRIPTION_RAW)}
        mkdir -p ${shellQuote(CLASH_PROXY_DIR)}
        need_bootstrap=0
        reason=""
        if [ ! -s "$CONFIG" ]; then
          need_bootstrap=1
          reason="missing_or_empty"
        else
          first_line="$(sed -n '1p' "$CONFIG" 2>/dev/null | tr -d '\r' | sed 's/^[[:space:]]*//')"
          if echo "$first_line" | grep -Eq '^https?://'; then
            cp "$CONFIG" "$RAW" 2>/dev/null || true
            chmod 600 "$RAW" 2>/dev/null || true
            need_bootstrap=1
            reason="legacy_subscription_entrypoint"
          elif grep -Eq '^[[:space:]]*(port|mixed-port|redir-port|tproxy-port|external-controller|proxies|proxy-providers|rules|dns)[[:space:]]*:' "$CONFIG" 2>/dev/null; then
            echo "BOOTSTRAP_SKIPPED: yaml_exists"
            exit 0
          else
            need_bootstrap=1
            reason="invalid_or_placeholder"
          fi
        fi
        if [ "$need_bootstrap" = "1" ]; then
          stamp="$(date +%Y%m%d%H%M%S 2>/dev/null)"
          [ -n "$stamp" ] || stamp="$(cat /proc/uptime 2>/dev/null | cut -d. -f1)"
          if [ -f "$CONFIG" ]; then
            cp "$CONFIG" "$CONFIG.before_bootstrap.$stamp" 2>/dev/null || true
          fi
          CONFIG_NEW="$CONFIG.kano_bootstrap.$$"
          cleanup_bootstrap() {
            rc=$?
            trap - EXIT
            rm -f "$CONFIG_NEW" 2>/dev/null || true
            exit "$rc"
          }
          trap cleanup_bootstrap EXIT
          cat > "$CONFIG_NEW" <<'KANO_BOOTSTRAP_CONFIG'
${yaml}
KANO_BOOTSTRAP_CONFIG
          chmod 644 "$CONFIG_NEW"
          mv -f "$CONFIG_NEW" "$CONFIG" || exit 1
          ${setConfigSourceCmd('bootstrap')}
          ${pruneKanoBackupsCmd()}
          echo "BOOTSTRAP_CREATED:$reason"
        fi
        `);
    if (!res.success) {
      createToast(`\u5199\u5165\u515c\u5e95\u914d\u7f6e\u5931\u8d25<br>${safeTextToHtml(res.content || '')}`, 'red', 8000);
      return false;
    }
    if (String(res.content || '').includes('BOOTSTRAP_CREATED')) {
      createToast('已创建基础配置和 Web 面板访问密钥。', 'green', 5000);
    }
    return true;
  };

  const btn_enabled = document.createElement('button');
  btn_enabled.classList.add('btn');
  btn_enabled.textContent = '在线安装/更新';
  let disabled_btn_enabled = false;
  btn_enabled.onclick = installF50PackageFromNetwork;
  const localPackageBtn = document.createElement('button');
  localPackageBtn.classList.add('btn');
  localPackageBtn.textContent = '导入组件包';
  localPackageBtn.onclick = chooseF50Package;
  const btn_disabled = document.createElement('button');
  btn_disabled.classList.add('btn', 'kano-danger');
  btn_disabled.textContent = '卸载插件';
  const buildUninstallCmd = () => {
    const stages = buildUninstallStages();
    return stages.map(stage => '( ' + stage.script + '\n)\nprintf "F50_STAGE_RC=%s\\n" "$?"').join('\n') + '\n' + buildF50FinalCheckScript();
  };

btn_disabled.onclick = async () => {
  const operationToken = acquireCriticalOperation('\u5378\u8f7d\u732b\u732b');
  if (!operationToken) return;
  setButtonBusy(btn_disabled, true, '\u5378\u8f7d\u4e2d\u2026');
  pluginArtifactsRemoved = true;
  try {
    if (templateFlowTimer !== null) clearTimeout(templateFlowTimer);
    templateFlowTimer = null;
    templateFlowMessages.length = 0;
    const result = await performF50Uninstall();
    if (result.ok) {
      runtimePreflightCache = null; runtimePreflightLoadPromise = null; f50BackendReady = false;
      invalidateBinarySnapshot(); invalidateStatusSnapshot();
      try { localStorage.removeItem('kano_mm_web_panel_visible'); localStorage.removeItem('#collapse_mm'); } catch (_) {}
      const frame = document.getElementById('mm_iframe'); if (frame) frame.src = 'about:blank';
      renderRuntimeStatus('stopped', '\u732b\u732b - \u672a\u5b89\u88c5', document.querySelector('#running_mm'));
      const ruleStatus = document.querySelector('#mm_rule_mode_status'); if (ruleStatus) ruleStatus.textContent = '\u732b\u732b\u7ec4\u4ef6\u5df2\u5220\u9664';
    } else pluginArtifactsRemoved = false;
    operationFinish(result.ok, result.summary);
    createToast(safeTextToHtml(result.summary), result.ok ? 'green' : 'red', result.ok ? 5000 : 12000);
    return result.ok;
  } catch (error) {
    pluginArtifactsRemoved = false;
    lastInstallDiagnostic = f50Diagnostic(error?.message || String(error));
    operationFinish(false, lastInstallDiagnostic.summary);
    createToast(safeTextToHtml(lastInstallDiagnostic.summary), 'red', 12000);
    return false;
  } finally {
    setButtonBusy(btn_disabled, false);
    releaseCriticalOperation(operationToken);
  }
};


  const normalizeMac = (value = '') => {
    const text = String(value || '').replace(/#.*$/g, '').trim();
    if (!/^(?:[0-9a-f]{12}|(?:[0-9a-f]{2}:){5}[0-9a-f]{2}|(?:[0-9a-f]{2}-){5}[0-9a-f]{2}|(?:[0-9a-f]{4}\.){2}[0-9a-f]{4})$/i.test(text)) return '';
    const compact = text.replace(/[:.-]/g, '').toUpperCase();
    if (compact === '000000000000' || (parseInt(compact.slice(0, 2), 16) & 1)) return '';
    return compact.match(/.{2}/g).join(':');
  };


  const syncUnifiedDeviceBypassStorage = async () => true;





  const ensurePolicyToolsScript = async () => await ensureCompatBackend();

  const parsePolicyOptionsText = (text='')=>{
 const options={traffic_mode:'',transparent:'on',ipv6:'off',quic_block:'off',dns_hijack:'on',dns_port:'1053',tproxy_port:'7895',proxy_group:'Proxy'};
 for(const line of String(text).split(/\r?\n/)){const m=line.match(/^([A-Za-z0-9_]+)=(.*)$/);if(m)options[m[1]]=m[2]}
 if(!['tproxy','tun','off'].includes(options.traffic_mode))options.traffic_mode=options.transparent==='off'?'off':'tproxy';
 options.dns_port='1053';options.tproxy_port='7895';return options;
};

  const readPolicyState = async () => {
    const res = await runShellWithRoot(`
        set -e
        emit_policy_file() {
          name="$1"
          path="$2"
          [ -f "$path" ] || return 0
          if command -v timeout >/dev/null 2>&1; then
            timeout 5s awk -v prefix="KANO_POLICY_\${name}=" '{print prefix $0}' "$path"
          else
            awk -v prefix="KANO_POLICY_\${name}=" '{print prefix $0}' "$path"
          fi
        }
        emit_policy_file options ${shellQuote(CLASH_POLICY_OPTIONS_FILE)}
        emit_policy_file deviceBypass ${shellQuote(CLASH_DEVICE_BYPASS_FILE)}
        emit_policy_file directDomain ${shellQuote(CLASH_DIRECT_DOMAIN_FILE)}
        emit_policy_file directIp ${shellQuote(CLASH_DIRECT_IP_FILE)}
        emit_policy_file proxyDomain ${shellQuote(CLASH_PROXY_DOMAIN_FILE)}
        emit_policy_file rejectDomain ${shellQuote(CLASH_REJECT_DOMAIN_FILE)}
        `);
    if (!res.success) throw new Error('无法读取网络设置，未修改配置');
    const sections = {
      options: [],
      deviceBypass: [],
      directDomain: [],
      directIp: [],
      proxyDomain: [],
      rejectDomain: [],
    };
    if (res.success) {
      String(res.content || '').split('\n').forEach((line) => {
        const match = line.match(/^KANO_POLICY_(options|deviceBypass|directDomain|directIp|proxyDomain|rejectDomain)=(.*)$/);
        if (match) sections[match[1]].push(match[2]);
      });
    }
    return {
      options: parsePolicyOptionsText(sections.options.join('\n')),
      deviceBypass: sections.deviceBypass.join('\n'),
      directDomain: sections.directDomain.join('\n'),
      directIp: sections.directIp.join('\n'),
      proxyDomain: sections.proxyDomain.join('\n'),
      rejectDomain: sections.rejectDomain.join('\n'),
    };
  };

  const updateModeBadge = (mode) => {
    const badge = document.querySelector('#mm_mode_badge');
    if (badge) badge.textContent = mode == 'tun' ? 'TUN' : (mode == 'off' ? 'Off' : 'TProxy');
  };

  const refreshModeBadge = async () => {
    try { updateModeBadge((await readStatusSnapshot()).trafficMode); }
    catch (error) { console.error('mode status unavailable', error); }
  };

  const normalizeIpLike = (value = '') => {
    const item = String(value || '').trim();
    try {
      const parsed = KPR.cidr(item);
      if (parsed.family !== 4) return '';
      return item.includes('/') ? parsed.text : parsed.text.split('/')[0];
    } catch (_) { return ''; }
  };

  const normalizeIpv6Like = (value = '') => {
    const item = String(value || '').trim();
    try {
      const parsed = KPR.cidr(item);
      if (parsed.family !== 6) return '';
      return item.includes('/') ? parsed.text : parsed.text.split('/')[0];
    } catch (_) { return ''; }
  };

  const normalizeDeviceBypassText = (value = '') => {
    const invalid = [];
    const seen = new Set();
    const rows = [];
    String(value || '').split('\n').forEach((line, index) => {
      const raw = line.replace(/#.*$/, '').trim();
      if (!raw) return;
      const item = raw;
      if (/\s/.test(item)) { invalid.push(`${index + 1}: ${raw}`); return; }
      const mac = normalizeMac(item);
      const ip = normalizeIpLike(item);
      const ipv6 = normalizeIpv6Like(item);
      const normalized = mac || ip || ipv6;
      if (!normalized) {
        invalid.push(`${index + 1}: ${raw}`);
        return;
      }
      if (!seen.has(normalized)) {
        seen.add(normalized);
        rows.push(normalized);
      }
    });
    return { text: rows.join('\n') + (rows.length ? '\n' : ''), invalid };
  };

  const normalizeDomainRuleText = (value = '') => {
    const rows = [];
    const seen = new Set();
    String(value || '').split('\n').forEach((line) => {
      let raw = line.trim();
      if (!raw || raw.startsWith('#')) return;
      if (raw.includes(',')) {
        raw = raw.replace(/\s+/g, '');
      } else {
        raw = raw.replace(/^\+\./, '').replace(/^\./, '').toLowerCase();
        if (!raw) return;
        raw = `DOMAIN-SUFFIX,${raw}`;
      }
      if (!seen.has(raw)) {
        seen.add(raw);
        rows.push(raw);
      }
    });
    return rows.join('\n') + (rows.length ? '\n' : '');
  };

  const normalizeIpRuleText = (value = '') => {
    const rows = [];
    const seen = new Set();
    String(value || '').split('\n').forEach((line) => {
      const raw = line.trim();
      if (!raw || raw.startsWith('#')) return;
      let rule = raw.includes(',') ? raw.replace(/\s+/g, '') : '';
      if (!rule) {
        const ip = normalizeIpLike(raw);
        const ipv6 = normalizeIpv6Like(raw);
        if (!ip && !ipv6) return;
        const ipRuleTarget = ip
          ? (ip.includes('/') ? ip : `${ip}/32`)
          : (ipv6.includes('/') ? ipv6 : `${ipv6}/128`);
        rule = `${ip ? 'IP-CIDR' : 'IP-CIDR6'},${ipRuleTarget},no-resolve`;
      }
      if (!seen.has(rule)) {
        seen.add(rule);
        rows.push(rule);
      }
    });
    return rows.join('\n') + (rows.length ? '\n' : '');
  };

  const kprBaseSavePolicyState = async (state, { apply = true } = {}) => {
    if (!state.options || !['tproxy', 'tun', 'off'].includes(state.options.traffic_mode) || !Number.isInteger(Number(state.options.dns_port)) || Number(state.options.dns_port) < 1 || Number(state.options.dns_port) > 65535) {
      createToast('\u6a21\u5f0f\u6216 DNS \u7aef\u53e3\u65e0\u6548', 'red', 8000);
      return false;
    }
    const normalizedDevice = normalizeDeviceBypassText(state.deviceBypass || '');
    if (normalizedDevice.invalid.length > 0) {
      createToast(`\u8bbe\u5907\u7ed5\u8fc7\u5217\u8868\u6709\u683c\u5f0f\u9519\u8bef\uff1a<br>${textToHtml(normalizedDevice.invalid.slice(0, 8).join('\n'))}`, 'red', 8000);
      return false;
    }
    const macMirrorRows = normalizedDevice.text.split('\n')
      .map((line) => normalizeMac(line.trim()))
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) == index);
    const macMirrorText = state.options.traffic_mode === 'tproxy' ? macMirrorRows.join('\n') + (macMirrorRows.length ? '\n' : '') : '';
    const trafficMode = ['tproxy', 'tun', 'off'].includes(state.options.traffic_mode)
      ? state.options.traffic_mode
      : 'tproxy';
    const transparent = trafficMode == 'tproxy' ? 'on' : 'off';
    const ipv6 = state.options.ipv6 == 'on' ? 'on' : 'off';
    const quicBlock = state.options.quic_block == 'on' ? 'on' : 'off';
    const dnsHijack = ['tproxy', 'tun'].includes(trafficMode) && state.options.dns_hijack == 'on' ? 'on' : 'off';
    const requestedDnsPort = Number(state.options.dns_port);
    const dnsPort = Number.isInteger(requestedDnsPort) && requestedDnsPort >= 1 && requestedDnsPort <= 65535
      ? String(requestedDnsPort)
      : '1053';
    const proxyGroup = String(state.options.proxy_group || 'Proxy').replace(/[\r\n]/g, '').trim() || 'Proxy';
    const optionsText = [
      `traffic_mode=${trafficMode}`,
      `transparent=${transparent}`,
      `ipv6=${ipv6}`,
      `quic_block=${quicBlock}`,
      `dns_hijack=${dnsHijack}`,
      `dns_port=${dnsPort}`,
      `proxy_group=${proxyGroup}`,
      `private_route_enabled=${state.options.private_route_enabled || "off"}`,
      `private_route_cidrs=${state.options.private_route_cidrs || ""}`,
      `private_route_policy=${state.options.private_route_policy || ""}`,
      '',
    ].join('\n');
    const directDomain = normalizeDomainRuleText(state.directDomain || '');
    const directIp = normalizeIpRuleText(state.directIp || '');
    const proxyDomain = normalizeDomainRuleText(state.proxyDomain || '');
    const rejectDomain = normalizeDomainRuleText(state.rejectDomain || '');
    if (!(await ensurePolicyToolsScript({ syncStorage: false }))) return false;
    const bootEnabled = await checkIsBootUp();
    const policyTransactionFiles = [
      CLASH_DEVICE_BYPASS_FILE,
      CLASH_MAC_BYPASS_FILE,
      BOOT_FILE,
      CLASH_DIRECT_DOMAIN_FILE,
      CLASH_DIRECT_IP_FILE,
      CLASH_PROXY_DOMAIN_FILE,
      CLASH_REJECT_DOMAIN_FILE,
      CLASH_SAFE_DIRECT_DOMAIN_FILE,
      CLASH_SAFE_DIRECT_IP_FILE,
      CLASH_SAFE_PROXY_DOMAIN_FILE,
      CLASH_SAFE_REJECT_DOMAIN_FILE,
      CLASH_POLICY_OPTIONS_FILE,
    ];
    const snapshotPolicyFilesCmd = policyTransactionFiles
      .map((path, index) => `snapshot_transaction_file ${index} ${shellQuote(path)}`)
      .join('\n');
    const restorePolicyFilesCmd = policyTransactionFiles
      .map((path, index) => `restore_transaction_file ${index} ${shellQuote(path)} || restore_rc=1`)
      .reverse()
      .join('\n');
    const res = await runShellWithRoot(`
        set -e
        TX=/data/kano_policy_save.$$
        ${fileTransactionHelpersCmd()}
        restore_policy_transaction() {
          restore_rc=0
          ${restorePolicyFilesCmd}
          [ "$restore_rc" -eq 0 ]
        }
        finish_policy_save() {
          rc=$?
          trap - EXIT
          if [ "$rc" -ne 0 ]; then
            set +e
            restore_policy_transaction || rc=1
          fi
          rm -rf "$TX" 2>/dev/null || true
          exit "$rc"
        }
        recover_stale_transactions kano_policy_save restore_policy_transaction
        rm -rf "$TX" 2>/dev/null || true
        mkdir -p "$TX"
        trap finish_policy_save EXIT
        ${snapshotPolicyFilesCmd}
        mkdir -p ${shellQuote(CLASH_POLICY_DIR)}
        mkdir -p ${shellQuote(CLASH_PROXY_DIR)}
        write_policy_file() {
          target="$1"
          mode="$2"
          value="$3"
          staged="$target.kano_new.$$"
          rm -f "$staged" 2>/dev/null || true
          printf '%s' "$value" > "$staged" || return 1
          chmod "$mode" "$staged" 2>/dev/null || true
          mv -f "$staged" "$target" || return 1
        }
        write_policy_file ${shellQuote(CLASH_DEVICE_BYPASS_FILE)} 600 ${shellQuote(normalizedDevice.text)}
        write_policy_file ${shellQuote(CLASH_MAC_BYPASS_FILE)} 600 ${shellQuote(macMirrorText)}
        if [ -f ${shellQuote(BOOT_FILE)} ]; then
          BOOT_TMP=${shellQuote(`${BOOT_FILE}.kano`)}.$$
          awk -v line=${shellQuote(LEGACY_BOOT_MAC_BYPASS_LINE)} '$0 != line { print }' ${shellQuote(BOOT_FILE)} > "$BOOT_TMP" &&
            mv "$BOOT_TMP" ${shellQuote(BOOT_FILE)}
          rm -f "$BOOT_TMP" 2>/dev/null || true
        fi
        write_policy_file ${shellQuote(CLASH_DIRECT_DOMAIN_FILE)} 600 ${shellQuote(directDomain)}
        write_policy_file ${shellQuote(CLASH_DIRECT_IP_FILE)} 600 ${shellQuote(directIp)}
        write_policy_file ${shellQuote(CLASH_PROXY_DOMAIN_FILE)} 600 ${shellQuote(proxyDomain)}
        write_policy_file ${shellQuote(CLASH_REJECT_DOMAIN_FILE)} 600 ${shellQuote(rejectDomain)}
        ${syncSafePolicyFilesCmd()}
        write_policy_file ${shellQuote(CLASH_POLICY_OPTIONS_FILE)} 600 ${shellQuote(optionsText)}
        ${bootEnabled ? addPolicyToolsBootLineCmd() : ''}
        echo POLICY_STATE_COMMITTED
        ${apply ? `
        set +e
        ${shellQuote(CLASH_POLICY_SCRIPT)} apply
        policy_apply_rc=$?
        if [ "$policy_apply_rc" -eq 0 ]; then
          touch "$TX/committed"
          echo POLICY_RULES_APPLIED
          trap - EXIT
          rm -rf "$TX" 2>/dev/null || true
          exit 0
        fi
        echo "KANO_ERROR_STAGE=policy_apply"
        echo "KANO_ERROR_CODE=policy_apply_failed"
        trap - EXIT
        restore_policy_transaction
        policy_restore_rc=$?
        policy_recovery_rc=1
        if [ "$policy_restore_rc" -eq 0 ]; then
          ${shellQuote(CLASH_POLICY_SCRIPT)} apply
          policy_recovery_rc=$?
        fi
        if [ "$policy_restore_rc" -eq 0 ]; then
          echo "POLICY_APPLY_ROLLBACK=restored"
        else
          echo "POLICY_APPLY_ROLLBACK=restore_failed"
        fi
        if [ "$policy_recovery_rc" -eq 0 ]; then
          echo "POLICY_APPLY_RECOVERY=reapplied"
        else
          echo "POLICY_APPLY_RECOVERY=failed"
        fi
        if [ "$policy_restore_rc" -eq 0 ]; then rm -rf "$TX" 2>/dev/null || true; fi
        exit 1
        ` : `
        touch "$TX/committed"
        trap - EXIT
        rm -rf "$TX" 2>/dev/null || true
        echo POLICY_STATE_SAVED
        `}
        `, 60 * 1000);
    const policyOutput = String(res.content || '');
    if (!policyOutput.includes('POLICY_STATE_COMMITTED')) {
      createToast(`\u4fdd\u5b58\u7b56\u7565\u914d\u7f6e\u5931\u8d25<br>${safeTextToHtml(res.content || '')}`, 'red', 8000);
      return false;
    }
    invalidateBinarySnapshot();
    if (apply) {
      if (res.success && policyOutput.includes('POLICY_RULES_APPLIED')) {
        createToast('\u7b56\u7565\u89c4\u5219\u5df2\u5e94\u7528', 'green', 7000);
        return true;
      }
      const recoveryOk = policyOutput.includes('POLICY_APPLY_ROLLBACK=restored')
        && policyOutput.includes('POLICY_APPLY_RECOVERY=reapplied');
      createToast(
        recoveryOk
          ? '\u65b0\u7b56\u7565\u5e94\u7528\u5931\u8d25\uff0c\u5df2\u6062\u590d\u5e76\u91cd\u65b0\u5e94\u7528\u4e0a\u4e00\u7248\u7b56\u7565'
          : `\u65b0\u7b56\u7565\u5e94\u7528\u5931\u8d25\uff0c\u4e0a\u4e00\u7248\u7b56\u7565\u6062\u590d\u4e0d\u5b8c\u6574<br>${safeTextToHtml(policyOutput)}`,
        recoveryOk ? 'yellow' : 'red',
        10000,
      );
      return false;
    }
    if (!res.success || !policyOutput.includes('POLICY_STATE_SAVED')) {
      createToast(`\u4fdd\u5b58\u7b56\u7565\u914d\u7f6e\u5931\u8d25<br>${safeTextToHtml(policyOutput)}`, 'red', 8000);
      return false;
    }
    createToast('\u7b56\u7565\u914d\u7f6e\u5df2\u4fdd\u5b58', 'green');
    return true;
  };

  const applyPolicyToolsRules = async ({ ensureScript = true } = {}) => {
    if (ensureScript && !(await ensurePolicyToolsScript())) return false;
    if (!(await getCorePid())) {
      createToast('规则脚本已更新；核心未运行，未下发接管规则', 'yellow', 7000);
      return false;
    }
    const res = await runShellWithRoot(`${shellQuote(CLASH_POLICY_SCRIPT)} apply`);
    if (!res.success || !String(res.content || '').includes('POLICY_APPLY_OK')) {
      createToast(`\u7b56\u7565\u89c4\u5219\u5e94\u7528\u5931\u8d25<br>${safeTextToHtml(res.content || '')}`, 'red', 9000);
      return false;
    }
    createToast('\u7b56\u7565\u89c4\u5219\u5df2\u5e94\u7528', 'green', 7000);
    return true;
  };

  const reapplyPolicyRulesSilent = async ({ ensureScript = true } = {}) => {
    if (ensureScript && !(await ensurePolicyToolsScript())) return false;
    const res = await runShellWithRoot(`${shellQuote(CLASH_POLICY_SCRIPT)} apply 2>&1`);
    const ok = !!res.success && String(res.content || '').includes('POLICY_APPLY_OK');
    if (!ok) {
      const detail = sanitizeSubscriptionSecrets(String(res.content || '策略脚本未返回成功结果')).slice(-1800);
      const message = `网络策略应用失败：${detail}`;
      if (activeCriticalOperation) activeCriticalOperation.failure = message;
      createToast(safeTextToHtml(message), 'red', 12000);
    }
    return ok;
  };



  const readClientListText = async () => {
    const res = await runShellWithRoot(`
        echo "IP MAC SOURCE"
        awk 'NR>1 && $3!="0x0" && $4!="00:00:00:00:00:00" {print $1, $4, "arp"}' /proc/net/arp 2>/dev/null
        ip -4 neigh show 2>/dev/null || exit 1
        if [ -f /proc/net/if_inet6 ]; then ip -6 neigh show 2>/dev/null || exit 1; fi
        `, 8000);
    if (!res.success) throw new Error('\u65e0\u6cd5\u8bfb\u53d6\u5ba2\u6237\u7aef\u90bb\u5c45\u8868');
    const seen = new Set(), rows = ['IP MAC SOURCE'];
    for (const line of String(res.content || '').split('\n')) {
      if (/\b(?:FAILED|INCOMPLETE)\b/.test(line)) continue;
      const parts = line.trim().split(/\s+/), macAt = parts.indexOf('lladdr');
      const ip = normalizeIpLike(parts[0]) || normalizeIpv6Like(parts[0]);
      const mac = normalizeMac(macAt >= 0 ? parts[macAt + 1] : parts[1]);
      if (!ip || !mac) continue;
      const key = ip + ' ' + mac;
      if (!seen.has(key)) { seen.add(key); rows.push(key + (macAt >= 0 ? ' neigh' : ' arp')); }
    }
    return rows.join('\n');
  };

  const showPolicyStatus = async () => {
    const exists = await runShellWithRoot(`[ -x ${shellQuote(CLASH_POLICY_SCRIPT)} ] && echo 1 || echo 0`, 10 * 1000);
    if (String(exists.content || '').trim() != '1') {
      createToast('网络规则脚本不存在，请在“检查修复”中点击“重建网络规则”。', 'yellow', 7000);
      return;
    }
    const res = await runShellWithRoot(`${shellQuote(CLASH_POLICY_SCRIPT)} status`);
    showInfoDialog('mm_policy_status', '\u7f51\u7edc\u4e0e\u89c4\u5219\u72b6\u6001', `<pre style="white-space:pre-wrap;background:rgba(0,0,0,.78);color:#0f0;padding:10px;max-height:420px;overflow:auto;">${escapeHtml(res.content || '\u6682\u65e0\u72b6\u6001')}</pre>`);
  };

  const showPolicyToolsDialog = async ({ initialTab = 'network' } = {}) => {
    let state;
    try {
      state = await readPolicyState();
    } catch (error) {
      createToast(safeTextToHtml(error.message || String(error)), 'red', 10000);
      return;
    }
    const { el, close } = createFixedToast(
      'mm_policy_tools_toast',
      `
        <style>
          #kano_policy_shell{pointer-events:all;min-width:0;width:min(960px,calc(100vw - 64px));max-width:100%;box-sizing:border-box;}
          #kano_policy_shell *{box-sizing:border-box;}
          #kano_policy_shell .kp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;}
          #kano_policy_shell .kp-title{font-size:.82rem;font-weight:800;line-height:1.2;}
          #kano_policy_shell .kp-body{display:grid;grid-template-columns:170px minmax(0,1fr);gap:12px;max-height:72vh;min-height:430px;}
          #kano_policy_shell .kp-nav{border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:8px;background:rgba(255,255,255,.045);height:max-content;}
          #kano_policy_shell .kp-tab{width:100%;text-align:left;border:1px solid transparent;border-radius:10px;padding:10px 11px;margin-bottom:6px;background:transparent;color:inherit;font-size:.64rem;line-height:1.25;}
          #kano_policy_shell .kp-tab:last-child{margin-bottom:0;}
          #kano_policy_shell .kp-tab.kp-active{background:var(--dark-btn-color-active);border-color:rgba(255,255,255,.18);color:#fff;}
          #kano_policy_shell .kp-main{max-width:100%;min-width:0;overflow:auto;padding-right:4px;}
          #kano_policy_shell .kp-panel{display:none;}
          #kano_policy_shell .kp-panel.kp-show{display:block;}
          #kano_policy_shell .kp-card{min-width:0;overflow-wrap:anywhere;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:13px;background:rgba(255,255,255,.045);margin-bottom:10px;}
          #kano_policy_shell .kp-card-title{font-size:.70rem;font-weight:800;margin-bottom:8px;}
          #kano_policy_shell .kp-desc{font-size:.60rem;line-height:1.6;opacity:.72;margin:6px 0 10px;}
          #kano_policy_shell .kp-row{display:grid;grid-template-columns:140px minmax(0,1fr);gap:10px;align-items:center;padding:8px 0;border-top:1px solid rgba(255,255,255,.08);font-size:.63rem;}
          #kano_policy_shell .kp-row:first-of-type{border-top:none;}
          #kano_policy_shell .kp-label{opacity:.82;font-weight:700;}
          #kano_policy_shell input,#kano_policy_shell select,#kano_policy_shell textarea{min-width:0;max-width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(0,0,0,.45);color:inherit;outline:none;}
          #kano_policy_shell select,#kano_policy_shell input{padding:8px;}
          #kano_policy_shell textarea{width:100%;min-height:130px;padding:10px;font-family:monospace;line-height:1.45;resize:vertical;}
          #kano_policy_shell .kp-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
          #kano_policy_shell .kp-actions button,#kano_policy_shell .kp-footer button{font-size:.62rem;border-radius:9px;padding:8px 10px;}
          #kano_policy_shell .kp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
          #kano_policy_shell .kp-mini{font-size:.58rem;line-height:1.45;opacity:.68;margin-top:6px;}
          #kano_policy_shell .kp-scope-note{margin:8px 0 10px;padding:8px 10px;border:1px solid rgba(96,165,250,.25);border-radius:9px;background:rgba(30,64,175,.12);font-size:.59rem;line-height:1.55;}
          #kano_policy_shell .kp-scope-note.kp-warning{border-color:rgba(251,191,36,.35);background:rgba(120,53,15,.18);color:#fde68a;}
          #kano_policy_shell .kp-maintain-item{display:grid;grid-template-columns:170px 1fr;gap:10px;align-items:center;padding:10px 0;border-top:1px solid rgba(255,255,255,.08);}
          #kano_policy_shell .kp-maintain-item:first-of-type{border-top:none;}
          #kano_policy_shell .kp-maintain-item button{width:100%;}
          #kano_policy_shell .kp-maintain-item span{font-size:.59rem;line-height:1.55;opacity:.72;}
          #kano_policy_shell .kp-footer{margin-top:12px;display:flex;justify-content:flex-end;align-items:center;}
          #kano_policy_shell .kp-footer-right{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;}
          #kano_policy_shell .kp-footer-right button{width:auto;min-width:72px;min-height:30px;padding:5px 10px;}
          #kano_policy_shell .kp-client{display:grid;grid-template-columns:minmax(110px,1fr) minmax(130px,1fr) auto auto;gap:7px;align-items:center;border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:8px;margin-top:6px;background:rgba(0,0,0,.18);font-size:.60rem;}
          #kano_policy_shell code{font-size:.58rem;opacity:.9;}
          #kano_policy_shell button:focus-visible,#kano_policy_shell input:focus-visible,#kano_policy_shell select:focus-visible,#kano_policy_shell textarea:focus-visible{outline:2px solid #60a5fa;outline-offset:2px;}
          @media (max-width:720px){#kano_policy_shell .kp-body{grid-template-columns:1fr;max-height:76vh;}#kano_policy_shell .kp-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;}#kano_policy_shell .kp-tab{margin-bottom:0;text-align:center;}#kano_policy_shell .kp-row,#kano_policy_shell .kp-maintain-item{grid-template-columns:1fr;}#kano_policy_shell .kp-grid2{grid-template-columns:1fr;}#kano_policy_shell .kp-client{grid-template-columns:1fr 1fr;}}
        </style>
        <div id="kano_policy_shell">
          <div class="kp-head">
            <div>
              <div class="kp-title">\u7f51\u7edc\u8bbe\u7f6e</div>
            </div>
          </div>

          <div class="kp-body">
            <div class="kp-nav">
              <button type="button" class="kp-tab" data-policy-tab="network">\u6d41\u91cf\u6a21\u5f0f</button>
              <button type="button" class="kp-tab" data-policy-tab="device">\u76f4\u8fde\u8bbe\u5907</button>
              <button type="button" class="kp-tab" data-policy-tab="private">私网定向代理</button>
              <button type="button" class="kp-tab" data-policy-tab="maintain">\u68c0\u67e5\u4fee\u590d</button>
            </div>

            <div class="kp-main">
              <section class="kp-panel" data-policy-panel="network">
                <div class="kp-card">
                  <div class="kp-card-title">\u6d41\u91cf\u6a21\u5f0f</div>
                  <div class="kp-desc">TProxy \u63a5\u7ba1\u4e0b\u6e38\u8bbe\u5907\u6d41\u91cf\uff1bTUN \u7531 Mihomo \u5efa\u7acb\u8def\u7531\u3002</div>
                  <div class="kp-row">
                    <div class="kp-label">\u63a5\u7ba1\u6a21\u5f0f</div>
                    <select id="mm_policy_traffic_mode"><option value="tproxy">TProxy\uff1a\u63a5\u7ba1 F50 \u8f6c\u53d1\u6d41\u91cf</option><option value="tun">TUN\uff1aMihomo \u81ea\u52a8\u8def\u7531</option><option value="off">\u5173\u95ed\uff1a\u6838\u5fc3\u8fd0\u884c\uff0c\u6d41\u91cf\u4e0d\u63a5\u7ba1</option></select>
                  </div>
                  <div class="kp-row">
                    <div class="kp-label">IPv6</div>
                    <label><input id="mm_policy_ipv6" type="checkbox"> \u542f\u7528 IPv6 \u63a5\u7ba1\u89c4\u5219</label>
                  </div>
                  <div class="kp-row">
                    <div class="kp-label">QUIC</div>
                    <label><input id="mm_policy_quic" type="checkbox"> 拦截下游 UDP/443（直连设备、定向私网除外）</label>
                  </div>
                  <div class="kp-row">
                    <div class="kp-label">DNS \u52ab\u6301</div>
                    <label><input id="mm_policy_dns" type="checkbox"> \u52ab\u6301 53 \u5230 mihomo DNS \u7aef\u53e3 <input id="mm_policy_dns_port" readonly disabled title="固定 DNS 端口" style="width:82px;margin-left:6px;" value="1053"></label>
                  </div>
                </div>
              </section>

              <section class="kp-panel" data-policy-panel="device">
                <div class="kp-card">
                  <div class="kp-card-title">设备直连</div>
                  <div class="kp-desc">列表中的 IP、网段或 MAC 不经过代理。</div>
                  <div id="mm_policy_device_scope" class="kp-scope-note" role="status"></div>
                  <textarea id="mm_policy_device" spellcheck="false" placeholder="192.168.0.50&#10;fd00::/64&#10;AA:BB:CC:DD:EE:FF"></textarea>
                  <div class="kp-actions" style="margin-top:9px;">
                    <button type="button" id="mm_policy_scan_clients">\u626b\u63cf\u5ba2\u6237\u7aef</button>
                  </div>
                  <div id="mm_policy_clients" class="kp-mini" aria-live="polite"></div>
                </div>
              </section>

              <section class="kp-panel" data-policy-panel="private"></section>

              <section class="kp-panel" data-policy-panel="maintain">
                <div class="kp-card">
                  <div class="kp-card-title">检查修复</div>
                  <div class="kp-desc">仅在核心启动异常、切换模式后失效或网络规则未生效时使用。</div>
                  <div class="kp-maintain-item">
                    <button type="button" id="mm_policy_fix_runtime_config">\u4fee\u590d\u8fd0\u884c\u914d\u7f6e</button>
                    <span>校正 TProxy、TUN、IPv6 和 DNS 所需配置，然后重启核心；不会删除订阅或模板配置。</span>
                  </div>
                  <div class="kp-maintain-item">
                    <button type="button" id="mm_policy_repair">\u91cd\u5efa\u7f51\u7edc\u89c4\u5219</button>
                    <span>重写策略脚本并重建 KANO_* iptables/ip6tables 链；不修改 config.yaml。</span>
                  </div>
                  <div class="kp-maintain-item">
                    <button type="button" id="mm_policy_status_btn">\u67e5\u770b\u89c4\u5219\u72b6\u6001</button>
                    <span>显示实际使用的 iptables 后端、设备直连项和当前规则链，不会改动配置。</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="kp-footer">
            <div class="kp-footer-right">
              <button type="button" id="mm_policy_save_apply">\u4fdd\u5b58\u5e76\u5e94\u7528</button>
              <button type="button" id="mm_policy_close">\u5173\u95ed</button>
            </div>
          </div>
        </div>
      `,
    );

    const get = (id) => el.querySelector(id);
    const activatePolicyTab = (name) => {
      Array.from(el.querySelectorAll('[data-policy-tab]')).forEach((btn) => {
        const active = btn.dataset.policyTab == name;
        btn.classList.toggle('kp-active', active);
      });
      Array.from(el.querySelectorAll('[data-policy-panel]')).forEach((panel) => {
        const active = panel.dataset.policyPanel == name;
        panel.classList.toggle('kp-show', active);
      });
    };
    Array.from(el.querySelectorAll('[data-policy-tab]')).forEach((btn) => {
      btn.onclick = () => activatePolicyTab(btn.dataset.policyTab || 'network');
    });
    activatePolicyTab(['network', 'device', 'private', 'maintain'].includes(initialTab) ? initialTab : 'network');

    get('#mm_policy_traffic_mode').value = state.options.traffic_mode || 'tproxy';
    get('#mm_policy_ipv6').checked = state.options.ipv6 == 'on';
    get('#mm_policy_quic').checked = state.options.quic_block == 'on';
    get('#mm_policy_dns').checked = state.options.dns_hijack == 'on';
    get('#mm_policy_dns_port').value = state.options.dns_port || '1053';
    get('#mm_policy_device').value = state.deviceBypass || '';
    const updateDeviceBypassScope = () => {
      const mode = get('#mm_policy_traffic_mode').value;
      const note = get('#mm_policy_device_scope');
      const disabled = mode !== 'tproxy';
      get('#mm_policy_device').disabled = disabled;
      get('#mm_policy_scan_clients').disabled = disabled;
      if (disabled) get('#mm_policy_clients').innerHTML = '';
      note.classList.toggle('kp-warning', disabled);
      setText(note, mode === 'tun'
        ? 'TUN \u4f7f\u7528\u56fa\u5b9a\u8def\u7531\u63a5\u7ba1\uff0c\u8bbe\u5907\u7ed5\u8fc7\u5df2\u6682\u505c\u3002\u540d\u5355\u4fdd\u7559\uff0c\u5207\u56de TProxy \u81ea\u52a8\u6062\u590d\u3002'
        : mode === 'off' ? '\u6d41\u91cf\u63a5\u7ba1\u5df2\u5173\u95ed\uff0c\u540d\u5355\u4fdd\u7559\u4f46\u4e0d\u751f\u6548\u3002'
        : '名单优先于私网代理；IP 只匹配该地址，MAC 匹配它的全部 IP。勿将下级路由器 MAC 当作单台设备。');
    };
    get('#mm_policy_traffic_mode').addEventListener('change', updateDeviceBypassScope);
    updateDeviceBypassScope();

    get('#mm_policy_close').onclick = close;
    const appendDeviceBypassValue = (value = '') => {
      const item = String(value || '').trim();
      if (!item || get('#mm_policy_device').disabled) return;
      const textarea = get('#mm_policy_device');
      const rows = String(textarea.value || '').split('\n').map((row) => row.trim()).filter(Boolean);
      if (!rows.some((row) => row.toUpperCase() == item.toUpperCase())) rows.push(item);
      textarea.value = rows.join('\n') + (rows.length ? '\n' : '');
    };
    get('#mm_policy_scan_clients').onclick = async () => {
      const scanBtn = get('#mm_policy_scan_clients');
      const box = get('#mm_policy_clients');
      setButtonBusy(scanBtn, true, '扫描中…');
      setText(box, '\u626b\u63cf\u4e2d...');
      try {
        const text = await readClientListText();
        if (get('#mm_policy_traffic_mode').value !== 'tproxy') return;
        const lines = String(text || '').split('\n').filter(line => {
          const [ip, mac] = line.trim().split(/\s+/);
          return (normalizeIpLike(ip) || normalizeIpv6Like(ip)) && normalizeMac(mac);
        });
        const macCounts = new Map();
        for (const line of lines) { const [ip, mac] = line.trim().split(/\s+/); const key=normalizeMac(mac); if(!macCounts.has(key))macCounts.set(key,new Set());macCounts.get(key).add(ip); }
        resetChildren(box);
        if (lines.length == 0) {
          setText(box, '\u6ca1\u6709\u626b\u63cf\u5230\u5ba2\u6237\u7aef\u3002\u8bbe\u5907\u9700\u8981\u5148\u4ea7\u751f\u6d41\u91cf\uff0cARP \u8868\u91cc\u624d\u4f1a\u51fa\u73b0\u3002');
          return;
        }
        lines.forEach((line) => {
          const [ip, mac] = line.trim().split(/\s+/);
          const row = document.createElement('div');
          row.className = 'kp-client';
          const ipEl = document.createElement('span');
          ipEl.textContent = ip || '';
          const macEl = document.createElement('span');
          macEl.textContent = (mac || '') + ' (' + (macCounts.get(normalizeMac(mac))?.size || 0) + ' IP)';
          const addIp = document.createElement('button');
          addIp.className = 'add_ip';
          addIp.style.fontSize = '.58rem';
          addIp.dataset.ip = ip || '';
          addIp.textContent = '\u52a0 IP';
          const addMac = document.createElement('button');
          addMac.className = 'add_mac';
          addMac.title = '此 MAC 的全部 IPv4/IPv6；路由器可能代表多台设备';
          addMac.style.fontSize = '.58rem';
          addMac.dataset.mac = mac || '';
          addMac.textContent = '\u52a0 MAC';
          row.appendChild(ipEl);
          row.appendChild(macEl);
          row.appendChild(addIp);
          row.appendChild(addMac);
          box.appendChild(row);
        });
        Array.from(box.querySelectorAll('.add_ip')).forEach((btn) => {
          btn.onclick = () => appendDeviceBypassValue(btn.dataset.ip);
        });
        Array.from(box.querySelectorAll('.add_mac')).forEach((btn) => {
          btn.onclick = async () => {
            const value = normalizeMac(btn.dataset.mac);
            if (!value || get('#mm_policy_device').disabled) return;
            const yes = await askConfirm('mm_mac_scope', '按 MAC 直连？', '会包含此 MAC 的全部 IP；下级路由器可能代表多台终端。');
            if (yes) appendDeviceBypassValue(value);
          };
        });
      } catch (error) {
        setText(box, error.message || String(error));
      } finally {
        setButtonBusy(scanBtn, false);
        updateDeviceBypassScope();
      }
    };

    get('#mm_policy_fix_runtime_config').onclick = async () => {
      const btn = get('#mm_policy_fix_runtime_config');
      const operationToken = acquireCriticalOperation('修复代理配置');
      if (!operationToken) return;
      setButtonBusy(btn, true, '\u4fee\u590d\u4e2d\u2026');
      try {
        await restartClashOk({ skipCheck: true });
      } finally {
        setButtonBusy(btn, false);
        releaseCriticalOperation(operationToken);
      }
    };

    get('#mm_policy_repair').onclick = async () => {
      const btn = get('#mm_policy_repair');
      const operationToken = acquireCriticalOperation('修复策略规则');
      if (!operationToken) return;
      setButtonBusy(btn, true, '应用中…');
      try {
        if (await ensurePolicyToolsScript()) await applyPolicyToolsRules({ ensureScript: false });
      } finally {
        setButtonBusy(btn, false);
        releaseCriticalOperation(operationToken);
      }
    };
    get('#mm_policy_status_btn').onclick = async () => {
      const btn = get('#mm_policy_status_btn');
      setButtonBusy(btn, true, '读取中…');
      try {
        await showPolicyStatus();
      } finally {
        setButtonBusy(btn, false);
      }
    };
    const panel = el.querySelector('[data-policy-panel="private"]');
    if (!panel) return;
    const card = document.createElement('div');
    card.className = 'kp-card';
    card.innerHTML = '<div class="kp-card-title">私网定向代理</div>' +
      '<div class="kp-desc">仅将指定的目标私网交给所选代理组，其他私网仍保持直连。支持下游设备访问远端 IPv4/IPv6 TCP、UDP 服务；ping 不经过代理，不能用于验证。</div>' +
      '<div class="kp-row"><label class="kp-label" for="kpr_enabled">定向代理</label><label><input id="kpr_enabled" type="checkbox"> 代理以下网段</label></div>' +
      '<div class="kp-row"><label class="kp-label" for="kpr_cidrs">目标私网</label><textarea id="kpr_cidrs" spellcheck="false" placeholder="192.168.11.0/24&#10;fd11:22:33::/64" style="min-height:78px"></textarea></div>' +
      '<div class="kp-row"><label class="kp-label" for="kpr_policy">代理组</label><select id="kpr_policy"></select></div>' +
      '<div class="kp-mini">每行填写一个 IPv4 私网或 IPv6 ULA 网段（fc00::/7）。IPv6 网段需先启用上方的 IPv6 接管。目标网段不能与本地局域网重叠；例如，填写 192.168.11.0/24 不会代理 192.168.10.0/24。请将所选代理组切换到能够访问目标私网的节点。</div>' +
      '<div class="kp-mini">TUN 模式下，目标私网的 DNS/53 流量保持原目标，不使用 Mihomo 全局 dns-hijack。普通 DNS 接管请启用上方的“DNS 劫持”。TUN 模式仍不支持“直连设备”绕过。</div>' +
      '<div class="kp-actions" style="margin-top:10px"><button id="kpr_status" type="button">检查定向规则</button></div>';
    panel.appendChild(card);
    const feature = KPR.fromOptions(state.options);
    get('#kpr_enabled').checked = feature.enabled;
    get('#kpr_cidrs').value = feature.cidrs.join('\n') || '192.168.11.0/24';
    const config = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    const names = config.ok ? [...(config.value['proxy-groups'] || []), ...(config.value.proxies || [])]
      .filter((p) => p && p.name && !['direct', 'reject'].includes(String(p.type || '').toLowerCase())).map((p) => p.name) : [];
    const available = [...new Set(['', ...names, ...(feature.policy ? [feature.policy] : [])])];
    for (const name of available) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name || '请选择代理组';
      get('#kpr_policy').appendChild(option);
    }
    get('#kpr_policy').value = feature.policy || (names.includes('家宽') ? '家宽' : '');
    get('#kpr_status').onclick = async () => {
      const response = await runShellWithRoot('if [ -x ' + shellQuote(CLASH_POLICY_SCRIPT) + ' ]; then ' + shellQuote(CLASH_POLICY_SCRIPT) + ' private-status; else echo PRIVATE_ROUTE_SCRIPT_MISSING; fi', 15000);
      let liveStatus;
      try {
        const savedOptions = await kprReadOptions();
        const leaf = await kprVerifySelection(savedOptions);
        liveStatus = leaf ? '实际出站：' + leaf : '私网定向代理未启用';
      } catch (error) { liveStatus = '运行检查失败：' + (error.message || String(error)); }
      showInfoDialog('kpr_status_dialog', '私网定向代理检查', '<pre style="white-space:pre-wrap">' + escapeHtml(liveStatus + '\n' + (response.content || '无输出')) + '</pre><p>规则存在不等于远端服务可达；请从下游访问实际 TCP/UDP 服务验证。</p>');
    };
    get('#mm_policy_save_apply').onclick = async () => {
      const token = acquireCriticalOperation('保存网络与私网设置');
      if (!token) return;
      const button = get('#mm_policy_save_apply');
      setButtonBusy(button, true, '应用中…');
      try {
        const selected = KPR.normalize({ enabled: get('#kpr_enabled').checked, cidrs: get('#kpr_cidrs').value, policy: get('#kpr_policy').value });
        const next = { ...state, options: { ...state.options,
          traffic_mode: get('#mm_policy_traffic_mode').value,
          ipv6: get('#mm_policy_ipv6').checked ? 'on' : 'off',
          quic_block: get('#mm_policy_quic').checked ? 'on' : 'off',
          dns_hijack: get('#mm_policy_dns').checked ? 'on' : 'off',
          dns_port: get('#mm_policy_dns_port').value,
          private_route_enabled: selected.enabled ? 'on' : 'off',
          private_route_cidrs: selected.cidrs.join(' '),
          private_route_policy: selected.policy,
        }, deviceBypass: get('#mm_policy_device').value };
        if (!(await kprSaveNetworkState(state, next))) {
          get('#mm_policy_traffic_mode').value = state.options.traffic_mode;
          get('#mm_policy_ipv6').checked = state.options.ipv6 === 'on';
          get('#mm_policy_quic').checked = state.options.quic_block === 'on';
          get('#mm_policy_dns').checked = state.options.dns_hijack === 'on';
          get('#mm_policy_dns_port').value = '1053';
          get('#mm_policy_device').value = state.deviceBypass || '';
          get('#kpr_enabled').checked = state.options.private_route_enabled === 'on';
          get('#kpr_cidrs').value = state.options.private_route_cidrs || '';
          get('#kpr_policy').value = state.options.private_route_policy || '';
          get('#mm_policy_traffic_mode').dispatchEvent(new Event('change'));
        }
      } catch (error) {
        createToast(safeTextToHtml(error.message || String(error)), 'red', 10000);
      } finally {
        setButtonBusy(button, false);
        releaseCriticalOperation(token);
      }
    };
  };

  const stopClash = async () => await networkRescue({stopService:true,showOutput:false,reason:'停止核心'});


  const restartClash = async ({ skipCheck = false, preferReload = false, policyReady = false, preparedConfig = null } = {}) => {
  if (!skipCheck && !(await ensureReady())) return f50StartResult({success:false,content:'F50_START_CODE=backend_not_ready'});
  operationStage('\u9a8c\u8bc1\u56fa\u5b9a\u914d\u7f6e\u5e76\u542f\u52a8\u6838\u5fc3');
  if (preparedConfig) {
    const write = await writeYamlObjectAtomic(CLASH_CONFIG, preparedConfig, {label:'config.yaml',backup:false});
    if (!write.ok) return f50StartResult({success:false,content:'F50_START_CODE=config_write_failed\n' + (write.content || '')});
  }
  const result = await startClashServiceClean({stopFirst:true});
  invalidateStatusSnapshot(); invalidateBinarySnapshot(); runtimePreflightCache = null; runtimePreflightLoadPromise = null;
  if (!result.ok) {
    lastInstallDiagnostic = {...f50Diagnostic(result.detail), ok:false, code:result.code};
    operationFinish(false, result.summary);
    createToast(safeTextToHtml(result.summary), 'red', 12000);
    return result;
  }
  const refresh = await Promise.allSettled([
    buildControllerInfo({fresh:true}), isMMRunning(),
    typeof refreshDashboardAfterModeChange === 'function' ? refreshDashboardAfterModeChange() : Promise.resolve(),
  ]);
  result.warnings = refresh.filter(item => item.status === 'rejected').map(item => f50Diagnostic(item.reason?.message || String(item.reason)).summary);
  createToast(result.summary, 'green');
  return result;
};
  const restartClashOk = async options => (await restartClash(options)).ok;

  const btn_restart = document.createElement('button');
  btn_restart.classList.add('btn');
  btn_restart.textContent = '\u91cd\u542f\u6838\u5fc3';
  btn_restart.onclick = async () => {
    await runCriticalOperation('重启核心', async () => {
      setButtonBusy(btn_restart, true, '重启中…');
      try {
        return await restartClashOk();
      } finally {
        setButtonBusy(btn_restart, false);
      }
    });
  };

  //\u4e00\u952e\u4e0a\u4f20
  const uploadEl = document.createElement('input');
  uploadEl.type = 'file';
  uploadEl.accept = '.yaml,.yml,text/yaml,text/plain';
  uploadEl.onchange = async (e) => {
    try {
      if (!e || !e.target || !e.target.files) return;
      const file = e.target.files[0];
      if (!file) return;
      if (!(await ensureReady())) return;
      // \u68c0\u67e5\u6587\u4ef6\u5927\u5c0f
      if (file.size > 2 * 1024 * 1024) {
        createToast(`\u6a21\u677f\u6587\u4ef6\u5927\u5c0f\u4e0d\u80fd\u8d85\u8fc7${2}MB\uff01`, 'red');
        return;
      }
      await runCriticalOperation('上传模板', async () => saveTemplate(file));
    } finally {
      uploadEl.value = '';
    }
  };

  const restoreConfigPackageFromFile = async (file) => {
    const txId = `${Date.now()}_${createRandomString(6)}`;
    const backupFiles = configPackageBackupFiles();
    const restoreFiles = [
      ...backupFiles.filter((item) => item.label != 'config.yaml'),
      ...backupFiles.filter((item) => item.label == 'config.yaml'),
    ];
    const requiredNames = backupFiles.map((item) => item.label);
    const restoreOrderText = restoreFiles.map((item) => item.label).join('\n');
    const confirmed = await askConfirm(
      `mm_config_package_restore_confirm_${createRandomString(4)}`,
      '\u5bfc\u5165\u914d\u7f6e\u5305\uff1f',
      `\u5c06\u6309\u4ee5\u4e0b\u987a\u5e8f\u56de\u704c\u914d\u7f6e\u6587\u4ef6\uff1a<br>${textToHtml(restoreOrderText)}<br><br>\u7f3a\u5c11\u4efb\u610f\u5fc5\u8981\u6587\u4ef6\u65f6\u4e0d\u4f1a\u8986\u76d6\u73b0\u6709\u914d\u7f6e\u3002`,
      '\u5f00\u59cb\u5bfc\u5165',
      '\u53d6\u6d88',
    );
    if (!confirmed) return false;

    const isZipPackage = /\.zip$/i.test(file.name || '');
    const isTarPackage = /\.(tar\.gz|tgz)$/i.test(file.name || '');
    if (!isZipPackage && !isTarPackage) {
      createToast('\u53ea\u652f\u6301\u5bfc\u5165 .tar.gz / .tgz / .zip \u914d\u7f6e\u5305', 'red');
      return false;
    }
    if (file.size > 8 * 1024 * 1024) {
      createToast('\u914d\u7f6e\u5305\u5927\u5c0f\u4e0d\u80fd\u8d85\u8fc7 8 MB', 'red');
      return false;
    }

    const oldControllerInfo = await buildControllerInfo();
    const rollbackPath = await createConfigRollbackPoint('config_package_restore');
    if (rollbackPath === null) {
      createToast('无法创建 config.yaml 回滚点，已取消配置包导入。', 'red', 9000);
      return false;
    }
    let uploadedPath = '';
    try {
      uploadedPath = await uploadFileToDevice(file);
    } catch (e) {
      createToast(`\u914d\u7f6e\u5305\u4e0a\u4f20\u5931\u8d25<br>${safeTextToHtml(e && e.message ? e.message : e)}`, 'red', 9000);
      return false;
    }
    const requiredNamesCmd = requiredNames.map((name) => shellQuote(name)).join(' ');
    const restoreStageFilesCmd = restoreFiles.map((item) => {
      const mode = '600';
      return `
        stage_restore_file ${shellQuote(item.label)} ${shellQuote(item.path)} ${shellQuote(mode)}
        `;
    }).join('');
    const restoreCommitFilesCmd = restoreFiles.map((item) => `
        commit_restore_file ${shellQuote(item.label)} ${shellQuote(item.path)}
        `).join('');
    const restoreRollbackFilesCmd = restoreFiles.slice().reverse().map((item) => `
        rollback_restore_file ${shellQuote(item.label)} ${shellQuote(item.path)}
        `).join('');
    const restorePostRollbackFilesCmd = restoreFiles.slice().reverse().map((item) => {
      const mode = '600';
      return `
        name=${shellQuote(item.label)}
        dst=${shellQuote(item.path)}
        staged="$dst.kano_post_restore.$$"
        if [ -f "$ROLLBACK_DIR/$name.had" ] && [ -f "$ROLLBACK_DIR/$name" ]; then
          cp "$ROLLBACK_DIR/$name" "$staged" && chmod ${shellQuote(mode)} "$staged" 2>/dev/null && mv -f "$staged" "$dst" || exit 1
        elif [ -f "$ROLLBACK_DIR/$name.absent" ]; then
          rm -f "$dst" || exit 1
        fi
        `;
    }).join('');
    const restoreRes = await runShellWithRoot(`
        set +e
        SRC=${shellQuote(uploadedPath)}
        STAGE=${shellQuote(`/data/kano_config_package_restore_${txId}`)}
        ROLLBACK_DIR=${shellQuote(`/data/kano_config_package_restore_${txId}_rollback`)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        COMMIT_STARTED=0
        COMMIT_DONE=0
        rollback_restore_file() {
          name="$1"
          dst="$2"
          staged="$dst.kano_restore.$$"
          rm -f "$staged" 2>/dev/null || true
          if [ -f "$ROLLBACK_DIR/$name.had" ] && [ -f "$ROLLBACK_DIR/$name" ]; then
            cp "$ROLLBACK_DIR/$name" "$staged" 2>/dev/null && mv -f "$staged" "$dst" 2>/dev/null || true
          elif [ -f "$ROLLBACK_DIR/$name.absent" ]; then
            rm -f "$dst" 2>/dev/null || true
          fi
        }
        cleanup_restore_transaction() {
          rc=$?
          trap - EXIT
          if [ "$rc" -ne 0 ] && [ "$COMMIT_STARTED" = "1" ] && [ "$COMMIT_DONE" != "1" ]; then
            ${restoreRollbackFilesCmd}
            echo "RESTORE_TRANSACTION_ROLLED_BACK"
          fi
          rm -rf "$STAGE" 2>/dev/null || true
          if [ "$rc" -ne 0 ]; then rm -rf "$ROLLBACK_DIR" 2>/dev/null || true; fi
          rm -f "$SRC" 2>/dev/null || true
          exit "$rc"
        }
        trap cleanup_restore_transaction EXIT
        [ -s "$SRC" ] || { echo "RESTORE_FAILED: uploaded package missing"; exit 1; }
        rm -rf "$STAGE" "$ROLLBACK_DIR" 2>/dev/null || true
        mkdir -p "$STAGE" "$ROLLBACK_DIR" ${shellQuote(CLASH_PROXY_DIR)} ${shellQuote(`${CLASH_DIR}/Tools`)} || exit 1
        if [ ${shellQuote(isZipPackage ? '1' : '0')} = '1' ]; then
          command -v unzip >/dev/null 2>&1 || { echo "RESTORE_FAILED: unzip missing"; exit 1; }
          unzip -t "$SRC" >/data/kano_config_package_archive_test.out 2>&1 || {
            echo "RESTORE_FAILED: zip integrity test failed"
            cat /data/kano_config_package_archive_test.out 2>/dev/null || true
            exit 1
          }
          archive_names="$(unzip -Z1 "$SRC" 2>/dev/null || true)"
          if [ -n "$archive_names" ] && printf '%s\\n' "$archive_names" | grep -Eq '(^/|(^|/)\\.\\.(/|$))'; then
            echo "RESTORE_FAILED: unsafe zip path detected"
            exit 1
          fi
          unzip -q "$SRC" -d "$STAGE" || { echo "RESTORE_FAILED: unzip failed"; exit 1; }
        else
          command -v tar >/dev/null 2>&1 || { echo "RESTORE_FAILED: tar missing"; exit 1; }
          tar -tzf "$SRC" >/data/kano_config_package_archive_list.out 2>&1 || {
            echo "RESTORE_FAILED: tar integrity test failed"
            cat /data/kano_config_package_archive_list.out 2>/dev/null || true
            exit 1
          }
          if grep -Eq '(^/|(^|/)\\.\\.(/|$))' /data/kano_config_package_archive_list.out; then
            echo "RESTORE_FAILED: unsafe tar path detected"
            exit 1
          fi
          tar -xzf "$SRC" -C "$STAGE" || { echo "RESTORE_FAILED: tar failed"; exit 1; }
        fi
        if find "$STAGE" -type l 2>/dev/null | grep -q .; then
          echo "RESTORE_FAILED: package contains symbolic links"
          exit 1
        fi
        if find "$STAGE" ! -type f ! -type d 2>/dev/null | grep -q .; then
          echo "RESTORE_FAILED: package contains unsupported file types"
          exit 1
        fi
        stage_kb="$(du -sk "$STAGE" 2>/dev/null | awk '{print $1}')"
        echo "$stage_kb" | grep -Eq '^[0-9]+$' || stage_kb=0
        [ "$stage_kb" -le 32768 ] || { echo "RESTORE_FAILED: extracted package exceeds 32 MiB"; exit 1; }
        missing=0
        for name in ${requiredNamesCmd}; do
          if [ ! -f "$STAGE/$name" ]; then
            echo "RESTORE_MISSING: $name"
            missing=1
          fi
        done
        [ "$missing" -eq 0 ] || exit 2
        for name in ${requiredNamesCmd}; do
          file_size="$(wc -c < "$STAGE/$name" 2>/dev/null || echo 0)"
          echo "$file_size" | grep -Eq '^[0-9]+$' || file_size=0
          [ "$file_size" -le 8388608 ] || { echo "RESTORE_FAILED: $name exceeds 8 MiB"; exit 1; }
        done
        [ -s "$STAGE/config.yaml" ] || { echo "RESTORE_FAILED: config.yaml empty"; exit 1; }
        ${requireMikeFarahYqV4Cmd()}
        for yaml_file in "$STAGE/config.yaml" "$STAGE/template.yaml" "$STAGE/template.base.yaml"; do
          "$YQ" e '.' "$yaml_file" >/dev/null 2>/data/kano_config_package_yaml_test.out || {
            echo "RESTORE_FAILED: invalid YAML in $(basename "$yaml_file")"
            cat /data/kano_config_package_yaml_test.out 2>/dev/null || true
            exit 1
          }
          root_type="$("$YQ" e 'type' "$yaml_file" 2>/dev/null)"
          [ "$root_type" = "!!map" ] || {
            echo "RESTORE_FAILED: $(basename "$yaml_file") root must be a map"
            exit 1
          }
        done
        for json_file in "$STAGE/rule_override.json" "$STAGE/rule_override_applied.json"; do
          if command -v jq >/dev/null 2>&1; then
            jq -e 'type == "object"' "$json_file" >/dev/null 2>&1 || { echo "RESTORE_FAILED: invalid JSON object in $(basename "$json_file")"; exit 1; }
          else
            "$YQ" e -e 'type == "!!map"' "$json_file" >/dev/null 2>&1 || { echo "RESTORE_FAILED: invalid JSON object in $(basename "$json_file")"; exit 1; }
          fi
        done
        override_size="$(wc -c < "$STAGE/override.js" 2>/dev/null || echo 0)"
        echo "$override_size" | grep -Eq '^[0-9]+$' || override_size=0
        [ "$override_size" -le 20000 ] || { echo "RESTORE_FAILED: override.js exceeds 20 KiB"; exit 1; }
        stage_restore_file() {
          name="$1"
          dst="$2"
          mode="$3"
          src="$STAGE/$name"
          staged="$dst.kano_restore.$$"
          mkdir -p "$(dirname "$dst")" || return 1
          if [ -e "$dst" ]; then
            cp "$dst" "$ROLLBACK_DIR/$name" || return 1
            touch "$ROLLBACK_DIR/$name.had" || return 1
          else
            touch "$ROLLBACK_DIR/$name.absent" || return 1
          fi
          cp "$src" "$staged" || return 1
          chmod "$mode" "$staged" 2>/dev/null || true
          echo "STAGED: $name"
        }
        commit_restore_file() {
          name="$1"
          dst="$2"
          staged="$dst.kano_restore.$$"
          [ -f "$staged" ] || return 1
          mv -f "$staged" "$dst" || return 1
          echo "RESTORED: $name"
        }
        ${restoreStageFilesCmd}
        COMMIT_STARTED=1
        ${restoreCommitFilesCmd}
        COMMIT_DONE=1
        sync 2>/dev/null || true
        ${pruneKanoBackupsCmd()}
        rm -f /data/kano_config_package_archive_test.out /data/kano_config_package_archive_list.out /data/kano_config_package_yaml_test.out 2>/dev/null || true
        echo "RESTORE_ROLLBACK_DIR=$ROLLBACK_DIR"
        echo "RESTORE_DONE"
        `, 90 * 1000);
    const restoreOutput = String(restoreRes.content || '');
    if (!restoreRes.success || !restoreOutput.includes('RESTORE_DONE')) {
      const missingFiles = restoreOutput
        .split('\n')
        .filter((line) => line.startsWith('RESTORE_MISSING: '))
        .map((line) => line.replace(/^RESTORE_MISSING: /, '').trim())
        .filter(Boolean);
      if (missingFiles.length > 0) {
        createToast(`\u914d\u7f6e\u5305\u7f3a\u5c11\u6587\u4ef6\uff0c\u5df2\u505c\u6b62\u5bfc\u5165<br>${textToHtml(missingFiles.join('\n'))}`, 'red', 10000);
      } else {
        createToast(`\u914d\u7f6e\u5305\u5bfc\u5165\u5931\u8d25<br>${safeTextToHtml(restoreOutput)}`, 'red', 10000);
      }
      return false;
    }

    const packageRollbackDir = ((restoreOutput.split('\n').find((line) => line.startsWith('RESTORE_ROLLBACK_DIR=')) || '')
      .replace(/^RESTORE_ROLLBACK_DIR=/, '')
      .trim());
    const restoreOriginalConfigOnly = async (context) => {
      if (rollbackPath) return await restoreConfigRollbackPoint(rollbackPath, context, { showToast: false });
      const removed = await runShellWithRoot(`
        rm -f ${shellQuote(CLASH_CONFIG)} 2>/dev/null || exit 1
        [ ! -e ${shellQuote(CLASH_CONFIG)} ] || exit 1
        echo CONFIG_ROLLBACK_RESTORED_ABSENT
      `, 15 * 1000);
      return removed.success && String(removed.content || '').includes('CONFIG_ROLLBACK_RESTORED_ABSENT');
    };
    const rollbackRestoredPackage = async (context = '配置包导入', detail = '') => {
      if (!packageRollbackDir) {
        const configRestored = await restoreOriginalConfigOnly(context);
        createToast(
          `${escapeHtml(context)}失败；完整配置包回滚点缺失，config.yaml ${configRestored ? '已恢复' : '未能恢复'}`,
          'red',
          10000,
        );
        return false;
      }
      const rollbackRes = await runShellWithRoot(`
        set +e
        ROLLBACK_DIR=${shellQuote(packageRollbackDir)}
        [ -d "$ROLLBACK_DIR" ] || { echo "PACKAGE_ROLLBACK_MISSING: $ROLLBACK_DIR"; exit 1; }
        ${restorePostRollbackFilesCmd}
        sync 2>/dev/null || true
        rm -rf "$ROLLBACK_DIR" 2>/dev/null || true
        echo "PACKAGE_RESTORE_ROLLED_BACK"
      `, 45 * 1000);
      if (!rollbackRes.success || !String(rollbackRes.content || '').includes('PACKAGE_RESTORE_ROLLED_BACK')) {
        const configRestored = await restoreOriginalConfigOnly(context);
        createToast(
          `${escapeHtml(context)}失败，且完整配置包回滚失败；config.yaml ${configRestored ? '已单独恢复' : '也未能恢复'}<br>${safeTextToHtml(rollbackRes.content || detail || '')}`,
          'red',
          10000,
        );
        return false;
      }
      const sanitized = await sanitizeConfigForTProxy({ showToast: false, errorToast: false });
      const reload = sanitized ? await reloadConfigHot(oldControllerInfo) : { success: false };
      const runtimeRecovered = reload.success
        ? await reapplyPolicyRulesSilent()
        : await restartClashOk({ skipCheck: true });
      createToast(
        `${escapeHtml(context)}失败，已恢复导入前的配置${runtimeRecovered ? '和运行状态' : '；核心或网络策略未能恢复'}${detail ? `<br>${safeTextToHtml(detail)}` : ''}`,
        runtimeRecovered ? 'yellow' : 'red',
        9000,
      );
      return runtimeRecovered;
    };

    if (!(await sanitizeConfigForTProxy({ showToast: false, errorToast: false }))) {
      await rollbackRestoredPackage('导入配置包清理');
      return false;
    }
    const reloadRes = await reloadConfigHot(oldControllerInfo);
    let runningOk = reloadRes.success;
    if (!runningOk) {
      createToast(`\u70ed\u91cd\u8f7d\u5931\u8d25\uff0c\u5df2\u6539\u7528\u670d\u52a1\u91cd\u542f<br>${safeTextToHtml(reloadRes.responseText || reloadRes.content || '')}`, 'yellow');
      runningOk = await restartClashOk({ skipCheck: true });
    } else {
      runningOk = await reapplyPolicyRulesSilent();
    }
    if (!runningOk) {
      await rollbackRestoredPackage('导入配置包后启动');
      return false;
    }

    if (packageRollbackDir) {
      await runShellWithRoot(`rm -rf ${shellQuote(packageRollbackDir)} 2>/dev/null || true`);
    }
    const restoredFiles = restoreOutput
      .split('\n')
      .filter((line) => line.startsWith('RESTORED: '))
      .map((line) => line.replace(/^RESTORED: /, '').trim())
      .filter(Boolean);
    createToast(`\u914d\u7f6e\u5305\u5df2\u56de\u704c<br>\u5df2\u6062\u590d\uff1a${textToHtml(restoredFiles.join('\n') || restoreOrderText)}`, 'green', 9000);
    if (refreshSubscriptionAfterRestore) await refreshSubscriptionAfterRestore();
    return true;
  };

  const packageUploadEl = document.createElement('input');
  packageUploadEl.type = 'file';
  packageUploadEl.accept = '.tar.gz,.tgz,.zip,application/gzip,application/zip';
  packageUploadEl.onchange = async (e) => {
    try {
      if (!e || !e.target || !e.target.files) return;
      const file = e.target.files[0];
      if (!file) return;
      if (!(await ensureReady())) return;
      await runCriticalOperation('导入配置包', async () => restoreConfigPackageFromFile(file));
    } finally {
      packageUploadEl.value = '';
    }
  };


  const stopBtn = document.createElement('button');
  stopBtn.classList.add('btn');
  stopBtn.textContent = '\u505c\u6b62\u6838\u5fc3';
  stopBtn.onclick = async () => {
    await runCriticalOperation('停止核心', async () => {
      setButtonBusy(stopBtn, true, '停止中…');
      try {
        return await stopClash();
      } finally {
        setButtonBusy(stopBtn, false);
      }
    });
  };

  const backupBtn = document.createElement('button');
  backupBtn.classList.add('btn');
  backupBtn.textContent = '\u5bfc\u51fa\u914d\u7f6e';
  backupBtn.onclick = async () => {
    if (!(await ensureReady())) return;
    const operationToken = acquireCriticalOperation('导出配置包');
    if (!operationToken) return;
    setButtonBusy(backupBtn, true, '导出中…');
    try {
    createToast('\u6b63\u5728\u5bfc\u51fa\u732b\u732b\u914d\u7f6e\u5305...', 'green');
    const t = Math.floor(Date.now() + Math.random());
    const backupFiles = configPackageBackupFiles();
    const defaultOverrideJsForBackup = buildDefaultOverrideJs();
    const defaultRuleOverrideJsonForBackup = JSON.stringify(defaultRuleOverrideConfig(), null, 2) + '\n';
    const copyBackupFilesCmd = backupFiles.map((item) => `
        copy_backup_file ${shellQuote(item.path)} ${shellQuote(item.label)}
        `).join('');
    const res = await runShellWithRoot(`
        set -e
        UPLOAD_DIR=${shellQuote(`${F50_FILES_DIR}/uploads`)}
        PKG_DIR="$UPLOAD_DIR/mm_config_package_${t}"
        PKG_BASE="$UPLOAD_DIR/mm_config_package_${t}"
        mkdir -p "$UPLOAD_DIR"
        rm -rf "$UPLOAD_DIR"/mm_config_package_* 2>/dev/null || true
        mkdir -p "$PKG_DIR"
        packed_count=0
        copy_backup_file() {
          src="$1"
          name="$2"
          if [ -f "$src" ]; then
            cp "$src" "$PKG_DIR/$name" || exit 1
            chmod 644 "$PKG_DIR/$name" 2>/dev/null || true
            packed_count=$((packed_count + 1))
            echo "PACKED: $name"
            return 0
          fi
          case "$name" in
            config.yaml)
              echo "MISSING_REQUIRED: $name"
              return 1
              ;;
            template.yaml)
              cp "$PKG_DIR/config.yaml" "$PKG_DIR/$name" || return 1
              ;;
            template.base.yaml)
              cp "$PKG_DIR/template.yaml" "$PKG_DIR/$name" || return 1
              ;;
            subscription_urls.txt)
              printf '%s\n' '# KANO_SUB_RULE_MODE=template' > "$PKG_DIR/$name" || return 1
              ;;
            override.js)
              printf '%s' ${shellQuote(defaultOverrideJsForBackup)} > "$PKG_DIR/$name" || return 1
              ;;
            rule_override.json|rule_override_applied.json)
              printf '%s' ${shellQuote(defaultRuleOverrideJsonForBackup)} > "$PKG_DIR/$name" || return 1
              ;;
            *)
              echo "MISSING_REQUIRED: $name"
              return 1
              ;;
          esac
          chmod 644 "$PKG_DIR/$name" 2>/dev/null || true
          packed_count=$((packed_count + 1))
          echo "DEFAULTED: $name"
        }
        ${copyBackupFilesCmd}
        [ "$packed_count" -eq ${backupFiles.length} ] || {
          echo "PACK_FAILED: incomplete package ($packed_count/${backupFiles.length})"
          exit 1
        }
        if command -v tar >/dev/null 2>&1; then
          PKG="$PKG_BASE.tar.gz"
          (cd "$PKG_DIR" && tar -czf "$PKG" .)
        elif command -v zip >/dev/null 2>&1; then
          PKG="$PKG_BASE.zip"
          (cd "$PKG_DIR" && zip -q -r "$PKG" .)
        else
          echo "PACK_FAILED: tar/zip missing"
          exit 1
        fi
        rm -rf "$PKG_DIR" 2>/dev/null || true
        chmod 644 "$PKG" 2>/dev/null || true
        [ -s "$PKG" ] || { echo "PACK_FAILED: empty package"; exit 1; }
        echo "PACKAGE_NAME=$(basename "$PKG")"
        `, 30 * 1000);
    if (!res.success) return createToast(`\u5907\u4efd\u5931\u8d25<br>${safeTextToHtml(res.content || '')}`, 'red');
    const outputLines = String(res.content || '').split('\n');
    const packageName = ((outputLines.find((line) => line.startsWith('PACKAGE_NAME=')) || '')
      .replace(/^PACKAGE_NAME=/, '')
      .trim()) || `mm_config_package_${t}.tar.gz`;
    const packedFiles = outputLines
      .filter((line) => line.startsWith('PACKED: '))
      .map((line) => line.replace(/^PACKED: /, '').trim())
      .filter(Boolean);
    const defaultedFiles = outputLines
      .filter((line) => line.startsWith('DEFAULTED: '))
      .map((line) => line.replace(/^DEFAULTED: /, '').trim())
      .filter(Boolean);
    createToast(
      `配置包已导出<br>包含：${textToHtml([...packedFiles, ...defaultedFiles].join('\n') || '无')}` +
        (defaultedFiles.length ? `<br>已补默认文件：${textToHtml(defaultedFiles.join('\n'))}` : ''),
      defaultedFiles.length ? 'yellow' : 'green',
      8000,
    );
    const a = document.createElement('a');
    a.download = `\u732b\u732b\u914d\u7f6e\u5907\u4efd\u5305_${t}${packageName.endsWith('.zip') ? '.zip' : '.tar.gz'}`;
    a.href = `/api/uploads/${encodeURIComponent(packageName)}`;
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => {
      runShellWithRoot(`rm -f ${shellQuote(`${F50_FILES_DIR}/uploads/${packageName}`)} 2>/dev/null || true`).catch(() => {});
    }, 5 * 60 * 1000);
    } finally {
      setButtonBusy(backupBtn, false);
      releaseCriticalOperation(operationToken);
    }
  };

  (async () => {
    let waitTimes = 0;
    while (!document.querySelector('.functions-container') && waitTimes < 100) {
      await wait(100);
      waitTimes++;
    }
    const mmContainer = document.querySelector('.functions-container');
    if (!mmContainer) {
      createToast('\u732b\u732b\u5165\u53e3\u521d\u59cb\u5316\u5931\u8d25\uff1a\u672a\u83b7\u53d6\u5230 F50 \u9875\u9762\u5bb9\u5668\u3002', 'red');
      return;
    }
    const oldPanel = document.querySelector('#IFRAME_KANO');
    if (oldPanel) oldPanel.remove();
    const oldStyle = document.querySelector('#kano_mm_style');
    if (oldStyle) oldStyle.remove();
    const style = document.createElement('style');
    style.id = 'kano_mm_style';
    style.textContent = `
      #IFRAME_KANO{width:100%;margin-top:12px;}
      #IFRAME_KANO *{box-sizing:border-box;}
      #IFRAME_KANO .kano-mm-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0;padding:8px 10px;border-radius:14px;background:linear-gradient(135deg,rgba(15,23,42,.72),rgba(30,41,59,.38));border:1px solid rgba(148,163,184,.20);}
      #IFRAME_KANO .kano-mm-title-left{display:flex;align-items:center;gap:8px;min-width:0;}
      #IFRAME_KANO .kano-mm-badge{font-size:.58rem;padding:3px 8px;border-radius:999px;background:rgba(59,130,246,.16);border:1px solid rgba(147,197,253,.28);color:#bfdbfe;white-space:nowrap;}
      #IFRAME_KANO .kano-mm-box{padding:10px;border:1px solid rgba(148,163,184,.18);border-radius:16px;background:rgba(15,23,42,.36);}
      #IFRAME_KANO .kano-mm-overview{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-bottom:10px;align-items:stretch;}
      #IFRAME_KANO .kano-mm-status{font-size:.58rem;line-height:1.55;margin:0;padding:7px 9px;border:1px solid rgba(96,165,250,.22);border-radius:12px;background:rgba(15,23,42,.46);color:#bfdbfe;}
      #IFRAME_KANO .kano-mm-task-status{display:flex;align-items:center;justify-content:center;min-width:96px;padding:7px 10px;border:1px solid rgba(148,163,184,.22);border-radius:12px;background:rgba(15,23,42,.46);color:#cbd5e1;font-size:.58rem;line-height:1.55;white-space:nowrap;}
      #IFRAME_KANO .kano-mm-task-status[data-state="running"]{border-color:rgba(251,191,36,.34);background:rgba(120,53,15,.28);color:#fde68a;}
      #mm_action_box{margin-bottom:10px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;align-items:start;}
      #IFRAME_KANO .kano-action-group{min-width:0;border:1px solid rgba(148,163,184,.18);border-radius:14px;background:rgba(15,23,42,.44);overflow:hidden;}
      #IFRAME_KANO .kano-action-group>summary{cursor:pointer;list-style:none;min-height:32px;padding:7px 9px;font-size:.62rem;font-weight:800;letter-spacing:.01em;color:#dbeafe;background:rgba(30,41,59,.55);display:flex;align-items:center;justify-content:space-between;gap:8px;}
      #IFRAME_KANO .kano-action-group>summary::after{content:'+';font-size:.72rem;opacity:.72;}
      #IFRAME_KANO .kano-action-group[open]>summary::after{content:'-';}
      #IFRAME_KANO .kano-action-group[open]>summary{background:rgba(37,99,235,.20);border-bottom:1px solid rgba(96,165,250,.18);color:#eff6ff;}
      #IFRAME_KANO .kano-action-group>summary::-webkit-details-marker{display:none;}
      #IFRAME_KANO .kano-action-inner{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:7px;}
      #IFRAME_KANO .kano-action-inner.kano-action-inner-odd>button:last-child{grid-column:1/-1;}
      #IFRAME_KANO .kano-action-inner button{display:flex;align-items:center;justify-content:center;width:100%;min-width:0;min-height:32px;line-height:1.2;text-align:center;font-size:.61rem;}
      #IFRAME_KANO button{border:1px solid rgba(148,163,184,.25);border-radius:9px;padding:5px 9px;background:linear-gradient(180deg,rgba(51,65,85,.94),rgba(30,41,59,.94));color:#e5edf7;box-shadow:0 1px 0 rgba(255,255,255,.06) inset;}
      #IFRAME_KANO button:hover{filter:brightness(1.08);}
      #IFRAME_KANO button:disabled{opacity:.55;filter:grayscale(.35);}
      #IFRAME_KANO button:focus-visible,#IFRAME_KANO summary:focus-visible{outline:2px solid #60a5fa;outline-offset:2px;}
      #IFRAME_KANO .kano-danger{background:linear-gradient(180deg,rgba(127,29,29,.95),rgba(69,10,10,.95));border-color:rgba(252,165,165,.35);}
      #IFRAME_KANO .kano-primary{background:linear-gradient(180deg,rgba(37,99,235,.95),rgba(30,64,175,.95));border-color:rgba(147,197,253,.35);}
      #IFRAME_KANO .kano-mm-web-panel{border:1px solid rgba(148,163,184,.18);border-radius:16px;background:rgba(15,23,42,.38);overflow:hidden;}
      #IFRAME_KANO .kano-mm-web-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;font-size:.58rem;opacity:.78;border-bottom:1px solid rgba(148,163,184,.14);}
      #IFRAME_KANO #mm_iframe{border:none;padding:0;margin:0;width:100%;height:70vh;min-height:420px;max-height:720px;display:block;background:#0f172a;}
      .kano-dialog-actions{display:flex;justify-content:flex-end;align-items:center;gap:8px;flex-wrap:wrap;width:auto;margin-left:auto;}
      .kano-dialog-actions>button{flex:0 0 auto;width:auto;min-width:68px;min-height:30px;padding:5px 10px;}
      .kano-log-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;max-width:440px;margin-left:auto;}
      .kano-log-actions>button{width:100%;min-width:0;min-height:30px;padding:5px 8px;}
      .kano-dialog-menu{display:grid;gap:9px;margin-top:12px;}
      .kano-dialog-menu-section{padding:9px;border:1px solid rgba(148,163,184,.20);border-radius:10px;background:rgba(15,23,42,.28);}
      .kano-dialog-menu-title{margin-bottom:7px;font-size:.59rem;font-weight:800;color:#bfdbfe;}
      .kano-dialog-menu-grid{display:grid;grid-template-columns:repeat(var(--kano-menu-cols,2),minmax(0,1fr));gap:7px;}
      .kano-dialog-menu-grid>button{width:100%;min-width:0;min-height:32px;padding:5px 8px;font-size:.62rem;}
      .kano-yaml-editor:focus{border-color:rgba(96,165,250,.75)!important;box-shadow:0 0 0 2px rgba(59,130,246,.22);}
      @media (max-width:1100px){#mm_action_box{grid-template-columns:repeat(2,minmax(0,1fr));}}
      @media (max-width:600px){#mm_action_box{grid-template-columns:1fr;}#IFRAME_KANO .kano-mm-overview{grid-template-columns:1fr;}#IFRAME_KANO .kano-mm-task-status{justify-content:flex-start;}#IFRAME_KANO #mm_iframe{min-height:360px;height:65vh;}.kano-dialog-actions.kano-actions-4{display:grid;grid-template-columns:repeat(2,max-content);}.kano-log-actions{grid-template-columns:repeat(2,minmax(0,1fr));max-width:260px;}}
      @media (max-width:420px){#IFRAME_KANO .kano-action-inner{grid-template-columns:1fr;}}
    `;
    document.head.appendChild(style);

    mmContainer.insertAdjacentHTML(
      'afterend',
      `
<div id="IFRAME_KANO" class="kano-mm-root">
    <div class="title kano-mm-title">
        <div class="kano-mm-title-left"><strong id="running_mm">\u732b\u732b</strong><span class="kano-mm-badge" id="mm_mode_badge">TProxy</span></div>
        <div style="display:inline-block;" id="collapse_mm_btn"></div>
    </div>
    <div class="collapse" id="collapse_mm" data-name="close" style="height:0px;overflow:hidden;">
        <div class="collapse_box kano-mm-box">
            <div class="kano-mm-overview">
              <div id="mm_rule_mode_status" class="kano-mm-status">\u914d\u7f6e\u72b6\u6001\uff1a\u8bfb\u53d6\u4e2d\u2026</div>
              <div id="mm_task_status" class="kano-mm-task-status" data-state="idle" aria-live="polite">任务：空闲</div>
            </div>
            <div id="mm_action_box"></div>
            <div id="mm_web_panel_wrap" class="kano-mm-web-panel">
              <div class="kano-mm-web-head"><span>\u5185\u5d4c Web \u9762\u677f</span></div>
              <iframe id="mm_iframe" src="about:blank"></iframe>
            </div>
        </div>
    </div>
</div>
`,
    );
    syncCriticalOperationStatus();

    refreshDashboardAfterModeChange = async () => {
      if (isWebPanelVisible()) await refreshPanel({ forceReload: true });
    };
    const WEB_VISIBLE_KEY = 'kano_mm_web_panel_visible';
    const isWebPanelVisible = () => localStorage.getItem(WEB_VISIBLE_KEY) != 'hidden';
    let webPanelToggleBtn = null;
    let panelLoadRequestId = 0;
    let panelLoadPromise = null;
    const setWebPanelVisible = async (visible, { load = true } = {}) => {
      const wrap = document.querySelector('#mm_web_panel_wrap');
      const iframe = document.querySelector('#mm_iframe');
      if (!wrap || !iframe) return;
      localStorage.setItem(WEB_VISIBLE_KEY, visible ? 'visible' : 'hidden');
      wrap.style.display = visible ? '' : 'none';
      if (typeof webPanelToggleBtn != 'undefined' && webPanelToggleBtn) {
        webPanelToggleBtn.textContent = visible ? '\u9690\u85cf\u9762\u677f' : '\u663e\u793a\u9762\u677f';
        webPanelToggleBtn.classList.toggle('kano-primary', visible);
      }
      if (visible && load && localStorage.getItem('#collapse_mm') == 'open') {
        await refreshPanel({ forceReload: false });
      }
      if (!visible) {
        panelLoadRequestId++;
        iframe.src = 'about:blank';
      }
    };
    const refreshPanel = async ({ forceShow = false, forceReload = true } = {}) => {
      if (forceShow) await setWebPanelVisible(true, { load: false });
      if (!isWebPanelVisible()) {
        createToast('面板已隐藏，请先点击“显示面板”。', 'yellow', 4500);
        return;
      }
      const iframe = document.querySelector('#mm_iframe');
      if (!iframe) return;
      const currentSrc = iframe.getAttribute('src');
      if (!forceReload && currentSrc && currentSrc != 'about:blank' && currentSrc != 'javascript:;') return;
      const requestId = ++panelLoadRequestId;
      if (!panelLoadPromise) {
        panelLoadPromise = buildPanelUrl().finally(() => { panelLoadPromise = null; });
      }
      const url = await panelLoadPromise;
      if (requestId == panelLoadRequestId && isWebPanelVisible()
          && localStorage.getItem('#collapse_mm') == 'open'
          && document.querySelector('#mm_iframe') == iframe) {
        iframe.src = url;
      }
    };

    const refresh = document.createElement('button');
    refresh.classList.add('btn');
    refresh.textContent = '刷新面板';
    refresh.onclick = async () => refreshPanel();

    webPanelToggleBtn = document.createElement('button');
    webPanelToggleBtn.classList.add('btn');
    webPanelToggleBtn.textContent = isWebPanelVisible() ? '\u9690\u85cf\u9762\u677f' : '\u663e\u793a\u9762\u677f';
    webPanelToggleBtn.onclick = async () => {
      await setWebPanelVisible(!isWebPanelVisible(), { load: true });
    };

    const open = document.createElement('button');
    open.classList.add('btn');
    open.textContent = '打开新窗口';
    open.onclick = async () => {
      const panelWindow = window.open('about:blank', '_blank');
      if (!panelWindow) {
        createToast('浏览器阻止了新窗口，请允许此页面打开弹窗。', 'yellow', 7000);
        return;
      }
      try {
        panelWindow.opener = null;
        panelWindow.location.replace(await buildPanelUrl());
      } catch (error) {
        panelWindow.close();
        createToast(`打开面板失败<br>${safeTextToHtml(error.message || String(error))}`, 'red', 8000);
      }
    };

    const controllerSettingsBtn = document.createElement('button');
    controllerSettingsBtn.classList.add('btn');
    controllerSettingsBtn.textContent = '面板连接';
    controllerSettingsBtn.onclick = async () => {
      if (!(await ensureReady({ readOnly: true }))) return;
      await showControllerSettingsDialog({
        afterSave: async () => {
          if (isWebPanelVisible()) await refreshPanel();
          await isMMRunning();
        },
      });
    };

    const boot_on = document.createElement('button');
    boot_on.id = 'clash_boot_on';
    boot_on.classList.add('btn');
    boot_on.textContent = '\u5f00\u673a\u81ea\u542f';
    boot_on.style.background = '';
    const applyBootButtonState = (state) => {
      const status = state && state.state || 'disabled';
      boot_on.dataset.bootState = status;
      boot_on.style.background = status == 'disabled' ? '' : 'var(--dark-btn-color-active)';
      boot_on.textContent = '开机自启';
      boot_on.title = state && state.message || '';
    };
    boot_on.addEventListener('click', async () => {
      if (!(await ensureReady({ readOnly: true }))) return;
      const operationToken = acquireCriticalOperation('修改开机自启');
      if (!operationToken) return;
      setButtonBusy(boot_on, true, '处理中…');
      try {
        const before = await inspectBootIntegration();
        const disable = before.enabled && before.state != 'incomplete' && before.state != 'manager_damaged';
        if (!disable && (!(await ensureServiceWrapper()).success || !(await ensurePolicyToolsScript()))) {
          createToast('自启组件修复失败，请重试', 'red');
          return;
        }
        const result = await runShellWithRoot(disable ? removeBootLinesCmd() : addBootLinesCmd());
        if (!result.success) {
          createToast(`修改开机自启失败<br>${safeTextToHtml(result.content || '')}`, 'red', 8000);
          return;
        }
        const after = await inspectBootIntegration();
        applyBootButtonState(after);
        const color = after.state == 'direct' || after.state == 'disabled' ? 'green' : 'yellow';
        createToast(
          after.state == 'disabled'
            ? '\u5df2\u53d6\u6d88\u5f00\u673a\u81ea\u542f'
            : `${escapeHtml(after.message)}<br>使用 UFI-TOOLS 原生 ufi_tools_boot.sh 启动。`,
          color,
          8000,
        );
      } finally {
        setButtonBusy(boot_on, false);
        releaseCriticalOperation(operationToken);
      }
    });

    inspectBootIntegration()
      .then(applyBootButtonState)
      .catch((error) => console.error('[KANO] 开机自启状态检查失败:', error));

    const showLogBtn = document.createElement('button');
    showLogBtn.classList.add('btn');
    showLogBtn.textContent = '状态与日志';
    showLogBtn.onclick = async () => {
      if (lastInstallDiagnostic && !lastInstallDiagnostic.ok && !lastInstallDiagnostic.viewed) {
        lastInstallDiagnostic.viewed = true;
        showInfoDialog('mm_last_install_failure', lastInstallDiagnostic.summary,
          '<pre style="white-space:pre-wrap;overflow-wrap:anywhere">' + escapeHtml(lastInstallDiagnostic.details) + '</pre>');
        return;
      }
      if (!(await ensureAdvanced())) return;
      setButtonBusy(showLogBtn, true, '读取中…');
      try {
        await showStatusDiagnostic();
      } finally {
        setButtonBusy(showLogBtn, false);
      }
    };

    const userAgentBtn = document.createElement('button');
    userAgentBtn.classList.add('btn');
    userAgentBtn.textContent = '订阅请求头';
    userAgentBtn.onclick = async () => {
      if (!(await ensureReady({ readOnly: true }))) return;
      const currentValue = await loadProviderUserAgent({ fresh: true });
      const storedCustom = currentValue == KANO_PROVIDER_USER_AGENT ? '' : currentValue;
      const { el, close } = createFixedToast(
        'mm_provider_user_agent',
        `
          <div style="pointer-events:all;width:86vw;max-width:720px;">
            <div class="title" style="margin:0">订阅请求头</div>
            <div style="margin:14px 0 8px;font-size:.62rem;line-height:1.55;opacity:.82;">
              设置订阅请求使用的 User-Agent；留空使用默认值 ${escapeHtml(KANO_PROVIDER_USER_AGENT)}，下次更新生效。
            </div>
            <input id="mm_provider_user_agent_input" type="text" maxlength="512" spellcheck="false"
              placeholder="${escapeHtml(KANO_PROVIDER_USER_AGENT)}"
              value="${escapeHtml(storedCustom)}"
              style="box-sizing:border-box;width:100%;padding:10px;background:#111827;color:#dbeafe;border:1px solid rgba(148,163,184,.35);border-radius:8px;">
            <div class="kano-dialog-actions kano-actions-2" style="--kano-action-count:2;margin-top:12px;">
              <button id="mm_provider_user_agent_save" style="font-size:.64rem">保存</button>
              <button id="mm_provider_user_agent_close" style="font-size:.64rem">关闭</button>
            </div>
          </div>
        `,
      );
      const input = el.querySelector('#mm_provider_user_agent_input');
      const saveBtn = el.querySelector('#mm_provider_user_agent_save');
      el.querySelector('#mm_provider_user_agent_close').onclick = close;
      saveBtn.onclick = async () => {
        const operationToken = acquireCriticalOperation('保存订阅 User-Agent');
        if (!operationToken) return;
        setButtonBusy(saveBtn, true, '保存中…');
        try {
          const result = await persistProviderUserAgent(input.value);
          if (!result.ok) {
            createToast(`订阅 User-Agent 保存失败<br>${safeTextToHtml(result.message || '')}`, 'red', 8000);
            return;
          }
          createToast(
            result.custom
              ? '订阅 User-Agent 已保存，下次更新时生效'
              : `已恢复默认 User-Agent：${escapeHtml(KANO_PROVIDER_USER_AGENT)}`,
            'green',
            6000,
          );
          close();
        } finally {
          setButtonBusy(saveBtn, false);
          releaseCriticalOperation(operationToken);
        }
      };
      input.focus();
    };

    const rescueBtn = document.createElement('button');
    rescueBtn.classList.add('btn', 'kano-danger');
    rescueBtn.textContent = '\u6062\u590d\u7f51\u7edc';
    rescueBtn.onclick = async () => {
      if (!(await ensureAdvanced())) return;
      const confirmed = await askConfirm(
        'mm_network_rescue_confirm',
        '\u6267\u884c\u65ad\u7f51\u6062\u590d\uff1f',
        '\u5c06\u505c\u6b62\u6838\u5fc3\u5e76\u6e05\u7406\u63d2\u4ef6\u521b\u5efa\u7684 KANO_* iptables \u89c4\u5219\uff0c\u7528\u4e8e\u6062\u590d\u89c4\u5219\u6b8b\u7559\u5bfc\u81f4\u7684\u65ad\u7f51\u3002',
        '\u6267\u884c\u6062\u590d',
        '\u53d6\u6d88',
      );
      if (!confirmed) return;

      setButtonBusy(rescueBtn, true, '\u6062\u590d\u4e2d\u2026');
      try {
        await networkRescue({ stopService: true, showOutput: true, preempt: true, reason: '\u624b\u52a8\u65ad\u7f51\u6062\u590d' });
      } finally {
        setButtonBusy(rescueBtn, false);

      }
    };

    const clearCacheBtn = document.createElement('button');
    clearCacheBtn.classList.add('btn');
    clearCacheBtn.textContent = '\u6e05\u7406\u7f13\u5b58';
    clearCacheBtn.onclick = async () => {
      if (!(await ensureAdvanced())) return;
      const confirmed = await askConfirm(
        'mm_clear_cache_confirm',
        '\u6e05\u7406 mihomo \u7f13\u5b58\uff1f',
        '\u4f1a\u901a\u8fc7 Mihomo API \u5237\u65b0 DNS / Fake-IP \u7f13\u5b58\uff0c\u5e76\u6e05\u7406 provider \u4e34\u65f6\u6587\u4ef6\u3001\u7a7a\u7f13\u5b58\u548c\u4e0b\u8f7d\u6b8b\u7559\uff1b\u4e0d\u4f1a\u5220\u9664\u6709\u6548\u8282\u70b9\u7f13\u5b58\u3001config.yaml\u3001template.yaml\u3001\u8ba2\u9605\u94fe\u63a5\u6216\u8986\u5199\u6587\u4ef6\u3002',
        '\u6e05\u7406\u7f13\u5b58',
        '\u53d6\u6d88',
      );
      if (!confirmed) return;
      const operationToken = acquireCriticalOperation('清理缓存');
      if (!operationToken) return;
      setButtonBusy(clearCacheBtn, true, '\u6e05\u7406\u4e2d\u2026');
      try {
        const runtimeResults = await flushMihomoRuntimeCaches();
        const res = await runDangerousShellWithRoot(`
          set +e
          RECOVERY_ARCHIVE=${shellQuote(DOWNLOAD_ZIP)}
          RECOVERY_ARCHIVE_STATUS=missing
          if [ -s "$RECOVERY_ARCHIVE" ]; then
            UNZIP_BIN=""
            for candidate in ${shellQuote(`${KANO_INSTALL_TOOLBOX_BIN}/unzip`)} "$(command -v unzip 2>/dev/null)"; do
              [ -n "$candidate" ] && [ -x "$candidate" ] || continue
              UNZIP_BIN="$candidate"
              break
            done
            if [ -n "$UNZIP_BIN" ] && "$UNZIP_BIN" -t "$RECOVERY_ARCHIVE" >/dev/null 2>&1; then
              RECOVERY_ARCHIVE_STATUS=retained
            else
              rm -f "$RECOVERY_ARCHIVE" 2>/dev/null || true
              RECOVERY_ARCHIVE_STATUS=removed_invalid
            fi
          fi
          rm -f ${shellQuote(DOWNLOAD_LOG)} 2>/dev/null || true
          rm -f /data/kano_mihomo_api_*.out /data/kano_mihomo_api_*.err /data/kano_yaml_after_override.yaml /data/kano_ui_rules_*.txt /data/kano_ui_rules_patch.yaml /data/kano_subscription_* 2>/dev/null || true
          rm -f ${shellQuote(CLASH_PROXY_DIR)}/proxies/*.tmp ${shellQuote(CLASH_PROXY_DIR)}/proxies/*.bak 2>/dev/null || true
          for EMPTY_CACHE in ${shellQuote(CLASH_PROXY_DIR)}/proxies/*.yaml; do
            [ -f "$EMPTY_CACHE" ] && [ ! -s "$EMPTY_CACHE" ] && rm -f "$EMPTY_CACHE" 2>/dev/null || true
          done
          echo "RECOVERY_ARCHIVE_STATUS=$RECOVERY_ARCHIVE_STATUS"
          echo "CACHE_CLEAN_DONE"
        `, 20 * 1000, 'clear_cache');
        const runtimeLines = runtimeResults.map((item) => {
          if (item.success) return `${item.label}\uff1a\u5df2\u5237\u65b0`;
          if (item.errorType == 'core_not_running') return `${item.label}：已跳过（核心未运行）`;
          if (item.statusCode == 404 || item.statusCode == 405) return `${item.label}\uff1a\u5f53\u524d\u5185\u6838\u4e0d\u652f\u6301`;
          return `${item.label}\uff1a${item.message || '\u5237\u65b0\u5931\u8d25'}`;
        });
        const runtimeOk = runtimeResults.every((item) =>
          item.success || item.errorType == 'core_not_running' || item.statusCode == 404 || item.statusCode == 405);
        const allOk = res.success && runtimeOk;
        const archiveStatus = (String(res.content || '').match(/(?:^|\n)RECOVERY_ARCHIVE_STATUS=([^\n]+)/) || [])[1] || 'unknown';
        const archiveLine = archiveStatus == 'retained'
          ? '离线自愈包：已保留'
          : archiveStatus == 'removed_invalid'
            ? '离线自愈包：损坏文件已清理'
            : '离线自愈包：当前不存在';
        createToast(
          `${allOk ? '\u7f13\u5b58\u5df2\u6e05\u7406' : '\u7f13\u5b58\u6e05\u7406\u90e8\u5206\u5b8c\u6210'}<br>${textToHtml([...runtimeLines, archiveLine, res.success ? '\u4e34\u65f6\u6587\u4ef6\uff1a\u5df2\u6e05\u7406' : '\u4e34\u65f6\u6587\u4ef6\uff1a\u6e05\u7406\u5931\u8d25'].join('\n'))}`,
          allOk ? 'green' : 'yellow',
          8000,
        );
      } finally {
        setButtonBusy(clearCacheBtn, false);
        releaseCriticalOperation(operationToken);
      }
    };

    const parseLegacySubConfig = (content = '') => {
      const lines = String(content)
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));
      const urlLine = lines[0] || '';
      const urls = urlLine
        .split(/\s+/)
        .map(normalizeSubUrl)
        .filter(Boolean);
      if (urls.length == 0 || !urls.every((url) => isHttpUrl(url))) {
        return [];
      }
      return urls.map((url, index) => ({
        url,
        name: providerNameFor(index),
      }));
    };

    const parseLegacySubUrlsFromText = (content = '') => {
      const urls = String(content || '').match(/https?:\/\/[^\s"'<>]+/g) || [];
      return normalizeSubSourceList(urls);
    };

    const showSuspiciousSubSourcesError = (sources) => {
      const suspiciousSource = normalizeStoredSubSourceList(sources)
        .find((source) => detectSuspiciousSubSources([source]));
      if (!suspiciousSource) return false;
      createToast(
        `检测到疑似非节点订阅链接，已停止保存：${escapeHtml(maskSubscriptionUrl(suspiciousSource.url) || '订阅地址已隐藏')}<br>请不要填写 DNS、规则集、GeoIP/GeoSite/MMDB/ASN 或图标链接。`,
        'red',
        10000,
      );
      return true;
    };

    const showLegacySuspiciousSubSourcesError = (sources, context = '\u65e7\u8ba2\u9605\u6765\u6e90') => {
      const suspiciousSource = normalizeStoredSubSourceList(sources)
        .find((source) => detectSuspiciousSubSources([source]));
      if (!suspiciousSource) return false;
      createToast(
        `${escapeHtml(context)}\u5305\u542b\u7591\u4f3c\u975e\u8282\u70b9\u8ba2\u9605\u94fe\u63a5\uff0c\u5df2\u505c\u6b62\u8bfb\u53d6/\u8fc1\u79fb\uff1a${escapeHtml(maskSubscriptionUrl(suspiciousSource.url) || '\u8ba2\u9605\u5730\u5740\u5df2\u9690\u85cf')}<br>\u8bf7\u5148\u6e05\u7406 DNS\u3001\u89c4\u5219\u96c6\u3001GeoIP/GeoSite/MMDB/ASN \u6216\u56fe\u6807\u94fe\u63a5\u3002`,
        'red',
        10000,
      );
      return true;
    };


    const clearSubSourceFile = async () => {
      const saved = await persistSubSourceState(
        [],
        await readCurrentSubRuleMode(),
        await readSavedSubConvertMode(),
        { allowEmpty: true },
      );
      if (saved) {
        await runShellWithRoot(`
          rm -f ${shellQuote(KANO_SUBSCRIPTION_RAW)} ${shellQuote(KANO_SUBSCRIPTION_YAML)} ${shellQuote(KANO_SUBSCRIPTION_MODE_CHECK)} 2>/dev/null || true
          `);
        createToast('订阅源已清空，当前运行配置保持不变', 'green');
        await refreshRuleModeStatus();
      } else {
        createToast('\u6e05\u7a7a\u8ba2\u9605\u6e90\u5931\u8d25', 'red');
      }
      return saved;
    };

    const ensureTemplateProviders = async (sources, options = {}) => {
      const cleanSources = normalizeSubSourceList(sources);
      appendTemplateFlowDebug(`enter ensureTemplateProviders sources=${cleanSources.length} forceTemplate=${options && options.forceTemplate ? '1' : '0'}`);
      const { forceTemplate = false } = options;
      if (!forceTemplate && !(await hasUserTemplateYaml())) return true;
      if (!(await prepareTemplateFromBase(cleanSources))) {
        appendTemplateFlowDebug('ensureTemplateProviders failed at prepareTemplateFromBase');
        return false;
      }
      const overrideOk = await applyJsOverrideToTemplate({ showToast: false, restart: false, sources: cleanSources, prepareTemplate: false });
      appendTemplateFlowDebug(`ensureTemplateProviders applyJsOverrideToTemplate result=${overrideOk ? '1' : '0'}`);
      return overrideOk;
    };

    const writeSubEntrypoint = async (
      sources,
      { backup = true, convertMode = SUB_CONVERT_MODE_PROVIDER } = {},
    ) => {
      const cleanSources = normalizeSubSourceList(sources);
      appendTemplateFlowDebug(`enter writeSubEntrypoint sources=${cleanSources.length}`);
      if (cleanSources.length == 0) return false;
      const ok = await writeRuntimeConfigFromTemplate(cleanSources, {
        backup,
        showToast: false,
        forceTemplate: true,
        localProviderFiles: normalizeSubConvertModeValue(convertMode) == SUB_CONVERT_MODE_LOCAL,
      });
      appendTemplateFlowDebug(`leave writeSubEntrypoint ok=${ok ? '1' : '0'}`);
      return ok;
    };

    const providerUpdateNeedsLocalFallback = (providerResult = {}) =>
      Array.isArray(providerResult && providerResult.providers) && providerResult.providers.some((item) => {
        if (!item || item.ok) return false;
        if (item.errorType == 'upstream_390') return true;
        return /(?:HTTP|status(?: code)?)\s*[:=]?\s*390\b/i.test(`${item.message || ''}\n${item.rawMessage || ''}`);
      });

    const switchHttpProviderToLocal = async (
      cleanSources,
      cleanMode = SUB_RULE_MODE_TEMPLATE,
      { reason = 'HTTP 390' } = {},
    ) => {
      const sources = normalizeSubSourceList(cleanSources);
      if (sources.length == 0) return { ok: false, conversion: buildProviderUpdateResult([]) };
      createToast(`HTTP Provider 更新失败（${escapeHtml(reason)}），正在改用设备本地下载/转换...`, 'yellow', 10000);
      appendTemplateFlowDebug(`provider_auto_local_fallback enter reason=${reason} sources=${sources.length}`);

      const conversion = await convertSubscriptionsLocally(sources);
      if (conversion.failed > 0) {
        const failed = conversion.providers.find((item) => !item.ok);
        createToast(`自动本地转换失败：${escapeHtml(failed && failed.message || '未知错误')}；保持原 HTTP Provider 配置。`, 'red', 10000);
        appendTemplateFlowDebug(`provider_auto_local_fallback convert_failed reason=${failed && failed.message || ''}`);
        return { ok: false, conversion };
      }

      const storedSources = await readCurrentSubSources({ includeDisabled: true });
      const stored = storedSources.length > 0 ? storedSources : sources;
      const rollbackPath = await createConfigRollbackPoint('provider_auto_local_fallback');
      if (rollbackPath === null) {
        createToast('无法创建 config.yaml 回滚点，未切换本地转换模式。', 'red', 9000);
        return { ok: false, conversion };
      }
      if (!(await persistSubSourceState(stored, cleanMode, SUB_CONVERT_MODE_LOCAL))) {
        createToast('本地转换已完成，但保存本地转换模式失败；运行配置未切换。', 'red', 9000);
        return { ok: false, conversion };
      }
      if (!(await writeSubConfigByMode(sources, cleanMode, {
        backup: true,
        convertMode: SUB_CONVERT_MODE_LOCAL,
      }))) {
        const modeRestored = await persistSubSourceState(stored, cleanMode, SUB_CONVERT_MODE_PROVIDER);
        const configRestored = rollbackPath
          ? await restoreConfigRollbackPoint(rollbackPath, 'HTTP Provider 自动本地降级写入失败', { showToast: false })
          : false;
        createToast(
          modeRestored && configRestored
            ? '本地转换配置生成失败，已恢复 HTTP Provider 模式和原配置。'
            : '本地转换配置生成失败，且 HTTP Provider 模式或原配置未能完整恢复。',
          modeRestored && configRestored ? 'yellow' : 'red',
          10000,
        );
        return { ok: false, conversion };
      }
      const restarted = await restartClashWithConfigRollback(rollbackPath, 'HTTP Provider 390 自动切换本地转换');
      if (!restarted) {
        const modeRestored = await persistSubSourceState(stored, cleanMode, SUB_CONVERT_MODE_PROVIDER);
        if (!modeRestored) createToast('原配置已回滚，但 HTTP Provider 模式标记恢复失败。', 'red', 10000);
        return { ok: false, conversion };
      }
      const appliedConversion = await reloadLocalSubscriptionProviders(sources, conversion);
      appendTemplateFlowDebug('provider_auto_local_fallback success convert=local');
      createToast(
        appliedConversion.failed == 0
          ? '已自动切换为设备本地转换并恢复节点。'
          : '已切换为设备本地转换，但运行节点刷新未确认。',
        appliedConversion.failed == 0 ? 'green' : 'yellow',
        10000,
      );
      await showSubscriptionUpdateSelfCheck(sources, cleanMode, appliedConversion, null, SUB_CONVERT_MODE_LOCAL);
      return { ok: appliedConversion.failed == 0, conversion: appliedConversion };
    };

    const readLegacySubscriptionSources = async () => {
      const res = await runShellWithRoot(`
        set +e
        CONFIG=${shellQuote(CLASH_CONFIG)}
        SUB_YAML=${shellQuote(KANO_SUBSCRIPTION_YAML)}
        RAW=${shellQuote(KANO_SUBSCRIPTION_RAW)}
        SOURCE_FILE=${shellQuote(CLASH_CONFIG_SOURCE_FILE)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        config_source="$(grep -m 1 '^KANO_CONFIG_SOURCE=' "$SOURCE_FILE" 2>/dev/null | sed 's/^KANO_CONFIG_SOURCE=//' | tr -d '\\r')"
        [ -n "$config_source" ] || config_source="unknown"
        echo "LEGACY_CONFIG_SOURCE=$config_source"
        [ "$config_source" = "subscription_yaml" ] && echo "LEGACY_DETECTED=1"
        for FILE in "$CONFIG" "$SUB_YAML" "$RAW"; do
          [ -s "$FILE" ] || continue
          echo "LEGACY_FILE=$FILE"
          if [ "$FILE" = "$SUB_YAML" ] || [ "$FILE" = "$RAW" ]; then
            echo "LEGACY_DETECTED=1"
          fi
          first_line="$(sed -n '1p' "$FILE" 2>/dev/null | tr -d '\\r' | sed 's/^[[:space:]]*//')"
          if echo "$first_line" | grep -Eq '^https?://'; then
            echo "LEGACY_ENTRYPOINT_BEGIN"
            sed -n '1,2p' "$FILE" 2>/dev/null
            echo "LEGACY_ENTRYPOINT_END"
            echo "LEGACY_DETECTED=1"
          fi
          if [ -x "$YQ" ]; then
            "$YQ" e -r '[(."proxy-providers" // {})[] | (.url // "")] | .[]' "$FILE" 2>/dev/null |
              grep -E '^https?://' |
              sed 's/^/LEGACY_PROVIDER_URL=/'
          fi
        done
        `, 15 * 1000);
      const content = String(res.content || '');
      const providerSources = content
        .split('\n')
        .filter((line) => line.startsWith('LEGACY_PROVIDER_URL='))
        .map((line) => line.replace(/^LEGACY_PROVIDER_URL=/, ''));
      const entrypointBlocks = [];
      let inEntrypoint = false;
      let currentBlock = [];
      content.split('\n').forEach((line) => {
        if (line == 'LEGACY_ENTRYPOINT_BEGIN') {
          inEntrypoint = true;
          currentBlock = [];
          return;
        }
        if (line == 'LEGACY_ENTRYPOINT_END') {
          inEntrypoint = false;
          entrypointBlocks.push(currentBlock.join('\n'));
          currentBlock = [];
          return;
        }
        if (inEntrypoint) currentBlock.push(line);
      });
      const entrypointSources = entrypointBlocks.flatMap((block) => parseLegacySubConfig(block));
      const fallbackSources = entrypointBlocks.flatMap((block) => parseLegacySubUrlsFromText(block));
      if (showLegacySuspiciousSubSourcesError(providerSources, 'legacy proxy-providers URL')) {
        return { legacyDetected: true, sources: [], blocked: true, content };
      }
      if (showLegacySuspiciousSubSourcesError(entrypointSources, 'legacy entrypoint')) {
        return { legacyDetected: true, sources: [], blocked: true, content };
      }
      if (showLegacySuspiciousSubSourcesError(fallbackSources, 'legacy entrypoint fallback')) {
        return { legacyDetected: true, sources: [], blocked: true, content };
      }
      const providerSourcesClean = normalizeSubSourceList(providerSources);
      const entrypointSourcesClean = normalizeSubSourceList(entrypointSources);
      const fallbackSourcesClean = normalizeSubSourceList(fallbackSources);
      const sources = providerSourcesClean.length > 0
        ? providerSourcesClean
        : (entrypointSourcesClean.length > 0 ? entrypointSourcesClean : fallbackSourcesClean);
      return {
        legacyDetected: /(^|\n)LEGACY_DETECTED=1(\n|$)/.test(content),
        sources,
        content,
      };
    };

    const migrateLegacySubscriptionSources = async ({ showToast = true } = {}) => {
      const legacy = await readLegacySubscriptionSources();
      if (legacy.blocked) return [];
      const cleanSources = normalizeSubSourceList(legacy.sources || []);
      if (showLegacySuspiciousSubSourcesError(cleanSources, '\u65e7\u76f4\u901a\u6a21\u5f0f\u8ba2\u9605\u94fe\u63a5')) return [];
      if (cleanSources.length == 0) {
        if (legacy.legacyDetected && showToast) {
          createToast('\u68c0\u6d4b\u5230\u65e7\u76f4\u901a\u6a21\u5f0f\u6b8b\u7559\uff0c\u4f46\u672a\u627e\u5230\u53ef\u8fc1\u79fb\u7684\u8ba2\u9605\u94fe\u63a5\uff1b\u8bf7\u91cd\u65b0\u4fdd\u5b58\u8ba2\u9605\u94fe\u63a5\u3002', 'yellow', 9000);
        }
        return [];
      }
      if (!(await persistSubSourceState(cleanSources, SUB_RULE_MODE_TEMPLATE))) {
        if (showToast) createToast('\u65e7\u76f4\u901a\u6a21\u5f0f\u8fc1\u79fb\u5931\u8d25\uff1a\u8ba2\u9605\u94fe\u63a5\u5199\u5165\u5931\u8d25', 'red', 9000);
        return [];
      }
      appendTemplateFlowDebug(`legacy subscription migrated sources=${cleanSources.length}`);
      if (showToast) {
        createToast(`\u5df2\u8fc1\u79fb\u65e7\u76f4\u901a\u6a21\u5f0f\uff1a${cleanSources.length} \u4e2a\u8ba2\u9605\u94fe\u63a5\u5df2\u5199\u5165 subscription_urls.txt`, 'yellow', 8000);
      }
      return cleanSources;
    };

    const inspectConfigNodeSource = async (
      sources,
      { requireSavedSubscription = false } = {},
    ) => {
      const cleanSources = normalizeSubSourceList(sources);
      if (cleanSources.length > 0) {
        return {
          ok: true,
          source: 'saved_subscription',
          sources: cleanSources,
          message: `\u5df2\u68c0\u6d4b\u5230 ${cleanSources.length} \u4e2a\u5df2\u4fdd\u5b58\u8ba2\u9605\u94fe\u63a5\u3002`,
        };
      }

      const nodeCheck = await inspectTemplateNodeSources();
      if (nodeCheck.hasNodes) {
        if (requireSavedSubscription) {
          return {
            ok: true,
            source: 'template_embedded',
            sources: [],
            nodeCheck,
            requiresTemplateRebuild: true,
            message: '\u6ca1\u6709\u5df2\u4fdd\u5b58\u8ba2\u9605\u94fe\u63a5\uff1b\u5c06\u4f7f\u7528 template.yaml \u5185\u5d4c\u8282\u70b9\u6216\u5e26 URL \u7684 proxy-providers \u751f\u6210 config.yaml\u3002',
          };
        }
        return {
          ok: true,
          source: 'template_embedded',
          sources: [],
          nodeCheck,
          message: 'template.yaml \u5305\u542b\u5185\u5d4c\u8282\u70b9\u6216\u5e26 URL \u7684 proxy-providers\u3002',
        };
      }

      const detail = nodeCheck.status == 'missing'
        ? 'template.yaml \u4e0d\u5b58\u5728\u3002'
        : nodeCheck.status == 'invalid'
          ? `template.yaml \u89e3\u6790\u5931\u8d25\u3002<br>${safeTextToHtml(nodeCheck.content || '')}`
          : 'template.yaml \u6ca1\u6709 proxies \u8282\u70b9\uff0c\u4e5f\u6ca1\u6709\u5e26 URL \u7684 proxy-providers\u3002';
      return {
        ok: false,
        source: 'none',
        sources: [],
        nodeCheck,
        message: `\u6ca1\u6709\u53ef\u7528\u8282\u70b9\u6765\u6e90\uff1a\u6ca1\u6709\u5df2\u4fdd\u5b58\u8ba2\u9605\u94fe\u63a5\uff0c${detail}<br>\u8bf7\u5148\u70b9\u201c\u8ba2\u9605\u94fe\u63a5\u201d\u586b\u5199\u5e76\u4fdd\u5b58\uff0c\u6216\u5728\u201c\u6a21\u677f\u4e0e\u8986\u5199\u201d\u4e0a\u4f20\u5305\u542b\u8282\u70b9\u7684 template.yaml\u3002`,
      };
    };

    const inspectSubscriptionRuntimeConfig = async (sources = [], mode = SUB_RULE_MODE_TEMPLATE, convertMode = SUB_CONVERT_MODE_PROVIDER) => {
  const cleanSources = normalizeSubSourceList(sources), cleanMode = normalizeSubRuleModeValue(mode);
  const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
  const [read, meta, ua] = await Promise.all([
    readYamlObject(CLASH_CONFIG, 'config.yaml', { allowDownload: false }),
    runShellWithRoot(`
      [ ! -r ${shellQuote(CLASH_SUB_URLS)} ] || sed -n -e 's/^# KANO_SUB_RULE_MODE=/mode=/p' -e 's/^# KANO_SUB_CONVERT_MODE=/convert=/p' ${shellQuote(CLASH_SUB_URLS)}
      [ ! -r ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} ] || sed -n 's/^KANO_CONFIG_SOURCE=/source=/p' ${shellQuote(CLASH_CONFIG_SOURCE_FILE)}
      echo SUBSCRIPTION_META_READ
    `, 8000),
    loadProviderUserAgent(),
  ]);
  const data = parseKeyValueOutput(meta.content || ''), config = read.ok ? read.value : {};
  const readable = !!read.ok && !!meta.success && String(meta.content || '').includes('SUBSCRIPTION_META_READ');
  const providers = isPlainYamlObject(config['proxy-providers']) ? config['proxy-providers'] : {};
  const issues = [];
  if (!read.ok) issues.push(read.message || '\u8fd0\u884c\u914d\u7f6e\u65e0\u6cd5\u8bfb\u53d6');
  if (!meta.success || !String(meta.content || '').includes('SUBSCRIPTION_META_READ')) issues.push('\u8ba2\u9605\u6807\u8bb0\u8bfb\u53d6\u5931\u8d25');
  const modeLineOk = data.mode === cleanMode, convertModeOk = cleanMode === SUB_RULE_MODE_ORIGINAL || data.convert === cleanConvertMode;
  const providerCount = Object.keys(providers).length;
  const providerUrlCount = Object.values(providers).filter(p => p && /^https?:\/\//.test(String(p.url || ''))).length;
  const rulesCount = Array.isArray(config.rules) ? config.rules.length : 0;
  const proxyGroupsCount = Array.isArray(config['proxy-groups']) ? config['proxy-groups'].length : 0;
  let missingUrls = 0, providerShapeErrors = 0;
  if (!modeLineOk) issues.push('\u914d\u7f6e\u6765\u6e90\u6807\u8bb0\u4e0d\u5339\u914d');
  if (!convertModeOk) issues.push('\u8282\u70b9\u5904\u7406\u65b9\u5f0f\u6807\u8bb0\u4e0d\u5339\u914d');
  if (cleanMode === SUB_RULE_MODE_ORIGINAL) {
    try { validateOriginalSubscriptionConfig(config); } catch (e) { issues.push(e.message); }
    if (data.source !== 'subscription_original') issues.push('\u5f53\u524d\u4e0d\u662f\u8ba2\u9605\u539f\u914d\u7f6e');
  } else {
    const local = cleanConvertMode === SUB_CONVERT_MODE_LOCAL;
    for (const source of cleanSources) {
      const p = providers[source.name] || {};
      if (p.type !== (local ? 'file' : 'http') || p.path !== './proxies/' + source.name + '.yaml') providerShapeErrors++;
      if (!local) {
        if (p.url !== source.url) missingUrls++;
        if (!p.header || !Array.isArray(p.header['User-Agent']) || p.header['User-Agent'][0] !== (ua || currentProviderUserAgent)) providerShapeErrors++;
      }
    }
    if (providerCount !== cleanSources.length || providerUrlCount !== (local ? 0 : cleanSources.length)) issues.push('\u8282\u70b9\u6765\u6e90\u6570\u91cf\u4e0d\u5339\u914d');
    if (missingUrls || providerShapeErrors) issues.push('\u8ba2\u9605 URL\u3001\u7c7b\u578b\u3001\u8def\u5f84\u6216 User-Agent \u4e0d\u5339\u914d');
    if (!rulesCount || !proxyGroupsCount) issues.push('\u89c4\u5219\u6216\u7b56\u7565\u7ec4\u4e3a\u7a7a');
    if (cleanSources.length && data.source !== 'template.yaml') issues.push('\u5f53\u524d\u914d\u7f6e\u4e0d\u662f\u672c\u5730\u6a21\u677f\u751f\u6210');
  }
  return { ok: !issues.length, readable, config: read.ok ? config : null, status: !readable ? 'read_failed' : issues.length ? 'invalid' : 'ok', providerCount, providerUrlCount,
    rulesCount, proxyGroupsCount, missingUrls, providerShapeErrors, modeLineOk, convertModeOk,
    convertMode: cleanConvertMode, configSource: data.source || 'unknown', issues, content: '' };
}
;

    const mergeProviderUpdateResults = (previousResult, retryResult) => {
      const merged = new Map();
      ((previousResult && previousResult.providers) || []).forEach((item) => merged.set(item.name, item));
      ((retryResult && retryResult.providers) || []).forEach((item) => merged.set(item.name, item));
      return buildProviderUpdateResult([...merged.values()], {
        controllerInfo: retryResult && retryResult.controllerInfo || previousResult && previousResult.controllerInfo || null,
        corePid: retryResult && Object.prototype.hasOwnProperty.call(retryResult, 'corePid')
          ? retryResult.corePid
          : previousResult && previousResult.corePid || '',
        apiStatusCode: retryResult && retryResult.apiStatusCode || previousResult && previousResult.apiStatusCode || 0,
      });
    };

    const showSubscriptionUpdateResultDialog = ({
      sources,
      mode,
      convertMode,
      configValidationResult,
      providerUpdateResult,
      configSummary,
      controllerText,
      issueText,
      diagnosticSummary,
      repairable,
    }) => {
      const outcome = deriveSubscriptionUpdateOutcome(configValidationResult, providerUpdateResult);
      const {
        providerResult,
        providerNotRun,
        providerOk,
        failedProviders,
        allOk,
        title,
        color,
        summary,
      } = outcome;
      createToast(summary, color, 7000);

      const providerRows = providerResult.total > 0
        ? providerResult.providers.map((item) => {
          const cacheText = item.ok
            ? (Number.isInteger(item.proxyCount) ? `当前节点：${item.proxyCount} 个` : '节点缓存：已更新')
            : item.cacheAvailable
              ? (Number.isInteger(item.proxyCount)
                ? `本次更新失败，当前继续使用缓存的 ${item.proxyCount} 个节点。`
                : '本次更新失败，继续使用原节点缓存。')
              : item.proxyCount === 0
                ? '本次更新失败，当前没有可确认的缓存节点。'
                : '配置已应用，但无法确认节点缓存是否更新。';
          const technical = item.rawMessage
            ? `<details style="margin-top:6px;"><summary>展开技术详情</summary><pre style="margin:6px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(sanitizeSubscriptionSecrets(item.rawMessage).slice(0, 1200))}</pre></details>`
            : '';
          return `<div style="padding:9px 10px;border:1px solid rgba(148,163,184,.25);border-radius:9px;overflow-wrap:anywhere;word-break:break-word;">
            <b>${escapeHtml(item.name)}</b><br>
            状态：${item.ok ? '成功' : String(item.errorType || '').startsWith('not_run_') ? '未执行' : '失败'}<br>
            尝试次数：${item.attempts}<br>
            ${item.ok ? '' : `原因：${escapeHtml(item.message)}<br>`}
            ${item.urlMasked ? `服务器：${escapeHtml(item.urlMasked)}<br>` : ''}
            ${escapeHtml(cacheText)}
            ${technical}
          </div>`;
        }).join('')
        : '<div style="opacity:.78;">当前配置没有需要更新的节点来源。</div>';
      const id = `mm_provider_update_result_${createRandomString(6)}`;
      const retryId = `${id}_retry`;
      const repairId = `${id}_repair`;
      const closeId = `${id}_close`;
      const actionCount = 1 + (repairable ? 1 : 0) + (failedProviders.length > 0 ? 1 : 0);
      const { el, close } = createFixedToast(
        id,
        `<div style="pointer-events:all;width:92vw;max-width:720px;overflow-wrap:anywhere;word-break:break-word;">
          <div class="title" style="margin:0">${escapeHtml(title)}</div>
          <div style="margin-top:10px;max-height:68vh;overflow-y:auto;overflow-x:hidden;padding-right:3px;font-size:.64rem;line-height:1.62;">
            <div style="padding:9px 10px;border:1px solid rgba(148,163,184,.25);border-radius:9px;margin-bottom:9px;">
              <b>配置检查：${configValidationResult.ok ? '通过' : '异常'}</b><br>
              ${textToHtml(configSummary)}<br>${escapeHtml(controllerText)}
              ${issueText ? `<details style="margin-top:6px;"><summary>异常详情</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(sanitizeSubscriptionSecrets(issueText || diagnosticSummary))}</pre></details>` : ''}
            </div>
            <div style="margin-bottom:7px;"><b>节点来源更新：${providerResult.success}/${providerResult.total}</b></div>
            <div style="display:flex;flex-direction:column;gap:8px;">${providerRows}</div>
          </div>
          <div class="kano-dialog-actions kano-actions-${actionCount}" style="--kano-action-count:${actionCount};margin-top:12px;">
            ${repairable ? `<button style="font-size:.64rem" id="${repairId}">应用模板修复</button>` : ''}
            ${failedProviders.length > 0 ? `<button style="font-size:.64rem;background:var(--dark-btn-color-active)" id="${retryId}">${providerNotRun ? '启动核心并重试节点来源' : '重新更新失败项'}</button>` : ''}
            <button style="font-size:.64rem" id="${closeId}">关闭</button>
          </div>
        </div>`,
      );
      const retryBtn = el.querySelector(`#${retryId}`);
      const repairBtn = el.querySelector(`#${repairId}`);
      const closeBtn = el.querySelector(`#${closeId}`);
      const safeClose = () => {
        if (retryBtn) retryBtn.onclick = null;
        if (repairBtn) repairBtn.onclick = null;
        if (closeBtn) closeBtn.onclick = null;
        close();
      };
      if (closeBtn) closeBtn.onclick = safeClose;
      if (repairBtn) {
        repairBtn.onclick = async () => {
          if (!(await ensureReady())) return;
          const operationToken = acquireCriticalOperation('修复订阅配置');
          if (!operationToken) return;
          setButtonBusy(repairBtn, true, '修复中…');
          try {
            await overwriteConfigByTemplate({ confirm: false });
            safeClose();
          } finally {
            setButtonBusy(repairBtn, false);
            releaseCriticalOperation(operationToken);
          }
        };
      }
      if (retryBtn) {
        retryBtn.onclick = async () => {
          if (!(await ensureReady())) return;
          const operationToken = acquireCriticalOperation('重新更新失败节点来源');
          if (!operationToken) return;
          setButtonBusy(retryBtn, true, '重试中…');
          try {
            if (providerNotRun && !(await restartClashOk())) return;
            const retryResult = await forceUpdateProvidersFromConfig({
              showToast: false,
              providerNames: failedProviders.map((item) => item.name),
            });
            const mergedResult = mergeProviderUpdateResults(providerResult, retryResult);
            safeClose();
            await showSubscriptionUpdateSelfCheck(sources, mode, mergedResult, null, convertMode);
          } finally {
            setButtonBusy(retryBtn, false);
            releaseCriticalOperation(operationToken);
          }
        };
      }
      return { allOk, providerOk, configOk: outcome.configOk, color };
    };

    const showSubscriptionUpdateSelfCheck = async (
      sources = [],
      mode = SUB_RULE_MODE_TEMPLATE,
      providerUpdateResult = null,
      configCheckResult = null,
      convertMode = SUB_CONVERT_MODE_PROVIDER,
    ) => {
      const cleanMode = normalizeSubRuleModeValue(mode);
      const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
      const controllerInfo = providerUpdateResult && providerUpdateResult.controllerInfo;
      const corePid = providerUpdateResult
        && Object.prototype.hasOwnProperty.call(providerUpdateResult, 'corePid')
        ? providerUpdateResult.corePid
        : null;
      const controllerCheckPromise = controllerInfo
        ? callMihomoApi('/version', 'GET', null, controllerInfo, 8, { corePid })
        : buildControllerInfo().then((info) => callMihomoApi('/version', 'GET', null, info, 8, { corePid }));
      const configCheckPromise = configCheckResult
        ? Promise.resolve(configCheckResult)
        : inspectSubscriptionRuntimeConfig(sources, cleanMode, cleanConvertMode);
      const [controllerCheck, configCheck] = await Promise.all([controllerCheckPromise, configCheckPromise]);
      const configSummary = cleanMode == SUB_RULE_MODE_ORIGINAL
        ? `当前规则来源：订阅原配置\nproxy-groups 数量：${configCheck.proxyGroupsCount}\nrules 数量：${configCheck.rulesCount}\n保留订阅策略，仅适配 F50 网络接管设置。`
        : `当前规则来源：template 规则\n订阅转换：${cleanConvertMode == SUB_CONVERT_MODE_LOCAL ? '设备本地转换' : 'Mihomo HTTP Provider'}\n当前 config 来源：${configCheck.configSource || 'unknown'}\nproxy-providers 数量：${configCheck.providerCount}\n有效订阅 URL 数量：${configCheck.providerUrlCount}\nproxy-groups 数量：${configCheck.proxyGroupsCount}\nrules 数量：${configCheck.rulesCount}\n模式标记：${configCheck.modeLineOk && configCheck.convertModeOk ? '正确' : '错误'}`;
      const controllerOk = !!controllerCheck.success;
      const issues = (configCheck.issues || []).slice();
      const issueText = issues.join('\n');
      const diagnosticText = String(configCheck.content || '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !/^(RUNTIME_CONFIG_CHECK|expected_count|provider_count|provider_url_count|rules_count|proxy_groups_count|missing_urls|mode_line|mode_line_ok|config_source)=/.test(line))
        .slice(0, 12)
        .join('\n');
      const diagnosticSummary = diagnosticText || `RUNTIME_CONFIG_CHECK=${configCheck.status || 'unknown'}`;
      const controllerText = controllerCheck.success
        ? `\u63a7\u5236 API\uff1a\u53ef\u8bbf\u95ee\uff08HTTP ${controllerCheck.statusCode}\uff09`
        : `\u63a7\u5236 API\uff1a${controllerCheck.message || '不可访问'}${controllerCheck.statusCode ? `（HTTP ${controllerCheck.statusCode}）` : ''}`;
      const configValidationResult = {
        ...configCheck,
        ok: configCheck.ok,
        controllerOk,
        controllerStatusCode: controllerCheck.statusCode || 0,
        controllerErrorType: controllerCheck.errorType || '',
      };
      const expectedSourceCount = normalizeSubSourceList(sources).length;
      const expectedProviderUrlCount = cleanConvertMode == SUB_CONVERT_MODE_LOCAL ? 0 : expectedSourceCount;
      const repairable = cleanMode == SUB_RULE_MODE_TEMPLATE && !configCheck.ok && configCheck.status == 'ok' && (
        configCheck.missingUrls > 0 ||
        configCheck.providerCount != expectedSourceCount ||
        configCheck.providerUrlCount != expectedProviderUrlCount ||
        configCheck.providerShapeErrors > 0 ||
        configCheck.rulesCount <= 0 ||
        configCheck.proxyGroupsCount <= 0 ||
        !configCheck.modeLineOk ||
        !configCheck.convertModeOk
      );
      const outcome = showSubscriptionUpdateResultDialog({
        sources,
        mode: cleanMode,
        convertMode: cleanConvertMode,
        configValidationResult,
        providerUpdateResult,
        configSummary,
        controllerText,
        issueText,
        diagnosticSummary,
        repairable,
      });
      await isMMRunning({ corePid: controllerCheck.corePid, apiOk: controllerCheck.success });
      return outcome.allOk;
    };

    refreshSubscriptionAfterRestore = async () => {
      const sources = await readCurrentSubSources();
      const mode = await readCurrentSubRuleMode();
      const convertMode = await readSavedSubConvertMode();
      const configSource = await readConfigSource();
      if (['uploaded_config', 'subscription_original'].includes(configSource) || mode == SUB_RULE_MODE_ORIGINAL) {
        const providerUpdate = await forceUpdateProvidersFromConfig({ showToast: false });
        if (configSource == 'subscription_original') {
          await showSubscriptionUpdateSelfCheck(sources, SUB_RULE_MODE_ORIGINAL, providerUpdate);
        }
        return;
      }
      let providerUpdate;
      if (convertMode == SUB_CONVERT_MODE_LOCAL) {
        const conversion = await convertSubscriptionsLocally(sources);
        providerUpdate = await reloadLocalSubscriptionProviders(sources, conversion);
      } else {
        providerUpdate = await forceUpdateProvidersFromConfig({ showToast: false });
      }
      if (convertMode == SUB_CONVERT_MODE_PROVIDER && providerUpdateNeedsLocalFallback(providerUpdate)) {
        await switchHttpProviderToLocal(sources, mode, { reason: 'HTTP 390' });
        return;
      }
      await showSubscriptionUpdateSelfCheck(sources, mode, providerUpdate, null, convertMode);
    };

    const updateSubProviders = async (sources, mode = SUB_RULE_MODE_TEMPLATE, convertMode = SUB_CONVERT_MODE_LOCAL) => {
  if (!(await ensureCompatBackend())) return false;
  const cleanMode = normalizeSubRuleModeValue(mode);
  const cleanSources = normalizeSubSourceList(sources);
  if (!cleanSources.length && await readConfigSource() === 'uploaded_config') {
    const refreshed=await forceUpdateProvidersFromConfig({showToast:true,refreshRemote:true});return refreshed.failed===0;
  }
  if (!cleanSources.length) { createToast('\u6ca1\u6709\u5df2\u542f\u7528\u7684\u8ba2\u9605', 'red'); return false; }
  const read = await readYamlObject(CLASH_CONFIG, 'config.yaml');
  if (!read.ok) { createToast(safeTextToHtml(read.message || '\u8bfb\u53d6\u914d\u7f6e\u5931\u8d25'), 'red'); return false; }
  const definitions = read.value['proxy-providers'] || {};
  const localReady = cleanMode === SUB_RULE_MODE_TEMPLATE && cleanSources.every(s => definitions[s.name] && definitions[s.name].type === 'file') && await readConfigSource() !== 'subscription_original';
  if (!localReady) return saveSubSources(await readCurrentSubSources({includeDisabled:true}), cleanMode, SUB_CONVERT_MODE_LOCAL, {applyToCustom:true});
  // Download first. A failed request never enters the restart/rollback path.
  const converted = await convertSubscriptionsLocally(cleanSources);
  if (converted.failed || !converted.ok) {
    const message = (converted.providers || []).find(p => !p.ok)?.message || '\u8ba2\u9605\u4e0b\u8f7d\u5931\u8d25';
    operationFinish(false, message); createToast(safeTextToHtml(message) + '<br>\u539f\u8282\u70b9\u548c\u6838\u5fc3\u8fd0\u884c\u72b6\u6001\u4fdd\u7559', 'red', 10000); return false;
  }
  if (!(await getCorePid())) { operationFinish(true, '\u8282\u70b9\u5df2\u4fdd\u5b58\uff0c\u6838\u5fc3\u4fdd\u6301\u505c\u6b62'); return true; }
  const applied = await reloadLocalSubscriptionProviders(cleanSources, converted);
  const ok = applied.failed === 0;
  operationFinish(ok, ok ? '\u8282\u70b9\u5df2\u66f4\u65b0\uff0c\u672a\u91cd\u542f\u6838\u5fc3' : '\u4e0b\u8f7d\u5b8c\u6210\uff0c\u4f46\u672c\u5730\u52a0\u8f7d\u5931\u8d25');
  createToast(ok ? '\u8282\u70b9\u5df2\u66f4\u65b0' : '\u8282\u70b9\u4e0b\u8f7d\u6210\u529f\uff0c\u4f46\u6838\u5fc3\u672a\u786e\u8ba4\u52a0\u8f7d', ok ? 'green':'red', 8000);
  return ok;
}
;

    const readCurrentSubSources = async ({ includeDisabled = false } = {}) => {
      const source = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_SUB_URLS)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_SUB_URLS)}; fi
        `);
      if (!source.success) {
        createToast(`\u8bfb\u53d6\u8ba2\u9605\u6e90\u5931\u8d25\uff0c\u672a\u6267\u884c\u65e7\u914d\u7f6e\u8fc1\u79fb\u3002<br>${safeTextToHtml(source.content || '')}`, 'red', 9000);
        appendTemplateFlowDebug('readCurrentSubSources failed before legacy migration');
        throw new Error('\u8bfb\u53d6\u8ba2\u9605\u5217\u8868\u5931\u8d25\uff0c\u672a\u7ee7\u7eed\u66f4\u65b0');
      }
      const sourceItems = parseStoredSubSourcesFromText(source.content || '');
      if (sourceItems.length > 0) {
        if (showLegacySuspiciousSubSourcesError(sourceItems, '\u5386\u53f2 subscription_urls.txt')) return [];
        return includeDisabled ? sourceItems : normalizeSubSourceList(sourceItems);
      }
      if (['subscription_original', 'uploaded_config'].includes(await readConfigSource())) return [];

      const res = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_CONFIG)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_CONFIG)}; fi
        `);
      if (!res.success || !res.content) return await migrateLegacySubscriptionSources({ showToast: true });
      const legacySources = parseLegacySubConfig(res.content);
      if (legacySources.length > 0) {
        if (showLegacySuspiciousSubSourcesError(legacySources, 'legacy entrypoint')) return [];
        if (!(await persistSubSourceState(legacySources))) {
          createToast('\u65e7\u7248\u8ba2\u9605\u5165\u53e3\u8fc1\u79fb\u5931\u8d25\uff0c\u672a\u7ee7\u7eed\u4f7f\u7528\u672a\u4fdd\u5b58\u7684\u8ba2\u9605\u6e90\u3002', 'red', 9000);
          appendTemplateFlowDebug(`legacy entrypoint persist failed sources=${legacySources.length}`);
          return [];
        }
        createToast('\u5df2\u8fc1\u79fb\u65e7\u7248\u8ba2\u9605\u5165\u53e3\u3002', 'yellow', 6500);
        appendTemplateFlowDebug(`legacy entrypoint migrated sources=${legacySources.length}`);
        return legacySources;
      }
      return await migrateLegacySubscriptionSources({ showToast: true });
    };

    const readCurrentSubRuleMode = async () => {
      const res = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_SUB_URLS)} ]; then
          sed -n '/^# KANO_SUB_RULE_MODE=/p' ${shellQuote(CLASH_SUB_URLS)} | head -n 1
        fi
      `, 10 * 1000);
      if (!res.success) throw new Error('读取订阅模式失败，未修改配置');
      return parseSubRuleModeFromText(res.content || '');
    };

    const writeSubConfigByMode = async (
      sources,
      mode = SUB_RULE_MODE_TEMPLATE,
      { backup = true, convertMode = SUB_CONVERT_MODE_PROVIDER } = {},
    ) => {
      const cleanMode = normalizeSubRuleModeValue(mode);
      const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
      const cleanSources = normalizeSubSourceList(sources);
      appendTemplateFlowDebug(`enter writeSubConfigByMode mode=${cleanMode} convert=${cleanConvertMode} sources=${cleanSources.length}`);
      if (cleanMode == SUB_RULE_MODE_ORIGINAL) {
        return await writeOriginalSubscriptionConfig(cleanSources, { backup });
      }
      if (!(await setSubRuleMode(cleanMode))) return false;
      if (!(await ensureTemplateProviders(cleanSources, { forceTemplate: true }))) {
        appendTemplateFlowDebug('writeSubConfigByMode template failed at ensureTemplateProviders');
        return false;
      }
      const ok = await writeSubEntrypoint(cleanSources, { backup, convertMode: cleanConvertMode });
      appendTemplateFlowDebug(`leave writeSubConfigByMode template ok=${ok ? '1' : '0'}`);
      return ok;
    };

    const saveSubSources = async (sources, mode = SUB_RULE_MODE_TEMPLATE, convertMode = SUB_CONVERT_MODE_PROVIDER, { applyToCustom = false } = {}) => {
  const cleanMode = normalizeSubRuleModeValue(mode);
  const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
  let storedSources, cleanSources;
  try { ({ stored: storedSources, enabled: cleanSources } = validateSubscriptionMode(sources, cleanMode)); }
  catch (error) { operationFinish(false, error.message); createToast(safeTextToHtml(error.message), 'red', 9000); return false; }
  if (!storedSources.length || storedSources.some((source) => !isHttpUrl(source.url))) {
    operationFinish(false, '\u8bf7\u8f93\u5165\u6709\u6548\u8ba2\u9605\u94fe\u63a5');
    return false;
  }
  if (showSuspiciousSubSourcesError(storedSources)) { operationFinish(false); return false; }
  operationStage('\u68c0\u67e5\u8ba2\u9605\u548c\u914d\u7f6e\u6765\u6e90', 0, 5);
  if ((!applyToCustom && await readConfigSource() === 'uploaded_config') || !cleanSources.length) {
    const saved = await persistSubSourceState(storedSources, cleanMode, cleanConvertMode);
    operationFinish(saved, saved ? '\u8ba2\u9605\u8bbe\u7f6e\u5df2\u4fdd\u5b58\uff0c\u5f53\u524d\u914d\u7f6e\u672a\u66f4\u6539' : '\u8ba2\u9605\u8bbe\u7f6e\u4fdd\u5b58\u5931\u8d25');
    return saved;
  }
  const tx = `/data/kano_subscription_save_${Date.now()}_${createRandomString(6)}`;
  const paths = [CLASH_CONFIG, CLASH_SUB_URLS, CLASH_SUB_RULE_MODE_FILE, CLASH_POLICY_OPTIONS_FILE,
    CLASH_CONFIG_SOURCE_FILE, CLASH_TEMPLATE, CLASH_TEMPLATE_BASE, CLASH_RULE_OVERRIDE_APPLIED_JSON,
    ...cleanSources.map((source) => `${CLASH_PROXY_DIR}/proxies/${source.name}.yaml`)];
  const snapshot = await runShellWithRoot(`set -e
umask 077
TX=${shellQuote(tx)}
mkdir -p "$TX"
${paths.map((path, i) => `if [ -f ${shellQuote(path)} ]; then cp ${shellQuote(path)} "$TX/${i}"; touch "$TX/${i}.had"; else touch "$TX/${i}.absent"; fi`).join('\n')}
echo SUBSCRIPTION_TRANSACTION_READY`, 20000);
  if (!snapshot.success || !String(snapshot.content || '').includes('SUBSCRIPTION_TRANSACTION_READY')) {
    operationFinish(false, '\u65e0\u6cd5\u521b\u5efa\u56de\u6eda\u70b9\uff0c\u672a\u66f4\u6539\u8ba2\u9605');
    return false;
  }
  let runtimeAttempted = false, wasRunning = false, restored = false, committed = false;
  try {
    wasRunning = !!(await getCorePid());
    if (!(await persistSubSourceState(storedSources, cleanMode, cleanConvertMode))) throw new Error('\u4fdd\u5b58\u8ba2\u9605\u8bbe\u7f6e\u5931\u8d25');
    operationStage(cleanMode === SUB_RULE_MODE_ORIGINAL ? '\u4e0b\u8f7d\u8ba2\u9605\u7684\u5b8c\u6574\u914d\u7f6e' : '\u6839\u636e\u672c\u5730\u6a21\u677f\u751f\u6210\u914d\u7f6e', 1, 5);
    let conversion = null;
    if (cleanMode === SUB_RULE_MODE_TEMPLATE && cleanConvertMode === SUB_CONVERT_MODE_LOCAL) {
      conversion = await convertSubscriptionsLocally(cleanSources);
      if (conversion.failed > 0) throw new Error((conversion.providers || []).find((item) => !item.ok)?.message || '\u672c\u5730\u8ba2\u9605\u8f6c\u6362\u5931\u8d25');
    }
    if (!(await writeSubConfigByMode(cleanSources, cleanMode, { backup: false, convertMode: cleanConvertMode }))) {
      throw new Error('\u8ba2\u9605\u914d\u7f6e\u751f\u6210\u5931\u8d25');
    }
    operationStage('\u505c\u6b62\u5e76\u542f\u52a8\u5df2\u6821\u9a8c\u7684\u65b0\u914d\u7f6e', 2, 5);
    if (!wasRunning) { const prepared=await f50Command('prepare',120000); if(!prepared.success)throw new Error(f50Error(prepared.content)); committed=true; invalidateStatusSnapshot(); operationFinish(true,'配置已保存，核心保持停止'); createToast('订阅已保存，未启动核心','green'); return true; }
    runtimeAttempted = true;
    if (!(await restartClashOk({ skipCheck: true }))) throw new Error('\u65b0\u914d\u7f6e\u672a\u901a\u8fc7\u8fd0\u884c\u68c0\u67e5');
    operationStage('\u66f4\u65b0\u5e76\u786e\u8ba4\u8282\u70b9\u6765\u6e90', 3, 5);
    const providers = cleanMode === SUB_RULE_MODE_TEMPLATE && cleanConvertMode === SUB_CONVERT_MODE_LOCAL
      ? await reloadLocalSubscriptionProviders(cleanSources, conversion)
      : await forceUpdateProvidersFromConfig({ showToast: false });
    if (cleanMode === SUB_RULE_MODE_TEMPLATE && cleanConvertMode === SUB_CONVERT_MODE_PROVIDER && providerUpdateNeedsLocalFallback(providers)) {
      const fallback = await switchHttpProviderToLocal(cleanSources, cleanMode, { reason: 'HTTP 390' });
      if (!fallback.ok) throw new Error('\u8282\u70b9\u66f4\u65b0\u548c\u672c\u5730\u8f6c\u6362\u56de\u9000\u5747\u5931\u8d25');
    } else if (providers.failed > 0) {
      const failed = (providers.providers || []).find((item) => !item.ok);
      throw new Error(failed && failed.message || '\u8282\u70b9\u6765\u6e90\u66f4\u65b0\u672a\u5b8c\u6210');
    }
    committed = true;
    invalidateStatusSnapshot();
    const message = cleanMode === SUB_RULE_MODE_ORIGINAL
      ? '\u5df2\u4f7f\u7528\u8ba2\u9605\u81ea\u5e26\u914d\u7f6e\u8986\u76d6\u8fd0\u884c\u914d\u7f6e\uff0c\u672c\u5730\u6a21\u677f\u4fdd\u7559'
      : '\u5df2\u6839\u636e\u672c\u5730\u6a21\u677f\u66f4\u65b0\u8ba2\u9605\u914d\u7f6e';
    operationFinish(true, message);
    createToast(message, 'green', 7000);
    return true;
  } catch (error) {
    if (error.name === 'OperationCancelled' || (activeCriticalOperation && activeCriticalOperation.token.cancelled)) return false;
    const firstFailure = sanitizeSubscriptionSecrets(activeCriticalOperation && activeCriticalOperation.failure || error.message || String(error));
    createToast(safeTextToHtml(firstFailure) + '<br>\u6b63\u5728\u6062\u590d\u539f\u914d\u7f6e', 'red', 10000);
    operationStage('\u66f4\u65b0\u5931\u8d25\uff0c\u6062\u590d\u539f\u914d\u7f6e');
    // Stop a timed-out provider update before restoring cache files it could still replace.
    let stopped = true;
    try { if (runtimeAttempted) stopped = await networkRescue({ stopService: true, showOutput: false, reason: '\u8ba2\u9605\u56de\u6eda' }); } catch (_) { stopped = false; }
    if (!stopped) {
      operationFinish(false, '\u6838\u5fc3\u672a\u786e\u8ba4\u505c\u6b62\uff0c\u672a\u91cd\u542f\u6216\u8986\u76d6\u7f13\u5b58');
      createToast('\u56de\u6eda\u5df2\u505c\u6b62\uff0c\u5907\u4efd\u4fdd\u7559\u4e8e ' + escapeHtml(tx), 'red', 15000);
      return false;
    }
    try {
    const rollback = await runShellWithRoot(`set -e
TX=${shellQuote(tx)}
${paths.map((path, i) => ({ path, i })).reverse().map(({ path, i }) => `if [ -f "$TX/${i}.had" ]; then mkdir -p ${shellQuote(path.slice(0, path.lastIndexOf('/')))}; cp "$TX/${i}" ${shellQuote(path + '.kano_restore')} || exit 1; mv -f ${shellQuote(path + '.kano_restore')} ${shellQuote(path)} || exit 1; elif [ -f "$TX/${i}.absent" ]; then rm -f ${shellQuote(path)}; else exit 1; fi`).join('\n')}
echo SUBSCRIPTION_TRANSACTION_RESTORED`, 30000);
    restored = !!rollback.success && String(rollback.content || '').includes('SUBSCRIPTION_TRANSACTION_RESTORED');
    invalidateStatusSnapshot();
    if (restored && runtimeAttempted && wasRunning) restored = await restartClashOk({ skipCheck: true });
    } catch (_) { restored = false; }
    if (!restored) await networkRescue({ stopService: true, showOutput: false, reason: '\u8ba2\u9605\u56de\u6eda\u672a\u5b8c\u6210' });
    const message = firstFailure;
    operationFinish(false, message + (restored ? '\uff1b\u5df2\u6062\u590d\u66f4\u65b0\u524d\u72b6\u6001' : '\uff1b\u6062\u590d\u672a\u5b8c\u6210'));
    createToast(safeTextToHtml(message) + '<br>' + (restored ? '\u5df2\u6062\u590d\u539f\u8ba2\u9605\u548c\u914d\u7f6e' : '\u56de\u6eda\u672a\u5b8c\u6210\uff0c\u5907\u4efd\u4fdd\u7559\u4e8e ' + escapeHtml(tx)), 'red', 12000);
    return false;
  } finally {
    if ((committed || restored) && !(activeCriticalOperation && activeCriticalOperation.token.cancelled)) {
      try { await runShellWithRoot('rm -rf ' + shellQuote(tx), 10000); } catch (_) {}
    }
  }
};

    const overwriteConfigByTemplate = async ({ confirm = true } = {}) => {
      const configSource = await readConfigSource();
      if (!confirm && ['uploaded_config', 'subscription_original'].includes(configSource)) {
        createToast('当前配置已保留；要使用模板替换，请手动点击“应用模板与覆写”', 'yellow', 8000);
        return false;
      }
      const storedSources = await readCurrentSubSources({ includeDisabled: true });
      const sources = normalizeSubSourceList(storedSources);
      const currentMode = await readCurrentSubRuleMode();
      const currentConvertMode = await readSavedSubConvertMode();
      if (sources.length > 0 && (currentMode == SUB_RULE_MODE_ORIGINAL || configSource == 'subscription_original')) {
        if (!confirm) {
          createToast('当前使用订阅原配置；请先切换为模板模式再应用模板覆写', 'yellow', 8000);
          return false;
        }
        const accepted = await askConfirm('mm_original_to_template', '切换为模板模式？', '当前配置的规则和策略组将被模板配置替换。', '切换并应用', '取消');
        if (!accepted) return false;
        return await saveSubSources(storedSources, SUB_RULE_MODE_TEMPLATE, currentConvertMode, { applyToCustom: true });
      }
      appendTemplateFlowDebug(`enter overwriteConfigByTemplate mode=${currentMode} convert=${currentConvertMode} sources=${sources.length}`);
      const sourceCheck = await inspectConfigNodeSource(sources);
      appendTemplateFlowDebug(`overwriteConfigByTemplate sourceCheck ok=${sourceCheck.ok ? '1' : '0'} source=${sourceCheck.source || ''} status=${sourceCheck.status || ''}`);
      if (!sourceCheck.ok) {
        createToast(sourceCheck.message, 'red', 10000);
        return false;
      }
      const hasTemplate = await hasUserTemplateYaml();
      const body = sourceCheck.source == 'saved_subscription'
        ? `将按 ${sources.length} 个已保存订阅和${hasTemplate ? '当前' : '默认'}模板重建运行配置。`
        : '将使用 template.yaml 中的节点或订阅重建运行配置。';
      if (confirm) {
        const confirmed = await askConfirm(
          'mm_template_overwrite_confirm',
          '\u5e94\u7528\u914d\u7f6e\u6a21\u677f\uff1f',
          `${body}<br>校验或启动失败时会恢复旧配置。`,
          '\u5f00\u59cb\u5e94\u7528',
          '\u53d6\u6d88',
        );
        if (!confirmed) return false;
      }

      if (sourceCheck.source == 'saved_subscription') {
        createToast(hasTemplate
          ? '\u6b63\u5728\u6309\u914d\u7f6e\u6a21\u677f\u751f\u6210 config.yaml...'
          : '\u6b63\u5728\u6309\u9ed8\u8ba4 F50 \u6a21\u677f\u751f\u6210 config.yaml...', 'yellow');
        const rollbackPath = await createConfigRollbackPoint('template_rebuild_sources');
        if (rollbackPath === null) {
          createToast('无法创建 config.yaml 回滚点，未应用模板。', 'red', 9000);
          return false;
        }
        if (!(await ensureTemplateProviders(sources, { forceTemplate: true, showToast: true }))) return false;
        let localConversion = null;
        if (currentConvertMode == SUB_CONVERT_MODE_LOCAL) {
          localConversion = await convertSubscriptionsLocally(sources);
          if (localConversion.failed > 0) {
            const failed = localConversion.providers.find((item) => !item.ok);
            createToast(`${escapeHtml(failed && failed.name || '订阅')}：${escapeHtml(failed && failed.message || '本地转换失败')}，运行配置未修改。`, 'red', 9000);
            return false;
          }
        }
        if (!(await writeSubEntrypoint(sources, {
          backup: true,
          convertMode: currentConvertMode,
        }))) {
          await restoreConfigRollbackPoint(rollbackPath, '\u5e94\u7528\u914d\u7f6e\u6a21\u677f');
          return false;
        }
        const restarted = await restartClashWithConfigRollback(rollbackPath, '\u5e94\u7528\u914d\u7f6e\u6a21\u677f');
        if (restarted) {
          const providerUpdate = currentConvertMode == SUB_CONVERT_MODE_LOCAL
            ? await reloadLocalSubscriptionProviders(sources, localConversion)
            : await forceUpdateProvidersFromConfig({ showToast: false });
          if (currentConvertMode == SUB_CONVERT_MODE_PROVIDER && providerUpdateNeedsLocalFallback(providerUpdate)) {
            const fallback = await switchHttpProviderToLocal(sources, currentMode, { reason: 'HTTP 390' });
            return fallback.ok;
          }
          await showSubscriptionUpdateSelfCheck(sources, currentMode, providerUpdate, null, currentConvertMode);
        }
        return restarted;
      }

      if (!(await applyJsOverrideToTemplate({
        showToast: false,
        restart: false,
        sources,
        prepareTemplate: true,
      }))) return false;
      const rollbackPath = await createConfigRollbackPoint('template_rebuild_embedded');
      if (rollbackPath === null) {
        createToast('无法创建 config.yaml 回滚点，未应用模板。', 'red', 9000);
        return false;
      }
      const res = await runShellWithRoot(`
        set +e
        CONFIG=${shellQuote(CLASH_CONFIG)}
        TEMPLATE=${shellQuote(CLASH_TEMPLATE)}
        WRITE_CHECK=${shellQuote(KANO_TEMPLATE_WRITE_CHECK)}
        FLOW=${shellQuote(KANO_TEMPLATE_FLOW_DEBUG)}
        CONFIG_NEW="$CONFIG.kano_template_new.$$"
        cleanup_template_commit() {
          rc=$?
          trap - EXIT
          rm -f "$CONFIG_NEW" 2>/dev/null || true
          exit "$rc"
        }
        trap cleanup_template_commit EXIT
        : > "$WRITE_CHECK"
        echo "$(date +%Y-%m-%dT%H:%M:%S%z 2>/dev/null) shell enter template_embedded overwrite" >> "$FLOW" 2>/dev/null || true
        mkdir -p ${shellQuote(CLASH_PROXY_DIR)}
        [ -s "$TEMPLATE" ] || { echo "TEMPLATE_MISSING: template.yaml missing or empty"; exit 1; }
        stamp="$(date +%Y%m%d%H%M%S 2>/dev/null)"
        [ -n "$stamp" ] || stamp="$(cat /proc/uptime 2>/dev/null | cut -d. -f1)"
        cat "$TEMPLATE" > "$CONFIG_NEW" || { echo "CONFIG_COMMIT_FAILED: cannot stage template"; exit 1; }
        chmod 644 "$CONFIG_NEW" 2>/dev/null || true
        hash_file() {
          file="$1"
          if command -v sha256sum >/dev/null 2>&1; then sha256sum "$file" 2>/dev/null | awk '{print $1}'
          elif command -v md5sum >/dev/null 2>&1; then md5sum "$file" 2>/dev/null | awk '{print $1}'
          else cksum "$file" 2>/dev/null | awk '{print $1 ":" $2}'
          fi
        }
        old_sha="$(hash_file "$CONFIG")"
        staged_sha="$(hash_file "$CONFIG_NEW")"
        if [ -f "$CONFIG" ]; then
          cp "$CONFIG" "$CONFIG.before_template_overwrite.$stamp" 2>/dev/null || true
        fi
        mv -f "$CONFIG_NEW" "$CONFIG" || { echo "CONFIG_COMMIT_FAILED: atomic rename failed"; exit 1; }
        sync 2>/dev/null || true
        new_sha="$(hash_file "$CONFIG")"
        {
          echo "mode=template_embedded"
          echo "old_sha=$old_sha"
          echo "tmp_sha=$staged_sha"
          echo "new_sha=$new_sha"
          echo "step=committed"
          echo "time=$(date +%Y-%m-%dT%H:%M:%S%z 2>/dev/null)"
        } > ${shellQuote('/data/kano_template_write_check.out')}
        if [ -z "$staged_sha" ] || [ -z "$new_sha" ] || [ "$staged_sha" != "$new_sha" ]; then
          echo "CONFIG_COMMIT_FAILED: final config checksum differs from staged template"
          cat ${shellQuote('/data/kano_template_write_check.out')} 2>/dev/null
          exit 1
        fi
        ${setConfigSourceCmd('template.yaml')}
        ${pruneKanoBackupsCmd()}
        echo "已用 template.yaml 原子替换 config.yaml"
        echo "CONFIG_SHA_OLD=\${old_sha:-none}"
        echo "CONFIG_SHA_NEW=\${new_sha:-none}"
        echo "WRITE_CHECK=/data/kano_template_write_check.out"
        `, 30 * 1000);
      if (!res.success) {
        createToast(`\u6a21\u677f\u8986\u5199\u5931\u8d25<br>${safeTextToHtml(res.content || '')}`, 'red', 8000);
        await restoreConfigRollbackPoint(rollbackPath, '应用配置模板');
        return false;
      }
      createToast('模板已写入，正在检查并重启核心...', 'yellow', 6500);
      if (!(await sanitizeConfigForTProxy({ showToast: false, errorToast: false }))) {
        const restored = await restoreConfigRollbackPoint(rollbackPath, '\u6a21\u677f\u8986\u5199', { showToast: false });
        createToast(
          restored ? '模板配置整理失败，已恢复上一份 config.yaml' : '模板配置整理失败，且 config.yaml 回滚失败',
          restored ? 'yellow' : 'red',
          10000,
        );
        return false;
      }
      const restarted = await restartClashWithConfigRollback(rollbackPath, '\u6a21\u677f\u8986\u5199\u540e\u91cd\u542f');
      if (restarted) {
        if (currentMode != SUB_RULE_MODE_TEMPLATE && !(await persistSubSourceState(
          storedSources, SUB_RULE_MODE_TEMPLATE, currentConvertMode, { allowEmpty: true },
        ))) {
          const restored = await restoreConfigRollbackPoint(rollbackPath, '保存模板模式');
          if (restored) await restartClashWithConfigRollback(rollbackPath, '恢复原配置');
          return false;
        }
        const providerUpdate = currentConvertMode == SUB_CONVERT_MODE_LOCAL
          ? buildProviderUpdateResult([])
          : await forceUpdateProvidersFromConfig({ showToast: false });
        await showSubscriptionUpdateSelfCheck([], SUB_RULE_MODE_TEMPLATE, providerUpdate, null, currentConvertMode);
      }
      return restarted;
    };

    const readEditableLocalFile = async (fileInfo) => {
      const allowedFile = fileInfo && findEditableLocalFile(fileInfo.path);
      if (!allowedFile) return { ok: false, exists: false, content: '', message: '文件不在允许编辑列表中' };
      const res = await runShellWithRoot(`
        FILE=${shellQuote(allowedFile.path)}
        if [ -f "$FILE" ]; then
          timeout 8s awk '{print}' "$FILE"
        else
          echo __KANO_FILE_MISSING__
        fi
      `, 12 * 1000);
      const content = String(res.content || '');
      const missing = content.trim() == '__KANO_FILE_MISSING__';
      return {
        ok: res.success,
        exists: res.success && !missing,
        content: missing ? '' : content,
        message: res.success ? '' : sanitizeSubscriptionSecrets(content),
      };
    };

    const uploadEditorContent = async (content, filename) => {
      const uploadedPath = await uploadFileToDevice(
        new File([content], filename, { type: 'text/plain;charset=utf-8' }),
      );
      const found = await runShellWithRoot(`[ -f ${shellQuote(uploadedPath)} ] && echo 1 || echo 0`);
      if (!found.success || String(found.content || '').trim() != '1') throw new Error('上传文件未找到');
      return uploadedPath;
    };

    const commitUploadedConfigWithValidation = async (uploadedPath, controllerInfo = null) => {
      const rollbackPath = await createConfigRollbackPoint('uploaded_config');
      if (rollbackPath === null) {
        await runShellWithRoot(`rm -f ${shellQuote(uploadedPath)} 2>/dev/null || true`);
        createToast('无法创建 config.yaml 回滚点，已取消写入（原 config.yaml 未改动）。', 'red', 9000);
        return false;
      }
      const rollbackUploadedConfig = async (context) => {
        if (rollbackPath) {
          return await restoreConfigRollbackPoint(rollbackPath, context, { showToast: false });
        }
        const removed = await runShellWithRoot(`
          rm -f ${shellQuote(CLASH_CONFIG)} 2>/dev/null || exit 1
          [ ! -e ${shellQuote(CLASH_CONFIG)} ] || exit 1
          echo CONFIG_ROLLBACK_RESTORED_ABSENT
        `, 15 * 1000);
        return removed.success && String(removed.content || '').includes('CONFIG_ROLLBACK_RESTORED_ABSENT');
      };
      const stagePath = `${CLASH_CONFIG}.kano_upload_stage`;
      const stageRes = await runShellWithRoot(`
        set -e
        mkdir -p ${shellQuote(CLASH_PROXY_DIR)}
        rm -f ${shellQuote(stagePath)} 2>/dev/null || true
        mv ${shellQuote(uploadedPath)} ${shellQuote(stagePath)}
        chmod 644 ${shellQuote(stagePath)}
        [ -s ${shellQuote(stagePath)} ] && echo STAGE_OK
      `);
      if (!stageRes.success) {
        await runShellWithRoot(`rm -f ${shellQuote(stagePath)} ${shellQuote(uploadedPath)} 2>/dev/null || true`);
        createToast(`配置暂存失败，原 config.yaml 未改动<br>${safeTextToHtml(stageRes.content || '')}`, 'red', 9000);
        return false;
      }
      const commitRes = await runShellWithRoot(`
        set -e
        mv -f ${shellQuote(stagePath)} ${shellQuote(CLASH_CONFIG)}
        chmod 644 ${shellQuote(CLASH_CONFIG)}
        ${setConfigSourceCmd('uploaded_config')}
        [ -s ${shellQuote(CLASH_CONFIG)} ] && echo CONFIG_OK
      `);
      if (!commitRes.success) {
        await runShellWithRoot(`rm -f ${shellQuote(stagePath)} 2>/dev/null || true`);
        const restored = await rollbackUploadedConfig('上传配置');
        createToast(
          `配置写入失败，${restored ? '已恢复写入前状态' : '且写入前状态恢复失败'}<br>${safeTextToHtml(commitRes.content || '')}`,
          restored ? 'yellow' : 'red',
          10000,
        );
        return false;
      }
      if (!(await sanitizeConfigForTProxy({ showToast: false, errorToast: false }))) {
        const restored = await rollbackUploadedConfig('上传配置自检');
        createToast(
          restored ? '配置整理失败，已恢复写入前状态' : '配置整理失败，且写入前状态恢复失败',
          restored ? 'yellow' : 'red',
          10000,
        );
        return false;
      }
      const reloadRes = await reloadConfigHot(controllerInfo);
      if (reloadRes.success) {
        const rulesOk = await reapplyPolicyRulesSilent();
        if (rulesOk) {
          createToast('config.yaml 已加载，网络策略已应用', 'green', 7000);
          await isMMRunning();
          return true;
        }
        const restored = await rollbackUploadedConfig('上传配置运行态检查');
        const recoveryReload = restored ? await reloadConfigHot(controllerInfo) : { success: false };
        const recoveryOk = recoveryReload.success
          && await reapplyPolicyRulesSilent();
        if (!recoveryOk) {
          await networkRescue({ stopService: true, showOutput: false, reason: '上传配置回滚失败' });
        }
        createToast(
          restored && recoveryOk
            ? '新配置运行态检查失败，已恢复写入前配置和网络策略'
            : '新配置运行态检查失败，且写入前运行状态未能完整恢复',
          restored && recoveryOk ? 'yellow' : 'red',
          10000,
        );
        await isMMRunning();
        return false;
      }
      createToast('热加载失败，正在通过重启应用配置…', 'yellow', 7000);
      return await restartClashWithConfigRollback(rollbackPath, '上传配置后重启');
    };

    const saveConfig = async (content) => {
      try {
        const controllerInfo = await buildControllerInfo();
        const uploadedPath = await uploadEditorContent(content, 'config.yaml');
        return await commitUploadedConfigWithValidation(uploadedPath, controllerInfo);
      } catch (e) {
        createToast(`配置上传失败<br>${safeTextToHtml(e && e.message ? e.message : e)}`, 'red', 9000);
        return false;
      }
    };

    const writeEditableLocalFile = async (fileInfo, text) => {
      const allowedFile = fileInfo && findEditableLocalFile(fileInfo.path);
      if (!allowedFile) {
        createToast('文件不在允许编辑列表中', 'red');
        return false;
      }
      const content = String(text || '');
      if (!allowedFile.allowEmpty && !content.trim()) {
        createToast(`${escapeHtml(allowedFile.label)} 不能为空`, 'red');
        return false;
      }
      if (allowedFile.path == CLASH_CONFIG) return await saveConfig(content);
      if (allowedFile.path == CLASH_TEMPLATE || allowedFile.path == CLASH_TEMPLATE_BASE) {
        return await saveTemplate(new File([content], allowedFile.label, { type: 'text/yaml;charset=utf-8' }));
      }
      if (allowedFile.path == CLASH_OVERRIDE_JS) return await saveJsOverrideText(content);
      if (allowedFile.path == CLASH_SUB_URLS) {
        const invalidLineIndex = content.split(/\r?\n/).findIndex((line) => {
          const value = line.trim();
          if (!value || (value.startsWith('#') && !value.startsWith(SUB_DISABLED_MARKER))) return false;
          const storedLine = value.startsWith(SUB_DISABLED_MARKER)
            ? value.slice(SUB_DISABLED_MARKER.length).trim()
            : value;
          return !isHttpUrl((storedLine.split(/\s+/)[0] || '').trim());
        });
        if (invalidLineIndex >= 0) {
          createToast(`subscription_urls.txt 第 ${invalidLineIndex + 1} 行不是有效的 HTTP(S) 订阅地址`, 'red', 9000);
          return false;
        }
        const sources = parseStoredSubSourcesFromText(content);
        if (sources.length == 0 && !content.trim()) return await clearSubSourceFile();
        return await saveSubSources(
          sources,
          parseSubRuleModeFromText(content),
          parseSubConvertModeFromText(content),
        );
      }
      if ([CLASH_RULE_OVERRIDE_JSON, CLASH_RULE_OVERRIDE_APPLIED_JSON].includes(allowedFile.path) && content.trim()) {
        try {
          const parsed = JSON.parse(content);
          if (!isPlainYamlObject(parsed)) throw new Error('根节点必须是对象');
        } catch (e) {
          createToast(`${escapeHtml(allowedFile.label)} JSON 无效：${escapeHtml(e && e.message ? e.message : e)}`, 'red', 9000);
          return false;
        }
      }

      try {
        const uploadedPath = await uploadEditorContent(content, allowedFile.label);
        const targetDir = allowedFile.path.replace(/\/[^/]+$/, '') || '/';
        const res = await runShellWithRoot(`
          set -e
          TARGET=${shellQuote(allowedFile.path)}
          NEW="$TARGET.kano_new.$$"
          trap 'rm -f "$NEW" 2>/dev/null || true' EXIT
          mkdir -p ${shellQuote(targetDir)}
          mv ${shellQuote(uploadedPath)} "$NEW"
          chmod 600 "$NEW"
          mv -f "$NEW" "$TARGET"
          trap - EXIT
          echo FILE_SAVED
        `);
        createToast(
          res.success ? `${escapeHtml(allowedFile.label)} 已保存` : `${escapeHtml(allowedFile.label)} 保存失败<br>${safeTextToHtml(res.content || '')}`,
          res.success ? 'green' : 'red',
          7000,
        );
        return res.success;
      } catch (e) {
        createToast(`${escapeHtml(allowedFile.label)} 保存失败<br>${safeTextToHtml(e && e.message ? e.message : e)}`, 'red', 9000);
        return false;
      }
    };

    const showEditableLocalFilesDialog = async () => {
      const files = editableLocalFiles();
      const options = files
        .map((fileInfo) => `<option value="${escapeHtml(fileInfo.path)}">${escapeHtml(fileInfo.label)}</option>`)
        .join('');
      const { el, close } = createFixedToast(
        'mm_local_file_editor',
        `
          <div style="pointer-events:all;width:92vw;max-width:900px;">
            <div class="title" style="margin:0">配置文件</div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0;">
              <select id="mm_local_file_select" style="min-width:220px;flex:1;padding:8px;background:#111827;color:#dbeafe;border:1px solid rgba(148,163,184,.35);border-radius:8px;">${options}</select>
              <button id="mm_local_file_reload_btn" style="font-size:.64rem">读取</button>
            </div>
            <textarea id="mm_local_file_text" spellcheck="false" style="box-sizing:border-box;width:100%;height:55vh;min-height:260px;padding:10px;background:#050b16;color:#dbeafe;border:1px solid rgba(148,163,184,.35);border-radius:8px;font-family:monospace;font-size:.62rem;line-height:1.45;resize:vertical;"></textarea>
            <div id="mm_local_file_status" style="min-height:1.4em;margin-top:6px;font-size:.6rem;opacity:.76;"></div>
            <div class="kano-dialog-actions kano-actions-2" style="--kano-action-count:2;margin-top:10px;">
              <button id="mm_local_file_save_btn" style="font-size:.64rem">保存</button>
              <button id="mm_local_file_close_btn" style="font-size:.64rem">关闭</button>
            </div>
          </div>
        `,
      );
      const select = el.querySelector('#mm_local_file_select');
      const reloadBtn = el.querySelector('#mm_local_file_reload_btn');
      const saveBtn = el.querySelector('#mm_local_file_save_btn');
      const textarea = el.querySelector('#mm_local_file_text');
      const status = el.querySelector('#mm_local_file_status');
      const loadSelected = async () => {
        const fileInfo = findEditableLocalFile(select.value);
        if (!fileInfo) return;
        setButtonBusy(reloadBtn, true, '读取中…');
        textarea.disabled = true;
        try {
          const result = await readEditableLocalFile(fileInfo);
          textarea.value = result.content;
          status.textContent = result.ok
            ? (result.exists ? fileInfo.path : `${fileInfo.path}（文件不存在，保存时创建）`)
            : `读取失败：${result.message || '未知错误'}`;
        } finally {
          textarea.disabled = false;
          setButtonBusy(reloadBtn, false);
        }
      };
      select.onchange = loadSelected;
      reloadBtn.onclick = loadSelected;
      el.querySelector('#mm_local_file_close_btn').onclick = close;
      saveBtn.onclick = async () => {
        const fileInfo = findEditableLocalFile(select.value);
        if (!fileInfo) return;
        const operationToken = acquireCriticalOperation(`保存 ${fileInfo.label}`);
        if (!operationToken) return;
        setButtonBusy(saveBtn, true, '保存中…');
        try {
          if (await writeEditableLocalFile(fileInfo, textarea.value)) await loadSelected();
        } finally {
          setButtonBusy(saveBtn, false);
          releaseCriticalOperation(operationToken);
        }
      };
      await loadSelected();
    };

    const editBtn = document.createElement('button');
    editBtn.classList.add('btn');
    editBtn.textContent = '配置文件';
    editBtn.onclick = async () => {
      if (!(await ensureReady({ readOnly: true }))) return;
      await showEditableLocalFilesDialog();
    };

    // \u8ba2\u9605\u94fe\u63a5\u529f\u80fd
    const importSub = async () => {
      operationStage('\u8bfb\u53d6\u5df2\u4fdd\u5b58\u7684\u8ba2\u9605');
      const [currentSources, currentConvertMode, currentRuleMode, configSource] = await Promise.all([
        readCurrentSubSources({ includeDisabled: true }),
        readSavedSubConvertMode(),
        readCurrentSubRuleMode(),
        readConfigSource(),
      ]);
      const { el, close } = createFixedToast(
        'mm_sub_input_toast',
        `
            <div style="pointer-events:all;width:80vw;max-width:800px;">
                <div class="title" style="margin:0">\u8ba2\u9605\u8bbe\u7f6e</div>
                <div style="margin:14px 0;display:flex;flex-direction:column;gap:10px;">
                    <div id="mm_sub_rows" style="display:flex;flex-direction:column;gap:8px;"></div>
                    <div class="kano-dialog-actions kano-actions-2" style="--kano-action-count:2;">
                      <button style="font-size:.64rem" id="mm_sub_add_btn">\u6dfb\u52a0\u8ba2\u9605</button>
                      <button style="font-size:.64rem" id="mm_sub_clear_btn">\u6e05\u7a7a\u8ba2\u9605</button>
                    </div>
                    <label style="display:flex;align-items:center;gap:8px;font-size:.64rem;">
                      <span>配置来源</span>
                      <select id="mm_sub_rule_mode" style="flex:1;min-width:0;padding:8px;border-radius:8px;background:#111827;color:#dbeafe;">
                        <option value="${SUB_RULE_MODE_TEMPLATE}">使用本地模板</option>
                        <option value="${SUB_RULE_MODE_ORIGINAL}">使用订阅原配置</option>
                      </select>
                    </label>
                    <div style="font-size:.6rem;opacity:.72;line-height:1.5;">原配置需一个启用的完整 Mihomo YAML/JSON 订阅，保留规则、策略组和节点来源；DNS、IPv6 和流量接管仍按 F50 设置适配。</div>
                    ${configSource == 'uploaded_config' ? '<label style="font-size:.64rem;"><input type="checkbox" id="mm_sub_replace_custom"> 将所选订阅配置应用到当前自定义配置（不勾选则只保存订阅设置）</label>' : ''}
                    <div id="mm_sub_mode_hint" role="status" style="font-size:.64rem;line-height:1.6;color:#a6c8ee"></div>
                    <label id="mm_sub_convert_label" style="display:flex;align-items:center;gap:8px;font-size:.64rem;">
                      <span>节点处理</span>
                      <select id="mm_sub_convert_mode" style="flex:1;min-width:0;padding:8px;border-radius:8px;background:#111827;color:#dbeafe;">
                        <option value="${SUB_CONVERT_MODE_PROVIDER}">HTTP Provider（默认，失败时自动本地转换）</option>
                        <option value="${SUB_CONVERT_MODE_LOCAL}">设备本地转换（支持分享链接）</option>
                      </select>
                    </label>
                    <div style="font-size:.62rem;opacity:.78;line-height:1.55;padding:8px 10px;border:1px solid rgba(148,163,184,.22);border-radius:10px;background:rgba(15,23,42,.35);">每行一个订阅链接。禁用后保留链接，但不参与生成或更新；全部禁用时保留当前配置。</div>
                    <div style="font-size:.6rem;opacity:.72;line-height:1.5;">本地转换仍需联网下载订阅，数据不经过第三方转换站。</div>
                </div>
                <div class="kano-dialog-actions kano-actions-2" style="--kano-action-count:2;">
                    <button style="font-size:.64rem" id="mm_sub_submit_btn">\u4fdd\u5b58\u5e76\u66f4\u65b0</button>
                    <button style="font-size:.64rem" id="mm_sub_close_btn">\u5173\u95ed</button>
                </div>
            </div>
        `,
      );

      const rowsEl = el.querySelector('#mm_sub_rows');
      const addBtn = el.querySelector('#mm_sub_add_btn');
      const clearBtn = el.querySelector('#mm_sub_clear_btn');
      const submitBtn = el.querySelector('#mm_sub_submit_btn');
      const convertModeSelect = el.querySelector('#mm_sub_convert_mode');
      convertModeSelect.value = currentConvertMode;
      const ruleModeSelect = el.querySelector('#mm_sub_rule_mode');
      ruleModeSelect.value = currentRuleMode;
      const syncRuleMode = () => {
        const sources = Array.from(rowsEl.querySelectorAll('.mm_sub_row')).map((row) => ({ url: row.querySelector('.mm_sub_url_input').value, enabled: row.dataset.enabled !== 'false' }));
        const stored = normalizeStoredSubSourceList(sources);
        const allowed = stored.length === 1 && stored[0].enabled;
        const original = ruleModeSelect.querySelector('option[value="original"]');
        if (original) original.disabled = !allowed;
        if (!loadingRows && !allowed && ruleModeSelect.value === SUB_RULE_MODE_ORIGINAL) ruleModeSelect.value = SUB_RULE_MODE_TEMPLATE;
        const note = el.querySelector('#mm_sub_mode_hint');
        setText(note, !allowed ? '\u591a\u6761\u94fe\u63a5\u53ea\u80fd\u4f7f\u7528\u672c\u5730\u6a21\u677f\uff1b\u8ba2\u9605\u539f\u914d\u7f6e\u9700\u4e14\u4ec5\u9700\u4e00\u6761\u5df2\u542f\u7528\u94fe\u63a5'
          : ruleModeSelect.value === SUB_RULE_MODE_ORIGINAL ? '\u5c06\u7528\u8ba2\u9605\u81ea\u5e26\u7684\u89c4\u5219\u3001\u7b56\u7565\u7ec4\u548c\u8282\u70b9\u8986\u76d6\u8fd0\u884c\u914d\u7f6e\uff0c\u4e0d\u6df7\u5165\u672c\u5730\u6a21\u677f\u89c4\u5219'
          : '\u4f7f\u7528\u63d2\u4ef6\u672c\u5730\u6a21\u677f\u7684\u89c4\u5219\u548c\u7b56\u7565\u7ec4');
        el.querySelector('#mm_sub_convert_label').style.display = ruleModeSelect.value == SUB_RULE_MODE_ORIGINAL ? 'none' : 'flex';
      };
      ruleModeSelect.onchange = syncRuleMode;

      let loadingRows = true;
      const addSubRow = (source = {}, index = rowsEl.children.length) => {
        const row = document.createElement('div');
        row.className = 'mm_sub_row';
        row.dataset.enabled = source.enabled === false ? 'false' : 'true';
        row.style.display = 'grid';
        row.style.gridTemplateColumns = 'minmax(0,1fr) repeat(2,56px)';
        row.style.gap = '6px';
        row.style.alignItems = 'center';
        const input = document.createElement('input');
        input.className = 'mm_sub_url_input';
        input.type = 'url';
        input.inputMode = 'url';
        input.autocapitalize = 'off';
        input.spellcheck = false;
        input.placeholder = `\u8ba2\u9605\u94fe\u63a5 ${index + 1}`;
        input.style.width = '100%';
        input.style.minWidth = '0';
        input.style.padding = '10px';
        input.style.border = '1px solid rgba(148,163,184,.35)';
        input.style.borderRadius = '10px';
        input.style.outline = 'none';
        input.style.background = '#111827';
        input.style.color = '#dbeafe';
        input.value = source.url || '';
        input.addEventListener('input', syncRuleMode);
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mm_sub_toggle_btn';
        toggleBtn.style.fontSize = '.64rem';
        toggleBtn.style.width = '100%';
        const syncToggleState = () => {
          const enabled = row.dataset.enabled != 'false';
          toggleBtn.textContent = enabled ? '禁用' : '启用';
          toggleBtn.setAttribute('aria-pressed', enabled ? 'false' : 'true');
          input.style.opacity = enabled ? '1' : '.55';
          input.style.borderStyle = enabled ? 'solid' : 'dashed';
        };
        toggleBtn.onclick = () => {
          row.dataset.enabled = row.dataset.enabled == 'false' ? 'true' : 'false';
          syncToggleState();
          syncRuleMode();
        };
        const removeBtn = document.createElement('button');
        removeBtn.className = 'mm_sub_remove_btn';
        removeBtn.style.fontSize = '.64rem';
        removeBtn.style.width = '100%';
        removeBtn.textContent = '\u5220\u9664';
        removeBtn.onclick = () => {
          if (rowsEl.children.length <= 1) {
            input.value = '';
            row.dataset.enabled = 'true';
            syncToggleState();
            syncRuleMode();
            return;
          }
          row.remove();
          syncRuleMode();
        };
        row.appendChild(input);
        row.appendChild(toggleBtn);
        row.appendChild(removeBtn);
        rowsEl.appendChild(row);
        syncToggleState();
        syncRuleMode();
      };

      if (currentSources.length > 0) {
        currentSources.forEach((source, index) => addSubRow(source, index));
      } else {
        addSubRow();
      }
      loadingRows = false;
      ruleModeSelect.value = currentRuleMode;
      syncRuleMode();
      addBtn.onclick = () => addSubRow();
      clearBtn.onclick = async () => {
        const confirmed = await askConfirm(
          'mm_sub_clear_confirm',
          '\u6e05\u7a7a\u5f53\u524d\u7f16\u8f91\u5185\u5bb9\uff1f',
          '\u4ec5\u6e05\u7a7a\u5f53\u524d\u7a97\u53e3\u7684\u8f93\u5165\u3002\u70b9\u300c\u4fdd\u5b58\u5e76\u66f4\u65b0\u300d\u540e\u624d\u4f1a\u6e05\u7a7a\u5df2\u4fdd\u5b58\u7684\u8ba2\u9605\u6e90\uff1b\u76f4\u63a5\u5173\u95ed\u4e0d\u4f1a\u4fee\u6539\u8bbe\u5907\u3002',
          '\u6e05\u7a7a',
          '\u53d6\u6d88',
        );
        if (!confirmed) return;
        resetChildren(rowsEl);
        addSubRow();
      };

      el.querySelector('#mm_sub_close_btn').onclick = close;
      submitBtn.onclick = async () => {
        const sources = Array.from(rowsEl.querySelectorAll('.mm_sub_row')).map((row) => ({
          url: row.querySelector('.mm_sub_url_input').value,
          enabled: row.dataset.enabled != 'false',
        }));

        if (showSuspiciousSubSourcesError(sources)) return;

        const hasSubscriptionUrl = sources.some((source) => String(source.url || '').trim());

        const operationToken = acquireCriticalOperation('保存更新订阅');
        if (!operationToken) return;

        setButtonBusy(submitBtn, true, '\u5904\u7406\u4e2d\u2026');

        try {
          if (!hasSubscriptionUrl) {
            const success = await clearSubSourceFile();
            if (success) close();
            return;
          }
          createToast('\u6b63\u5728\u5904\u7406\u8ba2\u9605...', 'yellow');
          const success = await saveSubSources(
            sources,
            ruleModeSelect.value,
            convertModeSelect.value,
            { applyToCustom: !!el.querySelector('#mm_sub_replace_custom')?.checked },
          );

          operationFinish(success);
          if (success) {
            close();
          }
        } catch (e) {
          operationFinish(false, e.message || String(e));
          createToast(`\u5904\u7406\u8ba2\u9605\u5931\u8d25<br>${safeTextToHtml(e && e.message ? e.message : e)}`, 'red');
        } finally {
          setButtonBusy(submitBtn, false);
          releaseCriticalOperation(operationToken);
        }
      };
    };

    // \u521b\u5efa\u8ba2\u9605\u94fe\u63a5\u6309\u94ae
    const subBtn = document.createElement('button');
    subBtn.classList.add('btn');
    subBtn.textContent = '\u8ba2\u9605\u8bbe\u7f6e';
    subBtn.onclick = async () => {
  return runCriticalOperation('\u8bfb\u53d6\u8ba2\u9605\u8bbe\u7f6e', async () => {
    if (!(await ensureReady({ readOnly: true }))) return false;
    await importSub();
    return true;
  });
};

    const updateSubBtn = document.createElement('button');
    updateSubBtn.classList.add('btn');
    updateSubBtn.textContent = '\u66f4\u65b0\u8ba2\u9605';
    updateSubBtn.onclick = async () => {
      const operationToken = acquireCriticalOperation('更新订阅');
      if (!operationToken) return;
      setButtonBusy(updateSubBtn, true, '\u66f4\u65b0\u4e2d\u2026');
      try {
        operationStage('\u68c0\u67e5\u8ba2\u9605');
        if (!(await ensureReady({ readOnly: true }))) { operationFinish(false); return; }
        if (await readConfigSource() == 'uploaded_config') {
          operationFinish(await updateSubProviders([]));
          return;
        }
        const storedSources = await readCurrentSubSources({ includeDisabled: true });
        const sources = normalizeSubSourceList(storedSources);
        const ruleMode = await readCurrentSubRuleMode();
        validateSubscriptionMode(storedSources, ruleMode);
        const convertMode = await readSavedSubConvertMode();
        if (storedSources.length > 0 && sources.length == 0) {
          createToast('所有订阅链接均已禁用，请先启用至少一个订阅。', 'yellow', 7000);
          return;
        }
        if (sources.length == 0) {
          const sourceCheck = await inspectConfigNodeSource(sources, { requireSavedSubscription: true });
          if (!sourceCheck.ok) {
            createToast(sourceCheck.message, 'red', 10000);
            return;
          }
        }
        createToast('正在检查订阅并选择更新方式...', 'yellow');
        const updated = await updateSubProviders(sources, ruleMode, convertMode);
        operationFinish(updated);
      } catch (error) {
        operationFinish(false, error.message || String(error));
        createToast(safeTextToHtml(error.message || String(error)), 'red', 10000);
      } finally {
        setButtonBusy(updateSubBtn, false);
        releaseCriticalOperation(operationToken);
      }
    };

    const applySavedOverrides = async () => {
      createToast('正在重建配置并应用自定义规则...', 'yellow');
      return await overwriteConfigByTemplate({ confirm: false });
    };

    const showRuleOverrideDialog = async () => {
      const [savedConfig, runtimeConfig] = await Promise.all([
        readRuleOverrideConfig(),
        readYamlObject(CLASH_CONFIG, 'config.yaml'),
      ]);
      let config = normalizeRuleOverrideConfig(savedConfig);
      const policyNames = runtimeConfig.ok && Array.isArray(runtimeConfig.value['proxy-groups'])
        ? runtimeConfig.value['proxy-groups']
          .map((group) => String(group && group.name || '').trim())
          .filter(Boolean)
        : [];
      const policyOptions = [...new Set(['DIRECT', 'REJECT', ...policyNames])];
      const typeOptionsHtml = [...RULE_OVERRIDE_TYPES]
        .map((type) => `<option value="${type}">${type}</option>`)
        .join('');
      const policyOptionsHtml = policyOptions
        .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
        .join('');
      const { el, close } = createFixedToast(
        'mm_rule_override_toast',
        `
          <div style="pointer-events:all;width:94vw;max-width:980px;">
            <div class="title" style="margin:0">图形规则</div>
            <div style="margin:10px 0;font-size:.62rem;line-height:1.65;opacity:.78;">
              用于少量自定义规则。应用时会重建并校验配置，失败自动回滚。
            </div>
            <label style="display:flex;gap:8px;align-items:center;margin-bottom:10px;font-size:.66rem;">
              <input id="mm_rule_override_enabled" type="checkbox" /> 启用图形规则
            </label>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(138px,1fr));gap:8px;align-items:center;">
              <select id="mm_rule_override_type" style="min-width:0;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:#0f172a;color:#dbeafe;padding:8px;font-size:.62rem;">${typeOptionsHtml}</select>
              <input id="mm_rule_override_content" type="text" autocomplete="off" placeholder="规则内容，如 apple.com / CN / 443" style="min-width:0;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:#0f172a;color:#dbeafe;padding:8px;font-size:.62rem;" />
              <select id="mm_rule_override_policy" aria-label="规则策略" style="min-width:0;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:#0f172a;color:#dbeafe;padding:8px;font-size:.62rem;">${policyOptionsHtml}</select>
              <select id="mm_rule_override_position" style="min-width:0;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:#0f172a;color:#dbeafe;padding:8px;font-size:.62rem;">
                <option value="prepend">前置</option>
                <option value="append">后置</option>
              </select>
              <label style="display:flex;gap:5px;align-items:center;font-size:.62rem;white-space:nowrap;"><input id="mm_rule_override_no_resolve" type="checkbox" /> no-resolve</label>
              <button style="font-size:.62rem" id="mm_rule_override_add_btn">添加规则</button>
            </div>
            <div id="mm_rule_override_list" style="margin-top:12px;max-height:42vh;overflow:auto;border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:8px;background:rgba(15,23,42,.32);"></div>
            <div class="kano-dialog-actions kano-actions-4" style="--kano-action-count:4;margin-top:10px;">
              <button style="font-size:.64rem" id="mm_rule_override_save_btn">保存</button>
              <button style="font-size:.64rem" id="mm_rule_override_apply_btn">保存并应用</button>
              <button style="font-size:.64rem" id="mm_rule_override_clear_btn">清空</button>
              <button style="font-size:.64rem" id="mm_rule_override_close_btn">关闭</button>
            </div>
          </div>
        `,
      );
      const enabledInput = el.querySelector('#mm_rule_override_enabled');
      const typeInput = el.querySelector('#mm_rule_override_type');
      const contentInput = el.querySelector('#mm_rule_override_content');
      const policyInput = el.querySelector('#mm_rule_override_policy');
      const positionInput = el.querySelector('#mm_rule_override_position');
      const noResolveInput = el.querySelector('#mm_rule_override_no_resolve');
      const listEl = el.querySelector('#mm_rule_override_list');
      const addBtn = el.querySelector('#mm_rule_override_add_btn');
      const saveBtn = el.querySelector('#mm_rule_override_save_btn');
      const applyBtn = el.querySelector('#mm_rule_override_apply_btn');
      const clearBtn = el.querySelector('#mm_rule_override_clear_btn');
      enabledInput.checked = config.enabled !== false;
      el.querySelector('#mm_rule_override_close_btn').onclick = close;

      const syncConfig = () => {
        config.enabled = enabledInput.checked;
        config = normalizeRuleOverrideConfig(config);
        return config;
      };

      const renderRules = () => {
        syncConfig();
        resetChildren(listEl);
        if (config.rules.length == 0) {
          const empty = document.createElement('div');
          empty.style.cssText = 'opacity:.65;font-size:.64rem;line-height:1.7;padding:4px;';
          empty.textContent = '暂无图形规则';
          listEl.appendChild(empty);
          return;
        }
        config.rules.forEach((rule, index) => {
          const row = document.createElement('div');
          row.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px;border-bottom:1px solid rgba(255,255,255,.1);';
          const textWrap = document.createElement('div');
          textWrap.style.minWidth = '0';
          const ruleText = document.createElement('div');
          ruleText.style.cssText = 'font-family:Consolas,Monaco,monospace;font-size:.64rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          ruleText.textContent = formatRuleOverrideRule(rule);
          const meta = document.createElement('div');
          meta.style.cssText = 'font-size:.56rem;opacity:.62;margin-top:2px;';
          meta.textContent = rule.position == 'append' ? '后置' : '前置';
          textWrap.appendChild(ruleText);
          textWrap.appendChild(meta);
          const actions = document.createElement('div');
          actions.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;';
          [['up', '上移'], ['down', '下移'], ['delete', '删除']].forEach(([action, label]) => {
            const button = document.createElement('button');
            button.style.cssText = 'font-size:.56rem;padding:4px 7px;';
            button.dataset.ruleAction = action;
            button.dataset.ruleIndex = String(index);
            button.textContent = label;
            button.onclick = () => {
              const ruleIndex = Number(button.dataset.ruleIndex);
              if (action == 'delete') config.rules.splice(ruleIndex, 1);
              if (action == 'up' && ruleIndex > 0) {
                const item = config.rules.splice(ruleIndex, 1)[0];
                config.rules.splice(ruleIndex - 1, 0, item);
              }
              if (action == 'down' && ruleIndex < config.rules.length - 1) {
                const item = config.rules.splice(ruleIndex, 1)[0];
                config.rules.splice(ruleIndex + 1, 0, item);
              }
              renderRules();
            };
            actions.appendChild(button);
          });
          row.appendChild(textWrap);
          row.appendChild(actions);
          listEl.appendChild(row);
        });
      };

      addBtn.onclick = () => {
        const rule = normalizeRuleOverrideRule({
          type: typeInput.value,
          content: contentInput.value,
          policy: policyInput.value,
          position: positionInput.value,
          noResolve: noResolveInput.checked,
        });
        if (!rule) {
          createToast('请填写完整的规则类型、内容和策略', 'yellow', 5000);
          return;
        }
        if (rule.content.includes(',')) {
          createToast('复杂规则请使用 JS 覆写，图形规则内容不能包含英文逗号', 'yellow', 6000);
          return;
        }
        const key = `${rule.position}|${formatRuleOverrideRule(rule)}`;
        if (config.rules.some((item) => `${item.position}|${formatRuleOverrideRule(item)}` == key)) {
          createToast('这条规则已经存在', 'yellow', 4000);
          return;
        }
        syncConfig();
        config.rules.push(rule);
        contentInput.value = '';
        renderRules();
      };
      clearBtn.onclick = () => {
        config.rules = [];
        renderRules();
      };
      const saveCurrent = async () => saveRuleOverrideConfig(syncConfig());
      saveBtn.onclick = async () => {
        const operationToken = acquireCriticalOperation('保存图形规则');
        if (!operationToken) return;
        setButtonBusy(saveBtn, true, '保存中…');
        try {
          if (await saveCurrent()) createToast('图形规则已保存', 'green');
        } finally {
          setButtonBusy(saveBtn, false);
          releaseCriticalOperation(operationToken);
        }
      };
      applyBtn.onclick = async () => {
        const operationToken = acquireCriticalOperation('应用图形规则');
        if (!operationToken) return;
        setButtonBusy(applyBtn, true, '应用中…');
        try {
          if (!(await saveCurrent())) return;
          if (await applySavedOverrides()) close();
        } finally {
          setButtonBusy(applyBtn, false);
          releaseCriticalOperation(operationToken);
        }
      };
      renderRules();
    };

    const showJsOverrideDialog = async () => {
      const current = await readJsOverrideText();
      const { el, close } = createFixedToast(
        'mm_js_override_toast',
        `
          <div style="pointer-events:all;width:92vw;max-width:900px;">
            <div class="title" style="margin:0">JS 覆写</div>
            <div style="margin:10px 0;font-size:.62rem;line-height:1.65;opacity:.78;">
              定义 <code>main(config)</code> 处理复杂规则；清空并保存可停用。
            </div>
            <textarea id="mm_js_override_text" spellcheck="false" autocapitalize="off" style="width:100%;height:430px;max-height:60vh;border:1px solid rgba(96,165,250,.35);border-radius:12px;background:#111827;color:#E5E7EB;caret-color:#60A5FA;box-sizing:border-box;font-family:Consolas,Monaco,monospace,'Microsoft YaHei';line-height:1.5;padding:12px;outline:none;"></textarea>
            <div class="kano-dialog-actions kano-actions-4" style="--kano-action-count:4;margin-top:10px;">
              <button style="font-size:.64rem" id="mm_js_override_save_btn">保存</button>
              <button style="font-size:.64rem" id="mm_js_override_apply_btn">保存并应用</button>
              <button style="font-size:.64rem" id="mm_js_override_example_btn">恢复示例</button>
              <button style="font-size:.64rem" id="mm_js_override_close_btn">关闭</button>
            </div>
          </div>
        `,
      );
      const textarea = el.querySelector('#mm_js_override_text');
      const saveBtn = el.querySelector('#mm_js_override_save_btn');
      const applyBtn = el.querySelector('#mm_js_override_apply_btn');
      textarea.value = current;
      el.querySelector('#mm_js_override_close_btn').onclick = close;
      el.querySelector('#mm_js_override_example_btn').onclick = () => {
        textarea.value = buildDefaultOverrideJs();
      };
      saveBtn.onclick = async () => {
        const operationToken = acquireCriticalOperation('保存 JS 覆写');
        if (!operationToken) return;
        setButtonBusy(saveBtn, true, '保存中…');
        try {
          if (await saveJsOverrideText(textarea.value)) createToast('JS 覆写已保存', 'green');
        } finally {
          setButtonBusy(saveBtn, false);
          releaseCriticalOperation(operationToken);
        }
      };
      applyBtn.onclick = async () => {
        const operationToken = acquireCriticalOperation('应用 JS 覆写');
        if (!operationToken) return;
        setButtonBusy(applyBtn, true, '应用中…');
        try {
          if (!(await saveJsOverrideText(textarea.value))) return;
          if (await applySavedOverrides()) close();
        } finally {
          setButtonBusy(applyBtn, false);
          releaseCriticalOperation(operationToken);
        }
      };
    };

    const templateOverrideBtn = document.createElement('button');
    templateOverrideBtn.classList.add('btn');
    templateOverrideBtn.textContent = '配置与规则';
    templateOverrideBtn.onclick = async () => {
      if (!(await ensureReady({ readOnly: true }))) return;
      const [ruleOverride, jsOverrideSaved] = await Promise.all([
        readRuleOverrideConfig(),
        hasSavedJsOverride(),
      ]);
      const activeRuleCount = ruleOverride.enabled === false ? 0 : ruleOverride.rules.length;
      const { el, close } = createFixedToast(
        'mm_template_override_center',
        `
          <div style="pointer-events:all;width:90vw;max-width:760px;">
            <div class="title" style="margin:0">配置与规则</div>
            <div style="margin:10px 0;padding:9px 10px;border:1px solid rgba(148,163,184,.24);border-radius:8px;font-size:.61rem;line-height:1.6;">
              图形规则 ${activeRuleCount} 条 · JS 覆写 ${jsOverrideSaved ? '已启用' : '未启用'}
            </div>
            <div class="kano-dialog-menu">
              <div class="kano-dialog-menu-section">
                <div class="kano-dialog-menu-title">规则覆写</div>
                <div class="kano-dialog-menu-grid" style="--kano-menu-cols:2;">
                  <button id="mm_template_rules_btn">图形规则</button>
                  <button id="mm_template_js_btn">JS 覆写</button>
                </div>
              </div>
              <div class="kano-dialog-menu-section">
                <div class="kano-dialog-menu-title">配置文件</div>
                <div class="kano-dialog-menu-grid" style="--kano-menu-cols:3;">
                  <button id="mm_template_upload_btn">上传模板</button>
                  <button id="mm_template_restore_package_btn">导入配置</button>
                  <button id="mm_template_rebuild_btn">应用模板</button>
                </div>
              </div>
            </div>
            <div class="kano-dialog-actions kano-actions-1" style="--kano-action-count:1;margin-top:12px;">
              <button style="font-size:.64rem" id="mm_template_close_btn">\u5173\u95ed</button>
            </div>
          </div>
        `,
      );
      const rulesBtn = el.querySelector('#mm_template_rules_btn');
      const jsBtn = el.querySelector('#mm_template_js_btn');
      const uploadTemplateBtn = el.querySelector('#mm_template_upload_btn');
      const restorePackageBtn = el.querySelector('#mm_template_restore_package_btn');
      const rebuildBtn = el.querySelector('#mm_template_rebuild_btn');
      el.querySelector('#mm_template_close_btn').onclick = close;
      uploadTemplateBtn.onclick = () => uploadEl.click();
      restorePackageBtn.onclick = () => packageUploadEl.click();
      rulesBtn.onclick = async () => {
        close();
        await wait(350);
        await showRuleOverrideDialog();
      };
      jsBtn.onclick = async () => {
        close();
        await wait(350);
        await showJsOverrideDialog();
      };
      rebuildBtn.onclick = async () => {
        const operationToken = acquireCriticalOperation('应用模板');
        if (!operationToken) return;
        setButtonBusy(rebuildBtn, true, '\u5e94\u7528\u4e2d\u2026');
        try {
          await overwriteConfigByTemplate();
        } finally {
          setButtonBusy(rebuildBtn, false);
          releaseCriticalOperation(operationToken);
        }
      };
    };

    const policyToolsBtn = document.createElement('button');
    policyToolsBtn.classList.add('btn');
    policyToolsBtn.textContent = '网络设置';
    policyToolsBtn.onclick = async () => {
      if (!(await ensureReady({ readOnly: true }))) return;
      await showPolicyToolsDialog({ initialTab: 'network' });
    };

    const quickRunBtn = document.createElement('button');
    quickRunBtn.classList.add('btn');
    quickRunBtn.textContent = '安装 / 启动';
    quickRunBtn.onclick = async ()=>{
 if(!(await ensureAdvanced()))return false;
 const r=await runShellWithRoot("test \"$(cat /data/clash/Tools/f50-controller.version 2>/dev/null)\" = '8.0.0-compat.2.3'",4000);
 if(!r.success)return await installF50PackageFromNetwork();
 return await runCriticalOperation('检查并启动猫猫',async()=>await restartClashOk({skipCheck:true}));
};

    const mmBox = document.querySelector('#mm_action_box');

    const appendActionGroup = (title, buttons, openGroup = false) => {
      const visibleButtons = buttons.filter(Boolean);
      const details = document.createElement('details');
      details.className = 'kano-action-group';
      if (openGroup) details.open = true;
      const summary = document.createElement('summary');
      summary.textContent = title;
      const inner = document.createElement('div');
      inner.className = 'kano-action-inner';
      if (visibleButtons.length % 2 == 1) inner.classList.add('kano-action-inner-odd');
      visibleButtons.forEach((button) => inner.appendChild(button));
      details.appendChild(summary);
      details.appendChild(inner);
      mmBox.appendChild(details);
      return details;
    };

    const coreGroup = appendActionGroup('\u6838\u5fc3\u4e0e\u9762\u677f', [quickRunBtn, btn_restart, stopBtn, boot_on, webPanelToggleBtn, refresh, open, controllerSettingsBtn], false);
    appendActionGroup('\u8ba2\u9605\u4e0e\u914d\u7f6e', [subBtn, updateSubBtn, userAgentBtn, templateOverrideBtn, editBtn, backupBtn], false);
    appendActionGroup('\u7f51\u7edc\u4e0e\u8bca\u65ad', [policyToolsBtn, rescueBtn, showLogBtn], false);
    const componentsGroup = appendActionGroup('\u7ec4\u4ef6\u4e0e\u7ef4\u62a4', [btn_enabled, localPackageBtn, clearCacheBtn, btn_disabled], false);
    let bootProbeLoaded = false;
    let bootProbePending = false;
    coreGroup.addEventListener('toggle', async () => {
      if (!coreGroup.open || bootProbeLoaded || bootProbePending) return;
      bootProbePending = true;
      try {
        const isBootUp = await checkIsBootUp();
        boot_on.style.background = isBootUp ? 'var(--dark-btn-color-active)' : '';
        bootProbeLoaded = true;
      } catch (e) {
        console.error('猫猫自启状态读取失败', e);
      } finally {
        bootProbePending = false;
      }
    });

    let colTimer = null;
    let colTimer1 = null;
    collapseGen('#collapse_mm_btn', '#collapse_mm', '#collapse_mm', (e) => {
      colTimer && clearTimeout(colTimer);
      colTimer1 && clearTimeout(colTimer1);
      if (e == 'open') {
        colTimer1 = setTimeout(() => {
          if (isWebPanelVisible()) {
            refreshPanel({ forceReload: false }).catch((e) => console.error('猫猫面板加载失败', e));
          }
        }, 300);
      } else {
        panelLoadRequestId++;
        colTimer = setTimeout(() => {
          const iframe = document.getElementById('mm_iframe');
          if (iframe) iframe.src = 'about:blank';
        }, 30 * 1000);
      }
    });
    (async () => {
      try {
        await setWebPanelVisible(isWebPanelVisible(), { load: false });
        if (localStorage.getItem('#collapse_mm') == 'open' && isWebPanelVisible()) {
          refreshPanel({ forceReload: false }).catch((e) => console.error('猫猫面板加载失败', e));
        }
        // 先完成首屏渲染，再异步读取运行状态；不自动写防火墙、不迁移自启、不下载 Go helper。
        setTimeout(() => {
          isMMRunning().catch((e) => console.error('猫猫运行状态读取失败', e));
        }, 0);
      } catch (e) {
        console.error('猫猫TProxy background initialization failed', e);
      }
    })();
  })();
})(runShellWithRoot);
//</script >

/*
License for this source distribution:
                    GNU AFFERO GENERAL PUBLIC LICENSE
                       Version 3, 19 November 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The GNU Affero General Public License is a free, copyleft license for
software and other kinds of works, specifically designed to ensure
cooperation with the community in the case of network server software.

  The licenses for most software and other practical works are designed
to take away your freedom to share and change the works.  By contrast,
our General Public Licenses are intended to guarantee your freedom to
share and change all versions of a program--to make sure it remains free
software for all its users.

  When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that you
have the freedom to distribute copies of free software (and charge for
them if you wish), that you receive source code or can get it if you
want it, that you can change the software or use pieces of it in new
free programs, and that you know you can do these things.

  Developers that use our General Public Licenses protect your rights
with two steps: (1) assert copyright on the software, and (2) offer
you this License which gives you legal permission to copy, distribute
and/or modify the software.

  A secondary benefit of defending all users' freedom is that
improvements made in alternate versions of the program, if they
receive widespread use, become available for other developers to
incorporate.  Many developers of free software are heartened and
encouraged by the resulting cooperation.  However, in the case of
software used on network servers, this result may fail to come about.
The GNU General Public License permits making a modified version and
letting the public access it on a server without ever releasing its
source code to the public.

  The GNU Affero General Public License is designed specifically to
ensure that, in such cases, the modified source code becomes available
to the community.  It requires the operator of a network server to
provide the source code of the modified version running there to the
users of that server.  Therefore, public use of a modified version, on
a publicly accessible server, gives the public access to the source
code of the modified version.

  An older license, called the Affero General Public License and
published by Affero, was designed to accomplish similar goals.  This is
a different license, not a version of the Affero GPL, but Affero has
released a new version of the Affero GPL which permits relicensing under
this license.

  The precise terms and conditions for copying, distribution and
modification follow.

                       TERMS AND CONDITIONS

  0. Definitions.

  "This License" refers to version 3 of the GNU Affero General Public License.

  "Copyright" also means copyright-like laws that apply to other kinds of
works, such as semiconductor masks.

  "The Program" refers to any copyrightable work licensed under this
License.  Each licensee is addressed as "you".  "Licensees" and
"recipients" may be individuals or organizations.

  To "modify" a work means to copy from or adapt all or part of the work
in a fashion requiring copyright permission, other than the making of an
exact copy.  The resulting work is called a "modified version" of the
earlier work or a work "based on" the earlier work.

  A "covered work" means either the unmodified Program or a work based
on the Program.

  To "propagate" a work means to do anything with it that, without
permission, would make you directly or secondarily liable for
infringement under applicable copyright law, except executing it on a
computer or modifying a private copy.  Propagation includes copying,
distribution (with or without modification), making available to the
public, and in some countries other activities as well.

  To "convey" a work means any kind of propagation that enables other
parties to make or receive copies.  Mere interaction with a user through
a computer network, with no transfer of a copy, is not conveying.

  An interactive user interface displays "Appropriate Legal Notices"
to the extent that it includes a convenient and prominently visible
feature that (1) displays an appropriate copyright notice, and (2)
tells the user that there is no warranty for the work (except to the
extent that warranties are provided), that licensees may convey the
work under this License, and how to view a copy of this License.  If
the interface presents a list of user commands or options, such as a
menu, a prominent item in the list meets this criterion.

  1. Source Code.

  The "source code" for a work means the preferred form of the work
for making modifications to it.  "Object code" means any non-source
form of a work.

  A "Standard Interface" means an interface that either is an official
standard defined by a recognized standards body, or, in the case of
interfaces specified for a particular programming language, one that
is widely used among developers working in that language.

  The "System Libraries" of an executable work include anything, other
than the work as a whole, that (a) is included in the normal form of
packaging a Major Component, but which is not part of that Major
Component, and (b) serves only to enable use of the work with that
Major Component, or to implement a Standard Interface for which an
implementation is available to the public in source code form.  A
"Major Component", in this context, means a major essential component
(kernel, window system, and so on) of the specific operating system
(if any) on which the executable work runs, or a compiler used to
produce the work, or an object code interpreter used to run it.

  The "Corresponding Source" for a work in object code form means all
the source code needed to generate, install, and (for an executable
work) run the object code and to modify the work, including scripts to
control those activities.  However, it does not include the work's
System Libraries, or general-purpose tools or generally available free
programs which are used unmodified in performing those activities but
which are not part of the work.  For example, Corresponding Source
includes interface definition files associated with source files for
the work, and the source code for shared libraries and dynamically
linked subprograms that the work is specifically designed to require,
such as by intimate data communication or control flow between those
subprograms and other parts of the work.

  The Corresponding Source need not include anything that users
can regenerate automatically from other parts of the Corresponding
Source.

  The Corresponding Source for a work in source code form is that
same work.

  2. Basic Permissions.

  All rights granted under this License are granted for the term of
copyright on the Program, and are irrevocable provided the stated
conditions are met.  This License explicitly affirms your unlimited
permission to run the unmodified Program.  The output from running a
covered work is covered by this License only if the output, given its
content, constitutes a covered work.  This License acknowledges your
rights of fair use or other equivalent, as provided by copyright law.

  You may make, run and propagate covered works that you do not
convey, without conditions so long as your license otherwise remains
in force.  You may convey covered works to others for the sole purpose
of having them make modifications exclusively for you, or provide you
with facilities for running those works, provided that you comply with
the terms of this License in conveying all material for which you do
not control copyright.  Those thus making or running the covered works
for you must do so exclusively on your behalf, under your direction
and control, on terms that prohibit them from making any copies of
your copyrighted material outside their relationship with you.

  Conveying under any other circumstances is permitted solely under
the conditions stated below.  Sublicensing is not allowed; section 10
makes it unnecessary.

  3. Protecting Users' Legal Rights From Anti-Circumvention Law.

  No covered work shall be deemed part of an effective technological
measure under any applicable law fulfilling obligations under article
11 of the WIPO copyright treaty adopted on 20 December 1996, or
similar laws prohibiting or restricting circumvention of such
measures.

  When you convey a covered work, you waive any legal power to forbid
circumvention of technological measures to the extent such circumvention
is effected by exercising rights under this License with respect to
the covered work, and you disclaim any intention to limit operation or
modification of the work as a means of enforcing, against the work's
users, your or third parties' legal rights to forbid circumvention of
technological measures.

  4. Conveying Verbatim Copies.

  You may convey verbatim copies of the Program's source code as you
receive it, in any medium, provided that you conspicuously and
appropriately publish on each copy an appropriate copyright notice;
keep intact all notices stating that this License and any
non-permissive terms added in accord with section 7 apply to the code;
keep intact all notices of the absence of any warranty; and give all
recipients a copy of this License along with the Program.

  You may charge any price or no price for each copy that you convey,
and you may offer support or warranty protection for a fee.

  5. Conveying Modified Source Versions.

  You may convey a work based on the Program, or the modifications to
produce it from the Program, in the form of source code under the
terms of section 4, provided that you also meet all of these conditions:

    a) The work must carry prominent notices stating that you modified
    it, and giving a relevant date.

    b) The work must carry prominent notices stating that it is
    released under this License and any conditions added under section
    7.  This requirement modifies the requirement in section 4 to
    "keep intact all notices".

    c) You must license the entire work, as a whole, under this
    License to anyone who comes into possession of a copy.  This
    License will therefore apply, along with any applicable section 7
    additional terms, to the whole of the work, and all its parts,
    regardless of how they are packaged.  This License gives no
    permission to license the work in any other way, but it does not
    invalidate such permission if you have separately received it.

    d) If the work has interactive user interfaces, each must display
    Appropriate Legal Notices; however, if the Program has interactive
    interfaces that do not display Appropriate Legal Notices, your
    work need not make them do so.

  A compilation of a covered work with other separate and independent
works, which are not by their nature extensions of the covered work,
and which are not combined with it such as to form a larger program,
in or on a volume of a storage or distribution medium, is called an
"aggregate" if the compilation and its resulting copyright are not
used to limit the access or legal rights of the compilation's users
beyond what the individual works permit.  Inclusion of a covered work
in an aggregate does not cause this License to apply to the other
parts of the aggregate.

  6. Conveying Non-Source Forms.

  You may convey a covered work in object code form under the terms
of sections 4 and 5, provided that you also convey the
machine-readable Corresponding Source under the terms of this License,
in one of these ways:

    a) Convey the object code in, or embodied in, a physical product
    (including a physical distribution medium), accompanied by the
    Corresponding Source fixed on a durable physical medium
    customarily used for software interchange.

    b) Convey the object code in, or embodied in, a physical product
    (including a physical distribution medium), accompanied by a
    written offer, valid for at least three years and valid for as
    long as you offer spare parts or customer support for that product
    model, to give anyone who possesses the object code either (1) a
    copy of the Corresponding Source for all the software in the
    product that is covered by this License, on a durable physical
    medium customarily used for software interchange, for a price no
    more than your reasonable cost of physically performing this
    conveying of source, or (2) access to copy the
    Corresponding Source from a network server at no charge.

    c) Convey individual copies of the object code with a copy of the
    written offer to provide the Corresponding Source.  This
    alternative is allowed only occasionally and noncommercially, and
    only if you received the object code with such an offer, in accord
    with subsection 6b.

    d) Convey the object code by offering access from a designated
    place (gratis or for a charge), and offer equivalent access to the
    Corresponding Source in the same way through the same place at no
    further charge.  You need not require recipients to copy the
    Corresponding Source along with the object code.  If the place to
    copy the object code is a network server, the Corresponding Source
    may be on a different server (operated by you or a third party)
    that supports equivalent copying facilities, provided you maintain
    clear directions next to the object code saying where to find the
    Corresponding Source.  Regardless of what server hosts the
    Corresponding Source, you remain obligated to ensure that it is
    available for as long as needed to satisfy these requirements.

    e) Convey the object code using peer-to-peer transmission, provided
    you inform other peers where the object code and Corresponding
    Source of the work are being offered to the general public at no
    charge under subsection 6d.

  A separable portion of the object code, whose source code is excluded
from the Corresponding Source as a System Library, need not be
included in conveying the object code work.

  A "User Product" is either (1) a "consumer product", which means any
tangible personal property which is normally used for personal, family,
or household purposes, or (2) anything designed or sold for incorporation
into a dwelling.  In determining whether a product is a consumer product,
doubtful cases shall be resolved in favor of coverage.  For a particular
product received by a particular user, "normally used" refers to a
typical or common use of that class of product, regardless of the status
of the particular user or of the way in which the particular user
actually uses, or expects or is expected to use, the product.  A product
is a consumer product regardless of whether the product has substantial
commercial, industrial or non-consumer uses, unless such uses represent
the only significant mode of use of the product.

  "Installation Information" for a User Product means any methods,
procedures, authorization keys, or other information required to install
and execute modified versions of a covered work in that User Product from
a modified version of its Corresponding Source.  The information must
suffice to ensure that the continued functioning of the modified object
code is in no case prevented or interfered with solely because
modification has been made.

  If you convey an object code work under this section in, or with, or
specifically for use in, a User Product, and the conveying occurs as
part of a transaction in which the right of possession and use of the
User Product is transferred to the recipient in perpetuity or for a
fixed term (regardless of how the transaction is characterized), the
Corresponding Source conveyed under this section must be accompanied
by the Installation Information.  But this requirement does not apply
if neither you nor any third party retains the ability to install
modified object code on the User Product (for example, the work has
been installed in ROM).

  The requirement to provide Installation Information does not include a
requirement to continue to provide support service, warranty, or updates
for a work that has been modified or installed by the recipient, or for
the User Product in which it has been modified or installed.  Access to a
network may be denied when the modification itself materially and
adversely affects the operation of the network or violates the rules and
protocols for communication across the network.

  Corresponding Source conveyed, and Installation Information provided,
in accord with this section must be in a format that is publicly
documented (and with an implementation available to the public in
source code form), and must require no special password or key for
unpacking, reading or copying.

  7. Additional Terms.

  "Additional permissions" are terms that supplement the terms of this
License by making exceptions from one or more of its conditions.
Additional permissions that are applicable to the entire Program shall
be treated as though they were included in this License, to the extent
that they are valid under applicable law.  If additional permissions
apply only to part of the Program, that part may be used separately
under those permissions, but the entire Program remains governed by
this License without regard to the additional permissions.

  When you convey a copy of a covered work, you may at your option
remove any additional permissions from that copy, or from any part of
it.  (Additional permissions may be written to require their own
removal in certain cases when you modify the work.)  You may place
additional permissions on material, added by you to a covered work,
for which you have or can give appropriate copyright permission.

  Notwithstanding any other provision of this License, for material you
add to a covered work, you may (if authorized by the copyright holders of
that material) supplement the terms of this License with terms:

    a) Disclaiming warranty or limiting liability differently from the
    terms of sections 15 and 16 of this License; or

    b) Requiring preservation of specified reasonable legal notices or
    author attributions in that material or in the Appropriate Legal
    Notices displayed by works containing it; or

    c) Prohibiting misrepresentation of the origin of that material, or
    requiring that modified versions of such material be marked in
    reasonable ways as different from the original version; or

    d) Limiting the use for publicity purposes of names of licensors or
    authors of the material; or

    e) Declining to grant rights under trademark law for use of some
    trade names, trademarks, or service marks; or

    f) Requiring indemnification of licensors and authors of that
    material by anyone who conveys the material (or modified versions of
    it) with contractual assumptions of liability to the recipient, for
    any liability that these contractual assumptions directly impose on
    those licensors and authors.

  All other non-permissive additional terms are considered "further
restrictions" within the meaning of section 10.  If the Program as you
received it, or any part of it, contains a notice stating that it is
governed by this License along with a term that is a further
restriction, you may remove that term.  If a license document contains
a further restriction but permits relicensing or conveying under this
License, you may add to a covered work material governed by the terms
of that license document, provided that the further restriction does
not survive such relicensing or conveying.

  If you add terms to a covered work in accord with this section, you
must place, in the relevant source files, a statement of the
additional terms that apply to those files, or a notice indicating
where to find the applicable terms.

  Additional terms, permissive or non-permissive, may be stated in the
form of a separately written license, or stated as exceptions;
the above requirements apply either way.

  8. Termination.

  You may not propagate or modify a covered work except as expressly
provided under this License.  Any attempt otherwise to propagate or
modify it is void, and will automatically terminate your rights under
this License (including any patent licenses granted under the third
paragraph of section 11).

  However, if you cease all violation of this License, then your
license from a particular copyright holder is reinstated (a)
provisionally, unless and until the copyright holder explicitly and
finally terminates your license, and (b) permanently, if the copyright
holder fails to notify you of the violation by some reasonable means
prior to 60 days after the cessation.

  Moreover, your license from a particular copyright holder is
reinstated permanently if the copyright holder notifies you of the
violation by some reasonable means, this is the first time you have
received notice of violation of this License (for any work) from that
copyright holder, and you cure the violation prior to 30 days after
your receipt of the notice.

  Termination of your rights under this section does not terminate the
licenses of parties who have received copies or rights from you under
this License.  If your rights have been terminated and not permanently
reinstated, you do not qualify to receive new licenses for the same
material under section 10.

  9. Acceptance Not Required for Having Copies.

  You are not required to accept this License in order to receive or
run a copy of the Program.  Ancillary propagation of a covered work
occurring solely as a consequence of using peer-to-peer transmission
to receive a copy likewise does not require acceptance.  However,
nothing other than this License grants you permission to propagate or
modify any covered work.  These actions infringe copyright if you do
not accept this License.  Therefore, by modifying or propagating a
covered work, you indicate your acceptance of this License to do so.

  10. Automatic Licensing of Downstream Recipients.

  Each time you convey a covered work, the recipient automatically
receives a license from the original licensors, to run, modify and
propagate that work, subject to this License.  You are not responsible
for enforcing compliance by third parties with this License.

  An "entity transaction" is a transaction transferring control of an
organization, or substantially all assets of one, or subdividing an
organization, or merging organizations.  If propagation of a covered
work results from an entity transaction, each party to that
transaction who receives a copy of the work also receives whatever
licenses to the work the party's predecessor in interest had or could
give under the previous paragraph, plus a right to possession of the
Corresponding Source of the work from the predecessor in interest, if
the predecessor has it or can get it with reasonable efforts.

  You may not impose any further restrictions on the exercise of the
rights granted or affirmed under this License.  For example, you may
not impose a license fee, royalty, or other charge for exercise of
rights granted under this License, and you may not initiate litigation
(including a cross-claim or counterclaim in a lawsuit) alleging that
any patent claim is infringed by making, using, selling, offering for
sale, or importing the Program or any portion of it.

  11. Patents.

  A "contributor" is a copyright holder who authorizes use under this
License of the Program or a work on which the Program is based.  The
work thus licensed is called the contributor's "contributor version".

  A contributor's "essential patent claims" are all patent claims
owned or controlled by the contributor, whether already acquired or
hereafter acquired, that would be infringed by some manner, permitted
by this License, of making, using, or selling its contributor version,
but do not include claims that would be infringed only as a
consequence of further modification of the contributor version.  For
purposes of this definition, "control" includes the right to grant
patent sublicenses in a manner consistent with the requirements of
this License.

  Each contributor grants you a non-exclusive, worldwide, royalty-free
patent license under the contributor's essential patent claims, to
make, use, sell, offer for sale, import and otherwise run, modify and
propagate the contents of its contributor version.

  In the following three paragraphs, a "patent license" is any express
agreement or commitment, however denominated, not to enforce a patent
(such as an express permission to practice a patent or covenant not to
sue for patent infringement).  To "grant" such a patent license to a
party means to make such an agreement or commitment not to enforce a
patent against the party.

  If you convey a covered work, knowingly relying on a patent license,
and the Corresponding Source of the work is not available for anyone
to copy, free of charge and under the terms of this License, through a
publicly available network server or other readily accessible means,
then you must either (1) cause the Corresponding Source to be so
available, or (2) arrange to deprive yourself of the benefit of the
patent license for this particular work, or (3) arrange, in a manner
consistent with the requirements of this License, to extend the patent
license to downstream recipients.  "Knowingly relying" means you have
actual knowledge that, but for the patent license, your conveying the
covered work in a country, or your recipient's use of the covered work
in a country, would infringe one or more identifiable patents in that
country that you have reason to believe are valid.

  If, pursuant to or in connection with a single transaction or
arrangement, you convey, or propagate by procuring conveyance of, a
covered work, and grant a patent license to some of the parties
receiving the covered work authorizing them to use, propagate, modify
or convey a specific copy of the covered work, then the patent license
you grant is automatically extended to all recipients of the covered
work and works based on it.

  A patent license is "discriminatory" if it does not include within
the scope of its coverage, prohibits the exercise of, or is
conditioned on the non-exercise of one or more of the rights that are
specifically granted under this License.  You may not convey a covered
work if you are a party to an arrangement with a third party that is
in the business of distributing software, under which you make payment
to the third party based on the extent of your activity of conveying
the work, and under which the third party grants, to any of the
parties who would receive the covered work from you, a discriminatory
patent license (a) in connection with copies of the covered work
conveyed by you (or copies made from those copies), or (b) primarily
for and in connection with specific products or compilations that
contain the covered work, unless you entered into that arrangement,
or that patent license was granted, prior to 28 March 2007.

  Nothing in this License shall be construed as excluding or limiting
any implied license or other defenses to infringement that may
otherwise be available to you under applicable patent law.

  12. No Surrender of Others' Freedom.

  If conditions are imposed on you (whether by court order, agreement or
otherwise) that contradict the conditions of this License, they do not
excuse you from the conditions of this License.  If you cannot convey a
covered work so as to satisfy simultaneously your obligations under this
License and any other pertinent obligations, then as a consequence you may
not convey it at all.  For example, if you agree to terms that obligate you
to collect a royalty for further conveying from those to whom you convey
the Program, the only way you could satisfy both those terms and this
License would be to refrain entirely from conveying the Program.

  13. Remote Network Interaction; Use with the GNU General Public License.

  Notwithstanding any other provision of this License, if you modify the
Program, your modified version must prominently offer all users
interacting with it remotely through a computer network (if your version
supports such interaction) an opportunity to receive the Corresponding
Source of your version by providing access to the Corresponding Source
from a network server at no charge, through some standard or customary
means of facilitating copying of software.  This Corresponding Source
shall include the Corresponding Source for any work covered by version 3
of the GNU General Public License that is incorporated pursuant to the
following paragraph.

  Notwithstanding any other provision of this License, you have
permission to link or combine any covered work with a work licensed
under version 3 of the GNU General Public License into a single
combined work, and to convey the resulting work.  The terms of this
License will continue to apply to the part which is the covered work,
but the work with which it is combined will remain governed by version
3 of the GNU General Public License.

  14. Revised Versions of this License.

  The Free Software Foundation may publish revised and/or new versions of
the GNU Affero General Public License from time to time.  Such new versions
will be similar in spirit to the present version, but may differ in detail to
address new problems or concerns.

  Each version is given a distinguishing version number.  If the
Program specifies that a certain numbered version of the GNU Affero General
Public License "or any later version" applies to it, you have the
option of following the terms and conditions either of that numbered
version or of any later version published by the Free Software
Foundation.  If the Program does not specify a version number of the
GNU Affero General Public License, you may choose any version ever published
by the Free Software Foundation.

  If the Program specifies that a proxy can decide which future
versions of the GNU Affero General Public License can be used, that proxy's
public statement of acceptance of a version permanently authorizes you
to choose that version for the Program.

  Later license versions may give you additional or different
permissions.  However, no additional obligations are imposed on any
author or copyright holder as a result of your choosing to follow a
later version.

  15. Disclaimer of Warranty.

  THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY
APPLICABLE LAW.  EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT
HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY
OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE.  THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM
IS WITH YOU.  SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
ALL NECESSARY SERVICING, REPAIR OR CORRECTION.

  16. Limitation of Liability.

  IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING
WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MODIFIES AND/OR CONVEYS
THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY
GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE
USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF
DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD
PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS),
EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF
SUCH DAMAGES.

  17. Interpretation of Sections 15 and 16.

  If the disclaimer of warranty and limitation of liability provided
above cannot be given local legal effect according to their terms,
reviewing courts shall apply local law that most closely approximates
an absolute waiver of all civil liability in connection with the
Program, unless a warranty or assumption of liability accompanies a
copy of the Program in return for a fee.

                     END OF TERMS AND CONDITIONS

            How to Apply These Terms to Your New Programs

  If you develop a new program, and you want it to be of the greatest
possible use to the public, the best way to achieve this is to make it
free software which everyone can redistribute and change under these terms.

  To do so, attach the following notices to the program.  It is safest
to attach them to the start of each source file to most effectively
state the exclusion of warranty; and each file should have at least
the "copyright" line and a pointer to where the full notice is found.

    <one line to give the program's name and a brief idea of what it does.>
    Copyright (C) <year>  <name of author>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

Also add information on how to contact you by electronic and paper mail.

  If your software can interact with users remotely through a computer
network, you should also make sure that it provides a way for users to
get its source.  For example, if your program is a web application, its
interface could display a "Source" link that leads users to an archive
of the code.  There are many ways you could offer source, and different
solutions will be better for different programs; see section 13 for the
specific requirements.

  You should also get your employer (if you work as a programmer) or school,
if any, to sign a "copyright disclaimer" for the program, if necessary.
For more information on this, and how to apply and follow the GNU AGPL, see
<https://www.gnu.org/licenses/>.

*/
