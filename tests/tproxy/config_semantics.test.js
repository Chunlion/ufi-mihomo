'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const source = fs.readFileSync(path.resolve(__dirname, '../..', process.env.F50_PLUGIN || '猫猫TProxy.js'), 'utf8');
function slice(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} -> ${end}`);
  return source.slice(from, to);
}
const plain = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const api = vm.runInNewContext(
  slice('const F50_ZASHBOARD_UI_URL', 'function buildF50EmergencyScript')
  + slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later')
  + slice('const yamlScalar =', '// yq is an advanced-feature dependency')
  + slice('const providerNameFor', 'const readConfigSource')
  + slice('const buildManagedProxyProviders', 'const buildF50TemplateObject')
  + '\n({ runtime:createPrivateRouteLogic().runtime, merge:f50DeepMerge, profiles:F50_FIXED_PROFILES, normalize:normalizeManagedTemplateObject, dump:dumpConfigYaml })', {
    ZASHBOARD_UI_DIR: 'WebUI/zashboard', ZASHBOARD_UI_URL: 'https://example.test/dashboard.zip',
    currentProviderUserAgent: 'test-agent', isHttpUrl: value => /^https?:\/\//.test(value),
    CLASH_SAFE_REJECT_DOMAIN_FILE: '/policy/reject', CLASH_SAFE_DIRECT_DOMAIN_FILE: '/policy/direct-domain',
    CLASH_SAFE_DIRECT_IP_FILE: '/policy/direct-ip', CLASH_SAFE_PROXY_DOMAIN_FILE: '/policy/proxy',
  });
const base = () => ({ proxies: [], 'proxy-groups': [{ name: 'Choose', type: 'select', proxies: ['DIRECT'] }], rules: ['MATCH,Choose'] });
const sources = [{ url: 'https://one.example.test/sub' }, { url: 'https://two.example.test/sub' }];

function yamlBridge(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-yaml-semantics-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const quote = value => `'${String(value).replace(/'/g, `'"'"'`)}'`;
  fs.mkdirSync(path.join(dir, 'Tools'));
  fs.writeFileSync(path.join(dir, 'Tools/yq_linux_arm64'), `#!/bin/sh\nexec ${quote(process.env.F50_TEST_YQ)} "$@"\n`, { mode: 0o755 });
  const read = vm.runInNewContext(
    slice('const F50_ZASHBOARD_UI_URL', 'function buildF50EmergencyScript')
    + slice('function f50AssertSafeJsonNumbers', 'function f50HealthLayers')
    + slice('function buildF50RedactFunction()', 'function buildF50PanelConfigCheck()')
    + slice('function buildF50ShellBase()', 'function buildF50ProcessHelpers(')
    + slice('const yamlScalar =', '// yq is an advanced-feature dependency')
    + slice('const yqExecutableCheckCmd', 'const yamlHasGeneratedMarker')
    + '\nreadYamlObject', {
      CLASH_DIR: dir, shellQuote: quote, prepareYqRuntimeCmd: () => `KANO_YQ_TMP=${quote(dir)}`,
      runShellWithRoot: async script => {
        const result = spawnSync('sh', ['-s'], { input: script, encoding: 'utf8', timeout: 30000 });
        assert.ifError(result.error);
        return { success: result.status === 0, content: result.stdout + result.stderr };
      },
    });
  return async (input, options = {}) => {
    const file = path.join(dir, 'input.yaml');
    fs.writeFileSync(file, input);
    return plain(await read(file, 'fixture', options));
  };
}

test('deep merge replaces arrays, retains explicit null and special keys, and does not share mutable values', () => {
  const first = JSON.parse('{"__proto__":{"custom":true},"dns":{"nameserver":["1.1.1.1"],"nested":{"before":1}},"empty":{}}');
  const second = { dns: { nameserver: [], nested: { after: null } }, empty: null };
  const merged = api.merge(first, second);
  assert.deepEqual(plain(merged), JSON.parse('{"__proto__":{"custom":true},"dns":{"nameserver":[],"nested":{"before":1,"after":null}},"empty":null}'));
  merged.dns.nameserver.push('8.8.8.8');
  merged.dns.nested.before = 2;
  assert.deepEqual(first.dns.nameserver, ['1.1.1.1']);
  assert.equal(first.dns.nested.before, 1);
  assert.deepEqual(second.dns.nameserver, []);
  const profiles = plain(api.profiles);
  api.runtime(base(), { traffic_mode: 'tun' }).dns.nameserver.push('fixture');
  assert.deepEqual(plain(api.profiles), profiles);
});

