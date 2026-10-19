'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.resolve(__dirname, '../..', '猫猫TProxy.js'), 'utf8');
const constants = source.match(/  const CLASH_PACKAGE_(?:URL|FALLBACK_URL|REPO_URL) = [^\r\n]+/g).join('\n');
const start = source.indexOf('  const downloadCoreArchive = async');
const end = source.indexOf('  const setButtonBusy =', start);

function downloader(responses) {
  // Keep fixture mirrors independent of the live distribution URL.
  const mirrors = ['https://gitee.com/Cuty/tp-yq/releases/download/v1/tproxy-yq.zip','https://gitcode.com/Cuty/tp-yq/releases/download/v1/tproxy-yq.zip','https://raw.githubusercontent.com/Chunlion/ufi-mihomo/main/tproxy-yq.zip'];
  let index = 0;
  const fixtureConstants = constants.replace(/= [^;]*;/g, () => "= " + JSON.stringify(mirrors[index++]) + ";");
  const calls = [];
  const download = vm.runInNewContext(fixtureConstants + '\n' + source.slice(start, end) + '\ndownloadCoreArchive', {
    DOWNLOAD_ZIP: '/data/package.zip', DOWNLOAD_LOG: '/data/package.log', DOWNLOAD_SOURCE_FILE: '/data/package.source',
    shellQuote: value => `'${value}'`, operationStage() {}, getCurlBinCmd: () => '', dataSpaceGuardCmd: () => '',
    runShellWithRoot: async script => {
      calls.push(script);
      assert.ok(responses.length, 'unexpected download attempt');
      return responses.shift();
    },
  });
  return { download, calls };
}

test('GitCode package succeeds without contacting other mirrors', async () => {
  const { download, calls } = downloader([{ success: true, content: 'ARCHIVE_READY=downloaded' }]);
  const result = await download();
  assert.equal(result.ok, true);
  assert.equal(result.source, 'https://gitcode.com/Cuty/tp-yq/releases/download/v1/tproxy-yq.zip');
  assert.equal(calls.length, 1);
  assert.match(calls[0], /unzip -t "\$NEW"/);
  assert.match(calls[0], /mv -f "\$NEW" "\$ZIP"/);
});

