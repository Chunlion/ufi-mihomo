'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.resolve(root, process.env.F50_PLUGIN || '猫猫TProxy.js'), 'utf8');
const yq = process.env.F50_TEST_YQ;
const quote = value => `'${String(value).replace(/'/g, `'"'"'`)}'`;
const plain = value => JSON.parse(JSON.stringify(value));
function slice(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing source: ${start}`);
  return source.slice(from, to);
}
const shared = slice('const F50_PORTS', 'let f50BackendReady');
const api = vm.runInNewContext(shared
  + slice('function buildF50NetworkCompatHelpers()', 'function buildF50InspectHelpers()')
  + slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later')
  + '\n({functions:buildF50OriginalConfigFunctions, patch:buildF50OriginalServicePatchScript, tun:buildF50Tun6CompatFunctions, runtime:createPrivateRouteLogic().runtime})', {
  F50_ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
  shellQuote: quote,
});
const helpers = api.functions().split('\numask 077\nF50_OPERATION_LOCK=')[0];

function shell(script, env = {}) {
  const result = spawnSync('sh', ['-s'], {
    input: script, encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, ...env },
  });
  assert.ifError(result.error);
  return result;
}
function write(dir, file, text) {
  const target = path.join(dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
  return target;
}
function read(file) {
  const result = spawnSync(yq, ['e', '--yaml-fix-merge-anchor-to-spec', '-o=json', '.', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-config-recovery-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  write(dir, 'Tools/yq_linux_arm64', `#!/bin/sh\nexec ${quote(yq)} "$@"\n`);
  // These tests isolate the generated recovery expression; corpus tests run the real Mihomo validator.
  write(dir, 'Proxy/Clash.Core', '#!/bin/sh\nexit 0\n');
  for (const file of ['Tools/yq_linux_arm64', 'Proxy/Clash.Core']) fs.chmodSync(path.join(dir, file), 0o755);
  return {
    dir,
    restore(original, runtime, sourceType, { action = 'restart', convertMode = 'local', beforeController = '' } = {}) {
      const configPath = write(dir, 'Proxy/config.yaml', typeof original === 'string' ? original : JSON.stringify(original));
      const sourceText = `KANO_CONFIG_SOURCE=${sourceType}\n`;
      write(dir, 'Tools/config_source.conf', sourceText);
      write(dir, 'Proxy/subscription_urls.txt', `# KANO_SUB_CONVERT_MODE=${convertMode}\n`);
      write(dir, 'runtime.json', JSON.stringify(runtime));
      const result = shell(helpers + `\nf50_save_original_config ${quote(action)} || exit 1\n${beforeController}
cp "$CLASH_ROOT/runtime.json" "$CLASH_ROOT/Proxy/config.yaml" || exit 1
f50_restore_original_config || exit 1
`, { CLASH_ROOT: dir });
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(fs.readFileSync(path.join(dir, 'Tools/config_source.conf'), 'utf8'), sourceText);
      assert.ok(!fs.readdirSync(path.join(dir, 'Proxy')).some(name => name.includes('.original.')));
      return read(configPath);
    },
  };
}
function userConfig() {
  return plain(api.runtime({
    secret: 'existing-fixture-secret',
    dns: {
      'nameserver-policy': {},
      'proxy-server-nameserver-policy': { '+.example.test': ['1.1.1.1', '9.9.9.9'] },
      'fake-ip-filter': [],
    },
    sniffer: { sniff: { HTTP: { ports: [8081] } } },
    profile: { 'store-selected': false, extension: {} },
    tun: { mtu: 9000, 'inet6-address': ['fdfe:1234::1/126'], 'auto-detect-interface': false },
    proxies: [{ name: 'Local', type: 'socks5', server: '127.0.0.1', port: 1080 }],
    'proxy-providers': { Custom: { type: 'http', url: 'https://example.test/sub', path: './custom.yaml',
      header: { 'User-Agent': ['fixture-agent'] }, override: { udp: false }, 'health-check': { enable: false } } },
    'rule-providers': { CustomRule: { type: 'inline', behavior: 'domain', payload: ['example.test'] } },
    'proxy-groups': [{ name: 'Proxy', type: 'select', use: ['Custom'], proxies: ['Local'] }],
    rules: ['RULE-SET,CustomRule,Proxy', 'MATCH,DIRECT'],
    'x-custom': { flag: false, text: '00123', empty: {}, list: [], none: null },
  }, { traffic_mode: 'tproxy', ipv6: 'off' }));
}
const controllerConfig = plain(api.runtime({
  'proxy-providers': { Custom: { type: 'file', path: './proxies/converted.yaml' } },
  'x-f50-provider-sources': { Custom: { url: 'https://example.test/sub', path: 'proxies/converted.yaml' } },
  proxies: [{ name: 'Generated', type: 'socks5', server: '127.0.0.1', port: 1081 }],
  'proxy-groups': [{ name: 'Generated', type: 'select', proxies: ['DIRECT'] }],
  'rule-providers': {}, rules: ['MATCH,Generated'],
}, { traffic_mode: 'tproxy', ipv6: 'off' }));