test('runtime retains unknown __proto__ fields at the root and inside merged mapping fields', () => {
  const config = { ...base(), ['__proto__']: { future: 'root' },
    ...Object.fromEntries(['dns', 'sniffer', 'profile'].map(field => [field, { ['__proto__']: { future: field } }])) };
  const result = plain(api.runtime(config));
  assert.deepEqual(result.__proto__, { future: 'root' });
  for (const field of ['dns', 'sniffer', 'profile']) assert.deepEqual(result[field].__proto__, { future: field });
  assert.equal({}.future, undefined);
});

for (const preserve of [false, true]) {
  test(`user TUN fields survive every traffic mode / legacy=${preserve}`, () => {
    const tun = { mtu: 1400, 'auto-detect-interface': false, 'inet6-address': ['fd00:1234::1/126'], 'future-option': { values: [], nullable: null } };
    let config = { ...base(), tun };
    for (const traffic_mode of ['tproxy', 'tun', 'off', 'tun', 'tproxy']) {
      config = api.runtime(config, { traffic_mode, ipv6: 'on' }, [], preserve);
      for (const [key, value] of Object.entries(tun)) assert.deepEqual(plain(config.tun[key]), value, `${traffic_mode}: tun.${key}`);
      assert.equal(config.tun.enable, traffic_mode === 'tun');
      assert.equal(config['tproxy-port'], traffic_mode === 'tproxy' ? 7895 : 0);
    }
  });
}

test('runtime preserves a user rule-provider download proxy and only supplies the missing default', () => {
  const config = { ...base(), 'rule-providers': {
    specified: { type: 'http', behavior: 'domain', url: 'https://rules.example.test/a', proxy: 'Choose' },
    omitted: { type: 'http', behavior: 'domain', url: 'https://rules.example.test/b' },
  } };
  const result = api.runtime(config);
  assert.equal(result['rule-providers'].specified.proxy, 'Choose');
  assert.equal(result['rule-providers'].omitted.proxy, 'DIRECT');
});

test('a valid custom listener does not conflict with an automatically supplied default listener', () => {
  for (const [custom, port, implicit] of [['mixed-port', 7890, 'port'], ['port', 7891, 'socks-port'], ['socks-port', 7892, 'mixed-port']]) {
    const result = api.runtime({ ...base(), [custom]: port });
    assert.equal(result[custom], port);
    assert.equal(result[implicit], 0);
    assert.equal(result['tproxy-port'], 7895);
    assert.deepEqual(plain(api.runtime(result)), plain(result));
  }
  assert.throws(() => api.runtime({ ...base(), port: 7890, 'mixed-port': 7890 }), /重复/);
  assert.throws(() => api.runtime({ ...base(), port: 7895 }), /冲突/);
});

test('repeated runtime shaping is idempotent including the recorded managed-field corrections', () => {
  const config = { ...base(), 'bind-address': '127.0.0.1', dns: { listen: '127.0.0.1:53' }, tun: { enable: true, device: 'SourceTun' }, 'x-future': { values: [null, false, 'yes', '001'], empty: {} } };
  const options = { traffic_mode: 'tproxy', ipv6: 'off' };
  const once = plain(api.runtime(config, options));
  assert.ok(once['x-f50-overridden'].length);
  // 标记描述的是"本次纠正了什么"，第二次整形已无纠正项，不能拿它参与幂等比较，但其余字段必须一致。
  const withoutMarker = (value) => { const copy = { ...value }; delete copy['x-f50-overridden']; return copy; };
  let next = once;
  for (let count = 0; count < 3; count++) {
    next = plain(api.runtime(next, options));
    assert.deepEqual(withoutMarker(next), withoutMarker(once));
    assert.equal(Object.hasOwn(next, 'x-f50-overridden'), false);
  }
});

for (const field of ['dns', 'tun', 'sniffer', 'profile']) {
  test(`invalid ${field} types are not silently replaced by defaults`, () => {
    for (const value of [false, 'invalid', [1]]) {
      assert.throws(() => api.runtime({ ...base(), [field]: value }), new RegExp(field));
    }
  });
}

