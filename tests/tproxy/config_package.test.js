'use strict';

// 导出配置包时按名称兜底：mac_bypass.txt 是 tproxy 模式下 device_bypass 的派生镜像，
// 从未保存过网络设置的设备上本来就不存在，缺它不该让整份导出失败。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const source = fs.readFileSync(path.resolve(__dirname, '../..', '猫猫TProxy.js'), 'utf8');

const canRunSh = (() => {
  try {
    execFileSync('sh', ['-c', 'exit 0'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

const copyBackupFile = () => {
  const from = source.indexOf('        copy_backup_file() {');
  const to = source.indexOf('        ${copyBackupFilesCmd}', from);
  assert.ok(from > 0 && to > from, 'missing copy_backup_file markers');
  // 模板里的 JS 插值在设备端才求值，这里换成 no-op，只跑分支逻辑。
  return source.slice(from, to).split('\n')
    .map(line => (/\$\{shellQuote\(/.test(line) ? '            :' : line)).join('\n');
};

const runPacked = (calls) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-pack-'));
  const file = path.join(dir, 'probe.sh');
  fs.writeFileSync(file, ['set -e', 'PKG_DIR=$(mktemp -d)', 'packed_count=0', copyBackupFile(), ...calls].join('\n'));
  return execFileSync('sh', [file], { encoding: 'utf8' });
};

test('a missing mac_bypass.txt is defaulted instead of failing the export', { skip: !canRunSh && 'sh unavailable' }, () => {
  const out = runPacked([
    'copy_backup_file /nonexistent/mac mac_bypass.txt',
    'test -f "$PKG_DIR/mac_bypass.txt"',
    'test ! -s "$PKG_DIR/mac_bypass.txt"',
    'echo COUNT=$packed_count',
  ]);
  assert.match(out, /DEFAULTED: mac_bypass\.txt/);
  assert.match(out, /COUNT=1/);
});

test('optional list keeps mac_bypass.txt next to device_bypass.txt', () => {
  assert.match(copyBackupFile(), /sub_user_agent\.conf\|mac_bypass\.txt\|device_bypass\.txt/);
});

test('config.yaml stays a hard requirement', { skip: !canRunSh && 'sh unavailable' }, () => {
  assert.throws(
    () => runPacked(['copy_backup_file /nonexistent/config config.yaml', 'echo SHOULD_NOT_REACH']),
    (error) => {
      const stdout = String(error.stdout || '');
      assert.match(stdout, /MISSING_REQUIRED: config\.yaml/);
      assert.doesNotMatch(stdout, /SHOULD_NOT_REACH/, 'set -e must abort the export right away');
      return true;
    },
  );
});
