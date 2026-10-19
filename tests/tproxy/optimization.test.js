'use strict';

const test = require('node:test');
const { fs, path, vm, assert, source, original, slice, run, shell, syntax, shellApi,
  subscriptionApi, plain, quote, temp, write } = require('./optimization_harness');
const api = shellApi();
const baseline = shellApi(original);

test('single-file JS and generated operation scripts are syntactically valid', () => {
  new vm.Script(source);
  for (const scripts of [api, baseline]) {
    for (const action of ['start', 'restart']) syntax(scripts.start(action));
    for (const action of ['maintenance', 'inspect', 'cleanup', 'final']) syntax(scripts[action]());
    syntax(scripts.install('/data/upload.zip'));
    for (const stage of scripts.uninstall()) syntax(stage.script);
  }
  assert.match(source, /const F50_DEFAULT_SECRET = '123456'/);
  assert.match(source, /const F50_COMPAT_VERSION = '8\.0\.0-compat\.2\.3'/);
  assert.ok(source.includes('AGPL-3.0-or-later'));
});

for (const profile of ['tproxy4', 'tproxy6', 'tun4', 'tun6', 'off4', 'off6']) {
  test(`${profile}: complete configuration equals original`, () => {
    const profiles = text => run(slice('const F50_ZASHBOARD_UI_URL', 'const F50_COMPAT_VERSION', text) + 'F50_FIXED_PROFILES');
    assert.deepEqual(plain(profiles(source)[profile]), plain(profiles(original)[profile]));
  });
}

