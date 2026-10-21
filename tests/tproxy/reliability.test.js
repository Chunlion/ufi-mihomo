'use strict';

const test = require('node:test');
const { spawnSync } = require('node:child_process');
const { Worker: NodeWorker } = require('node:worker_threads');
const { fs, path, assert, slice, run, shell, shellApi, source, plain, quote, temp, write } = require('./optimization_harness');
const api = shellApi(), yq = process.env.F50_TEST_YQ;
const shellReply = run(slice('const f50ShellReply =', 'const f50TaskTag') + 'f50ShellReply');
const productionQuote = run(slice('const shellQuote =', 'const templateFlowMessages') + 'shellQuote');

for (const [name, end, content] of [
  ['loadProviderUserAgent', 'const persistProviderUserAgent', 'fixture-agent'],
  ['readCurrentSubRuleMode', 'const parseSubRuleModeFromText', 'template'],
  ['readConfigSource', 'const normalizeSubConvertModeValue', 'uploaded_config'],
]) test('ordinary settings read does not acquire a device lease / ' + name, async () => {
  let calls = 0;
  const read = run('let providerUserAgentLoaded=false,currentProviderUserAgent="";\n'
    + slice('const ' + name + ' =', end) + '\n' + name, {
    shellQuote: quote, f50ShellReply: shellReply, CLASH_SUB_USER_AGENT_FILE: '/fixture/agent',
    CLASH_SUB_URLS: '/fixture/sources', CLASH_CONFIG_SOURCE_FILE: '/fixture/source',
    KANO_PROVIDER_USER_AGENT: 'default-agent', parseStoredProviderUserAgent: String, parseSubRuleModeFromText: String,
    runShellWithRoot: async () => { throw Error('read must not acquire a lease'); },
    hostRunShellWithRoot: async () => { calls++; return { success: true, content: 'host wrapper', data: { content } }; },
  });
  assert.equal(await read(), content);
  assert.equal(calls, 1);
});

