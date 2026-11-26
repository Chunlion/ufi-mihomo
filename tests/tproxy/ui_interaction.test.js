'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../..', '猫猫TProxy.js'), 'utf8');

function slice(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing slice: ${start} -> ${end}`);
  return source.slice(from, to);
}

function makeFakeElement(tag, ownerDoc) {
  const attrs = new Map();
  const listeners = new Map();
  const classes = new Set();
  const children = [];
  const el = {
    tagName: String(tag).toUpperCase(),
    id: '',
    type: '',
    value: '',
    checked: false,
    disabled: false,
    hidden: false,
    readOnly: false,
    selectionStart: 0,
    selectionEnd: 0,
    textContent: '',
    title: '',
    placeholder: '',
    isConnected: true,
    parentElement: null,
    style: {},
    dataset: {},
    children,
    get previousElementSibling() {
      if (!el.parentElement) return null;
      const idx = el.parentElement.children.indexOf(el);
      return idx > 0 ? el.parentElement.children[idx - 1] : null;
    },
    get nextElementSibling() {
      if (!el.parentElement) return null;
      const idx = el.parentElement.children.indexOf(el);
      return idx >= 0 && idx < el.parentElement.children.length - 1 ? el.parentElement.children[idx + 1] : null;
    },
    classList: {
      add: (...names) => names.forEach((n) => classes.add(n)),
      remove: (...names) => names.forEach((n) => classes.delete(n)),
      toggle: (n, force) => {
        const next = force === undefined ? !classes.has(n) : !!force;
        if (next) classes.add(n); else classes.delete(n);
        return next;
      },
      contains: (n) => classes.has(n),
    },
    get className() { return [...classes].join(' '); },
    set className(v) { classes.clear(); String(v || '').split(/\s+/).filter(Boolean).forEach((n) => classes.add(n)); },
    setAttribute(k, v) {
      if (k === 'id') el.id = String(v);
      else if (k === 'type') el.type = String(v);
      else if (k === 'class') el.className = String(v);
      else attrs.set(k, String(v));
    },
    getAttribute(k) {
      if (k === 'id') return el.id || null;
      if (k === 'type') return el.type || null;
      return attrs.has(k) ? attrs.get(k) : null;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const list = listeners.get(type) || [];
      const idx = list.indexOf(fn);
      if (idx >= 0) list.splice(idx, 1);
    },
    dispatchEvent(event) {
      if (event && !event.target) event.target = el;
      const list = [...(listeners.get(event.type) || [])];
      for (const fn of list) fn.call(el, event);
      if (event.type === 'click' && typeof el.onclick === 'function') el.onclick.call(el, event);
      return !event.defaultPrevented;
    },
    click() {
      if (el.disabled) return;
      el.dispatchEvent({ type: 'click', defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {} });
    },
    focus() { ownerDoc.activeElement = el; },
    select() {},
    closest(selector) {
      let cur = el.parentElement;
      while (cur) {
        if (selector === 'details' && cur.tagName === 'DETAILS') return cur;
        if (selector.startsWith('.') && cur.classList.contains(selector.slice(1))) return cur;
        cur = cur.parentElement;
      }
      return null;
    },
    contains(target) {
      if (target === el) return true;
      return children.some((c) => c.contains(target));
    },
    append(...nodes) { nodes.forEach((n) => el.appendChild(n)); },
    appendChild(child) {
      if (child.parentElement) {
        const prev = child.parentElement.children;
        const i = prev.indexOf(child);
        if (i >= 0) prev.splice(i, 1);
      }
      child.parentElement = el;
      children.push(child);
      return child;
    },
    insertBefore(node, ref) {
      if (node.parentElement) {
        const prev = node.parentElement.children;
        const i = prev.indexOf(node);
        if (i >= 0) prev.splice(i, 1);
      }
      node.parentElement = el;
      const idx = ref ? children.indexOf(ref) : -1;
      if (idx >= 0) children.splice(idx, 0, node);
      else children.push(node);
      return node;
    },
    remove() {
      el.isConnected = false;
      if (el.parentElement) {
        const prev = el.parentElement.children;
        const i = prev.indexOf(el);
        if (i >= 0) prev.splice(i, 1);
      }
    },
    querySelectorAll(selector) {
      const parts = selector.split(',').map((s) => s.trim()).filter(Boolean);
      const matchesSingle = (node, sel) => {
        if (sel === 'button:not([type])') return node.tagName === 'BUTTON' && !node.type;
        if (sel.includes(':not(') || sel.includes('[')) {
          if (sel.startsWith('button') && node.tagName === 'BUTTON' && !node.disabled) return true;
          if (sel.startsWith('input') && node.tagName === 'INPUT' && !node.disabled && node.type !== 'hidden') return true;
          if (sel.startsWith('select') && node.tagName === 'SELECT' && !node.disabled) return true;
          if (sel.startsWith('textarea') && node.tagName === 'TEXTAREA' && !node.disabled) return true;
          if (sel === 'summary' && node.tagName === 'SUMMARY') return true;
          return false;
        }
        if (sel.startsWith('.')) return node.classList.contains(sel.slice(1));
        if (sel.startsWith('#')) return node.id === sel.slice(1);
        return node.tagName === sel.toUpperCase();
      };
      const walk = (node, out = []) => {
        for (const c of node.children) {
          if (parts.some((p) => matchesSingle(c, p))) out.push(c);
          walk(c, out);
        }
        return out;
      };
      return walk(el);
    },
    querySelector(selector) {
      return el.querySelectorAll(selector)[0] || null;
    },
    setRangeText(text, start, end) {
      el.value = el.value.slice(0, start) + text + el.value.slice(end);
      el.selectionStart = el.selectionEnd = start + text.length;
    },
  };
  return el;
}

function makeFakeDocument() {
  const docListeners = new Map();
  const doc = {
    activeElement: null,
    documentElement: { clientWidth: 1280 },
    createElement: (tag) => makeFakeElement(tag, doc),
    addEventListener(type, fn) {
      if (!docListeners.has(type)) docListeners.set(type, []);
      docListeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const list = docListeners.get(type) || [];
      const idx = list.indexOf(fn);
      if (idx >= 0) list.splice(idx, 1);
    },
    dispatchKeydown(props) {
      const ev = { defaultPrevented: false, isComposing: false, repeat: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}, ...props };
      for (const fn of [...(docListeners.get('keydown') || [])]) fn(ev);
      return ev;
    },
    querySelector: () => null,
  };
  return doc;
}

test('bindDialogKeyboard adds ARIA dialog semantics, normalizes button types, traps Tab, and restores focus on Escape', () => {
  const doc = makeFakeDocument();
  const opener = doc.createElement('button');
  opener.focus();

  const dialog = doc.createElement('div');
  const title = doc.createElement('div');
  title.className = 'title';
  title.textContent = '测试窗口';
  const input = doc.createElement('input');
  const saveBtn = doc.createElement('button');
  const closeBtn = doc.createElement('button');
  dialog.append(title, input, saveBtn, closeBtn);

  let closed = 0;
  const api = vm.runInNewContext(
    slice('  const fitDialogWidth =', '  const askConfirm =') + '\n({ bindDialogKeyboard, keyboardDialogs })',
    { document: doc, window: { innerWidth: 1280 }, MutationObserver: class { observe() {} disconnect() {} } },
  );

  const close = api.bindDialogKeyboard(dialog, () => { closed++; }, opener, closeBtn, input);
  closeBtn.onclick = close;

  assert.equal(dialog.getAttribute('role'), 'dialog');
  assert.equal(dialog.getAttribute('aria-modal'), 'true');
  assert.equal(dialog.getAttribute('aria-label'), '测试窗口');
  assert.equal(saveBtn.type, 'button');
  assert.equal(closeBtn.type, 'button');
  assert.equal(doc.activeElement, input);

  // Tab from last element cycles to first
  closeBtn.focus();
  const tabNext = doc.dispatchKeydown({ key: 'Tab', shiftKey: false });
  assert.equal(tabNext.defaultPrevented, true);
  assert.equal(doc.activeElement, input);

  // Shift+Tab from first element cycles to last
  const tabPrev = doc.dispatchKeydown({ key: 'Tab', shiftKey: true });
  assert.equal(tabPrev.defaultPrevented, true);
  assert.equal(doc.activeElement, closeBtn);

  // Escape closes and restores focus to opener
  const esc = doc.dispatchKeydown({ key: 'Escape' });
  assert.equal(esc.defaultPrevented, true);
  assert.equal(closed, 1);
  assert.equal(doc.activeElement, opener);
});

test('bindTextareaTabIndent indents and outdents without replacing selected text', () => {
  const doc = makeFakeDocument();
  const textarea = doc.createElement('textarea');
  textarea.value = 'line1\nline2';
  textarea.selectionStart = 6;
  textarea.selectionEnd = 6;

  const { bindTextareaTabIndent } = vm.runInNewContext(
    slice('  const bindTextareaTabIndent =', '  const askConfirm =') + '\n({ bindTextareaTabIndent })',
    { Event: class { constructor(type) { this.type = type; } } },
  );
  bindTextareaTabIndent(textarea);
  let inputs = 0;
  textarea.addEventListener('input', () => { inputs++; });

  let ev = { type: 'keydown', key: 'Tab', shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  textarea.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, true);
  assert.equal(textarea.value, 'line1\n  line2');
  assert.equal(textarea.selectionStart, 8);

  ev = { type: 'keydown', key: 'Tab', shiftKey: true, ctrlKey: false, metaKey: false, altKey: false, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  textarea.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, true);
  assert.equal(textarea.value, 'line1\nline2');
  assert.equal(textarea.selectionStart, 6);
  assert.equal(inputs, 2);

  textarea.value = '\nline1\nline2\nline3';
  textarea.selectionStart = 1;
  textarea.selectionEnd = 13;
  textarea.dispatchEvent({ ...ev, shiftKey: false });
  assert.equal(textarea.value, '\n  line1\n  line2\nline3');
  textarea.dispatchEvent(ev);
  assert.equal(textarea.value, '\nline1\nline2\nline3');
  assert.equal(inputs, 4);

  textarea.value = '\n  line2';
  textarea.selectionStart = textarea.selectionEnd = 0;
  textarea.dispatchEvent(ev);
  assert.equal(textarea.value, '\n  line2');
  assert.equal(inputs, 4);
});

test('createDirtyCloseGuard closes clean dialogs immediately and prompts when dirty', async () => {
  let dirty = false, closed = 0, prompts = 0, answer = false;
  const { createDirtyCloseGuard } = vm.runInNewContext(
    slice('  const createDirtyCloseGuard =', '  // 单行文本输入框') + '\n({ createDirtyCloseGuard })',
    { askConfirm: async () => { prompts++; return answer; } },
  );
  const guard = createDirtyCloseGuard(() => { closed++; }, () => dirty, null);
  await guard();
  assert.equal(closed, 1);
  assert.equal(prompts, 0);

  dirty = true;
  answer = false;
  await guard();
  assert.equal(prompts, 1);
  assert.equal(closed, 1);

  answer = true;
  await guard();
  assert.equal(prompts, 2);
  assert.equal(closed, 2);
});

test('confirmWithDialog prefers styled async confirm when activeUiConfirm is set and falls back cleanly', async () => {
  let nativeCalls = 0, uiCalls = 0;
  const ctx = {
    window: { confirm: () => { nativeCalls++; return false; } },
    document: { activeElement: null },
    escapeHtml: String,
    readF50OperationInFlight: () => ({ label: '更新', at: 1700000000000 }),
  };
  const api = vm.runInNewContext(
    slice('let activeUiConfirm = null;', 'async function installF50PackageAtDevicePath')
    + '\n({ confirm: confirmF50OperationNotInFlight, setUi: (fn) => { activeUiConfirm = fn; } })',
    ctx,
  );
  assert.equal(await api.confirm(), false);
  assert.equal(nativeCalls, 1);
  assert.equal(uiCalls, 0);

  api.setUi(async (id, title) => { uiCalls++; assert.equal(id, 'mm_operation_inflight_confirm'); assert.match(title, /未结束/); return true; });
  assert.equal(await api.confirm(), true);
  assert.equal(uiCalls, 1);
  assert.equal(nativeCalls, 1);
});

test('updateDeviceBypassScope dims and disables IPv6, QUIC, and DNS hijack controls when traffic_mode is off', () => {
  const doc = makeFakeDocument();
  const makeRow = (id) => {
    const row = doc.createElement('div');
    row.className = 'kp-row';
    const ctrl = doc.createElement('input');
    ctrl.id = id;
    row.appendChild(ctrl);
    return { row, ctrl };
  };
  const elements = new Map();
  const mode = doc.createElement('select');
  elements.set('#mm_policy_traffic_mode', mode);
  for (const id of ['mm_policy_tun_stack', 'mm_policy_ipv6', 'mm_policy_quic', 'mm_policy_dns']) {
    const { row, ctrl } = makeRow(id);
    elements.set('#' + id, ctrl);
    elements.set('#' + id + ':row', row);
  }
  for (const id of ['mm_policy_dns_port', 'mm_policy_device', 'mm_policy_scan_clients', 'mm_policy_device_scope', 'mm_policy_clients']) {
    const el = doc.createElement('div');
    elements.set('#' + id, el);
  }
  const update = vm.runInNewContext(
    slice('    const updateDeviceBypassScope =', "    get('#mm_policy_traffic_mode').addEventListener") + '\nupdateDeviceBypassScope',
    { get: (sel) => elements.get(sel), setText: (el, t) => { el.textContent = t; }, syncIpv6DnsHint() {} },
  );

  mode.value = 'off';
  update();
  assert.equal(elements.get('#mm_policy_ipv6').disabled, true);
  assert.equal(elements.get('#mm_policy_quic').disabled, true);
  assert.equal(elements.get('#mm_policy_dns').disabled, true);
  assert.equal(elements.get('#mm_policy_dns_port').disabled, true);
  assert.equal(elements.get('#mm_policy_device').disabled, true);
  assert.equal(elements.get('#mm_policy_tun_stack').disabled, true);
  assert.equal(elements.get('#mm_policy_ipv6:row').classList.contains('kp-row-disabled'), true);

  mode.value = 'tproxy';
  update();
  assert.equal(elements.get('#mm_policy_ipv6').disabled, false);
  assert.equal(elements.get('#mm_policy_quic').disabled, false);
  assert.equal(elements.get('#mm_policy_dns').disabled, false);
  assert.equal(elements.get('#mm_policy_device').disabled, false);
  assert.equal(elements.get('#mm_policy_tun_stack').disabled, true);
  assert.equal(elements.get('#mm_policy_ipv6:row').classList.contains('kp-row-disabled'), false);
});

test('showStatusDiagnostic refresh button re-runs probes cleanly in place', async () => {
  const doc = makeFakeDocument();
  const root = doc.createElement('div');
  let probeRuns = 0;
  const run = vm.runInNewContext(
    slice('  const showStatusDiagnostic = async', '  const sanitizeConfigForTProxy =') + '\nshowStatusDiagnostic',
    {
      document: doc,
      showInfoDialog: (id, title, bodyHtml) => {
        const refresh = doc.createElement('button');
        refresh.className = 'kano-diag-refresh-btn';
        const copy = doc.createElement('button');
        copy.className = 'kano-diag-copy-btn';
        const summary = doc.createElement('div');
        summary.className = 'kano-diag-summary';
        const detail = doc.createElement('div');
        detail.className = 'kano-diag-detail';
        const install = doc.createElement('div');
        install.className = 'kano-diag-install';
        const log = doc.createElement('pre');
        log.className = 'kano-diag-log';
        root.append(refresh, copy, summary, detail, install, log);
        return { el: root, close() {} };
      },
      lastInstallDiagnostic: null,
      buildControllerInfo: async () => ({ externalController: '0.0.0.0:7788', apiBase: 'http://127.0.0.1:7788', secretSet: true, usingFallbackController: false }),
      getCorePid: async () => '100',
      checkInstallState: async () => { probeRuns++; return { state: 'healthy', message: '' }; },
      inspectBootIntegration: async () => ({ state: 'direct', message: '' }),
      readBinarySnapshot: async () => ({ configExists: true, configSize: 1024 }),
      probeShell: async () => ({ success: true, content: '' }),
      readPolicyState: async () => ({ options: { traffic_mode: 'tproxy', ipv6: 'off' } }),
      callMihomoApi: async () => ({ success: true, statusCode: 200, responseText: '{"connections":[]}' }),
      f50HealthLayers: () => ({ core: 'ok', api: 'ok', panel: '可访问', providers: '1 个', providerProblems: [] }),
      parseKeyValueOutput: () => ({ PROCESS_KIND: 'runtime', PORT_CONTROLLER: '1', CORE_ELF: '1' }),
      F50_PORTS: { controller: 7788 },
      LOG_FILE: '/log', CLASH_CORE: '/core', CLASH_CONFIG: '/cfg',
      shellQuote: JSON.stringify, buildF50ShellBase: () => '', buildF50PanelHelpers: () => '',
      escapeHtml: String, sanitizeSubscriptionSecrets: String, setButtonBusy() {}, createToast() {},
    },
  );
  await run();
  assert.equal(probeRuns, 1);
  root.querySelector('.kano-diag-refresh-btn').click();
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(probeRuns, 2);
});

test('importSub supports multiline paste splitting and row reordering with dynamic numbering', async () => {
  const doc = makeFakeDocument();
  const rowsEl = doc.createElement('div');
  const addBtn = doc.createElement('button');
  const clearBtn = doc.createElement('button');
  const submitBtn = doc.createElement('button');
  const closeBtn = doc.createElement('button');
  const ruleMode = doc.createElement('select');
  const convertMode = doc.createElement('select');
  const modeHint = doc.createElement('div');
  const dialogEl = doc.createElement('div');

  const ids = {
    '#mm_sub_rows': rowsEl,
    '#mm_sub_add_btn': addBtn,
    '#mm_sub_clear_btn': clearBtn,
    '#mm_sub_submit_btn': submitBtn,
    '#mm_sub_close_btn': closeBtn,
    '#mm_sub_rule_mode': ruleMode,
    '#mm_sub_convert_mode': convertMode,
    '#mm_sub_mode_hint': modeHint,
  };
  dialogEl.querySelector = (sel) => ids[sel] || makeFakeElement('div', doc);
  dialogEl.firstElementChild = dialogEl;

  await vm.runInNewContext(
    slice('    const importSub = async', '    // 创建订阅链接按钮') + '\nimportSub()',
    {
      document: doc,
      Event: class { constructor(type) { this.type = type; } },
      operationStage() {},
      loadSubscriptionPreferences: async () => null,
      readCurrentSubSources: async () => [],
      readSavedSubConvertMode: async () => 'provider',
      readCurrentSubRuleMode: async () => 'template',
      readConfigSource: async () => 'template.yaml',
      f50GistManaged: async () => null,
      createFixedToast: () => ({ el: dialogEl, close() {} }),
      fitDialogWidth() {},
      bindDialogKeyboard: (_el, close) => close,
      createDirtyCloseGuard: (close) => close,
      askConfirm: async () => true,
      setText: (el, t) => { el.textContent = t; },
      resetChildren: (el) => { el.children.length = 0; },
      safeTextToHtml: String,
      escapeHtml: String,
      SUB_RULE_MODE_TEMPLATE: 'template',
      SUB_CONVERT_MODE_PROVIDER: 'provider',
      SUB_CONVERT_MODE_LOCAL: 'local',
      f50GistMessage: String,
    },
  );

  assert.equal(rowsEl.children.length, 1);
  const firstInput = rowsEl.children[0].querySelector('.mm_sub_url_input');
  assert.equal(firstInput.placeholder, '订阅链接 1');

  // Paste 3 lines into first row -> auto-splits into 3 rows
  let prevented = false;
  firstInput.dispatchEvent({
    type: 'paste',
    clipboardData: { getData: () => 'https://a.example/1\nhttps://b.example/2\nhttps://c.example/3\n' },
    preventDefault() { prevented = true; },
  });
  assert.equal(prevented, true);
  assert.equal(rowsEl.children.length, 3);
  assert.deepEqual(
    rowsEl.children.map((r) => r.querySelector('.mm_sub_url_input').value),
    ['https://a.example/1', 'https://b.example/2', 'https://c.example/3'],
  );
  assert.deepEqual(
    rowsEl.children.map((r) => r.querySelector('.mm_sub_url_input').placeholder),
    ['订阅链接 1', '订阅链接 2', '订阅链接 3'],
  );
  assert.equal(rowsEl.children[0].querySelector('.mm_sub_up_btn').disabled, true);
  assert.equal(rowsEl.children[2].querySelector('.mm_sub_down_btn').disabled, true);

  // Move row 2 up -> becomes row 1
  rowsEl.children[1].querySelector('.mm_sub_up_btn').click();
  assert.deepEqual(
    rowsEl.children.map((r) => r.querySelector('.mm_sub_url_input').value),
    ['https://b.example/2', 'https://a.example/1', 'https://c.example/3'],
  );
  assert.equal(rowsEl.children[0].querySelector('.mm_sub_up_btn').disabled, true);
  assert.equal(rowsEl.children[1].querySelector('.mm_sub_up_btn').disabled, false);
});

test('updateRuntimeGuidance switches quick bar and web panel placeholder across runtime states', () => {
  const doc = makeFakeDocument();
  const root = doc.createElement('div');
  root.id = 'IFRAME_KANO';
  const bar = doc.createElement('div');
  bar.className = 'kano-mm-quick-bar';
  const quickText = doc.createElement('span');
  quickText.className = 'kano-mm-quick-text';
  const quickPrimary = doc.createElement('button');
  quickPrimary.className = 'kano-mm-quick-primary';
  const quickSecondary = doc.createElement('button');
  quickSecondary.className = 'kano-mm-quick-secondary';
  bar.append(quickText, quickPrimary, quickSecondary);

  const wrap = doc.createElement('div');
  wrap.id = 'mm_web_panel_wrap';
  const iframe = doc.createElement('iframe');
  iframe.id = 'mm_iframe';
  iframe.setAttribute('src', 'about:blank');
  const emptyBox = doc.createElement('div');
  emptyBox.className = 'kano-mm-web-empty';
  const emptyTitle = doc.createElement('div');
  emptyTitle.className = 'kano-mm-web-empty-title';
  const emptyDesc = doc.createElement('div');
  emptyDesc.className = 'kano-mm-web-empty-desc';
  const emptyBtn = doc.createElement('button');
  emptyBtn.className = 'kano-mm-web-empty-btn';
  emptyBox.append(emptyTitle, emptyDesc, emptyBtn);
  wrap.append(iframe, emptyBox);
  root.append(bar, wrap);

  const queryMap = {
    '#IFRAME_KANO .kano-mm-quick-bar': bar,
    '#mm_web_panel_wrap': wrap,
    '#mm_iframe': iframe,
  };
  doc.querySelector = (sel) => queryMap[sel] || null;

  const { renderRuntimeStatus } = vm.runInNewContext(
    slice('  let currentRuntimeUiState =', '  let runningStatusRequestId =') + '\n({ renderRuntimeStatus })',
    { document: doc, setText: (el, t) => { el.textContent = t; }, resetChildren: (el) => { el.children.length = 0; } },
  );

  renderRuntimeStatus('stopped', '猫猫 - 未安装', null);
  assert.equal(bar.hidden, false);
  assert.equal(quickPrimary.dataset.quickAction, 'install_or_start');
  assert.equal(emptyBox.hidden, false);
  assert.equal(emptyTitle.textContent, '组件尚未安装');

  renderRuntimeStatus('error', '猫猫 - API 未通', null);
  assert.equal(bar.hidden, false);
  assert.equal(quickPrimary.dataset.quickAction, 'logs');
  assert.equal(emptyTitle.textContent, '控制 API 暂不可用');

  iframe.setAttribute('src', 'http://192.168.0.1:7788/ui/#/');
  renderRuntimeStatus('healthy', '猫猫 - API 正常', null);
  assert.equal(bar.hidden, true);
  assert.equal(emptyBox.hidden, true);

  // Verify runQuickAction routes local_package to localPackageBtn (not btn_enabled)
  const clicks = [];
  const runQuickAction = vm.runInNewContext(
    slice('    const runQuickAction = (action) => {', '    Array.from(document.querySelectorAll(') + '\nrunQuickAction',
    {
      quickRunBtn: { click: () => clicks.push('quickRun') },
      localPackageBtn: { click: () => clicks.push('localPackage') },
      btn_enabled: { click: () => clicks.push('onlineInstall') },
      subBtn: { click: () => clicks.push('sub') },
      showLogBtn: { click: () => clicks.push('logs') },
      controllerSettingsBtn: { click: () => clicks.push('controller') },
      open: { click: () => clicks.push('open') },
      refresh: { click: () => clicks.push('refresh') },
    },
  );
  runQuickAction('install_or_start');
  runQuickAction('local_package');
  runQuickAction('logs');
  runQuickAction('refresh_panel');
  assert.deepEqual(clicks, ['quickRun', 'localPackage', 'logs', 'refresh']);
});

test('syncConfigIpv6Preference syncs ipv6/dns.ipv6 on toggle or template mode and clears empty tun.inet6-address', () => {
  const { syncConfigIpv6Preference } = vm.runInNewContext(
    slice('function f50IsPlainObject(', 'const PROFILE_BASE =')
    + slice('function syncConfigIpv6Preference(', 'async function kprSaveNetworkState(')
    + '\n({ syncConfigIpv6Preference })',
  );

  const cfg = { ipv6: false, dns: { enable: true, ipv6: false }, tun: { enable: true, 'inet6-address': [] } };
  syncConfigIpv6Preference(cfg, { traffic_mode: 'tun', ipv6: 'on' }, { force: true });
  assert.equal(cfg.ipv6, true);
  assert.equal(cfg.dns.ipv6, true);
  assert.equal(Object.prototype.hasOwnProperty.call(cfg.tun, 'inet6-address'), false);

  const customTun = { ipv6: true, dns: { ipv6: true }, tun: { 'inet6-address': ['fd00:abcd::1/126'] } };
  syncConfigIpv6Preference(customTun, { traffic_mode: 'tun', ipv6: 'on' }, { force: false });
  assert.deepEqual(customTun.tun['inet6-address'], ['fd00:abcd::1/126']);

  syncConfigIpv6Preference(cfg, { traffic_mode: 'tproxy', ipv6: 'off' }, { force: true });
  assert.equal(cfg.ipv6, false);
  assert.equal(cfg.dns.ipv6, false);
});

test('kprSaveNetworkState syncs config ipv6 and dns.ipv6 when toggling IPv6 even if config already has false', async () => {
  const shapedInputs = [];
  const baseCode = slice('function f50IsPlainObject(', 'const PROFILE_BASE =')
    + slice('const NETWORK_RUNTIME_FIELDS =', 'async function normalizeIpv6DnsCapability(')
    + slice('function syncConfigIpv6Preference(', '  // Progress advances only at completed checkpoints');
  const save = vm.runInNewContext(
    baseCode + '\nkprSaveNetworkState',
    {
      KPR: { fromOptions: () => ({ enabled: false, cidrs: [], policy: '' }) },
      normalizeIpv6DnsCapability: async () => false,
      normalizeDeviceBypassText: (v) => ({ text: v, invalid: [] }),
      readYamlObject: async () => ({ ok: true, value: { ipv6: false, dns: { enable: true, ipv6: false }, rules: ['MATCH,DIRECT'] } }),
      readConfigSource: async () => 'uploaded_config',
      cloneJsonValue: (v) => JSON.parse(JSON.stringify(v)),
      kprShapeRuntimeConfig: async (cfg, opts) => { shapedInputs.push({ cfg, opts }); return cfg; },
      getCorePid: async () => '',
      createConfigRollbackPoint: async () => 'bak',
      runShellWithRoot: async () => ({ success: true, content: 'NETWORK_SNAPSHOT_READY' }),
      fileSnapshotHelpersCmd: () => '',
      policyTransactionFiles: () => [],
      shellQuote: JSON.stringify,
      createRandomString: () => 'rnd',
      kprBaseSavePolicyState: async () => true,
      kprBaseWriteYamlObjectAtomic: async () => ({ ok: true }),
      invalidateStatusSnapshot() {},
      operationStage() {},
      operationFinish() {},
      createToast() {},
      activeCriticalOperation: null,
      CLASH_CONFIG: '/data/clash/Proxy/config.yaml',
    },
  );

  // Explicit toggle off -> on forces sync even on uploaded_config
  const prev = { options: { traffic_mode: 'tproxy', ipv6: 'off', dns_hijack: 'on' }, deviceBypass: '' };
  const next = { options: { traffic_mode: 'tproxy', ipv6: 'on', dns_hijack: 'on' }, deviceBypass: '' };
  assert.equal(await save(prev, next), true);
  assert.equal(shapedInputs[0].cfg.ipv6, true);
  assert.equal(shapedInputs[0].cfg.dns.ipv6, true);

  // Without toggling ipv6 on uploaded_config, existing config value stays untouched
  const prevSame = { options: { traffic_mode: 'tproxy', ipv6: 'on', dns_hijack: 'on' }, deviceBypass: '' };
  const nextTun = { options: { traffic_mode: 'tun', ipv6: 'on', dns_hijack: 'on' }, deviceBypass: '' };
  assert.equal(await save(prevSame, nextTun), true);
  assert.equal(shapedInputs[1].cfg.ipv6, false);
});

test('showStatusDiagnostic surfaces IPv6 NAT downgrade and config.yaml ipv6:false mismatch', async () => {
  const doc = makeFakeDocument();
  let summaryHtml = '', detailHtml = '';
  const run = vm.runInNewContext(
    slice('  const showStatusDiagnostic = async', '  const sanitizeConfigForTProxy =') + '\nshowStatusDiagnostic',
    {
      document: doc,
      showInfoDialog: () => {
        const root = doc.createElement('div');
        const summary = doc.createElement('div');
        Object.defineProperty(summary, 'innerHTML', { get: () => summaryHtml, set: (v) => { summaryHtml = v; } });
        const detail = doc.createElement('div');
        Object.defineProperty(detail, 'innerHTML', { get: () => detailHtml, set: (v) => { detailHtml = v; } });
        return {
          el: {
            querySelector: (sel) => sel === '.kano-diag-summary' ? summary : sel === '.kano-diag-detail' ? detail : doc.createElement('div'),
          },
          close() {},
        };
      },
      lastInstallDiagnostic: null,
      buildControllerInfo: async () => ({ externalController: '0.0.0.0:7788', apiBase: 'http://127.0.0.1:7788', secretSet: true, usingFallbackController: false }),
      getCorePid: async () => '100',
      checkInstallState: async () => ({ state: 'healthy', message: '' }),
      inspectBootIntegration: async () => ({ state: 'direct', message: '' }),
      readBinarySnapshot: async () => ({ configExists: true, configSize: 1024 }),
      probeShell: async () => ({ success: true, content: '' }),
      readPolicyState: async () => ({ options: { traffic_mode: 'tproxy', ipv6: 'on', dns_hijack: 'on' } }),
      callMihomoApi: async () => ({ success: true, statusCode: 200, responseText: '{"connections":[]}' }),
      f50HealthLayers: () => ({ core: 'ok', api: 'ok', panel: '可访问', providers: '1 个', providerProblems: [] }),
      parseKeyValueOutput: () => ({
        PROCESS_KIND: 'runtime', PORT_CONTROLLER: '1', CORE_ELF: '1',
        IPV6_NAT: '0', CONFIG_IPV6: 'false', CONFIG_DNS_LISTEN: '0.0.0.0:1053', TUN6_STATE: 'no_addr',
      }),
      F50_PORTS: { controller: 7788 },
      LOG_FILE: '/log', CLASH_CORE: '/core', CLASH_CONFIG: '/cfg',
      shellQuote: JSON.stringify, buildF50ShellBase: () => '', buildF50PanelHelpers: () => '',
      escapeHtml: String, sanitizeSubscriptionSecrets: String, setButtonBusy() {}, createToast() {},
    },
  );
  await run();
  assert.match(summaryHtml, /IPv6 开关已开但 config\.yaml 为 ipv6:false/);
  assert.match(summaryHtml, /内核缺 IPv6 NAT：仅劫持 IPv4 DNS/);
  assert.match(detailHtml, /IPv6 诊断/);
  assert.match(detailHtml, /不支持（仅劫持 IPv4 DNS）/);
});

test('readPolicyState and kprReadOptions surface F50_OPERATION_BUSY instead of masking it', async () => {
  const { readPolicyState } = vm.runInNewContext(
    slice('const normalizeMac', 'const ensurePolicyToolsScript')
    + slice('const normalizeIpLike', 'const normalizeDomainRuleText')
    + slice('  const readPolicyState =', '  const updateModeBadge =')
    + '\n({ readPolicyState })',
    {
      KPR: { cidr: () => ({ family: 0 }) },
      CLASH_POLICY_OPTIONS_FILE: '/clash/Policy/options.conf',
      CLASH_DEVICE_BYPASS_FILE: '/clash/Policy/device_bypass.txt',
      CLASH_DEVICE_NOTES_FILE: '/clash/Tools/device_notes.json',
      CLASH_DIRECT_DOMAIN_FILE: '/clash/Policy/direct_domain.list',
      CLASH_DIRECT_IP_FILE: '/clash/Policy/direct_ip.list',
      CLASH_PROXY_DOMAIN_FILE: '/clash/Policy/proxy_domain.list',
      CLASH_REJECT_DOMAIN_FILE: '/clash/Policy/reject_domain.list',
      shellQuote: JSON.stringify,
      parsePolicyOptionsText: () => ({}),
      runShellWithRoot: async () => ({ success: false, content: 'F50_OPERATION_BUSY' }),
    },
  );
  await assert.rejects(readPolicyState(), /设备正忙：已有其他页面或操作正在占用设备锁/);

  const kprReadOptions = vm.runInNewContext(
    slice('function readF50TproxyPortCmd()', 'async function kprReadConnected(') + '\nkprReadOptions',
    {
      F50_PORTS: { tproxy: 7895, dns: 1053 },
      CLASH_POLICY_OPTIONS_FILE: '/clash/Policy/options.conf',
      shellQuote: JSON.stringify,
      parsePolicyOptionsText: () => ({}),
      runShellWithRoot: async () => ({ success: false, content: 'F50_OPERATION_BUSY' }),
    },
  );
  await assert.rejects(kprReadOptions(), /设备正忙：已有其他页面或操作正在占用设备锁/);
});

test('IPv6 bypass suffix helpers normalize, extract, split on save, and merge cleanly on read', async () => {
  const kpr = vm.runInNewContext(
    slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later') + '\ncreatePrivateRouteLogic()',
  );
  const scripts = [];
  const ctx = {
    KPR: kpr,
    F50_PORTS: { dns: 1053 },
    CLASH_DIR: '/data/clash',
    CLASH_PROXY_DIR: '/data/clash/Proxy',
    CLASH_POLICY_DIR: '/data/clash/Policy',
    CLASH_DEVICE_BYPASS_FILE: '/data/clash/Policy/device_bypass.txt',
    CLASH_IPV6_BYPASS_SUFFIXES_FILE: '/data/clash/Policy/ipv6_bypass_suffixes.txt',
    CLASH_MAC_BYPASS_FILE: '/data/clash/Proxy/mac_bypass.txt',
    CLASH_DEVICE_NOTES_FILE: '/data/clash/Tools/device_notes.json',
    CLASH_DIRECT_DOMAIN_FILE: '/data/clash/Policy/direct_domain.list',
    CLASH_DIRECT_IP_FILE: '/data/clash/Policy/direct_ip.list',
    CLASH_PROXY_DOMAIN_FILE: '/data/clash/Policy/proxy_domain.list',
    CLASH_REJECT_DOMAIN_FILE: '/data/clash/Policy/reject_domain.list',
    CLASH_POLICY_OPTIONS_FILE: '/data/clash/Policy/options.conf',
    CLASH_SUB_RULE_MODE_FILE: '/data/clash/Tools/sub_rule_mode.conf',
    BOOT_FILE: '/sdcard/ufi_tools_boot.sh',
    LEGACY_BOOT_MAC_BYPASS_LINE: 'legacy',
    CLASH_POLICY_SCRIPT: '/data/clash/Scripts/Clash.PolicyTools',
    shellQuote: JSON.stringify,
    parsePolicyOptionsText: () => ({ traffic_mode: 'tproxy', ipv6: 'on' }),
    readCurrentSubRuleMode: async () => 'template',
    ensurePolicyToolsScript: async () => true,
    checkIsBootUp: async () => false,
    policyTransactionFiles: () => [],
    fileTransactionHelpersCmd: () => 'snapshot_transaction_file() { :; }\nrestore_transaction_file() { :; }',
    syncSafePolicyFilesCmd: () => '',
    addBootLinesCmd: () => '',
    activeCriticalOperation: null,
    acquireCriticalOperation: () => ({}),
    releaseCriticalOperation: () => {},
    checkClashStatus: async () => ({}),
    invalidateBinarySnapshot() {},
    createToast() {},
    textToHtml: String,
    safeTextToHtml: String,
    runShellWithRoot: async (cmd) => {
      scripts.push(cmd);
      if (cmd.includes('KANO_POLICY_')) {
        return {
          success: true,
          content: [
            'KANO_POLICY_deviceBypass=192.168.0.248',
            'KANO_POLICY_deviceBypass=2408:8444:b591:2430::248 # kano-v6-suffix',
            'KANO_POLICY_ipv6Suffixes=::248',
            'KANO_POLICY_ipv6Suffixes=::6:1',
          ].join('\n'),
        };
      }
      return { success: true, content: 'POLICY_STATE_COMMITTED\nPOLICY_STATE_SAVED' };
    },
  };
  const api = vm.runInNewContext(
    slice('const normalizeMac', 'const ensurePolicyToolsScript')
    + slice('const normalizeIpLike', 'const normalizeDomainRuleText')
    + slice('  const readPolicyState =', '  const updateModeBadge =')
    + slice('const normalizeDomainRuleText =', 'const applyPolicyToolsRules =')
    + '\n({ normalizeIpv6SuffixLike, extractIpv6SuffixCandidate, normalizeDeviceBypassText, readPolicyState, kprBaseSavePolicyState })',
    ctx,
  );

  assert.equal(api.normalizeIpv6SuffixLike('::0248'), '::248');
  assert.equal(api.normalizeIpv6SuffixLike('::0006:0001'), '::6:1');
  assert.equal(api.normalizeIpv6SuffixLike('::1'), '');
  assert.equal(api.extractIpv6SuffixCandidate('2408:8444:b591:2430::248'), '::248');
  assert.equal(api.extractIpv6SuffixCandidate('2408:8444:b591:2430::6:1'), '::6:1');

  const norm = api.normalizeDeviceBypassText('192.168.0.248\n::0248 # 电脑\n::248\n::6:1\n');
  assert.deepEqual([...norm.invalid], []);
  assert.equal(norm.text, '192.168.0.248\n::248\n::6:1\n');

  const state = await api.readPolicyState();
  assert.equal(state.deviceBypass, '192.168.0.248\n::248\n::6:1\n');

  const ok = await api.kprBaseSavePolicyState({
    options: { traffic_mode: 'tproxy', ipv6: 'on', dns_hijack: 'on', tun_stack: 'auto' },
    deviceBypass: '192.168.0.248\n::248\n::6:1\n',
  }, { apply: false });
  assert.equal(ok, true);
  const writeCmd = scripts.find((s) => s.includes('POLICY_STATE_SAVED'));
  assert.match(writeCmd, /device_bypass\.txt" 600 "192\.168\.0\.248\\n"/);
  assert.match(writeCmd, /ipv6_bypass_suffixes\.txt" 600 "::248\\n::6:1\\n"/);
});
