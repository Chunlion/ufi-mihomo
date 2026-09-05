//<script>
(async () => {
  const VERSION = '2.1.3';
  const TITLE = 'USB 网络模式';
  const MODAL_NAME = 'kano_usb_native_mode_manager_modal';
  const STYLE_ID = 'kano_usb_native_mode_manager_style';

  const BASE_DIR = '/data/kano_usb_mode_manager_v2';
  const CONFIG_FILE = `${BASE_DIR}/config.env`;
  const MANAGER_FILE = `${BASE_DIR}/usb_mode_manager.sh`;
  const DAEMON_FILE = `${BASE_DIR}/usb_mode_daemon.sh`;
  const PID_FILE = `${BASE_DIR}/daemon.pid`;
  const LOG_FILE = `${BASE_DIR}/manager.log`;
  const PAUSE_FILE = `${BASE_DIR}/paused`;
  const VERSION_FILE = `${BASE_DIR}/version`;
  const BOOT_SH_FILE = '/sdcard/ufi_tools_boot.sh';
  const BOOT_TAG = 'kano_usb_mode_manager_v2';
  const BOOT_LINE = `# ${BOOT_TAG}\nnohup sh ${DAEMON_FILE} start >/dev/null 2>&1 &`;

  const MODES = [
    {
      key: 'rndis',
      label: 'RNDIS',
      hint: 'Windows 兼容性最好，使用 F50 原厂 SIPA 通道',
    },
    {
      key: 'ncm',
      label: 'CDC-NCM',
      hint: 'Windows 11 原生支持，使用原厂 NCM 组合',
    },
    {
      key: 'ecm',
      label: 'CDC-ECM',
      hint: '适合 Linux / OpenWrt，Windows 通常需额外驱动',
    },
  ];

  const DEFAULT_CONFIG = {
    mode: 'rndis',
    adb: '0',
    permanent: '0',
    patrol: '1',
    autoRollback: '1',
    bootDelay: '75',
    pollInterval: '8',
  };

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const shellQuote = (value = '') => `'${String(value).replace(/'/g, `'\\''`)}'`;

  const encodePayload = (value = '') => {
    try {
      return btoa(unescape(encodeURIComponent(String(value))));
    } catch {
      return '';
    }
  };

  const run = async (command, timeout = 30000) => {
    const res = await runShellWithRoot(command, timeout);
    return {
      ok: Boolean(res?.success),
      text: String(res?.content || '').trim(),
      raw: res,
    };
  };

  const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

  const MANAGER_SCRIPT = `#!/system/bin/sh
BASE_DIR="/data/kano_usb_mode_manager_v2"
CONFIG_FILE="$BASE_DIR/config.env"
STATE_FILE="$BASE_DIR/state.env"
LOG_FILE="$BASE_DIR/manager.log"
LOCK_DIR="$BASE_DIR/switch.lock"
PAUSE_FILE="$BASE_DIR/paused"
ORIGINAL_PERSIST_FILE="$BASE_DIR/original_persist_usb_config"
G="/config/usb_gadget/g1"
BRIDGE="br0"

mkdir -p "$BASE_DIR"

rotate_log() {
  [ -f "$LOG_FILE" ] || return 0
  size=$(wc -c < "$LOG_FILE" 2>/dev/null)
  [ -n "$size" ] || size=0
  if [ "$size" -gt 262144 ]; then
    tail -c 131072 "$LOG_FILE" > "$LOG_FILE.tmp" 2>/dev/null
    mv -f "$LOG_FILE.tmp" "$LOG_FILE"
  fi
}

log_msg() {
  rotate_log
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

load_config() {
  MODE="rndis"
  WIRED_ADB="0"
  PERMANENT="0"
  PATROL_ENABLED="1"
  AUTO_ROLLBACK="1"
  BOOT_DELAY_SECONDS="75"
  POLL_INTERVAL_SECONDS="8"
  [ -f "$CONFIG_FILE" ] && . "$CONFIG_FILE"

  case "$MODE" in rndis|ncm|ecm) ;; *) MODE="rndis" ;; esac
  [ "$WIRED_ADB" = "1" ] || WIRED_ADB="0"
  [ "$PERMANENT" = "1" ] || PERMANENT="0"
  [ "$PATROL_ENABLED" = "1" ] || PATROL_ENABLED="0"
  [ "$AUTO_ROLLBACK" = "0" ] || AUTO_ROLLBACK="1"

  case "$BOOT_DELAY_SECONDS" in *[!0-9]*|'') BOOT_DELAY_SECONDS="75" ;; esac
  [ "$BOOT_DELAY_SECONDS" -ge 30 ] 2>/dev/null || BOOT_DELAY_SECONDS="30"
  [ "$BOOT_DELAY_SECONDS" -le 300 ] 2>/dev/null || BOOT_DELAY_SECONDS="300"

  case "$POLL_INTERVAL_SECONDS" in *[!0-9]*|'') POLL_INTERVAL_SECONDS="8" ;; esac
  [ "$POLL_INTERVAL_SECONDS" -ge 3 ] 2>/dev/null || POLL_INTERVAL_SECONDS="3"
  [ "$POLL_INTERVAL_SECONDS" -le 60 ] 2>/dev/null || POLL_INTERVAL_SECONDS="60"
}

target_config() {
  mode="$1"
  adb="$2"
  case "$mode:$adb" in
    rndis:0) echo "rndis" ;;
    rndis:1) echo "rndis,adb" ;;
    ncm:0) echo "ncm,mtp" ;;
    ncm:1) echo "ncm,mtp,adb" ;;
    ecm:0) echo "ecm,mtp" ;;
    ecm:1) echo "ecm,mtp,adb" ;;
    *) echo "rndis" ;;
  esac
}

mode_from_config() {
  cfg="$1"
  case "$cfg" in
    *ncm*) echo "ncm" ;;
    *ecm*) echo "ecm" ;;
    *rndis*) echo "rndis" ;;
    *) echo "unknown" ;;
  esac
}

adb_from_config() {
  cfg="$1"
  case ",$cfg," in *,adb,*) echo "1" ;; *) echo "0" ;; esac
}

get_udc_name() {
  ls /sys/class/udc 2>/dev/null | head -n1
}

get_udc_state() {
  udc=$(get_udc_name)
  if [ -n "$udc" ] && [ -f "/sys/class/udc/$udc/state" ]; then
    cat "/sys/class/udc/$udc/state" 2>/dev/null | head -n1
  else
    echo "unknown"
  fi
}

wait_prop() {
  prop="$1"
  expected="$2"
  timeout_s="$3"
  i=0
  while [ "$i" -lt "$timeout_s" ]; do
    value=$(getprop "$prop")
    [ "$value" = "$expected" ] && return 0
    sleep 1
    i=$((i + 1))
  done
  return 1
}

acquire_lock() {
  i=0
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    lock_pid=$(cat "$LOCK_DIR/pid" 2>/dev/null)
    if [ -z "$lock_pid" ] || ! kill -0 "$lock_pid" 2>/dev/null; then
      log_msg "WARN removing stale switch lock pid=$lock_pid"
      rm -rf "$LOCK_DIR" 2>/dev/null
      continue
    fi
    i=$((i + 1))
    if [ "$i" -ge 30 ]; then
      log_msg "ERROR lock timeout owner=$lock_pid"
      return 1
    fi
    sleep 1
  done
  echo $$ > "$LOCK_DIR/pid"
  return 0
}

