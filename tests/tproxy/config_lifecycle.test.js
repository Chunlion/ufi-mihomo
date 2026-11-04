'use strict';

const test = require('node:test');
const { File } = require('node:buffer');
const { fs, path, assert, slice, run, shell, shellApi, quote, temp, write, plain } = require('./optimization_harness');
const yq = process.env.F50_TEST_YQ;
const templates = process.env.F50_TEMPLATE_REPO;

test('real template persists through preparation, repeated saves, source changes and mode switches', {
  skip: !yq || !templates,
}, async t => {
  const dir = temp();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const config = write(dir, 'Proxy/config.yaml', 'secret: kept-existing-secret\n');
  const template = path.join(dir, 'Tools/template.yaml');
  const base = path.join(dir, 'Tools/template.base.yaml');
  const sourceFile = write(dir, 'Tools/config_source.conf', 'KANO_CONFIG_SOURCE=uploaded_config\n');
  fs.symlinkSync(yq, path.join(dir, 'Tools/yq_linux_arm64'));
  let options = { traffic_mode: 'tproxy', ipv6: 'off', tun_stack: 'mixed' }, upload = 0;
  const messages = [];
  const execute = async script => {
    const result = shell(script, { F50_ROOT: dir });
    return { success: result.status === 0, content: result.stdout + result.stderr };
  };
  const api = run(
    slice('const F50_ZASHBOARD_UI_URL', 'function buildF50EmergencyScript')
    + slice('function buildF50ConfigTransactionFunctions', 'function f50HealthLayers')
    + slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later')
    + '\nconst KPR = createPrivateRouteLogic();\n'
    + slice('async function kprShapeRuntimeConfig', 'async function kprVerifySelection')
    + slice('const providerNameFor', 'const normalizeSubRuleModeValue')
    + slice('const readConfigSource', 'const normalizeSubConvertModeValue')
    + slice('const yamlScalar =', 'const ensurePolicyStorage')
    + slice('const buildManagedProxyProviders', 'const updateAirportDnsTemplate')
    + slice('const ensureTemplateForF50', 'const RULE_OVERRIDE_TYPES')
    + slice('const prepareTemplateFromBase', 'const applyJsOverrideToTemplate')
    + slice('const writeRuntimeConfigFromTemplate', 'const inspectTemplateNodeSources')
    + '\n({ read:readYamlObject, prepare:prepareTemplateFromBase, apply:writeRuntimeConfigFromTemplate, write:writeYamlObjectAtomic, dump:dumpConfigYaml })', {
      File, TextEncoder, console, CLASH_DIR: dir, CLASH_CONFIG: config, CLASH_TEMPLATE: template,
      CLASH_TEMPLATE_BASE: base, CLASH_CONFIG_SOURCE_FILE: sourceFile,
      KANO_TEMPLATE_WRITE_CHECK: path.join(dir, 'write-check.log'),
      ZASHBOARD_UI_DIR: 'WebUI/zashboard', ZASHBOARD_UI_URL: 'https://example.test/dashboard.zip',
      CLASH_SAFE_REJECT_DOMAIN_FILE: '/policy/reject', CLASH_SAFE_DIRECT_DOMAIN_FILE: '/policy/direct-domain',
      CLASH_SAFE_DIRECT_IP_FILE: '/policy/direct-ip', CLASH_SAFE_PROXY_DOMAIN_FILE: '/policy/proxy',
      currentProviderUserAgent: 'lifecycle-agent', loadProviderUserAgent: async () => 'lifecycle-agent',
      shellQuote: quote, runShellWithRoot: execute, hostRunShellWithRoot: execute, f50ShellReply: value => value,
      buildF50ShellBase: shellApi().base, prepareYqRuntimeCmd: () => `KANO_YQ_TMP=${quote(dir)}`,
      createRandomString: () => String(++upload), invalidateStatusSnapshot() {},
      uploadFileToDevice: async file => write(dir, `upload-${++upload}.yaml`, await file.text()),
      ensurePolicyStorage: async () => ({ ok: true }), ensureOriginalSubscriptionService: async () => true,
      kprReadOptions: async () => options, verifyF50TunStack: async value => value.tun_stack,
      applyJsOverrideToTemplate: async () => true, isHttpUrl: value => /^https?:\/\//.test(value),
      buildControllerInfo: async () => ({ secretSet: true, secret: 'kept-existing-secret' }),
      appendTemplateFlowDebug() {}, createToast: text => messages.push(text), safeTextToHtml: String,
      escapeHtml: String, sanitizeSubscriptionSecrets: String,
    });
  const sample = path.join(templates, 'THEYAMLS/Official_Examples/Metacubex/rule-set_config.yaml');
  const loaded = await api.read(sample);
  assert.equal(loaded.ok, true, loaded.message);
  const original = plain(loaded.value);
  for (let index = 0; index < 100; index++) {
    original['x-lifecycle-' + index] = { index, nested: { keep: [null, false, '001', '中文:#', { empty: {}, array: [] }] } };
  }
  original.dns['proxy-server-nameserver-policy'] = { '+.nodes.example.test': ['https://dns.example.test:443/dns-query#DIRECT'] };
  fs.writeFileSync(base, api.dump(original));
  const baseBytes = fs.readFileSync(base);
  const sources = [{ url: 'https://one.example.test/sub' }, { url: 'https://two.example.test/sub' }];
  const retained = (value, stage) => {
    for (let index = 0; index < 100; index++) assert.deepEqual(value['x-lifecycle-' + index], original['x-lifecycle-' + index], stage + ': x-lifecycle-' + index);
    assert.deepEqual(value.dns['proxy-server-nameserver-policy'], original.dns['proxy-server-nameserver-policy'], stage + ': node DNS');
    assert.deepEqual(value.rules, original.rules, stage + ': rules');
    assert.deepEqual(value['rule-providers'], original['rule-providers'], stage + ': rule providers');
  };
  const read = async (file, stage) => {
    const result = await api.read(file);
    assert.equal(result.ok, true, stage + ': ' + result.message);
    return plain(result.value);
  };
  assert.equal(await api.prepare(sources), true, messages.join('\n'));
  const prepared = await read(template, 'prepared');
  retained(prepared, 'prepared');
  assert.equal(await api.prepare(sources), true, messages.join('\n'));
  assert.deepEqual(await read(template, 'repeated preparation'), prepared);
  assert.deepEqual(fs.readFileSync(base), baseBytes, 'base template is never replaced by normalized output');
  assert.equal(fs.readFileSync(sourceFile, 'utf8'), 'KANO_CONFIG_SOURCE=uploaded_config\n', 'preparation does not change the live source');

  assert.equal(await api.apply(sources), true, messages.join('\n'));
  let current = await read(config, 'applied');
  assert.equal(current.secret, 'kept-existing-secret');
  assert.equal(fs.readFileSync(sourceFile, 'utf8'), 'KANO_CONFIG_SOURCE=template.yaml\n');
  for (const [key, value] of Object.entries(original).filter(([key]) => key.startsWith('x-lifecycle-'))) assert.deepEqual(current[key], value);
  const correctionNotice = ['port 与已指定的监听端口冲突，已关闭'];
  const applicationNotice = plain(current['x-f50-overridden']);
  const withoutNotice = value => { const copy = plain(value); delete copy['x-f50-overridden']; return copy; };
  for (let count = 0; count < 2; count++) {
    assert.equal(await api.apply(sources), true, messages.join('\n'));
    const applied = await read(config, 'repeated application');
    assert.deepEqual(withoutNotice(applied), withoutNotice(current));
    assert.deepEqual(applied['x-f50-overridden'], applicationNotice, 'rebuilding from the same template reports the same corrections');
    current = applied;
    const saved = await api.write(config, current);
    assert.equal(saved.ok, true, saved.content);
    const written = await read(config, 'repeated save');
    assert.deepEqual(withoutNotice(written), withoutNotice(current));
    assert.deepEqual(written['x-f50-overridden'], correctionNotice, 'saving normalized data clears obsolete correction notices');
    current = written;
  }
  for (const traffic_mode of ['tun', 'off', 'tproxy', 'tun', 'off', 'tproxy']) {
    options = { ...options, traffic_mode };
    const saved = await api.write(config, current);
    assert.equal(saved.ok, true, saved.content);
    current = await read(config, traffic_mode);
    assert.equal(current.tun.enable, traffic_mode === 'tun');
    assert.equal(current['tproxy-port'], traffic_mode === 'tproxy' ? 7895 : 0);
    for (let index = 0; index < 100; index++) assert.deepEqual(current['x-lifecycle-' + index], original['x-lifecycle-' + index]);
    assert.deepEqual(current.dns['proxy-server-nameserver-policy'], original.dns['proxy-server-nameserver-policy']);
  }
  const changedSources = [{ url: 'https://replacement.example.test/sub' }];
  assert.equal(await api.prepare(changedSources), true, messages.join('\n'));
  assert.equal(await api.apply(changedSources), true, messages.join('\n'));
  current = await read(config, 'changed subscription');
  assert.equal(current['proxy-providers'].Provider1.url, changedSources[0].url);
  assert.equal(Object.hasOwn(current['proxy-providers'], 'Provider2'), false);
  assert.deepEqual(fs.readFileSync(base), baseBytes);
  for (const configSource of ['uploaded_config', 'subscription_original', 'template.yaml']) {
    current['x-source-test'] = configSource;
    const saved = await api.write(config, current, { configSource });
    assert.equal(saved.ok, true, saved.content);
    current = await read(config, configSource);
    assert.equal(fs.readFileSync(sourceFile, 'utf8'), `KANO_CONFIG_SOURCE=${configSource}\n`);
    assert.equal(current['x-source-test'], configSource);
    for (let index = 0; index < 100; index++) assert.deepEqual(current['x-lifecycle-' + index], original['x-lifecycle-' + index]);
  }
  const beforeInvalid = fs.readFileSync(config);
  const failed = await api.write(config, { ...current, dns: ['invalid'] });
  assert.equal(failed.ok, false);
  assert.deepEqual(fs.readFileSync(config), beforeInvalid);
  assert.equal(fs.readFileSync(sourceFile, 'utf8'), 'KANO_CONFIG_SOURCE=template.yaml\n');
});
