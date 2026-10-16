'use strict';

const test = require('node:test');
const { fs, path, assert, shell, shellApi, quote, temp, write, source } = require('./optimization_harness');
const yq = process.env.F50_TEST_YQ;
const config = 'secret: existing-secret\nproxies:\n  - {name: Test, type: socks5, server: example.com, port: 1080}\n';

function installCase(options = {}) {
  const dir = temp(), root = path.join(dir, 'clash'), pkg = path.join(dir, 'package');
  const writePackage = (relative, text) => write(pkg, relative, text);
  writePackage('Scripts/clashctl_arm64', '#!/bin/sh\necho F50_CONTROLLER=8.0.0-compat.2.3\n');
  writePackage('Tools/f50-controller.version', '8.0.0-compat.2.3\n');
  writePackage('Proxy/Clash.Core', '#!/bin/sh\necho Mihomo-test\n');
  writePackage('Tools/yq_linux_arm64', `#!/bin/sh\nexec ${quote(yq)} "$@"\n`);
  writePackage('Proxy/config.yaml', options.invalidConfig ? 'rules: [\n' : config);
  writePackage('Tools/template.yaml', config);
  writePackage('Tools/template.base.yaml', config);
  const startOutput = options.startOutput || 'START_STATE=started_verified_process';
  writePackage('Scripts/Clash.Service', `#!/bin/sh
if [ "$1" = version ]; then echo F50_CONTROLLER=8.0.0-compat.2.3; exit 0; fi
echo started > "$CLASH_ROOT/started"
printf '%s\\n' ${quote(startOutput)}
exit ${options.startRc || 0}
`);
  writePackage('Proxy/WebUI/zashboard/index.html', '<title>zashboard</title><script src="./assets/main.js"></script>');
  writePackage('Proxy/WebUI/zashboard/manifest.webmanifest', '{"name":"zashboard","short_name":"zashboard"}');
  writePackage('Proxy/WebUI/zashboard/registerSW.js', 'register');
  writePackage('Proxy/WebUI/zashboard/assets/main.js', 'zashboard');
  const components = path.resolve(__dirname,'../../build/gist-sync/clash');
  for (const rel of ['Tools/age','Tools/kano-gist-sync','Tools/age.LICENSE','Tools/gist-sync-component.json','Scripts/Clash.GistSync','Scripts/Clash.ConfigCommit']) writePackage(rel,fs.readFileSync(path.join(components,rel)));
  if (options.legacy) for (const rel of ['Tools/age','Tools/kano-gist-sync','Tools/age.LICENSE','Tools/gist-sync-component.json','Scripts/Clash.GistSync','Scripts/Clash.ConfigCommit']) fs.rmSync(path.join(pkg,rel));
  if (options.missing) fs.rmSync(path.join(pkg, options.missing));
  if (options.old) {
    write(root, 'Proxy/config.yaml', config + 'custom-old: retained\n');
    write(root, 'Proxy/Clash.Core', 'old core');
    write(root, 'Scripts/Clash.Service', '#!/bin/sh\necho START_STATE=started_verified_process\n');
    if (options.stopped) write(root, 'Policy/stopped', 'explicit stop');
  }
  const zip = write(dir, 'upload.zip', 'mock archive');
  const cleanupFault = options.stagingCleanupFailure ? write(dir, 'cleanup-fault', 'once') : '';
  const interruptFault = options.interruptDuringCleanup ? write(dir, 'interrupt-fault', 'once') : '';
  const api = shellApi(source, `buildF50HttpSubscriptionPatchScript = () => 'true'; buildF50OriginalServicePatchScript = () => ${JSON.stringify(options.patchFailure ? 'false' : 'true')}; rotateClashLogCmd = () => ''; dataSpaceGuardCmd = () => '';`);
  const mocks = `
f50_limit() {
 shift
 case "$1" in
 */Tools/kano-gist-sync) if [ "$2" = start-daemon ]; then printf resumed > ${quote(path.join(root,'gist-resumed'))}; return 0; fi; ${options.runtimeProbeFailure ? 'echo \'{"ok":true,"version":"1.0.0-rc4","protocol":1}\'; return 1;' : ''} ${options.futureVersion ? 'echo \'{"ok":true,"version":"1.1.0","protocol":1}\'; return 0;' : ''} shift; ${quote(path.resolve(__dirname,'../../build/gist-sync/bin/kano-gist-sync-linux-amd64'))} "$@";;
 */Tools/age) ${options.futureVersion ? 'echo v1.99.0; return 0;' : ''} shift; ${quote(path.resolve(__dirname,'../../.cache/gist-sync/tools/age-amd64/age'))} "$@";;
 *) "$@";;
 esac
}
unzip() {
  if [ "$1" = -Z1 ]; then printf '%s\\n' ${quote(options.unsafeZip ? '../escape' : 'Scripts/clashctl_arm64')}; return 0; fi
  if [ "$1" = -l ]; then echo '4096 10 files'; return 0; fi
  if [ "$1" = -q ]; then cp -R ${quote(pkg + '/.')} "$4/"; return $?; fi
  return 1
}
f50_inspect() {
  F50_OLD_RUNNING=${options.running ? 1 : 0}; F50_OLD_FOUND=${options.old ? 1 : 0}
  ${options.unknownLockEntry ? 'printf foreign > "$F50_DATA/clash.install.lock.d/unknown"' : ''}
  echo F50_INSPECT_OK=1
}
f50_clean_environment() {
  clean_calls=$((\${clean_calls:-0} + 1))
  ${interruptFault ? `if [ -f ${quote(interruptFault)} ]; then rm -f ${quote(interruptFault)}; kill -TERM "$$"; fi` : ''}
  if [ ${options.rollbackCleanupFailure ? 1 : 0} = 1 ] && [ "$clean_calls" -gt 1 ]; then return 1; fi
  return ${options.cleanupFailure ? 1 : 0}
}
f50_drop_detached_tun_rules() { return 0; }
f50_disable_unsupported_ipv6_dns_hijack() { return 0; }
f50_verify_zashboard_endpoint() { return ${options.panelFailure ? 1 : 0}; }
${options.lockCleanupFailure ? 'rmdir() { case "$1" in */clash.install.lock.d) return 1;; esac; command rmdir "$@"; }' : ''}
${cleanupFault ? `rm() { case "$1:$2" in -rf:*/.f50-install.*) if [ -f ${quote(cleanupFault)} ]; then command rm -f ${quote(cleanupFault)}; return 1; fi;; esac; command rm "$@"; }` : ''}
`;
  const script = api.install(zip).replace('# The transaction owns staging', () => mocks + '\n# The transaction owns staging');
  const execute = () => shell(script, { F50_ROOT: root.replace(/\\/g, '/') });
  return { dir, root, result: execute(), execute };
}