release_lock() {
  rm -rf "$LOCK_DIR" 2>/dev/null
}

save_state() {
  result="$1"
  reason="$2"
  target="$3"
  ifname="$4"
  cat > "$STATE_FILE" <<STATEEOF
LAST_RESULT="$result"
LAST_REASON="$reason"
LAST_TARGET="$target"
LAST_IFNAME="$ifname"
LAST_TIME="$(date '+%Y-%m-%d %H:%M:%S')"
STATEEOF
}

get_function_ifname() {
  mode="$1"
  case "$mode" in
    ncm) candidates="ncm.gs0 ncm.usb0" ;;
    ecm) candidates="ecm.gs0 ecm.usb0" ;;
    rndis) candidates="rndis.gs4 rndis.usb0" ;;
    *) candidates="" ;;
  esac

  for name in $candidates; do
    file="$G/functions/$name/ifname"
    [ -f "$file" ] || continue
    ifname=$(cat "$file" 2>/dev/null | head -n1)
    case "$ifname" in
      ''|'(unnamed net_device)') continue ;;
    esac
    if [ -d "/sys/class/net/$ifname" ]; then
      echo "$ifname"
      return 0
    fi
  done
  return 1
}

wait_function_ifname() {
  mode="$1"
  timeout_s="$2"
  i=0
  while [ "$i" -lt "$timeout_s" ]; do
    ifname=$(get_function_ifname "$mode")
    if [ -n "$ifname" ]; then
      echo "$ifname"
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  return 1
}

master_of() {
  ifname="$1"
  link=$(readlink "/sys/class/net/$ifname/master" 2>/dev/null)
  [ -n "$link" ] && basename "$link"
}

attach_to_bridge() {
  ifname="$1"
  bridge_attempt=0
  while [ "$bridge_attempt" -lt 20 ]; do
    if [ -d "/sys/class/net/$ifname" ] && [ -d "/sys/class/net/$BRIDGE/bridge" ] &&
       ip link set "$ifname" up 2>/dev/null; then
      current_master=$(master_of "$ifname")
      if [ "$current_master" != "$BRIDGE" ]; then
        [ -n "$current_master" ] && ip link set "$ifname" nomaster 2>/dev/null
        ip link set "$ifname" master "$BRIDGE" 2>/dev/null || true
      fi
      if [ "$(master_of "$ifname")" = "$BRIDGE" ] &&
         ip link set "$ifname" up 2>/dev/null; then
        return 0
      fi
    fi
    bridge_attempt=$((bridge_attempt + 1))
    sleep 1
  done
  return 1
}

repair_network() {
  mode="$1"
  case "$mode" in
    ncm|ecm)
      ifname=$(wait_function_ifname "$mode" 20) || {
        log_msg "ERROR $mode netdev not found"
        return 1
      }
      attach_to_bridge "$ifname" || {
        log_msg "ERROR failed to attach $ifname to $BRIDGE"
        return 1
      }
      log_msg "network repaired: $ifname -> $BRIDGE"
      echo "$ifname"
      return 0
      ;;
    rndis)
      if [ -d /sys/class/net/usb0 ] && [ "$(master_of usb0)" = "$BRIDGE" ]; then
        ip link set usb0 nomaster 2>/dev/null
        ip link set usb0 down 2>/dev/null
      fi
      if [ -d /sys/class/net/sipa_usb0 ]; then
        attach_to_bridge sipa_usb0 || {
          log_msg "ERROR failed to attach sipa_usb0 to $BRIDGE"
          return 1
        }
        echo "sipa_usb0"
        return 0
      fi
      ifname=$(get_function_ifname rndis)
      if [ -n "$ifname" ]; then
        attach_to_bridge "$ifname" || {
          log_msg "ERROR failed to attach $ifname to $BRIDGE"
          return 1
        }
        echo "$ifname"
        return 0
      fi
      log_msg "ERROR rndis netdev not found"
      return 1
      ;;
  esac
  return 1
}

verify_composition() {
  mode="$1"
  target="$2"
  cfg=$(getprop sys.usb.config)
  state=$(getprop sys.usb.state)
  [ "$cfg" = "$target" ] || return 1
  [ "$state" = "$target" ] || return 1

  link=$(readlink "$G/configs/b.1/f1" 2>/dev/null)
  case "$mode" in
    ncm) echo "$link" | grep -q 'ncm\.' || return 1 ;;
    ecm) echo "$link" | grep -q 'ecm\.' || return 1 ;;
    rndis) echo "$link" | grep -q 'rndis\.' || return 1 ;;
  esac
  return 0
}

start_adbd_safe() {
  start adbd 2>/dev/null || setprop ctl.start adbd
}

raw_apply() {
  mode="$1"
  adb="$2"
  reason="$3"
  target=$(target_config "$mode" "$adb")
  current=$(getprop sys.usb.config)

  log_msg "apply begin reason=$reason mode=$mode adb=$adb target=$target current=$current"

  if [ "$current" = "$target" ] && verify_composition "$mode" "$target"; then
    ifname=$(repair_network "$mode") || return 1
    save_state "ok" "$reason-no-reenumeration" "$target" "$ifname"
    log_msg "apply skipped: composition already active"
    return 0
  fi

  if [ "$adb" = "1" ]; then
    start_adbd_safe
  fi

  setprop sys.usb.config none
  wait_prop sys.usb.state none 15 || log_msg "WARN sys.usb.state did not reach none"
  sleep 1

  if [ "$adb" = "1" ]; then
    start_adbd_safe
  fi

  setprop sys.usb.config "$target"
  if ! wait_prop sys.usb.state "$target" 40; then
    if [ "$mode" = "rndis" ]; then
      log_msg "WARN property RNDIS failed, trying Android USB service"
      svc usb setFunctions rndis >/dev/null 2>&1
      sleep 3
      [ "$adb" = "1" ] && setprop sys.usb.config rndis,adb
      wait_prop sys.usb.state "$target" 20 || true
    fi
  fi

  if ! verify_composition "$mode" "$target"; then
    log_msg "ERROR composition verification failed cfg=$(getprop sys.usb.config) state=$(getprop sys.usb.state) f1=$(readlink "$G/configs/b.1/f1" 2>/dev/null)"
    save_state "failed" "$reason" "$target" "unknown"
    return 1
  fi

  ifname=$(repair_network "$mode") || {
    save_state "failed-network" "$reason" "$target" "unknown"
    return 1
  }

  carrier="unknown"
  [ -f "/sys/class/net/$ifname/carrier" ] && carrier=$(cat "/sys/class/net/$ifname/carrier" 2>/dev/null)
  log_msg "apply success target=$target ifname=$ifname carrier=$carrier udc=$(get_udc_state)"
  save_state "ok" "$reason" "$target" "$ifname"
  return 0
}