for (const fault of ['stat', 'busy', 'frontend', 'release_absent', 'release_owner', 'release_cancelled', 'release_worker', 'receipt']) {
  test('writer failure releases its lock and preserves the caller trap / ' + fault, () => {
    const dir = temp(), lock = path.join(dir, 'lease'), recovery = path.join(dir, 'recovery');
    try {
      if (!['stat', 'frontend', 'release_absent'].includes(fault)) write(lock, 'owner', ['busy', 'release_owner'].includes(fault) ? 'mm_other\n' : 'mm_fixture\n');
      if (fault === 'release_cancelled' || fault === 'frontend') write(lock, 'cancelled', '1');
      if (fault === 'release_worker') write(dir, 'tasks/mm_fixture.1', 'unfinished\n');
      const command = fault.startsWith('release_') ? 'f50_lease_release mm_fixture'
        : fault === 'receipt' ? 'f50_task_result mm_fixture mm_fixture.1' : 'f50_lease_acquire mm_fixture browser';
      const result = shell(api.lease() + `
trap 'echo CALLER_TRAP' EXIT
${fault === 'stat' ? 'awk() { return 1; }' : ''}
${command}
rc=$?
[ ! -e "$F50_RECOVERY_LOCK" ] || exit 9
echo OP_RC=$rc
`, { F50_OPERATION_LOCK: lock, F50_RECOVERY_LOCK: recovery, F50_TASK_DIR: path.join(dir, 'tasks') });
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.match(result.stdout, fault === 'release_absent' ? /OP_RC=0/ : /OP_RC=1/);
      assert.match(result.stdout, /CALLER_TRAP/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

test('API curl keeps sensitive values off argv and preserves request bytes', async () => {
  const http = require('node:http'), { execFile } = require('node:child_process'), { promisify } = require('node:util');
  const dir = temp(), body = '{"value":"quotes \\\" 中文"}\nsecond line\t$(not-a-command)';
  let received;
  const server = http.createServer((request, response) => {
    let data = ''; request.setEncoding('utf8'); request.on('data', chunk => { data += chunk; });
    request.on('end', () => { received = { method: request.method, auth: request.headers.authorization, data }; response.end('ok'); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const curl = write(dir, 'curl', '#!/bin/sh\nprintf "%s\\n" "$@" > "$ARGV_FILE"\nexec /usr/bin/curl "$@"\n');
    fs.chmodSync(curl, 0o755);
    const build = run(slice('const buildApiCurl =', 'const callMihomoApi =') + 'buildApiCurl', { shellQuote: productionQuote });
    const command = build('/configs', 'PUT', body, { apiBase: `http://127.0.0.1:${server.address().port}`, secret: 'fixture-"\\secret' });
    const { stdout } = await promisify(execFile)('sh', ['-c', 'CURL_BIN=' + productionQuote(curl) + '\n' + command], { env: { ...process.env, ARGV_FILE: path.join(dir, 'argv') } });
    assert.equal(stdout, 'ok');
    assert.deepEqual(received, { method: 'PUT', auth: 'Bearer fixture-"\\secret', data: body });
    assert.doesNotMatch(fs.readFileSync(path.join(dir, 'argv'), 'utf8'), /fixture-|not-a-command|Authorization/);
  } finally { server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('YAML omits undefined object values and rejects nonfinite numbers', () => {
  const dump = run(slice('const yamlScalar =', '// ===== Compatibility-first YAML JSON bridge') + 'dumpConfigYaml');
  assert.equal(dump({ keep: true, omit: undefined, nested: { omit: undefined }, list: [undefined] }), 'keep: true\nnested: {}\nlist:\n  - null\n');
  for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => dump({ value }), /NaN|Infinity/);
});

test('cancelled upload removes the returned file before reporting cancellation', async () => {
  const dir = temp(), uploaded = write(dir, 'uploaded.yaml', 'fixture');
  try {
    const operation = { token: { cancelled: false } };
    const upload = run(slice('const uploadFileToDevice =', '// ===== File and boot helpers') + 'uploadFileToDevice', {
      activeCriticalOperation: operation, FormData: class { append() {} }, KANO_baseURL: '', common_headers: {},
      fetch: async () => { operation.token.cancelled = true; return { ok: true, json: async () => ({ url: 'uploaded.yaml' }) }; },
      getUploadedPath: () => uploaded, shellQuote: productionQuote, operationCancelled: () => Error('cancelled'),
      hostRunShellWithRoot: async command => { const r = shell(command); return { success: r.status === 0 }; },
    });
    await assert.rejects(upload({}), /cancelled/);
    assert.equal(fs.existsSync(uploaded), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('service command quotes each argument without executing path contents', async () => {
  const dir = temp();
  try {
    const service = write(dir, 'Service file', '#!/bin/sh\nprintf "%s\\n" "$@"\n');
    const command = run(slice('async function f50Command(', 'let f50PackageInput') + 'f50Command', {
      CLASH_SERVICE: service, shellQuote: productionQuote, ensureCompatBackend: async () => true,
      runShellWithRoot: async script => { const r = shell(script); return { success: r.status === 0, content: r.stdout }; },
    });
    const argument = "file'; touch " + path.join(dir, 'injected') + "; echo '";
    const result = await command('fetch-batch', 1000, [argument]);
    assert.equal(result.success, true);
    assert.equal(result.content, 'fetch-batch\n' + argument + '\n');
    assert.equal(fs.existsSync(path.join(dir, 'injected')), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('editor failure removes an upload without changing the destination', async () => {
  const dir = temp(), uploaded = write(dir, 'upload.txt', 'new'), target = write(dir, 'list.txt', 'old');
  try {
    const allowed = { path: target, label: 'list.txt', allowEmpty: true };
    const save = run(slice('const writeEditableLocalFile =', 'const showEditableLocalFilesDialog =') + 'writeEditableLocalFile', {
      findEditableLocalFile: () => allowed, CLASH_CONFIG: '/config', CLASH_TEMPLATE: '/template', CLASH_TEMPLATE_BASE: '/base',
      CLASH_OVERRIDE_JS: '/override', CLASH_SUB_URLS: '/sub', CLASH_RULE_OVERRIDE_JSON: '/rules', CLASH_RULE_OVERRIDE_APPLIED_JSON: '/applied',
      uploadEditorContent: async () => uploaded, shellQuote: productionQuote, createToast() {}, escapeHtml: String, safeTextToHtml: String,
      runShellWithRoot: async () => { throw Error('cancelled'); },
      hostRunShellWithRoot: async command => { const r = shell(command); return { success: r.status === 0 }; },
    });
    assert.equal(await save(allowed, 'new'), false);
    assert.equal(fs.existsSync(uploaded), false);
    assert.equal(fs.readFileSync(target, 'utf8'), 'old');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('backup pruning handles spaces and matching source sidecars', () => {
  const dir = temp(), config = path.join(dir, 'config.yaml');
  try {
    for (const [name, seconds] of [['old backup', 1], ['new backup', 2]]) {
      for (const suffix of ['', '.source']) { const p = write(dir, 'config.yaml.before_' + name + suffix, name); fs.utimesSync(p, seconds, seconds); }
    }
    const prune = run(slice('const pruneKanoBackupsCmd =', 'const addBootLinesCmd') + 'pruneKanoBackupsCmd', {
      shellQuote: productionQuote, CLASH_CONFIG: config, CLASH_TEMPLATE: path.join(dir, 'template'), CLASH_TEMPLATE_BASE: path.join(dir, 'base'),
    });
    assert.equal(shell(prune(1)).status, 0);
    assert.deepEqual(fs.readdirSync(dir).sort(), ['config.yaml.before_new backup', 'config.yaml.before_new backup.source']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('failed template validation removes the original upload', async () => {
  const dir = temp(), uploaded = write(dir, 'uploaded.yaml', 'fixture');
  try {
    const save = run(slice('const saveTemplate =', 'const showInfoDialog =') + 'saveTemplate', {
      createRandomString: () => 'fixture', readConfigSource: async () => 'template.yaml', uploadFileToDevice: async () => uploaded,
      shellQuote: productionQuote, runShellWithRoot: async () => ({ success: false, content: '0' }),
      hostRunShellWithRoot: async command => { const r = shell(command.replaceAll('/data/', dir + '/data/')); return { success: r.status === 0 }; },
      createToast() {}, textToHtml: String, sanitizeSubscriptionSecrets: String, console: { error() {} },
    });
    assert.equal(await save({}), false);
    assert.equal(fs.existsSync(uploaded), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('export cleanup runs on the device after the browser handler has returned', async () => {
  const dir = temp(), backupBtn = {}, uploaded = path.join(dir, 'web', 'uploads');
  let script = '';
  try {
    const config = write(dir, 'config.yaml', 'secret: fixture\n');
    await run(slice('backupBtn.onclick =', '\n  (async () => {') + 'backupBtn.onclick', {
      backupBtn, crypto: require('node:crypto').webcrypto, ensureReady: async () => true,
      acquireCriticalOperation: () => ({}), releaseCriticalOperation: async () => {}, setButtonBusy() {}, createToast() {}, safeTextToHtml: String,
      configPackageBackupFiles: () => [{ label: 'config.yaml', path: config }], buildDefaultOverrideJs: () => '', defaultRuleOverrideConfig: () => ({}),
      shellQuote: productionQuote, F50_FILES_DIR: path.join(dir, 'web'),
      runShellWithRoot: async value => { script = value; return { success: false }; },
    })();
    assert.ok(script);
    const sleep = write(dir, 'bin/sleep', `#!/bin/sh
printf '%s' "\${KANO_TPROXY_TASK:-}" > ${productionQuote(path.join(dir, 'owner'))}
touch ${productionQuote(path.join(dir, 'scheduled'))}
while [ ! -f ${productionQuote(path.join(dir, 'release'))} ]; do /bin/sleep 0.01; done
`);
    fs.chmodSync(sleep, 0o755);
    const result = shell(script.replaceAll('/data/kano_config_package_', dir + '/private-package_'), {
      PATH: path.dirname(sleep) + ':' + process.env.PATH, KANO_TPROXY_TASK: 'mm_fixture',
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const name = result.stdout.match(/^PACKAGE_NAME=(.+)$/m)[1];
    const archive = path.join(uploaded, name);
    assert.match(name, /^mm_config_package_\d+_[a-f0-9]{32}\.tar\.gz$/);
    assert.equal(fs.existsSync(archive), true);
    assert.deepEqual(fs.readdirSync(uploaded), [name]);
    for (let n = 0; !fs.existsSync(path.join(dir, 'scheduled')) && n < 200; n++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(fs.readFileSync(path.join(dir, 'owner'), 'utf8'), '');
    write(dir, 'release', '1');
    for (let n = 0; fs.existsSync(archive) && n < 200; n++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(fs.existsSync(archive), false);
  } finally { write(dir, 'release', '1'); fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const name of ['../escape', '..', '/absolute', 'dir/../escape', 'dir\\escape', 'name\tbad', 'config.yaml', './config.yaml']) {
  test('configuration restore validates fallback ZIP listings before extraction / ' + name, async () => {
    const dir = temp(); let script = '';
    try {
      const restore = run(slice('const restoreConfigPackageFromFile =', 'const packageUploadEl =') + 'restoreConfigPackageFromFile', {
        createRandomString: () => 'fixture', configPackageBackupFiles: () => [{ label: 'config.yaml', path: path.join(dir, 'config.yaml') }],
        askConfirm: async () => true, textToHtml: String, safeTextToHtml: String, createToast() {},
        buildControllerInfo: async () => ({}), createConfigRollbackPoint: async () => '', uploadFileToDevice: async () => path.join(dir, 'upload.zip'),
        shellQuote: productionQuote, CLASH_DIR: path.join(dir, 'clash'), CLASH_PROXY_DIR: path.join(dir, 'clash/Proxy'), CLASH_CONFIG: path.join(dir, 'config.yaml'),
        F50_DEFAULT_SECRET: '123456', prepareYqRuntimeCmd: () => '', yqExecutableCheckCmd: () => '', pruneKanoBackupsCmd: () => '',
        runShellWithRoot: async value => { script = value; return { success: false, content: 'captured' }; },
      });
      assert.equal(await restore({ name: 'backup.zip', size: 1 }), false);
      write(dir, 'upload.zip', 'fixture');
      const extracted = path.join(dir, 'extracted');
      const mock = `unzip() {
case "$1" in
 -t) return 0;; -Z1) return 1;;
 -l) printf ' 12  2026-10-19 00:00 %s\\n' ${productionQuote(name)}; return 0;;
 -q) touch ${productionQuote(extracted)}; return 9;;
esac
}\n`;
      const result = shell(mock + script.replaceAll('/data/', dir + '/data/'));
      assert.notEqual(result.status, 0);
      const safe = ['config.yaml', './config.yaml'].includes(name);
      assert.equal(fs.existsSync(extracted), safe, result.stdout + result.stderr);
      if (!safe) assert.match(result.stdout, /unsafe archive path/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

test('all final operation shells parse in sh and BusyBox ash', () => {
  const scripts = [api.install('/data/upload.zip'), api.start('start'), api.start('restart'),
    api.emergency('', true), api.emergency('', true, true), api.patch("'/data/clash/Scripts/Clash.Service'"),
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
      // 固件会随发布被刷新到最新标记，这里必须按固件实际值降一级，不能写死版本号。
      const downgrade = (text, name) => text.replace(
        new RegExp(`^# ${name}=(\\d+)$`, 'm'),
        (_, current) => `# ${name}=${Number(current) - 1}`);
      let before = service;
      if (stage === 'tun') before = downgrade(before, 'KANO_TUN_RULE_CLEANUP');
      if (stage === 'original') before = downgrade(before, 'KANO_ORIGINAL_CONFIG_PRESERVATION');
      if (stage === 'audit5') before = downgrade(before, 'KANO_CURL_ABSOLUTE');
      if (stage === 'tun6') before = downgrade(before, 'KANO_TUN_IPV6_RETURN');
      if (stage === 'dns') before = downgrade(before, 'KANO_IPV6_DNS_SPLIT');
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

test('packaged Service migration installs executable DNS address validation', () => {
  const dir = temp();
  try {
    const file = write(dir, 'Clash.Service', service);
    const patched = shell(shellApi(source, '', { shellQuote: productionQuote }).patch(productionQuote(file)));
    assert.equal(patched.status, 0, patched.stdout + patched.stderr);
    const text = fs.readFileSync(file, 'utf8');
    const validator = slice('f50_dns4_address() {', 'f50_dns4_rule() {', text);
    const result = shell(validator + "\nf50_dns4_address '192.168.0.0/24' || exit 1\nif f50_dns4_address '192.168.0.0/24 -j ACCEPT'; then exit 2; fi\n");
    assert.equal(result.status, 0, result.stdout + result.stderr);
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
for (const expression of ['function() {}', 'async function() {}', 'function*() {}', 'async function*() {}']) {
  test('override blocks computed dynamic constructors / ' + expression, async () => {
    const code = `function main(config) { const f = ${expression}; return f["con"+"structor"]("return this")(); }`;
    await assert.rejects(overrideApi().apply(code), /not a function/);
  });
}

function recoveryCase({ receipt = true, active = false, reused = false, foreign = false, background = false, backgroundComm = 'curl', transaction = false, legacy = false, reclaim = false, output = false, pendingReceipt = '', snapshot = false, preempt = false, unrelated = false } = {}) {
  const dir = temp(), proc = path.join(dir, 'proc'), root = path.join(dir, 'clash'), lease = path.join(dir, 'lease'), tasks = path.join(dir, 'tasks');
  fs.mkdirSync(proc); fs.mkdirSync(root);
  write(dir, 'lease/owner', 'mm_fixture\n'); write(dir, 'lease/frontend', 'mm_fixture 0\n');
  const record = legacy ? '111\n' : `F50_TASK_V2 ${foreign ? 'mm_foreign' : 'mm_fixture'} mm_fixture.1 111 21 222 22 ${receipt ? 'finished' : 'running'} 0\n`;
  write(dir, 'tasks/mm_fixture.1', record);
  if (output) write(dir, 'tasks/mm_fixture.1.output', 'partial output\n');
  if (pendingReceipt) write(dir, 'tasks/mm_fixture.1.receipt', pendingReceipt === 'complete' ? record.replace('running', 'finished') : 'F50_TASK_V2');
  if (active || reused) {
    write(proc, '111/stat', `111 (sh) S ${Array(18).fill('0').join(' ')} ${reused ? 99 : 21}\n`);
    write(proc, '111/comm', 'sh\n'); write(proc, '111/environ', reused ? 'OTHER=foreign\0' : 'KANO_TPROXY_TASK=mm_fixture\0');
  }
  if (transaction) write(root, 'Tools/template.yaml.kano_tx/ready', '');
  if (snapshot) write(dir, 'kano_subscription_save_fixture/0', 'backup');
  if (unrelated) write(proc, '444/comm', 'system_server\n');
  if (background) {
    write(proc, '333/stat', `333 (curl) S ${Array(18).fill('0').join(' ')} 31\n`);
    write(proc, '333/comm', backgroundComm + '\n'); write(proc, '333/environ', 'KANO_TPROXY_TASK=mm_fixture\0');
  }
  const result = shell(api.maintenance('cleanup') + api.eligibility() + `\nemergency_locked=${reclaim ? 1 : 0}\nf50_recovery_eligible`, {
    F50_ROOT: root, F50_PROC: proc, F50_OPERATION_LOCK: lease, F50_TASK_DIR: tasks, F50_RECOVERY_PREEMPT: preempt ? '1' : '0',
  });
  return { dir, tasks, record, result };
}
for (const [options, eligible, state] of [
  [{}, true, 'quiescent_lease'], [{ reclaim: true }, true, 'quiescent_lease'],
  [{ active: true }, false, 'active_task'], [{ reused: true }, true, 'quiescent_lease'],
  [{ receipt: false }, false, 'task_receipt_missing'], [{ foreign: true }, false, 'task_owner_mismatch'],
  [{ transaction: true }, false, 'config_transaction_unresolved'], [{ legacy: true }, false, 'stale_task_record'],
  [{ background: true }, false, 'unreceipted_active_task'],
  [{ output: true, reclaim: true }, true, 'quiescent_lease'],
  [{ output: true, receipt: false }, false, 'task_receipt_missing'],
  [{ pendingReceipt: 'complete', receipt: false, preempt: true, reclaim: true }, true, 'quiescent_lease'],
  [{ pendingReceipt: 'partial', receipt: false, preempt: true, reclaim: true }, true, 'quiescent_lease'],
  [{ pendingReceipt: 'partial', receipt: false, active: true, reclaim: true }, false, 'active_task'],
  [{ snapshot: true }, false, 'config_transaction_unresolved'],
  [{ snapshot: true, receipt: false, preempt: true, reclaim: true }, true, 'quiescent_lease'],
  [{ unrelated: true }, true, 'quiescent_lease'],
  [{ background: true, backgroundComm: 'cp' }, false, 'unreceipted_active_task'],
]) test('recovery registry / ' + JSON.stringify(options), () => {
  const c = recoveryCase(options);
  try {
    assert.equal(c.result.status, eligible ? 0 : 1, c.result.stdout + c.result.stderr);
    assert.match(c.result.stdout, new RegExp('F50_RECOVERY_STATE=' + state));
    if (options.reclaim && eligible) assert.ok(!fs.existsSync(c.tasks));
    else assert.equal(fs.readFileSync(path.join(c.tasks, 'mm_fixture.1'), 'utf8'), c.record);
    if (options.snapshot) assert.equal(fs.readFileSync(path.join(c.dir, 'kano_subscription_save_fixture/0'), 'utf8'), 'backup');
  } finally { fs.rmSync(c.dir, { recursive: true, force: true }); }
});

test('manual recovery releases the network and retains interrupted subscription backups', () => {
  const dir = temp(), proc = path.join(dir, 'proc'), root = path.join(dir, 'clash'), lease = path.join(dir, 'lease'), tasks = path.join(dir, 'tasks');
  try {
    fs.mkdirSync(proc);
    write(dir, 'lease/owner', 'mm_old\n'); write(dir, 'lease/frontend', 'mm_old 0\n');
    write(tasks, 'mm_old.1', 'F50_TASK_V2 mm_old mm_old.1 111 21 222 22 running 0\n');
    const backup = write(dir, 'kano_subscription_save_fixture/0', 'old configuration');
    const script = api.emergency().replace('\nF50_RESUME_TAG=', '\nf50_scan() { : > "$1"; }\nf50_clean_environment() { echo F50_NETWORK_RELEASED=1; return 0; }\nF50_RESUME_TAG=');
    const result = shell('mkdir "$F50_PROC/$$"; ln -s /proc/$$/stat "$F50_PROC/$$/stat"\n' + script, {
      F50_ROOT: root, F50_PROC: proc, F50_OPERATION_LOCK: lease, F50_TASK_DIR: tasks, F50_RECOVERY_LOCK: path.join(dir, 'recovery'),
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /^F50_NETWORK_RELEASED=1$/m); assert.match(result.stdout, /^RECOVERY_VERIFIED$/m);
    assert.match(result.stdout, /^F50_RECOVERY_BACKUP=/m);
    assert.equal(fs.readFileSync(backup, 'utf8'), 'old configuration');
    assert.ok(!fs.existsSync(tasks)); assert.ok(!fs.existsSync(lease));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const [abi, outcome] of [['arm64-v8a', 'restored'], ['armeabi-v7a', 'restored'], ['other', 'restored'], ['arm64-v8a', 'failed'], ['arm64-v8a', 'unrestored'], ['arm64-v8a', 'missing']]) {
  test('manual recovery restores native network journals / ' + abi + '/' + outcome, () => {
    const dir = temp(), root = path.join(dir, 'clash'), proc = path.join(dir, 'proc'), lease = path.join(dir, 'lease');
    const journals = ['rp-filter.json', 'legacy-policy.json', 'download.transaction.json'];
    try {
      fs.mkdirSync(proc);
      for (const journal of journals) write(root, 'Policy/' + journal, 'saved network settings');
      const serviceMarker = path.join(dir, 'service-ran');
      write(root, 'Scripts/Clash.Service', '#!/bin/sh\ntouch ' + productionQuote(serviceMarker) + '\nexit 99\n');
      if (outcome !== 'missing') {
        const name = abi === 'arm64-v8a' ? 'clashctl_arm64' : abi === 'armeabi-v7a' ? 'clashctl_armv7' : 'clashctl';
        const binary = write(root, 'Scripts/' + name, `#!/bin/sh
[ "$1" = recover ] && [ -f "$F50_OPERATION_LOCK/cancelled" ] && [ -s "$F50_RECOVERY_LOCK/owner" ] || exit 98
${outcome === 'restored' ? 'rm -f "$CLASH_ROOT/Policy/rp-filter.json" "$CLASH_ROOT/Policy/legacy-policy.json" "$CLASH_ROOT/Policy/download.transaction.json"' : outcome === 'unrestored' ? 'exit 0' : 'exit 7'}
`);
        fs.chmodSync(binary, 0o755);
      }
      const overrides = `
getprop() { echo ${productionQuote(abi)}; }
uname() { echo x86_64; }
f50_scan() { : > "$1"; }
f50_network_snapshot() { mkdir -p "$1"; : > "$1/plan"; }
f50_save() { return 1; }
f50_ip_snapshot() { return 1; }
`;
      const script = shellApi(source, '', { shellQuote: productionQuote }).emergency().replace('\nF50_RESUME_TAG=', overrides + '\nF50_RESUME_TAG=');
      const result = shell('mkdir "$F50_PROC/$$"; ln -s /proc/$$/stat "$F50_PROC/$$/stat"\n' + script, {
        F50_ROOT: root, F50_PROC: proc, F50_OPERATION_LOCK: lease, F50_TASK_DIR: path.join(dir, 'tasks'), F50_RECOVERY_LOCK: path.join(dir, 'recovery'),
      });
      assert.equal(result.status, outcome === 'restored' ? 0 : 1, result.stdout + result.stderr);
      assert.equal(/^RECOVERY_VERIFIED$/m.test(result.stdout), outcome === 'restored');
      assert.equal(fs.existsSync(lease), outcome !== 'restored');
      assert.ok(!fs.existsSync(serviceMarker));
      for (const journal of journals) assert.equal(fs.existsSync(path.join(root, 'Policy', journal)), outcome !== 'restored');
      if (outcome !== 'restored') assert.match(result.stdout, /F50_CLEAN_ERROR=journal_restore_incomplete/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

for (const installer of ['exited', 'running', 'unknown_entry']) test('manual recovery releases only an exited installer lock / ' + installer, () => {
  const dir = temp(), root = path.join(dir, 'clash'), proc = path.join(dir, 'proc'), lock = path.join(dir, 'clash.install.lock.d');
  try {
    fs.mkdirSync(proc); write(lock, 'pid', '333\n');
    if (installer === 'running') fs.mkdirSync(path.join(proc, '333'));
    if (installer === 'unknown_entry') write(lock, 'foreign', 'keep');
    const env = { F50_ROOT: root, F50_PROC: proc, F50_OPERATION_LOCK: path.join(dir, 'lease'), F50_TASK_DIR: path.join(dir, 'tasks'), F50_RECOVERY_LOCK: path.join(dir, 'recovery') };
    const precheck = shell(api.maintenance('cleanup') + api.eligibility() + '\nF50_RECOVERY_PREEMPT=1 f50_recovery_eligible', env);
    assert.equal(precheck.status, installer === 'exited' ? 0 : 1, precheck.stdout + precheck.stderr);
    assert.ok(fs.existsSync(lock));
    const script = api.emergency().replace('\nF50_RESUME_TAG=', '\nf50_scan() { : > "$1"; }\nf50_clean_environment() { return 0; }\nF50_RESUME_TAG=');
    const result = shell('mkdir "$F50_PROC/$$"; ln -s /proc/$$/stat "$F50_PROC/$$/stat"\n' + script, env);
    assert.equal(result.status, installer === 'exited' ? 0 : 1, result.stdout + result.stderr);
    assert.equal(fs.existsSync(lock), installer !== 'exited');
    assert.equal(/^RECOVERY_VERIFIED$/m.test(result.stdout), installer === 'exited');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const owned of [false, true]) test('recovery scan identifies orphaned file writers by task ownership / ' + owned, () => {
  const dir = temp(), proc = path.join(dir, 'proc');
  try {
    write(proc, '333/comm', 'cp\n');
    write(proc, '333/stat', `333 (cp) S ${Array(18).fill('0').join(' ')} 31\n`);
    write(proc, '333/environ', owned ? 'KANO_TPROXY_TASK=mm_fixture\0' : 'OTHER=foreign\0');
    fs.symlinkSync('/usr/bin/cp', path.join(proc, '333/exe'));
    const result = shell(api.maintenance('cleanup') + '\nf50_scan "$F50_DATA/pids" && cat "$F50_DATA/pids"', { F50_ROOT: path.join(dir, 'clash'), F50_PROC: proc });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout.trim(), owned ? '333 31 worker' : '');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const outcome of ['idle', 'active', 'retry_busy', 'recovery_timeout', 'owned_busy', 'normal']) {
  test('uninstall busy lease recovery / ' + outcome, async () => {
    const op = { token: { id: 'uninstall' }, requests: 0, leaseOwned: outcome === 'owned_busy' };
    const stages = [], recovery = [];
    const sandbox = {
      activeCriticalOperation: op, deviceTaskUncertain: false, lastInstallDiagnostic: null, f50ShellReply: shellReply,
      operationStage() {}, operationCancelled: () => Object.assign(new Error('cancelled'), { name: 'OperationCancelled' }),
      f50UnknownCompletion: (operation, cause) => {
        operation.uncertain = true;
        operation.token.cancelled = true;
        return Object.assign(new Error(String(cause)), { name: 'OperationCancelled' });
      },
      buildUninstallStages: () => ['stop', 'boot', 'delete'].map(title => ({ title, script: title, timeout: 60000 })),
      buildF50EmergencyScript: (tag, requireIdle, releaseIdleOnly) => {
        assert.equal(tag, ''); assert.equal(requireIdle, true); assert.equal(releaseIdleOnly, true); return 'RECOVER_IDLE';
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
          : { success: true, content: 'F50_LEASE_RELEASED=1' };
      },
    };
    const uninstall = run(slice('async function performF50Uninstall()', 'async function f50Command') + 'performF50Uninstall', sandbox);
    if (outcome === 'recovery_timeout') {
      await assert.rejects(uninstall(), { name: 'OperationCancelled' });
      assert.equal(op.uncertain, true);
    } else {
      const result = await uninstall();
      assert.equal(result.ok, ['idle', 'normal'].includes(outcome));
      if (!result.ok) assert.match(result.summary, /卸载失败.*操作锁/);
      if (outcome === 'active') assert.match(result.details, /F50_RECOVERY_STATE=active_task/);
    }
    assert.deepEqual(stages, outcome === 'normal' ? ['stop', 'boot', 'delete']
      : outcome === 'idle' ? ['stop', 'stop', 'boot', 'delete']
      : outcome === 'retry_busy' ? ['stop', 'stop'] : ['stop']);
    assert.equal(recovery.length, ['normal', 'owned_busy'].includes(outcome) ? 0 : 1);
  });
}

for (const outcome of ['completed', 'cancelled_before', 'cancelled_during', 'missing_receipt', 'timeout', 'other_page_busy', 'unsafe_path', 'released_before_acquire', 'response_lost', 'response_truncated', 'failed_response_lost', 'heartbeat_lost', 'acquire_lost', 'host_footer', 'nested_reply', 'string_reply', 'wrong_receipt']) {
  test('browser task ownership and receipt / ' + outcome, async () => {
    const op = { token: { id: 'fixture', cancelled: outcome === 'cancelled_before' }, requests: 0 };
    let calls = 0, payloads = 0, lookups = 0, heartbeat;
    const wrap = reply => outcome === 'nested_reply' ? { success: reply.success, content: 'command echo', data: { result: reply.content } }
      : outcome === 'string_reply' ? reply.content : reply;
    const sandbox = {
      activeCriticalOperation: op, taskCommandSequence: 0, KANO_INSTALL_TOOLBOX_BIN: '/data/kano_tproxy_tools/bin',
      buildF50LeaseFunctions: api.lease, shellQuote: quote, setInterval: fn => { heartbeat = fn; return 1; }, clearInterval() {},
      operationCancelled: () => Object.assign(new Error('cancelled'), { name: 'OperationCancelled' }),
      f50Diagnostic: () => ({}), createToast() {}, safeTextToHtml: String, syncCriticalOperationStatus() {},
      hostRunShellWithRoot: async command => {
        calls++;
        if (command.includes('\nf50_lease_acquire ')) {
          if (outcome === 'acquire_lost') throw Error('Load failed');
          if (outcome === 'unsafe_path') return { success: false, content: 'F50_OPERATION_UNSAFE_PATH' };
          if (outcome === 'released_before_acquire') return { success: false, content: 'acquire_fixture_failure' };
          return wrap({ success: true, content: outcome === 'other_page_busy' ? 'F50_OPERATION_BUSY' : 'F50_LEASE_ACQUIRED=1' });
        }
        if (command.includes('\nf50_lease_status ')) return { success: true, content: outcome === 'released_before_acquire' ? 'F50_LEASE_RELEASED=1' : 'F50_LEASE_OWNED=1' };
        if (command.includes('\nf50_frontend_touch ')) throw Error('signal is aborted without reason');
        if (command.includes('\nf50_task_result ')) {
          lookups++;
          return { success: true, content: ['response_lost', 'response_truncated', 'failed_response_lost'].includes(outcome)
            ? 'payload\nF50_TASK_FINISHED=mm_fixture.1:' + (outcome === 'failed_response_lost' ? '7' : '0') + '\n'
            : 'F50_TASK_RESULT_UNCONFIRMED' };
        }
        payloads++;
        assert.ok(command.includes('F50_TASK_V2'));
        assert.ok(command.includes('kano_manager_start=$writer_start'));
        assert.ok(command.includes('finished %s'));
        if (outcome === 'timeout') throw new Error('transport timeout');
        if (['response_lost', 'failed_response_lost'].includes(outcome)) throw Error('Load failed');
        if (outcome === 'response_truncated') return { success: false, content: 'payload' };
        if (outcome === 'heartbeat_lost') { heartbeat(); await op.heartbeatPending; assert.match(op.heartbeatError, /signal is aborted/); assert.ok(!op.uncertain); }
        if (outcome === 'cancelled_during') op.token.cancelled = true;
        return wrap({ success: true, content: outcome === 'missing_receipt' ? 'payload' : outcome === 'wrong_receipt' ? 'payload\nF50_TASK_FINISHED=mm_other.1:0\n'
          : outcome === 'host_footer' ? 'payload\nF50_TASK_FINISHED=mm_fixture.1:0 \t\r\nhost: completed\n' : 'payload\nF50_TASK_FINISHED=mm_fixture.1:0\n' });
      },
    };
    const execute = run(slice('let transientShellOperation', 'const shellQuote') + 'runShellWithRoot', sandbox);
    if (['completed', 'response_lost', 'response_truncated', 'failed_response_lost', 'heartbeat_lost', 'acquire_lost', 'host_footer', 'nested_reply', 'string_reply'].includes(outcome)) {
      const result = await execute('printf payload');
      assert.equal(result.deviceCompleted, true);
      assert.equal(result.deviceExitCode, outcome === 'failed_response_lost' ? 7 : 0);
      assert.equal(result.success, outcome !== 'failed_response_lost');
      assert.equal(result.content, 'payload');
      assert.equal(op.uncertain, undefined);
      assert.equal(op.heartbeatError, '');
    } else if (['other_page_busy', 'unsafe_path', 'released_before_acquire'].includes(outcome)) {
      const result = await execute('printf payload');
      assert.equal(result.success, false);
      assert.equal(result.deviceCompleted, false);
      assert.equal(result.content, outcome === 'other_page_busy' ? 'F50_OPERATION_BUSY' : outcome === 'unsafe_path' ? 'F50_OPERATION_UNSAFE_PATH' : 'acquire_fixture_failure');
      assert.equal((await execute('printf payload again')).content, result.content);
      assert.equal(calls, outcome === 'released_before_acquire' ? 2 : 1);
      assert.equal(payloads, 0);
    } else await assert.rejects(execute('printf payload'), { name: 'OperationCancelled' });
    assert.equal(op.requests, 0);
    if (['missing_receipt', 'timeout', 'wrong_receipt'].includes(outcome)) assert.equal(op.uncertain, true);
    if (outcome === 'cancelled_before') assert.equal(calls, 0);
    assert.equal(lookups, ['missing_receipt', 'timeout', 'response_lost', 'response_truncated', 'failed_response_lost', 'wrong_receipt'].includes(outcome) ? 1 : 0);
    assert.equal(payloads, ['cancelled_before', 'other_page_busy', 'unsafe_path', 'released_before_acquire'].includes(outcome) ? 0 : 1);
  });
}

for (const failure of ['stop', 'stop_throw', 'boot']) test('uninstall stops after a failed stage / ' + failure, async () => {
  const stages = [];
  const sandbox = {
    deviceTaskUncertain: false, operationStage() {}, f50Diagnostic: detail => ({ details: detail }),
    buildUninstallStages: () => ['stop', 'boot', 'delete'].map(title => ({ title, script: title })),
    buildF50FinalCheckScript: () => 'FINAL', f50UninstallVerdict: () => ({ ok: false, code: 'residual', detail: 'F50_REMAINS=path:fixture' }),
    hostRunShellWithRoot: async script => { assert.equal(script, 'FINAL'); return { success: true, content: 'residual' }; },
    runShellWithRoot: async script => {
      stages.push(script);
      if (failure === 'stop_throw') throw Error('cleanup failed');
      return { success: script !== failure, content: script === failure ? 'F50_CLEAN_ERROR=fixture_failure' : 'done' };
    },
  };
  const uninstall = run(slice('async function performF50Uninstall()', 'async function f50Command') + 'performF50Uninstall', sandbox);
  const result = await uninstall();
  assert.equal(result.ok, false); assert.match(result.summary, new RegExp('卸载失败：' + (failure === 'boot' ? 'boot' : 'stop') + '失败'));
  assert.deepEqual(stages, failure === 'boot' ? ['stop', 'boot'] : ['stop']);
});

for (const idle of [false, true]) test('uninstall recovers a prior failed operation before running stages / ' + idle, async () => {
  const op = { token: { id: 'uninstall' }, requests: 0 }, stages = [];
  const sandbox = {
    activeCriticalOperation: op, deviceTaskUncertain: true, operationStage() {}, f50ShellReply: shellReply,
    buildUninstallStages: () => ['stop', 'boot', 'delete'].map(title => ({ title, script: title })),
    buildF50EmergencyScript: () => 'RECLAIM', buildF50FinalCheckScript: () => 'FINAL',
    f50Diagnostic: details => ({ details }), f50UninstallVerdict: () => ({ ok: true, code: 'clean', detail: 'UNINSTALL_VERIFIED' }),
    runShellWithRoot: async command => { assert.equal(handlers.uncertain(), false); stages.push(command); return { success: true, content: 'done' }; },
    hostRunShellWithRoot: async command => ({ success: command === 'FINAL' || idle, content: command === 'FINAL' ? 'UNINSTALL_VERIFIED' : idle ? 'F50_LEASE_RELEASED=1' : 'F50_RECOVERY_ELIGIBLE=0' }),
  };
  const handlers = run(slice('async function performF50Uninstall()', 'async function f50Command') + '({uninstall:performF50Uninstall,uncertain:()=>deviceTaskUncertain})', sandbox);
  const result = await handlers.uninstall();
  assert.equal(result.ok, idle); assert.equal(handlers.uncertain(), !idle);
  assert.deepEqual(stages, idle ? ['stop', 'boot', 'delete'] : []);
  if (!idle) assert.equal(result.code, 'operation_busy');
});

for (const forUninstall of [false, true]) for (const outcome of ['idle', 'active_worker', 'active_frontend', 'active_installer', 'unknown_install_entry', 'foreign_receipt', 'pending_config_transaction', 'unfinished_receipt']) {
  test((forUninstall ? 'uninstall' : 'installation') + ' reclaims only idle abandoned leases / ' + outcome, () => {
    const dir = temp(), proc = path.join(dir, 'proc'), root = path.join(dir, 'clash'), lease = path.join(dir, 'lease'), tasks = path.join(dir, 'tasks');
    try {
      fs.mkdirSync(proc);
      write(dir, 'lease/owner', 'mm_old\n');
      write(dir, 'lease/frontend', `mm_old ${outcome === 'active_frontend' ? '2147483647' : '0'}\n`);
      write(tasks, 'mm_old.1', `F50_TASK_V2 ${outcome === 'foreign_receipt' ? 'mm_foreign' : 'mm_old'} mm_old.1 111 21 222 22 ${forUninstall || outcome === 'unfinished_receipt' ? 'running' : 'finished'} 0\n`);
      write(tasks, 'mm_old.1.output', 'partial output');
      const backup = write(dir, 'kano_subscription_save_fixture/0', 'backup');
      if (!forUninstall) write(dir, 'kano_subscription_save_fixture/committed', '');
      write(dir, 'clash.install.lock.d/pid', '333\n');
      if (outcome === 'unknown_install_entry') write(dir, 'clash.install.lock.d/foreign', 'keep');
      if (outcome === 'active_installer') fs.mkdirSync(path.join(proc, '333'));
      if (outcome === 'active_worker') write(proc, '111/stat', `111 (sh) S ${Array(18).fill('0').join(' ')} 21\n`);
      if (outcome === 'pending_config_transaction') write(root, 'Proxy/config.yaml.kano_tx/config', 'original config');
      const result = shell(`mkdir "$F50_PROC/$$"; ln -s /proc/$$/stat "$F50_PROC/$$/stat"\n` + api.emergency('', true, true, forUninstall), {
        F50_ROOT: root, F50_PROC: proc, F50_OPERATION_LOCK: lease, F50_TASK_DIR: tasks, F50_RECOVERY_LOCK: path.join(dir, 'recovery'),
      });
      const reclaimed = outcome === 'idle' || (forUninstall && ['pending_config_transaction', 'unfinished_receipt'].includes(outcome));
      assert.equal(result.status, reclaimed ? 0 : 1, result.stdout + result.stderr);
      if (reclaimed) {
        assert.match(result.stdout, /^F50_LEASE_RELEASED=1$/m);
        assert.ok(!fs.existsSync(lease)); assert.ok(!fs.existsSync(tasks));
      } else {
        assert.match(result.stdout, /^F50_RECOVERY_ELIGIBLE=0$/m);
        assert.equal(fs.readFileSync(path.join(lease, 'owner'), 'utf8'), 'mm_old\n');
        assert.ok(fs.existsSync(path.join(tasks, 'mm_old.1')));
      }
      assert.equal(fs.readFileSync(backup, 'utf8'), 'backup');
      assert.ok(fs.existsSync(path.join(dir, 'clash.install.lock.d/pid')));
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

test('uninstall final probe detects an interrupted export without an installed core', () => {
  const dir = temp(), proc = path.join(dir, 'proc'), work = path.join(dir, '.f50-verify.fixture');
  try {
    fs.mkdirSync(proc); fs.mkdirSync(work);
    const exported = write(dir, 'kano_config_package_123_fixture/config.yaml', 'interrupted export');
    const result = shell(api.maintenance('final') + `
F50_WORK=${quote(work)}
f50_scan() { : > "$1"; }
f50_network_snapshot() { mkdir -p "$1"; : > "$1/links"; }
f50_final_probe
echo FINAL_REMAINS=$F50_FINAL_REMAINS
`, { F50_ROOT: path.join(dir, 'clash'), F50_PROC: proc, F50_BOOT: path.join(dir, 'boot.sh') });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.ok(result.stdout.includes('F50_REMAINS=path:' + path.dirname(exported)));
    assert.match(result.stdout, /^FINAL_REMAINS=1$/m);
    assert.equal(fs.readFileSync(exported, 'utf8'), 'interrupted export');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const obstacle of ['', 'process', 'network', 'journal', 'installer']) test('uninstall removes abandoned backups only after runtime cleanup / ' + (obstacle || 'clean'), () => {
  const dir = temp(), root = path.join(dir, 'clash'), proc = path.join(dir, 'proc'), work = path.join(dir, '.f50-delete.fixture');
  try {
    fs.mkdirSync(proc); fs.mkdirSync(work);
    const config = write(root, 'Proxy/config.yaml', 'fixture configuration');
    const backup = write(dir, 'clash.rollback.install.fixture/Proxy/config.yaml', 'old configuration');
    const tx = write(dir, 'kano_subscription_save_fixture/0', 'subscription backup');
    const networkTx = write(dir, 'kano_network_save_fixture/0', 'network backup');
    const exported = write(dir, 'kano_config_package_123_fixture/config.yaml', 'interrupted export');
    write(root, 'Tools/template.yaml.kano_tx/ready', '');
    write(dir, '.f50-install.fixture/install.journal', 'incomplete');
    write(dir, 'kano_yq_runtime/yq', 'component');
    const foreign = write(dir, 'other-plugin/keep', 'foreign');
    const foreignPackage = write(dir, 'kano_config_package_custom/keep', 'foreign');
    if (obstacle === 'journal') write(root, 'Policy/rp-filter.json', 'unrestored network state');
    if (obstacle === 'installer') { write(dir, 'clash.install.lock.d/pid', '333\n'); fs.mkdirSync(path.join(proc, '333')); }
    const script = api.maintenance('remove').replaceAll('/dev/kano_gist_sync', path.join(dir, 'gist-runtime')) + `
F50_WORK=${quote(work)}
f50_scan() { ${obstacle === 'process' ? 'echo "111 21 core"' : ':'} > "$1"; }
f50_network_snapshot() { mkdir -p "$1"; ${obstacle === 'network' ? 'echo owned_rule' : ':'} > "$1/plan"; }
f50_runtime_guard && f50_remove_artifacts
`;
    const result = shell(script, { F50_ROOT: root, F50_PROC: proc });
    assert.equal(result.status, obstacle ? 1 : 0, result.stdout + result.stderr);
    for (const file of [config, backup, tx, networkTx, exported]) assert.equal(fs.existsSync(file), !!obstacle);
    assert.equal(fs.readFileSync(foreign, 'utf8'), 'foreign');
    assert.equal(fs.readFileSync(foreignPackage, 'utf8'), 'foreign');
    if (obstacle) assert.match(result.stdout, /F50_DELETE_BLOCKED=/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('uninstall artifact cleanup preserves its own task registry', () => {
  const dir = temp(), data = path.join(dir, 'data'), dev = path.join(dir, 'dev');
  try {
    const receipt = write(dev, 'kano_tproxy_tasks/mm_fixture.1', 'running task');
    const log = write(data, 'kano_clash_start.log', 'old log');
    write(dev, 'kano_boot_write.lock/pid', '2147483647\n');
    const constants = Object.fromEntries(['KANO_SUBSCRIPTION_RAW', 'KANO_SUBSCRIPTION_YAML', 'KANO_SUBSCRIPTION_MODE_CHECK', 'KANO_TEMPLATE_WRITE_CHECK', 'KANO_TEMPLATE_FLOW_DEBUG', 'DOWNLOAD_ZIP', 'DOWNLOAD_LOG', 'DOWNLOAD_SOURCE_FILE', 'LOG_FILE', 'KANO_YQ_RUNTIME_DIR', 'KANO_INSTALL_TOOLBOX_DIR'].map(name => [name, path.join(dir, name)]));
    const script = run(slice('const removePluginOwnedArtifactsCmd =', 'const networkRescue =') + 'removePluginOwnedArtifactsCmd()', { ...constants, shellQuote: quote })
      .replaceAll('/data/', data + '/').replaceAll('/dev/', dev + '/');
    const result = shell(script);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(fs.readFileSync(receipt, 'utf8'), 'running task');
    assert.ok(!fs.existsSync(log)); assert.ok(!fs.existsSync(path.join(dev, 'kano_boot_write.lock')));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const installer of ['exited', 'running', 'unknown_entry']) test('uninstall cleanup releases only an exited installer lock / ' + installer, () => {
  const dir = temp(), proc = path.join(dir, 'proc'), lock = path.join(dir, 'clash.install.lock.d');
  try {
    fs.mkdirSync(proc); write(lock, 'pid', '333\n');
    if (installer === 'running') fs.mkdirSync(path.join(proc, '333'));
    if (installer === 'unknown_entry') write(lock, 'foreign', 'keep');
    const script = api.uninstall()[0].script.replace('f50_inspect || exit 1', 'f50_inspect() { F50_OLD_FOUND=0; }\nf50_inspect || exit 1');
    const result = shell(script, { F50_ROOT: path.join(dir, 'clash'), F50_PROC: proc });
    assert.equal(result.status, installer === 'exited' ? 0 : 1, result.stdout + result.stderr);
    assert.equal(fs.existsSync(lock), installer !== 'exited');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('uninstall cleanup handles interrupted Gist and YAML transactions before native network recovery', () => {
  const dir = temp(), root = path.join(dir, 'clash'), proc = path.join(dir, 'proc');
  try {
    fs.mkdirSync(proc);
    write(root, 'Tools/gist-sync/activation/id', 'fixture-activation\n');
    const config = write(root, 'Proxy/config.yaml', 'new config');
    write(root, 'Proxy/config.yaml.kano_tx/format', 'F50_CONFIG_TX_V1\n');
    write(root, 'Proxy/config.yaml.kano_tx/ready', ''); write(root, 'Proxy/config.yaml.kano_tx/config.had', '');
    write(root, 'Proxy/config.yaml.kano_tx/config', 'old config');
    const journal = write(root, 'Policy/rp-filter.json', 'saved network parameters');
    write(root, 'Scripts/Clash.Service', `#!/bin/sh
[ "$1" = recover ] && [ "$KANO_GIST_TRANSACTION" = fixture-activation ] && [ ! -d "$CLASH_ROOT/Proxy/config.yaml.kano_tx" ] || exit 1
rm -f "$CLASH_ROOT/Policy/rp-filter.json"
echo NATIVE_RECOVERY_DONE
`);
    const script = api.uninstall()[0].script.replace('f50_inspect || exit 1', 'f50_inspect() { F50_OLD_FOUND=1; }\nf50_network_snapshot() { mkdir -p "$1"; : > "$1/plan"; }\nf50_inspect || exit 1');
    const result = shell(script, { F50_ROOT: root, F50_PROC: proc });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /^F50_RECOVER_RC=0$/m); assert.ok(!fs.existsSync(journal));
    assert.equal(fs.readFileSync(config, 'utf8'), 'old config');
    assert.ok(fs.existsSync(path.join(root, 'Tools/gist-sync/activation/id')));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const mode of ['normal', 'uninstall', 'malformed']) test('boot cleanup preserves other plugins without requiring a working Gist binary / ' + mode, () => {
  const dir = temp(), boot = path.join(dir, 'boot.sh'), data = path.join(dir, 'data');
  try {
    const text = '#!/bin/sh\necho before\n# KANO_GIST_SYNC_BEGIN\n[ ! -x /data/clash/Scripts/Clash.GistSync ] || sh /data/clash/Scripts/Clash.GistSync boot\n'
      + (mode === 'malformed' ? '' : '# KANO_GIST_SYNC_END\n') + 'echo after\n';
    fs.writeFileSync(boot, text);
    const marker = path.join(dir, 'binary-ran');
    const binary = write(data, 'clash/Tools/kano-gist-sync', '#!/bin/sh\ntouch ' + quote(marker) + '\nexit 126\n'); fs.chmodSync(binary, 0o755);
    const names = ['BOOT_ASYNC_LINE', 'BOOT_CLEANUP_LINE', 'LEGACY_BOOT_SERVICE_LINE', 'BOOT_SERVICE_LINE', 'LEGACY_BOOT_FIX_WRAPPER_LINE', 'LEGACY_BOOT_INOTIFY_LINE', 'BOOT_INOTIFY_LINE', 'LEGACY_BOOT_POLICY_TOOLS_LINE', 'BOOT_POLICY_TOOLS_LINE', 'LEGACY_BOOT_MAC_BYPASS_LINE'];
    const constants = Object.fromEntries(names.map(name => [name, 'unused ' + name]));
    const editor = run(slice('const removeBootLinesCmd =', '// 策略脚本') + 'removeBootLinesCmd', { ...constants, BOOT_FILE: boot, shellQuote: quote });
    const script = (mode === 'normal' ? editor() : shellApi(source, '', { BOOT_FILE: boot, removeBootLinesCmd: editor }).uninstall()[1].script)
      .replaceAll('/dev/kano_boot_write.lock', path.join(dir, 'boot.lock')).replaceAll('/data/', data + '/');
    const result = shell(script);
    assert.equal(result.status, mode === 'malformed' ? 1 : 0, result.stdout + result.stderr);
    const after = fs.readFileSync(boot, 'utf8');
    if (mode === 'uninstall') assert.equal(after, '#!/bin/sh\necho before\necho after\n');
    else assert.equal(after, text);
    assert.ok(!fs.existsSync(marker));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const outcome of ['released_response_lost', 'still_owned', 'release_unknown', 'recovered', 'recovered_during_release']) {
  test('browser lease release reconciliation / ' + outcome, async () => {
    const op = { token: { id: 'fixture' }, leaseOwned: true, recovered: outcome === 'recovered' };
    let releases = 0, checks = 0;
    const sandbox = {
      buildF50LeaseFunctions: api.lease, shellQuote: quote, clearInterval() {}, syncCriticalOperationStatus() {},
      operationCancelled: () => Object.assign(new Error('cancelled'), { name: 'OperationCancelled' }),
      f50Diagnostic: () => ({}), createToast() {}, safeTextToHtml: String,
      hostRunShellWithRoot: async command => {
        if (command.includes('\nf50_lease_release ')) {
          if (outcome === 'recovered_during_release') op.recovered = true;
          if (++releases === 1) throw Error('Load failed');
          return { success: true, content: 'F50_LEASE_RELEASED=1' };
        }
        assert.ok(command.includes('\nf50_lease_status ')); checks++;
        if (['release_unknown', 'recovered_during_release'].includes(outcome)) throw Error('Load failed');
        return { success: true, content: outcome === 'still_owned' ? 'F50_LEASE_OWNED=1' : 'F50_LEASE_RELEASED=1' };
      },
    };
    const handlers = run(slice('let transientShellOperation', 'const shellQuote') + '({release:f50ReleaseLease,unknown:f50UnknownCompletion,state:()=>deviceTaskUncertain})', sandbox);
    await handlers.release(op);
    assert.equal(handlers.state(), outcome === 'release_unknown');
    if (outcome.startsWith('recovered')) {
      handlers.unknown(op, 'late failed response');
      assert.equal(handlers.state(), false);
    } else assert.equal(op.leaseOwned, outcome === 'release_unknown');
    assert.equal(releases, outcome === 'recovered' ? 0 : outcome === 'still_owned' ? 2 : 1);
    assert.equal(checks, outcome === 'recovered' ? 0 : 1);
  });
}

for (const [responseLost, exitCode, format] of [[false, 0], [true, 0], [false, 7], [true, 7], [true, 0, 'nested'], [true, 0, 'string']]) test('device task receipt retains output until lease release / ' + responseLost + '/' + exitCode + '/' + (format || 'direct'), async () => {
  const dir = temp(), tasks = path.join(dir, 'tasks'), lease = path.join(dir, 'lease');
  const env = { F50_OPERATION_LOCK: lease, F50_TASK_DIR: tasks, F50_RECOVERY_LOCK: path.join(dir, 'recovery') };
  const op = { token: { id: 'fixture' }, requests: 0 };
  let businessCalls = 0;
  try {
    const sandbox = {
      activeCriticalOperation: op, taskCommandSequence: 0, KANO_INSTALL_TOOLBOX_BIN: path.join(dir, 'bin'),
      buildF50LeaseFunctions: api.lease, shellQuote: run(slice('const shellQuote =', 'const templateFlowMessages') + 'shellQuote'), setInterval: () => 1, clearInterval() {},
      operationCancelled: () => Object.assign(new Error('cancelled'), { name: 'OperationCancelled' }),
      f50Diagnostic: () => ({}), createToast() {}, safeTextToHtml: String, syncCriticalOperationStatus() {},
      hostRunShellWithRoot: async command => {
        const result = shell(command, env);
        if (command.includes('\nenv KANO_TPROXY_TASK=')) {
          businessCalls++;
          if (responseLost) throw Error('Load failed');
        }
        return format === 'nested' ? { success: result.status === 0, content: 'command echo', data: { content: result.stdout } }
          : format === 'string' ? result.stdout : { success: result.status === 0, content: result.stdout };
      },
    };
    const handlers = run(slice('let transientShellOperation', 'const shellQuote') + '({execute:runShellWithRoot,release:f50ReleaseLease})', sandbox);
    const result = await handlers.execute("printf 'first\\nsecond'; printf 'error\\n' >&2; exit " + exitCode);
    assert.equal(result.deviceCompleted, true); assert.equal(result.deviceExitCode, exitCode);
    assert.equal(result.success, exitCode === 0); assert.equal(result.content, 'first\nseconderror\n');
    const receipt = path.join(tasks, 'mm_fixture.1');
    assert.match(fs.readFileSync(receipt, 'utf8'), new RegExp('finished ' + exitCode + '\nfirst\nseconderror\n$'));
    assert.equal(businessCalls, 1);
    await handlers.release(op);
    assert.equal(op.leaseOwned, false);
    assert.equal(fs.existsSync(tasks), false); assert.equal(fs.existsSync(lease), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const uninstall of [false, true]) test('pending Gist activation blocks ordinary writes but permits explicit uninstall / ' + uninstall, async () => {
  const dir = temp(), root = path.join(dir, 'clash');
  const env = { F50_OPERATION_LOCK: path.join(dir, 'lease'), F50_TASK_DIR: path.join(dir, 'tasks'), F50_RECOVERY_LOCK: path.join(dir, 'recovery') };
  const op = { token: { id: 'fixture' }, requests: 0, uninstall };
  try {
    const activation = write(root, 'Tools/gist-sync/activation/id', 'fixture-activation\n');
    const sandbox = {
      activeCriticalOperation: op, taskCommandSequence: 0, KANO_INSTALL_TOOLBOX_BIN: path.join(dir, 'bin'),
      buildF50LeaseFunctions: api.lease, shellQuote: run(slice('const shellQuote =', 'const templateFlowMessages') + 'shellQuote'),
      setInterval: () => 1, clearInterval() {}, syncCriticalOperationStatus() {},
      operationCancelled: () => Object.assign(new Error('cancelled'), { name: 'OperationCancelled' }),
      f50Diagnostic: () => ({}), createToast() {}, safeTextToHtml: String,
      hostRunShellWithRoot: async command => {
        const result = shell(command.replaceAll('/data/clash', root), env);
        return { success: result.status === 0, content: result.stdout };
      },
    };
    const handlers = run(slice('let transientShellOperation', 'const shellQuote') + '({execute:runShellWithRoot,release:f50ReleaseLease})', sandbox);
    const result = await handlers.execute('echo BODY_RAN');
    assert.equal(result.success, uninstall); assert.equal(result.deviceCompleted, true);
    assert.match(result.content, uninstall ? /BODY_RAN/ : /F50_ERROR=gist_transaction_pending/);
    assert.equal(fs.readFileSync(activation, 'utf8'), 'fixture-activation\n');
    await handlers.release(op); assert.equal(op.leaseOwned, false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const invalid of ['running', 'foreign_owner', 'invalid_identity']) test('browser lease preserves unfinished or invalid receipts / ' + invalid, () => {
  const dir = temp(), lease = path.join(dir, 'lease'), tasks = path.join(dir, 'tasks');
  try {
    write(dir, 'lease/owner', 'mm_fixture\n');
    const record = `F50_TASK_V2 ${invalid === 'foreign_owner' ? 'mm_other' : 'mm_fixture'} mm_fixture.1 ${invalid === 'invalid_identity' ? 'bad' : '111'} 21 222 22 ${invalid === 'running' ? 'running' : 'finished'} 0\n`;
    const receipt = write(tasks, 'mm_fixture.1', record);
    const result = shell(api.lease() + '\nf50_lease_release mm_fixture', {
      F50_OPERATION_LOCK: lease, F50_TASK_DIR: tasks, F50_RECOVERY_LOCK: path.join(dir, 'recovery'),
    });
    assert.equal(result.status, 1); assert.match(result.stdout, /F50_OPERATION_WORKER_REMAINS/);
    assert.equal(fs.readFileSync(receipt, 'utf8'), record);
    assert.equal(fs.readFileSync(path.join(lease, 'owner'), 'utf8'), 'mm_fixture\n');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const active of [false, true]) test('recovery registry / old rescue owner ' + active, () => {
  const dir = temp(), proc = path.join(dir, 'proc'), lease = path.join(dir, 'lease');
  try {
    fs.mkdirSync(proc);
    write(dir, 'lease/owner', 'rescue_111\n'); write(dir, 'lease/cancelled', 'recovery\n');
    if (active) fs.mkdirSync(path.join(proc, '111'));
    const result = shell(api.maintenance('cleanup') + api.eligibility() + '\nF50_RECOVERY_PREEMPT=1 f50_recovery_eligible', {
      F50_ROOT: path.join(dir, 'clash'), F50_PROC: proc, F50_OPERATION_LOCK: lease, F50_TASK_DIR: path.join(dir, 'tasks'),
    });
    assert.equal(result.status, active ? 1 : 0, result.stdout + result.stderr);
    assert.match(result.stdout, new RegExp('F50_RECOVERY_STATE=' + (active ? 'active_recovery' : 'quiescent_lease')));
    assert.equal(fs.readFileSync(path.join(lease, 'owner'), 'utf8'), 'rescue_111\n');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const outcome of ['precheck_lost', 'precheck_blocked', 'response_lost', 'partial', 'config_restore_failed', 'backup_retained', 'recovered']) {
  test('network recovery reports confirmed state / ' + outcome, async () => {
    const op = { token: { id: 'fixture' }, leaseOwned: true }, toasts = [], titles = [];
    let calls = 0;
    const sandbox = {
      activeCriticalOperation: op, recoveryInProgress: false,
      buildF50ShellBase: () => '', buildF50ProcessHelpers: () => '', buildF50RecoveryEligibilityFunctions: () => '',
      buildF50EmergencyScript: () => 'RECOVER', clearInterval() {},
      createOperationProgress: () => ({ stage() {}, finish() {} }),
      f50Diagnostic: details => ({ details }), createToast: text => toasts.push(text), safeTextToHtml: String,
      sanitizeSubscriptionSecrets: String, showInfoDialog: (id, title) => titles.push(title),
      invalidateStatusSnapshot() {}, invalidateBinarySnapshot() {}, syncCriticalOperationStatus() {},
      renderRuntimeStatus() {}, document: { querySelector: () => null },
      operationCancelled: () => Object.assign(new Error('cancelled'), { name: 'OperationCancelled' }),
      hostRunShellWithRoot: async () => {
        if (++calls === 1) return { success: outcome !== 'precheck_lost', content: outcome === 'precheck_lost' ? 'signal is aborted without reason'
          : outcome === 'precheck_blocked' ? 'F50_RECOVERY_STATE=active_recovery\nF50_RECOVERY_ELIGIBLE=0' : 'F50_RECOVERY_ELIGIBLE=1' };
        return { success: ['recovered', 'backup_retained'].includes(outcome), content: outcome === 'recovered' ? 'RECOVERY_VERIFIED'
          : outcome === 'backup_retained' ? 'F50_RECOVERY_BACKUP=/fixture/backup\nRECOVERY_VERIFIED'
          : outcome === 'config_restore_failed' ? 'F50_NETWORK_RELEASED=1\nF50_RECOVERY_CONFIG_FAILED=1\nF50_RECOVERY_PARTIAL=1'
          : outcome === 'partial' ? 'F50_RECOVERY_PARTIAL=1' : 'Load failed' };
      },
    };
    const handlers = run(slice('let transientShellOperation', 'const shellQuote')
      + slice('const networkRescue =', 'const startClashServiceClean =')
      + '({rescue:networkRescue,unknown:f50UnknownCompletion,state:()=>deviceTaskUncertain})', sandbox);
    assert.equal(await handlers.rescue({ preempt: true }), ['recovered', 'backup_retained'].includes(outcome));
    assert.equal(calls, outcome.startsWith('precheck') ? 1 : 2);
    if (['recovered', 'backup_retained'].includes(outcome)) {
      assert.equal(op.recovered, true); assert.equal(op.leaseOwned, false);
      handlers.unknown(op, 'late response'); assert.equal(handlers.state(), false);
    } else {
      assert.ok(!op.recovered);
      assert.match(toasts[0], outcome === 'config_restore_failed' ? /网络接管已释放，但配置恢复失败/ : /恢复失败/);
      assert.ok(!toasts.join('\n').includes('待确认'));
      assert.ok(!toasts.join('\n').includes('仍有残留'));
      if (outcome === 'response_lost') assert.deepEqual(titles, ['恢复失败']);
    }
  });
}