for (const sourceType of ['template.yaml', 'uploaded_config', 'subscription_original']) {
  test(`Service preserves complete unmanaged nested values / ${sourceType}`, { skip: !yq }, t => {
    const f = fixture(t), original = userConfig();
    const restored = f.restore(original, controllerConfig, sourceType);
    for (const key of ['dns', 'sniffer', 'profile', 'x-custom']) assert.deepEqual(restored[key], original[key], key);
    assert.equal(restored.tun.mtu, 9000);
    assert.deepEqual(restored.tun['inet6-address'], ['fdfe:1234::1/126']);
    assert.equal(restored.tun['auto-detect-interface'], false);
    assert.equal(restored.tun.enable, false);
    assert.deepEqual(f.restore(restored, controllerConfig, sourceType), restored, 'repeated recovery is idempotent');
    if (sourceType === 'template.yaml') {
      for (const key of ['proxies', 'proxy-groups', 'rules', 'rule-providers']) {
        assert.deepEqual(restored[key], controllerConfig[key], 'template generation owns ' + key);
      }
    }
    if (sourceType === 'subscription_original') {
      assert.deepEqual(restored['proxy-providers'], controllerConfig['proxy-providers'], 'legacy conversion retains current cache definitions');
    }
  });

  test(`Service preserves explicit null sniffer/profile / ${sourceType}`, { skip: !yq }, t => {
    const f = fixture(t), original = { ...userConfig(), sniffer: null, profile: null };
    const restored = f.restore(original, controllerConfig, sourceType);
    assert.equal(restored.sniffer, null);
    assert.equal(restored.profile, null);
    assert.deepEqual(f.restore(restored, controllerConfig, sourceType), restored);
  });
}

test('Service keeps prior managed-field metadata through template recovery', { skip: !yq }, t => {
  const f = fixture(t), original = { ...userConfig(), 'x-f50-overridden': ['dns.listen'] };
  const restored = f.restore(original, controllerConfig, 'template.yaml');
  assert.deepEqual(restored['x-f50-overridden'], ['dns.listen']);
  assert.deepEqual(f.restore(restored, controllerConfig, 'template.yaml'), restored);
});

