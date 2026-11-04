'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const upstreamCommit = '982bf8104b123c4b9cb9f36431bd4acdb33191da';
const repository = process.env.F50_TEMPLATE_REPO;
const yq = process.env.F50_TEST_YQ;
const pluginRoot = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.resolve(pluginRoot, process.env.F50_PLUGIN || '猫猫TProxy.js'), 'utf8');
const quote = value => `'${String(value).replace(/'/g, `'"'"'`)}'`;
const clone = value => JSON.parse(JSON.stringify(value));
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const map = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const kind = value => value === undefined ? 'absent' : value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
const equal = (left, right) => require('node:util').isDeepStrictEqual(left, right);
const digest = value => value === undefined ? null : crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const shard = (process.env.F50_TEMPLATE_SHARD || '0/1').match(/^(\d+)\/([1-9]\d*)$/);
assert.ok(shard && Number(shard[1]) < Number(shard[2]), 'F50_TEMPLATE_SHARD must be zero-based index/count');
const report = { upstreamCommit, pluginSha256: crypto.createHash('sha256').update(source).digest('hex'), shard: `${shard[1]}/${shard[2]}`, samples: [], stages: [], exclusions: [], core: [] };
const badInputs = new Map([
  ['THEYAMLS/General_Config/Ayanami0-configs/Ayanami0_config_full.yaml', /unknown anchor/],
  ['THEYAMLS/General_Config/Mitchell/config_version2.yaml', /mapping values/],
  ['THEYAMLS/General_Config/Repcz/mihomo.yaml', /flow mapping/],
  ['THEYAMLS/General_Config/Yiteei/fake-ip_config.yaml', /顶层必须是映射对象|no matches found/],
  ['THEYAMLS/General_Config/Yiteei/redir-host_config.yaml', /顶层必须是映射对象|no matches found/],
]);
const coreInputLimits = new Map([
  ['THEYAMLS/General_Config/Ayanami0-configs/Ayanami0_config_geo-lite.yaml', /not found rule-set: ChinaMax_Domain/],
  ['THEYAMLS/General_Config/qichiyuhub/fuxie.yaml', /直连.*not found/],
  ['THEYAMLS/General_Config/qichiyuhub/proxychain.yaml', /not found rule-set: fakeipfilter_domain/],
  ['THEYAMLS/General_Config/Repcz/config_lite.yaml', /cannot unmarshal !!seq into map\[string\]interface/],
  ['THEYAMLS/General_Config/Lanlan13-14/configfull_lite.yaml', /list biliintl not found/],
  ['THEYAMLS/General_Config/liandu2024/clash-fallback-std.yaml', /path is not subpath.*\/usr\/share\/openclash\/ui/],
]);
const controlledTop = ['bind-address', 'allow-lan', 'external-controller', 'tproxy-port'];
const controlledTun = ['enable', 'device', 'auto-route', 'auto-redirect', 'strict-route', 'dns-hijack', 'stack'];
const removedTop = ['external-ui-name', 'external-controller-tls', 'external-controller-unix', 'external-controller-pipe', 'interface-name', 'routing-mark'];

function slice(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `source markers missing: ${start} / ${end}`);
  return source.slice(from, to);
}

function differences(before, after, at = []) {
  if (equal(before, after)) return [];
  if (map(before) && map(after)) return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .flatMap(key => differences(before[key], after[key], [...at, key]));
  return [{ path: at, before, after }];
}

function checkStage(sample, stage, before, after, allowed = () => '') {
  const changes = differences(before, after).map(item => ({ ...item, reason: allowed(item) }));
  report.stages.push({ sample, stage, changes: changes.map(({ path: keys, before, after, reason }) => ({
    path: keys, beforeType: kind(before), afterType: kind(after), beforeHash: digest(before), afterHash: digest(after), reason,
  })) });
  const unexpected = changes.filter(item => !item.reason);
  assert.equal(unexpected.length, 0, `${sample}: ${stage}: unexpected fields ${unexpected.map(item => item.path.join('.')).slice(0, 24).join(', ')}`);
}

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() && entry.name !== '.git' ? files(name) : entry.isFile() ? [name] : [];
  }).sort();
}