test('failed rollback retains the old backup and reports blocked cleanup', { skip: !yq }, () => {
  const { dir, result } = installCase({ old: true, running: true, startRc: 124, rollbackCleanupFailure: true });
  try {
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^F50_ROLLBACK=blocked_by_cleanup$/m);
    const match = result.stdout.match(/^F50_RECOVERY_BACKUP=(.+)$/m);
    assert.ok(match);
    assert.equal(fs.readFileSync(path.join(match[1], 'Proxy/Clash.Core'), 'utf8'), 'old core');
    assert.ok(fs.readdirSync(dir).some(name => name.startsWith('.f50-install.')));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('installation interruption preserves the old configuration and permits a complete retry', { skip: !yq }, () => {
  const { dir, root, result, execute } = installCase({ old: true, running: true, interruptDuringCleanup: true });
  try {
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /^F50_INSTALL_CODE=interrupted$/m);
    assert.match(result.stdout, /^F50_ROLLBACK=restored_stopped$/m);
    assert.equal(fs.readFileSync(path.join(root, 'Proxy/Clash.Core'), 'utf8'), 'old core');
    assert.match(fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), /custom-old: retained/);
    assert.equal(fs.existsSync(path.join(dir, 'clash.install.lock.d')), false);
    const retry = execute();
    assert.equal(retry.status, 0, retry.stdout + retry.stderr);
    assert.match(retry.stdout, /^F50_INSTALL_TRANSACTION_STATE=complete$/m);
    assert.match(retry.stdout, /^KANO_INSTALL_OK=1$/m);
    assert.match(fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), /custom-old: retained/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const [name, options, status] of [
  ['new installation', {}, 'installed_running'],
  ['running upgrade', { old: true, running: true }, 'installed_running'],
  ['explicitly stopped upgrade', { old: true, stopped: true }, 'installed_stopped'],
  ['running upgrade with stale stop latch', { old: true, stopped: true, running: true }, 'installed_running'],
  ['old installation without explicit stop latch', { old: true }, 'installed_running'],
]) {
  test(name, { skip: !yq }, () => {
    const { dir, root, result } = installCase(options);
    try {
      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.match(result.stdout, new RegExp('F50_INSTALL_STATUS=' + status));
      assert.equal(fs.existsSync(path.join(root, 'started')), status === 'installed_running');
      if (options.old) assert.match(fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), /custom-old: retained/);
      assert.match(fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), /secret: existing-secret/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

for (const [name, options, code] of [
  ['unsafe ZIP path', { unsafeZip: true }, 'unsafe_archive_path'],
  ['missing controller', { missing: 'Scripts/clashctl_arm64' }, 'missing_controller'],
  ['missing fresh core', { missing: 'Proxy/Clash.Core' }, 'missing_core'],
  ['missing YAML component', { missing: 'Tools/yq_linux_arm64' }, 'yaml_parser_not_executable'],
  ['invalid YAML', { invalidConfig: true }, 'config_probe_failed'],
  ['start timeout', { old: true, running: true, startRc: 124 }, 'start_timeout'],
  ['invalid core config', { old: true, running: true, startOutput: 'F50_ERROR=original_config_invalid', startRc: 1 }, 'invalid_config'],
  ['network application failure', { old: true, running: true, startOutput: 'F50_ERROR=iptables_apply_failed', startRc: 8 }, 'network_apply_failed'],
  ['service patch failure', { old: true, running: true, patchFailure: true }, 'service_patch_failed'],
]) {
  test(name + ' preserves failure code and old installation', { skip: !yq }, () => {
    const { dir, root, result } = installCase(options);
    try {
      assert.equal(result.status, 1, result.stderr + result.stdout);
      assert.match(result.stdout, new RegExp('^F50_INSTALL_CODE=' + code + '$', 'm'));
      assert.ok(!result.stdout.includes('KANO_INSTALL_OK=1'));
      if (options.old) {
        if (options.patchFailure || options.missing?.startsWith('Tools/') || options.runtimeProbeFailure) assert.ok(!result.stdout.includes('F50_ROLLBACK='), 'candidate failure never enters activation');
        else assert.match(result.stdout, /^F50_ROLLBACK=restored$/m);
        assert.equal(fs.readFileSync(path.join(root, 'Proxy/Clash.Core'), 'utf8'), 'old core');
        assert.match(fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), /custom-old: retained/);
      }
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

test('panel HTTP failure reports a warning and retains successfully started components', { skip: !yq }, () => {
  const { dir, root, result } = installCase({ old: true, running: true, panelFailure: true });
  try {
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /^F50_HEALTH_PANEL=failed$/m);
    assert.match(result.stdout, /^F50_INSTALL_COMPONENTS_OK=1$/m);
    assert.match(result.stdout, /^KANO_INSTALL_OK=1$/m);
    assert.ok(!result.stdout.includes('F50_ROLLBACK=restored'));
    assert.ok(fs.existsSync(path.join(root, 'started')));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

for (const option of ['lockCleanupFailure', 'unknownLockEntry', 'stagingCleanupFailure']) {
  test('successful installation with ' + option + ' reports finalization failure and permits only safe retry', { skip: !yq }, () => {
    const { dir, root, result, execute } = installCase({ [option]: true });
    try {
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stdout, /^F50_INSTALL_COMPONENTS_OK=1$/m);
      assert.match(result.stdout, /^F50_INSTALL_TRANSACTION_STATE=finalize_failed$/m);
      assert.match(result.stdout, /^KANO_INSTALL_OK=0$/m);
      assert.ok(!result.stdout.includes('F50_ROLLBACK='));
      assert.ok(fs.existsSync(path.join(root, 'started')));
      const retry = execute();
      if (option === 'stagingCleanupFailure') {
        assert.equal(retry.status, 0, retry.stdout + retry.stderr);
        assert.match(retry.stdout, /^F50_INSTALL_TRANSACTION_STATE=complete$/m);
      } else {
        assert.equal(retry.status, 1);
        assert.match(retry.stdout, /^F50_INSTALL_CODE=installation_busy$/m);
        if (option === 'unknownLockEntry') assert.equal(fs.readFileSync(path.join(dir, 'clash.install.lock.d/unknown'), 'utf8'), 'foreign');
      }
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

test('repeated full update preserves private identity and exact settings bytes', {skip:!yq},()=>{
 const c=installCase({old:true,stopped:true});
 try {
  assert.equal(c.result.status,0,c.result.stdout+c.result.stderr);
  const settings='{"url":"https://gist.githubusercontent.com/fixture/0123456789abcdef/raw/one.age","intervalHours":24,"auto":false}\n';
  const key='fixture-private-identity-never-log\n';
  write(c.root,'Tools/gist-sync/settings.conf',settings);write(c.root,'Tools/gist-sync/sources/fixture/identity.txt',key);
  fs.chmodSync(path.join(c.root,'Tools/gist-sync/sources/fixture/identity.txt'),0o600);
  for(let i=0;i<2;i++){
   const r=c.execute();assert.equal(r.status,0,r.stdout+r.stderr);
   assert.equal(fs.readFileSync(path.join(c.root,'Tools/gist-sync/settings.conf'),'utf8'),settings);
   assert.equal(fs.readFileSync(path.join(c.root,'Tools/gist-sync/sources/fixture/identity.txt'),'utf8'),key);
   assert.equal(fs.statSync(path.join(c.root,'Tools/gist-sync/sources/fixture/identity.txt')).mode&0o777,0o600);
  }
 }finally{fs.rmSync(c.dir,{recursive:true,force:true});}
});

for(const options of [{futureVersion:true},{missing:'Tools/gist-sync-component.json'},{missing:'Tools/age'},{missing:'Tools/kano-gist-sync'},{runtimeProbeFailure:true},{legacy:true}]) {
 test('compatible package installs without release pins '+JSON.stringify(options),{skip:!yq},()=>{
  const c=installCase(options);
  try {assert.equal(c.result.status,0,c.result.stdout+c.result.stderr);assert.match(c.result.stdout,/KANO_INSTALL_OK=1/);}
  finally {fs.rmSync(c.dir,{recursive:true,force:true});}
 });
}

test('legacy online update retains installed GistSync and its settings',{skip:!yq},()=>{
 const c=installCase({legacy:true,old:true,stopped:true});
 try {
  assert.equal(c.result.status,0,c.result.stdout+c.result.stderr);
  const components=path.resolve(__dirname,'../../build/gist-sync/clash');
  const files=['Tools/age','Tools/kano-gist-sync','Scripts/Clash.GistSync','Scripts/Clash.ConfigCommit'];
  for(const rel of files)write(c.root,rel,fs.readFileSync(path.join(components,rel)));
  const settings='{"auto":false,"intervalHours":24}\n';
  write(c.root,'Tools/gist-sync/settings.conf',settings);
  const result=c.execute();assert.equal(result.status,0,result.stdout+result.stderr);
  for(const rel of files)assert.deepEqual(fs.readFileSync(path.join(c.root,rel)),fs.readFileSync(path.join(components,rel)));
  assert.equal(fs.readFileSync(path.join(c.root,'Tools/gist-sync/settings.conf'),'utf8'),settings);
 }finally{fs.rmSync(c.dir,{recursive:true,force:true});}
});

for(const auto of [false,true])test('installation resumes only enabled automatic Gist '+auto,{skip:!yq},()=>{
 const c=installCase({old:true,stopped:true});try{
  write(c.root,'Tools/gist-sync/settings.conf',JSON.stringify({auto}));
  const result=c.execute();assert.equal(result.status,0,result.stdout+result.stderr);
  assert.equal(fs.existsSync(path.join(c.root,'gist-resumed')),auto);
 }finally{fs.rmSync(c.dir,{recursive:true,force:true});}
});
