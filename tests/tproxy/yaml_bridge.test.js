'use strict';

const test = require('node:test');
const { fs, path, assert, slice, run, shell, shellApi, quote, temp, write, plain } = require('./optimization_harness');

async function readFixture(t, options = {}) {
  const dir = temp();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const input = write(dir, 'input.yaml', 'value: fixture\n');
  const yq = write(dir, 'Tools/yq_linux_arm64', `#!/bin/sh
case "$1" in
  --version) echo "${options.banner || 'yq (https://github.com/mikefarah/yq/) version v4.53.3'}"; exit 0;;
  --help) [ "$FIXTURE_SPEC" != 1 ] || echo --yaml-fix-merge-anchor-to-spec; exit 0;;
esac
echo 'time=fixture level=WARN msg="yq diagnostic"' >&2
if [ "$FIXTURE_FAIL" = 1 ]; then echo 'yq: invalid mapping' >&2; exit 7; fi
if [ "$FIXTURE_INVALID_JSON" = 1 ]; then echo 'not JSON'; exit 0; fi
used_spec=false
for arg in "$@"; do [ "$arg" != --yaml-fix-merge-anchor-to-spec ] || used_spec=true; done
printf '{"usedSpec":%s,"value":"fixture"}\n' "$used_spec"
`);
  fs.chmodSync(yq, 0o755);
  if (options.incompatibleTimeout) {
    const timeout = write(dir, 'bin/timeout', '#!/bin/sh\necho "timeout: unknown option -k" >&2\nexit 1\n');
    fs.chmodSync(timeout, 0o755);
  }
  let status;
  const read = run(slice('const yqExecutableCheckCmd', 'const yamlHasGeneratedMarker') + '\nreadYamlObject', {
    CLASH_DIR: dir, YAML_BRIDGE_MAX_BYTES: 8388608, shellQuote: quote,
    prepareYqRuntimeCmd: () => `KANO_YQ_TMP=${quote(dir)}`,
    buildF50ShellBase: shellApi().base,
    ensureCompatBackend: async () => options.backendReady !== false,
    assertYamlRootMap(value) { assert.ok(value && typeof value === 'object' && !Array.isArray(value)); },
    f50AssertSafeJsonNumbers() {},
    runShellWithRoot: async script => {
      const result = shell(`(\n${script}\n) 2>&1`, {
        FIXTURE_SPEC: options.spec ? '1' : '0',
        FIXTURE_FAIL: options.fail ? '1' : '0',
        FIXTURE_INVALID_JSON: options.invalidJson ? '1' : '0',
        ...(options.incompatibleTimeout ? { PATH: path.join(dir, 'bin') + ':' + process.env.PATH } : {}),
      });
      status = result.status;
      return { success: status === 0, content: result.stdout + result.stderr };
    },
  });
  const result = await read(input);
  assert.ok(!fs.readdirSync(dir).some(name => name.startsWith('yq_json_read.')));
  return { result: plain(result), status };
}

test('JSON bridge isolates yq warnings and enables supported merge semantics', async t => {
  const { result, status } = await readFixture(t, { spec: true });
  assert.equal(status, 0);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { usedSpec: true, value: 'fixture' });
});

test('JSON bridge accepts warnings from yq without the newer merge flag', async t => {
  const { result, status } = await readFixture(t);
  assert.equal(status, 0);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { usedSpec: false, value: 'fixture' });
});

test('JSON bridge preserves yq parse errors and exit status', async t => {
  const { result, status } = await readFixture(t, { fail: true });
  assert.equal(status, 7);
  assert.equal(result.ok, false);
  assert.match(result.message, /yq: invalid mapping/);
});

test('JSON bridge still rejects malformed JSON after a successful yq exit', async t => {
  const { result, status } = await readFixture(t, { invalidJson: true });
  assert.equal(status, 0);
  assert.equal(result.ok, false);
  assert.match(result.message, /转换为单个 JSON 映射失败/);
});

test('JSON bridge accepts a compatible parser with a different version banner', async t => {
  const { result, status } = await readFixture(t, { banner: 'Compatible YAML parser 5.0' });
  assert.equal(status, 0);
  assert.equal(result.ok, true);
  assert.equal(result.value.value, 'fixture');
});

test('JSON bridge works when the system timeout lacks kill-after support', async t => {
  const { result, status } = await readFixture(t, { incompatibleTimeout: true });
  assert.equal(status, 0);
  assert.equal(result.ok, true);
  assert.equal(result.value.value, 'fixture');
});

test('YAML parsing works when the controller is unavailable', async t => {
  const { result, status } = await readFixture(t, { backendReady: false });
  assert.equal(status, 0);
  assert.equal(result.ok, true);
  assert.equal(result.value.value, 'fixture');
});

for (const fallback of [false, true]) {
  test(`timeout expiry and ordinary exit codes / fallback=${fallback}`, () => {
    const result = shell((fallback ? 'timeout() { return 1; }\n' : '') + shellApi().base() + `
f50_limit 1 sleep 10
printf 'TIMEOUT=%s\\n' "$?"
f50_limit 2 sh -c 'exit 7'
printf 'FAILURE=%s\\n' "$?"
f50_limit 2 true
printf 'SUCCESS=%s\\n' "$?"
`);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /^TIMEOUT=124$/m);
    assert.match(result.stdout, /^FAILURE=7$/m);
    assert.match(result.stdout, /^SUCCESS=0$/m);
  });
}