test('Service restores explicit rule-provider proxy without replacing generated providers', { skip: !yq }, t => {
  const f = fixture(t), original = userConfig(), runtime = plain(controllerConfig);
  original['rule-providers'].CustomRule.proxy = 'Proxy';
  runtime['rule-providers'] = {
    CustomRule: { type: 'http', url: 'https://example.test/rules', proxy: 'DIRECT', interval: 900 },
    AddedRule: { type: 'inline', behavior: 'domain', payload: ['added.example.test'] },
  };
  const restored = f.restore(original, runtime, 'template.yaml');
  assert.deepEqual(restored['rule-providers'], {
    ...runtime['rule-providers'], CustomRule: { ...runtime['rule-providers'].CustomRule, proxy: 'Proxy' },
  });
  assert.deepEqual(f.restore(restored, runtime, 'template.yaml'), restored);
  delete runtime['rule-providers'];
  assert.ok(!Object.hasOwn(f.restore(original, runtime, 'template.yaml'), 'rule-providers'));
  runtime['rule-providers'] = null;
  assert.equal(f.restore(original, runtime, 'template.yaml')['rule-providers'], null);
});

test('Service still falls back from malformed sniffer/profile scalars', { skip: !yq }, t => {
  const f = fixture(t), original = { ...userConfig(), sniffer: 'invalid', profile: false };
  const restored = f.restore(original, controllerConfig, 'template.yaml');
  assert.deepEqual(restored.sniffer, controllerConfig.sniffer);
  assert.deepEqual(restored.profile, controllerConfig.profile);
});

for (const gist of [false, true]) {
  test(`Service preserves uploaded HTTP Provider identity and options / gist=${gist}`, { skip: !yq }, t => {
    const f = fixture(t), original = userConfig();
    if (gist) original['x-f50-gist-sync'] = true;
    for (const action of ['prepare', 'start', 'restart', 'boot']) {
      const restored = f.restore(original, controllerConfig, 'uploaded_config', { action });
      for (const key of ['proxies', 'proxy-providers', 'proxy-groups', 'rule-providers', 'rules']) {
        assert.deepEqual(restored[key], original[key], action + ': ' + key);
      }
      assert.equal(restored['x-f50-provider-sources'], undefined);
      assert.equal(restored['x-f50-gist-sync'], original['x-f50-gist-sync']);
    }
  });
}

test('Service reads a CRLF source marker with the same meaning as JS', { skip: !yq }, t => {
  const f = fixture(t), original = userConfig();
  const restored = f.restore(original, controllerConfig, 'uploaded_config\r');
  assert.deepEqual(restored['proxy-providers'], original['proxy-providers']);
});

test('Service retains a disabled default port when a real template uses mixed-port 7890', { skip: !yq }, t => {
  const f = fixture(t);
  const original = plain(api.runtime({ 'mixed-port': 7890, rules: ['MATCH,DIRECT'] }, { traffic_mode: 'tproxy', ipv6: 'off' }));
  assert.equal(original.port, 0);
  const restored = f.restore(original, controllerConfig, 'template.yaml');
  assert.equal(restored.port, 0);
  assert.equal(restored['mixed-port'], 7890);
  assert.doesNotThrow(() => api.runtime(restored, { traffic_mode: 'tproxy', ipv6: 'off' }));
});

const mergeConfig = `x-base: &base
  value: merged
  kept: [null, {}, [], "false", false, "00123", 7]
x-policy: &policy
  +.example.test: [9.9.9.9]
x-custom:
  value: explicit
  <<: *base
dns:
  nameserver: [1.1.1.1]
  nameserver-policy:
    +.example.test: [1.1.1.1]
    <<: *policy
proxies: []
proxy-groups: []
rules: ["MATCH,DIRECT"]
`;
test('Service expands aliases before merging and applies YAML merge precedence', { skip: !yq }, t => {
  const f = fixture(t);
  const restored = f.restore(mergeConfig, controllerConfig, 'template.yaml');
  assert.equal(restored['x-custom'].value, 'explicit');
  assert.deepEqual(restored['x-custom'].kept, [null, {}, [], 'false', false, '00123', 7]);
  assert.deepEqual(restored.dns['nameserver-policy'], { '+.example.test': ['1.1.1.1'] });
});