rollback_rndis() {
  log_msg "rollback begin -> RNDIS"
  setprop persist.sys.usb.config rndis
  setprop sys.usb.config none
  wait_prop sys.usb.state none 12 || true
  sleep 1
  setprop sys.usb.config rndis
  if ! wait_prop sys.usb.state rndis 30; then
    svc usb setFunctions rndis >/dev/null 2>&1
    sleep 3
  fi
  ifname=$(repair_network rndis) || ifname="unknown"
  if verify_composition rndis rndis &&
     [ "$(getprop persist.sys.usb.config)" = "rndis" ] &&
     [ "$ifname" != "unknown" ]; then
    save_state "rollback-rndis" "auto-rollback" "rndis" "$ifname"
    log_msg "rollback finished cfg=$(getprop sys.usb.config) state=$(getprop sys.usb.state) ifname=$ifname"
    return 0
  fi
  save_state "rollback-failed" "auto-rollback" "rndis" "$ifname"
  log_msg "ERROR rollback failed cfg=$(getprop sys.usb.config) state=$(getprop sys.usb.state) persist=$(getprop persist.sys.usb.config) ifname=$ifname"
  return 1
}

apply_mode() {
  mode="$1"
  adb="$2"
  reason="$3"
  load_config
  acquire_lock || return 1
  trap 'release_lock' EXIT INT TERM

  raw_apply "$mode" "$adb" "$reason"
  rc=$?
  if [ "$rc" -ne 0 ] && [ "$AUTO_ROLLBACK" = "1" ] && [ "$mode" != "rndis" ]; then
    rollback_rndis
  fi

  release_lock
  trap - EXIT INT TERM
  return "$rc"
}

backup_original_persist() {
  if [ ! -f "$ORIGINAL_PERSIST_FILE" ]; then
    getprop persist.sys.usb.config > "$ORIGINAL_PERSIST_FILE"
    chmod 600 "$ORIGINAL_PERSIST_FILE" 2>/dev/null
    log_msg "backed up persist.sys.usb.config=$(cat "$ORIGINAL_PERSIST_FILE")"
  fi
}

sync_persist() {
  load_config
  backup_original_persist
  target=$(target_config "$MODE" "$WIRED_ADB")
  setprop persist.sys.usb.config "$target"
  sleep 1
  actual=$(getprop persist.sys.usb.config)
  if [ "$actual" = "$target" ]; then
    log_msg "persist synced: $target"
    echo "$target"
    return 0
  fi
  log_msg "WARN persist sync failed expected=$target actual=$actual"
  echo "$actual"
  return 1
}

restore_original_persist() {
  if [ -f "$ORIGINAL_PERSIST_FILE" ]; then
    original=$(cat "$ORIGINAL_PERSIST_FILE" 2>/dev/null)
    [ -n "$original" ] || original="charging"
    setprop persist.sys.usb.config "$original"
    log_msg "persist restored: $original"
    echo "$original"
    return 0
  fi
  return 1
}

reconcile() {
  load_config
  [ "$PERMANENT" = "1" ] || return 0
  [ -f "$PAUSE_FILE" ] && return 2
  target=$(target_config "$MODE" "$WIRED_ADB")
  current=$(getprop sys.usb.config)
  if [ "$current" != "$target" ] || ! verify_composition "$MODE" "$target"; then
    apply_mode "$MODE" "$WIRED_ADB" "daemon-reconcile"
    rc=$?
    if [ "$rc" -eq 0 ]; then
      sync_persist >/dev/null 2>&1 || return 1
    fi
    return "$rc"
  fi
  repair_network "$MODE" >/dev/null 2>&1
  return $?
}

status_output() {
  load_config
  target=$(target_config "$MODE" "$WIRED_ADB")
  current=$(getprop sys.usb.config)
  state=$(getprop sys.usb.state)
  current_mode=$(mode_from_config "$current")
  current_adb=$(adb_from_config "$current")
  udc=$(get_udc_name)
  udc_state=$(get_udc_state)
  persist=$(getprop persist.sys.usb.config)
  ifname=""
  if [ "$current_mode" = "rndis" ] && [ -d /sys/class/net/sipa_usb0 ]; then
    ifname="sipa_usb0"
  elif [ "$current_mode" != "unknown" ]; then
    ifname=$(get_function_ifname "$current_mode")
  fi
  [ -n "$ifname" ] || ifname="unknown"

  if_up="0"
  carrier="unknown"
  master="none"
  if [ -d "/sys/class/net/$ifname" ]; then
    ip link show "$ifname" 2>/dev/null | grep -q '<[^>]*UP' && if_up="1"
    [ -f "/sys/class/net/$ifname/carrier" ] && carrier=$(cat "/sys/class/net/$ifname/carrier" 2>/dev/null)
    master=$(master_of "$ifname")
    [ -n "$master" ] || master="none"
  fi

  last_result="none"
  last_reason="none"
  last_target="none"
  last_time="none"
  if [ -f "$STATE_FILE" ]; then
    last_result=$(grep '^LAST_RESULT=' "$STATE_FILE" | head -n1 | cut -d= -f2- | tr -d '"')
    last_reason=$(grep '^LAST_REASON=' "$STATE_FILE" | head -n1 | cut -d= -f2- | tr -d '"')
    last_target=$(grep '^LAST_TARGET=' "$STATE_FILE" | head -n1 | cut -d= -f2- | tr -d '"')
    last_time=$(grep '^LAST_TIME=' "$STATE_FILE" | head -n1 | cut -d= -f2- | tr -d '"')
  fi

  paused="0"
  [ -f "$PAUSE_FILE" ] && paused="1"

  echo "MODE=$MODE"
  echo "WIRED_ADB=$WIRED_ADB"
  echo "PERMANENT=$PERMANENT"
  echo "PATROL_ENABLED=$PATROL_ENABLED"
  echo "AUTO_ROLLBACK=$AUTO_ROLLBACK"
  echo "BOOT_DELAY_SECONDS=$BOOT_DELAY_SECONDS"
  echo "POLL_INTERVAL_SECONDS=$POLL_INTERVAL_SECONDS"
  echo "TARGET_CONFIG=$target"
  echo "CURRENT_CONFIG=$current"
  echo "CURRENT_STATE=$state"
  echo "CURRENT_MODE=$current_mode"
  echo "CURRENT_ADB=$current_adb"
  echo "UDC=$udc"
  echo "UDC_STATE=$udc_state"
  echo "IFNAME=$ifname"
  echo "IF_UP=$if_up"
  echo "CARRIER=$carrier"
  echo "MASTER=$master"
  echo "PERSIST_CONFIG=$persist"
  echo "PAUSED=$paused"
  echo "LAST_RESULT=$last_result"
  echo "LAST_REASON=$last_reason"
  echo "LAST_TARGET=$last_target"
  echo "LAST_TIME=$last_time"
}

case "$1" in
  apply)
    apply_mode "$2" "$3" "manual"
    ;;
  apply-config)
    load_config
    reason="$2"
    [ -n "$reason" ] || reason="config"
    apply_mode "$MODE" "$WIRED_ADB" "$reason"
    ;;
  repair)
    cfg=$(getprop sys.usb.config)
    mode=$(mode_from_config "$cfg")
    [ "$mode" = "unknown" ] && exit 1
    repair_network "$mode"
    ;;
  reconcile)
    reconcile
    ;;
  sync-persist)
    sync_persist
    ;;
  restore-persist)
    restore_original_persist
    ;;
  save-original)
    backup_original_persist
    ;;
  pause)
    : > "$PAUSE_FILE"
    log_msg "daemon enforcement paused"
    ;;
  resume)
    rm -f "$PAUSE_FILE"
    log_msg "daemon enforcement resumed"
    ;;
  safe-rndis)
    : > "$PAUSE_FILE"
    backup_original_persist
    setprop persist.sys.usb.config rndis
    apply_mode rndis 0 "safe-rndis"
    rc=$?
    if [ "$(getprop persist.sys.usb.config)" != "rndis" ]; then
      log_msg "ERROR safe RNDIS persist verification failed"
      exit 1
    fi
    exit "$rc"
    ;;
  status)
    status_output
    ;;
  *)
    echo "usage: $0 {apply MODE ADB|apply-config [REASON]|repair|reconcile|sync-persist|restore-persist|save-original|pause|resume|safe-rndis|status}"
    exit 1
    ;;
