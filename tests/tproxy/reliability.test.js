'use strict';

const test = require('node:test');
const { spawnSync } = require('node:child_process');
const { Worker: NodeWorker } = require('node:worker_threads');
const { fs, path, assert, slice, run, shell, shellApi, source, plain, quote, temp, write } = require('./optimization_harness');
const api = shellApi(), yq = process.env.F50_TEST_YQ;

test('all final operation shells parse in sh and BusyBox ash', () => {
  const scripts = [api.install('/data/upload.zip'), api.start('start'), api.start('restart'),
    api.emergency('', true), api.patch("'/data/clash/Scripts/Clash.Service'"),
    api.inspect(), api.cleanup(), api.final(), ...api.uninstall().map(item => item.script)];
  for (const script of scripts) for (const [bin, args] of [['sh', ['-n']], [process.env.F50_BUSYBOX || 'busybox', ['ash', '-n']]]) {
    const result = spawnSync(bin, args, { input: script, encoding: 'utf8' });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
  }
});

const packaged = spawnSync('tar', ['-xOf', 'tproxy-yq.zip', 'Scripts/Clash.Service'], { encoding: 'utf8' });
assert.equal(packaged.status, 0, packaged.stderr);
const service = packaged.stdout.replace(/\r\n/g, '\n');
for (const stage of ['tun', 'original', 'audit5', 'tun6', 'dns']) {
  test('Service candidate failure at ' + stage + ' preserves the complete original', () => {
    const dir = temp();
    try {
      let before = service.replace('# KANO_TUN_RULE_CLEANUP=2', '# KANO_TUN_RULE_CLEANUP=1');
      if (stage === 'original') before = before.replace('# KANO_ORIGINAL_CONFIG_PRESERVATION=13', '# KANO_ORIGINAL_CONFIG_PRESERVATION=12');
      if (stage === 'audit5') before = before.replace('# KANO_CURL_ABSOLUTE=1', '# KANO_CURL_ABSOLUTE=0');
      if (stage === 'tun6') before = before.replace('# KANO_TUN_IPV6_RETURN=2', '# KANO_TUN_IPV6_RETURN=1');
      if (stage === 'dns') before = before.replace('# KANO_IPV6_DNS_SPLIT=1', '# KANO_IPV6_DNS_SPLIT=0');
      const file = write(dir, 'Clash.Service', before);
      const fail = `awk() { for arg in "$@"; do case "$arg" in *candidate.${stage}.*.functions) echo INJECTED_STAGE=${stage} >&2; return 1;; esac; done; command awk "$@"; }\n`;
      const result = shell(fail + api.patch(quote(file)));
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stdout + result.stderr, new RegExp('INJECTED_STAGE=' + stage));
      assert.equal(fs.readFileSync(file, 'utf8'), before);
      assert.deepEqual(fs.readdirSync(dir), ['Clash.Service']);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}
test('Service patch is idempotent and preserves file permissions', () => {
  const dir = temp();
  try {
    const file = write(dir, 'Clash.Service', service.replace('# KANO_TUN_RULE_CLEANUP=2', '# KANO_TUN_RULE_CLEANUP=1'));
    fs.chmodSync(file, 0o700);
    assert.equal(shell(api.patch(quote(file))).status, 0);
    const before = fs.readFileSync(file, 'utf8'), stat = fs.statSync(file);
    assert.equal(shell(api.patch(quote(file))).status, 0);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
    assert.equal(fs.statSync(file).ino, stat.ino);
    if (process.platform !== 'win32') assert.equal(fs.statSync(file).mode & 0o777, 0o700);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const [html,asset,accepted] of [
 ['<title>zashboard</title><script src="./assets/main.js"></script>','assets/main.js',true],
 ["<title>Zashboard</title><script src='/app.mjs?v=2'></script>",'app.mjs',true],
 ['<title>zashboard</title><script src="missing.js"></script>',null,false],
 ['<title>metacubexd</title><script src="main.js"></script>','main.js',false],
]) test('panel identity and referenced resource '+html,()=>{
 const dir=temp();try{
  const ui=path.join(dir,'Proxy/WebUI/zashboard');write(ui,'index.html',html);
  if(asset)write(ui,asset,'export default {};');
  const result=shell(api.panelValidator()+'\nf50_validate_zashboard '+quote(ui));
  assert.equal(result.status,accepted?0:1,result.stdout+result.stderr);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

function yamlCommit(context = {}, prefix = '') {
  return run(slice('const yqExecutableCheckCmd', 'const readYamlObject')
    + slice('const commitStagedYaml', 'const kprBaseWriteYamlObjectAtomic') + 'commitStagedYaml', {
      shellQuote: quote, F50_DEFAULT_SECRET: '123456', prepareYqRuntimeCmd: () => ':',
      buildF50ConfigTransactionFunctions: api.transaction, invalidateStatusSnapshot() {},
      runShellWithRoot: async script => { const result = shell(prefix + script); return { success: result.status === 0, content: result.stdout + result.stderr }; },
      ...context,
    });
}
for (const fail of [false, true]) test('template/base pair commit ' + (fail ? 'rolls back both files' : 'commits both files'), { skip: !yq }, async () => {
  const dir = temp();
  try {
    const target = write(dir, 'Tools/template.yaml', 'old: template\n'), base = write(dir, 'Tools/template.base.yaml', 'old: base\n');
    const candidate = write(dir, 'candidate.yaml', 'new: template\n'), baseCandidate = write(dir, 'candidate.base.yaml', 'new: base\n');
    write(dir, 'Tools/yq_linux_arm64', `#!/bin/sh\nexec ${quote(yq)} "$@"\n`);
    fs.chmodSync(path.join(dir, 'Tools/yq_linux_arm64'), 0o755);
    const prefix = fail ? `mv() { if [ "$3" = ${quote(base)} ] && [ "$1" = -f ] && [ "\${failed_once:-0}" = 0 ]; then failed_once=1; return 1; fi; command mv "$@"; }\n` : '';
    const commit = yamlCommit({ CLASH_DIR: dir, CLASH_CONFIG: path.join(dir, 'Proxy/config.yaml'), CLASH_CONFIG_SOURCE_FILE: path.join(dir, 'Tools/config_source.conf') }, prefix);
    const result = await commit({ targetPath: target, stagePath: candidate, baseStagePath: baseCandidate, basePath: base });
    assert.equal(result.ok, !fail, result.content);
    assert.equal(fs.readFileSync(target, 'utf8'), fail ? 'old: template\n' : 'new: template\n');
    assert.equal(fs.readFileSync(base, 'utf8'), fail ? 'old: base\n' : 'new: base\n');
    assert.ok(!fs.existsSync(target + '.kano_tx'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const failure of ['', 'normalize', 'override', 'commit']) test('template regeneration candidate / ' + (failure || 'success'), async () => {
  const dir = temp();
  try {
    const template = write(dir, 'Tools/template.yaml', '{"old":"template"}'), base = write(dir, 'Tools/template.base.yaml', '{"old":"base"}');
    const config = write(dir, 'Proxy/config.yaml', 'old runtime');
    let overrideCalls = 0;
    const prepare = run(slice('const prepareTemplateFromBase', 'const applyJsOverrideToTemplate') + 'prepareTemplateFromBase', {
      CLASH_DIR: dir, CLASH_TEMPLATE: template, CLASH_TEMPLATE_BASE: base, shellQuote: quote,
      normalizeSubSourceList: items => items, createRandomString: () => 'fixture', createToast() {}, safeTextToHtml: String,
      runShellWithRoot: async script => { const r = shell(script); return { success: r.status === 0, content: r.stdout + r.stderr }; },
      ensureTemplateForF50: async (items, options) => { assert.notEqual(options.templatePath, template); return failure !== 'normalize'; },
      applyJsOverrideToTemplate: async options => { overrideCalls++; assert.equal(options.prepareTemplate, false); if (failure === 'override') return false; fs.writeFileSync(options.templatePath, '{"new":"overridden"}'); return true; },
      commitStagedYaml: async options => { if (failure === 'commit') return { ok: false }; fs.renameSync(options.stagePath, options.targetPath); return { ok: true }; },
    });
    assert.equal(await prepare([]), !failure);
    assert.equal(overrideCalls, failure === 'normalize' ? 0 : 1);
    assert.equal(fs.readFileSync(template, 'utf8'), failure ? '{"old":"template"}' : '{"new":"overridden"}');
    assert.equal(fs.readFileSync(base, 'utf8'), '{"old":"base"}');
    assert.equal(fs.readFileSync(config, 'utf8'), 'old runtime');
    assert.deepEqual(fs.readdirSync(path.dirname(template)), ['template.base.yaml', 'template.yaml']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

function overrideApi() {
  const blobs = new Map(); let sequence = 0;
  class Blob { constructor(parts) { this.text = parts.join(''); } }
  class Worker {
    constructor(url) {
      this.worker = new NodeWorker(`const {parentPort}=require('node:worker_threads'); globalThis.self=globalThis; self.postMessage=value=>parentPort.postMessage(value); ${blobs.get(url)}; parentPort.on('message', data=>self.onmessage({data}));`, { eval: true });
      this.worker.on('message', data => this.onmessage?.({ data }));
      this.worker.on('error', error => this.onerror?.(error));
    }
    postMessage(value) { this.worker.postMessage(value); }
    terminate() { this.worker.terminate(); }
  }
  const URL = { createObjectURL(blob) { const key = String(++sequence); blobs.set(key, blob.text); return key; }, revokeObjectURL(url) { blobs.delete(url); } };
  return run(slice('const normalizeOverrideJs', 'const readJsOverrideText')
    + slice('const runJsOverrideOnConfig', 'const prepareTemplateFromBase')
    + '({validate:validateOverrideJsSafety,apply:runJsOverrideOnConfig})', { Blob, Worker, URL, setTimeout, clearTimeout });
}
for (const code of [
  'function main(config) { config.rules = ["MATCH,DIRECT"]; return config; }',
  'module.exports = config => ({...config, rules:["MATCH,DIRECT"]});',
  'module.exports.default = config => ({...config, rules:["MATCH,DIRECT"]});',
  'exports.default = config => ({...config, rules:["MATCH,DIRECT"]});',
  'export default function main(config) { config.rules = ["MATCH,DIRECT"]; return config; }',
]) test('override Worker entry point ' + code.split('=')[0], async () => {
  const api = overrideApi();
  // module.exports.default requires a CommonJS exports object, matching desktop conventions.
  const result = await api.apply(code, { secret: '123456', rules: [] });
  assert.deepEqual(plain(result), { secret: '123456', rules: ['MATCH,DIRECT'] });
});
test('override validation blocks import, self and escaped spellings while accepting UTF-8 strings', () => {
  const api = overrideApi();
  for (const code of ['import("https://example.invalid/code.js")', 'self.fetch("x")', '\\u0073elf.fetch("x")', 'Object["\\x63onstructor"]']) assert.throws(() => api.validate(code), /被禁止/);
  assert.equal(api.validate('function main(config) { config.name="\\u4e2d"; return config; }').includes('\\u4e2d'), true);
});
for (const code of ['function main() { throw new Error("override failure"); }', 'function main() { return []; }', 'function main() { return {rules:"bad"}; }']) test('override rejects invalid result / ' + code, async () => {
  await assert.rejects(overrideApi().apply(code, {}));
});

function recoveryCase({ receipt = true, active = false, reused = false, foreign = false, background = false, transaction = false, legacy = false, reclaim = false } = {}) {
  const dir = temp(), proc = path.join(dir, 'proc'), root = path.join(dir, 'clash'), lease = path.join(dir, 'lease'), tasks = path.join(dir, 'tasks');
  fs.mkdirSync(proc); fs.mkdirSync(root);
  write(dir, 'lease/owner', 'mm_fixture\n'); write(dir, 'lease/frontend', 'mm_fixture 0\n');
  const record = legacy ? '111\n' : `F50_TASK_V2 ${foreign ? 'mm_foreign' : 'mm_fixture'} mm_fixture.1 111 21 222 22 ${receipt ? 'finished' : 'running'} 0\n`;
  write(dir, 'tasks/mm_fixture.1', record);
  if (active || reused) {
    write(proc, '111/stat', `111 (sh) S ${Array(18).fill('0').join(' ')} ${reused ? 99 : 21}\n`);
    write(proc, '111/comm', 'sh\n'); write(proc, '111/environ', reused ? 'OTHER=foreign\0' : 'KANO_TPROXY_TASK=mm_fixture\0');
  }
  if (transaction) write(root, 'Tools/template.yaml.kano_tx/ready', '');
  if (background) {
    write(proc, '333/stat', `333 (curl) S ${Array(18).fill('0').join(' ')} 31\n`);
    write(proc, '333/comm', 'curl\n'); write(proc, '333/environ', 'KANO_TPROXY_TASK=mm_fixture\0');
  }
  const result = shell(api.maintenance('cleanup') + api.eligibility() + `\nemergency_locked=${reclaim ? 1 : 0}\nf50_recovery_eligible`, {
    F50_ROOT: root, F50_PROC: proc, F50_OPERATION_LOCK: lease, F50_TASK_DIR: tasks,
  });
  return { dir, tasks, record, result };
}
for (const [options, eligible, state] of [
  [{}, true, 'quiescent_lease'], [{ reclaim: true }, true, 'quiescent_lease'],
  [{ active: true }, false, 'active_task'], [{ reused: true }, true, 'quiescent_lease'],
  [{ receipt: false }, false, 'task_receipt_missing'], [{ foreign: true }, false, 'task_owner_mismatch'],
  [{ transaction: true }, false, 'config_transaction_unresolved'], [{ legacy: true }, false, 'stale_task_record'],
  [{ background: true }, false, 'unreceipted_active_task'],
]) test('recovery registry / ' + JSON.stringify(options), () => {
  const c = recoveryCase(options);
  try {
    assert.equal(c.result.status, eligible ? 0 : 1, c.result.stdout + c.result.stderr);
    assert.match(c.result.stdout, new RegExp('F50_RECOVERY_STATE=' + state));
    if (options.reclaim && eligible) assert.ok(!fs.existsSync(c.tasks));
    else assert.equal(fs.readFileSync(path.join(c.tasks, 'mm_fixture.1'), 'utf8'), c.record);
  } finally { fs.rmSync(c.dir, { recursive: true, force: true }); }
});

for (const outcome of ['idle', 'active', 'retry_busy', 'recovery_timeout', 'owned_busy', 'normal']) {
  test('uninstall busy lease recovery / ' + outcome, async () => {
    const op = { token: { id: 'uninstall' }, requests: 0, leaseOwned: outcome === 'owned_busy' };
    const stages = [], recovery = [];
    const sandbox = {
      activeCriticalOperation: op, lastInstallDiagnostic: null,
      operationStage() {}, operationCancelled: () => Object.assign(new Error('cancelled'), { name: 'OperationCancelled' }),
      f50UnknownCompletion: (operation, cause) => {
        operation.uncertain = true;
        operation.token.cancelled = true;
        return Object.assign(new Error(String(cause)), { name: 'OperationCancelled' });
      },
      buildUninstallStages: () => ['stop', 'boot', 'delete'].map(title => ({ title, script: title, timeout: 60000 })),
      buildF50EmergencyScript: (tag, requireIdle) => {
        assert.equal(tag, ''); assert.equal(requireIdle, true); return 'RECOVER_IDLE';
      },
      buildF50FinalCheckScript: () => 'FINAL_CHECK',
      f50Diagnostic: detail => ({ details: detail }),
      f50UninstallVerdict: response => ({ ok: response.content === 'clean', code: response.content, detail: response.content }),
      runShellWithRoot: async script => {
        stages.push(script);
        if (stages.length === 1 && outcome !== 'normal') {
          op.leasePromise = Promise.resolve(false);
          return { success: false, content: 'F50_OPERATION_BUSY' };
        }
        if (stages.length === 2 && outcome !== 'normal') assert.equal(op.leasePromise, null);
        return outcome === 'retry_busy' ? { success: false, content: 'F50_OPERATION_BUSY' } : { success: true, content: 'done' };
      },
      hostRunShellWithRoot: async script => {
        if (script === 'FINAL_CHECK') return { success: true, content: stages.includes('delete') ? 'clean' : 'residual' };
        assert.equal(script, 'RECOVER_IDLE'); recovery.push(script);
        if (outcome === 'recovery_timeout') throw new Error('transport timeout');
        return outcome === 'active' ? { success: false, content: 'F50_RECOVERY_STATE=active_task' }
          : { success: true, content: 'RECOVERY_VERIFIED' };
      },
    };
    const uninstall = run(slice('async function performF50Uninstall()', 'async function f50Command') + 'performF50Uninstall', sandbox);
    if (outcome === 'recovery_timeout') {
      await assert.rejects(uninstall(), { name: 'OperationCancelled' });
      assert.equal(op.uncertain, true);
    } else {
      const result = await uninstall();
      assert.equal(result.ok, ['idle', 'normal'].includes(outcome));
      if (!result.ok) assert.match(result.summary, /卸载未执行.*操作锁/);
      if (outcome === 'active') assert.match(result.details, /F50_RECOVERY_STATE=active_task/);
    }
    assert.deepEqual(stages, outcome === 'normal' ? ['stop', 'boot', 'delete']
      : outcome === 'idle' ? ['stop', 'stop', 'boot', 'delete']
      : outcome === 'retry_busy' ? ['stop', 'stop'] : ['stop']);
    assert.equal(recovery.length, ['normal', 'owned_busy'].includes(outcome) ? 0 : 1);
  });
}

for (const outcome of ['completed', 'cancelled_before', 'cancelled_during', 'missing_receipt', 'timeout', 'other_page_busy']) {
  test('browser task ownership and receipt / ' + outcome, async () => {
    const op = { token: { id: 'fixture', cancelled: outcome === 'cancelled_before' }, requests: 0 };
    let calls = 0, payloads = 0;
    const sandbox = {
      activeCriticalOperation: op, taskCommandSequence: 0, KANO_INSTALL_TOOLBOX_BIN: '/data/kano_tproxy_tools/bin',
      buildF50LeaseFunctions: api.lease, shellQuote: quote, setInterval: () => 1, clearInterval() {},
      operationCancelled: () => Object.assign(new Error('cancelled'), { name: 'OperationCancelled' }),
      f50Diagnostic: () => ({}), createToast() {}, safeTextToHtml: String,
      hostRunShellWithRoot: async command => {
        calls++;
        if (command.includes('\nf50_lease_acquire ')) return { success: true, content: outcome === 'other_page_busy' ? 'F50_OPERATION_BUSY' : 'F50_LEASE_ACQUIRED=1' };
        payloads++;
        assert.ok(command.includes('F50_TASK_V2'));
        assert.ok(command.includes('kano_manager_start=$writer_start'));
        assert.ok(command.includes('finished %s'));
        if (outcome === 'timeout') throw new Error('transport timeout');
        if (outcome === 'cancelled_during') op.token.cancelled = true;
        return { success: true, content: outcome === 'missing_receipt' ? 'payload' : 'payload\nF50_TASK_FINISHED=mm_fixture.1:0\n' };
      },
    };
    const execute = run(slice('let transientShellOperation', 'const shellQuote') + 'runShellWithRoot', sandbox);
    if (outcome === 'completed') {
      const result = await execute('printf payload');
      assert.equal(result.deviceCompleted, true);
      assert.equal(result.deviceExitCode, 0);
      assert.equal(result.content, 'payload');
    } else if (outcome === 'other_page_busy') {
      assert.equal((await execute('printf payload')).success, false);
      assert.equal(payloads, 0);
    } else await assert.rejects(execute('printf payload'), { name: 'OperationCancelled' });
    assert.equal(op.requests, 0);
    if (['missing_receipt', 'timeout'].includes(outcome)) assert.equal(op.uncertain, true);
    if (outcome === 'cancelled_before') assert.equal(calls, 0);
  });
}
