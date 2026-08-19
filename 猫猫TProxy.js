//<script>
// 猫猫TProxy v7.4.3 FINAL - unified Go-first runtime with automatic Shell fallback
((hostRunShellWithRoot) => {
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
  const LOG_FILE = '/sdcard/Clash\u5185\u6838\u65e5\u5fd7.txt';
  const DOWNLOAD_ZIP = '/data/kano_clash.zip';
  const DOWNLOAD_LOG = '/data/kano_mihomo_latest.dlog';
  const CLASH_PACKAGE_URL = 'https://pan.kanokano.cn/d/UFI-TOOLS-UPDATE/plugins/mihomo-tproxy.zip';
  const CLASH_PACKAGE_FALLBACK_URL = 'https://gitee.com/womye/123/releases/download/v1/tproxy-yq.zip';
  const ZASHBOARD_UI_DIR = 'WebUI/zashboard';
  const ZASHBOARD_UI_URL = 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip';
  // tproxy-yq.zip is intentionally updateable. Do not pin package size/hash/core hash in the plugin.
  // Installation only requires a readable ZIP with the expected base layout; deeper features fail locally if incompatible.
  const DOWNLOAD_SOURCE_FILE = '/data/kano_clash.source';
  // Official yq is a lazy fallback for advanced YAML features only.
  // It is never required for basic Mihomo install/start.
  const YQ_OFFICIAL_ARM64_URL =
    'https://github.com/mikefarah/yq/releases/download/v4.53.3/yq_linux_arm64';
  const CLASH_RUNTIME_MANAGER = `${CLASH_DIR}/Scripts/Clash.KanoStart`;
  const CLASH_RUNTIME_MANAGER_VERSION = '1.0.5';
  const CLASH_SERVICE_WRAPPER_VERSION = '1.0.1';
  const BOOT_MANAGER_PATH = '/data/f50_boot_fix/boot_manager.sh';
  const BOOT_GATE_START = '# F50_BOOT_FIX_BEGIN';
  const BOOT_GATE_END = '# F50_BOOT_FIX_END';
  const BOOT_CLEANUP_LINE = `[ -x ${CLASH_POLICY_SCRIPT} ] && ${CLASH_POLICY_SCRIPT} flush >/dev/null 2>&1 || true`;
  // UFI-TOOLS 原生 samba_exec.sh 会在开机窗口直接执行: sh /sdcard/ufi_tools_boot.sh
  // 因此基础自启保持 1.3 已验证语义，不再要求 Clash.KanoStart / boot manager 作为必经路径。
  const BOOT_SERVICE_LINE = `${CLASH_SERVICE} start`;
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
  const LOCAL_SUBSCRIPTION_MAX_FILE_BYTES = 8 * 1024 * 1024;
  const LOCAL_SUBSCRIPTION_TOTAL_BYTES = 32 * 1024 * 1024;
  const KANO_PROVIDER_USER_AGENT = 'clash.meta';
  const POLICY_SCRIPT_VERSION = '6.4';
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
  const runShellWithRoot = (script = '', timeout) =>
    hostRunShellWithRoot.call(
      globalThis,
      `if [ -d '${KANO_INSTALL_TOOLBOX_BIN}' ]; then export PATH='${KANO_INSTALL_TOOLBOX_BIN}':"$PATH"; fi
${script}`,
      timeout,
    );

  const shellQuote = (value) =>
    "'" + String(value).replace(/'/g, "'\\''") + "'";

  const appendTemplateFlowDebug = async (message = '') => {
    try {
      await runShellWithRoot(`
        mkdir -p /data
        {
          printf '%s ' "$(date +%Y-%m-%dT%H:%M:%S%z 2>/dev/null || cat /proc/uptime 2>/dev/null | cut -d. -f1)"
          printf '%s\n' ${shellQuote(sanitizeSubscriptionSecrets(String(message || '')).replace(/[\r\n]+/g, ' '))}
        } >> ${shellQuote(KANO_TEMPLATE_FLOW_DEBUG)}
      `, 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const runDangerousShellWithRoot = async (script = '', timeout = 20 * 1000, label = 'dangerous') => {
    await appendTemplateFlowDebug(`dangerous_shell ${label}`);
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

  const parseInstallToolboxResult = (result = {}) => {
    const content = String(result.content || '');
    const marker = (name) => {
      const prefix = `${name}=`;
      const line = content.split(/\r?\n/).find((item) => item.startsWith(prefix));
      return line ? line.slice(prefix.length).trim().split(/\s+/).filter(Boolean) : [];
    };
    return {
      success: !!result.success && /(?:^|\n)TOOLBOX_READY(?:\r?\n|$)/.test(content),
      added: marker('TOOLBOX_ADDED'),
      missing: marker('TOOLBOX_MISSING'),
      optionalMissing: marker('TOOLBOX_OPTIONAL_MISSING'),
      content,
    };
  };

  const ensureInstallToolbox = async () => {
    const result = await runShellWithRoot(`
      set +e
      TOOLBOX_DIR=${shellQuote(KANO_INSTALL_TOOLBOX_DIR)}
      TOOLBOX_BIN=${shellQuote(KANO_INSTALL_TOOLBOX_BIN)}
      F50_FILES=${shellQuote(F50_FILES_DIR)}
      BASE_PATH="$PATH"
      case "$BASE_PATH" in
        "$TOOLBOX_BIN":*) BASE_PATH="\${BASE_PATH#*:}" ;;
      esac
      export PATH="$BASE_PATH"
      mkdir -p "$TOOLBOX_BIN" || {
        echo "TOOLBOX_MISSING=toolbox-directory"
        exit 1
      }
      chmod 755 "$TOOLBOX_DIR" "$TOOLBOX_BIN" 2>/dev/null || {
        echo "TOOLBOX_MISSING=toolbox-permission"
        exit 1
      }

      added=""
      missing=""
      optional_missing=""

      write_direct_wrapper() {
        tool="$1"
        source="$2"
        target="$TOOLBOX_BIN/$tool"
        printf '#!/system/bin/sh\\nexec "%s" "$@"\\n' "$source" > "$target" || return 1
        chmod 755 "$target" || return 1
        return 0
      }

      write_applet_wrapper() {
        tool="$1"
        source="$2"
        target="$TOOLBOX_BIN/$tool"
        printf '#!/system/bin/sh\\nexec "%s" "%s" "$@"\\n' "$source" "$tool" > "$target" || return 1
        chmod 755 "$target" || return 1
        return 0
      }

      ensure_tool() {
        tool="$1"
        rm -f "$TOOLBOX_BIN/$tool" 2>/dev/null || return 1
        native="$( (PATH="$BASE_PATH"; command -v "$tool") 2>/dev/null )"
        if [ -n "$native" ] && [ -x "$native" ]; then
          "$native" --help >/dev/null 2>&1
          native_rc=$?
          case "$native_rc" in 126|127) ;; *) return 0 ;; esac
        fi

        direct="$F50_FILES/$tool"
        if [ -x "$direct" ]; then
          "$direct" --help >/dev/null 2>&1
          direct_rc=$?
          case "$direct_rc" in
            126|127) ;;
            *)
              write_direct_wrapper "$tool" "$direct" || return 1
              added="$added $tool"
              return 0
              ;;
          esac
        fi

        path_busybox="$( (PATH="$BASE_PATH"; command -v busybox) 2>/dev/null )"
        path_toybox="$( (PATH="$BASE_PATH"; command -v toybox) 2>/dev/null )"
        for multicall in \
          "$F50_FILES/busybox" "$F50_FILES/toybox" \
          /system/bin/toybox /system/bin/busybox /system/xbin/busybox \
          /vendor/bin/toybox /vendor/bin/busybox \
          "$path_busybox" "$path_toybox"; do
          [ -n "$multicall" ] && [ -x "$multicall" ] || continue
          "$multicall" "$tool" --help >/dev/null 2>&1
          applet_rc=$?
          case "$applet_rc" in 126|127) continue ;; esac
          write_applet_wrapper "$tool" "$multicall" || return 1
          added="$added $tool"
          return 0
        done
        return 1
      }

      for tool in curl unzip timeout awk sed grep find du wc head tail tr chmod cp mv rm mkdir ln date cat cut basename dirname readlink od sort uniq xargs stat cmp ip inotifyd; do
        ensure_tool "$tool" || missing="$missing $tool"
      done
      for tool in tar gzip zip sha256sum md5sum cksum jq ss netstat; do
        ensure_tool "$tool" || optional_missing="$optional_missing $tool"
      done

      firewall=""
      for candidate in \
        "$( (PATH="$BASE_PATH"; command -v iptables) 2>/dev/null )" \
        "$( (PATH="$BASE_PATH"; command -v iptables-nft) 2>/dev/null )" \
        "$( (PATH="$BASE_PATH"; command -v iptables-legacy) 2>/dev/null )" \
        /system/bin/iptables /system/bin/iptables-nft /system/bin/iptables-legacy; do
        if [ -n "$candidate" ] && [ -x "$candidate" ]; then
          firewall="$candidate"
          break
        fi
      done
      [ -n "$firewall" ] || missing="$missing iptables"

      echo "TOOLBOX_ADDED=$added"
      echo "TOOLBOX_MISSING=$missing"
      echo "TOOLBOX_OPTIONAL_MISSING=$optional_missing"
      if [ -n "$missing" ]; then
        exit 1
      fi
      export PATH="$TOOLBOX_BIN:$BASE_PATH"
      echo "TOOLBOX_READY"
    `, 30 * 1000);
    return parseInstallToolboxResult(result);
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


  const removeBootLinesCmd = () => `
        if [ -f ${shellQuote(BOOT_FILE)} ]; then
          BOOT_TMP=${shellQuote(`${BOOT_FILE}.kano`)}.$$
          awk \
            -v cleanup=${shellQuote(BOOT_CLEANUP_LINE)} \
            -v runtime=${shellQuote(LEGACY_BOOT_SERVICE_LINE)} \
            -v service=${shellQuote(BOOT_SERVICE_LINE)} \
            -v legacy_wrapper=${shellQuote(LEGACY_BOOT_FIX_WRAPPER_LINE)} \
            -v legacy_inotify=${shellQuote(LEGACY_BOOT_INOTIFY_LINE)} \
            -v inotify=${shellQuote(BOOT_INOTIFY_LINE)} \
            -v legacy_policy=${shellQuote(LEGACY_BOOT_POLICY_TOOLS_LINE)} \
            -v policy=${shellQuote(BOOT_POLICY_TOOLS_LINE)} \
            -v mac=${shellQuote(LEGACY_BOOT_MAC_BYPASS_LINE)} \
            '$0 != cleanup && $0 != runtime && $0 != service && $0 != legacy_wrapper && $0 != legacy_inotify && $0 != inotify && $0 != legacy_policy && $0 != policy && $0 != mac { print }' \
            ${shellQuote(BOOT_FILE)} > "$BOOT_TMP" &&
            mv "$BOOT_TMP" ${shellQuote(BOOT_FILE)}
          BOOT_RC=$?
          rm -f "$BOOT_TMP" 2>/dev/null || true
          [ "$BOOT_RC" -eq 0 ] || exit "$BOOT_RC"
        fi
        `;

  // 策略脚本仍保留为高级功能，但不再成为基础开机自启的必需项。
  const addPolicyToolsBootLineCmd = () => `
        touch ${shellQuote(BOOT_FILE)}
        BOOT_TMP=${shellQuote(`${BOOT_FILE}.kano_policy`)}.$$
        awk -v legacy_policy=${shellQuote(LEGACY_BOOT_POLICY_TOOLS_LINE)} '$0 != legacy_policy { print }' ${shellQuote(BOOT_FILE)} > "$BOOT_TMP" &&
          mv "$BOOT_TMP" ${shellQuote(BOOT_FILE)}
        BOOT_RC=$?
        rm -f "$BOOT_TMP" 2>/dev/null || true
        [ "$BOOT_RC" -eq 0 ] || exit "$BOOT_RC"
        grep -qxF ${shellQuote(BOOT_POLICY_TOOLS_LINE)} ${shellQuote(BOOT_FILE)} || echo ${shellQuote(BOOT_POLICY_TOOLS_LINE)} >> ${shellQuote(BOOT_FILE)}
        `;

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
            count=$((count + 1))
            [ "$count" -le "$max_keep" ] || rm -f "$stale" 2>/dev/null || true
          done
        }
        prune_kano_backup_series ${shellQuote(CLASH_CONFIG)} ${shellQuote(String(keep))}
        prune_kano_backup_series ${shellQuote(CLASH_TEMPLATE)} ${shellQuote(String(keep))}
        prune_kano_backup_series ${shellQuote(CLASH_TEMPLATE_BASE)} ${shellQuote(String(keep))}
        `;

  const addBootLinesCmd = () => `
        ${removeBootLinesCmd()}
        touch ${shellQuote(BOOT_FILE)}
        chmod 755 ${shellQuote(CLASH_SERVICE)} 2>/dev/null || true
        mkdir -p ${shellQuote(CLASH_INOTIFY_DIR)} 2>/dev/null || true
        grep -qxF ${shellQuote(BOOT_SERVICE_LINE)} ${shellQuote(BOOT_FILE)} || echo ${shellQuote(BOOT_SERVICE_LINE)} >> ${shellQuote(BOOT_FILE)}
        grep -qxF ${shellQuote(BOOT_INOTIFY_LINE)} ${shellQuote(BOOT_FILE)} || echo ${shellQuote(BOOT_INOTIFY_LINE)} >> ${shellQuote(BOOT_FILE)}
        grep -qxF ${shellQuote(BOOT_POLICY_TOOLS_LINE)} ${shellQuote(BOOT_FILE)} || echo ${shellQuote(BOOT_POLICY_TOOLS_LINE)} >> ${shellQuote(BOOT_FILE)}
        `;

  const buildRuntimeManagerScript = () => `#!/system/bin/sh
# KANO_RUNTIME_MANAGER_VERSION=${CLASH_RUNTIME_MANAGER_VERSION}
set +e
CLASH_DIR=${CLASH_DIR}
SERVICE=${CLASH_SERVICE}
CORE=${CLASH_CORE}
CONFIG=${CLASH_CONFIG}
YQ=${CLASH_DIR}/Tools/yq_linux_arm64
POLICY=${CLASH_POLICY_SCRIPT}
RECOVERY_ARCHIVE=${DOWNLOAD_ZIP}
TOOLBOX_BIN=${KANO_INSTALL_TOOLBOX_BIN}
DIAG=/data/kano_diag_runtime
TMPDIR="$DIAG/tmp"
HOME="$DIAG/home"
[ ! -d "$TOOLBOX_BIN" ] || PATH="$TOOLBOX_BIN:$PATH"
export PATH TMPDIR TMP="$TMPDIR" TEMP="$TMPDIR" HOME XDG_CONFIG_HOME="$HOME"
mkdir -p "$TMPDIR" "$HOME" 2>/dev/null || {
  echo "PREFLIGHT_STATE=damaged"
  echo "PROBE_ERRORS=runtime_directory"
  echo "MESSAGE=无法创建 /data 诊断运行目录"
  exit 2
}
chmod 700 "$DIAG" "$TMPDIR" "$HOME" 2>/dev/null || true

append_word() {
  current="$(eval "printf '%s' \\"\\$$1\\"")"
  if [ -n "$current" ]; then
    eval "$1=\\"$current,$2\\""
  else
    eval "$1=\\"$2\\""
  fi
}

detect_abi() {
  ABI="$(getprop ro.product.cpu.abi 2>/dev/null | head -n 1 | tr '[:upper:]' '[:lower:]')"
  ABILIST="$(getprop ro.product.cpu.abilist 2>/dev/null | head -n 1 | tr '[:upper:]' '[:lower:]')"
  MACHINE="$(uname -m 2>/dev/null | tr '[:upper:]' '[:lower:]')"
  case "$ABI $ABILIST $MACHINE" in
    *arm64-v8a*|*aarch64*|*armv8*) ABI_KIND=arm64; CONTROLLER="$CLASH_DIR/Scripts/clashctl_arm64"; ARCHIVE_CONTROLLER="Scripts/clashctl_arm64"; ELF_CLASS=2; ELF_MACHINE=183 ;;
    *armeabi-v7a*|*armeabi*|*armv7*|*armv6*) ABI_KIND=armv7; CONTROLLER="$CLASH_DIR/Scripts/clashctl_armv7"; ARCHIVE_CONTROLLER="Scripts/clashctl_armv7"; ELF_CLASS=1; ELF_MACHINE=40 ;;
    *) ABI_KIND=unsupported; CONTROLLER=""; ARCHIVE_CONTROLLER=""; ELF_CLASS=0; ELF_MACHINE=0 ;;
  esac
}

verify_elf() {
  target="$1"
  expected_class="$2"
  expected_machine="$3"
  [ -s "$target" ] || return 1
  command -v od >/dev/null 2>&1 || return 2
  magic="$(od -An -t x1 -N 4 "$target" 2>/dev/null | tr -d ' \\n')"
  [ "$magic" = "7f454c46" ] || return 1
  class="$(od -An -t u1 -j 4 -N 1 "$target" 2>/dev/null | tr -d ' ')"
  machine="$(od -An -t u1 -j 18 -N 2 "$target" 2>/dev/null | awk '{print $1 + ($2 * 256)}')"
  [ "$class" = "$expected_class" ] && [ "$machine" = "$expected_machine" ]
}

repair_controller_from_archive() {
  [ -n "$CONTROLLER" ] && [ -n "$ARCHIVE_CONTROLLER" ] && [ -s "$RECOVERY_ARCHIVE" ] || return 1
  UNZIP=""
  for candidate in /data/kano_tproxy_tools/bin/unzip "$(command -v unzip 2>/dev/null)"; do
    [ -n "$candidate" ] && [ -x "$candidate" ] || continue
    UNZIP="$candidate"
    break
  done
  [ -n "$UNZIP" ] || return 1
  "$UNZIP" -t "$RECOVERY_ARCHIVE" >/dev/null 2>&1 || return 1
  NEW_CONTROLLER="$CONTROLLER.kano_new.$$"
  rm -f "$NEW_CONTROLLER" 2>/dev/null || true
  "$UNZIP" -p "$RECOVERY_ARCHIVE" "$ARCHIVE_CONTROLLER" > "$NEW_CONTROLLER" 2>/dev/null || {
    rm -f "$NEW_CONTROLLER" 2>/dev/null || true
    return 1
  }
  verify_elf "$NEW_CONTROLLER" "$ELF_CLASS" "$ELF_MACHINE" || {
    rm -f "$NEW_CONTROLLER" 2>/dev/null || true
    return 1
  }
  chmod 755 "$NEW_CONTROLLER" 2>/dev/null || {
    rm -f "$NEW_CONTROLLER" 2>/dev/null || true
    return 1
  }
  archive_probe="$("$NEW_CONTROLLER" --help 2>&1)"
  archive_rc=$?
  case "$archive_rc:$archive_probe" in
    126:*|127:*|*:*Exec\\ format*|*:*not\\ found*)
      rm -f "$NEW_CONTROLLER" 2>/dev/null || true
      return 1
      ;;
  esac
  mv -f "$NEW_CONTROLLER" "$CONTROLLER" 2>/dev/null || {
    rm -f "$NEW_CONTROLLER" 2>/dev/null || true
    return 1
  }
  chmod 755 "$CONTROLLER" 2>/dev/null || true
  return 0
}

remove_missing_label() {
  missing_label="$1"
  MISSING="$(printf '%s' "$MISSING" | awk -F, -v label="$missing_label" '{
    out=""
    for (i=1; i<=NF; i++) if ($i != label && $i !~ ("^" label ":")) out=(out ? out "," : "") $i
    print out
  }')"
}

find_core_pid() {
  for p in /proc/[0-9]*; do
    [ -r "$p/cmdline" ] || continue
    PID="\${p##*/}"
    exe="$(readlink "$p/exe" 2>/dev/null)"
    cmdline="$(tr '\\0' ' ' < "$p/cmdline" 2>/dev/null)"
    comm="$(cat "$p/comm" 2>/dev/null | tr -d '\\r\\n')"
    case " $cmdline " in *" -t "*|*" --test "*) continue ;; esac
    case "$exe|$cmdline|$comm" in
      *"$CORE"*|*"/Clash.Core"*|*"/mihomo"*|*"|Clash.Core"|*"|mihomo") ;;
      *) continue ;;
    esac
    printf '%s\\n' "$PID"
    return 0
  done
  return 1
}

validate_core_config() {
  CONFIG_TEST_LOG="$DIAG/config_test.out"
  [ -x "$CORE" ] || { echo "CONFIG_TEST_STATE=core_unavailable"; return 6; }
  [ -s "$CONFIG" ] || { echo "CONFIG_TEST_STATE=config_missing"; return 6; }
  if command -v timeout >/dev/null 2>&1; then
    (cd "$(dirname "$CONFIG")" && timeout 60 "$CORE" -t -f "$CONFIG") >"$CONFIG_TEST_LOG" 2>&1
  else
    (cd "$(dirname "$CONFIG")" && "$CORE" -t -f "$CONFIG") >"$CONFIG_TEST_LOG" 2>&1
  fi
  config_test_rc=$?
  if [ "$config_test_rc" -ne 0 ]; then
    echo "CONFIG_TEST_STATE=invalid"
    echo "CONFIG_TEST_RC=$config_test_rc"
    tail -n 160 "$CONFIG_TEST_LOG" 2>/dev/null || true
    return 6
  fi
  echo "CONFIG_TEST_STATE=valid"
  return 0
}

emit_preflight() {
  echo "PREFLIGHT_STATE=$STATE"
  echo "ABI=$ABI_KIND"
  echo "CONTROLLER=$CONTROLLER"
  echo "MISSING=$MISSING"
  echo "PERMISSION_ERRORS=$PERMISSION_ERRORS"
  echo "PROBE_ERRORS=$PROBE_ERRORS"
  echo "CONFIG_VALID=$CONFIG_VALID"
  echo "REPAIRABLE=$REPAIRABLE"
  echo "REPAIRED=$REPAIRED"
  echo "CORE_PID=$(find_core_pid)"
  echo "MESSAGE=$MESSAGE"
}

preflight() {
  STATE=installed_stopped
  MISSING=""
  PERMISSION_ERRORS=""
  PROBE_ERRORS=""
  CONFIG_VALID=0
  REPAIRABLE=0
  REPAIRED=""
  MESSAGE="运行组件和配置检查通过"
  detect_abi
  if [ ! -d "$CLASH_DIR" ]; then
    STATE=not_installed
    MESSAGE="未找到安装目录"
    emit_preflight
    return 3
  fi
  if [ "$ABI_KIND" = "unsupported" ]; then
    STATE=damaged
    REPAIRABLE=0
    PROBE_ERRORS=unsupported_abi
    MESSAGE="不支持的 CPU ABI"
    emit_preflight
    return 2
  fi
  for item in "service:$SERVICE" "core:$CORE" "yq:$YQ" "controller:$CONTROLLER" "config:$CONFIG"; do
    label="$item"
    path="$item"
    label="$(printf '%s' "$label" | cut -d: -f1)"
    path="$(printf '%s' "$path" | cut -d: -f2-)"
    if [ -L "$path" ] && [ ! -e "$path" ]; then
      append_word MISSING "$label:broken_link"
    elif [ ! -s "$path" ]; then
      append_word MISSING "$label"
    fi
  done

  GENERIC="$CLASH_DIR/Scripts/clashctl"
  if [ ! -s "$CONTROLLER" ] && [ -s "$GENERIC" ] && [ ! -L "$GENERIC" ]; then
    verify_elf "$GENERIC" "$ELF_CLASS" "$ELF_MACHINE"
    elf_rc=$?
    if [ "$elf_rc" -eq 0 ]; then
      chmod 755 "$GENERIC" 2>/dev/null || true
      generic_probe="$("$GENERIC" --help 2>&1)"
      generic_rc=$?
      case "$generic_rc:$generic_probe" in
        126:*|127:*|*:*Exec\\ format*|*:*not\\ found*) ;;
        *)
          cp "$GENERIC" "$CONTROLLER" 2>/dev/null &&
            chmod 755 "$CONTROLLER" 2>/dev/null &&
            append_word REPAIRED controller_from_validated_generic
          if [ -n "$CONTROLLER" ] && [ -s "$CONTROLLER" ]; then
            remove_missing_label controller
          fi
          ;;
      esac
    fi
  fi

  if [ ! -s "$CONTROLLER" ] && repair_controller_from_archive; then
    append_word REPAIRED controller_from_cached_archive
    remove_missing_label controller
  fi

  if [ -s "$CONTROLLER" ]; then
    verify_elf "$CONTROLLER" "$ELF_CLASS" "$ELF_MACHINE"
    elf_rc=$?
    if [ "$elf_rc" -eq 1 ]; then
      if [ -s "$GENERIC" ] && [ ! -L "$GENERIC" ]; then
        verify_elf "$GENERIC" "$ELF_CLASS" "$ELF_MACHINE"
        generic_elf_rc=$?
        generic_probe="$("$GENERIC" --help 2>&1)"
        generic_rc=$?
        case "$generic_elf_rc:$generic_rc:$generic_probe" in
          0:126:*|0:127:*|0:*:*Exec\\ format*|0:*:*not\\ found*) ;;
          0:*)
            cp "$GENERIC" "$CONTROLLER" 2>/dev/null &&
              chmod 755 "$CONTROLLER" 2>/dev/null &&
              append_word REPAIRED controller_replaced_from_validated_generic
            ;;
          *) ;;
        esac
      fi
      if ! verify_elf "$CONTROLLER" "$ELF_CLASS" "$ELF_MACHINE"; then
        if repair_controller_from_archive; then
          append_word REPAIRED controller_replaced_from_cached_archive
        else
          append_word PROBE_ERRORS controller_architecture
        fi
      fi
    elif [ "$elf_rc" -eq 2 ]; then
      append_word PROBE_ERRORS elf_reader_unavailable
    fi
  fi

  for item in "service:$SERVICE" "core:$CORE" "yq:$YQ" "controller:$CONTROLLER"; do
    label="$(printf '%s' "$item" | cut -d: -f1)"
    path="$(printf '%s' "$item" | cut -d: -f2-)"
    [ -s "$path" ] || continue
    if [ ! -x "$path" ]; then
      chmod 755 "$path" 2>/dev/null
      if [ -x "$path" ]; then
        append_word REPAIRED "$label:chmod"
      else
        append_word PERMISSION_ERRORS "$label"
      fi
    fi
  done

  if [ -x "$CONTROLLER" ] && ! printf '%s' "$PROBE_ERRORS" | grep -q controller_architecture; then
    controller_probe="$("$CONTROLLER" --help 2>&1)"
    controller_rc=$?
    case "$controller_rc:$controller_probe" in
      126:*|127:*|*:*Exec\\ format*|*:*not\\ found*) append_word PROBE_ERRORS controller_execute ;;
    esac
  fi
  if [ -x "$SERVICE" ]; then
    service_probe="$("$SERVICE" --help 2>&1)"
    service_rc=$?
    case "$service_rc:$service_probe" in
      126:*|127:*|*:*找不到适用于当前架构*|*:*Exec\\ format*) append_word PROBE_ERRORS service_controller ;;
    esac
  fi
  # FINAL relaxed mode: page/runtime preflight never executes Core/yq as a hard validator.
  # Presence and actual runtime/API behavior decide health; advanced features report their own errors locally.
  [ -s "$CONFIG" ] && CONFIG_VALID=1

  if [ -n "$MISSING" ] || [ -n "$PERMISSION_ERRORS" ] || [ -n "$PROBE_ERRORS" ] || [ "$CONFIG_VALID" != "1" ]; then
    STATE=damaged
    REPAIRABLE=1
    MESSAGE="运行组件或配置损坏，需要安全修复"
    emit_preflight
    return 2
  fi

  if [ -e "$GENERIC" ] || [ -L "$GENERIC" ]; then
    generic_target="$(readlink "$GENERIC" 2>/dev/null)"
    if [ -n "$generic_target" ] && [ "$generic_target" != "$(basename "$CONTROLLER")" ]; then
      rm -f "$GENERIC" 2>/dev/null || true
    fi
  fi
  if [ ! -e "$GENERIC" ]; then
    ln -s "$(basename "$CONTROLLER")" "$GENERIC" 2>/dev/null ||
      { cp "$CONTROLLER" "$GENERIC" 2>/dev/null && chmod 755 "$GENERIC" 2>/dev/null; }
    [ -e "$GENERIC" ] && append_word REPAIRED generic_controller
  fi
  pid="$(find_core_pid)"
  [ -z "$pid" ] || STATE=running_api_unavailable
  emit_preflight
  return 0
}

rescue_runtime() {
  "$SERVICE" stop >/dev/null 2>&1 || true
  [ ! -x "$POLICY" ] || "$POLICY" flush >/dev/null 2>&1 || true
}

start_runtime() {
  action="$1"
  preflight
  preflight_rc=$?
  [ "$preflight_rc" -eq 0 ] || return "$preflight_rc"
  validate_core_config || return $?
  if [ "$action" = "--restart" ]; then
    "$SERVICE" stop >/dev/null 2>&1 || true
  fi
  [ ! -x "$POLICY" ] || "$POLICY" flush >/dev/null 2>&1 || true
  KANO_CONFIG_PREVALIDATED=1 "$SERVICE" start >"$DIAG/service_start.out" 2>&1
  service_start_rc=$?
  if [ "$service_start_rc" -ne 0 ]; then
    echo "START_STATE=service_failed"
    echo "API_STATUS=not_run"
    echo "HTTP_CODE=000"
    echo "MESSAGE=Clash.Service 启动失败"
    cat "$DIAG/service_start.out" 2>/dev/null || true
    rescue_runtime
    return 4
  fi

  controller="$("$YQ" e '.external-controller // ""' "$CONFIG" 2>/dev/null | head -n 1)"
  secret="$("$YQ" e '.secret // ""' "$CONFIG" 2>/dev/null | head -n 1)"
  controller="$(printf '%s' "$controller" | sed 's#^http://##;s#^https://##')"
  case "$controller" in
    ""|null) controller=127.0.0.1:7788 ;;
    0.0.0.0:*) controller="127.0.0.1:$(printf '%s' "$controller" | sed 's/^[^:]*://')" ;;
    localhost:*) controller="127.0.0.1:$(printf '%s' "$controller" | sed 's/^[^:]*://')" ;;
    \\[::\\]:*) controller="127.0.0.1:$(printf '%s' "$controller" | sed 's/^.*://')" ;;
  esac
  CURL_BIN=${F50_FILES_DIR}/curl
  [ -x "$CURL_BIN" ] || CURL_BIN="$TOOLBOX_BIN/curl"
  [ -x "$CURL_BIN" ] || CURL_BIN="$(command -v curl 2>/dev/null)"
  [ -x "$CURL_BIN" ] || CURL_BIN=""
  last_status=unavailable
  last_http=000
  attempt=0
  attempt_limit=20
  [ "$action" != "--boot" ] || attempt_limit=60
  while [ "$attempt" -lt "$attempt_limit" ]; do
    attempt=$((attempt + 1))
    pid="$(find_core_pid)"
    if [ -n "$pid" ] && [ -n "$CURL_BIN" ]; then
      if [ -n "$secret" ] && [ "$secret" != "null" ]; then
        last_http="$("$CURL_BIN" -sS -m 2 -o "$DIAG/api.out" -w '%{http_code}' -H "Authorization: Bearer $secret" "http://$controller/version" 2>"$DIAG/api.err")"
      else
        last_http="$("$CURL_BIN" -sS -m 2 -o "$DIAG/api.out" -w '%{http_code}' "http://$controller/version" 2>"$DIAG/api.err")"
      fi
      curl_rc=$?
      case "$curl_rc:$last_http" in
        0:2*) echo "START_STATE=healthy"; echo "API_STATUS=healthy"; echo "HTTP_CODE=$last_http"; echo "MESSAGE=核心和控制 API 已就绪"; return 0 ;;
        0:401|0:403) last_status=auth_failed; break ;;
        7:*) last_status=refused ;;
        28:*) last_status=timeout ;;
        *) last_status=http_error ;;
      esac
    elif [ -z "$pid" ]; then
      last_status=core_not_running
    else
      last_status=curl_missing
      break
    fi
    sleep 1
  done
  pid="$(find_core_pid)"
  echo "START_STATE=running_api_unavailable"
  echo "API_STATUS=$last_status"
  echo "HTTP_CODE=$last_http"
  if [ "$action" = "--boot" ] && [ -n "$pid" ]; then
    echo "MESSAGE=核心进程已启动，开机阶段保留运行并交由后台继续检查"
    return 0
  fi
  echo "MESSAGE=核心未在等待时间内通过控制 API 健康检查"
  rescue_runtime
  return 5
}

ACTION="$1"
[ -n "$ACTION" ] || ACTION=--check
case "$ACTION" in
  --check) preflight ;;
  --start|--restart|--boot) start_runtime "$ACTION" ;;
  *) echo "usage: $0 --check|--start|--restart|--boot"; exit 64 ;;
esac
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
# KANO_SERVICE_WRAPPER_VERSION=${CLASH_SERVICE_WRAPPER_VERSION}
set +e
CORE=${CLASH_CORE}
CONFIG=${CLASH_CONFIG}
CONFIG_TEST_LOG=/data/kano_clash_config_test.log
RUN_LOG=${LOG_FILE}

case "$(getprop ro.product.cpu.abi 2>/dev/null) $(uname -m 2>/dev/null)" in
  *arm64-v8a*|*aarch64*|*armv8*) binary=${CLASH_DIR}/Scripts/clashctl_arm64 ;;
  *armeabi-v7a*|*armeabi*|*armv7*|*armv6*) binary=${CLASH_DIR}/Scripts/clashctl_armv7 ;;
  *) binary=${CLASH_DIR}/Scripts/clashctl ;;
esac

find_runtime_pid() {
  for p in /proc/[0-9]*; do
    [ -r "$p/cmdline" ] || continue
    PID="\${p##*/}"
    exe="$(readlink "$p/exe" 2>/dev/null)"
    cmdline="$(tr '\\0' ' ' < "$p/cmdline" 2>/dev/null)"
    comm="$(cat "$p/comm" 2>/dev/null | tr -d '\\r\\n')"
    case " $cmdline " in *" -t "*|*" --test "*) continue ;; esac
    case "$exe|$cmdline|$comm" in
      *"$CORE"*|*"/Clash.Core"*|*"/mihomo"*|*"|Clash.Core"|*"|mihomo") ;;
      *) continue ;;
    esac
    printf '%s\\n' "$PID"
    return 0
  done
  return 1
}

validate_config() {
  [ "$KANO_CONFIG_PREVALIDATED" = "1" ] && return 0
  [ -x "$CORE" ] || { echo "SERVICE_CONFIG_TEST_FAILED: Clash.Core 不可执行"; return 6; }
  [ -s "$CONFIG" ] || { echo "SERVICE_CONFIG_TEST_FAILED: config.yaml 不存在或为空"; return 6; }
  if command -v timeout >/dev/null 2>&1; then
    (cd "$(dirname "$CONFIG")" && timeout 60 "$CORE" -t -f "$CONFIG") >"$CONFIG_TEST_LOG" 2>&1
  else
    (cd "$(dirname "$CONFIG")" && "$CORE" -t -f "$CONFIG") >"$CONFIG_TEST_LOG" 2>&1
  fi
  test_rc=$?
  if [ "$test_rc" -ne 0 ]; then
    echo "SERVICE_CONFIG_TEST_FAILED: rc=$test_rc"
    tail -n 160 "$CONFIG_TEST_LOG" 2>/dev/null || true
    return 6
  fi
  return 0
}