esac
`;

  const DAEMON_SCRIPT = `#!/system/bin/sh
BASE_DIR="/data/kano_usb_mode_manager_v2"
CONFIG_FILE="$BASE_DIR/config.env"
MANAGER_FILE="$BASE_DIR/usb_mode_manager.sh"
PID_FILE="$BASE_DIR/daemon.pid"
LOG_FILE="$BASE_DIR/manager.log"
PAUSE_FILE="$BASE_DIR/paused"

mkdir -p "$BASE_DIR"

log_msg() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [daemon] $*" >> "$LOG_FILE"
}

load_config() {
  MODE="rndis"
  WIRED_ADB="0"
  PERMANENT="0"
  PATROL_ENABLED="1"
  BOOT_DELAY_SECONDS="75"
  POLL_INTERVAL_SECONDS="8"
  [ -f "$CONFIG_FILE" ] && . "$CONFIG_FILE"
  case "$BOOT_DELAY_SECONDS" in *[!0-9]*|'') BOOT_DELAY_SECONDS="75" ;; esac
  case "$POLL_INTERVAL_SECONDS" in *[!0-9]*|'') POLL_INTERVAL_SECONDS="8" ;; esac
  [ "$POLL_INTERVAL_SECONDS" -ge 3 ] 2>/dev/null || POLL_INTERVAL_SECONDS="3"
}

uptime_seconds() {
  awk '{print int($1)}' /proc/uptime 2>/dev/null
}

pause_until_reboot() {
  pause_boot=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null)
  if [ -n "$pause_boot" ]; then
    printf 'auto:%s\\n' "$pause_boot" > "$PAUSE_FILE"
  else
    : > "$PAUSE_FILE"
  fi
}

clear_previous_boot_pause() {
  pause_tag=$(cat "$PAUSE_FILE" 2>/dev/null)
  current_boot=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null)
  case "$pause_tag" in
    auto:*)
      if [ -n "$current_boot" ] && [ "$pause_tag" != "auto:$current_boot" ]; then
        rm -f "$PAUSE_FILE"
        log_msg "previous boot failure pause cleared; retrying saved mode"
      fi
      ;;
  esac
}

wait_boot_ready() {
  load_config
  log_msg "waiting for boot readiness, minimum uptime=$BOOT_DELAY_SECONDS s"

  while true; do
    up=$(uptime_seconds)
    [ -n "$up" ] || up=0
    if [ "$up" -ge "$BOOT_DELAY_SECONDS" ]; then
      break
    fi
    sleep 5
  done

  i=0
  while [ "$i" -lt 180 ]; do
    if [ -d /config/usb_gadget/g1/configs/b.1 ] && \
       [ -d /sys/class/net/br0/bridge ] && \
       [ -n "$(ls /sys/class/udc 2>/dev/null | head -n1)" ] && \
       [ "$(getprop init.svc.vendor.usb_default)" = "running" ]; then
      log_msg "boot dependencies ready at uptime=$(uptime_seconds)s"
      return 0
    fi
    sleep 3
    i=$((i + 3))
  done

  log_msg "WARN boot readiness timed out; waiting again without switching USB"
  return 1
}

pid_is_daemon() {
  pid="$1"
  [ -n "$pid" ] || return 1
  [ -r "/proc/$pid/cmdline" ] || return 1
  tr '\\000' ' ' < "/proc/$pid/cmdline" 2>/dev/null | grep -q 'usb_mode_daemon.sh'
}

start_loop() {
  if [ -f "$PID_FILE" ]; then
    old_pid=$(cat "$PID_FILE" 2>/dev/null)
    if kill -0 "$old_pid" 2>/dev/null && pid_is_daemon "$old_pid"; then
      exit 0
    fi
    rm -f "$PID_FILE"
  fi

  echo $$ > "$PID_FILE"
  trap 'rm -f "$PID_FILE"; exit 0' INT TERM EXIT
  log_msg "started pid=$$"

  until wait_boot_ready; do
    load_config
    [ "$PERMANENT" = "1" ] || exit 0
    sleep 5
  done
  load_config

  if [ "$PERMANENT" != "1" ]; then
    log_msg "permanent mode disabled; daemon exits"
    exit 0
  fi

  clear_previous_boot_pause
  if [ -f "$PAUSE_FILE" ]; then
    log_msg "enforcement is paused; daemon stays idle"
  else
    sh "$MANAGER_FILE" sync-persist >> "$LOG_FILE" 2>&1 || true
    sh "$MANAGER_FILE" apply-config boot >> "$LOG_FILE" 2>&1
    rc=$?
    if [ "$rc" -ne 0 ]; then
      log_msg "initial apply failed rc=$rc; pausing to prevent a USB switch loop"
      pause_until_reboot
    fi
  fi

  fail_count=0
  while true; do
    load_config

    if [ "$PERMANENT" != "1" ]; then
      log_msg "permanent mode disabled; daemon exits"
      exit 0
    fi

    if [ -f "$PAUSE_FILE" ]; then
      sleep "$POLL_INTERVAL_SECONDS"
      continue
    fi

    if [ "$PATROL_ENABLED" = "1" ]; then
      sh "$MANAGER_FILE" reconcile >> "$LOG_FILE" 2>&1
      rc=$?
      if [ "$rc" -eq 0 ] || [ "$rc" -eq 2 ]; then
        fail_count=0
      else
        fail_count=$((fail_count + 1))
        log_msg "reconcile failed rc=$rc count=$fail_count"
        if [ "$fail_count" -ge 3 ]; then
          log_msg "three consecutive failures; pausing and switching to safe RNDIS"
          touch "$PAUSE_FILE"
          sh "$MANAGER_FILE" safe-rndis >> "$LOG_FILE" 2>&1 || \
            log_msg "ERROR safe RNDIS switch failed after consecutive reconcile failures"
          pause_until_reboot
          fail_count=0
        fi
      fi
    fi

    sleep "$POLL_INTERVAL_SECONDS"
  done
}

stop_loop() {
  if [ -f "$PID_FILE" ]; then
    pid=$(cat "$PID_FILE" 2>/dev/null)
    if kill -0 "$pid" 2>/dev/null && pid_is_daemon "$pid"; then
      kill "$pid" 2>/dev/null
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
  log_msg "stopped"
}

status_loop() {
  if [ -f "$PID_FILE" ]; then
    pid=$(cat "$PID_FILE" 2>/dev/null)
    if kill -0 "$pid" 2>/dev/null && pid_is_daemon "$pid"; then
      echo "running:$pid"
      exit 0
    fi
    rm -f "$PID_FILE"
  fi
  echo "stopped"
  exit 1
}

case "$1" in
  start) start_loop ;;
  stop) stop_loop ;;
  restart)
    stop_loop
    sleep 1
    start_loop
    ;;
  status) status_loop ;;
  *)
    echo "usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