test('Service presents raw merge-key YAML to the Controller as an unambiguous mapping', { skip: !yq }, t => {
  const f = fixture(t);
  f.restore(mergeConfig, controllerConfig, 'uploaded_config', {
    beforeController: '"$CLASH_ROOT/Tools/yq_linux_arm64" e -o=json "." "$CLASH_ROOT/Proxy/config.yaml" > "$CLASH_ROOT/controller-input.json" || exit 1',
  });
  const input = JSON.parse(fs.readFileSync(path.join(f.dir, 'controller-input.json'), 'utf8'));
  assert.equal(input['x-custom'].value, 'explicit');
  assert.deepEqual(input.dns['nameserver-policy'], { '+.example.test': ['1.1.1.1'] });
});

for (const failure of ['normalization', 'controller', 'core validation']) {
  test(`Service restores the original bytes after ${failure} failure`, { skip: !yq }, t => {
    const f = fixture(t);
    const original = failure === 'normalization' ? '# duplicate keys\nmode: rule\nmode: global\n' : '# original formatting\n' + mergeConfig;
    const target = write(f.dir, 'Proxy/config.yaml', original);
    write(f.dir, 'Tools/config_source.conf', 'KANO_CONFIG_SOURCE=uploaded_config\n');
    if (failure === 'core validation') write(f.dir, 'Proxy/Clash.Core', '#!/bin/sh\nexit 1\n');
    const result = shell(helpers + '\nf50_save_original_config restart || exit 1\n'
      + (failure === 'controller' ? 'exit 17\n' : 'f50_restore_original_config || exit 1\n'), { CLASH_ROOT: f.dir });
    assert.notEqual(result.status, 0);
    assert.equal(fs.readFileSync(target, 'utf8'), original);
    assert.ok(!fs.readdirSync(path.join(f.dir, 'Proxy')).some(name => name.includes('.original.')));
    assert.equal(fs.readFileSync(path.join(f.dir, 'Tools/config_source.conf'), 'utf8'), 'KANO_CONFIG_SOURCE=uploaded_config\n');
  });
}

for (const oldSecret of ['', null, 'kept-secret']) {
  test(`Service retains a nonempty secret and supplies the default otherwise / ${JSON.stringify(oldSecret)}`, { skip: !yq }, t => {
    const f = fixture(t), original = { ...userConfig(), secret: oldSecret };
    const restored = f.restore(original, controllerConfig, 'uploaded_config');
    assert.equal(restored.secret, oldSecret || '123456');
  });
}

for (const [oldSecret, incoming, expected] of [
  ['kept-secret', 'incoming-secret', 'kept-secret'],
  ['', 'incoming-secret', 'incoming-secret'],
  [null, 'incoming-secret', 'incoming-secret'],
  ['', '', '123456'],
]) test(`YAML commit preserves the first available nonempty secret / ${JSON.stringify(oldSecret)}, ${JSON.stringify(incoming)}`, { skip: !yq }, async t => {
  const f = fixture(t);
  const target = write(f.dir, 'Proxy/config.yaml', JSON.stringify({ secret: oldSecret }));
  const stage = write(f.dir, 'Proxy/stage.yaml', JSON.stringify({ secret: incoming, rules: ['MATCH,DIRECT'] }));
  const commit = vm.runInNewContext(shared
    + slice('const commitStagedYaml =', 'const kprBaseWriteYamlObjectAtomic =')
    + '\ncommitStagedYaml', {
    F50_ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
    shellQuote: quote, CLASH_DIR: f.dir, CLASH_CONFIG: target,
    CLASH_CONFIG_SOURCE_FILE: path.join(f.dir, 'Tools/config_source.conf'),
    prepareYqRuntimeCmd: () => '', yqExecutableCheckCmd: () => '[ -x "$YQ" ] || exit 1',
    invalidateStatusSnapshot() {},
    runShellWithRoot: async script => {
      const result = shell(script);
      return { success: result.status === 0, content: result.stdout + result.stderr };
    },
  });
  const result = await commit({ targetPath: target, stagePath: stage, configSource: 'uploaded_config', backup: false });
  assert.equal(result.ok, true, result.content);
  assert.equal(read(target).secret, expected);
});

