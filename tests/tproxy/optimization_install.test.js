'use strict';

const test = require('node:test');
const { fs, path, assert, shell, shellApi, quote, temp, write, source } = require('./optimization_harness');
const yq = process.env.F50_TEST_YQ;
const config = 'secret: existing-secret\nproxies:\n  - {name: Test, type: socks5, server: example.com, port: 1080}\n';

function installCase(options = {}) {
  const dir = temp(), root = path.join(dir, 'clash'), pkg = path.join(dir, 'package');
  const writePackage = (relative, text) => write(pkg, relative, text);
  writePackage('Scripts/clashctl_arm64', '#!/bin/sh\necho F50_CONTROLLER=8.0.0-compat.2.3\n');
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
  if (options.missing) fs.rmSync(path.join(pkg, options.missing));
  if (options.old) {
    write(root, 'Proxy/config.yaml', config + 'custom-old: retained\n');
    write(root, 'Proxy/Clash.Core', 'old core');
    write(root, 'Scripts/Clash.Service', '#!/bin/sh\necho START_STATE=started_verified_process\n');
    if (options.stopped) write(root, 'Policy/stopped', 'explicit stop');
  }
  const zip = write(dir, 'upload.zip', 'mock archive');
  const api = shellApi(source, `buildF50OriginalServicePatchScript = () => ${JSON.stringify(options.patchFailure ? 'false' : 'true')}; rotateClashLogCmd = () => ''; dataSpaceGuardCmd = () => '';`);
  const mocks = `
f50_limit() { shift; "$@"; }
unzip() {
  if [ "$1" = -Z1 ]; then printf '%s\\n' ${quote(options.unsafeZip ? '../escape' : 'Scripts/clashctl_arm64')}; return 0; fi
  if [ "$1" = -q ]; then cp -R ${quote(pkg + '/.')} "$4/"; return $?; fi
  return 1
}
f50_inspect() {
  F50_OLD_RUNNING=${options.running ? 1 : 0}; F50_OLD_FOUND=${options.old ? 1 : 0}
  echo F50_INSPECT_OK=1
}
f50_clean_environment() {
  clean_calls=$((\${clean_calls:-0} + 1))
  if [ ${options.rollbackCleanupFailure ? 1 : 0} = 1 ] && [ "$clean_calls" -gt 1 ]; then return 1; fi
  return ${options.cleanupFailure ? 1 : 0}
}
f50_drop_detached_tun_rules() { return 0; }
f50_disable_unsupported_ipv6_dns_hijack() { return 0; }
f50_verify_zashboard_endpoint() { return ${options.panelFailure ? 1 : 0}; }
`;
  const script = api.install(zip).replace('# The transaction owns staging', mocks + '\n# The transaction owns staging');
  const result = shell(script, { F50_ROOT: root.replace(/\\/g, '/') });
  return { dir, root, result };
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
  ['panel HTTP failure', { old: true, running: true, panelFailure: true }, 'panel_http_failed'],
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
        assert.match(result.stdout, /^F50_ROLLBACK=restored$/m);
        assert.equal(fs.readFileSync(path.join(root, 'Proxy/Clash.Core'), 'utf8'), 'old core');
        assert.match(fs.readFileSync(path.join(root, 'Proxy/config.yaml'), 'utf8'), /custom-old: retained/);
      }
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}
