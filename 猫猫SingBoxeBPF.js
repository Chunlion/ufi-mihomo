//<script>
// 猫猫 Sing-box eBPF v0.1.0 - 独立能力探测与配置骨架
((hostRunShellWithRoot) => {
  const PLUGIN_ID = 'kano_singbox_ebpf';
  const ROOT = '/data/singbox_ebpf';
  const BINARY = `${ROOT}/sing-box`;
  const CONFIG = `${ROOT}/config.json`;
  const SETTINGS = `${ROOT}/settings.conf`;
  const LOG = `${ROOT}/sing-box.log`;
  const STATE = `${ROOT}/state.conf`;
  const ROOT_ELEMENT_ID = 'kano_singbox_ebpf_root';
  const STYLE_ID = 'kano_singbox_ebpf_style';

  const shellQuote = (value) => `'${String(value).replace(/'/g, "'\\''")}'`;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

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
      return {
        success: result?.success !== false,
        content: String(result?.content || ''),
      };
    } catch (error) {
      return { success: false, content: String(error?.message || error || 'Shell 调用失败') };
    }
  };

  const normalizeInterface = (value = '') => {
    const name = String(value).trim();
    return /^[A-Za-z0-9_.:-]{1,32}$/.test(name) ? name : 'br0';
  };

  const isHttpUrl = (value = '') => {
    try {
      const url = new URL(String(value).trim());
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const readSettings = async () => {
    const result = await runShell(`
      [ -f ${shellQuote(SETTINGS)} ] && cat ${shellQuote(SETTINGS)} || true
    `);
    const settings = { binaryUrl: '', interfaceName: 'br0' };
    String(result.content).split(/\r?\n/).forEach((line) => {
      const separator = line.indexOf('=');
      if (separator < 1) return;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (key === 'binary_url' && isHttpUrl(value)) settings.binaryUrl = value;
      if (key === 'interface' && /^[A-Za-z0-9_.:-]{1,32}$/.test(value)) settings.interfaceName = value;
    });
    return settings;
  };

  const writeSettings = async (settings) => runShell(`
    set -eu
    mkdir -p ${shellQuote(ROOT)}
    tmp=${shellQuote(SETTINGS)}.tmp.$$
    {
      printf '%s\\n' ${shellQuote(`binary_url=${settings.binaryUrl || ''}`)}
      printf '%s\\n' ${shellQuote(`interface=${normalizeInterface(settings.interfaceName)}`)}
    } > "$tmp"
    chmod 600 "$tmp"
    mv -f "$tmp" ${shellQuote(SETTINGS)}
  `);

  const getStatus = async () => {
    const settings = await readSettings();
    const result = await runShell(`
      binary=${shellQuote(BINARY)}
      config=${shellQuote(CONFIG)}
      state=${shellQuote(STATE)}
      printf 'binary='
      [ -x "$binary" ] && echo ready || echo missing
      printf 'config='
      [ -s "$config" ] && echo ready || echo missing
      printf 'running='
      pid=$(sed -n 's/^pid=//p' "$state" 2>/dev/null | head -n 1)
      case "$pid" in
        ''|*[!0-9]*) echo no ;;
        *) kill -0 "$pid" 2>/dev/null && echo yes || echo no ;;
      esac
      if [ -x "$binary" ]; then
        "$binary" version 2>&1 | head -n 7
      fi
    `);
    return { settings, result };
  };

  const createSampleConfig = (interfaceName) => JSON.stringify({
    log: { level: 'info', timestamp: true },
    inbounds: [{
      type: 'ebpf',
      tag: 'ebpf-shared',
      mode: 'shared',
      network: ['tcp', 'udp'],
      dns_mode: 'respect_bypass',
      shared: {
        interface: [normalizeInterface(interfaceName)],
        ipv6_mode: 'off',
        bypass_private_address: true,
      },
    }],
    outbounds: [{ type: 'direct', tag: 'direct' }],
    route: { final: 'direct' },
  }, null, 2) + '\n';

  const saveSampleConfig = async (interfaceName) => {
    const config = createSampleConfig(interfaceName);
    const result = await runShell(`
      set -eu
      mkdir -p ${shellQuote(ROOT)}
      tmp=${shellQuote(CONFIG)}.tmp.$$
      cat > "$tmp" <<'SING_BOX_EBPF_CONFIG'
${config}SING_BOX_EBPF_CONFIG
      chmod 600 "$tmp"
      mv -f "$tmp" ${shellQuote(CONFIG)}
    `);
    if (!result.success) return result;

    const validation = await runShell(`
      [ -x ${shellQuote(BINARY)} ] || { echo 'BINARY_MISSING'; exit 0; }
      ${shellQuote(BINARY)} check -c ${shellQuote(CONFIG)} 2>&1
    `);
    return { success: validation.success, content: validation.content || 'CONFIG_SAVED' };
  };

  const installBinary = async (url) => {
    if (!isHttpUrl(url)) return { success: false, content: '下载地址必须是 http 或 https URL' };
    return runShell(`
      set -eu
      mkdir -p ${shellQuote(ROOT)}
      command -v curl >/dev/null 2>&1 || { echo 'curl 缺失'; exit 1; }
      stage=${shellQuote(`${ROOT}/sing-box.download`)}.$$
      cleanup() { rm -f "$stage"; }
      trap cleanup EXIT
      curl -fL --connect-timeout 15 --max-time 300 ${shellQuote(url)} -o "$stage"
      size=$(wc -c < "$stage" 2>/dev/null || echo 0)
      case "$size" in ''|*[!0-9]*) size=0 ;; esac
      [ "$size" -ge 1048576 ] && [ "$size" -le 134217728 ] || { echo "下载文件大小异常: $size"; exit 1; }
      chmod 700 "$stage"
      "$stage" version 2>&1 | grep -q 'with_ebpf' || { echo '二进制未包含 with_ebpf 编译标签'; exit 1; }
      mv -f "$stage" ${shellQuote(BINARY)}
      printf 'installed_at=%s\\n' "$(date +%s 2>/dev/null || true)" > ${shellQuote(STATE)}
      ${shellQuote(BINARY)} version
    `, 330_000);
  };

  const runCapabilityProbe = async (interfaceName) => runShell(`
    set -eu
    [ -x ${shellQuote(BINARY)} ] || { echo 'BINARY_MISSING'; exit 1; }
    ${shellQuote(BINARY)} tools ebpf status --mode shared-network --interface ${shellQuote(normalizeInterface(interfaceName))} --json
  `, 30_000);

  const render = async ({ preserveOutput = false } = {}) => {
    const root = document.getElementById(ROOT_ELEMENT_ID);
    if (!root) return;
    const status = await getStatus();
    const lines = status.result.content.split(/\r?\n/).filter(Boolean);
    const binary = lines.find((line) => line.startsWith('binary='))?.slice(7) || 'unknown';
    const config = lines.find((line) => line.startsWith('config='))?.slice(7) || 'unknown';
    const running = lines.find((line) => line.startsWith('running='))?.slice(8) || 'unknown';
    root.querySelector('#sbebpf_summary').innerHTML = [
      `二进制：<b>${escapeHtml(binary)}</b>`,
      `配置：<b>${escapeHtml(config)}</b>`,
      `服务：<b>${escapeHtml(running)}</b>`,
      `下游接口：<b>${escapeHtml(status.settings.interfaceName)}</b>`,
    ].join('　');
    if (!preserveOutput) {
      root.querySelector('#sbebpf_version').textContent = lines.filter((line) => !/^(binary|config|running)=/.test(line)).join('\n') || '尚未安装 eBPF 版 sing-box';
    }
    root.querySelector('#sbebpf_url').value = status.settings.binaryUrl;
    root.querySelector('#sbebpf_interface').value = status.settings.interfaceName;
  };

  const withBusy = async (button, text, action) => {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = text;
    try {
      await action();
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  };

  const initialize = async () => {
    let retries = 0;
    while (!document.querySelector('.functions-container') && retries < 100) {
      await wait(100);
      retries += 1;
    }
    const container = document.querySelector('.functions-container');
    if (!container) {
      toast('Sing-box eBPF：未找到 F50 插件容器', 'red', 7000);
      return;
    }

    document.getElementById(ROOT_ELEMENT_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ELEMENT_ID}{width:100%;margin-top:12px;color:#e5edf7;}
      #${ROOT_ELEMENT_ID} *{box-sizing:border-box;}
      #${ROOT_ELEMENT_ID} .sbebpf-title{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:8px 0;padding:8px 10px;border:1px solid rgba(34,197,94,.3);border-radius:13px;background:linear-gradient(135deg,rgba(6,78,59,.55),rgba(15,23,42,.55));}
      #${ROOT_ELEMENT_ID} .sbebpf-badge{font-size:.58rem;padding:3px 8px;border:1px solid rgba(110,231,183,.34);border-radius:999px;color:#a7f3d0;white-space:nowrap;}
      #${ROOT_ELEMENT_ID} .sbebpf-box{padding:10px;border:1px solid rgba(148,163,184,.2);border-radius:14px;background:rgba(15,23,42,.42);}
      #${ROOT_ELEMENT_ID} .sbebpf-summary{padding:8px 9px;border:1px solid rgba(110,231,183,.2);border-radius:10px;background:rgba(6,78,59,.18);font-size:.61rem;line-height:1.65;}
      #${ROOT_ELEMENT_ID} .sbebpf-form{display:grid;grid-template-columns:1fr 150px auto;gap:7px;margin:9px 0;}
      #${ROOT_ELEMENT_ID} input,#${ROOT_ELEMENT_ID} button{min-height:32px;border:1px solid rgba(148,163,184,.28);border-radius:8px;background:#172033;color:#e5edf7;padding:6px 8px;font:inherit;font-size:.62rem;}
      #${ROOT_ELEMENT_ID} input:focus{outline:2px solid #34d399;outline-offset:1px;}
      #${ROOT_ELEMENT_ID} button{cursor:pointer;background:linear-gradient(180deg,#2563eb,#1e40af);}
      #${ROOT_ELEMENT_ID} button.sbebpf-muted{background:linear-gradient(180deg,#475569,#334155);}
      #${ROOT_ELEMENT_ID} button:disabled{opacity:.55;cursor:wait;}
      #${ROOT_ELEMENT_ID} .sbebpf-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}
      #${ROOT_ELEMENT_ID} pre{white-space:pre-wrap;word-break:break-word;max-height:270px;overflow:auto;margin:9px 0 0;padding:8px;border-radius:10px;background:#020617;color:#cbd5e1;font-size:.58rem;line-height:1.55;}
      #${ROOT_ELEMENT_ID} .sbebpf-note{margin-top:8px;font-size:.58rem;line-height:1.55;color:#cbd5e1;}
      @media (max-width:720px){#${ROOT_ELEMENT_ID} .sbebpf-form{grid-template-columns:1fr;}#${ROOT_ELEMENT_ID} .sbebpf-actions{grid-template-columns:repeat(2,minmax(0,1fr));}}
    `;
    document.head.appendChild(style);

    container.insertAdjacentHTML('afterend', `
      <section id="${ROOT_ELEMENT_ID}">
        <div class="title sbebpf-title"><strong>Sing-box eBPF</strong><span class="sbebpf-badge">独立测试骨架</span></div>
        <div class="sbebpf-box">
          <div id="sbebpf_summary" class="sbebpf-summary">读取状态中…</div>
          <div class="sbebpf-form">
            <input id="sbebpf_url" type="url" autocomplete="off" placeholder="eBPF 版 sing-box 二进制下载地址">
            <input id="sbebpf_interface" maxlength="32" autocomplete="off" placeholder="下游接口，例如 br0">
            <button id="sbebpf_save" class="sbebpf-muted">保存设置</button>
          </div>
          <div class="sbebpf-actions">
            <button id="sbebpf_install">下载二进制</button>
            <button id="sbebpf_probe">运行 eBPF 探测</button>
            <button id="sbebpf_config" class="sbebpf-muted">生成示例配置</button>
            <button id="sbebpf_refresh" class="sbebpf-muted">刷新状态</button>
          </div>
          <pre id="sbebpf_version"></pre>
          <div class="sbebpf-note">此版本只负责下载、能力探测和示例配置；不会自动启动核心、加载 eBPF、修改路由或接管流量。</div>
        </div>
      </section>
    `);

    const root = document.getElementById(ROOT_ELEMENT_ID);
    const output = root.querySelector('#sbebpf_version');
    const readForm = () => ({
      binaryUrl: root.querySelector('#sbebpf_url').value.trim(),
      interfaceName: normalizeInterface(root.querySelector('#sbebpf_interface').value),
    });
    const save = async () => {
      const result = await writeSettings(readForm());
      if (!result.success) throw new Error(result.content || '保存设置失败');
    };

    root.querySelector('#sbebpf_save').onclick = async (event) => withBusy(event.currentTarget, '保存中…', async () => {
      try {
        await save();
        toast('eBPF 设置已保存', 'green');
        await render();
      } catch (error) {
        toast(`保存失败<br>${escapeHtml(error.message)}`, 'red', 8000);
      }
    });
    root.querySelector('#sbebpf_install').onclick = async (event) => withBusy(event.currentTarget, '下载中…', async () => {
      const settings = readForm();
      if (!isHttpUrl(settings.binaryUrl)) {
        toast('请先填写 eBPF 版 sing-box 的下载地址', 'yellow');
        return;
      }
      await save();
      const result = await installBinary(settings.binaryUrl);
      output.textContent = result.content || '';
      toast(result.success ? 'eBPF 二进制已安装' : '下载或验证失败', result.success ? 'green' : 'red', 8000);
      await render({ preserveOutput: true });
    });
    root.querySelector('#sbebpf_probe').onclick = async (event) => withBusy(event.currentTarget, '探测中…', async () => {
      const settings = readForm();
      await save();
      const result = await runCapabilityProbe(settings.interfaceName);
      output.textContent = result.content || '';
      toast(result.success && /"result"\s*:\s*"supported"/.test(result.content) ? 'eBPF 共享路径可用' : 'eBPF 探测未通过', result.success ? 'green' : 'red', 8000);
      await render({ preserveOutput: true });
    });
    root.querySelector('#sbebpf_config').onclick = async (event) => withBusy(event.currentTarget, '生成中…', async () => {
      const settings = readForm();
      await save();
      const result = await saveSampleConfig(settings.interfaceName);
      output.textContent = result.content || '';
      toast(result.success ? '示例配置已生成，尚未启动核心' : '配置生成或检查失败', result.success ? 'green' : 'red', 8000);
      await render({ preserveOutput: true });
    });
    root.querySelector('#sbebpf_refresh').onclick = () => render().catch((error) => {
      toast(`状态读取失败<br>${escapeHtml(error.message)}`, 'red', 8000);
    });
    await render();
  };

  initialize().catch((error) => {
    console.error('Sing-box eBPF plugin initialization failed', error);
    toast('Sing-box eBPF 初始化失败', 'red', 7000);
  });
})(runShellWithRoot);
//</script>
