//<script>
// 猫猫 Sing-box eBPF v0.2.0 - 独立套件安装与 eBPF 运行入口
((hostRunShellWithRoot) => {
  const ROOT = '/data/singbox_ebpf';
  const BINARY = `${ROOT}/sing-box`;
  const CONFIG = `${ROOT}/config.json`;
  const SERVICE = `${ROOT}/Scripts/SingBox.Service`;
  const PID_FILE = `${ROOT}/sing-box.pid`;
  const LOG = `${ROOT}/sing-box.log`;
  const SETTINGS = `${ROOT}/settings.conf`;
  const F50_FILES_DIR = '/data/data/com.minikano.f50_sms/files';
  const BOOT_FILE = '/sdcard/ufi_tools_boot.sh';
  const BOOT_BEGIN = '# KANO_SINGBOX_EBPF_BEGIN';
  const BOOT_END = '# KANO_SINGBOX_EBPF_END';
  const ROOT_ELEMENT_ID = 'kano_singbox_ebpf_root';
  const STYLE_ID = 'kano_singbox_ebpf_style';

  const shellQuote = (value) => `'${String(value).replace(/'/g, "'\\''")}'`;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
  const normalizeInterface = (value = '') => {
    const name = String(value).trim();
    return /^[A-Za-z0-9_.:-]{1,32}$/.test(name) ? name : 'br0';
  };

  const toast = (message, color = 'blue', duration = 4500) => {
    if (typeof createToast === 'function') createToast(message, color, duration);
    else alert(String(message).replace(/<br>/g, '\n'));
  };

  const runShell = async (script, timeout = 20_000) => {
    if (typeof hostRunShellWithRoot !== 'function') {
      return { success: false, content: '宿主未提供 runShellWithRoot' };
    }
    try {
      const result = await hostRunShellWithRoot.call(globalThis, script, timeout);
      return { success: result?.success !== false, content: String(result?.content || '') };
    } catch (error) {
      return { success: false, content: String(error?.message || error || 'Shell 调用失败') };
    }
  };

  const getUploadedPath = (url) => {
    const normalized = String(url || '').replace(/^\/+/, '');
    if (!normalized || normalized.includes('..')) throw new Error('上传路径异常');
    return `${F50_FILES_DIR}/${normalized}`;
  };

  const readSettings = async () => {
    const result = await runShell(`[ -f ${shellQuote(SETTINGS)} ] && cat ${shellQuote(SETTINGS)} || true`);
    const settings = { interfaceName: 'br0' };
    String(result.content).split(/\r?\n/).forEach((line) => {
      const separator = line.indexOf('=');
      if (separator < 1) return;
      if (line.slice(0, separator).trim() === 'interface') settings.interfaceName = normalizeInterface(line.slice(separator + 1));
    });
    return settings;
  };

  const writeSettings = async (interfaceName) => runShell(`
    set -eu
    mkdir -p ${shellQuote(ROOT)}
    tmp=${shellQuote(SETTINGS)}.tmp.$$
    printf '%s\\n' ${shellQuote(`interface=${normalizeInterface(interfaceName)}`)} > "$tmp"
    chmod 600 "$tmp"
    mv -f "$tmp" ${shellQuote(SETTINGS)}
  `);

  const serviceScript = [
    '#!/system/bin/sh',
    `ROOT=${shellQuote(ROOT)}`,
    `BIN=${shellQuote(BINARY)}`,
    `CONFIG=${shellQuote(CONFIG)}`,
    `PID_FILE=${shellQuote(PID_FILE)}`,
    `LOG=${shellQuote(LOG)}`,
    'is_our_pid() {',
    '  pid="$1"',
    '  case "$pid" in ""|*[!0-9]*) return 1 ;; esac',
    '  kill -0 "$pid" 2>/dev/null || return 1',
    '  tr "\\000" " " < "/proc/$pid/cmdline" 2>/dev/null | grep -F "$BIN" >/dev/null 2>&1',
    '}',
    'running_pid() {',
    '  pid=$(cat "$PID_FILE" 2>/dev/null || true)',
    '  if is_our_pid "$pid"; then printf "%s" "$pid"; return 0; fi',
    '  rm -f "$PID_FILE" 2>/dev/null || true',
    '  return 1',
    '}',
    'case "$1" in',
    '  start)',
    '    [ -x "$BIN" ] || { echo "BINARY_MISSING"; exit 1; }',
    '    [ -s "$CONFIG" ] || { echo "CONFIG_MISSING"; exit 1; }',
    '    if pid=$(running_pid); then echo "ALREADY_RUNNING:$pid"; exit 0; fi',
    '    (cd "$ROOT" && "$BIN" check -c "$CONFIG") || exit 1',
    '    (cd "$ROOT" && nohup "$BIN" run -c "$CONFIG" >> "$LOG" 2>&1 & echo $! > "$PID_FILE")',
    '    sleep 2',
    '    if pid=$(running_pid); then echo "STARTED:$pid"; exit 0; fi',
    '    echo "START_FAILED"; tail -n 80 "$LOG" 2>/dev/null || true; exit 1',
    '    ;;',
    '  stop)',
    '    if pid=$(running_pid); then kill "$pid" 2>/dev/null || true; sleep 1; fi',
    '    rm -f "$PID_FILE"; echo "STOPPED"',
    '    ;;',
    '  status)',
    '    if pid=$(running_pid); then echo "RUNNING:$pid"; else echo "STOPPED"; fi',
    '    ;;',
    '  check)',
    '    [ -x "$BIN" ] && [ -s "$CONFIG" ] || { echo "INSTALL_INCOMPLETE"; exit 1; }',
    '    cd "$ROOT" && "$BIN" check -c "$CONFIG"',
    '    ;;',
    '  *) echo "usage: $0 {start|stop|status|check}"; exit 2 ;;',
    'esac',
    '',
  ].join('\n');

  const patchSharedInterface = (interfaceName) => `
    config_new="$package_root/config.json.interface.$$"
    awk -v iface=${shellQuote(normalizeInterface(interfaceName))} '
      /"include_interface"[[:space:]]*:/ { in_interfaces=1; print; next }
      in_interfaces && /^[[:space:]]*"/ {
        sub(/"[^"]+"/, "\"" iface "\"")
        in_interfaces=0
      }
      { print }
    ' "$package_root/config.json" > "$config_new"
    mv -f "$config_new" "$package_root/config.json"
  `;

  const installPackage = async (uploadedPath, interfaceName) => runShell(`
    set -eu
    SRC=${shellQuote(uploadedPath)}
    TARGET=${shellQuote(ROOT)}
    STAGE=/data/singbox_ebpf_stage.$$
    BACKUP=/data/singbox_ebpf_backup.$$
    package_root=
    committed=0
    cleanup() {
      rc=$?
      trap - EXIT
      rm -rf "$STAGE" 2>/dev/null || true
      if [ "$rc" -ne 0 ] && [ "$committed" = 1 ] && [ -d "$BACKUP" ] && [ ! -e "$TARGET" ]; then
        mv "$BACKUP" "$TARGET" 2>/dev/null || true
      fi
      [ "$rc" -eq 0 ] && rm -rf "$BACKUP" 2>/dev/null || true
      rm -f "$SRC" 2>/dev/null || true
      exit "$rc"
    }
    trap cleanup EXIT
    [ -s "$SRC" ] || { echo 'PACKAGE_MISSING'; exit 1; }
    command -v unzip >/dev/null 2>&1 || { echo 'unzip 缺失'; exit 1; }
    unzip -t "$SRC" >/data/singbox_ebpf_zip_test.out 2>&1 || { cat /data/singbox_ebpf_zip_test.out; exit 1; }
    names=$(unzip -Z1 "$SRC" 2>/dev/null || true)
    printf '%s\\n' "$names" | grep -Eq '(^/|(^|/)\\.\\.(/|$))' && { echo '套件含非法路径'; exit 1; }
    mkdir -p "$STAGE"
    unzip -q "$SRC" -d "$STAGE"
    find "$STAGE" -type l 2>/dev/null | grep -q . && { echo '套件不允许符号链接'; exit 1; }
    [ -d "$STAGE/sing-box" ] && package_root="$STAGE/sing-box" || package_root="$STAGE"
    [ -f "$package_root/sing-box" ] || { echo '缺少 sing-box'; exit 1; }
    [ -s "$package_root/config.json" ] || { echo '缺少 config.json'; exit 1; }
    [ -d "$package_root/source" ] || { echo '缺少 source'; exit 1; }
    [ -d "$package_root/zashboard" ] || { echo '缺少 zashboard'; exit 1; }
    chmod 700 "$package_root/sing-box"
    "$package_root/sing-box" version 2>&1 | grep -q 'with_ebpf' || { echo '二进制不含 with_ebpf'; exit 1; }
    ${patchSharedInterface(interfaceName)}
    mkdir -p "$package_root/Scripts"
    cat > "$package_root/Scripts/SingBox.Service" <<'SINGBOX_SERVICE'
${serviceScript}
SINGBOX_SERVICE
    chmod 700 "$package_root/Scripts/SingBox.Service"
    (cd "$package_root" && "$package_root/sing-box" check -c "$package_root/config.json")
    if [ -x "$TARGET/Scripts/SingBox.Service" ]; then "$TARGET/Scripts/SingBox.Service" stop >/dev/null 2>&1 || true; fi
    if [ -e "$TARGET" ]; then mv "$TARGET" "$BACKUP"; fi
    mv "$package_root" "$TARGET"
    committed=1
    printf 'interface=%s\\n' ${shellQuote(normalizeInterface(interfaceName))} > "$TARGET/settings.conf"
    chmod 600 "$TARGET/settings.conf"
    echo "INSTALL_DONE:$TARGET"
  `, 120_000);

  const getStatus = async () => {
    const settings = await readSettings();
    const result = await runShell(`
      [ -x ${shellQuote(SERVICE)} ] && ${shellQuote(SERVICE)} status || echo 'NOT_INSTALLED'
      [ -x ${shellQuote(BINARY)} ] && ${shellQuote(BINARY)} version 2>&1 | head -n 7 || true
    `);
    return { settings, result };
  };

  const checkConfig = () => runShell(`[ -x ${shellQuote(SERVICE)} ] && ${shellQuote(SERVICE)} check 2>&1 || { echo 'NOT_INSTALLED'; exit 1; }`, 30_000);
  const startCore = () => runShell(`[ -x ${shellQuote(SERVICE)} ] && ${shellQuote(SERVICE)} start 2>&1 || { echo 'NOT_INSTALLED'; exit 1; }`, 35_000);
  const stopCore = () => runShell(`[ -x ${shellQuote(SERVICE)} ] && ${shellQuote(SERVICE)} stop 2>&1 || { echo 'NOT_INSTALLED'; exit 1; }`, 20_000);
  const runCapabilityProbe = (interfaceName) => runShell(`
    [ -x ${shellQuote(BINARY)} ] || { echo 'NOT_INSTALLED'; exit 1; }
    ${shellQuote(BINARY)} tools ebpf status --mode shared-network --interface ${shellQuote(normalizeInterface(interfaceName))} --json
  `, 35_000);
  const setBootEnabled = (enabled) => runShell(`
    set -eu
    boot=${shellQuote(BOOT_FILE)}
    begin=${shellQuote(BOOT_BEGIN)}
    end=${shellQuote(BOOT_END)}
    tmp="$boot.singbox_ebpf.$$"
    mkdir -p "$(dirname "$boot")"
    touch "$boot"
    awk -v begin="$begin" -v end="$end" '
      $0 == begin { skip=1; next }
      skip && $0 == end { skip=0; next }
      !skip { print }
    ' "$boot" > "$tmp"
    if [ ${shellQuote(enabled ? '1' : '0')} = 1 ]; then
      cat >> "$tmp" <<'SINGBOX_EBPF_BOOT'
${BOOT_BEGIN}
[ -x ${SERVICE} ] && (sleep 15; ${SERVICE} start >> ${LOG} 2>&1) &
${BOOT_END}
SINGBOX_EBPF_BOOT
    fi
    chmod 755 "$tmp"
    mv -f "$tmp" "$boot"
    echo ${shellQuote(enabled ? 'BOOT_ENABLED' : 'BOOT_DISABLED')}
  `, 20_000);

  const uploadPackage = async (file) => {
    if (!file || !/\.zip$/i.test(file.name || '')) throw new Error('只支持 singbox-ebpf.zip');
    if (typeof KANO_baseURL === 'undefined' || typeof common_headers === 'undefined') throw new Error('宿主上传接口不可用');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${KANO_baseURL}/upload_img`, { method: 'POST', headers: common_headers, body: formData });
    const result = await response.json();
    if (!result?.url) throw new Error(result?.error || '套件上传失败');
    return getUploadedPath(result.url);
  };

  const render = async ({ preserveOutput = false } = {}) => {
    const root = document.getElementById(ROOT_ELEMENT_ID);
    if (!root) return;
    const status = await getStatus();
    const lines = status.result.content.split(/\r?\n/).filter(Boolean);
    root.querySelector('#sbebpf_summary').innerHTML = `下游接口：<b>${escapeHtml(status.settings.interfaceName)}</b>　状态：<b>${escapeHtml(lines[0] || 'unknown')}</b>`;
    root.querySelector('#sbebpf_interface').value = status.settings.interfaceName;
    if (!preserveOutput) root.querySelector('#sbebpf_output').textContent = lines.slice(1).join('\n') || '未安装 eBPF 套件';
  };

  const withBusy = async (button, text, action) => {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = text;
    try { await action(); } finally { button.disabled = false; button.textContent = original; }
  };

  const initialize = async () => {
    let retries = 0;
    while (!document.querySelector('.functions-container') && retries < 100) { await wait(100); retries += 1; }
    const container = document.querySelector('.functions-container');
    if (!container) { toast('Sing-box eBPF：未找到 F50 插件容器', 'red', 7000); return; }
    document.getElementById(ROOT_ELEMENT_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ELEMENT_ID}{width:100%;margin-top:12px;color:#e5edf7;}#${ROOT_ELEMENT_ID} *{box-sizing:border-box;}
      #${ROOT_ELEMENT_ID} .sbebpf-title{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:8px 0;padding:8px 10px;border:1px solid rgba(34,197,94,.3);border-radius:13px;background:linear-gradient(135deg,rgba(6,78,59,.55),rgba(15,23,42,.55));}
      #${ROOT_ELEMENT_ID} .sbebpf-badge{font-size:.58rem;padding:3px 8px;border:1px solid rgba(110,231,183,.34);border-radius:999px;color:#a7f3d0;white-space:nowrap;}
      #${ROOT_ELEMENT_ID} .sbebpf-box{padding:10px;border:1px solid rgba(148,163,184,.2);border-radius:14px;background:rgba(15,23,42,.42);}
      #${ROOT_ELEMENT_ID} .sbebpf-summary{padding:8px 9px;border:1px solid rgba(110,231,183,.2);border-radius:10px;background:rgba(6,78,59,.18);font-size:.61rem;line-height:1.65;}
      #${ROOT_ELEMENT_ID} .sbebpf-form{display:grid;grid-template-columns:1fr auto;gap:7px;margin:9px 0;}
      #${ROOT_ELEMENT_ID} input,#${ROOT_ELEMENT_ID} button{min-height:32px;border:1px solid rgba(148,163,184,.28);border-radius:8px;background:#172033;color:#e5edf7;padding:6px 8px;font:inherit;font-size:.62rem;}
      #${ROOT_ELEMENT_ID} input:focus{outline:2px solid #34d399;outline-offset:1px;}#${ROOT_ELEMENT_ID} button{cursor:pointer;background:linear-gradient(180deg,#2563eb,#1e40af);}#${ROOT_ELEMENT_ID} button.sbebpf-muted{background:linear-gradient(180deg,#475569,#334155);}#${ROOT_ELEMENT_ID} button.sbebpf-danger{background:linear-gradient(180deg,#b91c1c,#7f1d1d);}#${ROOT_ELEMENT_ID} button:disabled{opacity:.55;cursor:wait;}
      #${ROOT_ELEMENT_ID} .sbebpf-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}#${ROOT_ELEMENT_ID} pre{white-space:pre-wrap;word-break:break-word;max-height:280px;overflow:auto;margin:9px 0 0;padding:8px;border-radius:10px;background:#020617;color:#cbd5e1;font-size:.58rem;line-height:1.55;}#${ROOT_ELEMENT_ID} .sbebpf-note{margin-top:8px;font-size:.58rem;line-height:1.55;color:#cbd5e1;}@media (max-width:720px){#${ROOT_ELEMENT_ID} .sbebpf-actions{grid-template-columns:repeat(2,minmax(0,1fr));}}
    `;
    document.head.appendChild(style);
    container.insertAdjacentHTML('afterend', `
      <section id="${ROOT_ELEMENT_ID}"><div class="title sbebpf-title"><strong>Sing-box eBPF</strong><span class="sbebpf-badge">独立套件</span></div><div class="sbebpf-box">
        <div id="sbebpf_summary" class="sbebpf-summary">读取状态中…</div>
        <div class="sbebpf-form"><input id="sbebpf_interface" maxlength="32" autocomplete="off" placeholder="下游接口，例如 br0"><button id="sbebpf_save" class="sbebpf-muted">保存接口</button></div>
        <input id="sbebpf_package" type="file" accept=".zip,application/zip" style="display:none">
        <div class="sbebpf-actions"><button id="sbebpf_import">导入 eBPF 套件</button><button id="sbebpf_check" class="sbebpf-muted">检查配置</button><button id="sbebpf_probe" class="sbebpf-muted">能力探测</button><button id="sbebpf_start">启动核心</button><button id="sbebpf_stop" class="sbebpf-danger">停止核心</button><button id="sbebpf_boot_on" class="sbebpf-muted">启用开机启动</button><button id="sbebpf_boot_off" class="sbebpf-muted">关闭开机启动</button></div>
        <pre id="sbebpf_output"></pre><div class="sbebpf-note">导入会安装独立目录并校验 eBPF 二进制与配置；只有点击“启动核心”才会加载 eBPF 和接管流量。</div>
      </div></section>
    `);
    const root = document.getElementById(ROOT_ELEMENT_ID);
    const output = root.querySelector('#sbebpf_output');
    const readInterface = () => normalizeInterface(root.querySelector('#sbebpf_interface').value);
    const saveInterface = async () => {
      const result = await writeSettings(readInterface());
      if (!result.success) throw new Error(result.content || '保存接口失败');
    };
    root.querySelector('#sbebpf_save').onclick = (event) => withBusy(event.currentTarget, '保存中…', async () => { await saveInterface(); await render(); toast('下游接口已保存', 'green'); });
    root.querySelector('#sbebpf_import').onclick = () => root.querySelector('#sbebpf_package').click();
    root.querySelector('#sbebpf_package').onchange = async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      const button = root.querySelector('#sbebpf_import');
      await withBusy(button, '导入中…', async () => {
        try {
          await saveInterface();
          const uploadedPath = await uploadPackage(file);
          const result = await installPackage(uploadedPath, readInterface());
          output.textContent = result.content || '';
          toast(result.success && result.content.includes('INSTALL_DONE') ? 'eBPF 套件安装完成，尚未启动' : 'eBPF 套件安装失败', result.success ? 'green' : 'red', 9000);
          await render({ preserveOutput: true });
        } catch (error) { toast(`导入失败<br>${escapeHtml(error.message || error)}`, 'red', 9000); }
      });
    };
    const bindAction = (selector, busyText, action, successText) => {
      root.querySelector(selector).onclick = (event) => withBusy(event.currentTarget, busyText, async () => {
        const result = await action();
        output.textContent = result.content || '';
        toast(result.success ? successText : `${successText}失败`, result.success ? 'green' : 'red', 8000);
        await render({ preserveOutput: true });
      });
    };
    bindAction('#sbebpf_check', '检查中…', checkConfig, '配置检查完成');
    bindAction('#sbebpf_probe', '探测中…', () => runCapabilityProbe(readInterface()), 'eBPF 能力探测完成');
    bindAction('#sbebpf_start', '启动中…', startCore, '核心启动完成');
    bindAction('#sbebpf_stop', '停止中…', stopCore, '核心已停止');
    bindAction('#sbebpf_boot_on', '设置中…', () => setBootEnabled(true), '开机启动已启用');
    bindAction('#sbebpf_boot_off', '设置中…', () => setBootEnabled(false), '开机启动已关闭');
    await render();
  };

  initialize().catch((error) => { console.error('Sing-box eBPF plugin initialization failed', error); toast('Sing-box eBPF 初始化失败', 'red', 7000); });
})(runShellWithRoot);
//</script>
