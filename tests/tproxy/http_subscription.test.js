'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawn, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, '猫猫TProxy.js'), 'utf8');
const quote = value => `'${String(value).replace(/\\/g, '/').replace(/'/g, `'"'"'`)}'`;
const start = source.indexOf('const F50_HTTP_CONTROLLER_PATCHES =');
const end = source.indexOf('function buildF50OriginalConfigFunctions()', start);
const api = vm.runInNewContext(source.slice(start, end) + '\n({specs:F50_HTTP_CONTROLLER_PATCHES,script:buildF50HttpSubscriptionPatchScript})', { shellQuote: quote });
const extracted = spawnSync('tar', ['-xOf', path.join(root, 'tproxy-yq.zip'), 'Scripts/clashctl_arm64'], { maxBuffer: 16 * 1024 * 1024 });
assert.equal(extracted.status, 0, String(extracted.stderr));
const original = extracted.stdout;

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f50-http-'));
  for (const name of ['Scripts', 'Tools', 'Proxy', 'bin']) fs.mkdirSync(path.join(dir, name));
  const binary = path.join(dir, 'Scripts/clashctl_arm64');
  fs.writeFileSync(binary, original, { mode: 0o755 });
  return { dir, binary };
}

function patch(dir, prefix = '') {
  const script = prefix + '\n' + api.script(quote(dir));
  const syntax = spawnSync('sh', ['-n'], { input: script, encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
  return spawnSync('sh', ['-s'], { input: script, encoding: 'utf8' });
}

test('controller patch changes only the declared ranges and is idempotent', () => {
  const { dir, binary } = fixture();
  try {
    const expected = Buffer.from(original);
    for (const spec of api.specs) {
      assert.deepEqual(original.subarray(spec.offset, spec.offset + spec.size), Buffer.from(spec.before, 'base64'));
      Buffer.from(spec.after, 'base64').copy(expected, spec.offset);
    }
    const result = patch(dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(fs.readFileSync(binary), expected);
    const timestamp = fs.statSync(binary).mtimeMs;
    assert.equal(patch(dir).status, 0);
    assert.deepEqual(fs.readFileSync(binary), expected);
    assert.equal(fs.statSync(binary).mtimeMs, timestamp);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('an unsupported controller remains untouched', () => {
  const { dir, binary } = fixture();
  try {
    const unsupported = Buffer.from(original);
    unsupported[api.specs[0].offset] ^= 1;
    fs.writeFileSync(binary, unsupported);
    const result = patch(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /F50_ERROR=controller_http_patch_unsupported/);
    assert.deepEqual(fs.readFileSync(binary), unsupported);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the bundled ARMv7 payload does not block the ARM64 patch', () => {
  const { dir, binary } = fixture();
  try {
    const extracted = spawnSync('tar', ['-xOf', path.join(root, 'tproxy-yq.zip'), 'Scripts/clashctl_armv7'], { maxBuffer: 16 * 1024 * 1024 });
    assert.equal(extracted.status, 0, String(extracted.stderr));
    const second = path.join(dir, 'Scripts/clashctl_armv7');
    fs.writeFileSync(second, extracted.stdout);
    const result = patch(dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const patched = fs.readFileSync(binary);
    for (const spec of api.specs) assert.deepEqual(patched.subarray(spec.offset, spec.offset + spec.size), Buffer.from(spec.after, 'base64'));
    assert.deepEqual(fs.readFileSync(second), extracted.stdout);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('an incomplete patch is rejected without changing the controller', () => {
  const { dir, binary } = fixture();
  try {
    const incomplete = Buffer.from(original);
    Buffer.from(api.specs[0].after, 'base64').copy(incomplete, api.specs[0].offset);
    fs.writeFileSync(binary, incomplete);
    const result = patch(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /F50_ERROR=controller_http_patch_incomplete/);
    assert.deepEqual(fs.readFileSync(binary), incomplete);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a failed decoder cannot replace the original controller', () => {
  const { dir, binary } = fixture();
  try {
    const result = patch(dir, `base64() {
  if [ "\${1:-}" = -d ]; then printf broken; return 1; fi
  command base64 "$@"
}`);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /F50_ERROR=controller_http_patch_verify_failed/);
    assert.deepEqual(fs.readFileSync(binary), original);
    assert.deepEqual(fs.readdirSync(path.join(dir, 'Scripts')), ['clashctl_arm64']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('simultaneous patch processes use separate temporary files', async () => {
  const { dir, binary } = fixture();
  try {
    fs.mkdirSync(path.join(dir, 'gate'));
    const script = `cp() {
  command cp "$@" || return 1
  printf '%s\\n' "$3" > ${quote(dir)}/gate/waiting.$$
  attempts=0
  while [ "$(find ${quote(dir)}/gate -name 'waiting.*' | wc -l)" -lt 2 ]; do
    attempts=$((attempts + 1))
    [ "$attempts" -lt 100 ] || return 1
    sleep 0.05
  done
}
` + api.script(quote(dir));
    const run = () => new Promise((resolve, reject) => {
      const child = spawn('sh', ['-s'], { timeout: 15000 });
      let output = '';
      child.stdout.on('data', data => { output += data; });
      child.stderr.on('data', data => { output += data; });
      child.on('error', reject);
      child.on('close', status => resolve({ status, output }));
      child.stdin.end(script);
    });
    const results = await Promise.all([run(), run()]);
    for (const result of results) assert.equal(result.status, 0, result.output);
    const destinations = fs.readdirSync(path.join(dir, 'gate')).map(name => fs.readFileSync(path.join(dir, 'gate', name), 'utf8').trim());
    assert.equal(new Set(destinations).size, 2);
    for (const spec of api.specs) assert.deepEqual(fs.readFileSync(binary).subarray(spec.offset, spec.offset + spec.size), Buffer.from(spec.after, 'base64'));
    assert.deepEqual(fs.readdirSync(path.join(dir, 'Scripts')), ['clashctl_arm64']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

const qemu = process.env.F50_TEST_QEMU;
const linuxPath = value => process.platform === 'win32' ? '/mnt/' + value[0].toLowerCase() + value.slice(2).replace(/\\/g, '/') : value;
function native(dir, binary, request) {
  const env = { CLASH_ROOT: linuxPath(dir), PATH: linuxPath(path.join(dir, 'bin')) + ':/usr/bin:/bin' };
  const args = ['env', ...Object.entries(env).map(([key, value]) => `${key}=${value}`), qemu, linuxPath(binary), 'fetch-batch', linuxPath(request)];
  return process.platform === 'win32'
    ? spawnSync('wsl', ['-d', process.env.F50_TEST_WSL || 'Debian', '--', ...args], { encoding: 'utf8', timeout: 30000 })
    : spawnSync(args[0], args.slice(1), { encoding: 'utf8', timeout: 30000 });
}

for (const [url, port] of [
  ['http://8.8.8.8/sub', '80'],
  ['https://8.8.8.8/sub', '443'],
  ['http://8.8.8.8:8080/sub', '8080'],
  ['https://8.8.8.8:8443/sub', '8443'],
]) {
  test(`ARM64 download accepts ${url} and pins port ${port}`, { skip: !qemu }, () => {
    const { dir, binary } = fixture();
    try {
      const request = path.join(dir, 'request.json');
      fs.writeFileSync(request, JSON.stringify({ sources: [{ name: 'Provider1', url }], userAgent: 'clash.meta' }));
      fs.writeFileSync(path.join(dir, 'bin/curl'), `#!/bin/sh
printf '%s\\n' "$@" > "$CLASH_ROOT/curl.args"
while [ "$#" -gt 0 ]; do
  if [ "$1" = -D ]; then shift; printf 'HTTP/1.1 200 OK\\r\\nContent-Type: text/yaml\\r\\n\\r\\n' > "$1"; fi
  shift
done
printf 'proxies:\\n  - {name: Test, type: socks5, server: example.com, port: 1080}\\n200'
`, { mode: 0o755 });
      if (url.startsWith('http:')) {
        const before = native(dir, binary, request);
        assert.ifError(before.error);
        assert.match(before.stdout + before.stderr, /subscription URL must be HTTPS/);
        assert.ok(!fs.existsSync(path.join(dir, 'curl.args')));
      }
      assert.equal(patch(dir).status, 0);
      const result = native(dir, binary, request);
      assert.ifError(result.error);
      assert.match(result.stdout, /"statusCode":200/);
      assert.doesNotMatch(result.stdout + result.stderr, /subscription URL must|panic:|SIGSEGV/);
      const args = fs.readFileSync(path.join(dir, 'curl.args'), 'utf8').trim().split(/\r?\n/);
      assert.equal(args[args.indexOf('--proto') + 1], '=http,https');
      assert.equal(args[args.indexOf('--resolve') + 1], `8.8.8.8:${port}:8.8.8.8`);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}

for (const url of ['ftp://8.8.8.8/sub', 'http://user:pass@8.8.8.8/sub', 'http://127.0.0.1/sub']) {
  test(`ARM64 download retains URL validation for ${url}`, { skip: !qemu }, () => {
    const { dir, binary } = fixture();
    try {
      const request = path.join(dir, 'request.json');
      fs.writeFileSync(request, JSON.stringify({ sources: [{ name: 'Provider1', url }], userAgent: 'clash.meta' }));
      assert.equal(patch(dir).status, 0);
      const result = native(dir, binary, request);
      assert.ifError(result.error);
      assert.match(result.stdout, /"ok":false/);
      assert.ok(!fs.existsSync(path.join(dir, 'curl.args')));
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}