test('template binding retains provider custom fields and named group subsets', () => {
  const one = { type: 'http', url: sources[0].url, path: './custom/one.yaml', interval: 3600,
    'health-check': { enable: false, url: 'https://check.example.test/204', interval: 123 },
    override: { 'additional-prefix': '[One] ', udp: false }, filter: '香港', 'exclude-filter': '过期',
    header: { 'X-Custom': ['kept'] }, 'future-provider': { enabled: false, sequence: ['yes', null] } };
  const two = { type: 'http', url: sources[1].url, path: './custom/two.yaml', override: { 'additional-prefix': '[Two] ' } };
  const raw = { ...base(), 'proxy-providers': { First: one, Second: two }, 'proxy-groups': [
    { name: 'Choose', type: 'select', use: ['Second', 'First'], proxies: ['DIRECT'] },
    { name: 'OnlySecond', type: 'select', use: ['Second'], filter: '香港' },
    { name: 'Explicit', type: 'select', proxies: ['DIRECT'], filter: 'DIRECT' },
    { name: 'All', type: 'select', 'include-all-providers': true, filter: '香港' },
  ] };
  const first = plain(api.normalize(raw, sources, { emptyProviderUrls: false }).config);
  const actual = first['proxy-providers'].Provider1;
  for (const field of ['interval', 'health-check', 'override', 'filter', 'exclude-filter', 'future-provider']) assert.deepEqual(actual[field], one[field], field);
  assert.deepEqual(actual.header['X-Custom'], ['kept']);
  assert.equal(actual.type, 'http');
  assert.equal(actual.path, './proxies/Provider1.yaml');
  assert.equal(actual.url, sources[0].url);
  assert.deepEqual(first['proxy-groups'][0].use, ['Provider2', 'Provider1']);
  assert.deepEqual(first['proxy-groups'][1].use, ['Provider2']);
  assert.equal(Object.hasOwn(first['proxy-groups'][2], 'use'), false);
  assert.equal(Object.hasOwn(first['proxy-groups'][3], 'use'), false);
  assert.deepEqual(plain(api.normalize(first, sources, { emptyProviderUrls: false }).config), first);
  assert.deepEqual(raw['proxy-providers'].First, one);
});

test('template binding preserves manual file and inline providers and their use references', () => {
  const manual = { Local: { type: 'file', path: './local.yaml', filter: 'keep' },
    Standalone: { type: 'file', path: './proxies/Provider99.yaml' },
    Inline: { type: 'inline', payload: [{ name: 'test', type: 'socks5', server: '127.0.0.1', port: 1080 }], 'future-key': null } };
  const raw = { ...base(), 'proxy-providers': { ...manual, Remote: { type: 'http', url: sources[0].url } },
    'proxy-groups': [{ name: 'Choose', type: 'select', use: ['Local', 'Remote', 'Inline', 'Standalone'] }] };
  const result = plain(api.normalize(raw, sources.slice(0, 1), { emptyProviderUrls: false }).config);
  for (const [name, value] of Object.entries(manual)) assert.deepEqual(result['proxy-providers'][name], value);
  assert.deepEqual(result['proxy-groups'][0].use, ['Local', 'Provider1', 'Inline', 'Standalone']);
});

test('removing a subscription does not bind its custom provider fields to another remaining source', () => {
  const raw = { ...base(), 'proxy-providers': {
    First: { type: 'http', url: sources[0].url, override: { 'additional-prefix': 'first' } },
    Second: { type: 'http', url: sources[1].url, override: { 'additional-prefix': 'second' } },
  }, 'proxy-groups': [{ name: 'Choose', type: 'select', use: ['Second'], proxies: ['DIRECT'] }] };
  const result = plain(api.normalize(raw, sources.slice(1), { emptyProviderUrls: false }).config);
  assert.deepEqual(Object.keys(result['proxy-providers']), ['Provider1']);
  assert.equal(result['proxy-providers'].Provider1.url, sources[1].url);
  assert.equal(result['proxy-providers'].Provider1.override['additional-prefix'], 'second');
  assert.deepEqual(result['proxy-groups'][0].use, ['Provider1']);
});

