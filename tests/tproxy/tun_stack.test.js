'use strict';

// TUN 协议栈选择与启动脚本的阶段错误：确认 auto 回退、版本门槛、非法值，
// 以及每个函数都能独立拿到 CLASH_ROOT（不再依赖上一个函数留下的全局变量）。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, '猫猫TProxy.js'), 'utf8').replace(/\r\n/g, '\n');
const unix = process.platform !== 'win32';
const quote = (value) => `'${String(value).replace(/'/g, `'"'"'`)}'`;
const helpers = vm.runInNewContext(
  source.slice(source.indexOf('function buildF50Tun6CompatFunctions()'), source.indexOf('function buildF50Ipv6DnsCompatFunctions()'))
  + '\nbuildF50Tun6CompatFunctions()',
  { F50_MIPS_MIN_VERSION: '1.19.31', F50_ROOT_FALLBACK: source.match(/const F50_ROOT_FALLBACK = '([^']+)';/)[1] },
);
const yq = process.env.F50_TEST_YQ;

function fixture({ mode = 'tun', ipv6 = 'off', stack = 'auto', version = 'v1.19.32' } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-tun6-'));
  fs.mkdirSync(path.join(dir, 'Policy'));
  fs.mkdirSync(path.join(dir, 'Proxy'));
  fs.mkdirSync(path.join(dir, 'Tools'));
  fs.writeFileSync(path.join(dir, 'Policy/options.conf'),
    `traffic_mode=${mode}\nipv6=${ipv6}\ntun_stack=${stack}\n`);
  const core = path.join(dir, 'Proxy/Clash.Core');
  fs.writeFileSync(core, `#!/bin/sh\necho "Mihomo ${version}"\n`);
  fs.chmodSync(core, 0o755);
  if (yq) {
    fs.copyFileSync(yq, path.join(dir, 'Tools/yq_linux_arm64'));
    fs.chmodSync(path.join(dir, 'Tools/yq_linux_arm64'), 0o755);
  }
  return dir;
}

function run(dir, body) {
  const result = spawnSync('sh', ['-s'], {
    encoding: 'utf8',
    input: `${helpers}\nexport CLASH_ROOT=${quote(dir)}\n${body}\n`,
    timeout: 15000,
  });
  return { status: result.status, out: `${result.stdout || ''}${result.stderr || ''}` };
}

const check = (dir) => run(dir, 'f50_check_tun_stack start\necho "RC=$?"\necho "STACK=$F50_SELECTED_TUN_STACK"');

for (const spec of [
  { name: 'auto + 新版内核 selected mips', options: {}, expectStack: 'mips', expectRc: 0 },
  { name: 'auto + IPv4 旧内核回退 mixed', options: { version: 'v1.19.30' }, expectStack: 'mixed', expectRc: 0, fallback: true },
  { name: 'auto + IPv6 旧内核回退 gvisor', options: { ipv6: 'on', version: 'v1.19.30' }, expectStack: 'gvisor', expectRc: 0, fallback: true },
  { name: '显式 mixed 不探版本', options: { stack: 'mixed', version: 'v1.19.30' }, expectStack: 'mixed', expectRc: 0 },
]) {
  test(`check_tun_stack: ${spec.name}`, { skip: !unix }, () => {
    const dir = fixture(spec.options);
    try {
      const result = check(dir);
      assert.equal(result.status, 0, result.out);
      assert.match(result.out, new RegExp(`RC=${spec.expectRc}`));
      assert.match(result.out, new RegExp(`STACK=${spec.expectStack}`));
      if (spec.fallback) assert.match(result.out, /F50_TUN_AUTO_FALLBACK=/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

test('check_tun_stack: 显式 mips 在旧内核上直接失败', { skip: !unix }, () => {
  const dir = fixture({ stack: 'mips', version: 'v1.19.30' });
  try {
    const result = check(dir);
    assert.equal(result.status, 0, result.out);
    assert.match(result.out, /RC=1/);
    assert.match(result.out, /mips_requires_mihomo_1\.19\.31/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('check_tun_stack: 非法 stack 报错', { skip: !unix }, () => {
  const dir = fixture({ stack: 'weird' });
  try {
    const result = check(dir);
    assert.equal(result.status, 0, result.out);
    assert.match(result.out, /RC=1/);
    assert.match(result.out, /F50_ERROR=invalid_tun_stack/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('check_tun_stack: 非 TUN 模式不选栈', { skip: !unix }, () => {
  const dir = fixture({ mode: 'tproxy' });
  try {
    const result = check(dir);
    assert.equal(result.status, 0, result.out);
    assert.match(result.out, /STACK=\s*$/m);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('prepare_tun_stack: 单独调用也能定位 CLASH_ROOT', { skip: !unix || !yq }, () => {
  const dir = fixture({ stack: 'mixed' });
  try {
    fs.writeFileSync(path.join(dir, 'Proxy/config.yaml'), 'tun:\n  enable: true\n  stack: mixed\n');
    // 不先跑 check_tun_stack，直接给选中值，模拟调用顺序变化。
    const result = run(dir, 'F50_SELECTED_TUN_STACK=mixed\nf50_prepare_tun_stack start\necho "RC=$?"');
    assert.equal(result.status, 0, result.out);
    assert.match(result.out, /RC=0/);
    assert.doesNotMatch(result.out, /tun_config_mismatch/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('finish_tun_stack: 失败阶段有独立错误码', { skip: !unix }, () => {
  const dir = fixture({ stack: 'mixed' });
  try {
    const applyFails = run(dir, 'f50_run_controller() { return 1; }\nF50_SELECTED_TUN_STACK=mixed\nf50_finish_tun_stack');
    assert.match(applyFails.out, /F50_ERROR=tun_policy_apply_failed/);
    const verifyFails = run(dir, [
      'f50_run_controller() { [ "$2" != verify ]; }',
      'f50_tun6_return_route() { return 0; }',
      'F50_SELECTED_TUN_STACK=mixed',
      'f50_finish_tun_stack',
    ].join('\n'));
    assert.match(verifyFails.out, /F50_ERROR=tun_policy_verify_failed/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
