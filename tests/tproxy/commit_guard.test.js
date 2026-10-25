'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const hook = path.resolve(__dirname, '../../.githooks/pre-commit');
const fakeKey = 'AGE-SECRET-KEY-1' + 'A'.repeat(58);

function fixture(t, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-commit-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  git('init', '-q');
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    git('add', '--', name);
  }
  return { dir, run: (env = process.env) => spawnSync('sh', [hook], { cwd: dir, encoding: 'utf8', env }) };
}

for (const name of ['notes.txt', 'with spaces.txt', '中文.js', 'reports/probe.log', 'line\nbreak.txt']) {
  test('credential guard inspects staged content: ' + JSON.stringify(name), t => {
    const f = fixture(t, { [name]: fakeKey });
    fs.writeFileSync(path.join(f.dir, name), 'clean working copy');
    const result = f.run();
    assert.equal(result.status, 1, 'staged key must be refused');
    assert.match(result.stderr, /age private key/);
    assert.ok(!result.stderr.includes(fakeKey), 'diagnostics must not print the key');
  });
}

for (const name of ['F50 config.yaml', 'nested/F50中文.yml', 'F50\nprivate.yaml', 'private-download/note.txt']) {
  test('private path guard: ' + JSON.stringify(name), t => {
    const result = fixture(t, { [name]: 'no credentials' }).run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /private configuration/);
  });
}

test('guard ignores unstaged credentials and ordinary archive names', t => {
  const f = fixture(t, { 'clean.txt': 'clean index', 'other-tproxy-yq.zip': 'ordinary file' });
  fs.writeFileSync(path.join(f.dir, 'clean.txt'), fakeKey);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
});

test('component package cannot skip inspection when Python is missing', t => {
  const f = fixture(t, { 'tproxy-yq.zip': 'package placeholder' });
  const bin = path.join(f.dir, 'bin');
  fs.mkdirSync(bin);
  for (const tool of ['sh', 'git', 'grep', 'xargs', 'mktemp', 'rm']) {
    const executable = spawnSync('sh', ['-c', 'command -v "$1"', 'sh', tool], { encoding: 'utf8' }).stdout.trim();
    fs.symlinkSync(executable, path.join(bin, tool));
  }
  const result = f.run({ ...process.env, PATH: bin });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no python found/);
});

for (const secret of [false, true]) {
  test('component package guard / contains token=' + secret, t => {
    const f = fixture(t, {});
    const generated = spawnSync('python3', ['-c',
      "import sys,zipfile; z=zipfile.ZipFile('tproxy-yq.zip','w'); z.writestr('Tools/template.yaml',sys.argv[1]); z.close()",
      secret ? 'url: https://example.test/sub?token=' + 'A'.repeat(16) : 'rules: [MATCH,DIRECT]',
    ], { cwd: f.dir, encoding: 'utf8' });
    assert.equal(generated.status, 0, generated.stderr);
    assert.equal(spawnSync('git', ['add', 'tproxy-yq.zip'], { cwd: f.dir }).status, 0);
    const result = f.run();
    assert.equal(result.status, secret ? 1 : 0, result.stderr);
    if (secret) assert.match(result.stderr, /unredacted values/);
  });
}
