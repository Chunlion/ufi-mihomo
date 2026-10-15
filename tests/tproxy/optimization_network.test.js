'use strict';

const test = require('node:test');
const { parse, semantics } = require('../../scripts/compact_plugin');
const { fs, assert, slice, run, shell, shellApi, source, original, plain, quote, temp, write } = require('./optimization_harness');
const contracts=require('../gist-sync/expected-contracts.json');
const hash=value=>require('node:crypto').createHash('sha256').update(value).digest('hex');
const api = shellApi(), baseline = shellApi(original);
function privateApi(text) {
  return run(slice('const F50_ZASHBOARD_UI_URL', 'const F50_COMPAT_VERSION', text)
    + slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later', text)
    + 'createPrivateRouteLogic()');
}
const current = privateApi(source), previous = privateApi(original);
const base = { 'proxy-groups': [{ name: 'Proxy', type: 'select', proxies: ['DIRECT'] }],
  rules: ['MATCH,Proxy'], dns: { 'nameserver-policy': { 'custom.example': '1.1.1.1' } } };

test('private routing implementation and firewall/process ownership functions are unchanged', () => {
  assert.equal(semantics(parse(slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later'))),
    semantics(parse(slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later', original))));
  for (const name of ['stat', 'owned_exe', 'scan', 'same_process', 'stop_recorded', 'table_absent',
    'save', 'firewall_plan', 'ip_snapshot', 'drop_detached_tun_rules', 'disable_unsupported_ipv6_dns_hijack',
    'routes_plan', 'network_snapshot', 'execute_plan', 'clean_environment', 'artifact_paths', 'runtime_guard',
    'remove_artifacts', 'final_probe']) {
    const extract = text => slice('f50_' + name + '() {', '\n}\n', text);
    const extension=contracts.network[name];
    if(extension){assert.equal(hash(extract(baseline.maintenance())),extension.before);assert.equal(hash(extract(api.maintenance())),extension.after);}
    else assert.equal(extract(api.maintenance()), extract(baseline.maintenance()), name);
  }
});

test('IPv4 / IPv6 CIDR normalization and overlap detection retain their results', () => {
  for (const cidr of ['192.168.11.17/24', '10.0.0.0/8', '172.16.0.0/12', 'fc00::/7', 'fd12:3456::1/64']) {
    const a = current.cidr(cidr), b = previous.cidr(cidr);
    assert.deepEqual(plain(a), plain(b));
  }
  for (const cidr of ['192.168.1.0/33', 'fd12::/129', 'invalid']) {
    assert.throws(() => current.cidr(cidr));
    assert.throws(() => previous.cidr(cidr));
  }
  assert.equal(current.overlaps(current.cidr('192.168.11.0/24'), current.cidr('192.168.0.0/16')), true);
  assert.equal(current.overlaps(current.cidr('fd12:3456::/64'), current.cidr('fc00::/7')), true);
  assert.equal(current.overlaps(current.cidr('10.0.0.0/8'), current.cidr('192.168.11.0/24')), false);
});

test('IPv6 private CIDR is rejected when IPv6 capture is disabled', () => {
  const options = { traffic_mode: 'tproxy', ipv6: 'off', private_route_enabled: 'on',
    private_route_cidrs: 'fd12:3456::/64', private_route_policy: 'Proxy' };
  assert.throws(() => current.runtime(base, options), /IPv6/);
  assert.throws(() => previous.runtime(base, options), /IPv6/);
});

for (const traffic_mode of ['tproxy', 'tun', 'off']) {
  for (const ipv6 of ['on', 'off']) {
    test(`private network ${traffic_mode}/${ipv6}, repeated apply and disable restore`, () => {
      const options = { traffic_mode, ipv6, private_route_enabled: 'on',
        private_route_cidrs: ipv6 === 'on' ? '192.168.11.0/24,fd12:3456::/64' : '192.168.11.0/24', private_route_policy: 'Proxy' };
      const active = current.runtime(base, options);
      assert.deepEqual(plain(active), plain(previous.runtime(base, options)));
      const again = current.runtime(active, options);
      assert.deepEqual(plain(again), plain(previous.runtime(active, options)));
      assert.equal(new Set(again.rules).size, again.rules.length);
      const disabled = { traffic_mode, ipv6, private_route_enabled: 'off' };
      assert.deepEqual(plain(current.runtime(active, disabled)), plain(previous.runtime(active, disabled)));
      assert.equal(current.runtime(active, disabled)['x-kano-private-route'], undefined);
      assert.deepEqual(plain(base.rules), ['MATCH,Proxy']);
    });
  }
}

test('operation composition includes every transitive helper and reduces shell payload', () => {
  const known = new Set([...baseline.maintenance().matchAll(/^(f50_[a-z0-9_]+)\(\) \{/gm)].map(m => m[1]));
  for (const operation of ['start', 'inspect', 'install', 'cleanup', 'final', 'uninstall']) {
    const script = operation === 'start' ? api.start('start') : operation === 'install' ? api.install('/data/upload.zip')
      : operation === 'uninstall' ? api.uninstall().map(s => s.script).join('\n') : api[operation]();
    const originalScript = operation === 'start' ? baseline.start('start') : operation === 'install' ? baseline.install('/data/upload.zip')
      : operation === 'uninstall' ? baseline.uninstall().map(s => s.script).join('\n') : baseline[operation]();
    const declared = new Set([...script.matchAll(/^(f50_[a-z0-9_]+)\(\) \{/gm)].map(m => m[1]));
    for (const match of script.matchAll(/\b(f50_[a-z0-9_]+)\b/g)) {
      if (known.has(match[1])) assert.ok(declared.has(match[1]), operation + ': missing ' + match[1]);
    }
    if (operation === 'install') assert.ok(Buffer.byteLength(script) < Buffer.byteLength(originalScript) - 25000, operation);
    else if (['inspect', 'cleanup', 'final', 'uninstall'].includes(operation)) {assert.equal(hash(originalScript),contracts.operations[operation].before);assert.equal(hash(script),contracts.operations[operation].after);}
    else assert.ok(script.includes('f50_service_patch_finish'), 'start retains the new atomic patch transaction');
  }
});

test('cleanup plans refuse foreign route-table users', () => {
  const dir = temp();
  try {
    const rules = write(dir, 'rules', '100: from all lookup 17666\n1777: from all fwmark 0x10000000/0x10000000 lookup 17666\n');
    const routes = write(dir, 'routes', 'local default dev lo table 17666 proto 242\n');
    const plan = dir + '/plan';
    const routeResult = shell(api.maintenance() + `\nf50_routes_plan -4 ${quote(rules)} ${quote(routes)} ${quote(plan)}\n`);
    assert.equal(routeResult.status, 1);
    assert.match(routeResult.stdout, /owned_route_table_still_used_by_foreign_rule/);
    assert.ok(!fs.readFileSync(plan, 'utf8').includes('aflush'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('firewall cleanup ignores foreign rules and fake jumps inside comments', () => {
  const dir = temp();
  try {
    const input = write(dir, 'firewall', '*mangle\n:KANO_POLICY_PRE - [0:0]\n:FOREIGN_CHAIN - [0:0]\n-A PREROUTING -m comment --comment "fake -j KANO_POLICY_PRE" -j FOREIGN_CHAIN\n-A PREROUTING -j KANO_POLICY_PRE\n-A FOREIGN_CHAIN -j ACCEPT\nCOMMIT\n');
    const plan = dir + '/plan';
    const result = shell(api.maintenance() + `\nf50_firewall_plan iptables ${quote(input)} ${quote(plan)} || exit 1\ncat ${quote(plan)}\n`);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(!result.stdout.includes('FOREIGN_CHAIN'));
    assert.ok(!result.stdout.includes('fake'));
    assert.match(result.stdout, /a-D\naPREROUTING\na-j\naKANO_POLICY_PRE/);
    assert.match(result.stdout, /a-X\naKANO_POLICY_PRE/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const state of ['clean', 'residual', 'unknown']) {
  test('uninstall final probe reports ' + state, () => {
    const dir = temp();
    try {
      let script = api.final();
      const at = script.indexOf('F50_WORK=$(mktemp');
      script = script.slice(0, at) + `f50_final_probe() { F50_FINAL_REMAINS=${state === 'residual' ? 1 : 0}; F50_FINAL_UNKNOWN=${state === 'unknown' ? 1 : 0}; }\n` + script.slice(at);
      const final = shell(script, { F50_ROOT: dir.replace(/\\/g, '/') + '/clash' });
      assert.equal(final.status, state === 'clean' ? 0 : 1);
      assert.match(final.stdout, new RegExp('F50_UNINSTALL_STATE=' + state));
      assert.equal(final.stdout.includes('UNINSTALL_VERIFIED'), state === 'clean');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

test('UI controls and event entry points retain their IDs and handler counts', () => {
  const ids = text => [...text.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
  assert.deepEqual(ids(source).filter(id=>!id.startsWith('mm_gist_')), ids(original));
  const ui=fs.readFileSync(require('node:path').resolve(__dirname,'../../gist-sync/ui-gist.js'),'utf8');
  assert.deepEqual(ids(source).filter(id=>id.startsWith('mm_gist_')),ids(ui));
  assert.equal((source.match(/\.onclick\s*=/g) || []).length, (original.match(/\.onclick\s*=/g) || []).length+(ui.match(/\.onclick\s*=/g)||[]).length);
});

for (const outcome of ['success', 'error', 'cancel']) {
  test('shared button action releases lock and restores button on ' + outcome, async () => {
    const calls = [], button = {};
    const action = run(slice('const runCriticalButtonOperation', 'let advancedAccessCache') + 'runCriticalButtonOperation', {
      acquireCriticalOperation: () => { calls.push('acquire'); return {}; },
      releaseCriticalOperation: () => calls.push('release'),
      setButtonBusy: (b, busy) => { assert.equal(b, button); calls.push(busy ? 'busy' : 'ready'); },
    });
    const promise = action('test', button, 'busy', async () => {
      if (outcome !== 'success') throw Object.assign(new Error(outcome), { name: outcome === 'cancel' ? 'OperationCancelled' : 'Error' });
      return true;
    });
    if (outcome === 'success') assert.equal(await promise, true);
    else await assert.rejects(promise, { name: outcome === 'cancel' ? 'OperationCancelled' : 'Error' });
    assert.deepEqual(calls, ['acquire', 'busy', 'ready', 'release']);
  });
}