for (const content of ['Load failed', 'ARCHIVE_VERIFY_FAILED=zip']) {
  test(`GitCode failure (${content}) falls back to Gitee`, async () => {
    const { download, calls } = downloader([
      { success: false, content },
      { success: true, content: 'ARCHIVE_READY=downloaded' },
    ]);
    const result = await download();
    assert.equal(result.ok, true);
    assert.match(calls[0], /https:\/\/gitcode\.com\//);
    assert.equal(result.source, 'https://gitee.com/Cuty/tp-yq/releases/download/v1/tproxy-yq.zip');
    assert.equal(calls.length, 2);
  });
}

test('GitCode and Gitee failures fall back to GitHub', async () => {
  const { download, calls } = downloader([
    { success: false, content: 'ARCHIVE_DOWNLOAD_FAILED=28' },
    { success: false, content: 'ARCHIVE_VERIFY_FAILED=zip' },
    { success: true, content: 'ARCHIVE_READY=downloaded' },
  ]);
  const result = await download();
  assert.equal(result.ok, true);
  assert.match(calls[1], /https:\/\/gitee\.com\//);
  assert.match(result.source, /^https:\/\/raw\.githubusercontent\.com\/Chunlion\/ufi-mihomo\/main\//);
  assert.equal(calls.length, 3);
});

test('all download failures retain diagnostics and report failure', async () => {
  const { download, calls } = downloader([
    { success: false, content: 'ARCHIVE_DOWNLOAD_FAILED=28' },
    { success: false, content: 'Load failed' },
    { success: false, content: 'ARCHIVE_DOWNLOAD_FAILED=22\nHTTP 500' },
  ]);
  const result = await download();
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'download');
  assert.equal(calls.length, 3);
  assert.match(result.content, /ARCHIVE_DOWNLOAD_FAILED=28/);
  assert.match(result.content, /Load failed/);
  assert.match(result.content, /HTTP 500/);
});

test('cached compatible packages do not require a pinned release hash',async()=>{
  const {download,calls}=downloader([{success:true,content:'ARCHIVE_READY=cached'}]);
  assert.equal((await download({allowCached:true})).ok,true);
  assert.equal(calls.length,1);
  assert.match(calls[0],/unzip -t "\$ZIP"/);
  assert.doesNotMatch(calls[0],/sha256sum/);
});

for (const allowCached of [false, true]) {
  for (const content of ['F50_OPERATION_BUSY', 'F50_OPERATION_UNSAFE_PATH']) {
    test(`lease failure stops package requests / cache=${allowCached} / ${content}`, async () => {
      const { download, calls } = downloader([{ success: false, content, deviceCompleted: false }]);
      const result = await download({ allowCached });
      assert.equal(result.ok, false);
      assert.equal(result.stage, 'lease');
      assert.equal(result.content, content);
      assert.equal(calls.length, 1);
    });
  }
}

function installers(overrides = {}) {
  const input = { files: [{}], click() {} }, calls = [];
  const prior = { ok: false, summary: 'previous install', details: 'F50_INSTALL_WARNING=uploaded_package_cleanup_failed' };
  const api = vm.runInNewContext('let lastInstallDiagnostic = prior, f50PackageInput = null;\n'
    + source.slice(source.indexOf('async function installF50PackageFromNetwork()'), source.indexOf('  // KPR: dual-stack'))
    + '\n({network:installF50PackageFromNetwork,choose:chooseF50Package,diagnostic:()=>lastInstallDiagnostic})', {
    prior, document: { createElement: () => input, body: { appendChild() {} } },
    runCriticalOperation: async (_, action) => action(), operationStage() {}, operationFinish() {},
    f50Diagnostic: content => ({ ok: false, summary: String(content), details: String(content) }),
    safeTextToHtml: String, shellQuote: JSON.stringify, createToast() {},
    runShellWithRoot: async script => { calls.push(script); return { success: true }; },
    uploadFileToDevice: async () => { calls.push('upload'); return '/fixture/upload.zip'; },
    installF50PackageAtDevicePath: async () => { calls.push('install'); return true; },
    ...overrides,
  });
  return { api, input, calls, prior };
}

test('online package failure replaces the previous installation diagnostic', async () => {
  const { api, prior } = installers({ downloadCoreArchive: async () => ({ ok: false, content: 'F50_OPERATION_BUSY' }) });
  assert.equal(await api.network(), false);
  assert.notEqual(api.diagnostic(), prior);
  assert.equal(api.diagnostic().details, 'F50_OPERATION_BUSY');
});

test('busy device prevents package upload and cleanup', async () => {
  const { api, input, calls } = installers({ runShellWithRoot: async () => ({ success: false, content: 'F50_OPERATION_BUSY', deviceCompleted: false }) });
  await api.choose();
  await input.onchange();
  assert.deepEqual(calls, []);
  assert.equal(api.diagnostic().details, 'F50_OPERATION_BUSY');
});

test('package upload and cleanup run after the device lease is acquired', async () => {
  const { api, input, calls } = installers();
  await api.choose();
  await input.onchange();
  assert.deepEqual(calls, [':', 'upload', 'install', 'rm -f "/fixture/upload.zip"']);
});

test('failed upload replaces the previous diagnostic without deleting an unrelated file', async () => {
  const { api, input, calls } = installers({ uploadFileToDevice: async () => { throw Error('upload_fixture_failure'); } });
  await api.choose();
  await input.onchange();
  assert.deepEqual(calls, [':']);
  assert.equal(api.diagnostic().details, 'upload_fixture_failure');
});

test('cleanup failure retains the original installation error', async () => {
  const { api, input } = installers({
    runShellWithRoot: async script => ({ success: script === ':' }),
    installF50PackageAtDevicePath: async () => { throw Error('install_fixture_failure'); },
  });
  await api.choose();
  await input.onchange();
  assert.equal(api.diagnostic().details, 'install_fixture_failure\nF50_INSTALL_WARNING=uploaded_package_cleanup_failed');
});