function command(executable, args, options = {}) {
  const result = spawnSync(executable, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 32 * 1024 * 1024, ...options });
  assert.ifError(result.error);
  return result;
}

function parse(file) {
  const result = command(yq, ['eval', '--yaml-fix-merge-anchor-to-spec', '-o=json', '.', file]);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function loadApi(directory) {
  const shell = async script => {
    const result = command('sh', ['-s'], { input: script });
    return { success: result.status === 0, content: result.stdout + result.stderr };
  };
  return vm.runInNewContext(
    slice('const F50_ZASHBOARD_UI_URL', 'let f50BackendReady')
    + slice('function buildF50ShellBase()', 'function buildF50ProcessHelpers(')
    + slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later')
    + slice('const providerNameFor', 'const readConfigSource')
    + slice('const yamlScalar', 'const stageTextBesideTarget')
    + slice('const buildManagedProxyProviders', 'const buildF50TemplateObject')
    + '\n({ read:readYamlObject, dump:dumpConfigYaml, shape:assertTemplateShapeForWrite, normalize:normalizeManagedTemplateObject, required:applyRequiredF50Fields,'
    + ' runtime:createPrivateRouteLogic().runtime, merge:f50DeepMerge, profiles:F50_FIXED_PROFILES, service:buildF50OriginalConfigFunctions })', {
      CLASH_DIR: directory,
      shellQuote: quote,
      runShellWithRoot: shell,
      prepareYqRuntimeCmd: () => `KANO_YQ_TMP=${quote(directory)}`,
      TextEncoder,
      ZASHBOARD_UI_DIR: 'WebUI/zashboard',
      ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
      currentProviderUserAgent: 'clash-verge',
      isHttpUrl: value => /^https?:\/\//.test(value),
      CLASH_SAFE_REJECT_DOMAIN_FILE: './Policy/reject_domain.list',
      CLASH_SAFE_DIRECT_DOMAIN_FILE: './Policy/direct_domain.list',
      CLASH_SAFE_DIRECT_IP_FILE: './Policy/direct_ip.list',
      CLASH_SAFE_PROXY_DOMAIN_FILE: './Policy/proxy_domain.list',
      console,
    }, { timeout: 10000 });
}

function managedCandidates(config) {
  return Object.entries(config['proxy-providers'] || {}).filter(([name, provider]) => provider && (provider.type === 'http'
    || provider.type === 'file' && /^Provider[1-9]\d*$/.test(name) && provider.path === `./proxies/${name}.yaml`));
}

function checkNormalization(sample, original, normalized, candidates) {
  const urls = [...new Set(candidates.map(([, provider]) => provider.url).filter(Boolean))];
  const renames = new Map();
  urls.forEach((url, index) => {
    const name = `Provider${index + 1}`;
    const options = candidates.filter(([, provider]) => provider.url === url);
    const selected = options.find(([originalName]) => originalName === name) || options[0];
    renames.set(selected[0], name);
  });
  for (const [name, provider] of Object.entries(original['proxy-providers'] || {})) {
    const targetName = renames.get(name) || name;
    assert.ok(own(normalized['proxy-providers'], targetName), `${sample}: lost provider ${name}`);
    const actual = normalized['proxy-providers'][targetName];
    if (renames.has(name)) {
      assert.equal(actual.type, 'file', `${sample}: staged provider type`);
      assert.equal(actual.path, `./proxies/${targetName}.yaml`, `${sample}: staged provider cache path`);
      assert.equal(own(actual, 'url'), false, `${sample}: staged file provider retains a download URL`);
      assert.ok(equal(actual.header, provider.header), `${sample}: provider headers/User-Agent changed without HTTP output`);
      assert.equal(actual.interval, provider.interval, `${sample}: explicit provider interval changed`);
    }
    checkStage(sample, `normalize/provider/${name}`, provider, normalized['proxy-providers'][targetName], ({ path: keys, before }) => {
      if (renames.has(name) && keys.length === 1 && ['type', 'url', 'path'].includes(keys[0])) return 'saved subscription binding';
      if (renames.has(name) && before === undefined && keys.length === 1 && keys[0] === 'health-check'
        && equal(actual['health-check'], { enable: true, url: 'https://www.gstatic.com/generate_204', interval: 900 })) return 'missing provider health-check default';
      return '';
    });
  }
  assert.deepEqual(Object.keys(normalized['proxy-providers']).sort(), Object.keys(original['proxy-providers'] || {}).map(name => renames.get(name) || name).sort());
  const expectedGroups = clone(original['proxy-groups']);
  for (const group of expectedGroups) if (own(group, 'use')) group.use = group.use.map(name => renames.get(name) || name);
  checkStage(sample, 'normalize/groups', expectedGroups, normalized['proxy-groups']);
  const restBefore = clone(original), restAfter = clone(normalized);
  delete restBefore['proxy-providers']; delete restAfter['proxy-providers'];
  delete restBefore['proxy-groups']; delete restAfter['proxy-groups'];
  checkStage(sample, 'normalize/user-fields', restBefore, restAfter, ({ path: keys, before, after }) => {
    if (keys.length === 1 && keys[0] === 'secret' && (typeof before !== 'string' || !before.trim()) && after === '123456') return 'missing controller secret';
    if (keys.length === 1 && keys[0] === 'external-ui-name' && after === undefined) return 'managed dashboard compatibility';
    if (keys.length === 1 && before == null && ['external-controller', 'external-ui', 'external-ui-url', 'proxies'].includes(keys[0])) return 'missing required field';
    return '';
  });
}

function correctionNotice(input, output, profile, preserved) {
  const notices = [];
  const ports = ['port', 'socks-port', 'mixed-port'];
  if (!preserved) for (const key of ports) {
    if (output[key] === 0 && Number(input[key] || 0) === 0 && ports.some(other => other !== key
      && own(input, other) && Number(input[other]) > 0 && Number(input[other]) === Number(profile[key]))) {
      notices.push(key + ' 与已指定的监听端口冲突，已关闭');
    }
  }
  if (profile.tun.enable && !profile.ipv6 && own(input.tun || {}, 'inet6-address')) notices.push('tun.inet6-address（IPv6 已关闭）');
  for (const key of controlledTop) if (own(input, key) && !equal(input[key], output[key])) notices.push(key);
  for (const key of ['enable', 'listen']) if (own(input.dns || {}, key) && !equal(input.dns[key], output.dns[key])) notices.push('dns.' + key);
  for (const key of controlledTun) if (own(input.tun || {}, key) && !equal(input.tun[key], output.tun?.[key])) notices.push('tun.' + key);
  return notices.length ? notices : undefined;
}

function runtimeReason(profile, preserved, input, output) {
  const providerPolicy = ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'];
  const defaultPolicy = clone(profile.dns['nameserver-policy'] || {});
  for (const name of ['cn_domain', 'private_domain', 'add_direct_domain']) {
    if (input['rule-providers']?.[name]?.behavior === 'domain' && !own(defaultPolicy, `rule-set:${name}`)) defaultPolicy[`rule-set:${name}`] = providerPolicy;
  }
  const defaultDns = clone(profile.dns);
  if (!preserved) defaultDns['nameserver-policy'] = defaultPolicy;
  return ({ path: keys, before, after }) => {
    const [top, child] = keys;
    if (keys.length === 1 && controlledTop.includes(top) && equal(after, profile[top])) return 'fixed F50 network field';
    if (keys.length === 1 && removedTop.includes(top) && after === undefined) return 'Controller owns interface and listeners';
    if (keys.length === 1 && top === 'x-f50-profile' && after === '8.0.0-compat.2.3') return 'plugin protocol marker';
    if (keys.length === 1 && top === 'x-f50-overridden' && equal(after, correctionNotice(input, output, profile, preserved))) return 'correction notice recomputed from current fields';
    if (top === 'dns' && keys.length === 2 && ['enable', 'listen'].includes(child) && equal(after, profile.dns[child])) return 'fixed F50 DNS listener';
    if (top === 'tun' && keys.length === 2 && controlledTun.includes(child) && equal(after, profile.tun[child])) return 'fixed F50 TUN field';
    if (top === 'tun' && keys.length === 2 && child === 'inet6-address' && profile.tun.enable && !profile.ipv6 && after === undefined) return 'IPv6-disabled TUN interface has no IPv6 address';
    if (!preserved && top === 'rule-providers' && keys[2] === 'proxy' && !String(before ?? '').trim() && after === 'DIRECT') return 'missing or empty rule-provider fetch route';
    if (before === undefined) {
      if (keys.length === 1 && ['proxies', 'proxy-groups', 'rules'].includes(top)
        && equal(after, top === 'rules' ? ['MATCH,DIRECT'] : [])) return 'missing collection default';
      if (top === 'tun' && keys.length === 1 && equal(after, profile.tun)) return 'missing TUN mapping';
      if (top === 'dns' && keys.length === 1 && equal(after, defaultDns)) return 'missing DNS mapping';
      if (top === 'tun' && keys.length === 2 && own(profile.tun, child) && equal(after, profile.tun[child])) return 'missing TUN profile default';
      if (!preserved && keys.length === 1 && ['port', 'socks-port', 'mixed-port'].includes(top) && after === 0
        && ['port', 'socks-port', 'mixed-port'].some(key => key !== top && own(input, key) && Number(input[key]) > 0 && Number(input[key]) === Number(profile[top]))) return 'disable only a missing default listener that conflicts with an explicit port';
      if (!preserved && own(profile, top) && (keys.length === 1 && equal(after, profile[top])
        || keys.length === 2 && own(profile[top] || {}, child) && equal(after, profile[top][child]))) return 'missing profile default';
      if (!preserved && top === 'dns' && child === 'nameserver-policy' && keys.length === 2 && equal(after, defaultPolicy)) return 'missing DNS policy defaults and existing domain-provider routes';
      if (!preserved && top === 'dns' && child === 'nameserver-policy' && keys.length === 3
        && /^rule-set:(cn_domain|private_domain|add_direct_domain)$/.test(keys[2])
        && input['rule-providers']?.[keys[2].slice('rule-set:'.length)]?.behavior === 'domain'
        && equal(after, providerPolicy)) return 'missing managed provider DNS policy';
      if (!preserved && top === 'rule-providers' && keys[2] === 'proxy' && after === 'DIRECT') return 'missing rule-provider fetch route';
    }
    if (top === 'proxies' || top === 'proxy-groups') {
      const cleaned = clone(before);
      if (Array.isArray(cleaned)) {
        for (const node of cleaned) { delete node['interface-name']; delete node['routing-mark']; }
        if (equal(cleaned, after)) return 'Controller owns per-node interface and mark';
      }
    }
    if (['proxy-providers', 'rule-providers'].includes(top) && keys[2] === 'override' && ['interface-name', 'routing-mark'].includes(keys[3]) && after === undefined) return 'Controller owns provider interface and mark';
    return '';
  };
}

function requiredReason(preserved) {
  const defaults = {
    'external-controller': '0.0.0.0:7788',
    'external-ui': 'WebUI/zashboard',
    'external-ui-url': 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
    secret: '123456',
    proxies: [],
    'unified-delay': true,
  };
  return ({ path: keys, before, after }) => {
    if (keys.length !== 1) return '';
    const key = keys[0];
    if (key === 'external-ui-name' && after === undefined) return 'managed dashboard compatibility';
    if (!own(defaults, key) || !equal(after, defaults[key])) return '';
    if (['secret', 'external-controller'].includes(key) && (typeof before !== 'string' || !before.trim())) return 'missing required controller field';
    if (['external-ui', 'external-ui-url'].includes(key) && before == null) return 'missing dashboard default';
    if (key === 'proxies' && before === undefined) return 'missing proxy collection';
    if (key === 'unified-delay' && !preserved && before === undefined) return 'missing template delay default';
    return '';
  };
}

function serviceRoundTrip(api, directory, sample, config, configSource, gist = false) {
  const original = clone(config);
  if (gist) {
    original['x-f50-gist-sync'] = true;
    original['x-f50-gist-manual-providers'] = Object.keys(original['proxy-providers'] || {}).slice(0, 1);
  }
  fs.writeFileSync(path.join(directory, 'Tools/config_source.conf'), `KANO_CONFIG_SOURCE=${configSource}\n`);
  fs.writeFileSync(path.join(directory, 'Proxy/subscription_urls.txt'), '# KANO_SUB_CONVERT_MODE=provider\n');
  fs.writeFileSync(path.join(directory, 'Proxy/config.yaml'), api.dump(original));
  const fixture = clone(api.profiles.tproxy4);
  fixture['x-f50-profile'] = '8.0.0-compat.2.3';
  // Controller preparation is modeled here; its actual ARM64 execution has separate tests.
  for (const key of ['proxies', 'proxy-groups', 'rules', 'proxy-providers', 'rule-providers']) if (own(original, key)) fixture[key] = clone(original[key]);
  fs.writeFileSync(path.join(directory, 'controller.json'), JSON.stringify(fixture));
  let previous = original;
  for (const action of ['prepare', 'restart', 'restart']) {
    const run = command('sh', ['-s', '--', 'status'], {
      input: `${api.service()}\nf50_save_original_config ${action} || exit 1\ncp ${quote(path.join(directory, 'controller.json'))} "$CLASH_ROOT/Proxy/config.yaml" || exit 1\nf50_restore_original_config || exit 1\n`,
      env: { ...process.env, CLASH_ROOT: directory },
    });
    assert.equal(run.status, 0, `${sample}: Service ${configSource}: ${run.stdout}${run.stderr}`);
    const restored = parse(path.join(directory, 'Proxy/config.yaml'));
    checkStage(sample, `service/${gist ? 'gist' : configSource}/${action}`, previous, restored);
    assert.equal(fs.readFileSync(path.join(directory, 'Tools/config_source.conf'), 'utf8'), `KANO_CONFIG_SOURCE=${configSource}\n`);
    previous = restored;
  }
}

function coreHarness(directory, api) {
  const core = process.env.F50_TEST_MIHOMO, resources = process.env.F50_TEST_GEODATA_DIR;
  if (!core || !resources) return null;
  const runner = path.join(directory, 'no-network');
  const build = command('gcc', ['-O2', '-Wall', path.join(__dirname, 'no_network.c'), '-o', runner]);
  assert.equal(build.status, 0, build.stderr);
  for (const address of ['127.0.0.1', '::1']) {
    const guard = command(runner, [process.execPath, '-e', `const net=require('net');const s=net.connect(9,${JSON.stringify(address)});s.on('error',e=>process.exit(e.code==='EPERM'?0:1));s.on('connect',()=>process.exit(1));`]);
    assert.equal(guard.status, 0, `core network isolation must block ${address}`);
  }
  report.networkIsolation = 'Linux seccomp denies AF_INET/AF_INET6 sockets and connect; IPv4 and IPv6 probes returned EPERM';
  report.coreVersion = command(core, ['-v']).stdout.trim();
  report.resourceHashes = Object.fromEntries(['GeoIP.dat', 'GeoSite.dat', 'Country.mmdb', 'ASN.mmdb'].map(name =>
    [name, crypto.createHash('sha256').update(fs.readFileSync(path.join(resources, name))).digest('hex')]));
  return (sample, config, stage) => {
    const work = process.env.F50_TEMPLATE_CORE_INPUTS
      ? path.join(process.env.F50_TEMPLATE_CORE_INPUTS, sample.replace(/\.ya?ml$/i, ''), ...(stage.startsWith('upstream') ? [] : [stage.startsWith('uploaded') ? 'uploaded' : 'processed']))
      : path.join(directory, 'core', crypto.createHash('sha256').update(sample + stage).digest('hex').slice(0, 16));
    fs.mkdirSync(path.join(work, 'fixtures'), { recursive: true });
    for (const name of Object.keys(report.resourceHashes)) if (!fs.existsSync(path.join(work, name))) fs.symlinkSync(path.resolve(resources, name), path.join(work, name));
    const local = clone(config), adaptations = [];
    for (const family of ['proxy-providers', 'rule-providers']) {
      for (const [index, [name, provider]] of Object.entries(local[family] || {}).entries()) {
        if (!map(provider) || !['http', 'file'].includes(provider.type)) continue;
        const file = path.join('fixtures', `${family}-${index}.${provider.format || 'yaml'}`);
        const target = path.join(work, file);
        if (family === 'proxy-providers') {
          fs.writeFileSync(target, JSON.stringify({ proxies: [{ name: 'Fixture HK 香港 JP 日本 US 美国', type: 'socks5', server: '127.0.0.1', port: 9 }] }));
        } else {
          const rule = provider.behavior === 'ipcidr' ? '192.0.2.0/24' : provider.behavior === 'classical' ? 'DOMAIN-SUFFIX,example.invalid' : '+.example.invalid';
          if (provider.format === 'mrs') {
            fs.writeFileSync(target + '.text', rule + '\n');
            const converted = command(runner, [core, 'convert-ruleset', provider.behavior, 'text', target + '.text', target]);
            if (converted.status !== 0) fs.writeFileSync(target, '');
          } else fs.writeFileSync(target, provider.format === 'text' ? rule + '\n' : JSON.stringify({ payload: [rule] }));
        }
        provider.type = 'file'; provider.path = file; delete provider.url;
        adaptations.push({ path: [family, name], fields: ['type', 'path', 'url'], reason: 'test-only local resource payload; all other provider fields retained' });
      }
    }
    const file = path.join(work, 'config.yaml');
    fs.writeFileSync(file, api.dump(local));
    if (process.env.F50_TEMPLATE_CORE_INPUTS) fs.writeFileSync(path.join(work, 'config.json'), JSON.stringify(local));
    const result = command(runner, [core, '-t', '-d', work, '-f', file]);
    const output = result.stdout + result.stderr;
    const status = result.status === 0 ? 'pass' : /path is not subpath of home directory|interface .*not found/i.test(output) ? 'platform-path-limited'
      : /operation not permitted|no such file|download.*failed|failed to download|can.t load|no records|failed to load|load GeoSite data error.*not found/i.test(output) ? 'external-resource-limited' : 'upstream-input-limited';
    const detail = output.split('\n').filter(line => /level=(error|fatal)|panic:/.test(line)).map(line => line.replace(/https?:\/\/[^\s"']+/g, '<external-url>')).join('\n');
    const outcome = { sample, stage, status, exit: result.status, detail, adaptations };
    report.core.push(outcome);
    if (status !== 'pass') {
      assert.ok(coreInputLimits.has(sample), `${sample}: ${stage}: unexpected core failure: ${detail}`);
      assert.match(detail, coreInputLimits.get(sample), `${sample}: ${stage}: core failure no longer matches the recorded input limitation`);
    }
    return outcome;
  };
}

test('pinned real Mihomo templates retain fields throughout configuration handling', { skip: !repository || !yq }, async t => {
  const commit = command('git', ['rev-parse', 'HEAD'], { cwd: repository });
  assert.equal(commit.status, 0, commit.stderr);
  assert.equal(commit.stdout.trim(), upstreamCommit, 'checkout the recorded upstream commit before running this corpus');
  report.yqVersion = command(yq, ['--version']).stdout.trim();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-real-templates-'));
  fs.mkdirSync(path.join(directory, 'Tools'));
  fs.mkdirSync(path.join(directory, 'Proxy'));
  fs.symlinkSync(path.resolve(yq), path.join(directory, 'Tools/yq_linux_arm64'));
  fs.writeFileSync(path.join(directory, 'Proxy/Clash.Core'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  t.after(() => {
    if (process.env.F50_TEMPLATE_REPORT) fs.writeFileSync(process.env.F50_TEMPLATE_REPORT, JSON.stringify(report, null, 2) + '\n');
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const api = loadApi(directory);
  const coreCheck = coreHarness(directory, api);
  const yamlFiles = files(path.join(repository, 'THEYAMLS')).filter(file => /\.ya?ml$/i.test(file));
  assert.equal(yamlFiles.length, 93);
  for (const file of files(path.join(repository, 'Overwrite'))) {
    const relative = path.relative(repository, file).split(path.sep).join('/');
    if (/\.ini$/i.test(file)) report.exclusions.push({ path: relative, reason: 'INI subscription converter rules' });
    if (/\.conf$/i.test(file)) report.exclusions.push({ path: relative, reason: 'OpenClash shell overwrite module' });
    if (/\.ya?ml$/i.test(file)) {
      assert.match(fs.readFileSync(file, 'utf8'), /^\[YAML\]/m);
      report.exclusions.push({ path: relative, reason: 'OpenClash [YAML] overwrite block, not an independent configuration' });
    }
  }
  for (const file of yamlFiles.filter((_, index) => index % Number(shard[2]) === Number(shard[1]))) {
    const relative = path.relative(repository, file).split(path.sep).join('/');
    await t.test(relative, async caseTest => {
      const input = path.join(directory, 'sample.yaml');
      fs.copyFileSync(file, input);
      const read = await api.read(input, relative);
      if (badInputs.has(relative)) {
        assert.equal(read.ok, false, 'upstream-invalid input must not silently become a configuration');
        assert.match(read.message, badInputs.get(relative));
        report.exclusions.push({ path: relative, reason: read.message.replaceAll(input, '<sample>') });
        return;
      }
      assert.equal(read.ok, true, read.message);
      const original = clone(read.value);
      checkStage(relative, 'read', parse(input), original);
      checkStage(relative, 'template-write-shape/original', original, clone(api.shape(clone(original), relative)));
      const merged = clone(api.merge(original, {}));
      checkStage(relative, 'deep-merge', original, merged);
      checkStage(relative, 'deep-merge/input-unchanged', original, clone(read.value));
      const smart = relative.includes('/Smart_Mode/') || original['proxy-groups'].some(group => group.type === 'smart');
      report.samples.push({ path: relative, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), roots: Object.keys(original).length, category: smart ? 'Smart-only' : 'standard' });
      if (smart) {
        fs.writeFileSync(input, api.dump(original));
        checkStage(relative, 'Smart/read-write-semantics-only', original, parse(input));
        caseTest.diagnostic('Smart-only: no standard Mihomo compatibility claim');
        return;
      }
      const originalCore = coreCheck && coreCheck(relative, original, 'upstream-with-local-resources');
      if (relative === 'THEYAMLS/General_Config/Repcz/config_lite.yaml') {
        assert.ok(Array.isArray(original['proxy-providers'].Subscribe));
        assert.throws(() => api.normalize(original), /proxy-provider Subscribe 格式无效/);
        report.exclusions.push({ path: relative, reason: 'upstream proxy-providers.Subscribe is a YAML sequence; Mihomo requires a mapping' });
        fs.writeFileSync(input, api.dump(original));
        checkStage(relative, 'upstream-invalid-type/read-write-semantics-only', original, parse(input));
        return;
      }
      const configured = clone(merged);
      for (const [index, [name, provider]] of managedCandidates(configured).entries()) {
        if (provider.type === 'http' && (typeof provider.url !== 'string' || !/^https?:\/\//.test(provider.url))) {
          provider.url = `https://fixture.invalid/subscription-${index + 1}`;
          report.exclusions.push({ path: relative, field: ['proxy-providers', name, 'url'], reason: 'empty/non-HTTP subscription placeholder filled only in the isolated template input' });
        }
      }
      checkStage(relative, 'subscription-placeholder-input', merged, configured, ({ path: keys, after }) =>
        keys[0] === 'proxy-providers' && keys[2] === 'url' && /^https:\/\/fixture\.invalid\/subscription-\d+$/.test(after) ? 'test-only subscription placeholder' : '');
      const candidates = managedCandidates(configured);
      const sources = candidates.map(([, provider]) => ({ url: provider.url, enabled: true }));
      let normalized;
      try { normalized = clone(api.normalize(configured, sources, { generated: false }).config); }
      catch (error) { throw new Error(`${relative}: template normalization: ${error.message}`); }
      checkStage(relative, 'template-write-shape/normalized', normalized, clone(api.shape(clone(normalized), relative)));
      checkNormalization(relative, configured, normalized, candidates);
      checkStage(relative, 'normalize/repeated', normalized, clone(api.normalize(normalized, sources, { generated: false }).config));
      let finalTemplate, finalUpload;
      for (const preserved of [false, true]) {
        let value = preserved ? clone(original) : clone(normalized);
        const beforeRequired = clone(value);
        value = clone(api.required(value, { preserveConfig: preserved }));
        checkStage(relative, `${preserved ? 'upload' : 'template'}/required-fields`, beforeRequired, value, requiredReason(preserved));
        for (const mode of ['tproxy4', 'tun6', 'off4', 'tproxy6', 'tun4', 'off6', 'tproxy4']) {
          const options = { traffic_mode: mode.slice(0, -1), ipv6: mode.endsWith('6') ? 'on' : 'off', tun_stack: mode === 'tun6' ? 'gvisor' : 'mixed' };
          const next = clone(api.runtime(value, options, [], preserved));
          const profile = clone(api.profiles[mode]);
          checkStage(relative, `${preserved ? 'upload' : 'template'}/${mode}`, value, next, runtimeReason(profile, preserved, value, next));
          const repeated = clone(api.runtime(next, options, [], preserved));
          checkStage(relative, `${preserved ? 'upload' : 'template'}/${mode}/repeat`, next, repeated, ({ path: keys, after }) =>
            keys.length === 1 && keys[0] === 'x-f50-overridden' && equal(after, correctionNotice(next, repeated, profile, preserved))
              ? 'correction notice reflects this pass; all effective fields remain unchanged' : '');
          fs.writeFileSync(input, api.dump(next));
          checkStage(relative, `${preserved ? 'upload' : 'template'}/${mode}/write-read`, next, parse(input));
          value = next;
        }
        if (preserved) {
          serviceRoundTrip(api, directory, relative, value, 'uploaded_config');
          serviceRoundTrip(api, directory, relative, value, 'subscription_original');
          serviceRoundTrip(api, directory, relative, value, 'uploaded_config', true);
          finalUpload = value;
        } else {
          serviceRoundTrip(api, directory, relative, value, 'template.yaml');
          finalTemplate = value;
        }
      }
      if (coreCheck) {
        for (const [stage, config] of [['processed', finalTemplate], ['uploaded', finalUpload]]) {
          const result = coreCheck(relative, config, `${stage}-with-local-resources`);
          if (originalCore.status === 'pass') assert.equal(result.status, 'pass', `${relative}: ${stage} introduced core validation failure: ${result.detail}`);
          else caseTest.diagnostic(`upstream core result: ${originalCore.status}; ${stage}: ${result.status}`);
        }
      }
    });
  }
});