[ -x "$binary" ] || { echo "找不到适用于当前架构的 clashctl: $binary"; exit 1; }
action="$1"
case "$action" in start|restart) validate_config || exit $? ;; esac

"$binary" "$@"
controller_rc=$?
[ "$controller_rc" -eq 0 ] || exit "$controller_rc"

case "$action" in
  start|restart)
    stable=0
    attempt=0
    while [ "$attempt" -lt 30 ]; do
      attempt=$((attempt + 1))
      pid="$(find_runtime_pid)"
      if [ -n "$pid" ]; then
        stable=$((stable + 1))
        if [ "$stable" -ge 2 ]; then
          echo "SERVICE_START_VERIFIED_PID=$pid"
          exit 0
        fi
      else
        stable=0
      fi
      sleep 1
    done
    echo "SERVICE_START_VERIFY_FAILED: 控制器返回成功，但核心进程未稳定运行"
    tail -n 120 "$RUN_LOG" 2>/dev/null || true
    exit 7
    ;;
esac
exit 0
`;

  const ensureServiceWrapper = async ({ force = false } = {}) => {
    const script = buildServiceWrapperScript();
    const marker = `# KANO_SERVICE_WRAPPER_VERSION=${CLASH_SERVICE_WRAPPER_VERSION}`;
    return runShellWithRoot(`
      set -e
      TARGET=${shellQuote(CLASH_SERVICE)}
      [ -d ${shellQuote(`${CLASH_DIR}/Scripts`)} ] || { echo "SERVICE_WRAPPER_SKIPPED=not_installed"; exit 3; }
      NEW="$TARGET.new.$$"
      if [ ${shellQuote(force ? '1' : '0')} != "1" ] && [ -x "$TARGET" ] && grep -qxF ${shellQuote(marker)} "$TARGET"; then
        echo "SERVICE_WRAPPER_READY=${CLASH_SERVICE_WRAPPER_VERSION}"
        exit 0
      fi
      cat > "$NEW" <<'KANO_SERVICE_WRAPPER_EOF'
${script}
KANO_SERVICE_WRAPPER_EOF
      chmod 755 "$NEW"
      sh -n "$NEW" || { rm -f "$NEW"; echo "SERVICE_WRAPPER_SYNTAX_FAILED"; exit 1; }
      mv -f "$NEW" "$TARGET"
      echo "SERVICE_WRAPPER_READY=${CLASH_SERVICE_WRAPPER_VERSION}"
    `, 20 * 1000);
  };

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

  const ensureRuntimeManagerScript = async ({ force = false } = {}) => {
    const script = buildRuntimeManagerScript();
    const marker = `# KANO_RUNTIME_MANAGER_VERSION=${CLASH_RUNTIME_MANAGER_VERSION}`;
    const result = await runShellWithRoot(`
      set -e
      [ -s ${shellQuote(CLASH_SERVICE)} ] || { echo "RUNTIME_MANAGER_SKIPPED=service_missing"; exit 3; }
      TARGET=${shellQuote(CLASH_RUNTIME_MANAGER)}
      NEW="$TARGET.new.$$"
      if [ ${shellQuote(force ? '1' : '0')} != "1" ] && [ -x "$TARGET" ] && grep -qxF ${shellQuote(marker)} "$TARGET"; then
        echo "RUNTIME_MANAGER_READY=${CLASH_RUNTIME_MANAGER_VERSION}"
        exit 0
      fi
      cat > "$NEW" <<'KANO_RUNTIME_MANAGER_EOF'
${script}
KANO_RUNTIME_MANAGER_EOF
      chmod 755 "$NEW"
      sh -n "$NEW" || { rm -f "$NEW"; echo "RUNTIME_MANAGER_SYNTAX_FAILED"; exit 1; }
      mv "$NEW" "$TARGET"
      echo "RUNTIME_MANAGER_READY=${CLASH_RUNTIME_MANAGER_VERSION}"
    `, 20 * 1000);
    return !!(result.success && String(result.content || '').includes('RUNTIME_MANAGER_READY='));
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

      find_real_core_pid() {
        candidates="$(pidof Clash.Core 2>/dev/null) $(pidof mihomo 2>/dev/null) $(pgrep -f '/data/clash/Proxy/[C]lash\\.Core' 2>/dev/null)"
        for PID in $candidates; do
          case "$PID" in ''|*[!0-9]*) continue ;; esac
          [ -r "/proc/$PID/cmdline" ] || continue
          cmdline="$(tr '\\0' ' ' < "/proc/$PID/cmdline" 2>/dev/null)"
          comm="$(cat "/proc/$PID/comm" 2>/dev/null | tr -d '\\r\\n')"
          case " $cmdline " in *" -t "*|*" --test "*) continue ;; esac
          case "$cmdline|$comm" in
            *"$CORE"*|*"/data/clash/Proxy/Clash.Core"*|*"|Clash.Core"|*"|mihomo")
              printf '%s\\n' "$PID"
              return 0
              ;;
          esac
        done
        return 1
      }

      pid="$(find_real_core_pid 2>/dev/null | head -n 1)"
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
    const state = ['disabled', 'direct', 'managed', 'manager_damaged'].includes(values.BOOT_STATE)
      ? values.BOOT_STATE
      : 'disabled';
    return {
      state,
      enabled: state != 'disabled',
      managerVersion: values.MANAGER_VERSION || '',
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
      if grep -qxF ${shellQuote(BOOT_SERVICE_LINE)} "$BOOT"; then
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
    return parseBootIntegrationResult(result);
  };

  const migrateLegacyBootIntegration = async () => {
    const state = await inspectBootIntegration();
    if (state.state != 'managed') return true;
    const migrated = await runShellWithRoot(addBootLinesCmd(), 10 * 1000);
    return !!migrated.success;
  };

  const migrateBootPolicyIntegration = async () => {
    const state = await inspectBootIntegration();
    if (!state.enabled) return true;
    if (!(await ensurePolicyToolsScript())) return false;
    const migrated = await runShellWithRoot(addPolicyToolsBootLineCmd(), 10 * 1000);
    return !!migrated.success;
  };

  const downloadCoreArchive = async ({ allowCached = false } = {}) => {
    // UFI root-shell requests have a finite request window. Keep every foreground
    // download attempt below that window and try sources one-by-one from JS.
    if (allowCached) {
      const cached = await runShellWithRoot(`
        ZIP=${shellQuote(DOWNLOAD_ZIP)}
        LOG=${shellQuote(DOWNLOAD_LOG)}
        [ -s "$ZIP" ] || exit 1
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
      const result = await runShellWithRoot(`
        set +e
        ZIP=${shellQuote(DOWNLOAD_ZIP)}
        NEW="$ZIP.new.$$"
        LOG=${shellQuote(DOWNLOAD_LOG)}
        rm -f "$NEW" 2>/dev/null || true
        ${getCurlBinCmd()}
        command -v unzip >/dev/null 2>&1 || { echo "ARCHIVE_VERIFY_FAILED=unzip_missing"; exit 1; }

        echo "TRY_PACKAGE_URL=${packageUrl ? shellQuote(packageUrl) : "''"}" > "$LOG"
        "$CURL_BIN" -fL --connect-timeout 10 --max-time 82 --retry 1 --retry-delay 1 \
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
      `, 95 * 1000);
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

      stamp="$(date +%Y%m%d%H%M%S 2>/dev/null)"
      [ -n "$stamp" ] || stamp="$(cat /proc/uptime 2>/dev/null | cut -d. -f1)"
      USER_BACKUP="/data/kano_clash_user_backup.$stamp"
      mkdir -p "$USER_BACKUP" || { echo "REPAIR_FAILED=user_backup_directory"; exit 1; }
      for relative in \
        Proxy/config.yaml Proxy/subscription_urls.txt Proxy/mac_bypass.txt Proxy/proxies Proxy/Policy \
        Tools/template.yaml Tools/template.base.yaml Tools/override.js Tools/rule_override.json \
        Tools/rule_override_applied.json Tools/sub_rule_mode.conf Tools/sub_user_agent.conf \
        Tools/config_source.conf Policy; do
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

  const selfHealDamagedInstall = async (initialState = null) => {
    const state = initialState || await checkInstallState({ fresh: true });
    if (state.state != 'damaged' || !state.repairable) return false;
    const archive = await downloadCoreArchive({ allowCached: true });
    if (!archive.ok) {
      createToast(`安装自愈失败（${escapeHtml(archive.stage)}）<br>${safeTextToHtml(archive.content || archive.message)}`, 'red', 12000);
      return false;
    }
    const committed = await stageAndCommitRepairArchive();
    if (!committed.ok) {
      createToast(`安装自愈提交失败<br>${safeTextToHtml(committed.content)}`, 'red', 12000);
      return false;
    }
    const failAndRollback = async (stage, detail = '') => {
      const rollback = await rollbackRepairedInstall(committed.targetBackup, stage);
      runtimePreflightCache = null;
      createToast(
        `安装自愈在 ${escapeHtml(stage)} 阶段失败<br>${safeTextToHtml(detail)}<br>${rollback.success ? '已恢复修复前安装目录。' : `回滚失败：${safeTextToHtml(rollback.content || '')}`}`,
        'red',
        14000,
      );
      return false;
    };
    const policyReady = await ensurePolicyToolsScript();
    if (!policyReady) createToast('基础修复已完成；网络策略增强脚本暂不可用，可稍后在“流量接管”中重试。', 'yellow', 8000);
    const checked = await runtimePreflight();
    if (['not_installed', 'damaged'].includes(checked.state)) {
      return failAndRollback('post_preflight', checked.content || checked.message);
    }
    const started = await startClashServiceClean({ stopFirst: true, reason: '安装自愈' });
    if (!started.success) {
      return failAndRollback('post_start', started.content || '未返回健康状态');
    }
    runtimePreflightCache = null;
    createToast(`安装自愈完成并已启动核心<br>用户数据备份：${escapeHtml(committed.userBackup)}`, 'green', 9000);
    return true;
  };

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
    if (activeCriticalOperation) {
      if (token && activeCriticalOperation.token === token) return token;
      createToast(`“${escapeHtml(activeCriticalOperation.label)}”正在执行，请完成后再试。`, 'yellow', 5000);
      return null;
    }
    const operationToken = token || { id: `${Date.now()}_${createRandomString(6)}` };
    activeCriticalOperation = { label: String(label || '关键操作'), token: operationToken };
    syncCriticalOperationStatus();
    return operationToken;
  };

  const releaseCriticalOperation = (token) => {
    if (activeCriticalOperation && activeCriticalOperation.token === token) {
      activeCriticalOperation = null;
      syncCriticalOperationStatus();
    }
  };

  const runCriticalOperation = async (label, action, token = null) => {
    const reentrant = !!(token && activeCriticalOperation && activeCriticalOperation.token === token);
    const operationToken = acquireCriticalOperation(label, token);
    if (!operationToken) return false;
    const ownsLock = !reentrant;
    try {
      return await action(operationToken);
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
    if (!res.success) {
      currentProviderUserAgent = KANO_PROVIDER_USER_AGENT;
      return currentProviderUserAgent;
    }
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
    if (!fresh) binarySnapshotLoadPromise = loadPromise;
    try {
      const snapshot = await loadPromise;
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
        CURRENT_INFO="$("$TARGET" version 2>/dev/null || true)"
        CURRENT_VERSION="$(helper_extract_version "$CURRENT_INFO")"
      fi
      # Best-effort migration only: if an older helper advertises 0.2.3, retain it as converter.
      # Failure to identify/copy it never blocks installing the new helper.
      if [ -f "$TARGET" ] && [ ! -s "$CONVERTER" ]; then
        old_info="$CURRENT_INFO"
        [ -n "$old_info" ] || old_info="$("$TARGET" version 2>/dev/null || true)"
        if printf '%s\n' "$old_info" | grep -q '0\.2\.3'; then
          cp "$TARGET" "$CONVERTER.new.$$" 2>/dev/null && \
            chmod 700 "$CONVERTER.new.$$" 2>/dev/null && \
            mv -f "$CONVERTER.new.$$" "$CONVERTER" 2>/dev/null || true
        fi
      fi
      mv -f "$SOURCE" "$STAGE"
      chmod 700 "$STAGE" || { echo "HELPER_CHMOD_FAILED"; exit 1; }
      [ -x "$STAGE" ] || { echo "HELPER_NOT_EXECUTABLE"; exit 1; }
      VERSION_OUT="$("$STAGE" version 2>&1)" || {
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
        "$CURL_BIN" -fL --connect-timeout 10 --max-time 90 --retry 2 --retry-delay 1 \
          ${shellQuote(KANO_HELPER_DOWNLOAD_URL)} -o "$SOURCE"
      `,
      timeout: 110 * 1000,
      label: 'install_binary_helper_gitee',
      successMessage: '转换组件已从 Gitee 安装',
    });
  };

  const installBinaryHelperPreferred = async ({ quiet = false, preferGitee = false } = {}) => {
    if (preferGitee) {
      const giteeOk = await installBinaryHelperFromGitee({ quiet: true });
      const bundledOk = await installBinaryHelperFromBundled({ quiet: giteeOk || quiet });
      return giteeOk || bundledOk;
    }
    const bundledOk = await installBinaryHelperFromBundled({ quiet: true });
    if (bundledOk) return true;
    return installBinaryHelperFromGitee({ quiet });
  };

  let autoEnsureHelperDone = false;

  const autoEnsureBinaryHelper = async () => {
    if (autoEnsureHelperDone) return true;
    autoEnsureHelperDone = true;
    try {
      const probe = await probeBinaryHelperState();
      if (probe.state == 'installed') return true;
      if (!(await checkIsInstalled()) || !(await checkAdvanceFunc())) return false;
      const ok = await installBinaryHelperPreferred({
        quiet: true,
        preferGitee: probe.state != 'missing',
      });
      if (ok) invalidateBinarySnapshot();
      return ok;
    } catch (e) {
      console.error('auto ensure binary helper failed', e);
      return false;
    }
  };

  const installBinaryHelperFromFile = async (file) => {
    if (!file) return false;
    if (file.size === 0) {
      createToast('转换组件文件为空', 'red', 5000);
      return false;
    }
    const formData = new FormData();
    formData.append('file', file);
    let uploadResult = null;
    try {
      const response = await fetch(`${KANO_baseURL}/upload_img`, {
        method: 'POST',
        headers: common_headers,
        body: formData,
      });
      uploadResult = await response.json();
      if (!response.ok || !uploadResult.url) throw new Error(uploadResult.error || `HTTP ${response.status}`);
    } catch (e) {
      createToast(`转换组件上传失败<br>${safeTextToHtml(e && e.message ? e.message : e)}`, 'red', 8000);
      return false;
    }

    return installBinaryHelperFromDevicePath({
      sourcePath: getUploadedPath(uploadResult.url),
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
    return cleanSources.length > 0
      ? cleanSources.map((source) => source.name)
      : [providerNameFor(0)];
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


  const normalizeSubRuleModeValue = (value = '') => SUB_RULE_MODE_TEMPLATE;
  const normalizeSubConvertModeValue = (value = '') =>
    String(value || '').trim().toLowerCase() == SUB_CONVERT_MODE_LOCAL
      ? SUB_CONVERT_MODE_LOCAL
      : SUB_CONVERT_MODE_PROVIDER;

  const parseSubConvertModeFromText = (content = '') => {
    const match = String(content || '').match(/^# KANO_SUB_CONVERT_MODE=(\S+)\s*$/m);
    return normalizeSubConvertModeValue(match ? match[1] : '');
  };

  const readSavedSubConvertMode = async () => {
    const res = await runShellWithRoot(`
        grep -m 1 '^# KANO_SUB_CONVERT_MODE=' ${shellQuote(CLASH_SUB_URLS)} 2>/dev/null |
          sed 's/^# KANO_SUB_CONVERT_MODE=//' | tr -d '\\r'
        `, 10 * 1000);
    return normalizeSubConvertModeValue(res.success ? res.content : '');
  };


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

  const setConfigSourceCmd = (source = 'unknown') => `
        if mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)} 2>/dev/null; then
          if printf 'KANO_CONFIG_SOURCE=%s\nKANO_CONFIG_SOURCE_TIME=%s\n' ${shellQuote(String(source || 'unknown'))} "$(date +%Y-%m-%dT%H:%M:%S%z 2>/dev/null)" > ${shellQuote(CLASH_CONFIG_SOURCE_FILE)}; then
            chmod 600 ${shellQuote(CLASH_CONFIG_SOURCE_FILE)} 2>/dev/null || true
          else
            echo "CONFIG_SOURCE_WARN: failed to write ${CLASH_CONFIG_SOURCE_FILE}"
          fi
        else
          echo "CONFIG_SOURCE_WARN: failed to create ${CLASH_DIR}/Tools"
        fi
        `;

  const setSubRuleMode = async (mode = SUB_RULE_MODE_TEMPLATE) => {
    const cleanMode = normalizeSubRuleModeValue(mode);
    const res = await runShellWithRoot(`
        set -e
        mkdir -p ${shellQuote(CLASH_PROXY_DIR)} ${shellQuote(`${CLASH_DIR}/Tools`)} ${shellQuote(CLASH_POLICY_DIR)}
        ${subRuleModePersistSidecarsCmd(cleanMode)}
        tmp=${shellQuote(CLASH_SUB_URLS)}.mode.$$
        trap 'rm -f "$tmp" 2>/dev/null || true' EXIT
        if [ -f ${shellQuote(CLASH_SUB_URLS)} ]; then
          {
            printf '%s\n' ${shellQuote(`# KANO_SUB_RULE_MODE=${cleanMode}`)}
            grep -Ev '^[[:space:]]*# KANO_SUB_RULE_MODE=' ${shellQuote(CLASH_SUB_URLS)} 2>/dev/null | grep -Ev '^[[:space:]]*$' || true
          } > "$tmp"
        else
          printf '%s\n' ${shellQuote(`# KANO_SUB_RULE_MODE=${cleanMode}`)} > "$tmp"
        fi
        chmod 600 "$tmp" 2>/dev/null || true
        mv -f "$tmp" ${shellQuote(CLASH_SUB_URLS)}
        trap - EXIT
        first_line="$(sed -n '1p' ${shellQuote(CLASH_SUB_URLS)} 2>/dev/null | tr -d '\r')"
        [ "$first_line" = ${shellQuote(`# KANO_SUB_RULE_MODE=${cleanMode}`)} ] || { echo "SUB_RULE_MODE_SET_FAILED:$first_line"; exit 1; }
        echo "SUB_RULE_MODE_SET:${cleanMode}"
        `, 15 * 1000);
    if (!res.success) {
      createToast(`\u89c4\u5219\u6a21\u5f0f\u72b6\u6001\u5199\u5165\u5931\u8d25<br>${safeTextToHtml(res.content || '')}`, 'red', 9000);
      return false;
    }
    return true;
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
    const subUrlsText = buildSubUrlsFileText(storedSources, mode, convertMode);
    const res = await runShellWithRoot(`
        set -e
        mkdir -p ${shellQuote(CLASH_PROXY_DIR)}
        ${subRuleModePersistSidecarsCmd(mode)}
        SUB=${shellQuote(CLASH_SUB_URLS)}
        SUB_NEW="$SUB.kano_new.$$"
        trap 'rm -f "$SUB_NEW" 2>/dev/null || true' EXIT
        printf '%s' ${shellQuote(subUrlsText)} > "$SUB_NEW"
        chmod 600 "$SUB_NEW"
        mv -f "$SUB_NEW" "$SUB"
        trap - EXIT
        first_line="$(sed -n '1p' ${shellQuote(CLASH_SUB_URLS)} 2>/dev/null | tr -d '\r')"
        [ "$first_line" = ${shellQuote(`# KANO_SUB_RULE_MODE=${normalizeSubRuleModeValue(mode)}`)} ] || { echo "SUB_URLS_MODE_HEADER_WRITE_FAILED:$first_line"; exit 1; }
        `);
    return res.success;
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
        secret: controllerInfo.secretSet ? controllerInfo.secret : createRandomSecret(20),
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

  const ensureObjectField = (target, key) => {
    if (!isPlainYamlObject(target[key])) target[key] = {};
    return target[key];
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
  const ensureYqRuntime = async ({ quiet = false, force = false } = {}) => {
    const now = Date.now();
    if (!force && yqRuntimeReadyUntil > now) return true;
    if (!force && yqRuntimeEnsurePromise) return yqRuntimeEnsurePromise;
    const task = (async () => {
      // Phase 1: zero-side-effect probe. Basic proxy operation never depends on this path.
      const probe = await runShellWithRoot(`
        set +e
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        verify_yq() {
          candidate="$1"
          [ -s "$candidate" ] || return 1
          chmod 755 "$candidate" 2>/dev/null || return 1
          version="$("$candidate" --version 2>&1)" || return 1
          echo "$version" | grep -Eiq 'version[[:space:]]+v?4\\.'
        }
        if verify_yq "$YQ"; then
          echo "YQ_RUNTIME_READY=existing"
          exit 0
        fi
        abi="$(getprop ro.product.cpu.abi 2>/dev/null | head -n 1 | tr '[:upper:]' '[:lower:]')"
        abilist="$(getprop ro.product.cpu.abilist 2>/dev/null | head -n 1 | tr '[:upper:]' '[:lower:]')"
        machine="$(uname -m 2>/dev/null | tr '[:upper:]' '[:lower:]')"
        case "$abi $abilist $machine" in
          *arm64-v8a*|*aarch64*|*armv8*|*arm64*) echo "YQ_RUNTIME_NEEDS_REPAIR=arm64"; exit 0 ;;
          *) echo "YQ_RUNTIME_UNSUPPORTED_ABI=\${abi:-$machine}"; exit 2 ;;
        esac
      `, 10 * 1000);
      const probeText = String(probe.content || '');
      if (probe.success && probeText.includes('YQ_RUNTIME_READY=existing')) {
        yqRuntimeReadyUntil = Date.now() + 5 * 60 * 1000;
        return true;
      }
      if (!probeText.includes('YQ_RUNTIME_NEEDS_REPAIR=arm64')) {
        if (!quiet) createToast(`YAML 运行组件不可用：当前 CPU ABI 不受自动修复支持。<br>${safeTextToHtml(probeText)}`, 'red', 9000);
        return false;
      }

      // Phase 2: compatibility package first. This preserves the historical F50 bundle layout.
      // Failure is non-fatal and falls through to the official yq binary.
      const packageRepair = await runShellWithRoot(`
        set +e
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        FALLBACK_URL=${shellQuote(CLASH_PACKAGE_FALLBACK_URL)}
        CACHE=/data/kano_yq_repair.zip
        TMP="$YQ.kano_new.$$"
        CURL_BIN=${shellQuote(`${F50_FILES_DIR}/curl`)}
        [ -x "$CURL_BIN" ] || CURL_BIN=${shellQuote(`${KANO_INSTALL_TOOLBOX_BIN}/curl`)}
        [ -x "$CURL_BIN" ] || CURL_BIN="$(command -v curl 2>/dev/null)"
        UNZIP_BIN=${shellQuote(`${F50_FILES_DIR}/unzip`)}
        [ -x "$UNZIP_BIN" ] || UNZIP_BIN=${shellQuote(`${KANO_INSTALL_TOOLBOX_BIN}/unzip`)}
        [ -x "$UNZIP_BIN" ] || UNZIP_BIN="$(command -v unzip 2>/dev/null)"
        [ -x "$CURL_BIN" ] || { echo "YQ_PACKAGE_REPAIR_FAILED=curl_missing"; exit 1; }
        [ -x "$UNZIP_BIN" ] || { echo "YQ_PACKAGE_REPAIR_FAILED=unzip_missing"; exit 1; }
        rm -f "$CACHE.new.$$" "$TMP" 2>/dev/null || true
        "$CURL_BIN" -fL --connect-timeout 10 --max-time 72 --retry 1 --retry-delay 1 "$FALLBACK_URL" -o "$CACHE.new.$$" || {
          rm -f "$CACHE.new.$$" 2>/dev/null || true
          echo "YQ_PACKAGE_REPAIR_FAILED=download"
          exit 1
        }
        "$UNZIP_BIN" -t "$CACHE.new.$$" >/dev/null 2>&1 || {
          rm -f "$CACHE.new.$$" 2>/dev/null || true
          echo "YQ_PACKAGE_REPAIR_FAILED=archive"
          exit 1
        }
        entry="$("$UNZIP_BIN" -Z1 "$CACHE.new.$$" 2>/dev/null | awk '/(^|\\/)Tools\\/yq_linux_arm64$/ {print; exit}')"
        if [ -z "$entry" ]; then
          entry="$("$UNZIP_BIN" -l "$CACHE.new.$$" 2>/dev/null | awk '$NF ~ /(^|\\/)Tools\\/yq_linux_arm64$/ {print $NF; exit}')"
        fi
        [ -n "$entry" ] || { rm -f "$CACHE.new.$$" 2>/dev/null || true; echo "YQ_PACKAGE_REPAIR_FAILED=asset_missing"; exit 1; }
        mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)} || exit 1
        "$UNZIP_BIN" -p "$CACHE.new.$$" "$entry" > "$TMP" || {
          rm -f "$CACHE.new.$$" "$TMP" 2>/dev/null || true
          echo "YQ_PACKAGE_REPAIR_FAILED=extract"
          exit 1
        }
        chmod 755 "$TMP" 2>/dev/null || { rm -f "$TMP"; exit 1; }
        version="$("$TMP" --version 2>&1)" || { rm -f "$TMP"; echo "YQ_PACKAGE_REPAIR_FAILED=execute"; exit 1; }
        echo "$version" | grep -Eiq 'version[[:space:]]+v?4\\.' || { rm -f "$TMP"; echo "YQ_PACKAGE_REPAIR_FAILED=version"; exit 1; }
        mv -f "$CACHE.new.$$" "$CACHE" 2>/dev/null || true
        mv -f "$TMP" "$YQ" || { rm -f "$TMP" 2>/dev/null || true; exit 1; }
        chmod 755 "$YQ" 2>/dev/null || true
        echo "YQ_RUNTIME_READY=compat_package"
      `, 88 * 1000);
      if (packageRepair.success && String(packageRepair.content || '').includes('YQ_RUNTIME_READY=compat_package')) {
        yqRuntimeReadyUntil = Date.now() + 5 * 60 * 1000;
        return true;
      }

      // Phase 3: official mikefarah/yq ARM64 binary.
      // This path intentionally does not need unzip, so a minimal clean F50 can still self-heal.
      const officialRepair = await runShellWithRoot(`
        set +e
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        URL=${shellQuote(YQ_OFFICIAL_ARM64_URL)}
        TMP="$YQ.official_new.$$"
        CURL_BIN=${shellQuote(`${F50_FILES_DIR}/curl`)}
        [ -x "$CURL_BIN" ] || CURL_BIN=${shellQuote(`${KANO_INSTALL_TOOLBOX_BIN}/curl`)}
        [ -x "$CURL_BIN" ] || CURL_BIN="$(command -v curl 2>/dev/null)"
        [ -x "$CURL_BIN" ] || { echo "YQ_OFFICIAL_REPAIR_FAILED=curl_missing"; exit 1; }
        rm -f "$TMP" 2>/dev/null || true
        "$CURL_BIN" -fL --connect-timeout 10 --max-time 72 --retry 1 --retry-delay 1 "$URL" -o "$TMP" || {
          rm -f "$TMP" 2>/dev/null || true
          echo "YQ_OFFICIAL_REPAIR_FAILED=download"
          exit 1
        }
        chmod 755 "$TMP" 2>/dev/null || { rm -f "$TMP"; exit 1; }
        version="$("$TMP" --version 2>&1)" || { rm -f "$TMP"; echo "YQ_OFFICIAL_REPAIR_FAILED=execute"; exit 1; }
        printf '%s\\n' "$version" | grep -Eiq 'version[[:space:]]+v?4\\.' || {
          rm -f "$TMP"; echo "YQ_OFFICIAL_REPAIR_FAILED=version:$version"; exit 1;
        }
        mkdir -p ${shellQuote(`${CLASH_DIR}/Tools`)} || { rm -f "$TMP"; exit 1; }
        mv -f "$TMP" "$YQ" || { rm -f "$TMP" 2>/dev/null || true; exit 1; }
        chmod 755 "$YQ" 2>/dev/null || true
        echo "YQ_RUNTIME_READY=official"
      `, 88 * 1000);
      const officialText = String(officialRepair.content || '');
      const ok = !!(officialRepair.success && officialText.includes('YQ_RUNTIME_READY=official'));
      if (ok) {
        yqRuntimeReadyUntil = Date.now() + 5 * 60 * 1000;
        return true;
      }
      if (!quiet) {
        const packageText = String(packageRepair.content || '').trim();
        createToast(
          `YAML 运行组件自动修复失败；基础代理不受影响。<br>` +
          `兼容包：${safeTextToHtml(packageText || '不可用')}<br>` +
          `官方 yq：${safeTextToHtml(officialText || '不可用')}`,
          'red',
          12000,
        );
      }
      return false;
    })();
    if (!force) yqRuntimeEnsurePromise = task;
    try {
      return await task;
    } finally {
      if (yqRuntimeEnsurePromise == task) yqRuntimeEnsurePromise = null;
    }
  };

  const readYamlObject = async (yamlPath, label = 'YAML') => {
    if (!(await ensureYqRuntime({ quiet: true }))) {
      return { ok: false, value: null, message: `${label} 需要 yq v4；自动修复未成功，但基础代理仍可运行`, shell: null };
    }
    const res = await runShellWithRoot(`
        set -e
        FILE=${shellQuote(yamlPath)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        [ -s "$FILE" ] || { echo "YAML_FILE_MISSING: $FILE"; exit 1; }
        [ -x "$YQ" ] || { echo "YQ_MISSING: $YQ"; exit 1; }
        version="$($YQ --version 2>&1)"
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
        "$YQ" e -o=json '.' "$FILE"
        `, 45 * 1000);
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
      const formData = new FormData();
      formData.append('file', new File([value], `kano_yaml_stage_${token}.yaml`, { type: 'text/yaml' }));
      const uploadResponse = await fetch(`${KANO_baseURL}/upload_img`, {
        method: 'POST',
        headers: common_headers,
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadResult.url) {
        throw new Error(uploadResult.error || `HTTP ${uploadResponse.status}`);
      }
      uploadedPath = getUploadedPath(uploadResult.url);
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
        version="$($YQ --version 2>&1)"
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
        chmod 644 "$STAGE" 2>/dev/null || true
        sync 2>/dev/null || true
        mv -f "$STAGE" "$TARGET" || {
          echo "YAML_COMMIT_FAILED: $TARGET"
          exit 1
        }
        sync 2>/dev/null || true
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

  const writeYamlObjectAtomic = async (yamlPath, objectValue, {
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

  const detectF50TproxyPort = async () => {
    const res = await runShellWithRoot(`
        port=""
        if [ -f ${shellQuote(CLASH_SERVICE)} ]; then
          port="$(grep -Ei 'TPROXY|tproxy|on-port|789[0-9]' ${shellQuote(CLASH_SERVICE)} 2>/dev/null | grep -Eo '[0-9]{3,5}' | grep -E '^789[0-9]$' | tail -n 1)"
        fi
        [ -n "$port" ] || port=7895
        echo "$port"
        `, 10 * 1000);
    return getPositivePort(String(res.content || '').trim(), 7895);
  };

  const buildManagedProxyProviders = (
    sources = [],
    { emptyUrls = false, ensureOne = false, localFiles = false } = {},
  ) => {
    let cleanSources = normalizeSubSourceList(sources);
    if (cleanSources.length == 0 && ensureOne) {
      cleanSources = [{ name: providerNameFor(0), url: '' }];
    }
    const providers = {};
    cleanSources.forEach((source) => {
      const provider = {
        type: localFiles ? 'file' : 'http',
        path: `./proxies/${source.name}.yaml`,
        'health-check': {
          enable: true,
          url: 'https://www.gstatic.com/generate_204',
          interval: 900,
        },
      };
      if (!localFiles) {
        provider.url = emptyUrls ? '' : source.url;
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
    const usesManagedZashboard = managedUiPaths.has(normalizedUi) && (
      (!externalUi && !externalUiName && !externalUiUrl)
      || externalUiName == 'zashboard'
      || /github\.com\/Zephyruso\/zashboard\//i.test(externalUiUrl)
      || normalizedUi.endsWith('/zashboard')
    );
    if (!usesManagedZashboard) return false;

    const changed = externalUi != ZASHBOARD_UI_DIR
      || Object.prototype.hasOwnProperty.call(config, 'external-ui-name')
      || !externalUiUrl;
    config['external-ui'] = ZASHBOARD_UI_DIR;
    if (!externalUiUrl) config['external-ui-url'] = ZASHBOARD_UI_URL;
    delete config['external-ui-name'];
    return changed;
  };

  const applyRequiredF50Fields = (config, {
    tproxyPort = 7895,
    ipv6 = false,
    dnsListen = null,
    forceRedirHost = true,
  } = {}) => {
    assertYamlRootMap(config, '配置');
    config['allow-lan'] = true;
    config['bind-address'] = '*';
    config['tproxy-port'] = getPositivePort(tproxyPort, 7895);
    if (typeof config['external-controller'] != 'string' || !config['external-controller'].trim()) {
      config['external-controller'] = '0.0.0.0:7788';
    }
    applyManagedDashboardFields(config);
    if (typeof config.secret != 'string' || !config.secret.trim()) config.secret = createRandomSecret(20);
    config.ipv6 = !!ipv6;
    if (!Array.isArray(config.proxies)) config.proxies = [];
    const profile = ensureObjectField(config, 'profile');
    profile['store-fake-ip'] = false;
    const dns = ensureObjectField(config, 'dns');
    dns.enable = true;
    dns.listen = dnsListen || (ipv6 ? '[::]:1053' : '0.0.0.0:1053');
    dns.ipv6 = !!ipv6;
    if (forceRedirHost || typeof dns['enhanced-mode'] != 'string' || !dns['enhanced-mode'].trim()) {
      dns['enhanced-mode'] = 'redir-host';
    }
    delete dns['fake-ip-range'];
    delete dns['fake-ip-filter'];
    return config;
  };

  const applyOverrideSafetyFields = (config, preservedSecret = '') => {
    assertYamlRootMap(config, '覆写结果');
    config['allow-lan'] = true;
    config['bind-address'] = '*';
    if (typeof config['external-controller'] != 'string' || !config['external-controller'].trim()) {
      config['external-controller'] = '0.0.0.0:7788';
    }
    if (typeof config.secret != 'string' || !config.secret.trim()) {
      config.secret = String(preservedSecret || createRandomSecret(20));
    }
    config.ipv6 = false;
    const dns = ensureObjectField(config, 'dns');
    dns.enable = true;
    dns.listen = '0.0.0.0:1053';
    dns.ipv6 = false;
    if (typeof dns['enhanced-mode'] != 'string' || !dns['enhanced-mode'].trim()) {
      dns['enhanced-mode'] = 'redir-host';
    }
    return config;
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

  const validateConfigObjectStructure = (config, label = '配置') => {
    assertYamlRootMap(config, label);
    ['proxies', 'proxy-groups', 'rules', 'listeners'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(config, key) && !Array.isArray(config[key])) {
        throw new Error(`${key} 必须是数组`);
      }
    });
    ['proxy-providers', 'rule-providers', 'dns', 'tun', 'profile', 'hosts'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(config, key) && !isPlainYamlObject(config[key])) {
        throw new Error(`${key} 必须是映射对象`);
      }
    });

    const names = new Set();
    (config['proxy-groups'] || []).forEach((group, index) => {
      if (!isPlainYamlObject(group)) throw new Error(`proxy-groups[${index}] 必须是映射对象`);
      const name = String(group.name || '').trim();
      if (!name) throw new Error(`proxy-groups[${index}] 缺少 name`);
      if (names.has(name)) throw new Error(`proxy-groups 存在重复组名：${name}`);
      names.add(name);
    });
    Object.entries(config['proxy-providers'] || {}).forEach(([name, provider]) => {
      if (!name.trim() || !isPlainYamlObject(provider)) {
        throw new Error(`proxy-provider ${name || '<empty>'} 格式无效`);
      }
    });
    Object.entries(config['rule-providers'] || {}).forEach(([name, provider]) => {
      if (!name.trim() || !isPlainYamlObject(provider)) {
        throw new Error(`rule-provider ${name || '<empty>'} 格式无效`);
      }
    });
    return true;
  };

  const normalizeManagedTemplateObject = (rawConfig, sources = [], {
    generated = false,
    emptyProviderUrls = true,
    localProviderFiles = false,
    tproxyPort = 7895,
  } = {}) => {
    const config = cloneJsonValue(assertYamlRootMap(rawConfig, 'template.yaml'));
    const providerNames = providerNamesForTemplate(sources);
    applyRequiredF50Fields(config, { tproxyPort, ipv6: false, dnsListen: '0.0.0.0:1053', forceRedirHost: true });
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
    secret: String(controllerSettings.secret || createRandomSecret(20)),
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


  const validateConfigFileStructure = async (configPath = CLASH_CONFIG, label = 'config.yaml') => {
    const read = await readYamlObject(configPath, label);
    if (!read.ok) {
      return { ok: false, message: sanitizeSubscriptionSecrets(read.message || `${label} 解析失败`) };
    }
    try {
      validateConfigObjectStructure(read.value, label);
      return { ok: true, message: '' };
    } catch (e) {
      return {
        ok: false,
        message: sanitizeSubscriptionSecrets(e && e.message ? e.message : String(e || `${label} 结构无效`)),
      };
    }
  };


  const buildDefaultOverrideJs = () => [
    '/**',
    ' * F50 JS \u8986\u5199\uff1a\u5199\u6cd5\u5c3d\u91cf\u8d34\u8fd1\u684c\u9762\u7aef mihomo/Clash Verge \u8986\u5199\u811a\u672c\u3002',
    ' * \u4fdd\u5b58\u540e\u4f1a\u57fa\u4e8e template.base.yaml \u751f\u6210 template.yaml\uff0c\u4e0d\u4f1a\u76f4\u63a5\u628a\u6574\u4efd\u6a21\u677f\u66ff\u6362\u6210\u56fa\u5b9a\u5185\u5bb9\u3002',
    ' * \u5e38\u7528\u5199\u6cd5\uff1a\u53ea\u6539 config.rules\uff0c\u6216\u5c11\u91cf\u6539 dns / proxy-groups\u3002',
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
    if (restart) return await restartClash({ skipCheck: true });
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
    await appendTemplateFlowDebug(`enter writeRuntimeConfigFromTemplate json_bridge=1 forceTemplate=${forceTemplate ? '1' : '0'} sources=${cleanSources.length}`);

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

    const fail = async (step, message) => {
      const detail = sanitizeSubscriptionSecrets(String(message || 'unknown error'));
      await runShellWithRoot(`
        {
          echo 'failed_rc=1'
          echo ${shellQuote(`failed_step=${step}`)}
          printf 'failed_time=%s\\n' "$(date +%Y-%m-%dT%H:%M:%S%z 2>/dev/null)"
        } >> ${shellQuote(KANO_TEMPLATE_WRITE_CHECK)}
        `, 10 * 1000);
      await appendTemplateFlowDebug(`writeRuntimeConfigFromTemplate failed step=${step} detail=${detail.replace(/[\r\n]+/g, ' ').slice(0, 500)}`);
      const checkRes = await runShellWithRoot(`cat ${shellQuote(KANO_TEMPLATE_WRITE_CHECK)} 2>/dev/null || true`, 10 * 1000);
      createToast(
        `生成运行配置失败，config.yaml 未提交<br>${safeTextToHtml(detail)}<br><br>[kano_template_write_check.out]<br>${safeTextToHtml(checkRes.content || '')}`,
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

    const sourceRes = await runShellWithRoot(`
        ${setConfigSourceCmd('template.yaml')}
        echo 'CONFIG_SOURCE_COMMITTED=template.yaml'
        `, 15 * 1000);
    if (!sourceRes.success) {
      await appendTemplateFlowDebug('warning: config source sidecar write failed after config commit');
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

    await appendTemplateFlowDebug(`writeRuntimeConfigFromTemplate committed json_bridge=1 providers=${normalized.providerNames.join(',')} unchanged=${write.unchanged ? '1' : '0'}`);
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

  const getCorePid = async () => {
    // Do not trust helper snapshot PID blindly. A lingering `Clash.Core -t` process is
    // a config-test worker, not the running proxy core, and must never make the UI/API
    // state look "running".
    const status = await runShellWithRoot(`
        CORE=${shellQuote(CLASH_CORE)}
        candidates="$(pidof Clash.Core 2>/dev/null) $(pidof mihomo 2>/dev/null) $(pgrep -f '/data/clash/Proxy/[C]lash\\.Core' 2>/dev/null)"
        for PID in $candidates; do
          case "$PID" in ''|*[!0-9]*) continue ;; esac
          [ -r "/proc/$PID/cmdline" ] || continue
          cmdline="$(tr '\\0' ' ' < "/proc/$PID/cmdline" 2>/dev/null)"
          comm="$(cat "/proc/$PID/comm" 2>/dev/null | tr -d '\\r\\n')"
          case " $cmdline " in *" -t "*|*" --test "*) continue ;; esac
          case "$cmdline|$comm" in
            *"$CORE"*|*"/data/clash/Proxy/Clash.Core"*|*"|Clash.Core"|*"|mihomo")
              echo "$PID"
              exit 0
              ;;
          esac
        done
        exit 0
        `, 8 * 1000);
    const match = String(status.content || '').match(/(?:^|\s)(\d+)(?:\s|$)/);
    return match ? match[1] : '';
  };

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
    const fallbackController = '127.0.0.1:7788';
    let externalController = '';
    let secret = '';

    try {
      const snapshot = await readBinarySnapshot({ fresh });
      if (snapshot) {
        externalController = String(snapshot.externalController || '').trim();
        secret = String(snapshot.secret || '').trim();
      }
      if (snapshot && externalController) {
        const controllerInfo = normalizeController(externalController || fallbackController);
        return {
          ...controllerInfo,
          externalController: externalController || fallbackController,
          secret,
          secretSet: snapshot.secretSet === true || !!secret,
          usingFallbackController: !externalController,
          usingFallbackSecret: !secret,
          configSource: 'binary',
        };
      }
      const res = await runShellWithRoot(`
        CONFIG=${shellQuote(CLASH_CONFIG)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        controller=""
        secret=""
        if [ -f "$CONFIG" ]; then
          if [ -x "$YQ" ]; then
            controller="$("$YQ" e '.external-controller // ""' "$CONFIG" 2>/dev/null | head -n 1)"
            secret="$("$YQ" e '.secret // ""' "$CONFIG" 2>/dev/null | head -n 1)"
          fi
          if [ -z "$controller" ] || [ "$controller" = "null" ]; then
            controller="$(grep -m 1 '^[[:space:]]*external-controller[[:space:]]*:' "$CONFIG" 2>/dev/null | sed 's/^[^:]*:[[:space:]]*//' | sed 's/[[:space:]]#.*$//' | sed "s/^[\\"'']//;s/[\\"'']$//")"
          fi
          if [ -z "$secret" ] || [ "$secret" = "null" ]; then
            secret="$(grep -m 1 '^[[:space:]]*secret[[:space:]]*:' "$CONFIG" 2>/dev/null | sed 's/^[^:]*:[[:space:]]*//' | sed 's/[[:space:]]#.*$//' | sed "s/^[\\"'']//;s/[\\"'']$//")"
          fi
        fi
        printf 'CONTROLLER=%s\\n' "$controller"
        if [ -n "$secret" ] && [ "$secret" != "null" ]; then
          printf 'SECRET=%s\\n' "$secret"
          echo 'SECRET_SET=1'
        else
          echo 'SECRET_SET=0'
        fi
        `);
      const lines = String(res.content || '').split('\n');
      externalController =
        (lines.find((line) => line.startsWith('CONTROLLER=')) || '')
          .replace(/^CONTROLLER=/, '')
          .trim();
      secret =
        (lines.find((line) => line.startsWith('SECRET=')) || '')
          .replace(/^SECRET=/, '')
          .trim();
    } catch (e) {
      console.error(e);
    }

    const controllerInfo = normalizeController(externalController || fallbackController);
    return {
      ...controllerInfo,
      externalController: externalController || fallbackController,
      secret,
      secretSet: !!secret,
      usingFallbackController: !externalController,
      usingFallbackSecret: !secret,
      configSource: externalController ? 'config' : 'controller_fallback',
    };
  };

  const buildControllerInfo = async ({ fresh = false } = {}) => {
    const now = Date.now();
    if (!fresh && controllerInfoCache && controllerInfoCacheExpiresAt > now) {
      return controllerInfoCache;
    }
    if (!fresh && controllerInfoLoadPromise) return controllerInfoLoadPromise;

    const loadPromise = readControllerInfo({ fresh });
    if (!fresh) controllerInfoLoadPromise = loadPromise;
    try {
      const info = await loadPromise;
      controllerInfoCache = info;
      controllerInfoCacheExpiresAt = Date.now() + CONTROLLER_INFO_CACHE_TTL;
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
      ? await callMihomoApi('/version', 'GET', null, checked.info)
      : { success: false, statusCode: 0, responseText: 'reload failed' };
    if (!reloadRes.success || !checkRes.success) {
      const configRestored = rollbackPath
        ? await restoreConfigRollbackPoint(rollbackPath, '控制 API 设置', { showToast: false })
        : false;
      const templateRestored = await restoreTemplateWrite();
      const rollbackReload = configRestored ? await reloadConfigHot(oldInfo) : { success: false };
      const runtimeRecovered = rollbackReload.success || (configRestored && await restartClash({ skipCheck: true }));
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
    const controllerInfo = await buildControllerInfo();
    const targets = [
      { label: 'DNS', path: '/cache/dns/flush' },
      { label: 'Fake-IP', path: '/cache/fakeip/flush' },
    ];
    const responses = await Promise.all(
      targets.map(async (target) => {
        try {
          return await callMihomoApi(target.path, 'POST', null, controllerInfo, 5);
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
    );

  const tunRuntimePayload = (enable) => (enable
    ? {
      enable: true,
      stack: 'mixed',
      'auto-route': true,
      'auto-redirect': true,
      'auto-detect-interface': true,
      'strict-route': false,
      'dns-hijack': ['any:53', 'tcp://any:53'],
    }
    : { enable: false });

  const readCoreTunEnabled = async (controllerInfo = null) => {
    try {
      const res = await callMihomoApi('/configs', 'GET', null, controllerInfo, 5);
      if (!res.success) return null;
      const config = JSON.parse(res.responseText || '{}');
      return !!(config && config.tun && config.tun.enable);
    } catch (e) {
      console.error('read core tun state failed', e);
      return null;
    }
  };

  const ensureRuntimeTrafficMode = async (trafficMode) => {
    const want = trafficMode == 'tun';
    try {
      const info = await buildControllerInfo({ fresh: true });
      const current = await readCoreTunEnabled(info);
      if (current === null) return false;
      if (current === want) return true;
      const patched = await callMihomoApi(
        '/configs',
        'PATCH',
        JSON.stringify({ tun: tunRuntimePayload(want) }),
        info,
        10,
      );
      if (!patched.success) {
        return false;
      }
      const verified = await readCoreTunEnabled(info);
      if (verified !== want) {
        return false;
      }
      await appendTemplateFlowDebug(`runtime tun converged want=${want ? '1' : '0'}`);
      return true;
    } catch (e) {
      console.error('ensure runtime traffic mode failed', e);
      return false;
    }
  };

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

  const readProviderNamesFromCurrentConfig = async () => {
    const res = await runShellWithRoot(`
        CONFIG=${shellQuote(CLASH_CONFIG)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        [ -s "$CONFIG" ] || exit 0
        if [ -x "$YQ" ]; then
          "$YQ" e -r '(."proxy-providers" // {}) | keys | .[]' "$CONFIG" 2>/dev/null | sed 's/^/PROXY_PROVIDER=/'
          "$YQ" e -r '(."rule-providers" // {}) | keys | .[]' "$CONFIG" 2>/dev/null | sed 's/^/RULE_PROVIDER=/'
        else
          timeout 5s sed 's/^/__CONFIG_LINE__=/' "$CONFIG"
        fi
        `, 10 * 1000);
    const proxyProviders = [];
    const ruleProviders = [];
    const configLines = [];
    String(res.content || '').split('\n').forEach((line) => {
      if (line.startsWith('PROXY_PROVIDER=')) proxyProviders.push(line.replace(/^PROXY_PROVIDER=/, '').trim());
      if (line.startsWith('RULE_PROVIDER=')) ruleProviders.push(line.replace(/^RULE_PROVIDER=/, '').trim());
      if (line.startsWith('__CONFIG_LINE__=')) configLines.push(line.replace(/^__CONFIG_LINE__=/, ''));
    });
    if (configLines.length > 0) {
      const fallback = parseProviderNamesFromYamlText(configLines.join('\n'));
      proxyProviders.push(...fallback.proxyProviders);
      ruleProviders.push(...fallback.ruleProviders);
    }
    return {
      proxyProviders: [...new Set(proxyProviders.filter(Boolean))],
      ruleProviders: [...new Set(ruleProviders.filter(Boolean))],
    };
  };

  const classifyProviderUpdateError = (rawError = '', statusCode = 0) => {
    const raw = String(rawError || '');
    const lower = raw.toLowerCase();
    const embeddedStatus = Number((raw.match(/(?:status(?: code)?|http)[^0-9]{0,8}(\d{3})/i) || [])[1] || 0);
    const status = embeddedStatus || Number(statusCode) || 0;
    if (status == 401 || status == 403 || /(?:unauthorized|forbidden|token[^\n]*(?:invalid|expired))/.test(lower)) {
      return { type: 'api_auth', message: `Mihomo 控制 API 鉴权失败${status ? `（HTTP ${status}）` : ''}`, retryable: false };
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
        message: '订阅服务器拒绝 Mihomo HTTP Provider 请求（HTTP 390）',
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
      const providers = parsed && parsed.providers && typeof parsed.providers == 'object' ? parsed.providers : {};
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

  const waitForProviderApiReady = async (providerNames = [], tries = 12, delayMs = 750) => {
    const targets = [...new Set((providerNames || []).filter(Boolean))];
    const controllerInfo = await buildControllerInfo();
    let lastResponse = null;
    let snapshot = null;
    for (let attempt = 1; attempt <= tries; attempt++) {
      const pid = await getCorePid();
      if (pid || attempt % 3 == 0 || attempt == tries) {
        lastResponse = await callMihomoApi('/providers/proxies', 'GET', null, controllerInfo, 3, { corePid: pid });
        snapshot = lastResponse.success ? parseProviderApiSnapshot(lastResponse.responseText) : null;
        if (snapshot && targets.every((name) => Object.prototype.hasOwnProperty.call(snapshot, name))) {
          return { ok: true, controllerInfo, snapshot, response: lastResponse };
        }
      }
      if (attempt < tries) await wait(delayMs);
    }
    return { ok: false, controllerInfo, snapshot, response: lastResponse };
  };

  const buildProviderUpdateResult = (providers = [], metadata = {}) => {
    const results = Array.isArray(providers) ? providers : [];
    const success = results.filter((item) => item.ok).length;
    const total = results.length;
    return { ...metadata, total, success, failed: total - success, providers: results, okCount: success, results };
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

  const forceUpdateProvidersFromConfig = async ({ showToast = false, providerNames = null } = {}) => {
    const names = await readProviderNamesFromCurrentConfig();
    const configuredNames = names.proxyProviders;
    const requestedNames = Array.isArray(providerNames)
      ? [...new Set(providerNames.filter((name) => configuredNames.includes(name)))]
      : configuredNames;
    if (requestedNames.length == 0) {
      const emptyResult = buildProviderUpdateResult([]);
      if (showToast) createToast('当前配置没有需要更新的节点来源。', 'yellow', 5000);
      return emptyResult;
    }

    const runtime = await checkInstallState({ fresh: true });
    if (!runtime.corePid) {
      const runtimeMessage = runtime.state == 'damaged'
        ? '未执行：运行组件预检失败'
        : '未执行：核心未运行';
      const notRunResult = buildProviderUpdateResult(requestedNames.map((name) => ({
        type: 'proxy-provider',
        name,
        ok: false,
        attempts: 0,
        statusCode: null,
        errorType: runtime.state == 'damaged' ? 'not_run_runtime_damaged' : 'not_run_core_stopped',
        message: runtimeMessage,
        rawMessage: runtime.content || runtime.message || '',
        urlMasked: '',
        proxyCount: null,
        cacheAvailable: false,
      })), {
        controllerInfo: null,
        apiStatusCode: 0,
        apiErrorType: runtime.state == 'damaged' ? 'runtime_damaged' : 'core_not_running',
        notRunReason: runtimeMessage,
        runtimeState: runtime.state,
      });
      if (showToast) createToast(runtimeMessage, 'yellow', 7000);
      return notRunResult;
    }

    const readiness = await waitForProviderApiReady(requestedNames);
    if (!readiness.ok) {
      const rawMessage = sanitizeSubscriptionSecrets(
        readiness.response && (readiness.response.responseText || readiness.response.content) || '',
      );
      const snapshot = readiness.snapshot || {};
      const results = requestedNames.map((name) => {
        const providerMissing = Object.keys(snapshot).length > 0 && !Object.prototype.hasOwnProperty.call(snapshot, name);
        const classified = providerMissing
          ? { type: 'provider_missing', message: '运行配置中未找到该节点来源' }
          : {
            type: readiness.response && readiness.response.errorType || 'api_unavailable',
            message: readiness.response && readiness.response.message || 'Mihomo 控制 API 暂不可用',
          };
        return {
          type: 'proxy-provider', name, ok: false, attempts: 0,
          statusCode: readiness.response && readiness.response.statusCode || null,
          errorType: classified.type, message: classified.message, rawMessage, urlMasked: '',
          proxyCount: snapshot[name] ? snapshot[name].proxyCount : null,
          cacheAvailable: !!(snapshot[name] && snapshot[name].proxyCount > 0),
        };
      });
      for (const item of results) {
        await appendTemplateFlowDebug(`provider_update_final name=${item.name} result=failed type=${item.errorType} attempts=0`);
      }
      const unavailableResult = buildProviderUpdateResult(results, {
        controllerInfo: readiness.controllerInfo,
        apiStatusCode: readiness.response && readiness.response.statusCode || 0,
        apiErrorType: readiness.response && readiness.response.errorType || 'api_unavailable',
      });
      if (showToast) createToast(`节点来源更新失败：${escapeHtml(results[0].message)}`, 'red', 7000);
      return unavailableResult;
    }

    const results = [];
    for (const name of requestedNames) {
      let finalItem = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        await appendTemplateFlowDebug(`provider_update_start name=${name} attempt=${attempt}`);
        const res = await callMihomoApi(`/providers/proxies/${encodeURIComponent(name)}`, 'PUT', null, readiness.controllerInfo, 12);
        if (res.success) {
          finalItem = {
            type: 'proxy-provider', name, ok: true, attempts: attempt, statusCode: res.statusCode || null,
            errorType: '', message: '', rawMessage: '', urlMasked: '', via: 'mihomo',
          };
          await appendTemplateFlowDebug(`provider_update_final name=${name} result=success attempts=${attempt}`);
          break;
        }

        const originalRaw = String(res.responseText || res.content || '');
        const rawMessage = sanitizeSubscriptionSecrets(originalRaw);
        const classified = classifyProviderUpdateError(originalRaw, res.statusCode);
        const rawUrl = (originalRaw.match(/https?:\/\/[^\s"'<>)}\]]+/i) || [])[0] || '';
        finalItem = {
          type: 'proxy-provider', name, ok: false, attempts: attempt, statusCode: res.statusCode || null,
          errorType: classified.type, message: classified.message, rawMessage,
          urlMasked: rawUrl ? maskSubscriptionUrl(rawUrl) : '', via: '',
        };
        await appendTemplateFlowDebug(`provider_update_failed name=${name} type=${classified.type} attempt=${attempt}`);
        if (!classified.retryable || attempt >= 3) break;
        const delayMs = attempt * 1000;
        await appendTemplateFlowDebug(`provider_update_retry name=${name} next_attempt=${attempt + 1} delay_ms=${delayMs}`);
        createToast(`正在重试 ${escapeHtml(name)}（${attempt + 1}/3）`, 'yellow', delayMs + 1200);
        await wait(delayMs);
      }

      if (!finalItem.ok) {
        await appendTemplateFlowDebug(`provider_update_final name=${name} result=failed type=${finalItem.errorType} attempts=${finalItem.attempts}`);
      }
      results.push(finalItem);
    }

    const currentSnapshot = await callMihomoApi('/providers/proxies', 'GET', null, readiness.controllerInfo, 3);
    const parsedSnapshot = currentSnapshot.success ? parseProviderApiSnapshot(currentSnapshot.responseText) : null;
    results.forEach((item) => {
      const providerState = parsedSnapshot && parsedSnapshot[item.name] || readiness.snapshot[item.name] || null;
      item.proxyCount = providerState ? providerState.proxyCount : null;
      item.updatedAt = providerState ? providerState.updatedAt : '';
      item.cacheAvailable = !!(providerState && providerState.proxyCount > 0);
    });

    const providerUpdateResult = buildProviderUpdateResult(results, {
      controllerInfo: readiness.controllerInfo,
      apiStatusCode: readiness.response && readiness.response.statusCode || 200,
    });
    if (showToast) {
      const firstFailed = results.find((item) => !item.ok);
      createToast(
        firstFailed
          ? `${escapeHtml(firstFailed.name)} 更新失败：${escapeHtml(firstFailed.message)}`
          : `节点来源更新成功：${providerUpdateResult.success}/${providerUpdateResult.total}`,
        firstFailed ? 'yellow' : 'green',
        7000,
      );
    }
    return providerUpdateResult;
  };

  const ensureLocalSubscriptionConverter = async () => {
    const probe = await probeBinaryHelperState();
    if (probe.state != 'installed') {
      if (!(await installBinaryHelperPreferred({ preferGitee: probe.state != 'missing' }))) return false;
      const installed = await probeBinaryHelperState();
      if (installed.state != 'installed') return false;
    }
    const permission = await runShellWithRoot(`
      CONVERTER=${shellQuote(KANO_HELPER_CONVERTER_PATH)}
      if [ -s "$CONVERTER" ]; then
        chmod 700 "$CONVERTER" || exit 1
        [ -x "$CONVERTER" ] || exit 1
        echo CONVERTER_READY
      else
        exit 2
      fi
    `, 10 * 1000);
    if (permission.success && String(permission.content || '').includes('CONVERTER_READY')) return true;

    const archive = await downloadCoreArchive({ allowCached: true });
    if (!archive.ok) {
      await appendTemplateFlowDebug(`local_converter_repair archive_failed stage=${archive.stage || 'unknown'}`);
      return true;
    }
    const repaired = await runDangerousShellWithRoot(`
      set -e
      ZIP=${shellQuote(DOWNLOAD_ZIP)}
      TARGET=${shellQuote(KANO_HELPER_CONVERTER_PATH)}
      STAGE="$TARGET.kano_repair.$$"
      trap 'rm -f "$STAGE" 2>/dev/null || true' EXIT
      entry="$(unzip -Z1 "$ZIP" 2>/dev/null | awk '/(^|\/)Tools\/kano-f50-helper-converter$/ { print }')"
      [ "$(printf '%s\n' "$entry" | sed '/^$/d' | wc -l | tr -d ' ')" = '1' ] || {
        echo CONVERTER_ARCHIVE_ENTRY_INVALID
        exit 1
      }
      unzip -p "$ZIP" "$entry" > "$STAGE"
      [ -s "$STAGE" ] || exit 1
      chmod 700 "$STAGE"
      info="$("$STAGE" version 2>/dev/null)" || exit 1
      printf '%s' "$info" | grep -q '"ok":true' || exit 1
      printf '%s' "$info" | grep -q '"convert-subscription"' || exit 1
      mv -f "$STAGE" "$TARGET"
      trap - EXIT
      echo CONVERTER_REPAIRED
    `, 45 * 1000, 'repair_local_subscription_converter');
    await appendTemplateFlowDebug(`local_converter_repair result=${repaired.success ? 'success' : 'failed'}`);
    return true;
  };

  const convertSubscriptionsLocally = async (sources = []) => {
    const cleanSources = normalizeSubSourceList(sources);
    if (cleanSources.length == 0) return buildProviderUpdateResult([]);
    const sourceChecks = cleanSources.map((source) => validateLocalSubscriptionUrl(source.url));
    const blockedIndex = sourceChecks.findIndex((check) => !check.ok);
    if (blockedIndex >= 0) {
      return buildProviderUpdateResult(cleanSources.map((source, index) => ({
        type: 'proxy-provider',
        name: source.name,
        ok: false,
        attempts: 0,
        errorType: index == blockedIndex ? 'url_policy' : 'local_preflight_blocked',
        message: index == blockedIndex
          ? sourceChecks[index].message
          : '\u5176\u5b83\u8ba2\u9605\u5730\u5740\u672a\u901a\u8fc7\u5b89\u5168\u68c0\u67e5\uff0c\u672c\u6b21\u672c\u5730\u8f6c\u6362\u5df2\u53d6\u6d88',
        rawMessage: '',
        urlMasked: index == blockedIndex ? maskSubscriptionUrl(source.url) : '',
        proxyCount: null,
        cacheAvailable: false,
      })), { via: 'local', committed: false });
    }
    await loadProviderUserAgent();
    if (!(await ensureLocalSubscriptionConverter())) {
      const cacheProbe = await runShellWithRoot(cleanSources.map((source) => `
        [ -s ${shellQuote(`${CLASH_PROXY_DIR}/proxies/${source.name}.yaml`)} ] && echo ${shellQuote(source.name)} || true
      `).join('\n'), 10 * 1000);
      const cachedNames = new Set(String(cacheProbe.content || '').split('\n').map((line) => line.trim()).filter(Boolean));
      return buildProviderUpdateResult(cleanSources.map((source) => ({
        type: 'proxy-provider',
        name: source.name,
        ok: false,
        attempts: 0,
        errorType: 'converter_unavailable',
        message: '本地订阅转换器不可用',
        rawMessage: '',
        urlMasked: '',
        proxyCount: null,
        cacheAvailable: cachedNames.has(source.name),
      })), { via: 'local' });
    }

    const localFetchUserAgents = [...new Set([
      currentProviderUserAgent,
      'ClashMetaForAndroid/2.11.15.Meta',
      'clash.meta',
      'ClashMeta',
      'mihomo/1.19.29',
      'mihomo',
      'Clash Verge Rev',
      'ClashforWindows/0.20.39',
      'clash',
      'v2rayN/7.15.7',
      'v2rayN',
      'Stash',
      'Shadowrocket',
      'clash.meta',
    ].map((value) => String(value || '').trim()).filter(Boolean))];
    const localFetchUserAgentShell = localFetchUserAgents.map((value) => shellQuote(value)).join(' ');
    const txName = `.kano_local_subscription_${Date.now()}_${createRandomString(6)}`;
    const txDir = `${CLASH_PROXY_DIR}/proxies/${txName}`;
    const cacheProbeCommands = cleanSources.map((source) => {
      const target = `${CLASH_PROXY_DIR}/proxies/${source.name}.yaml`;
      return `
        if [ -s ${shellQuote(target)} ]; then
          echo ${shellQuote(`LOCAL_CACHE_STATE=${source.name}|1`)}
        else
          echo ${shellQuote(`LOCAL_CACHE_STATE=${source.name}|0`)}
        fi
      `;
    }).join('\n');
    const downloadCommands = cleanSources.map((source, index) => {
      const rawPath = `$TX/raw_${index + 1}`;
      const outputPath = `$TX/${source.name}.yaml`;
      const sourceCheck = sourceChecks[index];
      return `
        candidate_ok=0
        last_http=000
        last_ua=''
        last_kind=unknown
        last_convert=''
        last_stage=download
        raw_tmp="${rawPath}.tmp"
        out_tmp="${outputPath}.tmp"
        err_tmp="${rawPath}.err"
        conv_err="${rawPath}.convert.err"
        source_host=${shellQuote(sourceCheck.hostname)}
        source_port=${shellQuote(sourceCheck.port)}
        source_family=${shellQuote(sourceCheck.addressFamily)}
        rm -f "$raw_tmp" "$out_tmp" "$err_tmp" "$conv_err" 2>/dev/null || true
        resolved_target="$(resolve_public_address "$source_host" "$source_family")" || {
          echo ${shellQuote(`LOCAL_CONVERT_FAILED=${source.name}|resolve|000|blocked_target|subscription host has no usable public IP address`)}
          exit 22
        }
        resolved_family="${'$'}{resolved_target%%|*}"
        resolved_ip="${'$'}{resolved_target#*|}"
        resolve_host="$source_host"
        [ "$resolved_family" = ipv6 ] && [ "$source_family" = ipv6 ] && resolve_host="[$source_host]"
        resolve_spec="$resolve_host:$source_port:$resolved_ip"
        [ "$resolved_family" = ipv6 ] && resolve_spec="$resolve_host:$source_port:[$resolved_ip]"
        classify_candidate() {
          FILE="$1"
          first="$(head -c 384 "$FILE" 2>/dev/null | tr '\\r\\n\\t' '   ')"
          if printf '%s' "$first" | grep -Eiq '<!doctype|<html|<head|<body'; then echo html; return; fi
          case "$(printf '%s' "$first" | sed 's/^[[:space:]]*//' | cut -c1)" in
            \\{|\\[) echo json; return ;;
          esac
          grep -Eq '^[[:space:]]*proxies[[:space:]]*:' "$FILE" 2>/dev/null && { echo yaml; return; }
          grep -Eq '^[[:space:]]*(vmess|vless|trojan|ss|ssr|hysteria2|hy2|tuic)://' "$FILE" 2>/dev/null && { echo share-links; return; }
          if head -c 2048 "$FILE" 2>/dev/null | tr -d '\\r\\n\\t ' | grep -Eq '^[A-Za-z0-9_+/-]{32,}={0,2}$'; then echo base64-or-token; return; fi
          echo text-or-binary
        }
        for LOCAL_UA in ${localFetchUserAgentShell}; do
          rm -f "$raw_tmp" "$out_tmp" "$err_tmp" "$conv_err" 2>/dev/null || true
          last_stage=download
          last_convert=''
          if http_code="$("$CURL_BIN" -sS --proto '=https' --max-redirs 0 \
            --max-filesize ${LOCAL_SUBSCRIPTION_MAX_FILE_BYTES} \
            --resolve "$resolve_spec" \
            --connect-timeout 10 --max-time 90 --retry 1 --retry-delay 1 \
            -H 'Accept: application/yaml, text/yaml, application/x-yaml, text/plain, application/json, */*' \
            -A "$LOCAL_UA" -o "$raw_tmp" -w '%{http_code}' ${shellQuote(source.url)} 2>"$err_tmp")"; then
            curl_rc=0
          else
            curl_rc=$?
          fi
          last_http="\${http_code:-000}"
          last_ua="$LOCAL_UA"
          if [ "$curl_rc" -eq 63 ]; then
            last_stage=download_limit
            last_kind=too-large
            last_convert="subscription exceeds ${LOCAL_SUBSCRIPTION_MAX_FILE_BYTES} bytes"
            break
          fi
          case "$http_code" in
            2??)
              if [ "$curl_rc" -eq 0 ] && [ -s "$raw_tmp" ]; then
                raw_bytes="$(wc -c < "$raw_tmp" 2>/dev/null || echo 0)"
                if ! echo "$raw_bytes" | grep -Eq '^[0-9]+$' || [ "$raw_bytes" -gt ${LOCAL_SUBSCRIPTION_MAX_FILE_BYTES} ]; then
                  last_stage=download_limit
                  last_kind=too-large
                  last_convert="subscription exceeds ${LOCAL_SUBSCRIPTION_MAX_FILE_BYTES} bytes"
                  break
                fi
                last_kind="$(classify_candidate "$raw_tmp")"
                last_stage=convert
                if CONVERT_JSON="$("$HELPER" convert-subscription --input "$raw_tmp" --output "$out_tmp" 2>"$conv_err")"; then
                  convert_rc=0
                else
                  convert_rc=$?
                fi
                if [ "$convert_rc" -eq 0 ] && printf '%s' "$CONVERT_JSON" | grep -q '"ok":true' && [ -s "$out_tmp" ]; then
                  out_bytes="$(wc -c < "$out_tmp" 2>/dev/null || echo 0)"
                  if ! echo "$out_bytes" | grep -Eq '^[0-9]+$' || [ "$out_bytes" -gt ${LOCAL_SUBSCRIPTION_MAX_FILE_BYTES} ]; then
                    last_stage=download_limit
                    last_kind=converted-output-too-large
                    last_convert="converted provider exceeds ${LOCAL_SUBSCRIPTION_MAX_FILE_BYTES} bytes"
                    break
                  fi
                  next_total=$((LOCAL_TOTAL_BYTES + raw_bytes + out_bytes))
                  if [ "$next_total" -gt ${LOCAL_SUBSCRIPTION_TOTAL_BYTES} ]; then
                    last_stage=download_limit
                    last_kind=total-quota
                    last_convert="local conversion exceeds ${LOCAL_SUBSCRIPTION_TOTAL_BYTES} bytes total"
                    break
                  fi
                  LOCAL_TOTAL_BYTES="$next_total"
                  mv -f "$raw_tmp" "${rawPath}"
                  mv -f "$out_tmp" "${outputPath}"
                  candidate_ok=1
                  proxy_count="$(printf '%s' "$CONVERT_JSON" | sed -n 's/.*"proxyCount":\\([0-9][0-9]*\\).*/\\1/p')"
                  convert_format="$(printf '%s' "$CONVERT_JSON" | sed -n 's/.*"format":"\\([^"]*\\)".*/\\1/p')"
                  echo ${shellQuote(`LOCAL_FETCH_OK=${source.name}|`)}"$http_code|$LOCAL_UA|$last_kind"
                  echo ${shellQuote(`LOCAL_CONVERT_OK=${source.name}|`)}"$proxy_count|$convert_format"
                  break
                fi
                last_convert="$(printf '%s' "$CONVERT_JSON" | tr '\\r\\n' '  ' | cut -c1-260)"
                [ -n "$last_convert" ] || last_convert="$(tail -n 2 "$conv_err" 2>/dev/null | tr '\\r\\n' '  ' | cut -c1-260)"
              fi
              ;;
          esac
          if [ "$last_stage" = 'download' ]; then
            last_convert="$(tail -n 2 "$err_tmp" 2>/dev/null | tr '\\r\\n' '  ' | cut -c1-260)"
          fi
        done
        rm -f "$raw_tmp" "$out_tmp" "$err_tmp" "$conv_err" 2>/dev/null || true
        if [ "$candidate_ok" != '1' ]; then
          [ -n "$last_convert" ] || last_convert='no usable subscription response'
          echo ${shellQuote(`LOCAL_CONVERT_FAILED=${source.name}|`)}"$last_stage|$last_http|$last_kind|$last_convert"
          exit 22
        fi
      `;
    }).join('\n');
    const snapshotCommands = cleanSources.map((source) => {
      const target = `${CLASH_PROXY_DIR}/proxies/${source.name}.yaml`;
      return `
        if [ -f ${shellQuote(target)} ]; then
          cp ${shellQuote(target)} "$TX/old_${source.name}.yaml"
          touch "$TX/old_${source.name}.had"
        else
          touch "$TX/old_${source.name}.absent"
        fi
        cp "$TX/${source.name}.yaml" ${shellQuote(`${target}.kano_new`)}
        chmod 600 ${shellQuote(`${target}.kano_new`)}
      `;
    }).join('\n');
    const restoreCommands = cleanSources.map((source) => {
      const target = `${CLASH_PROXY_DIR}/proxies/${source.name}.yaml`;
      return `
        if [ -f "$TX/old_${source.name}.had" ]; then
          cp "$TX/old_${source.name}.yaml" ${shellQuote(target)} 2>/dev/null || true
        elif [ -f "$TX/old_${source.name}.absent" ]; then
          rm -f ${shellQuote(target)} 2>/dev/null || true
        fi
        rm -f ${shellQuote(`${target}.kano_new`)} 2>/dev/null || true
      `;
    }).join('\n');
    const commitCommands = cleanSources.map((source) => {
      const target = `${CLASH_PROXY_DIR}/proxies/${source.name}.yaml`;
      return `mv -f ${shellQuote(`${target}.kano_new`)} ${shellQuote(target)}`;
    }).join('\n');

    const res = await runDangerousShellWithRoot(`
        set -e
        TX=${shellQuote(txDir)}
        HELPER=${shellQuote(KANO_HELPER_PATH)}
        committing=0
        LOCAL_TOTAL_BYTES=0
        umask 077
        is_public_ipv4() {
          printf '%s\n' "$1" | awk -F. '
            NF != 4 { exit 1 }
            {
              for (i = 1; i <= 4; i++) if ($i !~ /^[0-9]+$/ || $i < 0 || $i > 255) exit 1
              if ($1 == 0 || $1 == 10 || $1 == 127 || $1 >= 224) exit 1
              if ($1 == 100 && $2 >= 64 && $2 <= 127) exit 1
              if ($1 == 169 && $2 == 254) exit 1
              if ($1 == 172 && $2 >= 16 && $2 <= 31) exit 1
              if ($1 == 192 && $2 == 0 && ($3 == 0 || $3 == 2)) exit 1
              if ($1 == 192 && $2 == 168) exit 1
              if ($1 == 198 && ($2 == 18 || $2 == 19)) exit 1
              if ($1 == 198 && $2 == 51 && $3 == 100) exit 1
              if ($1 == 203 && $2 == 0 && $3 == 113) exit 1
              exit 0
            }
          '
        }
        is_public_ipv6() {
          candidate_ipv6="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
          case "$candidate_ipv6" in
            ''|*.*|*[!0-9a-f:]*|::|::1|fc*|fd*|fe8*|fe9*|fea*|feb*|ff*|2001:db8:*) return 1 ;;
          esac
          printf '%s\n' "$candidate_ipv6" | awk -F: '
            NF < 3 || NF > 8 { exit 1 }
            {
              for (i = 1; i <= NF; i++) if (length($i) > 4) exit 1
              exit 0
            }
          '
        }
        resolve_public_address() {
          resolve_host="$1"
          requested_family="$2"
          candidates=''
          case "$resolve_host" in
            *:*) candidates="$resolve_host" ;;
            *[!0-9.]*|'') ;;
            *) candidates="$resolve_host" ;;
          esac
          if [ -z "$candidates" ] && command -v getent >/dev/null 2>&1; then
            [ "$requested_family" = ipv6 ] || candidates="$(getent ahostsv4 "$resolve_host" 2>/dev/null | awk '{print $1}' | sort -u)"
            [ -n "$candidates" ] || candidates="$(getent ahostsv6 "$resolve_host" 2>/dev/null | awk '{print $1}' | sort -u)"
            [ -n "$candidates" ] || candidates="$(getent hosts "$resolve_host" 2>/dev/null | awk '{print $1}' | sort -u)"
          fi
          if [ -z "$candidates" ] && [ "$requested_family" != ipv6 ] && command -v ping >/dev/null 2>&1; then
            candidates="$(LC_ALL=C ping -c 1 -W 2 "$resolve_host" 2>&1 | awk 'NR == 1 {
              for (i = 1; i <= NF; i++) if ($i ~ /^[(][0-9][0-9.]*[)]$/) {
                gsub(/[()]/, "", $i); print $i; exit
              }
            }')"
          fi
          if [ -z "$candidates" ] && command -v ping6 >/dev/null 2>&1; then
            candidates="$(LC_ALL=C ping6 -c 1 -W 2 "$resolve_host" 2>&1 | awk 'NR == 1 {
              for (i = 1; i <= NF; i++) if ($i ~ /^[(][0-9A-Fa-f:]+[)]$/) {
                gsub(/[()]/, "", $i); print $i; exit
              }
            }')"
          fi
          if [ -z "$candidates" ] && command -v ping >/dev/null 2>&1; then
            candidates="$(LC_ALL=C ping -6 -c 1 -W 2 "$resolve_host" 2>&1 | awk 'NR == 1 {
              for (i = 1; i <= NF; i++) if ($i ~ /^[(][0-9A-Fa-f:]+[)]$/) {
                gsub(/[()]/, "", $i); print $i; exit
              }
            }')"
          fi
          for candidate_ip in $candidates; do
            if [ "$requested_family" != ipv6 ] && is_public_ipv4 "$candidate_ip"; then
              printf 'ipv4|%s\n' "$candidate_ip"
              return 0
            fi
            if is_public_ipv6 "$candidate_ip"; then
              printf 'ipv6|%s\n' "$candidate_ip"
              return 0
            fi
          done
          return 1
        }
        cleanup_local_conversion() {
          rc=$?
          if [ "$committing" = 1 ]; then
            ${restoreCommands}
          fi
          rm -rf "$TX" 2>/dev/null || true
          trap - EXIT
          exit "$rc"
        }
        trap cleanup_local_conversion EXIT
        mkdir -p "$TX" ${shellQuote(`${CLASH_PROXY_DIR}/proxies`)}
        ${cacheProbeCommands}
        ${getCurlBinCmd()}
        ${downloadCommands}
        ${snapshotCommands}
        committing=1
        ${commitCommands}
        committing=0
        echo "LOCAL_CONVERT_COMMITTED=${cleanSources.length}"
      `, Math.max(120, cleanSources.length * 100) * 1000, 'convert_subscriptions_locally');

    const lines = String(res.content || '').split('\n').map((line) => line.trim()).filter(Boolean);
    const converted = new Map();
    const existingCache = new Map();
    lines.filter((line) => line.startsWith('LOCAL_CACHE_STATE=')).forEach((line) => {
      const [name, available] = line.replace(/^LOCAL_CACHE_STATE=/, '').split('|');
      existingCache.set(name, available == '1');
    });
    lines.filter((line) => line.startsWith('LOCAL_CONVERT_OK=')).forEach((line) => {
      const [name, count, format] = line.replace(/^LOCAL_CONVERT_OK=/, '').split('|');
      converted.set(name, { count: Number(count) || 0, format: format || '' });
    });
    const failedLine = lines.find((line) => line.startsWith('LOCAL_CONVERT_FAILED='));
    const [failedName, failedStage, failedHttp, failedKind, ...failedDetailParts] = failedLine
      ? failedLine.replace(/^LOCAL_CONVERT_FAILED=/, '').split('|')
      : ['', '', '', '', ''];
    const failedDetail = failedDetailParts.join('|').trim();
    const committed = !!res.success && lines.includes(`LOCAL_CONVERT_COMMITTED=${cleanSources.length}`);
    const providers = cleanSources.map((source) => {
      const item = converted.get(source.name);
      const ok = committed && !!item;
      const message = ok
        ? ''
        : source.name == failedName
          ? (failedStage == 'resolve'
            ? '订阅主机未解析到公网 IPv4 地址，已拒绝本地访问'
            : failedStage == 'download_limit'
              ? '订阅响应超过本地转换的文件或总配额'
              : (failedStage == 'download'
                ? `订阅下载失败${failedHttp && failedHttp != '000' ? `（HTTP ${failedHttp}）` : ''}`
                : `订阅响应无法转换${failedHttp && failedHttp != '000' ? `（HTTP ${failedHttp}）` : ''}${failedKind ? `，响应类型 ${failedKind}` : ''}`))
          : '本次本地转换未提交，继续保留原节点缓存';
      return {
        type: 'proxy-provider',
        name: source.name,
        ok,
        attempts: 1,
        errorType: ok ? '' : (failedStage || 'local_commit_failed'),
        message,
        rawMessage: source.name == failedName ? sanitizeSubscriptionSecrets(failedDetail || '') : '',
        urlMasked: source.name == failedName ? maskSubscriptionUrl(source.url) : '',
        proxyCount: ok && item ? item.count : null,
        cacheAvailable: ok || existingCache.get(source.name) === true,
        format: item ? item.format : '',
        via: 'local',
      };
    });
    return buildProviderUpdateResult(providers, { via: 'local', committed });
  };

  const readCurrentModeStatus = async () => {
    const res = await runShellWithRoot(`
        set +e
        CONFIG=${shellQuote(CLASH_CONFIG)}
        SOURCE_FILE=${shellQuote(CLASH_CONFIG_SOURCE_FILE)}
        CHECK=${shellQuote(KANO_SUBSCRIPTION_MODE_CHECK)}
        WRITE_CHECK=${shellQuote(KANO_TEMPLATE_WRITE_CHECK)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        mode=${shellQuote(SUB_RULE_MODE_TEMPLATE)}
        config_source="$(grep -m 1 '^KANO_CONFIG_SOURCE=' "$SOURCE_FILE" 2>/dev/null | sed 's/^KANO_CONFIG_SOURCE=//' | tr -d '\r')"
        [ -n "$config_source" ] || config_source="unknown"
        config_source_time="$(grep -m 1 '^KANO_CONFIG_SOURCE_TIME=' "$SOURCE_FILE" 2>/dev/null | sed 's/^KANO_CONFIG_SOURCE_TIME=//' | tr -d '\r')"
        config_read_status=missing
        rules_count=
        proxy_groups_count=
        proxy_providers_count=
        if [ -s "$CONFIG" ]; then
          if [ -x "$YQ" ]; then
            if counts="$("$YQ" e '[((.rules // []) | length), ((."proxy-groups" // []) | length), ((."proxy-providers" // {}) | length)] | join(" ")' "$CONFIG" 2>/dev/null)"; then
              set -- $counts
              if [ "$#" -eq 3 ]; then
                config_read_status=yq
                rules_count="$1"
                proxy_groups_count="$2"
                proxy_providers_count="$3"
              else
                config_read_status=invalid
              fi
            else
              config_read_status=invalid
            fi
          else
            config_read_status=text
            rules_count="$(awk '
              BEGIN { in_block=0; c=0 }
              /^[^[:space:]#][^:]*[[:space:]]*:/ { in_block=0 }
              /^[[:space:]]*rules[[:space:]]*:/ { in_block=1; next }
              in_block && /^[[:space:]]*-[[:space:]]*/ { c++ }
              END { print c+0 }
            ' "$CONFIG" 2>/dev/null)"
            proxy_groups_count="$(awk '
              BEGIN { in_block=0; c=0 }
              /^[^[:space:]#][^:]*[[:space:]]*:/ { in_block=0 }
              /^[[:space:]]*proxy-groups[[:space:]]*:/ { in_block=1; next }
              in_block && /^[[:space:]]*-[[:space:]]*name[[:space:]]*:/ { c++ }
              END { print c+0 }
            ' "$CONFIG" 2>/dev/null)"
            proxy_providers_count="$(awk '
              BEGIN { in_block=0; c=0 }
              /^[^[:space:]#][^:]*[[:space:]]*:/ { in_block=0 }
              /^[[:space:]]*proxy-providers[[:space:]]*:/ { in_block=1; next }
              in_block && /^[[:space:]]{2,}[A-Za-z0-9_.-]+[[:space:]]*:/ { c++ }
              END { print c+0 }
            ' "$CONFIG" 2>/dev/null)"
          fi
        fi
        for vname in rules_count proxy_groups_count proxy_providers_count; do
          eval "v=\$$vname"
          case "$v" in ''|*[!0-9]*) eval "$vname=";; esac
        done
        last_write_time="$config_source_time"
        if [ -z "$last_write_time" ] && [ -s "$CONFIG" ]; then
          last_write_time="$(stat -c %y "$CONFIG" 2>/dev/null | cut -d. -f1)"
        fi
        [ -n "$last_write_time" ] || last_write_time="unknown"
        last_result="$(grep -m 1 '^result=' "$CHECK" 2>/dev/null | tail -n 1 | sed 's/^result=//' | tr -d '\r')"
        [ -n "$last_result" ] || last_result="unknown"
        last_reason="$(grep -m 1 '^reason=' "$CHECK" 2>/dev/null | tail -n 1 | sed 's/^reason=//' | tr -d '\r')"
        failed_stage="$(grep -m 1 '^failed_step=' "$WRITE_CHECK" 2>/dev/null | sed 's/^failed_step=//' | tr -d '\r')"
        [ -n "$failed_stage" ] || failed_stage="$last_reason"
        echo "mode=$mode"
        echo "config_source=$config_source"
        echo "config_read_status=$config_read_status"
        echo "rules_count=$rules_count"
        echo "proxy_groups_count=$proxy_groups_count"
        echo "proxy_providers_count=$proxy_providers_count"
        echo "last_write_time=$last_write_time"
        echo "last_result=$last_result"
        echo "last_reason=$last_reason"
        echo "failed_stage=$failed_stage"
        `, 12 * 1000);
    const lines = String(res.content || '').split('\n');
    const pick = (key, fallback = '') => ((lines.find((line) => line.startsWith(`${key}=`)) || `${key}=${fallback}`).replace(new RegExp(`^${key}=`), '').trim());
    const pickCount = (key) => {
      const value = pick(key, '');
      return /^[0-9]+$/.test(value) ? Number(value) : null;
    };
    return {
      mode: normalizeSubRuleModeValue(pick('mode', SUB_RULE_MODE_TEMPLATE)),
      configSource: pick('config_source', 'unknown'),
      configReadStatus: pick('config_read_status', 'missing'),
      rulesCount: pickCount('rules_count'),
      proxyGroupsCount: pickCount('proxy_groups_count'),
      proxyProvidersCount: pickCount('proxy_providers_count'),
      lastWriteTime: pick('last_write_time', 'unknown'),
      lastResult: pick('last_result', 'unknown'),
      lastReason: pick('last_reason', ''),
      failedStage: pick('failed_stage', ''),
    };
  };

  const refreshRuleModeStatus = async () => {
    const el = document.querySelector('#mm_rule_mode_status');
    if (!el) return null;
    const status = await readCurrentModeStatus();
    const configLabel = status.configReadStatus == 'missing'
      ? '\u8fd0\u884c\u914d\u7f6e\u672a\u627e\u5230'
      : status.configReadStatus == 'invalid'
        ? '\u8fd0\u884c\u914d\u7f6e\u89e3\u6790\u5931\u8d25'
        : '\u8fd0\u884c\u914d\u7f6e\u5df2\u52a0\u8f7d';
    const parts = [
      '模板规则',
      configLabel,
      status.rulesCount != null ? `\u89c4\u5219 ${status.rulesCount}` : '',
      status.proxyGroupsCount != null ? `\u7b56\u7565\u7ec4 ${status.proxyGroupsCount}` : '',
      status.proxyProvidersCount != null ? `\u8282\u70b9\u6e90 ${status.proxyProvidersCount}` : '',
      status.failedStage ? `\u5931\u8d25\u9636\u6bb5\uff1a${status.failedStage}` : '',
    ].filter(Boolean);
    setText(el, parts.join(' · '));
    return status;
  };


  const waitForLanHost = async (tries = 20) => {
    for (let i = 0; i < tries; i++) {
      if (window.UFI_DATA && UFI_DATA.lan_ipaddr) return UFI_DATA.lan_ipaddr;
      await wait(100);
    }
    return (window.location && window.location.hostname) || '127.0.0.1';
  };

  const buildPanelUrl = async () => {
    const host = await waitForLanHost();
    try {
      const info = await buildControllerInfo();
      return `http://${host}:${info.port || '7788'}/ui/?t=${Date.now()}`;
    } catch (e) {
      console.error(e);
      return `http://${host}:7788/ui/?t=${Date.now()}`;
    }
  };

  const isMMRunning = async () => {
    const pid = await getCorePid();
    const running_mm = document.querySelector('#running_mm');
    let apiOk = false;
    if (pid) {
      const version = await callMihomoApi('/version', 'GET', null, null, 8, { corePid: pid });
      apiOk = !!version.success;
    }
    if (running_mm) {
      running_mm.textContent = apiOk
        ? '\u732b\u732b - \u{1f7e2}API\u6b63\u5e38'
        : (pid ? '\u732b\u732b - \u{1f7e1}\u8fdb\u7a0b\u8fd0\u884c/API\u672a\u901a' : '\u732b\u732b - \u{1f534}\u5df2\u505c\u6b62');
    }
    await refreshRuleModeStatus();
    await refreshModeBadge();
    return !!pid;
  };

  const askConfirm = (id, title, body, ok = '\u786e\u8ba4', cancel = '\u53d6\u6d88') => new Promise((resolve) => {
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
  const checkInstallState = async ({ fresh = false } = {}) => {
    if (!fresh && runtimePreflightCache && runtimePreflightCacheExpiresAt > Date.now()) {
      return runtimePreflightCache;
    }
    const state = await runtimePreflight();
    runtimePreflightCache = state;
    runtimePreflightCacheExpiresAt = Date.now() + 1500;
    return state;
  };

  //\u76d1\u6d4b\u662f\u5426\u5df2\u7ecf\u5b89\u88c5\u8fc7\u4e86
  const checkIsInstalled = async () => {
    const res = await runShellWithRoot(`
      if [ -s ${shellQuote(CLASH_SERVICE)} ]; then echo 1; else echo 0; fi
    `, 5000);
    return !!(res.success && String(res.content || '').trim().split(/\s+/).includes('1'));
  };

  const ensureInstalled = async () => {
    if (await checkIsInstalled()) {
      const wrapperResult = await ensureServiceWrapper();
      if (!wrapperResult.success) {
        createToast(`Clash.Service 启动保护修复失败<br>${safeTextToHtml(wrapperResult.content || '')}`, 'red', 9000);
        return false;
      }
      if (!(await migrateBootPolicyIntegration())) {
        createToast('开机绕过规则升级失败；当前操作继续，但重启后可能仍使用旧启动时序。', 'yellow', 9000);
      }
      return true;
    }
    let state = await checkInstallState({ fresh: true });
    if (!['not_installed', 'damaged'].includes(state.state)) return true;
    if (state.state == 'damaged' && state.repairable) {
      createToast(`检测到安装损坏，正在安全修复<br>${safeTextToHtml(state.message || state.content)}`, 'yellow', 8000);
      if (await selfHealDamagedInstall(state)) {
        state = await checkInstallState({ fresh: true });
        if (!['not_installed', 'damaged'].includes(state.state)) return true;
      }
      createToast('安装自愈失败，已取消当前操作', 'red', 10000);
      return false;
    }
    createToast(
      state.state == 'not_installed'
        ? '\u672a\u5b89\u88c5\u732b\u732b\uff0c\u8bf7\u5148\u5b89\u88c5'
        : `猫猫安装不可用<br>${safeTextToHtml(state.message || state.content)}`,
      'red',
      9000,
    );
    return false;
  };

  const ensureReady = async () =>
    (await ensureAdvanced()) && (await ensureInstalled());

  const flushGeneratedRulesCmd = () => `
        list_cleanup_ipt() {
          NAME="$1"
          {
            command -v "$NAME" 2>/dev/null || true
            command -v "\${NAME}-legacy" 2>/dev/null || true
            command -v "\${NAME}-nft" 2>/dev/null || true
            for BASE in /system/bin /system/xbin /vendor/bin /sbin; do
              for CANDIDATE in "$BASE/$NAME" "$BASE/\${NAME}-legacy" "$BASE/\${NAME}-nft"; do
                [ ! -x "$CANDIDATE" ] || echo "$CANDIDATE"
              done
            done
          } | awk 'NF && !seen[$0]++'
        }
        flush_one_chain() {
          IPT="$1"; TABLE="$2"; CHAIN="$3"
          for HOOK in PREROUTING OUTPUT FORWARD INPUT; do
            while "$IPT" -t "$TABLE" -D "$HOOK" -j "$CHAIN" 2>/dev/null; do :; done
          done
          "$IPT" -t "$TABLE" -F "$CHAIN" 2>/dev/null || true
          "$IPT" -t "$TABLE" -X "$CHAIN" 2>/dev/null || true
        }
        for BIN_NAME in iptables ip6tables; do
          for IPT in $(list_cleanup_ipt "$BIN_NAME"); do
            for TABLE in mangle nat filter; do
              for CHAIN in ${shellQuote(CLASH_MAC_BYPASS_CHAIN)} KANO_POLICY_PRE KANO_DNS_HIJACK KANO_QUIC_BLOCK; do
                flush_one_chain "$IPT" "$TABLE" "$CHAIN"
              done
            done
          done
        done
        `;

  const verifyGeneratedRulesFlushedCmd = () => `
        cleanup_bin_count=0
        cleanup_failed=0
        for BIN_NAME in iptables ip6tables; do
          for IPT in $(list_cleanup_ipt "$BIN_NAME"); do
            cleanup_bin_count=$((cleanup_bin_count + 1))
            for TABLE in mangle nat filter; do
              for CHAIN in ${shellQuote(CLASH_MAC_BYPASS_CHAIN)} KANO_POLICY_PRE KANO_DNS_HIJACK KANO_QUIC_BLOCK; do
                if "$IPT" -t "$TABLE" -S "$CHAIN" >/dev/null 2>&1; then
                  echo "RESCUE_CHAIN_REMAINS:$IPT:$TABLE:$CHAIN"
                  cleanup_failed=1
                fi
                for HOOK in PREROUTING OUTPUT FORWARD INPUT; do
                  if "$IPT" -t "$TABLE" -S "$HOOK" 2>/dev/null | grep -E -e "-j[[:space:]]+$CHAIN([[:space:]]|$)" >/dev/null 2>&1; then
                    echo "RESCUE_HOOK_REMAINS:$IPT:$TABLE:$HOOK:$CHAIN"
                    cleanup_failed=1
                  fi
                done
              done
            done
          done
        done
        if [ "$cleanup_bin_count" -eq 0 ]; then
          echo "RESCUE_CLEANUP_UNAVAILABLE:no iptables/ip6tables executable"
          cleanup_failed=1
        fi
        [ "$cleanup_failed" -eq 0 ]
        `;

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
        (pidof Clash.Core 2>/dev/null || pidof Clash 2>/dev/null || pidof mihomo 2>/dev/null || pgrep -f '/data/[c]lash|[C]lash.Core|[m]ihomo' 2>/dev/null || true) | awk 'NF{print "pid=" $0}'
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

  const networkRescue = async ({ stopService = true, showOutput = true, reason = '\u624b\u52a8\u6062\u590d' } = {}) => {
    createToast('\u6b63\u5728\u6062\u590d\u7f51\u7edc\u5e76\u6e05\u7406\u63d2\u4ef6\u89c4\u5219...', 'yellow');
    const stopFlag = stopService ? '1' : '0';
    const res = await runShellWithRoot(`
        set +e
        rescue_rc=0
        echo "[rescue] reason: ${shellQuote(reason)}"
        if [ ${shellQuote(stopFlag)} = '1' ] && [ -f ${shellQuote(CLASH_SERVICE)} ]; then
          echo "[rescue] stopping Clash.Service"
          ${shellQuote(CLASH_SERVICE)} stop 2>&1 || echo "RESCUE_STOP_COMMAND_FAILED"
        fi
        if [ ${shellQuote(stopFlag)} = '1' ]; then
          sleep 1
          core_pid="$(pidof Clash.Core 2>/dev/null || pidof Clash 2>/dev/null || pidof mihomo 2>/dev/null || pgrep -f '/data/[c]lash|[C]lash.Core|[m]ihomo' 2>/dev/null || true)"
          if [ -n "$core_pid" ]; then
            echo "RESCUE_CORE_STILL_RUNNING:$core_pid"
            rescue_rc=1
          fi
        fi
        echo "[rescue] flushing KANO chains"
        ${flushGeneratedRulesCmd()}
        ${verifyGeneratedRulesFlushedCmd()} || rescue_rc=1
        if [ "$rescue_rc" -eq 0 ]; then
          echo "[rescue] done"
        else
          echo "[rescue] incomplete"
        fi
        exit "$rescue_rc"
        `, 60 * 1000);
    await isMMRunning();
    if (showOutput) {
      showInfoDialog(
        'mm_network_rescue',
        res.success ? '\u7f51\u7edc\u6062\u590d\u5b8c\u6210' : '\u7f51\u7edc\u6062\u590d\u5931\u8d25',
        `<pre style="white-space:pre-wrap;background:rgba(0,0,0,.78);color:#0f0;padding:10px;max-height:420px;overflow:auto;">${escapeHtml(res.content || '\u5df2\u6267\u884c')}</pre>`,
      );
    }
    return res.success;
  };

  const startClashServiceClean = async ({ stopFirst = false, reason = '\u542f\u52a8' } = {}) => {
    const wrapperResult = await ensureServiceWrapper();
    if (!wrapperResult.success) {
      return {
        ...wrapperResult,
        success: false,
        content: `START_STATE=service_wrapper_failed\n${wrapperResult.content || ''}`,
      };
    }
    const result = await runShellWithRoot(`
      set +e
      SERVICE=${shellQuote(CLASH_SERVICE)}
      CORE=${shellQuote(CLASH_CORE)}
      CONFIG=${shellQuote(CLASH_CONFIG)}
      START_LOG=${shellQuote('/data/kano_clash_start.log')}
      CONFIG_TEST_LOG=${shellQuote('/data/kano_clash_config_test.log')}
      RUN_LOG=${shellQuote(LOG_FILE)}
      [ -s "$SERVICE" ] || { echo "START_STATE=not_installed"; exit 3; }
      [ -x "$SERVICE" ] || chmod 755 "$SERVICE" 2>/dev/null || { echo "START_STATE=service_not_executable"; exit 4; }
      [ -x "$CORE" ] || chmod 755 "$CORE" 2>/dev/null || { echo "START_STATE=core_not_executable"; exit 4; }
      [ -s "$CONFIG" ] || { echo "START_STATE=config_missing"; exit 6; }

      cleanup_stale_config_tests() {
        for p in /proc/[0-9]*; do
          [ -r "$p/cmdline" ] || continue
          PID="\${p##*/}"
          case "$PID" in ''|*[!0-9]*) continue ;; esac
          exe="$(readlink "$p/exe" 2>/dev/null)"
          case "$exe" in
            "$CORE"|*/Clash.Core|*/mihomo) ;;
            *) continue ;;
          esac
          cmdline="$(tr '\0' ' ' < "$p/cmdline" 2>/dev/null)"
          case " $cmdline " in
            *" -t "*|*" --test "*)
              echo "CLEAN_STALE_TEST_PID=$PID"
              kill "$PID" 2>/dev/null || true
              sleep 1
              [ ! -d "/proc/$PID" ] || kill -9 "$PID" 2>/dev/null || true
              ;;
          esac
        done
      }

      echo "START_REASON=${shellQuote(reason)}"
      cleanup_stale_config_tests
      if command -v timeout >/dev/null 2>&1; then
        (cd "$(dirname "$CONFIG")" && timeout 60 "$CORE" -t -f "$CONFIG") >"$CONFIG_TEST_LOG" 2>&1
      else
        (cd "$(dirname "$CONFIG")" && "$CORE" -t -f "$CONFIG") >"$CONFIG_TEST_LOG" 2>&1
      fi
      config_test_rc=$?
      {
        echo "===== Clash.Core config test ====="
        echo "CONFIG_TEST_RC=$config_test_rc"
        tail -n 160 "$CONFIG_TEST_LOG" 2>/dev/null || true
      } >>"$RUN_LOG" 2>/dev/null || true
      if [ "$config_test_rc" -ne 0 ]; then
        echo "START_STATE=config_invalid"
        echo "CONFIG_TEST_RC=$config_test_rc"
        cat "$CONFIG_TEST_LOG" 2>/dev/null || true
        exit 6
      fi
      echo "CONFIG_TEST_STATE=valid"
      if [ ${shellQuote(stopFirst ? '1' : '0')} = "1" ]; then
        "$SERVICE" stop >/dev/null 2>&1 || true
        sleep 1
      fi

      (
        echo "===== Clash.Service start ====="
        echo "reason=${shellQuote(reason)}"
        date 2>/dev/null || true
        KANO_CONFIG_PREVALIDATED=1 "$SERVICE" start
        rc=$?
        echo "START_SERVICE_RC=$rc"
        exit "$rc"
      ) >"$START_LOG" 2>&1
      rc=$?
      cat "$START_LOG" 2>/dev/null || true
      {
        echo
        echo "===== Clash.Service start output ====="
        tail -n 120 "$START_LOG" 2>/dev/null || true
      } >>"$RUN_LOG" 2>/dev/null || true
      [ "$rc" -eq 0 ] || { echo "START_STATE=service_failed"; exit "$rc"; }
      echo "START_STATE=started_verified_process"
      exit 0
    `, 90 * 1000);
    runtimePreflightCache = null;
    return result;
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
    await appendTemplateFlowDebug(`core process ready before api context=${context} pid=${pid}`);
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
      await appendTemplateFlowDebug(`geodata bootstrap grace context=${context} found=${geodataState.found}`);
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
    await appendTemplateFlowDebug(`enter restartClashWithConfigRollback context=${context}`);
    const ok = await restartClash({ skipCheck: true });
    await appendTemplateFlowDebug(`leave restartClashWithConfigRollback ok=${ok ? '1' : '0'} context=${context}`);
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

    await appendTemplateFlowDebug(`restart failed, restoring config rollback=${rollbackPath}`);
    const restored = await restoreConfigRollbackPoint(rollbackPath, context, { showToast: false });
    if (!restored) {
      createToast(`${escapeHtml(context)}失败，且上一份 config.yaml 回滚失败。`, 'red', 12000);
      await isMMRunning();
      return false;
    }

    createToast('新配置启动失败，正在尝试用上一份 config.yaml 恢复核心…', 'yellow', 9000);
    const recoveryOk = await restartClash({ skipCheck: true });
    await appendTemplateFlowDebug(`rollback recovery restart result=${recoveryOk ? '1' : '0'} context=${context}`);
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
      const formData = new FormData();
      formData.append('file', file);
      const res = await (
        await fetch(`${KANO_baseURL}/upload_img`, {
          method: 'POST',
          headers: common_headers,
          body: formData,
        })
      ).json();

      if (!res.url) throw res.error || '';
      const uploadedPath = getUploadedPath(res.url);
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
      if (templateSources.length > 0) {
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
      const templateCheck = await validateConfigFileStructure(txTemplate, 'template.yaml');
      if (!templateCheck.ok) {
        throw `模板结构检查失败，原 template.base.yaml / template.yaml 未改动\n${templateCheck.message || ''}`.trim();
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

  const showDialog = (message, title = '\u63d0\u793a') => {
    let timer = null;
    let fnfn = null;
    let closed = false;
    const containerId = 'toast_' + createRandomString(4);
    const id = 'close_message_btn_' + createRandomString(4);
    const id_download = 'download_btn_' + createRandomString(4);
    const id_clear = 'clear_btn_' + createRandomString(4);
    const id_refresh = 'refresh_btn_' + createRandomString(4);
    const id_pause = 'pause_btn_' + createRandomString(4);
    const rawMessage = sanitizeSubscriptionSecrets(message || '');
    const message1 = textToHtml(rawMessage);
    const { el, close } = createFixedToast(
      containerId,
      `
        <div style="pointer-events:all;width:80vw;max-width:800px">
            <div class="title" style="margin:0" data-i18n="system_notice">${escapeHtml(title)}</div>
            <div class="content_message" style="background: rgba(0, 0, 0, 0.8);color: rgb(0, 255, 0);box-sizing: border-box;font-family: sans-serif;line-height:1.4;margin:10px 0;max-height: 400px;overflow: auto;font-size: .64rem;">${message1}</div>
            <div class="kano-log-actions">
                <button style="font-size:.64rem" id="${id_refresh}">\u5237\u65b0</button>
                <button style="font-size:.64rem;background:var(--dark-btn-color-active)" id="${id_pause}">\u6682\u505c\u6eda\u52a8</button>
                <button style="font-size:.64rem" id="${id_download}">\u4e0b\u8f7d</button>
                <button style="font-size:.64rem" id="${id_clear}">\u6e05\u7a7a</button>
            </div>
            <div class="kano-dialog-actions kano-actions-1" style="--kano-action-count:1;margin-top:8px;">
                <button style="font-size:.64rem" id="${id}" data-i18n="close_btn">${t('close_btn')}</button>
            </div>
        </div>
        `,
    );
    const btn = el.querySelector(`#${id}`);
    const download = el.querySelector(`#${id_download}`);
    const clearBtn = el.querySelector(`#${id_clear}`);
    const rBtn = el.querySelector(`#${id_refresh}`);
    const msg_el = el.querySelector(`.content_message`);
    const safeClose = () => {
      if (closed) return;
      closed = true;
      if (timer) {
        timer();
        timer = null;
      }
      if (fnfn) {
        fnfn();
        fnfn = null;
      }
      close();
    };

    if (!btn) {
      safeClose();
      return;
    }

    let shouldPause = false;
    fnfn = requestInterval(() => {
      if (!closed && msg_el && !shouldPause) {
        msg_el.scrollTo({
          top: msg_el.scrollHeight + 199,
          left: 0,
          behavior: 'smooth',
        });
      }
    }, 500);

    if (download) {
      download.onclick = async () => {
        const t = Math.floor(Date.now() + Math.random());
        const file = new Blob([rawMessage], {
          type: 'text/plain',
        });
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.download = `kano_mm_log_${t}.txt`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 15000);
        a.remove();
      };
    }

    if (clearBtn) {
      clearBtn.onclick = async () => {
        const confirmed = await askConfirm(
          `mm_clear_log_confirm_${createRandomString(4)}`,
          '清空运行日志？',
          '清空后无法在此页面恢复。',
          '清空',
          '取消',
        );
        if (!confirmed) return;
        const res = await runShellWithRoot(
          `: > ${shellQuote(LOG_FILE)}`,
        );
        if (res.success) {
          createToast('\u65e5\u5fd7\u5df2\u6e05\u7a7a', 'green');
          safeClose();
        } else {
          createToast(`\u6e05\u7a7a\u65e5\u5fd7\u5931\u8d25`, 'red');
        }
      };
    }

    const refresh = async (flag = false) => {
      if (closed) return;
      const msg_el = el.querySelector(`.content_message`);
      const res = await runShellWithRoot(
        `if [ -f ${shellQuote(LOG_FILE)} ]; then timeout 2s awk '{print}' ${shellQuote(LOG_FILE)} | tail -n 100; fi`,
      );
      if (closed || !msg_el) return;
      if (res.success) {
        msg_el.innerHTML = textToHtml(sanitizeSubscriptionSecrets(res.content || ''));
        flag && createToast('\u65e5\u5fd7\u5df2\u5237\u65b0');
      } else {
        flag && createToast('\u83b7\u53d6\u65e5\u5fd7\u5931\u8d25', 'red');
      }
    };

    if (rBtn) {
      rBtn.onclick = async () => {
        await refresh(true);
      };
    }

    if (timer) timer();
    timer = requestInterval(async () => {
      await refresh();
    }, 2500);

    btn.onclick = async () => {
      safeClose();
    };

    const pause_btn = el.querySelector(`#${id_pause}`);
    if (pause_btn) {
      pause_btn.onclick = () => {
        shouldPause = !shouldPause;
        pause_btn.textContent = shouldPause ? '\u7ee7\u7eed\u6eda\u52a8' : '\u6682\u505c\u6eda\u52a8';
        pause_btn.style.background = shouldPause
          ? ''
          : 'var(--dark-btn-color-active)';
      };
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
          c="$(tr '\0' ' ' < "$p/cmdline" 2>/dev/null)"
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
      <div style="margin-top:12px;font-weight:700;">启动输出 + 运行日志</div>
      <pre style="white-space:pre-wrap;background:rgba(0,0,0,.78);color:#0f0;padding:10px;max-height:320px;overflow:auto;">${escapeHtml(sanitizeSubscriptionSecrets(logRes.content || '暂无日志'))}</pre>`,
    );
  };


  let lastSanitizedTrafficMode = 'tproxy';

  const sanitizeConfigForTProxy = async ({ showToast = false, errorToast = true } = {}) => {
    const runtimeRes = await runShellWithRoot(`
        OPTIONS=${shellQuote(CLASH_POLICY_OPTIONS_FILE)}
        SERVICE=${shellQuote(CLASH_SERVICE)}
        traffic_mode="$(grep -E '^traffic_mode=' "$OPTIONS" 2>/dev/null | tail -n 1 | cut -d= -f2-)"
        if [ -z "$traffic_mode" ]; then
          legacy_transparent="$(grep -E '^transparent=' "$OPTIONS" 2>/dev/null | tail -n 1 | cut -d= -f2-)"
          [ "$legacy_transparent" = 'off' ] && traffic_mode=off || traffic_mode=tproxy
        fi
        case "$traffic_mode" in tproxy|tun|off) ;; *) traffic_mode=tproxy ;; esac
        ipv6_mode="$(grep -E '^ipv6=' "$OPTIONS" 2>/dev/null | tail -n 1 | cut -d= -f2-)"
        [ "$ipv6_mode" = 'on' ] || ipv6_mode=off
        port=""
        if [ -f "$SERVICE" ]; then
          port="$(grep -Ei 'TPROXY|tproxy|on-port|789[0-9]' "$SERVICE" 2>/dev/null | grep -Eo '[0-9]{3,5}' | grep -E '^789[0-9]$' | tail -n 1)"
        fi
        [ -n "$port" ] || port=7895
        if [ -c /dev/net/tun ] || [ -c /dev/tun ]; then tun_device=1; else tun_device=0; fi
        echo "traffic_mode=$traffic_mode"
        echo "ipv6_mode=$ipv6_mode"
        echo "tproxy_port=$port"
        echo "tun_device=$tun_device"
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
    const trafficMode = ['tproxy', 'tun', 'off'].includes(values.traffic_mode) ? values.traffic_mode : 'tproxy';
    lastSanitizedTrafficMode = trafficMode;
    const ipv6Enabled = values.ipv6_mode == 'on';
    const tproxyPort = getPositivePort(values.tproxy_port, 7895);
    if (trafficMode == 'tun' && values.tun_device != '1') {
      if (errorToast) createToast('配置自检失败：TUN 模式需要 /dev/net/tun 或 /dev/tun，原配置未改写', 'red', 9000);
      return false;
    }

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
      applyRequiredF50Fields(config, {
        tproxyPort,
        ipv6: ipv6Enabled,
        dnsListen: ipv6Enabled ? '[::]:1053' : '0.0.0.0:1053',
        forceRedirHost: true,
      });
      const tun = ensureObjectField(config, 'tun');
      if (trafficMode == 'tun') {
        tun.enable = true;
        tun.stack = 'mixed';
        tun['auto-route'] = true;
        tun['auto-redirect'] = true;
        tun['auto-detect-interface'] = true;
        tun['strict-route'] = false;
        tun['dns-hijack'] = ['any:53', 'tcp://any:53'];
      } else {
        tun.enable = false;
      }

      if (Object.prototype.hasOwnProperty.call(config, 'proxy-groups') && !Array.isArray(config['proxy-groups'])) {
        throw new Error('proxy-groups 必须是数组');
      }
      if (Object.prototype.hasOwnProperty.call(config, 'rules') && !Array.isArray(config.rules)) {
        throw new Error('rules 必须是数组');
      }
      if (Array.isArray(config.rules)) config.rules = removeUnsupportedCategoryGeoipRules(config.rules);
      if (Object.prototype.hasOwnProperty.call(config, 'proxy-providers') && !isPlainYamlObject(config['proxy-providers'])) {
        throw new Error('proxy-providers 必须是映射对象');
      }
      if (Object.prototype.hasOwnProperty.call(config, 'rule-providers')) {
        if (!isPlainYamlObject(config['rule-providers'])) throw new Error('rule-providers 必须是映射对象');
        const managedPaths = {
          kano_reject_domain: CLASH_SAFE_REJECT_DOMAIN_FILE,
          kano_direct_domain: CLASH_SAFE_DIRECT_DOMAIN_FILE,
          kano_direct_ip: CLASH_SAFE_DIRECT_IP_FILE,
          kano_proxy_domain: CLASH_SAFE_PROXY_DOMAIN_FILE,
        };
        Object.entries(managedPaths).forEach(([name, path]) => {
          if (isPlainYamlObject(config['rule-providers'][name])) config['rule-providers'][name].path = path;
        });
      }
      const names = new Set();
      (config['proxy-groups'] || []).forEach((group, index) => {
        if (!isPlainYamlObject(group)) throw new Error(`proxy-groups[${index}] 必须是映射对象`);
        const name = String(group.name || '').trim();
        if (!name) throw new Error(`proxy-groups[${index}] 缺少 name`);
        if (names.has(name)) throw new Error(`proxy-groups 存在重复组名：${name}`);
        names.add(name);
      });
    } catch (e) {
      if (errorToast) createToast(`配置自检/修复失败，原 config.yaml 未被改写<br>${safeTextToHtml(e.message || e)}`, 'red', 10000);
      return false;
    }

    const write = await writeYamlObjectAtomic(CLASH_CONFIG, config, {
      label: 'config.yaml',
      backup: true,
      backupTag: 'f50_sanitize',
    });
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

  const buildBootstrapConfig = (secret = createRandomSecret()) => [
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
    const bootstrapSecret = createRandomSecret(20);
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
          sync 2>/dev/null || true
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
  btn_enabled.textContent = '\u5b89\u88c5';
  let disabled_btn_enabled = false;
  btn_enabled.onclick = async () => {
    if (disabled_btn_enabled) return;
    const operationToken = acquireCriticalOperation('安装核心');
    if (!operationToken) return;
    disabled_btn_enabled = true;
    setButtonBusy(btn_enabled, true, '\u5b89\u88c5\u4e2d\u2026');
    try {
      if (!(await ensureAdvanced())) return;
      const currentInstallState = await checkInstallState({ fresh: true });
      if (currentInstallState.state == 'damaged') {
        await selfHealDamagedInstall(currentInstallState);
        return;
      }
      if (currentInstallState.state != 'not_installed') {
        createToast('\u5df2\u7ecf\u5b89\u88c5\u8fc7\u732b\u732b\u4e86\uff01', 'red');
        return;
      }

      // 兼容基线：不再因诊断/策略 applet 缺失阻断基础安装。真正必需的 curl/unzip 在实际步骤中校验。

      createToast('\u4e0b\u8f7d\u5e76\u6821\u9a8c\u6240\u9700\u7ec4\u4ef6\u4e2d...');
      const archive = await downloadCoreArchive({ allowCached: false });
      if (!archive.ok) {
        return createToast(
          `\u4e0b\u8f7d\u6216\u6821\u9a8c\u5b89\u88c5\u5305\u5931\u8d25<br>${safeTextToHtml(archive.content || archive.message)}`,
          'red',
          12000,
        );
      }

      createToast('\u89e3\u538b\u732b\u732b\u6587\u4ef6...');
      const res2 = await runShellWithRoot(`
        set +e
        ZIP=${shellQuote(DOWNLOAD_ZIP)}
        TARGET=${shellQuote(CLASH_DIR)}
        STAGE="/data/kano_clash_install.$$"
        PACKAGE_ROOT=""
        BACKUP=""
        cleanup_install_stage() {
          rc=$?
          trap - EXIT
          [ -d "$STAGE" ] && rm -rf "$STAGE" 2>/dev/null || true
          if [ "$rc" -ne 0 ] && [ -n "$BACKUP" ] && [ -d "$BACKUP" ] && [ ! -e "$TARGET" ]; then
            mv "$BACKUP" "$TARGET" 2>/dev/null || true
          fi
          exit "$rc"
        }
        trap cleanup_install_stage EXIT
        command -v unzip >/dev/null 2>&1 || { echo "INSTALL_VERIFY_FAILED: unzip missing"; exit 1; }
        [ -s "$ZIP" ] || { echo "INSTALL_VERIFY_FAILED: downloaded zip missing or empty"; exit 1; }
        zip_size="$(wc -c < "$ZIP" 2>/dev/null || echo 0)"
        echo "$zip_size" | grep -Eq '^[0-9]+$' || zip_size=0
        [ "$zip_size" -ge 100000 ] || { echo "INSTALL_VERIFY_FAILED: zip too small ($zip_size bytes)"; exit 1; }
        [ "$zip_size" -le 209715200 ] || { echo "INSTALL_VERIFY_FAILED: zip too large ($zip_size bytes)"; exit 1; }
        unzip -t "$ZIP" >/data/kano_clash_zip_test.out 2>&1 || {
          echo "INSTALL_VERIFY_FAILED: zip integrity test failed"
          cat /data/kano_clash_zip_test.out 2>/dev/null || true
          exit 1
        }
        total_unpacked="$(unzip -l "$ZIP" 2>/dev/null | tail -n 1 | awk '{print $1}')"
        if echo "$total_unpacked" | grep -Eq '^[0-9]+$'; then
          [ "$total_unpacked" -le 314572800 ] || {
            echo "INSTALL_VERIFY_FAILED: archive expands beyond 300 MiB ($total_unpacked bytes)"
            exit 1
          }
        fi
        archive_names="$(unzip -Z1 "$ZIP" 2>/dev/null || true)"
        if [ -n "$archive_names" ] && printf '%s\\n' "$archive_names" | grep -Eq '(^/|(^|/)\\.\\.(/|$))'; then
          echo "INSTALL_VERIFY_FAILED: unsafe archive path detected"
          exit 1
        fi
        rm -rf "$STAGE" 2>/dev/null || true
        mkdir -p "$STAGE" || exit 1
        unzip -q "$ZIP" -d "$STAGE" >/data/kano_clash_unzip.out 2>&1 || {
          echo "INSTALL_VERIFY_FAILED: unzip failed"
          cat /data/kano_clash_unzip.out 2>/dev/null || true
          exit 1
        }
        if find "$STAGE" -type l 2>/dev/null | grep -q .; then
          command -v readlink >/dev/null 2>&1 || { echo "INSTALL_VERIFY_FAILED: archive contains symlinks but readlink is unavailable"; exit 1; }
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
          [ "$unsafe_link" = "0" ] || { echo "INSTALL_VERIFY_FAILED: unsafe archive symlink"; exit 1; }
        fi
        stage_kb="$(du -sk "$STAGE" 2>/dev/null | awk '{print $1}')"
        if echo "$stage_kb" | grep -Eq '^[0-9]+$' && [ "$stage_kb" -gt 0 ]; then
          [ "$stage_kb" -le 307200 ] || {
            echo "INSTALL_VERIFY_FAILED: extracted package exceeds 300 MiB ($stage_kb KiB)"
            exit 1
          }
        else
          echo "INSTALL_ADVANCED_WARNING=du_unavailable_size_checked_from_zip"
        fi
        # Locate package root by either Service or Core. Accept an extra top-level folder and case-varied names.
        service_candidate="$(find "$STAGE" -type f -iname 'Clash.Service' 2>/dev/null | head -n 1)"
        core_candidate="$(find "$STAGE" -type f -iname 'Clash.Core' 2>/dev/null | head -n 1)"
        if [ -n "$service_candidate" ]; then
          PACKAGE_ROOT="$(dirname "$(dirname "$service_candidate")")"
        elif [ -n "$core_candidate" ]; then
          PACKAGE_ROOT="$(dirname "$(dirname "$core_candidate")")"
        fi
        [ -n "$PACKAGE_ROOT" ] && [ -d "$PACKAGE_ROOT" ] || {
          echo "INSTALL_VERIFY_FAILED: package root not found (Clash.Core/Clash.Service absent)"
          find "$STAGE" -maxdepth 3 -type f 2>/dev/null | head -n 80 || true
          exit 1
        }
        # Normalize the three canonical directories when a Windows/repacked archive changed letter case.
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
        DEVICE_SDK="$(getprop ro.build.version.sdk 2>/dev/null | head -n 1 | tr -d '[:space:]')"
        case "$DEVICE_SDK" in ''|*[!0-9]*) DEVICE_SDK=0 ;; esac
        DEVICE_ABI="$(getprop ro.product.cpu.abi 2>/dev/null | head -n 1 | tr '[:upper:]' '[:lower:]')"
        echo "INSTALL_DEVICE_SDK=$DEVICE_SDK"
        [ -n "$DEVICE_ABI" ] || DEVICE_ABI="$(uname -m 2>/dev/null | tr '[:upper:]' '[:lower:]')"
        case "$DEVICE_ABI" in
          arm64-v8a|aarch64|armv8*|*arm64*) CONTROLLER="$PACKAGE_ROOT/Scripts/clashctl_arm64" ;;
          armeabi-v7a|armeabi|armv7*|armv6*) CONTROLLER="$PACKAGE_ROOT/Scripts/clashctl_armv7" ;;
          *)
            CONTROLLER=""
            echo "INSTALL_ADVANCED_WARNING=unsupported_controller_abi:\${DEVICE_ABI:-unknown}"
            ;;
        esac
        # Clash.Service is a tiny compatibility wrapper. Rebuild it when a repacked archive omitted only that file.
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
          echo "INSTALL_COMPAT_SERVICE_REBUILT=1"
        fi
        [ -s "$SERVICE" ] || { echo "INSTALL_VERIFY_FAILED: Clash.Service/clashctl missing"; exit 1; }
        [ -s "$CORE" ] || { echo "INSTALL_VERIFY_FAILED: Clash.Core missing"; exit 1; }
        chmod 755 "$SERVICE" "$CORE" || { echo "INSTALL_VERIFY_FAILED: base executable chmod failed"; exit 1; }
        advanced_missing=""
        yq_version="missing"
        if [ -s "$YQ" ]; then
          chmod 755 "$YQ" 2>/dev/null || true
          yq_version="$("$YQ" --version 2>&1)"
          if ! echo "$yq_version" | grep -Eiq 'version[[:space:]]+v?4\\.'; then
            advanced_missing="\${advanced_missing} yq_invalid"
            yq_version="invalid"
          fi
        else
          advanced_missing="\${advanced_missing} yq"
        fi
        if [ -s "$CONTROLLER" ]; then
          chmod 755 "$CONTROLLER" 2>/dev/null || true
          controller_probe="$("$CONTROLLER" --help 2>&1)"
          controller_probe_rc=$?
          case "$controller_probe_rc" in
            126|127) advanced_missing="\${advanced_missing} controller_unusable" ;;
            *)
              FALLBACK_CONTROLLER="$PACKAGE_ROOT/Scripts/clashctl"
              if [ ! -e "$FALLBACK_CONTROLLER" ]; then
                controller_name="$(basename "$CONTROLLER")"
                ln -s "$controller_name" "$FALLBACK_CONTROLLER" 2>/dev/null || {
                  cp "$CONTROLLER" "$FALLBACK_CONTROLLER" 2>/dev/null && chmod 755 "$FALLBACK_CONTROLLER" 2>/dev/null || true
                }
              fi
              ;;
          esac
        else
          advanced_missing="\${advanced_missing} controller"
        fi
        echo "INSTALL_CORE_RUNTIME_PROBE=skipped_relaxed_final"
        stamp="$(date +%Y%m%d%H%M%S 2>/dev/null)"
        [ -n "$stamp" ] || stamp="$(cat /proc/uptime 2>/dev/null | cut -d. -f1)"
        if [ -e "$TARGET" ]; then
          BACKUP="/data/clash.before_install.$stamp"
          mv "$TARGET" "$BACKUP" || { echo "INSTALL_COMMIT_FAILED: cannot back up existing clash directory"; exit 1; }
        fi
        mv "$PACKAGE_ROOT" "$TARGET" || {
          echo "INSTALL_COMMIT_FAILED: cannot atomically install staged package"
          exit 1
        }
        [ "$PACKAGE_ROOT" = "$STAGE" ] || rm -rf "$STAGE" 2>/dev/null || true
        sync 2>/dev/null || true
        rm -f /data/kano_clash_zip_test.out /data/kano_clash_unzip.out 2>/dev/null || true
        install_backup_count=0
        for stale_install in $(ls -1dt /data/clash.before_install.* 2>/dev/null); do
          install_backup_count=$((install_backup_count + 1))
          [ "$install_backup_count" -le 2 ] || rm -rf "$stale_install" 2>/dev/null || true
        done
        echo "INSTALL_BACKUP=$BACKUP"
        echo "INSTALL_ADVANCED_MISSING=$advanced_missing"
        echo "INSTALL_PACKAGE_COMMITTED: yq=$yq_version zip_size=$zip_size unpacked=\${total_unpacked:-unknown}"
        `, 92 * 1000);
      if (!res2.success || !String(res2.content || '').includes('INSTALL_PACKAGE_COMMITTED')) {
        return createToast(`安装包校验或提交失败<br>${safeTextToHtml(res2.content || '')}`, 'red', 10000);
      }
      const installBackupPath = ((String(res2.content || '').split('\n').find((line) => line.startsWith('INSTALL_BACKUP=')) || '')
        .replace(/^INSTALL_BACKUP=/, '')
        .trim());
      const rollbackInstalledPackage = async (reason = '安装后检查失败') => {
        const rollbackRes = await runDangerousShellWithRoot(`
          set +e
          TARGET=${shellQuote(CLASH_DIR)}
          BACKUP=${shellQuote(installBackupPath)}
          [ -f ${shellQuote(CLASH_SERVICE)} ] && ${shellQuote(CLASH_SERVICE)} stop >/dev/null 2>&1 || true
          ${removeBootLinesCmd()}
          ${flushGeneratedRulesCmd()}
          if [ -n "$BACKUP" ] && [ ! -d "$BACKUP" ]; then
            echo "INSTALL_ROLLBACK_BACKUP_MISSING: $BACKUP"
            exit 1
          fi
          if [ -d "$TARGET" ]; then rm -rf "$TARGET" || exit 1; fi
          if [ -n "$BACKUP" ] && [ -d "$BACKUP" ]; then
            mv "$BACKUP" "$TARGET" || exit 1
            echo "INSTALL_ROLLBACK=restored_previous"
          else
            echo "INSTALL_ROLLBACK=removed_failed_install"
          fi
          printf 'INSTALL_ROLLBACK_REASON=%s\n' ${shellQuote(reason)}
        `, 60 * 1000, 'install_rollback');
        if (!rollbackRes.success) {
          createToast(`安装失败，且安装目录回滚失败<br>${safeTextToHtml(rollbackRes.content || '')}`, 'red', 12000);
        }
        return rollbackRes.success;
      };
      const failInstalledPackage = async (message, detail = '') => {
        const rolledBack = await rollbackInstalledPackage(message);
        createToast(
          `${escapeHtml(message)}${detail ? `<br>${safeTextToHtml(detail)}` : ''}<br>${rolledBack ? '已恢复安装前状态。' : '安装目录回滚失败。'}`,
          'red',
          12000,
        );
        return false;
      };

      createToast('\u68c0\u67e5\u4f9d\u8d56\u6587\u4ef6\uff0c\u53ef\u80fd\u9700\u8981\u4e00\u70b9\u65f6\u95f4...');
      const res3 = await runShellWithRoot(`
        [ -f ${shellQuote(CLASH_SERVICE)} ] && echo 1 || echo 0
        `);
      if (!res3.success || String(res3.content || '').trim() != '1') {
        return await failInstalledPackage('依赖文件检查失败', res3.content || '');
      }

      createToast('\u6b63\u5728\u5b89\u88c5\u732b\u732b\uff0c\u8bbe\u7f6eClash\u81ea\u542f\u52a8...');
      const res5 = await runShellWithRoot(`
        mkdir -p ${shellQuote(CLASH_INOTIFY_DIR)} || exit 1
        if [ -d ${shellQuote(CLASH_DIR)} ]; then
          find ${shellQuote(CLASH_DIR)} -type d -exec chmod 755 {} \\;
          find ${shellQuote(CLASH_DIR)} -type f -exec chmod 644 {} \\;
        fi
        for EXECUTABLE in \
          ${shellQuote(CLASH_SERVICE)} \
          ${shellQuote(CLASH_CORE)} \
          ${shellQuote(`${CLASH_DIR}/Scripts/Clash.Inotify`)} \
          ${shellQuote(`${CLASH_DIR}/Scripts/clashctl_arm64`)} \
          ${shellQuote(`${CLASH_DIR}/Scripts/clashctl_armv7`)} \
          ${shellQuote(`${CLASH_DIR}/Scripts/clashctl`)} \
          ${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)} \
          ${shellQuote(`${CLASH_DIR}/Tools/mosdns_arm64`)} \
          ${shellQuote(KANO_HELPER_CONVERTER_PATH)}; do
          [ ! -f "$EXECUTABLE" ] || chmod 755 "$EXECUTABLE" || exit 1
        done
        DEVICE_ABI="$(getprop ro.product.cpu.abi 2>/dev/null | head -n 1 | tr '[:upper:]' '[:lower:]')"
        [ -n "$DEVICE_ABI" ] || DEVICE_ABI="$(uname -m 2>/dev/null | tr '[:upper:]' '[:lower:]')"
        case "$DEVICE_ABI" in
          arm64-v8a|aarch64|armv8*|*arm64*) INSTALLED_CONTROLLER=${shellQuote(`${CLASH_DIR}/Scripts/clashctl_arm64`)} ;;
          armeabi-v7a|armeabi|armv7*|armv6*) INSTALLED_CONTROLLER=${shellQuote(`${CLASH_DIR}/Scripts/clashctl_armv7`)} ;;
          *)
            INSTALLED_CONTROLLER=""
            echo "INSTALL_ADVANCED_WARNING=unsupported_controller_abi:\${DEVICE_ABI:-unknown}"
            ;;
        esac
        if [ -n "$INSTALLED_CONTROLLER" ] && [ -x "$INSTALLED_CONTROLLER" ]; then
          controller_probe="$("$INSTALLED_CONTROLLER" --help 2>&1)"
          controller_probe_rc=$?
          case "$controller_probe_rc" in
            126|127) echo "INSTALL_ADVANCED_WARNING=controller_unusable:$INSTALLED_CONTROLLER" ;;
          esac
        else
          echo "INSTALL_ADVANCED_WARNING=controller_missing:$INSTALLED_CONTROLLER"
        fi
        [ -x ${shellQuote(CLASH_SERVICE)} ] || { echo "INSTALL_PERMISSION_FAILED: Clash.Service is not executable"; exit 1; }
        [ -x ${shellQuote(CLASH_CORE)} ] || { echo "INSTALL_PERMISSION_FAILED: Clash.Core is not executable"; exit 1; }
        service_probe="$(${shellQuote(CLASH_SERVICE)} --help 2>&1)"
        service_probe_rc=$?
        case "$service_probe_rc" in
          126|127)
            echo "INSTALL_PERMISSION_FAILED: Clash.Service cannot execute"
            echo "$service_probe"
            exit 1
            ;;
        esac
        [ -f ${shellQuote(CLASH_SUB_URLS)} ] && chmod 600 ${shellQuote(CLASH_SUB_URLS)}
        `);
      if (!res5.success) return await failInstalledPackage('设置开机启动失败', res5.content || '');
      const serviceWrapperReadyAfterInstall = await ensureServiceWrapper({ force: true });
      if (!serviceWrapperReadyAfterInstall.success) {
        return await failInstalledPackage('安装 Clash.Service 启动保护失败', serviceWrapperReadyAfterInstall.content || '');
      }
      const policyReadyAfterInstall = await ensurePolicyToolsScript();
      if (!policyReadyAfterInstall) createToast('猫猫基础安装已完成；网络策略增强脚本暂未就绪，不影响核心启动。', 'yellow', 9000);
      if (!(await ensureBootstrapConfig())) return await failInstalledPackage('创建基础配置失败');
      const installYqReady = await ensureYqRuntime({ quiet: true });
      if (installYqReady) {
        const sanitized = await sanitizeConfigForTProxy({ showToast: false });
        if (!sanitized) createToast('基础代理文件已安装；配置增强整理未完成，将按现有 config.yaml 尝试启动。', 'yellow', 9000);
      } else {
        createToast('基础代理已安装；YAML 高级组件暂未就绪，将在首次使用订阅/模板/规则功能时自动修复。', 'yellow', 9000);
      }
      const bootWrite = await runShellWithRoot(addBootLinesCmd());
      if (!bootWrite.success) return await failInstalledPackage('设置开机启动失败', bootWrite.content || '');

      createToast('\u6b63\u5728\u542f\u52a8\u6838\u5fc3...');
      const res6 = await startClashServiceClean({ stopFirst: false, reason: '首次启动' });
      if (!res6.success) {
        await networkRescue({ stopService: true, showOutput: false, reason: '\u9996\u6b21\u542f\u52a8\u5931\u8d25' });
        return await failInstalledPackage('首次启动失败', res6.content || '');
      }
      if (!(await verifyStartOrRollback('\u9996\u6b21\u542f\u52a8'))) {
        return await failInstalledPackage('首次启动健康检查失败');
      }
      const trafficModeReadyAfterInstall = await ensureRuntimeTrafficMode(lastSanitizedTrafficMode);
      const policyAppliedAfterInstall = !policyReadyAfterInstall
        || await reapplyPolicyRulesSilent({ ensureScript: false });
      const installRuntimeReady = trafficModeReadyAfterInstall && policyAppliedAfterInstall;
      if (!installRuntimeReady) {
        const failedParts = [
          trafficModeReadyAfterInstall ? '' : '流量模式同步',
          policyAppliedAfterInstall ? '' : '网络策略应用',
        ].filter(Boolean).join('、');
        createToast(`核心 API 已启动，但${failedParts}失败`, 'red', 10000);
      }
      const helperReadyAfterInstall = await installBinaryHelperPreferred({ quiet: true });
      scheduleBinaryHelperButtonRefresh();
      if (!helperReadyAfterInstall) {
        createToast('基础代理已安装；转换组件安装失败，当前使用 Shell 兼容模式。', 'yellow', 8000);
      }

      disabled_btn_enabled = false;

      checkIsBootUp().then((isBootUp) => {
        const boot_on = document.querySelector('#clash_boot_on');
        if (!boot_on) return;
        if (isBootUp) {
          boot_on.style.background = 'var(--dark-btn-color-active)';
        } else {
          boot_on.style.background = '';
        }
      });
      setTimeout(() => {
        isMMRunning();
      }, 3000);

      showInfoDialog(
        'mm_installed_confirm_1',
        installRuntimeReady ? '\u6838\u5fc3\u5df2\u542f\u52a8' : '核心已启动，网络接管未完整生效',
        `Web 面板：<a href="http://${UFI_DATA.lan_ipaddr}:7788/ui/" target="_blank">http://${UFI_DATA.lan_ipaddr}:7788/ui/</a><br />
        访问密钥在“面板连接”中管理；节点在“订阅设置”中添加。${installRuntimeReady ? '' : '<br />请在“流量接管”中重新应用后再使用代理。'}`,
      );
    } finally {
      disabled_btn_enabled = false;
      setButtonBusy(btn_enabled, false);
      releaseCriticalOperation(operationToken);
      await runShellWithRoot(`rm -f ${shellQuote(DOWNLOAD_ZIP)} ${shellQuote(DOWNLOAD_LOG)}`);
    }
  };
  const btn_disabled = document.createElement('button');
  btn_disabled.classList.add('btn', 'kano-danger');
  btn_disabled.textContent = '卸载插件';
  btn_disabled.onclick = async () => {
    if (!(await ensureAdvanced())) return;
    const installState = await runShellWithRoot(`[ -d ${shellQuote(CLASH_DIR)} ] && echo 1 || echo 0`, 10 * 1000);
    if (String(installState.content || '').trim() != '1') {
      createToast('未发现可卸载的核心目录。', 'yellow');
      return;
    }
    const operationToken = acquireCriticalOperation('卸载核心');
    if (!operationToken) return;
    const confirmed = await askConfirm(
      'mm_uninstall_confirm',
      '\u786e\u8ba4\u5378\u8f7d\u732b\u732b\uff1f',
      `\u5c06\u505c\u6b62\u670d\u52a1\u3001\u79fb\u9664\u5f00\u673a\u81ea\u542f\uff0c\u6e05\u7406 TProxy/DNS/Policy \u94fe\uff0c\u5e76\u5220\u9664 <code>/data/clash</code> \u548c <code>/data/kano_*</code> \u8c03\u8bd5\u6587\u4ef6\u3002<br />
      <b>\u672c\u6b21\u5378\u8f7d\u4e0d\u4f1a\u505a\u4efb\u4f55\u5907\u4efd</b>\uff1bconfig.yaml\u3001template.yaml\u3001\u8ba2\u9605\u8bb0\u5f55\u3001\u8986\u5199\u6587\u4ef6\u548c\u5185\u6838\u65e5\u5fd7\u90fd\u4f1a\u76f4\u63a5\u5220\u9664\u3002<br />
      \u7ee7\u7eed\u524d\u8bf7\u786e\u8ba4\u4f60\u5df2\u7ecf\u4e0d\u9700\u8981\u8fd9\u4e9b\u6570\u636e\u3002`,
      '\u786e\u8ba4\u5378\u8f7d',
      '\u53d6\u6d88',
    );
    if (!confirmed) {
      releaseCriticalOperation(operationToken);
      return;
    }
    createToast('\u5378\u8f7d\u4e2d...', 'red');
    setButtonBusy(btn_disabled, true, '\u5378\u8f7d\u4e2d\u2026');
    try {
      const res = await runShellWithRoot(`
          set +e
          echo "\u5378\u8f7d\u7b56\u7565: \u4e0d\u5907\u4efd\uff0c\u76f4\u63a5\u5220\u9664\u6240\u6709\u732b\u732b\u6570\u636e"
          if [ -f ${shellQuote(CLASH_SERVICE)} ]; then
            ${shellQuote(CLASH_SERVICE)} stop 2>&1 || true
          fi
          sleep 1
          ${removeBootLinesCmd()}
          ${flushGeneratedRulesCmd()}
          rm -f /data/mm_uninstall_backup.err 2>/dev/null || true
          if [ -d ${shellQuote(CLASH_DIR)} ]; then
            if rm -rf ${shellQuote(CLASH_DIR)}; then
              echo "\u5df2\u5220\u9664 /data/clash"
            else
              echo "\u5220\u9664 /data/clash \u5931\u8d25"
              exit 1
            fi
          else
            echo "/data/clash \u4e0d\u5b58\u5728"
          fi
          rm -rf ${shellQuote(KANO_YQ_RUNTIME_DIR)} 2>/dev/null || true
          rm -f /data/kano_* 2>/dev/null || true
          rm -f ${shellQuote(DOWNLOAD_ZIP)} ${shellQuote(DOWNLOAD_LOG)} ${shellQuote(LOG_FILE)} 2>/dev/null || true
          rm -rf ${shellQuote(KANO_INSTALL_TOOLBOX_DIR)} 2>/dev/null || true
          echo "\u5df2\u5220\u9664 /data/kano_* \u8c03\u8bd5\u6587\u4ef6\u548c\u5185\u6838\u65e5\u5fd7"
          echo "UNINSTALL_NO_BACKUP_DONE"
          `, 60 * 1000);
      if (!res.success) return createToast('\u5378\u8f7d\u5931\u8d25', 'red');
      createToast('\u5378\u8f7d\u5b8c\u6210', 'green');
      await isMMRunning();
    } finally {
      setButtonBusy(btn_disabled, false);
      releaseCriticalOperation(operationToken);
    }
  };


  const normalizeMac = (value = '') => {
    const hex = String(value || '')
      .replace(/#.*$/g, '')
      .trim()
      .replace(/[^0-9a-fA-F]/g, '')
      .toUpperCase();
    if (!/^[0-9A-F]{12}$/.test(hex)) return '';
    return hex.match(/.{2}/g).join(':');
  };


  const syncUnifiedDeviceBypassStorage = async () => {
    const res = await runShellWithRoot(`
        set -e
        DEVICE=${shellQuote(CLASH_DEVICE_BYPASS_FILE)}
        LEGACY=${shellQuote(CLASH_MAC_BYPASS_FILE)}
        BOOT=${shellQuote(BOOT_FILE)}
        TMP="$DEVICE.unified.$$"
        TMP_MAC="$LEGACY.unified.$$"
        cleanup_unified_bypass() {
          [ -z "$TMP" ] || rm -f "$TMP" 2>/dev/null || true
          [ -z "$TMP_MAC" ] || rm -f "$TMP_MAC" 2>/dev/null || true
        }
        trap cleanup_unified_bypass EXIT
        mkdir -p ${shellQuote(CLASH_POLICY_DIR)} ${shellQuote(CLASH_PROXY_DIR)}
        [ -f "$DEVICE" ] || : > "$DEVICE"
        [ -f "$LEGACY" ] || : > "$LEGACY"
        normalize_device_items() {
          sed 's/#.*$//' "$DEVICE" 2>/dev/null | awk 'NF {print $1}' | while IFS= read -r item; do
            if echo "$item" | grep -Eiq '^([0-9A-F]{2}[:-]){5}[0-9A-F]{2}$|^[0-9A-F]{12}$|^([0-9A-F]{4}[.]){2}[0-9A-F]{4}$'; then
              echo "$item" | tr '[:lower:]' '[:upper:]' | sed 's/[^0-9A-F]//g;s/../&:/g;s/:$//'
            else
              echo "$item"
            fi
          done
        }
        {
          normalize_device_items
          sed 's/#.*$//' "$LEGACY" 2>/dev/null | tr '[:lower:]' '[:upper:]' | sed 's/[[:space:]:.-]//g' | grep -E '^[0-9A-F]{12}$' | sed 's/../&:/g;s/:$//' || true
        } | awk 'NF && !seen[toupper($0)]++ {print $0}' > "$TMP"
        mv "$TMP" "$DEVICE"
        TMP=""
        grep -Ei '^([0-9A-F]{2}:){5}[0-9A-F]{2}$' "$DEVICE" 2>/dev/null | tr '[:lower:]' '[:upper:]' | awk '!seen[$0]++' > "$TMP_MAC" || true
        mv "$TMP_MAC" "$LEGACY"
        TMP_MAC=""
        chmod 600 "$DEVICE" "$LEGACY" 2>/dev/null || true
        if [ -f "$BOOT" ]; then
          awk -v line=${shellQuote(LEGACY_BOOT_MAC_BYPASS_LINE)} '$0 != line { print }' "$BOOT" > "$BOOT.kano.$$" &&
            mv "$BOOT.kano.$$" "$BOOT"
          rm -f "$BOOT.kano.$$" 2>/dev/null || true
        fi
        rm -f ${shellQuote(CLASH_MAC_BYPASS_SCRIPT)} 2>/dev/null || true
        for NAME in iptables ip6tables; do
          IPT="$(command -v "$NAME" 2>/dev/null || true)"
          if [ -z "$IPT" ]; then
            for ALT in "\${NAME}-legacy" "\${NAME}-nft"; do
              IPT="$(command -v "$ALT" 2>/dev/null || true)"
              [ -z "$IPT" ] || break
            done
          fi
          if [ -z "$IPT" ]; then
            for BASE in /system/bin /system/xbin /vendor/bin /sbin; do
              for CANDIDATE in "$BASE/$NAME" "$BASE/\${NAME}-legacy" "$BASE/\${NAME}-nft"; do
                [ ! -x "$CANDIDATE" ] || { IPT="$CANDIDATE"; break 2; }
              done
            done
          fi
          [ -n "$IPT" ] || continue
          for TABLE in mangle nat filter; do
            for HOOK in PREROUTING OUTPUT FORWARD INPUT; do
              while "$IPT" -t "$TABLE" -D "$HOOK" -j ${shellQuote(CLASH_MAC_BYPASS_CHAIN)} 2>/dev/null; do :; done
            done
            "$IPT" -t "$TABLE" -F ${shellQuote(CLASH_MAC_BYPASS_CHAIN)} 2>/dev/null || true
            "$IPT" -t "$TABLE" -X ${shellQuote(CLASH_MAC_BYPASS_CHAIN)} 2>/dev/null || true
          done
        done
        trap - EXIT
        echo "UNIFIED_DEVICE_BYPASS_READY"
        `, 15 * 1000);
    return !!res.success;
  };



  const buildPolicyToolsScript = () => [
    '#!/system/bin/sh',
    `# KANO_POLICY_SCRIPT_VERSION=${POLICY_SCRIPT_VERSION}`,
    `POLICY_DIR=${shellQuote(CLASH_POLICY_DIR)}`,
    `OPTIONS_FILE=${shellQuote(CLASH_POLICY_OPTIONS_FILE)}`,
    `DEVICE_FILE=${shellQuote(CLASH_DEVICE_BYPASS_FILE)}`,
    `SERVICE_FILE=${shellQuote(CLASH_SERVICE)}`,
    'POLICY_CHAIN=KANO_POLICY_PRE',
    `LEGACY_MAC_CHAIN=${shellQuote(CLASH_MAC_BYPASS_CHAIN)}`,
    'DNS_CHAIN=KANO_DNS_HIJACK',
    'QUIC_CHAIN=KANO_QUIC_BLOCK',
    'list_ipt_candidates() {',
    '  NAME="$1"',
    '  {',
    '    command -v "$NAME" 2>/dev/null || true',
    '    command -v "${NAME}-legacy" 2>/dev/null || true',
    '    command -v "${NAME}-nft" 2>/dev/null || true',
    '    for BASE in /system/bin /system/xbin /vendor/bin /sbin; do',
    '      for CANDIDATE in "$BASE/$NAME" "$BASE/${NAME}-legacy" "$BASE/${NAME}-nft"; do',
    '        [ ! -x "$CANDIDATE" ] || echo "$CANDIDATE"',
    '      done',
    '    done',
    "  } | awk 'NF && !seen[$0]++'",
    '}',
    'get_ipt() {',
    '  NAME="$1"',
    '  FIRST=""',
    '  KANO_BIN=""',
    '  for BIN in $(list_ipt_candidates "$NAME"); do',
    '    [ -n "$FIRST" ] || FIRST="$BIN"',
    '    RULES="$("$BIN" -t mangle -S PREROUTING 2>/dev/null)"',
    '    if echo "$RULES" | grep -Eiq "TPROXY|clash|mihomo"; then',
    '      echo "$BIN"',
    '      return',
    '    fi',
    '    if [ -z "$KANO_BIN" ] && echo "$RULES" | grep -q "KANO"; then KANO_BIN="$BIN"; fi',
    '  done',
    '  if [ -n "$KANO_BIN" ]; then echo "$KANO_BIN"; elif [ -n "$FIRST" ]; then echo "$FIRST"; fi',
    '}',
    'get_opt() {',
    '  KEY="$1"',
    '  DEF="$2"',
    '  VAL=""',
    '  [ -f "$OPTIONS_FILE" ] && VAL="$(grep -E "^${KEY}=" "$OPTIONS_FILE" 2>/dev/null | tail -n 1 | cut -d= -f2-)"',
    '  [ -n "$VAL" ] && echo "$VAL" || echo "$DEF"',
    '}',
    'norm_mac() {',
    '  echo "$1" | tr "[:lower:]" "[:upper:]" | sed "s/[^0-9A-F]//g" | grep -E "^[0-9A-F]{12}$" | sed "s/../&:/g;s/:$//"',
    '}',
    'is_ipv4() {',
    '  echo "$1" | awk -F. \'NF != 4 {exit 1} {for (i=1; i<=4; i++) if ($i !~ /^[0-9]+$/ || $i < 0 || $i > 255) exit 1}\'',
    '}',
    'is_cidr() {',
    '  addr="\${1%/*}"',
    '  prefix="\${1##*/}"',
    '  [ "$addr" != "$1" ] || return 1',
    '  is_ipv4 "$addr" || return 1',
    '  echo "$prefix" | grep -Eq "^[0-9]{1,2}$" || return 1',
    '  [ "$prefix" -ge 0 ] 2>/dev/null && [ "$prefix" -le 32 ] 2>/dev/null',
    '}',
    'is_ipv6() {',
    '  echo "$1" | grep -q ":" && echo "$1" | grep -Eq "^[0-9A-Fa-f:]+$"',
    '}',
    'is_cidr6() {',
    '  addr="${1%/*}"',
    '  prefix="${1##*/}"',
    '  [ "$addr" != "$1" ] || return 1',
    '  is_ipv6 "$addr" || return 1',
    '  echo "$prefix" | grep -Eq "^[0-9]{1,3}$" || return 1',
    '  [ "$prefix" -ge 0 ] 2>/dev/null && [ "$prefix" -le 128 ] 2>/dev/null',
    '}',
    'is_port_listening() {',
    '  PORT="$1"; FAMILY="$2"',
    '  HEX="$(printf "%04X" "$PORT" 2>/dev/null)"',
    '  [ -n "$HEX" ] || return 1',
    '  if [ "$FAMILY" = "6" ]; then',
    '    ss -6 -lun 2>/dev/null | grep -Eq "[:.]$PORT[[:space:]]" && return 0',
    '    netstat -lnu6 2>/dev/null | grep -Eq "[:.]$PORT[[:space:]]" && return 0',
    '    grep -qi ":$HEX " /proc/net/udp6 2>/dev/null && return 0',
    '  else',
    '    ss -4 -lun 2>/dev/null | grep -Eq "[:.]$PORT[[:space:]]" && return 0',
    '    netstat -lnu 2>/dev/null | grep -Ev "udp6" | grep -Eq "[:.]$PORT[[:space:]]" && return 0',
    '    grep -qi ":$HEX " /proc/net/udp 2>/dev/null && return 0',
    '  fi',
    '  return 1',
    '}',
    'normalize_sources() {',
    '  [ -f "$DEVICE_FILE" ] || return 0',
    '  sed "s/#.*$//" "$DEVICE_FILE" 2>/dev/null | while IFS= read -r line; do',
    '    set -- $line',
    '    item="$1"',
    '    [ -n "$item" ] || continue',
    '    mac="$(norm_mac "$item")"',
    '    if [ -n "$mac" ]; then echo "mac $mac"; continue; fi',
    '    if is_cidr "$item"; then echo "src $item"; continue; fi',
    '    if is_ipv4 "$item"; then echo "src $item/32"; continue; fi',
    '    if is_cidr6 "$item"; then echo "src6 $item"; continue; fi',
    '    if is_ipv6 "$item"; then echo "src6 $item/128"; continue; fi',
    "  done | awk '!seen[$0]++'",
    '}',
    'flush_chain() {',
    '  IPT="$1"; TABLE="$2"; HOOK="$3"; CHAIN="$4"',
    '  [ -n "$IPT" ] || return 0',
    '  # Robust cleanup: remove jumps to CHAIN not only from the hook, but also from',
    '  # previously generated chains. This prevents accidental self-jumps such as',
    '  # KANO_POLICY_PRE -> KANO_POLICY_PRE, which can blackhole traffic.',
    '  for SRC in PREROUTING OUTPUT FORWARD INPUT "$POLICY_CHAIN" "$DNS_CHAIN" "$QUIC_CHAIN"; do',
    '    while "$IPT" -t "$TABLE" -D "$SRC" -j "$CHAIN" 2>/dev/null; do :; done',
    '  done',
    '  "$IPT" -t "$TABLE" -F "$CHAIN" 2>/dev/null || true',
    '  "$IPT" -t "$TABLE" -X "$CHAIN" 2>/dev/null || true',
    '}',
    'add_source_returns() {',
    '  IPT="$1"; TABLE="$2"; CHAIN="$3"; FAMILY="$4"',
    '  normalize_sources | while read kind value; do',
    '    [ -n "$kind" ] || continue',
    '    case "$kind" in',
    '      mac) "$IPT" -t "$TABLE" -A "$CHAIN" -m mac --mac-source "$value" -j RETURN || exit 1 ;;',
    '      src) [ "$FAMILY" != "4" ] || "$IPT" -t "$TABLE" -A "$CHAIN" -s "$value" -j RETURN || exit 1 ;;',
    '      src6) [ "$FAMILY" != "6" ] || "$IPT" -t "$TABLE" -A "$CHAIN" -s "$value" -j RETURN || exit 1 ;;',
    '    esac',
    '  done',
    '}',
    'add_source_accepts() {',
    '  IPT="$1"; TABLE="$2"; CHAIN="$3"; FAMILY="$4"',
    '  normalize_sources | while read kind value; do',
    '    [ -n "$kind" ] || continue',
    '    case "$kind" in',
    '      mac)',
    '        [ "$TABLE" != "mangle" ] || "$IPT" -t "$TABLE" -A "$CHAIN" -m mac --mac-source "$value" -j MARK --set-xmark 0x0/0xffffffff 2>/dev/null || true',
    '        ERR="$("$IPT" -t "$TABLE" -A "$CHAIN" -m mac --mac-source "$value" -j ACCEPT 2>&1)" || { echo "DEVICE_BYPASS_ITEM_FAILED mac $value IPv$FAMILY: $ERR"; "$IPT" -t "$TABLE" -S "$CHAIN" 2>&1 || true; exit 1; }',
    '        ;;',
    '      src)',
    '        if [ "$FAMILY" = "4" ]; then',
    '          [ "$TABLE" != "mangle" ] || "$IPT" -t "$TABLE" -A "$CHAIN" -s "$value" -j MARK --set-xmark 0x0/0xffffffff 2>/dev/null || true',
    '          ERR="$("$IPT" -t "$TABLE" -A "$CHAIN" -s "$value" -j ACCEPT 2>&1)" || { echo "DEVICE_BYPASS_ITEM_FAILED src $value IPv$FAMILY: $ERR"; "$IPT" -t "$TABLE" -S "$CHAIN" 2>&1 || true; exit 1; }',
    '        fi',
    '        ;;',
    '      src6)',
    '        if [ "$FAMILY" = "6" ]; then',
    '          [ "$TABLE" != "mangle" ] || "$IPT" -t "$TABLE" -A "$CHAIN" -s "$value" -j MARK --set-xmark 0x0/0xffffffff 2>/dev/null || true',
    '          ERR="$("$IPT" -t "$TABLE" -A "$CHAIN" -s "$value" -j ACCEPT 2>&1)" || { echo "DEVICE_BYPASS_ITEM_FAILED src6 $value IPv$FAMILY: $ERR"; "$IPT" -t "$TABLE" -S "$CHAIN" 2>&1 || true; exit 1; }',
    '        fi',
    '        ;;',
    '    esac',
    '  done',
    '}',
    'flush_all() (',
    '  FOUND=0',
    '  for NAME in iptables ip6tables; do',
    '    for IPT in $(list_ipt_candidates "$NAME"); do',
    '      FOUND=1',
    '      flush_chain "$IPT" mangle PREROUTING "$LEGACY_MAC_CHAIN"',
    '      flush_chain "$IPT" mangle PREROUTING "$POLICY_CHAIN"',
    '      flush_chain "$IPT" nat PREROUTING "$DNS_CHAIN"',
    '      flush_chain "$IPT" filter FORWARD "$QUIC_CHAIN"',
    '      flush_chain "$IPT" filter OUTPUT "$QUIC_CHAIN"',
    '    done',
    '  done',
    '  [ "$FOUND" = "1" ] || { echo "iptables/ip6tables \u4e0d\u5b58\u5728"; exit 1; }',
    ')',
    'apply_policy() {',
    '  IPT="$1"; FAMILY="$2"',
    '  traffic_mode="$(get_opt traffic_mode legacy)"',
    '  case "$traffic_mode" in tproxy) transparent=on ;; tun|off) transparent=off ;; *) transparent="$(get_opt transparent on)" ;; esac',
    '  "$IPT" -t mangle -N "$POLICY_CHAIN" 2>/dev/null || "$IPT" -t mangle -F "$POLICY_CHAIN" || { echo "POLICY_CHAIN_PREPARE_FAILED IPv$FAMILY"; return 1; }',
    '  while "$IPT" -t mangle -D "$POLICY_CHAIN" -j "$POLICY_CHAIN" 2>/dev/null; do :; done',
    '  if [ "$transparent" = "off" ]; then',
    '    "$IPT" -t mangle -A "$POLICY_CHAIN" -j ACCEPT || { echo "POLICY_OFF_ACCEPT_FAILED IPv$FAMILY"; return 1; }',
    '  fi',
    '  add_source_accepts "$IPT" mangle "$POLICY_CHAIN" "$FAMILY" || { echo "DEVICE_BYPASS_RULE_FAILED IPv$FAMILY"; return 1; }',
    '  "$IPT" -t mangle -A "$POLICY_CHAIN" -j RETURN || { echo "POLICY_RETURN_FAILED IPv$FAMILY"; return 1; }',
    '  while "$IPT" -t mangle -D PREROUTING -j "$POLICY_CHAIN" 2>/dev/null; do :; done',
    '  "$IPT" -t mangle -I PREROUTING 1 -j "$POLICY_CHAIN" || { echo "POLICY_HOOK_INSERT_FAILED IPv$FAMILY"; return 1; }',
    '  "$IPT" -t mangle -C PREROUTING -j "$POLICY_CHAIN" >/dev/null 2>&1 || { echo "POLICY_HOOK_VERIFY_FAILED IPv$FAMILY"; return 1; }',
    '}',
    'apply_dns() {',
    '  IPT="$1"; FAMILY="$2"',
    '  dns_hijack="$(get_opt dns_hijack off)"',
    '  dns_port="$(get_opt dns_port 1053)"',
    '  echo "$dns_port" | grep -Eq "^[0-9]{2,5}$" || dns_port=1053',
    '  [ "$dns_hijack" = "on" ] || return 0',
    '  if ! is_port_listening "$dns_port" "$FAMILY"; then echo "IPv$FAMILY DNS \u52ab\u6301\u8df3\u8fc7\uff1a\u7aef\u53e3 $dns_port \u672a\u76d1\u542c"; return 0; fi',
    '  if ! "$IPT" -t nat -L >/dev/null 2>&1; then echo "IPv$FAMILY DNS \u52ab\u6301\u8df3\u8fc7\uff1anat \u8868\u4e0d\u53ef\u7528"; return 0; fi',
    '  "$IPT" -t nat -N "$DNS_CHAIN" 2>/dev/null || "$IPT" -t nat -F "$DNS_CHAIN" || { echo "DNS_CHAIN_PREPARE_FAILED IPv$FAMILY"; return 1; }',
    '  add_source_accepts "$IPT" nat "$DNS_CHAIN" "$FAMILY" || { echo "DNS_BYPASS_RULE_FAILED IPv$FAMILY"; return 1; }',
    '  "$IPT" -t nat -A "$DNS_CHAIN" -p udp --dport 53 -j REDIRECT --to-ports "$dns_port" || { echo "DNS_UDP_REDIRECT_FAILED IPv$FAMILY"; return 1; }',
    '  "$IPT" -t nat -A "$DNS_CHAIN" -p tcp --dport 53 -j REDIRECT --to-ports "$dns_port" || { echo "DNS_TCP_REDIRECT_FAILED IPv$FAMILY"; return 1; }',
    '  "$IPT" -t nat -A "$DNS_CHAIN" -j RETURN || { echo "DNS_RETURN_FAILED IPv$FAMILY"; return 1; }',
    '  while "$IPT" -t nat -D PREROUTING -j "$DNS_CHAIN" 2>/dev/null; do :; done',
    '  "$IPT" -t nat -I PREROUTING 1 -j "$DNS_CHAIN" || { echo "DNS_HOOK_INSERT_FAILED IPv$FAMILY"; return 1; }',
    '}',
    'apply_quic() {',
    '  IPT="$1"; FAMILY="$2"',
    '  quic_block="$(get_opt quic_block off)"',
    '  [ "$quic_block" = "on" ] || return 0',
    '  "$IPT" -t filter -N "$QUIC_CHAIN" 2>/dev/null || "$IPT" -t filter -F "$QUIC_CHAIN" || { echo "QUIC_CHAIN_PREPARE_FAILED IPv$FAMILY"; return 1; }',
    '  add_source_returns "$IPT" filter "$QUIC_CHAIN" "$FAMILY" || { echo "QUIC_BYPASS_RULE_FAILED IPv$FAMILY"; return 1; }',
    '  "$IPT" -t filter -A "$QUIC_CHAIN" -p udp --dport 443 -j DROP || { echo "QUIC_DROP_FAILED IPv$FAMILY"; return 1; }',
    '  "$IPT" -t filter -A "$QUIC_CHAIN" -j RETURN || { echo "QUIC_RETURN_FAILED IPv$FAMILY"; return 1; }',
    '  while "$IPT" -t filter -D FORWARD -j "$QUIC_CHAIN" 2>/dev/null; do :; done',
    '  "$IPT" -t filter -I FORWARD 1 -j "$QUIC_CHAIN" || { echo "QUIC_HOOK_INSERT_FAILED IPv$FAMILY"; return 1; }',
    '}',
    'apply_all() {',
    "  trap 'rc=$?; if [ \"$rc\" -ne 0 ]; then flush_all >/dev/null 2>&1 || true; echo \"POLICY_APPLY_ROLLED_BACK\"; fi; trap - EXIT; exit \"$rc\"' EXIT",
    '  IPT="$(get_ipt iptables)"',
    '  IP6T="$(get_ipt ip6tables)"',
    '  ipv6="$(get_opt ipv6 off)"',
    '  [ -n "$IPT" ] || { echo "IPv4 iptables \u4e0d\u5b58\u5728\uff0c\u62d2\u7edd\u5047\u62a5\u89c4\u5219\u5df2\u5e94\u7528"; exit 1; }',
    '  [ "$ipv6" != "on" ] || [ -n "$IP6T" ] || { echo "IPv6 \u5df2\u5f00\u542f\uff0c\u4f46 ip6tables \u4e0d\u5b58\u5728"; exit 1; }',
    '  mkdir -p "$POLICY_DIR"',
    '  flush_all >/dev/null 2>&1 || true',
    '  if [ "$ipv6" != "on" ] && [ -n "$IP6T" ] && "$IP6T" -t mangle -S PREROUTING 2>/dev/null | grep -q -- "-j $POLICY_CHAIN"; then',
    '    echo "IPV6_POLICY_FLUSH_FAILED"',
    '    exit 1',
    '  fi',
    '  apply_policy "$IPT" 4 || exit 1',
    '  apply_dns "$IPT" 4 || exit 1',
    '  apply_quic "$IPT" 4 || exit 1',
    '  if [ "$ipv6" = "on" ]; then',
    '    apply_policy "$IP6T" 6 || exit 1',
    '    apply_dns "$IP6T" 6 || exit 1',
    '    apply_quic "$IP6T" 6 || exit 1',
    '  fi',
    '  trap - EXIT',
    '  [ "$ipv6" = "on" ] && echo "\u7b56\u7565\u89c4\u5219\u5df2\u5e94\u7528\uff08IPv4/IPv6\uff09" || echo "\u7b56\u7565\u89c4\u5219\u5df2\u5e94\u7528\uff08IPv4\uff09"',
    '}',
    'core_is_running() {',
    '  pidof Clash.Core >/dev/null 2>&1 && return 0',
    '  pidof mihomo >/dev/null 2>&1 && return 0',
    '  pgrep -f "/data/clash/Proxy/[C]lash\\.Core" >/dev/null 2>&1 && return 0',
    '  return 1',
    '}',
    'policy_is_first() {',
    '  IPT="$1"',
    '  FIRST_RULE="$("$IPT" -t mangle -S PREROUTING 2>/dev/null | awk \'$1 == "-A" && $2 == "PREROUTING" {print; exit}\')"',
    '  [ "$FIRST_RULE" = "-A PREROUTING -j $POLICY_CHAIN" ]',
    '}',
    'runtime_firewall_ready() {',
    '  IPT="$1"',
    '  traffic_mode="$(get_opt traffic_mode legacy)"',
    '  [ "$traffic_mode" = "tproxy" ] || return 0',
    '  "$IPT" -t mangle -S PREROUTING 2>/dev/null | grep -Eiq "TPROXY|clash|mihomo"',
    '}',
    'policy_order_stable() {',
    '  IPT="$1"',
    '  policy_is_first "$IPT" || return 1',
    '  [ "$(get_opt ipv6 off)" = "on" ] || return 0',
    '  IP6T="$(get_ipt ip6tables)"',
    '  [ -n "$IP6T" ] && policy_is_first "$IP6T"',
    '}',
    'boot_apply() {',
    '  attempt=0',
    '  stable=0',
    '  while [ "$attempt" -lt 30 ]; do',
    '    attempt=$((attempt + 1))',
    '    if core_is_running; then',
    '      IPT="$(get_ipt iptables)"',
    '      if [ -n "$IPT" ] && runtime_firewall_ready "$IPT"; then',
    '        if policy_order_stable "$IPT"; then',
    '          stable=$((stable + 1))',
    '          if [ "$stable" -ge 5 ]; then',
    '            echo "BOOT_POLICY_STABLE=1 attempts=$attempt"',
    '            return 0',
    '          fi',
    '        else',
    '          stable=0',
    '          (apply_all) || { echo "BOOT_POLICY_APPLY_RETRY=$attempt"; sleep 2; continue; }',
    '        fi',
    '      else',
    '        stable=0',
    '      fi',
    '    else',
    '      stable=0',
    '    fi',
    '    sleep 2',
    '  done',
    '  echo "BOOT_POLICY_STABLE=0 attempts=$attempt"',
    '  return 1',
    '}',
    'status_all() {',
    '  IPT="$(get_ipt iptables)"',
    '  IP6T="$(get_ipt ip6tables)"',
    '  [ -n "$IPT" ] || [ -n "$IP6T" ] || { echo "iptables/ip6tables \u4e0d\u5b58\u5728"; exit 1; }',
    '  echo "[iptables binaries]"',
    '  echo "IPv4=${IPT:-missing}"',
    '  echo "IPv6=${IP6T:-missing}"',
    '  echo',
    '  echo "[iptables candidates]"',
    '  for NAME in iptables ip6tables; do',
    '    echo "$NAME:"',
    '    CANDIDATES="$(list_ipt_candidates "$NAME")"',
    '    if [ -z "$CANDIDATES" ]; then',
    '      echo "  missing"',
    '      continue',
    '    fi',
    '    for BIN in $CANDIDATES; do',
    '      VERSION="$("$BIN" --version 2>&1 | head -n 1)"',
    '      ACTIVE="$("$BIN" -t mangle -S PREROUTING 2>/dev/null | grep -Eic "TPROXY|clash|mihomo|KANO" || true)"',
    '      echo "  $BIN | ${VERSION:-unknown} | active_markers=${ACTIVE:-0}"',
    '    done',
    '  done',
    '  echo',
    '  echo "[Clash.Service firewall references]"',
    '  grep -En "iptables|ip6tables|nft" "$SERVICE_FILE" 2>/dev/null | head -n 20 || true',
    '  echo',
    '  echo "[options]"',
    '  [ -f "$OPTIONS_FILE" ] && cat "$OPTIONS_FILE" || echo "transparent=on"',
    '  echo',
    '  echo "[device bypass: normalized]"',
    '  normalize_sources || true',
    '  echo',
    '  echo "[mangle PREROUTING]"',
    '  [ -z "$IPT" ] || "$IPT" -t mangle -S PREROUTING 2>/dev/null || true',
    '  echo',
    '  echo "[$POLICY_CHAIN]"',
    '  [ -z "$IPT" ] || "$IPT" -t mangle -S "$POLICY_CHAIN" 2>/dev/null || true',
    '  echo "[$POLICY_CHAIN counters]"',
    '  [ -z "$IPT" ] || "$IPT" -t mangle -nvxL "$POLICY_CHAIN" --line-numbers 2>/dev/null || true',
    '  echo',
    '  echo "[nat DNS]"',
    '  [ -z "$IPT" ] || "$IPT" -t nat -S PREROUTING 2>/dev/null | grep "$DNS_CHAIN" || true',
    '  [ -z "$IPT" ] || "$IPT" -t nat -S "$DNS_CHAIN" 2>/dev/null || true',
    '  echo',
    '  echo "[filter QUIC]"',
    '  [ -z "$IPT" ] || "$IPT" -t filter -S FORWARD 2>/dev/null | grep "$QUIC_CHAIN" || true',
    '  [ -z "$IPT" ] || "$IPT" -t filter -S OUTPUT 2>/dev/null | grep "$QUIC_CHAIN" || true',
    '  [ -z "$IPT" ] || "$IPT" -t filter -S "$QUIC_CHAIN" 2>/dev/null || true',
    '  echo',
    '  echo "[clients]"',
    '  cat /proc/net/arp 2>/dev/null || true',
    '  if [ -n "$IP6T" ]; then',
    '    echo',
    '    echo "[IPv6 mangle PREROUTING]"',
    '    "$IP6T" -t mangle -S PREROUTING 2>/dev/null | grep -E "$POLICY_CHAIN|TPROXY|clash|mihomo|KANO" || true',
    '    echo "[IPv6 $POLICY_CHAIN]"',
    '    "$IP6T" -t mangle -S "$POLICY_CHAIN" 2>/dev/null || true',
    '    echo "[IPv6 nat DNS]"',
    '    "$IP6T" -t nat -S "$DNS_CHAIN" 2>/dev/null || true',
    '    echo "[IPv6 filter QUIC]"',
    '    "$IP6T" -t filter -S "$QUIC_CHAIN" 2>/dev/null || true',
    '  fi',
    '}',
    'case "$1" in',
    '  apply) apply_all ;;',
    '  boot-apply) boot_apply ;;',
    '  flush) flush_all; echo "\u7b56\u7565\u89c4\u5219\u5df2\u6e05\u7a7a" ;;',
    '  status) status_all ;;',
    '  *) apply_all ;;',
    'esac',
  ].join('\n');

  const ensurePolicyToolsScript = async ({ syncStorage = true } = {}) => {
    const script = buildPolicyToolsScript();
    const res = await runShellWithRoot(`
        set -e
        TARGET=${shellQuote(CLASH_POLICY_SCRIPT)}
        VERSION_MARKER=${shellQuote(`# KANO_POLICY_SCRIPT_VERSION=${POLICY_SCRIPT_VERSION}`)}
        if [ -x "$TARGET" ] && grep -qxF "$VERSION_MARKER" "$TARGET" 2>/dev/null; then
          echo "POLICY_SCRIPT_VERSION=${POLICY_SCRIPT_VERSION}"
          echo "POLICY_SCRIPT_UNCHANGED=1"
          exit 0
        fi
        STAGE="$TARGET.kano_new.$$"
        CHECK_OUT=/data/kano_policy_script_check.out
        cleanup_policy_script() {
          rc=$?
          rm -f "$STAGE" "$CHECK_OUT" 2>/dev/null || true
          trap - EXIT
          exit "$rc"
        }
        trap cleanup_policy_script EXIT
        mkdir -p ${shellQuote(`${CLASH_DIR}/Scripts`)} ${shellQuote(CLASH_POLICY_DIR)}
        cat > "$STAGE" <<'KANO_POLICY_TOOLS_EOF'
${script}
KANO_POLICY_TOOLS_EOF
        chmod 755 "$STAGE"
        if [ -x /system/bin/sh ] && /system/bin/sh -n /dev/null >/dev/null 2>&1; then
          /system/bin/sh -n "$STAGE" >"$CHECK_OUT" 2>&1 || {
            echo "POLICY_SCRIPT_SYNTAX_FAILED"
            cat "$CHECK_OUT" 2>/dev/null || true
            exit 1
          }
          echo "POLICY_SCRIPT_SYNTAX=ok"
        else
          echo "POLICY_SCRIPT_SYNTAX=unsupported"
        fi
        mv -f "$STAGE" "$TARGET"
        trap - EXIT
        rm -f "$CHECK_OUT" 2>/dev/null || true
        echo "POLICY_SCRIPT_VERSION=${POLICY_SCRIPT_VERSION}"
        `);
    if (!res.success) {
      createToast(`\u5199\u5165\u7b56\u7565\u5de5\u5177\u811a\u672c\u5931\u8d25<br>${safeTextToHtml(res.content || '')}`, 'red', 8000);
      return false;
    }
    if (syncStorage && !(await syncUnifiedDeviceBypassStorage())) {
      createToast('统一 IP/MAC 绕过存储失败，未应用新规则', 'red', 8000);
      return false;
    }
    return true;
  };

  const parsePolicyOptionsText = (text = '') => {
    const options = {
      traffic_mode: '',
      transparent: 'on',
      ipv6: 'off',
      quic_block: 'off',
      dns_hijack: 'off',
      dns_port: '1053',
      proxy_group: 'Proxy',
    };
    String(text || '').split('\n').forEach((line) => {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (m) options[m[1]] = m[2];
    });
    if (!['tproxy', 'tun', 'off'].includes(options.traffic_mode)) {
      options.traffic_mode = options.transparent == 'off' ? 'off' : 'tproxy';
    }
    return options;
  };

  const readPolicyState = async () => {
    const helperResult = await runBinaryHelperJson('policy-read', [
      '--options', CLASH_POLICY_OPTIONS_FILE,
      '--device', CLASH_DEVICE_BYPASS_FILE,
      '--direct-domain', CLASH_DIRECT_DOMAIN_FILE,
      '--direct-ip', CLASH_DIRECT_IP_FILE,
      '--proxy-domain', CLASH_PROXY_DOMAIN_FILE,
      '--reject-domain', CLASH_REJECT_DOMAIN_FILE,
    ]);
    if (helperResult) {
      return {
        options: parsePolicyOptionsText(helperResult.options || ''),
        deviceBypass: String(helperResult.deviceBypass || ''),
        directDomain: String(helperResult.directDomain || ''),
        directIp: String(helperResult.directIp || ''),
        proxyDomain: String(helperResult.proxyDomain || ''),
        rejectDomain: String(helperResult.rejectDomain || ''),
      };
    }
    const res = await runShellWithRoot(`
        emit_policy_file() {
          name="$1"
          path="$2"
          [ -f "$path" ] || return 0
          timeout 5s awk -v prefix="KANO_POLICY_\${name}=" '{print prefix $0}' "$path"
        }
        emit_policy_file options ${shellQuote(CLASH_POLICY_OPTIONS_FILE)}
        emit_policy_file deviceBypass ${shellQuote(CLASH_DEVICE_BYPASS_FILE)}
        emit_policy_file directDomain ${shellQuote(CLASH_DIRECT_DOMAIN_FILE)}
        emit_policy_file directIp ${shellQuote(CLASH_DIRECT_IP_FILE)}
        emit_policy_file proxyDomain ${shellQuote(CLASH_PROXY_DOMAIN_FILE)}
        emit_policy_file rejectDomain ${shellQuote(CLASH_REJECT_DOMAIN_FILE)}
        `);
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
    try {
      let optionsText = '';
      const snapshot = await readBinarySnapshot();
      if (snapshot) {
        optionsText = String(snapshot.options || '');
      } else {
        const res = await runShellWithRoot(`[ -f ${shellQuote(CLASH_POLICY_OPTIONS_FILE)} ] && timeout 5s cat ${shellQuote(CLASH_POLICY_OPTIONS_FILE)}; exit 0`);
        if (res.success) optionsText = String(res.content || '');
      }
      updateModeBadge(parsePolicyOptionsText(optionsText).traffic_mode);
    } catch (e) {
      console.error('refresh mode badge failed', e);
    }
  };

  const normalizeIpLike = (value = '') => {
    const item = String(value || '').trim();
    const match = item.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/);
    if (!match) return '';
    const octets = match[1].split('.').map((part) => Number(part));
    if (octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return '';
    if (match[2] != null) {
      const cidr = Number(match[2]);
      if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) return '';
    }
    return item;
  };

  const normalizeIpv6Like = (value = '') => {
    const item = String(value || '').trim();
    const match = item.match(/^([0-9A-Fa-f:]+)(?:\/(\d{1,3}))?$/);
    if (!match || !match[1].includes(':') || match[1].split('::').length > 2) return '';
    const parts = match[1].split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts.length == 2 && parts[1] ? parts[1].split(':') : [];
    if ([...left, ...right].some((part) => !/^[0-9A-Fa-f]{1,4}$/.test(part))) return '';
    if (parts.length == 1 ? left.length != 8 : left.length + right.length >= 8) return '';
    if (match[2] != null && Number(match[2]) > 128) return '';
    return item.toLowerCase();
  };

  const normalizeDeviceBypassText = (value = '') => {
    const invalid = [];
    const seen = new Set();
    const rows = [];
    String(value || '').split('\n').forEach((line, index) => {
      const raw = line.trim();
      if (!raw || raw.startsWith('#')) return;
      const item = raw.split(/\s+/)[0];
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

  const savePolicyState = async (state, { apply = true } = {}) => {
    const normalizedDevice = normalizeDeviceBypassText(state.deviceBypass || '');
    if (normalizedDevice.invalid.length > 0) {
      createToast(`\u8bbe\u5907\u7ed5\u8fc7\u5217\u8868\u6709\u683c\u5f0f\u9519\u8bef\uff1a<br>${textToHtml(normalizedDevice.invalid.slice(0, 8).join('\n'))}`, 'red', 8000);
      return false;
    }
    const macMirrorRows = normalizedDevice.text.split('\n')
      .map((line) => normalizeMac(line.trim()))
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) == index);
    const macMirrorText = macMirrorRows.join('\n') + (macMirrorRows.length ? '\n' : '');
    const trafficMode = ['tproxy', 'tun', 'off'].includes(state.options.traffic_mode)
      ? state.options.traffic_mode
      : 'tproxy';
    const transparent = trafficMode == 'tproxy' ? 'on' : 'off';
    const ipv6 = state.options.ipv6 == 'on' ? 'on' : 'off';
    const quicBlock = state.options.quic_block == 'on' ? 'on' : 'off';
    const dnsHijack = trafficMode == 'tproxy' && state.options.dns_hijack == 'on' ? 'on' : 'off';
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
      .map((path, index) => `snapshot_policy_file ${index} ${shellQuote(path)}`)
      .join('\n');
    const restorePolicyFilesCmd = policyTransactionFiles
      .map((path, index) => `restore_policy_file ${index} ${shellQuote(path)} || restore_rc=1`)
      .reverse()
      .join('\n');
    const res = await runShellWithRoot(`
        set -e
        TX=/data/kano_policy_save.$$
        snapshot_policy_file() {
          name="$1"
          path="$2"
          if [ -e "$path" ]; then
            cp -p "$path" "$TX/$name" 2>/dev/null || cp "$path" "$TX/$name"
            touch "$TX/$name.had"
          else
            touch "$TX/$name.absent"
          fi
        }
        restore_policy_file() {
          name="$1"
          path="$2"
          if [ -f "$TX/$name.had" ] && [ -f "$TX/$name" ]; then
            mkdir -p "$(dirname "$path")"
            restored="$path.kano_restore.$$"
            cp -p "$TX/$name" "$restored" 2>/dev/null || cp "$TX/$name" "$restored" || return 1
            mv -f "$restored" "$path" || return 1
          elif [ -f "$TX/$name.absent" ]; then
            rm -f "$path" || return 1
          fi
          return 0
        }
        finish_policy_save() {
          rc=$?
          trap - EXIT
          if [ "$rc" -ne 0 ]; then
            set +e
            restore_rc=0
            ${restorePolicyFilesCmd}
            [ "$restore_rc" -eq 0 ] || rc=1
          fi
          rm -rf "$TX" 2>/dev/null || true
          exit "$rc"
        }
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
        trap - EXIT
        rm -rf "$TX" 2>/dev/null || true
        `);
    if (!res.success || !String(res.content || '').includes('POLICY_STATE_COMMITTED')) {
      createToast(`\u4fdd\u5b58\u7b56\u7565\u914d\u7f6e\u5931\u8d25<br>${safeTextToHtml(res.content || '')}`, 'red', 8000);
      return false;
    }
    invalidateBinarySnapshot();
    if (apply) return await applyPolicyToolsRules({ ensureScript: false });
    createToast('\u7b56\u7565\u914d\u7f6e\u5df2\u4fdd\u5b58', 'green');
    return true;
  };

  const applyPolicyToolsRules = async ({ ensureScript = true } = {}) => {
    if (ensureScript && !(await ensurePolicyToolsScript())) return false;
    const res = await runShellWithRoot(`
        set -e
        ${shellQuote(CLASH_POLICY_SCRIPT)} apply
        ${shellQuote(CLASH_POLICY_SCRIPT)} status
        `);
    if (!res.success) {
      createToast(`\u7b56\u7565\u89c4\u5219\u5e94\u7528\u5931\u8d25<br>${safeTextToHtml(res.content || '')}`, 'red', 9000);
      return false;
    }
    createToast('\u7b56\u7565\u89c4\u5219\u5df2\u5e94\u7528', 'green', 7000);
    return true;
  };

  const reapplyPolicyRulesSilent = async ({ ensureScript = true } = {}) => {
    if (ensureScript && !(await ensurePolicyToolsScript())) return false;
    const res = await runShellWithRoot(`${shellQuote(CLASH_POLICY_SCRIPT)} apply`);
    return res.success;
  };


  const readClientListText = async () => {
    const helperResult = await runBinaryHelperJson('clients');
    if (helperResult) return String(helperResult.text || '');
    const res = await runShellWithRoot(`
        echo "IP MAC SOURCE"
        awk 'NR>1 && $1 != "IP" && $4 != "00:00:00:00:00:00" {print $1, $4, "arp"}' /proc/net/arp 2>/dev/null
        ip neigh 2>/dev/null | awk 'NF >= 5 {ip=$1; mac=""; for(i=1;i<=NF;i++){if($i=="lladdr") mac=$(i+1)} if(mac!="") print ip, mac, "neigh"}'
        `);
    if (!res.success) return '';
    const seen = new Set();
    return String(res.content || '').split('\n').filter((line, index) => {
      if (index == 0) return true;
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) return false;
      const key = `${parts[0]} ${parts[1]}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).join('\n');
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
    const state = await readPolicyState();
    const { el, close } = createFixedToast(
      'mm_policy_tools_toast',
      `
        <style>
          #kano_policy_shell{pointer-events:all;width:94vw;max-width:960px;box-sizing:border-box;}
          #kano_policy_shell *{box-sizing:border-box;}
          #kano_policy_shell .kp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;}
          #kano_policy_shell .kp-title{font-size:.82rem;font-weight:800;line-height:1.2;}
          #kano_policy_shell .kp-body{display:grid;grid-template-columns:170px 1fr;gap:12px;max-height:72vh;min-height:430px;}
          #kano_policy_shell .kp-nav{border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:8px;background:rgba(255,255,255,.045);height:max-content;}
          #kano_policy_shell .kp-tab{width:100%;text-align:left;border:1px solid transparent;border-radius:10px;padding:10px 11px;margin-bottom:6px;background:transparent;color:inherit;font-size:.64rem;line-height:1.25;}
          #kano_policy_shell .kp-tab:last-child{margin-bottom:0;}
          #kano_policy_shell .kp-tab.kp-active{background:var(--dark-btn-color-active);border-color:rgba(255,255,255,.18);color:#fff;}
          #kano_policy_shell .kp-main{min-width:0;overflow:auto;padding-right:4px;}
          #kano_policy_shell .kp-panel{display:none;}
          #kano_policy_shell .kp-panel.kp-show{display:block;}
          #kano_policy_shell .kp-card{border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:13px;background:rgba(255,255,255,.045);margin-bottom:10px;}
          #kano_policy_shell .kp-card-title{font-size:.70rem;font-weight:800;margin-bottom:8px;}
          #kano_policy_shell .kp-desc{font-size:.60rem;line-height:1.6;opacity:.72;margin:6px 0 10px;}
          #kano_policy_shell .kp-row{display:grid;grid-template-columns:140px 1fr;gap:10px;align-items:center;padding:8px 0;border-top:1px solid rgba(255,255,255,.08);font-size:.63rem;}
          #kano_policy_shell .kp-row:first-of-type{border-top:none;}
          #kano_policy_shell .kp-label{opacity:.82;font-weight:700;}
          #kano_policy_shell input,#kano_policy_shell select,#kano_policy_shell textarea{border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(0,0,0,.45);color:inherit;outline:none;}
          #kano_policy_shell select,#kano_policy_shell input{padding:8px;}
          #kano_policy_shell textarea{width:100%;min-height:130px;padding:10px;font-family:monospace;line-height:1.45;resize:vertical;}
          #kano_policy_shell .kp-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
          #kano_policy_shell .kp-actions button,#kano_policy_shell .kp-footer button{font-size:.62rem;border-radius:9px;padding:8px 10px;}
          #kano_policy_shell .kp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
          #kano_policy_shell .kp-mini{font-size:.58rem;line-height:1.45;opacity:.68;margin-top:6px;}
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
                    <label><input id="mm_policy_quic" type="checkbox"> \u62e6\u622a UDP/443\uff0c\u4f7f\u5e94\u7528\u56de\u843d TCP</label>
                  </div>
                  <div class="kp-row">
                    <div class="kp-label">DNS \u52ab\u6301</div>
                    <label><input id="mm_policy_dns" type="checkbox"> \u52ab\u6301 53 \u5230 mihomo DNS \u7aef\u53e3 <input id="mm_policy_dns_port" style="width:82px;margin-left:6px;" value="1053"></label>
                  </div>
                </div>
              </section>

              <section class="kp-panel" data-policy-panel="device">
                <div class="kp-card">
                  <div class="kp-card-title">设备直连</div>
                  <div class="kp-desc">列表中的 IP、网段或 MAC 不经过代理。</div>
                  <textarea id="mm_policy_device" spellcheck="false" placeholder="192.168.0.50&#10;fd00::/64&#10;AA:BB:CC:DD:EE:FF"></textarea>
                  <div class="kp-actions" style="margin-top:9px;">
                    <button type="button" id="mm_policy_scan_clients">\u626b\u63cf\u5ba2\u6237\u7aef</button>
                  </div>
                  <div id="mm_policy_clients" class="kp-mini" aria-live="polite"></div>
                </div>
              </section>

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
    activatePolicyTab(['network', 'device', 'maintain'].includes(initialTab) ? initialTab : 'network');

    get('#mm_policy_traffic_mode').value = state.options.traffic_mode || 'tproxy';
    get('#mm_policy_ipv6').checked = state.options.ipv6 == 'on';
    get('#mm_policy_quic').checked = state.options.quic_block == 'on';
    get('#mm_policy_dns').checked = state.options.dns_hijack == 'on';
    get('#mm_policy_dns_port').value = state.options.dns_port || '1053';
    get('#mm_policy_device').value = state.deviceBypass || '';

    const collectState = () => ({
      options: {
        traffic_mode: get('#mm_policy_traffic_mode').value,
        ipv6: get('#mm_policy_ipv6').checked ? 'on' : 'off',
        quic_block: get('#mm_policy_quic').checked ? 'on' : 'off',
        dns_hijack: get('#mm_policy_dns').checked ? 'on' : 'off',
        dns_port: get('#mm_policy_dns_port').value,
        proxy_group: state.options.proxy_group || 'Proxy',
      },
      deviceBypass: get('#mm_policy_device').value,
      directDomain: state.directDomain,
      directIp: state.directIp,
      proxyDomain: state.proxyDomain,
      rejectDomain: state.rejectDomain,
    });

    get('#mm_policy_close').onclick = close;
    const appendDeviceBypassValue = (value = '') => {
      const item = String(value || '').trim();
      if (!item) return;
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
        const lines = String(text || '').split('\n').slice(1).filter(Boolean);
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
          macEl.textContent = mac || '';
          const addIp = document.createElement('button');
          addIp.className = 'add_ip';
          addIp.style.fontSize = '.58rem';
          addIp.dataset.ip = ip || '';
          addIp.textContent = '\u52a0 IP';
          const addMac = document.createElement('button');
          addMac.className = 'add_mac';
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
          btn.onclick = () => appendDeviceBypassValue(btn.dataset.mac);
        });
      } finally {
        setButtonBusy(scanBtn, false);
      }
    };

    get('#mm_policy_save_apply').onclick = async () => {
      const btn = get('#mm_policy_save_apply');
      const operationToken = acquireCriticalOperation('保存网络与设备设置');
      if (!operationToken) return;
      setButtonBusy(btn, true, '\u4fdd\u5b58\u4e2d\u2026');
      try {
        const nextState = collectState();
        const modeSelectionChanged = nextState.options.traffic_mode != state.options.traffic_mode ||
          nextState.options.ipv6 != state.options.ipv6;
        const coreTunEnabled = await readCoreTunEnabled();
        const coreOutOfSync = coreTunEnabled !== null &&
          coreTunEnabled !== (nextState.options.traffic_mode == 'tun');
        const coreModeChanged = modeSelectionChanged || coreOutOfSync;
        if (modeSelectionChanged && nextState.options.traffic_mode == 'tun') {
          const confirmed = await askConfirm(
            'mm_tun_mode_confirm',
            '\u5207\u6362\u5230 TUN \u6a21\u5f0f\uff1f',
            '\u4f1a\u5173\u95ed F50 \u4fa7 TProxy \u63a5\u7ba1\uff0c\u5199\u5165 Mihomo TUN \u914d\u7f6e\u5e76\u91cd\u542f\u6838\u5fc3\u3002Android \u4e0b TUN \u5bf9\u70ed\u70b9/\u4e2d\u7ee7\u7684\u4e0b\u6e38\u6d41\u91cf\u53ef\u80fd\u65e0\u6cd5\u5b8c\u6574\u63a5\u7ba1\u3002',
            '\u5207\u6362\u5e76\u91cd\u542f',
            '\u53d6\u6d88',
          );
          if (!confirmed) return;
        }
        const modeRollbackPath = coreModeChanged ? await createConfigRollbackPoint('traffic_mode_switch') : '';
        if (coreModeChanged && !modeRollbackPath) {
          createToast('无法创建流量模式回滚点，已取消切换。', 'red', 8000);
          return;
        }
        if (!(await savePolicyState(nextState, { apply: !coreModeChanged }))) return;
        if (coreModeChanged) {
          createToast('\u6d41\u91cf\u6a21\u5f0f\u5df2\u4fdd\u5b58\uff0c\u6b63\u5728\u91cd\u542f\u6838\u5fc3...', 'yellow');
          if (await restartClash({ skipCheck: true })) {
            state.options = { ...nextState.options };
          } else {
            const modeRestored = await savePolicyState({
              ...nextState,
              options: {
                ...nextState.options,
                traffic_mode: state.options.traffic_mode,
                ipv6: state.options.ipv6,
              },
            }, { apply: false });
            const configRestored = await restoreConfigRollbackPoint(
              modeRollbackPath,
              '切换流量模式',
              { showToast: false },
            );
            get('#mm_policy_traffic_mode').value = state.options.traffic_mode;
            get('#mm_policy_ipv6').checked = state.options.ipv6 == 'on';
            const recoveryOk = configRestored && await restartClash({ skipCheck: true });
            const rollbackComplete = modeRestored && configRestored;
            createToast(
              rollbackComplete && recoveryOk
                ? '切换失败，旧模式、旧配置和核心已恢复。'
                : rollbackComplete
                  ? '切换失败，旧模式和旧配置已恢复；核心仍未启动，已清理网络规则。'
                  : '切换失败，且旧模式或旧配置未能完整恢复。',
              rollbackComplete && recoveryOk ? 'yellow' : 'red',
              10000,
            );
          }
        } else {
          state.options = { ...nextState.options };
        }
      } catch (e) {
        console.error(e);
        createToast(
          `保存流量模式时中断：${escapeHtml(e && e.message ? e.message : String(e || ''))}<br>已保留原模式，请重新打开面板确认状态。`,
          'red',
          10000,
        );
        await savePolicyState({ ...state, options: { ...state.options } }, { apply: false });
      } finally {
        setButtonBusy(btn, false);
        releaseCriticalOperation(operationToken);
      }
    };
    get('#mm_policy_fix_runtime_config').onclick = async () => {
      const btn = get('#mm_policy_fix_runtime_config');
      const operationToken = acquireCriticalOperation('修复代理配置');
      if (!operationToken) return;
      setButtonBusy(btn, true, '\u4fee\u590d\u4e2d\u2026');
      try {
        await restartClash({ skipCheck: true });
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
  };

  const stopClash = async ({ skipCheck = false, showOutput = true } = {}) => {
    if (!skipCheck && !(await ensureReady())) return false;
    createToast('\u6b63\u5728\u505c\u6b62\u6838\u5fc3...', 'yellow');
    const res = await runShellWithRoot(`
        set +e
        stop_rc=0
        if [ -f ${shellQuote(CLASH_SERVICE)} ]; then
          ${shellQuote(CLASH_SERVICE)} stop
          stop_rc=$?
        else
          echo "Clash.Service \u4e0d\u5b58\u5728"
          stop_rc=1
        fi
        sleep 1
        ${flushGeneratedRulesCmd()}
        cleanup_rc=0
        ${verifyGeneratedRulesFlushedCmd()} || cleanup_rc=1
        if [ "$cleanup_rc" -eq 0 ]; then
          echo "\u5df2\u6e05\u7406\u63d2\u4ef6\u81ea\u5efa\u89c4\u5219"
        else
          echo "STOP_RULE_CLEANUP_INCOMPLETE"
        fi
        [ "$stop_rc" -eq 0 ] && [ "$cleanup_rc" -eq 0 ]
        `);
    if (!res.success) {
      createToast(`停止核心或清理插件规则失败。<br>${safeTextToHtml(res.content || '')}`, 'red', 9000);
      await isMMRunning();
      return false;
    }
    if (showOutput) {
      createToast('核心已停止，插件规则已清理', 'green');
    }
    await isMMRunning();
    return true;
  };

  const restartClash = async ({ skipCheck = false } = {}) => {
    if (!skipCheck && !(await ensureReady())) return false;
    createToast(
      '\u6b63\u5728\u91cd\u542f\u6838\u5fc3...',
      'yellow',
    );
    const sanitized = await sanitizeConfigForTProxy({ showToast: false });
    if (!sanitized) createToast('配置增强整理未完成，已按现有 config.yaml 继续启动核心。', 'yellow', 8000);
    const res = await startClashServiceClean({ stopFirst: true, reason: '\u91cd\u542f' });
    if (!res.success) {
      const startState = parseKeyValueOutput(res.content || '').START_STATE || '';
      if (startState == 'config_invalid' || startState == 'config_missing') {
        createToast(`配置校验失败，未停止当前正在运行的核心<br>${safeTextToHtml(res.content || '')}`, 'red', 12000);
        await isMMRunning();
        return false;
      }
      await networkRescue({ stopService: true, showOutput: false, reason: '\u91cd\u542f\u5931\u8d25' });
      createToast(`重启失败，已自动清理规则<br>${safeTextToHtml(res.content || '')}`, 'red', 10000);
      return false;
    }
    if (!(await verifyStartOrRollback('\u91cd\u542f'))) return false;
    const trafficModeOk = await ensureRuntimeTrafficMode(lastSanitizedTrafficMode);
    const rulesOk = await reapplyPolicyRulesSilent();
    if (!trafficModeOk || !rulesOk) {
      const failedParts = [
        trafficModeOk ? '' : '流量模式同步',
        rulesOk ? '' : '网络策略应用',
      ].filter(Boolean).join('、');
      createToast(`核心 API 已启动，但${failedParts}失败`, 'red', 10000);
      await isMMRunning();
      return false;
    }
    createToast('核心已重启，运行配置和网络策略已生效', 'green');
    await isMMRunning();
    return true;
  };

  const btn_restart = document.createElement('button');
  btn_restart.classList.add('btn');
  btn_restart.textContent = '\u91cd\u542f\u6838\u5fc3';
  btn_restart.onclick = async () => {
    await runCriticalOperation('重启核心', async () => {
      setButtonBusy(btn_restart, true, '重启中…');
      try {
        return await restartClash();
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
    const formData = new FormData();
    formData.append('file', file);
    let res = null;
    try {
      res = await (
        await fetch(`${KANO_baseURL}/upload_img`, {
          method: 'POST',
          headers: common_headers,
          body: formData,
        })
      ).json();
    } catch (e) {
      createToast(`\u914d\u7f6e\u5305\u4e0a\u4f20\u5931\u8d25<br>${safeTextToHtml(e && e.message ? e.message : e)}`, 'red', 9000);
      return false;
    }
    if (!res || !res.url) {
      createToast(`\u914d\u7f6e\u5305\u4e0a\u4f20\u5931\u8d25<br>${safeTextToHtml(res && res.error ? res.error : '')}`, 'red', 9000);
      return false;
    }

    const uploadedPath = getUploadedPath(res.url);
    const requiredNamesCmd = requiredNames.map((name) => shellQuote(name)).join(' ');
    const restoreStageFilesCmd = restoreFiles.map((item) => {
      const mode = /\.(?:yaml|yml)$/i.test(item.label) ? '644' : '600';
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
      const mode = /\.(?:yaml|yml)$/i.test(item.label) ? '644' : '600';
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
        ${setConfigSourceCmd('config_package_restore')}
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
        ? await ensureRuntimeTrafficMode(lastSanitizedTrafficMode) && await reapplyPolicyRulesSilent()
        : await restartClash({ skipCheck: true });
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
    const packageCheck = await validateConfigFileStructure(CLASH_CONFIG, 'config.yaml');
    if (!packageCheck.ok) {
      await rollbackRestoredPackage('导入配置包结构检查', packageCheck.message);
      return false;
    }
    const reloadRes = await reloadConfigHot(oldControllerInfo);
    let runningOk = reloadRes.success;
    if (!runningOk) {
      createToast(`\u70ed\u91cd\u8f7d\u5931\u8d25\uff0c\u5df2\u6539\u7528\u670d\u52a1\u91cd\u542f<br>${safeTextToHtml(reloadRes.responseText || reloadRes.content || '')}`, 'yellow');
      runningOk = await restartClash({ skipCheck: true });
    } else {
      const trafficModeOk = await ensureRuntimeTrafficMode(lastSanitizedTrafficMode);
      const rulesOk = await reapplyPolicyRulesSilent();
      runningOk = trafficModeOk && rulesOk;
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
              <iframe id="mm_iframe" src="javascript:;"></iframe>
            </div>
        </div>
    </div>
</div>
`,
    );
    syncCriticalOperationStatus();

    const WEB_VISIBLE_KEY = 'kano_mm_web_panel_visible';
    const isWebPanelVisible = () => localStorage.getItem(WEB_VISIBLE_KEY) != 'hidden';
    let webPanelToggleBtn = null;
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
        iframe.src = await buildPanelUrl();
      }
      if (!visible) {
        iframe.src = 'javascript:;';
      }
    };
    const refreshPanel = async ({ forceShow = false } = {}) => {
      if (forceShow) await setWebPanelVisible(true, { load: false });
      if (!isWebPanelVisible()) {
        createToast('面板已隐藏，请先点击“显示面板”。', 'yellow', 4500);
        return;
      }
      const iframe = document.querySelector('#mm_iframe');
      if (iframe) iframe.src = await buildPanelUrl();
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
      const a = document.createElement('a');
      a.href = await buildPanelUrl();
      a.target = '_blank';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
    };

    const controllerSettingsBtn = document.createElement('button');
    controllerSettingsBtn.classList.add('btn');
    controllerSettingsBtn.textContent = '面板连接';
    controllerSettingsBtn.onclick = async () => {
      if (!(await ensureReady())) return;
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
      if (!(await ensureReady())) return;
      const operationToken = acquireCriticalOperation('修改开机自启');
      if (!operationToken) return;
      setButtonBusy(boot_on, true, '处理中…');
      try {
        const before = await inspectBootIntegration();
        const result = await runShellWithRoot(before.enabled ? removeBootLinesCmd() : addBootLinesCmd());
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
      if (!(await ensureAdvanced())) return;
      setButtonBusy(showLogBtn, true, '读取中…');
      try {
        await showStatusDiagnostic();
      } finally {
        setButtonBusy(showLogBtn, false);
      }
    };

    const helperUploadEl = document.createElement('input');
    helperUploadEl.type = 'file';
    helperUploadEl.style.display = 'none';
    document.body.appendChild(helperUploadEl);

    const binaryHelperBtn = document.createElement('button');
    binaryHelperBtn.classList.add('btn');
    binaryHelperBtn.textContent = '转换组件';
    const binaryHelperUploadBtn = document.createElement('button');
    binaryHelperUploadBtn.classList.add('btn');
    binaryHelperUploadBtn.textContent = '导入组件';
    const applyBinaryHelperButtonState = (probe = {}) => {
      const installed = probe.state == 'installed';
      const info = probe.info || null;
      const version = info && info.version ? String(info.version) : '';
      binaryHelperBtn.dataset.helperState = probe.state || 'unknown';
      binaryHelperBtn.style.background = installed ? 'var(--dark-btn-color-active)' : '';
      if (installed) {
        binaryHelperBtn.textContent = version ? `转换组件 ✓ ${version}` : '转换组件 ✓';
        binaryHelperBtn.title = '转换组件正常；点击检查更新';
      } else if (probe.state == 'missing') {
        binaryHelperBtn.textContent = '安装转换组件';
        binaryHelperBtn.title = '当前使用 Shell 兼容模式；点击安装转换组件';
      } else if (probe.state == 'invalid') {
        binaryHelperBtn.textContent = '修复转换组件';
        binaryHelperBtn.title = '转换组件异常；点击修复';
      } else {
        binaryHelperBtn.textContent = '修复转换组件';
        binaryHelperBtn.title = '转换组件不可用；点击重装';
      }
    };
    const refreshBinaryHelperButton = async (timeout = 12 * 1000) => {
      const probe = await probeBinaryHelperState(timeout);
      applyBinaryHelperButtonState(probe);
      return probe;
    };
    const scheduleBinaryHelperButtonRefresh = ({ delay = 1000, retryDelay = 1500 } = {}) => {
      const run = async (retry) => {
        let probe = null;
        try {
          probe = await refreshBinaryHelperButton(6 * 1000);
        } catch (e) {
          console.error('辅助内核延迟状态探测失败', e);
        }
        if (retry && (!probe || probe.state != 'installed')) {
          setTimeout(() => run(false), retryDelay);
        }
      };
      setTimeout(() => run(true), delay);
    };
    helperUploadEl.onchange = async (event) => {
      try {
        const file = event && event.target && event.target.files && event.target.files[0];
        if (!file) return;
        setButtonBusy(binaryHelperUploadBtn, true, '安装中…');
        await installBinaryHelperFromFile(file);
      } finally {
        helperUploadEl.value = '';
        setButtonBusy(binaryHelperUploadBtn, false);
        await refreshBinaryHelperButton();
      }
    };
    binaryHelperBtn.onclick = async () => {
      if (!(await ensureAdvanced())) return;
      const current = await refreshBinaryHelperButton();
      const isUpdate = current.state != 'missing';
      if (isUpdate) {
        const healthy = current.state == 'installed';
        const confirmed = await askConfirm(
          `mm_binary_helper_update_${createRandomString(4)}`,
          healthy ? '检查转换组件更新？' : '修复转换组件？',
          '优先从 Gitee 下载，失败后使用本地安装包；可用版本只升级不降级。',
          healthy ? '检查更新' : '更新修复',
          '取消',
        );
        if (!confirmed) return;
      }
      setButtonBusy(binaryHelperBtn, true, '下载中…');
      try {
        await installBinaryHelperPreferred({ preferGitee: isUpdate });
      } finally {
        setButtonBusy(binaryHelperBtn, false);
        await refreshBinaryHelperButton();
      }
    };
    binaryHelperUploadBtn.onclick = async () => {
      if (!(await ensureAdvanced())) return;
      helperUploadEl.click();
    };
    // Read-only status probe on page load. Never downloads or installs the optional helper automatically.
    refreshBinaryHelperButton().catch((e) => console.error('辅助内核状态探测失败', e));

    const userAgentBtn = document.createElement('button');
    userAgentBtn.classList.add('btn');
    userAgentBtn.textContent = '订阅请求头';
    userAgentBtn.onclick = async () => {
      if (!(await ensureReady())) return;
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
      const operationToken = acquireCriticalOperation('恢复网络');
      if (!operationToken) return;
      setButtonBusy(rescueBtn, true, '\u6062\u590d\u4e2d\u2026');
      try {
        await networkRescue({ stopService: true, showOutput: true, reason: '\u624b\u52a8\u65ad\u7f51\u6062\u590d' });
      } finally {
        setButtonBusy(rescueBtn, false);
        releaseCriticalOperation(operationToken);
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
      const res = await runShellWithRoot(`
        mkdir -p ${shellQuote(CLASH_PROXY_DIR)} ${shellQuote(`${CLASH_DIR}/Tools`)} ${shellQuote(CLASH_POLICY_DIR)}
        : > ${shellQuote(CLASH_SUB_URLS)}
        ${subRuleModePersistSidecarsCmd(SUB_RULE_MODE_TEMPLATE)}
        rm -f /data/kano_subscription_* 2>/dev/null || true
        `);
      if (res.success) {
        createToast('\u5df2\u6e05\u7a7a\u8ba2\u9605\u6e90\u5217\u8868\uff0c\u5e76\u6062\u590d\u4e3a template \u89c4\u5219\u6a21\u5f0f', 'green');
        await refreshRuleModeStatus();
      } else {
        createToast('\u6e05\u7a7a\u8ba2\u9605\u6e90\u5931\u8d25', 'red');
      }
      return res.success;
    };

    const ensureTemplateProviders = async (sources, options = {}) => {
      const cleanSources = normalizeSubSourceList(sources);
      await appendTemplateFlowDebug(`enter ensureTemplateProviders sources=${cleanSources.length} forceTemplate=${options && options.forceTemplate ? '1' : '0'}`);
      const { forceTemplate = false } = options;
      if (!forceTemplate && !(await hasUserTemplateYaml())) return true;
      if (!(await prepareTemplateFromBase(cleanSources))) {
        await appendTemplateFlowDebug('ensureTemplateProviders failed at prepareTemplateFromBase');
        return false;
      }
      const overrideOk = await applyJsOverrideToTemplate({ showToast: false, restart: false, sources: cleanSources, prepareTemplate: false });
      await appendTemplateFlowDebug(`ensureTemplateProviders applyJsOverrideToTemplate result=${overrideOk ? '1' : '0'}`);
      return overrideOk;
    };

    const writeSubEntrypoint = async (
      sources,
      { backup = true, convertMode = SUB_CONVERT_MODE_PROVIDER } = {},
    ) => {
      const cleanSources = normalizeSubSourceList(sources);
      await appendTemplateFlowDebug(`enter writeSubEntrypoint sources=${cleanSources.length}`);
      if (cleanSources.length == 0) return false;
      const ok = await writeRuntimeConfigFromTemplate(cleanSources, {
        backup,
        showToast: false,
        forceTemplate: true,
        localProviderFiles: normalizeSubConvertModeValue(convertMode) == SUB_CONVERT_MODE_LOCAL,
      });
      await appendTemplateFlowDebug(`leave writeSubEntrypoint ok=${ok ? '1' : '0'}`);
      return ok;
    };

    const persistSubSources = async (
      sources,
      mode = SUB_RULE_MODE_TEMPLATE,
      convertMode = SUB_CONVERT_MODE_PROVIDER,
    ) => {
      const cleanMode = normalizeSubRuleModeValue(mode);
      const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
      const storedSources = normalizeStoredSubSourceList(sources);
      if (storedSources.length == 0) return false;
      const subUrlsText = buildSubUrlsFileText(storedSources, cleanMode, cleanConvertMode);
      const sourceRes = await runShellWithRoot(`
        set -e
        TX=/data/kano_sub_persist.$$
        SUB=${shellQuote(CLASH_SUB_URLS)}
        MODE=${shellQuote(CLASH_SUB_RULE_MODE_FILE)}
        OPTIONS=${shellQuote(CLASH_POLICY_OPTIONS_FILE)}
        snapshot_sub_file() {
          name="$1"
          path="$2"
          if [ -e "$path" ]; then
            cp -p "$path" "$TX/$name" 2>/dev/null || cp "$path" "$TX/$name"
            touch "$TX/$name.had"
          else
            touch "$TX/$name.absent"
          fi
        }
        restore_sub_file() {
          name="$1"
          path="$2"
          if [ -f "$TX/$name.had" ] && [ -f "$TX/$name" ]; then
            mkdir -p "$(dirname "$path")"
            restored="$path.kano_restore.$$"
            cp -p "$TX/$name" "$restored" 2>/dev/null || cp "$TX/$name" "$restored" || return 1
            mv -f "$restored" "$path" || return 1
          elif [ -f "$TX/$name.absent" ]; then
            rm -f "$path" || return 1
          fi
          return 0
        }
        finish_sub_persist() {
          rc=$?
          trap - EXIT
          if [ "$rc" -ne 0 ]; then
            set +e
            restore_sub_file options "$OPTIONS" || rc=1
            restore_sub_file mode "$MODE" || rc=1
            restore_sub_file subscription "$SUB" || rc=1
          fi
          rm -f "$SUB.kano_new.$$" 2>/dev/null || true
          rm -rf "$TX" 2>/dev/null || true
          exit "$rc"
        }
        rm -rf "$TX" 2>/dev/null || true
        mkdir -p "$TX"
        trap finish_sub_persist EXIT
        snapshot_sub_file subscription "$SUB"
        snapshot_sub_file mode "$MODE"
        snapshot_sub_file options "$OPTIONS"
        mkdir -p ${shellQuote(CLASH_PROXY_DIR)}
        ${subRuleModePersistSidecarsCmd(cleanMode)}
        SUB_NEW="$SUB.kano_new.$$"
        printf '%s' ${shellQuote(subUrlsText)} > "$SUB_NEW"
        chmod 600 "$SUB_NEW"
        mv -f "$SUB_NEW" "$SUB"
        first_line="$(sed -n '1p' "$SUB" 2>/dev/null | tr -d '\r')"
        [ "$first_line" = ${shellQuote(`# KANO_SUB_RULE_MODE=${cleanMode}`)} ] || { echo "SUB_URLS_MODE_HEADER_WRITE_FAILED:$first_line"; exit 1; }
        echo SUB_SOURCES_COMMITTED
        trap - EXIT
        rm -rf "$TX" 2>/dev/null || true
        `);
      return !!(sourceRes.success && String(sourceRes.content || '').includes('SUB_SOURCES_COMMITTED'));
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
      createToast(`订阅服务器拒绝 HTTP Provider（${escapeHtml(reason)}），正在自动改用设备本地下载/转换...`, 'yellow', 10000);
      await appendTemplateFlowDebug(`provider_auto_local_fallback enter reason=${reason} sources=${sources.length}`);

      const conversion = await convertSubscriptionsLocally(sources);
      if (conversion.failed > 0) {
        const failed = conversion.providers.find((item) => !item.ok);
        createToast(`自动本地转换失败：${escapeHtml(failed && failed.message || '未知错误')}；保持原 HTTP Provider 配置。`, 'red', 10000);
        await appendTemplateFlowDebug(`provider_auto_local_fallback convert_failed reason=${failed && failed.message || ''}`);
        return { ok: false, conversion };
      }

      const storedSources = await readCurrentSubSources({ includeDisabled: true });
      const stored = storedSources.length > 0 ? storedSources : sources;
      const rollbackPath = await createConfigRollbackPoint('provider_auto_local_fallback');
      if (rollbackPath === null) {
        createToast('无法创建 config.yaml 回滚点，未切换本地转换模式。', 'red', 9000);
        return { ok: false, conversion };
      }
      if (!(await persistSubSources(stored, cleanMode, SUB_CONVERT_MODE_LOCAL))) {
        createToast('本地转换已完成，但保存本地转换模式失败；运行配置未切换。', 'red', 9000);
        return { ok: false, conversion };
      }
      if (!(await writeSubConfigByMode(sources, cleanMode, {
        backup: true,
        convertMode: SUB_CONVERT_MODE_LOCAL,
      }))) {
        const modeRestored = await persistSubSources(stored, cleanMode, SUB_CONVERT_MODE_PROVIDER);
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
        const modeRestored = await persistSubSources(stored, cleanMode, SUB_CONVERT_MODE_PROVIDER);
        if (!modeRestored) createToast('原配置已回滚，但 HTTP Provider 模式标记恢复失败。', 'red', 10000);
        return { ok: false, conversion };
      }
      await appendTemplateFlowDebug('provider_auto_local_fallback success convert=local');
      createToast('HTTP Provider 被上游拒绝；已自动切换为设备本地转换并恢复节点。', 'green', 10000);
      await showSubscriptionUpdateSelfCheck(sources, cleanMode, conversion, null, SUB_CONVERT_MODE_LOCAL);
      return { ok: true, conversion };
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
      if (!(await persistSubSources(cleanSources, SUB_RULE_MODE_TEMPLATE))) {
        if (showToast) createToast('\u65e7\u76f4\u901a\u6a21\u5f0f\u8fc1\u79fb\u5931\u8d25\uff1a\u8ba2\u9605\u94fe\u63a5\u5199\u5165\u5931\u8d25', 'red', 9000);
        return [];
      }
      await appendTemplateFlowDebug(`legacy subscription migrated sources=${cleanSources.length}`);
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

    const inspectSubscriptionRuntimeConfig = async (
      sources = [],
      mode = SUB_RULE_MODE_TEMPLATE,
      convertMode = SUB_CONVERT_MODE_PROVIDER,
    ) => {
      const cleanSources = normalizeSubSourceList(sources);
      const cleanMode = normalizeSubRuleModeValue(mode);
      const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
      await loadProviderUserAgent();
      const expectedProviderChecks = cleanSources.map((source) => `
          provider_type="$("$YQ" e -r ${shellQuote(`."proxy-providers".${source.name}.type // ""`)} "$CONFIG" 2>/dev/null)"
          provider_path="$("$YQ" e -r ${shellQuote(`."proxy-providers".${source.name}.path // ""`)} "$CONFIG" 2>/dev/null)"
          [ "$provider_type" = ${shellQuote(cleanConvertMode == SUB_CONVERT_MODE_LOCAL ? 'file' : 'http')} ] || provider_shape_errors=$((provider_shape_errors + 1))
          [ "$provider_path" = ${shellQuote(`./proxies/${source.name}.yaml`)} ] || provider_shape_errors=$((provider_shape_errors + 1))
          ${cleanConvertMode == SUB_CONVERT_MODE_LOCAL
            ? ''
            : `
          "$YQ" e -r ${shellQuote(`."proxy-providers".${source.name}.url // ""`)} "$CONFIG" 2>/dev/null | grep -Fx ${shellQuote(source.url)} >/dev/null 2>&1 || missing_urls=$((missing_urls + 1))
          provider_user_agent="$("$YQ" e -r ${shellQuote(`."proxy-providers".${source.name}.header."User-Agent"[0] // ""`)} "$CONFIG" 2>/dev/null)"
          [ "$provider_user_agent" = ${shellQuote(currentProviderUserAgent)} ] || provider_shape_errors=$((provider_shape_errors + 1))
          `}
        `).join('\n');
      const res = await runShellWithRoot(`
        set +e
        CONFIG=${shellQuote(CLASH_CONFIG)}
        SUB_URLS=${shellQuote(CLASH_SUB_URLS)}
        SOURCE_FILE=${shellQuote(CLASH_CONFIG_SOURCE_FILE)}
        YQ=${shellQuote(`${CLASH_DIR}/Tools/yq_linux_arm64`)}
        ${prepareYqRuntimeCmd()}
        expected_count=${cleanSources.length}
        missing_urls=0
        provider_count=0
        provider_url_count=0
        rules_count=0
        proxy_groups_count=0
        mode_line_ok=0
        convert_mode_ok=0
        provider_shape_errors=0
        mode_line="$(sed -n '1p' "$SUB_URLS" 2>/dev/null | tr -d '\r')"
        [ "$mode_line" = ${shellQuote(`# KANO_SUB_RULE_MODE=${cleanMode}`)} ] && mode_line_ok=1
        convert_mode_line="$(grep -m 1 '^# KANO_SUB_CONVERT_MODE=' "$SUB_URLS" 2>/dev/null | tr -d '\r')"
        [ "$convert_mode_line" = ${shellQuote(`# KANO_SUB_CONVERT_MODE=${cleanConvertMode}`)} ] && convert_mode_ok=1
        config_source="$(grep -m 1 '^KANO_CONFIG_SOURCE=' "$SOURCE_FILE" 2>/dev/null | sed 's/^KANO_CONFIG_SOURCE=//' | tr -d '\r')"
        [ -n "$config_source" ] || config_source=unknown

        if [ ! -s "$CONFIG" ]; then
          echo "RUNTIME_CONFIG_CHECK=config_missing"
          echo "mode_line=$mode_line"
          echo "mode_line_ok=$mode_line_ok"
          echo "config_source=$config_source"
          exit 0
        fi
        if [ ! -x "$YQ" ]; then
          echo "RUNTIME_CONFIG_CHECK=yq_missing"
          echo "mode_line=$mode_line"
          echo "mode_line_ok=$mode_line_ok"
          echo "config_source=$config_source"
          exit 0
        fi
        first_line="$(sed -n '1p' "$CONFIG" 2>/dev/null | tr -d '\r' | sed 's/^[[:space:]]*//')"
        if echo "$first_line" | grep -Eq '^https?://'; then
          echo "RUNTIME_CONFIG_CHECK=legacy_url_entrypoint"
          echo "mode_line=$mode_line"
          echo "mode_line_ok=$mode_line_ok"
          echo "config_source=$config_source"
          exit 0
        fi
        "$YQ" e '.' "$CONFIG" >/dev/null 2>/data/kano_runtime_landed_check.err || {
          echo "RUNTIME_CONFIG_CHECK=yaml_invalid"
          cat /data/kano_runtime_landed_check.err 2>/dev/null || true
          rm -f /data/kano_runtime_landed_check.err
          echo "mode_line=$mode_line"
          echo "mode_line_ok=$mode_line_ok"
          echo "config_source=$config_source"
          exit 0
        }
        rm -f /data/kano_runtime_landed_check.err
        provider_count="$("$YQ" e '(."proxy-providers" // {}) | length' "$CONFIG" 2>/dev/null)"
        provider_url_count="$("$YQ" e '[(."proxy-providers" // {})[] | (.url // "")] | .[]' "$CONFIG" 2>/dev/null | grep -Ec '^https?://' || true)"
        rules_count="$("$YQ" e '(.rules // []) | length' "$CONFIG" 2>/dev/null)"
        proxy_groups_count="$("$YQ" e '(."proxy-groups" // []) | length' "$CONFIG" 2>/dev/null)"
        echo "$provider_count" | grep -Eq '^[0-9]+$' || provider_count=0
        echo "$provider_url_count" | grep -Eq '^[0-9]+$' || provider_url_count=0
        echo "$rules_count" | grep -Eq '^[0-9]+$' || rules_count=0
        echo "$proxy_groups_count" | grep -Eq '^[0-9]+$' || proxy_groups_count=0
${expectedProviderChecks}
        echo "RUNTIME_CONFIG_CHECK=ok"
        echo "expected_count=$expected_count"
        echo "provider_count=$provider_count"
        echo "provider_url_count=$provider_url_count"
        echo "rules_count=$rules_count"
        echo "proxy_groups_count=$proxy_groups_count"
        echo "missing_urls=$missing_urls"
        echo "provider_shape_errors=$provider_shape_errors"
        echo "mode_line=$mode_line"
        echo "mode_line_ok=$mode_line_ok"
        echo "convert_mode_ok=$convert_mode_ok"
        echo "config_source=$config_source"
        `, 20 * 1000);
      const lines = String(res.content || '').split('\n');
      const pick = (key, fallback = '') => ((lines.find((line) => line.startsWith(`${key}=`)) || `${key}=${fallback}`).replace(new RegExp(`^${key}=`), '').trim());
      const status = pick('RUNTIME_CONFIG_CHECK');
      const providerCount = Number(pick('provider_count', '0')) || 0;
      const providerUrlCount = Number(pick('provider_url_count', '0')) || 0;
      const rulesCount = Number(pick('rules_count', '0')) || 0;
      const proxyGroupsCount = Number(pick('proxy_groups_count', '0')) || 0;
      const missingUrls = Number(pick('missing_urls', '0')) || 0;
      const providerShapeErrors = Number(pick('provider_shape_errors', '0')) || 0;
      const modeLineOk = pick('mode_line_ok', '0') == '1';
      const convertModeOk = pick('convert_mode_ok', '0') == '1';
      const configSource = pick('config_source', 'unknown');
      const issues = [];
      if (status != 'ok') issues.push(`运行配置状态异常：${status || 'unknown'}`);
      if (!modeLineOk) issues.push(`subscription_urls.txt 模式标记不是 ${cleanMode}`);
      if (!convertModeOk) issues.push(`订阅转换模式标记不是 ${cleanConvertMode}`);
      if (providerCount != cleanSources.length) issues.push(`proxy-providers 数量不匹配：${providerCount}/${cleanSources.length}`);
      const expectedProviderUrlCount = cleanConvertMode == SUB_CONVERT_MODE_LOCAL ? 0 : cleanSources.length;
      if (providerUrlCount != expectedProviderUrlCount) {
        issues.push(`有效订阅 URL 数量不匹配：${providerUrlCount}/${expectedProviderUrlCount}`);
      }
      if (missingUrls > 0) issues.push(`缺少订阅 URL：${missingUrls}`);
      if (providerShapeErrors > 0) issues.push(`节点来源类型、路径或 User-Agent 不匹配：${providerShapeErrors}`);
      if (rulesCount <= 0) issues.push('rules 为空');
      if (proxyGroupsCount <= 0) issues.push('proxy-groups 为空');
      if (cleanSources.length > 0 && configSource != 'template.yaml') issues.push(`config 来源异常：${configSource}`);
      return {
        ok: !!(res.success && issues.length == 0),
        status,
        providerCount,
        providerUrlCount,
        rulesCount,
        proxyGroupsCount,
        rawRulesCount: 0,
        missingUrls,
        providerShapeErrors,
        modeLineOk,
        convertModeOk,
        convertMode: cleanConvertMode,
        configSource,
        rawKanoCount: 0,
        finalKanoCount: 0,
        templatePollutionCount: 0,
        hasKanoPollution: false,
        rulesShrunk: false,
        issues,
        content: res.content || '',
      };
    };

    const mergeProviderUpdateResults = (previousResult, retryResult) => {
      const merged = new Map();
      ((previousResult && previousResult.providers) || []).forEach((item) => merged.set(item.name, item));
      ((retryResult && retryResult.providers) || []).forEach((item) => merged.set(item.name, item));
      return buildProviderUpdateResult([...merged.values()], {
        controllerInfo: retryResult && retryResult.controllerInfo || previousResult && previousResult.controllerInfo || null,
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
            if (providerNotRun && !(await restartClash())) return;
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
      const controllerCheckPromise = controllerInfo
        ? callMihomoApi('/version', 'GET', null, controllerInfo)
        : buildControllerInfo().then((info) => callMihomoApi('/version', 'GET', null, info));
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
      const repairable = !configCheck.ok && configCheck.status == 'ok' && (
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
      await isMMRunning();
      return outcome.allOk;
    };

    refreshSubscriptionAfterRestore = async () => {
      const sources = await readCurrentSubSources();
      const mode = await readCurrentSubRuleMode();
      const convertMode = await readSavedSubConvertMode();
      const providerUpdate = convertMode == SUB_CONVERT_MODE_LOCAL
        ? await convertSubscriptionsLocally(sources)
        : await forceUpdateProvidersFromConfig({ showToast: false });
      if (convertMode == SUB_CONVERT_MODE_PROVIDER && providerUpdateNeedsLocalFallback(providerUpdate)) {
        await switchHttpProviderToLocal(sources, mode, { reason: 'HTTP 390' });
        return;
      }
      await showSubscriptionUpdateSelfCheck(sources, mode, providerUpdate, null, convertMode);
    };

    const updateSubProviders = async (
      sources,
      mode = SUB_RULE_MODE_TEMPLATE,
      convertMode = SUB_CONVERT_MODE_PROVIDER,
    ) => {
      const cleanMode = normalizeSubRuleModeValue(mode);
      const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
      const cleanSources = normalizeSubSourceList(sources);
      let localConversion = null;
      await appendTemplateFlowDebug(`enter updateSubProviders mode=${cleanMode} convert=${cleanConvertMode} sources=${cleanSources.length}`);
      const sourceCheck = await inspectConfigNodeSource(cleanSources, { requireSavedSubscription: true });
      if (!sourceCheck.ok) {
        await appendTemplateFlowDebug(`updateSubProviders sourceCheck failed status=${sourceCheck.status || ''}`);
        createToast(sourceCheck.message, 'red', 10000);
        return false;
      }
      if (sourceCheck.requiresTemplateRebuild || sourceCheck.source == 'template_embedded') {
        await appendTemplateFlowDebug('updateSubProviders fallback to template rebuild');
        createToast(sourceCheck.message, 'yellow', 8000);
        const rebuilt = await overwriteConfigByTemplate({ confirm: false });
        return rebuilt;
      }
      if (cleanConvertMode == SUB_CONVERT_MODE_LOCAL) {
        createToast('正在设备本地下载并转换订阅...', 'yellow');
        localConversion = await convertSubscriptionsLocally(cleanSources);
        if (localConversion.failed > 0) {
          const failed = localConversion.providers.find((item) => !item.ok);
          createToast(`${escapeHtml(failed && failed.name || '订阅')}：${escapeHtml(failed && failed.message || '本地转换失败')}，原节点缓存未覆盖。`, 'red', 9000);
          return false;
        }
      }
      const runtimeCheck = await inspectSubscriptionRuntimeConfig(cleanSources, cleanMode, cleanConvertMode);
      if (runtimeCheck.ok) {
        await appendTemplateFlowDebug('updateSubProviders fast path: runtime config unchanged');
        if (cleanConvertMode == SUB_CONVERT_MODE_LOCAL) {
          await showSubscriptionUpdateSelfCheck(cleanSources, cleanMode, localConversion, runtimeCheck, cleanConvertMode);
          return localConversion.total == 0 || localConversion.okCount == localConversion.total;
        }
        createToast('运行配置未变，正在直接刷新节点订阅...', 'yellow');
        const providerUpdate = await forceUpdateProvidersFromConfig({ showToast: false });
        if (providerUpdateNeedsLocalFallback(providerUpdate)) {
          const fallback = await switchHttpProviderToLocal(cleanSources, cleanMode, { reason: 'HTTP 390' });
          return fallback.ok;
        }
        await showSubscriptionUpdateSelfCheck(cleanSources, cleanMode, providerUpdate, runtimeCheck, cleanConvertMode);
        return providerUpdate.total == 0 || providerUpdate.okCount == providerUpdate.total;
      }
      createToast('正在更新订阅并重启核心', 'yellow');
      const rollbackPath = await createConfigRollbackPoint('subscription_update');
      if (rollbackPath === null) {
        createToast('无法创建 config.yaml 回滚点，未更新运行配置。', 'red', 9000);
        return false;
      }
      if (!(await writeSubConfigByMode(cleanSources, cleanMode, {
        backup: true,
        convertMode: cleanConvertMode,
      }))) {
        await restoreConfigRollbackPoint(rollbackPath, '更新订阅生成运行配置');
        return false;
      }
      const restarted = await restartClashWithConfigRollback(rollbackPath, '更新订阅后重启');
      if (restarted) {
        let providerUpdate = cleanConvertMode == SUB_CONVERT_MODE_LOCAL
          ? (localConversion || buildProviderUpdateResult([]))
          : buildProviderUpdateResult([]);
        if (cleanConvertMode == SUB_CONVERT_MODE_PROVIDER && cleanMode == SUB_RULE_MODE_TEMPLATE) {
          providerUpdate = await forceUpdateProvidersFromConfig({ showToast: false });
          if (providerUpdateNeedsLocalFallback(providerUpdate)) {
            const fallback = await switchHttpProviderToLocal(cleanSources, cleanMode, { reason: 'HTTP 390' });
            return fallback.ok;
          }
        }
        await showSubscriptionUpdateSelfCheck(cleanSources, cleanMode, providerUpdate, null, cleanConvertMode);
      }
      return restarted;
    };

    const readCurrentSubSources = async ({ includeDisabled = false } = {}) => {
      const source = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_SUB_URLS)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_SUB_URLS)}; fi
        `);
      if (!source.success) {
        createToast(`\u8bfb\u53d6\u8ba2\u9605\u6e90\u5931\u8d25\uff0c\u672a\u6267\u884c\u65e7\u914d\u7f6e\u8fc1\u79fb\u3002<br>${safeTextToHtml(source.content || '')}`, 'red', 9000);
        await appendTemplateFlowDebug('readCurrentSubSources failed before legacy migration');
        return [];
      }
      const sourceItems = parseStoredSubSourcesFromText(source.content || '');
      if (sourceItems.length > 0) {
        if (showLegacySuspiciousSubSourcesError(sourceItems, '\u5386\u53f2 subscription_urls.txt')) return [];
        return includeDisabled ? sourceItems : normalizeSubSourceList(sourceItems);
      }

      const res = await runShellWithRoot(`
        if [ -f ${shellQuote(CLASH_CONFIG)} ]; then timeout 5s awk '{print}' ${shellQuote(CLASH_CONFIG)}; fi
        `);
      if (!res.success || !res.content) return await migrateLegacySubscriptionSources({ showToast: true });
      const legacySources = parseLegacySubConfig(res.content);
      if (legacySources.length > 0) {
        if (showLegacySuspiciousSubSourcesError(legacySources, 'legacy entrypoint')) return [];
        if (!(await persistSubSources(legacySources))) {
          createToast('\u65e7\u7248\u8ba2\u9605\u5165\u53e3\u8fc1\u79fb\u5931\u8d25\uff0c\u672a\u7ee7\u7eed\u4f7f\u7528\u672a\u4fdd\u5b58\u7684\u8ba2\u9605\u6e90\u3002', 'red', 9000);
          await appendTemplateFlowDebug(`legacy entrypoint persist failed sources=${legacySources.length}`);
          return [];
        }
        createToast('\u5df2\u8fc1\u79fb\u65e7\u7248\u8ba2\u9605\u5165\u53e3\u3002', 'yellow', 6500);
        await appendTemplateFlowDebug(`legacy entrypoint migrated sources=${legacySources.length}`);
        return legacySources;
      }
      return await migrateLegacySubscriptionSources({ showToast: true });
    };

    const readCurrentSubRuleMode = () => SUB_RULE_MODE_TEMPLATE;

    const writeSubConfigByMode = async (
      sources,
      mode = SUB_RULE_MODE_TEMPLATE,
      { backup = true, convertMode = SUB_CONVERT_MODE_PROVIDER } = {},
    ) => {
      const cleanMode = normalizeSubRuleModeValue(mode);
      const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
      const cleanSources = normalizeSubSourceList(sources);
      await appendTemplateFlowDebug(`enter writeSubConfigByMode mode=${cleanMode} convert=${cleanConvertMode} sources=${cleanSources.length}`);
      if (!(await setSubRuleMode(cleanMode))) return false;
      if (!(await ensureTemplateProviders(cleanSources, { forceTemplate: true }))) {
        await appendTemplateFlowDebug('writeSubConfigByMode template failed at ensureTemplateProviders');
        return false;
      }
      const ok = await writeSubEntrypoint(cleanSources, { backup, convertMode: cleanConvertMode });
      await appendTemplateFlowDebug(`leave writeSubConfigByMode template ok=${ok ? '1' : '0'}`);
      return ok;
    };

    const saveSubSources = async (
      sources,
      mode = SUB_RULE_MODE_TEMPLATE,
      convertMode = SUB_CONVERT_MODE_PROVIDER,
    ) => {
      const cleanMode = normalizeSubRuleModeValue(mode);
      const cleanConvertMode = normalizeSubConvertModeValue(convertMode);
      const storedSources = normalizeStoredSubSourceList(sources);
      const cleanSources = normalizeSubSourceList(storedSources);
      await appendTemplateFlowDebug(`enter saveSubSources mode=${cleanMode} convert=${cleanConvertMode} sources=${cleanSources.length} stored=${storedSources.length}`);
      if (storedSources.length == 0) {
        createToast('\u8bf7\u81f3\u5c11\u8f93\u5165\u4e00\u4e2a\u8ba2\u9605\u94fe\u63a5\uff01', 'red');
        return false;
      }
      const invalidUrl = storedSources.find((source) => !isHttpUrl(source.url));
      if (invalidUrl) {
        createToast(`\u8ba2\u9605\u94fe\u63a5\u683c\u5f0f\u4e0d\u6b63\u786e\uff1a${escapeHtml(maskSubscriptionUrl(invalidUrl.url) || '\u8ba2\u9605\u5730\u5740\u5df2\u9690\u85cf')}`, 'red');
        return false;
      }
      if (showSuspiciousSubSourcesError(storedSources)) return false;
      const subscriptionTxDir = `/data/kano_subscription_save_${Date.now()}_${createRandomString(6)}`;
      const transactionFiles = [
        { name: 'subscription_urls.txt', path: CLASH_SUB_URLS },
        { name: 'template.yaml', path: CLASH_TEMPLATE },
        { name: 'template.base.yaml', path: CLASH_TEMPLATE_BASE },
        ...(cleanConvertMode == SUB_CONVERT_MODE_LOCAL
          ? cleanSources.map((source) => ({
            name: `provider_${source.name}.yaml`,
            path: `${CLASH_PROXY_DIR}/proxies/${source.name}.yaml`,
          }))
          : []),
      ];
      const snapshotCommands = transactionFiles.map((item) => `
        snapshot_file ${shellQuote(item.name)} ${shellQuote(item.path)}
      `).join('');
      const restoreCommands = transactionFiles.slice().reverse().map((item) => `
        restore_file ${shellQuote(item.name)} ${shellQuote(item.path)}
      `).join('');
      const snapshotRes = await runShellWithRoot(`
        set -e
        TX=${shellQuote(subscriptionTxDir)}
        rm -rf "$TX" 2>/dev/null || true
        mkdir -p "$TX"
        snapshot_file() {
          name="$1"; path="$2"
          if [ -f "$path" ]; then
            cp "$path" "$TX/$name" || return 1
            touch "$TX/$name.had"
          else
            touch "$TX/$name.absent"
          fi
        }
        ${snapshotCommands}
        echo "SUBSCRIPTION_TRANSACTION_READY"
      `, 20 * 1000);
      if (!snapshotRes.success || !String(snapshotRes.content || '').includes('SUBSCRIPTION_TRANSACTION_READY')) {
        createToast(`无法创建订阅事务回滚点<br>${safeTextToHtml(snapshotRes.content || '')}`, 'red', 9000);
        return false;
      }
      const restoreSubscriptionTransaction = async () => {
        const restoreRes = await runShellWithRoot(`
          set -e
          TX=${shellQuote(subscriptionTxDir)}
          restore_file() {
            name="$1"; path="$2"; staged="$path.kano_restore.$$"
            mkdir -p "$(dirname "$path")"
            if [ -f "$TX/$name.had" ] && [ -f "$TX/$name" ]; then
              cp "$TX/$name" "$staged" || return 1
              chmod 600 "$staged" 2>/dev/null || true
              case "$path" in *.yaml|*.yml) chmod 644 "$staged" 2>/dev/null || true ;; esac
              mv -f "$staged" "$path" || return 1
            elif [ -f "$TX/$name.absent" ]; then
              rm -f "$path" || return 1
            else
              return 1
            fi
          }
          ${restoreCommands}
          rm -rf "$TX"
          echo "SUBSCRIPTION_TRANSACTION_RESTORED"
        `, 30 * 1000);
        if (!restoreRes.success) {
          createToast(`订阅相关文件回滚失败<br>${safeTextToHtml(restoreRes.content || '')}`, 'red', 10000);
        }
        return restoreRes.success;
      };
      if (!(await persistSubSources(storedSources, cleanMode, cleanConvertMode))) {
        await appendTemplateFlowDebug('saveSubSources persistSubSources failed');
        await restoreSubscriptionTransaction();
        createToast('\u4fdd\u5b58\u8ba2\u9605\u6e90\u5931\u8d25\uff01', 'red');
        return false;
      }
      await appendTemplateFlowDebug('saveSubSources persistSubSources ok');
      if (cleanSources.length == 0) {
        await runShellWithRoot(`rm -rf ${shellQuote(subscriptionTxDir)} 2>/dev/null || true`, 10 * 1000);
        createToast('全部订阅已禁用，禁用状态已保存；当前运行配置保持不变。', 'green', 8000);
        return true;
      }
      let localConversion = null;
      if (cleanConvertMode == SUB_CONVERT_MODE_LOCAL) {
        createToast('正在设备本地下载并转换订阅...', 'yellow');
        localConversion = await convertSubscriptionsLocally(cleanSources);
        if (localConversion.failed > 0) {
          const failed = localConversion.providers.find((item) => !item.ok);
          await restoreSubscriptionTransaction();
          createToast(`${escapeHtml(failed && failed.name || '订阅')}：${escapeHtml(failed && failed.message || '本地转换失败')}，订阅设置未修改。`, 'red', 9000);
          return false;
        }
      }
      const rollbackPath = await createConfigRollbackPoint('subscription_save');
      if (rollbackPath === null) {
        await restoreSubscriptionTransaction();
        createToast('无法创建 config.yaml 回滚点，订阅设置未修改。', 'red', 9000);
        return false;
      }
      const writtenOk = await writeSubConfigByMode(cleanSources, cleanMode, {
        convertMode: cleanConvertMode,
      });
      await appendTemplateFlowDebug(`saveSubSources writeSubConfigByMode result=${writtenOk ? '1' : '0'}`);
      if (!writtenOk) {
        await restoreConfigRollbackPoint(rollbackPath, '\u4fdd\u5b58\u8ba2\u9605\u751f\u6210\u8fd0\u884c\u914d\u7f6e');
        await restoreSubscriptionTransaction();
        return false;
      }
      createToast('\u8ba2\u9605\u914d\u7f6e\u5df2\u5199\u5165\uff0c\u6b63\u5728\u91cd\u542f\u6838\u5fc3...', 'yellow');
      const restarted = await restartClashWithConfigRollback(rollbackPath, '\u4fdd\u5b58\u8ba2\u9605\u540e\u91cd\u542f');
      await appendTemplateFlowDebug(`saveSubSources restart result=${restarted ? '1' : '0'}`);
      if (!restarted) {
        await restoreSubscriptionTransaction();
        return false;
      }
      await runShellWithRoot(`rm -rf ${shellQuote(subscriptionTxDir)} 2>/dev/null || true`, 10 * 1000);
      if (restarted) {
        const providerUpdate = cleanConvertMode == SUB_CONVERT_MODE_LOCAL
          ? (localConversion || buildProviderUpdateResult([]))
          : await forceUpdateProvidersFromConfig({ showToast: false });
        if (cleanConvertMode == SUB_CONVERT_MODE_PROVIDER && providerUpdateNeedsLocalFallback(providerUpdate)) {
          const fallback = await switchHttpProviderToLocal(cleanSources, cleanMode, { reason: 'HTTP 390' });
          return fallback.ok;
        }
        await showSubscriptionUpdateSelfCheck(cleanSources, cleanMode, providerUpdate, null, cleanConvertMode);
      }
      return restarted;
    };

    const overwriteConfigByTemplate = async ({ confirm = true } = {}) => {
      const sources = await readCurrentSubSources();
      const currentMode = await readCurrentSubRuleMode();
      const currentConvertMode = await readSavedSubConvertMode();
      await appendTemplateFlowDebug(`enter overwriteConfigByTemplate mode=${currentMode} convert=${currentConvertMode} sources=${sources.length}`);
      const sourceCheck = await inspectConfigNodeSource(sources);
      await appendTemplateFlowDebug(`overwriteConfigByTemplate sourceCheck ok=${sourceCheck.ok ? '1' : '0'} source=${sourceCheck.source || ''} status=${sourceCheck.status || ''}`);
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
            ? (localConversion || buildProviderUpdateResult([]))
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
        const providerUpdate = currentConvertMode == SUB_CONVERT_MODE_LOCAL
          ? buildProviderUpdateResult([])
          : await forceUpdateProvidersFromConfig({ showToast: false });
        await showSubscriptionUpdateSelfCheck([], currentMode, providerUpdate, null, currentConvertMode);
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
      const formData = new FormData();
      formData.append('file', new File([content], filename, { type: 'text/plain;charset=utf-8' }));
      const response = await fetch(`${KANO_baseURL}/upload_img`, {
        method: 'POST',
        headers: common_headers,
        body: formData,
      });
      const result = await response.json();
      if (!result.url) throw new Error(result.error || '上传失败');
      const uploadedPath = getUploadedPath(result.url);
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
      const stageCheck = await validateConfigFileStructure(stagePath, 'config.yaml');
      if (!stageCheck.ok) {
        await runShellWithRoot(`rm -f ${shellQuote(stagePath)} 2>/dev/null || true`);
        createToast(`配置结构检查失败，原 config.yaml 未改动<br>${safeTextToHtml(stageCheck.message || '')}`, 'red', 10000);
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
      const committedCheck = await validateConfigFileStructure(CLASH_CONFIG, 'config.yaml');
      if (!committedCheck.ok) {
        const restored = await rollbackUploadedConfig('上传配置校验');
        createToast(
          `配置结构检查失败，${restored ? '已恢复写入前状态' : '且写入前状态恢复失败'}<br>${safeTextToHtml(committedCheck.message || '')}`,
          restored ? 'yellow' : 'red',
          10000,
        );
        return false;
      }
      const reloadRes = await reloadConfigHot(controllerInfo);
      if (reloadRes.success) {
        const trafficModeOk = await ensureRuntimeTrafficMode(lastSanitizedTrafficMode);
        const rulesOk = await reapplyPolicyRulesSilent();
        if (trafficModeOk && rulesOk) {
          createToast('config.yaml 已通过结构检查，运行配置和网络策略已生效', 'green', 7000);
          await isMMRunning();
          return true;
        }
        const restored = await rollbackUploadedConfig('上传配置运行态检查');
        const recoveryReload = restored ? await reloadConfigHot(controllerInfo) : { success: false };
        const recoveryOk = recoveryReload.success
          && await ensureRuntimeTrafficMode(lastSanitizedTrafficMode)
          && await reapplyPolicyRulesSilent();
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
          SUB_RULE_MODE_TEMPLATE,
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
      if (!(await ensureReady())) return;
      await showEditableLocalFilesDialog();
    };

    // \u8ba2\u9605\u94fe\u63a5\u529f\u80fd
    const importSub = async () => {
      const [currentSources, currentConvertMode] = await Promise.all([
        readCurrentSubSources({ includeDisabled: true }),
        readSavedSubConvertMode(),
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
                      <span>处理方式</span>
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
            return;
          }
          row.remove();
        };
        row.appendChild(input);
        row.appendChild(toggleBtn);
        row.appendChild(removeBtn);
        rowsEl.appendChild(row);
        syncToggleState();
      };

      if (currentSources.length > 0) {
        currentSources.forEach((source, index) => addSubRow(source, index));
      } else {
        addSubRow();
      }
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
            SUB_RULE_MODE_TEMPLATE,
            convertModeSelect.value,
          );

          if (success) {
            close();
          }
        } catch (e) {
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
      if (!(await ensureReady())) return;
      importSub();
    };

    const updateSubBtn = document.createElement('button');
    updateSubBtn.classList.add('btn');
    updateSubBtn.textContent = '\u66f4\u65b0\u8ba2\u9605';
    updateSubBtn.onclick = async () => {
      if (!(await ensureReady())) return;
      const operationToken = acquireCriticalOperation('更新订阅');
      if (!operationToken) return;
      setButtonBusy(updateSubBtn, true, '\u66f4\u65b0\u4e2d\u2026');
      try {
        const storedSources = await readCurrentSubSources({ includeDisabled: true });
        const sources = normalizeSubSourceList(storedSources);
        const ruleMode = await readCurrentSubRuleMode();
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
        createToast('\u6b63\u5728\u66f4\u65b0\u8ba2\u9605\u5e76\u5e94\u7528\u6a21\u677f...', 'yellow');
        await updateSubProviders(sources, ruleMode, convertMode);
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
        .map((name) => `<option value="${escapeHtml(name)}"></option>`)
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
              <input id="mm_rule_override_policy" type="text" autocomplete="off" list="mm_rule_override_policy_list" value="DIRECT" placeholder="DIRECT / REJECT / 策略组" style="min-width:0;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:#0f172a;color:#dbeafe;padding:8px;font-size:.62rem;" />
              <datalist id="mm_rule_override_policy_list">${policyOptionsHtml}</datalist>
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
      if (!(await ensureReady())) return;
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
    policyToolsBtn.textContent = '流量接管';
    policyToolsBtn.onclick = async () => {
      if (!(await ensureReady())) return;
      showPolicyToolsDialog({ initialTab: 'network' });
    };

    const macBypassBtn = document.createElement('button');
    macBypassBtn.classList.add('btn');
    macBypassBtn.textContent = '设备直连';
    macBypassBtn.onclick = async () => {
      if (!(await ensureReady())) return;
      showPolicyToolsDialog({ initialTab: 'device' });
    };

    const quickRunBtn = document.createElement('button');
    quickRunBtn.classList.add('btn');
    quickRunBtn.textContent = '安装 / 启动';
    quickRunBtn.onclick = async () => {
      if (!(await ensureAdvanced())) return;
      if (!(await checkIsInstalled())) {
        btn_enabled.click();
        return;
      }
      const operationToken = acquireCriticalOperation('启动核心');
      if (!operationToken) return;
      setButtonBusy(quickRunBtn, true, '启动中…');
      try {
        await ensureBootstrapConfig();
        await restartClash({ skipCheck: true });
      } finally {
        setButtonBusy(quickRunBtn, false);
        releaseCriticalOperation(operationToken);
      }
    };

    const mmBox = document.querySelector('#mm_action_box');

    const appendActionGroup = (title, buttons, openGroup = false) => {
      const details = document.createElement('details');
      details.className = 'kano-action-group';
      if (openGroup) details.open = true;
      const summary = document.createElement('summary');
      summary.textContent = title;
      const inner = document.createElement('div');
      inner.className = 'kano-action-inner';
      buttons.filter(Boolean).forEach((button) => inner.appendChild(button));
      details.appendChild(summary);
      details.appendChild(inner);
      mmBox.appendChild(details);
      return details;
    };

    appendActionGroup('\u6838\u5fc3\u4e0e\u9762\u677f', [quickRunBtn, btn_restart, stopBtn, boot_on, webPanelToggleBtn, refresh, open, controllerSettingsBtn], false);
    appendActionGroup('\u8ba2\u9605\u4e0e\u914d\u7f6e', [subBtn, updateSubBtn, userAgentBtn, templateOverrideBtn, editBtn, backupBtn], false);
    appendActionGroup('\u7f51\u7edc\u4e0e\u8bca\u65ad', [policyToolsBtn, macBypassBtn, rescueBtn, showLogBtn], false);
    appendActionGroup('\u7ec4\u4ef6\u4e0e\u7ef4\u62a4', [binaryHelperBtn, binaryHelperUploadBtn, clearCacheBtn, btn_disabled], false);

    let colTimer = null;
    let colTimer1 = null;
    collapseGen('#collapse_mm_btn', '#collapse_mm', '#collapse_mm', (e) => {
      checkIsBootUp().then((isBootUp) => {
        if (isBootUp) {
          boot_on.style.background = 'var(--dark-btn-color-active)';
        } else {
          boot_on.style.background = '';
        }
      });
      colTimer && clearTimeout(colTimer);
      colTimer1 && clearTimeout(colTimer1);
      if (e == 'open') {
        colTimer1 = setTimeout(() => {
          if (isWebPanelVisible()) refreshPanel();
        }, 300);
      } else {
        colTimer = setTimeout(() => {
          const iframe = document.getElementById('mm_iframe');
          if (iframe) iframe.src = `javascript:;`;
        }, 300);
      }
    });
    (async () => {
      try {
        await setWebPanelVisible(isWebPanelVisible(), { load: false });
        if (localStorage.getItem('#collapse_mm') == 'open' && isWebPanelVisible()) {
          await refreshPanel();
        }
        // 页面加载只读状态，不自动写防火墙、不迁移自启、不下载 Go helper。
        await isMMRunning();
      } catch (e) {
        console.error('猫猫TProxy background initialization failed', e);
      }
    })();
  })();
})(runShellWithRoot);
//</script >
