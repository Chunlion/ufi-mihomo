'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const source = fs.readFileSync(path.join(__dirname, '..', '..', '猫猫TProxy.js'), 'utf8');
const slice = (start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing source: ${start}`);
  return source.slice(from, to);
};
const updateFunction = slice('const updateSubProviders = async', 'const readCurrentSubSources = async');
const clickHandler = slice('updateSubBtn.onclick = async', 'const applySavedOverrides = async');

for (const configSource of ['uploaded_config', 'subscription_original']) {
  for (const saved of [true, false]) {
    test(`original YAML update from ${configSource}, save=${saved}`, async () => {
      const sources = [{ name: 'Provider1', url: 'https://example.com/config.yaml', enabled: true }];
      const calls = [];
      const finished = [];
      const sandbox = {
        SUB_RULE_MODE_TEMPLATE: 'template',
        SUB_RULE_MODE_ORIGINAL: 'original',
        SUB_CONVERT_MODE_LOCAL: 'local',
        CLASH_CONFIG: '/data/clash/Proxy/config.yaml',
        updateSubBtn: {},
        acquireCriticalOperation: () => ({}),
        releaseCriticalOperation() {},
        setButtonBusy() {},
        operationStage() {},
        operationFinish: (ok) => finished.push(ok),
        ensureReady: async () => true,
        ensureCompatBackend: async () => true,
        readConfigSource: async () => configSource,
        readCurrentSubRuleMode: async () => 'original',
        readSavedSubConvertMode: async () => 'local',
        readCurrentSubSources: async () => sources,
        normalizeSubSourceList: (value) => value,
        normalizeSubRuleModeValue: (value) => value,
        validateSubscriptionMode() {},
        createToast() {},
        safeTextToHtml: (value) => value,
        readYamlObject: async () => ({ ok: true, value: { proxies: [{ name: 'Old' }] } }),
        saveSubSources: async (...args) => { calls.push(args); return saved; },
        forceUpdateProvidersFromConfig: async () => { throw new Error('YAML update must download the saved URL'); },
      };
      vm.runInNewContext(`${updateFunction}\n${clickHandler}`, sandbox);
      await sandbox.updateSubBtn.onclick();
      assert.equal(calls.length, 1);
      assert.equal(calls[0][0], sources);
      assert.deepEqual(calls[0].slice(1, 3), ['original', 'local']);
      assert.equal(calls[0][3].applyToCustom, true);
      assert.deepEqual(finished, [saved]);
    });
  }
}

test('uploaded config in template mode only refreshes its providers', async () => {
  let refreshed = false;
  const sandbox = {
    SUB_RULE_MODE_ORIGINAL: 'original',
    updateSubBtn: {},
    acquireCriticalOperation: () => ({}),
    releaseCriticalOperation() {},
    setButtonBusy() {},
    operationStage() {},
    operationFinish: (ok) => assert.equal(ok, true),
    ensureReady: async () => true,
    readCurrentSubRuleMode: async () => 'template',
    readConfigSource: async () => 'uploaded_config',
    readCurrentSubSources: async () => { throw new Error('custom providers do not use saved subscriptions'); },
    updateSubProviders: async (sources) => {
      assert.equal(sources.length, 0);
      refreshed = true;
      return true;
    },
  };
  vm.runInNewContext(clickHandler, sandbox);
  await sandbox.updateSubBtn.onclick();
  assert.equal(refreshed, true);
});

const configApi = vm.runInNewContext(`${slice('const F50_PORTS', 'const F50_COMPAT_VERSION')}
  ${slice('const F50_ORIGINAL_MANAGED_KEYS', 'let f50BackendReady')}
  ${slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later')}
  ({ runtime: createPrivateRouteLogic().runtime, profiles: F50_FIXED_PROFILES, delta: PROFILE_DELTA,
     functions: buildF50OriginalConfigFunctions, install: ensureOriginalSubscriptionService })`, {
  F50_ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
});
const originalConfig = {
  'log-level': 'debug', 'unified-delay': false, 'tcp-concurrent': true,
  'geodata-mode': false, 'external-controller-tls': '0.0.0.0:9999',
  'interface-name': 'DesktopEthernet', 'routing-mark': 1234,
  'x-format-test': { booleanString: 'true', numericString: '00123', booleanValue: false, numberValue: 7 },
  sniffer: { enable: false }, profile: { 'store-selected': false },
  dns: { enable: false, listen: '127.0.0.1:53', ipv6: true,
    nameserver: ['https://example.com/dns-query'], 'enhanced-mode': 'fake-ip',
    'nameserver-policy': { 'rule-set:cn_domain': ['1.1.1.1'] },
    'proxy-server-nameserver-policy': {
      'cdn-hk.example.com': ['dns-hk.example.com:1066', 'dns-jp.example.com:1066', 'https://dns-jp.example.com/dns-query'],
      'cdn-jp.example.com': ['dns-hk.example.com:1066', 'dns-jp.example.com:1066', 'https://dns-jp.example.com/dns-query'],
    } },
  tun: { enable: true, mtu: 9000, 'route-exclude-address': ['203.0.113.0/24'] },
  proxies: [{ name: 'Test', type: 'socks5', server: 'example.com', port: 1080 }],
  'proxy-groups': [{ name: 'Proxy', type: 'select', proxies: ['Test'] }],
  rules: ['MATCH,Proxy'],
  'rule-providers': { cn_domain: { type: 'http', behavior: 'domain', proxy: 'Proxy' } },
};
const plain = (value) => JSON.parse(JSON.stringify(value));

for (const mode of ['tproxy', 'tun', 'off']) {
  test(`original config retains custom settings in ${mode} mode`, () => {
    const original = plain(originalConfig);
    const result = plain(configApi.runtime(original, { traffic_mode: mode, ipv6: 'off' }, [], true));
    for (const key of ['log-level', 'sniffer', 'profile', 'unified-delay', 'tcp-concurrent', 'geodata-mode',
      'proxies', 'proxy-groups', 'rules', 'rule-providers']) assert.deepEqual(result[key], original[key], key);
    assert.deepEqual(result.dns.nameserver, original.dns.nameserver);
    assert.deepEqual(result.dns['nameserver-policy'], original.dns['nameserver-policy']);
    assert.deepEqual(result.dns['proxy-server-nameserver-policy'], original.dns['proxy-server-nameserver-policy']);
    assert.equal(result.dns['enhanced-mode'], 'fake-ip');
    assert.deepEqual([result.dns.enable, result.dns.listen, result.dns.ipv6], [true, '0.0.0.0:1053', false]);
    assert.equal(result.tun.enable, mode === 'tun');
    assert.equal(result['tproxy-port'], mode === 'tproxy' ? 7895 : 0);
    assert.equal(result['external-controller'], '0.0.0.0:7788');
    assert.equal(result['external-controller-tls'], undefined);
    assert.equal(result['interface-name'], undefined);
    assert.equal(result['routing-mark'], undefined);
    assert.deepEqual(original, originalConfig, 'input remains unchanged');
    const updated = { ...original, 'log-level': 'warning', sniffer: { enable: true } };
    assert.equal(configApi.runtime(updated, { traffic_mode: mode }, [], true)['log-level'], 'warning');
    assert.equal(configApi.runtime(updated, { traffic_mode: mode }, [], true).sniffer.enable, true);
  });
}

test('template mode retains node DNS policies alongside its fixed defaults', () => {
  const result = configApi.runtime(originalConfig, { traffic_mode: 'tproxy', ipv6: 'off' });
  assert.equal(result['log-level'], 'info');
  assert.equal(result.sniffer.enable, true);
  assert.equal(result['unified-delay'], true);
  assert.equal(result['rule-providers'].cn_domain.proxy, 'DIRECT');
  assert.deepEqual(plain(result.dns['proxy-server-nameserver-policy']), originalConfig.dns['proxy-server-nameserver-policy']);
  const updated = plain(originalConfig);
  updated.dns['proxy-server-nameserver-policy'] = { 'new.example.com': ['dns-new.example.com:1066'] };
  assert.deepEqual(plain(configApi.runtime(updated).dns['proxy-server-nameserver-policy']), updated.dns['proxy-server-nameserver-policy']);
  delete updated.dns['proxy-server-nameserver-policy'];
  assert.equal(configApi.runtime(updated).dns['proxy-server-nameserver-policy'], undefined);
});

test('switching original config from IPv6 TUN to IPv4 keeps DNS settings and clears IPv6 TUN addresses', () => {
  const v6 = configApi.runtime(originalConfig, { traffic_mode: 'tun', ipv6: 'on' }, [], true);
  assert.equal(v6.dns.ipv6, true);
  assert.equal(v6.dns.listen, '[::]:1053');
  assert.ok(v6.tun['inet6-address']);
  const v4 = configApi.runtime(v6, { traffic_mode: 'tun', ipv6: 'off' }, [], true);
  assert.equal(v4.tun['inet6-address'], undefined);
  assert.deepEqual(plain(v4.dns.nameserver), originalConfig.dns.nameserver);
});

test('first original config write and later network changes select preservation', async () => {
  const calls = [];
  const sandbox = {
    KPR: { fromOptions: () => ({ enabled: false }), runtime: (...args) => { calls.push(args); return args[0]; } },
    kprReadOptions: async () => ({ traffic_mode: 'tproxy' }),
    readConfigSource: async () => 'subscription_original',
    ensureOriginalSubscriptionService: async () => true,
    CLASH_CONFIG: 'config.yaml',
    kprBaseWriteYamlObjectAtomic: async (target, value) => ({ ok: true, value }),
  };
  vm.runInNewContext(`${slice('async function kprShapeRuntimeConfig', 'async function savePolicyState')}
    this.write = writeYamlObjectAtomic; this.shape = kprShapeRuntimeConfig;`, sandbox);
  await sandbox.write('config.yaml', originalConfig, { configSource: 'subscription_original' });
  await sandbox.shape(originalConfig, { traffic_mode: 'tun' });
  await sandbox.write('config.yaml', originalConfig, { configSource: 'template.yaml' });
  assert.deepEqual(calls.map((args) => args[3]), [true, true, false]);
});

const yq = process.env.F50_TEST_YQ;
const uniqueYamlKeys = '[.. | select(tag == "!!map") | ((keys | length) == (keys | unique | length))] | all';
test('YAML validation rejects duplicate mapping keys', { skip: !yq }, () => {
  for (const input of ['allow-lan: true\nallow-lan: false\n', 'dns:\n  enable: true\n  enable: false\n']) {
    const result = spawnSync(yq, ['eval', '-e', uniqueYamlKeys, '-'], { input, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
  }
});
test('restored config validation failures include the core reason in diagnostics', () => {
  const diagnostic = vm.runInNewContext(`${slice('function f50Diagnostic', 'function f50Error')}\nf50Diagnostic`, {
    sanitizeSubscriptionSecrets: (value) => String(value),
  });
  const markers = 'F50_ERROR=original_config_invalid\nSTART_SERVICE_RC=0\nF50_START_CODE=service_failed\nF50_START_OK=0';
  assert.match(diagnostic(markers).summary, /用户配置恢复后未通过核心校验/);
  const detailed = diagnostic(markers + '\nF50_CONFIG_TEST_DETAIL=level=info msg="Initial configuration"\nF50_CONFIG_TEST_DETAIL=level=error msg="Parse config error: invalid DNS server"');
  assert.match(detailed.summary, /invalid DNS server/);
  assert.ok(!detailed.summary.includes('Initial configuration'));
});
test('service preserves original YAML after controller preparation and reloads it', { skip: !yq }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-original-config-'));
  const shellPath = (value) => value.replace(/\\/g, '/');
  const quote = (value) => `'${value.replace(/'/g, `'"'"'`)}'`;
  const run = (args, extraEnv = {}) => spawnSync('sh', args, { encoding: 'utf8',
    env: { ...process.env, CLASH_ROOT: shellPath(root), ...extraEnv } });
  const write = (relative, content) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return file;
  };
  try {
    const archive = spawnSync('tar', ['-xOf', path.join(__dirname, '..', '..', 'tproxy-yq.zip'), 'Scripts/Clash.Service'], { encoding: 'utf8' });
    assert.equal(archive.status, 0, archive.stderr);
    const functions = configApi.functions();
    assert.ok(archive.stdout.replace(/\r\n/g, '\n').includes(functions), 'package contains current preservation functions');
    const originalWrapper = archive.stdout.replace(/\r\n/g, '\n').replace(functions, '')
      .replace('f50_save_original_config "$action" || exit 1\n', '')
      .replace('f50_restore_original_config || exit 1\n', '')
      .replace('  "$yq" eval -P -o=yaml -I=2 ', '  "$yq" eval ')
      .replace(/    \(select\(strenv\(F50_CONFIG_SOURCE\).*\n/, '    ."unified-delay" = true |\n');
    const service = write('Scripts/Clash.Service', originalWrapper);
    const installer = vm.runInNewContext(`${slice('const F50_ORIGINAL_MANAGED_KEYS', 'let f50BackendReady')}
      ensureOriginalSubscriptionService`, {
      PROFILE_DELTA: configApi.delta,
      CLASH_SERVICE: shellPath(service), shellQuote: quote,
      runShellWithRoot: async (script) => { const result = run(['-c', script]);
        assert.equal(result.status, 0, result.stderr); return { success: true }; },
    });
    assert.equal(await installer(), true);
    const installed = fs.readFileSync(service, 'utf8');
    assert.equal(installed, archive.stdout.replace(/\r\n/g, '\n'), 'installed patch matches packaged service');
    assert.equal(await installer(), true);
    assert.equal(fs.readFileSync(service, 'utf8'), installed, 'installation is idempotent');
    for (const version of ['1', '2', '3', '4', '5', '6']) {
      write('Scripts/Clash.Service', installed.replace('KANO_ORIGINAL_CONFIG_PRESERVATION=7', `KANO_ORIGINAL_CONFIG_PRESERVATION=${version}`)
        .replace('original_config_merge_failed', 'old_original_config_merge_failed')
        .replace('  "$yq" eval -P -o=yaml -I=2 ', '  "$yq" eval '));
      assert.equal(await installer(), true);
      assert.equal(fs.readFileSync(service, 'utf8'), installed, 'old preservation functions and hooks are replaced without duplication');
    }
    assert.equal(run(['-n', service]).status, 0);
    write('Tools/yq_linux_arm64', `#!/bin/sh\nexec ${quote(shellPath(yq))} "$@"\n`);
    write('Proxy/Clash.Core', `#!/bin/sh\nif [ "\${FAIL_VALIDATE:-0}" != 0 ]; then
  printf '%s\\n' 'level=error msg="Parse config error: invalid DNS server"' 'https://example.com/private?key=test-secret' 'password=test-password' 'uuid=test-uuid' 'private-key=test-private-key' >&2
fi
[ "\${FAIL_VALIDATE:-0}" = 0 ] || exit "$FAIL_VALIDATE"
while [ "$#" -gt 0 ]; do
  case "$1" in -f) shift; config=$1 ;; esac
  shift
done
"$CLASH_ROOT/Tools/yq_linux_arm64" eval -e ${quote(uniqueYamlKeys)} "$config" >/dev/null || { echo 'yaml: duplicate mapping key' >&2; exit 1; }
`);
    write('Scripts/clashctl', '#!/bin/sh\ncp "$CLASH_ROOT/fixed.json" "$CLASH_ROOT/Proxy/config.yaml"\nexit "${FAIL_CONTROLLER:-0}"\n');
    write('bin/curl', '#!/bin/sh\ncp "$CLASH_ROOT/Proxy/config.yaml" "$CLASH_ROOT/reloaded.json"\nprintf 204\n');
    write('Proxy/WebUI/zashboard/index.html', '<title>zashboard</title>');
    write('Proxy/WebUI/zashboard/manifest.webmanifest', '{}');
    write('Proxy/WebUI/zashboard/registerSW.js', 'void 0');
    fs.mkdirSync(path.join(root, 'Proxy/WebUI/zashboard/assets'));
    write('fixed.json', JSON.stringify(plain(configApi.profiles.tproxy4)));
    const chmod = run(['-c', 'chmod +x "$CLASH_ROOT/Tools/yq_linux_arm64" "$CLASH_ROOT/Proxy/Clash.Core" "$CLASH_ROOT/Scripts/clashctl" "$CLASH_ROOT/bin/curl"']);
    assert.equal(chmod.status, 0, chmod.stderr);
    const env = { PATH: `${shellPath(path.join(root, 'bin'))}:${process.env.PATH}` };
    for (const action of ['prepare', 'start', 'restart']) {
      write('Tools/config_source.conf', 'KANO_CONFIG_SOURCE=subscription_original\n');
      write('Proxy/config.yaml', JSON.stringify(originalConfig));
      const result = run([service, action], env);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const parsed = spawnSync(yq, ['-o=json', '.', path.join(root, 'Proxy/config.yaml')], { encoding: 'utf8' });
      assert.equal(parsed.status, 0, parsed.stderr);
      const config = JSON.parse(parsed.stdout);
      const text = fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8');
      assert.match(text, /^log-level: debug$/m);
      assert.match(text, /^dns:\r?\n/m);
      assert.match(text, /^\s+- https:\/\/example.com\/dns-query$/m);
      assert.deepEqual(config['x-format-test'], originalConfig['x-format-test'], 'formatting preserves scalar types');
      assert.equal(config['log-level'], 'debug');
      assert.equal(config.sniffer.enable, false);
      assert.equal(config['unified-delay'], false);
      assert.equal(config['interface-name'], undefined);
      assert.equal(config['routing-mark'], undefined);
      assert.deepEqual(config.dns.nameserver, originalConfig.dns.nameserver);
      assert.deepEqual(config.dns['proxy-server-nameserver-policy'], originalConfig.dns['proxy-server-nameserver-policy']);
      assert.equal(config.dns.listen, '0.0.0.0:1053');
      assert.deepEqual(config['rule-providers'], originalConfig['rule-providers']);
      if (action !== 'prepare') assert.equal(fs.readFileSync(path.join(root, 'reloaded.json'), 'utf8'),
        fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), 'core reload uses preserved config');
    }
    const remoteUrl = 'https://example.com/nodes.yaml';
    const converted = { ...plain(configApi.profiles.tproxy4),
      'proxy-providers': { Remote: { type: 'file', path: './proxies/Remote.yaml' } },
      'x-f50-provider-sources': { Remote: remoteUrl },
    };
    write('fixed.json', JSON.stringify(converted));
    write('Proxy/config.yaml', JSON.stringify({ ...originalConfig,
      'proxy-providers': { Remote: { type: 'http', url: remoteUrl, path: './old.yaml' } },
      'x-f50-provider-sources': { Removed: 'https://example.com/removed.yaml' },
    }));
    const providerRun = run([service, 'restart'], env);
    assert.equal(providerRun.status, 0, providerRun.stdout + providerRun.stderr);
    const providerRead = spawnSync(yq, ['-o=json', '.', path.join(root, 'Proxy/config.yaml')], { encoding: 'utf8' });
    assert.equal(providerRead.status, 0, providerRead.stderr);
    const providerConfig = JSON.parse(providerRead.stdout);
    assert.deepEqual(providerConfig['proxy-providers'], converted['proxy-providers'], 'converted file providers keep their current type and cache path');
    assert.deepEqual(providerConfig['x-f50-provider-sources'], converted['x-f50-provider-sources'], 'remote metadata is replaced without retaining removed sources');
    assert.deepEqual(providerConfig.dns.nameserver, originalConfig.dns.nameserver);
    assert.equal(providerConfig['log-level'], 'debug');
    for (const failure of ['FAIL_BACKUP', 'FAIL_VALIDATE', 'FAIL_CONTROLLER']) {
      const before = JSON.stringify(originalConfig);
      write('Proxy/config.yaml', before);
      const result = failure === 'FAIL_BACKUP'
        ? run(['-c', 'cp() { printf partial > "$2"; return 1; }; . "$1" prepare', 'sh', shellPath(service)], env)
        : run([service, 'prepare'], { ...env, [failure]: '1' });
      assert.notEqual(result.status, 0, failure);
      assert.equal(fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), before);
      if (failure === 'FAIL_VALIDATE') {
        assert.match(result.stdout, /^F50_ERROR=original_config_invalid$/m);
        assert.match(result.stdout, /^F50_CONFIG_TEST_DETAIL=.*Parse config error: invalid DNS server/m);
        assert.match(result.stdout, /F50_CONFIG_TEST_DETAIL=\[URL_REDACTED\]/);
        assert.match(result.stdout, /F50_CONFIG_TEST_DETAIL=\[SENSITIVE_ERROR_REDACTED\]/);
        assert.ok(!/test-secret|test-password|test-uuid|test-private-key|https:\/\/example.com\/private/.test(result.stdout));
      }
    }
    write('Tools/config_source.conf', 'KANO_CONFIG_SOURCE=template.yaml\n');
    for (const action of ['prepare', 'start', 'restart']) {
      write('Proxy/config.yaml', `dns:\n  proxy-server-nameserver-policy:\n    cdn-hk.example.com: &airport_dns\n      - dns-hk.example.com:1066\n      - dns-jp.example.com:1066\n      - https://dns-jp.example.com/dns-query\n    cdn-jp.example.com: *airport_dns\n`);
      const result = run([service, action], env);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const templateRead = spawnSync(yq, ['-o=json', '.', path.join(root, 'Proxy/config.yaml')], { encoding: 'utf8' });
      assert.equal(templateRead.status, 0, templateRead.stderr);
      const config = JSON.parse(templateRead.stdout);
      assert.equal(config['log-level'], 'info');
      assert.equal(config.dns['enhanced-mode'], 'redir-host');
      assert.deepEqual(config.dns['proxy-server-nameserver-policy'], originalConfig.dns['proxy-server-nameserver-policy']);
      assert.match(fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), /^log-level: info$/m);
      if (action !== 'prepare') assert.equal(fs.readFileSync(path.join(root, 'reloaded.json'), 'utf8'),
        fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), 'core reload retains node DNS policies');
    }
    assert.ok(!fs.readdirSync(path.join(root, 'Proxy')).some((name) => name.includes('.original.')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