for (const local of [false, true]) {
  test(`providers sharing a URL retain separate overrides through template, runtime and repeated normalization / local=${local}`, () => {
    const raw = { ...base(), 'proxy-providers': {
      First: { type: 'http', url: sources[0].url, path: './custom/first.yaml', override: { 'additional-prefix': '[First] ' } },
      Alias: { type: 'http', url: sources[0].url, path: './custom/alias.yaml', override: { 'additional-prefix': '[Alias] ' }, filter: '香港' },
      Other: { type: 'http', url: sources[1].url, path: './custom/other.yaml', override: { 'additional-prefix': '[Other] ' } },
      Manual: { type: 'file', path: './custom/manual.yaml' },
    }, 'proxy-groups': [{ name: 'Choose', type: 'select', use: ['Alias', 'First', 'Other'], proxies: ['DIRECT'] }] };
    const template = plain(api.normalize(raw, [sources[0], sources[0], sources[1]]).config);
    assert.equal(template['proxy-providers'].Provider1.override['additional-prefix'], '[First] ');
    assert.deepEqual(template['proxy-providers'].Alias, raw['proxy-providers'].Alias);
    const result = plain(api.normalize(template, sources, { emptyProviderUrls: false, localProviderFiles: local }).config);
    assert.equal(result['proxy-providers'].Provider1.override['additional-prefix'], '[First] ');
    assert.equal(result['proxy-providers'].Alias.override['additional-prefix'], '[Alias] ');
    assert.equal(result['proxy-providers'].Alias.filter, '香港');
    assert.equal(result['proxy-providers'].Alias.type, local ? 'file' : 'http');
    if (local) {
      assert.equal(result['proxy-providers'].Alias.path, './proxies/Provider1.yaml');
      assert.equal(Object.hasOwn(result['proxy-providers'].Alias, 'url'), false);
    } else assert.deepEqual(result['proxy-providers'].Alias, raw['proxy-providers'].Alias);
    assert.deepEqual(result['proxy-groups'][0].use, ['Alias', 'Provider1', 'Provider2']);
    assert.deepEqual(plain(api.normalize(result, sources, { emptyProviderUrls: false, localProviderFiles: local }).config), result);
    const removed = plain(api.normalize(raw, sources.slice(1), { emptyProviderUrls: false, localProviderFiles: local }).config);
    assert.equal(Object.hasOwn(removed['proxy-providers'], 'Alias'), false);
    assert.equal(removed['proxy-providers'].Provider1.override['additional-prefix'], '[Other] ');
    assert.deepEqual(removed['proxy-providers'].Manual, raw['proxy-providers'].Manual);
    assert.deepEqual(removed['proxy-groups'][0].use, ['Provider1']);
    const empty = plain(api.normalize(result, [], { emptyProviderUrls: false, localProviderFiles: local }).config);
    assert.deepEqual(empty['proxy-providers'], { Manual: raw['proxy-providers'].Manual });
    assert.deepEqual(empty['proxy-groups'][0].use, []);
  });
}

test('existing duplicate use references retain their order and multiplicity', () => {
  const raw = { ...base(), 'proxy-providers': { Provider1: { type: 'http', url: sources[0].url } },
    'proxy-groups': [{ name: 'Choose', type: 'select', use: ['Provider1', 'Provider1'], proxies: ['DIRECT'] }] };
  const result = api.normalize(raw, sources.slice(0, 1), { emptyProviderUrls: false }).config;
  assert.deepEqual(plain(result['proxy-groups'][0].use), raw['proxy-groups'][0].use);
});

for (const local of [false, true]) {
  test(`a duplicate-URL alias colliding with a renumbered managed source keeps its definition and references / local=${local}`, () => {
    const raw = { ...base(), 'proxy-providers': {
      Provider1: { type: 'http', url: sources[0].url, override: { 'additional-prefix': 'first' } },
      Provider2: { type: 'http', url: sources[0].url, override: { 'additional-prefix': 'alias' } },
      Provider3: { type: 'http', url: sources[1].url, override: { 'additional-prefix': 'other' } },
    }, 'proxy-groups': [{ name: 'Choose', type: 'select', use: ['Provider1', 'Provider2', 'Provider3'] }] };
    const result = plain(api.normalize(raw, sources, { emptyProviderUrls: false, localProviderFiles: local }).config);
    assert.equal(result['proxy-providers'].Provider1.override['additional-prefix'], 'first');
    assert.equal(result['proxy-providers'].Provider2.override['additional-prefix'], 'other');
    assert.equal(result['proxy-providers'].Provider2_alias.override['additional-prefix'], 'alias');
    assert.deepEqual(result['proxy-groups'][0].use, ['Provider1', 'Provider2_alias', 'Provider2']);
    assert.deepEqual(plain(api.normalize(result, sources, { emptyProviderUrls: false, localProviderFiles: local }).config), result);
  });
}