for (const [name, output, rc, panel, expected] of [
  ['timeout', '', 124, true, 'start_timeout'],
  ['invalid configuration', 'F50_ERROR=original_config_invalid', 1, true, 'invalid_config'],
  ['panel verification warning', 'START_STATE=started_verified_process', 0, false, 'started'],
  ['network application', 'F50_ERROR=policy_apply_failed', 8, true, 'network_apply_failed'],
  ['success', 'START_STATE=started_verified_process', 0, true, 'started'],
]) {
  test(`start ${name}: outer markers survive command substitution`, () => {
    const dir = temp();
    try {
      write(dir, 'Scripts/Clash.Service', `#!/bin/sh\nprintf '%s\\n' ${quote(output)}\nexit ${rc}\n`);
      const stub = shellApi(source, 'buildF50OriginalServicePatchScript = () => "true";');
      const result = shell(stub.maintenance() + `
f50_ensure_live_secret() { return 0; }
f50_ensure_live_panel_config() { return 0; }
f50_disable_unsupported_ipv6_dns_hijack() { return 0; }
f50_drop_detached_tun_rules() { return 0; }
f50_verify_zashboard_endpoint() { return ${panel ? 0 : 1}; }
f50_start_service start 5 >/dev/null
rc=$?
printf 'OUTER=%s:%s:%s:%s\\n' "$F50_START_CODE" "$F50_START_OK" "$START_SERVICE_RC" "$rc"
printf '%s\\n' "$F50_START_DETAIL"
`, { F50_ROOT: dir.replace(/\\/g, '/') });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, new RegExp(`OUTER=${expected}:${expected === 'started' ? 1 : 0}:${rc}:${expected === 'started' ? 0 : 1}`));
      assert.match(result.stdout, new RegExp(`^F50_START_CODE=${expected}$`, 'm'));
      if (!panel) assert.match(result.stdout, /^F50_HEALTH_PANEL=failed$/m);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

test('mode normalization, provider names, User-Agent and disabled sources retain their data', () => {
  const sub = subscriptionApi(slice('const buildManagedProxyProviders', 'const buildManagedRuleProviders')
    + '({normalizeSubConvertModeValue,parseSubConvertModeFromText,buildSubUrlsFileText,parseStoredSubSourcesFromText,buildManagedProxyProviders})',
    { currentProviderUserAgent: 'custom-agent' });
  for (const mode of ['provider', 'local', ' PROVIDER ', ' LOCAL ', '', 'invalid'])
    assert.equal(sub.normalizeSubConvertModeValue(mode), mode.trim().toLowerCase() === 'local' ? 'local' : 'provider');
  const sources = [{ url: 'https://one.example/sub' }, { url: 'https://off.example/sub', enabled: false }, { url: 'https://two.example/sub' }];
  for (const mode of ['provider', 'local']) {
    const text = sub.buildSubUrlsFileText(sources, 'template', mode);
    assert.equal(sub.parseSubConvertModeFromText(text), mode);
    assert.deepEqual(plain(sub.parseStoredSubSourcesFromText(text)).map(s => s.enabled), [true, false, true]);
    const defs = sub.buildManagedProxyProviders(sources, { localFiles: mode === 'local' });
    assert.deepEqual(Object.keys(defs), ['Provider1', 'Provider2']);
    assert.equal(defs.Provider2.path, './proxies/Provider2.yaml');
    assert.equal(defs.Provider1.type, mode === 'local' ? 'file' : 'http');
    if (mode === 'provider') assert.deepEqual(plain(defs.Provider1.header['User-Agent']), ['custom-agent']);
  }
});

for (const [saved, types, expected] of [
  ['# KANO_SUB_CONVERT_MODE=provider\r\n', ['file'], 'provider'],
  ['# KANO_SUB_CONVERT_MODE=local\n', ['http'], 'local'],
  ['', ['file', 'file'], 'local'], ['', ['http'], 'provider'], ['', [], 'provider'],
]) {
  test(`saved mode ${JSON.stringify(saved)} / ${types}: ${expected}`, async () => {
    const read = subscriptionApi('readSavedSubConvertMode', {
      hostRunShellWithRoot: async () => ({ success: true, content: saved + (types.length ? '\nKANO_CONFIG_PRESENT=1' : '') }),
      f50ShellReply: value => value,
      runShellWithRoot: async () => { throw Error('read must not acquire a lease'); },
      readYamlObject: async () => ({ ok: true, value: { 'proxy-providers': Object.fromEntries(types.map((type, i) => [`Provider${i + 1}`, { type }])) } }),
    });
    assert.equal(await read(), expected);
  });
}

for (const when of ['before', 'during', 'wait']) {
  test(`cancellation ${when} prevents further shell commands`, async () => {
    const operation = { token: { cancelled: when === 'before' } };
    let calls = 0;
    const cancel = () => Object.assign(new Error('cancelled'), { name: 'OperationCancelled' });
    const retry = run(slice('const runShellWithRootRetry', 'let binarySnapshotCache') + 'runShellWithRootRetry', {
      activeCriticalOperation: operation, operationCancelled: cancel,
      runShellWithRoot: async () => { calls++; if (when === 'during') throw cancel(); return { success: false, content: 'request timeout' }; },
      wait: async () => { operation.token.cancelled = true; },
    });
    // The transport owns cancellation; this wrapper delegates without retrying.
    if (when === 'during') await assert.rejects(retry('test'), { name: 'OperationCancelled' });
    else assert.equal((await retry('test')).success, false);
    assert.equal(calls, 1);
  });
}

test('uncertain transport failures are never automatically retried', async () => {
  let calls = 0; const waits = [];
  const retry = run(slice('const runShellWithRootRetry', 'let binarySnapshotCache') + 'runShellWithRootRetry', {
    activeCriticalOperation: null,
    runShellWithRoot: async () => { calls++; throw new Error('request timeout'); },
    wait: async ms => waits.push(ms),
  });
  await assert.rejects(retry('test'), /request timeout/);
  assert.equal(calls, 1);
  assert.deepEqual(waits, []);
});

const yq = process.env.F50_TEST_YQ;
test('curl selection falls back when a bundled executable cannot run', () => {
  const dir = temp();
  try {
    const files = path.join(dir, 'files'), tools = path.join(dir, 'tools'), bin = path.join(dir, 'bin');
    const broken = write(files, 'curl', '#!/bin/sh\nexit 126\n');
    const fallback = write(bin, 'curl', '#!/bin/sh\necho "curl compatible"\n');
    fs.chmodSync(broken, 0o755); fs.chmodSync(fallback, 0o755);
    const locator = run(slice('function buildF50CurlLocator()', 'function buildF50ServiceCurlPatchScript') + 'buildF50CurlLocator');
    const command = run(slice('const getCurlBinCmd', 'const getCorePid') + 'getCurlBinCmd', {
      shellQuote: quote, F50_FILES_DIR: files, KANO_INSTALL_TOOLBOX_BIN: tools,
      buildF50CurlLocator: () => locator().replace('/data/data/com.minikano.f50_sms/files/curl', quote(broken))
        .replace('/data/kano_tproxy_tools/bin/curl', quote(path.join(tools, 'curl'))),
    });
    const result = shell(command() + '\nprintf "%s\\n" "$CURL_BIN"', { PATH: bin + ':' + process.env.PATH });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout.trim(), fallback);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('missing start marker uses a fallback; log text cannot spoof anchored markers', () => {
  const dir = temp();
  try {
    const stub = shellApi(source, 'buildF50OriginalServicePatchScript = () => "true";');
    const response = shell(stub.maintenance() + `
f50_ensure_live_secret() { return 0; }
f50_ensure_live_panel_config() { return 0; }
f50_disable_unsupported_ipv6_dns_hijack() { echo 'log: F50_START_CODE=started'; echo 'F50_START_CODE=bad value'; echo 'secret=synthetic-secret'; return 1; }
f50_start_service start 5 >/dev/null
printf 'OUTER=%s:%s\\n' "$F50_START_CODE" "$F50_START_OK"
printf '%s\\n' "$F50_START_DETAIL"
`, { F50_ROOT: dir.replace(/\\/g, '/') });
    assert.match(response.stdout, /OUTER=service_failed:0/);
    assert.ok(!response.stdout.includes('synthetic-secret'));
    assert.match(response.stdout, /SENSITIVE_ERROR_REDACTED/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('YAML reads check parsing and detect replaced, missing or invalid components', { skip: !yq }, async () => {
  const dir = temp();
  try {
    const config = write(dir, 'config.yaml', 'name: good\n');
    const log = write(dir, 'versions', '');
    const script = `#!/bin/sh\nif [ "$1" = --version ]; then echo version >> ${quote(log)}; fi\nexec ${quote(yq)} "$@"\n`;
    const bin = write(dir, 'Tools/yq_linux_arm64', script);
    fs.chmodSync(bin, 0o755);
    let calls = 0;
    const read = run(slice('const yqExecutableCheckCmd', 'const yamlHasGeneratedMarker') + 'readYamlObject', {
      CLASH_DIR: dir.replace(/\\/g, '/'), YAML_BRIDGE_MAX_BYTES: 32, shellQuote: quote,
      ensureCompatBackend: async () => true, prepareYqRuntimeCmd: () => ':',
      buildF50ShellBase: api.base,
      assertYamlRootMap: v => { if (!v || Array.isArray(v) || typeof v !== 'object') throw new Error('not mapping'); },
      f50AssertSafeJsonNumbers() {},
      runShellWithRoot: async script => { calls++; const r = shell(script); return { success: r.status === 0, content: r.stdout + r.stderr }; },
    });
    assert.equal((await read(config)).ok, true);
    assert.equal(calls, 1);
    assert.equal(fs.readFileSync(log, 'utf8'), '');
    fs.writeFileSync(bin, '#!/bin/sh\necho "yq version v3.4"\n');
    assert.match((await read(config)).message, /转换为单个 JSON 映射失败/);
    fs.rmSync(bin);
    assert.match((await read(config)).message, /YQ_MISSING/);
    fs.writeFileSync(bin, script); fs.chmodSync(bin, 0o755);
    fs.writeFileSync(config, 'x'.repeat(64));
    assert.match((await read(config)).message, /YAML_FILE_TOO_LARGE/);
    fs.writeFileSync(config, '- item\n');
    assert.equal((await read(config)).ok, false);
    fs.writeFileSync(config, 'x: [\n');
    assert.equal((await read(config)).ok, false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('managed YAML: idempotent panel fields, nonempty secret and original unified-delay', { skip: !yq }, () => {
  const dir = temp();
  try {
    const config = write(dir, 'Proxy/config.yaml', 'secret: existing-secret\nexternal-ui: WebUI/zashboard\nexternal-ui-url: https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip\nunified-delay: true\n');
    write(dir, 'Tools/yq_linux_arm64', `#!/bin/sh\nexec ${quote(yq)} "$@"\n`);
    const result = shell(api.maintenance() + `
chmod +x "$F50_ROOT/Tools/yq_linux_arm64"
before=$(stat -c '%i:%Y' "$F50_ROOT/Proxy/config.yaml")
f50_ensure_live_secret && f50_ensure_live_panel_config && f50_ensure_live_panel_config || exit 1
after=$(stat -c '%i:%Y' "$F50_ROOT/Proxy/config.yaml")
[ "$before" = "$after" ] || exit 2
`, { F50_ROOT: dir.replace(/\\/g, '/') });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.readFileSync(config, 'utf8').includes('secret: existing-secret'));
    write(dir, 'Tools/config_source.conf', 'KANO_CONFIG_SOURCE=subscription_original\n');
    write(dir, 'Proxy/config.yaml', 'secret: ""\nunified-delay: false\ncustom: retained\n');
    const repair = shell(api.maintenance() + '\nf50_ensure_live_secret && f50_ensure_live_panel_config\n', { F50_ROOT: dir.replace(/\\/g, '/') });
    assert.equal(repair.status, 0, repair.stderr);
    assert.match(fs.readFileSync(config, 'utf8'), /secret: "?123456"?/);
    assert.match(fs.readFileSync(config, 'utf8'), /unified-delay: false/);
    assert.match(fs.readFileSync(config, 'utf8'), /custom: retained/);
    fs.writeFileSync(config, 'broken: [\n');
    const invalid = shell(api.maintenance() + '\nf50_ensure_live_panel_config\n', { F50_ROOT: dir.replace(/\\/g, '/') });
    assert.equal(invalid.status, 1);
    assert.equal(fs.readFileSync(config, 'utf8'), 'broken: [\n');
    assert.equal(fs.readdirSync(path.dirname(config)).some(name => name.includes('.kano_update.')), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
