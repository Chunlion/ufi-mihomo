'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, '猫猫TProxy.js'), 'utf8').replace(/\r\n/g, '\n');
const shellPath = value => value.replace(/\\/g, '/').replace(/^([A-Za-z]):\//, (_, drive) => `/${drive.toLowerCase()}/`);
const quote = value => `'${shellPath(value).replace(/'/g, `'"'"'`)}'`;
const yq = process.env.F50_TEST_YQ;
function slice(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from);
  return source.slice(from, to);
}
function unpack(name) {
  const result = spawnSync('tar', ['-xOf', path.join(root, 'tproxy-yq.zip'), name], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.replace(/\r\n/g, '\n');
}
const service = unpack('Scripts/Clash.Service');

test('9.0.0 retains the bundled controller and wrapper protocol', async () => {
  assert.match(source, /猫猫TProxy v9\.0\.0/);
  assert.equal(unpack('Tools/f50-controller.version').trim(), '8.0.0-compat.2.3');
  assert.match(service, /^# KANO_SERVICE_WRAPPER_VERSION=8\.0\.0-compat\.2\.3$/m);
  for (const [version, expected] of [['8.0.0-compat.2.3', true], ['9.0.0', true]]) {
    let calls = 0;
    const ensure = vm.runInNewContext(source.match(/let f50BackendReady = false;[\s\S]*?\n}\n/)[0] + '\nensureCompatBackend', {
      buildF50HttpSubscriptionPatchScript: () => 'true', createToast() {},
      runShellWithRoot: async script => {
        calls++;
        assert.doesNotMatch(script, /cat .*f50-controller\.version/);
        return { success: true, content: `F50_CONTROLLER=${version}` };
      },
    });
    assert.equal(await ensure(), expected);
    assert.equal(await ensure(), expected);
    assert.equal(calls, expected ? 1 : 2);
  }
});

test('legacy sources migrate once; saved and custom configurations bypass migration', async () => {
  for (const configSource of ['template.yaml', 'uploaded_config', 'subscription_original']) {
    let saved = '', migrations = 0, legacyReads = 0;
    const sources = [{ name: 'Test', url: 'https://example.com/nodes.yaml' }];
    const read = vm.runInNewContext(slice('    const migrateLegacySubscriptionSources =', '    const inspectConfigNodeSource =')
      + slice('    const readCurrentSubSources =', '    const writeSubConfigByMode =') + '\nreadCurrentSubSources', {
      CLASH_SUB_URLS: '/subscriptions', CLASH_CONFIG: '/config', SUB_RULE_MODE_TEMPLATE: 'template',
      shellQuote: quote, normalizeSubSourceList: items => items,
      showLegacySuspiciousSubSourcesError: () => false, createToast() {}, appendTemplateFlowDebug() {},
      parseStoredSubSourcesFromText: text => text ? sources : [], parseLegacySubConfig: () => [],
      parseSubRuleModeFromText: () => 'template',
      readConfigSource: async () => configSource,
      runShellWithRoot: async script => ({ success: true, content: script.includes("'/subscriptions'") ? saved : '' }),
      readLegacySubscriptionSources: async () => { legacyReads++; return { sources }; },
      persistSubSourceState: async () => { migrations++; saved = 'saved'; return true; },
    });
    await read();
    await read();
    assert.equal(migrations, configSource === 'template.yaml' ? 1 : 0);
    assert.equal(legacyReads, migrations);
  }
});

for (const scenario of ['stopped upgrade', 'invalid wrapper', 'lock cleanup failure']) {
  test(scenario, { skip: !yq }, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-release-'));
    const installedRoot = path.join(dir, 'clash'), pkg = path.join(dir, 'package');
    function write(base, relative, text) {
      const file = path.join(base, relative);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
      return file;
    }
    try {
      const config = 'secret: existing-secret\ncustom-old: retained\nproxies:\n  - {name: Test, type: socks5, server: example.com, port: 1080}\n';
      write(installedRoot, 'Proxy/config.yaml', config);
      write(installedRoot, 'Proxy/Clash.Core', 'old core');
      write(installedRoot, 'Policy/stopped', 'explicit stop');
      write(installedRoot, 'Tools/config_source.conf', 'KANO_CONFIG_SOURCE=uploaded_config\n');
      const controller = '#!/bin/sh\n[ "$1" = version ] || echo started > "$CLASH_ROOT/started"\necho F50_CONTROLLER=8.0.0-compat.2.3\n';
      write(pkg, 'Scripts/clashctl_arm64', controller);
      write(pkg, 'Scripts/clashctl', controller);
      write(pkg, 'Proxy/Clash.Core', '#!/bin/sh\necho Mihomo-test\n');
      write(pkg, 'Tools/yq_linux_arm64', `#!/bin/sh\nexec ${quote(yq)} "$@"\n`);
      write(pkg, 'Proxy/config.yaml', config);
      write(pkg, 'Tools/template.yaml', config);
      write(pkg, 'Tools/template.base.yaml', config);
      const context = {
        shellQuote: quote, F50_FILES_DIR: shellPath(dir), KANO_INSTALL_TOOLBOX_BIN: shellPath(dir),
        F50_ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
      };
      const api = vm.runInNewContext(slice('const F50_PORTS', 'const F50_COMPAT_VERSION')
        + slice('const F50_ORIGINAL_MANAGED_KEYS', 'let f50BackendReady')
        + slice('const rotateClashLogCmd', 'async function installF50PackageAtDevicePath')
          .replace('const rotateClashLogCmd =', 'let rotateClashLogCmd =')
          .replace('const dataSpaceGuardCmd =', 'let dataSpaceGuardCmd =')
        + '\nrotateClashLogCmd = () => ""; dataSpaceGuardCmd = () => ""; buildF50HttpSubscriptionPatchScript = () => "true";'
        + '\n({install:buildF50InstallScript, locator:buildF50CurlLocator})', context);
      const legacyService = service.replace(api.locator(), '')
        .replace('  f50_find_curl || return 1\n', '')
        .replace('code=$("$F50_CURL_BIN" -sS', 'code=$(curl -sS')
        .replace(/^.*F50_API_AVAILABLE=.*\n/gm, '')
        .replace(/^\s*echo F50_(CORE_STARTED|PANEL_RELOAD_OK)=[01]\n/gm, '')
        .replace(/^case "\$action" in start\|restart\|boot\) echo F50_SERVICE_BODY_FINALIZED=1;; esac\n/m, '')
        .replace('    repair_panel_config || { echo F50_SERVICE_FINALIZED=0; exit 1; }', '    repair_panel_config || exit 1');
      assert.ok(!legacyService.includes('# KANO_CURL_ABSOLUTE=1'));
      write(pkg, 'Scripts/Clash.Service', scenario === 'invalid wrapper' ? '#!/bin/sh\nexit 0\n' : legacyService);
      write(pkg, 'Proxy/WebUI/zashboard/index.html', '<title>zashboard</title><script src="./assets/main.js"></script>');
      write(pkg, 'Proxy/WebUI/zashboard/manifest.webmanifest', '{"name":"zashboard","short_name":"zashboard"}');
      write(pkg, 'Proxy/WebUI/zashboard/registerSW.js', 'register');
      write(pkg, 'Proxy/WebUI/zashboard/assets/main.js', 'zashboard');
      for(const rel of ['Tools/age','Tools/kano-gist-sync','Tools/age.LICENSE','Tools/gist-sync-component.json','Scripts/Clash.GistSync','Scripts/Clash.ConfigCommit']) write(pkg,rel,fs.readFileSync(path.join(root,'build/gist-sync/clash',rel)));
      const zip = write(dir, 'upload.zip', 'mock archive');
      const mocks = `
f50_limit() { shift
 case "$1" in
 */Tools/kano-gist-sync) shift; ${quote(path.join(root,'build/gist-sync/bin/kano-gist-sync-linux-amd64'))} "$@";;
 */Tools/age) shift; ${quote(path.join(root,'.cache/gist-sync/tools/age-amd64/age'))} "$@";;
 *) "$@";; esac
}
unzip() {
  if [ "$1" = -Z1 ]; then echo Scripts/clashctl_arm64; return 0; fi
  if [ "$1" = -l ]; then echo '4096 10 files'; return 0; fi
  if [ "$1" = -q ]; then cp -R ${quote(pkg + '/.')} "$4/"; return $?; fi
  return 1
}
f50_inspect() { F50_OLD_RUNNING=0; F50_OLD_FOUND=1; echo F50_INSPECT_OK=1; }
f50_clean_environment() { return 0; }
${scenario === 'lock cleanup failure' ? 'rmdir() { case "$1" in */clash.install.lock.d) return 1;; esac; command rmdir "$@"; }' : ''}
`;
      const script = api.install(zip).replace('# The transaction owns staging', mocks + '\n# The transaction owns staging');
      const result = spawnSync('sh', ['-s'], { input: script, encoding: 'utf8', timeout: 30000,
        env: { ...process.env, F50_ROOT: shellPath(installedRoot) } });
      assert.ifError(result.error);
      assert.equal(result.status, scenario === 'stopped upgrade' ? 0 : 1, result.stdout + result.stderr);
      assert.equal(fs.existsSync(path.join(installedRoot, 'started')), false);
      assert.match(fs.readFileSync(path.join(installedRoot, 'Proxy/config.yaml'), 'utf8'), /custom-old: retained/);
      assert.equal(fs.readFileSync(path.join(installedRoot, 'Tools/config_source.conf'), 'utf8'), 'KANO_CONFIG_SOURCE=uploaded_config\n');
      if (scenario === 'invalid wrapper') {
        assert.match(result.stdout, /^F50_INSTALL_CODE=service_patch_failed$/m);
        assert.equal(fs.readFileSync(path.join(installedRoot, 'Proxy/Clash.Core'), 'utf8'), 'old core');
      } else {
        assert.match(fs.readFileSync(path.join(installedRoot, 'Scripts/Clash.Service'), 'utf8'), /^# KANO_CURL_ABSOLUTE=1$/m);
        assert.match(result.stdout, /^F50_INSTALL_STATUS=installed_stopped$/m);
        assert.match(result.stdout, scenario === 'stopped upgrade' ? /^KANO_INSTALL_OK=1$/m : /^KANO_INSTALL_OK=0$/m);
        if (scenario === 'lock cleanup failure') assert.match(result.stdout, /^F50_INSTALL_TRANSACTION_STATE=finalize_failed$/m);
      }
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}
