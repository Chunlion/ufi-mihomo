//<script>
(() => {
  const ROOT_ID = 'f50_boot_fix_standalone';
  const MANAGER_VERSION = '3.1.0';
  const BOOT_FILE = '/sdcard/ufi_tools_boot.sh';
  const FIX_DIR = '/data/f50_boot_fix';
  const FIX_SCRIPT = `${FIX_DIR}/boot_manager.sh`;
  const FIX_LOG = `${FIX_DIR}/boot.log`;
  const FIX_RUN_LOG = `${FIX_DIR}/replay.log`;
  const FIX_MARKER = `${FIX_DIR}/last_completed_boot_id`;
  const FIX_STATE = `${FIX_DIR}/last_run.txt`;
  const FIX_CONFIG = `${FIX_DIR}/config`;
  const FIX_BOOT_SNAPSHOT = `${FIX_DIR}/boot_file.snapshot`;
  const FIX_SNAPSHOT_BOOT_ID = `${FIX_DIR}/boot_file.snapshot.boot_id`;
  const FIX_WATCHER_TAG = `${FIX_DIR}/boot_watcher.tag`;
  const FIX_NATIVE_TAIL_MARKER = `${FIX_DIR}/native_tail_boot_id`;
  const MANAGER_LOCK_DIR = '/data/local/tmp/f50_plugin_boot_manager.lock';
  const SERVICE_D_DIR = '/data/adb/service.d';
  const SERVICE_D_HOOK = `${SERVICE_D_DIR}/f50_boot_fix.sh`;
  // 门标记必须与历史版本保持一致，升级时才能原地替换而不是重复安装。
  const BOOT_BEGIN = '# F50_BOOT_FIX_BEGIN';
  const BOOT_END = '# F50_BOOT_FIX_END';
  const BACKUP_RECOVERY_MARKER = `${FIX_DIR}/boot_backup_recovered`;

  const shellQuote = (value) =>
    "'" + String(value).replace(/'/g, "'\\''") + "'";

  const rejectIfManagerActiveCmd = () => `
      active_lock=${shellQuote(MANAGER_LOCK_DIR)}
      active_tag=$(cat "$active_lock/tag" 2>/dev/null || true)
      active_boot=\${active_tag%.*}
      active_pid=\${active_tag##*.}
      current_boot=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null || true)
      [ -n "$current_boot" ] || current_boot=$(grep '^btime ' /proc/stat 2>/dev/null | awk '{print $2}')
      [ -n "$current_boot" ] || current_boot=unknown
      case "$active_pid" in
        "" | *[!0-9]*) active_pid= ;;
      esac
      if [ "$active_boot" = "$current_boot" ] && [ -n "$active_pid" ] && kill -0 "$active_pid" 2>/dev/null; then
        echo "F50_MANAGER_BUSY: 已有一轮开机启动任务正在执行(pid=$active_pid)"
        exit 9
      fi
    `;

  const escapeHtml = (value = '') =>
    String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));

  const guardHost = () => {
    if (typeof runShellWithRoot === 'function' && typeof createToast === 'function') return true;
    const message = 'F50 开机自启修复：宿主接口缺失（runShellWithRoot/createToast），请刷新页面后重试。';
    if (typeof createToast === 'function') createToast(message, 'red', 8000);
    else alert(message);
    return false;
  };

  const toast = (html, color, ms) => {
    if (typeof createToast === 'function') createToast(html, color, ms);
  };

  // ==========================================================================
  // 开机自启管理器：/data/f50_boot_fix/boot_manager.sh
  // 职责：UFI 原生启动未到达尾钩时作为故障转移；手动重放时逐条隔离执行。
  // 关键设计：
  //   * 逐条隔离：某个插件的指令 exit / 卡死 / 报错，都不会连累后面的插件。
  //   * 看门狗：单条指令超时后不杀进程（可能是常驻服务），只是不再等待。
  //   * 失败重试：默认对返回非 0 的指令重试一次。
  //   * 兜底：无法解析时退回「整体重放」，绝不出现「什么都不执行」。
  // ==========================================================================
  const managerScript = [
    '#!/system/bin/sh',
    '# F50 全插件开机自启管理器 —— 由插件「全插件开机自启修复」生成，请勿手工编辑。',
    `MANAGER_VERSION=${MANAGER_VERSION}`,
    `BOOT_FILE=${shellQuote(BOOT_FILE)}`,
    `FIX_DIR=${shellQuote(FIX_DIR)}`,
    `LOG_FILE=${shellQuote(FIX_LOG)}`,
    `RUN_LOG=${shellQuote(FIX_RUN_LOG)}`,
    `MARKER_FILE=${shellQuote(FIX_MARKER)}`,
    `STATE_FILE=${shellQuote(FIX_STATE)}`,
    `CONFIG_FILE=${shellQuote(FIX_CONFIG)}`,
    `SNAPSHOT_FILE=${shellQuote(FIX_BOOT_SNAPSHOT)}`,
    `SNAPSHOT_BOOT_FILE=${shellQuote(FIX_SNAPSHOT_BOOT_ID)}`,
    `WATCHER_TAG=${shellQuote(FIX_WATCHER_TAG)}`,
    `NATIVE_TAIL_MARKER=${shellQuote(FIX_NATIVE_TAIL_MARKER)}`,
    `BEGIN_MARK=${shellQuote(BOOT_BEGIN)}`,
    `END_MARK=${shellQuote(BOOT_END)}`,
    `LOCK_DIR=${shellQuote(MANAGER_LOCK_DIR)}`,
    '',
    'PATH=/sbin:/system/sbin:/system/bin:/system/xbin:/vendor/bin:/vendor/xbin:/data/local/bin:$PATH',
    'export PATH',
    "trap '' HUP",
    'umask 022',
    'cd / 2>/dev/null || true',
    '',
    '# ---- 可调参数（可被 $FIX_DIR/config 覆盖，只接受纯数字）----',
    'MIN_UPTIME=45',
    'MAX_WAIT=180',
    'FILE_MAX_WAIT=300',
    'ENTRY_TIMEOUT=90',
    'WHOLE_TIMEOUT=300',
    'RETRY_FAILED=1',
    'RETRY_DELAY=15',
    'MAX_ENTRIES=300',
    'WATCH_INTERVAL=10',
    'NATIVE_GRACE_UPTIME=180',
    '',
    'HAVE_LOCK=0',
    'LOCK_TAG=',
    'ENTRY_COUNT=0',
    'RUN_ENTRY_STATUS=',
    'RUN_ENTRY_RC=',
    '',
    'uptime_seconds() {',
    '  u=$(cut -d. -f1 /proc/uptime 2>/dev/null)',
    '  case "$u" in',
    '    "" | *[!0-9]*) u=0 ;;',
    '  esac',
    '  printf "%s" "$u"',
    '}',
    '',
    'now_stamp() {',
    '  date "+%Y-%m-%d %H:%M:%S" 2>/dev/null || printf "uptime+%ss" "$(uptime_seconds)"',
    '}',
    '',
    'log_line() {',
    '  printf "%s %s\\n" "$(now_stamp)" "$*" >> "$LOG_FILE" 2>/dev/null || true',
    '}',
    '',
    'state_line() {',
    '  printf "%s\\n" "$*" >> "$STATE_FILE" 2>/dev/null || true',
    '}',
    '',
    'trim_file() {',
    '  tf="$1"',
    '  tmax="$2"',
    '  tkeep="$3"',
    '  [ -f "$tf" ] || return 0',
    '  tl=$(wc -l < "$tf" 2>/dev/null | tr -d " ")',
    '  case "$tl" in',
    '    "" | *[!0-9]*) return 0 ;;',
    '  esac',
    '  [ "$tl" -le "$tmax" ] && return 0',
    '  # 就地截断而不是换文件：被重放拉起的常驻服务可能还持有这个 fd，',
    '  # 换 inode 会让它们继续往看不见的旧文件里写。',
    '  if tail -n "$tkeep" "$tf" > "$tf.trim" 2>/dev/null && [ -s "$tf.trim" ]; then',
    '    cat "$tf.trim" > "$tf" 2>/dev/null || true',
    '  fi',
    '  rm -f "$tf.trim" 2>/dev/null || true',
    '  return 0',
    '}',
    '',
    '# 只接受白名单键 + 纯数字值，避免配置文件把管理器带崩。',
    'load_config() {',
    '  [ -f "$CONFIG_FILE" ] || return 0',
    '  while IFS= read -r cfg_line || [ -n "$cfg_line" ]; do',
    '    case "$cfg_line" in',
    '      MIN_UPTIME=* | MAX_WAIT=* | FILE_MAX_WAIT=* | ENTRY_TIMEOUT=* | WHOLE_TIMEOUT=* | RETRY_FAILED=* | RETRY_DELAY=* | MAX_ENTRIES=* | WATCH_INTERVAL=* | NATIVE_GRACE_UPTIME=*)',
    '        cfg_val=${cfg_line#*=}',
    '        case "$cfg_val" in',
    '          "" | *[!0-9]*) ;;',
    '          *) eval "$cfg_line" ;;',
    '        esac',
    '        ;;',
    '      *) ;;',
    '    esac',
    '  done < "$CONFIG_FILE"',
    '  return 0',
    '}',
    '',
    'resolve_boot_id() {',
    '  BOOT_ID=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null)',
    '  [ -n "$BOOT_ID" ] || BOOT_ID=$(grep "^btime " /proc/stat 2>/dev/null | awk "{print \\$2}")',
    '  [ -n "$BOOT_ID" ] || BOOT_ID=unknown',
    '}',
    '',
    'native_tail_completed() {',
    '  [ -n "$BOOT_ID" ] && [ "$BOOT_ID" != "unknown" ] || return 1',
    '  [ "$(cat "$NATIVE_TAIL_MARKER" 2>/dev/null)" = "$BOOT_ID" ]',
    '}',
    '',
    '# UFI-TOOLS 原生 samba_exec.sh 只在开机早期窗口执行共享启动文件。',
    '# service.d 必须先让出这个窗口；否则会在原生执行前抢先重放，造成双核心/双 inotify。',
    'wait_native_grace() {',
    '  ng_waited=0',
    '  while :; do',
    '    native_tail_completed && return 0',
    '    ng_up=$(uptime_seconds)',
    '    case "$ng_up" in "" | *[!0-9]*) ng_up=0 ;; esac',
    '    [ "$ng_up" -lt "$NATIVE_GRACE_UPTIME" ] || return 1',
    '    # /proc/uptime 极端情况下不可读时也不能永久挂住 service.d。',
    '    [ "$ng_waited" -lt 150 ] || return 1',
    '    sleep 2',
    '    ng_waited=$((ng_waited + 2))',
    '    resolve_boot_id',
    '  done',
    '}',
    '',
    'acquire_lock() {',
    '  LOCK_TAG="$BOOT_ID.$$"',
    '  if mkdir "$LOCK_DIR" 2>/dev/null; then',
    '    if ! printf "%s\\n" "$LOCK_TAG" > "$LOCK_DIR/tag" 2>/dev/null; then',
    '      rmdir "$LOCK_DIR" 2>/dev/null || true',
    '      return 1',
    '    fi',
    '    HAVE_LOCK=1',
    '    return 0',
    '  fi',
    '  old_tag=$(cat "$LOCK_DIR/tag" 2>/dev/null)',
    '  if [ -z "$old_tag" ]; then',
    '    sleep 1',
    '    old_tag=$(cat "$LOCK_DIR/tag" 2>/dev/null)',
    '  fi',
    '  old_boot=${old_tag%.*}',
    '  old_pid=${old_tag##*.}',
    '  if [ "$old_boot" = "$BOOT_ID" ] && [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then',
    '    return 1',
    '  fi',
    '  # 过期锁必须先原子移走再重新 mkdir。直接覆盖 tag 会让两个同时到达的',
    '  # 触发器都误以为自己拿到了锁，导致同一批插件被并行启动两次。',
    '  stale_lock="$LOCK_DIR.stale.$$"',
    '  if mv "$LOCK_DIR" "$stale_lock" 2>/dev/null; then',
    '    rm -f "$stale_lock/tag" 2>/dev/null || true',
    '    rmdir "$stale_lock" 2>/dev/null || true',
    '  fi',
    '  if ! mkdir "$LOCK_DIR" 2>/dev/null; then',
    '    return 1',
    '  fi',
    '  if ! printf "%s\\n" "$LOCK_TAG" > "$LOCK_DIR/tag" 2>/dev/null; then',
    '    rmdir "$LOCK_DIR" 2>/dev/null || true',
    '    return 1',
    '  fi',
    '  log_line "note: 已原子接管过期锁 tag=${old_tag:-none}"',
    '  HAVE_LOCK=1',
    '  return 0',
    '}',
    '',
    'release_lock() {',
    '  [ "$HAVE_LOCK" = "1" ] || return 0',
    '  if [ "$(cat "$LOCK_DIR/tag" 2>/dev/null)" = "$LOCK_TAG" ]; then',
    '    rm -f "$LOCK_DIR/tag" 2>/dev/null || true',
    '    rmdir "$LOCK_DIR" 2>/dev/null || true',
    '  fi',
    '  return 0',
    '}',
    '',
    '# 等系统真正可用：开机秒数 + sys.boot_completed + 启动文件所在分区已挂载。',
    'wait_until_ready() {',
    '  READY_STATE=ok',
    '  have_getprop=0',
    '  command -v getprop >/dev/null 2>&1 && have_getprop=1',
    '  start_up=$(uptime_seconds)',
    '  loops=0',
    '  while :; do',
    '    up=$(uptime_seconds)',
    '    # 同时用「循环次数」兜底：/proc/uptime 读不到时 up 恒为 0，',
    '    # 只靠 uptime 差值会让这个循环永远出不来。',
    '    elapsed=$((up - start_up))',
    '    [ "$elapsed" -ge 0 ] || elapsed=0',
    '    [ "$elapsed" -ge "$((loops * 2))" ] || elapsed=$((loops * 2))',
    '    loops=$((loops + 1))',
    '    boot_done=1',
    '    if [ "$have_getprop" = "1" ]; then',
    '      [ "$(getprop sys.boot_completed 2>/dev/null)" = "1" ] || boot_done=0',
    '    fi',
    '    file_ready=0',
    '    [ -f "$BOOT_FILE" ] && file_ready=1',
    '    if [ "$up" -ge "$MIN_UPTIME" ] && [ "$boot_done" = "1" ] && [ "$file_ready" = "1" ]; then',
    '      READY_UPTIME="$up"',
    '      return 0',
    '    fi',
    '    if [ "$elapsed" -ge "$MAX_WAIT" ] && [ "$file_ready" = "1" ]; then',
    '      READY_STATE=timeout',
    '      READY_UPTIME="$up"',
    '      log_line "warning: 等待系统就绪超时(${MAX_WAIT}s)，仍继续执行 uptime=${up}s"',
    '      return 0',
    '    fi',
    '    if [ "$elapsed" -ge "$FILE_MAX_WAIT" ]; then',
    '      READY_STATE=nofile',
    '      READY_UPTIME="$up"',
    '      return 1',
    '    fi',
    '    sleep 2',
    '  done',
    '}',
    '',
    'wait_for_boot_file() {',
    '  wf_loops=0',
    '  while [ ! -f "$BOOT_FILE" ]; do',
    '    [ "$((wf_loops * 2))" -lt "$FILE_MAX_WAIT" ] || return 1',
    '    sleep 2',
    '    wf_loops=$((wf_loops + 1))',
    '  done',
    '  return 0',
    '}',
    '',
    '# 抽取增强尾钩以外的全部内容 = 各插件真正的启动指令。',
    '# 增强尾钩标记不闭合时返回 3，由调用方退回整体重放，绝不吞掉任何一行。',
    'extract_payload() {',
    '  awk -v b="$BEGIN_MARK" -v e="$END_MARK" \'',
    '    $0 == b { depth++; next }',
    '    $0 == e { if (depth > 0) depth--; next }',
    '    depth > 0 { next }',
    '    { sub(/\\r$/, ""); print }',
    '    END { if (depth > 0) exit 3 }',
    "  ' \"$BOOT_FILE\" > \"$PAYLOAD\" 2>/dev/null",
    '}',
    '',
    '# /sdcard 在部分固件的物理冷启动中会被旧模板覆盖。这里把完整的托管启动文件',
    '# 持久化到 /data；不识别插件名称，所有底层插件共用同一份真实启动入口。',
    'managed_boot_valid() {',
    '  mb_file="$1"',
    '  [ -s "$mb_file" ] || return 1',
    '  mb_begin=$(grep -cxF "$BEGIN_MARK" "$mb_file" 2>/dev/null || true)',
    '  mb_end=$(grep -cxF "$END_MARK" "$mb_file" 2>/dev/null || true)',
    '  [ "$mb_begin" = "1" ] && [ "$mb_end" = "1" ] || return 1',
    '  awk -v b="$BEGIN_MARK" -v e="$END_MARK" \'' ,
    '    $0 == b { seen=1; next }',
    '    $0 == e { if (seen == 1) { closed=1; exit 0 }; exit 1 }',
    '    END { exit(closed == 1 ? 0 : 1) }',
    "  ' \"$mb_file\" >/dev/null 2>&1",
    '}',
    '',
    'files_equal() {',
    '  fe_a="$1"',
    '  fe_b="$2"',
    '  [ -f "$fe_a" ] && [ -f "$fe_b" ] || return 1',
    '  if command -v cmp >/dev/null 2>&1; then',
    '    cmp -s "$fe_a" "$fe_b"',
    '    return $?',
    '  fi',
    '  if command -v cksum >/dev/null 2>&1; then',
    '    set -- $(cksum "$fe_a" 2>/dev/null); fe_ac="$1:$2"',
    '    set -- $(cksum "$fe_b" 2>/dev/null); fe_bc="$1:$2"',
    '    [ -n "$fe_ac" ] && [ "$fe_ac" = "$fe_bc" ]',
    '    return $?',
    '  fi',
    '  fe_as=$(wc -c < "$fe_a" 2>/dev/null | tr -d " ")',
    '  fe_bs=$(wc -c < "$fe_b" 2>/dev/null | tr -d " ")',
    '  [ -n "$fe_as" ] && [ "$fe_as" = "$fe_bs" ]',
    '}',
    '',
    'save_boot_snapshot() {',
    '  sb_reason="$1"',
    '  sb_tmp="$SNAPSHOT_FILE.tmp.$$"',
    '  sb_ok=0',
    '  if managed_boot_valid "$BOOT_FILE"; then',
    '    if cat "$BOOT_FILE" > "$sb_tmp" 2>/dev/null && files_equal "$BOOT_FILE" "$sb_tmp"; then',
    '      if files_equal "$sb_tmp" "$SNAPSHOT_FILE"; then',
    '        sb_ok=1',
    '      else',
    '        chmod 600 "$sb_tmp" 2>/dev/null || true',
    '        if mv -f "$sb_tmp" "$SNAPSHOT_FILE" 2>/dev/null; then',
    '          sync 2>/dev/null || true',
    '          log_line "持久启动快照已更新 trigger=$sb_reason"',
    '          sb_ok=1',
    '        fi',
    '      fi',
    '    fi',
    '  fi',
    '  rm -f "$sb_tmp" 2>/dev/null || true',
    '  if [ "$sb_ok" = "1" ] && [ -n "$BOOT_ID" ] && [ "$(cat "$SNAPSHOT_BOOT_FILE" 2>/dev/null)" != "$BOOT_ID" ]; then',
    '    if printf "%s\\n" "$BOOT_ID" > "$SNAPSHOT_BOOT_FILE.tmp.$$" 2>/dev/null && mv -f "$SNAPSHOT_BOOT_FILE.tmp.$$" "$SNAPSHOT_BOOT_FILE" 2>/dev/null; then',
    '      sync 2>/dev/null || true',
    '    fi',
    '  fi',
    '  rm -f "$SNAPSHOT_BOOT_FILE.tmp.$$" 2>/dev/null || true',
    '  [ "$sb_ok" = "1" ]',
    '}',
    '',
    'restore_boot_snapshot() {',
    '  RESTORED_SNAPSHOT=0',
    '  managed_boot_valid "$SNAPSHOT_FILE" || return 0',
    '  rb_snapshot_boot=$(cat "$SNAPSHOT_BOOT_FILE" 2>/dev/null || true)',
    '  if [ -n "$BOOT_ID" ] && [ "$BOOT_ID" = "$rb_snapshot_boot" ] && managed_boot_valid "$BOOT_FILE"; then',
    '    return 0',
    '  fi',
    '  files_equal "$BOOT_FILE" "$SNAPSHOT_FILE" && return 0',
    '  rb_original="$WORK_DIR/boot.before_restore"',
    '  rb_new="$WORK_DIR/boot.restored"',
    '  cat "$BOOT_FILE" > "$rb_original" 2>/dev/null || return 1',
    '  cat "$SNAPSHOT_FILE" > "$rb_new" 2>/dev/null || return 1',
    '  files_equal "$SNAPSHOT_FILE" "$rb_new" || return 1',
    '  rb_mode=$(stat -c %a "$BOOT_FILE" 2>/dev/null || true)',
    '  case "$rb_mode" in "" | *[!0-7]*) rb_mode=755 ;; esac',
    '  chmod "$rb_mode" "$rb_new" 2>/dev/null || true',
    '  files_equal "$BOOT_FILE" "$rb_original" || { log_line "warning: 恢复前启动文件又被改动，本次不覆盖"; return 1; }',
    '  cat "$rb_original" > "$FIX_DIR/boot_file.cold_replaced" 2>/dev/null || true',
    '  if mv -f "$rb_new" "$BOOT_FILE" 2>/dev/null; then',
    '    sync 2>/dev/null || true',
    '    RESTORED_SNAPSHOT=1',
    '    log_line "已从 /data 持久快照恢复被冷启动覆盖的共享启动文件"',
    '    return 0',
    '  fi',
    '  return 1',
    '}',
    '',
    'start_watcher() {',
    '  [ "$WATCH_INTERVAL" -gt 0 ] 2>/dev/null || return 0',
    '  sw_tag=$(cat "$WATCHER_TAG" 2>/dev/null || true)',
    '  sw_boot=${sw_tag%.*}',
    '  sw_pid=${sw_tag##*.}',
    '  case "$sw_pid" in "" | *[!0-9]*) sw_pid= ;; esac',
    '  if [ "$sw_boot" = "$BOOT_ID" ] && [ -n "$sw_pid" ] && kill -0 "$sw_pid" 2>/dev/null; then',
    '    return 0',
    '  fi',
    '  ( trap "" HUP; exec "$0" --watch --trigger=watcher ) </dev/null >/dev/null 2>&1 &',
    '  sw_pid=$!',
    '  printf "%s.%s\n" "$BOOT_ID" "$sw_pid" > "$WATCHER_TAG" 2>/dev/null || true',
    '  return 0',
    '}',
    '',
    'run_watcher() {',
    '  rw_boot="$BOOT_ID"',
    '  while [ "$WATCH_INTERVAL" -gt 0 ] 2>/dev/null; do',
    '    sleep "$WATCH_INTERVAL"',
    '    resolve_boot_id',
    '    [ "$BOOT_ID" = "$rw_boot" ] || exit 0',
    '    save_boot_snapshot watcher || true',
    '  done',
    '  exit 0',
    '}',
    '',
    'entry_has_code() {',
    '  awk \'NF && $0 !~ /^[[:space:]]*#/ { found=1; exit } END { exit(found ? 0 : 1) }\' "$1" 2>/dev/null',
    '}',
    '',
    'entry_label() {',
    '  awk \'NF && $0 !~ /^[[:space:]]*#/ { sub(/^[[:space:]]+/, ""); print substr($0, 1, 200); exit }\' "$1" 2>/dev/null',
    '}',
    '',
    '# 只是「定义东西」的片段（函数定义、纯赋值）必须和后面用到它的指令待在一起，',
    '# 否则隔离执行会让 my_func() {...} 和随后的 my_func 分家，调用直接 127。',
    '# 返回 0 表示「这一段只有定义，先别断开」。',
    'entry_defines_only() {',
    '  awk \'',
    '    /^[[:space:]]*$/ { next }',
    '    /^[[:space:]]*#/ { next }',
    '    { n++; last = $0; if (n == 1) { first = $0 } }',
    '    $0 !~ /^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*=[^;&|]*$/ { not_assign = 1 }',
    '    END {',
    '      if (n == 0) { exit 1 }',
    '      # 情况一：整段就是一个函数定义',
    '      if (last ~ /^[[:space:]]*\\}[[:space:]]*;?[[:space:]]*$/) {',
    '        if (first ~ /^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*\\([[:space:]]*\\)/) { exit 0 }',
    '        if (first ~ /^[[:space:]]*function[[:space:]]/) { exit 0 }',
    '      }',
    '      # 情况二：整段全是变量赋值',
    '      if (not_assign != 1) { exit 0 }',
    '      exit 1',
    '    }',
    '  \' "$1" 2>/dev/null',
    '}',
    '',
    '# sh -n 对「没写结束符的 heredoc」是放行的（dash/mksh/busybox 实测都返回 0），',
    '# 所以必须自己盯着 heredoc 是否闭合，否则会把 heredoc 正文切成一条条指令去执行。',
    '# 返回 0 表示「还有 heredoc 没闭合」。判断偏保守：宁可多等，也不会切错。',
    'heredoc_open() {',
    '  awk \'',
    '    pending > 0 {',
    '      l = $0',
    '      if (strip[pending] == 1) { sub(/^\\t+/, "", l) }',
    '      if (l == delim[pending]) { pending-- }',
    '      next',
    '    }',
    '    /^[ \\t]*#/ { next }',
    '    {',
    '      rest = $0',
    '      while ((p = index(rest, "<<")) > 0) {',
    '        rest = substr(rest, p + 2)',
    '        if (substr(rest, 1, 1) == "<") { rest = substr(rest, 2); continue }',
    '        st = 0',
    '        if (substr(rest, 1, 1) == "-") { st = 1; rest = substr(rest, 2) }',
    '        sub(/^[ \\t]+/, "", rest)',
    '        q = substr(rest, 1, 1)',
    '        if (q == "\\047" || q == "\\042") {',
    '          e = index(substr(rest, 2), q)',
    '          if (e == 0) { break }',
    '          d = substr(rest, 2, e - 1)',
    '          rest = substr(rest, e + 2)',
    '        } else if (match(rest, /^[A-Za-z0-9_.\\-]+/)) {',
    '          d = substr(rest, 1, RLENGTH)',
    '          rest = substr(rest, RLENGTH + 1)',
    '        } else { break }',
    '        pending++',
    '        delim[pending] = d',
    '        strip[pending] = st',
    '      }',
    '    }',
    '    END { exit(pending > 0 ? 0 : 1) }',
    '  \' "$1" 2>/dev/null',
    '}',
    '',
    '# 按「能被 sh -n 解析」为界把启动指令切成一条条独立单元。',
    '# 这样 if/while/函数/heredoc 等多行写法会被完整保留在同一单元里。',
    'emit_entry() {',
    '  ENTRY_COUNT=$((ENTRY_COUNT + 1))',
    '  [ "$ENTRY_COUNT" -le "$MAX_ENTRIES" ] || return 4',
    '  mv -f "$1" "$WORK_DIR/entry.$ENTRY_COUNT" 2>/dev/null || return 1',
    '  return 0',
    '}',
    '',
    'split_entries() {',
    '  ENTRY_COUNT=0',
    '  cand="$WORK_DIR/candidate"',
    '  buf=""',
    '  while IFS= read -r line || [ -n "$line" ]; do',
    '    if [ -z "$buf" ]; then',
    '      buf="$line"',
    '    else',
    '      buf="$buf',
    '$line"',
    '    fi',
    '    printf "%s\\n" "$buf" > "$cand" 2>/dev/null || return 1',
    '    sh -n "$cand" 2>/dev/null || continue',
    '    heredoc_open "$cand" && continue',
    '    if entry_has_code "$cand"; then',
    '      # 只有定义没有调用 -> 先不断开，把后面的行并进来',
    '      entry_defines_only "$cand" && continue',
    '      emit_entry "$cand" || return $?',
    '    fi',
    '    buf=""',
    '  done < "$PAYLOAD"',
    '  # 收尾：文件最后一段（比如只定义了函数）也要落地，不能当成残渣丢掉',
    '  if [ -n "$buf" ]; then',
    '    printf "%s\\n" "$buf" > "$cand" 2>/dev/null || return 1',
    '    if sh -n "$cand" 2>/dev/null && ! heredoc_open "$cand"; then',
    '      if entry_has_code "$cand"; then',
    '        emit_entry "$cand" || return $?',
    '      fi',
    '    else',
    '      rm -f "$cand" 2>/dev/null || true',
    '      return 3',
    '    fi',
    '  fi',
    '  rm -f "$cand" 2>/dev/null || true',
    '  return 0',
    '}',
    '',
    '# 单条执行：放到子 shell 里跑，exit 只会结束它自己；',
    '# 超时后不杀进程（很可能是常驻服务），只是不再等待。',
    'run_entry() {',
    '  re_idx="$1"',
    '  re_file="$2"',
    '  re_rc="$WORK_DIR/rc.$re_idx"',
    '  rm -f "$re_rc" "$re_rc.tmp" 2>/dev/null || true',
    '  ( sh "$re_file"; printf "%s\\n" "$?" > "$re_rc.tmp"; mv -f "$re_rc.tmp" "$re_rc" ) </dev/null >> "$RUN_LOG" 2>&1 &',
    '  re_waited=0',
    '  while [ ! -f "$re_rc" ]; do',
    '    if [ "$re_waited" -ge "$ENTRY_TIMEOUT" ]; then',
    '      RUN_ENTRY_STATUS=running',
    '      RUN_ENTRY_RC=-',
    '      return 0',
    '    fi',
    '    sleep 1',
    '    re_waited=$((re_waited + 1))',
    '  done',
    '  re_val=$(cat "$re_rc" 2>/dev/null | tr -d " \\n")',
    '  case "$re_val" in',
    '    "" | *[!0-9]*) re_val=0 ;;',
    '  esac',
    '  RUN_ENTRY_RC="$re_val"',
    '  if [ "$re_val" = "0" ]; then',
    '    RUN_ENTRY_STATUS=ok',
    '  else',
    '    RUN_ENTRY_STATUS=fail',
    '  fi',
    '  return 0',
    '}',
    '',
    '# 兜底：整体重放启动文件（尾钩会因 F50_BOOT_REPLAY=1 跳过）。',
    'whole_replay() {',
    '  wr_rc="$WORK_DIR/rc.whole"',
    '  rm -f "$wr_rc" "$wr_rc.tmp" 2>/dev/null || true',
    '  ( F50_BOOT_REPLAY=1 sh "$BOOT_FILE"; printf "%s\\n" "$?" > "$wr_rc.tmp"; mv -f "$wr_rc.tmp" "$wr_rc" ) </dev/null >> "$RUN_LOG" 2>&1 &',
    '  wr_waited=0',
    '  while [ ! -f "$wr_rc" ]; do',
    '    if [ "$wr_waited" -ge "$WHOLE_TIMEOUT" ]; then',
    '      state_line "E|1|running|-|整体重放（未在 ${WHOLE_TIMEOUT}s 内结束）"',
    '      log_line "整体重放仍在运行，不再等待"',
    '      return 0',
    '    fi',
    '    sleep 2',
    '    wr_waited=$((wr_waited + 2))',
    '  done',
    '  wr_val=$(cat "$wr_rc" 2>/dev/null | tr -d " \\n")',
    '  case "$wr_val" in',
    '    "" | *[!0-9]*) wr_val=0 ;;',
    '  esac',
    '  if [ "$wr_val" = "0" ]; then',
    '    state_line "E|1|ok|0|整体重放启动文件"',
    '  else',
    '    state_line "E|1|fail|$wr_val|整体重放启动文件"',
    '  fi',
    '  log_line "整体重放结束 rc=$wr_val"',
    '  return 0',
    '}',
    '',
    '# --list 用独立的工作目录：状态查询可能和正在进行的开机执行并发，',
    '# 共用一个目录会把正在跑的那次的指令文件删掉。',
    'prepare_work() {',
    '  WORK_DIR="$FIX_DIR/$1"',
    '  rm -rf "$WORK_DIR" 2>/dev/null || true',
    '  mkdir -p "$WORK_DIR" 2>/dev/null || return 1',
    '  PAYLOAD="$WORK_DIR/payload.sh"',
    '  return 0',
    '}',
    '',
    '# 逐条执行 + 失败重试一次。',
    'run_entries() {',
    '  failed_list=""',
    '  idx=0',
    '  while [ "$idx" -lt "$ENTRY_COUNT" ]; do',
    '    idx=$((idx + 1))',
    '    ef="$WORK_DIR/entry.$idx"',
    '    label=$(entry_label "$ef")',
    '    [ -n "$label" ] || label="(第 $idx 条)"',
    '    run_entry "$idx" "$ef"',
    '    state_line "E|$idx|$RUN_ENTRY_STATUS|$RUN_ENTRY_RC|$label"',
    '    log_line "[$idx/$ENTRY_COUNT] $RUN_ENTRY_STATUS rc=$RUN_ENTRY_RC :: $label"',
    '    if [ "$RUN_ENTRY_STATUS" = "fail" ]; then',
    '      failed_list="$failed_list $idx"',
    '    fi',
    '  done',
    '  [ "$RETRY_FAILED" = "1" ] || return 0',
    '  [ -n "$failed_list" ] || return 0',
    '  log_line "有失败项，${RETRY_DELAY}s 后重试一次:$failed_list"',
    '  sleep "$RETRY_DELAY"',
    '  for idx in $failed_list; do',
    '    ef="$WORK_DIR/entry.$idx"',
    '    label=$(entry_label "$ef")',
    '    [ -n "$label" ] || label="(第 $idx 条)"',
    '    run_entry "retry.$idx" "$ef"',
    '    if [ "$RUN_ENTRY_STATUS" = "ok" ]; then',
    '      state_line "E|$idx|retry-ok|$RUN_ENTRY_RC|$label"',
    '    else',
    '      state_line "E|$idx|retry-$RUN_ENTRY_STATUS|$RUN_ENTRY_RC|$label"',
    '    fi',
    '    log_line "[重试 $idx] $RUN_ENTRY_STATUS rc=$RUN_ENTRY_RC :: $label"',
    '  done',
    '  return 0',
    '}',
    '',
    '# ---------------- 入口 ----------------',
    'MODE=boot',
    'FORCE=0',
    'TRIGGER=boot',
    'for arg in "$@"; do',
    '  case "$arg" in',
    '    --force) FORCE=1 ;;',
    '    --now) FORCE=1; MODE=now ;;',
    '    --list) MODE=list ;;',
    '    --sync) MODE=sync ;;',
    '    --watch) MODE=watch ;;',
    '    --version) printf "%s\\n" "$MANAGER_VERSION"; exit 0 ;;',
    '    --trigger=*) TRIGGER=${arg#--trigger=} ;;',
    '    *) ;;',
    '  esac',
    'done',
    '[ "${F50_FORCE:-0}" = "1" ] && FORCE=1',
    '',
    'mkdir -p "$FIX_DIR" 2>/dev/null || true',
    'mkdir -p /data/local/tmp 2>/dev/null || true',
    '[ -d "$FIX_DIR" ] || exit 1',
    'load_config',
    '',
    'if [ "$MODE" = "sync" ]; then',
    '  resolve_boot_id',
    '  save_boot_snapshot explicit || exit $?',
    '  start_watcher',
    '  exit 0',
    'fi',
    '',
    'if [ "$MODE" = "watch" ]; then',
    '  resolve_boot_id',
    '  run_watcher',
    'fi',
    '',
    'if [ "$MODE" = "list" ]; then',
    '  prepare_work "worklist.$$" || exit 1',
    '  if ! extract_payload; then',
    '    printf "LIST_MODE=whole\\n"',
    '    printf "LIST_ERROR=增强尾钩标记不闭合\\n"',
    '    exit 0',
    '  fi',
    '  if ! sh -n "$PAYLOAD" 2>/dev/null; then',
    '    printf "LIST_MODE=whole\\n"',
    '    printf "LIST_ERROR=启动文件语法错误\\n"',
    '    exit 0',
    '  fi',
    '  if ! split_entries; then',
    '    printf "LIST_MODE=whole\\n"',
    '    printf "LIST_ERROR=无法逐条拆分\\n"',
    '    exit 0',
    '  fi',
    '  printf "LIST_MODE=entries\\n"',
    '  printf "LIST_COUNT=%s\\n" "$ENTRY_COUNT"',
    '  li=0',
    '  while [ "$li" -lt "$ENTRY_COUNT" ]; do',
    '    li=$((li + 1))',
    '    printf "LIST|%s|%s\\n" "$li" "$(entry_label "$WORK_DIR/entry.$li")"',
    '  done',
    '  rm -rf "$WORK_DIR" 2>/dev/null || true',
    '  exit 0',
    'fi',
    '',
    'resolve_boot_id',
    '# service.d 是纯故障转移触发器：先让 UFI 原生启动窗口完整结束。',
    'case "$TRIGGER" in',
    '  service.d*)',
    '    if wait_native_grace; then',
    '      log_line "skip: UFI 原生启动已到达尾钩，本次 service.d 不重放"',
    '      save_boot_snapshot native-tail-observed || true',
    '      start_watcher',
    '      printf "%s\\n" "$BOOT_ID" > "$MARKER_FILE" 2>/dev/null || true',
    '      exit 0',
    '    fi',
    '    log_line "warning: uptime>=${NATIVE_GRACE_UPTIME}s 仍未观察到 UFI 原生尾钩，进入故障转移检查"',
    '    ;;',
    'esac',
    'if ! acquire_lock; then',
    '  log_line "skip: 已有管理器实例在运行"',
    '  trim_file "$LOG_FILE" 400 250',
    '  exit 0',
    'fi',
    '# 信号处理函数返回后 shell 会继续往下跑，所以 INT/TERM 必须显式退出，',
    '# 否则会出现「锁已释放但自己还在继续执行」，允许第二个实例并发重放。',
    'trap release_lock EXIT',
    "trap 'release_lock; exit 130' INT",
    "trap 'release_lock; exit 143' TERM",
    '',
    'log_line "==== 管理器启动 v$MANAGER_VERSION mode=$MODE trigger=$TRIGGER boot=$BOOT_ID ===="',
    '',
    'prepare_work work || { log_line "error: 无法创建工作目录"; exit 1; }',
    'if ! wait_for_boot_file; then',
    '  log_line "error: 等待 $BOOT_FILE 出现超时(${FILE_MAX_WAIT}s)，本次放弃"',
    '  : > "$STATE_FILE" 2>/dev/null || true',
    '  state_line "VERSION=$MANAGER_VERSION"',
    '  state_line "BOOT_ID=$BOOT_ID"',
    '  state_line "MODE=$MODE"',
    '  state_line "TRIGGER=$TRIGGER"',
    '  state_line "READY=nofile"',
    '  state_line "ENTRIES=0"',
    '  state_line "DONE=1"',
    '  trim_file "$LOG_FILE" 400 250',
    '  exit 1',
    'fi',
    '',
    '# service.d 可能比 UFI 原生启动更早进入等待；这里再次检查尾钩标记，避免竞态双启动。',
    'case "$TRIGGER" in',
    '  service.d*)',
    '    if native_tail_completed; then',
    '      : > "$STATE_FILE" 2>/dev/null || true',
    '      state_line "VERSION=$MANAGER_VERSION"',
    '      state_line "BOOT_ID=$BOOT_ID"',
    '      state_line "MODE=$MODE"',
    '      state_line "TRIGGER=$TRIGGER"',
    '      state_line "RUN_MODE=native-complete"',
    '      state_line "ENTRIES=0"',
    '      state_line "DONE=1"',
    '      log_line "skip: 等待期间 UFI 原生启动已到达尾钩，不再重放"',
    '      save_boot_snapshot native-tail-after-wait || true',
    '      start_watcher',
    '      printf "%s\\n" "$BOOT_ID" > "$MARKER_FILE" 2>/dev/null || true',
    '      exit 0',
    '    fi',
    '    ;;',
    'esac',
    '',
    '# 冷启动会先用旧模板重建 /sdcard。恢复必须在 45 秒就绪等待之前完成，',
    '# 否则页面和其它启动消费者会在窗口期内看到空文件。插件命令仍在系统就绪后执行。',
    'RESTORED_SNAPSHOT=0',
    'if [ "$MODE" = "boot" ]; then',
    '  restore_boot_snapshot || log_line "warning: 冷启动持久快照恢复失败，保留当前启动文件"',
    'fi',
    '',
    'LAST_BOOT_ID=$(cat "$MARKER_FILE" 2>/dev/null)',
    'if [ "$FORCE" != "1" ] && [ "$RESTORED_SNAPSHOT" != "1" ] && [ "$BOOT_ID" != "unknown" ] && [ "$BOOT_ID" = "$LAST_BOOT_ID" ]; then',
    '  log_line "skip: 本次开机($BOOT_ID)已完成过插件自启"',
    '  start_watcher',
    '  trim_file "$LOG_FILE" 400 250',
    '  exit 0',
    'fi',
    '',
    'READY_STATE=ok',
    'READY_UPTIME=$(uptime_seconds)',
    'if [ "$MODE" != "now" ]; then',
    '  if ! wait_until_ready; then',
    '    log_line "error: 等待 $BOOT_FILE 出现超时(${FILE_MAX_WAIT}s)，本次放弃"',
    '    : > "$STATE_FILE" 2>/dev/null || true',
    '    state_line "VERSION=$MANAGER_VERSION"',
    '    state_line "BOOT_ID=$BOOT_ID"',
    '    state_line "MODE=$MODE"',
    '    state_line "TRIGGER=$TRIGGER"',
    '    state_line "READY=nofile"',
    '    state_line "ENTRIES=0"',
    '    state_line "DONE=1"',
    '    trim_file "$LOG_FILE" 400 250',
    '    exit 1',
    '  fi',
    'fi',
    '',
    '# 最后一次竞态检查：故障转移等待期间若 UFI 原生脚本刚好完成，则立即退出，绝不双跑。',
    'case "$TRIGGER" in',
    '  service.d*)',
    '    resolve_boot_id',
    '    if native_tail_completed; then',
    '      log_line "skip: 系统就绪等待期间 UFI 原生启动已完成，不再重放"',
    '      save_boot_snapshot native-tail-final-check || true',
    '      start_watcher',
    '      printf "%s\\n" "$BOOT_ID" > "$MARKER_FILE" 2>/dev/null || true',
    '      exit 0',
    '    fi',
    '    ;;',
    'esac',
    '',
    ': > "$RUN_LOG" 2>/dev/null || true',
    ': > "$STATE_FILE" 2>/dev/null || true',
    'state_line "VERSION=$MANAGER_VERSION"',
    'state_line "BOOT_ID=$BOOT_ID"',
    'state_line "MODE=$MODE"',
    'state_line "TRIGGER=$TRIGGER"',
    'state_line "STARTED=$(now_stamp)"',
    'state_line "READY=$READY_STATE uptime=${READY_UPTIME}s"',
    '',
    'state_line "RESTORED=$RESTORED_SNAPSHOT"',
    '',
    'RUN_MODE=entries',
    'RUN_NOTE=',
    'if ! extract_payload; then',
    '  RUN_MODE=whole',
    '  RUN_NOTE="增强尾钩标记不闭合，改用整体重放"',
    'elif ! sh -n "$PAYLOAD" 2>/dev/null; then',
    '  RUN_MODE=whole',
    '  RUN_NOTE="启动文件本身有语法错误，改用整体重放"',
    'elif ! split_entries; then',
    '  RUN_MODE=whole',
    '  RUN_NOTE="无法逐条拆分启动指令，改用整体重放"',
    'fi',
    '',
    'if [ "$RUN_MODE" = "whole" ]; then',
    '  log_line "warning: $RUN_NOTE"',
    '  state_line "RUN_MODE=whole"',
    '  state_line "NOTE=$RUN_NOTE"',
    '  state_line "ENTRIES=1"',
    '  whole_replay',
    'else',
    '  log_line "系统就绪($READY_STATE, uptime=${READY_UPTIME}s)，开始逐条执行 $ENTRY_COUNT 条插件启动指令"',
    '  state_line "RUN_MODE=entries"',
    '  state_line "ENTRIES=$ENTRY_COUNT"',
    '  run_entries',
    'fi',
    '',
    'save_boot_snapshot manager || log_line "warning: 当前共享启动文件未生成有效持久快照"',
    'start_watcher',
    '',
    'if [ "$BOOT_ID" = "unknown" ]; then',
    '  rm -f "$MARKER_FILE" 2>/dev/null || true',
    'else',
    '  printf "%s\\n" "$BOOT_ID" > "$MARKER_FILE" 2>/dev/null || true',
    'fi',
    '',
    'state_line "FINISHED=$(now_stamp)"',
    'state_line "DONE=1"',
    'log_line "==== 本次插件自启处理完成 ===="',
    'tail -n 40 "$RUN_LOG" >> "$LOG_FILE" 2>/dev/null || true',
    'trim_file "$RUN_LOG" 400 200',
    'trim_file "$LOG_FILE" 400 250',
    'rm -f "$WORK_DIR"/rc.* "$WORK_DIR/candidate" 2>/dev/null || true',
    'exit 0',
  ].join('\n');

  // ==========================================================================
  // UFI-TOOLS 原生增强模式：绝不接管/短路 /sdcard/ufi_tools_boot.sh。
  // 官方 UFI-TOOLS samba_exec.sh 会在开机窗口直接执行 `sh ufi_tools_boot.sh`。
  // 原始插件命令先照常执行；本段固定放在文件末尾，只记录成功到尾并同步快照/监督。
  // F50_BOOT_REPLAY=1 时跳过尾钩，避免整体重放递归。
  // ==========================================================================
  const bootGate = [
    BOOT_BEGIN,
    '# F50 开机自启增强尾钩：到达这里说明 UFI 原生启动文件已完整执行到末尾。',
    '# 先写本次 boot_id 完成标记，再只做快照/监督同步；绝不二次重放原生启动命令。',
    'if [ "${F50_BOOT_REPLAY:-0}" != "1" ]; then',
    `  FIX=${shellQuote(FIX_SCRIPT)}`,
    `  NATIVE_TAIL=${shellQuote(FIX_NATIVE_TAIL_MARKER)}`,
    `  NATIVE_DIR=${shellQuote(FIX_DIR)}`,
    '  if [ -x "$FIX" ]; then',
    '    current_boot=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null || true)',
    '    [ -n "$current_boot" ] || current_boot=$(grep "^btime " /proc/stat 2>/dev/null | awk "{print \\$2}")',
    '    if [ -n "$current_boot" ]; then',
    '      mkdir -p "$NATIVE_DIR" 2>/dev/null || true',
    '      if printf "%s\\n" "$current_boot" > "$NATIVE_TAIL.tmp.$$" 2>/dev/null; then',
    '        mv -f "$NATIVE_TAIL.tmp.$$" "$NATIVE_TAIL" 2>/dev/null || true',
    '      fi',
    '      rm -f "$NATIVE_TAIL.tmp.$$" 2>/dev/null || true',
    '    fi',
    '    ( trap "" HUP; exec "$FIX" --sync --trigger=boot-tail ) </dev/null >/dev/null 2>&1 &',
    '  fi',
    'fi',
    BOOT_END,
  ].join('\n');

  const serviceDHook = [
    '#!/system/bin/sh',
    '# 由插件「全插件开机自启修复」写入：作为启动文件尾钩之外的独立备用触发。',
    '# service.d 本身运行在非阻塞的 late_start service 阶段，这里必须前台等待管理器。',
    '# 冷启动时若再放到后台，钩子退出后子进程可能被启动环境回收。',
    `FIX=${shellQuote(FIX_SCRIPT)}`,
    'attempt=1',
    'last_rc=1',
    'while [ "$attempt" -le 2 ]; do',
    '  [ -x "$FIX" ] || exit 1',
    '  trigger=service.d',
    '  [ "$attempt" = "1" ] || trigger=service.d-retry',
    '  "$FIX" --trigger="$trigger" </dev/null >/dev/null 2>&1',
    '  last_rc=$?',
    '  [ "$last_rc" = "0" ] && exit 0',
    '  attempt=$((attempt + 1))',
    '  [ "$attempt" -le 2 ] && sleep 30',
    'done',
    'exit "$last_rc"',
  ].join('\n');

  const checkRoot = async () => {
    try {
      const result = await runShellWithRoot('whoami', 5000);
      return !!(result.success && String(result.content || '').includes('root'));
    } catch (e) {
      console.error('[f50_boot_fix] runShellWithRoot 调用失败', e);
      return false;
    }
  };

  const runShell = async (script, timeout) => {
    try {
      const result = await runShellWithRoot(script, timeout);
      return {
        success: !!(result && result.success),
        content: String((result && result.content) || ''),
      };
    } catch (e) {
      console.error('[f50_boot_fix] shell 执行失败', e);
      return { success: false, content: String((e && e.message) || e || '') };
    }
  };

  // 输出分段：启动文件内容 / 插件日志都会被原样带回来，
  // 不分段的话，任何插件只要打印一行 INSTALLED=1 就能把状态显示成绿色。
  const section = (content, name) => {
    const match = String(content).match(
      new RegExp(`F50_${name}_BEGIN\\n([\\s\\S]*?)\\nF50_${name}_END`),
    );
    return match ? match[1] : '';
  };

  const parseKeyed = (content, key) => {
    const match = String(content).match(new RegExp(`(?:^|\\n)${key}=([^\\n]*)`));
    return match ? match[1] : '';
  };

  const inspectFix = async () => {
    const result = await runShell(`
      BOOT=${shellQuote(BOOT_FILE)}
      FIX=${shellQuote(FIX_SCRIPT)}
      BEGIN=${shellQuote(BOOT_BEGIN)}
      END=${shellQuote(BOOT_END)}
      begin_count=$(grep -cxF "$BEGIN" "$BOOT" 2>/dev/null || true)
      end_count=$(grep -cxF "$END" "$BOOT" 2>/dev/null || true)
      manager_count=$(grep -cF "$FIX" "$BOOT" 2>/dev/null || true)
      last_line=$(awk 'NF { line=$0 } END { print line }' "$BOOT" 2>/dev/null || true)
      [ -n "$begin_count" ] || begin_count=0
      [ -n "$end_count" ] || end_count=0
      [ -n "$manager_count" ] || manager_count=0
      manager_ok=0
      [ -x "$FIX" ] && manager_ok=1
      # 版本号直接从脚本文件里读，绝不执行来路不明的管理器：
      # 旧版管理器不认识 --version/--list，会被当成一次真正的开机重放跑起来。
      mgr_ver=$(sed -n 's/^MANAGER_VERSION=//p' "$FIX" 2>/dev/null | head -n 1)
      mgr_current=0
      [ "$mgr_ver" = ${shellQuote(MANAGER_VERSION)} ] && mgr_current=1
      tail_last=0
      [ "$last_line" = "$END" ] && tail_last=1
      installed=0
      [ "$manager_ok" = "1" ] && [ "$begin_count" = "1" ] && [ "$end_count" = "1" ] && [ "$manager_count" -ge 1 ] && installed=1
      echo "F50_META_BEGIN"
      echo "INSTALLED=$installed"
      echo "MANAGER_OK=$manager_ok"
      echo "TAIL_LAST=$tail_last"
      echo "GATE_COUNT=$begin_count/$end_count/$manager_count"
      echo "MANAGER_VERSION=$mgr_ver"
      echo "MANAGER_CURRENT=$mgr_current"
      if [ -f ${shellQuote(SERVICE_D_HOOK)} ]; then echo "SERVICE_D=1"; else echo "SERVICE_D=0"; fi
      echo "BOOT_LINES=$(grep -c -v -e '^[[:space:]]*$' "$BOOT" 2>/dev/null || true)"
      echo "F50_META_END"
      echo "F50_LIST_BEGIN"
      if [ "$mgr_current" = "1" ]; then
        "$FIX" --list 2>/dev/null
      fi
      echo "F50_LIST_END"
      echo "F50_STATE_BEGIN"
      cat ${shellQuote(FIX_STATE)} 2>/dev/null
      echo "F50_STATE_END"
      echo "F50_LOG_BEGIN"
      tail -n 14 ${shellQuote(FIX_LOG)} 2>/dev/null
      echo "F50_LOG_END"
    `, 25000);
    const meta = section(result.content, 'META');
    return {
      success: result.success && /(?:^|\n)INSTALLED=[01](?:\n|$)/.test(meta),
      installed: /(?:^|\n)INSTALLED=1(?:\n|$)/.test(meta),
      content: result.content,
    };
  };

  const installFix = async () => {
    if (!(await checkRoot())) {
      toast('请先登录后台并开启高级功能/root。', 'red', 6000);
      return false;
    }
    const result = await runShell(`
      set -e
      BOOT=${shellQuote(BOOT_FILE)}
      FIX_DIR=${shellQuote(FIX_DIR)}
      FIX=${shellQuote(FIX_SCRIPT)}
      FIX_NEW="$FIX.new.$$"
      BOOT_NEW="$BOOT.new.$$"
      PAYLOAD="$FIX_DIR/payload.$$"
      BACKUP_PAYLOAD="$FIX_DIR/backup_payload.$$"
      SRC="$FIX_DIR/src.$$"
      BOOT_ORIG="$FIX_DIR/boot.orig.$$"
      BEGIN=${shellQuote(BOOT_BEGIN)}
      END=${shellQuote(BOOT_END)}
      RECOVERY_MARKER=${shellQuote(BACKUP_RECOVERY_MARKER)}
      SNAPSHOT=${shellQuote(FIX_BOOT_SNAPSHOT)}
      MANAGER_BACKUP="$FIX_DIR/boot.before_f50_boot_manager"
      ROLLING_BACKUP="$FIX_DIR/boot_file.before_install"
      LEGACY_MANAGER_BACKUP="$BOOT.before_f50_boot_manager"
      COMMITTED=0
      cleanup() {
        rc=$?
        rm -f "$FIX_NEW" "$BOOT_NEW" "$PAYLOAD" "$PAYLOAD.rest" "$BACKUP_PAYLOAD" "$SRC" "$BOOT_ORIG" "$SNAPSHOT.new.$$" 2>/dev/null || true
        if [ "$rc" != "0" ] && [ "$COMMITTED" = "0" ]; then
          echo "F50_ABORT: 安装中断(rc=$rc)，启动文件未被改动；备份：$MANAGER_BACKUP"
        fi
      }
      trap cleanup EXIT
      mkdir -p "$FIX_DIR"
${rejectIfManagerActiveCmd()}

      # ---------- 1. 安装管理器 ----------
      cat > "$FIX_NEW" <<'F50_BOOT_FIX_EOF'
${managerScript}
F50_BOOT_FIX_EOF
      chmod 755 "$FIX_NEW"
      if ! sh -n "$FIX_NEW" 2>/dev/null; then
        echo "F50_ABORT: 管理器脚本自检未通过，已中止且未改动任何文件。"
        exit 1
      fi
      mv -f "$FIX_NEW" "$FIX"

      # ---------- 2. 备份共享启动文件 ----------
      touch "$BOOT"
      cat "$BOOT" > "$BOOT_ORIG"
      if [ ! -f "$MANAGER_BACKUP" ]; then
        if [ -s "$LEGACY_MANAGER_BACKUP" ]; then
          cat "$LEGACY_MANAGER_BACKUP" > "$MANAGER_BACKUP"
        else
          cat "$BOOT_ORIG" > "$MANAGER_BACKUP"
        fi
        chmod 600 "$MANAGER_BACKUP" 2>/dev/null || true
      elif [ ! -s "$MANAGER_BACKUP" ] && [ -s "$LEGACY_MANAGER_BACKUP" ]; then
        cat "$LEGACY_MANAGER_BACKUP" > "$MANAGER_BACKUP"
        chmod 600 "$MANAGER_BACKUP" 2>/dev/null || true
      fi
      cat "$BOOT_ORIG" > "$ROLLING_BACKUP"
      chmod 600 "$ROLLING_BACKUP" 2>/dev/null || true
      boot_size_before=$(wc -c < "$BOOT_ORIG" 2>/dev/null | tr -d ' ' || true)

      # ---------- 3. 先统一换行符，再比对门标记 ----------
      # 文件里只要混进 CRLF，门标记就会「看起来不存在」，从而被重复安装一遍。
      sed 's/\\r$//' "$BOOT_ORIG" > "$SRC"
      begin_count=$(grep -cxF "$BEGIN" "$SRC" 2>/dev/null || true)
      end_count=$(grep -cxF "$END" "$SRC" 2>/dev/null || true)
      [ -n "$begin_count" ] || begin_count=0
      [ -n "$end_count" ] || end_count=0
      if [ "$begin_count" != "$end_count" ] || [ "$begin_count" -gt 1 ]; then
        echo "F50_ABORT: 启动文件增强尾钩标记异常($begin_count/$end_count)，已中止且未改动原文件；备份：$MANAGER_BACKUP"
        exit 1
      fi

      # ---------- 4. 提取各插件的启动指令 ----------
      if ! awk -v b="$BEGIN" -v e="$END" '
        $0 == b { depth++; next }
        $0 == e { if (depth > 0) depth--; next }
        depth > 0 { next }
        { print }
        END { if (depth > 0) exit 3 }
      ' "$SRC" > "$PAYLOAD"; then
        echo "F50_ABORT: 启动指令提取失败（增强尾钩标记不闭合），已中止且未改动原文件；备份：$MANAGER_BACKUP"
        exit 1
      fi

      # 旧版若已把共享启动内容清空，则从首次安装前的只读备份整体恢复一次。
      # 这里只剥离本管理器自己的增强尾钩，其余内容完全原样保留，不识别插件名称、
      # 安装目录或启动命令，确保任意底层插件都走同一套逻辑。
      backup_recovered=0
      backup_lines=0
      payload_code_lines=$(awk 'NF && $0 !~ /^[[:space:]]*#/ { count++ } END { print count + 0 }' "$PAYLOAD" 2>/dev/null || true)
      [ -n "$payload_code_lines" ] || payload_code_lines=0
      if [ ! -f "$RECOVERY_MARKER" ] && [ "$payload_code_lines" = "0" ] && [ -f "$MANAGER_BACKUP" ]; then
        if awk -v b="$BEGIN" -v e="$END" '
          $0 == b { depth++; next }
          $0 == e { if (depth > 0) depth--; next }
          depth > 0 { next }
          { print }
          END { if (depth > 0) exit 3 }
        ' "$MANAGER_BACKUP" > "$BACKUP_PAYLOAD"; then
          backup_code_lines=$(awk 'NF && $0 !~ /^[[:space:]]*#/ { count++ } END { print count + 0 }' "$BACKUP_PAYLOAD" 2>/dev/null || true)
          [ -n "$backup_code_lines" ] || backup_code_lines=0
          if [ "$backup_code_lines" -gt 0 ]; then
            cat "$BACKUP_PAYLOAD" > "$PAYLOAD"
            backup_recovered=1
          fi
        fi
      fi

      # ---------- 5. 无损校验：提取出来的行数必须和预期完全一致 ----------
      src_lines=$(awk 'NF { count++ } END { print count + 0 }' "$SRC" 2>/dev/null || true)
      pay_lines=$(awk 'NF { count++ } END { print count + 0 }' "$PAYLOAD" 2>/dev/null || true)
      gate_lines=$(awk -v b="$BEGIN" -v e="$END" '
        $0 == b { inside=1 }
        inside && NF { count++ }
        $0 == e { inside=0 }
        END { print count + 0 }
      ' "$SRC" 2>/dev/null || true)
      [ -n "$src_lines" ] || src_lines=0
      [ -n "$pay_lines" ] || pay_lines=0
      [ -n "$gate_lines" ] || gate_lines=0
      if [ "$backup_recovered" = "1" ]; then
        backup_lines=$(awk 'NF { count++ } END { print count + 0 }' "$BACKUP_PAYLOAD" 2>/dev/null || true)
        [ -n "$backup_lines" ] || backup_lines=0
        expect_lines="$backup_lines"
      else
        expect_lines=$((src_lines - gate_lines))
      fi
      [ "$expect_lines" -ge 0 ] || expect_lines=0
      if [ "$pay_lines" != "$expect_lines" ]; then
        echo "F50_ABORT: 启动指令提取结果异常(得到 $pay_lines 行，应为 $expect_lines 行)，已中止且未改动原文件；备份：$MANAGER_BACKUP"
        exit 1
      fi

      payload_ok=1
      sh -n "$PAYLOAD" 2>/dev/null || payload_ok=0

      # ---------- 6. 组装并原子替换启动文件 ----------
      # 原文件若以 #! 开头，必须让它继续留在第一行，否则宿主直接执行该文件会失败。
      shebang=""
      first_pay=$(head -n 1 "$PAYLOAD" 2>/dev/null || true)
      case "$first_pay" in
        "#!"*) shebang="$first_pay" ;;
      esac
      : > "$BOOT_NEW"
      if [ -n "$shebang" ]; then
        printf '%s\\n' "$shebang" >> "$BOOT_NEW"
        tail -n +2 "$PAYLOAD" > "$PAYLOAD.rest"
        mv -f "$PAYLOAD.rest" "$PAYLOAD"
      fi
      if [ -s "$PAYLOAD" ]; then
        awk '
          NF {
            while (pending > 0) { print ""; pending-- }
            print
            seen=1
            next
          }
          seen { pending++ }
        ' "$PAYLOAD" >> "$BOOT_NEW"
        printf '\n' >> "$BOOT_NEW"
      fi
      cat >> "$BOOT_NEW" <<'F50_BOOT_GATE_EOF'
${bootGate}
F50_BOOT_GATE_EOF
      if ! sh -n "$BOOT_NEW" 2>/dev/null; then
        if [ "$payload_ok" = "1" ]; then
          echo "F50_ABORT: 生成的启动文件语法自检未通过，已中止且未改动原文件；备份：$MANAGER_BACKUP"
          exit 1
        fi
        echo "F50_WARN: 原启动文件本身存在语法错误（并非本次修复引入），已按原样保留其内容。"
      fi
      boot_mode=$(stat -c %a "$BOOT" 2>/dev/null || true)
      case "$boot_mode" in
        "" | *[!0-7]*) boot_mode=755 ;;
      esac
      chmod "$boot_mode" "$BOOT_NEW" 2>/dev/null || true
      # 处理期间别的插件可能刚好往同一个文件追加了自己的自启行，写回去会把它吞掉。
      boot_size_now=$(wc -c < "$BOOT" 2>/dev/null | tr -d ' ' || true)
      boot_changed=0
      if command -v cmp >/dev/null 2>&1; then
        cmp -s "$BOOT" "$BOOT_ORIG" || boot_changed=1
      elif [ -n "$boot_size_before" ] && [ -n "$boot_size_now" ] && [ "$boot_size_before" != "$boot_size_now" ]; then
        boot_changed=1
      fi
      if [ "$boot_changed" = "1" ]; then
        echo "F50_ABORT: 启动文件在处理过程中被其它插件改动，已中止且未改动原文件，请重新点击一次；备份：$MANAGER_BACKUP"
        exit 1
      fi
      mv -f "$BOOT_NEW" "$BOOT"
      COMMITTED=1
      # 完整托管文件必须落在 /data；/sdcard 上的同目录备份会和主文件一起被冷启动覆盖。
      SNAPSHOT_NEW="$SNAPSHOT.new.$$"
      cat "$BOOT" > "$SNAPSHOT_NEW"
      chmod 600 "$SNAPSHOT_NEW" 2>/dev/null || true
      mv -f "$SNAPSHOT_NEW" "$SNAPSHOT"
      # 本版本首次安装时完成一次恢复判定；之后尊重用户对共享启动文件的修改。
      : > "$RECOVERY_MARKER"
      sync 2>/dev/null || true

      # ---------- 7. 备用触发点（有 Magisk 时才装，管理器本身幂等）----------
      if [ -d ${shellQuote(SERVICE_D_DIR)} ]; then
        cat > ${shellQuote(SERVICE_D_HOOK)} <<'F50_SERVICE_D_EOF'
${serviceDHook}
F50_SERVICE_D_EOF
        chmod 755 ${shellQuote(SERVICE_D_HOOK)} 2>/dev/null || true
        sync 2>/dev/null || true
        echo "F50_EXTRA_TRIGGER=1"
      fi

      "$FIX" --sync >/dev/null 2>&1 || true

      echo "F50_ENTRY_HINT=$("$FIX" --list 2>/dev/null | grep -c '^LIST|' || true)"
      echo "F50_BOOT_FIX_INSTALLED"
    `, 30000);

    if (!result.success || !result.content.includes('F50_BOOT_FIX_INSTALLED')) {
      toast(`安装失败：${escapeHtml(result.content || '未知错误')}`, 'red', 9000);
      return false;
    }
    const entries = parseKeyed(result.content, 'F50_ENTRY_HINT') || '?';
    const extra = result.content.includes('F50_EXTRA_TRIGGER=1') ? '（已加装 service.d 备用触发点）' : '';
    const warn = result.content.includes('F50_WARN:')
      ? `<br>${escapeHtml((result.content.match(/F50_WARN:[^\n]*/) || [''])[0])}`
      : '';
    toast(`开机自启增强已安装：UFI 原生顺序不变，${escapeHtml(entries)} 条启动指令可隔离重试${extra}${warn}`, 'green', 7000);
    return true;
  };

  const uninstallFix = async () => {
    if (!(await checkRoot())) {
      toast('请先登录后台并开启高级功能/root。', 'red', 6000);
      return false;
    }
    const result = await runShell(`
      set -e
      BOOT=${shellQuote(BOOT_FILE)}
      BEGIN=${shellQuote(BOOT_BEGIN)}
      END=${shellQuote(BOOT_END)}
      BOOT_NEW="$BOOT.new.$$"
      PAYLOAD="$BOOT.payload.$$"
      SRC="$BOOT.src.$$"
      BOOT_ORIG="$BOOT.orig.$$"
      FIX_DIR=${shellQuote(FIX_DIR)}
      MANAGER_BACKUP="$FIX_DIR/boot.before_f50_boot_manager"
      ROLLING_BACKUP="$FIX_DIR/boot_file.before_uninstall"
      WATCHER_TAG=${shellQuote(FIX_WATCHER_TAG)}
      trap 'rm -f "$BOOT_NEW" "$PAYLOAD" "$SRC" "$BOOT_ORIG" 2>/dev/null || true' EXIT
${rejectIfManagerActiveCmd()}
      touch "$BOOT"
      cat "$BOOT" > "$BOOT_ORIG"
      cat "$BOOT_ORIG" > "$ROLLING_BACKUP"
      chmod 600 "$ROLLING_BACKUP" 2>/dev/null || true
      sed 's/\\r$//' "$BOOT_ORIG" > "$SRC"
      begin_count=$(grep -cxF "$BEGIN" "$SRC" 2>/dev/null || true)
      end_count=$(grep -cxF "$END" "$SRC" 2>/dev/null || true)
      [ -n "$begin_count" ] || begin_count=0
      [ -n "$end_count" ] || end_count=0
      if [ "$begin_count" != "$end_count" ]; then
        echo "F50_ABORT: 门标记异常($begin_count/$end_count)，未改动启动文件；备份：$MANAGER_BACKUP"
        exit 1
      fi
      if [ "$begin_count" != "0" ]; then
        if ! awk -v b="$BEGIN" -v e="$END" '
          $0 == b { depth++; next }
          $0 == e { if (depth > 0) depth--; next }
          depth > 0 { next }
          { print }
          END { if (depth > 0) exit 3 }
        ' "$SRC" > "$PAYLOAD"; then
          echo "F50_ABORT: 提取失败，未改动启动文件；备份：$MANAGER_BACKUP"
          exit 1
        fi
        src_lines=$(awk 'NF { count++ } END { print count + 0 }' "$SRC" 2>/dev/null || true)
        pay_lines=$(awk 'NF { count++ } END { print count + 0 }' "$PAYLOAD" 2>/dev/null || true)
        gate_lines=$(awk -v b="$BEGIN" -v e="$END" '
          $0 == b { inside=1 }
          inside && NF { count++ }
          $0 == e { inside=0 }
          END { print count + 0 }
        ' "$SRC" 2>/dev/null || true)
        [ -n "$src_lines" ] || src_lines=0
        [ -n "$pay_lines" ] || pay_lines=0
        [ -n "$gate_lines" ] || gate_lines=0
        expect_lines=$((src_lines - gate_lines))
        [ "$expect_lines" -ge 0 ] || expect_lines=0
        if [ "$pay_lines" != "$expect_lines" ]; then
          echo "F50_ABORT: 提取结果异常($pay_lines/$expect_lines)，未改动启动文件；备份：$MANAGER_BACKUP"
          exit 1
        fi
        awk 'f || NF { f=1; print }' "$PAYLOAD" > "$BOOT_NEW"
        boot_mode=$(stat -c %a "$BOOT" 2>/dev/null || true)
        case "$boot_mode" in
          "" | *[!0-7]*) boot_mode=755 ;;
        esac
        chmod "$boot_mode" "$BOOT_NEW" 2>/dev/null || true
        boot_changed=0
        if command -v cmp >/dev/null 2>&1; then
          cmp -s "$BOOT" "$BOOT_ORIG" || boot_changed=1
        else
          boot_size_before=$(wc -c < "$BOOT_ORIG" 2>/dev/null | tr -d ' ' || true)
          boot_size_now=$(wc -c < "$BOOT" 2>/dev/null | tr -d ' ' || true)
          if [ -n "$boot_size_before" ] && [ -n "$boot_size_now" ] && [ "$boot_size_before" != "$boot_size_now" ]; then
            boot_changed=1
          fi
        fi
        if [ "$boot_changed" = "1" ]; then
          echo "F50_ABORT: 启动文件在卸载过程中被其它插件改动，已中止且未改动原文件，请重新点击一次；备份：$MANAGER_BACKUP"
          exit 1
        fi
        mv -f "$BOOT_NEW" "$BOOT"
        sync 2>/dev/null || true
      fi
      watcher_tag=$(cat "$WATCHER_TAG" 2>/dev/null || true)
      watcher_boot=\${watcher_tag%.*}
      watcher_pid=\${watcher_tag##*.}
      current_boot=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null || true)
      case "$watcher_pid" in "" | *[!0-9]*) watcher_pid= ;; esac
      if [ -n "$watcher_pid" ] && [ "$watcher_boot" = "$current_boot" ] && kill -0 "$watcher_pid" 2>/dev/null; then
        watcher_cmd=$(tr '\\000' ' ' < "/proc/$watcher_pid/cmdline" 2>/dev/null || true)
        case "$watcher_cmd" in *boot_manager.sh*--watch*) kill "$watcher_pid" 2>/dev/null || true ;; esac
      fi
      rm -f ${shellQuote(SERVICE_D_HOOK)} 2>/dev/null || true
      rm -rf ${shellQuote(FIX_DIR)} 2>/dev/null || true
      echo "F50_BOOT_FIX_REMOVED"
    `, 20000);
    if (!result.success || !result.content.includes('F50_BOOT_FIX_REMOVED')) {
      toast(`卸载失败：${escapeHtml(result.content || '未知错误')}`, 'red', 9000);
      return false;
    }
    toast('开机自启增强已卸载；插件启动指令保持不变。', 'green', 6000);
    return true;
  };

  // 立即执行一次（不用重启）：后台拉起管理器，再轮询状态文件。
  const runNow = async (onProgress = () => {}) => {
    if (!(await checkRoot())) {
      toast('请先登录后台并开启高级功能/root。', 'red', 6000);
      return null;
    }
    const start = await runShell(`
      FIX=${shellQuote(FIX_SCRIPT)}
      if [ ! -x "$FIX" ]; then
        echo "F50_NO_MANAGER"
        exit 0
      fi
${rejectIfManagerActiveCmd()}
      rm -f ${shellQuote(FIX_STATE)} 2>/dev/null || true
      ( trap '' HUP; exec "$FIX" --now --trigger=manual ) </dev/null >/dev/null 2>&1 &
      echo "F50_STARTED"
    `, 10000);
    if (start.content.includes('F50_NO_MANAGER')) {
      toast('尚未安装管理器，请先点击「安装 / 修复」。', 'yellow', 6000);
      return null;
    }
    if (start.content.includes('F50_MANAGER_BUSY')) {
      toast('已有一轮开机启动任务正在执行，请稍后检查状态。', 'yellow', 6000);
      return null;
    }
    if (!start.success || !start.content.includes('F50_STARTED')) {
      toast(`启动失败：${escapeHtml(start.content || '未知错误')}`, 'red', 8000);
      return null;
    }
    const deadline = Date.now() + 180000;
    let last = '';
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const poll = await runShell(`cat ${shellQuote(FIX_STATE)} 2>/dev/null || true`, 8000);
      last = poll.content;
      onProgress(last);
      if (/(?:^|\n)DONE=1(?:\n|$)/.test(last)) return last;
    }
    toast('执行仍在进行中（可能有常驻服务未退出），可稍后点「检查状态」查看结果。', 'yellow', 8000);
    return last;
  };

  // ==========================================================================
  // UI
  // ==========================================================================
  const STATUS_LABEL = {
    ok: ['成功', '#39b54a'],
    'retry-ok': ['重试后成功', '#39b54a'],
    running: ['仍在运行（常驻）', '#c8a020'],
    fail: ['失败', '#d0454c'],
    'retry-fail': ['重试后仍失败', '#d0454c'],
    'retry-running': ['重试中仍在运行', '#c8a020'],
  };

  const renderState = (stateText) => {
    if (!stateText || !stateText.trim()) return '<div class="f50bf-empty">暂无执行记录。可点击「执行一次」进行验证。</div>';
    const lines = stateText.split('\n');
    const meta = {};
    const entries = [];
    lines.forEach((line) => {
      if (line.startsWith('E|')) {
        const parts = line.split('|');
        entries.push({ idx: parts[1], status: parts[2], rc: parts[3], label: parts.slice(4).join('|') });
      } else if (line.includes('=')) {
        meta[line.slice(0, line.indexOf('='))] = line.slice(line.indexOf('=') + 1);
      }
    });
    const head = [
      meta.STARTED ? `开始：${meta.STARTED}` : '',
      meta.READY ? `就绪判定：${meta.READY}` : '',
      meta.RUN_MODE ? `执行方式：${meta.RUN_MODE === 'whole' ? '整体重放（兜底）' : '逐条隔离'}` : '',
      meta.TRIGGER ? `触发来源：${meta.TRIGGER}` : '',
      meta.NOTE ? `说明：${meta.NOTE}` : '',
      meta.DONE === '1' ? '' : '执行中…',
    ].filter(Boolean).map((t) => escapeHtml(t)).join(' · ');
    if (!entries.length) {
      const empty = meta.ENTRIES === '0' && meta.DONE === '1'
        ? '<div class="f50bf-empty">本次没有可执行的插件启动指令。</div>'
        : '';
      return `<div class="f50bf-run-meta">${head}</div>${empty}`;
    }
    const rows = entries.map((e) => {
      const [text, color] = STATUS_LABEL[e.status] || [e.status, '#888'];
      return `<div class="f50bf-run-row">
        <span class="f50bf-run-index">${escapeHtml(e.idx)}</span>
        <span class="f50bf-run-result" style="color:${color}">${escapeHtml(text)}${e.rc && e.rc !== '-' && e.rc !== '0' ? `（${escapeHtml(e.rc)}）` : ''}</span>
        <span class="f50bf-code">${escapeHtml(e.label)}</span>
      </div>`;
    }).join('');
    return `<div class="f50bf-run-meta">${head}</div>${rows}`;
  };

  const renderDetail = (content) => {
    const meta = section(content, 'META');
    const listBlock = section(content, 'LIST');
    const installed = /(?:^|\n)INSTALLED=1(?:\n|$)/.test(meta);
    const managerOk = parseKeyed(meta, 'MANAGER_OK') === '1';
    const gate = parseKeyed(meta, 'GATE_COUNT');
    const tailLast = parseKeyed(meta, 'TAIL_LAST') === '1';
    const version = parseKeyed(meta, 'MANAGER_VERSION');
    const serviceD = parseKeyed(meta, 'SERVICE_D') === '1';
    const listMode = parseKeyed(listBlock, 'LIST_MODE');
    const listError = parseKeyed(listBlock, 'LIST_ERROR');
    const listCount = parseKeyed(listBlock, 'LIST_COUNT');
    const listItems = (listBlock.match(/(?:^|\n)LIST\|[^\n]*/g) || []).map((line) => {
      const parts = line.replace(/^\n/, '').split('|');
      return { idx: parts[1], label: parts.slice(2).join('|') };
    });
    const stateText = section(content, 'STATE');
    const logText = section(content, 'LOG').trim();
    const logHtml = logText
      ? `<div class="f50bf-log">${escapeHtml(logText)}</div>`
      : '<div class="f50bf-empty">暂无管理器运行日志。</div>';

    const warnings = [];
    const [begin, end] = String(gate).split('/');
    if (!managerOk) warnings.push('增强管理器不可用。UFI 原生启动不受影响；点击「安装 / 修复」恢复重试和日志。');
    if (managerOk && begin === '0') warnings.push('启动尾钩缺失，可能被其他插件重写。点击「安装 / 修复」恢复。');
    if (begin !== end) warnings.push(`启动尾钩标记异常（${escapeHtml(String(gate))}）。点击「安装 / 修复」修正。`);
    if (installed && !tailLast) warnings.push('尾钩不在启动文件末尾。点击「安装 / 修复」重排。');
    if (managerOk && version !== MANAGER_VERSION) {
      warnings.push(version
        ? `管理器版本为 v${escapeHtml(version)}，当前版本为 v${MANAGER_VERSION}。点击「安装 / 修复」升级。`
        : `管理器版本过旧。点击「安装 / 修复」升级到 v${MANAGER_VERSION}。`);
    }
    if (listError) warnings.push(`启动指令解析失败：${escapeHtml(listError)}。将改用整体执行；单条指令卡住时会影响后续指令。`);

    const listHtml = listItems.length
      ? listItems.map((item) => `<div class="f50bf-command"><span>${escapeHtml(item.idx)}</span><span class="f50bf-code">${escapeHtml(item.label)}</span></div>`).join('')
      : '<div class="f50bf-empty">没有插件启动指令。</div>';
    const warningHtml = warnings.length
      ? `<div class="f50bf-warning"><strong>需要处理</strong>${warnings.map((w) => `<div>${w}</div>`).join('')}</div>`
      : '';
    const countText = `${escapeHtml(listCount || String(listItems.length))} 条${listMode === 'whole' ? ' · 整体执行' : ''}`;
    const hasState = !!stateText.trim();

    return `
      <div class="f50bf-detail">
        <div class="f50bf-metrics">
          <div><span>增强层</span><strong>${installed ? '已安装' : '未安装'}</strong></div>
          <div><span>管理器</span><strong>${managerOk ? `v${escapeHtml(version || '?')}` : '不可用'}</strong></div>
          <div><span>启动尾钩</span><strong>${escapeHtml(gate || '-')}</strong></div>
          <div><span>备用触发</span><strong>${serviceD ? 'service.d' : '未启用'}</strong></div>
        </div>
        ${warningHtml}
        <details class="f50bf-subpanel">
          <summary><span>启动指令</span><span>${countText}</span></summary>
          <div class="f50bf-subpanel-body">${listHtml}</div>
        </details>
        <details class="f50bf-subpanel"${hasState ? ' open' : ''}>
          <summary><span>最近一次执行结果</span><span>${hasState ? '已记录' : '无记录'}</span></summary>
          <div class="f50bf-subpanel-body">${renderState(stateText)}</div>
        </details>
        <details class="f50bf-subpanel">
          <summary><span>管理器运行日志</span><span>最近 14 行</span></summary>
          <div class="f50bf-subpanel-body">${logHtml}</div>
        </details>
      </div>`;
  };

  const mount = () => {
    if (document.getElementById(ROOT_ID)) return true;
    const functions = document.querySelector('.functions-container');
    if (!functions) return false;

    const section = document.createElement('div');
    section.id = ROOT_ID;
    section.innerHTML = `
      <style>
        #${ROOT_ID}{margin-top:10px;color:inherit;}
        #${ROOT_ID} *{box-sizing:border-box;}
        #${ROOT_ID}_panel{overflow:hidden;border:1px solid rgba(148,163,184,.20);border-radius:15px;background:rgba(15,23,42,.36);}
        #${ROOT_ID}_panel>summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;margin:0;padding:9px 12px;background:linear-gradient(135deg,rgba(30,41,59,.72),rgba(15,23,42,.42));}
        #${ROOT_ID}_panel>summary::-webkit-details-marker{display:none;}
        #${ROOT_ID}_panel>summary::after{content:'+';flex:0 0 auto;font-size:.78rem;opacity:.7;}
        #${ROOT_ID}_panel[open]>summary::after{content:'−';}
        #${ROOT_ID} .f50bf-heading{display:grid;gap:3px;min-width:0;}
        #${ROOT_ID} .f50bf-heading strong{font-size:.70rem;line-height:1.2;}
        #${ROOT_ID} .f50bf-heading span{font-size:.56rem;line-height:1.35;opacity:.68;font-weight:400;}
        #${ROOT_ID} .f50bf-body{padding:10px;}
        #${ROOT_ID} .f50bf-overview{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:stretch;margin-bottom:9px;}
        #${ROOT_ID} .f50bf-summary{padding:8px 10px;border:1px solid rgba(96,165,250,.20);border-radius:10px;background:rgba(15,23,42,.45);font-size:.59rem;line-height:1.55;color:#cbd5e1;}
        #${ROOT_ID} .f50bf-state{display:flex;align-items:center;justify-content:center;min-width:82px;padding:7px 10px;border:1px solid rgba(148,163,184,.22);border-radius:10px;background:rgba(15,23,42,.48);font-size:.60rem;font-weight:800;white-space:nowrap;color:#cbd5e1;}
        #${ROOT_ID} .f50bf-state[data-tone="ok"]{border-color:rgba(74,222,128,.32);background:rgba(20,83,45,.32);color:#bbf7d0;}
        #${ROOT_ID} .f50bf-state[data-tone="warn"]{border-color:rgba(251,191,36,.34);background:rgba(120,53,15,.28);color:#fde68a;}
        #${ROOT_ID} .f50bf-state[data-tone="error"]{border-color:rgba(248,113,113,.36);background:rgba(127,29,29,.28);color:#fecaca;}
        #${ROOT_ID} .f50bf-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
        #${ROOT_ID} .f50bf-actions button{flex:0 0 auto;min-width:82px;min-height:32px;padding:5px 10px;border-radius:9px;font-size:.61rem;}
        #${ROOT_ID} .f50bf-primary{background:linear-gradient(180deg,rgba(37,99,235,.96),rgba(30,64,175,.96));border-color:rgba(147,197,253,.35);}
        #${ROOT_ID} .f50bf-danger{margin-left:auto;background:linear-gradient(180deg,rgba(127,29,29,.94),rgba(69,10,10,.94));border-color:rgba(252,165,165,.34);}
        #${ROOT_ID} button:focus-visible,#${ROOT_ID} summary:focus-visible{outline:2px solid #60a5fa;outline-offset:2px;}
        #${ROOT_ID} .f50bf-detail{display:grid;gap:8px;margin-top:10px;font-size:.60rem;line-height:1.6;}
        #${ROOT_ID} .f50bf-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}
        #${ROOT_ID} .f50bf-metrics>div{display:grid;gap:2px;padding:7px 8px;border:1px solid rgba(148,163,184,.16);border-radius:9px;background:rgba(15,23,42,.35);min-width:0;}
        #${ROOT_ID} .f50bf-metrics span{font-size:.54rem;opacity:.64;}
        #${ROOT_ID} .f50bf-metrics strong{font-size:.61rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        #${ROOT_ID} .f50bf-warning{display:grid;gap:4px;padding:8px 10px;border:1px solid rgba(248,113,113,.28);border-radius:9px;background:rgba(127,29,29,.18);color:#fecaca;}
        #${ROOT_ID} .f50bf-warning strong{font-size:.61rem;}
        #${ROOT_ID} .f50bf-subpanel{overflow:hidden;border:1px solid rgba(148,163,184,.16);border-radius:9px;background:rgba(15,23,42,.28);}
        #${ROOT_ID} .f50bf-subpanel>summary{display:flex;justify-content:space-between;gap:10px;padding:7px 9px;cursor:pointer;list-style:none;font-size:.60rem;font-weight:800;background:rgba(30,41,59,.38);}
        #${ROOT_ID} .f50bf-subpanel>summary::-webkit-details-marker{display:none;}
        #${ROOT_ID} .f50bf-subpanel>summary span:last-child{font-size:.54rem;font-weight:400;opacity:.65;}
        #${ROOT_ID} .f50bf-subpanel-body{padding:8px 9px;max-height:260px;overflow:auto;}
        #${ROOT_ID} .f50bf-command,#${ROOT_ID} .f50bf-run-row{display:grid;grid-template-columns:2.2em minmax(0,1fr);gap:7px;padding:3px 0;border-top:1px solid rgba(148,163,184,.10);}
        #${ROOT_ID} .f50bf-command:first-child,#${ROOT_ID} .f50bf-run-row:first-of-type{border-top:0;}
        #${ROOT_ID} .f50bf-command>span:first-child,#${ROOT_ID} .f50bf-run-index{opacity:.55;}
        #${ROOT_ID} .f50bf-run-row{grid-template-columns:2.2em minmax(7.5em,auto) minmax(0,1fr);align-items:baseline;}
        #${ROOT_ID} .f50bf-code{word-break:break-all;font-family:Consolas,Monaco,monospace;}
        #${ROOT_ID} .f50bf-run-meta{margin-bottom:5px;color:#cbd5e1;opacity:.78;}
        #${ROOT_ID} .f50bf-log{white-space:pre-wrap;word-break:break-all;font-family:Consolas,Monaco,monospace;line-height:1.45;}
        #${ROOT_ID} .f50bf-empty{opacity:.68;}
        @media (max-width:720px){#${ROOT_ID} .f50bf-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}}
        @media (max-width:520px){#${ROOT_ID} .f50bf-overview{grid-template-columns:1fr;}#${ROOT_ID} .f50bf-state{justify-content:flex-start;}#${ROOT_ID} .f50bf-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));}#${ROOT_ID} .f50bf-actions button{width:100%;min-width:0;}#${ROOT_ID} .f50bf-danger{margin-left:0;}#${ROOT_ID} .f50bf-run-row{grid-template-columns:2.2em minmax(0,1fr);}#${ROOT_ID} .f50bf-run-result{grid-column:2;}#${ROOT_ID} .f50bf-run-row .f50bf-code{grid-column:2;}}
      </style>
      <details id="${ROOT_ID}_panel">
        <summary class="title"><span class="f50bf-heading"><strong>开机自启管理</strong><span>保留 UFI 原生启动顺序，为失败或卡住的插件增加隔离重试。</span></span></summary>
        <div class="f50bf-body">
          <div class="f50bf-overview">
            <div class="f50bf-summary">安装或修复增强层不会删除插件启动指令；卸载后仍由 UFI 原生机制执行。</div>
            <div id="${ROOT_ID}_state" class="f50bf-state" data-tone="idle">未检查</div>
          </div>
          <div class="f50bf-actions">
            <button class="btn f50bf-primary" id="${ROOT_ID}_install">安装 / 修复</button>
            <button class="btn" id="${ROOT_ID}_status">刷新状态</button>
            <button class="btn" id="${ROOT_ID}_run">执行一次</button>
            <button class="btn f50bf-danger" id="${ROOT_ID}_uninstall">卸载增强</button>
          </div>
          <div id="${ROOT_ID}_detail"></div>
        </div>
      </details>
    `;
    functions.insertAdjacentElement('afterend', section);

    const installBtn = section.querySelector(`#${ROOT_ID}_install`);
    const statusBtn = section.querySelector(`#${ROOT_ID}_status`);
    const runBtn = section.querySelector(`#${ROOT_ID}_run`);
    const uninstallBtn = section.querySelector(`#${ROOT_ID}_uninstall`);
    const statusEl = section.querySelector(`#${ROOT_ID}_state`);
    const detailEl = section.querySelector(`#${ROOT_ID}_detail`);
    const actionButtons = [installBtn, statusBtn, runBtn, uninstallBtn].filter(Boolean);
    let actionBusy = false;
    const setPanelStatus = (text, tone = 'idle') => {
      statusEl.textContent = text;
      statusEl.dataset.tone = tone;
    };

    const showStatus = async () => {
      if (!(await checkRoot())) {
        setPanelStatus('需要 root 权限', 'error');
        toast('请先登录后台并开启高级功能/root。', 'red', 6000);
        return;
      }
      const state = await inspectFix();
      if (!state.success) {
        setPanelStatus('检查失败', 'error');
        detailEl.innerHTML = '';
        toast(`状态检查失败，未修改文件。<br>${escapeHtml(state.content || '')}`, 'red', 7000);
        return;
      }
      setPanelStatus(state.installed ? '已安装' : '未安装', state.installed ? 'ok' : 'warn');
      detailEl.innerHTML = renderDetail(state.content);
    };

    const withBusy = (button, busyText, task) => async () => {
      if (!guardHost()) return;
      if (actionBusy) {
        toast('已有一项开机自启操作正在进行，请等待完成。', 'yellow', 4000);
        return;
      }
      actionBusy = true;
      const raw = button.textContent;
      const disabledStates = actionButtons.map((item) => item.disabled);
      actionButtons.forEach((item) => { item.disabled = true; });
      button.textContent = busyText;
      try {
        await task();
      } catch (e) {
        console.error('[f50_boot_fix] 操作异常', e);
        toast(`操作异常：${escapeHtml((e && e.message) || String(e))}`, 'red', 8000);
      } finally {
        actionButtons.forEach((item, index) => { item.disabled = disabledStates[index]; });
        button.textContent = raw;
        actionBusy = false;
      }
    };

    installBtn.onclick = withBusy(installBtn, '安装中…', async () => {
      // 失败路径也刷新一次：超时之类的情况下安装其实可能已经生效，
      // 只是那条成功标记没来得及回传，不刷新会让人以为没装上。
      await installFix();
      await showStatus();
    });

    statusBtn.onclick = withBusy(statusBtn, '检查中…', showStatus);

    runBtn.onclick = withBusy(runBtn, '执行中…', async () => {
      detailEl.innerHTML = '<div class="f50bf-detail"><div class="f50bf-summary">正在按开机流程执行插件启动指令…</div></div>';
      const finalState = await runNow((partial) => {
        detailEl.innerHTML = `<div class="f50bf-detail"><div class="f50bf-subpanel-body">${renderState(partial)}</div></div>`;
      });
      if (finalState) toast('本轮启动指令已执行，结果见下方。', 'green', 6000);
      await showStatus();
    });

    uninstallBtn.onclick = withBusy(uninstallBtn, '卸载中…', async () => {
      if (!window.confirm('卸载开机自启增强？这会移除管理器和启动尾钩；插件启动指令保留，UFI 原生启动不受影响。')) return;
      if (await uninstallFix()) await showStatus();
    });

    return true;
  };

  if (!mount()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (mount() || attempts >= 60) clearInterval(timer);
    }, 500);
  }
})();
//</script>