`;

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${MODAL_NAME} .kunm-wrap { display:flex; flex-direction:column; gap:12px; }
      #${MODAL_NAME} .kunm-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
      #${MODAL_NAME} .kunm-card,
      #${MODAL_NAME} .kunm-panel { border-radius:16px; border:1px solid rgba(255,255,255,.09); background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025)); }
      #${MODAL_NAME} .kunm-card,
      #${MODAL_NAME} .kunm-panel { padding:12px 14px; }
      #${MODAL_NAME} .kunm-label { font-size:.63rem; opacity:.68; margin-bottom:6px; }
      #${MODAL_NAME} .kunm-value { font-size:.82rem; font-weight:800; overflow-wrap:anywhere; }
      #${MODAL_NAME} .kunm-good { color:#9bffc2; }
      #${MODAL_NAME} .kunm-warn { color:#ffd48f; }
      #${MODAL_NAME} .kunm-bad { color:#ff9e9e; }
      #${MODAL_NAME} .kunm-head { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px; }
      #${MODAL_NAME} .kunm-title { font-size:.8rem; font-weight:800; }
      #${MODAL_NAME} .kunm-tip { font-size:.65rem; line-height:1.65; opacity:.78; }
      #${MODAL_NAME} .kunm-mode-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
      #${MODAL_NAME} .kunm-mode { border-radius:14px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.03); padding:12px; cursor:pointer; transition:.2s ease; }
      #${MODAL_NAME} .kunm-mode.active { border-color:rgba(105,199,120,.75); box-shadow:0 0 0 2px rgba(105,199,120,.15); background:rgba(75,181,98,.12); }
      #${MODAL_NAME} .kunm-mode-name { font-size:.8rem; font-weight:800; }
      #${MODAL_NAME} .kunm-mode-tip { font-size:.63rem; opacity:.76; margin-top:5px; line-height:1.55; }
      #${MODAL_NAME} .kunm-inline { display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end; }
      #${MODAL_NAME} .kunm-field { display:flex; flex-direction:column; gap:6px; min-width:145px; flex:1; }
      #${MODAL_NAME} .kunm-field input { width:100%; box-sizing:border-box; padding:8px 10px; border-radius:10px; border:1px solid rgba(255,255,255,.1); outline:none; color:#fff; background:rgba(255,255,255,.04); }
      #${MODAL_NAME} .kunm-actions { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }
      #${MODAL_NAME} .kunm-pre { white-space:pre-wrap; word-break:break-word; margin:0; font-size:.61rem; line-height:1.65; max-height:220px; overflow:auto; padding:10px 12px; border-radius:12px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); }
      #${MODAL_NAME} .kunm-badge { display:inline-flex; align-items:center; padding:4px 8px; border-radius:999px; font-size:.61rem; font-weight:700; background:rgba(255,255,255,.08); }
      #${MODAL_NAME} .kunm-danger { background:rgba(197,77,77,.18)!important; }
      @media (max-width:900px) {
        #${MODAL_NAME} .kunm-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      }
      @media (max-width:700px) {
        #${MODAL_NAME} .kunm-grid,
        #${MODAL_NAME} .kunm-mode-grid { grid-template-columns:1fr; }
        #${MODAL_NAME} .kunm-head { flex-direction:column; align-items:flex-start; }
        #${MODAL_NAME} .kunm-actions button { width:100%; }
      }
    `;
    document.head.appendChild(style);
  };

  const writeRemoteFile = async (path, content, mode = '755') => {
    const encoded = encodePayload(content);
    if (!encoded) return false;
    const dir = path.slice(0, path.lastIndexOf('/')) || '/';
    const tempPath = `${path}.tmp`;
    const res = await run(`
mkdir -p ${shellQuote(dir)}
temp_file=${shellQuote(tempPath)}.$$
if printf '%s' ${shellQuote(encoded)} | base64 -d > "$temp_file" &&
   chmod ${mode} "$temp_file" &&
   mv -f "$temp_file" ${shellQuote(path)}; then
  exit 0
fi
rm -f "$temp_file"
exit 1
`, 25000);
    return res.ok;
  };

  const normalizeConfig = (config = {}) => {
    const next = { ...DEFAULT_CONFIG, ...config };
    if (!MODES.some((item) => item.key === next.mode)) next.mode = DEFAULT_CONFIG.mode;
    next.adb = String(next.adb) === '1' ? '1' : '0';
    next.permanent = String(next.permanent) === '1' ? '1' : '0';
    next.patrol = String(next.patrol) === '0' ? '0' : '1';
    next.autoRollback = String(next.autoRollback) === '0' ? '0' : '1';

    let bootDelay = Number.parseInt(next.bootDelay, 10);
    if (!Number.isFinite(bootDelay)) bootDelay = 75;
    next.bootDelay = String(Math.min(300, Math.max(30, bootDelay)));

    let pollInterval = Number.parseInt(next.pollInterval, 10);
    if (!Number.isFinite(pollInterval)) pollInterval = 8;
    next.pollInterval = String(Math.min(60, Math.max(3, pollInterval)));
    return next;
  };

  const buildConfigText = (config = DEFAULT_CONFIG) => {
    const next = normalizeConfig(config);
    return [
      '#!/system/bin/sh',
      `MODE="${next.mode}"`,
      `WIRED_ADB="${next.adb}"`,
      `PERMANENT="${next.permanent}"`,
      `PATROL_ENABLED="${next.patrol}"`,
      `AUTO_ROLLBACK="${next.autoRollback}"`,
      `BOOT_DELAY_SECONDS="${next.bootDelay}"`,
      `POLL_INTERVAL_SECONDS="${next.pollInterval}"`,
      '',
    ].join('\n');
  };

  const parseEnv = (text = '') => {
    const data = {};
    String(text || '').split(/\r?\n/).forEach((line) => {
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      value = value.replace(/^"/, '').replace(/"$/, '');
      data[key] = value;
    });
    return data;
  };

  const readConfig = async () => {
    const res = await run(`cat ${shellQuote(CONFIG_FILE)} 2>/dev/null || true`, 8000);
    const env = parseEnv(res.text);
    return normalizeConfig({
      mode: env.MODE,
      adb: env.WIRED_ADB,
      permanent: env.PERMANENT,
      patrol: env.PATROL_ENABLED,
      autoRollback: env.AUTO_ROLLBACK,
      bootDelay: env.BOOT_DELAY_SECONDS,
      pollInterval: env.POLL_INTERVAL_SECONDS,
    });
  };

  const saveConfig = async (config) => writeRemoteFile(CONFIG_FILE, buildConfigText(config), '600');

  const migrateLegacy = async () => {
    await run(`
if [ -f /data/kano_usb_network_manager/usb_network_daemon.sh ]; then
  sh /data/kano_usb_network_manager/usb_network_daemon.sh stop >/dev/null 2>&1 || true
fi
touch ${shellQuote(BOOT_SH_FILE)}
sed -i '/kano_usb_network_manager/d' ${shellQuote(BOOT_SH_FILE)} 2>/dev/null || true
`, 12000);
  };

  const installManagedFiles = async (config = null, restartExisting = true) => {
    const current = normalizeConfig(config || await readConfig());
    await migrateLegacy();
    const previousDaemon = await daemonStatus();
    if (previousDaemon.running && !(await stopDaemon())) return false;

    const results = await Promise.all([
      writeRemoteFile(MANAGER_FILE, MANAGER_SCRIPT, '755'),
      writeRemoteFile(DAEMON_FILE, DAEMON_SCRIPT, '755'),
      saveConfig(current),
    ]);
    if (!results.every(Boolean)) return false;
    if (!(await writeRemoteFile(VERSION_FILE, VERSION, '600'))) return false;
    await run(`sh ${shellQuote(MANAGER_FILE)} save-original >/dev/null 2>&1 || true`, 8000);

    if (restartExisting && previousDaemon.running && current.permanent === '1') {
      return restartDaemon();
    }
    return true;
  };

  const backendReady = async () => {
    const res = await run(`
[ -x ${shellQuote(MANAGER_FILE)} ] && \
[ -x ${shellQuote(DAEMON_FILE)} ] && \
[ "$(cat ${shellQuote(VERSION_FILE)} 2>/dev/null)" = ${shellQuote(VERSION)} ]
printf '%s' $?
`, 5000);
    return res.ok && String(res.text).trim().endsWith('0');
  };

  let backendPreparePromise = null;
  const prepareBackend = () => {
    if (!backendPreparePromise) {
      backendPreparePromise = (async () => {
        if (await backendReady()) return true;
        const config = await readConfig();
        const ok = await installManagedFiles(config);
        if (!ok) backendPreparePromise = null;
        return ok;
      })().catch((error) => {
        backendPreparePromise = null;
        throw error;
      });
    }
    return backendPreparePromise;
  };


  const setBootEnabled = async (enabled) => {
    const encodedBlock = encodePayload(`${BOOT_LINE}\n`);
    const cmd = enabled
      ? `
touch ${shellQuote(BOOT_SH_FILE)}
sed -i '/${BOOT_TAG}/d' ${shellQuote(BOOT_SH_FILE)} 2>/dev/null || true
printf '\n' >> ${shellQuote(BOOT_SH_FILE)}
printf '%s' ${shellQuote(encodedBlock)} | base64 -d >> ${shellQuote(BOOT_SH_FILE)}
`
      : `
touch ${shellQuote(BOOT_SH_FILE)}
sed -i '/${BOOT_TAG}/d' ${shellQuote(BOOT_SH_FILE)} 2>/dev/null || true
`;
    const res = await run(cmd, 12000);
    return res.ok;
  };

  const daemonStatus = async () => {
    const res = await run(`sh ${shellQuote(DAEMON_FILE)} status`, 8000);
    return {
      running: res.ok && String(res.text).startsWith('running:'),
      text: res.text || 'stopped',
    };
  };

  const restartDaemon = async () => {
    await run(`sh ${shellQuote(DAEMON_FILE)} stop >/dev/null 2>&1 || true`, 8000);
    const res = await run(`nohup sh ${shellQuote(DAEMON_FILE)} start >/dev/null 2>&1 &`, 8000);
    return res.ok;
  };

  const stopDaemon = async () => {
    const res = await run(`sh ${shellQuote(DAEMON_FILE)} stop >/dev/null 2>&1`, 8000);
    return res.ok;
  };


  const readLogPreview = async () => {
    const res = await run(`tail -n 120 ${shellQuote(LOG_FILE)} 2>/dev/null || true`, 6000);
    return res.text || '暂无日志';
  };

  const parseStateSections = (text = '') => {
    const sections = {};
    let current = '';
    String(text || '').split(/\r?\n/).forEach((line) => {
      const match = line.match(/^__KUNM_([A-Z]+)__$/);
      if (match) {
        current = match[1];
        sections[current] = [];
        return;
      }
      if (current) sections[current].push(line);
    });
    Object.keys(sections).forEach((key) => {
      sections[key] = sections[key].join('\n').trim();
    });
    return sections;
  };

  const getState = async ({ includeLog = false } = {}) => {
    const res = await run(`
printf '%s\n' '__KUNM_CONFIG__'
cat ${shellQuote(CONFIG_FILE)} 2>/dev/null || true
printf '%s\n' '__KUNM_BOOT__'
if grep -q ${shellQuote(BOOT_TAG)} ${shellQuote(BOOT_SH_FILE)} 2>/dev/null; then echo 1; else echo 0; fi
printf '%s\n' '__KUNM_DAEMON__'
sh ${shellQuote(DAEMON_FILE)} status 2>/dev/null || true
printf '%s\n' '__KUNM_MANAGER__'
sh ${shellQuote(MANAGER_FILE)} status 2>/dev/null || true
`, 12000);
    const sections = parseStateSections(res.text);
    const env = parseEnv(sections.CONFIG || '');
    const config = normalizeConfig({
      mode: env.MODE,
      adb: env.WIRED_ADB,
      permanent: env.PERMANENT,
      patrol: env.PATROL_ENABLED,
      autoRollback: env.AUTO_ROLLBACK,
      bootDelay: env.BOOT_DELAY_SECONDS,
      pollInterval: env.POLL_INTERVAL_SECONDS,
    });
    const daemonText = sections.DAEMON || 'stopped';
    const state = {
      config,
      bootEnabled: (sections.BOOT || '').trim() === '1',
      daemon: {
        running: daemonText.startsWith('running:'),
        text: daemonText,
      },
      manager: parseEnv(sections.MANAGER || ''),
      logText: '正在加载…',
    };
    if (includeLog) state.logText = await readLogPreview();
    return state;
  };

  const applyNow = async (mode, adb) => {
    const res = await run(`nohup sh ${shellQuote(MANAGER_FILE)} apply ${shellQuote(mode)} ${shellQuote(adb)} >/dev/null 2>&1 &`, 8000);
    return res.ok;
  };

  const repairNow = async () => {
    const res = await run(`sh ${shellQuote(MANAGER_FILE)} repair`, 45000);
    return res.ok;
  };

  const persistAndRestart = async (config) => {
    const saved = await saveConfig(config);
    if (!saved) return false;

    if (config.permanent === '1') {
      const bootOk = await setBootEnabled(true);
      if (!bootOk) return false;
      await run(`rm -f ${shellQuote(PAUSE_FILE)}; sh ${shellQuote(MANAGER_FILE)} sync-persist >/dev/null 2>&1 || true`, 12000);
      return restartDaemon();
    } else {
      if (!(await stopDaemon())) return false;
      const bootOk = await setBootEnabled(false);
      if (!bootOk) return false;
      await run(`sh ${shellQuote(MANAGER_FILE)} restore-persist >/dev/null 2>&1 || true`, 10000);
    }
    return true;
  };

  const safeRestoreRndis = async () => {
    if (!(await stopDaemon())) return false;
    if (!(await setBootEnabled(false))) return false;
    const safeConfig = normalizeConfig({
      ...(await readConfig()),
      mode: 'rndis',
      adb: '0',
      permanent: '0',
    });
    if (!(await saveConfig(safeConfig))) return false;
    const res = await run(`nohup sh ${shellQuote(MANAGER_FILE)} safe-rndis >/dev/null 2>&1 &`, 8000);
    return res.ok;
  };

  const uninstallAll = async () => {
    if (!(await stopDaemon())) return false;
    if (!(await setBootEnabled(false))) return false;
    const safeRes = await run(`sh ${shellQuote(MANAGER_FILE)} safe-rndis >/dev/null 2>&1`, 80000);
    if (!safeRes.ok) return false;
    const res = await run(`rm -rf ${shellQuote(BASE_DIR)}`, 12000);
    if (res.ok) backendPreparePromise = null;
    return res.ok;
  };

  const renderModeCards = (selectedMode) => MODES.map((item) => `
    <div class="kunm-mode ${item.key === selectedMode ? 'active' : ''}" data-mode="${escapeHtml(item.key)}">
      <div class="kunm-mode-name">${escapeHtml(item.label)}</div>
      <div class="kunm-mode-tip">${escapeHtml(item.hint)}</div>
    </div>
  `).join('');

  const statusClass = (good, warn = false) => (good ? 'kunm-good' : warn ? 'kunm-warn' : 'kunm-bad');

  const buildContent = (state) => {
    const m = state.manager || {};
    const targetMatches = Boolean(m.TARGET_CONFIG) && m.TARGET_CONFIG === m.CURRENT_CONFIG && m.CURRENT_CONFIG === m.CURRENT_STATE;
    const bridgeOk = m.CURRENT_MODE === 'rndis'
      ? (m.IFNAME === 'sipa_usb0' && m.MASTER === 'br0')
      : (m.IFNAME !== 'unknown' && m.MASTER === 'br0');
    const paused = m.PAUSED === '1';

    return `
      <div class="kunm-wrap">
        <div class="kunm-grid">
          <div class="kunm-card">
            <div class="kunm-label">启动模式</div>
            <div class="kunm-value">${escapeHtml(state.config.mode.toUpperCase())}${state.config.adb === '1' ? ' + ADB' : ''}${state.config.permanent === '1' ? ' · 开机保持' : ' · 临时'}</div>
          </div>
          <div class="kunm-card">
            <div class="kunm-label">当前 USB 组合</div>
            <div class="kunm-value ${statusClass(targetMatches, m.CURRENT_CONFIG === 'none')}">${escapeHtml(m.CURRENT_CONFIG || 'unknown')}</div>
          </div>
          <div class="kunm-card">
            <div class="kunm-label">网络接口</div>
            <div class="kunm-value ${statusClass(bridgeOk, m.IFNAME === 'unknown')}">${escapeHtml(m.IFNAME || 'unknown')} → ${escapeHtml(m.MASTER || 'none')}</div>
          </div>
          <div class="kunm-card">
            <div class="kunm-label">自动维护</div>
            <div class="kunm-value ${paused ? 'kunm-warn' : (state.bootEnabled && state.daemon.running) ? 'kunm-good' : ''}">${paused ? '已暂停' : state.bootEnabled ? (state.daemon.running ? '运行中' : '未运行') : '未启用'}</div>
          </div>
        </div>

        <div class="kunm-panel">
          <div class="kunm-head">
            <div>
              <div class="kunm-title">网络模式</div>
              <div class="kunm-tip">使用 F50 原厂 USB 组合，不手工改写 Gadget。</div>
            </div>
            <span class="kunm-badge ${targetMatches ? 'kunm-good' : 'kunm-warn'}">${targetMatches ? '已生效' : '未同步'}</span>
          </div>
          <div class="kunm-mode-grid" id="kunm_mode_grid">${renderModeCards(state.config.mode)}</div>
        </div>

        <div class="kunm-panel">
          <div class="kunm-head">
            <div>
              <div class="kunm-title">启动与维护</div>
              <div class="kunm-tip">保存后可在开机时保持所选模式；达到设定等待时间后自动校验并修复网络接口。</div>
            </div>
          </div>
          <div class="kunm-inline">
            <div id="kunm_adb_switch_box"></div>
            <div id="kunm_permanent_switch_box"></div>
            <div id="kunm_patrol_switch_box"></div>
            <div id="kunm_rollback_switch_box"></div>
            <label class="kunm-field">
              <span class="kunm-tip">启动等待（秒）</span>
              <input id="kunm_boot_delay" type="number" min="30" max="300" step="5" value="${escapeHtml(state.config.bootDelay)}">
            </label>
            <label class="kunm-field">
              <span class="kunm-tip">检查间隔（秒）</span>
              <input id="kunm_poll_interval" type="number" min="3" max="60" step="1" value="${escapeHtml(state.config.pollInterval)}">
            </label>
          </div>
        </div>

        <div class="kunm-panel">
          <div class="kunm-head">
            <div>
              <div class="kunm-title">状态</div>
              <div class="kunm-tip">持久配置：${escapeHtml(m.PERSIST_CONFIG || 'unknown')}；UDC：${escapeHtml(m.UDC_STATE || 'unknown')}；链路：${escapeHtml(m.CARRIER || 'unknown')}；上次：${escapeHtml(m.LAST_RESULT || 'none')}（${escapeHtml(m.LAST_TIME || 'none')}）。</div>
            </div>
          </div>
          <div class="kunm-actions">
            <button id="kunm_save_btn">保存</button>
            <button id="kunm_apply_btn">立即切换</button>
            <button id="kunm_repair_btn">修复网络接口</button>
            <button id="kunm_reload_btn">刷新</button>
            <button id="kunm_resume_btn">恢复自动维护</button>
            <button id="kunm_safe_btn" class="kunm-danger">恢复 RNDIS</button>
            <button id="kunm_uninstall_btn" class="kunm-danger">卸载</button>
          </div>
        </div>

        <div class="kunm-panel">
          <div class="kunm-head">
            <div>
              <div class="kunm-title">日志</div>
              <div class="kunm-tip">连续 3 次切换失败后自动暂停并回退 RNDIS。</div>
            </div>
            <button id="kunm_log_toggle_btn">自动刷新</button>
          </div>
          <pre class="kunm-pre" id="kunm_log_preview">${escapeHtml(state.logText)}</pre>
        </div>
      </div>
    `;
  };

  const ensureLogRefreshState = (modalEl) => {
    if (!modalEl.__kunmLogState) {
      modalEl.__kunmLogState = { timer: null, enabled: false };
    }
    return modalEl.__kunmLogState;
  };

  const bindModalEvents = async (modalEl, refreshFn, initialState = null) => {
    let currentState = initialState || await getState({ includeLog: false });
    let selectedMode = currentState.config.mode;
    const logState = ensureLogRefreshState(modalEl);

    const adbSwitch = createSwitch({
      text: '有线 ADB',
      value: currentState.config.adb === '1',
      onChange: () => {},
    });
    const permanentSwitch = createSwitch({
      text: '开机保持模式',
      value: currentState.config.permanent === '1',
      onChange: () => {},
    });
    const patrolSwitch = createSwitch({
      text: '自动修复',
      value: currentState.config.patrol === '1',
      onChange: () => {},
    });
    const rollbackSwitch = createSwitch({
      text: '失败回退 RNDIS',
      value: currentState.config.autoRollback === '1',
      onChange: () => {},
    });

    const mountSwitch = (selector, node) => {
      const box = modalEl.querySelector(selector);
      if (!box) return;
      box.innerHTML = '';
      box.appendChild(node);
    };
    mountSwitch('#kunm_adb_switch_box', adbSwitch);
    mountSwitch('#kunm_permanent_switch_box', permanentSwitch);
    mountSwitch('#kunm_patrol_switch_box', patrolSwitch);
    mountSwitch('#kunm_rollback_switch_box', rollbackSwitch);

    const syncModeUi = () => {
      modalEl.querySelectorAll('.kunm-mode').forEach((el) => {
        el.classList.toggle('active', el.dataset.mode === selectedMode);
      });
    };

    modalEl.querySelectorAll('.kunm-mode').forEach((el) => {
      el.onclick = () => {
        selectedMode = el.dataset.mode || 'rndis';
        syncModeUi();
      };
    });

    const readUiConfig = () => normalizeConfig({
      mode: selectedMode,
      adb: adbSwitch.querySelector('input')?.checked ? '1' : '0',
      permanent: permanentSwitch.querySelector('input')?.checked ? '1' : '0',
      patrol: patrolSwitch.querySelector('input')?.checked ? '1' : '0',
      autoRollback: rollbackSwitch.querySelector('input')?.checked ? '1' : '0',
      bootDelay: modalEl.querySelector('#kunm_boot_delay')?.value || '75',
      pollInterval: modalEl.querySelector('#kunm_poll_interval')?.value || '8',
    });

    modalEl.querySelector('#kunm_save_btn').onclick = async () => {
      const nextConfig = readUiConfig();
      createToast('正在保存...', 'pink', 3500);
      const installed = await prepareBackend();
      if (!installed) {
        createToast('保存失败：插件未初始化', 'red', 4000);
        return;
      }
      const ok = await persistAndRestart(nextConfig);
      if (!ok) {
        createToast('保存失败：无法更新开机配置', 'red', 5000);
        return;
      }
      createToast(nextConfig.permanent === '1' ? '已保存，开机将保持当前模式' : '已保存', 'green', 5000);
      currentState = await refreshFn();
      selectedMode = currentState.config.mode;
      syncModeUi();
    };

    modalEl.querySelector('#kunm_apply_btn').onclick = async () => {
      const nextConfig = readUiConfig();
      const savedConfig = await readConfig();
      const differsFromPermanent = savedConfig.permanent === '1'
        && (savedConfig.mode !== nextConfig.mode || savedConfig.adb !== nextConfig.adb);
      if (differsFromPermanent) {
        await stopDaemon();
        await run(`sh ${shellQuote(MANAGER_FILE)} pause >/dev/null 2>&1 || true`, 8000);
        createToast('已暂停自动维护，避免覆盖本次临时切换', 'pink', 4500);
      } else {
        createToast('正在切换，USB 将重新连接', 'pink', 5000);
      }
      if (!(await applyNow(nextConfig.mode, nextConfig.adb))) {
        createToast('切换命令启动失败，请查看日志', 'red', 5000);
      }
    };

    modalEl.querySelector('#kunm_repair_btn').onclick = async () => {
      createToast('正在修复网络接口...', 'pink', 3000);
      const ok = await repairNow();
      createToast(ok ? '网络接口已修复' : '修复失败，请查看日志', ok ? 'green' : 'red', 4000);
      await refreshFn();
    };

    modalEl.querySelector('#kunm_reload_btn').onclick = async () => {
      currentState = await refreshFn();
      selectedMode = currentState.config.mode;
      syncModeUi();
    };

    modalEl.querySelector('#kunm_resume_btn').onclick = async () => {
      const config = await readConfig();
      if (config.permanent !== '1') {
        createToast('请先开启“开机保持模式”并保存', 'pink', 4000);
        return;
      }
      const resumed = await run(`sh ${shellQuote(MANAGER_FILE)} resume >/dev/null 2>&1`, 8000);
      const restarted = resumed.ok && await restartDaemon();
      createToast(restarted ? '自动维护已恢复' : '恢复失败，请查看日志', restarted ? 'green' : 'red', 4000);
      setTimeout(() => refreshFn(), 2500);
    };

    modalEl.querySelector('#kunm_safe_btn').onclick = async () => {
      createToast('正在恢复 RNDIS...', 'pink', 5000);
      const ok = await safeRestoreRndis();
      createToast(ok ? '恢复命令已启动，请等待 USB 重连' : '恢复失败，请查看日志', ok ? 'green' : 'red', 5000);
      setTimeout(() => refreshFn(), 5000);
    };

    modalEl.querySelector('#kunm_uninstall_btn').onclick = async () => {
      createToast('正在卸载...', 'pink', 5000);
      const ok = await uninstallAll();
      createToast(ok ? '已卸载，当前模式为 RNDIS' : '卸载失败', ok ? 'green' : 'red', 5000);
    };

    const syncLogButton = () => {
      const btn = modalEl.querySelector('#kunm_log_toggle_btn');
      if (!btn) return;
      btn.textContent = logState.timer ? '停止自动刷新' : '自动刷新';
    };

    const stopLogRefresh = () => {
      if (logState.timer) clearInterval(logState.timer);
      logState.timer = null;
      logState.enabled = false;
      syncLogButton();
    };

    const refreshLogOnly = async () => {
      const el = modalEl.querySelector('#kunm_log_preview');
      if (!el) return;
      el.textContent = await readLogPreview();
    };

    modalEl.querySelector('#kunm_log_toggle_btn').onclick = async () => {
      if (logState.timer) {
        stopLogRefresh();
        return;
      }
      logState.enabled = true;
      await refreshLogOnly();
      logState.timer = setInterval(refreshLogOnly, 3000);
      syncLogButton();
    };

    syncLogButton();

    const closeBtn = modalEl.querySelector(`#${MODAL_NAME}_close`);
    if (closeBtn) closeBtn.addEventListener('click', stopLogRefresh);
  };

  const buildLoadingContent = () => `
    <div class="kunm-wrap">
      <div class="kunm-panel">
        <div class="kunm-title">正在读取状态…</div>
      </div>
    </div>
  `;

  const openModal = async () => {
    ensureStyle();
    document.querySelector(`#${MODAL_NAME}`)?.remove();

    const { id, el } = createModal({
      name: MODAL_NAME,
      title: TITLE,
      maxWidth: '1040px',
      showConfirm: false,
      onClose: () => true,
      contentStyle: 'max-height:78vh;',
      content: buildLoadingContent(),
    });
    showModal(id);

    const installed = await prepareBackend();
    if (!installed) {
      const contentEl = el.querySelector('.content');
      if (contentEl) contentEl.innerHTML = '<div class="kunm-panel"><div class="kunm-title">初始化失败</div></div>';
      createToast('初始化失败', 'red', 4000);
      return;
    }

    const loadLogOnce = async () => {
      const logEl = el.querySelector('#kunm_log_preview');
      if (!logEl) return;
      logEl.textContent = await readLogPreview();
    };

    const renderState = async (state) => {
      const contentEl = el.querySelector('.content');
      if (!contentEl) return state;
      contentEl.innerHTML = buildContent(state);
      await bindModalEvents(el, refreshModal, state);
      loadLogOnce();
      return state;
    };

    const refreshModal = async () => {
      const nextState = await getState({ includeLog: false });
      return renderState(nextState);
    };

    const state = await getState({ includeLog: false });
    await renderState(state);
  };

  const mainBtn = document.createElement('button');
  mainBtn.textContent = 'USB 网络模式';
  mainBtn.onclick = async () => {
    if (!(await checkAdvancedFunc())) {
      createToast('请先启用高级功能', 'pink');
      return;
    }
    await openModal();
  };

  while (!document.querySelector('.actions-buttons')) {
    await wait(120);
  }
  document.querySelector('.actions-buttons')?.appendChild(mainBtn);
})();
//</script>