test('manual provider names colliding with managed names are remapped without overwriting another existing alias', () => {
  const manual = { Provider1: { type: 'file', path: './manual.yaml', 'future-field': null },
    Provider1_alias: { type: 'inline', payload: [{ name: 'test', type: 'socks5', server: '127.0.0.1', port: 1080 }] } };
  const raw = { ...base(), 'proxy-providers': { ...manual, Remote: { type: 'http', url: sources[0].url } },
    'proxy-groups': [{ name: 'Choose', type: 'select', use: ['Provider1', 'Provider1_alias', 'Remote'] }] };
  const result = plain(api.normalize(raw, sources.slice(0, 1), { emptyProviderUrls: false }).config);
  assert.deepEqual(result['proxy-providers'].Provider1_alias_alias, manual.Provider1);
  assert.deepEqual(result['proxy-providers'].Provider1_alias, manual.Provider1_alias);
  assert.equal(result['proxy-providers'].Provider1.url, sources[0].url);
  assert.deepEqual(result['proxy-groups'][0].use, ['Provider1_alias_alias', 'Provider1_alias', 'Provider1']);
  assert.deepEqual(plain(api.normalize(result, sources.slice(0, 1), { emptyProviderUrls: false }).config), result);
});

test('group names retain significant whitespace together with their references', () => {
  const raw = { ...base(), 'proxy-groups': [
    { name: 'Choose', type: 'select', proxies: ['Divider  ', 'DIRECT'] },
    { name: 'Divider  ', type: 'select', proxies: ['DIRECT'] },
  ] };
  const result = api.normalize(raw, []).config;
  assert.deepEqual(plain(result['proxy-groups']), raw['proxy-groups']);
  assert.deepEqual(plain(api.runtime(result)['proxy-groups']), raw['proxy-groups']);
});

test('null proxies remains a valid empty list in template and runtime processing', () => {
  const raw = { ...base(), proxies: null };
  const normalized = api.normalize(raw, []).config;
  assert.equal(normalized.proxies, null);
  for (const legacy of [false, true]) assert.equal(api.runtime(normalized, {}, [], legacy).proxies, null);
});

test('YAML serialization retains Unicode line separators in scalar values and keys', { skip: !process.env.F50_TEST_YQ }, () => {
  const config = { ...base(), ['x-line\u0085break']: 'NEL:\u0085 LS:\u2028 PS:\u2029', 'x-strings': ['yes', '001', 'null', 'https://example.test:443/a#tag', '\u2028'] };
  const result = spawnSync(process.env.F50_TEST_YQ, ['e', '-o=json', '.', '-'], { input: api.dump(config), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), config);
});

test('actual YAML bridge preserves merge precedence, aliases, flow collections and scalar types', { skip: !process.env.F50_TEST_YQ }, async t => {
  const read = yamlBridge(t);
  const result = await read(`# F50 mihomo template - generated by Kano policy tools
left: &left {shared: left, empty: [], object: {}, nullable: null}
right: &right {shared: right, extra: true}
merged: {shared: explicit, <<: [*left, *right]}
inherited: {<<: [*left, *right]}
alias: *left
values: [yes, no, on, off, null, "null", "001", false, 0o10, 1.25]
url: "https://example.test:443/dns-query#RULES"
regex: '(?i)香港|\\d+|a:b#c'
`, { generatedMarker: true });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.generated, true);
  assert.deepEqual(result.value.merged, { shared: 'explicit', empty: [], object: {}, nullable: null, extra: true });
  assert.deepEqual(result.value.inherited, { shared: 'left', empty: [], object: {}, nullable: null, extra: true });
  assert.deepEqual(result.value.alias, result.value.left);
  assert.deepEqual(result.value.values, ['yes', 'no', 'on', 'off', null, 'null', '001', false, 8, 1.25]);
  assert.equal(result.value.url, 'https://example.test:443/dns-query#RULES');
  assert.equal(result.value.regex, '(?i)香港|\\d+|a:b#c');
  const reread = await read(api.dump(result.value));
  assert.equal(reread.ok, true, reread.message);
  assert.deepEqual(reread.value, result.value);
});

