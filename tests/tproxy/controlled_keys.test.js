'use strict';

// 四条链路必须使用同一组受控键：JS 整形、Service 恢复 yq、Gist 同步、差分参考实现。
// 差分测试发现不了这里的偏差——它的参考实现是 normalize.go 的镜像，两边一起错就一起"通过"。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const plugin = read('猫猫TProxy.js');
const native = read('gist-sync/native/normalize.go');
const reference = read('tests/gist-sync/baseline-normalizer.js');

// JS 侧直接执行常量段拿真实数组，避免正则漏判别名（CONTROLLED_DNS_KEYS = F50_ORIGINAL_DNS_KEYS）
// 和多行定义（F50_RESTORE_EXCLUDED_KEYS）。PROFILE_DELTA 只是为了那行 F50_ORIGINAL_TUN_KEYS 可执行。
function pluginConstants() {
  const from = plugin.indexOf('const F50_ORIGINAL_MANAGED_KEYS');
  const to = plugin.indexOf('function buildF50EmergencyScript', from);
  assert.ok(from > 0 && to > from, '插件受控键常量段缺失');
  const tail = ';({tun:CONTROLLED_TUN_KEYS,dns:CONTROLLED_DNS_KEYS,top:CONTROLLED_TOP_KEYS,excluded:F50_RESTORE_EXCLUDED_KEYS})';
  return vm.runInNewContext(`const PROFILE_DELTA={tproxy4:{tun:{}}};\n${plugin.slice(from, to)}${tail}`);
}
const constants = pluginConstants();
const sorted = (values) => [...new Set(values)].sort();
// goKeys('tun') 取 controlledNetworkKeys 里的 tun 段。
function goKeys(section) {
  const match = new RegExp(`"${section}":\\s*\\{([^}]*)\\}`).exec(native);
  assert.ok(match, `normalize.go 缺少 ${section} 受控键`);
  return sorted(match[1].match(/"([^"]+)"/g).map((item) => item.slice(1, -1)));
}
function referenceKeys(section) {
  const start = reference.indexOf('const controlled = key === \'dns\'');
  assert.ok(start > 0, 'baseline-normalizer 缺少 controlled 列表');
  const window = reference.slice(start, start + 400);
  const match = section === 'dns'
    ? /\['enable', 'listen'\]/.exec(window)
    : /key === 'tun' \? (\[[^\]]*\])/.exec(window);
  assert.ok(match, `baseline-normalizer 缺少 ${section} 受控键`);
  return sorted((match[1] || match[0]).match(/'([^']+)'/g).map((item) => item.slice(1, -1)));
}
function packageKeys(section) {
  const archive = spawnSync('tar', ['-xOf', path.join(root, 'tproxy-yq.zip'), 'Scripts/Clash.Service'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  assert.equal(archive.status, 0, `读取包内 Service 失败：${archive.stderr}`);
  const pattern = section === 'dns' ? /omit\(\[("enable","listen")\]\)/ : /omit\(\[("enable","device"[^\]]*)\]\)/;
  const match = pattern.exec(archive.stdout.replace(/\r\n/g, '\n'));
  assert.ok(match, `包内 Service 缺少 ${section} 受控键`);
  return sorted(match[1].match(/"([^"]+)"/g).map((item) => item.slice(1, -1)));
}

test('controlled tun keys are identical across the four links', () => {
  const expected = sorted(constants.tun);
  assert.deepEqual(goKeys('tun'), expected, 'gist-sync/native/normalize.go 与插件受控 tun 键不一致');
  assert.deepEqual(referenceKeys('tun'), expected, 'tests/gist-sync/baseline-normalizer.js 与插件受控 tun 键不一致');
  assert.deepEqual(packageKeys('tun'), expected, '包内 Scripts/Clash.Service 与插件受控 tun 键不一致（需 refresh_package_service）');
});

test('controlled dns keys are identical across the four links', () => {
  const expected = sorted(constants.dns);
  assert.deepEqual(goKeys('dns'), expected);
  assert.deepEqual(referenceKeys('dns'), expected);
  assert.deepEqual(packageKeys('dns'), expected);
});

test('restore exclusion list keeps the plugin metadata that Service must not overwrite', () => {
  // Service 的 $user = original omit(F50_RESTORE_EXCLUDED_KEYS)；元信息与受控键都在里面。
  const excluded = sorted(constants.excluded);
  // 排除列表是顶层键：受控子键（dns.enable 等）由 dns/tun 整键排除覆盖，不单独列出。
  for (const key of [...constants.top, 'dns', 'tun', 'sniffer', 'profile']) {
    assert.ok(excluded.includes(key), `F50_RESTORE_EXCLUDED_KEYS 缺少 ${key}`);
  }
  assert.ok(!excluded.includes('x-f50-overridden'), 'x-f50-overridden 必须随用户原配置保留，否则 Service 会丢掉纠正记录');
  const archive = spawnSync('tar', ['-xOf', path.join(root, 'tproxy-yq.zip'), 'Scripts/Clash.Service'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  assert.equal(archive.status, 0, `读取包内 Service 失败：${archive.stderr}`);
  const restore = /omit\(\["bind-address"[^\]]*\]\)/.exec(archive.stdout.replace(/\r\n/g, '\n'));
  assert.ok(restore, '包内 Service 缺少恢复排除列表');
  const packaged = sorted(restore[0].match(/"([^"]+)"/g).map((item) => item.slice(1, -1)));
  assert.deepEqual(packaged, excluded, '包内 Service 的排除列表与插件不一致（需 refresh_package_service）');
});
