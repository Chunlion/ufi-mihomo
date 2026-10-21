//<script>
// GistSync 1.0.0-rc4; complete components; encrypted request protocol 1; RC2 baseline.
// Boot curl, final lease status and recovery concurrency fixes audit.5, 2026-10-11; based on audit.4; controller protocol unchanged.
// 猫猫TProxy v9.0.0 - IPv4/IPv6 private routing; based on Chunlion/ufi-mihomo (AGPL-3.0-or-later)
((hostRunShellWithRoot) => {
const F50_ZASHBOARD_UI_URL = 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip';
const F50_PORTS = {http:7890, socks:7891, mixed:7892, tproxy:7895, dns:1053, controller:7788};
const F50_MIPS_MIN_VERSION = '1.19.31';
function f50TunStack(options = {}) {
  const stack = options.tun_stack || 'auto';
  if (!['auto', 'mixed', 'gvisor', 'system', 'mips'].includes(stack)) throw new Error('TUN 协议栈无效');
  return stack === 'auto' ? (options.ipv6 === 'on' ? 'gvisor' : 'mixed') : stack;
}
const F50_DEFAULT_SECRET = '123456';
// 深合并：plain object 递归合并，数组直接整体替换；返回全新对象，不修改入参。
function f50IsPlainObject(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
function f50DeepClone(v) {
  if (Array.isArray(v)) return v.map(f50DeepClone);
  if (f50IsPlainObject(v)) { const o = {}; for (const k of Object.keys(v)) Object.defineProperty(o, k, {value:f50DeepClone(v[k]),enumerable:true,writable:true,configurable:true}); return o; }
  return v;
}
function f50DeepMerge(base, delta) {
  if (Array.isArray(delta)) return f50DeepClone(delta);
  if (f50IsPlainObject(delta)) {
    const out = {};
    if (f50IsPlainObject(base)) for (const k of Object.keys(base)) Object.defineProperty(out, k, {value:f50DeepClone(base[k]),enumerable:true,writable:true,configurable:true});
    for (const k of Object.keys(delta)) {
      const bv = f50IsPlainObject(base) ? base[k] : undefined;
      Object.defineProperty(out, k, {value:(f50IsPlainObject(bv) && f50IsPlainObject(delta[k])) ? f50DeepMerge(bv, delta[k]) : f50DeepClone(delta[k]),enumerable:true,writable:true,configurable:true});
    }
    return out;
  }
  return f50DeepClone(delta);
}
const PROFILE_BASE = {"allow-lan":true,"dns":{"default-nameserver":["223.5.5.5","119.29.29.29"],"direct-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"direct-nameserver-follow-policy":true,"enable":true,"enhanced-mode":"redir-host","nameserver":["https://1.1.1.1/dns-query#RULES","https://8.8.8.8/dns-query#RULES"],"nameserver-policy":{"+.lan":["223.5.5.5","119.29.29.29"],"+.local":["223.5.5.5","119.29.29.29"]},"prefer-h3":false,"proxy-server-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"respect-rules":false,"use-hosts":true,"use-system-hosts":false},"external-controller":`0.0.0.0:${F50_PORTS.controller}`,"external-ui":"WebUI/zashboard","find-process-mode":"off","geo-auto-update":false,"geodata-loader":"memconservative","geodata-mode":true,"log-level":"info","mixed-port":F50_PORTS.mixed,"mode":"rule","port":F50_PORTS.http,"profile":{"store-fake-ip":false,"store-selected":true},"redir-port":0,"sniffer":{"enable":true,"force-dns-mapping":true,"override-destination":true,"parse-pure-ip":true,"skip-domain":["Mijia Cloud","dlg.io.mi.com"],"skip-dst-address":["0.0.0.0/8","10.0.0.0/8","100.64.0.0/10","127.0.0.0/8","169.254.0.0/16","172.16.0.0/12","192.168.0.0/16","::1/128","fc00::/7","fe80::/10"],"sniff":{"HTTP":{"override-destination":true,"ports":[80,"8080-8880"]},"QUIC":{"override-destination":true,"ports":[443,8443]},"TLS":{"override-destination":true,"ports":[443,8443]}}},"socks-port":F50_PORTS.socks,"secret":F50_DEFAULT_SECRET};
const PROFILE_DELTA = {
  "tproxy4": {"bind-address":"0.0.0.0","dns":{"ipv6":false,"listen":`0.0.0.0:${F50_PORTS.dns}`},"ipv6":false,"tproxy-port":F50_PORTS.tproxy,"tun":{"enable":false}},
  "tproxy6": {"bind-address":"*","dns":{"ipv6":true,"listen":`[::]:${F50_PORTS.dns}`},"ipv6":true,"tproxy-port":F50_PORTS.tproxy,"tun":{"enable":false}},
  "tun4": {"bind-address":"0.0.0.0","dns":{"ipv6":false,"listen":`0.0.0.0:${F50_PORTS.dns}`},"ipv6":false,"tproxy-port":0,"tun":{"auto-detect-interface":true,"auto-redirect":false,"auto-route":false,"device":"KanoTun","dns-hijack":[],"enable":true,"mtu":1500,"stack":"mixed","strict-route":false}},
  "tun6": {"bind-address":"*","dns":{"ipv6":true,"listen":`[::]:${F50_PORTS.dns}`},"ipv6":true,"tproxy-port":0,"tun":{"auto-detect-interface":true,"auto-redirect":false,"auto-route":false,"device":"KanoTun","dns-hijack":[],"enable":true,"inet6-address":["fdfe:dcba:9876::1/126"],"mtu":1500,"stack":"gvisor","strict-route":false}},
  "off4": {"bind-address":"0.0.0.0","dns":{"ipv6":false,"listen":`0.0.0.0:${F50_PORTS.dns}`},"ipv6":false,"tproxy-port":0,"tun":{"enable":false}},
  "off6": {"bind-address":"*","dns":{"ipv6":true,"listen":`[::]:${F50_PORTS.dns}`},"ipv6":true,"tproxy-port":0,"tun":{"enable":false}},
};
const F50_FIXED_PROFILES = {};
for (const name of Object.keys(PROFILE_DELTA)) F50_FIXED_PROFILES[name] = f50DeepMerge(PROFILE_BASE, PROFILE_DELTA[name]);
for (const profile of Object.values(F50_FIXED_PROFILES)) {
  profile['external-ui-url'] = F50_ZASHBOARD_UI_URL;
  profile['unified-delay'] = true;
}
// Controller protocol and wrapper contract; independent of the plugin release version.
const F50_COMPAT_VERSION = '8.0.0-compat.2.3';
const F50_ORIGINAL_MANAGED_KEYS = ['mode', 'port', 'socks-port', 'mixed-port', 'redir-port', 'tproxy-port', 'allow-lan', 'bind-address', 'ipv6', 'external-controller', 'external-ui', 'external-ui-url'];
const F50_ORIGINAL_DNS_KEYS = ['enable', 'listen', 'ipv6'];
const F50_ORIGINAL_TUN_KEYS = [...new Set(Object.values(PROFILE_DELTA).flatMap((profile) => Object.keys(profile.tun)))];
// 硬件与脚本依赖的键：用户写入任何值都以固定 profile 为准。JS 整形与 Service 恢复共用同一边界。
const CONTROLLED_TOP_KEYS = ['mode', 'bind-address', 'ipv6', 'external-controller', 'external-ui', 'external-ui-url', 'tproxy-port', 'allow-lan'];
const CONTROLLED_DNS_KEYS = ['enable', 'listen', 'ipv6'];
const CONTROLLED_TUN_KEYS = ['enable', 'device', 'auto-route', 'auto-redirect', 'strict-route', 'dns-hijack'];
// Service 恢复用户配置时不能反向覆盖的部分：受控键、插件元信息、以及由订阅/模板生成的节点、规则与来源。
const F50_RESTORE_EXCLUDED_KEYS = [...new Set([
  ...CONTROLLED_TOP_KEYS,
  'external-ui-name', 'external-controller-tls', 'external-controller-unix', 'external-controller-pipe',
  'interface-name', 'routing-mark', 'secret', 'x-f50-profile', 'x-f50-overridden', 'x-f50-gist-sync',
  'x-f50-provider-sources', 'x-kano-private-route',
  'proxies', 'proxy-groups', 'rules', 'proxy-providers', 'rule-providers',
  'dns', 'tun', 'sniffer', 'profile',
])];
function buildF50EmergencyScript(resumeTag = '', requireIdle = false, releaseIdleOnly = false, forUninstall = releaseIdleOnly) {
  return buildF50MaintenanceFunctions('cleanup') + buildF50RecoveryEligibilityFunctions(forUninstall) + buildF50ConfigTransactionFunctions() + '\nF50_RESUME_TAG=' + shellQuote(resumeTag) + '\n' + `F50_SKIP_NATIVE_RECOVERY=1
F50_OPERATION_LOCK=\${F50_OPERATION_LOCK:-/dev/kano_tproxy_operation.lock}
F50_RECOVERY_LOCK=\${F50_RECOVERY_LOCK:-/dev/kano_tproxy_recovery.lock}
F50_WORK=$(mktemp -d "$F50_DATA/.f50-clean.XXXXXX") || exit 1
F50_RECOVERY_BODY_OK=0
f50_emergency_finish() {
  emergency_rc=$?
  trap - EXIT HUP INT TERM
  if ! rm -rf "$F50_WORK" || [ -e "$F50_WORK" ] || [ -L "$F50_WORK" ]; then
    echo F50_CLEAN_ERROR=recovery_work_cleanup_failed
    [ "$emergency_rc" != 0 ] || emergency_rc=1
  fi
  if [ "\${emergency_locked:-0}" = 1 ]; then
    if ! rm -f "$F50_RECOVERY_LOCK/owner" || ! rmdir "$F50_RECOVERY_LOCK" || [ -e "$F50_RECOVERY_LOCK" ] || [ -L "$F50_RECOVERY_LOCK" ]; then
      echo F50_CLEAN_ERROR=recovery_lock_cleanup_failed
      [ "$emergency_rc" != 0 ] || emergency_rc=1
    fi
  fi
  if [ "$F50_RECOVERY_BODY_OK" = 1 ]; then
    if [ "$emergency_rc" = 0 ]; then echo ${releaseIdleOnly ? 'F50_LEASE_RELEASED=1' : 'RECOVERY_VERIFIED'}
    else echo F50_RECOVERY_PARTIAL=1; fi
  fi
  exit "$emergency_rc"
}
trap f50_emergency_finish EXIT
trap 'exit 130' HUP INT TERM
[ ! -L "$F50_ROOT" ] && [ ! -L "$F50_OPERATION_LOCK" ] && [ ! -L "$F50_RECOVERY_LOCK" ] || { echo F50_CLEAN_ERROR=recovery_symlink; exit 1; }
if ! mkdir "$F50_RECOVERY_LOCK" 2>/dev/null; then
  read -r emergency_pid emergency_start < "$F50_RECOVERY_LOCK/owner" 2>/dev/null || { echo F50_CLEAN_ERROR=recovery_busy; exit 1; }
  case "$emergency_pid:$emergency_start" in *[!0-9:]*|:*) echo F50_CLEAN_ERROR=recovery_busy; exit 1 ;; esac
  if f50_same_process "$emergency_pid" "$emergency_start"; then echo F50_CLEAN_ERROR=recovery_busy; exit 1; fi
  rm -f "$F50_RECOVERY_LOCK/owner" && rmdir "$F50_RECOVERY_LOCK" && mkdir "$F50_RECOVERY_LOCK" || { echo F50_CLEAN_ERROR=recovery_busy; exit 1; }
fi
emergency_locked=1
${requireIdle || releaseIdleOnly ? 'f50_recovery_eligible || exit 1' : ''}
f50_stat "$$" || { echo F50_CLEAN_ERROR=recovery_identity_failed; exit 1; }
printf '%s %s\\n' "$$" "$F50_STAT_START" > "$F50_RECOVERY_LOCK/owner" || exit 1
f50_install_lock_idle || { echo F50_CLEAN_ERROR=installation_active_or_invalid; exit 1; }
${releaseIdleOnly ? `if [ -d "$F50_OPERATION_LOCK" ]; then
  rm -f "$F50_OPERATION_LOCK/frontend" "$F50_OPERATION_LOCK/owner" "$F50_OPERATION_LOCK/cancelled" && rmdir "$F50_OPERATION_LOCK" || exit 1
fi
F50_RECOVERY_BODY_OK=1
exit 0` : ''}
if [ -d "$F50_DATA/clash.install.lock.d" ]; then
  rm -f "$F50_DATA/clash.install.lock.d/pid" && rmdir "$F50_DATA/clash.install.lock.d" || exit 1
fi
if [ -n "$F50_RESUME_TAG" ]; then
  [ -d "$F50_OPERATION_LOCK" ] && [ ! -L "$F50_OPERATION_LOCK/owner" ] && [ ! -e "$F50_OPERATION_LOCK/cancelled" ] &&
    [ "$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null)" = "$F50_RESUME_TAG" ] || { echo F50_CLEAN_ERROR=resume_lease_owner_changed; exit 1; }
fi
if mkdir "$F50_OPERATION_LOCK" 2>/dev/null; then
  printf 'rescue_%s\\n' "$$" > "$F50_OPERATION_LOCK/owner" || exit 1
fi
[ -d "$F50_OPERATION_LOCK" ] && [ ! -L "$F50_OPERATION_LOCK/owner" ] && [ ! -L "$F50_OPERATION_LOCK/cancelled" ] || exit 1
printf 'recovery\\n' > "$F50_OPERATION_LOCK/cancelled" || exit 1
${requireIdle ? 'f50_recovery_eligible || exit 1' : ''}
# The fence is visible before any process is stopped. A cancelled browser is not a stopped worker.
if [ -d "$F50_ROOT/Policy" ] || [ -s "$F50_ROOT/Scripts/Clash.Service" ] || [ -s "$F50_ROOT/Proxy/Clash.Core" ]; then
  mkdir -p "$F50_ROOT/Policy" && printf 'emergency recovery\\n' > "$F50_ROOT/Policy/stopped" || { echo F50_CLEAN_ERROR=stop_latch_failed; exit 1; }
fi
f50_scan "$F50_WORK/pids" || exit 1
f50_stop_recorded "$F50_WORK/pids" || exit 1
f50_scan "$F50_WORK/after.pids" || exit 1
[ ! -s "$F50_WORK/after.pids" ] || { echo F50_CLEAN_ERROR=process_respawned; exit 1; }
config_recovery_failed=0
if [ -d "$F50_ROOT/Tools/gist-sync/activation" ]; then
  [ -x "$F50_ROOT/Tools/kano-gist-sync" ] && "$F50_ROOT/Tools/kano-gist-sync" recover-stopped >/dev/null 2>&1 || config_recovery_failed=1
fi
for config_target in "$F50_ROOT/Proxy/config.yaml" "$F50_ROOT/Tools/template.yaml" "$F50_ROOT/Tools/template.base.yaml"; do
  config_source_file="$F50_ROOT/Tools/config_source.conf"
  if [ "$config_target" = "$F50_ROOT/Tools/template.yaml" ] && [ -f "$config_target.kano_tx/with_base" ]; then config_source_file="$F50_ROOT/Tools/template.base.yaml"; fi
  f50_config_tx_recover "$config_target" "$config_source_file" || config_recovery_failed=1
done
[ "$config_recovery_failed" = 0 ] || echo F50_RECOVERY_CONFIG_FAILED=1
for recovery_backup in "$F50_DATA/"kano_subscription_save_* "$F50_DATA/"kano_network_save_* "$F50_DATA/"kano_sub_persist.* "$F50_DATA/"kano_policy_save.*; do
  [ -d "$recovery_backup" ] && [ ! -f "$recovery_backup/committed" ] || continue
  printf 'F50_RECOVERY_BACKUP=%s\\n' "$recovery_backup"
done
${!requireIdle ? 'if [ "$config_recovery_failed" = 0 ] && [ -z "$F50_RESUME_TAG" ]; then F50_RECOVERY_PREEMPT=1 f50_recovery_eligible || exit 1; fi' : ''}
# Service rejects the cancelled lease; restore native journals after its workers have stopped.
for emergency_journal in download.transaction.json rp-filter.json legacy-policy.json; do
  [ -s "$F50_ROOT/Policy/$emergency_journal" ] || continue
  case "$(getprop ro.product.cpu.abi 2>/dev/null) $(uname -m 2>/dev/null)" in
    *arm64*|*aarch64*|*armv8*) emergency_binary="$F50_ROOT/Scripts/clashctl_arm64" ;;
    *armeabi*|*armv7*) emergency_binary="$F50_ROOT/Scripts/clashctl_armv7" ;;
    *) emergency_binary="$F50_ROOT/Scripts/clashctl" ;;
  esac
  emergency_detail=$(PATH="/system/bin:/system/xbin:/vendor/bin:/data/kano_tproxy_tools/bin:$PATH" CLASH_ROOT="$F50_ROOT" f50_limit 35 "$emergency_binary" recover 2>&1); emergency_native_rc=$?
  printf 'F50_NATIVE_RECOVERY_RC=%s\\n' "$emergency_native_rc"
  printf '%s\\n' "$emergency_detail" | f50_redact
  break
done
if f50_clean_environment && [ "$config_recovery_failed" = 0 ]; then
  # Only the known lease files are removed; an unexpected file prevents release.
  emergency_owner=$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null)
  if [ -n "$F50_RESUME_TAG" ] && [ "$emergency_owner" = "$F50_RESUME_TAG" ]; then
    rm -f "$F50_OPERATION_LOCK/cancelled" || exit 1
  else
    rm -f "$F50_OPERATION_LOCK/frontend" "$F50_OPERATION_LOCK/owner" "$F50_OPERATION_LOCK/cancelled" || exit 1
    rmdir "$F50_OPERATION_LOCK" || { echo F50_CLEAN_ERROR=operation_lease_not_empty; exit 1; }
  fi
  F50_RECOVERY_BODY_OK=1
  exit 0
fi
f50_scan "$F50_WORK/partial.pids" || exit 1
[ ! -s "$F50_WORK/partial.pids" ] || { echo F50_CLEAN_ERROR=process_respawned; exit 1; }
# One unreadable family must not prevent removing verified hooks in the other.
# This is deliberately partial recovery: it never claims restored journals or unverified routes.
for emergency_bin in iptables ip6tables; do
  emergency_save="$F50_WORK/$emergency_bin.partial"
  emergency_plan="$emergency_save.plan"
  if f50_save "$emergency_bin" "$emergency_save" && f50_firewall_plan "$emergency_bin" "$emergency_save" "$emergency_plan"; then
    f50_execute_plan "$emergency_plan" || true
    if f50_save "$emergency_bin" "$emergency_save" && f50_firewall_plan "$emergency_bin" "$emergency_save" "$emergency_plan" && [ ! -s "$emergency_plan" ]; then
      printf 'F50_RECOVERY_FIREWALL_%s=clean\\n' "$emergency_bin"
    fi
  fi
done
for emergency_family in 4 6; do
  emergency_rules="$F50_WORK/partial.rules$emergency_family"
  emergency_routes="$F50_WORK/partial.routes$emergency_family"
  if f50_ip_snapshot "$emergency_rules" -"$emergency_family" rule show && f50_ip_snapshot "$emergency_routes" -"$emergency_family" route show table all; then
    printf '\\n' >> "$emergency_rules"
    if f50_routes_plan -"$emergency_family" "$emergency_rules" "$emergency_routes" "$F50_WORK/partial.routes.plan"; then
      f50_execute_plan "$F50_WORK/partial.routes.plan" || true
    fi
  fi
done
echo F50_RECOVERY_PARTIAL=1
echo F50_CLEAN_ERROR=recovery_requires_review
exit 1
`;
}

function buildF50RecoveryEligibilityFunctions(forUninstall = false) { return `F50_OPERATION_LOCK=\${F50_OPERATION_LOCK:-/dev/kano_tproxy_operation.lock}
F50_TASK_DIR=\${F50_TASK_DIR:-/dev/kano_tproxy_tasks}
f50_recovery_block() { echo "F50_RECOVERY_STATE=$1"; echo F50_RECOVERY_ELIGIBLE=0; return 1; }
f50_recovery_eligible() {
  [ -r "$F50_PROC" ] && [ -x "$F50_PROC" ] || { f50_recovery_block process_table_unreadable; return 1; }
  for recovery_path in "$F50_OPERATION_LOCK" "$F50_TASK_DIR" "$F50_OPERATION_LOCK/owner" "$F50_OPERATION_LOCK/cancelled" "$F50_OPERATION_LOCK/frontend"; do
    [ ! -L "$recovery_path" ] || { f50_recovery_block unsafe_path; return 1; }
  done
  if [ -e "$F50_TASK_DIR" ]; then
    [ -d "$F50_TASK_DIR" ] && [ -r "$F50_TASK_DIR" ] && [ -x "$F50_TASK_DIR" ] || { f50_recovery_block unknown_task_directory; return 1; }
  fi
  f50_install_lock_idle || { f50_recovery_block install_transaction_unresolved; return 1; }
  recovery_owner=
  if [ -e "$F50_OPERATION_LOCK" ]; then
    [ -d "$F50_OPERATION_LOCK" ] && [ -r "$F50_OPERATION_LOCK/owner" ] || { f50_recovery_block unknown_owner; return 1; }
    recovery_owner=$(cat "$F50_OPERATION_LOCK/owner") || { f50_recovery_block unknown_owner; return 1; }
    case "$recovery_owner" in
      mm_*) case "$recovery_owner" in *[!A-Za-z0-9_-]*) f50_recovery_block unknown_owner; return 1;; esac;;
      rescue_*)
        recovery_pid=\${recovery_owner#rescue_}
        case "$recovery_pid" in ''|0|*[!0-9]*) f50_recovery_block unknown_owner; return 1;; esac
        [ "$recovery_pid" = "$$" ] || [ ! -d "$F50_PROC/$recovery_pid" ] || { f50_recovery_block active_recovery; return 1; };;
      *) f50_recovery_block unknown_owner; return 1;;
    esac
    for recovery_entry in "$F50_OPERATION_LOCK"/* "$F50_OPERATION_LOCK"/.[!.]* "$F50_OPERATION_LOCK"/..?*; do
      [ -e "$recovery_entry" ] || [ -L "$recovery_entry" ] || continue
      case "$recovery_entry" in "$F50_OPERATION_LOCK/owner"|"$F50_OPERATION_LOCK/cancelled"|"$F50_OPERATION_LOCK/frontend") [ -f "$recovery_entry" ] || { f50_recovery_block unknown_lease_entry; return 1; };;
        *) f50_recovery_block unknown_lease_entry; return 1;; esac
    done
    case "$recovery_owner" in mm_service_*)
      recovery_pid=\${recovery_owner#mm_service_}
      case "$recovery_pid" in ''|*[!0-9]*) f50_recovery_block unknown_owner; return 1;; esac
      [ ! -d "$F50_PROC/$recovery_pid" ] || [ "\${F50_RECOVERY_PREEMPT:-0}" = 1 ] || { f50_recovery_block active_service; return 1; };; esac
  fi
  recovery_records=
  for recovery_entry in "$F50_TASK_DIR"/* "$F50_TASK_DIR"/.[!.]* "$F50_TASK_DIR"/..?*; do
    [ -e "$recovery_entry" ] || [ -L "$recovery_entry" ] || continue
    [ -f "$recovery_entry" ] && [ ! -L "$recovery_entry" ] || { f50_recovery_block unknown_task; return 1; }
    case "$recovery_entry" in *.output|*.receipt)
      [ -f "\${recovery_entry%.*}" ] && [ ! -L "\${recovery_entry%.*}" ] || { f50_recovery_block unknown_task; return 1; }
      continue;; esac
    read -r recovery_format recovery_tag recovery_request recovery_pid recovery_start recovery_manager recovery_manager_start recovery_state recovery_rc recovery_extra < "$recovery_entry" || { f50_recovery_block unknown_task; return 1; }
    [ "$recovery_format" = F50_TASK_V2 ] && [ -z "$recovery_extra" ] || { f50_recovery_block stale_task_record; return 1; }
    [ "$recovery_tag" = "$recovery_owner" ] && [ "$recovery_entry" = "$F50_TASK_DIR/$recovery_request" ] || { f50_recovery_block task_owner_mismatch; return 1; }
    case "$recovery_request" in "$recovery_tag".*) recovery_sequence=\${recovery_request#"$recovery_tag".};; *) f50_recovery_block task_owner_mismatch; return 1;; esac
    for recovery_number in "$recovery_sequence" "$recovery_pid" "$recovery_start" "$recovery_manager" "$recovery_manager_start" "$recovery_rc"; do
      case "$recovery_number" in ''|*[!0-9]*) f50_recovery_block task_record_invalid; return 1;; esac
    done
    [ "$recovery_pid" -gt 0 ] && [ "$recovery_manager" -gt 0 ] && [ "$recovery_manager_start" -gt 0 ] && [ "$recovery_rc" -le 255 ] || { f50_recovery_block task_record_invalid; return 1; }
    for recovery_identity in "$recovery_pid:$recovery_start" "$recovery_manager:$recovery_manager_start"; do
      recovery_process=\${recovery_identity%:*}; recovery_process_start=\${recovery_identity#*:}
      if [ -d "$F50_PROC/$recovery_process" ]; then
        f50_stat "$recovery_process" || { f50_recovery_block task_identity_unknown; return 1; }
        [ "$recovery_process_start" -gt 0 ] || { f50_recovery_block task_identity_unknown; return 1; }
        if [ "$F50_STAT_START" = "$recovery_process_start" ]; then
          case "$F50_STAT_STATE" in Z|X) ;; *) [ "\${F50_RECOVERY_PREEMPT:-0}" = 1 ] || { f50_recovery_block active_task; return 1; };; esac
        fi
      fi
    done
    [ "$recovery_state" = finished ] || { ${forUninstall ? ':' : '[ "\${F50_RECOVERY_PREEMPT:-0}" = 1 ]'} && [ "$recovery_state" = running ]; } || { f50_recovery_block task_receipt_missing; return 1; }
    recovery_hash=$(sha256sum "$recovery_entry" | awk '{print $1}')
    [ -n "$recovery_hash" ] || { f50_recovery_block task_receipt_unreadable; return 1; }
    recovery_records="$recovery_records $recovery_request:$recovery_hash"
  done
  for recovery_proc in "$F50_PROC"/[0-9]*; do
    [ -d "$recovery_proc" ] || continue
    recovery_pid=\${recovery_proc##*/}
    { IFS= read -r recovery_comm < "$recovery_proc/comm"; } 2>/dev/null || continue
    case "$recovery_comm" in sh|ash|bash|dash|mksh|toybox|busybox|timeout|Clash.Core|Clash|clash|mihomo|clashctl*|kano-f50*|kano-gist-sync|Clash.*|mosdns*|yq_linux*|age|inotifyd|curl|wget|unzip|tar|gzip|xz|cp|mv|rm|awk|sed|tee|dd|base64) ;; *) continue;; esac
      [ "$recovery_pid" != "$$" ] || continue
      f50_stat "$recovery_pid" || { f50_recovery_block process_identity_unknown; return 1; }
      case "$F50_STAT_STATE" in Z|X) continue;; esac
      recovery_env=$(tr '\\000' '\\n' < "$recovery_proc/environ" 2>/dev/null) || { f50_recovery_block process_identity_unknown; return 1; }
      if printf '%s\\n' "$recovery_env" | grep -q '^KANO_TPROXY_TASK=mm_'; then
        case "$recovery_comm" in Clash.Core|Clash|clash|mihomo)
          recovery_exe=$(readlink "$recovery_proc/exe" 2>/dev/null)
          recovery_exe=\${recovery_exe% (deleted)}
          if f50_owned_exe "$recovery_exe"; then continue; fi;; esac
        [ "\${F50_RECOVERY_PREEMPT:-0}" = 1 ] && continue
        f50_recovery_block unreceipted_active_task; return 1
      fi
  done
  case "$recovery_owner" in mm_service_*|rescue_*|'') ;; mm_*)
    if [ ! -f "$F50_OPERATION_LOCK/frontend" ]; then
      f50_recovery_block frontend_activity_unknown; return 1
    else
      read -r recovery_frontend_owner recovery_deadline recovery_extra < "$F50_OPERATION_LOCK/frontend" || { f50_recovery_block frontend_record_invalid; return 1; }
      [ "$recovery_frontend_owner" = "$recovery_owner" ] && [ -z "$recovery_extra" ] || { f50_recovery_block frontend_owner_mismatch; return 1; }
      case "$recovery_deadline" in ''|*[!0-9]*) f50_recovery_block frontend_record_invalid; return 1;; esac
      read -r recovery_uptime recovery_idle < /proc/uptime || { f50_recovery_block frontend_clock_unknown; return 1; }
      [ "$recovery_deadline" -le "\${recovery_uptime%%.*}" ] || [ "\${F50_RECOVERY_PREEMPT:-0}" = 1 ] || { f50_recovery_block active_frontend; return 1; }
    fi;; esac
  if [ -n "$recovery_records" ]; then
    ${forUninstall ? '' : `if [ "\${F50_RECOVERY_PREEMPT:-0}" != 1 ]; then
      for recovery_tx in "$F50_ROOT/Proxy/"*.kano_tx "$F50_ROOT/Tools/"*.kano_tx "$F50_DATA/"kano_subscription_save_* "$F50_DATA/"kano_network_save_* "$F50_DATA/"kano_sub_persist.* "$F50_DATA/"kano_policy_save.*; do
        [ -e "$recovery_tx" ] || [ -L "$recovery_tx" ] || continue
        [ -d "$recovery_tx" ] && [ ! -L "$recovery_tx" ] && [ -f "$recovery_tx/committed" ] && [ ! -L "$recovery_tx/committed" ] || { f50_recovery_block config_transaction_unresolved; return 1; }
      done
    fi`}
    if [ "\${emergency_locked:-0}" = 1 ]; then
      for recovery_record in $recovery_records; do
        recovery_file="$F50_TASK_DIR/\${recovery_record%:*}"
        [ ! -L "$recovery_file" ] && [ "$(sha256sum "$recovery_file" | awk '{print $1}')" = "\${recovery_record#*:}" ] && rm -f "$recovery_file" "$recovery_file.output" "$recovery_file.receipt" || { f50_recovery_block task_cleanup_failed; return 1; }
      done
      rmdir "$F50_TASK_DIR" || { f50_recovery_block task_directory_changed; return 1; }
      echo F50_RECOVERY_TASKS_RECLAIMED=1
    fi
  fi
  [ -z "$recovery_owner" ] && echo F50_RECOVERY_STATE=idle || echo F50_RECOVERY_STATE=quiescent_lease
  echo F50_RECOVERY_ELIGIBLE=1
}
`; }

function buildF50LeaseFunctions(includeFrontend = true) { return `umask 077
F50_OPERATION_LOCK=\${F50_OPERATION_LOCK:-/dev/kano_tproxy_operation.lock}
F50_TASK_DIR=\${F50_TASK_DIR:-/dev/kano_tproxy_tasks}
${includeFrontend ? `F50_RECOVERY_LOCK=\${F50_RECOVERY_LOCK:-/dev/kano_tproxy_recovery.lock}
f50_writer_enter() {
  [ ! -L "$F50_RECOVERY_LOCK" ] || { echo F50_OPERATION_UNSAFE_PATH; return 1; }
  writer_tries=0
  until mkdir "$F50_RECOVERY_LOCK" 2>/dev/null; do
    writer_tries=$((writer_tries + 1))
    [ "$writer_tries" -lt 20 ] || { echo F50_OPERATION_RECOVERY_BUSY; return 1; }
    sleep 0.1
  done
  writer_start=$(awk '{sub(/^.*\\) /, ""); split($0,s," "); print s[20]}' /proc/$$/stat) || { rmdir "$F50_RECOVERY_LOCK"; return 1; }
  case "$writer_start" in ''|*[!0-9]*) rmdir "$F50_RECOVERY_LOCK"; return 1;; esac
  printf '%s %s\\n' "$$" "$writer_start" > "$F50_RECOVERY_LOCK/owner" || { rmdir "$F50_RECOVERY_LOCK"; return 1; }
  trap 'f50_writer_leave' EXIT
}
f50_writer_leave() {
  trap - EXIT
  read -r writer_pid writer_start < "$F50_RECOVERY_LOCK/owner" || return 1
  [ "$writer_pid" = "$$" ] && [ "$writer_start" = "$(awk '{sub(/^.*\\) /, ""); split($0,s," "); print s[20]}' /proc/$$/stat)" ] || return 1
  rm -f "$F50_RECOVERY_LOCK/owner" && rmdir "$F50_RECOVERY_LOCK"
}
f50_frontend_write() {
  [ ! -L "$F50_OPERATION_LOCK/frontend" ] && [ ! -e "$F50_OPERATION_LOCK/cancelled" ] &&
    [ "$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null)" = "$1" ] || { echo F50_OPERATION_OWNER_CHANGED; return 1; }
  frontend_deadline=0
  if [ "$2" != ended ]; then
    read -r frontend_uptime frontend_idle < /proc/uptime || return 1
    frontend_now=\${frontend_uptime%%.*}
    case "$frontend_now" in ''|*[!0-9]*) return 1;; esac
    frontend_deadline=$((frontend_now + 120))
  fi
  printf '%s %s\\n' "$1" "$frontend_deadline" > "$F50_OPERATION_LOCK/frontend.$$" &&
    mv -f "$F50_OPERATION_LOCK/frontend.$$" "$F50_OPERATION_LOCK/frontend" || return 1
  return 0
}
f50_frontend_touch() (
  f50_writer_enter || return 1
  f50_frontend_write "$@"; frontend_rc=$?
  f50_writer_leave || return 1
  [ "$frontend_rc" != 0 ] || echo F50_FRONTEND_RECORDED=1
  return "$frontend_rc"
)
f50_task_receipt() {
  receipt_tag=$1; receipt_file=$2
  [ -f "$receipt_file" ] && [ ! -L "$receipt_file" ] || return 1
  read -r receipt_format receipt_owner receipt_request receipt_pid receipt_start receipt_manager receipt_manager_start receipt_state F50_RECEIPT_RC receipt_extra < "$receipt_file" || return 1
  [ "$receipt_format" = F50_TASK_V2 ] && [ "$receipt_owner" = "$receipt_tag" ] &&
    [ "$receipt_file" = "$F50_TASK_DIR/$receipt_request" ] && [ "$receipt_state" = finished ] && [ -z "$receipt_extra" ] || return 1
  case "$receipt_request" in "$receipt_tag".*) receipt_sequence=\${receipt_request#"$receipt_tag".};; *) return 1;; esac
  for receipt_number in "$receipt_sequence" "$receipt_pid" "$receipt_start" "$receipt_manager" "$receipt_manager_start" "$F50_RECEIPT_RC"; do
    case "$receipt_number" in ''|*[!0-9]*) return 1;; esac
  done
  [ "$receipt_pid" -gt 0 ] && [ "$receipt_manager" -gt 0 ] && [ "$receipt_manager_start" -gt 0 ] && [ "$F50_RECEIPT_RC" -le 255 ]
}
f50_task_result() (
  f50_writer_enter || return 1
  f50_task_receipt "$1" "$F50_TASK_DIR/$2" || { echo F50_TASK_RESULT_UNCONFIRMED; return 1; }
  sed '1d' "$receipt_file" || return 1
  f50_writer_leave || return 1
  printf '\\nF50_TASK_FINISHED=%s:%s\\n' "$2" "$F50_RECEIPT_RC"
)
f50_lease_status() {
  [ ! -L "$F50_OPERATION_LOCK" ] && [ ! -L "$F50_OPERATION_LOCK/owner" ] || return 1
  if [ ! -e "$F50_OPERATION_LOCK" ]; then echo F50_LEASE_RELEASED=1
  else
    status_owner=$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null) || return 1
    [ -n "$status_owner" ] || return 1
    if [ "$status_owner" = "$1" ]; then
      [ ! -e "$F50_OPERATION_LOCK/cancelled" ] || return 1
      echo F50_LEASE_OWNED=1
    else echo F50_OPERATION_OWNER_CHANGED; fi
  fi
}
` : ''}f50_lease_acquire() (
  lease_tag=$1
  case "$lease_tag" in mm_*) ;; *) echo F50_OPERATION_INVALID_OWNER; return 1 ;; esac
  [ ! -L "$F50_OPERATION_LOCK" ] && [ ! -L "$F50_TASK_DIR" ] || { echo F50_OPERATION_UNSAFE_PATH; return 1; }
${includeFrontend ? '  if [ "$2" = browser ]; then f50_writer_enter || return 1; fi\n' : ''}  if mkdir "$F50_OPERATION_LOCK" 2>/dev/null; then
    if ! chmod 700 "$F50_OPERATION_LOCK"; then rmdir "$F50_OPERATION_LOCK" 2>/dev/null; return 1; fi
    if ! printf '%s\\n' "$lease_tag" > "$F50_OPERATION_LOCK/owner"; then
      rm -f "$F50_OPERATION_LOCK/owner" 2>/dev/null
      rmdir "$F50_OPERATION_LOCK" 2>/dev/null
      return 1
    fi
  fi
  [ ! -L "$F50_OPERATION_LOCK/owner" ] || return 1
  [ ! -e "$F50_OPERATION_LOCK/cancelled" ] && [ "$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null)" = "$lease_tag" ] || { echo F50_OPERATION_BUSY; return 1; }
${includeFrontend ? '  if [ "$2" = browser ]; then f50_frontend_write "$lease_tag" running && f50_writer_leave || return 1; fi\n' : ''}  echo F50_LEASE_ACQUIRED=1
)
f50_lease_release() (
  lease_tag=$1
${includeFrontend ? '  f50_writer_enter || return 1\n' : ''}  if [ ! -e "$F50_OPERATION_LOCK" ]; then echo F50_LEASE_RELEASED=1; return 0; fi
  [ ! -L "$F50_OPERATION_LOCK" ] && [ ! -L "$F50_OPERATION_LOCK/owner" ] || return 1
  [ "$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null)" = "$lease_tag" ] || { echo F50_OPERATION_OWNER_CHANGED; return 1; }
  [ ! -e "$F50_OPERATION_LOCK/cancelled" ] || { echo F50_OPERATION_RECOVERY_REQUIRED; return 1; }
  for lease_task in "$F50_TASK_DIR/$lease_tag."*; do
    [ -e "$lease_task" ] || [ -L "$lease_task" ] || continue
${includeFrontend ? '    f50_task_receipt "$lease_tag" "$lease_task" || { echo F50_OPERATION_WORKER_REMAINS; return 1; }' : '    echo F50_OPERATION_WORKER_REMAINS; return 1'}
  done
${includeFrontend ? '  for lease_task in "$F50_TASK_DIR/$lease_tag."*; do\n    [ ! -e "$lease_task" ] || rm -f "$lease_task" || return 1\n  done\n  rmdir "$F50_TASK_DIR" 2>/dev/null || true\n' : ''}${includeFrontend ? '  [ ! -L "$F50_OPERATION_LOCK/frontend" ] || return 1\n  rm -f "$F50_OPERATION_LOCK/frontend" ' : '  rm -f '}"$F50_OPERATION_LOCK/owner" && rmdir "$F50_OPERATION_LOCK" || return 1
${includeFrontend ? '  f50_writer_leave || return 1\n' : ''}  echo F50_LEASE_RELEASED=1
)
`; }

function buildF50ServiceLeaseGate() { return buildF50LeaseFunctions(false) + "\n" + `# Serialize direct boot/CLI mutations with browser operations; no stale lock is stolen.
case "$1" in snapshot|status|version|--version|help|--help|profile|verify-clean|verify-stopped) ;;
*)
  if [ "\${F50_SERVICE_LEASED:-0}" != 1 ]; then
    case "\${KANO_TPROXY_TASK:-}" in
      mm_*)
        [ ! -L "$F50_OPERATION_LOCK" ] && [ ! -L "$F50_OPERATION_LOCK/owner" ] &&
          [ ! -e "$F50_OPERATION_LOCK/cancelled" ] &&
          [ "$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null)" = "$KANO_TPROXY_TASK" ] || { echo F50_ERROR=operation_busy; exit 1; }
        export F50_SERVICE_LEASED=1
        ;;
      *)
        direct_tag=mm_service_$$
        f50_lease_acquire "$direct_tag" || { echo F50_ERROR=operation_busy; exit 1; }
        KANO_TPROXY_TASK="$direct_tag" F50_SERVICE_LEASED=1 sh "$0" "$@"
        direct_rc=$?
        f50_lease_release "$direct_tag" || { echo F50_ERROR=operation_release_unverified; exit 1; }
        exit "$direct_rc"
        ;;
    esac
  fi
  # An inherited recursion flag is not evidence of a current lease.
  [ ! -L "$F50_OPERATION_LOCK" ] && [ ! -L "$F50_OPERATION_LOCK/owner" ] &&
    [ ! -e "$F50_OPERATION_LOCK/cancelled" ] &&
    [ -n "$KANO_TPROXY_TASK" ] &&
    [ "$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null)" = "$KANO_TPROXY_TASK" ] || { echo F50_ERROR=operation_busy; exit 1; }
  if [ -d "\${CLASH_ROOT%/*}/clash.install.lock.d" ] && [ -z "\${F50_INSTALL_TRANSACTION:-}" ]; then
    echo F50_ERROR=install_transaction_pending; exit 1
  fi
  GIST_TX="$CLASH_ROOT/Tools/gist-sync/activation"
  if [ -e "$GIST_TX" ] || [ -L "$GIST_TX" ]; then
    [ ! -L "$GIST_TX" ] && [ -n "\${KANO_GIST_TRANSACTION:-}" ] && [ "\${KANO_GIST_TRANSACTION:-}" = "$(cat "$GIST_TX/id" 2>/dev/null)" ] || { echo F50_ERROR=gist_transaction_pending; exit 1; }
  fi
  for pending_config in "$CLASH_ROOT/Proxy/config.yaml.kano_tx" "$CLASH_ROOT/Tools/template.yaml.kano_tx" "$CLASH_ROOT/Tools/template.base.yaml.kano_tx"; do
    [ ! -d "$pending_config" ] || { echo F50_ERROR=config_transaction_pending; exit 1; }
  done
  ;;
esac
`; }

function buildF50ConfigTransactionFunctions() { return `f50_config_tx_recover() (
  target=$1; source_file=$2; tx="$target.kano_tx"
  [ -e "$tx" ] || [ -L "$tx" ] || exit 0
  [ -d "$tx" ] && [ ! -L "$tx" ] && [ ! -L "$target" ] && [ ! -L "$source_file" ] || { echo F50_ERROR=config_transaction_unsafe_path; exit 1; }
  [ "$(cat "$tx/format" 2>/dev/null)" = F50_CONFIG_TX_V1 ] || { echo F50_ERROR=config_transaction_unknown; exit 1; }
  if [ -f "$tx/ready" ] && [ ! -f "$tx/committed" ]; then
    f50_restore_pair_file() {
      name=$1; dest=$2
      [ ! -L "$tx/$name" ] && [ ! -L "$dest" ] || return 1
      if [ -f "$tx/$name.had" ] && [ -f "$tx/$name" ]; then
        cp -p "$tx/$name" "$dest.kano_recover.$$" && chmod 600 "$dest.kano_recover.$$" && mv -f "$dest.kano_recover.$$" "$dest" || return 1
      elif [ -f "$tx/$name.absent" ]; then rm -f "$dest" || return 1
      else return 1
      fi
    }
    restore_ok=1
    f50_restore_pair_file config "$target" || restore_ok=0
    if [ -f "$tx/with_source" ]; then f50_restore_pair_file source "$source_file" || restore_ok=0; fi
    [ "$restore_ok" = 1 ] || { echo "F50_RECOVERY_CONFIG=$tx"; echo F50_ERROR=config_transaction_restore_failed; exit 1; }
    echo F50_CONFIG_TRANSACTION_RESTORED=1
  fi
  rm -rf "$tx" || exit 1
)
`; }

function buildF50GistFence(root = '/data/clash') { return 'GIST_TX=' + shellQuote(root + '/Tools/gist-sync/activation') + '\n' + `if [ -e "$GIST_TX" ] || [ -L "$GIST_TX" ]; then
  [ ! -L "$GIST_TX" ] && [ -n "\${KANO_GIST_TRANSACTION:-}" ] &&
    [ "\${KANO_GIST_TRANSACTION:-}" = "$(cat "$GIST_TX/id" 2>/dev/null)" ] || { echo F50_ERROR=gist_transaction_pending; exit 1; }
fi
`; }

function buildF50YamlCommitBody(withBase = false) { return `${prepareYqRuntimeCmd()}
${buildF50ConfigTransactionFunctions()}
f50_config_tx_recover "$TARGET" "$SOURCE_FILE" || exit 1
TX="$TARGET.kano_tx"
PARSE_OUT="$STAGE.kano_parse.$$"
NORMALIZED="$STAGE.kano_secret.$$"
SOURCE_NEW="$SOURCE_FILE.kano_source.$$"
TX_OWNED=0
COMMITTED=0
finish_yaml_commit() {
  rc=$?; trap - EXIT HUP INT TERM
  if [ "$TX_OWNED" = 1 ]; then
    if ! f50_config_tx_recover "$TARGET" "$SOURCE_FILE"; then rc=1; fi
  fi
  rm -f "$PARSE_OUT" "$NORMALIZED" "$SOURCE_NEW"
  [ "$COMMITTED" = 1 ] || rm -f "$STAGE"
  exit "$rc"
}
trap finish_yaml_commit EXIT
trap 'exit 130' HUP INT TERM
[ -s "$STAGE" ] && [ ! -L "$STAGE" ] && [ ! -L "$TARGET" ] && [ ! -L "$SOURCE_FILE" ] || { echo F50_ERROR=yaml_path_invalid; exit 1; }
${yqExecutableCheckCmd()}
"$YQ" e -e 'tag == "!!map"' "$STAGE" >/dev/null 2>"$PARSE_OUT" || { echo F50_ERROR=yaml_stage_parse_failed; exit 1; }
if [ "$PROTECT_SECRET" = 1 ]; then
  old_secret=
  if [ -s "$TARGET" ]; then old_secret=$("$YQ" e -r '.secret // ""' "$TARGET" 2>"$PARSE_OUT") || { echo F50_ERROR=live_secret_read_failed; exit 1; }; fi
  if [ -n "$old_secret" ]; then
    export F50_LIVE_CONFIG="$TARGET"
    "$YQ" e '.secret = load(strenv(F50_LIVE_CONFIG)).secret' "$STAGE" > "$NORMALIZED" || exit 1
    unset F50_LIVE_CONFIG
  else
    export F50_FIXED_SECRET=${shellQuote(F50_DEFAULT_SECRET)}
    "$YQ" e '.secret = strenv(F50_FIXED_SECRET)' "$STAGE" > "$NORMALIZED" || exit 1
    unset F50_FIXED_SECRET
  fi
  unset old_secret
  chmod 600 "$NORMALIZED" && mv -f "$NORMALIZED" "$STAGE" || exit 1
fi
hash_file() { sha256sum "$1" 2>/dev/null | awk '{print $1}'; }
command -v sha256sum >/dev/null 2>&1 || { echo F50_ERROR=yaml_hash_tool_missing; exit 1; }
old_hash=$(hash_file "$TARGET")
old_size=0; [ ! -f "$TARGET" ] || old_size=$(wc -c < "$TARGET")
source_same=1
if [ "$WITH_SOURCE" = 1 ]; then
  mkdir -p "\${SOURCE_FILE%/*}"
  if [ "$SOURCE_DELETE" = 1 ]; then
    [ ! -e "$SOURCE_FILE" ] || source_same=0
  else
    if [ -n "$SOURCE_STAGE" ]; then
      [ -f "$SOURCE_STAGE" ] && [ ! -L "$SOURCE_STAGE" ] && cp -p "$SOURCE_STAGE" "$SOURCE_NEW" || exit 1
      ${withBase ? '"$YQ" e -e \'tag == "!!map"\' "$SOURCE_NEW" >/dev/null 2>&1 || exit 1' : ''}
    else
      printf 'KANO_CONFIG_SOURCE=%s\\n' "$SOURCE_VALUE" > "$SOURCE_NEW" || exit 1
    fi
    cmp -s "$SOURCE_FILE" "$SOURCE_NEW" || source_same=0
  fi
fi
if cmp -s "$TARGET" "$STAGE" && [ "$source_same" = 1 ]; then
  rm -f "$STAGE"
  echo YAML_COMMIT_UNCHANGED=1
  printf 'YAML_OLD_HASH=%s\\nYAML_NEW_HASH=%s\\n' "$old_hash" "$old_hash"
  exit 0
fi
mkdir "$TX" || { echo F50_ERROR=config_transaction_busy; exit 1; }
TX_OWNED=1
printf '%s\\n' F50_CONFIG_TX_V1 > "$TX/format" || exit 1
snapshot_pair_file() {
  name=$1; src=$2
  if [ -e "$src" ]; then cp -p "$src" "$TX/$name" && chmod 600 "$TX/$name" && touch "$TX/$name.had" || return 1
  else touch "$TX/$name.absent" || return 1; fi
}
snapshot_pair_file config "$TARGET" || exit 1
if [ "$WITH_SOURCE" = 1 ]; then snapshot_pair_file source "$SOURCE_FILE" && touch "$TX/with_source" || exit 1; fi
${withBase ? 'touch "$TX/with_base" || exit 1' : ''}
backup_path=
if [ "$BACKUP_REQUESTED" = 1 ] && [ -f "$TARGET" ]; then
  backup_path="$TARGET.before_\${BACKUP_TAG}_$(date +%Y%m%d%H%M%S)_$$"
  cp -p "$TX/config" "$backup_path" && chmod 600 "$backup_path" || exit 1
  if [ "$WITH_SOURCE" = 1 ]; then
    if [ -f "$TX/source.had" ]; then cp -p "$TX/source" "$backup_path.source" || exit 1
    else touch "$backup_path.source.absent" || exit 1; fi
  fi
fi
touch "$TX/ready" || exit 1
sync
chmod 600 "$STAGE" && mv -f "$STAGE" "$TARGET" || exit 1
if [ "$WITH_SOURCE" = 1 ]; then
  if [ "$SOURCE_DELETE" = 1 ]; then rm -f "$SOURCE_FILE" || exit 1
  else chmod 600 "$SOURCE_NEW" && mv -f "$SOURCE_NEW" "$SOURCE_FILE" || exit 1; fi
fi
new_hash=$(hash_file "$TARGET")
touch "$TX/committed" || exit 1
sync
COMMITTED=1
printf 'YAML_COMMIT_OK=1\\nYAML_BACKUP=%s\\nYAML_OLD_HASH=%s\\nYAML_NEW_HASH=%s\\nYAML_OLD_SIZE=%s\\nYAML_NEW_SIZE=%s\\n' "$backup_path" "$old_hash" "$new_hash" "$old_size" "$(wc -c < "$TARGET")"
`; }

function f50AssertSafeJsonNumbers(value) {
  if (typeof value === 'number' && (!Number.isFinite(value) || Number.isInteger(value) && !Number.isSafeInteger(value))) throw new Error('YAML number exceeds safe JSON precision; use a quoted string');
  if (Array.isArray(value)) value.forEach(f50AssertSafeJsonNumbers);
  else if (value && typeof value === 'object') Object.values(value).forEach(f50AssertSafeJsonNumbers);
}

function f50HealthLayers({pid='',api={},panel={},provider={}}={}) {
  let providers='无法读取节点来源状态';
  // 总览不能只看请求是否成功：解析失败与部分来源读不到同样是异常，需要一并汇总。
  let providerProblems=['节点来源读取失败'];
  if (provider.success) {
    try {
      const value=JSON.parse(provider.responseText || '');
      if (!value.providers || typeof value.providers!=='object') throw Error('invalid provider snapshot');
      const entries=Object.values(value.providers);
      const known=entries.filter(item=>Array.isArray(item?.proxies));
      if (known.length===entries.length) {
        providers=`${entries.length} 个来源，${known.reduce((n,item)=>n+item.proxies.length,0)} 个已加载节点`;
        providerProblems=[];
      } else {
        providers='部分节点来源状态无法读取';
        providerProblems=[`${entries.length-known.length} 个节点来源状态无法读取`];
      }
    } catch (_) { providers='响应格式不正确'; providerProblems=['节点来源响应格式不正确']; }
  }
  return {core:pid?'进程存在':'未检测到核心进程',
    api:api.success?'可访问':'访问失败',
    panel:panel.success && /F50_PANEL_HTTP_STATUS=200/.test(panel.content || '')?'可访问':'访问失败',providers,
    providerProblems,
    // 数据面接管与代理连通性无法从进程/API 状态推出，合并成一行说明，不再各占一行。
    unverified:'数据面接管、代理连通性'};
}

const F50_TRUSTED_SERVICE_HASHES = ["5cff3c10fc2f556fa1ac7c5ba204ab2168b143da1ffcb6c82a444700c5a7dd25","08a32d4aed30e4dceb32cc8bc3d8df33d2ae70e0e9b203f816db7fdf71edf3ab","84bf02d2dc8f6e391415a4b0c2f59c462b2fa974711dd795eb6b69005405e1ec","8ac8749f149c3d5aae7e49ecd192ae8894e2a3a48af8ed56086fc16c0e473dfc"];

function buildF50RedactFunction() { return `f50_redact() {
  awk '{
    low=tolower($0)
    if(low ~ /bearer[ \\t]|["\\047]?(secret|password|passwd|token|authorization|access_token|uuid|private[-_]key)["\\047]?[ \\t]*[:=]/){print "[SENSITIVE_ERROR_REDACTED]";next}
    gsub(/(https?|ss|ssr|vmess|vless|trojan|tuic|hysteria2?):\\/\\/[^ \\t"<>]+/,"[URL_REDACTED]")
    print
  }'
}`; }
function buildF50PanelConfigCheck() {
  // unified-delay 只要求“用户已明确设置”：未设置才走修复补默认值，显式 false 必须被尊重。
  return `tag == "!!map" and ."external-ui" == "WebUI/zashboard" and ."external-ui-url" == ${JSON.stringify(F50_ZASHBOARD_UI_URL)} and (has("external-ui-name") | not) and (has("unified-delay") or strenv(F50_CONFIG_SOURCE) == "subscription_original")`;
}
// These byte ranges target the bundled ARM64 controller; unknown builds remain untouched.
const F50_HTTP_CONTROLLER_PATCHES = {
  "8.0.0-compat.2.3": {
    "0880e42c78dea90ce7dc3e946df0174308388c126b1eab17a643d85a145744c7": [
      {
        "offset": 2580116,
        "before": "BARA+Z8UAPFgAABU4gNAshUAABQEAED5hQBAuQaNjtKGDq7yvwAGa2AAAFTiA0CyDQAAFIQQQDmfzAFxYAAAVA==",
        "after": "BARA+Z8QAPFgAABUnxQA8YEBAFQHAED55QBAuQaNjtKGDq7yvwAGa8EAAFSfEADxwAAAVOUQQDm/zAFxYAAAVA==",
        "size": 64
      },
      {
        "offset": 2589324,
        "before": "fwAA8Q==",
        "after": "+aIAFA==",
        "size": 4
      },
      {
        "offset": 2756208,
        "before": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "after": "o6HrteTDQPmEBED5nxAA8cAAAFRjAIDSogQA0EJUJ5EFXf8XHyAD1UMAgNICFwCQQmwEkQBd/xc=",
        "size": 56
      },
      {
        "offset": 208,
        "before": "ZA4qAAAAAAA=",
        "after": "qA4qAAAAAAA=",
        "size": 8
      },
      {
        "offset": 216,
        "before": "ZA4qAAAAAAA=",
        "after": "qA4qAAAAAAA=",
        "size": 8
      },
      {
        "offset": 5767440,
        "before": "AAAAAAAAAAAAAAAAAA==",
        "after": "PWh0dHAsaHR0cHM4MA==",
        "size": 13
      },
      {
        "offset": 4016104,
        "before": "sHA0AAAAAAAGAAAAAAAAAA==",
        "after": "EAFZAAAAAAALAAAAAAAAAA==",
        "size": 16
      },
      {
        "offset": 3448114,
        "before": "c3Vic2NyaXB0aW9uIFVSTCBtdXN0IGJlIEhUVFBTIHdpdGhvdXQgdXNlcmluZm8=",
        "after": "c3Vic2NyaXB0aW9uIFVSTCBtdXN0IHVzZSBIVFRQKFMpLCBubyB1c2VyaW5mby4=",
        "size": 47
      }
    ]
  }
};
const F50_HTTP_CONTROLLER_PATCHED_HASH = '532fdfa4901aa31906a25b7b3f7fa96c92ce6b530df297ba4d8f4ab9c5a2ad07';
function buildF50HttpSubscriptionPatchScript(root = "'/data/clash'") {
  const [originalHash, patches] = Object.entries(F50_HTTP_CONTROLLER_PATCHES[F50_COMPAT_VERSION])[0];
  const specs = patches.map(p => shellQuote([p.offset, p.size, p.before, p.after].join('|'))).join(' ');
  return `(set -e
ROOT=${root}
FOUND=0
NEW=''
trap 'rm -f "$NEW"' EXIT
# F50 uses ARM64; the bundled ARMv7 controller has a different binary layout.
for BIN in "$ROOT/Scripts/clashctl_arm64"; do
  [ -f "$BIN" ] || continue
  [ ! -L "$BIN" ] || { echo F50_ERROR=controller_http_patch_symlink; exit 1; }
  command -v sha256sum >/dev/null 2>&1 || { echo F50_ERROR=controller_http_patch_hash_tool_missing; exit 1; }
  PATCH_HASH=$(sha256sum "$BIN" | awk '{print $1}')
  case "$PATCH_HASH" in
    ${originalHash}) ;;
    ${F50_HTTP_CONTROLLER_PATCHED_HASH}) ;;
    *)
      echo F50_CONTROLLER_HTTP_PATCH=skipped_unknown_build
      exit 0 ;;
  esac
  command -v dd >/dev/null 2>&1 && command -v base64 >/dev/null 2>&1 || { echo F50_ERROR=controller_http_patch_tools_missing; exit 1; }
  FOUND=1
  OLD=0; CURRENT=0
  for SPEC in ${specs}; do
    IFS='|' read -r OFFSET SIZE BEFORE AFTER <<EOF_F50_HTTP_SPEC
$SPEC
EOF_F50_HTTP_SPEC
    ACTUAL=$(dd if="$BIN" bs=1 skip="$OFFSET" count="$SIZE" 2>/dev/null | base64 | tr -d '\\r\\n')
    if [ "$ACTUAL" = "$BEFORE" ]; then OLD=$((OLD + 1))
    elif [ "$ACTUAL" = "$AFTER" ]; then CURRENT=$((CURRENT + 1))
    else echo F50_ERROR=controller_http_patch_unsupported; exit 1
    fi
  done
  [ "$OLD" = ${patches.length} ] || [ "$CURRENT" = ${patches.length} ] || { echo F50_ERROR=controller_http_patch_incomplete; exit 1; }
done
[ "$FOUND" = 1 ] || { echo F50_BACKEND_MISSING; exit 1; }
if [ "$CURRENT" = ${patches.length} ]; then echo F50_CONTROLLER_HTTP_PATCH=already_current; exit 0; fi
for BIN in "$ROOT/Scripts/clashctl_arm64"; do
  [ -f "$BIN" ] || continue
  ORIGINAL="$BIN.http.original"
  [ ! -L "$ORIGINAL" ] || { echo F50_ERROR=controller_http_patch_backup_symlink; exit 1; }
  if [ -e "$ORIGINAL" ]; then
    [ "$(sha256sum "$ORIGINAL" | awk '{print $1}')" = ${originalHash} ] || { echo F50_ERROR=controller_http_patch_backup_mismatch; exit 1; }
  else
    NEW="$BIN.http.$$"
    cp -p "$BIN" "$NEW" && chmod 600 "$NEW" && mv "$NEW" "$ORIGINAL" || { echo F50_ERROR=controller_http_patch_backup_failed; exit 1; }
  fi
  NEW="$BIN.http.$$"
  cp -p "$BIN" "$NEW" || exit 1
  for SPEC in ${specs}; do
    IFS='|' read -r OFFSET SIZE BEFORE AFTER <<EOF_F50_HTTP_SPEC
$SPEC
EOF_F50_HTTP_SPEC
    ACTUAL=$(dd if="$NEW" bs=1 skip="$OFFSET" count="$SIZE" 2>/dev/null | base64 | tr -d '\\r\\n')
    [ "$ACTUAL" != "$BEFORE" ] || printf '%s' "$AFTER" | base64 -d | dd of="$NEW" bs=1 seek="$OFFSET" conv=notrunc 2>/dev/null || exit 1
    ACTUAL=$(dd if="$NEW" bs=1 skip="$OFFSET" count="$SIZE" 2>/dev/null | base64 | tr -d '\\r\\n')
    [ "$ACTUAL" = "$AFTER" ] || { echo F50_ERROR=controller_http_patch_verify_failed; exit 1; }
  done
  [ "$(sha256sum "$NEW" | awk '{print $1}')" = ${F50_HTTP_CONTROLLER_PATCHED_HASH} ] || { echo F50_ERROR=controller_http_patch_hash_mismatch; exit 1; }
  chmod 755 "$NEW" || exit 1
  if cmp -s "$BIN" "$NEW"; then rm -f "$NEW"; else mv -f "$NEW" "$BIN" || exit 1; fi
  NEW=''
done
)`;
}
function buildF50OriginalConfigFunctions() { return `# KANO_ORIGINAL_CONFIG_PRESERVATION=16
${buildF50RedactFunction()}
f50_save_original_config() {
  case "$1" in start|restart|prepare|boot) ;; *) return 0 ;; esac
  F50_CONFIG_RELOAD_REQUIRED=0
  F50_CONFIG_SOURCE=$(sed -n 's/^KANO_CONFIG_SOURCE=//p' "$CLASH_ROOT/Tools/config_source.conf" 2>/dev/null | head -n 1)
  export F50_CONFIG_SOURCE
  F50_SUB_CONVERT_MODE=$(sed -n 's/^# KANO_SUB_CONVERT_MODE=//p' "$CLASH_ROOT/Proxy/subscription_urls.txt" 2>/dev/null | tr -d '\\r' | head -n 1)
  F50_PRESERVE_HTTP_PROVIDER=0
  [ "$F50_CONFIG_SOURCE:$F50_SUB_CONVERT_MODE" != template.yaml:provider ] || F50_PRESERVE_HTTP_PROVIDER=1
  export F50_PRESERVE_HTTP_PROVIDER
  F50_ORIGINAL_CONFIG="$CLASH_ROOT/Proxy/config.yaml.original.$$"
  F50_ORIGINAL_CANDIDATE="$F50_ORIGINAL_CONFIG.new"
  umask 077
  cp "$CLASH_ROOT/Proxy/config.yaml" "$F50_ORIGINAL_CONFIG" || { rm -f "$F50_ORIGINAL_CONFIG"; return 1; }
  export F50_ORIGINAL_CONFIG
  trap 'rc=$?; trap - EXIT; if [ -s "$F50_ORIGINAL_CONFIG" ]; then mv -f "$F50_ORIGINAL_CONFIG" "$CLASH_ROOT/Proxy/config.yaml" || rc=1; fi; rm -f "$F50_ORIGINAL_CANDIDATE"; exit "$rc"' EXIT
}
# 模板/生成模式以控制器重建后的配置为底，按与 JS 整形相同的受控边界恢复用户自定义项
# （日志级别、嗅探、profile、本地代理端口与非受控 dns 子键），订阅生成的节点与规则不被反向覆盖。
f50_restore_original_config() {
  [ -n "$F50_ORIGINAL_CONFIG" ] || return 0
  "$CLASH_ROOT/Tools/yq_linux_arm64" eval -P -o=yaml -I=2 '
    . as $runtime | load(strenv(F50_ORIGINAL_CONFIG)) as $original |
    ($original."x-f50-gist-sync" == true and strenv(F50_CONFIG_SOURCE) == "uploaded_config") as $gist |
    (($original + ($runtime | pick(${JSON.stringify([...F50_ORIGINAL_MANAGED_KEYS, 'secret', 'x-f50-profile', 'proxy-providers', 'x-f50-provider-sources'])}) |
      ((select($gist) | omit(["proxy-providers", "x-f50-provider-sources"])), select($gist | not))) |
    .dns = (($original.dns // $runtime.dns) * ($runtime.dns | pick(${JSON.stringify(F50_ORIGINAL_DNS_KEYS)}))) |
    .tun = ((($original.tun // {}) | omit(${JSON.stringify(F50_ORIGINAL_TUN_KEYS)})) * ($runtime.tun | pick(${JSON.stringify(F50_ORIGINAL_TUN_KEYS)}))) |
    del(."external-controller-tls", ."external-controller-unix", ."external-controller-pipe", ."external-ui-name", ."interface-name", ."routing-mark") |
    select(strenv(F50_CONFIG_SOURCE) == "subscription_original" or $gist)),
    (($original | omit(${JSON.stringify(F50_RESTORE_EXCLUDED_KEYS)})) as $user |
    ($runtime * $user) |
    .dns = ((.dns // {}) * (($original.dns // {}) | omit(${JSON.stringify(CONTROLLED_DNS_KEYS)}))) |
    .tun = ((.tun // {}) * (($original.tun // {}) | omit(${JSON.stringify(CONTROLLED_TUN_KEYS)}))) |
    .sniffer = ((.sniffer // {}) * ($original.sniffer // {})) |
    .profile = ((.profile // {}) * ($original.profile // {})) |
    (select(strenv(F50_PRESERVE_HTTP_PROVIDER) != "1"),
      (select(strenv(F50_PRESERVE_HTTP_PROVIDER) == "1") | ."proxy-providers" = $original."proxy-providers" | del(."x-f50-provider-sources"))) |
    select(strenv(F50_CONFIG_SOURCE) != "subscription_original" and ($gist | not)))) |
    .secret = ($original.secret // .secret)
  ' "$CLASH_ROOT/Proxy/config.yaml" > "$F50_ORIGINAL_CANDIDATE" || { echo F50_ERROR=original_config_merge_failed; return 1; }
  F50_CONFIG_TEST_OUTPUT=$("$CLASH_ROOT/Proxy/Clash.Core" -t -d "$CLASH_ROOT/Proxy" -f "$F50_ORIGINAL_CANDIDATE" 2>&1)
  F50_CONFIG_TEST_RC=$?
  if [ "$F50_CONFIG_TEST_RC" != 0 ]; then
    echo F50_ERROR=original_config_invalid
    printf '%s\\n' "$F50_CONFIG_TEST_OUTPUT" | f50_redact | tail -n 12 | sed 's/^/F50_CONFIG_TEST_DETAIL=/'
    return 1
  fi
  chmod 600 "$F50_ORIGINAL_CANDIDATE" || return 1
  if cmp -s "$F50_ORIGINAL_CANDIDATE" "$CLASH_ROOT/Proxy/config.yaml" 2>/dev/null; then
    rm -f "$F50_ORIGINAL_CANDIDATE" || return 1
  else
    runtime_json=$("$CLASH_ROOT/Tools/yq_linux_arm64" eval -o=json -I=0 'sort_keys(..)' "$CLASH_ROOT/Proxy/config.yaml") || return 1
    restored_json=$("$CLASH_ROOT/Tools/yq_linux_arm64" eval -o=json -I=0 'sort_keys(..)' "$F50_ORIGINAL_CANDIDATE") || return 1
    mv -f "$F50_ORIGINAL_CANDIDATE" "$CLASH_ROOT/Proxy/config.yaml" || return 1
    [ "$runtime_json" = "$restored_json" ] || F50_CONFIG_RELOAD_REQUIRED=1
    unset runtime_json restored_json
  fi
  rm -f "$F50_ORIGINAL_CONFIG"
  trap - EXIT
}
${buildF50ServiceLeaseGate()}
case "$1" in start|restart|boot)
  if [ "\${F50_SERVICE_CAPTURED:-0}" != 1 ]; then
    f50_service_output=$(F50_SERVICE_CAPTURED=1 sh "$0" "$@" 2>&1)
    f50_service_rc=$?
    f50_service_output=$(printf '%s\\n' "$f50_service_output" | f50_redact)
    (umask 077; printf '%s\\n' "$f50_service_output" > "\${CLASH_ROOT%/*}/kano_clash_start.log" && chmod 600 "\${CLASH_ROOT%/*}/kano_clash_start.log") || echo F50_START_LOG_WRITE_FAILED=1
    printf '%s\\n' "$f50_service_output"
    exit "$f50_service_rc"
  fi
  ;;
esac
`; }
function buildF50CurlLocator() { return `# KANO_CURL_ABSOLUTE=1
f50_find_curl() {
  F50_CURL_BIN=
  for curl_candidate in /data/data/com.minikano.f50_sms/files/curl /data/kano_tproxy_tools/bin/curl "$(command -v curl 2>/dev/null)"; do
    case "$curl_candidate" in /*) ;; *) continue;; esac
    [ -f "$curl_candidate" ] && [ -x "$curl_candidate" ] || continue
    "$curl_candidate" --version >/dev/null 2>&1 || continue
    F50_CURL_BIN=$curl_candidate
    return 0
  done
  echo F50_ERROR=curl_executable_unavailable
  return 1
}
`; }

function buildF50ServiceCurlPatchScript(service) { return `(set -e
SERVICE=${service}
[ -f "$SERVICE" ] && [ ! -L "$SERVICE" ] || { echo F50_ERROR=service_patch_unsafe; exit 1; }
TMP="$SERVICE.audit5.$$"; FUNCTIONS="$TMP.functions"
umask 077
trap 'rm -f "$TMP" "$FUNCTIONS"' EXIT
trap 'exit 130' HUP INT TERM
printf '%s' ${shellQuote(buildF50CurlLocator())} > "$FUNCTIONS"
if grep -qx '# KANO_CURL_ABSOLUTE=1' "$SERVICE"; then
  # A marker alone cannot certify a partially edited Service.
  awk '/^# KANO_CURL_ABSOLUTE=1$/ {copy=1} copy {print} copy && /^}$/ {exit}' "$SERVICE" > "$TMP"
  cmp -s "$TMP" "$FUNCTIONS" && grep -qF 'code=$("$F50_CURL_BIN" -sS --noproxy' "$SERVICE" &&
    grep -qx '  f50_find_curl || return 1' "$SERVICE" && grep -qF 'F50_SERVICE_FINALIZED=0' "$SERVICE" && sh -n "$SERVICE" || { echo F50_ERROR=service_curl_patch_mismatch; exit 1; }
else
  awk -v functions="$FUNCTIONS" '
    /^repair_panel_config\\(\\) \\{/ {while((getline line < functions)>0) print line; close(functions); helpers++}
    /^  auth=/ {print "  f50_find_curl || return 1"; locators++}
    /^  code=\\$\\(curl -sS --noproxy / {sub(/\\$\\(curl /,"$(\\"$F50_CURL_BIN\\" "); calls++}
    /^  reload_rc=\\$\\?/ {print; print "  if [ \\"$reload_rc\\" = 0 ] && [ \\"$code\\" != 000 ]; then echo F50_API_AVAILABLE=1; else echo F50_API_AVAILABLE=0; fi"; next}
    /^    echo "F50_ERROR=panel_config_reload_failed/ {print "    echo F50_PANEL_RELOAD_OK=0"}
    /^  echo F50_PANEL_CONFIG_RELOADED=1$/ {print "  echo F50_PANEL_RELOAD_OK=1"}
    /^    repair_panel_config \\|\\| exit 1$/ {print "    echo F50_CORE_STARTED=1"; print "    repair_panel_config || { echo F50_SERVICE_FINALIZED=0; exit 1; }"; finalizers++; next}
    /^exit 0$/ {print "case \\"$action\\" in start|restart|boot) echo F50_SERVICE_BODY_FINALIZED=1;; esac"}
    {print}
    END {if(helpers!=1 || calls!=1 || locators!=1 || finalizers!=1) exit 1}
  ' "$SERVICE" > "$TMP" || { echo F50_ERROR=service_curl_patch_shape; exit 1; }
  sh -n "$TMP" || exit 1
  service_mode=$(stat -c '%a' "$SERVICE") || exit 1
  case "$service_mode" in ''|*[!0-7]*) exit 1;; esac
  chmod "$service_mode" "$TMP" || exit 1
  mv -f "$TMP" "$SERVICE" || exit 1
fi
echo F50_SERVICE_CURL_PATCH_OK=1
)`; }

function buildF50OriginalServicePatchScript(service = shellQuote(CLASH_SERVICE)) {
  const functions = buildF50OriginalConfigFunctions();
  const patchSetup = `FUNCTIONS="$TMP.functions"
umask 077
trap 'rm -f "$TMP" "$FUNCTIONS"' EXIT`;
  const patchFinish = `sh -n "$TMP" || exit 1
chmod 755 "$TMP" || exit 1
mv -f "$TMP" "$SERVICE" || exit 1
rm -f "$FUNCTIONS"
trap - EXIT`;
  const dnsCompat = buildF50Ipv6DnsCompatFunctions() + `
disable_unsupported_ipv6_dns_hijack() {
  case "$1:$2" in boot:*|start:*|restart:*|policy:apply|policy:boot-apply) ;; *) return 0 ;; esac
  f50_disable_unsupported_ipv6_dns_hijack
}
`;
  const tunCleanup = buildF50NetworkCompatHelpers().split('f50_disable_unsupported_ipv6_dns_hijack() {')[0]
    .replace('f50_drop_detached_tun_rules()', 'drop_detached_tun_rules()');
  return `(set -e
F50_SERVICE_TARGET=${service}
[ -f "$F50_SERVICE_TARGET" ] && [ ! -L "$F50_SERVICE_TARGET" ] || { echo F50_ERROR=service_patch_unsafe; exit 1; }
F50_SERVICE_WORK=$(mktemp -d "$F50_SERVICE_TARGET.patch.XXXXXX") || exit 1
umask 077
F50_SERVICE_CANDIDATE="$F50_SERVICE_WORK/candidate"
F50_SERVICE_BACKUP="$F50_SERVICE_WORK/original"
F50_SERVICE_COMMITTED=0
f50_service_patch_finish() {
  patch_rc=$?; trap - EXIT HUP INT TERM
  if [ "$patch_rc" != 0 ] && [ "$F50_SERVICE_COMMITTED" = 1 ]; then
    if cp -p "$F50_SERVICE_BACKUP" "$F50_SERVICE_TARGET.rollback.$$" && mv -f "$F50_SERVICE_TARGET.rollback.$$" "$F50_SERVICE_TARGET" &&
      [ "$(sha256sum "$F50_SERVICE_TARGET" | awk '{print $1}')" = "$F50_SERVICE_OLD_HASH" ]; then echo F50_SERVICE_PATCH_ROLLBACK=verified
    else echo F50_ERROR=service_patch_rollback_failed; echo "F50_SERVICE_PATCH_BACKUP=$F50_SERVICE_BACKUP"; exit 1; fi
  fi
  rm -rf "$F50_SERVICE_WORK" || patch_rc=1
  exit "$patch_rc"
}
trap f50_service_patch_finish EXIT
trap 'exit 130' HUP INT TERM
F50_SERVICE_OLD_HASH=$(sha256sum "$F50_SERVICE_TARGET" | awk '{print $1}')
[ -n "$F50_SERVICE_OLD_HASH" ] || exit 1
cp -p "$F50_SERVICE_TARGET" "$F50_SERVICE_BACKUP" && cp -p "$F50_SERVICE_BACKUP" "$F50_SERVICE_CANDIDATE" || exit 1
[ "$(sha256sum "$F50_SERVICE_BACKUP" | awk '{print $1}')" = "$F50_SERVICE_OLD_HASH" ] || exit 1
(set -e
SERVICE="$F50_SERVICE_CANDIDATE"
if ! grep -qx '# KANO_TUN_RULE_CLEANUP=2' "$SERVICE"; then
  TMP="$SERVICE.tun.$$"
${patchSetup.replace(/^/gm, '  ')}
  printf '%s' ${shellQuote(tunCleanup)} > "$FUNCTIONS" || exit 1
  awk -v functions="$FUNCTIONS" '
    /^drop_detached_tun_rules\\(\\) \\{/ {
      while ((getline line < functions) > 0) print line
      close(functions); replaced++; skipping=1; next
    }
    skipping { if($0=="}") skipping=0; next }
    { print }
    END { if(replaced!=1 || skipping) exit 1 }
  ' "$SERVICE" > "$TMP" || exit 1
${patchFinish.replace(/^/gm, '  ')}
fi
if ! grep -qx '# KANO_ORIGINAL_CONFIG_PRESERVATION=16' "$SERVICE"; then
TMP="$SERVICE.original.$$"
${patchSetup}
printf '%s' ${shellQuote(functions)} > "$FUNCTIONS" || exit 1
panel_guarded=$(grep -Ec '^  # KANO_PANEL_WRITE_GUARD=[12]$' "$SERVICE" || true)
panel_skip=$(grep -c '^  # KANO_PANEL_WRITE_GUARD=2$' "$SERVICE" || true)
awk -v functions="$FUNCTIONS" -v panel_guarded="$panel_guarded" -v panel_skip="$panel_skip" -v panel_check=${shellQuote(buildF50PanelConfigCheck())} '
  /^# KANO_ORIGINAL_CONFIG_PRESERVATION=([123456789]|10|11|12|13|14|15)$/ { skipping=1 }
  skipping && $0 != "action=$1" { next }
  $0 == "action=$1" { skipping=0 }
  $0 == "f50_save_original_config \\"$action\\" || exit 1" || $0 == "f50_restore_original_config || exit 1" { next }
  $0 == "action=$1" { while ((getline line < functions) > 0) print line; close(functions); helpers++ }
  $0 == "repair_panel_config() {" { panel=1 }
  panel && !panel_guarded && ($0 == "  \\"$yq\\" eval " sprintf("%c",39) || $0 == "  \\"$yq\\" eval -P -o=yaml -I=2 " sprintf("%c",39)) {
    print "  # KANO_PANEL_WRITE_GUARD=2"
    print "  if \\"$yq\\" eval -e " sprintf("%c",39) panel_check sprintf("%c",39) " \\"$cfg\\" >/dev/null 2>&1; then"
    print "    \\"$CLASH_ROOT/Proxy/Clash.Core\\" -t -d \\"$CLASH_ROOT/Proxy\\" -f \\"$cfg\\" >/dev/null 2>&1 || { echo F50_ERROR=panel_config_invalid; return 1; }"
    print "    if [ \\"\${F50_CONFIG_RELOAD_REQUIRED:-0}\\" != 1 ]; then echo F50_PANEL_CONFIG_UNCHANGED=1; return 0; fi"
    print "  else"
    panel_open=1
  }
  panel && $0 == "  # KANO_PANEL_WRITE_GUARD=1" { $0 = "  # KANO_PANEL_WRITE_GUARD=2" }
  panel && !panel_skip && $0 == "    \\"$CLASH_ROOT/Proxy/Clash.Core\\" -t -d \\"$CLASH_ROOT/Proxy\\" -f \\"$cfg\\" >/dev/null 2>&1 || { echo F50_ERROR=panel_config_invalid; return 1; }" {
    print
    print "    if [ \\"\${F50_CONFIG_RELOAD_REQUIRED:-0}\\" != 1 ]; then echo F50_PANEL_CONFIG_UNCHANGED=1; return 0; fi"
    next
  }
  panel && $0 ~ /^  code=\\$\\(curl -sS --max-time 20 -K / { sub(/curl -sS --max-time 20/, "curl -sS --noproxy " sprintf("%c",39) "*" sprintf("%c",39) " --connect-timeout 3 --max-time 20") }
  panel && !panel_skip && $0 == "  echo F50_PANEL_CONFIG_RELOADED=1" { print "  F50_CONFIG_RELOAD_REQUIRED=0" }
  panel && panel_open && $0 ~ /^  auth=/ { print "  fi"; panel_open=0 }
  panel && $0 == "}" { panel=0 }
  $0 == "\\"$binary\\" \\"$@\\"" || $0 == "f50_run_controller \\"$@\\"" { print "f50_save_original_config \\"$action\\" || exit 1"; saved++ }
  $0 == "  \\"$yq\\" eval " sprintf("%c", 39) { sub(/eval /, "eval -P -o=yaml -I=2 ") }
  $0 == "  start|restart)" { $0 = "  start|restart|boot)" }
  $0 ~ /^[[:space:]]*\\."unified-delay" = true \\|$/ { print "    (select(strenv(F50_CONFIG_SOURCE) == \\"subscription_original\\"), (select(strenv(F50_CONFIG_SOURCE) != \\"subscription_original\\") | (select(has(\\"unified-delay\\")), (select(has(\\"unified-delay\\") | not) | .\\"unified-delay\\" = true)))) |"; next }
  $0 == "    validate_zashboard || restore_zashboard || exit 1" {
    print "    if ! validate_zashboard; then"
    print "      panel_restore_output=$(restore_zashboard 2>&1); panel_restore_rc=$?"
    print "      printf \\"%s\\\\n\\" \\"$panel_restore_output\\" | sed " sprintf("%c",39) "s/^F50_ERROR=/F50_WARNING=/" sprintf("%c",39)
    print "      [ \\"$panel_restore_rc\\" = 0 ] || echo F50_WARNING=panel_files_unavailable"
    print "    fi"
    next
  }
  index($0,"start:*|restart:*|policy:apply") && !index($0,"boot:*|start:") { sub(/start:/,"boot:*|start:") }
  { print }
  $0 == "[ \\"$rc\\" = 0 ] || exit \\"$rc\\"" { print "f50_restore_original_config || exit 1"; restored++ }
  END { if (helpers != 1 || saved != 1 || restored != 1 || panel_open) exit 1 }
' "$SERVICE" > "$TMP" || exit 1
${patchFinish}
fi
${buildF50ServiceCurlPatchScript('"$SERVICE"')} || exit 1
if ! grep -qx '# KANO_TUN_IPV6_RETURN=3' "$SERVICE"; then
TMP="$SERVICE.tun6.$$"
${patchSetup}
printf '%s' ${shellQuote(buildF50Tun6CompatFunctions())} > "$FUNCTIONS" || exit 1
awk -v functions="$FUNCTIONS" '
  /^f50_prepare_tun6_stack\\(\\) \\{/ { skipping=1 }
  /^f50_check_mips_version\\(\\) \\{/ { skipping=1 }
  skipping { if($0=="# KANO_TUN6_STACK_COMPAT=1" || $0=="# KANO_TUN_STACK_COMPAT=1") skipping=0; next }
  $0 == "# KANO_TUN_AUTO_MIPS=1" || $0 == "# KANO_TUN_IPV6_RETURN=1" || $0 == "# KANO_TUN_IPV6_RETURN=2" || $0 == "# KANO_TUN_IPV6_RETURN=3" { next }
  $0 == "f50_prepare_tun6_stack \\"$action\\" || exit 1" || $0 == "    f50_finish_tun6_stack || exit 1" { next }
  $0 == "f50_check_tun_stack \\"$action\\" || exit 1" || $0 == "f50_prepare_tun_stack \\"$action\\" || exit 1" || $0 == "f50_prepare_tun_stack \\"$@\\" || exit 1" || $0 == "    f50_finish_tun_stack || exit 1" { next }
  $0 == "action=$1" { while ((getline line < functions) > 0) print line; close(functions); helpers++ }
  $0 == "f50_save_original_config \\"$action\\" || exit 1" { print "f50_check_tun_stack \\"$action\\" || exit 1"; checked++ }
  { print }
  $0 == "f50_restore_original_config || exit 1" { print "f50_prepare_tun_stack \\"$@\\" || exit 1"; prepared++ }
  $0 == "    repair_panel_config || { echo F50_SERVICE_FINALIZED=0; exit 1; }" { print "    f50_finish_tun_stack || exit 1"; finalized++ }
  END { if(helpers!=1 || prepared!=1 || finalized!=1 || checked!=1 || skipping) exit 1 }
' "$SERVICE" > "$TMP" || exit 1
${patchFinish}
fi
if ! grep -qx '# KANO_IPV6_DNS_SPLIT=3' "$SERVICE"; then
TMP="$SERVICE.dns.$$"
${patchSetup}
printf '%s' ${shellQuote(dnsCompat)} > "$FUNCTIONS" || exit 1
awk -v functions="$FUNCTIONS" '
  /^f50_disable_unsupported_ipv6_dns_hijack\\(\\) \\{/ { legacy=1 }
  legacy { if($0 ~ /^# KANO_IPV6_DNS_SPLIT=[0-9]+$/) legacy=0; next }
  /^disable_unsupported_ipv6_dns_hijack\\(\\) \\{/ {
    while ((getline line < functions) > 0) print line
    close(functions); helpers++; skipping=1; next
  }
  skipping { if($0=="}") skipping=0; next }
  $0 == "\\"$binary\\" \\"$@\\"" { print "f50_run_controller \\"$@\\""; calls++; next }
  $0 == "f50_run_controller \\"$@\\"" { calls++ }
  { print }
  END { if(helpers!=1 || calls!=1 || skipping || legacy) exit 1 }
' "$SERVICE" > "$TMP" || exit 1
${patchFinish}
fi
) || exit 1
sh -n "$F50_SERVICE_CANDIDATE" || exit 1
service_mode=$(stat -c '%a' "$F50_SERVICE_TARGET") || exit 1
case "$service_mode" in ''|*[!0-7]*) exit 1;; esac
chmod "$service_mode" "$F50_SERVICE_CANDIDATE" || exit 1
[ "$(sha256sum "$F50_SERVICE_TARGET" | awk '{print $1}')" = "$F50_SERVICE_OLD_HASH" ] || { echo F50_ERROR=service_patch_target_changed; exit 1; }
if ! cmp -s "$F50_SERVICE_CANDIDATE" "$F50_SERVICE_TARGET"; then
  F50_SERVICE_NEW_HASH=$(sha256sum "$F50_SERVICE_CANDIDATE" | awk '{print $1}')
  F50_SERVICE_COMMITTED=1
  mv -f "$F50_SERVICE_CANDIDATE" "$F50_SERVICE_TARGET" || exit 1
  [ "$(sha256sum "$F50_SERVICE_TARGET" | awk '{print $1}')" = "$F50_SERVICE_NEW_HASH" ] && sh -n "$F50_SERVICE_TARGET" || { echo F50_ERROR=service_patch_verify; exit 1; }
fi
echo F50_SERVICE_PATCH_COMMITTED=1
)`;
}
async function ensureOriginalSubscriptionService() {
  const res = await runShellWithRoot(buildF50OriginalServicePatchScript(), 10000);
  return !!res.success;
}
let f50BackendReady = false;
async function ensureCompatBackend() {
  if (f50BackendReady) return true;
  const r = await runShellWithRoot(`set -e
${buildF50HttpSubscriptionPatchScript()} || exit 1
sh /data/clash/Scripts/Clash.Service version`, 15000);
  f50BackendReady = !!r.success && /^F50_CONTROLLER=\S+/m.test(String(r.content || ''));
  if (!f50BackendReady) createToast(/controller_http_patch_/.test(String(r.content || '')) ? 'HTTP 订阅兼容修复失败；请改用配套组件包重试。' : '组件尚未就绪；请先点击“在线安装/更新”或“导入组件包”。', 'red', 9000);
  return f50BackendReady;
}

let lastInstallDiagnostic = null;
const F50_DIAGNOSTIC_LABELS = {
  gist_components_missing: '当前组件包不含 Gist 同步组件；请导入随附的 RC4 完整组件包。原组件未替换。',
  gist_manifest_mismatch: 'Gist 组件清单版本不匹配；请重新获取配套完整组件包。',
  gist_component_hash_mismatch: 'Gist 组件缺失或校验失败；请重新获取完整组件包。',
  gist_runtime_probe_failed: 'Gist 程序无法在设备上执行；请检查 ARM64 架构与组件版本是否配套。',
  gist_age_runtime_probe_failed: '完整组件中的 age 无法执行或版本不匹配；请重新导入配套完整组件包。',
  gist_permission_failed: '安装失败：无法设置 Gist 组件的执行权限。',
  gist_script_invalid: '安装失败：Gist 组件脚本校验未通过。',
  gist_backup_cleanup_failed: '组件已安装，但旧同步数据副本清理失败；请按原恢复流程处理，不要重复提交任务。',
  gist_transient_cleanup_failed: '同步临时数据清理失败；原组件未被替换。',
  zip_missing_or_empty: '组件包不存在或内容为空；请重新上传。',
  archive_size_unknown: '安装失败：无法读取 ZIP 解压后的大小。',
  data_space_insufficient_for_archive: '存储空间不足，无法完成解压与回滚；组件未被替换。',
  controller_interface_incompatible: '控制器缺少所需命令接口；当前操作无法继续。',
  config_transaction_pending: '操作失败：配置事务尚未收尾；请先执行“恢复网络”后重试。',
  install_transaction_pending: '启动失败：上次安装事务尚未结束；请先执行“恢复网络”后重试，事务日志已保留。',
  data_space_low: '安装未执行：设备 /data 可用空间不足 50 MB；请清理空间后重试。',
  mips_core_version_unavailable: '无法读取 Mihomo 版本；请确认核心文件存在且可执行。',
  tun_policy_apply_failed: 'TUN 已启动，但网络接管规则应用失败；请执行“恢复网络”后重试。',
  tun_policy_verify_failed: 'TUN 已启动，但接管规则校验未通过；请执行“恢复网络”后重试。',
  tun_return_route_apply_failed: 'TUN 已启动，但 IPv6 回程路由写入失败；IPv6 出站可能不可用。',
  tun_return_route_verify_failed: 'TUN 已启动，但 IPv6 回程路由校验未通过；IPv6 出站可能不可用。',
  tun6_address_query_failed: '无法读取 KanoTun 的 IPv6 地址；请确认 TUN 接口已创建且 IPv6 已开启。',
  tun6_address_parse_failed: 'KanoTun 的 IPv6 地址无法解析；请检查接口地址是否异常。',
  tun6_route_query_failed: '无法查询 IPv6 路由表；请检查设备 ip 命令与权限。',
  unzip_missing: '安装未执行：设备缺少解压程序。',
  archive_list_failed: '无法读取 ZIP 目录；请重新上传有效的组件包。',
  unsafe_archive_path: '组件包包含越界路径，已拒绝解压。',
  archive_symlink: '组件包包含符号链接；安装已停止，现有组件未替换。',
  unzip_failed: '组件包解压失败或超时；旧组件尚未替换。',
  missing_controller: '组件包缺少控制器；旧组件尚未替换。',
  missing_core: '全新安装需要包含 Mihomo 内核的组件包；当前组件包不含内核。',
  controller_not_executable: '控制器无法执行；请检查设备架构与执行权限。',
  core_not_executable: 'Mihomo 内核无法执行；请检查设备架构与执行权限。',
  yaml_parser_not_executable: '配置解析组件（yq）无法执行；请检查设备架构与执行权限。',
  secret_write_failed: '控制密钥写入失败；原配置未被替换。',
  secret_ensure_failed: '控制密钥补全失败；核心未启动。',
  panel_config_write_failed: 'Zashboard 配置写入失败；核心未启动。',
  service_script_invalid: 'Clash.Service 存在 Shell 语法错误；旧组件尚未替换。',
  service_script_failed: 'Clash.Service 无法调用控制器；旧组件尚未替换。',
  controller_protocol_mismatch: '控制器与当前页面的接口版本不兼容；请使用配套的 JS 与组件包。',
  service_protocol_mismatch: '服务脚本与控制器版本不配套；请使用同一套组件包。',
  panel_candidate_rejected: '组件包中的面板不是有效的 Zashboard；已保留原面板。',
  panel_postcheck_failed: 'Zashboard 替换后校验未通过；已回滚本次安装。',
  missing_service_wrapper: '组件包缺少启动包装器 Clash.Service；安装已停止。',
  service_patch_failed: '启动组件更新失败；请重新安装组件包。',
  invalid_subscription: '订阅地址未配置或无效；请填写不含账号信息的 HTTP 或 HTTPS 订阅地址。',
  invalid_config: '用户配置格式错误；请修正 YAML/JSON 后重试，原配置未被覆盖。',
  configuration_missing: '组件包不含初始配置；原安装未改动。',
  old_environment_inspection_failed: '旧运行环境检查失败；安装已停止。',
  old_environment_cleanup_failed: '旧运行环境清理失败；安装已停止，现有组件未替换。',
  finalization_failed: '安装事务收尾失败；请查看“状态与日志”确认最终状态。',
  installation_busy: '另一个安装事务仍在进行；本次安装未执行，现有安装未改动。',
  preserve_user_data_failed: '未能保留用户配置；安装已取消。',
  commit_failed: '组件目录替换失败；请查看回滚结果。',
  network_apply_failed: '网络接管规则应用失败；请查看具体的防火墙或路由错误。',
  service_finalize_failed: '核心已启动，但 Service 收尾失败；请查看面板重载诊断。',
  service_failed: '服务脚本执行失败；请查看“状态与日志”。',
  start_timeout: '启动失败：等待核心启动超时；请查看“状态与日志”。',
  activation_unverified: '启动失败：服务未返回启动结果。',
  activation_failed: '新组件启动失败；请查看后端返回的具体原因。',
  interrupted: '安装失败：任务已中断。',
  transaction_interrupted: '安装失败：安装事务被中断；请查看“状态与日志”。',
  config_probe_failed: '配置读取超时或解析组件执行失败；用户配置未被覆盖。',
  process_respawned: '停止核心后仍检测到猫猫进程；安装已停止。',
  process_table_unreadable: '无法读取进程表；后续操作已停止。',
  journal_restore_incomplete: '网络参数或配置事务恢复失败；安装已停止。',
  network_rules_remain: '猫猫网络规则仍有残留；安装已停止。',
  owned_route_table_still_used_by_foreign_rule: '猫猫路由表仍被其他规则引用；未删除共享路由。',
};
function f50Diagnostic(content, fallback = '操作失败') {
  const safe = sanitizeSubscriptionSecrets(String(content || ''))
    .replace(/(?:https?|ss|ssr|vmess|vless|trojan|tuic|hysteria2?):\/\/[^\s"'<>]+/gi, '[URL_REDACTED]')
    .split(/\r?\n/).map(line => /["']?(?:password|passwd|secret|token|authorization|access_token)["']?\s*[:=]/i.test(line) ? '[SENSITIVE_ERROR_REDACTED]' : line).join('\n');
  const lines = safe.split(/\r?\n/);
  const get = key => { const row = lines.find(s => s.startsWith(key + '=')); return row ? row.slice(key.length + 1).trim() : ''; };
  const code = get('F50_INSTALL_CODE') || get('F50_START_CODE') || get('F50_CLEAN_ERROR') || get('KANO_INSTALL_ERROR');
  const backend = get('F50_INSTALL_CAUSE') || get('F50_ERROR');
  const cleanup = get('F50_CLEAN_ERROR');
  const cause = backend || cleanup || code;
  const labels = F50_DIAGNOSTIC_LABELS;
  let summary = labels[code] || labels[cause] || cause || lines.find(line => line.trim()) || fallback;
  if (/^F50_OPERATION_BUSY$/m.test(safe)) summary = '设备操作锁被上次未完成的操作占用；已自动尝试恢复未成功，请稍后重试或执行“恢复网络”。';
  const downloadFailure = safe.match(/^ARCHIVE_DOWNLOAD_FAILED=(\d+)$/m);
  if (downloadFailure) {
    const curlCodes = { 6: '域名解析失败', 7: '无法连接下载服务器', 22: '下载服务器返回错误状态', 28: '下载超时', 35: 'SSL 握手失败', 47: '重定向次数过多', 56: '接收下载数据中断', 60: '下载服务器 SSL 证书无效' };
    summary = '组件包下载失败：' + (curlCodes[Number(downloadFailure[1])] || ('curl 退出码 ' + downloadFailure[1])) + '；已依次尝试全部下载源，详见下方日志。';
  }
  if (code === 'old_environment_cleanup_failed' && cleanup) summary += ' ' + (labels[cleanup] || cleanup);
  if (!downloadFailure && !code && /timeout|timed out|超时/i.test(safe)) summary = '操作失败：设备命令超时；请查看“状态与日志”。';
  if (/subscription URL must (?:be HTTPS without userinfo|use HTTP\(S\), no userinfo)|empty provider URL/i.test(cause)) summary = labels.invalid_subscription;
  else if (cause === 'original_config_invalid') {
    const detail = lines.find(line => /^F50_CONFIG_TEST_DETAIL=.*(?:level=["']?(?:error|fatal)|parse config|yaml:)/i.test(line)) || lines.find(line => line.startsWith('F50_CONFIG_TEST_DETAIL='));
    summary = '用户配置恢复后未通过核心校验' + (detail ? '：' + detail.slice('F50_CONFIG_TEST_DETAIL='.length).trim() : '；详见下方校验详情。');
  }
  else if (/CONFIG_TEST_FAILED|configuration is not a YAML mapping|yq parse failed|rules must be a list/i.test(cause)) summary = '配置校验未通过；请检查配置格式与策略引用。';
  else if (/policy|iptables|ip6tables|route|downstream|network|TUN|listener/i.test(cause) && code === 'activation_failed') summary = '网络接管规则应用失败：' + cause;
  else if (['activation_failed','service_failed','network_apply_failed'].includes(code) && backend) summary = '启动失败：' + backend;
  const serviceRc = (lines.filter(line => line.startsWith('START_SERVICE_RC=')).pop() || '').slice('START_SERVICE_RC='.length).trim();
  if (!backend && (serviceRc === '124' || serviceRc === '137')) summary = '启动失败：等待核心启动超时；请查看“状态与日志”。';
  const rollback = get('F50_ROLLBACK');
  if (rollback && !['restored', 'restored_stopped'].includes(rollback)) summary += '；回滚失败：' + rollback;
  else if (rollback === 'restored') summary += '；已恢复安装前状态。';
  const componentsInstalled = get('F50_INSTALL_COMPONENTS_OK') === '1';
  const transactionState = get('F50_INSTALL_TRANSACTION_STATE') || 'unknown';
  if (componentsInstalled && transactionState !== 'complete') {
    const installed = get('F50_INSTALL_STATUS') === 'installed_running'
      ? '组件已安装并启动' : '组件已安装，核心保持停止';
    const warning = lines.filter(line => /^F50_INSTALL_WARNING=(?!previous_components_retained$)/.test(line)).pop() || '';
    const reason = warning.slice('F50_INSTALL_WARNING='.length) || code || transactionState;
    summary = installed + '；事务收尾失败（' + reason + '），组件未回滚。';
  }
  const keyLines = lines.filter(line => /^(F50_(?:INSTALL_[A-Z_]+|CONFIG_STATE|BACKUP_LEFT|ERROR|START_(?:CODE|OK)|ROLLBACK|RECOVERY_[A-Z_]+)|KANO_INSTALL_OK|START_SERVICE_RC|START_STATE)=/.test(line));
  const details = safe.length <= 6000 ? safe : keyLines.slice(0, 12).join('\n').slice(0, 2500) + '\n[OUTPUT_TRUNCATED]\n' + safe.slice(-3500);
  return {code, summary: summary.slice(0, 280), details, serviceRc, rollback, componentsInstalled, transactionState, ok: false};
}
function f50Error(content) { return f50Diagnostic(content).summary; }

function f50StartResult(response = {}, fallback = '') {
  const diagnostic=f50Diagnostic(response.content || fallback);
  const text=diagnostic.details, lines=text.split(/\r?\n/);
  const last=(name)=>{const value=lines.filter(line=>line.startsWith(name+'=')).pop();return value?value.slice(name.length+1):'';};
  const ok=response.success===true && last('F50_START_OK')==='1' && last('START_STATE')==='started_verified_process' && !/^F50_ERROR=/m.test(text);
  const panelFailed=last('F50_HEALTH_PANEL')==='failed';
  const coreStarted=last('START_STATE')==='started_verified_process';
  return {...response,ok,success:ok,code:last('F50_START_CODE') || diagnostic.code || (ok?'started':'start_result_unknown'),
    detail:text,content:text,panelFailed,coreStarted,finalized:ok,summary:ok ? (panelFailed?'核心已启动；Zashboard 面板暂不可用':'核心已启动；代理连通性未测试') : diagnostic.summary,
    serviceRc:diagnostic.serviceRc,transportOk:response.success===true};
}
const rotateClashLogCmd = () => `if [ -f '/data/clash/Proxy/Clash.log' ]; then
  kano_log_size=$(wc -c < '/data/clash/Proxy/Clash.log' 2>/dev/null || echo 0)
  case "$kano_log_size" in ''|*[!0-9]*) ;; *) [ "$kano_log_size" -gt 5242880 ] && mv -f '/data/clash/Proxy/Clash.log' '/data/clash/Proxy/Clash.log.1' 2>/dev/null || true ;; esac
fi
`;
const dataSpaceGuardCmd = (onLow = 'exit 1') => `kano_data_avail_kb=$(df -k /data 2>/dev/null | awk 'NR==2 {print $4}')
case "$kano_data_avail_kb" in ''|*[!0-9]*) ;; *) [ "$kano_data_avail_kb" -ge 51200 ] || { ${onLow}; } ;; esac
`;
function buildF50StartScript(action) {
  if (!['start', 'restart'].includes(action)) throw new Error('invalid_start_action');
  return rotateClashLogCmd() + buildF50MaintenanceFunctions('start') + '\nf50_start_service ' + shellQuote(action) + ' 85\n';
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
  let operationBlocked = false;
  let failedStage = '';
  const recoverIdleLease = async () => {
    const op = activeCriticalOperation;
    if (!op || op.leaseOwned || op.uncertain || op.token.cancelled || op.requests) return false;
    operationStage('检查并恢复闲置操作锁', 0, stages.length+1);
    let recovered;
    try {
      recovered = f50ShellReply(await hostRunShellWithRoot.call(globalThis, buildF50EmergencyScript('', true, true), 120000));
    } catch (error) { throw f50UnknownCompletion(op, error?.message || error); }
    diagnostics.push({stage:'恢复闲置操作锁', transportOk:recovered?.success === true,
      detail:f50Diagnostic(recovered?.content || 'F50_RECOVERY_STATE=check_unconfirmed').details});
    if (!(recovered?.success && /^F50_LEASE_RELEASED=1$/m.test(String(recovered.content || '')))) return false;
    if (op !== activeCriticalOperation || op.token.cancelled) throw operationCancelled();
    op.leasePromise = null;
    deviceTaskUncertain = false;
    return true;
  };
  if (deviceTaskUncertain && !(await recoverIdleLease())) operationBlocked = true;
  for (let i=0; i<stages.length; i++) {
    if (operationBlocked) break;
    operationStage(stages[i].title, i, stages.length+1);
    try {
      let response = await runShellWithRoot(stages[i].script, stages[i].timeout);
      if (i === 0 && /^F50_OPERATION_BUSY$/m.test(String(response?.content || ''))) {
        if (await recoverIdleLease()) {
          operationStage(stages[i].title, i, stages.length+1);
          response = await runShellWithRoot(stages[i].script, stages[i].timeout);
        }
      }
      operationBlocked = /^F50_OPERATION_BUSY$/m.test(String(response?.content || ''));
      diagnostics.push({stage:stages[i].title, transportOk:response?.success === true,
        detail:f50Diagnostic(response?.content || 'F50_STAGE_ERROR=empty_response').details});
      if (!response?.success) { failedStage = stages[i].title; break; }
    } catch (error) {
      if (error?.name === 'OperationCancelled') throw error;
      diagnostics.push({stage:stages[i].title, transportOk:false,
        detail:f50Diagnostic(error?.message || String(error)).details});
      failedStage = stages[i].title;
      break;
    }
  }
  operationStage('复查卸载结果', stages.length, stages.length+1);
  let finalResponse;
  try {
    // Independent read-only proof: no new cancellable worker or plugin directory is created by the wrapper.
    finalResponse = await hostRunShellWithRoot.call(globalThis, buildF50FinalCheckScript(), 25000);
  } catch (error) {
    finalResponse = {success:false, content:'F50_CHECK_UNKNOWN=final_transport\n' + f50Diagnostic(error?.message || String(error)).details};
  }
  const verdict = f50UninstallVerdict(finalResponse);
  const ok = verdict.ok && !operationBlocked && !failedStage;
  const details = diagnostics.map(item => 'STAGE=' + item.stage + '\nTRANSPORT_OK=' + Number(item.transportOk) + '\n' + item.detail).join('\n')
    + '\nFINAL_TRANSPORT_OK=' + Number(finalResponse?.success === true) + '\n' + verdict.detail;
  const summary = ok ? '猫猫及全部组件数据已卸载'
    : operationBlocked ? '卸载失败：设备操作锁检查未通过；请查看“状态与日志”'
    : failedStage ? '卸载失败：' + failedStage + '失败；请查看“状态与日志”'
    : verdict.code === 'residual' ? '卸载失败：仍有猫猫残留；残留项见“状态与日志”'
    : '卸载失败：无法读取最终状态；请检查设备连接后重试';
  const result = {...verdict, ok, code:operationBlocked ? 'operation_busy' : failedStage ? 'stage_failed' : verdict.code, summary, details};
  lastInstallDiagnostic = {...result, diagnostics};
  return result;
}

async function f50Command(action, timeout = 60000, args = []) {
  if (!(await ensureCompatBackend())) return { success: false, content: 'F50_BACKEND_REQUIRED' };
  if (/^(?:stop|recover|restart)$/.test(action) && !(await ensureOriginalSubscriptionService())) {
    return { success: false, content: 'F50_ERROR=tun_rule_cleanup_patch_failed' };
  }
  return runShellWithRoot('sh ' + [CLASH_SERVICE, action, ...args].map(shellQuote).join(' '), timeout);
}
let f50PackageInput = null;
function buildF50ZashboardValidationFunction() { return `
f50_validate_zashboard() {
  ui_dir=$1
  [ -s "$ui_dir/index.html" ] || { echo F50_PANEL_CODE=missing_index; return 1; }
  grep -Eiq '<title>[[:space:]]*zashboard[[:space:]]*</title>' "$ui_dir/index.html" || { echo F50_PANEL_CODE=wrong_identity; return 1; }
  scripts=$(tr "\\047" '"' < "$ui_dir/index.html" | grep -Eo '<script[^>]*src="[^"]+"' | sed 's/.*src="//;s/"$//')
  [ -n "$scripts" ] || { echo F50_PANEL_CODE=missing_main_asset; return 1; }
  for asset in $scripts; do
    case "$asset" in https://*|http://*) continue ;; esac
    asset=\${asset%%[?#]*}; asset=\${asset#./}; asset=\${asset#/}
    [ -s "$ui_dir/$asset" ] || { echo F50_PANEL_CODE=missing_main_asset; return 1; }
  done
  echo F50_PANEL_VALIDATED=1
}
`; }
function buildF50MaintenanceFunctions(operation = 'all') {
  const sections = {
    base: { build: buildF50ShellBase, requires: [] },
    process: { build: buildF50ProcessHelpers, requires: ["base"] },
    network: { build: buildF50NetworkHelpers, requires: ["base"] },
    compat: { build: buildF50NetworkCompatHelpers, requires: ["base"] },
    inspect: { build: buildF50InspectHelpers, requires: ["process","network"] },
    cleanup: { build: buildF50CleanupHelpers, requires: ["process","network"] },
    artifacts: { build: buildF50ArtifactHelpers, requires: ["base"] },
    install: { build: buildF50InstallHelpers, requires: ["base"] },
    remove: { build: buildF50RemovalHelpers, requires: ["process","network","artifacts"] },
    final: { build: buildF50FinalProbeHelpers, requires: ["process","network","artifacts"] },
    panel: { build: buildF50PanelHelpers, requires: ["base"] },
    start: { build: buildF50StartHelpers, requires: ["panel","compat"] },
  };
  const operations = {
    all: Object.keys(sections), start: ['start'], inspect: ['inspect'],
    install: ['inspect', 'cleanup', 'start', 'install'],
    cleanup: ['inspect', 'cleanup'], final: ['final'], remove: ['remove'],
  };
  if (!operations[operation]) throw new Error('invalid_maintenance_operation');
  const selected = new Set();
  const include = (name) => {
    if (selected.has(name)) return;
    for (const dependency of sections[name].requires) include(dependency);
    selected.add(name);
  };
  operations[operation].forEach(include);
  return [...selected].map((name) => sections[name].build()).join('\n');
}
function buildF50ShellBase() { return `# Shared bootstrap maintenance: no installed helper is required.
F50_ROOT=\${F50_ROOT:-/data/clash}
F50_PROC=\${F50_PROC:-/proc}
F50_SYSNET=\${F50_SYSNET:-/sys/class/net}
F50_DATA=\${F50_ROOT%/*}
F50_BOOT=\${F50_BOOT:-/sdcard/ufi_tools_boot.sh}
F50_TASK=\${KANO_TPROXY_TASK:-}
umask 077
f50_limit() {
  f50_seconds=$1; shift
  if timeout -k 2 1 true >/dev/null 2>&1; then
    timeout -k 2 "$f50_seconds" "$@"
  else
    "$@" & f50_child=$!
    ( sleep "$f50_seconds"; kill -TERM "$f50_child" 2>/dev/null; sleep 2; kill -KILL "$f50_child" 2>/dev/null ) & f50_guard=$!
    wait "$f50_child"; f50_rc=$?
    kill "$f50_guard" 2>/dev/null; wait "$f50_guard" 2>/dev/null
    case "$f50_rc" in 143) return 124 ;; esac
    return "$f50_rc"
  fi
}
${buildF50RedactFunction()}
`; }
function buildF50ProcessHelpers() { return `f50_stat() {
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
        Clash.Core|Clash|clash|mihomo|clashctl*|kano-f50*|kano-gist-sync|mosdns*|yq_linux*|Clash.*|age|sh|ash|bash|dash|mksh|toybox|busybox|inotifyd|curl|wget|unzip|tar|gzip|xz|timeout|cp|mv|rm|awk|sed|tee|dd|base64)
          ps_exe=$(readlink "$ps_dir/exe" 2>/dev/null)
          ps_exe=\${ps_exe% (deleted)}
          if f50_owned_exe "$ps_exe"; then
            ps_owned=1; ps_kind=binary
            case "\${ps_exe##*/}" in Clash.Core|mihomo) ps_kind=core ;; esac
          fi
          case "\${ps_exe##*/}" in
            clashctl*|kano-gist-sync|Clash.*|sh|bash|dash|mksh|toybox|busybox|inotifyd)
              ps_args=$(tr '\\000' '\\n' < "$ps_dir/cmdline" 2>/dev/null)
              ps_index=0; ps_script=0; ps_action=
              while IFS= read -r ps_arg; do
                if [ "$ps_kind" = core ]; then case "$ps_arg" in -t|--test) ps_kind=config_test ;; esac; fi
                if [ "$ps_index" = 1 ]; then
                  case "\${ps_exe##*/}" in clashctl*|kano-gist-sync) ps_action=$ps_arg ;; esac
                fi
                [ "$ps_script" = 2 ] && { ps_action=$ps_arg; ps_script=3; }
                case "$ps_arg" in
                  -c) break ;;
                  */Scripts/Clash.Service|*/Scripts/Clash.GistSync|*/Scripts/Clash.Inotify|*/Scripts/Clash.KanoStart|*/Scripts/Clash.PolicyTools|*/Scripts/Clash.MacBypass)
                    if f50_owned_exe "$ps_arg"; then ps_owned=1; ps_kind=service; ps_script=2; fi ;;
                esac
                ps_index=$((ps_index+1))
              done <<EOF_F50_ARGS
$ps_args
EOF_F50_ARGS
              case "$ps_action" in snapshot|status|version|--version|help|--help|profile|job|verify-clean|verify-stopped) ps_owned=0; ps_excluded=1 ;; esac
              ;;
          esac
          if [ "$ps_owned:$ps_excluded" = 0:0 ]; then
            case "\${ps_exe##*/}" in sh|ash|bash|dash|mksh|toybox|busybox|age|curl|wget|unzip|tar|gzip|xz|timeout|cp|mv|rm|awk|sed|tee|dd|base64)
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
f50_install_lock_idle() {
  install_lock="$F50_DATA/clash.install.lock.d"
  [ -e "$install_lock" ] || [ -L "$install_lock" ] || return 0
  [ -d "$install_lock" ] && [ ! -L "$install_lock" ] && [ -f "$install_lock/pid" ] && [ ! -L "$install_lock/pid" ] || return 1
  read -r install_pid install_extra < "$install_lock/pid" || return 1
  case "$install_pid" in ''|0|*[!0-9]*) return 1;; esac
  [ -z "$install_extra" ] && [ -r "$F50_PROC" ] && [ -x "$F50_PROC" ] && [ ! -d "$F50_PROC/$install_pid" ] || return 1
  for install_entry in "$install_lock"/* "$install_lock"/.[!.]* "$install_lock"/..?*; do
    [ -e "$install_entry" ] || [ -L "$install_entry" ] || continue
    [ "$install_entry" = "$install_lock/pid" ] || return 1
  done
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
`; }
function buildF50NetworkHelpers() { return `f50_table_absent() {
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
  function owned(c){return c ~ /^KANO_F50_(PRE|DNS|FWD|POST|INPUT)$/ || c ~ /^KANO_(POLICY_PRE|POLICY|DNS_HIJACK|DNS|QUIC_BLOCK|QUIC|MAC_BYPASS|PR_FWD)(_A|_B)?$/}
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
    if(!owned(a[2])&&owned(target)){begin();arg("-D");for(i=2;i<=n;i++)arg(a[i]);print "!"}
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
f50_routes_plan() {
  awk -v family="$1" '
  function val(k, i){for(i=2;i<NF;i++)if($i==k)return $(i+1);return ""}
  function canonical( i,k){
    if(val("from")!="all")return 0;
    for(i=2;i<=NF;i++){
      k=$i;
      if(k ~ /^\\[.*\\]$/)continue;
      if(k=="proto"||k=="protocol"){i++;continue}
      if(k=="from"||k=="fwmark"||k=="iif"||k=="lookup"){i++;continue}
      return 0
    }
    return 1
  }
  function arg(s){print "a" s}
  function begin(){print "@";arg("ip");arg(family)}
  FNR==NR{
    t=val("lookup");p=$1;sub(/:$/,"",p);m=val("fwmark");d=val("iif");
    # ip rule show may append display-only tokens such as [detached]; rebuild commands from owned fields only.
    if(canonical()&&d==""&&p=="1777"&&t=="17666"&&(m=="0x10000000/0x10000000"||m=="268435456/268435456")){
      begin();arg("rule");arg("del");arg("pref");arg(p);arg("fwmark");arg(m);arg("lookup");arg(t);print "!"
    } else if(canonical()&&m==""&&p=="1776"&&t=="17667"&&(d=="lo"||d=="KanoTun")){
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
  if awk '$2 ~ /^KanoTun(:|@)/{found=1} END{exit !found}' "$nw_dir/links"; then
    if [ -r "$F50_SYSNET/KanoTun/tun_flags" ] && awk '
      {dev="";tab="";proto="";for(i=1;i<NF;i++){if($i=="dev")dev=$(i+1);if($i=="table")tab=$(i+1);if($i=="proto")proto=$(i+1)}
       if(dev=="KanoTun"&&(tab=="17666"||tab=="17667")&&proto=="242")found=1}
      END{exit !found}' "$nw_dir/routes4" "$nw_dir/routes6"; then
      printf '@\\naip\\nalink\\nadelete\\naKanoTun\\n!\\n' >> "$nw_dir/plan"
    else
      echo F50_CLEAN_ERROR=tun_ownership_unverified
      return 1
    fi
  fi
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
`; }
function buildF50NetworkCompatHelpers() { return `# KANO_TUN_RULE_CLEANUP=2
f50_drop_detached_tun_rules() {
  case "$1" in stop|recover|restart) tun_cleanup_active=1 ;; *) tun_cleanup_active=0 ;; esac
  for detached_family in 4 6; do
    detached_rules=$(ip -"$detached_family" rule show 2>/dev/null) || continue
    tun_rule_fields=$(printf '%s\\n' "$detached_rules" | awk -v active="$tun_cleanup_active" '
      {
        p=$1; sub(/:$/, "", p); src=""; dev=""; table=""; detached=0; foreign=0
        for(i=2;i<=NF;i++) {
          k=$i
          if(k=="[detached]") { detached=1; continue }
          if(k ~ /^\\[.*\\]$/) continue
          if(k=="from") { src=$(++i); continue }
          if(k=="iif") { dev=$(++i); continue }
          if(k=="lookup") { table=$(++i); continue }
          if(k=="proto" || k=="protocol") { i++; continue }
          foreign=1
        }
        if(!foreign && p=="1776" && src=="all" && dev=="KanoTun" && table=="17667" && (active==1 || detached))
          print p, dev, table
      }') || return 1
    [ -n "$tun_rule_fields" ] || continue
    printf '%s\\n' "$tun_rule_fields" | while read -r tun_pref tun_iif tun_table; do
      ip -"$detached_family" rule del pref "$tun_pref" iif "$tun_iif" lookup "$tun_table" || {
        echo "F50_ERROR=detached_tun_rule_cleanup_failed_ipv$detached_family"
        exit 1
      }
    done || return 1
  done
  return 0
}
${buildF50Ipv6DnsCompatFunctions()}`; }
function buildF50Tun6CompatFunctions() {
  const [major, minor, patch] = F50_MIPS_MIN_VERSION.split('.').map(Number);
  return `f50_check_mips_version() {
  mips_root=\${CLASH_ROOT:-\${F50_ROOT:-/data/clash}}
  mips_banner=$("$mips_root/Proxy/Clash.Core" -v 2>&1) || { echo F50_ERROR=mips_core_version_unavailable; return 2; }
  mips_version=$(printf '%s\\n' "$mips_banner" | sed -n 's/.*[vV]\\([0-9][0-9]*\\)\\.\\([0-9][0-9]*\\)\\.\\([0-9][0-9]*\\).*/\\1 \\2 \\3/p' | head -1)
  printf '%s\\n' "$mips_version" | awk 'NF!=3 {exit 1} {exit !(($1>${major})||($1==${major}&&$2>${minor})||($1==${major}&&$2==${minor}&&$3>=${patch}))}' || {
    echo F50_ERROR=mips_requires_mihomo_${F50_MIPS_MIN_VERSION}; return 1
  }
  echo F50_MIPS_VERSION_OK=1
}
f50_load_tun_state() {
  F50_TUN_ROOT=\${CLASH_ROOT:-\${F50_ROOT:-/data/clash}}
  F50_TUN_FILE="$F50_TUN_ROOT/Policy/options.conf"
  F50_TUN_MODE=''; F50_TUN_IPV6=''; F50_TUN_STACK=''
  [ -r "$F50_TUN_FILE" ] || return 1
  # 一次读完三个字段，后续函数复用这些变量，避免反复读 options.conf。
  f50_tun_lines=$(awk '/^(traffic_mode|ipv6|tun_stack)=/' "$F50_TUN_FILE" 2>/dev/null)
  while IFS='=' read -r f50_tun_key f50_tun_value; do
    case "$f50_tun_key" in
      traffic_mode) F50_TUN_MODE=$f50_tun_value;;
      ipv6) F50_TUN_IPV6=$f50_tun_value;;
      tun_stack) F50_TUN_STACK=$f50_tun_value;;
    esac
  done <<F50_TUN_STATE
$f50_tun_lines
F50_TUN_STATE
  return 0
}
f50_check_tun_stack() {
  case "$1" in start|restart|boot) ;; *) return 0;; esac
  f50_load_tun_state || return 0
  [ "$F50_TUN_MODE" = tun ] || return 0
  F50_SELECTED_TUN_STACK=$F50_TUN_STACK
  case "$F50_SELECTED_TUN_STACK" in
    auto|'')
      mips_probe=$(f50_check_mips_version); mips_rc=$?
      case "$mips_rc" in
        0) F50_SELECTED_TUN_STACK=mips;;
        1) if [ "$F50_TUN_IPV6" = on ]; then F50_SELECTED_TUN_STACK=gvisor; else F50_SELECTED_TUN_STACK=mixed; fi
           echo F50_TUN_AUTO_FALLBACK="$F50_SELECTED_TUN_STACK";;
        *) printf '%s\\n' "$mips_probe"; return "$mips_rc";;
      esac;;
    mixed|gvisor|system) ;;
    mips) f50_check_mips_version || return 1;;
    *) echo F50_ERROR=invalid_tun_stack; return 1;;
  esac
}
f50_prepare_tun_stack() {
  # 不依赖 f50_check_tun_stack 留下的全局变量，单独调用时也能拿到正确根目录。
  F50_TUN_ROOT=\${CLASH_ROOT:-\${F50_ROOT:-/data/clash}}
  case "$1:$2" in
    policy:apply|policy:boot-apply|policy:verify) f50_tun6_return_route "$2"; return $?;;
  esac
  [ -n "$F50_SELECTED_TUN_STACK" ] || return 0
  tun6_cfg="$F50_TUN_ROOT/Proxy/config.yaml"
  tun6_yq="$F50_TUN_ROOT/Tools/yq_linux_arm64"
  "$tun6_yq" eval -e '.tun.enable == true' "$tun6_cfg" >/dev/null 2>&1 || {
    echo F50_ERROR=tun_config_mismatch; return 1
  }
  F50_TUN_STACK="$F50_SELECTED_TUN_STACK" "$tun6_yq" eval -e '.tun.stack == strenv(F50_TUN_STACK)' "$tun6_cfg" >/dev/null 2>&1 && return 0
  tun6_candidate="$tun6_cfg.tun6.$$"
  # The legacy controller always writes mixed; restore the selected stack before reload.
  F50_TUN_STACK="$F50_SELECTED_TUN_STACK" "$tun6_yq" eval -P -o=yaml -I=2 '.tun.stack = strenv(F50_TUN_STACK)' "$tun6_cfg" > "$tun6_candidate" &&
    "$F50_TUN_ROOT/Proxy/Clash.Core" -t -d "$F50_TUN_ROOT/Proxy" -f "$tun6_candidate" >/dev/null 2>&1 &&
    chmod 600 "$tun6_candidate" && mv -f "$tun6_candidate" "$tun6_cfg" || {
      rm -f "$tun6_candidate"; echo F50_ERROR=tun_stack_prepare_failed; return 1
    }
  F50_CONFIG_RELOAD_REQUIRED=1
}
f50_finish_tun_stack() {
  [ -n "$F50_SELECTED_TUN_STACK" ] || return 0
  # Reloading a TUN recreates its interface and removes controller-owned routes.
  f50_run_controller policy apply || { echo F50_ERROR=tun_policy_apply_failed; return 1; }
  f50_tun6_return_route apply || { echo F50_ERROR=tun_return_route_apply_failed; return 1; }
  f50_run_controller policy verify || { echo F50_ERROR=tun_policy_verify_failed; return 1; }
  f50_tun6_return_route verify || { echo F50_ERROR=tun_return_route_verify_failed; return 1; }
  echo F50_TUN_STACK_READY="$F50_SELECTED_TUN_STACK"
}
f50_tun6_return_route() {
  # 这里可能先于 f50_check_tun_stack 被调用，需要自行读取策略状态。
  [ -n "$F50_TUN_FILE" ] || f50_load_tun_state || return 0
  [ "$F50_TUN_MODE" = tun ] && [ "$F50_TUN_IPV6" = on ] || return 0
  case "$F50_TUN_STACK" in mixed|system) ;; *) return 0;; esac
  # Android policy routing otherwise sends the system stack's SYN-ACK to the cellular interface.
  tun6_addresses=$(ip -6 -o addr show dev KanoTun scope global) || { echo F50_ERROR=tun6_address_query_failed; return 1; }
  tun6_prefixes=$(printf '%s\\n' "$tun6_addresses" | awk '$3=="inet6" && $4 ~ /^[0-9a-fA-F:]+\\/[0-9]+$/ && $4 !~ /^[fF][eE]80:/ && !seen[$4]++ {print $4}') || { echo F50_ERROR=tun6_address_parse_failed; return 1; }
  [ -n "$tun6_prefixes" ] || { echo F50_ERROR=tun6_address_missing; return 1; }
  for tun6_prefix in $tun6_prefixes; do
    if [ "$1" = verify ]; then
      tun6_return=$(ip -6 route show table 17667 exact "$tun6_prefix") || { echo F50_ERROR=tun6_route_query_failed; return 1; }
      printf '%s\\n' "$tun6_return" | awk '
        $1 ~ /:/ {dev="";proto="";for(i=2;i<NF;i++){if($i=="dev")dev=$(i+1);if($i=="proto")proto=$(i+1)}
          if(dev=="KanoTun" && proto=="242")found=1}
        END{exit !found}' || { echo F50_ERROR=tun6_return_route_missing; return 1; }
    else
      ip -6 route replace "$tun6_prefix" dev KanoTun table 17667 proto 242 || {
        echo F50_ERROR=tun6_return_route_failed; return 1
      }
    fi
  done
  echo F50_TUN_IPV6_RETURN_READY=1
}
# KANO_TUN_STACK_COMPAT=1
# KANO_TUN_AUTO_MIPS=1
# KANO_TUN_IPV6_RETURN=3
`; }
function buildF50Ipv6DnsCompatFunctions() { return `f50_disable_unsupported_ipv6_dns_hijack() {
  compat_options="\${CLASH_ROOT:-\${F50_ROOT:-/data/clash}}/Policy/options.conf"
  [ -r "$compat_options" ] || return 0
  grep -qx 'ipv6=on' "$compat_options" || return 0
  grep -qx 'dns_hijack=on' "$compat_options" || return 0
  compat_nat_probe=$(ip6tables -t nat -S 2>&1); compat_nat_rc=$?
  [ "$compat_nat_rc" = 0 ] && return 0
  printf '%s\\n' "$compat_nat_probe" | grep -Eiq "can't initialize ip6tables table.*nat|Table does not exist" || return 0
  echo F50_WARNING=ipv6_nat_unavailable_ipv4_dns_preserved
}
f50_dns_restore_options() {
  [ -e "$f50_dns_backup" ] || return 0
  [ -f "$f50_dns_backup" ] && [ ! -L "$f50_dns_backup" ] && [ ! -L "$f50_dns_options" ] || {
    echo F50_ERROR=ipv6_dns_options_unsafe; return 1
  }
  cp -p "$f50_dns_backup" "$f50_dns_options.restore.$$" &&
    mv -f "$f50_dns_options.restore.$$" "$f50_dns_options" && rm -f "$f50_dns_backup" || {
      echo F50_ERROR=ipv6_dns_options_restore_failed; return 1
    }
}
f50_dns4_address() {
  printf '%s\\n' "$1" | awk '
    {n=split($0,p,"/"); if(n>2 || p[1] !~ /^[0-9.]+$/ || (n==2 && (p[2] !~ /^[0-9]+$/ || p[2]>32))) exit 1
     if(split(p[1],o,".")!=4) exit 1
     for(i=1;i<=4;i++) if(o[i]=="" || length(o[i])>3 || o[i]>255) exit 1}
  '
}
f50_dns4_rule() {
  if [ "$dns4_action" = verify ]; then
    iptables -w 5 -t nat -C "$@" || { echo F50_ERROR=ipv4_dns_rule_missing; return 1; }
  else
    printf '%s' '-A' >> "$dns4_batch" || return 1
    printf ' %s' "$@" >> "$dns4_batch" || return 1
    printf '\\n' >> "$dns4_batch" || return 1
  fi
}
f50_ipv4_dns_rules() {
  dns4_action=$1
  dns4_port=$(sed -n 's/^dns_port=//p' "$f50_dns_options" | head -1)
  dns4_port=\${dns4_port:-1053}
  case "$dns4_port" in *[!0-9]*|'') echo F50_ERROR=invalid_dns_port; return 1;; esac
  [ "$dns4_port" -ge 1 ] && [ "$dns4_port" -le 65535 ] || { echo F50_ERROR=invalid_dns_port; return 1; }
  dns4_mode=$(sed -n 's/^traffic_mode=//p' "$f50_dns_options" | head -1)
  dns4_interfaces=$(iptables -w 5 -t mangle -S PREROUTING | awk '
    $1=="-A" && $2=="PREROUTING" {
      iface=""; owned=0
      for(i=3;i<=NF;i++) { if($i=="-i") iface=$(i+1); if($i=="-j" && $(i+1)=="KANO_F50_PRE") owned=1 }
      if(owned && iface!="" && !seen[iface]++) print iface
    }') || return 1
  [ -n "$dns4_interfaces" ] || { echo F50_ERROR=ipv4_dns_lan_missing; return 1; }
  if [ "$dns4_action" = apply ]; then
    dns4_existing=$(iptables -w 5 -t nat -S) || return 1
    printf '*nat\\n:KANO_F50_DNS - [0:0]\\n' > "$dns4_batch" || return 1
    printf '%s\\n' "$dns4_existing" | awk '$1=="-A" && $2=="PREROUTING" && $NF=="KANO_F50_DNS" {sub(/^-A /,"-D "); print}' >> "$dns4_batch" || return 1
  fi
  if [ "$dns4_mode" = tproxy ] && [ -r "$f50_dns_root/Policy/device_bypass.txt" ]; then
    sed 's/#.*//;s/\\r//g;/^[[:space:]]*$/d' "$f50_dns_root/Policy/device_bypass.txt" |
      while read -r dns4_device; do
        case "$dns4_device" in
          *:*)
            if printf '%s\\n' "$dns4_device" | grep -Eq '^([[:xdigit:]]{2}:){5}[[:xdigit:]]{2}$'; then
              for dns4_protocol in udp tcp; do
                f50_dns4_rule KANO_F50_DNS -m mac --mac-source "$dns4_device" -p "$dns4_protocol" --dport 53 -j ACCEPT || exit 1
              done
            fi ;;
          *)
            f50_dns4_address "$dns4_device" || { echo F50_ERROR=invalid_dns_bypass_address; exit 1; }
            for dns4_protocol in udp tcp; do
              f50_dns4_rule KANO_F50_DNS -s "$dns4_device" -p "$dns4_protocol" --dport 53 -j ACCEPT || exit 1
            done ;;
        esac
      done || return 1
  fi
  if [ "$dns4_mode" = tun ] && grep -qx 'private_route_enabled=on' "$f50_dns_options"; then
    for dns4_cidr in $(sed -n 's/^private_route_cidrs=//p' "$f50_dns_options"); do
      case "$dns4_cidr" in *:*) continue;; esac
      f50_dns4_address "$dns4_cidr" || { echo F50_ERROR=invalid_dns_private_route; return 1; }
      f50_dns4_rule KANO_F50_DNS -d "$dns4_cidr" -j ACCEPT || return 1
    done
  fi
  for dns4_protocol in udp tcp; do
    f50_dns4_rule KANO_F50_DNS -p "$dns4_protocol" --dport 53 -j REDIRECT --to-ports "$dns4_port" || return 1
  done
  f50_dns4_rule KANO_F50_DNS -j RETURN || return 1
  for dns4_interface in $dns4_interfaces; do
    for dns4_protocol in udp tcp; do
      f50_dns4_rule PREROUTING -i "$dns4_interface" -p "$dns4_protocol" --dport 53 -j KANO_F50_DNS || return 1
    done
  done
  if [ "$dns4_action" = apply ]; then
    printf 'COMMIT\\n' >> "$dns4_batch" || return 1
    iptables-restore -w 5 -n < "$dns4_batch" || { echo F50_ERROR=ipv4_dns_apply_failed; return 1; }
    f50_ipv4_dns_rules verify || return 1
  fi
  echo F50_IPV4_DNS_VERIFIED=1
}
f50_run_controller() (
  case "$1" in snapshot|status|version|--version|help|--help|profile|verify-clean|verify-stopped)
    "$binary" "$@"; exit $?;;
  esac
  f50_dns_root=\${CLASH_ROOT:-\${F50_ROOT:-/data/clash}}
  f50_dns_options="$f50_dns_root/Policy/options.conf"
  f50_dns_backup="$f50_dns_options.ipv6_dns"
  f50_dns_restore_options || exit 1
  case "$1:$2" in start:*|restart:*|boot:*|policy:apply|policy:boot-apply|policy:verify) ;;
    *) "$binary" "$@"; exit $?;;
  esac
  if ! grep -qx 'ipv6=on' "$f50_dns_options" || ! grep -qx 'dns_hijack=on' "$f50_dns_options" ||
      grep -qx 'traffic_mode=off' "$f50_dns_options"; then "$binary" "$@"; exit $?; fi
  f50_dns_probe=$(ip6tables -t nat -S 2>&1); f50_dns_probe_rc=$?
  if [ "$f50_dns_probe_rc" = 0 ] || ! printf '%s\\n' "$f50_dns_probe" | grep -Eiq "can't initialize ip6tables table.*nat|Table does not exist"; then
    "$binary" "$@"; exit $?
  fi
  [ ! -L "$f50_dns_options" ] || { echo F50_ERROR=ipv6_dns_options_unsafe; exit 1; }
  umask 077
  dns4_batch="$f50_dns_root/Policy/.ipv4_dns.$$"
  f50_dns_finish() {
    f50_dns_exit=$?
    trap - EXIT HUP INT TERM
    f50_dns_restore_options || f50_dns_exit=1
    rm -f "$dns4_batch" "$f50_dns_options.tmp.$$" "$f50_dns_options.restore.$$" || f50_dns_exit=1
    exit "$f50_dns_exit"
  }
  trap f50_dns_finish EXIT
  trap 'exit 130' HUP INT TERM
  cp -p "$f50_dns_options" "$f50_dns_backup" || exit 1
  # The legacy controller has one DNS flag; only its leased invocation sees DNS off.
  awk '{if($0=="dns_hijack=on")print "dns_hijack=off";else print}' "$f50_dns_options" > "$f50_dns_options.tmp.$$" &&
    chmod 600 "$f50_dns_options.tmp.$$" && mv -f "$f50_dns_options.tmp.$$" "$f50_dns_options" || exit 1
  "$binary" "$@"; f50_dns_rc=$?
  f50_dns_restore_options || exit 1
  [ "$f50_dns_rc" = 0 ] || exit "$f50_dns_rc"
  case "$1:$2" in policy:verify) f50_ipv4_dns_rules verify;; *) f50_ipv4_dns_rules apply;; esac || exit 1
  echo F50_WARNING=ipv6_nat_unavailable_ipv4_dns_preserved
)
# KANO_IPV6_DNS_SPLIT=3
`; }

function buildF50InspectHelpers() { return `f50_inspect() {
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
`; }
function buildF50CleanupHelpers() { return `f50_clean_environment() {
  clean_recover=missing; clean_detail=
  # Never invoke a missing installation on a clean device: recover itself creates Policy/.
  if [ "\${F50_SKIP_NATIVE_RECOVERY:-0}" != 1 ] && [ -s "$F50_ROOT/Scripts/Clash.Service" ]; then
    clean_detail=$(CLASH_ROOT="$F50_ROOT" f50_limit 35 sh "$F50_ROOT/Scripts/Clash.Service" recover 2>&1); clean_rc=$?
    if [ "$clean_rc" = 0 ]; then clean_recover=ok; else clean_recover=failed; fi
    printf 'F50_RECOVER_RC=%s\\n' "$clean_rc"
    [ "$clean_recover" = ok ] || printf '%s\\n' "$clean_detail" | f50_redact
  fi
  f50_scan "$F50_WORK/pids" || return 1
  # Native recovery failed or left evidence: only the captured candidates/rules are touched.
  if [ -s "$F50_WORK/pids" ]; then
    if [ -s "$F50_ROOT/Scripts/Clash.Service" ] || [ -s "$F50_ROOT/Proxy/Clash.Core" ]; then
      mkdir -p "$F50_ROOT/Policy" && printf '%s\\n' 'maintenance' > "$F50_ROOT/Policy/stopped" || { echo F50_CLEAN_ERROR=stop_latch_failed; return 1; }
    fi
    f50_stop_recorded "$F50_WORK/pids" || return 1
  fi
  f50_scan "$F50_WORK/after.pids" || return 1
  [ ! -s "$F50_WORK/after.pids" ] || { echo F50_CLEAN_ERROR=process_respawned; return 1; }
  f50_network_snapshot "$F50_WORK/net" || return 1
  if [ -s "$F50_WORK/net/plan" ]; then
    clean_plan_rc=0
    f50_execute_plan "$F50_WORK/net/plan" || clean_plan_rc=$?
    f50_network_snapshot "$F50_WORK/check" || return 1
    [ ! -s "$F50_WORK/check/plan" ] || { echo F50_CLEAN_ERROR=network_rules_remain; return 1; }
    [ "$clean_plan_rc" = 0 ] || echo F50_CLEAN_WARNING=delete_error_final_network_clean
  fi
  echo F50_NETWORK_RELEASED=1
  # A failed native recovery may include journal/sysctl restoration beyond the firewall.
  for clean_journal in download.transaction.json rp-filter.json legacy-policy.json; do
      if [ -s "$F50_ROOT/Policy/$clean_journal" ]; then echo F50_CLEAN_ERROR=journal_restore_incomplete; return 1; fi
  done
  [ "$clean_recover" != failed ] || echo F50_CLEAN_WARNING=native_recovery_failed_fallback_verified
  echo F50_CLEAN_OK=1
}
`; }
function buildF50ArtifactHelpers() { return `f50_artifact_paths() {
  # Bounded plugin paths only. Never enumerate or remove the shared UFI uploads folder.
  for artifact in \\
    "$F50_ROOT" "$F50_ROOT".rollback-* "$F50_ROOT".rollback.* \\
    "$F50_ROOT".stage-* "$F50_ROOT".stage.* "$F50_ROOT".before_install.* \\
    "$F50_ROOT".before_repair.* "$F50_ROOT".failed_repair.* \\
    "$F50_DATA"/.f50-check.* "$F50_DATA"/.f50-clean.* "$F50_DATA"/.f50-delete.* \\
    "$F50_DATA"/.f50-verify.* "$F50_DATA"/.f50-install.* \\
    "$F50_DATA"/clash.install.lock "$F50_DATA"/clash.install.lock.d \\
    "$F50_DATA"/kano_tproxy_tools "$F50_DATA"/kano_yq_runtime /dev/kano_gist_sync \\
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
    "$F50_DATA"/kano_subscription_save_* "$F50_DATA"/kano_network_save_* "$F50_DATA"/kano_subscription_urls_before_template_* \\
    "$F50_DATA"/kano_config_package_[0-9]* "$F50_DATA"/kano_config_package_restore_* "$F50_DATA"/kano_compat_*.json \\
    "$F50_DATA"/kano_compat_bootstrap_* "$F50_DATA"/kano_install_unzip.log \\
    "$F50_DATA"/kano_uninstall_recover.log "$F50_DATA"/kano_uninstall_boot.log \\
    "$F50_DATA"/kano_uninstall_artifacts.log "$F50_DATA"/f50_boot_fix/clash_boot.sh; do
    [ "$artifact" != "$F50_WORK" ] || continue
    if [ -e "$artifact" ] || [ -L "$artifact" ]; then printf '%s\\n' "$artifact"; fi
  done
}
`; }
function buildF50InstallHelpers() { return `f50_root_has_data() {
  [ -d "$F50_ROOT" ] || return 1
  # A latch left by an old uninstaller is not an installation worth backing up.
  root_files=$(find "$F50_ROOT" \\( -type f -o -type l \\) ! -path "$F50_ROOT/Policy/stopped" -print 2>/dev/null)
  [ -n "$root_files" ]
}
`; }
function buildF50RemovalHelpers() { return `f50_runtime_guard() {
  f50_install_lock_idle || { echo F50_DELETE_BLOCKED=installation_active_or_invalid; return 1; }
  for guard_journal in download.transaction.json rp-filter.json legacy-policy.json; do
    [ ! -s "$F50_ROOT/Policy/$guard_journal" ] || { echo F50_DELETE_BLOCKED=unresolved_journal; return 1; }
  done
  f50_scan "$F50_WORK/guard.pids" || return 1
  f50_network_snapshot "$F50_WORK/guard.net" || return 1
  if [ -s "$F50_WORK/guard.pids" ]; then echo F50_DELETE_BLOCKED=owned_process_alive; return 1; fi
  if [ -s "$F50_WORK/guard.net/plan" ]; then echo F50_DELETE_BLOCKED=owned_network_active; return 1; fi
}
f50_remove_artifacts() {
  # Uninstall discards configuration backups only after the runtime guard has passed.
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
`; }
function buildF50FinalProbeHelpers() { return `f50_final_probe() {
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
`; }
function buildF50PanelHelpers() { return `${buildF50ZashboardValidationFunction()}${buildF50CurlLocator()}
f50_verify_zashboard_endpoint() {
  panel_probe=$(f50_validate_zashboard "$F50_ROOT/Proxy/WebUI/zashboard" 2>&1)
  panel_rc=$?
  printf '%s\n' "$panel_probe"
  if [ "$panel_rc" != 0 ]; then
    echo F50_ERROR=panel_disk_identity_mismatch
    return 1
  fi
  panel_tmp="$F50_DATA/kano_f50_panel_probe.$$"
  f50_find_curl || { echo F50_ERROR=panel_probe_curl_missing; return 1; }
  panel_curl=$F50_CURL_BIN
  panel_status=$("$panel_curl" -fsS --noproxy '*' --connect-timeout 3 --max-time 6 \
    -o "$panel_tmp" -w '%{http_code}' "http://127.0.0.1:${F50_PORTS.controller}/ui/?_f50=$$" 2>/dev/null)
  panel_rc=$?
  if [ "$panel_rc" != 0 ] || [ "$panel_status" != 200 ]; then
    rm -f "$panel_tmp" 2>/dev/null || true
    echo "F50_ERROR=panel_http_status_\${panel_status:-unavailable}"
    return 1
  fi
  if grep -Eiq '<title>[[:space:]]*metacubexd[[:space:]]*</title>' "$panel_tmp" 2>/dev/null \
      || ! grep -Eiq '<title>[[:space:]]*zashboard[[:space:]]*</title>' "$panel_tmp" 2>/dev/null; then
    rm -f "$panel_tmp" 2>/dev/null || true
    echo F50_ERROR=panel_http_identity_mismatch
    return 1
  fi
  rm -f "$panel_tmp" 2>/dev/null || true
  echo F50_PANEL_HTTP_STATUS=200
  return 0
}
f50_ensure_live_secret() {
  live_cfg="$F50_ROOT/Proxy/config.yaml"
  live_yq="$F50_ROOT/Tools/yq_linux_arm64"
  [ -s "$live_cfg" ] && [ -x "$live_yq" ] || return 0
  live_secret=$(f50_limit 5 "$live_yq" e -r '.secret // ""' "$live_cfg" 2>/dev/null)
  live_rc=$?
  [ "$live_rc" = 0 ] || return 0
  case "$live_secret" in ''|*[![:space:]]*) : ;; *) live_secret= ;; esac
  [ -n "$live_secret" ] && return 0
  export F50_FIXED_SECRET=${shellQuote(F50_DEFAULT_SECRET)}
  f50_update_yaml "$live_cfg" "$live_yq" '.secret = strenv(F50_FIXED_SECRET)' 5
  live_rc=$?
  unset F50_FIXED_SECRET
  [ "$live_rc" = 0 ] || return 1
  chmod 600 "$live_cfg" 2>/dev/null || true
}
f50_update_yaml() {
  update_cfg=$1; update_yq=$2; update_expr=$3; update_budget=$4
  update_tmp="$update_cfg.kano_update.$$"
  if ! f50_limit "$update_budget" "$update_yq" e "$update_expr" "$update_cfg" > "$update_tmp" \
      || ! f50_limit 5 "$update_yq" e -e 'tag == "!!map"' "$update_tmp" >/dev/null 2>&1 \
      || ! chmod 600 "$update_tmp" || ! mv -f "$update_tmp" "$update_cfg"; then
    rm -f "$update_tmp" 2>/dev/null || true
    return 1
  fi
}
f50_update_panel_config() {
  panel_cfg=$1; panel_yq=$2
  export F50_PANEL_DIR=${shellQuote('WebUI/zashboard')}
  export F50_PANEL_URL=${shellQuote(F50_ZASHBOARD_UI_URL)}
  panel_check=${shellQuote(buildF50PanelConfigCheck())}
  if f50_limit 5 "$panel_yq" e -e "$panel_check" "$panel_cfg" >/dev/null 2>&1; then
    panel_rc=0
  else
    f50_update_yaml "$panel_cfg" "$panel_yq" '."external-ui" = strenv(F50_PANEL_DIR) | ."external-ui-url" = strenv(F50_PANEL_URL) | del(."external-ui-name") | (select(strenv(F50_CONFIG_SOURCE) == "subscription_original"), (select(strenv(F50_CONFIG_SOURCE) != "subscription_original") | (select(has("unified-delay")), (select(has("unified-delay") | not) | ."unified-delay" = true))))' 8
    panel_rc=$?
  fi
  unset F50_PANEL_DIR F50_PANEL_URL
  return "$panel_rc"
}
f50_ensure_live_panel_config() {
  live_cfg="$F50_ROOT/Proxy/config.yaml"
  live_yq="$F50_ROOT/Tools/yq_linux_arm64"
  [ -s "$live_cfg" ] && [ -x "$live_yq" ] || return 1
  export F50_CONFIG_SOURCE=$(sed -n 's/^KANO_CONFIG_SOURCE=//p' "$F50_ROOT/Tools/config_source.conf" 2>/dev/null | head -n 1)
  f50_update_panel_config "$live_cfg" "$live_yq"
  live_rc=$?
  unset F50_CONFIG_SOURCE
  [ "$live_rc" = 0 ] || return 1
  chmod 600 "$live_cfg" 2>/dev/null || true
}
`; }
function buildF50StartHelpers() { return `f50_patch_service() {
  ${buildF50OriginalServicePatchScript('"$1"')}
}
f50_start_service() {
  service_output=$(
  start_action=$1; start_budget=$2
  case "$start_action" in start|restart) ;; *) echo F50_ERROR=invalid_start_action; return 2 ;; esac
  if ! f50_patch_service "$F50_ROOT/Scripts/Clash.Service"; then
    echo F50_ERROR=service_patch_failed
    echo F50_START_CODE=service_patch_failed
    echo F50_START_OK=0
    return 1
  fi
  if ! f50_ensure_live_secret; then
    F50_START_RC=1; F50_START_DETAIL=F50_ERROR=secret_ensure_failed
    F50_START_CODE=secret_ensure_failed; F50_START_OK=0
    printf '%s\n' "$F50_START_DETAIL"
    printf 'START_SERVICE_RC=%s\nF50_START_CODE=%s\nF50_START_OK=%s\n' "$F50_START_RC" "$F50_START_CODE" "$F50_START_OK"
    return 1
  fi
  if ! f50_ensure_live_panel_config; then
    F50_START_RC=1; F50_START_DETAIL=F50_ERROR=panel_config_write_failed
    F50_START_CODE=panel_config_write_failed; F50_START_OK=0
    printf '%s\n' "$F50_START_DETAIL"
    printf 'START_SERVICE_RC=%s\nF50_START_CODE=%s\nF50_START_OK=%s\n' "$F50_START_RC" "$F50_START_CODE" "$F50_START_OK"
    return 1
  fi
  start_log="$F50_DATA/kano_clash_start.log"
  log_before=$(cksum "$start_log" 2>/dev/null)
  f50_disable_unsupported_ipv6_dns_hijack || return 1
  f50_drop_detached_tun_rules "$start_action" || return 1
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
    *'subscription URL must be HTTPS without userinfo'*|*'subscription URL must use HTTP(S), no userinfo'*|*'empty provider URL'*) F50_START_CODE=invalid_subscription ;;
    panel_config_reload_failed:*|curl_executable_unavailable) F50_START_CODE=service_finalize_failed ;;
    *original_config_invalid*|*CONFIG_TEST_FAILED*|*'configuration is not a YAML mapping'*|*'yq parse failed'*|*'rules must be a list'*) F50_START_CODE=invalid_config ;;
    *iptables*|*ip6tables*|*policy*|*route*|*downstream*|*network*|*TUN*|*listener*) F50_START_CODE=network_apply_failed ;;
    *) case "$F50_START_RC" in 124|137) F50_START_CODE=start_timeout ;; esac ;;
  esac
  if [ "$F50_START_RC" = 0 ] && [ -z "$start_cause" ]; then
    case "$F50_START_DETAIL" in
      *START_STATE=started_verified_process*) F50_START_OK=1; F50_START_CODE=started ;;
      *) F50_START_CODE=activation_unverified ;;
    esac
  fi
  case "$F50_START_DETAIL" in *START_STATE=started_verified_process*)
    echo F50_HEALTH_CORE=controller_confirmed
    [ "$F50_START_CODE" != service_finalize_failed ] || { echo F50_HEALTH_API=unverified; echo F50_HEALTH_PANEL_RELOAD=failed; echo F50_SERVICE_FINALIZED=0; }
    ;; esac
  if [ "$F50_START_OK" = 1 ]; then
    echo F50_SERVICE_FINALIZED=1
    panel_check_output=$(f50_verify_zashboard_endpoint 2>&1); panel_check_rc=$?
    if [ "$panel_check_rc" = 0 ]; then
      printf '%s\\n' "$panel_check_output"
      echo F50_HEALTH_PANEL=ok
    else
      printf '%s\\n' "$panel_check_output" | sed 's/^F50_ERROR=/F50_WARNING=/'
      echo F50_HEALTH_PANEL=failed
    fi
    echo F50_HEALTH_CORE=controller_confirmed
    echo F50_HEALTH_TAKEOVER=controller_reported
    echo F50_HEALTH_API=unverified
    echo F50_HEALTH_PROVIDERS=unverified
    echo F50_HEALTH_CONNECTIVITY=unverified
  fi
  printf '%s\\n' "$F50_START_DETAIL"
  printf 'START_SERVICE_RC=%s\\nF50_START_CODE=%s\\nF50_START_OK=%s\\n' "$F50_START_RC" "$F50_START_CODE" "$F50_START_OK"
  [ "$F50_START_OK" = 1 ]
  )
  service_output_rc=$?
  service_output=$(printf '%s\\n' "$service_output" | f50_redact)
  # Command substitution isolates assignments; restore only anchored, validated final markers.
  service_status=$(printf '%s\\n' "$service_output" | awk -v rc="$service_output_rc" '
    BEGIN {code="service_failed";ok=0}
    /^F50_START_CODE=[A-Za-z0-9_]+$/ {code=substr($0,16)}
    /^F50_START_OK=[01]$/ {ok=substr($0,14)}
    /^START_SERVICE_RC=[0-9]+$/ {rc=substr($0,18)}
    END {printf "%s:%s:%s\\n",code,ok,rc}')
  IFS=: read -r F50_START_CODE F50_START_OK F50_START_RC <<EOF_F50_START_STATUS
$service_status
EOF_F50_START_STATUS
  START_SERVICE_RC=$F50_START_RC
  F50_START_DETAIL=$service_output
  (umask 077; printf '%s\\n' "$service_output" > "$F50_DATA/kano_clash_start.log" && chmod 600 "$F50_DATA/kano_clash_start.log") || echo F50_START_LOG_WRITE_FAILED=1
  printf '%s\\n' "$service_output"
  return "$service_output_rc"
}
`; }
function buildF50InspectScript() {
  return buildF50MaintenanceFunctions('inspect') + `
F50_WORK=$(mktemp -d "$F50_DATA/.f50-check.XXXXXX") || exit 1
trap 'rm -rf "$F50_WORK"' EXIT
f50_inspect
`;
}
function buildF50InstallScript(uploaded) {
  return buildF50MaintenanceFunctions('install') + '\nZIP=' + shellQuote(uploaded) + '\n' + `# The transaction owns staging, backup, activation and rollback until a terminal result.
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
      if f50_restore_previous; then :; else finish_rc=1; KEEP_WORK=1; fi
    fi
    [ -z "$BACKUP" ] || printf 'F50_RECOVERY_BACKUP=%s\\n' "$BACKUP"
    finish_rc=1
  fi
  # Release only our known lock entry; unknown files keep the lock and recovery marker for review.
  if [ "$LOCKED" = 1 ]; then
    if ! rm -f "$LOCK/pid" || ! rmdir "$LOCK" || [ -e "$LOCK" ] || [ -L "$LOCK" ]; then
      echo F50_INSTALL_WARNING=lock_cleanup_failed
      printf 'F50_RECOVERY_LOCK=%s\n' "$LOCK"
      [ "$finish_rc" != 0 ] || finish_rc=1
      KEEP_WORK=1
    fi
  fi
  if [ "$KEEP_WORK" = 0 ]; then
    if ! rm -rf "$F50_WORK" || [ -e "$F50_WORK" ] || [ -L "$F50_WORK" ]; then
      echo F50_INSTALL_WARNING=staging_cleanup_failed
      [ "$finish_rc" != 0 ] || finish_rc=1
      KEEP_WORK=1
    fi
  fi
  [ "$KEEP_WORK" = 0 ] || printf 'F50_RECOVERY_WORK=%s\n' "$F50_WORK"
  if [ "$SUCCESS" = 1 ]; then
    printf 'F50_INSTALL_COMPONENTS_OK=1\nF50_INSTALL_STATUS=%s\nF50_CONFIG_STATE=%s\n' "$status" "$NEEDS_CONFIG"
    [ -z "$BACKUP" ] || printf 'F50_BACKUP_LEFT=%s\n' "$BACKUP"
    if [ "$finish_rc" = 0 ]; then
      printf 'F50_INSTALL_TRANSACTION_STATE=complete\nKANO_INSTALL_OK=1\n'
    else
      printf 'F50_INSTALL_CODE=%s\nF50_INSTALL_TRANSACTION_STATE=finalize_failed\nKANO_INSTALL_OK=0\n' "\${F50_INSTALL_CODE:-finalization_failed}"
    fi
  else
    printf 'F50_INSTALL_COMPONENTS_OK=0\nF50_INSTALL_TRANSACTION_STATE=failed\nKANO_INSTALL_OK=0\n'
  fi
  exit "$finish_rc"
}
trap f50_install_finish EXIT
: > "$F50_WORK/install.journal" || { F50_INSTALL_CODE=journal_write_failed; exit 1; }
trap 'F50_INSTALL_CODE=interrupted; exit 130' HUP INT TERM
if ! mkdir "$LOCK" 2>/dev/null; then f50_install_fail installation_busy; exit 1; fi
LOCKED=1
export F50_INSTALL_TRANSACTION="$F50_WORK"
printf '%s\\n' "$$" > "$LOCK/pid" || { f50_install_fail lock_write_failed; exit 1; }
[ ! -L "$F50_ROOT" ] || { f50_install_fail target_symlink; exit 1; }
${rotateClashLogCmd()}${dataSpaceGuardCmd('f50_install_fail data_space_low; exit 1')}
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
archive_listing=$(unzip -l "$ZIP" 2>/dev/null)
archive_bytes=$(printf '%s\\n' "$archive_listing" | awk '$1 ~ /^[0-9]+$/ && $NF ~ /^files?$/ && NF <= 4 {n=$1} END {print n}')
case "$archive_bytes" in ''|*[!0-9]*) f50_install_fail archive_size_unknown; exit 1 ;; esac
required_kb=$(( (archive_bytes + 1023) / 1024 + 51200 ))
case "$names" in *Proxy/Clash.Core*) ;; *)
  if [ -d "$F50_ROOT" ]; then
    old_kb=$(du -sk "$F50_ROOT" 2>/dev/null | awk '{print $1}')
    case "$old_kb" in ''|*[!0-9]*) f50_install_fail data_size_unknown; exit 1 ;; esac
    required_kb=$((required_kb + old_kb))
  fi ;;
esac
avail_kb=$(df -k "$F50_DATA" 2>/dev/null | awk 'NR==2{print $4}')
case "$avail_kb" in ''|*[!0-9]*) f50_install_fail data_space_unknown; exit 1 ;; esac
[ "$avail_kb" -ge "$required_kb" ] || { f50_install_fail data_space_insufficient_for_archive; exit 1; }
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
# A legacy component package may omit optional files already installed.
for grel in Tools/age Tools/kano-gist-sync Tools/age.LICENSE Tools/gist-sync-component.json Scripts/Clash.GistSync Scripts/Clash.ConfigCommit; do
  if [ ! -e "$PKG/$grel" ] && [ -f "$F50_ROOT/$grel" ]; then
    cp -p "$F50_ROOT/$grel" "$PKG/$grel" || { f50_install_fail gist_preserve_failed; exit 1; }
  fi
done

for file in "$PKG"/Scripts/* "$PKG"/Tools/kano-f50-helper* "$PKG"/Tools/kano-gist-sync "$PKG"/Tools/age "$PKG"/Tools/yq_linux_arm64 "$PKG"/Tools/mosdns_arm64 "$PKG"/Proxy/Clash.Core; do
  [ ! -f "$file" ] || chmod 755 "$file" || { f50_install_fail executable_permission_failed; exit 1; }
done
${buildF50HttpSubscriptionPatchScript('"$PKG"')} || { f50_install_fail controller_http_patch_failed; exit 1; }
probe=$(CLASH_ROOT="$PKG" f50_limit 5 "$PKG/Scripts/clashctl_arm64" version 2>&1); probe_rc=$?
[ "$probe_rc" = 0 ] || { f50_install_fail controller_not_executable "$probe"; exit 1; }
case "$probe" in *F50_CONTROLLER=?*) ;; *) f50_install_fail controller_protocol_mismatch; exit 1 ;; esac
probe=$(f50_limit 5 "$PKG/Proxy/Clash.Core" -v 2>&1); probe_rc=$?
[ "$probe_rc" = 0 ] || { f50_install_fail core_not_executable "$probe"; exit 1; }
f50_patch_service "$PKG/Scripts/Clash.Service" || { f50_install_fail service_patch_failed; exit 1; }
sh -n "$PKG/Scripts/Clash.Service" || { f50_install_fail service_script_invalid; exit 1; }
probe=$(CLASH_ROOT="$PKG" f50_limit 5 sh "$PKG/Scripts/Clash.Service" version 2>&1); probe_rc=$?
[ "$probe_rc" = 0 ] || { f50_install_fail service_script_failed "$probe"; exit 1; }
case "$probe" in *F50_CONTROLLER=?*) ;; *) f50_install_fail service_protocol_mismatch; exit 1 ;; esac
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
for rel in Tools/gist-sync Proxy/config.yaml Proxy/subscription_urls.txt Proxy/cache.db Proxy/rules Proxy/rule-providers Proxy/proxies Proxy/mac_bypass.txt Proxy/Policy Tools/template.yaml Tools/template.base.yaml Tools/override.js Tools/rule_override.json Tools/rule_override_applied.json Tools/sub_rule_mode.conf Tools/sub_user_agent.conf Tools/config_source.conf Policy/options.conf Policy/device_bypass.txt Policy/direct_domain.list Policy/direct_ip.list Policy/proxy_domain.list Policy/reject_domain.list; do
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
# Work files and queued uploads are not durable settings and must not migrate.
if [ -d "$PKG/Tools/gist-sync" ]; then
  for transient in work jobs yq-runtime; do
    [ ! -L "$PKG/Tools/gist-sync/$transient" ] && rm -rf "$PKG/Tools/gist-sync/$transient" || { f50_install_fail gist_transient_cleanup_failed; return 1; }
  done
fi
}
f50_preserve_user_data || exit 1

YQ="$PKG/Tools/yq_linux_arm64"
CFG="$PKG/Proxy/config.yaml"
[ -s "$CFG" ] || { f50_install_fail configuration_missing; exit 1; }
probe=$(f50_limit 5 "$YQ" --version 2>&1); probe_rc=$?
[ "$probe_rc" = 0 ] || { f50_install_fail yaml_parser_not_executable; exit 1; }
f50_ensure_install_secret() {
  f50_install_secret=$(f50_limit 5 "$YQ" e -r '.secret // ""' "$CFG" 2>/dev/null)
  f50_secret_read_rc=$?
  if [ "$f50_secret_read_rc" != 0 ]; then
    [ "$HAD_USER_CONFIG" = 1 ] && return 0
    f50_install_fail config_probe_failed
    return 1
  fi
  case "$f50_install_secret" in ''|*[![:space:]]*) : ;; *) f50_install_secret= ;; esac
  if [ -z "$f50_install_secret" ]; then
    export F50_FIXED_SECRET=${shellQuote(F50_DEFAULT_SECRET)}
    f50_secret_write_err=$(f50_update_yaml "$CFG" "$YQ" '.secret = strenv(F50_FIXED_SECRET)' 5 2>&1)
    f50_secret_write_rc=$?
    unset F50_FIXED_SECRET
    [ "$f50_secret_write_rc" = 0 ] || { f50_install_fail secret_write_failed "$f50_secret_write_err"; return 1; }
    chmod 600 "$CFG" || { f50_install_fail secret_write_failed; return 1; }
  fi
}
f50_ensure_install_secret || exit 1
f50_ensure_install_dashboard() {
  export F50_CONFIG_SOURCE=$(sed -n 's/^KANO_CONFIG_SOURCE=//p' "$PKG/Tools/config_source.conf" 2>/dev/null | head -n 1)
  f50_panel_write_err=$(f50_update_panel_config "$CFG" "$YQ" 2>&1)
  f50_panel_write_rc=$?
  unset F50_CONFIG_SOURCE
  [ "$f50_panel_write_rc" = 0 ] || { f50_install_fail panel_config_write_failed "$f50_panel_write_err"; return 1; }
  chmod 600 "$CFG" || { f50_install_fail panel_config_write_failed; return 1; }
}
f50_ensure_install_dashboard || exit 1
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
        http://*|https://*) authority=\${url#*://}; authority=\${authority%%[/?#]*}
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
# URL syntax is preflighted here; the Controller performs the final validation.
case "$NEEDS_CONFIG" in invalid_config|invalid_subscription)
  if [ "$HAD_USER_CONFIG" = 0 ] || [ "$OLD_RUNNING" = 1 ]; then f50_install_fail "$NEEDS_CONFIG"; exit 1; fi ;;
esac
if [ "$F50_OLD_FOUND" = 1 ]; then
  CLEAN_ATTEMPTED=1
  f50_clean_environment || { f50_install_fail old_environment_cleanup_failed; exit 1; }
  # Native recovery may repair both the config and cached providers from a prior transaction.
  f50_preserve_user_data || exit 1
  f50_ensure_install_secret || exit 1
  f50_ensure_install_dashboard || exit 1
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
if [ "$HAD_OLD:$OLD_LATCH:$OLD_RUNNING" = 1:1:0 ]; then
  status=installed_stopped
elif [ "$NEEDS_CONFIG" != ready ]; then
  status=installed_needs_configuration
elif f50_start_service start 85; then
  status=installed_running
else
  f50_install_fail "$F50_START_CODE" "$F50_START_DETAIL"
  exit 1
fi
# Restore scheduling only for an existing enabled Gist configuration.
if [ -x "$F50_ROOT/Tools/kano-gist-sync" ] && [ -s "$F50_ROOT/Tools/gist-sync/settings.conf" ] &&
   "$F50_ROOT/Tools/yq_linux_arm64" e -p=json -e '.auto == true' "$F50_ROOT/Tools/gist-sync/settings.conf" >/dev/null 2>&1; then
  CLASH_ROOT="$F50_ROOT" f50_limit 8 "$F50_ROOT/Tools/kano-gist-sync" start-daemon >/dev/null 2>&1 || echo F50_INSTALL_WARNING=gist_scheduler_resume_failed
fi
# Component completion is independent of recovery-marker and lock cleanup.
SUCCESS=1
# Do not retain age identities in ordinary component rollback folders.
if [ -n "$BACKUP" ] && [ -d "$BACKUP/Tools/gist-sync" ]; then
  [ ! -L "$BACKUP/Tools/gist-sync" ] && rm -rf "$BACKUP/Tools/gist-sync" || { KEEP_WORK=1; f50_install_fail gist_backup_cleanup_failed; exit 1; }
fi
if [ -n "$BACKUP" ]; then
  echo F50_INSTALL_WARNING=previous_components_retained
fi
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
    operationStage(hasOld ? '清理旧环境并安装组件' : '解压、校验并安装组件');
    const result = await runShellWithRoot(buildF50InstallScript(uploaded), 150000);
    const output = String(result?.content || '');
    if (/^F50_INSTALL_COMPONENTS_OK=1$/m.test(output)) {
      pluginArtifactsRemoved = false; f50BackendReady = false;
      invalidateStatusSnapshot(); invalidateBinarySnapshot(); runtimePreflightCache = null;
    }
    if (!result?.success || result.deviceCompleted !== true || result.deviceExitCode !== 0 ||
        !/^F50_INSTALL_COMPONENTS_OK=1$/m.test(output) || !/^F50_INSTALL_TRANSACTION_STATE=complete$/m.test(output) ||
        !/^KANO_INSTALL_OK=1$/m.test(output) || /^KANO_INSTALL_OK=0$|^F50_INSTALL_TRANSACTION_STATE=(?:failed|finalize_failed)$/m.test(output)) {
      throw new Error(output || 'F50_INSTALL_CODE=transaction_interrupted');
    }
    const state = (output.match(/^F50_INSTALL_STATUS=(.+)$/m) || [])[1];
    const configState = (output.match(/^F50_CONFIG_STATE=(.+)$/m) || [])[1];
    let message = state === 'installed_running' ? '组件已安装并启动，网络接管规则已生效'
      : state === 'installed_stopped' ? '组件已更新；核心保持停止，接管规则未下发'
      : configState === 'invalid_subscription' ? '组件已安装，但订阅地址无效；请填写不含账号信息的 HTTP 或 HTTPS 订阅地址后启动'
      : configState === 'invalid_config' ? '组件已安装，但原配置格式有误；请修正后启动'
      : '组件已安装；尚未配置订阅，核心未启动';
    const warning = (output.match(/^F50_INSTALL_WARNING=(.+)$/m) || [])[1];
    const recoveredWithFallback = /^F50_CLEAN_WARNING=/m.test(output);
    if (recoveredWithFallback) message += '；旧环境恢复曾报错，已通过兜底清理复查';
    if (warning) message += warning === 'previous_components_retained' ? '；旧组件回滚目录已保留' : '；安装告警：' + warning;
    lastInstallDiagnostic = {...f50Diagnostic(output), summary: message, ok: true};
    operationFinish(true, message);
    createToast(safeTextToHtml(message), warning || recoveredWithFallback ? 'yellow' : 'green', 9000);
    return true;
  } catch (error) {
    if (error?.name === 'OperationCancelled') return false;
    lastInstallDiagnostic = f50Diagnostic(error?.message || String(error), '安装失败：未获取到具体原因');
    operationFinish(false, lastInstallDiagnostic.summary);
    createToast(safeTextToHtml(lastInstallDiagnostic.summary) + '<br>详细进度与错误原因见“状态与日志”。', 'red', 15000);
    return false;
  }
}

async function ensureF50InstallLease() {
  const ready = deviceTaskUncertain ? { success: false, content: 'F50_OPERATION_BUSY', deviceCompleted: false }
    : await runShellWithRoot(':', 5000);
  const op = activeCriticalOperation;
  if (!/^F50_OPERATION_BUSY$/m.test(String(ready.content || '')) || !op || op.leaseOwned || op.uncertain || op.token.cancelled || op.requests) return ready;
  let recovered;
  try {
    recovered = f50ShellReply(await hostRunShellWithRoot.call(globalThis, buildF50EmergencyScript('', true, true, false), 120000));
  } catch (error) { throw f50UnknownCompletion(op, error?.message || String(error)); }
  if (!(recovered.success && /^F50_LEASE_RELEASED=1$/m.test(String(recovered.content || '')))) {
    return { ...ready, content: ready.content + '\n' + String(recovered.content || '') };
  }
  if (op !== activeCriticalOperation || op.token.cancelled) throw operationCancelled();
  op.leasePromise = null;
  deviceTaskUncertain = false;
  return runShellWithRoot(':', 5000);
}

async function installF50PackageFromNetwork() {
  return runCriticalOperation('安装核心', async () => {
    lastInstallDiagnostic = null;
    operationStage('下载组件包');
    const ready = await ensureF50InstallLease();
    if (!ready.success) {
      lastInstallDiagnostic = f50Diagnostic(ready.content);
      operationFinish(false, lastInstallDiagnostic.summary);
      createToast(safeTextToHtml(lastInstallDiagnostic.summary), 'red', 15000);
      return false;
    }
    const archive = await downloadCoreArchive({ allowCached: false });
    if (!archive.ok) {
      const detail = archive.content || archive.message || '组件包下载失败';
      lastInstallDiagnostic = f50Diagnostic(detail);
      operationFinish(false, '组件包下载失败');
      // toast 显示人话摘要；完整各源日志保留在诊断详情（“状态与日志”）里。
      createToast('组件包下载失败<br>' + safeTextToHtml(lastInstallDiagnostic.summary || detail), 'red', 15000);
      return false;
    }
    try { return await installF50PackageAtDevicePath(DOWNLOAD_ZIP); }
    finally {
      const removed = await runShellWithRoot('rm -f ' + shellQuote(DOWNLOAD_ZIP) + ' ' + shellQuote(DOWNLOAD_LOG) + ' ' + shellQuote(DOWNLOAD_SOURCE_FILE), 5000)
        .catch(error => ({success:false, content:f50Diagnostic(error?.message || String(error)).details}));
      if (!removed?.success && lastInstallDiagnostic) lastInstallDiagnostic.details += '\nF50_INSTALL_WARNING=download_cache_cleanup_failed';
    }
  }, null, true);
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
        lastInstallDiagnostic = null;
        let uploaded = '';
        try {
          const ready = await ensureF50InstallLease();
          if (!ready.success) throw new Error(ready.content);
          operationStage('上传组件包');
          uploaded = await uploadFileToDevice(file);
          return await installF50PackageAtDevicePath(uploaded);
        } catch (error) {
          lastInstallDiagnostic = f50Diagnostic(error && (error.message || String(error)));
          const message = lastInstallDiagnostic.summary;
          operationFinish(false, message);
          createToast('安装失败<br>' + safeTextToHtml(message), 'red', 15000);
          return false;
        } finally {
          if (uploaded) {
            try {
              const removed = await runShellWithRoot('rm -f ' + shellQuote(uploaded), 5000);
              if (!removed?.success) throw new Error('uploaded_package_cleanup_failed');
            } catch (cleanupError) {
              if (cleanupError?.name !== 'OperationCancelled') {
                if (lastInstallDiagnostic) lastInstallDiagnostic.details += '\nF50_INSTALL_WARNING=uploaded_package_cleanup_failed';
                createToast('临时上传文件删除失败；安装结果未受影响。', 'yellow', 7000);
              }
            }
          }
        }
      }, null, true);
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
    if (values.length > 64) throw new Error('私网网段最多可配置 64 个');
    const cidrs = compact(values);
    for (const n of cidrs) if (!PRIVATE.some((p) => contains(cidr(p), cidr(n)))) {
      throw new Error('仅支持 IPv4 私网网段（RFC1918）或 IPv6 ULA 网段（fc00::/7）：' + n);
    }
    const policy = String(input.policy || '').trim();
    if (/[,\r\n\x00-\x1f\x7f]/.test(policy)) throw new Error('代理组名称包含不支持的字符');
    if (enabled && (!cidrs.length || !policy)) throw new Error('启用前请填写目标网段并选择代理出站');
    if (enabled && ['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE', 'GLOBAL'].includes(policy.toUpperCase())) throw new Error('不能选择内置策略：' + policy);
    return { enabled, cidrs, policy };
  }
  function fromOptions(o = {}) {
    return normalize({ enabled: o.private_route_enabled, cidrs: o.private_route_cidrs || '', policy: o.private_route_policy || '' });
  }
  function checkConnected(state, connected) {
    for (const t of state.cidrs.map(cidr)) for (const item of connected) {
      const local = cidr(typeof item === 'string' ? item : item.cidr);
      if (overlaps(t, local)) throw new Error('远端网段 ' + t.text + ' 与 F50 直连网段 ' + local.text + ' 重叠');
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
  function transform(out, state, mode, connected) {
    if (!state.enabled || mode === 'off') return out;
    checkConnected(state, connected);
    if (String(out.mode || 'rule').toLowerCase() !== 'rule') throw new Error('私网定向代理仅在 Mihomo 规则模式下可用');
    if (state.cidrs.some((n) => cidr(n).family === 6) && out.ipv6 !== true) throw new Error('目标网段包含 IPv6；请先启用 IPv6 接管');
    const groups = out['proxy-groups'] || [], proxies = out.proxies || [];
    const target = [...groups, ...proxies].find((p) => p && p.name === state.policy);
    if (!target) throw new Error('配置中不存在该出站：' + state.policy);
    if (['direct', 'reject', 'reject-drop', 'pass'].includes(String(target.type || '').toLowerCase())) throw new Error('所选出站不是代理类型');
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
      const excluded = [...PRIVATE, ...list(tun, 'route-exclude-address'),
        ...list(tun, 'inet4-route-exclude-address'), ...list(tun, 'inet6-route-exclude-address')];
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
  const mergePlain = (base, delta) => {
    const out = clone(base || {});
    for (const [key, value] of Object.entries(delta || {})) out[key] = clone(value);
    return out;
  };
  // dns/tun 按子键合并：受控子键取 profile，其余保留用户值；用户未写的键仍由 profile 补齐。
  function mergeDnsValue(profileDns, userDns) {
    if (!userDns || typeof userDns !== 'object' || Array.isArray(userDns)) return clone(profileDns);
    const merged = mergePlain(profileDns, userDns);
    for (const key of CONTROLLED_DNS_KEYS) merged[key] = clone(profileDns[key]);
    return merged;
  }
  function mergeTunValue(profileTun, userTun) {
    if (!userTun || typeof userTun !== 'object' || Array.isArray(userTun)) return clone(profileTun);
    const merged = mergePlain(profileTun, userTun);
    for (const key of CONTROLLED_TUN_KEYS) {
      if (own(profileTun, key)) merged[key] = clone(profileTun[key]);
      else delete merged[key];
    }
    if (own(userTun, 'mtu')) {
      const mtu = Number(userTun.mtu);
      if (!Number.isInteger(mtu) || mtu < 1280 || mtu > 65535) throw new Error('tun.mtu 需为 1280~65535 的整数');
      merged.mtu = mtu;
    }
    return merged;
  }
  // 本地代理端口可自由指定，但不能互相重复或占用受管端口。
  function checkLocalPorts(out, profile) {
    const ports = ['port', 'socks-port', 'mixed-port']
      .map((key) => Number(out[key])).filter((port) => Number.isInteger(port) && port > 0);
    const reserved = new Set([
      Number(profile['tproxy-port']) || 0,
      Number(String((profile.dns || {}).listen || '').split(':').pop()) || 0,
      Number(String(profile['external-controller'] || '').split(':').pop()) || 0,
    ].filter(Boolean));
    if (new Set(ports).size !== ports.length) throw new Error('port、socks-port、mixed-port 不能重复');
    for (const port of ports) {
      if (reserved.has(port)) throw new Error('本地代理端口与受管端口冲突：' + port);
    }
  }

  function runtime(config, options = {}, connected = [], preserveConfig = false, feature = fromOptions(options)) {
  const source = strip(config);
  const mode = options.traffic_mode || 'tproxy';
  if (!['tproxy', 'tun', 'off'].includes(mode)) throw new Error('Invalid traffic mode');
  const profile = F50_FIXED_PROFILES[mode + (options.ipv6 === 'on' ? '6' : '4')];
    const out = clone(preserveConfig ? source : profile);
    if (preserveConfig) {
      for (const key of Object.keys(source)) {
        if (key.startsWith('x-') && !own(out, key)) out[key] = clone(source[key]);
      }
      for (const key of F50_ORIGINAL_MANAGED_KEYS) out[key] = clone(profile[key]);
      out.dns = clone(source.dns || profile.dns);
      out.tun = clone(source.tun || {});
      if (!f50IsPlainObject(out.dns) || !f50IsPlainObject(out.tun)) throw new Error('dns and tun must be mappings');
      for (const key of F50_ORIGINAL_DNS_KEYS) out.dns[key] = clone(profile.dns[key]);
      for (const key of F50_ORIGINAL_TUN_KEYS) {
        if (own(profile.tun, key)) out.tun[key] = clone(profile.tun[key]);
        else delete out.tun[key];
      }
      for (const key of ['external-controller-tls', 'external-controller-unix', 'external-controller-pipe', 'external-ui-name', 'interface-name', 'routing-mark']) delete out[key];
    } else {
      // 固定 profile 打底，用户显式写入的非受控键全部保留；
      // 缺失的键仍由 profile 补齐，因此默认行为与之前一致。
      for (const key of Object.keys(source)) {
        if (key === META) continue;
        if (key === 'dns') { out.dns = mergeDnsValue(out.dns, source.dns); continue; }
        if (key === 'tun') { out.tun = mergeTunValue(out.tun, source.tun); continue; }
        if (key === 'sniffer' || key === 'profile') { out[key] = mergePlain(out[key], source[key]); continue; }
        if (CONTROLLED_TOP_KEYS.includes(key) || key === 'external-ui-name') continue;
        out[key] = clone(source[key]);
      }
      checkLocalPorts(out, profile);
    }
  if (mode === 'tun') out.tun.stack = f50TunStack(options);
  if (own(out,'proxies') && !Array.isArray(out.proxies)) throw new Error('proxies must be a list');
  if (!own(out,'proxies')) out.proxies = [];
  if (own(out,'proxy-groups') && !Array.isArray(out['proxy-groups'])) throw new Error('proxy-groups must be a list');
  if (!own(out,'proxy-groups')) out['proxy-groups'] = [];
  if (own(out,'rules') && !Array.isArray(out.rules)) throw new Error('rules must be a list');
  if (!own(out,'rules')) out.rules = ['MATCH,DIRECT'];
  for (const key of ['proxies','proxy-groups']) for(const node of out[key]) {
    if(node && typeof node==='object'){delete node['interface-name'];delete node['routing-mark'];}
  }
  for(const key of ['proxy-providers','rule-providers']) for(const provider of Object.values(out[key]||{})) {
    if(provider && typeof provider==='object'){
      if(provider.override){delete provider.override['interface-name'];delete provider.override['routing-mark'];}
      if(!preserveConfig && key==='rule-providers' && provider.type==='http')provider.proxy='DIRECT';
    }
  }
  for (const name of ['cn_domain', 'private_domain', 'add_direct_domain']) {
    if (!preserveConfig && out['rule-providers']?.[name]?.behavior === 'domain') {
      out.dns['nameserver-policy'] = out.dns['nameserver-policy'] || {};
      // 用户自建的同名策略优先，这里只补缺失项。
      if (!own(out.dns['nameserver-policy'], 'rule-set:' + name)) {
        out.dns['nameserver-policy']['rule-set:' + name] = ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'];
      }
    }
  }
  out['x-f50-profile'] = '8.0.0-compat.2.3';
  // 记录被强制纠正的用户设置，供界面提示；Mihomo 忽略 x- 前缀键。
  const overridden = [];
  for (const key of CONTROLLED_TOP_KEYS) {
    if (own(source, key) && !equal(source[key], out[key])) overridden.push(key);
  }
  for (const key of CONTROLLED_DNS_KEYS) {
    if (own(source.dns || {}, key) && !equal(source.dns[key], out.dns[key])) overridden.push('dns.' + key);
  }
  for (const key of CONTROLLED_TUN_KEYS) {
    if (own(source.tun || {}, key) && !equal(source.tun[key], (out.tun || {})[key])) overridden.push('tun.' + key);
  }
  if (overridden.length) out['x-f50-overridden'] = overridden;
  else if (own(out, 'x-f50-overridden')) delete out['x-f50-overridden'];
  // Kernel routing belongs to clashctl; TUN still needs its matching route exclusions.
  if (!feature.enabled || mode === 'off') return out;
  return transform(out, feature, mode, connected);
}
  function resolveSelection(proxies, name) {
    const visited = new Set();
    let current = name;
    while (true) {
      if (visited.has(current)) throw new Error('Proxy group cycle: ' + current);
      visited.add(current);
      if (['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE'].includes(String(current).toUpperCase())) throw new Error('代理组当前指向 ' + current);
      const value = proxies[current];
      if (!value) throw new Error('核心未加载该出站：' + current);
      if (value.now) { current = value.now; continue; }
      if (['direct', 'reject', 'reject-drop', 'pass', 'compatible'].includes(String(value.type || '').toLowerCase())) throw new Error('所选出站为直连或拒绝类型，无法用于代理');
      if (Array.isArray(value.all) || /^(selector|select|urltest|fallback|loadbalance|relay)$/i.test(String(value.type || '').replace(/[-_]/g, ''))) throw new Error('请选择固定节点，或选择可确认当前出站的手动选择组');
      return current;
    }
  }
  return { PRIVATE, META, cidr, address, compact, contains, overlaps, subtract, normalize, fromOptions, checkConnected, strip, transform, runtime, resolveSelection };
}
// SPDX-License-Identifier: AGPL-3.0-or-later


// SPDX-License-Identifier: AGPL-3.0-or-later
// Embedded inside the original plugin closure; no new runtime dependency.
const KPR = createPrivateRouteLogic();

function readF50TproxyPortCmd() { return `printf \"tproxy_port=${F50_PORTS.tproxy}\\ndns_port=${F50_PORTS.dns}\\n\"`; }

async function kprReadOptions() {
  const result = await runShellWithRoot('if [ -f ' + shellQuote(CLASH_POLICY_OPTIONS_FILE) + ' ]; then cat ' + shellQuote(CLASH_POLICY_OPTIONS_FILE) + ' || exit 1; fi\n' + readF50TproxyPortCmd(), 10000);
  if (!result.success) throw new Error('无法读取网络设置；配置未修改');
  return parsePolicyOptionsText(String(result.content || ''));
}

async function kprReadConnected(config = {}, options = {}) {
  const v6 = options.ipv6 === 'on';
  const result = await runShellWithRoot('ip -o -4 addr show' + (v6 ? ' && ip -o -6 addr show' : ''), 10000);
  if (!result.success) throw new Error('无法检查 F50 直连网段；配置未修改');
  const tun = String(config.tun && config.tun.device || 'KanoTun');
  const addresses = String(result.content || '').split('\n').map((line) => {
    const match = line.match(/^\s*\d+:\s+(\S+)\s+inet6?\s+(\S+)/);
    return match ? { iface: match[1].split('@')[0], cidr: match[2] } : null;
  }).filter((item) => item && item.iface !== tun && !/^(Mihomo|Meta|utun\d*|tun\d*)$/i.test(item.iface));
  if (!addresses.length) throw new Error('未读取到网络接口');
  return addresses;
}

async function kprShapeRuntimeConfig(value, options = null, configSource = null) {
  options = options || await kprReadOptions();
  const stack = await verifyF50TunStack(options);
  const preserveConfig = (configSource === null ? await readConfigSource() : configSource) === 'subscription_original';
  if (!(await ensureOriginalSubscriptionService())) throw new Error('配置处理组件更新失败；配置未修改');
  const feature = KPR.fromOptions(options);
  const connected = feature.enabled && options.traffic_mode !== 'off' ? await kprReadConnected(value, options) : [];
  return KPR.runtime(value, options.traffic_mode === 'tun' ? { ...options, tun_stack: stack } : options, connected, preserveConfig, feature);
}

async function writeYamlObjectAtomic(yamlPath, objectValue, options = {}) {
  try {
    const value = yamlPath === CLASH_CONFIG ? await kprShapeRuntimeConfig(objectValue, options.runtimeOptions, options.configSource ?? null) : objectValue;
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
  if (!live.success || String(JSON.parse(live.responseText || '{}').mode).toLowerCase() !== 'rule') throw new Error('私网定向代理要求核心实际运行在规则模式');
  const response = await callMihomoApi('/proxies', 'GET', null, null, 8);
    if (!response.success) throw new Error('无法读取代理组的实际出站');
  const payload = JSON.parse(response.responseText || '{}');
  return KPR.resolveSelection(payload.proxies || {}, feature.policy);
}

// 影响 config.yaml 与接管规则的字段；新增 options 字段必须在这里登记，
// 否则改了设置不会触发配置重建，表现为「设置不生效」。
const NETWORK_RUNTIME_FIELDS = ['traffic_mode', 'transparent', 'ipv6', 'tun_stack', 'dns_hijack', 'dns_port', 'private_route_enabled', 'private_route_cidrs', 'private_route_policy', 'tproxy_port'];
const NETWORK_EXTRA_FIELDS = ['quic_block', 'proxy_group'];
const NETWORK_LIST_FIELDS = ['deviceBypass', 'directDomain', 'directIp', 'proxyDomain', 'rejectDomain'];

function networkStateKey(state, { runtimeOnly = false } = {}) {
  const options = state.options || {};
  const keys = runtimeOnly ? NETWORK_RUNTIME_FIELDS : [...NETWORK_RUNTIME_FIELDS, ...NETWORK_EXTRA_FIELDS];
  const values = keys.map((key) => String(options[key] == null ? (key === 'tun_stack' ? 'auto' : '') : options[key]).trim());
  if (!runtimeOnly) for (const key of NETWORK_LIST_FIELDS) values.push(String(state[key] || '').trim());
  return JSON.stringify(values);
}

async function normalizeIpv6DnsCapability(state) {
  if (!state?.options || state.options.ipv6 !== 'on' || state.options.dns_hijack !== 'on') return false;
  const probe = await runShellWithRoot("probe=$(ip6tables -t nat -S 2>&1); rc=$?; if [ \"$rc\" = 0 ]; then echo F50_IPV6_NAT=1; elif printf '%s\\n' \"$probe\" | grep -Eiq \"can't initialize ip6tables table.*nat|Table does not exist\"; then echo F50_IPV6_NAT=0; else echo F50_IPV6_NAT=unknown; fi", 5000);
  if (!probe?.success || !/^F50_IPV6_NAT=0$/m.test(String(probe.content || ''))) return false;
  createToast('当前内核不支持 IPv6 NAT；已保留 IPv4 DNS 劫持，IPv6 接管仍保持开启。', 'yellow', 10000);
  return true;
}
async function verifyF50TunStack(options) {
  const stack = f50TunStack(options);
  const automatic = !options.tun_stack || options.tun_stack === 'auto';
  if (options.traffic_mode !== 'tun' || (!automatic && stack !== 'mips')) return stack;
  // 探针结果与内核版本强相关，不做跨调用缓存：换了内核后旧结果会让 stack 判断失真。
  const result = await runShellWithRoot(buildF50Tun6CompatFunctions() + '\nf50_check_mips_version', 5000);
  if (!result?.success) throw new Error('无法检查 Mihomo 版本；配置未修改。');
  if (/^F50_MIPS_VERSION_OK=1$/m.test(String(result.content || ''))) return 'mips';
  if (!/^F50_ERROR=mips_requires_mihomo_/m.test(String(result.content || ''))) throw new Error('无法检查 Mihomo 版本；配置未修改。');
  if (automatic) return stack;
  throw new Error(`MIPS 架构需要 Mihomo v${F50_MIPS_MIN_VERSION} 或以上；当前内核版本未通过检查。`);
}

const policyTransactionFiles = () => [
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
  CLASH_SUB_RULE_MODE_FILE,
];

async function kprSaveNetworkState(previous, next) {
  let backup = '', policySnapshot = '', snapshotCommitted = false, snapshotRestored = false, saved = false, restartAttempted = false, wasRunning = false, configChanged = false;
  try {
    operationStage('检查模式和网络设置', 0, 4);
    next = { ...next, options: { ...next.options } };
    const feature = KPR.fromOptions(next.options);
    next.options.private_route_enabled = feature.enabled ? 'on' : 'off';
    next.options.private_route_cidrs = feature.cidrs.join(' ');
    next.options.private_route_policy = feature.policy;
    next.options.transparent = next.options.traffic_mode === 'tproxy' ? 'on' : 'off';
    if (next.options.traffic_mode === 'off') next.options.dns_hijack = 'off';
    await normalizeIpv6DnsCapability(next);
    if (networkStateKey(previous) === networkStateKey(next)) {
      operationFinish(true, '设置未变更，未写入任何配置');
      if (activeCriticalOperation) activeCriticalOperation.finalToast = ['设置未变更，未写入任何配置', 'green'];
      else createToast('设置未变更，未写入任何配置', 'green');
      return true;
    }
    configChanged = networkStateKey(previous, { runtimeOnly: true }) !== networkStateKey(next, { runtimeOnly: true });
    const devices = normalizeDeviceBypassText(next.deviceBypass || '');
    if (devices.invalid.length) throw new Error('直连设备列表格式错误：' + devices.invalid.join('; '));
    // Preserve the list; PolicyTools disables its effect outside TProxy.
    next.deviceBypass = devices.text;
    const source = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    if (!source.ok) throw new Error(source.message || '无法读取运行配置（config.yaml）');
    configChanged = configChanged || source.value.mode !== 'rule';
    const prepared = await kprShapeRuntimeConfig(source.value, next.options);
    wasRunning = !!(await getCorePid());
    if (wasRunning) await kprVerifySelection(next.options);
    if (configChanged) {
      backup = await createConfigRollbackPoint('network');
      if (!backup) throw new Error('无法创建 config.yaml 回滚点；操作已中止');
    }
    policySnapshot = `/data/kano_network_save_${Date.now()}_${createRandomString(6)}`;
    const snapshot = await runShellWithRoot(`set -e
umask 077
TX=${shellQuote(policySnapshot)}
mkdir "$TX"
${fileSnapshotHelpersCmd()}
${policyTransactionFiles().map((path, i) => `snapshot_transaction_file ${i} ${shellQuote(path)}`).join('\n')}
echo NETWORK_SNAPSHOT_READY`, 20000);
    if (!snapshot.success || !/^NETWORK_SNAPSHOT_READY$/m.test(String(snapshot.content || ''))) throw new Error('网络设置快照创建失败；新设置未保存');
    operationStage('写入设置与运行配置', 1, 4);
    saved = true;
    if (!(await savePolicyState(next, { apply: false }))) throw new Error('网络设置未保存');
    if (configChanged) {
      const written = await kprBaseWriteYamlObjectAtomic(CLASH_CONFIG, prepared, { label: 'config.yaml', backup: false });
      if (!written.ok) throw new Error(written.content || 'config.yaml 写入失败');
    }
    if (wasRunning) {
      operationStage('同步内核模式与接管规则', 2, 4);
      restartAttempted = true;
      const ok = configChanged
        ? await restartClashOk({ skipCheck: true, preferReload: false, policyReady: true, preparedConfig: prepared })
        : await reapplyPolicyRulesSilent({ ensureScript: false });
      if (!ok) throw new Error('新设置未通过运行检查');
      await kprVerifySelection(next.options);
    }
    operationStage('确认模式已生效', 3, 4);
    invalidateStatusSnapshot();
    snapshotCommitted = true;
    Object.assign(previous, JSON.parse(JSON.stringify(next)));
    if (wasRunning && typeof refreshDashboardAfterModeChange === 'function') {
      try { await refreshDashboardAfterModeChange(); } catch (_) {}
    }
    if (next.options.traffic_mode === 'tun' && devices.text.trim()) createToast('TUN 模式已暂停直连设备生效，名单保留；切回 TProxy 后自动恢复', 'yellow', 8000);
    operationFinish(true, wasRunning ? '网络设置已保存并应用' : '网络设置已保存；核心保持停止');
    const successToast = [wasRunning ? '网络设置已保存并应用' : '网络设置已保存；核心保持停止', 'green', 8000];
    if (activeCriticalOperation) activeCriticalOperation.finalToast = successToast;
    else createToast(...successToast);
    return true;
  } catch (error) {
    if (error.name === 'OperationCancelled' || activeCriticalOperation?.token.cancelled) return false;
    operationStage('应用失败，正在恢复原设置');
    let recovered = !saved;
    if (saved) {
      let restoredSettings = false, restoredConfig = !backup;
      try {
        const rollback = await runShellWithRoot(`set -e
TX=${shellQuote(policySnapshot)}
${fileSnapshotHelpersCmd()}
${policyTransactionFiles().map((path, i) => ({ path, i })).reverse().map(({ path, i }) => `restore_transaction_file ${i} ${shellQuote(path)} || exit 1`).join('\n')}
echo NETWORK_SETTINGS_RESTORED`, 20000);
        restoredSettings = snapshotRestored = !!rollback.success && /^NETWORK_SETTINGS_RESTORED$/m.test(String(rollback.content || ''));
      } catch (_) {}
      try { if (backup) restoredConfig = await restoreConfigRollbackPoint(backup, '网络设置', { showToast: false }); } catch (_) {}
      recovered = restoredSettings && restoredConfig;
      if (recovered && wasRunning && restartAttempted) {
        try {
          recovered = configChanged
            ? await restartClashOk({ skipCheck: true, preferReload: true, policyReady: true })
            : await reapplyPolicyRulesSilent({ ensureScript: false });
        } catch (_) { recovered = false; }
      }
      if (!recovered) {
        try { await networkRescue({ showOutput: false }); } catch (_) {}
      }
    }
    operationFinish(false, recovered ? '应用失败，已恢复原设置' : '应用失败，且回滚未完成');
    createToast(safeTextToHtml(error.message || String(error)) + '<br>' +
      (recovered ? (saved ? '已恢复原设置与配置' : '新设置未应用') : '回滚失败；已尝试停止核心并清理规则，详见“状态与日志”'), recovered ? 'yellow' : 'red', 14000);
    return false;
  } finally {
    if (policySnapshot && (snapshotCommitted || snapshotRestored || !saved) && !(activeCriticalOperation && activeCriticalOperation.token.cancelled)) {
      try {
        const cleaned = await runShellWithRoot('rm -rf ' + shellQuote(policySnapshot), 10000);
        if (!cleaned.success) createToast('网络设置临时快照清理失败（不影响已保存的设置）：' + escapeHtml(policySnapshot), 'yellow', 10000);
      } catch (_) {}
    }
  }
}




  // Progress advances only at completed checkpoints; a moving bar is not a device heartbeat.
  let operationProgress = null;
  let recoveryInProgress = false;
  let pluginArtifactsRemoved = false;
  let taskCommandSequence = 0;
  let statusSnapshotCache = null;
  let statusSnapshotPromise = null;
  let statusSnapshotGeneration = 0;
  let zashboardPanelUrl = '';
  let panelLoadPromise = null;

  function shouldShowOperationProgress(label = '') {
    return /^(?:\u5b89\u88c5\u6838\u5fc3|\u5b89\u88c5\u732b\u732b|\u5378\u8f7d\u732b\u732b|\u5378\u8f7d\u6838\u5fc3|\u6062\u590d\u7f51\u7edc|\u66f4\u65b0\u8ba2\u9605|\u4fdd\u5b58\u66f4\u65b0\u8ba2\u9605|\u91cd\u65b0\u66f4\u65b0\u5931\u8d25\u8282\u70b9\u6765\u6e90|\u4fee\u590d\u8ba2\u9605\u914d\u7f6e|\u4fdd\u5b58\u7f51\u7edc\u4e0e\u79c1\u7f51\u8bbe\u7f6e|\u91cd\u542f\u6838\u5fc3|\u505c\u6b62\u6838\u5fc3|\u4fee\u590d\u4ee3\u7406\u914d\u7f6e|\u4fee\u590d\u7b56\u7565\u89c4\u5219|\u5e94\u7528\u6a21\u677f|\u5e94\u7528\u56fe\u5f62\u89c4\u5219|\u5e94\u7528 JS \u8986\u5199|\u68c0\u67e5\u5e76\u542f\u52a8\u732b\u732b|\u5bfc\u5165\u8f6c\u6362\u7ec4\u4ef6|\u5b89\u88c5\u6216\u66f4\u65b0\u8f6c\u6362\u7ec4\u4ef6|\u5bfc\u5165\u914d\u7f6e\u5305|\u5bfc\u51fa\u914d\u7f6e\u5305|\u4e0a\u4f20\u6a21\u677f|\u6e05\u7406\u7f13\u5b58|\u4fdd\u5b58 config\.yaml)$/.test(String(label));
  }

  function createOperationProgress(label, { enabled = shouldShowOperationProgress(label), delayMs = 800 } = {}) {
    if (operationProgress) operationProgress.dispose();
    const element = document.createElement('section');
    element.id = 'mm_operation_progress';
    element.setAttribute('aria-label', '任务进度');
    element.innerHTML = '<div class="mm-op-head"><span class="mm-op-title"></span><button type="button" aria-label="收起">&#8722;</button></div>' +
      '<div class="mm-op-body"><div class="mm-op-phase" role="status" aria-live="polite"></div>' +
      '<div class="mm-op-track" role="progressbar" aria-label="任务进度"><div class="mm-op-fill"></div></div>' +
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
        // Final lease errors may downgrade a body success, never the reverse.
        if (disposed || (terminal && (ok !== false || element.dataset.result === 'failed'))) return;
        terminal = true;
        clearInterval(timer); clearTimeout(revealTimer); clearTimeout(closeTimer); revealTimer = null;
        if (!shown) {
          if (ok === false && message) createToast(safeTextToHtml(message), 'red', 7000);
          return;
        }
        collapsed = false; get('.mm-op-body').hidden = false;
        element.dataset.pending = 'false';
        element.dataset.result = ok === true ? 'done' : ok === false ? 'failed' : 'ended';
        element.setAttribute('aria-busy', 'false');
        const safe = sanitizeSubscriptionSecrets(message || (ok === true ? '操作已完成' : ok === false ? '操作失败；请查看错误详情' : '操作已结束，结果未确认'));
        setText(get('.mm-op-phase'), safe); get('.mm-op-phase').title = safe;
        if (ok === true) { get('.mm-op-fill').style.width = '100%'; get('.mm-op-track').setAttribute('aria-valuenow', '100'); }
        else get('.mm-op-track').removeAttribute('aria-valuenow');
        setText(get('.mm-op-count'), ok === true ? '100%' : '');
        setText(get('button'), '\u00d7');
        get('button').setAttribute('aria-label', '关闭');
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
    setText(get('.mm-op-phase'), '处理中…');
    operationProgress = progress;
    return progress;
  }

  function operationStage(label, completed = null, total = null) {
    const op = activeCriticalOperation;
    if (op && !op.token.cancelled && op.progress) op.progress.stage(label, completed, total);
  }
  function operationFinish(ok, detail = '') {
    const op = activeCriticalOperation;
    if (op && !op.token.cancelled && op.progress) {
      if (op.finalResult?.ok === false && ok !== false) return;
      op.finalResult = { ok, detail };
    }
  }
  function operationCancelled() {
    const error = new Error('已被“恢复网络”中止，不再继续安装或重启');
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
    zashboardPanelUrl = '';
    panelLoadPromise = null;
  }

  // One read-only device request supplies the status widgets and controller metadata.


  function buildStatusSnapshotCommand() {
  return `set +e
if [ -r /data/clash/Scripts/Clash.Service ]; then
  if command -v timeout >/dev/null 2>&1; then snapshot=$(timeout -k 1 6 sh /data/clash/Scripts/Clash.Service snapshot 2>&1)
  else snapshot=$(sh /data/clash/Scripts/Clash.Service snapshot 2>&1); fi
  rc=$?
  if [ "$rc" = 0 ] && printf '%s\\n' "$snapshot" | grep -q '^F50_SNAPSHOT='; then
    printf '%s\\nF50_SNAPSHOT_RC=%s\\n' "$snapshot" "$rc"
    exit 0
  fi
  printf 'F50_SNAPSHOT_BACKEND_RC=%s\\n' "$rc"
fi
${buildOwnedCoreFunctions()}
printf 'F50_SNAPSHOT_FALLBACK=1\\nF50_CORE_PID=%s\\n' "$(find_runtime_pid)"
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
          configError: '运行组件缺失', apiError: '无法读取面板连接配置'};
      } else {
        throw new Error(f50Error(text));
      }
      return value;
    })();
    statusSnapshotPromise = pending;
    try {
      const value = await pending;
      if (generation !== statusSnapshotGeneration) {
        if (statusSnapshotPromise === pending) statusSnapshotPromise = null;
        return readStatusSnapshot({fresh:true});
      }
      statusSnapshotCache = {value, expires: Date.now()+2000};
      return value;
    } finally { if (statusSnapshotPromise === pending) statusSnapshotPromise = null; }
  }

  function validateSubscriptionMode(sources, mode) {
    const stored = normalizeStoredSubSourceList(sources);
    const enabled = normalizeSubSourceList(stored);
    if (normalizeSubRuleModeValue(mode) !== SUB_RULE_MODE_TEMPLATE) {
      throw new Error('订阅原配置模式已停用；请迁移到本地模板，原配置不会自动覆盖');
    }
    return { stored, enabled };
  }



function buildF50CleanupScript(forUninstall = false) {
  return buildF50MaintenanceFunctions('cleanup') + (forUninstall ? buildF50ConfigTransactionFunctions() : '') + `
F50_WORK=$(mktemp -d "$F50_DATA/.f50-clean.XXXXXX") || exit 1
trap 'rm -rf "$F50_WORK"' EXIT
${forUninstall ? `f50_install_lock_idle || { echo F50_CLEAN_ERROR=installation_active_or_invalid; exit 1; }
if [ -d "$F50_DATA/clash.install.lock.d" ]; then
  rm -f "$F50_DATA/clash.install.lock.d/pid" && rmdir "$F50_DATA/clash.install.lock.d" || exit 1
fi
if [ -d "$F50_ROOT/Tools/gist-sync/activation" ]; then
  KANO_GIST_TRANSACTION=$(cat "$F50_ROOT/Tools/gist-sync/activation/id" 2>/dev/null)
  export KANO_GIST_TRANSACTION
fi
for config_target in "$F50_ROOT/Proxy/config.yaml" "$F50_ROOT/Tools/template.yaml" "$F50_ROOT/Tools/template.base.yaml"; do
  config_source_file="$F50_ROOT/Tools/config_source.conf"
  if [ "$config_target" = "$F50_ROOT/Tools/template.yaml" ] && [ -f "$config_target.kano_tx/with_base" ]; then config_source_file="$F50_ROOT/Tools/template.base.yaml"; fi
  f50_config_tx_recover "$config_target" "$config_source_file" || echo F50_CLEAN_WARNING=uninstall_config_restore_failed
done` : ''}
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
  return buildF50MaintenanceFunctions('final') + `
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
  {title:'停止猫猫并恢复网络', timeout:60000, script:buildF50CleanupScript(true)},
  {title:'移除猫猫开机启动项', timeout:15000, script:`set -e
if [ -f ${shellQuote(BOOT_FILE)} ]; then
  ${removeBootLinesCmd({ removeGist: true })}
fi
if [ -f /data/f50_boot_fix/clash_boot.sh ]; then rm -f /data/f50_boot_fix/clash_boot.sh; fi
echo F50_BOOT_REMOVED
`},
  {title:'删除猫猫组件和数据', timeout:45000, script:buildF50MaintenanceFunctions('remove') + `
F50_WORK=$(mktemp -d "$F50_DATA/.f50-delete.XXXXXX") || exit 1
trap 'rm -rf "$F50_WORK"' EXIT
# Do not erase recoverable runtime files while owned processes or interception are demonstrably active.
f50_runtime_guard || exit 1
f50_remove_artifacts || exit 1
delete_rc=0
${removePluginOwnedArtifactsCmd()} || delete_rc=1
[ "$delete_rc" = 0 ] && echo UNINSTALL_NO_BACKUP_DONE
exit "$delete_rc"
`},
]; }
  let refreshDashboardAfterModeChange = null;



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
  const CLASH_PACKAGE_URL = 'https://gitee.com/womye/123/releases/download/v1/tproxy-yq.zip';
  const CLASH_PACKAGE_FALLBACK_URL = 'https://gitcode.com/Cuty/tp-yq/releases/download/v1/tproxy-yq.zip';
  const CLASH_PACKAGE_REPO_URL = 'https://raw.githubusercontent.com/Chunlion/ufi-mihomo/main/tproxy-yq.zip';
  const ZASHBOARD_UI_DIR = 'WebUI/zashboard';
  const ZASHBOARD_UI_URL = F50_ZASHBOARD_UI_URL;
  // tproxy-yq.zip is intentionally updateable. Do not pin package size/hash/core hash in the plugin.
  // Installation only requires a readable ZIP with the expected base layout; deeper features fail locally if incompatible.
  const DOWNLOAD_SOURCE_FILE = '/data/kano_clash.source';
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
  const SUB_CONVERT_MODE_PROVIDER = 'provider';
  const SUB_CONVERT_MODE_LOCAL = 'local';
  const SUB_DISABLED_MARKER = '# KANO_SUB_DISABLED ';
  const KANO_PROVIDER_USER_AGENT = 'clash.meta';
  // Controller settings and the helper snapshot are shared by several widgets during panel refresh.
  // Explicit actions still request a fresh value after they change the configuration.
  const CONTROLLER_INFO_CACHE_TTL = 1500;
  const ADVANCED_ACCESS_CACHE_TTL = 30 * 1000;
  const ADVANCED_ACCESS_FAILURE_CACHE_TTL = 2 * 1000;
  const KANO_HELPER_PATH = `${CLASH_DIR}/Tools/kano-f50-helper`;
  const KANO_HELPER_SNAPSHOT_TTL = 1500;

  const F50_GIST_HELPER = '/data/clash/Tools/kano-gist-sync';
  function f50GistParse(response, tag, command) {
    const candidates = [response?.content, response?.data?.content, response?.data?.result, response?.result];
    const pattern = new RegExp('(?:^|\\n)F50_GIST_BEGIN_' + tag + '\\r?\\n([\\s\\S]*?)\\r?\\nF50_GIST_END_' + tag + '=(\\d+)[ \\t]*(?:\\r?\\n|$)');
    for (const content of candidates) {
      if (typeof content !== 'string') continue;
      const match = content.match(pattern);
      if (!match) continue;
      let value;
      try { value = JSON.parse(match[1].trim()); } catch (_) { return {ok:false,code:'response_format_invalid'}; }
      if (!value || Array.isArray(value) || typeof value !== 'object') return {ok:false,code:'response_format_invalid'};
      const exitCode = Number(match[2]);
      if (value.ok === false && typeof value.code === 'string' && value.code) return value;
      if (exitCode !== 0) return {ok:false,code:exitCode===124?'operation_timeout':'device_execution_failed',exitCode};
      if (response?.success === false) return {ok:false,code:'device_state_unknown'};
      if (command === 'job') {
        if (!/^[a-f0-9]{32}$/.test(value.id || '') || !['queued','running','finished','completion_unknown'].includes(value.status) ||
            (value.status === 'finished' && typeof value.result?.ok !== 'boolean')) return {ok:false,code:'response_format_invalid'};
        return {...value,ok:true};
      }
      if (value.ok !== true) return {ok:false,code:'response_format_invalid'};
      if (['status','version'].includes(command) && value.protocol !== 1) return {ok:false,code:'component_version_mismatch'};
      if (command === 'status' && (!value.settings || typeof value.settings !== 'object' ||
          (!Number.isSafeInteger(value.settings.intervalHours) || value.settings.intervalHours <= 0) || typeof value.ageReady !== 'boolean')) return {ok:false,code:'response_format_invalid'};
      return value;
    }
    const text = String(response?.content || '');
    if (/timeout|timed out|aborted/i.test(text)) return {ok:false,code:'operation_timeout'};
    return {ok:false,code:text.trim()?'response_format_invalid':'device_state_unknown'};
  }
  async function f50GistExec(args, timeout = 10000, input = '') {
    const tag = Array.from(crypto.getRandomValues(new Uint8Array(12)), b=>b.toString(16).padStart(2,'0')).join('');
    const invocation = (input ? "printf '%s' " + shellQuote(input) + ' | ' : '') +
      shellQuote(F50_GIST_HELPER) + ' ' + args.map(shellQuote).join(' ') + '\n';
    const script = `umask 077
printf '\\nF50_GIST_BEGIN_${tag}\\n'
(
if [ ! -f ${shellQuote(F50_GIST_HELPER)} ]; then printf '%s\\n' '{"ok":false,"code":"components_missing"}'; exit 127; fi
if [ ! -x ${shellQuote(F50_GIST_HELPER)} ]; then printf '%s\\n' '{"ok":false,"code":"component_not_executable"}'; exit 126; fi
${invocation}) 2>/dev/null
rc=$?
printf '\\nF50_GIST_END_${tag}=%s\\n' "$rc"
`;
    try { return f50GistParse(await hostRunShellWithRoot.call(globalThis,script,timeout),tag,args[0]); }
    catch (error) { return {ok:false,code:error?.name==='AbortError' || /timeout/i.test(error?.message || '')?'operation_timeout':'device_state_unknown'}; }
  }
  async function f50GistSeal(key, action, request) {
    if (typeof CryptoJS === 'undefined' || !crypto?.getRandomValues) throw Error('secure_transport_unavailable');
    if (key.protocol !== 1 || !/^[a-f0-9]{32}$/.test(key.id || '') || !/^[a-f0-9]{512}$/.test(key.modulus || '') || key.exponent !== 65537) throw Error('component_version_mismatch');
    const hex = bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    const wa = bytes=>CryptoJS.enc.Hex.parse(hex(bytes));
    const bytes = word=>Uint8Array.from(word.toString(CryptoJS.enc.Hex).match(/../g)||[],v=>parseInt(v,16));
    const hash = data=>bytes(CryptoJS.SHA256(wa(data)));
    const mask = (seed,length)=>{
      const out=new Uint8Array(length);
      for(let i=0;i<Math.ceil(length/32);i++){
        const input=new Uint8Array(seed.length+4);input.set(seed);new DataView(input.buffer).setUint32(seed.length,i);
        out.set(hash(input).slice(0,Math.min(32,length-i*32)),i*32);
      }return out;
    };
    const secret=crypto.getRandomValues(new Uint8Array(64));
    let wrapped;
    if (crypto.subtle) {
      const n=CryptoJS.enc.Hex.parse(key.modulus).toString(CryptoJS.enc.Base64).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      const publicKey=await crypto.subtle.importKey('jwk',{kty:'RSA',n,e:'AQAB'},{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
      wrapped=wa(new Uint8Array(await crypto.subtle.encrypt({name:'RSA-OAEP',label:new TextEncoder().encode('Maomao-GistSync-RC3')},publicKey,secret))).toString(CryptoJS.enc.Base64);
    } else {
      // The F50 HTTP host has no WebCrypto; retain its existing OAEP transport.
      if (typeof BigInt === 'undefined') throw Error('secure_transport_unavailable');
      const seed=crypto.getRandomValues(new Uint8Array(32));
      const db=new Uint8Array(223);db.set(hash(new TextEncoder().encode('Maomao-GistSync-RC3')));db[158]=1;db.set(secret,159);
      const dbMask=mask(seed,223);for(let i=0;i<223;i++)db[i]^=dbMask[i];
      const seedMask=mask(db,32);for(let i=0;i<32;i++)seed[i]^=seedMask[i];
      const encoded=new Uint8Array(256);encoded.set(seed,1);encoded.set(db,33);
      const modulus=BigInt('0x'+key.modulus);let base=BigInt('0x'+hex(encoded)),exponent=65537n,encrypted=1n;
      while(exponent){if(exponent&1n)encrypted=encrypted*base%modulus;base=base*base%modulus;exponent>>=1n;}
      wrapped=CryptoJS.enc.Hex.parse(encrypted.toString(16).padStart(512,'0')).toString(CryptoJS.enc.Base64);
    }
    const iv=crypto.getRandomValues(new Uint8Array(16));
    const data=CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(JSON.stringify(request)),wa(secret.slice(0,32)),{iv:wa(iv),mode:CryptoJS.mode.CBC,padding:CryptoJS.pad.Pkcs7}).ciphertext.toString(CryptoJS.enc.Base64);
    const iv64=wa(iv).toString(CryptoJS.enc.Base64);
    const mac=CryptoJS.HmacSHA256('1\n'+key.id+'\n'+action+'\n'+wrapped+'\n'+iv64+'\n'+data,wa(secret.slice(32))).toString(CryptoJS.enc.Base64);
    secret.fill(0);
    return {protocol:1,id:key.id,key:wrapped,iv:iv64,data,mac};
  }
  async function f50GistDispatch(action, request = {}) {
    try {
      if (!request.identity && !request.manualSources) {
        const direct=await f50GistExec(['dispatch',action],12000,JSON.stringify(request));
        if (direct.code !== 'invalid_command') return direct;
      }
      const key = await f50GistExec(['request-key'],15000);
      if (action === 'apply' && key.ok && key.apply !== true) return {ok:false,code:'component_version_mismatch'};
      if (request.manualSources && key.ok && key.manualSources !== 1) return {ok:false,code:'component_version_mismatch'};
      if (!key.ok) return key;
      const sealed=await f50GistSeal(key,action,request);
      return await f50GistExec(['dispatch-sealed',action],12000,JSON.stringify(sealed));
    } catch (error) { return {ok:false,code:['secure_transport_unavailable','component_version_mismatch'].includes(error?.message)?error.message:'request_encryption_failed'}; }
    finally { request.identity=''; }
  }

  const F50_GIST_MESSAGES = {
    manual_source_invalid:'手动订阅链接无效。',
    manual_source_limit:'手动订阅最多保存 100 条。',
    manual_sources_unreadable:'无法读取手动订阅，未更新配置。',
    manual_sources_changed:'手动订阅已变更，请重新同步。',
    manual_provider_update_failed:'手动订阅下载失败。',
    manual_provider_empty:'手动订阅没有可用节点。',
    invalid_gist_url:'Gist 链接无效，请填写完整的 Raw 下载地址。',
    invalid_gist_path:'Gist Raw 链接路径不正确。',
    invalid_gist_revision:'Gist 版本号无效。',
    invalid_gist_filename:'Gist 链接应指向 .age 加密文件。',
    invalid_age_identity:'age 私钥格式不正确。',
    age_identity_missing:'请先填写 age 私钥。',
    http_404:'Gist 文件不存在或无法访问。',
    http_403:'Gist 访问被拒绝。',
    download_timeout:'Gist 下载超时，请重试。',
    download_transport_failed:'Gist 下载失败，请检查网络。',
    yaml_runtime_not_ready:'操作失败：组件未就绪，请在组件管理中重新导入配套完整组件包。',
    no_transaction_pending:'没有待恢复的同步事务。',
    components_missing:'当前完整组件版本不支持 Gist 同步，请在组件管理中更新。',
    base_components_missing:'原组件缺失，请在组件管理中更新完整组件包。',
    component_version_mismatch:'Gist 组件与页面版本不匹配，请更新配套 JS 和完整组件包。',
    component_not_executable:'Gist 程序无法执行，请在组件管理中重新导入完整组件包。',
    device_execution_failed:'设备端执行失败，请检查组件架构、权限和设备状态。',
    response_format_invalid:'设备返回数据格式不正确，请刷新状态；持续出现时更新配套 JS 和组件。',
    operation_timeout:'操作失败：设备响应超时，请恢复同步事务后重试。',
    device_state_unknown:'操作失败：设备状态读取失败，请检查连接后重试。',
    secure_transport_unavailable:'当前宿主缺少加密能力，未传输私钥；请更新宿主。',
    request_encryption_failed:'同步请求加密失败，未发送明文私钥。',
    request_key_expired:'一次性请求密钥已过期，请刷新状态后重试。',
    sealed_request_invalid:'加密请求校验失败，未执行操作。',
    root_required:'设备未授予 root 执行权限。',
    too_many_tasks:'同步任务正在运行，请等待或在高级维护中取消任务。',
    timeout:'操作失败：设备响应超时，请恢复同步事务后重试。',
    idle:'等待同步',

    test_passed:'\u4e0b\u8f7d\u3001\u89e3\u5bc6\u548c\u6700\u7ec8\u914d\u7f6e\u6821\u9a8c\u901a\u8fc7\uff1b\u672a\u5e94\u7528',
    settings_saved:'\u8bbe\u7f6e\u5df2\u4fdd\u5b58\uff1b\u672a\u5e94\u7528\u914d\u7f6e',
    up_to_date:'\u914d\u7f6e\u5df2\u662f\u6700\u65b0', synced:'配置已更新',
    saved_stopped:'\u914d\u7f6e\u5df2\u4fdd\u5b58\uff1b\u6838\u5fc3\u4fdd\u6301\u505c\u6b62\uff0c\u672a\u52a0\u8f7d',
    local_config_conflict:'\u68c0\u6d4b\u5230\u672c\u5730\u4fee\u6539\uff0c\u672a\u8986\u76d6',
    local_conflict:'\u68c0\u6d4b\u5230\u672c\u5730\u4fee\u6539\uff0c\u672a\u8986\u76d6',
    source_changed:'\u540c\u6b65\u6e90\u5df2\u66f4\u6362\uff0c\u65e7\u4efb\u52a1\u672a\u63d0\u4ea4',
    settings_changed:'\u8bbe\u7f6e\u5df2\u88ab\u5176\u4ed6\u9875\u9762\u66f4\u6539\uff1b\u8bf7\u91cd\u65b0\u8bfb\u53d6\u8868\u5355',
    operation_busy:'\u8bbe\u5907\u6b63\u5728\u6267\u884c\u5176\u4ed6\u64cd\u4f5c\uff0c\u672a\u62a2\u5360\u79df\u7ea6',
    blocked_dns_address:'DNS 返回了内网或 Fake-IP 地址，已拒绝下载。请让 Gist 域名使用真实公网 DNS。',
    dns_failed:'Gist 域名解析失败，请检查设备 DNS 和网络。',
    age_unavailable:'age 无法执行，请在组件管理中更新',
    age_decrypt_failed:'age \u89e3\u5bc6\u5931\u8d25\uff1b\u8bf7\u68c0\u67e5\u79c1\u94a5\u4e0e\u5bc6\u6587',
    committed_pending_finalize:'配置已提交，但事务收尾失败；请执行“恢复同步事务”。',
    sync_settings_deleted:'\u540c\u6b65\u8bbe\u7f6e\u548c\u79c1\u94a5\u5df2\u5220\u9664\uff1b\u8fd0\u884c\u914d\u7f6e\u672a\u5220\u9664',
    auto_disabled:'\u81ea\u52a8\u540c\u6b65\u5df2\u5173\u95ed',
    task_receipt_missing:'操作失败：任务回执读取失败，请执行“恢复同步事务”。',
    auto_paused_core_stopped:'\u6838\u5fc3\u5df2\u505c\u6b62\uff0c\u81ea\u52a8\u5e94\u7528\u6682\u505c'
  };
  const f50GistMessage = value => F50_GIST_MESSAGES[value] || (value ? '操作失败：' + String(value) : '操作失败：设备未返回结果');

  async function f50GistLeave() {
    const leave=async()=>{
      const read=await readYamlObject(CLASH_CONFIG,'config.yaml');
      if (!read.ok) throw Error(read.message || '读取配置失败');
      const paused=await runShellWithRoot(`set -e
settings=/data/clash/Tools/gist-sync/settings.conf
if [ -f "$settings" ]; then
  tmp="$settings.new.$$"
  trap 'rm -f "$tmp"' EXIT
  /data/clash/Tools/yq_linux_arm64 e -p=json -o=json '.auto = false | .revision += 1' "$settings" > "$tmp"
  chmod 600 "$tmp" && mv -f "$tmp" "$settings"
fi`,8000);
      if (!paused.success) throw Error('关闭 Gist 自动同步失败');
      delete read.value['x-f50-gist-sync'];
      const written=await writeYamlObjectAtomic(CLASH_CONFIG,read.value);
      if (!written.ok) throw Error(written.content || '退出 Gist 管理失败');
      invalidateStatusSnapshot();
      return true;
    };
    return activeCriticalOperation?.leaseOwned ? leave() : runCriticalOperation('退出 Gist 管理',leave);
  }

  async function f50GistManaged() {
    const st = await f50GistExec(['status'], 15000);
    if (st.ok && st.manualSources === 1) return st.gistActive ? st : null;
    const read = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    if (!read.ok) throw Error(read.message || '读取配置失败');
    if (read.value['x-f50-gist-sync'] === true || (st.ok && st.state?.applied?.config && st.state.applied.config === st.currentFingerprint?.config)) {
      if (window.confirm('Gist 同步不可用。退出 Gist 管理并保留当前配置，继续普通订阅操作？')) {
        if (await f50GistLeave()) return null;
      }
      throw Error(f50GistMessage(st.ok ? 'component_version_mismatch' : st.code));
    }
    return null;
  }

  async function f50GistUpdateSources(st, sources) {
    const op = activeCriticalOperation;
    if (op) {
      await f50ReleaseLease(op);
      if (op.uncertain || op.token.cancelled) return false;
    }
    const request = {revision:st.settings.revision};
    if (sources !== undefined) request.manualSources = normalizeStoredSubSourceList(sources).map(s=>({url:s.url,enabled:s.enabled}));
    const started = await f50GistDispatch('sync', request);
    if (!started.ok || !started.job) { createToast(safeTextToHtml(f50GistMessage(started.code)), 'red'); return false; }
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      if (op?.token.cancelled) { await f50GistExec(['cancel',started.job],15000); return false; }
      const job = await f50GistExec(['job',started.job],8000);
      if (job.status === 'finished') {
        invalidateStatusSnapshot();
        const ok = job.result?.ok === true;
        const message = ok ? 'Gist 配置已更新，手动订阅已合并' : f50GistMessage(job.result?.code)+(job.result?.warning?'\n'+f50GistMessage(job.result.warning):'');
        operationFinish(ok,message);
        createToast(safeTextToHtml(message),ok?'green':'red');
        return ok;
      }
      if (!job.ok || job.status === 'completion_unknown') {
        createToast(safeTextToHtml(f50GistMessage(job.result?.code || job.code || 'device_state_unknown')),'red'); return false;
      }
      await new Promise(resolve=>setTimeout(resolve,2000));
    }
    createToast('同步失败：等待任务完成超时，请在 Gist 页面恢复同步事务。','red');
    return false;
  }
  // Accept pasted Raw links with invisible edge characters, without relaxing the host restriction.
  const f50GistCleanUrl = value => String(value || '').replace(/^[\s\u200B-\u200D\u2060\uFEFF]+|[\s\u200B-\u200D\u2060\uFEFF]+$/g, '').replace(/\?raw=1$/, '');
  const f50GistValidUrl = value => {
    value=f50GistCleanUrl(value);
    try {
      if (value.length > 2048 || !value.startsWith('https://gist.githubusercontent.com/') || /[\s\u200B-\u200D\u2060\uFEFF\\]/.test(value)) return false;
      const u = new URL(value);
      if (u.protocol !== 'https:' || u.hostname !== 'gist.githubusercontent.com' || u.port || u.username || u.password || u.search || u.hash) return false;
      const parts = value.slice('https://gist.githubusercontent.com'.length).split('/');
      if (parts.length !== 5 && parts.length !== 6) return false;
      if (parts[0] || !/^[a-z0-9][a-z0-9-]{0,38}$/i.test(parts[1]) || !/^[a-f0-9]{5,64}$/i.test(parts[2]) || parts[3] !== 'raw') return false;
      if (parts.length === 6 && !/^[a-f0-9]{40}$/i.test(parts[4])) return false;
      const file = decodeURIComponent(parts[parts.length - 1]);
      return file.length > 0 && new TextEncoder().encode(file).length <= 255 && !/[\/\\\x00-\x1f\x7f]/.test(file) && /\.age$/i.test(file);
    } catch (_) { return false; }
  };

  // ===== Basic helpers =====
    let transientShellOperation = null;
  let deviceTaskUncertain = false;
  const f50ShellReply = response => {
    const candidates = [response?.data?.content, response?.data?.result, response?.result, response?.content, response].filter(value => typeof value === 'string');
    const receipt = /^(?:F50_(?:TASK_(?:FINISHED|NOT_STARTED)=|LEASE_(?:ACQUIRED|RELEASED|OWNED)=|FRONTEND_RECORDED=|OPERATION_(?:BUSY|INVALID_OWNER|UNSAFE_PATH|OWNER_CHANGED|RECOVERY_BUSY|RECOVERY_REQUIRED|WORKER_REMAINS)\r?$|RECOVERY_(?:ELIGIBLE|STATE|PARTIAL)=|CLEAN_ERROR=)|RECOVERY_VERIFIED\r?$)/m;
    return { ...(response && typeof response === 'object' ? response : {}),
      success: response?.success !== false && response?.data?.success !== false,
      content: candidates.find(value => receipt.test(value)) || candidates[0] || '' };
  };
  const f50TaskTag = (token) => 'mm_' + String(token.id).replace(/[^A-Za-z0-9_-]/g, '_');
  const f50UnknownCompletion = (op, cause = '') => {
    if (op.recovered) return operationCancelled();
    op.uncertain = true;
    op.token.cancelled = true;
    deviceTaskUncertain = true;
    const error = operationCancelled();
    error.message = '操作失败：无法读取设备执行结果；请检查连接后执行“恢复网络”。';
    error.code = 'device_completion_unknown';
    lastInstallDiagnostic = f50Diagnostic('F50_ERROR=device_completion_unknown\n' + String(cause) + (op.heartbeatError ? '\n' + op.heartbeatError : ''));
    lastInstallDiagnostic.summary = error.message;
    if (op.progress) op.progress.finish(false, error.message);
    syncCriticalOperationStatus();
    createToast(safeTextToHtml(error.message), 'red', 12000);
    return error;
  };
  const f50ReleaseLease = async (op) => {
    clearInterval(op.heartbeat);
    if (op.heartbeatPending) await op.heartbeatPending;
    if (!op.leaseOwned || op.recovered) return;
    try {
      if (op.uncertain) {
        await hostRunShellWithRoot.call(globalThis,
          buildF50LeaseFunctions() + '\nf50_frontend_touch ' + shellQuote(f50TaskTag(op.token)) + ' ended', 6000);
        return;
      }
      for (let attempt = 0; attempt < 2; attempt++) {
        const result = await hostRunShellWithRoot.call(globalThis,
          buildF50LeaseFunctions() + '\nf50_lease_release ' + shellQuote(f50TaskTag(op.token)), 6000)
          .then(f50ShellReply)
          .catch(error => ({ success: false, content: error?.message || String(error) }));
        if (result?.success && /^F50_LEASE_RELEASED=1$/m.test(String(result.content || ''))) {
          op.leaseOwned = false;
          return;
        }
        const checked = f50ShellReply(await hostRunShellWithRoot.call(globalThis,
          buildF50LeaseFunctions() + '\nf50_lease_status ' + shellQuote(f50TaskTag(op.token)), 6000));
        const state = String(checked?.content || '');
        if (checked?.success && /^(F50_LEASE_RELEASED=1|F50_OPERATION_OWNER_CHANGED)$/m.test(state)) {
          op.leaseOwned = false;
          return;
        }
        if (!(checked?.success && /^F50_LEASE_OWNED=1$/m.test(state)) || attempt) {
          throw f50UnknownCompletion(op, result?.content || 'lease_release_unconfirmed');
        }
      }
    } catch (error) {
      if (op.recovered) return;
      deviceTaskUncertain = true;
      op.uncertain = true;
      if (error?.name !== 'OperationCancelled') f50UnknownCompletion(op, error?.message || error);
    }
  };
  const runShellWithRoot = async (script = '', timeout) => {
    if (typeof script !== 'string' || script.includes(String.fromCharCode(0))) {
      return { success: false, content: 'SHELL_INVALID_TEXT: command contains NUL or is not a string' };
    }
    // uncertain 阻塞新操作（而非用户主动中止）：deviceTaskUncertain 时 recovery 要么已恢复、要么确认设备任务仍在运行。
    if (deviceTaskUncertain) {
      const blocked = operationCancelled();
      blocked.message = '操作失败：上次任务结果未确认，设备后台任务可能仍在运行；请稍后重试，仍失败时执行“恢复网络”。';
      throw blocked;
    }
    const critical = activeCriticalOperation;
    if (!critical && !transientShellOperation) {
      transientShellOperation = { token: { id: `${Date.now()}_${createRandomString(10)}` }, requests: 0 };
    }
    const op = critical || transientShellOperation;
    if (op.token.cancelled || op.closing) throw operationCancelled();
    op.requests = (op.requests || 0) + 1;
    if (op.progress) op.progress.request(1);
    try {
      const tag = f50TaskTag(op.token);
      if (!op.leasePromise) {
        op.leasePromise = (async () => {
          let result;
          try {
            result = f50ShellReply(await hostRunShellWithRoot.call(globalThis,
              buildF50LeaseFunctions() + '\nf50_lease_acquire ' + shellQuote(tag) + ' browser', 6000));
          } catch (error) { result = { success: false, content: error?.message || String(error) }; }
          let text = String(result?.content || '');
          if (!(result?.success && /^F50_LEASE_ACQUIRED=1$/m.test(text)) && !/^F50_OPERATION_(BUSY|INVALID_OWNER|UNSAFE_PATH)$/m.test(text)) {
            const checked = await hostRunShellWithRoot.call(globalThis,
              buildF50LeaseFunctions() + '\nf50_lease_status ' + shellQuote(tag), 6000)
              .then(f50ShellReply)
              .catch(error => ({ success: false, content: error?.message || String(error) }));
            const state = String(checked?.content || '');
            if (checked?.success && /^F50_LEASE_OWNED=1$/m.test(state)) { result = { success: true }; text = 'F50_LEASE_ACQUIRED=1'; }
            else if (checked?.success && /^(F50_LEASE_RELEASED=1|F50_OPERATION_OWNER_CHANGED)$/m.test(state)) return { success: false, content: text || state, deviceCompleted: false };
          }
          if (result?.success && /^F50_LEASE_ACQUIRED=1$/m.test(text)) { op.leaseOwned = true;
            op.heartbeat = setInterval(() => {
              if (op.closing || op.uncertain || op.heartbeatPending) return;
              op.heartbeatPending = hostRunShellWithRoot.call(globalThis,
                buildF50LeaseFunctions() + '\nf50_frontend_touch ' + shellQuote(tag) + ' running', 6000)
                .then(f50ShellReply)
                .catch(error => ({ success: false, content: error?.message || String(error) }))
                .then(r => {
                  if (op.recovered) return;
                  op.heartbeatError = r?.success && /^F50_FRONTEND_RECORDED=1$/m.test(String(r?.content || ''))
                    ? '' : String(r?.content || 'frontend_touch_unconfirmed');
                }).finally(() => { op.heartbeatPending = null; });
            }, 20000);
            return true; }
          if (/^F50_OPERATION_(BUSY|INVALID_OWNER|UNSAFE_PATH)$/m.test(text)) return { ...result, success: false, content: text, deviceCompleted: false };
          throw f50UnknownCompletion(op, text);
        })();
      }
      const lease = await op.leasePromise;
      if (lease !== true) return lease;
      if (op.token.cancelled || op.closing) throw operationCancelled();
      const request = tag + '.' + (++taskCommandSequence);
      const base = `umask 077\nif [ -d '${KANO_INSTALL_TOOLBOX_BIN}' ]; then export PATH='${KANO_INSTALL_TOOLBOX_BIN}':"$PATH"; fi\n${op.uninstall ? '' : buildF50GistFence()}\n${script}`;
      const command = `set +e
exec 2>&1
umask 077
${buildF50LeaseFunctions()}
if [ -e "$F50_OPERATION_LOCK/cancelled" ] || [ "$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null)" != ${shellQuote(tag)} ]; then
  echo F50_TASK_NOT_STARTED=${request}
  exit 1
fi
f50_writer_enter || { echo F50_TASK_NOT_STARTED=${request}; exit 1; }
if [ -e "$F50_OPERATION_LOCK/cancelled" ] || [ "$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null)" != ${shellQuote(tag)} ]; then
  f50_writer_leave
  echo F50_TASK_NOT_STARTED=${request}
  exit 1
fi
f50_frontend_write ${shellQuote(tag)} running || exit 1
mkdir -p "$F50_TASK_DIR" && chmod 700 "$F50_TASK_DIR" || exit 1
env KANO_TPROXY_TASK=${shellQuote(tag)} sh -c ${shellQuote(base)} > "$F50_TASK_DIR/${request}.output" 2>&1 &
kano_task_pid=$!
kano_task_start=$(awk '{sub(/^.*\\) /, ""); split($0,s," "); print s[20]}' "/proc/$kano_task_pid/stat" 2>/dev/null)
case "$kano_task_start" in ''|*[!0-9]*) kano_task_start=0;; esac
kano_manager_start=$writer_start
printf 'F50_TASK_V2 %s %s %s %s %s %s running 0\\n' ${shellQuote(tag)} ${shellQuote(request)} "$kano_task_pid" "$kano_task_start" "$$" "$kano_manager_start" > "$F50_TASK_DIR/${request}" || { wait "$kano_task_pid"; exit 1; }
f50_writer_leave || { wait "$kano_task_pid"; exit 1; }
wait "$kano_task_pid"
kano_task_rc=$?
f50_writer_enter || exit 1
{ printf 'F50_TASK_V2 %s %s %s %s %s %s finished %s\\n' ${shellQuote(tag)} ${shellQuote(request)} "$kano_task_pid" "$kano_task_start" "$$" "$kano_manager_start" "$kano_task_rc" &&
  cat "$F50_TASK_DIR/${request}.output"; } > "$F50_TASK_DIR/${request}.receipt" &&
  mv -f "$F50_TASK_DIR/${request}.receipt" "$F50_TASK_DIR/${request}" || exit 1
rm -f "$F50_TASK_DIR/${request}.output" || exit 1
sed '1d' "$F50_TASK_DIR/${request}" || exit 1
f50_writer_leave || exit 1
printf '\\nF50_TASK_FINISHED=${request}:%s\\n' "$kano_task_rc"
exit "$kano_task_rc"`;
      let result;
      try { result = f50ShellReply(await hostRunShellWithRoot.call(globalThis, command, timeout)); }
      catch (error) { result = { success: false, content: error?.message || String(error) }; }
      let text = String(result?.content || '');
      if (text.trim() === 'F50_TASK_NOT_STARTED=' + request) {
        op.token.cancelled = true;
        throw operationCancelled();
      }
      const receiptPattern = new RegExp('(?:^|\\n)F50_TASK_FINISHED=(' + request.replace(/\./g, '\\.') + '):([0-9]+)[ \\t]*(?=\\r?\\n|$)');
      let tail = text.match(receiptPattern);
      if ((!tail || tail[1] !== request) && !op.token.cancelled) {
        const checked = await hostRunShellWithRoot.call(globalThis,
          buildF50LeaseFunctions() + '\nf50_task_result ' + shellQuote(tag) + ' ' + shellQuote(request), 6000)
          .then(f50ShellReply)
          .catch(error => ({ success: false, content: error?.message || String(error) }));
        const receiptText = String(checked?.content || '');
        const receiptTail = receiptText.match(receiptPattern);
        if (receiptTail?.[1] === request) { result = checked; text = receiptText; tail = receiptTail; }
      }
      if (!tail || tail[1] !== request) throw f50UnknownCompletion(op, text);
      if (op.token.cancelled) throw operationCancelled();
      op.heartbeatError = '';
      syncCriticalOperationStatus();
      return { ...result, success: Number(tail[2]) === 0,
        content: text.slice(0, tail.index), deviceCompleted: true, deviceExitCode: Number(tail[2]) };
    } finally {
      op.requests--;
      if (op.progress) op.progress.request(-1);
      if (!op.requests) {
        if (op.drained) { op.drained(); op.drained = null; }
        if (!critical) {
          op.closing = true;
          const alreadyUncertain = op.uncertain;
          await f50ReleaseLease(op);
          if (transientShellOperation === op) transientShellOperation = null;
          if (!alreadyUncertain && op.uncertain) throw operationCancelled();
        }
      }
    }
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
    let normalized = String(hostname || '').trim().toLowerCase();
    if (/^(0x[0-9a-f]+|[0-9]+)$/.test(normalized)) {
      const numeric = normalized.startsWith('0x') ? parseInt(normalized, 16) : Number(normalized);
      if (!Number.isSafeInteger(numeric) || numeric < 0 || numeric > 4294967295) return false;
      normalized = [(numeric >>> 24) & 255, (numeric >>> 16) & 255, (numeric >>> 8) & 255, numeric & 255].join('.');
    }
    const parts = normalized.split('.');
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
      return { ok: false, message: '本地转换的订阅地址无效' };
    }
    if (url.protocol != 'http:' && url.protocol != 'https:') {
      return { ok: false, message: '订阅地址只允许 HTTP 或 HTTPS' };
    }
    if (url.username || url.password) {
      return { ok: false, message: '订阅地址不得在 URL 中携带用户名或密码' };
    }
    const hostname = String(url.hostname || '').replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
    if (!hostname) {
      return { ok: false, message: '订阅地址缺少主机名' };
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
      return { ok: false, message: '本地转换拒绝回环、私网或保留地址' };
    }
    return {
      ok: true,
      url: url.toString(),
      hostname,
      port: url.port || (url.protocol == 'https:' ? '443' : '80'),
      addressFamily: hostname.includes(':') ? 'ipv6' : 'auto',
      message: '',
    };
  };

  const getUploadedPath = (url) => {
    const normalized = String(url || '').replace(/^\/+/, '');
    if (!normalized || normalized.includes('..')) {
      throw new Error('上传路径异常');
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
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!result || typeof result.url !== 'string' || !result.url.trim()) {
      throw new Error((result && result.error) || '上传失败');
    }
    const uploadedPath = getUploadedPath(result.url);
    if (operation && operation.token.cancelled) {
      await hostRunShellWithRoot.call(globalThis, `rm -f ${shellQuote(uploadedPath)}`, 5000);
      throw operationCancelled();
    }
    return uploadedPath;
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
    { label: 'device_bypass.txt', path: CLASH_DEVICE_BYPASS_FILE, optional: true },
    { label: 'direct_domain.list', path: CLASH_DIRECT_DOMAIN_FILE, optional: true },
    { label: 'direct_ip.list', path: CLASH_DIRECT_IP_FILE, optional: true },
    { label: 'proxy_domain.list', path: CLASH_PROXY_DOMAIN_FILE, optional: true },
    { label: 'reject_domain.list', path: CLASH_REJECT_DOMAIN_FILE, optional: true },
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


  const removeBootLinesCmd = ({ enable = false, removeGist = false } = {}) => `
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
            -v remove_gist=${removeGist ? 1 : 0} \
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
            '{ sub(/\\r$/, ""); line=$0; gsub(/^[ \t]+|[ \t]+$/, "", line);
               if(remove_gist && line == "# KANO_GIST_SYNC_BEGIN") { if(gist) exit 1; gist=1; next }
               if(remove_gist && line == "# KANO_GIST_SYNC_END") { if(!gist) exit 1; gist=0; next }
               if(remove_gist && gist) next;
               if(line != "/data/clash/Scripts/Clash.Service start" && line != async && line != cleanup && line != runtime && line != service && line != legacy_wrapper && line != legacy_inotify && line != inotify && line != legacy_policy && line != policy && line != mac) print }
             END { if(remove_gist && gist) exit 1 }' \
            "$BOOT_SOURCE" > "$BOOT_TMP" || exit 1
          ${enable ? `printf '%s\\n' ${shellQuote(BOOT_ASYNC_LINE)} >> "$BOOT_TMP" || exit 1` : ''}
          sh -n "$BOOT_TMP" || exit 1
          mv "$BOOT_TMP" ${shellQuote(BOOT_FILE)} || exit 1
        ) || exit $?
        `;

  // 策略脚本仍保留为高级功能，但不再成为基础开机自启的必需项。
  const addPolicyToolsBootLineCmd = () => addBootLinesCmd();

  const syncSafePolicyFilesCmd = () => `
        mkdir -p ${shellQuote(CLASH_POLICY_DIR)} ${shellQuote(CLASH_SAFE_POLICY_DIR)} || exit 1
        sync_policy_file() {
          src="$1"; dst="$2"; staged="$dst.kano_sync.$$"
          [ ! -L "$src" ] && [ ! -L "$dst" ] || return 1
          [ -f "$src" ] || printf '# empty\\n' > "$src" || return 1
          if ! cp "$src" "$staged" || ! chmod 600 "$staged" || ! mv -f "$staged" "$dst"; then
            rm -f "$staged"; echo F50_ERROR=policy_copy_failed; return 1
          fi
          chmod 600 "$src" || return 1
        }
        sync_policy_file ${shellQuote(CLASH_REJECT_DOMAIN_FILE)} ${shellQuote(CLASH_SAFE_REJECT_DOMAIN_FILE)} || exit 1
        sync_policy_file ${shellQuote(CLASH_DIRECT_DOMAIN_FILE)} ${shellQuote(CLASH_SAFE_DIRECT_DOMAIN_FILE)} || exit 1
        sync_policy_file ${shellQuote(CLASH_DIRECT_IP_FILE)} ${shellQuote(CLASH_SAFE_DIRECT_IP_FILE)} || exit 1
        sync_policy_file ${shellQuote(CLASH_PROXY_DOMAIN_FILE)} ${shellQuote(CLASH_SAFE_PROXY_DOMAIN_FILE)} || exit 1
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

  const pruneKanoBackupsCmd = (keep = 8) => `
        prune_kano_backup_series() {
          base="$1"
          max_keep="$2"
          count=0
          ls -1t "\${base}".before_* 2>/dev/null | while IFS= read -r stale; do
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


  const ensureServiceWrapper = async () => { const ok=await ensureCompatBackend(); return {success:ok,content:ok?'F50_CONTROLLER='+F50_COMPAT_VERSION:'F50_BACKEND_REQUIRED'}; };

  const parseRuntimePreflightResult = (result = {}) => {
    const values = parseKeyValueOutput(result.content || '');
    const state = ['not_installed', 'damaged', 'installed_stopped', 'running_api_unavailable', 'healthy']
      .includes(values.PREFLIGHT_STATE)
      ? values.PREFLIGHT_STATE
      : 'damaged';
    return {
      state,
      corePid: values.CORE_PID || '',
      message: values.MESSAGE || '',
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
      [ -e "$SERVICE" ] || {
        echo "PREFLIGHT_STATE=not_installed"
        echo "CORE_PID="
        echo "MESSAGE=未找到 Clash.Service"
        exit 0
      }
      if [ ! -x "$CORE" ] || [ ! -s "$CONFIG" ]; then
        echo "PREFLIGHT_STATE=damaged"
        echo "CORE_PID="
        echo "MESSAGE=Core 缺失或无执行权限，或配置文件缺失"
        exit 0
      fi

      ${buildOwnedCoreFunctions()}
      pid="$(find_runtime_pid)"
      state=installed_stopped
      [ -z "$pid" ] || state=running_api_unavailable
      echo "PREFLIGHT_STATE=$state"
      echo "CORE_PID=$pid"
      echo "MESSAGE=基础文件已就绪；未执行配置有效性测试"
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
      throw new Error('无法读取开机自启状态；请重试');
    }
    return parseBootIntegrationResult(result);
  };


  const downloadCoreArchive = async ({ allowCached = false } = {}) => {
    // Keep the device download independent of the host request window.
    operationStage('检查组件包缓存');
    if (allowCached) {
      const cached = await runShellWithRoot(`
        ZIP=${shellQuote(DOWNLOAD_ZIP)}
        LOG=${shellQuote(DOWNLOAD_LOG)}
        [ -s "$ZIP" ] || exit 1
        command -v unzip >/dev/null 2>&1 || exit 1
        unzip -t "$ZIP" >"$LOG" 2>&1 || exit 1
        echo "ARCHIVE_READY=cached"
      `, 20 * 1000);
      if (cached.deviceCompleted === false) return { ok: false, stage: 'lease', source: '', message: cached.content, content: cached.content };
      if (cached.success && String(cached.content || '').includes('ARCHIVE_READY=cached')) {
        return { ok: true, stage: 'ready', source: 'cached', message: '', content: String(cached.content || '') };
      }
    }

    const sources = [CLASH_PACKAGE_FALLBACK_URL, CLASH_PACKAGE_URL, CLASH_PACKAGE_REPO_URL].filter(Boolean);
    const errors = [];
    for (const packageUrl of sources) {
      operationStage('下载并校验组件包：来源 ' + (sources.indexOf(packageUrl) + 1) + '/' + sources.length);
      const result = await runShellWithRoot(`
        set +e
        ZIP=${shellQuote(DOWNLOAD_ZIP)}
        LOG=${shellQuote(DOWNLOAD_LOG)}
        ${getCurlBinCmd()}
        command -v unzip >/dev/null 2>&1 || { echo "ARCHIVE_VERIFY_FAILED=unzip_missing"; exit 1; }
        ${dataSpaceGuardCmd('echo "ARCHIVE_SPACE_LOW=$kano_data_avail_kb"; exit 1')}
        printf 'TRY_PACKAGE_URL=%s\\n' ${shellQuote(packageUrl)} > "$LOG" || exit 1
        (
        NEW="$ZIP.new.$$"
        trap 'worker_rc=$?; rm -f "$NEW" "$NEW.verify"; if [ "$worker_rc" -ne 0 ]; then echo "ARCHIVE_WORKER_FAILED=$worker_rc"; fi' EXIT
        "$CURL_BIN" -fsSL --connect-timeout 30 --max-time 590 --retry 0 \
          ${shellQuote(packageUrl)} -o "$NEW"
        download_rc=$?
        if [ "$download_rc" -ne 0 ]; then
          echo "ARCHIVE_DOWNLOAD_FAILED=$download_rc"
          exit 1
        fi
        [ -s "$NEW" ] || {
          echo "ARCHIVE_VERIFY_FAILED=empty"
          exit 1
        }
        size="$(wc -c < "$NEW" 2>/dev/null || echo 0)"
        unzip -t "$NEW" >"$NEW.verify" 2>&1 || {
          echo "ARCHIVE_VERIFY_FAILED=zip"
          cat "$NEW.verify" 2>/dev/null || true
          exit 1
        }
        # v7.3.4 FINAL: do not reject an otherwise valid ZIP by exact internal path names here.
        # Package-root/component discovery happens after extraction, where nested/case-varied layouts can be normalized.
        mv -f "$NEW" "$ZIP" || exit 1
        # source 文件仅供人工排查（无程序读取方）；写失败不应作废已下载并通过校验的包。
        printf '%s\n' ${shellQuote(packageUrl)} > ${shellQuote(DOWNLOAD_SOURCE_FILE)} || true
        chmod 600 ${shellQuote(DOWNLOAD_SOURCE_FILE)} 2>/dev/null || true
        echo "ARCHIVE_SOURCE=${shellQuote(packageUrl)}"
        echo "ARCHIVE_BYTES=$size"
        # verify 残留无害：EXIT trap 亦会清理；不应作废已下载的包。
        rm -f "$NEW.verify" 2>/dev/null || true
        trap - EXIT
        echo "ARCHIVE_READY=downloaded"
        ) >>"$LOG" 2>&1 < /dev/null &
        echo "ARCHIVE_DOWNLOAD_STARTED=1"
      `, 10 * 1000);
      let content = String(result.content || '');
      if (result.deviceCompleted === false) return { ok: false, stage: 'lease', source: '', message: content, content };
      if (result.success && /^ARCHIVE_DOWNLOAD_STARTED=1$/m.test(content)) {
        const deadline = Date.now() + 900000;
        let finished = false;
        while (Date.now() < deadline) {
          if (activeCriticalOperation?.token.cancelled) throw operationCancelled();
          const log = await hostRunShellWithRoot.call(globalThis, 'tail -n 100 ' + shellQuote(DOWNLOAD_LOG), 5000)
            .then(f50ShellReply).catch(error => ({ success: false, content: error?.message || String(error) }));
          content = String(log.content || '');
          if (log.success && /^ARCHIVE_READY=downloaded$/m.test(content)) {
            return { ok: true, stage: 'ready', source: packageUrl, message: '', content };
          }
          if (log.success && /^ARCHIVE_WORKER_FAILED=/m.test(content)) { finished = true; break; }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // An unconfirmed worker must retain its lease and block installation.
        if (!finished) throw f50UnknownCompletion(activeCriticalOperation, content);
      }
      errors.push(`[${packageUrl}]\n${content || 'download failed'}`);
    }
    const content = errors.join('\n---\n');
    return {
      ok: false,
      stage: /ARCHIVE_DOWNLOAD_FAILED/.test(content) ? 'download' : 'archive_verify',
      source: '',
      message: '所有组件包下载源均下载或校验失败',
      content,
    };
  };




  const setButtonBusy = (button, busy, busyText = '') => {
    if (!button) return;
    if (busy) {
      if (button.dataset.kanoBusy !== '1') {
        button.dataset.rawText = button.textContent || '';
        button.dataset.rawDisabled = button.disabled ? '1' : '0';
      }
      button.dataset.kanoBusy = '1';
      button.disabled = true;
      if (busyText) button.textContent = busyText;
    } else if (button.dataset.kanoBusy === '1') {
      button.disabled = button.dataset.rawDisabled === '1';
      button.textContent = button.dataset.rawText;
      delete button.dataset.rawText;
      delete button.dataset.rawDisabled;
      delete button.dataset.kanoBusy;
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
    statusEl.dataset.state = deviceTaskUncertain ? 'failed' : label ? 'running' : 'idle';
    statusEl.textContent = deviceTaskUncertain ? '任务：失败' : label ? `任务：${label}` : '任务：空闲';
  };
  const acquireCriticalOperation = (label = '关键操作', token = null, allowUninstallRecovery = false, allowInstallRecovery = false) => {
    if ((deviceTaskUncertain && !allowUninstallRecovery && !allowInstallRecovery) || transientShellOperation) {
      createToast(deviceTaskUncertain ? '上次操作失败；请先执行“恢复网络”后重试' : '设备读取尚未结束；请稍后重试', 'yellow');
      return null;
    }
    if (recoveryInProgress) {
      createToast('网络恢复正在执行，请等待完成', 'yellow');
      return null;
    }
    if (activeCriticalOperation) {
      if (token && activeCriticalOperation.token === token) return token;
      createToast(`“${escapeHtml(activeCriticalOperation.label)}”正在执行；请等待完成后再试。`, 'yellow', 5000);
      return null;
    }
    const operationToken = token || { id: `${Date.now()}_${createRandomString(6)}` };
    activeCriticalOperation = { label: String(label || '关键操作'), token: operationToken, progress: createOperationProgress(label), uninstall: allowUninstallRecovery };
    invalidateStatusSnapshot();
    syncCriticalOperationStatus();
    return operationToken;
  };

  const releaseCriticalOperation = async (token) => {
    const op = activeCriticalOperation;
    if (!op || op.token !== token) return;
    op.closing = true;
    if (op.requests) await new Promise(resolve => { op.drained = resolve; });
    await f50ReleaseLease(op);
    if (activeCriticalOperation === op) {
      if (op.progress && !token.cancelled) {
        const final = op.finalResult || { ok: null, detail: '' };
        op.progress.finish(final.ok, final.detail);
        if (final.ok !== false && op.finalToast) createToast(...op.finalToast);
      }
      activeCriticalOperation = null;
      invalidateStatusSnapshot();
      syncCriticalOperationStatus();
    }
  };

  const runCriticalOperation = async (label, action, token = null, allowInstallRecovery = false) => {
    const reentrant = !!(token && activeCriticalOperation && activeCriticalOperation.token === token);
    const operationToken = acquireCriticalOperation(label, token, false, allowInstallRecovery);
    if (!operationToken) return false;
    const ownsLock = !reentrant;
    let result = false;
    try {
      result = await action(operationToken);
      if (ownsLock) operationFinish(typeof result === 'boolean' ? result : null);
    } catch (error) {
      if (ownsLock) operationFinish(false, sanitizeSubscriptionSecrets(error.message || String(error)));
      if (error.name !== 'OperationCancelled') throw error;
      result = false;
    } finally {
      if (ownsLock) await releaseCriticalOperation(operationToken);
    }
    return operationToken.cancelled ? false : result;
  };

  const runCriticalButtonOperation = async (label, button, busyText, action) => {
    const token = acquireCriticalOperation(label);
    if (!token) return;
    let result;
    try {
      setButtonBusy(button, true, busyText);
      result = await action();
    } finally {
      try { setButtonBusy(button, false); }
      finally { await releaseCriticalOperation(token); }
    }
    return token.cancelled ? false : result;
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
        const res = await hostRunShellWithRoot.call(globalThis, 'whoami', 5000);
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
    createToast('未开启高级功能；无法执行此操作', 'red');
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
    const res = await hostRunShellWithRoot.call(globalThis, `
        if [ -f ${shellQuote(CLASH_SUB_USER_AGENT_FILE)} ]; then
          sed -n '1p' ${shellQuote(CLASH_SUB_USER_AGENT_FILE)}
        fi
        `, 10 * 1000).then(f50ShellReply);
    if (!res.success) throw new Error('读取订阅 User-Agent 失败，未继续更新');
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
    const random = globalThis.crypto?.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(length)) : null;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        random ? random[i] % characters.length : Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };


  const wait = (ms = 1000) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

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






  const providerNameFor = (index = 0) => `Provider${index + 1}`;

  const normalizeSubUrl = (value = '') =>
    String(value).trim();

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
    String(value || '').trim().toLowerCase() == 'original'
      ? 'original' : SUB_RULE_MODE_TEMPLATE;
  const readCurrentSubRuleMode = async () => {
    const res = await hostRunShellWithRoot.call(globalThis, `
      if [ -f ${shellQuote(CLASH_SUB_URLS)} ]; then
        sed -n '/^# KANO_SUB_RULE_MODE=/p' ${shellQuote(CLASH_SUB_URLS)} | head -n 1
      fi
    `, 10 * 1000).then(f50ShellReply);
    if (!res.success) throw new Error('读取订阅模式失败，未修改配置');
    return parseSubRuleModeFromText(res.content || '');
  };

  const parseSubRuleModeFromText = (content = '') => {
    const match = String(content || '').match(/^# KANO_SUB_RULE_MODE=(\S+)\s*$/m);
    return normalizeSubRuleModeValue(match ? match[1] : '');
  };

  const readConfigSource = async () => {
    const res = await hostRunShellWithRoot.call(globalThis, `
      if [ -f ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} ]; then
        sed -n 's/^KANO_CONFIG_SOURCE=//p' ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} | head -n 1
      fi
    `, 10 * 1000).then(f50ShellReply);
    if (!res.success) throw new Error('读取配置来源失败，未修改配置');
    return String(res.content || '').trim();
  };
  const normalizeSubConvertModeValue = (value = '') =>
    String(value || '').trim().toLowerCase() === SUB_CONVERT_MODE_LOCAL
      ? SUB_CONVERT_MODE_LOCAL : SUB_CONVERT_MODE_PROVIDER;

  const parseSubConvertModeFromText = (content = '') => {
    const match = String(content || '').match(/^# KANO_SUB_CONVERT_MODE=(\S+)\s*$/m);
    return normalizeSubConvertModeValue(match ? match[1] : '');
  };

  const readSavedSubConvertMode = async () => {
    const res = await hostRunShellWithRoot.call(globalThis, `
      if [ -f ${shellQuote(CLASH_SUB_URLS)} ]; then cat ${shellQuote(CLASH_SUB_URLS)} || exit 1; fi
      if [ -s ${shellQuote(CLASH_CONFIG)} ]; then printf '\\nKANO_CONFIG_PRESENT=1\\n'; fi
    `, 10 * 1000).then(f50ShellReply);
    if (!res.success) throw new Error('读取订阅转换模式失败，未修改配置');
    const text = String(res.content || '');
    const match = text.match(/^# KANO_SUB_CONVERT_MODE=(provider|local)\s*$/im);
    if (match) return normalizeSubConvertModeValue(match[1]);
    if (!/^KANO_CONFIG_PRESENT=1$/m.test(text)) return SUB_CONVERT_MODE_PROVIDER;
    const read = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    if (!read.ok) throw new Error(read.message || '读取历史订阅模式失败，未修改配置');
    const types = Object.values(read.value['proxy-providers'] || {}).map((provider) => provider?.type);
    return types.length > 0 && types.every((type) => type === 'file')
      ? SUB_CONVERT_MODE_LOCAL : SUB_CONVERT_MODE_PROVIDER;
  };

  const fileSnapshotHelpersCmd = () => `
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
`;

  const fileTransactionHelpersCmd = () => fileSnapshotHelpersCmd() + `
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
            restore_sub_transaction || { echo "F50_RECOVERY_SUB=$TX"; exit 1; }
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

  

  const setSubRuleMode = async (mode = SUB_RULE_MODE_TEMPLATE) => {
    const cleanMode = normalizeSubRuleModeValue(mode);
    const current = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_SUB_URLS)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_SUB_URLS)}; fi
        `, 10 * 1000);
    if (!current.success) {
      createToast(`无法读取规则模式状态<br>${safeTextToHtml(current.content || '')}`, 'red', 9000);
      return false;
    }
    const storedSources = parseStoredSubSourcesFromText(current.content || '');
    const convertMode = await readSavedSubConvertMode();
    const saved = await persistSubSourceState(storedSources, cleanMode, convertMode, { allowEmpty: true });
    if (!saved) {
      createToast('规则模式状态写入失败', 'red', 9000);
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
    return res.success ? parseStoredSubSourcesFromText(res.content || '') : [];
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
    { forceDefault = false, showToast = false, templatePath = CLASH_TEMPLATE, backup = true } = {},
  ) => {
    await loadProviderUserAgent();
    const cleanSources = normalizeSubSourceList(sources);
    const storage = await ensurePolicyStorage();
    if (!storage.ok) {
      createToast(`准备模板目录失败<br>${safeTextToHtml(storage.content || '')}`, 'red', 9000);
      return false;
    }

    const existsRes = await runShellWithRoot(`[ -s ${shellQuote(templatePath)} ] && echo 1 || echo 0`, 10 * 1000);
    if (!existsRes.success) {
      createToast('模板状态探测失败；操作已中止，原模板未改写。', 'red', 9000);
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
        createToast('无法读取 template.yaml 生成标记；操作已中止，原文件未改写。', 'red', 9000);
        return false;
      }
    }

    let normalized;
    try {
      normalized = normalizeManagedTemplateObject(baseObject, cleanSources, {
        generated,
        emptyProviderUrls: true,
      });
    } catch (e) {
      createToast(`模板结构不兼容；原文件未改写<br>${safeTextToHtml(e.message || e)}`, 'red', 10000);
      return false;
    }

    const write = await writeYamlObjectAtomic(templatePath, normalized.config, {
      label: 'template.yaml',
      marker: generated ? GENERATED_TEMPLATE_MARKER : '',
      backup: backup && exists,
      backupTag: 'f50_template',
    });
    if (!write.ok) {
      createToast(`模板自动处理失败；原文件未被覆盖<br>${safeTextToHtml(write.content || '')}`, 'red', 10000);
      return false;
    }

    if (showToast) {
      createToast(
        `模板已转换为 F50 可用格式，共 ${normalized.providerNames.length} 个节点来源`,
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
    if (typeof value == 'number' && !Number.isFinite(value)) throw new TypeError('YAML 不支持 NaN 或 Infinity');
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
      const entries = Object.entries(value).filter(([, item]) => item !== undefined);
      if (entries.length == 0) return '{}';
      return entries.map(([key, item]) => {
        if (Array.isArray(item)) {
          return `${pad}${yamlKey(key)}:${item.length ? `\n${dumpYamlValue(item, indent + 2)}` : ' []'}`;
        }
        if (isPlainYamlObject(item)) {
          const rendered = dumpYamlValue(item, indent + 2);
          return `${pad}${yamlKey(key)}:${rendered === '{}' ? ' {}' : `\n${rendered}`}`;
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



  const utf8ByteLength = (text = '') => {
    const value = String(text || '');
    if (typeof TextEncoder != 'undefined') return new TextEncoder().encode(value).length;
    try {
      return unescape(encodeURIComponent(value)).length;
    } catch (_) {
      return value.length;
    }
  };


  // yq is an advanced-feature dependency, not a prerequisite for installing/starting Mihomo.
  // On a clean UFI environment, repair it lazily only when a YAML-backed feature is actually used.
  const yqExecutableCheckCmd = () => `
    [ -x "$YQ" ] || { echo "YQ_MISSING: $YQ"; exit 1; }
  `;

  const readYamlObject = async (yamlPath, label = 'YAML', { allowDownload = true } = {}) => {
    const res = await runShellWithRoot(`
        set -e
        ${buildF50ShellBase()}
        FILE=${shellQuote(yamlPath)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        ${yqExecutableCheckCmd()}
        [ -s "$FILE" ] || { echo "YAML_FILE_MISSING: $FILE"; exit 1; }
        size="$(wc -c < "$FILE" 2>/dev/null || echo 0)"
        echo "$size" | grep -Eq '^[0-9]+$' || size=0
        [ "$size" -le ${YAML_BRIDGE_MAX_BYTES} ] || {
          echo "YAML_FILE_TOO_LARGE: bytes=$size limit=${YAML_BRIDGE_MAX_BYTES}"
          exit 1
        }
        set -- e
        if "$YQ" --help 2>/dev/null | grep -q -- '--yaml-fix-merge-anchor-to-spec'; then
          set -- "$@" --yaml-fix-merge-anchor-to-spec
        fi
        yaml_read_stderr="$KANO_YQ_TMP/yq_json_read.$$.err"
        trap 'rm -f "$yaml_read_stderr"' EXIT
        if f50_limit 15 "$YQ" "$@" -o=json '.' "$FILE" 2>"$yaml_read_stderr"; then
          :
        else
          yaml_read_rc=$?
          cat "$yaml_read_stderr"
          exit "$yaml_read_rc"
        fi
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
      f50AssertSafeJsonNumbers(value);
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

    const stageRes = await runShellWithRoot(`
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

  const commitStagedYaml = async ({targetPath, stagePath, label = 'YAML', backup = true,
  backupTag = 'yaml_bridge', configSource = null, preserveSecret = true, sourceStagePath = null, removeSource = false,
  baseStagePath = null, basePath = null}) => {
  const withBase = baseStagePath !== null;
  const withSource = withBase || configSource !== null || sourceStagePath !== null || removeSource;
  if (withBase && (typeof baseStagePath !== 'string' || typeof basePath !== 'string' || targetPath === CLASH_CONFIG || configSource !== null || sourceStagePath !== null || removeSource)
    || !withBase && withSource && targetPath !== CLASH_CONFIG || configSource !== null && !['template.yaml','subscription_original','uploaded_config'].includes(configSource) || sourceStagePath !== null && typeof sourceStagePath !== 'string' || removeSource && sourceStagePath !== null) {
    return {ok:false,content:'F50_ERROR=invalid_config_source'};
  }
  const safeTag = String(backupTag || 'yaml_bridge').replace(/[^A-Za-z0-9_.-]+/g, '_');
  const script = `set -e
umask 077
TARGET=${shellQuote(targetPath)}
STAGE=${shellQuote(stagePath)}
SOURCE_FILE=${shellQuote(withBase ? basePath : CLASH_CONFIG_SOURCE_FILE)}
SOURCE_VALUE=${shellQuote(configSource || '')}
WITH_SOURCE=${withSource ? 1 : 0}
SOURCE_STAGE=${shellQuote(baseStagePath || sourceStagePath || '')}
SOURCE_DELETE=${removeSource ? 1 : 0}
PROTECT_SECRET=${targetPath === CLASH_CONFIG && preserveSecret ? 1 : 0}
BACKUP_REQUESTED=${backup ? 1 : 0}
BACKUP_TAG=${shellQuote(safeTag)}
YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
${buildF50YamlCommitBody(withBase)}
`;
  const res = await runShellWithRoot(script, 45000);
  if (res.success) invalidateStatusSnapshot();
  const content = String(res.content || '');
  const field = (name) => (content.split(/\r?\n/).find(line => line.startsWith(name + '=')) || '').slice(name.length + 1);
  return {ok:res.success === true && /^YAML_COMMIT_(?:OK|UNCHANGED)=1$/m.test(content),
    unchanged:/^YAML_COMMIT_UNCHANGED=1$/m.test(content), backupPath:field('YAML_BACKUP'),
    oldHash:field('YAML_OLD_HASH'),newHash:field('YAML_NEW_HASH'),content,shell:res};
};


  const kprBaseWriteYamlObjectAtomic = async (yamlPath, objectValue, {
    label = 'YAML',
    marker = '',
    backup = true,
    backupTag = 'yaml_bridge',
    configSource = null,
    preserveSecret = true,
  } = {}) => {
    try {
      assertYamlRootMap(objectValue, label);
      f50AssertSafeJsonNumbers(objectValue);
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
      configSource,
      preserveSecret,
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

  // TProxy 端口属于受控集合：iptables、DNS nat 与启动校验都按固定值下发，不从 options 读取。
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

  const applyManagedDashboardFields = (config, { preserveConfig = false } = {}) => {
    assertYamlRootMap(config, '配置');
    const externalUi = String(config['external-ui'] || '').trim().replace(/\\/g, '/');
    const externalUiUrl = String(config['external-ui-url'] || '').trim();
    const changed = externalUi != ZASHBOARD_UI_DIR
      || Object.prototype.hasOwnProperty.call(config, 'external-ui-name')
      || externalUiUrl != ZASHBOARD_UI_URL
      || (!preserveConfig && !Object.prototype.hasOwnProperty.call(config, 'unified-delay'));
    config['external-ui'] = ZASHBOARD_UI_DIR;
    config['external-ui-url'] = ZASHBOARD_UI_URL;
    // unified-delay 不参与接管、路由与面板校验，仅在用户未设置时补默认值。
    if (!preserveConfig && !Object.prototype.hasOwnProperty.call(config, 'unified-delay')) config['unified-delay'] = true;
    delete config['external-ui-name'];
    return changed;
  };

  const applyRequiredF50Fields = (config, {
    preservedSecret = '',
    preserveConfig = false,
  } = {}) => {
    assertYamlRootMap(config, '配置');
    if (typeof config['external-controller'] != 'string' || !config['external-controller'].trim()) {
      config['external-controller'] = `0.0.0.0:${F50_PORTS.controller}`;
    }
    applyManagedDashboardFields(config, { preserveConfig });
    if (typeof config.secret != 'string' || !config.secret.trim()) config.secret = preservedSecret || F50_DEFAULT_SECRET;
    if (!Object.prototype.hasOwnProperty.call(config, 'proxies')) config.proxies = [];
    return config;
  };

  const applyOverrideSafetyFields = (config, preservedSecret = '') => {
    if (typeof preservedSecret === 'string' && preservedSecret.length) config.secret = preservedSecret;
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
    // 生成的模板统一补默认面板字段；用户已有模板则尊重其 unified-delay 设置。
    applyRequiredF50Fields(config, { preserveConfig: !generated });
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
    port: F50_PORTS.http,
    'socks-port': F50_PORTS.socks,
    'mixed-port': F50_PORTS.mixed,
    'redir-port': 0,
    'tproxy-port': F50_PORTS.tproxy,
    'allow-lan': true,
    'bind-address': '*',
    mode: 'rule',
    'log-level': 'info',
    ipv6: false,
    'external-controller': String(controllerSettings.controller || `0.0.0.0:${F50_PORTS.controller}`),
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
      listen: `0.0.0.0:${F50_PORTS.dns}`,
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


  const updateAirportDnsTemplate = (template, policy) => {
    const config = cloneJsonValue(assertYamlRootMap(template, '基础模板'));
    if (config.dns != null && !isPlainYamlObject(config.dns)) throw new Error('模板中的 DNS 必须是映射对象');
    if (!isPlainYamlObject(policy)) throw new Error('节点 DNS 策略必须是“域名 → DNS”的映射');
    const entries = Object.entries(policy).map(([domain, value]) => {
      const name = domain.trim();
      if (!name || /[\s/?#]/.test(name)) throw new Error('填写节点域名或域名后缀，不要填写订阅链接');
      const servers = Array.isArray(value) ? value : [value];
      if (!servers.length || servers.some((server) => typeof server !== 'string' || !server.trim() || /\s/.test(server.trim()))) {
        throw new Error('每个节点域名至少需要一个 DNS 地址，每行一个');
      }
      const clean = [...new Set(servers.map((server) => server.trim()))];
      return [name, Array.isArray(value) ? clean : clean[0]];
    });
    config.dns = config.dns || {};
    if (entries.length) {
      config.dns['proxy-server-nameserver-policy'] = Object.fromEntries(entries);
      const defaults = config.dns['proxy-server-nameserver'];
      if (defaults == null || Array.isArray(defaults) && defaults.length === 0) {
        config.dns['proxy-server-nameserver'] = cloneJsonValue(PROFILE_BASE.dns['proxy-server-nameserver']);
      }
    } else {
      delete config.dns['proxy-server-nameserver-policy'];
    }
    return config;
  };

  const readAirportDnsTemplate = async () => {
    const probe = await runShellWithRoot(`
      if [ -s ${shellQuote(CLASH_TEMPLATE_BASE)} ]; then printf base;
      elif [ -s ${shellQuote(CLASH_TEMPLATE)} ]; then printf current;
      elif [ -s ${shellQuote(CLASH_CONFIG)} ]; then printf runtime; fi
    `, 5000);
    if (!probe.success) return { ok: false, message: '无法读取模板状态' };
    const kind = String(probe.content || '').trim();
    if (!['base', 'current', 'runtime'].includes(kind)) return { ok: false, message: '请先上传模板或配置文件' };
    const path = kind === 'base' ? CLASH_TEMPLATE_BASE : kind === 'current' ? CLASH_TEMPLATE : CLASH_CONFIG;
    const read = await readYamlObject(path, '基础模板');
    if (!read.ok) return read;
    const generated = await yamlHasGeneratedMarker(path);
    if (generated === null) return { ok: false, message: '无法读取模板标记' };
    try {
      updateAirportDnsTemplate(read.value, read.value.dns && read.value.dns['proxy-server-nameserver-policy'] || {});
      return { ...read, generated };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  };

  const saveAirportDnsPolicy = async (policy) => {
    const read = await readAirportDnsTemplate();
    if (!read.ok) { createToast(safeTextToHtml(read.message), 'red', 8000); return false; }
    try {
      const write = await writeYamlObjectAtomic(CLASH_TEMPLATE_BASE, updateAirportDnsTemplate(read.value, policy), {
        label: '基础模板', marker: read.generated ? GENERATED_TEMPLATE_MARKER : '', backup: true, backupTag: 'airport_dns',
      });
      if (!write.ok) { createToast(`节点 DNS 策略保存失败<br>${safeTextToHtml(write.content || '')}`, 'red', 8000); return false; }
      return true;
    } catch (error) {
      createToast(safeTextToHtml(error.message), 'red', 8000);
      return false;
    }
  };

  const extractAirportDnsPolicy = (value) => {
    const source = value && value.dns || value;
    if (!isPlainYamlObject(source)) throw new Error('请粘贴域名与 DNS 的 YAML 映射');
    const policy = source['proxy-server-nameserver-policy'] || source;
    const normalized = updateAirportDnsTemplate({}, policy);
    const result = normalized.dns['proxy-server-nameserver-policy'] || {};
    if (!Object.keys(result).length) throw new Error('没有可导入的节点 DNS 策略');
    return result;
  };

  const parseAirportDnsText = async (text) => {
    if (!String(text || '').trim()) throw new Error('请先粘贴节点 DNS 策略配置');
    const staged = await stageTextBesideTarget(CLASH_TEMPLATE_BASE, text, '节点 DNS 策略');
    if (!staged.ok) throw new Error('节点 DNS 策略暂存失败；请检查设备连接与可用空间');
    try {
      const read = await readYamlObject(staged.stagePath, '节点 DNS 策略');
      if (!read.ok) throw new Error('无法解析粘贴内容；请检查 YAML 缩进与 DNS 地址');
      return extractAirportDnsPolicy(read.value);
    } finally {
      await runShellWithRoot('rm -f ' + shellQuote(staged.stagePath), 5000);
    }
  };

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

  const saveOverrideText = async (target, text, label) => {
    const res = await runShellWithRoot(`
        set -e
        mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)}
        TARGET=${shellQuote(target)}
        TMP="$TARGET.kano_new.$$"
        trap 'rm -f "$TMP" 2>/dev/null || true' EXIT
        printf '%s' ${shellQuote(text)} > "$TMP"
        chmod 600 "$TMP"
        mv -f "$TMP" "$TARGET"
        trap - EXIT
        `);
    if (!res.success) {
      createToast(`保存${label}失败<br>${safeTextToHtml(res.content || '')}`, 'red', 8000);
    }
    return !!res.success;
  };
  const saveRuleOverrideConfig = async (config = {}) =>
    saveOverrideText(CLASH_RULE_OVERRIDE_JSON, JSON.stringify(normalizeRuleOverrideConfig(config), null, 2) + '\n', '图形规则');







  const buildDefaultOverrideJs = () => [
    '/**',
    ' * F50 JS 覆写：写法尽量贴近桌面端 mihomo/Clash Verge 覆写脚本。',
    ' * 保存后会基于 template.base.yaml 生成 template.yaml，不会直接把整份模板替换成固定内容。',
    ' * 常用写法：只改 config.rules，或少量改 proxy-groups。',
    ' */',
    'function main(config) {',
    '  config.rules = config.rules || [];',
    '',
    '  // 示例 1：让某个域名直连，放到规则最前面',
    '  // config.rules.unshift("DOMAIN-SUFFIX,apple.com,DIRECT");',
    '',
    '  // 示例 2：让某个域名强制走代理组 Proxy',
    '  // config.rules.unshift("DOMAIN-SUFFIX,google.com,Proxy");',
    '',
    '  // 示例 3：拦截广告域名',
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
    const blockedPattern = /\b(eval|Function|fetch|XMLHttpRequest|WebSocket|EventSource|WebTransport|Worker|SharedWorker|import|importScripts|self|document|window|globalThis|localStorage|sessionStorage|indexedDB|caches|navigator|location|history|opener|parent|top|frames|runShellWithRoot|KANO_baseURL|common_headers|constructor|__proto__|prototype)\b/;
    if (safeCode.length > 20000) {
      throw new Error('JS 覆写内容过长；请精简后保存');
    }
    const decoded = safeCode.replace(/\\(?:u([0-9a-fA-F]{4})|u\{([0-9a-fA-F]{1,6})\}|x([0-9a-fA-F]{2}))/g,
      (match, utf16, point, byte) => {
        const value = parseInt(utf16 || point || byte, 16);
        return value <= 0x10ffff ? String.fromCodePoint(value) : match;
      });
    if (blockedPattern.test(decoded)) {
      throw new Error('JS 覆写包含被禁止的浏览器、网络、动态执行或原型访问能力；已拒绝保存');
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
    return saveOverrideText(CLASH_OVERRIDE_JS, output, ' JS 覆写');
  };


  const hasSavedJsOverride = async () => {
    const res = await runShellWithRoot(`[ -s ${shellQuote(CLASH_OVERRIDE_JS)} ] && echo 1 || echo 0`);
    return String(res.content || '').trim() == '1';
  };

  const runJsOverrideOnConfig = async (code = '', config = {}) => {
    const safeCode = validateOverrideJsSafety(code);
    if (typeof Worker != 'function' || typeof Blob != 'function' || !globalThis.URL || typeof globalThis.URL.createObjectURL != 'function') {
      throw new Error('当前浏览器不支持隔离 Worker；已拒绝在主线程执行 JS 覆写');
    }

    const input = JSON.parse(JSON.stringify(config || {}));
    const workerSource = `
      "use strict";
      (() => {
      const FunctionConstructor = Function;
      const safePostMessage = self.postMessage.bind(self);
      for (const prototype of [Function.prototype, Object.getPrototypeOf(async function() {}), Object.getPrototypeOf(function*() {}), Object.getPrototypeOf(async function*() {})]) {
        Object.defineProperty(prototype, "constructor", { value: undefined, writable: false, configurable: false });
      }
      const blockedGlobals = [
        "Function", "eval",
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
          const module = { exports: {} };
          const exports = module.exports;
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
          const runner = new FunctionConstructor("config", "module", "exports", runnerBody);
          const output = runner(config, module, exports);
          safePostMessage({ ok: true, output });
        } catch (error) {
          safePostMessage({
            ok: false,
            error: String(error && (error.stack || error.message) || error)
          });
        }
      };
      })();
    `;

    const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    let worker = null;
    try {
      worker = new Worker(blobUrl);
      const output = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          try { worker.terminate(); } catch (_) {}
          reject(new Error('JS 覆写执行超时（3.5 秒）；隔离 Worker 已终止'));
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
        throw new Error('JS 覆写输出超过 5 MiB；已拒绝写入');
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
    const candidate = `${templatePath}.kano_candidate_${Date.now()}_${createRandomString(6)}`;
    const baseCandidate = candidate + '.base';
    try {
      const pre = await runShellWithRoot(`set -e
umask 077
mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)}
[ ! -L ${shellQuote(templateBasePath)} ] && [ ! -L ${shellQuote(templatePath)} ] || exit 1
if [ -s ${shellQuote(templateBasePath)} ]; then
  cp ${shellQuote(templateBasePath)} ${shellQuote(candidate)}
  echo BASE_TEMPLATE_PRESENT
elif [ -s ${shellQuote(templatePath)} ]; then
  cp ${shellQuote(templatePath)} ${shellQuote(candidate)}
  cp ${shellQuote(templatePath)} ${shellQuote(baseCandidate)}
fi`, 20000);
      if (!pre.success) throw new Error(pre.content || '无法准备候选模板');
      if (!(await ensureTemplateForF50(cleanSources, { showToast: false, templatePath: candidate, backup: false }))) return false;
      const newBase = !/^BASE_TEMPLATE_PRESENT$/m.test(String(pre.content || ''));
      if (newBase) {
        const base = await runShellWithRoot(`[ -s ${shellQuote(baseCandidate)} ] || cp ${shellQuote(candidate)} ${shellQuote(baseCandidate)}`, 10000);
        if (!base.success) throw new Error(base.content || '无法准备基础模板');
      }
      if (!(await applyJsOverrideToTemplate({ sources: cleanSources, prepareTemplate: false, templatePath: candidate, backup: false }))) return false;
      const committed = await commitStagedYaml({ targetPath: templatePath, stagePath: candidate,
        label: 'template.yaml', backupTag: 'template',
        baseStagePath: newBase ? baseCandidate : null, basePath: templateBasePath });
      if (!committed.ok) throw new Error(committed.content || '模板事务提交失败');
      return true;
    } catch (error) {
      createToast(`准备模板失败；旧模板与运行配置已保留<br>${safeTextToHtml(error.message || error)}`, 'red', 9000);
      return false;
    } finally {
      await runShellWithRoot('rm -f ' + shellQuote(candidate) + ' ' + shellQuote(baseCandidate), 10000);
    }
  };

  const applyJsOverrideToTemplate = async ({
    showToast = false,
    restart = false,
    sources = null,
    prepareTemplate = true,
    templateBasePath = CLASH_TEMPLATE_BASE,
    templatePath = CLASH_TEMPLATE,
    backup = true,
  } = {}) => {
    const saved = await hasSavedJsOverride();
    const ruleOverrideConfig = await readRuleOverrideConfig();
    const hasUiOverride = hasActiveRuleOverride(ruleOverrideConfig);
    if (!saved && !hasUiOverride) {
      if (showToast) createToast('尚未保存图形规则或 JS 覆写', 'yellow', 5000);
      return true;
    }

    const templateRes = await runShellWithRoot(`[ -s ${shellQuote(templatePath)} ] && echo 1 || echo 0`);
    if (String(templateRes.content || '').trim() != '1') {
      if (showToast) createToast('没有 template.yaml；覆写未应用', 'yellow', 6000);
      return true;
    }

    const cleanSources = sources ? normalizeSubSourceList(sources) : await readSavedSubSourcesForTemplate();
    if (prepareTemplate) {
      if (!(await prepareTemplateFromBase(cleanSources, { templateBasePath, templatePath }))) return false;
      if (showToast) createToast('覆写已写入 template.yaml', 'green', 7000);
      return restart ? restartClashOk({ skipCheck: true }) : true;
    }

    const read = await readYamlObject(templatePath, 'template.yaml');
    if (!read.ok) {
      createToast(`无法读取 template.yaml<br>${safeTextToHtml(read.message || '')}`, 'red', 9000);
      return false;
    }

    let outputObj = read.value;
    const preservedSecret = typeof read.value.secret == 'string' ? read.value.secret : '';
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
      createToast('无法读取 template.yaml 生成标记；操作已中止，原文件未改写。', 'red', 9000);
      return false;
    }
    const write = await writeYamlObjectAtomic(templatePath, outputObj, {
      label: 'template.yaml',
      marker: generated ? GENERATED_TEMPLATE_MARKER : '',
      backup,
      backupTag: 'override',
    });
    if (!write.ok) {
      createToast(`覆写结果写入失败；原模板未被覆盖<br>${safeTextToHtml(write.content || '')}`, 'red', 10000);
      return false;
    }
    if (showToast) {
      createToast('覆写已写入 template.yaml', 'green', 7000);
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
        `${configCommitted ? "配置已写入，但来源标记提交失败；本次应用失败" : "生成运行配置失败，config.yaml 未提交"}<br>${safeTextToHtml(detail)}<br><br>[kano_template_write_check.out]<br>${safeTextToHtml(checkRes.content || '')}`,
        'red',
        12000,
      );
      return false;
    };

    await writeCheckStart();

    if (cleanSources.length == 0) return fail('validate_sources', '没有订阅链接；无法生成运行配置');
    const invalidSource = cleanSources.find((source) => !isHttpUrl(source.url));
    if (invalidSource) return fail('validate_sources', `订阅链接格式不正确：${invalidSource.url}`);

    const storage = await ensurePolicyStorage();
    if (!storage.ok) return fail('prepare_policy_storage', storage.content || '策略文件目录准备失败');

    const read = await readYamlObject(CLASH_TEMPLATE, 'template.yaml');
    if (!read.ok) return fail('read_template', read.message || 'template.yaml 无法读取');

    const generated = await yamlHasGeneratedMarker(CLASH_TEMPLATE);
    if (generated === null) return fail('read_template_marker', 'template.yaml 生成标记无法读取');
    let normalized;
    try {
      normalized = normalizeManagedTemplateObject(read.value, cleanSources, {
        generated,
        emptyProviderUrls: false,
        localProviderFiles,
      });
    } catch (e) {
      return fail('normalize_runtime_object', e.message || String(e));
    }

    const write = await writeYamlObjectAtomic(CLASH_CONFIG, normalized.config, {
      label: 'config.yaml',
      marker: generated ? GENERATED_TEMPLATE_MARKER : '',
      backup,
      backupTag: 'runtime',
      configSource: 'template.yaml',
    });
    if (!write.ok) return fail('validate_or_commit_runtime', write.content || '运行配置验证或提交失败');

    configCommitted = true;


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
        '运行配置已通过结构检查并写入',
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
        ${buildF50CurlLocator()}
        f50_find_curl || exit 1
        CURL_BIN=$F50_CURL_BIN
        `;

  const getCorePid = async () => (await readStatusSnapshot()).corePid;

  const normalizeController = (value = '') => {
    let controller = String(value || '').trim() || `127.0.0.1:${F50_PORTS.controller}`;
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
        apiBase: `http://127.0.0.1:${F50_PORTS.controller}`,
        port: String(F50_PORTS.controller),
      };
    }
  };

  let controllerInfoCache = null;
  let controllerInfoCacheExpiresAt = 0;
  let controllerInfoLoadPromise = null;

  const readControllerInfo = async ({ fresh = false } = {}) => {
    const data = await readStatusSnapshot({ fresh });
    const controller = data.externalController || `127.0.0.1:${F50_PORTS.controller}`;
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
    invalidateStatusSnapshot();
  };


  const validateControllerSettings = (controller = '', secret = '') => {
    const rawController = String(controller || '').trim().replace(/\/+$/g, '');
    const rawSecret = String(secret || '').trim();
    if (!rawController) {
      return { ok: false, message: 'external-controller 不能为空' };
    }
    if (!rawSecret) {
      return { ok: false, message: 'secret 不能为空' };
    }
    if (/[\r\n]/.test(rawController) || /[\r\n]/.test(rawSecret)) {
      return { ok: false, message: 'external-controller 和 secret 不能包含换行' };
    }
    let parsed = null;
    try {
      const probe = rawController.startsWith(':')
        ? `http://127.0.0.1${rawController}`
        : (/^https?:\/\//i.test(rawController) ? rawController : `http://${rawController}`);
      parsed = new URL(probe);
    } catch {
      return { ok: false, message: 'external-controller 格式不正确' };
    }
    if (!parsed.port) {
      return { ok: false, message: 'external-controller 必须包含端口' };
    }
    if (parsed.pathname && parsed.pathname != '/') {
      return { ok: false, message: 'external-controller 不要填写路径' };
    }
    const controllerForConfig = /^https?:\/\//i.test(rawController)
      ? parsed.host
      : rawController;
    const normalized = normalizeController(controllerForConfig);
    if (!normalized || !normalized.port || Number(normalized.port) < 1 || Number(normalized.port) > 65535) {
      return { ok: false, message: 'external-controller 端口不正确' };
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
      return { ...checked, ok: false, message: '无法创建 config.yaml 回滚点；设置未保存' };
    }
    const configRead = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    if (!configRead.ok) {
      return { ...checked, ok: false, message: configRead.message || 'config.yaml 无法读取' };
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
        return { ...checked, ok: false, message: templateRead.message || 'template.yaml 无法读取' };
      }
      templateObject = cloneJsonValue(templateRead.value);
      templateObject['external-controller'] = checked.controller;
      templateObject.secret = checked.secret;
      templateGenerated = await yamlHasGeneratedMarker(CLASH_TEMPLATE);
      if (templateGenerated === null) {
        return { ...checked, ok: false, message: '无法读取 template.yaml 生成标记；原文件未改写' };
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
      preserveSecret: false,
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
          configRestored && templateRestored ? '已恢复原配置' : '原配置回滚失败',
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
        : '原配置回滚失败';
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
    const bodyText = body == null ? null : typeof body === 'string' ? body : JSON.stringify(body);
    if (body != null && typeof bodyText !== 'string') throw new TypeError('Invalid API JSON body');
    const configValue = value => '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + '"';
    const curlConfig = [
      `url = ${configValue(url)}`,
      `request = ${configValue(String(method || 'GET').toUpperCase())}`,
      ...(info.secretSet || info.secret ? [`header = ${configValue(`Authorization: Bearer ${info.secret}`)}`] : []),
      ...(bodyText == null ? [] : [`header = "Content-Type: application/json"`, `data-binary = ${configValue(bodyText)}`]),
    ].join('\n') + '\n';
    const outputArg = outputFile
      ? `-o ${shellQuote(outputFile)} -w ${shellQuote('%{http_code}')}`
      : '';
    return `printf '%s' ${shellQuote(curlConfig)} | ` + [
      '"$CURL_BIN"',
      '-sS',
      "--noproxy '*' --connect-timeout 2",
      `-m ${Math.max(1, Number(requestTimeout) || 8)}`,
      outputArg,
      '-K -',
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
    const execute = method === 'GET' && body == null
      ? (script, timeout) => hostRunShellWithRoot.call(globalThis, script, timeout)
      : runShellWithRoot;
    const res = await execute(`
        umask 077
        trap ${shellQuote('rm -f ' + shellQuote(outFile) + ' ' + shellQuote(errFile))} EXIT
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

  const inspectZashboardDisk = async () => {
    const res = await runShellWithRoot(`
      ${buildF50ZashboardValidationFunction()}
      f50_validate_zashboard ${shellQuote(`${CLASH_PROXY_DIR}/WebUI/zashboard`)}
    `, 15 * 1000);
    return {
      ok: !!(res.success && String(res.content || '').includes('F50_PANEL_VALIDATED=1')),
      content: String(res.content || ''),
    };
  };

  const probeZashboardGuard = async () => {
    const res = await hostRunShellWithRoot.call(globalThis, `
      ${buildF50ZashboardValidationFunction()}
      CFG=${shellQuote(CLASH_CONFIG)}
      YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
      [ -s "$CFG" ] && [ -x "$YQ" ] || exit 1
      export F50_CONFIG_SOURCE=$(sed -n 's/^KANO_CONFIG_SOURCE=//p' ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} 2>/dev/null | head -n 1)
      "$YQ" e -e '."external-ui" == ${JSON.stringify(ZASHBOARD_UI_DIR)} and ."external-ui-url" == ${JSON.stringify(ZASHBOARD_UI_URL)} and (has("external-ui-name") | not) and (has("unified-delay") or strenv(F50_CONFIG_SOURCE) == "subscription_original")' "$CFG" >/dev/null 2>&1 || exit 1
      f50_validate_zashboard ${shellQuote(`${CLASH_PROXY_DIR}/WebUI/zashboard`)} >/dev/null 2>&1 || exit 1
      echo F50_ZASHBOARD_GUARD_OK=1
      echo "F50_UNIFIED_DELAY=$(\"$YQ\" e -r '.\"unified-delay\" // false' \"$CFG\")"
    `, 8 * 1000);
    if (!res.success || !String(res.content || '').includes('F50_ZASHBOARD_GUARD_OK=1')) return false;
    const corePid = await getCorePid();
    if (!corePid) return true;
    const runtime = await callMihomoApi('/configs', 'GET', null, null, 5, { corePid });
    if (!runtime.success) return false;
    try {
      return JSON.parse(runtime.responseText || '{}')['unified-delay']
        === /^F50_UNIFIED_DELAY=true$/m.test(String(res.content || ''));
    } catch (_) { return false; }
  };

  let zashboardGuardPromise = null;
  const ensureZashboardPanelReady = async () => {
    if (zashboardGuardPromise) return zashboardGuardPromise;
    zashboardGuardPromise = (async () => {
      if (await probeZashboardGuard()) return { ok: true, repaired: false };

      const read = await readYamlObject(CLASH_CONFIG, 'config.yaml');
      if (!read.ok) return { ok: false, message: read.message || 'config.yaml 无法读取' };

      const config = cloneJsonValue(read.value);
      const configChanged = applyManagedDashboardFields(config, { preserveConfig: await readConfigSource() === 'subscription_original' });
      const info = await buildControllerInfo();
      const corePid = await getCorePid();
      if (configChanged) {
        const write = await writeYamlObjectAtomic(CLASH_CONFIG, config, {
          label: 'config.yaml',
          backup: true,
          backupTag: 'zashboard_guard',
        });
        if (!write.ok) return { ok: false, message: write.content || 'Zashboard 配置写入失败' };
      }
      if (corePid) {
        const reload = await reloadConfigHot(info);
        if (!reload.success) return { ok: false, message: reload.message || reload.responseText || 'Zashboard 配置热加载失败' };
      }

      let disk = await inspectZashboardDisk();
      if (disk.ok) return { ok: true, repaired: configChanged || !!corePid };
      if (!corePid) return { ok: false, message: 'Zashboard 文件身份异常，核心未运行，无法在线修复' };

      const upgraded = await callMihomoApi('/upgrade/ui', 'POST', null, info, 60, { corePid });
      if (!upgraded.success) {
        return { ok: false, message: upgraded.message || upgraded.responseText || 'Zashboard 在线修复失败' };
      }
      disk = await inspectZashboardDisk();
      if (!disk.ok) return { ok: false, message: '面板更新结果不是 Zashboard，已阻止加载' };
      return { ok: true, repaired: true };
    })();
    try {
      return await zashboardGuardPromise;
    } finally {
      zashboardGuardPromise = null;
    }
  };






  const buildProviderUpdateResult = (providers = [], metadata = {}) => {
    const results = Array.isArray(providers) ? providers : [];
    const success = results.filter((item) => item.ok).length;
    const total = results.length;
    return { ...metadata, total, success, failed: total - success, providers: results, okCount: success, results };
  };

  const mapWithConcurrency = async (items = [], limit = 2, worker = async (item) => item) => {
    const source = Array.from(items);
    const results = new Array(source.length);
    let cursor = 0, failure = null;
    const runNext = async () => {
      while (!failure && cursor < source.length) {
        const index = cursor++;
        try { results[index] = await worker(source[index], index); }
        catch (error) { if (!failure) failure = { error }; }
      }
    };
    const count = Number.isFinite(Number(limit)) ? Math.max(1, Math.floor(Number(limit))) : 1;
    await Promise.all(Array.from({ length: Math.min(source.length, count) }, runNext));
    if (failure) throw failure.error;
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
      ? '订阅配置检查未通过'
      : providerNotRun
        ? '订阅配置正常，节点来源未更新'
        : allOk
          ? '订阅更新成功'
          : providerResult.success > 0
            ? '订阅配置正常，部分节点来源更新失败'
            : '订阅配置正常，节点来源更新失败';
    const color = !configOk || (!providerNotRun && (confirmedNoCache || noUsableProvider))
      ? 'red'
      : allOk
        ? 'green'
        : 'yellow';
    const summary = !configOk
      ? '订阅配置检查未通过；详见下方检查结果。'
      : providerNotRun
        ? `配置检查通过；节点来源未更新（${providerResult.notRunReason || '未执行更新'}）。`
        : allOk
          ? `订阅更新成功：已更新 ${providerResult.success}/${providerResult.total} 个节点来源`
          : `配置检查通过；已更新 ${providerResult.success}/${providerResult.total} 个节点来源`;
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

  const forceUpdateProvidersFromConfig = async ({showToast=false,providerNames=null,config=null,refreshRemote=false}={}) => {
  const read = config ? {ok:true,value:config} : await readYamlObject(CLASH_CONFIG,'config.yaml');
  if (!read.ok) return buildProviderUpdateResult([{name:'config.yaml',ok:false,proxyCount:null,errorType:'config_read_failed',message:read.message || 'config read failed'}]);
  const defs = read.value['proxy-providers'] || {};
  const names = Object.keys(defs).filter(name=>!providerNames || providerNames.includes(name));
  if (!names.length) return buildProviderUpdateResult([{name:'config.yaml',ok:false,proxyCount:null,errorType:'provider_missing',message:'当前配置没有可更新的节点来源'}]);
  if (refreshRemote && Object.keys(read.value['x-f50-provider-sources'] || {}).some(name=>names.includes(name))) {
    const refreshed=await f50Command('refresh-remote-providers',100000);
    if (!refreshed.success) return buildProviderUpdateResult(names.map(name=>({name,ok:false,proxyCount:null,errorType:'remote_refresh_failed',message:f50Error(refreshed.content)})));
  }
  const info=await buildControllerInfo({fresh:true}),pid=await getCorePid();
  const results=await mapWithConcurrency(names,2,async name=>{
    if (!pid) return {type:'proxy-provider',name,ok:false,attempts:0,proxyCount:null,cacheAvailable:false,errorType:'not_run_core_stopped',message:'核心未运行',connectivity:'unverified'};
    const path='/providers/proxies/'+encodeURIComponent(name);
    const updated=await callMihomoApi(path,'PUT',null,info,5,{corePid:pid});
    // An update error says nothing about the still-loaded cache. Observe it independently.
    const snap=await callMihomoApi(path,'GET',null,info,5,{corePid:pid});
    let count=null,parseFailed=false;
    if (snap.success) {
      try { const value=JSON.parse(snap.responseText || ''); if (!Array.isArray(value.proxies)) throw Error('missing proxies'); count=value.proxies.length; }
      catch (_) { parseFailed=true; }
    }
    const ok=updated.success===true && snap.success===true && count>0;
    const failure=!updated.success ? updated : snap;
    const rawMessage=sanitizeSubscriptionSecrets(failure.responseText || failure.message || failure.content || '');
    const http=defs[name]?.type==='http';
    const upstream390=http && (updated.statusCode===390 || /(?:HTTP|status(?: code)?)\s*[:=]?\s*390\b/i.test(rawMessage));
    const errorType=ok ? '' : upstream390 ? 'upstream_390' : !updated.success ? (updated.statusCode===404 ? 'provider_missing' : updated.errorType || 'provider_update_failed')
      : !snap.success ? snap.errorType || 'provider_snapshot_failed' : parseFailed ? 'provider_parse_failed' : 'provider_empty';
    return {type:'proxy-provider',name,ok,attempts:1,proxyCount:count,cacheAvailable:count>0,
      updateSucceeded:updated.success===true,loadObserved:snap.success===true && !parseFailed,connectivity:'unverified',
      statusCode:updated.statusCode || 0,snapshotStatusCode:snap.statusCode || 0,errorType,rawMessage,
      message:ok ? '' : rawMessage || (count===0 ? '节点来源已响应，但未返回可用节点' : '无法读取节点加载状态')};
  });
  const result=buildProviderUpdateResult(results,{controllerInfo:info,corePid:pid,
    notRunReason:!pid && names.length ? '核心未运行' : '',via:names.some(name=>defs[name]?.type==='http')?'http':'file'});
  if (showToast) createToast(result.failed?'部分节点来源更新失败':'节点已加载；代理连通性未测试',result.failed?'yellow':'green');
  return result;
};



  const formatSubscriptionDownloadError = (provider = {}, detail = '') => {
    const status = Number(provider.statusCode || 0);
    const reason = String(provider.message || detail || '');
    if (status === 401 || status === 403) return `订阅服务器拒绝访问（HTTP ${status}）；请检查链接是否有效或已到期`;
    if (status === 404) return '订阅链接不存在（HTTP 404）；请检查下载地址';
    if (status >= 300 && status < 400) return `订阅返回重定向（HTTP ${status}）；请使用最终下载链接`;
    if (status >= 500) return `订阅服务器暂时不可用（HTTP ${status}）；请稍后重试`;
    if (/certificate|x509|tls handshake/i.test(reason)) return '订阅服务器的 HTTPS 校验失败；请检查证书与设备时间';
    if (/timeout|timed out|deadline exceeded/i.test(reason)) return '订阅下载超时；请检查网络或稍后重试';
    if (/resolve|no such host|dns/i.test(reason)) return '订阅服务器域名解析失败；请检查网络与 DNS';
    if (/yaml|json|parse|html|empty|no proxies|unsupported|no nodes/i.test(reason)) return '订阅返回内容无法识别；请检查是否为有效的节点订阅或完整 Mihomo 配置';
    return '订阅下载或解析失败；请检查链接与返回格式';
  };

  const convertSubscriptionsLocally = async (sources = [], { preserveNames = false } = {}) => {
  const clean = preserveNames ? sources : normalizeSubSourceList(sources);
  if (!clean.length) return buildProviderUpdateResult([]);
  const subUrlChecks = clean.map((source) => ({ source, check: validateLocalSubscriptionUrl(source.url) }));
  if (subUrlChecks.some((item) => !item.check.ok)) {
    return buildProviderUpdateResult(subUrlChecks.map(({ source, check }) => ({
      type: 'proxy-provider',
      name: source.name,
      ok: false,
      attempts: 1,
      message: check.ok ? '订阅地址校验未通过；本地转换已停止' : (check.message || '订阅地址无效'),
      errorType: 'invalid_subscription_url',
    })));
  }
  if (!(await ensureCompatBackend())) return buildProviderUpdateResult(clean.map(s => ({name:s.name,ok:false,message:'订阅下载组件未就绪；请先修复组件'})));
  const path = '/data/kano_compat_fetch_' + Date.now() + '_' + createRandomString(6) + '.json';
  const staged = await stageTextBesideTarget(path, JSON.stringify({ sources: clean.map(s => ({name:s.name,url:s.url})), userAgent: await loadProviderUserAgent() }), 'subscription request');
  if (!staged.ok) return buildProviderUpdateResult(clean.map(s => ({name:s.name,ok:false,message:'订阅下载请求暂存失败；请检查设备连接与可用空间'})));
  let r;
  try {
    operationStage('下载并验证订阅');
    r = await f50Command('fetch-batch', 100000, [staged.stagePath]);
    const line = String(r.content || '').split(/\r?\n/).find(s => s.startsWith('F50_FETCH_RESULT='));
    let data = null;
    try { if (line) data = JSON.parse(line.slice('F50_FETCH_RESULT='.length)); } catch (_) {}
    const committed = !!r.success && data && data.ok === true && data.committed === true;
    const results = clean.map(s => {
      const found = data && Array.isArray(data.providers) && data.providers.find(p => p.name === s.name);
      return {type:'proxy-provider',name:s.name,ok:!!(committed && found && found.ok),attempts:1,
        proxyCount:found ? found.proxyCount : null,statusCode:found ? found.statusCode : 0,
        message:committed ? '' : formatSubscriptionDownloadError(found || {}, r.content),errorType:committed ? '' : 'local_download_failed',
        rawMessage:'',cacheAvailable:null};
    });
    return buildProviderUpdateResult(results, {ok:!!committed,via:'local',committed:!!committed, message:committed ? '' : (results.find(provider => !provider.ok)?.message || formatSubscriptionDownloadError({}, r.content))});
  } catch (_) {
    const message = '订阅下载失败：无法确认下载结果；请检查设备连接后重试';
    return buildProviderUpdateResult(clean.map(source => ({ type: 'proxy-provider', name: source.name, ok: false, attempts: 1,
      statusCode: 0, message, errorType: 'local_download_failed' })), { ok: false, via: 'local', committed: false, message });
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
          message: '本地转换已提交，但核心未返回节点来源刷新结果',
          proxyCount: null,
          cacheAvailable: null,
        };
      }
      const proxyCount = Number.isInteger(reloaded.proxyCount)
        ? reloaded.proxyCount
        : null;
      const emptyProvider = reloaded.ok && proxyCount === 0;
      const countMismatch = reloaded.ok && Number.isInteger(converted.proxyCount) && reloaded.proxyCount !== converted.proxyCount;
      const ok = reloaded.ok && !emptyProvider && !countMismatch;
      return {
        ...converted,
        ...reloaded,
        ok,
        errorType: ok ? '' : (emptyProvider ? 'empty_provider' : countMismatch ? 'provider_count_mismatch' : reloaded.errorType),
        message: ok ? '' : (emptyProvider ? '节点来源已刷新，但未返回可用节点' : countMismatch ? (proxyCount === null ? `订阅已下载 ${converted.proxyCount} 个节点，但无法读取核心节点数量` : `订阅已下载 ${converted.proxyCount} 个节点，核心加载 ${proxyCount} 个，数量不一致`) : reloaded.message),
        proxyCount,
        cacheAvailable: proxyCount === null ? null : proxyCount > 0,
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
      ? '运行配置未找到'
      : status.configReadStatus == 'invalid'
        ? '运行配置解析失败'
        : status.configReadStatus === 'unavailable' ? '未能解析配置' : '运行配置已加载';
    const parts = [
      status.configSource == 'uploaded_config' ? '自定义配置' : status.mode == 'original' || status.configSource == 'subscription_original' ? '旧订阅原配置（待迁移）' : '模板规则',
      configLabel,
      status.failedStage ? `失败阶段：${status.failedStage}` : '',
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
    if (panelLoadPromise) return panelLoadPromise;
    zashboardPanelUrl = '';
    const generation = statusSnapshotGeneration;
    const loadPromise = (async () => {
      const guard = await ensureZashboardPanelReady();
      if (!guard.ok) throw new Error(guard.message || 'Zashboard 校验失败');
      if (guard.repaired) createToast('Zashboard 配置或文件已自动修复', 'yellow', 7000);
      const hostPromise = waitForLanHost();
      try {
        const [host, info] = await Promise.all([hostPromise, buildControllerInfo()]);
        const url = `http://${host}:${info.port || F50_PORTS.controller}/ui/?_f50=${Date.now()}#/`;
        if (panelLoadPromise === loadPromise && generation === statusSnapshotGeneration && !info.usingFallbackController) zashboardPanelUrl = url;
        return url;
      } catch (e) {
        console.error(e);
        const host = await hostPromise;
        return `http://${host}:${F50_PORTS.controller}/ui/?_f50=${Date.now()}#/`;
      }
    })();
    panelLoadPromise = loadPromise;
    try {
      return await loadPromise;
    } finally {
      if (panelLoadPromise === loadPromise) panelLoadPromise = null;
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
        renderRuntimeStatus('unknown', '猫猫 - 进程状态无法读取', label);
        return false;
      }
      if (!pid && snapshot.installState === 'missing') {
        renderRuntimeStatus('stopped', '猫猫 - 未安装', label);
        return false;
      }
      renderRuntimeStatus(pid ? 'checking' : 'stopped', pid ? '猫猫 - 检查 API' : '猫猫 - 已停止', label);
      // Badges are supplementary: they must not delay the API indicator.
      Promise.allSettled([refreshRuleModeStatus(), refreshModeBadge()]);
      let apiOk = snapshot.apiOk === true;
      if (pid && typeof snapshot.apiOk !== 'boolean') {
        const info = snapshot.externalController !== undefined ? { ...normalizeController(snapshot.externalController || `127.0.0.1:${F50_PORTS.controller}`), secret: snapshot.secret || '', secretSet: !!snapshot.secret } : null;
        const version = await callMihomoApi('/version', 'GET', null, info, 3, { corePid: pid });
        apiOk = !!version.success;
      }
      if (requestId === runningStatusRequestId) renderRuntimeStatus(apiOk ? 'healthy' : pid ? 'error' : 'stopped',
        apiOk ? '猫猫 - API 正常' : pid ? '猫猫 - API 未通' : '猫猫 - 已停止', label);
      return !!pid;
    } catch (error) {
      if (requestId === runningStatusRequestId && label) label.title = f50Error(error?.message || error);
      if (requestId === runningStatusRequestId) renderRuntimeStatus('unknown', '猫猫 - 状态无法读取', label);
      return false;
    }
  };

  const askConfirm = (id, title, body, ok = '确认', cancel = '取消') => new Promise((resolve) => {
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

  const ensureInstalled = async () => await ensureCompatBackend();

  const ensureReady = async (options = {}) =>
    (await ensureAdvanced()) && (await ensureInstalled(options));





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
    /data/kano_subscription_save_* /data/kano_network_save_* /data/kano_subscription_urls_before_template_* \
    /data/kano_config_package_[0-9]* /data/kano_config_package_restore_* \
    ${shellQuote(KANO_YQ_RUNTIME_DIR)} ${shellQuote(KANO_INSTALL_TOOLBOX_DIR)}; do
    [ -e "$artifact" ] || [ -L "$artifact" ] || continue
    rm -rf "$artifact" || cleanup_rc=1
    if [ -e "$artifact" ] || [ -L "$artifact" ]; then
      printf 'UNINSTALL_ARTIFACT_REMAINS:%s\\n' "$artifact"
      cleanup_rc=1
    fi
  done
  # Never remove the shared UFI upload directory or another plugin's boot entries.
  for lock in /dev/kano_boot_write.lock /dev/kano_clash_boot.lock /dev/kano_policy_apply.lock; do
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


  const networkRescue = async ({ showOutput = true, preempt = false } = {}) => {
  if (recoveryInProgress) return false;
  recoveryInProgress = true;
  const interruptedOperations = [];
  if (preempt) {
    try {
      const checked = f50ShellReply(await hostRunShellWithRoot.call(globalThis,
        buildF50ShellBase() + buildF50ProcessHelpers() + buildF50RecoveryEligibilityFunctions() + '\nF50_RECOVERY_PREEMPT=1 f50_recovery_eligible', 10000));
      if (!checked?.success || !/^F50_RECOVERY_ELIGIBLE=1$/m.test(String(checked.content || ''))) {
        const detail = f50Diagnostic(checked?.content || 'F50_RECOVERY_STATE=check_unconfirmed').details;
        const summary = /^F50_RECOVERY_ELIGIBLE=0$/m.test(String(checked?.content || ''))
          ? '恢复失败；详见“状态与日志”' : '恢复失败：无法读取设备状态；请检查设备连接后重试';
        createToast(summary, 'red', 12000);
        lastInstallDiagnostic = { ...f50Diagnostic(detail), ok: false, summary };
        recoveryInProgress = false;
        return false;
      }
    } catch (error) {
      lastInstallDiagnostic = { ...f50Diagnostic(error.message || String(error)), ok: false, summary: '恢复失败：无法读取设备状态' };
      createToast('恢复失败：无法读取设备状态；请检查设备连接后重试', 'red', 12000);
      recoveryInProgress = false;
      return false;
    }
    for (const op of [activeCriticalOperation, transientShellOperation]) {
      if (!op) continue;
      interruptedOperations.push(op);
      op.token.cancelled = true;
      clearInterval(op.heartbeat);
    }
  }
  const own = preempt || !activeCriticalOperation;
  const progress = own ? createOperationProgress('恢复网络') : activeCriticalOperation.progress;
  try {
    if (progress) progress.stage('停止进程并释放接管规则');
    let nativeDetail = '';
    // Normal stop/rollback retains the known backend's journal restoration. Manual rescue never needs it.
    if (!preempt && !deviceTaskUncertain) {
      try {
        const trusted = await runShellWithRoot(`hash=$(sha256sum ${shellQuote(CLASH_SERVICE)} 2>/dev/null | awk '{print $1}')
case "$hash" in ${F50_TRUSTED_SERVICE_HASHES.join('|')}) echo F50_NATIVE_RECOVERY_TRUSTED=1 ;; esac`, 5000);
        if (trusted.success && /^F50_NATIVE_RECOVERY_TRUSTED=1$/m.test(String(trusted.content || ''))) {
          const native = await f50Command('recover', 60000);
          nativeDetail = 'F50_NATIVE_RECOVERY_RC=' + (native.success ? '0' : '1') + '\n' + f50Diagnostic(native.content).details + '\n';
        }
      } catch (error) { nativeDetail = 'F50_NATIVE_RECOVERY_UNCONFIRMED=1\n' + f50Diagnostic(error.message || String(error)).details + '\n'; }
    }
    if (!preempt && activeCriticalOperation && !activeCriticalOperation.leaseOwned) {
      throw new Error('未取得设备操作租约；停止操作未执行，请等待其他页面任务结束');
    }
    const canResume = !preempt && activeCriticalOperation?.leaseOwned && !activeCriticalOperation.uncertain &&
      !activeCriticalOperation.token.cancelled && !activeCriticalOperation.requests;
    const resumeTag = canResume ? f50TaskTag(activeCriticalOperation.token) : '';
    const r = f50ShellReply(await hostRunShellWithRoot.call(globalThis, buildF50EmergencyScript(resumeTag, !preempt && !canResume), 120000));
    const ok = !!r.success && /^RECOVERY_VERIFIED$/m.test(String(r.content || ''));
    if (ok) {
      for (const op of interruptedOperations) { op.recovered = true; op.leaseOwned = false; }
      deviceTaskUncertain = false;
    } else deviceTaskUncertain = true;
    const confirmed = ok || /^F50_(CLEAN_ERROR=|RECOVERY_(PARTIAL=1|ELIGIBLE=0|STATE=))/m.test(String(r.content || ''));
    const summary = ok ? (/^F50_RECOVERY_BACKUP=/m.test(r.content) ? '网络接管已释放，配置备份已保留' : '网络接管已释放')
      : /^F50_NETWORK_RELEASED=1$/m.test(r.content) ? (/^F50_RECOVERY_CONFIG_FAILED=1$/m.test(r.content)
        ? '网络接管已释放，但配置恢复失败；详见“状态与日志”' : '网络规则已释放，但配置恢复失败；详见“状态与日志”')
      : confirmed ? '恢复失败；详见“状态与日志”' : '恢复失败：无法读取执行结果；请检查设备连接后重试';
    lastInstallDiagnostic = { ...f50Diagnostic(nativeDetail + r.content), ok,
      summary };
    invalidateStatusSnapshot(); invalidateBinarySnapshot(); runtimePreflightCache = null;
    const resultDetail = ok ? '已停止核心并释放网络接管' : summary;
    if (own) { if (progress) progress.finish(ok, resultDetail); }
    else { operationFinish(ok, resultDetail); if (progress && ok) progress.stage('网络清理完成；正在等待设备租约释放'); }
    if (ok) renderRuntimeStatus('stopped', '猫猫 - 已停止', document.querySelector('#running_mm'));
    const resultToast = [summary, ok ? 'green' : 'red', ok ? 5000 : 15000];
    if (!own && ok) activeCriticalOperation.finalToast = resultToast;
    else createToast(...resultToast);
    if (showOutput || !ok) showInfoDialog('mm_network_rescue', ok ? (own ? '恢复完成' : '网络清理完成；正在收尾') : '恢复失败', '<pre style="white-space:pre-wrap;max-height:400px;overflow:auto">' + safeTextToHtml(sanitizeSubscriptionSecrets(r.content || '')) + '</pre>');
    return ok;
  } catch (error) {
    deviceTaskUncertain = true;
    lastInstallDiagnostic = { ...f50Diagnostic(error.message || String(error)), ok: false, summary: '恢复失败：无法读取执行结果' };
    if (own) { if (progress) progress.finish(false, '恢复失败；请检查设备连接后重试'); }
    else operationFinish(false, '恢复失败；请检查设备连接后重试');
    createToast('恢复失败：无法读取执行结果；请检查设备连接后重试', 'red', 12000); return false;
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






  const createConfigRollbackPoint = async (label = 'runtime') => {
    const safeLabel = String(label || 'runtime').replace(/[^A-Za-z0-9_]/g, '_');
    const res = await runShellWithRoot(`
        CONFIG=${shellQuote(CLASH_CONFIG)}
        stamp="$(date +%Y%m%d%H%M%S 2>/dev/null)"
        [ -n "$stamp" ] || stamp="$(cat /proc/uptime 2>/dev/null | cut -d. -f1)"
        backup="$CONFIG.before_${safeLabel}_\${stamp}_$$"
        if [ -f "$CONFIG" ]; then
          cp "$CONFIG" "$backup" || exit 1
          rm -f "$backup.source" "$backup.source.absent" || exit 1
          if [ -f ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} ]; then
            cp ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} "$backup.source" || exit 1
          else
            touch "$backup.source.absent" || exit 1
          fi
          chmod 600 "$backup" || exit 1
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

  const restoreConfigRollbackPoint = async (rollbackPath='',context='回滚',{showToast=true}={}) => {
  if (!rollbackPath) return false;
  const stagePath=CLASH_CONFIG+'.kano_rollback_'+Date.now()+'_'+createRandomString(6);
  const prepared=await runShellWithRoot(`set -e
umask 077
BACKUP=${shellQuote(rollbackPath)}
STAGE=${shellQuote(stagePath)}
[ -s "$BACKUP" ] && [ ! -L "$BACKUP" ] || exit 1
cp "$BACKUP" "$STAGE" && chmod 600 "$STAGE" || exit 1
if [ -f "$BACKUP.source" ]; then echo SOURCE_STATE=present
elif [ -f "$BACKUP.source.absent" ]; then echo SOURCE_STATE=absent
else echo SOURCE_STATE=unchanged; fi`,15000);
  let restored={ok:false,content:prepared.content};
  if (prepared.success) restored=await commitStagedYaml({targetPath:CLASH_CONFIG,stagePath,backup:false,
    preserveSecret:false,sourceStagePath:/^SOURCE_STATE=present$/m.test(prepared.content)?rollbackPath+'.source':null,
    removeSource:/^SOURCE_STATE=absent$/m.test(prepared.content)});
  if (showToast) createToast(escapeHtml(context)+(restored.ok?'失败；已恢复旧配置与来源标记':'失败，且配置未能回滚'),restored.ok?'yellow':'red',9000);
  return restored.ok;
};

  const restartClashWithConfigRollback = async (rollbackPath = null, context = '重启') => {
    appendTemplateFlowDebug(`enter restartClashWithConfigRollback context=${context}`);
    const ok = await restartClashOk({ skipCheck: true });
    appendTemplateFlowDebug(`leave restartClashWithConfigRollback ok=${ok ? '1' : '0'} context=${context}`);
    if (ok) return true;

    if (rollbackPath === null) {
      createToast(
        `${escapeHtml(context)}失败，且没有可用的 config.yaml 回滚点；已清理运行规则以避免断网。`,
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
      await networkRescue({ showOutput: false });
      createToast(
        removed.success
          ? `${escapeHtml(context)}失败；写入前没有 config.yaml，已移除新配置并清理网络规则。`
          : `${escapeHtml(context)}失败；写入前没有 config.yaml，且新配置移除失败。`,
        removed.success ? 'yellow' : 'red',
        12000,
      );
      await isMMRunning();
      return false;
    }

    appendTemplateFlowDebug(`restart failed, restoring config rollback=${rollbackPath}`);
    const restored = await restoreConfigRollbackPoint(rollbackPath, context, { showToast: false });
    if (!restored) {
      createToast(`${escapeHtml(context)}失败，且上一份 config.yaml 未能回滚。`, 'red', 12000);
      await isMMRunning();
      return false;
    }

    createToast('新配置启动失败，正在尝试用上一份 config.yaml 恢复核心…', 'yellow', 9000);
    const recoveryOk = await restartClashOk({ skipCheck: true });
    appendTemplateFlowDebug(`rollback recovery restart result=${recoveryOk ? '1' : '0'} context=${context}`);
    if (recoveryOk) {
      createToast(`${escapeHtml(context)}失败；上一份 config.yaml 已恢复，核心已重新启动。`, 'yellow', 12000);
    } else {
      await networkRescue({ showOutput: false });
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
    let uploadedPath = '';
    try {
      const preserveSubscription = ['uploaded_config', 'subscription_original'].includes(await readConfigSource());
      uploadedPath = await uploadFileToDevice(file);
      const foundFile = await runShellWithRoot(`
                        [ -s ${shellQuote(uploadedPath)} ] && echo 1 || echo 0
                    `);
      if (String(foundFile.content || '').trim() != '1') {
        throw '上传失败';
      }

      const stageRes = await runShellWithRoot(`
        set -e
        mkdir -p /data ${shellQuote(`${CLASH_DIR}/Tools`)}
        mv ${shellQuote(uploadedPath)} ${shellQuote(txBase)}
        cp ${shellQuote(txBase)} ${shellQuote(txTemplate)}
        chmod 600 ${shellQuote(txBase)} ${shellQuote(txTemplate)}
        [ -s ${shellQuote(txBase)} ] && [ -s ${shellQuote(txTemplate)} ] && echo TEMPLATE_STAGED
      `);
      if (!stageRes.success || !String(stageRes.content || '').includes('TEMPLATE_STAGED')) {
        throw stageRes.content || '模板临时落盘失败';
      }
      const yamlCheckRes = await runShellWithRoot(`
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        TEMPLATE=${shellQuote(txBase)}
        ${yqExecutableCheckCmd()}
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
        throw yamlCheckRes.content || '模板 YAML 校验未通过；已保留原 template.base.yaml 与 template.yaml';
      }

      let savedSources = await readSavedSubSourcesForTemplate();
      let templateSubSourcesToPersist = [];
      let templateSubSyncMessage = '';
      const templateSources = await readTemplateProviderSubSources(txBase, txTemplate);
      if (preserveSubscription) {
        savedSources = templateSources;
      } else if (templateSources.length > 0) {
        const savedKey = normalizeSubSourceList(savedSources).map((source) => source.url).join('\n');
        const templateKey = normalizeSubSourceList(templateSources).map((source) => source.url).join('\n');
        if (savedSources.length == 0) {
          savedSources = templateSources;
          templateSubSourcesToPersist = templateSources;
          templateSubSyncMessage = '已从模板 proxy-providers 导入订阅链接，并统一命名为 Provider1、Provider2 等。';
        } else if (savedKey != templateKey) {
          const oldSources = normalizeSubSourceList(savedSources);
          const newSources = normalizeSubSourceList(templateSources);
          const confirmed = await askConfirm(
            `mm_template_sub_replace_confirm_${createRandomString(4)}`,
            '替换订阅链接？',
            `模板包含 ${newSources.length} 个订阅链接；将替换当前已保存的 ${oldSources.length} 个链接。`,
            '替换',
            '取消',
          );
          if (!confirmed) return false;
          const oldCount = savedSources.length;
          savedSources = templateSources;
          templateSubSourcesToPersist = templateSources;
          templateSubSyncMessage = `已按新模板的 proxy-providers 替换订阅链接：${oldCount} 个 → ${templateSources.length} 个。`;
        } else {
          savedSources = templateSources;
        }
      }
      if (!(await prepareTemplateFromBase(savedSources, { templateBasePath: txBase, templatePath: txTemplate }))) {
        throw '准备模板失败；已保留原 template.base.yaml 与 template.yaml';
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
          throw `备份旧订阅链接失败\n${subBackupRes.content || ''}`.trim();
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
          throw '订阅链接写入失败；已保留原 template.base.yaml 与 template.yaml';
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
        throw commitRes.content || '模板提交失败；已尝试恢复原模板';
      }
      if (templateSubSyncMessage) {
        createToast(templateSubSyncMessage, 'yellow', 7000);
      }
      createToast('模板已保存；请在“配置与规则”中点击“应用模板”写入 config.yaml。', 'green');
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
        `模板上传失败<br>${textToHtml(sanitizeSubscriptionSecrets(e && e.message ? e.message : e || '未返回错误信息'))}`,
        'red',
        9000,
      );
      return false;
    } finally {
      if (uploadedPath) await hostRunShellWithRoot.call(globalThis, `rm -f ${shellQuote(uploadedPath)}`, 5000);
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
          <button style="font-size:.64rem" id="${closeId}">关闭</button>
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
        ? '控制地址：使用默认值'
        : '控制地址：已读取配置',
      info.usingFallbackSecret
        ? '访问密钥：配置中未设置'
        : '访问密钥：已读取配置',
    ].join('<br>');
    const { el, close } = createFixedToast(
      id,
      `<div style="pointer-events:all;width:92vw;max-width:620px;">
        <div class="title" style="margin:0">面板连接</div>
        <div style="margin-top:10px;font-size:.66rem;line-height:1.65;">
          <div id="${statusId}" style="margin-bottom:10px;padding:8px;border:1px solid rgba(148,163,184,.25);border-radius:10px;background:rgba(15,23,42,.45);">${sourceRows}</div>
          <label style="display:block;margin-bottom:8px;">
            <span style="display:block;margin-bottom:4px;">控制地址</span>
            <input id="${controllerId}" type="text" autocomplete="off" style="width:100%;box-sizing:border-box;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:#0f172a;color:#dbeafe;padding:8px;font-size:.66rem;" />
          </label>
          <div style="display:block;margin-bottom:8px;">
            <span style="display:block;margin-bottom:4px;">访问密钥</span>
            <div style="display:flex;gap:8px;align-items:center;">
              <input id="${secretId}" type="password" autocomplete="off" style="flex:1;min-width:0;box-sizing:border-box;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:#0f172a;color:#dbeafe;padding:8px;font-size:.66rem;" />
              <button id="${secretToggleId}" type="button" aria-controls="${secretId}" aria-pressed="false" title="显示密码" style="flex:0 0 auto;font-size:.64rem;white-space:nowrap;">显示</button>
            </div>
          </div>
        </div>
        <div class="kano-dialog-actions kano-actions-3" style="--kano-action-count:3;margin-top:12px;">
          <button style="font-size:.64rem" id="${checkId}">测试</button>
          <button style="font-size:.64rem;background:var(--dark-btn-color-active)" id="${saveId}">保存</button>
          <button style="font-size:.64rem" id="${closeId}">关闭</button>
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
      secretToggleBtn.textContent = show ? '隐藏' : '显示';
      secretToggleBtn.title = show ? '隐藏密码' : '显示密码';
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
      setButtonBusy(checkBtn, true, '检查中\u2026');
      try {
        const res = await callMihomoApi('/version', 'GET', null, checked.info);
        setStatus(
          res.success
            ? `连接正常：HTTP ${res.statusCode}`
            : `连接失败：HTTP ${res.statusCode || '无'}\n${res.responseText || ''}`.trim(),
          res.success ? '#bbf7d0' : '#fecaca',
        );
      } finally {
        setButtonBusy(checkBtn, false);
      }
    };

    saveBtn.onclick = async () => {
      return runCriticalButtonOperation('保存面板连接', saveBtn, '保存中\u2026', async () => {
        const res = await saveControllerSettings(controllerInput.value, secretInput.value);
        if (!res.ok) {
          setStatus(res.message || '保存失败', '#fecaca');
          return;
        }
        const checkText = res.connectivity && res.connectivity.success
          ? `连接正常：HTTP ${res.connectivity.statusCode}`
          : `连接失败：HTTP ${(res.connectivity && res.connectivity.statusCode) || '无'}`;
        setStatus(`已保存\n${checkText}`, res.connectivity && res.connectivity.success ? '#bbf7d0' : '#fde68a');
        createToast(res.connectivity && res.connectivity.success ? 'Web 面板连接已保存' : 'Web 面板连接已保存，但连接测试失败', res.connectivity && res.connectivity.success ? 'green' : 'yellow', 6000);
        if (afterSave) await afterSave();
      });
    };
  };

  const showStatusDiagnostic = async () => {
    // 单项探测失败不应让整个诊断无法打开；降级项在结果里标出。
    const degraded = [];
    const settle = (label, promise, fallback) => Promise.resolve(promise).catch((error) => {
      degraded.push(`${label}：${sanitizeSubscriptionSecrets(error && error.message ? error.message : String(error))}`);
      return fallback;
    });
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
        if [ -f "$START_LOG" ]; then tail -n 100 "$START_LOG" 2>/dev/null || echo "（无法读取启动日志）"; else echo "（暂无启动输出）"; fi
        echo
        echo "[Clash 内核运行日志]"
        if [ -f "$RUN_LOG" ]; then tail -n 100 "$RUN_LOG" 2>/dev/null || echo "（无法读取内核日志）"; else echo "（暂无内核日志）"; fi
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
      settle('运行状态', runtimeStatePromise, { state: 'unknown', message: '读取失败' }),
      settle('开机自启', bootStatePromise, { state: 'unknown', message: '读取失败' }),
      settle('核心进程', pidPromise, ''),
      settle('控制地址', controllerInfoPromise, {
        raw: '', apiBase: '未读取', externalController: '', secretSet: false, usingFallbackController: false,
      }),
      settle('网络设置', readPolicyState(), { options: {} }),
      settle('配置文件', configPromise, { success: false, content: '' }),
      settle('核心进程详情', processPromise, { success: false, content: '' }),
      settle('运行日志', logPromise, { success: false, content: '' }),
      settle('控制 API', versionPromise, { success: false, statusCode: 0, message: '未读取' }),
      settle('活动连接', connectionsPromise, { success: false, responseText: '' }),
    ]);
    const configLines = String(configRes.content || '').split('\n');
    const configExists = (configLines.find((line) => line == 'exists=1'));
    const configSize = (configLines.find((line) => line.startsWith('size=')) || 'size=0')
      .replace(/^size=/, '');
    const proc = parseKeyValueOutput(processRes.content || '');
    let connectionStatus = pid
      ? (connectionsRes.success ? '已连接' : '无法读取')
      : '核心未运行';
    if (connectionsRes.success) {
      try {
        const connectionData = JSON.parse(connectionsRes.responseText || '{}');
        connectionStatus = `${Array.isArray(connectionData.connections) ? connectionData.connections.length : 0} 个`;
      } catch {
        connectionStatus = '响应格式不受支持';
      }
    }
    const [providerHealth,panelHealth] = await Promise.all([
      settle('节点来源', callMihomoApi('/providers/proxies','GET',null,controllerInfo,5,{corePid:pid}), { success: false }),
      settle('Zashboard', Promise.resolve().then(() =>
        runShellWithRoot(buildF50ShellBase()+buildF50PanelHelpers()+'\nf50_verify_zashboard_endpoint',12000)), { success: false, content: '' }),
    ]);
    const health=f50HealthLayers({pid,api:versionRes,panel:panelHealth,provider:providerHealth});
    // 主表只给结论，逐字段明细收进折叠区：默认 9 行，不再平铺 23 行。
    const runStateLabels = {
      healthy: '运行正常', installed_stopped: '已安装未运行', running_api_unavailable: '运行中但 API 不可用',
      not_installed: '未安装', damaged: '文件缺失或不可执行',
    };
    const bootLabels = { disabled: '未配置', direct: '原生自启', managed: '托管自启', manager_damaged: '自启配置损坏', incomplete: '自启不完整' };
    const modeLabel = !policyState.options.traffic_mode
      ? '模式未读取'
      : (policyState.options.traffic_mode == 'tun' ? 'TUN' : (policyState.options.traffic_mode == 'off' ? '接管已关闭' : 'TProxy'));
    const ipv6Label = !policyState.options.ipv6 ? 'IPv6 未读取' : (policyState.options.ipv6 == 'on' ? 'IPv6 开' : 'IPv6 关');
    const configLabel = configExists ? `config.yaml ${(Number(configSize) / 1024).toFixed(1)} KB` : 'config.yaml 缺失';
    const coreLabel = !pid ? '未运行' : (proc.PROCESS_KIND == 'config_test' ? '仅配置测试进程' : '运行中');
    const apiLabel = !pid ? '核心未运行' : (versionRes.success ? `正常（HTTP ${versionRes.statusCode}）` : (versionRes.message || '不可用'));
    // 异常项集中到「总览」一行，正常时逐行比对没有意义。
    const problems = [];
    if (!pid) problems.push('核心未运行');
    else {
      if (proc.PROCESS_KIND == 'config_test') problems.push('核心未真正运行');
      if (proc.PORT_7788 != '1') problems.push('7788 未监听');
      if (!versionRes.success) problems.push('控制 API 不可用');
      if (proc.CORE_ELF != '1') problems.push('Core 文件不可识别');
    }
    if (proc.STALE_TEST_PIDS) problems.push(`遗留测试进程 ${proc.STALE_TEST_PIDS}`);
    if (!configExists) problems.push('config.yaml 缺失');
    if (runtimeState.state != 'healthy') problems.push(`运行状态 ${runStateLabels[runtimeState.state] || runtimeState.state}`);
    if (!/可访问/.test(String(health.panel || ''))) problems.push('面板不可访问');
    // 复用 f50HealthLayers 的解析结论：请求成功但格式错误/部分来源读不到时，总览同样要报出来。
    const providerProblems = Array.isArray(health.providerProblems)
      ? health.providerProblems
      : (providerHealth.success ? [] : ['节点来源读取失败']);
    for (const item of providerProblems) problems.push(item);
    if (degraded.length) problems.push(`${degraded.length} 项读取失败`);
    const rows = [
      ['总览', problems.length ? `需注意：${problems.join('；')}` : '正常'],
      ['安装与启动', `${runStateLabels[runtimeState.state] || runtimeState.state} · 自启 ${bootLabels[bootState.state] || bootState.state}`],
      ['核心进程', `${coreLabel}${pid ? ` · PID ${pid}` : ''} · ${proc.PORT_7788 == '1' ? '7788 已监听' : '7788 未监听'}`],
      ['控制 API', apiLabel],
      ['运行配置', `${modeLabel} · ${ipv6Label} · ${configLabel}`],
      ['Web 面板', health.panel],
      ['节点来源', health.providers],
      ['活动连接', connectionStatus],
      ['未实测', `${health.unverified || '数据面接管、代理连通性'}（进程与 API 状态不能替代）`],
      ...(degraded.length ? [['读取降级', degraded.join('；')]] : []),
    ];
    const detailRows = [
      ['控制地址', `${controllerInfo.externalController}${controllerInfo.usingFallbackController ? '（默认值）' : '（已读取配置）'}`],
      ['API 地址', controllerInfo.apiBase],
      ['访问密钥', controllerInfo.secretSet ? '已配置' : '未设置'],
      ['核心命令行', proc.CMDLINE || '无'],
      ['进程类型', proc.PROCESS_KIND == 'runtime' ? '真实运行核心' : (proc.PROCESS_KIND == 'config_test' ? '配置测试进程（不计为运行）' : '无')],
      ['遗留测试进程', proc.STALE_TEST_PIDS || '无'],
      ['Core 文件', `${proc.CORE_SIZE || 0} bytes${proc.CORE_ELF == '1' ? '，ELF' : '，非ELF/不可识别'}`],
      ['预检信息', runtimeState.message || '无'],
      ['开机自启', `${bootState.state}${bootState.message ? `：${bootState.message}` : ''}`],
    ];
    const renderRows = (list) => list.map(([key, value]) =>
      `<div style="display:grid;grid-template-columns:minmax(96px,34%) 1fr;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.12);">
        <strong>${escapeHtml(key)}</strong><span style="word-break:break-all;">${escapeHtml(value)}</span>
      </div>`).join('');
    showInfoDialog(
      'mm_status_diagnostic',
      '运行日志与诊断',
      `${renderRows(rows)}
      <details style="margin-top:10px;"><summary>详细信息</summary>${renderRows(detailRows)}</details>
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
      if (errorToast) createToast(`无法读取配置自检环境<br>${safeTextToHtml(runtimeRes.content || '')}`, 'red', 9000);
      return false;
    }
    const values = {};
    String(runtimeRes.content || '').split('\n').forEach((line) => {
      const index = line.indexOf('=');
      if (index > 0) values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    });
    const trafficMode = runtimeOptions.traffic_mode;
    const ipv6Enabled = runtimeOptions.ipv6 == 'on';
    const storage = await ensurePolicyStorage();
    if (!storage.ok) {
      if (errorToast) createToast(`配置自检失败<br>${safeTextToHtml(storage.content || '')}`, 'red', 9000);
      return false;
    }

    const read = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    if (!read.ok) {
      if (errorToast) createToast(`配置自检与修复失败；原 config.yaml 未改写<br>${safeTextToHtml(read.message || '')}`, 'red', 10000);
      return false;
    }

    let config;
    try {
      config = cloneJsonValue(read.value);
      applyRequiredF50Fields(config, { preserveConfig: values.config_source === 'subscription_original' });

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
      if (errorToast) createToast(`配置自检与修复失败；原 config.yaml 未改写<br>${safeTextToHtml(e.message || e)}`, 'red', 10000);
      return false;
    }

    let shaped;
    try { shaped = await kprShapeRuntimeConfig(config, runtimeOptions); }
    catch (error) { if (errorToast) createToast(safeTextToHtml(error.message || String(error)), 'red', 9000); return false; }
    const write = JSON.stringify(shaped) === JSON.stringify(read.value)
      ? { ok: true }
      : await kprBaseWriteYamlObjectAtomic(CLASH_CONFIG, shaped, { label: 'config.yaml', backup: true, backupTag: 'f50_sanitize' });
    if (!write.ok) {
      if (errorToast) createToast(`配置自检与修复失败；原 config.yaml 未改写<br>${safeTextToHtml(write.content || '')}`, 'red', 12000);
      return false;
    }
    if (showToast) {
      createToast(
        `配置已整理<br>${escapeHtml(trafficMode.toUpperCase())} · IPv6 ${ipv6Enabled ? '已开启' : '已关闭'} · 端口 ${F50_PORTS.tproxy}`,
        'green',
        6000,
      );
    }
    return true;
  };



  const btn_enabled = document.createElement('button');
  btn_enabled.classList.add('btn');
  btn_enabled.textContent = '在线安装/更新';
  btn_enabled.onclick = installF50PackageFromNetwork;
  const localPackageBtn = document.createElement('button');
  localPackageBtn.classList.add('btn');
  localPackageBtn.textContent = '导入组件包';
  localPackageBtn.onclick = chooseF50Package;
  const btn_disabled = document.createElement('button');
  btn_disabled.classList.add('btn', 'kano-danger');
  btn_disabled.textContent = '卸载插件';

btn_disabled.onclick = async () => {
  const operationToken = acquireCriticalOperation('卸载猫猫', null, true);
  if (!operationToken) return;
  setButtonBusy(btn_disabled, true, '卸载中\u2026');
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
      renderRuntimeStatus('stopped', '猫猫 - 未安装', document.querySelector('#running_mm'));
      const ruleStatus = document.querySelector('#mm_rule_mode_status'); if (ruleStatus) ruleStatus.textContent = '猫猫组件已删除';
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
    await releaseCriticalOperation(operationToken);
  }
};


  const normalizeMac = (value = '') => {
    const text = String(value || '').replace(/#.*$/g, '').trim();
    if (!/^(?:[0-9a-f]{12}|(?:[0-9a-f]{2}:){5}[0-9a-f]{2}|(?:[0-9a-f]{2}-){5}[0-9a-f]{2}|(?:[0-9a-f]{4}\.){2}[0-9a-f]{4})$/i.test(text)) return '';
    const compact = text.replace(/[:.-]/g, '').toUpperCase();
    if (compact === '000000000000' || (parseInt(compact.slice(0, 2), 16) & 1)) return '';
    return compact.match(/.{2}/g).join(':');
  };







  const ensurePolicyToolsScript = async () => await ensureCompatBackend();

  const parsePolicyOptionsText = (text='')=>{
 const options={traffic_mode:'',transparent:'on',ipv6:'off',tun_stack:'auto',quic_block:'off',dns_hijack:'on',dns_port:String(F50_PORTS.dns),tproxy_port:String(F50_PORTS.tproxy),proxy_group:'Proxy'};
 for(const line of String(text).split(/\r?\n/)){const m=line.match(/^([A-Za-z0-9_]+)=(.*)$/);if(m)options[m[1]]=m[2]}
 if(!['tproxy','tun','off'].includes(options.traffic_mode))options.traffic_mode=options.transparent==='off'?'off':'tproxy';
 options.dns_port=String(F50_PORTS.dns);options.tproxy_port=String(F50_PORTS.tproxy);return options;
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
    if (!res.success) throw new Error('无法读取网络设置；配置未修改');
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
    if (!state.options || !['tproxy', 'tun', 'off'].includes(state.options.traffic_mode) || !['auto', 'mixed', 'gvisor', 'system', 'mips'].includes(state.options.tun_stack || 'auto') || !Number.isInteger(Number(state.options.dns_port)) || Number(state.options.dns_port) < 1 || Number(state.options.dns_port) > 65535) {
      createToast('流量模式或 DNS 端口无效', 'red', 8000);
      return false;
    }
    const normalizedDevice = normalizeDeviceBypassText(state.deviceBypass || '');
    if (normalizedDevice.invalid.length > 0) {
      createToast(`直连设备列表格式错误：<br>${textToHtml(normalizedDevice.invalid.slice(0, 8).join('\n'))}`, 'red', 8000);
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
      : String(F50_PORTS.dns);
    const proxyGroup = String(state.options.proxy_group || 'Proxy').replace(/[\r\n]/g, '').trim() || 'Proxy';
    const subRuleMode = await readCurrentSubRuleMode();
    const optionsText = [
      `traffic_mode=${trafficMode}`,
      `transparent=${transparent}`,
      `ipv6=${ipv6}`,
      `tun_stack=${state.options.tun_stack || 'auto'}`,
      `quic_block=${quicBlock}`,
      `dns_hijack=${dnsHijack}`,
      `dns_port=${dnsPort}`,
      `proxy_group=${proxyGroup}`,
      `private_route_enabled=${state.options.private_route_enabled || "off"}`,
      `private_route_cidrs=${state.options.private_route_cidrs || ""}`,
      `private_route_policy=${state.options.private_route_policy || ""}`,
      `KANO_SUB_RULE_MODE=${subRuleMode}`,
      '',
    ].join('\n');
    const directDomain = normalizeDomainRuleText(state.directDomain || '');
    const directIp = normalizeIpRuleText(state.directIp || '');
    const proxyDomain = normalizeDomainRuleText(state.proxyDomain || '');
    const rejectDomain = normalizeDomainRuleText(state.rejectDomain || '');
    if (!(await ensurePolicyToolsScript({ syncStorage: false }))) return false;
    const bootEnabled = await checkIsBootUp();
    const snapshotPolicyFilesCmd = policyTransactionFiles()
      .map((path, index) => `snapshot_transaction_file ${index} ${shellQuote(path)}`)
      .join('\n');
    const restorePolicyFilesCmd = policyTransactionFiles()
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
            restore_policy_transaction || { echo "F50_RECOVERY_POLICY=$TX"; exit 1; }
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
        mkdir -p ${shellQuote(CLASH_DIR + "/Tools")}
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
        write_policy_file ${shellQuote(CLASH_SUB_RULE_MODE_FILE)} 600 ${shellQuote(`KANO_SUB_RULE_MODE=${subRuleMode}\n`)}
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
      createToast(`策略配置保存失败<br>${safeTextToHtml(res.content || '')}`, 'red', 8000);
      return false;
    }
    invalidateBinarySnapshot();
    if (apply) {
      if (res.success && policyOutput.includes('POLICY_RULES_APPLIED')) {
        createToast('策略规则已应用并生效', 'green', 7000);
        return true;
      }
      const recoveryOk = policyOutput.includes('POLICY_APPLY_ROLLBACK=restored')
        && policyOutput.includes('POLICY_APPLY_RECOVERY=reapplied');
      createToast(
        recoveryOk
          ? '新策略应用失败；已恢复并重新应用上一版策略'
          : `新策略应用失败，且上一版策略恢复不完整<br>${safeTextToHtml(policyOutput)}`,
        recoveryOk ? 'yellow' : 'red',
        10000,
      );
      return false;
    }
    if (!res.success || !policyOutput.includes('POLICY_STATE_SAVED')) {
      createToast(`策略配置保存失败<br>${safeTextToHtml(policyOutput)}`, 'red', 8000);
      return false;
    }
    if (!activeCriticalOperation) createToast('策略配置已保存', 'green');
    return true;
  };

  const applyPolicyToolsRules = async ({ ensureScript = true } = {}) => {
    if (ensureScript && !(await ensurePolicyToolsScript())) return false;
    if (!(await getCorePid())) {
      createToast('规则脚本已更新；核心未运行，接管规则未下发', 'yellow', 7000);
      return false;
    }
    const res = await runShellWithRoot(`${shellQuote(CLASH_POLICY_SCRIPT)} apply`);
    if (!res.success || !String(res.content || '').includes('POLICY_APPLY_OK')) {
      createToast(`策略规则应用失败<br>${safeTextToHtml(res.content || '')}`, 'red', 9000);
      return false;
    }
    createToast('策略规则已应用并生效', 'green', 7000);
    return true;
  };

  const reapplyPolicyRulesSilent = async ({ ensureScript = true } = {}) => {
    if (ensureScript && !(await ensurePolicyToolsScript())) return false;
    const mode = await callMihomoApi('/configs', 'PATCH', { mode: 'rule' });
    const res = mode.success
      ? await runShellWithRoot(`${shellQuote(CLASH_POLICY_SCRIPT)} apply 2>&1`)
      : { success: false, content: mode.message || mode.responseText };
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
    if (!res.success) throw new Error('无法读取客户端列表（邻居表）');
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
      createToast('网络规则脚本不存在；请在“检查修复”中点“重建网络规则”。', 'yellow', 7000);
      return;
    }
    const res = await runShellWithRoot(`${shellQuote(CLASH_POLICY_SCRIPT)} status`);
    showInfoDialog('mm_policy_status', '网络与规则状态', `<pre style="white-space:pre-wrap;background:rgba(0,0,0,.78);color:#0f0;padding:10px;max-height:420px;overflow:auto;">${escapeHtml(res.content || '暂无状态')}</pre>`);
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
              <div class="kp-title">网络设置</div>
            </div>
          </div>

          <div class="kp-body">
            <div class="kp-nav">
              <button type="button" class="kp-tab" data-policy-tab="network">流量模式</button>
              <button type="button" class="kp-tab" data-policy-tab="device">直连设备</button>
              <button type="button" class="kp-tab" data-policy-tab="private">私网定向代理</button>
              <button type="button" class="kp-tab" data-policy-tab="maintain">检查修复</button>
            </div>

            <div class="kp-main">
              <section class="kp-panel" data-policy-panel="network">
                <div class="kp-card">
                  <div class="kp-card-title">流量模式</div>
                  <div class="kp-desc">TProxy 接管下游设备流量；TUN 由 Mihomo 创建接口，控制器建立路由。</div>
                  <div class="kp-row">
                    <div class="kp-label">接管模式</div>
                    <select id="mm_policy_traffic_mode"><option value="tproxy">TProxy：接管 F50 转发流量</option><option value="tun">TUN：独立接口与路由</option><option value="off">关闭：核心运行，流量不接管</option></select>
                  </div>
                  <div class="kp-row">
                    <div class="kp-label">IPv6</div>
                    <label><input id="mm_policy_ipv6" type="checkbox"> 启用 IPv6 接管规则</label>
                  </div>
                  <div class="kp-row">
                    <div class="kp-label">TUN 协议栈</div>
                    <div><select id="mm_policy_tun_stack"><option value="auto">自动：优先 mips，旧内核回退</option><option value="mixed">mixed</option><option value="gvisor">gVisor</option><option value="system">system</option><option value="mips">mips</option></select><div class="kp-mini">Mihomo v${F50_MIPS_MIN_VERSION} 或以上优先 mips；旧内核 IPv4 用 mixed，双栈用 gVisor。手动选择保留。</div></div>
                  </div>
                  <div class="kp-row">
                    <div class="kp-label">QUIC</div>
                    <label><input id="mm_policy_quic" type="checkbox"> 拦截下游 UDP/443（直连设备、私网定向代理除外）</label>
                  </div>
                  <div class="kp-row">
                    <div class="kp-label">DNS 劫持</div>
                    <label><input id="mm_policy_dns" type="checkbox"> 劫持 53 到 Mihomo DNS 端口 <input id="mm_policy_dns_port" readonly disabled title="固定 DNS 端口" style="width:82px;margin-left:6px;" value="${F50_PORTS.dns}"></label>
                  </div>
                </div>
              </section>

              <section class="kp-panel" data-policy-panel="device">
                <div class="kp-card">
                  <div class="kp-card-title">直连设备</div>
                  <div class="kp-desc">列表中的 IP、网段或 MAC 不经过代理。</div>
                  <div id="mm_policy_device_scope" class="kp-scope-note" role="status"></div>
                  <textarea id="mm_policy_device" spellcheck="false" placeholder="192.168.0.50&#10;fd00::/64&#10;AA:BB:CC:DD:EE:FF"></textarea>
                  <div class="kp-actions" style="margin-top:9px;">
                    <button type="button" id="mm_policy_scan_clients">扫描客户端</button>
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
                    <button type="button" id="mm_policy_fix_runtime_config">修复运行配置</button>
                    <span>校正 TProxy、TUN、IPv6 和 DNS 所需配置，然后重启核心；不会删除订阅或模板配置。</span>
                  </div>
                  <div class="kp-maintain-item">
                    <button type="button" id="mm_policy_repair">重建网络规则</button>
                    <span>重写策略脚本并重建 KANO_* iptables/ip6tables 链；不修改 config.yaml。</span>
                  </div>
                  <div class="kp-maintain-item">
                    <button type="button" id="mm_policy_status_btn">查看规则状态</button>
                    <span>显示实际使用的 iptables 后端、直连设备列表和当前规则链，不会改动配置。</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="kp-footer">
            <div class="kp-footer-right">
              <button type="button" id="mm_policy_save_apply">保存并应用</button>
              <button type="button" id="mm_policy_close">关闭</button>
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
    get('#mm_policy_tun_stack').value = state.options.tun_stack || 'auto';
    get('#mm_policy_quic').checked = state.options.quic_block == 'on';
    get('#mm_policy_dns').checked = state.options.dns_hijack == 'on';
    get('#mm_policy_dns_port').value = state.options.dns_port || String(F50_PORTS.dns);
    get('#mm_policy_device').value = state.deviceBypass || '';
    const updateDeviceBypassScope = () => {
      const mode = get('#mm_policy_traffic_mode').value;
      const note = get('#mm_policy_device_scope');
      const disabled = mode !== 'tproxy';
      get('#mm_policy_tun_stack').disabled = mode !== 'tun';
      get('#mm_policy_device').disabled = disabled;
      get('#mm_policy_scan_clients').disabled = disabled;
      if (disabled) get('#mm_policy_clients').innerHTML = '';
      note.classList.toggle('kp-warning', disabled);
      setText(note, mode === 'tun'
        ? 'TUN 使用固定路由接管，直连设备已暂停生效；名单保留，切回 TProxy 后自动恢复。'
        : mode === 'off' ? '流量接管已关闭；名单保留但不生效。'
        : '名单优先于私网代理；IP 只匹配该地址，MAC 匹配其全部 IP。不要将下级路由器 MAC 当作单台设备。');
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
      setText(box, '扫描中…');
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
          setText(box, '未扫描到客户端；设备产生流量后才会出现在 ARP 表中。');
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
          addIp.textContent = '添加 IP';
          const addMac = document.createElement('button');
          addMac.className = 'add_mac';
          addMac.title = '将包含此 MAC 的全部 IPv4/IPv6 地址；若为下级路由器，可能代表多台设备';
          addMac.style.fontSize = '.58rem';
          addMac.dataset.mac = mac || '';
          addMac.textContent = '添加 MAC';
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
            const yes = await askConfirm('mm_mac_scope', '按 MAC 添加直连设备？', '将包含此 MAC 的全部 IP；若为下级路由器，可能代表多台终端。');
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
      return runCriticalButtonOperation('修复代理配置', btn, '修复中\u2026', async () => {
        await restartClashOk({ skipCheck: true });
      });
    };

    get('#mm_policy_repair').onclick = async () => {
      const btn = get('#mm_policy_repair');
      return runCriticalButtonOperation('修复策略规则', btn, '应用中…', async () => {
        if (await ensurePolicyToolsScript()) await applyPolicyToolsRules({ ensureScript: false });
      });
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
      showInfoDialog('kpr_status_dialog', '私网定向代理检查', '<pre style="white-space:pre-wrap">' + escapeHtml(liveStatus + '\n' + (response.content || '无输出')) + '</pre><p>规则存在不代表远端服务可达；请从下游设备访问实际 TCP/UDP 服务验证。</p>');
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
          tun_stack: get('#mm_policy_tun_stack').value,
          quic_block: get('#mm_policy_quic').checked ? 'on' : 'off',
          dns_hijack: get('#mm_policy_dns').checked ? 'on' : 'off',
          dns_port: get('#mm_policy_dns_port').value,
          private_route_enabled: selected.enabled ? 'on' : 'off',
          private_route_cidrs: selected.cidrs.join(' '),
          private_route_policy: selected.policy,
        }, deviceBypass: get('#mm_policy_device').value };
        await kprSaveNetworkState(state, next);
        get('#mm_policy_traffic_mode').value = state.options.traffic_mode;
        get('#mm_policy_ipv6').checked = state.options.ipv6 === 'on';
        get('#mm_policy_tun_stack').value = state.options.tun_stack || 'auto';
        get('#mm_policy_quic').checked = state.options.quic_block === 'on';
        get('#mm_policy_dns').checked = state.options.dns_hijack === 'on';
        get('#mm_policy_dns_port').value = String(F50_PORTS.dns);
        get('#mm_policy_device').value = state.deviceBypass || '';
        get('#kpr_enabled').checked = state.options.private_route_enabled === 'on';
        get('#kpr_cidrs').value = state.options.private_route_cidrs || '';
        get('#kpr_policy').value = state.options.private_route_policy || '';
        get('#mm_policy_traffic_mode').dispatchEvent(new Event('change'));
      } catch (error) {
        createToast(safeTextToHtml(error.message || String(error)), 'red', 10000);
      } finally {
        setButtonBusy(button, false);
        await releaseCriticalOperation(token);
      }
    };
  };

  const stopClash = async () => await networkRescue({showOutput:false});


  const restartClash = async ({ skipCheck = false, preferReload = false, policyReady = false, preparedConfig = null } = {}) => {
  if (!skipCheck && !(await ensureReady())) return f50StartResult({success:false,content:'F50_START_CODE=backend_not_ready'});
  operationStage('验证固定配置并启动核心');
  if (preparedConfig) {
    // preparedConfig 已由 kprShapeRuntimeConfig 整形，直接落盘，避免二次整形与重复 Core -t。
    const write = await kprBaseWriteYamlObjectAtomic(CLASH_CONFIG, preparedConfig, {label:'config.yaml',backup:false});
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
  createToast(result.summary, result.panelFailed ? 'yellow' : 'green');
  return result;
};
  const restartClashOk = async options => (await restartClash(options)).ok;

  const btn_restart = document.createElement('button');
  btn_restart.classList.add('btn');
  btn_restart.textContent = '重启核心';
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
        createToast(`模板文件大小不能超过 ${2} MB`, 'red');
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
    const requiredNames = backupFiles.filter((item) => !item.optional).map((item) => item.label);
    const restoreOrderText = restoreFiles.map((item) => item.label).join('\n');
    const confirmed = await askConfirm(
      `mm_config_package_restore_confirm_${createRandomString(4)}`,
      '导入配置包？',
      `将按以下顺序回灌配置文件：<br>${textToHtml(restoreOrderText)}<br><br>缺少任一必要文件时不会覆盖现有配置。`,
      '开始导入',
      '取消',
    );
    if (!confirmed) return false;

    const isZipPackage = /\.zip$/i.test(file.name || '');
    const isTarPackage = /\.(tar\.gz|tgz)$/i.test(file.name || '');
    if (!isZipPackage && !isTarPackage) {
      createToast('仅支持 .tar.gz、.tgz 或 .zip 格式的配置包', 'red');
      return false;
    }
    if (file.size > 8 * 1024 * 1024) {
      createToast('配置包大小不能超过 8 MB', 'red');
      return false;
    }

    const oldControllerInfo = await buildControllerInfo();
    const rollbackPath = await createConfigRollbackPoint('config_package_restore');
    if (rollbackPath === null) {
      createToast('无法创建 config.yaml 回滚点；配置包导入已取消，现有配置未改动。', 'red', 9000);
      return false;
    }
    let uploadedPath = '';
    try {
      uploadedPath = await uploadFileToDevice(file);
    } catch (e) {
      createToast(`配置包上传失败<br>${safeTextToHtml(e && e.message ? e.message : e)}`, 'red', 9000);
      return false;
    }
    const requiredNamesCmd = requiredNames.map((name) => shellQuote(name)).join(' ');
    const restoreStageFilesCmd = restoreFiles.map((item) => {
      const mode = '600';
      return `
        stage_restore_file ${shellQuote(item.label)} ${shellQuote(item.path)} ${shellQuote(mode)} ${item.optional ? 1 : 0} || exit 1
        `;
    }).join('');
    const restoreCommitFilesCmd = restoreFiles.map((item) => `
        commit_restore_file ${shellQuote(item.label)} ${shellQuote(item.path)} || exit 1
        `).join('');
    const restoreRollbackFilesCmd = restoreFiles.slice().reverse().map((item) => `
        rollback_restore_file ${shellQuote(item.label)} ${shellQuote(item.path)} || restore_failed=1
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
            cp "$ROLLBACK_DIR/$name" "$staged" && chmod 600 "$staged" && mv -f "$staged" "$dst" || return 1
          elif [ -f "$ROLLBACK_DIR/$name.absent" ]; then
            rm -f "$dst" || return 1
          fi
        }
        cleanup_restore_transaction() {
          rc=$?
          trap - EXIT
          if [ "$rc" -ne 0 ] && [ "$COMMIT_STARTED" = "1" ] && [ "$COMMIT_DONE" != "1" ]; then
            restore_failed=0
            ${restoreRollbackFilesCmd}
            if [ "$restore_failed" = 0 ]; then echo RESTORE_TRANSACTION_ROLLED_BACK
            else echo "F50_RECOVERY_PACKAGE=$ROLLBACK_DIR"; echo RESTORE_TRANSACTION_INCOMPLETE; fi
          fi
          rm -rf "$STAGE" 2>/dev/null || true
          if [ "$rc" -ne 0 ]; then
            if [ "$COMMIT_STARTED" = 0 ] || { [ "$COMMIT_DONE" != 1 ] && [ "\${restore_failed:-0}" = 0 ]; }; then
              rm -rf "$ROLLBACK_DIR" || echo "F50_RECOVERY_PACKAGE=$ROLLBACK_DIR"
            else echo "F50_RECOVERY_PACKAGE=$ROLLBACK_DIR"; fi
          fi
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
          archive_names=$(unzip -Z1 "$SRC" 2>/dev/null); list_rc=$?
          if [ "$list_rc" != 0 ]; then
            archive_listing=$(unzip -l "$SRC" 2>/dev/null); list_rc=$?
            archive_names=$(printf '%s\\n' "$archive_listing" | awk '/^[ \\t]*[0-9]+[ \\t]+[-0-9]+[ \\t]+[0-9:]+[ \\t]+/ {sub(/^[ \\t]*[0-9]+[ \\t]+[-0-9]+[ \\t]+[0-9:]+[ \\t]+/,"");print}')
          fi
          [ "$list_rc" = 0 ] || { echo "RESTORE_FAILED: zip listing failed"; exit 1; }
        else
          command -v tar >/dev/null 2>&1 || { echo "RESTORE_FAILED: tar missing"; exit 1; }
          tar -tzf "$SRC" >/data/kano_config_package_archive_list.out 2>&1 || {
            echo "RESTORE_FAILED: tar integrity test failed"
            cat /data/kano_config_package_archive_list.out 2>/dev/null || true
            exit 1
          }
          archive_names=$(cat /data/kano_config_package_archive_list.out) || exit 1
        fi
        [ -n "$archive_names" ] || { echo "RESTORE_FAILED: empty archive listing"; exit 1; }
        while IFS= read -r member; do
          case "$member" in /*|../*|*/../*|*/..|..|*\\\\*|*[[:cntrl:]]*) echo "RESTORE_FAILED: unsafe archive path"; exit 1;; esac
        done <<EOF_F50_RESTORE_MEMBERS
$archive_names
EOF_F50_RESTORE_MEMBERS
        if [ ${shellQuote(isZipPackage ? '1' : '0')} = '1' ]; then
          unzip -q "$SRC" -d "$STAGE" || { echo "RESTORE_FAILED: unzip failed"; exit 1; }
        else
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
        ${yqExecutableCheckCmd()}
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
          if [ "\${4:-0}" = 1 ] && [ ! -e "$src" ]; then echo "PRESERVED_OPTIONAL: $name"; return 0; fi
          [ ! -L "$src" ] && [ ! -L "$dst" ] || return 1
          staged="$dst.kano_restore.$$"
          mkdir -p "$(dirname "$dst")" || return 1
          if [ -e "$dst" ]; then
            cp "$dst" "$ROLLBACK_DIR/$name" || return 1
            touch "$ROLLBACK_DIR/$name.had" || return 1
          else
            touch "$ROLLBACK_DIR/$name.absent" || return 1
          fi
          cp "$src" "$staged" || return 1
          chmod "$mode" "$staged" || return 1
          touch "$ROLLBACK_DIR/$name.selected" || return 1
          echo "STAGED: $name"
        }
        commit_restore_file() {
          name="$1"
          dst="$2"
          [ -f "$ROLLBACK_DIR/$name.selected" ] || return 0
          staged="$dst.kano_restore.$$"
          [ -f "$staged" ] || return 1
          mv -f "$staged" "$dst" || return 1
          echo "RESTORED: $name"
        }
        export F50_LIVE_CONFIG=${shellQuote(CLASH_CONFIG)}
        export F50_FIXED_SECRET=${shellQuote(F50_DEFAULT_SECRET)}
        if [ -s "$F50_LIVE_CONFIG" ]; then
          "$YQ" e '.secret = (load(strenv(F50_LIVE_CONFIG)).secret // strenv(F50_FIXED_SECRET))' "$STAGE/config.yaml" > "$STAGE/config.safe" || exit 1
        else
          "$YQ" e '.secret = strenv(F50_FIXED_SECRET)' "$STAGE/config.yaml" > "$STAGE/config.safe" || exit 1
        fi
        mv -f "$STAGE/config.safe" "$STAGE/config.yaml" || exit 1
        unset F50_LIVE_CONFIG F50_FIXED_SECRET
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
        createToast(`配置包缺少必要文件，导入已停止<br>${textToHtml(missingFiles.join('\n'))}`, 'red', 10000);
      } else {
        createToast(`配置包导入失败<br>${safeTextToHtml(restoreOutput)}`, 'red', 10000);
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
      createToast(`配置热重载失败，已改用服务重启<br>${safeTextToHtml(reloadRes.responseText || reloadRes.content || '')}`, 'yellow');
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
    createToast(`配置包已回灌<br>已恢复文件：${textToHtml(restoredFiles.join('\n') || restoreOrderText)}`, 'green', 9000);
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
  stopBtn.textContent = '停止核心';
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
  backupBtn.textContent = '导出配置包';
  backupBtn.onclick = async () => {
    if (!(await ensureReady())) return;
    const operationToken = acquireCriticalOperation('导出配置包');
    if (!operationToken) return;
    setButtonBusy(backupBtn, true, '导出中…');
    try {
    createToast('正在导出猫猫配置包…', 'green');
    const t = `${Date.now()}_${Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')}`;
    const backupFiles = configPackageBackupFiles();
    const defaultOverrideJsForBackup = buildDefaultOverrideJs();
    const defaultRuleOverrideJsonForBackup = JSON.stringify(defaultRuleOverrideConfig(), null, 2) + '\n';
    const copyBackupFilesCmd = backupFiles.map((item) => `
        copy_backup_file ${shellQuote(item.path)} ${shellQuote(item.label)}
        `).join('');
    const res = await runShellWithRoot(`
        set -e
        UPLOAD_DIR=${shellQuote(`${F50_FILES_DIR}/uploads`)}
        PKG_DIR=/data/kano_config_package_${t}
        PKG_BASE="$UPLOAD_DIR/mm_config_package_${t}"
        PKG=
        PACK_READY=0
        trap 'rm -rf "$PKG_DIR"; [ "$PACK_READY" = 1 ] || rm -f "$PKG"' EXIT
        mkdir -p "$UPLOAD_DIR"
        rm -rf "$UPLOAD_DIR"/mm_config_package_* 2>/dev/null || true
        mkdir -p "$PKG_DIR"
        packed_count=0
        copy_backup_file() {
          src="$1"
          name="$2"
          if [ -f "$src" ]; then
            cp "$src" "$PKG_DIR/$name" || exit 1
            chmod 600 "$PKG_DIR/$name" || return 1
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
            sub_user_agent.conf|device_bypass.txt|direct_domain.list|direct_ip.list|proxy_domain.list|reject_domain.list)
              : > "$PKG_DIR/$name" || return 1
              ;;
            rule_override.json|rule_override_applied.json)
              printf '%s' ${shellQuote(defaultRuleOverrideJsonForBackup)} > "$PKG_DIR/$name" || return 1
              ;;
            *)
              echo "MISSING_REQUIRED: $name"
              return 1
              ;;
          esac
          chmod 600 "$PKG_DIR/$name" || return 1
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
        [ -s "$PKG" ] || { echo "PACK_FAILED: empty package"; exit 1; }
        (
          unset KANO_TPROXY_TASK
          exec nohup sh -c 'sleep 300; rm -f "$1"' sh "$PKG"
        ) </dev/null >/dev/null 2>&1 &
        chmod 644 "$PKG"
        echo "PACKAGE_NAME=$(basename "$PKG")"
        PACK_READY=1
        `, 30 * 1000);
    if (!res.success) return createToast(`配置包导出失败<br>${safeTextToHtml(res.content || '')}`, 'red');
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
      `配置包已导出<br>包含文件：${textToHtml([...packedFiles, ...defaultedFiles].join('\n') || '无')}` +
        (defaultedFiles.length ? `<br>已补默认文件：${textToHtml(defaultedFiles.join('\n'))}` : ''),
      defaultedFiles.length ? 'yellow' : 'green',
      8000,
    );
    const a = document.createElement('a');
    a.download = `猫猫配置备份包_${t}${packageName.endsWith('.zip') ? '.zip' : '.tar.gz'}`;
    a.href = `/api/uploads/${encodeURIComponent(packageName)}`;
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    } catch (error) {
      createToast(`配置包导出失败<br>${safeTextToHtml(error?.message || String(error))}`, 'red');
    } finally {
      setButtonBusy(backupBtn, false);
      await releaseCriticalOperation(operationToken);
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
      createToast('猫猫入口初始化失败：未找到 F50 页面容器。', 'red');
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
        <div class="kano-mm-title-left"><strong id="running_mm">猫猫</strong><span class="kano-mm-badge" id="mm_mode_badge">TProxy</span></div>
        <div style="display:inline-block;" id="collapse_mm_btn"></div>
    </div>
    <div class="collapse" id="collapse_mm" data-name="close" style="height:0px;overflow:hidden;">
        <div class="collapse_box kano-mm-box">
            <div class="kano-mm-overview">
              <div id="mm_rule_mode_status" class="kano-mm-status">配置状态：读取中\u2026</div>
              <div id="mm_task_status" class="kano-mm-task-status" data-state="idle" aria-live="polite">任务：空闲</div>
            </div>
            <div id="mm_action_box"></div>
            <div id="mm_web_panel_wrap" class="kano-mm-web-panel">
              <div class="kano-mm-web-head"><span>内嵌 Web 面板</span></div>
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
    const setWebPanelVisible = async (visible, { load = true } = {}) => {
      const wrap = document.querySelector('#mm_web_panel_wrap');
      const iframe = document.querySelector('#mm_iframe');
      if (!wrap || !iframe) return;
      localStorage.setItem(WEB_VISIBLE_KEY, visible ? 'visible' : 'hidden');
      wrap.style.display = visible ? '' : 'none';
      if (webPanelToggleBtn) {
        webPanelToggleBtn.textContent = visible ? '隐藏面板' : '显示面板';
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
        createToast('面板已隐藏；请点击“显示面板”重新打开。', 'yellow', 4500);
        return;
      }
      const iframe = document.querySelector('#mm_iframe');
      if (!iframe) return;
      const currentSrc = iframe.getAttribute('src');
      if (!forceReload && currentSrc && currentSrc != 'about:blank' && currentSrc != 'javascript:;') return;
      const requestId = ++panelLoadRequestId;
      const url = await buildPanelUrl();
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
    webPanelToggleBtn.textContent = isWebPanelVisible() ? '隐藏面板' : '显示面板';
    webPanelToggleBtn.onclick = async () => {
      await setWebPanelVisible(!isWebPanelVisible(), { load: true });
    };

    const open = document.createElement('button');
    open.classList.add('btn');
    open.textContent = '打开新窗口';
    open.onclick = async () => {
      const url = zashboardPanelUrl;
      const panelWindow = window.open(url || 'about:blank', '_blank');
      if (!panelWindow) {
        createToast('浏览器阻止了新窗口；请允许本页面打开弹窗后重试。', 'yellow', 7000);
        return;
      }
      try {
        panelWindow.opener = null;
        if (!url) {
          let generation, panelUrl;
          do {
            generation = statusSnapshotGeneration;
            panelUrl = zashboardPanelUrl || await buildPanelUrl();
          } while (generation !== statusSnapshotGeneration);
          panelWindow.location.replace(panelUrl);
        }
      } catch (error) {
        panelWindow.close();
        createToast(`面板打开失败<br>${safeTextToHtml(error.message || String(error))}`, 'red', 8000);
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
    boot_on.textContent = '开机自启';
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
      return runCriticalButtonOperation('修改开机自启', boot_on, '处理中…', async () => {
        const before = await inspectBootIntegration();
        const disable = before.enabled && before.state != 'incomplete' && before.state != 'manager_damaged';
        if (!disable && (!(await ensureServiceWrapper()).success || !(await ensurePolicyToolsScript()))) {
          createToast('自启组件修复失败；请重试', 'red');
          return;
        }
        const result = await runShellWithRoot(disable ? removeBootLinesCmd() : addBootLinesCmd());
        if (!result.success) {
          createToast(`开机自启设置修改失败<br>${safeTextToHtml(result.content || '')}`, 'red', 8000);
          return;
        }
        const after = await inspectBootIntegration();
        applyBootButtonState(after);
        const color = after.state == 'direct' || after.state == 'disabled' ? 'green' : 'yellow';
        createToast(
          after.state == 'disabled'
            ? '开机自启已关闭'
            : `${escapeHtml(after.message)}<br>已启用 UFI-TOOLS 原生 ufi_tools_boot.sh 启动。`,
          color,
          8000,
        );
      });
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
      } catch (error) {
        createToast(`诊断读取失败<br>${safeTextToHtml(error && error.message ? error.message : error)}`, 'red', 10000);
      } finally {
        setButtonBusy(showLogBtn, false);
      }
    };

    const userAgentBtn = document.createElement('button');
    userAgentBtn.classList.add('btn');
    userAgentBtn.textContent = '订阅 User-Agent';
    userAgentBtn.onclick = async () => {
      let currentValue;
      try {
        if (!(await ensureReady({ readOnly: true }))) return;
        currentValue = await loadProviderUserAgent({ fresh: true });
      } catch (error) {
        createToast(`无法读取订阅 User-Agent<br>${safeTextToHtml(error && error.message ? error.message : error)}`, 'red', 9000);
        return;
      }
      const storedCustom = currentValue == KANO_PROVIDER_USER_AGENT ? '' : currentValue;
      const { el, close } = createFixedToast(
        'mm_provider_user_agent',
        `
          <div style="pointer-events:all;width:86vw;max-width:720px;">
            <div class="title" style="margin:0">订阅 User-Agent</div>
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
        return runCriticalButtonOperation('保存订阅 User-Agent', saveBtn, '保存中…', async () => {
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
        });
      };
      input.focus();
    };

    const rescueBtn = document.createElement('button');
    rescueBtn.classList.add('btn', 'kano-danger');
    rescueBtn.textContent = '恢复网络';
    rescueBtn.onclick = async () => {
      if (!(await ensureAdvanced())) return;
      const confirmed = await askConfirm(
        'mm_network_rescue_confirm',
        '执行断网恢复？',
        '将停止核心并清理插件创建的 KANO_* iptables 规则，用于恢复规则残留导致的断网。',
        '执行恢复',
        '取消',
      );
      if (!confirmed) return;

      setButtonBusy(rescueBtn, true, '恢复中\u2026');
      try {
        await networkRescue({ showOutput: true, preempt: true });
      } finally {
        setButtonBusy(rescueBtn, false);

      }
    };

    const clearCacheBtn = document.createElement('button');
    clearCacheBtn.classList.add('btn');
    clearCacheBtn.textContent = '清理缓存';
    clearCacheBtn.onclick = async () => {
      if (!(await ensureAdvanced())) return;
      const confirmed = await askConfirm(
        'mm_clear_cache_confirm',
        '清理 mihomo 缓存？',
        '会通过 Mihomo API 刷新 DNS / Fake-IP 缓存，并清理 provider 临时文件、空缓存和下载残留；不会删除有效节点缓存、config.yaml、template.yaml、订阅链接或覆写文件。',
        '清理缓存',
        '取消',
      );
      if (!confirmed) return;
      return runCriticalButtonOperation('清理缓存', clearCacheBtn, '清理中\u2026', async () => {
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
          rm -f /data/kano_mihomo_api_*.out /data/kano_mihomo_api_*.err /data/kano_yaml_after_override.yaml /data/kano_ui_rules_*.txt /data/kano_ui_rules_patch.yaml /data/kano_subscription_config.raw /data/kano_subscription_config.yaml /data/kano_subscription_mode_check.out 2>/dev/null || true
          rm -f ${shellQuote(CLASH_PROXY_DIR)}/proxies/*.tmp ${shellQuote(CLASH_PROXY_DIR)}/proxies/*.bak 2>/dev/null || true
          for EMPTY_CACHE in ${shellQuote(CLASH_PROXY_DIR)}/proxies/*.yaml; do
            [ -f "$EMPTY_CACHE" ] && [ ! -s "$EMPTY_CACHE" ] && rm -f "$EMPTY_CACHE" 2>/dev/null || true
          done
          echo "RECOVERY_ARCHIVE_STATUS=$RECOVERY_ARCHIVE_STATUS"
          echo "CACHE_CLEAN_DONE"
        `, 20 * 1000, 'clear_cache');
        const runtimeLines = runtimeResults.map((item) => {
          if (item.success) return `${item.label}：已刷新`;
          if (item.errorType == 'core_not_running') return `${item.label}：已跳过（核心未运行）`;
          if (item.statusCode == 404 || item.statusCode == 405) return `${item.label}：当前内核不支持此操作`;
          return `${item.label}：${item.message || '刷新失败'}`;
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
          `${allOk ? '缓存已清理' : '缓存部分清理完成'}<br>${textToHtml([...runtimeLines, archiveLine, res.success ? '临时文件：已清理' : '临时文件：清理失败'].join('\n'))}`,
          allOk ? 'green' : 'yellow',
          8000,
        );
      });
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
        createToast('订阅源已清空；当前运行配置未改动', 'green');
        await refreshRuleModeStatus();
      } else {
        createToast('清空订阅源失败；订阅源未改动', 'red');
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
      return true;
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
      createToast(`HTTP Provider 更新失败（${escapeHtml(reason)}）；正在改用设备本地下载与转换…`, 'yellow', 10000);
      appendTemplateFlowDebug(`provider_auto_local_fallback enter reason=${reason} sources=${sources.length}`);
      const storedSources = await readCurrentSubSources({ includeDisabled: true });
      const stored = storedSources.length > 0 ? storedSources : sources;
      let conversion = buildProviderUpdateResult([]);
      // Reuse the subscription transaction: it snapshots settings, config, caches and runtime state.
      const ok = await saveSubSources(stored, cleanMode, SUB_CONVERT_MODE_LOCAL, {
        applyToCustom: true,
        onProviderUpdate: (result) => { conversion = result; },
      });
      if (ok) {
        appendTemplateFlowDebug('provider_auto_local_fallback success convert=local');
        createToast('已自动切换为设备本地转换，节点恢复可用', 'green', 10000);
        await showSubscriptionUpdateSelfCheck(sources, cleanMode, conversion, null, SUB_CONVERT_MODE_LOCAL);
      }
      return { ok, conversion };
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
      const cleanSources = normalizeSubSourceList(legacy.sources || []);
      if (cleanSources.length == 0) {
        if (legacy.legacyDetected && showToast) {
          createToast('检测到旧直通模式残留，但未找到可迁移的订阅链接；请重新保存订阅链接。', 'yellow', 9000);
        }
        return [];
      }
      if (!(await persistSubSourceState(cleanSources, SUB_RULE_MODE_TEMPLATE))) {
        if (showToast) createToast('旧直通模式迁移失败：订阅链接写入失败', 'red', 9000);
        return [];
      }
      appendTemplateFlowDebug(`legacy subscription migrated sources=${cleanSources.length}`);
      if (showToast) {
        createToast(`已迁移旧直通模式：${cleanSources.length} 个订阅链接已写入 subscription_urls.txt`, 'yellow', 8000);
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
          message: `已检测到 ${cleanSources.length} 个已保存订阅链接。`,
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
            message: '未保存订阅链接；将使用 template.yaml 内嵌节点或带 URL 的 proxy-providers 生成 config.yaml',
          };
        }
        return {
          ok: true,
          source: 'template_embedded',
          sources: [],
          nodeCheck,
          message: 'template.yaml 包含内嵌节点或带 URL 的 proxy-providers。',
        };
      }

      const detail = nodeCheck.status == 'missing'
        ? 'template.yaml 不存在。'
        : nodeCheck.status == 'invalid'
          ? `template.yaml 解析失败<br>${safeTextToHtml(nodeCheck.content || '')}`
          : 'template.yaml 未包含 proxies 节点或带 URL 的 proxy-providers';
      return {
        ok: false,
        source: 'none',
        sources: [],
        nodeCheck,
        message: `没有可用节点来源：未保存订阅链接，${detail}<br>请先点“订阅设置”添加并保存订阅，或在“配置与规则”中上传包含节点的 template.yaml`,
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
  if (!read.ok) issues.push(read.message || '无法读取运行配置');
  if (!meta.success || !String(meta.content || '').includes('SUBSCRIPTION_META_READ')) issues.push('无法读取订阅标记');
  const modeLineOk = data.mode === cleanMode, convertModeOk = data.convert === cleanConvertMode;
  const providerCount = Object.keys(providers).length;
  const providerUrlCount = Object.values(providers).filter(p => p && /^https?:\/\//.test(String(p.url || ''))).length;
  const rulesCount = Array.isArray(config.rules) ? config.rules.length : 0;
  const proxyGroupsCount = Array.isArray(config['proxy-groups']) ? config['proxy-groups'].length : 0;
  let missingUrls = 0, providerShapeErrors = 0;
  if (!modeLineOk) issues.push('配置来源标记不一致');
  if (!convertModeOk) issues.push('节点处理方式标记不一致');
  {
    const local = cleanConvertMode === SUB_CONVERT_MODE_LOCAL;
    for (const source of cleanSources) {
      const p = providers[source.name] || {};
      if (p.type !== (local ? 'file' : 'http') || p.path !== './proxies/' + source.name + '.yaml') providerShapeErrors++;
      if (!local) {
        if (p.url !== source.url) missingUrls++;
        if (!p.header || !Array.isArray(p.header['User-Agent']) || p.header['User-Agent'][0] !== (ua || currentProviderUserAgent)) providerShapeErrors++;
      }
    }
    if (providerCount !== cleanSources.length || providerUrlCount !== (local ? 0 : cleanSources.length)) issues.push('节点来源数量不一致');
    if (missingUrls || providerShapeErrors) issues.push('订阅 URL、类型、路径或 User-Agent 不一致');
    if (!rulesCount || !proxyGroupsCount) issues.push('规则或策略组为空');
    if (cleanSources.length && data.source !== 'template.yaml') issues.push('当前配置不是由本地模板生成');
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
                ? `本次更新失败；继续使用缓存的 ${item.proxyCount} 个节点`
                : '本次更新失败；继续使用原节点缓存')
              : item.proxyCount === 0
                ? '本次更新失败；当前节点缓存为空'
                : '本次更新失败；无法读取节点缓存状态';
          const technical = item.rawMessage
            ? `<details style="margin-top:6px;"><summary>展开技术详情</summary><pre style="margin:6px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(sanitizeSubscriptionSecrets(item.rawMessage).slice(0, 1200))}</pre></details>`
            : '';
          return `<div style="padding:9px 10px;border:1px solid rgba(148,163,184,.25);border-radius:9px;overflow-wrap:anywhere;word-break:break-word;">
            <b>${escapeHtml(item.name)}</b><br>
            状态：${item.ok ? '成功' : String(item.errorType || '').startsWith('not_run_') ? '未执行' : '失败'}<br>
            尝试次数：${item.attempts}<br>
            ${item.ok ? '' : `原因：${escapeHtml(item.message)}<br>`}
            ${item.urlMasked ? `服务器：${escapeHtml(item.urlMasked)}<br>` : ''}
            ${escapeHtml(cacheText)}<br>代理连通性：未测试
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
              <b>配置检查：${configValidationResult.ok ? '通过' : '未通过'}</b><br>
              ${textToHtml(configSummary)}<br>${escapeHtml(controllerText)}
              ${issueText ? `<details style="margin-top:6px;"><summary>问题详情</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(sanitizeSubscriptionSecrets(issueText || diagnosticSummary))}</pre></details>` : ''}
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
          return runCriticalButtonOperation('修复订阅配置', repairBtn, '修复中…', async () => {
            await overwriteConfigByTemplate({ confirm: false });
            safeClose();
          });
        };
      }
      if (retryBtn) {
        retryBtn.onclick = async () => {
          if (!(await ensureReady())) return;
          return runCriticalButtonOperation('重新更新失败节点来源', retryBtn, '重试中…', async () => {
            if (providerNotRun && !(await restartClashOk())) return;
            const retryResult = await forceUpdateProvidersFromConfig({
              showToast: false,
              providerNames: failedProviders.map((item) => item.name),
            });
            const mergedResult = mergeProviderUpdateResults(providerResult, retryResult);
            safeClose();
            await showSubscriptionUpdateSelfCheck(sources, mode, mergedResult, null, convertMode);
          });
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
      const configSummary = `当前规则来源：template 规则\n订阅转换：${cleanConvertMode == SUB_CONVERT_MODE_LOCAL ? '设备本地转换' : 'Mihomo HTTP Provider'}\n当前 config 来源：${configCheck.configSource || 'unknown'}\nproxy-providers 数量：${configCheck.providerCount}\n有效订阅 URL 数量：${configCheck.providerUrlCount}\nproxy-groups 数量：${configCheck.proxyGroupsCount}\nrules 数量：${configCheck.rulesCount}\n模式标记：${configCheck.modeLineOk && configCheck.convertModeOk ? '正确' : '错误'}`;
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
        ? `控制 API：可访问（HTTP ${controllerCheck.statusCode}）`
        : `控制 API：${controllerCheck.message || '不可访问'}${controllerCheck.statusCode ? `（HTTP ${controllerCheck.statusCode}）` : ''}`;
      const configValidationResult = {
        ...configCheck,
        ok: configCheck.ok,
        controllerOk,
        controllerStatusCode: controllerCheck.statusCode || 0,
        controllerErrorType: controllerCheck.errorType || '',
      };
      const expectedSourceCount = normalizeSubSourceList(sources).length;
      const expectedProviderUrlCount = cleanConvertMode == SUB_CONVERT_MODE_LOCAL ? 0 : expectedSourceCount;
      const repairable = cleanMode == SUB_RULE_MODE_TEMPLATE && !configCheck.ok && configCheck.readable && (
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
      if (configSource == 'subscription_original' || mode == 'original') {
        createToast('旧订阅原配置已保留；请先在订阅设置中迁移到本地模板，再更新', 'yellow', 8000);
        return;
      }
      if (configSource == 'uploaded_config') {
        await forceUpdateProvidersFromConfig({ showToast: false });
        return;
      }
      await updateSubProviders(sources, mode, convertMode);
    };

    const updateSubProviders = async (sources, mode = SUB_RULE_MODE_TEMPLATE, convertMode = SUB_CONVERT_MODE_PROVIDER) => {
  if (!(await ensureCompatBackend())) return false;
  const configSource = await readConfigSource();
  if (configSource === 'uploaded_config') {
    const gist = await f50GistManaged();
    if (gist) return await f50GistUpdateSources(gist);
  }
  const cleanMode = normalizeSubRuleModeValue(mode);
  const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
  const cleanSources = normalizeSubSourceList(sources);
  if (cleanMode === 'original' || configSource === 'subscription_original') {
    createToast('旧订阅原配置已保留；请先在订阅设置中迁移到本地模板，再更新', 'yellow', 8000);
    return false;
  }
  if (configSource === 'uploaded_config') {
    const read = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    if (!read.ok) { createToast(safeTextToHtml(read.message || '无法读取配置'), 'red'); return false; }
    const definitions = read.value['proxy-providers'] || {};
    const localSources = normalizeSubSourceList(cleanSources.length ? cleanSources : await readCurrentSubSources()).filter(source =>
      definitions[source.name]?.type === 'file' && definitions[source.name]?.path === `./proxies/${source.name}.yaml`);
    const converted = localSources.length ? await convertSubscriptionsLocally(localSources, { preserveNames: true }) : null;
    if (converted && (converted.failed || !converted.ok)) {
      const message = (converted.providers || []).find(provider => !provider.ok)?.message || '订阅下载失败';
      createToast(safeTextToHtml(message), 'red', 10000);
      return false;
    }
    const refreshed = await forceUpdateProvidersFromConfig({showToast:!converted,config:read.value,refreshRemote:true});
    if (!converted) return refreshed.failed === 0;
    const loaded = mergeLocalConversionReloadResult(converted, refreshed);
    const ok = refreshed.failed === 0 && loaded.failed === 0;
    const failedProvider = (loaded.providers || []).find(provider => !provider.ok) || (refreshed.providers || []).find(provider => !provider.ok);
    const message = failedProvider ? `${failedProvider.name}：${failedProvider.message || '节点来源更新失败'}` : '节点已下载，但核心节点加载检查失败';
    createToast(ok ? '节点已更新' : safeTextToHtml(message), ok ? 'green' : 'red', 8000);
    return ok;
  }
  if (!cleanSources.length) { createToast('没有已启用的订阅', 'red'); return false; }
  const read = await readYamlObject(CLASH_CONFIG, 'config.yaml');
  if (!read.ok) { createToast(safeTextToHtml(read.message || '无法读取配置'), 'red'); return false; }
  const definitions = read.value['proxy-providers'] || {};
  const expectedType = cleanConvertMode === SUB_CONVERT_MODE_LOCAL ? 'file' : 'http';
  const modeReady = cleanSources.every(s => definitions[s.name]?.type === expectedType);
  if (!modeReady) return saveSubSources(await readCurrentSubSources({includeDisabled:true}), cleanMode, cleanConvertMode, {applyToCustom:true});
  if (cleanConvertMode === SUB_CONVERT_MODE_PROVIDER) {
    const updated = await forceUpdateProvidersFromConfig({ showToast: false, config: read.value });
    if (providerUpdateNeedsLocalFallback(updated)) {
      return (await switchHttpProviderToLocal(cleanSources, cleanMode, { reason: 'HTTP 390' })).ok;
    }
    return showSubscriptionUpdateSelfCheck(cleanSources, cleanMode, updated, null, cleanConvertMode);
  }
  // Download first. A failed request never enters the restart/rollback path.
  const converted = await convertSubscriptionsLocally(cleanSources);
  if (converted.failed || !converted.ok) {
    const message = (converted.providers || []).find(p => !p.ok)?.message || '订阅下载失败';
    operationFinish(false, message); createToast(safeTextToHtml(message), 'red', 10000); return false;
  }
  if (!(await getCorePid())) { operationFinish(true, '节点已保存；核心保持停止'); return true; }
  const applied = await reloadLocalSubscriptionProviders(cleanSources, converted);
  const ok = applied.failed === 0;
  operationFinish(ok, ok ? '节点已更新；核心未重启' : '节点已下载，但本地加载失败');
  const failedProvider = (applied.providers || []).find(provider => !provider.ok);
  const message = failedProvider ? `${failedProvider.name}：${failedProvider.message || '节点来源更新失败'}` : '节点已下载，但核心节点加载检查失败';
  createToast(ok ? '节点已更新' : safeTextToHtml(message), ok ? 'green':'red', 8000);
  return ok;
}
;

    const readCurrentSubSources = async ({ includeDisabled = false } = {}) => {
      const source = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_SUB_URLS)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_SUB_URLS)}; fi
        `);
      if (!source.success) {
        createToast(`无法读取订阅源；旧配置迁移未执行。<br>${safeTextToHtml(source.content || '')}`, 'red', 9000);
        appendTemplateFlowDebug('readCurrentSubSources failed before legacy migration');
        throw new Error('无法读取订阅列表；更新已停止');
      }
      const sourceItems = parseStoredSubSourcesFromText(source.content || '');
      if (sourceItems.length > 0) {
        return includeDisabled ? sourceItems : normalizeSubSourceList(sourceItems);
      }
      if (parseSubRuleModeFromText(source.content || '') === 'original'
        || ['subscription_original', 'uploaded_config'].includes(await readConfigSource())) return [];

      const res = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_CONFIG)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_CONFIG)}; fi
        `);
      if (!res.success || !res.content) return await migrateLegacySubscriptionSources({ showToast: true });
      const legacySources = parseLegacySubConfig(res.content);
      if (legacySources.length > 0) {
        if (!(await persistSubSourceState(legacySources, SUB_RULE_MODE_TEMPLATE, await readSavedSubConvertMode()))) {
          createToast('旧版订阅入口迁移失败；未使用未保存的订阅源。', 'red', 9000);
          appendTemplateFlowDebug(`legacy entrypoint persist failed sources=${legacySources.length}`);
          return [];
        }
        createToast('旧版订阅入口已迁移', 'yellow', 6500);
        appendTemplateFlowDebug(`legacy entrypoint migrated sources=${legacySources.length}`);
        return legacySources;
      }
      return await migrateLegacySubscriptionSources({ showToast: true });
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
      validateSubscriptionMode(cleanSources, cleanMode);
      if (!(await setSubRuleMode(cleanMode))) return false;
      if (!(await ensureTemplateProviders(cleanSources, { forceTemplate: true }))) {
        appendTemplateFlowDebug('writeSubConfigByMode template failed at ensureTemplateProviders');
        return false;
      }
      const ok = await writeSubEntrypoint(cleanSources, { backup, convertMode: cleanConvertMode });
      appendTemplateFlowDebug(`leave writeSubConfigByMode template ok=${ok ? '1' : '0'}`);
      return ok;
    };

    const saveSubSources = async (sources, mode = SUB_RULE_MODE_TEMPLATE, convertMode = SUB_CONVERT_MODE_PROVIDER, { applyToCustom = false, migrateLegacy = false, onProviderUpdate = null } = {}) => {
  const cleanMode = normalizeSubRuleModeValue(mode);
  const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
  let storedSources, cleanSources;
  try { ({ stored: storedSources, enabled: cleanSources } = validateSubscriptionMode(sources, cleanMode)); }
  catch (error) { operationFinish(false, error.message); createToast(safeTextToHtml(error.message), 'red', 9000); return false; }
  if (storedSources.some((source) => !isHttpUrl(source.url))) {
    operationFinish(false, '请输入有效的订阅链接');
    return false;
  }
  const invalidSubSource = cleanSources
    .map((source) => ({ source, check: validateLocalSubscriptionUrl(source.url) }))
    .find((item) => !item.check.ok);
  if (invalidSubSource) {
    const invalidMessage = invalidSubSource.check.message || '订阅地址无效';
    operationFinish(false, invalidMessage);
    createToast(safeTextToHtml(invalidMessage), 'red', 9000);
    return false;
  }
  operationStage('检查订阅和配置来源', 0, 5);
  const configSource = await readConfigSource();
  if (configSource === 'uploaded_config') {
    const gist = await f50GistManaged();
    if (gist) return await f50GistUpdateSources(gist, storedSources);
  }
  if (!storedSources.length) { operationFinish(false, '请输入有效的订阅链接'); return false; }
  const legacyMigration = configSource === 'subscription_original' || await readCurrentSubRuleMode() === 'original';
  if (legacyMigration && (!migrateLegacy || !cleanSources.length)) {
    createToast('旧订阅原配置已保留；请启用订阅并确认迁移到本地模板', 'yellow', 8000);
    return false;
  }
  if ((!applyToCustom && configSource === 'uploaded_config') || !cleanSources.length) {
    const saved = await persistSubSourceState(storedSources, cleanMode, cleanConvertMode);
    operationFinish(saved, saved ? '订阅设置已保存；当前运行配置未更改' : '订阅设置保存失败');
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
${fileSnapshotHelpersCmd()}
${paths.map((path, i) => `snapshot_transaction_file ${i} ${shellQuote(path)}`).join('\n')}
echo SUBSCRIPTION_TRANSACTION_READY`, 20000);
  if (!snapshot.success || !String(snapshot.content || '').includes('SUBSCRIPTION_TRANSACTION_READY')) {
    operationFinish(false, '无法创建 config.yaml 回滚点；订阅未更改');
    return false;
  }
  let runtimeAttempted = false, wasRunning = false, restored = false, committed = false;
  try {
    wasRunning = !!(await getCorePid());
    if (!(await persistSubSourceState(storedSources, cleanMode, cleanConvertMode))) throw new Error('订阅设置保存失败');
    operationStage('根据本地模板生成配置', 1, 5);
    let conversion = null;
    if (cleanConvertMode === SUB_CONVERT_MODE_LOCAL) {
      conversion = await convertSubscriptionsLocally(cleanSources);
      if (onProviderUpdate) onProviderUpdate(conversion);
      if (conversion.failed > 0) throw new Error((conversion.providers || []).find((item) => !item.ok)?.message || '本地订阅转换失败');
    }
    if (!(await writeSubConfigByMode(cleanSources, cleanMode, { backup: false, convertMode: cleanConvertMode }))) {
      throw new Error('订阅配置生成失败');
    }
    operationStage('停止并启动已校验的新配置', 2, 5);
    if (!wasRunning) { const prepared=await f50Command('prepare',120000); if(!prepared.success)throw new Error(f50Error(prepared.content)); committed=true; invalidateStatusSnapshot(); operationFinish(true,'配置已保存；核心保持停止'); createToast('订阅已保存；核心未启动','green'); return true; }
    runtimeAttempted = true;
    if (!(await restartClashOk({ skipCheck: true }))) throw new Error('新配置未通过运行检查');
    operationStage('更新并确认节点来源', 3, 5);
    const providers = cleanConvertMode === SUB_CONVERT_MODE_LOCAL
      ? await reloadLocalSubscriptionProviders(cleanSources, conversion)
      : await forceUpdateProvidersFromConfig({ showToast: false });
    if (onProviderUpdate) onProviderUpdate(providers);
    if (cleanConvertMode === SUB_CONVERT_MODE_PROVIDER && providerUpdateNeedsLocalFallback(providers)) {
      const fallback = await switchHttpProviderToLocal(cleanSources, cleanMode, { reason: 'HTTP 390' });
      if (!fallback.ok) throw new Error('节点更新与本地转换回退均失败');
    } else if (providers.failed > 0) {
      const failed = (providers.providers || []).find((item) => !item.ok);
      throw new Error(failed && failed.message || '节点来源更新失败');
    }
    committed = true;
    invalidateStatusSnapshot();
    const message = '已按本地模板更新订阅配置';
    operationFinish(true, message);
    createToast(message, 'green', 7000);
    return true;
  } catch (error) {
    if (error.name === 'OperationCancelled' || (activeCriticalOperation && activeCriticalOperation.token.cancelled)) return false;
    const firstFailure = sanitizeSubscriptionSecrets(activeCriticalOperation && activeCriticalOperation.failure || error.message || String(error));
    createToast(safeTextToHtml(firstFailure) + '<br>正在恢复原配置', 'red', 10000);
    operationStage('更新失败，正在恢复原配置');
    // Stop a timed-out provider update before restoring cache files it could still replace.
    let stopped = true;
    try { if (runtimeAttempted) stopped = await networkRescue({ showOutput: false }); } catch (_) { stopped = false; }
    if (!stopped) {
      operationFinish(false, '回滚失败：核心停止检查未通过；未重启核心，也未覆盖节点缓存');
      createToast('回滚已停止，备份保留于 ' + escapeHtml(tx), 'red', 15000);
      return false;
    }
    try {
    const rollback = await runShellWithRoot(`set -e
TX=${shellQuote(tx)}
${fileSnapshotHelpersCmd()}
${paths.map((path, i) => ({ path, i })).reverse().map(({ path, i }) => `restore_transaction_file ${i} ${shellQuote(path)} || exit 1`).join('\n')}
echo SUBSCRIPTION_TRANSACTION_RESTORED`, 30000);
    restored = !!rollback.success && String(rollback.content || '').includes('SUBSCRIPTION_TRANSACTION_RESTORED');
    invalidateStatusSnapshot();
    if (restored && runtimeAttempted && wasRunning) restored = await restartClashOk({ skipCheck: true });
    } catch (_) { restored = false; }
    if (!restored) await networkRescue({ showOutput: false });
    const message = firstFailure;
    operationFinish(false, message + (restored ? '；已恢复更新前状态' : '；恢复失败'));
    createToast(safeTextToHtml(message) + '<br>' + (restored ? '已恢复原订阅与配置' : '回滚失败，备份保留于 ' + escapeHtml(tx)), 'red', 12000);
    return false;
  } finally {
    if (legacyMigration) {
      if (committed || restored) await runShellWithRoot('touch ' + shellQuote(tx + '/committed'), 10000);
      createToast('迁移备份保留于 ' + escapeHtml(tx), 'yellow', 12000);
    }
    if (!legacyMigration && (committed || restored) && !(activeCriticalOperation && activeCriticalOperation.token.cancelled)) {
      try { await runShellWithRoot('rm -rf ' + shellQuote(tx), 10000); } catch (_) {}
    }
  }
};

    const overwriteConfigByTemplate = async ({ confirm = true } = {}) => {
      const configSource = await readConfigSource();
      if (!confirm && ['uploaded_config', 'subscription_original'].includes(configSource)) {
        createToast('当前配置已保留；如需改用模板，请在“配置与规则”中点击“应用模板”', 'yellow', 8000);
        return false;
      }
      const storedSources = await readCurrentSubSources({ includeDisabled: true });
      const sources = normalizeSubSourceList(storedSources);
      const currentMode = await readCurrentSubRuleMode();
      const currentConvertMode = await readSavedSubConvertMode();
      if (currentMode == 'original' || configSource == 'subscription_original') {
        if (!confirm) {
          createToast('旧订阅原配置已保留；请先迁移到本地模板', 'yellow', 8000);
          return false;
        }
        if (!sources.length) { createToast('请先添加并启用订阅，再迁移到本地模板', 'yellow', 8000); return false; }
        const accepted = await askConfirm('mm_original_to_template', '迁移到本地模板？', '旧配置与来源文件会备份；规则和策略组改由本地模板提供，失败时恢复旧状态。', '迁移并应用', '取消');
        if (!accepted) return false;
        return await saveSubSources(storedSources, SUB_RULE_MODE_TEMPLATE, currentConvertMode, { applyToCustom: true, migrateLegacy: true });
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
        ? `将按 ${sources.length} 个已保存订阅与${hasTemplate ? '当前' : '默认'}模板重建运行配置。`
        : '将使用 template.yaml 中的节点或订阅重建运行配置';
      if (confirm) {
        const confirmed = await askConfirm(
          'mm_template_overwrite_confirm',
          '应用配置模板？',
          `${body}<br>校验或启动失败时会恢复旧配置。`,
          '开始应用',
          '取消',
        );
        if (!confirmed) return false;
      }

      if (sourceCheck.source == 'saved_subscription') {
        createToast(hasTemplate
          ? '正在按配置模板生成 config.yaml…'
          : '正在按默认 F50 模板生成 config.yaml…', 'yellow');
        const rollbackPath = await createConfigRollbackPoint('template_rebuild_sources');
        if (rollbackPath === null) {
          createToast('无法创建 config.yaml 回滚点；模板未应用。', 'red', 9000);
          return false;
        }
        if (!(await ensureTemplateProviders(sources, { forceTemplate: true, showToast: true }))) return false;
        let localConversion = null;
        if (currentConvertMode == SUB_CONVERT_MODE_LOCAL) {
          localConversion = await convertSubscriptionsLocally(sources);
          if (localConversion.failed > 0) {
            const failed = localConversion.providers.find((item) => !item.ok);
            createToast(`${escapeHtml(failed && failed.name || '订阅')}：${escapeHtml(failed && failed.message || '本地转换失败')}；运行配置未修改`, 'red', 9000);
            return false;
          }
        }
        if (!(await writeSubEntrypoint(sources, {
          backup: true,
          convertMode: currentConvertMode,
        }))) {
          await restoreConfigRollbackPoint(rollbackPath, '应用配置模板');
          return false;
        }
        const restarted = await restartClashWithConfigRollback(rollbackPath, '应用配置模板');
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
        createToast('无法创建 config.yaml 回滚点；模板未应用。', 'red', 9000);
        return false;
      }
      const stagePath = CLASH_CONFIG + '.kano_template_' + Date.now() + '_' + createRandomString(6);
      const staged = await runShellWithRoot('umask 077; cp ' + shellQuote(CLASH_TEMPLATE) + ' ' + shellQuote(stagePath), 15000);
      const committed = staged.success ? await commitStagedYaml({targetPath: CLASH_CONFIG, stagePath,
        label: 'config.yaml', backup: true, backupTag: 'template_embedded', configSource: 'template.yaml'}) : {ok:false, content:staged.content};
      const res = {success:committed.ok, content:committed.content};
      if (!res.success) {
        createToast(`模板覆写失败<br>${safeTextToHtml(res.content || '')}`, 'red', 8000);
        await restoreConfigRollbackPoint(rollbackPath, '应用配置模板');
        return false;
      }
      createToast('模板已写入；正在检查配置并重启核心…', 'yellow', 6500);
      if (!(await sanitizeConfigForTProxy({ showToast: false, errorToast: false }))) {
        const restored = await restoreConfigRollbackPoint(rollbackPath, '模板覆写', { showToast: false });
        createToast(
          restored ? '模板配置整理失败；已恢复上一份 config.yaml' : '模板配置整理失败，且 config.yaml 回滚失败',
          restored ? 'yellow' : 'red',
          10000,
        );
        return false;
      }
      const restarted = await restartClashWithConfigRollback(rollbackPath, '模板覆写后重启');
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
      if (!allowedFile) return { ok: false, exists: false, content: '', message: '该文件不在允许编辑的列表中' };
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
      try {
        const found = await runShellWithRoot(`[ -f ${shellQuote(uploadedPath)} ] && echo 1 || echo 0`);
        if (!found.success || String(found.content || '').trim() != '1') throw new Error('未找到已上传的文件');
        return uploadedPath;
      } catch (error) {
        await hostRunShellWithRoot.call(globalThis, `rm -f ${shellQuote(uploadedPath)}`, 5000);
        throw error;
      }
    };

    const commitUploadedConfigWithValidation = async (uploadedPath, controllerInfo = null) => {
      const rollbackPath = await createConfigRollbackPoint('uploaded_config');
      if (rollbackPath === null) {
        await runShellWithRoot(`rm -f ${shellQuote(uploadedPath)} 2>/dev/null || true`);
        createToast('无法创建 config.yaml 回滚点；写入已取消，原 config.yaml 未改动。', 'red', 9000);
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
        chmod 600 ${shellQuote(stagePath)}
        [ -s ${shellQuote(stagePath)} ] && echo STAGE_OK
      `);
      if (!stageRes.success) {
        await runShellWithRoot(`rm -f ${shellQuote(stagePath)} ${shellQuote(uploadedPath)} 2>/dev/null || true`);
        createToast(`配置暂存失败；原 config.yaml 未改动<br>${safeTextToHtml(stageRes.content || '')}`, 'red', 9000);
        return false;
      }
      const committed = await commitStagedYaml({targetPath: CLASH_CONFIG, stagePath,
        label: 'config.yaml', backup: true, backupTag: 'uploaded_config', configSource: 'uploaded_config'});
      const commitRes = {success: committed.ok, content: committed.content};
      if (!commitRes.success) {
        await runShellWithRoot(`rm -f ${shellQuote(stagePath)} 2>/dev/null || true`);
        const restored = await rollbackUploadedConfig('上传配置');
        createToast(
          `config.yaml 写入失败，${restored ? '已恢复写入前状态' : '且写入前状态恢复失败'}<br>${safeTextToHtml(commitRes.content || '')}`,
          restored ? 'yellow' : 'red',
          10000,
        );
        return false;
      }
      if (!(await sanitizeConfigForTProxy({ showToast: false, errorToast: false }))) {
        const restored = await rollbackUploadedConfig('上传配置自检');
        createToast(
          restored ? '配置整理失败；已恢复写入前状态' : '配置整理失败，且写入前状态恢复失败',
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
          await networkRescue({ showOutput: false });
        }
        createToast(
          restored && recoveryOk
            ? '新配置运行态检查失败；已恢复写入前的配置与网络策略'
            : '新配置运行态检查失败，且写入前运行状态未能完整恢复',
          restored && recoveryOk ? 'yellow' : 'red',
          10000,
        );
        await isMMRunning();
        return false;
      }
      createToast('热加载失败；正在通过重启应用配置…', 'yellow', 7000);
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
        createToast('该文件不在允许编辑的列表中', 'red');
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
          /^# KANO_SUB_CONVERT_MODE=/m.test(content)
            ? parseSubConvertModeFromText(content) : await readSavedSubConvertMode(),
        );
      }
      if ([CLASH_RULE_OVERRIDE_JSON, CLASH_RULE_OVERRIDE_APPLIED_JSON].includes(allowedFile.path) && content.trim()) {
        try {
          const parsed = JSON.parse(content);
          if (!isPlainYamlObject(parsed)) throw new Error('配置根节点必须是对象');
        } catch (e) {
          createToast(`${escapeHtml(allowedFile.label)} JSON 无效：${escapeHtml(e && e.message ? e.message : e)}`, 'red', 9000);
          return false;
        }
      }

      let uploadedPath = '';
      try {
        uploadedPath = await uploadEditorContent(content, allowedFile.label);
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
      } finally {
        if (uploadedPath) await hostRunShellWithRoot.call(globalThis, `rm -f ${shellQuote(uploadedPath)}`, 5000);
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
      let readGeneration = 0, editorClosed = false, readyPath = '', loadedContent = '';
      const loadSelected = async () => {
        const fileInfo = findEditableLocalFile(select.value);
        if (!fileInfo || editorClosed) return;
        const generation = ++readGeneration;
        readyPath = '';
        saveBtn.disabled = true;
        setButtonBusy(reloadBtn, true, '读取中\u2026');
        textarea.disabled = true;
        try {
          const result = await readEditableLocalFile(fileInfo);
          if (editorClosed || generation !== readGeneration || select.value !== fileInfo.path) return;
          textarea.value = result.content;
          loadedContent = result.content;
          if (result.ok) readyPath = fileInfo.path;
          status.textContent = result.ok ? fileInfo.path : '无法读取：' + (result.message || 'unknown');
        } catch (error) {
          if (!editorClosed && generation === readGeneration) status.textContent = String(error.message || error);
        } finally {
          if (!editorClosed && generation === readGeneration) {
            textarea.disabled = !readyPath;
            saveBtn.disabled = !readyPath;
            setButtonBusy(reloadBtn, false);
          }
        }
      };
      select.onchange = loadSelected;
      reloadBtn.onclick = loadSelected;
      el.querySelector('#mm_local_file_close_btn').onclick = () => { editorClosed = true; readGeneration++; close(); };
      saveBtn.onclick = async () => {
        const fileInfo = findEditableLocalFile(select.value);
        if (!fileInfo || editorClosed || readyPath !== fileInfo.path) return;
        const content = textarea.value, expectedContent = loadedContent;
        return runCriticalButtonOperation(`保存 ${fileInfo.label}`, saveBtn, '保存中\u2026', async () => {
          select.disabled = true; reloadBtn.disabled = true;
          try {
            const current = await readEditableLocalFile(fileInfo);
            if (!current.ok || current.content !== expectedContent) {
              readyPath = '';
              createToast('文件已变化或无法读取；未覆盖原文件，请重新读取后编辑','yellow',9000);
              return false;
            }
            const saved = await writeEditableLocalFile(fileInfo, content);
            if (saved && !editorClosed) await loadSelected();
            return saved;
          } finally { select.disabled = false; reloadBtn.disabled = false; }
        });
      };
      await loadSelected();
    };

    const editBtn = document.createElement('button');
    editBtn.classList.add('btn');
    editBtn.textContent = '配置文件';
    editBtn.onclick = async () => {
      try {
        if (!(await ensureReady({ readOnly: true }))) return;
        await showEditableLocalFilesDialog();
      } catch (error) {
        createToast(`无法打开配置文件<br>${safeTextToHtml(error && error.message ? error.message : error)}`, 'red', 9000);
      }
    };

    // \u8ba2\u9605\u94fe\u63a5\u529f\u80fd
    const importSub = async () => {
      operationStage('读取已保存的订阅');
      const [currentSources, currentConvertMode, currentRuleMode, configSource] = await Promise.all([
        readCurrentSubSources({ includeDisabled: true }),
        readSavedSubConvertMode(),
        readCurrentSubRuleMode(),
        readConfigSource(),
      ]);
      const gist = configSource === 'uploaded_config' ? await f50GistManaged() : null;
      let gistOverview = '';
      if (gist) {
        const read = await readYamlObject(CLASH_CONFIG, 'config.yaml');
        if (!read.ok) throw Error(read.message || '无法读取配置');
        const config = read.value, manual = new Set(config['x-f50-gist-manual-providers'] || []);
        const providers = Object.entries(config['proxy-providers'] || {}).filter(([name])=>!manual.has(name)).map(([name,p])=>{
          const source = config['x-f50-provider-sources']?.[name];
          return [name,{...p,url:p.url || (typeof source === 'string' ? source : source?.url)}];
        });
        const nodes = (config.proxies || []).map(p=>p.name).filter(Boolean);
        gistOverview = `<details style="font-size:.64rem;overflow-wrap:anywhere"><summary>Gist：${providers.length} 个订阅 · ${nodes.length} 个节点</summary>${providers.map(([name,p])=>`<div>${safeTextToHtml(name)}${p.url?' · '+safeTextToHtml(p.url):''}</div>`).join('')}<div>${safeTextToHtml(nodes.join('、'))}</div></details>`;
      }
      const { el, close } = createFixedToast(
        'mm_sub_input_toast',
        `
            <div style="pointer-events:all;width:80vw;max-width:800px;">
                <div class="title" style="margin:0">订阅设置</div>
                <div style="margin:14px 0;display:flex;flex-direction:column;gap:10px;">
                    ${gistOverview}
                    <div id="mm_sub_rows" style="display:flex;flex-direction:column;gap:8px;"></div>
                    <div class="kano-dialog-actions kano-actions-2" style="--kano-action-count:2;">
                      <button style="font-size:.64rem" id="mm_sub_add_btn">添加订阅</button>
                      <button style="font-size:.64rem" id="mm_sub_clear_btn">清空订阅</button>
                    </div>
                    <label style="display:${gist ? 'none' : 'flex'};align-items:center;gap:8px;font-size:.64rem;">
                      <span>配置来源</span>
                      <select id="mm_sub_rule_mode" style="flex:1;min-width:0;padding:8px;border-radius:8px;background:#111827;color:#dbeafe;">
                        <option value="${SUB_RULE_MODE_TEMPLATE}">使用本地模板</option>
                      </select>
                    </label>
                    ${!gist && configSource == 'uploaded_config' ? '<label style="font-size:.64rem;"><input type="checkbox" id="mm_sub_replace_custom"> 将所选订阅配置应用到当前自定义配置（不勾选则只保存订阅设置）</label>' : ''}
                    <div id="mm_sub_mode_hint" role="status" style="font-size:.64rem;line-height:1.6;color:#a6c8ee"></div>
                    <label id="mm_sub_convert_label" style="display:${gist ? 'none' : 'flex'};align-items:center;gap:8px;font-size:.64rem;">
                      <span>节点处理</span>
                      <select id="mm_sub_convert_mode" style="flex:1;min-width:0;padding:8px;border-radius:8px;background:#111827;color:#dbeafe;">
                        <option value="${SUB_CONVERT_MODE_PROVIDER}">HTTP Provider（默认，失败时自动本地转换）</option>
                        <option value="${SUB_CONVERT_MODE_LOCAL}">设备本地转换（支持分享链接）</option>
                      </select>
                    </label>
                    <div style="font-size:.62rem;opacity:.78;line-height:1.55;padding:8px 10px;border:1px solid rgba(148,163,184,.22);border-radius:10px;background:rgba(15,23,42,.35);">${gist ? '手动链接会随每次 Gist 同步自动合并；相同链接不重复添加。' : '每行一个订阅链接。禁用后保留链接，但不参与生成或更新；全部禁用时保留当前配置。'}</div>
                    <div style="display:${gist ? 'none' : 'block'};font-size:.6rem;opacity:.72;line-height:1.5;">本地转换仍需联网下载订阅，数据不经过第三方转换站。</div>
                </div>
                <div class="kano-dialog-actions kano-actions-2" style="--kano-action-count:2;">
                    <button style="font-size:.64rem" id="mm_sub_submit_btn">保存并更新</button>
                    <button style="font-size:.64rem" id="mm_sub_close_btn">关闭</button>
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
      ruleModeSelect.value = SUB_RULE_MODE_TEMPLATE;
      const syncRuleMode = () => {
        const note = el.querySelector('#mm_sub_mode_hint');
        setText(note, gist ? '追加到 Gist 配置' : currentRuleMode === 'original' || configSource === 'subscription_original'
          ? '旧订阅原配置已保留；保存并更新时需确认迁移，旧文件会备份'
          : '使用插件本地模板的规则和策略组');
      };
      ruleModeSelect.onchange = syncRuleMode;

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
        input.placeholder = `订阅链接 ${index + 1}`;
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
        removeBtn.textContent = '删除';
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
      ruleModeSelect.value = SUB_RULE_MODE_TEMPLATE;
      syncRuleMode();
      addBtn.onclick = () => addSubRow();
      clearBtn.onclick = async () => {
        const confirmed = await askConfirm(
          'mm_sub_clear_confirm',
          '清空当前编辑内容？',
          '仅清空当前窗口的输入；点击“保存并更新”才会清空已保存的订阅源，直接关闭不会修改设备。',
          '清空',
          '取消',
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

        const hasSubscriptionUrl = sources.some((source) => String(source.url || '').trim());

        const operationToken = acquireCriticalOperation('保存并更新订阅');
        if (!operationToken) return;

        setButtonBusy(submitBtn, true, '处理中…');

        try {
          if (!hasSubscriptionUrl && !gist) {
            const success = await clearSubSourceFile();
            if (success) close();
            return;
          }
          createToast('正在处理订阅…', 'yellow');
          const success = await saveSubSources(
            sources,
            ruleModeSelect.value,
            convertModeSelect.value,
            { applyToCustom: !!el.querySelector('#mm_sub_replace_custom')?.checked,
              migrateLegacy: (currentRuleMode === 'original' || configSource === 'subscription_original')
                && await askConfirm('mm_sub_migrate_legacy', '迁移到本地模板？', '旧配置及来源文件会备份；校验或启动失败时恢复旧状态。', '迁移并更新', '取消') },
          );

          operationFinish(success);
          if (success) {
            close();
          }
        } catch (e) {
          if (e?.name === 'OperationCancelled') return;
          operationFinish(false, e.message || String(e));
          createToast(`处理订阅失败<br>${safeTextToHtml(e && e.message ? e.message : e)}`, 'red');
        } finally {
          setButtonBusy(submitBtn, false);
          await releaseCriticalOperation(operationToken);
        }
      };
    };

    // \u521b\u5efa\u8ba2\u9605\u94fe\u63a5\u6309\u94ae
    const subBtn = document.createElement('button');
    subBtn.classList.add('btn');
    subBtn.textContent = '订阅设置';
    subBtn.onclick = async () => {
  return runCriticalOperation('读取订阅设置', async () => {
    if (!(await ensureReady({ readOnly: true }))) return false;
    await importSub();
    return true;
  });
};

    const updateSubBtn = document.createElement('button');
    updateSubBtn.classList.add('btn');
    updateSubBtn.textContent = '更新订阅';
    updateSubBtn.onclick = async () => {
      const operationToken = acquireCriticalOperation('更新订阅');
      if (!operationToken) return;
      setButtonBusy(updateSubBtn, true, '更新中\u2026');
      try {
        operationStage('检查订阅');
        if (!(await ensureReady({ readOnly: true }))) { operationFinish(false); return; }
        const ruleMode = await readCurrentSubRuleMode();
        if (await readConfigSource() == 'uploaded_config') {
          operationFinish(await updateSubProviders([]));
          return;
        }
        const storedSources = await readCurrentSubSources({ includeDisabled: true });
        const sources = normalizeSubSourceList(storedSources);
        validateSubscriptionMode(storedSources, ruleMode);
        const convertMode = await readSavedSubConvertMode();
        if (storedSources.length > 0 && sources.length == 0) {
          createToast('所有订阅链接均已禁用；请先启用至少一个订阅。', 'yellow', 7000);
          return;
        }
        if (sources.length == 0) {
          const sourceCheck = await inspectConfigNodeSource(sources, { requireSavedSubscription: true });
          if (!sourceCheck.ok) {
            createToast(sourceCheck.message, 'red', 10000);
            return;
          }
        }
        createToast('正在检查订阅并选择更新方式…', 'yellow');
        const updated = await updateSubProviders(sources, ruleMode, convertMode);
        operationFinish(updated);
      } catch (error) {
        if (error?.name === 'OperationCancelled') return;
        operationFinish(false, error.message || String(error));
        createToast(safeTextToHtml(error.message || String(error)), 'red', 10000);
      } finally {
        setButtonBusy(updateSubBtn, false);
        await releaseCriticalOperation(operationToken);
      }
    };

    const applySavedOverrides = async () => {
      createToast('正在重建配置并应用自定义规则…', 'yellow');
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
          createToast('请填写完整的规则类型、规则内容与策略', 'yellow', 5000);
          return;
        }
        if (rule.content.includes(',')) {
          createToast('复杂规则请使用 JS 覆写；图形规则内容不能包含英文逗号', 'yellow', 6000);
          return;
        }
        const key = `${rule.position}|${formatRuleOverrideRule(rule)}`;
        if (config.rules.some((item) => `${item.position}|${formatRuleOverrideRule(item)}` == key)) {
          createToast('该规则已存在', 'yellow', 4000);
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
        return runCriticalButtonOperation('保存图形规则', saveBtn, '保存中…', async () => {
          if (await saveCurrent()) createToast('图形规则已保存', 'green');
        });
      };
      applyBtn.onclick = async () => {
        return runCriticalButtonOperation('应用图形规则', applyBtn, '应用中…', async () => {
          if (!(await saveCurrent())) return;
          if (await applySavedOverrides()) close();
        });
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
              定义 <code>main(config)</code> 处理复杂规则；清空并保存可停用。仅运行信任的代码，Worker 隔离不等于安全沙箱。
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
        return runCriticalButtonOperation('保存 JS 覆写', saveBtn, '保存中…', async () => {
          if (await saveJsOverrideText(textarea.value)) createToast('JS 覆写已保存', 'green');
        });
      };
      applyBtn.onclick = async () => {
        return runCriticalButtonOperation('应用 JS 覆写', applyBtn, '应用中…', async () => {
          if (!(await saveJsOverrideText(textarea.value))) return;
          if (await applySavedOverrides()) close();
        });
      };
    };

    const showAirportDnsDialog = async () => {
      const [read, runtime] = await Promise.all([
        readAirportDnsTemplate(), readYamlObject(CLASH_CONFIG, '当前配置'),
      ]);
      if (!read.ok) { createToast(safeTextToHtml(read.message), 'red', 8000); return; }
      const policy = new Map(Object.entries(read.value.dns && read.value.dns['proxy-server-nameserver-policy'] || {}));
      const currentPolicy = runtime.ok && runtime.value.dns && runtime.value.dns['proxy-server-nameserver-policy'] || {};
      let editingDomain = null;
      const { el, close } = createFixedToast('mm_airport_dns_dialog', `
        <div style="pointer-events:all;width:92vw;max-width:760px;">
          <div class="title" style="margin:0">节点 DNS 策略</div>
          <div style="margin:10px 0;font-size:.62rem;line-height:1.7;opacity:.85;">用于解析代理节点域名。填写服务商提供的 DNS；节点地址是 IP 时无需配置。保存后点击“应用模板”生效，订阅更新会保留。</div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
            <label style="font-size:.64rem;">节点域名（每行一个）<textarea id="mm_airport_dns_domains" rows="4" style="width:100%;box-sizing:border-box;" placeholder="node.example.com&#10;+.example.net"></textarea></label>
            <label style="font-size:.64rem;">DNS 地址（每行一个）<textarea id="mm_airport_dns_servers" rows="4" style="width:100%;box-sizing:border-box;" placeholder="dns.example.com:1066&#10;https://dns.example.com/dns-query"></textarea></label>
          </div>
          <div class="kano-dialog-actions kano-actions-1" style="--kano-action-count:1;margin-top:8px;"><button id="mm_airport_dns_add">添加 / 更新</button></div>
          <div style="margin-top:10px;font-size:.62rem;">当前配置${runtime.ok ? `已识别 ${Object.keys(currentPolicy).length} 条节点 DNS 策略` : '无法读取'}</div>
          <textarea id="mm_airport_dns_yaml" rows="5" style="width:100%;box-sizing:border-box;margin-top:8px;" placeholder="粘贴 proxy-server-nameserver-policy 配置，支持 YAML 锚点和别名"></textarea>
          <div class="kano-dialog-actions kano-actions-3" style="--kano-action-count:3;margin-top:8px;">
            <button id="mm_airport_dns_current" ${runtime.ok ? '' : 'disabled'}>导入当前配置</button>
            <button id="mm_airport_dns_import">导入粘贴内容</button>
            <button id="mm_airport_dns_copy">复制 DNS 策略</button>
          </div>
          <div id="mm_airport_dns_list" style="margin-top:10px;max-height:35vh;overflow:auto;"></div>
          <div class="kano-dialog-actions kano-actions-2" style="--kano-action-count:2;margin-top:12px;">
            <button id="mm_airport_dns_save">保存</button><button id="mm_airport_dns_close">关闭</button>
          </div>
        </div>
      `);
      const domains = el.querySelector('#mm_airport_dns_domains');
      const servers = el.querySelector('#mm_airport_dns_servers');
      const yaml = el.querySelector('#mm_airport_dns_yaml');
      const list = el.querySelector('#mm_airport_dns_list');
      const render = () => {
        resetChildren(list);
        if (!policy.size) { list.textContent = '暂无节点 DNS 策略'; return; }
        for (const [domain, value] of policy) {
          const addresses = Array.isArray(value) ? value : [value];
          const row = document.createElement('div');
          row.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:8px;border-bottom:1px solid rgba(255,255,255,.1);';
          const text = document.createElement('div');
          text.style.cssText = 'font-size:.62rem;overflow-wrap:anywhere;';
          text.textContent = `${domain} → ${addresses.join('，')}`;
          const edit = document.createElement('button');
          edit.textContent = '编辑';
          edit.onclick = () => { editingDomain = domain; domains.value = domain; servers.value = addresses.join('\n'); };
          const remove = document.createElement('button');
          remove.textContent = '删除';
          remove.onclick = () => {
            policy.delete(domain);
            if (editingDomain === domain) {
              editingDomain = null;
              domains.value = ''; servers.value = '';
            }
            render();
          };
          row.append(text, edit, remove);
          list.appendChild(row);
        }
      };
      const addEntry = () => {
        try {
          const names = domains.value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
          const addresses = servers.value.split(/\r?\n/).map((address) => address.trim()).filter(Boolean);
          if (!names.length) throw new Error('请填写节点域名');
          const next = updateAirportDnsTemplate({}, Object.fromEntries(names.map((name) => [name, addresses])));
          if (editingDomain && !names.includes(editingDomain)) policy.delete(editingDomain);
          for (const [name, value] of Object.entries(next.dns['proxy-server-nameserver-policy'])) policy.set(name, value);
          editingDomain = null;
          domains.value = ''; servers.value = '';
          render();
          return true;
        } catch (error) { createToast(safeTextToHtml(error.message), 'red', 7000); return false; }
      };
      el.querySelector('#mm_airport_dns_add').onclick = addEntry;
      const importPolicy = (value) => {
        for (const [name, addresses] of Object.entries(extractAirportDnsPolicy(value))) policy.set(name, addresses);
        render();
      };
      el.querySelector('#mm_airport_dns_current').onclick = () => {
        try { importPolicy(currentPolicy); }
        catch (error) { createToast(safeTextToHtml(error.message), 'yellow', 6000); }
      };
      const importBtn = el.querySelector('#mm_airport_dns_import');
      importBtn.onclick = () => runCriticalButtonOperation('导入节点 DNS 策略', importBtn, '导入中…', async () => {
        try { importPolicy(await parseAirportDnsText(yaml.value)); }
        catch (error) { createToast(safeTextToHtml(error.message), 'red', 7000); }
      });
      el.querySelector('#mm_airport_dns_copy').onclick = async () => {
        yaml.value = dumpConfigYaml({ 'proxy-server-nameserver-policy': Object.fromEntries(policy) });
        try {
          if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(yaml.value);
          else { yaml.focus(); yaml.select(); if (!document.execCommand('copy')) throw new Error(); }
          createToast('节点 DNS 策略已复制到剪贴板', 'green', 5000);
        } catch (_) { yaml.focus(); yaml.select(); createToast('已选中配置；请手动复制', 'yellow', 5000); }
      };
      const save = el.querySelector('#mm_airport_dns_save');
      save.onclick = () => runCriticalButtonOperation('保存节点 DNS 策略', save, '保存中…', async () => {
        if ((domains.value.trim() || servers.value.trim()) && !addEntry()) return;
        if (await saveAirportDnsPolicy(Object.fromEntries(policy))) createToast('节点 DNS 策略已保存；点击“应用模板”后生效', 'green', 7000);
      });
      el.querySelector('#mm_airport_dns_close').onclick = close;
      render();
    };

    const templateOverrideBtn = document.createElement('button');
    templateOverrideBtn.classList.add('btn');
    templateOverrideBtn.textContent = '配置与规则';
    templateOverrideBtn.onclick = async () => {
      let ruleOverride, jsOverrideSaved;
      try {
        if (!(await ensureReady({ readOnly: true }))) return;
        [ruleOverride, jsOverrideSaved] = await Promise.all([
          readRuleOverrideConfig(),
          hasSavedJsOverride(),
        ]);
      } catch (error) {
        createToast(`无法读取配置与规则<br>${safeTextToHtml(error && error.message ? error.message : error)}`, 'red', 9000);
        return;
      }
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
                <div class="kano-dialog-menu-title">规则与 DNS</div>
                <div class="kano-dialog-menu-grid" style="--kano-menu-cols:3;">
                  <button id="mm_template_rules_btn">图形规则</button>
                  <button id="mm_template_js_btn">JS 覆写</button>
                  <button id="mm_template_airport_dns_btn">节点 DNS 策略</button>
                </div>
              </div>
              <div class="kano-dialog-menu-section">
                <div class="kano-dialog-menu-title">配置文件</div>
                <div class="kano-dialog-menu-grid" style="--kano-menu-cols:3;">
                  <button id="mm_template_upload_btn">上传模板</button>
                  <button id="mm_template_restore_package_btn">导入配置包</button>
                  <button id="mm_template_rebuild_btn">应用模板</button>
                </div>
              </div>
            </div>
            <div class="kano-dialog-actions kano-actions-1" style="--kano-action-count:1;margin-top:12px;">
              <button style="font-size:.64rem" id="mm_template_close_btn">关闭</button>
            </div>
          </div>
        `,
      );
      const rulesBtn = el.querySelector('#mm_template_rules_btn');
      const jsBtn = el.querySelector('#mm_template_js_btn');
      const airportDnsBtn = el.querySelector('#mm_template_airport_dns_btn');
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
      airportDnsBtn.onclick = async () => {
        close();
        await wait(350);
        await showAirportDnsDialog();
      };
      rebuildBtn.onclick = async () => {
        return runCriticalButtonOperation('应用模板', rebuildBtn, '应用中\u2026', async () => {
          await overwriteConfigByTemplate();
        });
      };
    };

    const policyToolsBtn = document.createElement('button');
    policyToolsBtn.classList.add('btn');
    policyToolsBtn.textContent = '网络设置';
    policyToolsBtn.onclick = async () => {
      try {
        if (!(await ensureReady({ readOnly: true }))) return;
        await showPolicyToolsDialog({ initialTab: 'network' });
      } catch (error) {
        createToast(`无法打开网络设置<br>${safeTextToHtml(error && error.message ? error.message : error)}`, 'red', 9000);
      }
    };

    const quickRunBtn = document.createElement('button');
    quickRunBtn.classList.add('btn');
    quickRunBtn.textContent = '安装/启动';
    quickRunBtn.onclick = async ()=>{
 if(!(await ensureAdvanced()))return false;
 const r=await runShellWithRoot('test -s /data/clash/Scripts/Clash.Service && test -x /data/clash/Scripts/clashctl_arm64',4000);
 if(!r.success)return await installF50PackageFromNetwork();
 return await runCriticalOperation('检查并启动猫猫',async()=>await restartClashOk({skipCheck:true}));
};

    const gistSyncBtn = document.createElement('button');
    gistSyncBtn.classList.add('btn');
    gistSyncBtn.textContent = 'Gist \u52a0\u5bc6\u540c\u6b65';
    gistSyncBtn.onclick = async () => {
      if (!(await ensureAdvanced())) return;
      const {el, close} = createFixedToast('mm_gist_sync_dialog', `
        <div style="pointer-events:all;width:92vw;max-width:700px;max-height:85vh;overflow:auto;font-size:.8rem;line-height:1.5;">
          <div class="title" style="margin:0 0 12px">Gist 同步</div>
          <label for="mm_gist_url">Gist Raw 链接</label>
          <input id="mm_gist_url" type="url" maxlength="2048" spellcheck="false" autocomplete="off" placeholder="https://gist.githubusercontent.com/.../raw/config.yaml.age" style="box-sizing:border-box;width:100%;padding:10px;font:inherit;background:#111827;color:#fff;border:1px solid #64748b;border-radius:8px;">
          <label for="mm_gist_key" style="display:block;margin-top:10px">age 私钥</label>
          <input id="mm_gist_key" type="password" maxlength="100" spellcheck="false" autocomplete="new-password" placeholder="AGE-SECRET-KEY-1..." style="box-sizing:border-box;width:100%;padding:10px;font:inherit;background:#111827;color:#fff;border:1px solid #64748b;border-radius:8px;">
          <small id="mm_gist_key_hint" style="display:block;margin:4px 0 8px;color:#94a3b8"></small>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:10px 0;">
            <label><input id="mm_gist_auto" type="checkbox"> 自动同步</label>
            <label>每 <select id="mm_gist_interval" aria-label="同步间隔" style="color-scheme:dark!important;background:#111827!important;color:#fff!important;font:12px Arial;box-sizing:border-box;height:30px;min-height:0;padding:4px 8px;border:1px solid #64748b;border-radius:8px;">
              <option style="background:#111827!important;color:#fff!important;font:inherit;line-height:1.5;" value="1">1 小时</option><option style="background:#111827!important;color:#fff!important;font:inherit;line-height:1.5;" value="6" selected>6 小时</option><option style="background:#111827!important;color:#fff!important;font:inherit;line-height:1.5;" value="12">12 小时</option><option style="background:#111827!important;color:#fff!important;font:inherit;line-height:1.5;" value="24">24 小时</option>
            </select></label>
          </div>
          <div class="kano-dialog-actions kano-actions-3" style="--kano-action-count:3">
            <button id="mm_gist_test" type="button">测试</button>
            <button id="mm_gist_save" type="button">保存设置</button>
            <button id="mm_gist_sync" type="button">同步</button>
          </div>
          <div id="mm_gist_result" role="status" style="white-space:pre-wrap;margin:10px 0"></div>
          <div id="mm_gist_status" role="status" style="white-space:pre-wrap;overflow-wrap:anywhere;color:#94a3b8"></div>
          <details style="margin-top:8px"><summary>更多</summary>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">
              <button id="mm_gist_refresh">重读设置</button>
              <button id="mm_gist_recover">恢复任务</button><button id="mm_gist_cancel">取消任务</button>
              <button id="mm_gist_leave">退出 Gist 管理</button><button id="mm_gist_delete">删除设置</button>
            </div>
          </details>
          <div style="text-align:right;margin-top:8px"><button id="mm_gist_close">关闭</button></div>
        </div>`);
      const q = id => el.querySelector('#mm_gist_'+id);
      let opened=true, pendingKey='', revision=0, currentJob='', foreground=false, settingsLoaded=false, refreshSequence=0, currentFingerprint=null;

      const result = text => { if(opened) q('result').textContent=text; };
      const fmt = value => value && !String(value).startsWith('0001-') ? new Date(value).toLocaleString() : '\u65e0';
      q('url').onblur=()=>{q('url').value=f50GistCleanUrl(q('url').value);};
      q('key').oninput=()=>{pendingKey=q('key').value.trim();};
      const refresh = async (loadForm=false) => {
        const sequence=++refreshSequence;
        const st=await f50GistExec(['status'],15000);
        if(!opened || sequence!==refreshSequence)return null;
        if(!st.ok){settingsLoaded=false;q('status').textContent=f50GistMessage(st.code);return null;}
        if(loadForm || !settingsLoaded){
          const saved=st.settings || {};
          q('url').value=saved.deleted?'':saved.url || '';
          q('auto').checked=!!saved.auto;
          q('interval').value=String(saved.intervalHours || 6);
          revision=saved.revision || 0; settingsLoaded=true;
          pendingKey='';q('key').value='';
        }
        q('key').placeholder=pendingKey ? '\u5df2\u8f93\u5165\u65b0\u79c1\u94a5\uff0c\u5f85\u4fdd\u5b58' : st.identitySet ? '\u7559\u7a7a\u4fdd\u7559\u5df2\u4fdd\u5b58\u7684\u79c1\u94a5' : 'AGE-SECRET-KEY-1...';
        q('key_hint').textContent=pendingKey?'新私钥待保存':st.identitySet?'已保存私钥，留空表示不更换':'';
        currentFingerprint=st.currentFingerprint || null;
        const state=st.state?.generation===st.settings?.generation?st.state:null;
        const last=state?.last;
        const recent=(st.jobs||[])[0];
        if(!foreground && recent && ['queued','running'].includes(recent.status)) currentJob=recent.id;
        const syncMode=st.settings.auto
          ? (st.schedulerRunning ? '自动同步开启 · 每 '+st.settings.intervalHours+' 小时' : '自动同步开启 · 设备调度未运行')
          : '自动同步关闭';
        const lastTime=state?.lastSuccess ? '上次同步 '+fmt(state.lastSuccess) : '尚未同步';
        const errorCode=st.fingerprintError || st.stateError || (!st.ageReady ? 'age_unavailable' : '') || (last && !last.ok ? last.code : '');
        q('status').textContent=syncMode+' · '+lastTime+(st.activationPending?'\n存在待恢复的同步任务':'')+(errorCode?'\n'+f50GistMessage(errorCode):'');
        return st;
      };
      const busy=on=>{foreground=on;for(const name of ['test','save','sync','delete','recover','leave','refresh'])q(name).disabled=on;};
      const describe=out=>f50GistMessage(out?.code)+(out?.warning?'\n'+f50GistMessage(out.warning):'');
      const launch=async (action,request={})=>{
        if(foreground)return;
        busy(true);result(action==='sync'?'正在同步…':'正在处理…');
        try{
          const started=await f50GistDispatch(action,request);
          if(!started.ok || !started.job){result(f50GistMessage(started.code));return;}
          currentJob=started.job;
          result(action==='sync'?'正在同步…':'正在处理…');
          while(opened){
            const job=await f50GistExec(['job',currentJob],8000);
            if(!opened)break;
            if(job.status==='finished'){
              const out=job.result;result(describe(out));
              if(out?.settingsSaved || action==='delete')await refresh(true);else await refresh(false);
              break;
            }
            if(job.status==='completion_unknown' || job.ok===false){result(f50GistMessage(job.result?.code || job.code)+'\n请执行“恢复同步事务”后重试。');break;}
            await new Promise(resolve=>setTimeout(resolve,2000));
          }
        }catch(_){result('操作失败：设备请求中断，请检查连接后重试。');}
        finally{if(opened)busy(false);}
      };
      const formAction=async action=>{
        if(!settingsLoaded){result('无法读取设置，请稍后重试。');return;}
        const url=f50GistCleanUrl(q('url').value);
        if(!f50GistValidUrl(url)){
          result(url?'请填写完整的 Gist Raw .age 下载链接。':'请先填写 Gist Raw 链接。');
          return;
        }
        q('url').value=url;
        if(q('key').value.trim())pendingKey=q('key').value.trim();
        q('key').value='';
        return launch(action,{url,identity:pendingKey,auto:q('auto').checked,intervalHours:Number(q('interval').value),revision});
      };
      q('test').onclick=()=>formAction('test');
      q('save').onclick=()=>formAction('save');
      q('sync').onclick=()=>settingsLoaded ? launch('sync',{revision,replaceLocal:true,expectedLocal:currentFingerprint}) : result('请先保存 Gist 设置。');
      q('refresh').onclick=()=>{if(window.confirm('重读已保存的设置？当前未保存的输入会丢失。'))return refresh(true);};
      q('leave').onclick=async()=>{
        if(!window.confirm('退出 Gist 管理并关闭自动同步？保留当前配置及已保存私钥。'))return;
        busy(true);
        try {await f50GistLeave();result('已退出 Gist 管理，可使用普通订阅设置。');await refresh(true);}
        catch(error){result(error.message || '退出 Gist 管理失败');}
        finally{if(opened)busy(false);}
      };
      q('cancel').onclick=async()=>{if(currentJob){const r=await f50GistExec(['cancel',currentJob],15000);result(r.ok?'\u5df2\u8bf7\u6c42\u53d6\u6d88\uff1b\u4ee5\u6700\u7ec8\u56de\u6267\u4e3a\u51c6':f50GistMessage(r.code));await refresh(false);}};
      q('recover').onclick=async()=>{busy(true);try{const r=await f50GistExec(['recover'],180000);result(describe(r.result || r));await refresh(false);}finally{if(opened)busy(false);}};
      q('delete').onclick=()=>{if(window.confirm('\u5220\u9664 Gist \u94fe\u63a5\u3001\u79c1\u94a5\u548c\u540c\u6b65\u8bb0\u5f55\uff0c\u5e76\u505c\u6b62\u81ea\u52a8\u540c\u6b65\uff1f\u5f53\u524d config.yaml \u4e0d\u4f1a\u88ab\u5220\u9664\u3002'))return launch('delete');};
      q('close').onclick=()=>{opened=false;pendingKey='';q('key').value='';close();};
      const observer=new MutationObserver(()=>{if(!el.isConnected){opened=false;pendingKey='';observer.disconnect();}});
      observer.observe(document.body,{childList:true,subtree:true});
      await refresh(true);
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

    const coreGroup = appendActionGroup('核心与面板', [quickRunBtn, btn_restart, stopBtn, boot_on, webPanelToggleBtn, refresh, open, controllerSettingsBtn], false);
    appendActionGroup('订阅与配置', [subBtn, updateSubBtn, userAgentBtn, templateOverrideBtn, editBtn, backupBtn, gistSyncBtn], false);
    appendActionGroup('网络与诊断', [policyToolsBtn, rescueBtn, showLogBtn], false);
    appendActionGroup('组件与维护', [btn_enabled, localPackageBtn, clearCacheBtn, btn_disabled], false);
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
        console.error('无法读取猫猫自启状态', e);
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
          isMMRunning().catch((e) => console.error('猫猫运行状态无法读取', e));
        }, 0);
      } catch (e) {
        console.error('猫猫 TProxy 后台初始化失败', e);
      }
    })();
  })();
})(runShellWithRoot);
//</script >