test('actual YAML bridge rejects nonmapping roots, multiple documents and unsafe numeric values', { skip: !process.env.F50_TEST_YQ }, async t => {
  const read = yamlBridge(t);
  for (const input of ['[]\n', 'null\n', 'false\n', 'text\n', 'a: 1\n---\nb: 2\n', 'value: 9007199254740993\n', 'value: .nan\n']) {
    const result = await read(input);
    assert.equal(result.ok, false, JSON.stringify(input));
  }
  const valid = await read('value: "9007199254740993"\n');
  assert.equal(valid.ok, true, valid.message);
  assert.equal(valid.value.value, '9007199254740993');
});

test('actual YAML bridge rejects duplicate mapping keys before JSON can discard an earlier value', { skip: !process.env.F50_TEST_YQ }, async t => {
  const read = yamlBridge(t);
  for (const input of ['port: 7890\nport: 7891\n', 'dns: {nameserver: ["1.1.1.1"], nameserver: ["8.8.8.8"]}\n']) {
    const result = await read(input);
    assert.equal(result.ok, false, input);
  }
});

test('a stale correction marker is cleared once the conflicting value is gone', () => {
  const stale = { ...base(), 'tproxy-port': 7895, 'x-f50-overridden': ['tproxy-port'] };
  const result = plain(api.runtime(stale, { traffic_mode: 'tproxy', ipv6: 'off' }));
  assert.equal(Object.hasOwn(result, 'x-f50-overridden'), false);
  assert.equal(result['tproxy-port'], 7895);
});

test('a conflicting default listener is closed and recorded, and stays recorded on the next shaping', () => {
  const options = { traffic_mode: 'tproxy', ipv6: 'off' };
  const result = plain(api.runtime({ ...base(), 'mixed-port': 7890 }, options));
  assert.equal(result['mixed-port'], 7890);
  assert.equal(result.port, 0);
  assert.ok(result['x-f50-overridden'].includes('port 与已指定的监听端口冲突，已关闭'));
  assert.deepEqual(plain(api.runtime(result, options)), result);

  const socksClash = plain(api.runtime({ ...base(), 'mixed-port': 7891 }, options));
  assert.equal(socksClash['socks-port'], 0);
  assert.equal(socksClash['mixed-port'], 7891);
});

test('switching an original config to IPv4 TUN drops the IPv6 address and records it', () => {
  const v6 = plain(api.runtime({ ...base(), tun: { enable: true } }, { traffic_mode: 'tun', ipv6: 'on' }, [], true));
  assert.ok(v6.tun['inet6-address']);
  const v4 = plain(api.runtime(v6, { traffic_mode: 'tun', ipv6: 'off' }, [], true));
  assert.equal(v4.tun['inet6-address'], undefined);
  assert.ok(v4['x-f50-overridden'].includes('tun.inet6-address（IPv6 已关闭）'));
});

test('a group whose only provider disappeared falls back instead of keeping an empty use list', () => {
  const raw = { ...base(),
    'proxy-providers': { Old: { type: 'http', url: 'https://gone.example.test/sub' } },
    'proxy-groups': [{ name: 'OnlyOld', type: 'select', use: ['Old'] }, { name: 'Choose', type: 'select', proxies: ['DIRECT'] }] };
  const result = plain(api.normalize(raw, sources.slice(0, 1)).config);
  assert.equal(Object.hasOwn(result['proxy-providers'], 'Old'), false);
  assert.deepEqual(result['proxy-groups'][0].use, ['Provider1']);
  // 有待选 proxies 的组不需要兜底，空 use 是核心接受的写法。
  const withProxies = plain(api.normalize({ ...base(),
    'proxy-providers': { Old: { type: 'http', url: 'https://gone.example.test/sub' } },
    'proxy-groups': [{ name: 'Keep', type: 'select', use: ['Old'], proxies: ['DIRECT'] }] }, sources.slice(0, 1)).config);
  assert.deepEqual(withProxies['proxy-groups'][0].use, []);
});

test('an unmatched custom http provider is dropped rather than recycled into a renumbered source', () => {
  const raw = { ...base(), 'proxy-providers': {
    Custom: { type: 'http', url: 'https://custom.example.test/sub', override: { 'additional-prefix': '[C] ' } },
  } };
  const result = plain(api.normalize(raw, sources.slice(0, 1), { emptyProviderUrls: false }).config);
  assert.equal(Object.hasOwn(result['proxy-providers'], 'Custom'), false);
  assert.equal(result['proxy-providers'].Provider1.url, sources[0].url);
  assert.equal(result['proxy-providers'].Provider1.override, undefined);
});