test('Service migrates a version 22 marker and a second application is unchanged', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-service-migrate-'));
  try {
    const archive = spawnSync('tar', ['-xOf', path.join(root, 'tproxy-yq.zip'), 'Scripts/Clash.Service'], { encoding: 'utf8' });
    assert.equal(archive.status, 0, archive.stderr);
    const previous = archive.stdout.replace(/^# KANO_ORIGINAL_CONFIG_PRESERVATION=\d+$/m, '# KANO_ORIGINAL_CONFIG_PRESERVATION=22');
    const file = write(dir, 'Clash.Service', previous);
    const result = shell(api.patch(quote(file)));
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const migrated = fs.readFileSync(file, 'utf8');
    assert.ok(migrated.includes(api.functions()), 'one complete current helper replaces the old block');
    assert.equal((migrated.match(/^# KANO_ORIGINAL_CONFIG_PRESERVATION=/gm) || []).length, 1);
    assert.doesNotMatch(migrated, /^# KANO_ORIGINAL_CONFIG_PRESERVATION=22$/m);
    const again = shell(api.patch(quote(file)));
    assert.equal(again.status, 0, again.stdout + again.stderr);
    assert.equal(fs.readFileSync(file, 'utf8'), migrated);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// real_templates.test.js creates these offline projections with F50_TEMPLATE_CORE_INPUTS.
// Only the Controller's prepare command and the Service's configuration helpers run;
// no core start, policy apply, routing operation, or external resource access is needed.
const controller = process.env.F50_TEST_CONTROLLER;
const qemu = process.env.F50_TEST_QEMU;
const mihomo = process.env.F50_TEST_MIHOMO;
const noNetwork = process.env.F50_TEST_NO_NETWORK;
const coreInputs = process.env.F50_TEMPLATE_CORE_INPUTS;
const actualControllerReady = yq && controller && qemu && mihomo && noNetwork && coreInputs;
for (const input of ['merge keys', 'Kerronex flow mappings']) test(`committed ${input} remain readable by the actual Controller snapshot`, {
  skip: !yq || !controller || !qemu || input !== 'merge keys' && !process.env.F50_TEMPLATE_REPO,
}, async t => {
  const f = fixture(t);
  const target = write(f.dir, 'Proxy/config.yaml', 'secret: existing-secret\nproxies: []\n');
  const text = input === 'merge keys' ? `external-controller: "127.0.0.1:9090"
secret: incoming-secret
proxies: []
x-review:
  base: &review
    enabled: false
    values: [0, false, null]
  merged:
    <<: *review
    nested: {keep: true}
` : fs.readFileSync(path.join(process.env.F50_TEMPLATE_REPO, 'THEYAMLS/General_Config/Kerronex/config.yaml'), 'utf8');
  const stage = write(f.dir, 'Proxy/stage.yaml', text);
  const expected = read(stage);
  expected.secret = 'existing-secret';
  const commit = vm.runInNewContext(shared
    + slice('const commitStagedYaml =', 'const kprBaseWriteYamlObjectAtomic =')
    + '\ncommitStagedYaml', {
    F50_ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
    shellQuote: quote, CLASH_DIR: f.dir, CLASH_CONFIG: target,
    CLASH_CONFIG_SOURCE_FILE: path.join(f.dir, 'Tools/config_source.conf'),
    prepareYqRuntimeCmd: () => '', yqExecutableCheckCmd: () => '[ -x "$YQ" ] || exit 1',
    invalidateStatusSnapshot() {},
    runShellWithRoot: async script => {
      const result = shell(script);
      return { success: result.status === 0, content: result.stdout + result.stderr };
    },
  });
  const result = await commit({ targetPath: target, stagePath: stage, configSource: 'uploaded_config', backup: false });
  assert.equal(result.ok, true, result.content);
  assert.deepEqual(read(target), expected);
  const snapshot = spawnSync(qemu, [controller, 'snapshot'], {
    env: { ...process.env, CLASH_ROOT: f.dir }, encoding: 'utf8', timeout: 30000,
  });
  assert.equal(snapshot.status, 0, snapshot.stdout + snapshot.stderr);
  const line = snapshot.stdout.split('\n').find(line => line.startsWith('F50_SNAPSHOT='));
  assert.ok(line, snapshot.stdout);
  const data = JSON.parse(line.slice('F50_SNAPSHOT='.length));
  assert.equal(data.configReadStatus, 'present', data.configError);
  assert.equal(data.secret, 'existing-secret');
});
for (const sample of [
  'THEYAMLS/Official_Examples/Metacubex/rule-set_config',
  'THEYAMLS/General_Config/HenryChiao/MihomoAIO',
]) for (const variant of ['template.yaml', 'uploaded_config', 'subscription_original', 'gist']) {
  test(`actual ARM64 Controller and Service preserve real configuration / ${sample} / ${variant}`, { skip: !actualControllerReady }, t => {
    const f = fixture(t), sampleDir = path.join(coreInputs, sample);
    for (const name of fs.readdirSync(sampleDir).filter(name => name !== 'processed')) {
      fs.cpSync(path.join(sampleDir, name), path.join(f.dir, 'Proxy', name), { recursive: true, verbatimSymlinks: true });
    }
    write(f.dir, 'Proxy/Clash.Core', `#!/bin/sh\nexec ${quote(noNetwork)} ${quote(mihomo)} "$@"\n`);
    const sourceType = variant === 'gist' ? 'uploaded_config' : variant;
    const preserveConfig = sourceType === 'subscription_original';
    const sourceText = `KANO_CONFIG_SOURCE=${sourceType}\n`;
    write(f.dir, 'Tools/config_source.conf', sourceText);
    write(f.dir, 'Proxy/subscription_urls.txt', '# KANO_SUB_CONVERT_MODE=local\n');
    let current = JSON.parse(fs.readFileSync(path.join(sampleDir, 'config.json'), 'utf8'));
    current.secret = 'existing-controller-fixture-secret';
    if (sample.endsWith('/MihomoAIO')) Object.assign(current.tun, {
      mtu: 9000, 'inet6-address': ['fdfe:1234::1/126'], 'auto-detect-interface': false,
    });
    const [providerName, provider] = Object.entries(current['proxy-providers']).find(([, value]) => value.type === 'file');
    const providerCache = path.join(f.dir, 'Proxy', provider.path);
    const responseFile = path.join(f.dir, 'provider-response.yaml');
    const restoreHttp = sourceType === 'uploaded_config';
    if (restoreHttp) {
      provider.type = 'http';
      // The Controller resolves HTTP sources even with a fresh cache. Its transport
      // receives this existing fixture via a local curl stub, under the network guard.
      provider.url = 'https://8.8.8.8/f50-offline-provider-fixture';
      provider.header = { ...provider.header, 'User-Agent': ['f50-offline-fixture'] };
      write(f.dir, 'bin/curl', `#!/bin/sh
while [ "$#" -gt 0 ]; do
  if [ "$1" = -D ]; then shift; printf 'HTTP/1.1 200 OK\\r\\nContent-Type: text/yaml\\r\\n\\r\\n' > "$1"; fi
  shift
done
cat ${quote(responseFile)}
printf '\\n200'
`);
      fs.chmodSync(path.join(f.dir, 'bin/curl'), 0o755);
    }
    if (variant === 'gist') current['x-f50-gist-sync'] = true;
    for (let index = 0; index < 100; index++) current['x-controller-field-' + index] = {
      index, nested: { keep: [null, false, '001', '中文:#', { empty: {}, array: [] }] },
    };
    const modes = sourceType === 'template.yaml'
      ? [['tproxy', 'off'], ['tun', 'on'], ['off', 'off'], ['tproxy', 'on'], ['tun', 'off'], ['off', 'on']]
      : [['tun', 'on'], ['off', 'off']];
    for (const [traffic_mode, ipv6] of modes) {
      const options = { traffic_mode, ipv6, tun_stack: ipv6 === 'on' ? 'gvisor' : 'mixed' };
      const shaped = plain(api.runtime(current, options, [], preserveConfig));
      write(f.dir, 'Proxy/config.yaml', JSON.stringify(shaped));
      write(f.dir, 'Tools/template.yaml', JSON.stringify(shaped));
      write(f.dir, 'Policy/options.conf', `traffic_mode=${traffic_mode}\ntransparent=${traffic_mode === 'off' ? 'off' : 'on'}\nipv6=${ipv6}\ntun_stack=${options.tun_stack}\ndns_hijack=off\ntproxy_port=7895\ndns_port=1053\n`);
      for (let cycle = 0; cycle < 2; cycle++) {
        const stage = `${traffic_mode}/${ipv6}/${cycle}`;
        const payload = read(providerCache);
        payload.proxies[0].port = cycle === 0 ? 9 : 10;
        fs.writeFileSync(providerCache, JSON.stringify(payload));
        fs.writeFileSync(responseFile, JSON.stringify(payload));
        const result = shell(helpers + '\n' + api.tun() + `
f50_check_tun_stack restart || exit 1
f50_save_original_config restart || exit 1
${quote(noNetwork)} ${quote(qemu)} ${quote(controller)} prepare || exit 1
cp "$CLASH_ROOT/Proxy/config.yaml" "$CLASH_ROOT/controller.yaml" || exit 1
f50_restore_original_config || exit 1
f50_prepare_tun_stack restart || exit 1
`, { CLASH_ROOT: f.dir, PATH: path.join(f.dir, 'bin') + path.delimiter + process.env.PATH });
        assert.equal(result.status, 0, stage + ': ' + result.stdout + result.stderr);
        if (restoreHttp) {
          const converted = read(path.join(f.dir, 'controller.yaml'))['proxy-providers'][providerName];
          assert.equal(converted.type, 'file', stage + ': Controller actually converts the HTTP source');
          assert.equal(converted.url, undefined);
          assert.equal(read(path.join(f.dir, 'Proxy', converted.path)).proxies[0].port, payload.proxies[0].port,
            stage + ': updated local subscription payload reaches the Controller cache');
        }
        current = read(path.join(f.dir, 'Proxy/config.yaml'));
        assert.deepEqual(current, shaped, stage + ': all root fields, nested values, array contents and order');
        for (const key of ['nameserver-policy', 'proxy-server-nameserver-policy']) {
          assert.deepEqual(Object.keys(current.dns[key] || {}), Object.keys(shaped.dns[key] || {}), stage + ': DNS policy order / ' + key);
        }
        const repeated = plain(api.runtime(current, options, [], preserveConfig));
        const recurring = !preserveConfig && current['mixed-port'] === 7890 && current.port === 0
          ? ['port 与已指定的监听端口冲突，已关闭'] : undefined;
        assert.deepEqual(repeated['x-f50-overridden'], recurring, stage + ': stale corrections are cleared');
        const effective = plain(current);
        delete effective['x-f50-overridden'];
        delete repeated['x-f50-overridden'];
        assert.deepEqual(repeated, effective, stage + ': all effective fields remain idempotent');
        assert.equal(fs.readFileSync(path.join(f.dir, 'Tools/config_source.conf'), 'utf8'), sourceText);
        assert.ok(!fs.readdirSync(path.join(f.dir, 'Proxy')).some(name => name.includes('.original.')));
      }
    }
  });
}
