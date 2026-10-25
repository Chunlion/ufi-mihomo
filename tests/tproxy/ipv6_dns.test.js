'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, '猫猫TProxy.js'), 'utf8').replace(/\r\n/g, '\n');
const quote = value => `'${value.replace(/\\/g, '/').replace(/'/g, `'"'"'`)}'`;
const helpers = vm.runInNewContext(source.slice(source.indexOf('function buildF50Ipv6DnsCompatFunctions()'), source.indexOf('function buildF50InspectHelpers()')) + '\nbuildF50Ipv6DnsCompatFunctions()', { F50_ROOT_FALLBACK: source.match(/const F50_ROOT_FALLBACK = '([^']+)';/)[1] });
function fixture({ mode = 'tproxy', capability = 'missing', backendRc = 0, restoreRc = 0, missingRule = false, privateRoute = false, pending = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-dns6-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  fs.mkdirSync(path.join(dir, 'Policy'));
  const options = `traffic_mode=${mode}\nipv6=on\ndns_hijack=on\ndns_port=1053\nprivate_route_enabled=${privateRoute ? 'on' : 'off'}\nprivate_route_cidrs=192.168.11.0/24 fd00::/64\n`;
  fs.writeFileSync(path.join(dir, 'Policy/options.conf'), pending ? options.replace('dns_hijack=on', 'dns_hijack=off') : options);
  if (pending) fs.writeFileSync(path.join(dir, 'Policy/options.conf.ipv6_dns'), options);
  fs.writeFileSync(path.join(dir, 'Policy/device_bypass.txt'), '192.168.0.248\n192.168.1.0/24\n00:11:22:33:44:55\nfd00::1\n');
  function executable(name, code) { const file = path.join(bin, name); fs.writeFileSync(file, '#!/bin/sh\n' + code); fs.chmodSync(file, 0o755); }
  executable('ip6tables', capability === 'available' ? 'exit 0\n' : `echo '${capability === 'missing' ? 'Table does not exist' : 'xtables lock is busy'}' >&2\nexit 3\n`);
  executable('backend', `grep '^dns_hijack=' "$CLASH_ROOT/Policy/options.conf" > "$CLASH_ROOT/observed"\nexit ${backendRc}\n`);
  executable('iptables', `case "$*" in
    '-w 5 -t mangle -S PREROUTING') echo '-A PREROUTING -i br0 -j KANO_F50_PRE';;
    '-w 5 -t nat -S') echo '-A PREROUTING -i br0 -p udp --dport 53 -j KANO_F50_DNS';;
    '-w 5 -t nat -C '*) exit ${missingRule ? 1 : 0};;
    *) exit 9;;
  esac\n`);
  executable('iptables-restore', `cat > "$CLASH_ROOT/plan"\nexit ${restoreRc}\n`);
  const invoke = action => spawnSync('sh', ['-s'], { encoding: 'utf8', input: `${helpers}\nexport CLASH_ROOT=${quote(dir)} PATH=${quote(bin)}:"$PATH"\nbinary=${quote(path.join(bin, 'backend'))}\nf50_run_controller ${action}\n`, timeout: 10000 });
  return { dir, options, invoke, read: name => fs.readFileSync(path.join(dir, name), 'utf8'), close: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
test('missing IPv6 NAT retains the saved flag and applies only owned IPv4 DNS rules', () => {
  const f = fixture();
  try {
    const result = f.invoke('start');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.read('observed').trim(), 'dns_hijack=off');
    assert.equal(f.read('Policy/options.conf'), f.options);
    const plan = f.read('plan');
    assert.match(plan, /^\*nat\n:KANO_F50_DNS/m);
    assert.match(plan, /-s 192\.168\.0\.248.*ACCEPT/);
    assert.match(plan, /--mac-source 00:11:22:33:44:55/);
    assert.match(plan, /-s 192\.168\.1\.0\/24/);
    assert.doesNotMatch(plan, /fd00|flush|\*-mangle/);
    assert.match(plan, /-D PREROUTING.*KANO_F50_DNS/);
    assert.match(result.stdout, /F50_IPV4_DNS_VERIFIED=1/);
    assert.equal(fs.existsSync(path.join(f.dir, 'Policy/options.conf.ipv6_dns')), false);
  } finally { f.close(); }
});
test('TUN keeps private-target DNS exemptions and pauses the device bypass list', () => {
  const f = fixture({ mode: 'tun', privateRoute: true });
  try {
    const result = f.invoke('policy apply');
    assert.equal(result.status, 0, result.stderr);
    assert.match(f.read('plan'), /-d 192\.168\.11\.0\/24 -j ACCEPT/);
    assert.doesNotMatch(f.read('plan'), /-s 192\.168\.0\.248|fd00/);
  } finally { f.close(); }
});

for (const address of ['192.168.0.1 -j ACCEPT', '256.1.2.3', '1.2.3.4/33', '1.2.3.4/24/0', '1.2.3.4\t-j\tACCEPT']) {
  for (const mode of ['tproxy', 'tun']) test(`DNS rejects malformed ${mode} address before restore / ${address}`, () => {
    const f = fixture({ mode, privateRoute: true });
    try {
      if (mode === 'tproxy') fs.writeFileSync(path.join(f.dir, 'Policy/device_bypass.txt'), address + '\n');
      else fs.writeFileSync(path.join(f.dir, 'Policy/options.conf'), f.options.replace('192.168.11.0/24 fd00::/64', address));
      const before = f.read('Policy/options.conf'), result = f.invoke('start');
      assert.notEqual(result.status, 0);
      assert.match(result.stdout, /F50_ERROR=invalid_dns_/);
      assert.equal(fs.existsSync(path.join(f.dir, 'plan')), false);
      assert.equal(f.read('Policy/options.conf'), before);
    } finally { f.close(); }
  });
}
for (const capability of ['available', 'transient']) test(`${capability} IPv6 NAT follows the existing controller path`, () => {
  const f = fixture({ capability });
  try {
    assert.equal(f.invoke('start').status, 0);
    assert.equal(f.read('observed').trim(), 'dns_hijack=on');
    assert.equal(fs.existsSync(path.join(f.dir, 'plan')), false);
  } finally { f.close(); }
});
for (const spec of [{ backendRc: 23 }, { restoreRc: 7 }, { missingRule: true }]) test(`failure restores preferences and is reported: ${JSON.stringify(spec)}`, () => {
  const f = fixture(spec);
  try {
    const result = f.invoke('start');
    assert.notEqual(result.status, 0);
    if (spec.backendRc) assert.equal(result.status, spec.backendRc);
    assert.equal(f.read('Policy/options.conf'), f.options);
    assert.equal(fs.existsSync(path.join(f.dir, 'Policy/options.conf.ipv6_dns')), false);
  } finally { f.close(); }
});
test('boot recovers an interrupted options transaction before invoking the controller', () => {
  const f = fixture({ pending: true });
  try { assert.equal(f.invoke('boot').status, 0); assert.equal(f.read('Policy/options.conf'), f.options); }
  finally { f.close(); }
});
test('policy verification checks IPv4 rules without rebuilding them', () => {
  const f = fixture();
  try { assert.equal(f.invoke('policy verify').status, 0); assert.equal(fs.existsSync(path.join(f.dir, 'plan')), false); }
  finally { f.close(); }
});
test('the settings probe preserves the requested DNS preference', async () => {
  const toasts = [];
  const normalize = vm.runInNewContext(source.slice(source.indexOf('async function normalizeIpv6DnsCapability('), source.indexOf('const policyTransactionFiles')) + '\nnormalizeIpv6DnsCapability', { runShellWithRoot: async () => ({ success: true, content: 'F50_IPV6_NAT=0' }), createToast: (text, color) => toasts.push([text, color]) });
  const state = { options: { ipv6: 'on', dns_hijack: 'on' } };
  await normalize(state);
  // 探测只提示不修改：DNS 偏好必须原样保留，并弹一次说明。
  assert.equal(state.options.dns_hijack, 'on');
  assert.equal(toasts.length, 1);
});
const tunHelpers = vm.runInNewContext(source.match(/const F50_MIPS_MIN_VERSION = '[^']+';/)[0] + '\n' + source.match(/const F50_ROOT_FALLBACK = '[^']+';/)[0] + '\n' + source.slice(source.indexOf('function buildF50Tun6CompatFunctions()'), source.indexOf('function buildF50Ipv6DnsCompatFunctions()')) + '\nbuildF50Tun6CompatFunctions()');
function tunFixture(coreRc = 0, version = 'Mihomo Meta v1.19.32 android arm64', stack = 'auto') {
  const f = fixture({ mode: 'tun' });
  fs.mkdirSync(path.join(f.dir, 'Proxy'));
  fs.mkdirSync(path.join(f.dir, 'Tools'));
  fs.appendFileSync(path.join(f.dir, 'Policy/options.conf'), `tun_stack=${stack}\n`);
  fs.writeFileSync(path.join(f.dir, 'Proxy/config.yaml'), 'stack: mixed\n');
  fs.writeFileSync(path.join(f.dir, 'Tools/yq_linux_arm64'), `#!/bin/sh\ncase "$*" in\n  *'.tun.enable == true'*) exit 0;;\n  *'.tun.stack == strenv(F50_TUN_STACK)'*) exit 1;;\n  *) printf 'stack: %s\\n' "$F50_TUN_STACK";;\nesac\n`);
  fs.writeFileSync(path.join(f.dir, 'Proxy/Clash.Core'), `#!/bin/sh\nif [ "$1" = -v ]; then echo '${version}'; exit 0; fi\nexit ${coreRc}\n`);
  for (const file of ['Tools/yq_linux_arm64', 'Proxy/Clash.Core']) fs.chmodSync(path.join(f.dir, file), 0o755);
  f.tunInvoke = tail => spawnSync('sh', ['-s'], { encoding: 'utf8', input: `${tunHelpers}\nexport CLASH_ROOT=${quote(f.dir)}\n${tail}\n` });
  return f;
}
test('TUN6 validates the candidate and requests reload before rebuilding routing', () => {
  const f = tunFixture();
  try {
    const result = f.tunInvoke('f50_run_controller() { echo "CONTROLLER=$*"; }\nf50_check_tun_stack restart && f50_prepare_tun_stack restart && echo "RELOAD=$F50_CONFIG_RELOAD_REQUIRED" && f50_finish_tun_stack');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.read('Proxy/config.yaml'), 'stack: mips\n');
    assert.match(result.stdout, /RELOAD=1\nCONTROLLER=policy apply\nCONTROLLER=policy verify/);
    assert.equal(f.read('Policy/options.conf'), f.options + 'tun_stack=auto\n');
  } finally { f.close(); }
});
test('TUN6 rejects an invalid candidate without replacing the configuration', () => {
  const f = tunFixture(9);
  try {
    const result = f.tunInvoke('f50_check_tun_stack boot && f50_prepare_tun_stack boot');
    assert.notEqual(result.status, 0);
    assert.equal(f.read('Proxy/config.yaml'), 'stack: mixed\n');
    assert.match(result.stdout, /F50_ERROR=tun_stack_prepare_failed/);
    assert.equal(fs.readdirSync(path.join(f.dir, 'Proxy')).some(file => file.includes('.tun6.')), false);
  } finally { f.close(); }
});
test('TUN6 does not report readiness when rebuilt routing verification fails', () => {
  const f = tunFixture();
  try {
    const result = f.tunInvoke('f50_run_controller() { [ "$2" != verify ]; }\nf50_check_tun_stack boot && f50_finish_tun_stack');
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(result.stdout, /F50_TUN_STACK_READY/);
  } finally { f.close(); }
});
const tunRouteMock = `ip() {
  printf '%s\\n' "$*" >> "$CLASH_ROOT/ip-calls"
  case "$*" in
    '-6 -o addr show dev KanoTun scope global')
      printf '%s\\n' '95: KanoTun inet6 fdfe:dcba:9876::1/126 scope global' '95: KanoTun inet6 fe80::1/64 scope link';;
    '-6 route replace fdfe:dcba:9876::1/126 dev KanoTun table 17667 proto 242')
      [ "\${ROUTE_FAIL:-0}" = 0 ] || return 7
      echo 'fdfe:dcba:9876::/126 dev KanoTun proto 242 metric 1024' > "$CLASH_ROOT/return-route";;
    '-6 route show table 17667 exact fdfe:dcba:9876::1/126')
      [ ! -r "$CLASH_ROOT/return-route" ] || cat "$CLASH_ROOT/return-route";;
    *) return 9;;
  esac
}`;
for (const stack of ['system', 'mixed']) test(`${stack} restores the IPv6 TUN return route after startup and policy apply`, () => {
  const f = tunFixture(0, 'v1.19.32', stack);
  try {
    const result = f.tunInvoke(`${tunRouteMock}\nf50_run_controller() { echo "CONTROLLER=$*"; }\nf50_check_tun_stack restart && f50_finish_tun_stack && f50_prepare_tun_stack policy apply && f50_prepare_tun_stack policy verify`);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, new RegExp(`F50_TUN_STACK_READY=${stack}`));
    assert.equal(f.read('ip-calls').split('\n').filter(line => line.includes(' route replace ')).length, 2);
    assert.doesNotMatch(f.read('ip-calls'), /replace fe80|rule |flush|table 2022/);
    assert.equal(f.read('Policy/options.conf'), f.options + `tun_stack=${stack}\n`);
  } finally { f.close(); }
});
test('IPv6 TUN route verification detects a missing route without repairing it', () => {
  const f = tunFixture(0, 'v1.19.32', 'system');
  try {
    const result = f.tunInvoke(`${tunRouteMock}\nf50_prepare_tun_stack policy verify`);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /F50_ERROR=tun6_return_route_missing/);
    assert.doesNotMatch(f.read('ip-calls'), /replace/);
  } finally { f.close(); }
});
test('IPv6 TUN route failures prevent readiness', () => {
  const f = tunFixture(0, 'v1.19.32', 'mixed');
  try {
    const result = f.tunInvoke(`${tunRouteMock}\nROUTE_FAIL=1\nf50_run_controller() { return 0; }\nf50_check_tun_stack restart && f50_finish_tun_stack`);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /F50_ERROR=tun6_return_route_failed/);
    assert.doesNotMatch(result.stdout, /F50_TUN_STACK_READY/);
  } finally { f.close(); }
});
test('IPv6 TUN route repair rejects an absent TUN address', () => {
  const f = tunFixture(0, 'v1.19.32', 'system');
  try {
    const result = f.tunInvoke('ip() { return 0; }\nf50_prepare_tun_stack policy apply');
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /F50_ERROR=tun6_address_missing/);
  } finally { f.close(); }
});
test('IPv6 TUN return-route repair leaves other stacks and modes unchanged', () => {
  for (const [mode, ipv6, stack] of [['tun', 'on', 'mips'], ['tun', 'on', 'gvisor'], ['tun', 'off', 'system'], ['tproxy', 'on', 'mixed']]) {
    const f = tunFixture(0, 'v1.19.32', stack);
    try {
      fs.writeFileSync(path.join(f.dir, 'Policy/options.conf'), `traffic_mode=${mode}\nipv6=${ipv6}\ntun_stack=${stack}\n`);
      const result = f.tunInvoke(`${tunRouteMock}\nf50_prepare_tun_stack policy apply`);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(fs.existsSync(path.join(f.dir, 'ip-calls')), false);
    } finally { f.close(); }
  }
});
for (const [version, supported] of [['v1.19.30', false], ['v1.19.31', true], ['v1.19.32', true], ['v1.20.0', true], ['v1.9.99', false], ['Alpha-unknown', false]]) test(`mips version gate: ${version}`, () => {
  const f = tunFixture(0, 'Mihomo Meta ' + version, 'mips');
  try {
    const result = f.tunInvoke('f50_check_tun_stack restart && f50_prepare_tun_stack restart');
    assert.equal(result.status === 0, supported, result.stdout + result.stderr);
    assert.equal(f.read('Proxy/config.yaml'), supported ? 'stack: mips\n' : 'stack: mixed\n');
    if (!supported) assert.match(result.stdout, /F50_ERROR=mips_requires/);
  } finally { f.close(); }
});
for (const stack of ['mixed', 'system', 'gvisor']) test(`explicit ${stack} survives the legacy controller profile`, () => {
  const f = tunFixture(0, 'v1.19.32', stack);
  try {
    const result = f.tunInvoke('f50_check_tun_stack restart && f50_prepare_tun_stack restart');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.read('Proxy/config.yaml'), `stack: ${stack}\n`);
  } finally { f.close(); }
});
test('settings reject unsupported mips before any saved-state operation', async () => {
  let probes = 0;
  const verify = vm.runInNewContext(source.slice(source.indexOf('const F50_MIPS_MIN_VERSION'), source.indexOf('const F50_DEFAULT_SECRET')) + '\n' + source.slice(source.indexOf('async function verifyF50TunStack('), source.indexOf('const policyTransactionFiles')) + '\nverifyF50TunStack', {
    buildF50Tun6CompatFunctions: () => tunHelpers,
    runShellWithRoot: async () => { probes++; return { success: true, content: 'F50_ERROR=mips_requires_mihomo_1.19.31' }; },
  });
  await verify({ traffic_mode: 'tun', ipv6: 'on', tun_stack: 'auto' });
  assert.equal(probes, 1);
  await assert.rejects(verify({ traffic_mode: 'tun', tun_stack: 'mips' }), /v1\.19\.31/);
  assert.equal(probes, 2);
  const save = source.slice(source.indexOf('async function kprSaveNetworkState('), source.indexOf('async function kprSaveNetworkState(') + 6500);
  assert.ok(save.indexOf('await kprShapeRuntimeConfig') < save.indexOf('saved = true'));
  const shape = source.slice(source.indexOf('async function kprShapeRuntimeConfig('), source.indexOf('async function writeYamlObjectAtomic('));
  assert.ok(shape.indexOf('await verifyF50TunStack(options)') < shape.indexOf('ensureOriginalSubscriptionService()'));
});
for (const [version, ipv6, expected] of [['v1.19.32', 'on', 'mips'], ['v1.19.32', 'off', 'mips'], ['v1.19.30', 'on', 'gvisor'], ['v1.19.30', 'off', 'mixed'], ['Alpha-unknown', 'on', 'gvisor']]) test(`automatic ${version} IPv6=${ipv6} selects ${expected}`, () => {
  const f = tunFixture(0, 'Mihomo Meta ' + version);
  try {
    const options = f.read('Policy/options.conf').replace('ipv6=on', 'ipv6=' + ipv6);
    fs.writeFileSync(path.join(f.dir, 'Policy/options.conf'), options);
    const result = f.tunInvoke('f50_check_tun_stack restart && f50_prepare_tun_stack restart');
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(f.read('Proxy/config.yaml'), `stack: ${expected}\n`);
    assert.equal(f.read('Policy/options.conf'), options);
    assert.doesNotMatch(result.stdout, /F50_ERROR=/);
    if (expected !== 'mips') assert.match(result.stdout, new RegExp(`F50_TUN_AUTO_FALLBACK=${expected}`));
  } finally { f.close(); }
});
test('automatic mode stops when executing the core version probe fails', () => {
  const f = tunFixture();
  try {
    fs.writeFileSync(path.join(f.dir, 'Proxy/Clash.Core'), '#!/bin/sh\nexit 5\n');
    const result = f.tunInvoke('f50_check_tun_stack restart && f50_prepare_tun_stack restart');
    assert.equal(result.status, 2);
    assert.match(result.stdout, /mips_core_version_unavailable/);
    assert.equal(f.read('Proxy/config.yaml'), 'stack: mixed\n');
  } finally { f.close(); }
});
test('automatic settings resolve mips without changing the saved preference', async () => {
  let probes = 0;
  const verify = vm.runInNewContext(source.slice(source.indexOf('const F50_MIPS_MIN_VERSION'), source.indexOf('const F50_DEFAULT_SECRET')) + '\n' + source.slice(source.indexOf('async function verifyF50TunStack('), source.indexOf('const policyTransactionFiles')) + '\nverifyF50TunStack', {
    buildF50Tun6CompatFunctions: () => tunHelpers,
    runShellWithRoot: async () => { probes++; return { success: true, content: 'F50_MIPS_VERSION_OK=1' }; },
  });
  const options = { traffic_mode: 'tun', ipv6: 'on', tun_stack: 'auto' };
  assert.equal(await verify(options), 'mips');
  assert.equal(options.tun_stack, 'auto');
  assert.equal(await verify({ ...options, tun_stack: 'gvisor' }), 'gvisor');
  assert.equal(probes, 1);
});
test('settings do not treat a failed version read as an old kernel', async () => {
  const verify = vm.runInNewContext(source.slice(source.indexOf('const F50_MIPS_MIN_VERSION'), source.indexOf('const F50_DEFAULT_SECRET')) + '\n' + source.slice(source.indexOf('async function verifyF50TunStack('), source.indexOf('const policyTransactionFiles')) + '\nverifyF50TunStack', {
    buildF50Tun6CompatFunctions: () => tunHelpers,
    runShellWithRoot: async () => ({ success: true, content: 'F50_ERROR=mips_core_version_unavailable' }),
  });
  await assert.rejects(verify({ traffic_mode: 'tun', tun_stack: 'auto' }), /无法检查/);
});
