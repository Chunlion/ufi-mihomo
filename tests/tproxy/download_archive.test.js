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

test('current GitHub package succeeds without contacting mirrors', async () => {
  const { download, calls } = downloader([{ success: true, content: 'ARCHIVE_READY=downloaded' }]);
  const result = await download();
  assert.equal(result.ok, true);
  assert.match(result.source, /^https:\/\/raw\.githubusercontent\.com\/Chunlion\/ufi-mihomo\/main\//);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /unzip -t "\$NEW"/);
  assert.match(calls[0], /mv -f "\$NEW" "\$ZIP"/);
});

for (const content of ['Load failed', 'ARCHIVE_VERIFY_FAILED=zip']) {
  test(`GitHub failure (${content}) falls back to Gitee`, async () => {
    const { download, calls } = downloader([
      { success: false, content },
      { success: true, content: 'ARCHIVE_READY=downloaded' },
    ]);
    const result = await download();
    assert.equal(result.ok, true);
    assert.match(calls[0], /https:\/\/raw\.githubusercontent\.com\//);
    assert.equal(result.source, 'https://gitee.com/Cuty/tp-yq/releases/download/v1/tproxy-yq.zip');
    assert.equal(calls.length, 2);
  });
}

test('GitHub and Gitee failures fall back to GitCode', async () => {
  const { download, calls } = downloader([
    { success: false, content: 'ARCHIVE_DOWNLOAD_FAILED=28' },
    { success: false, content: 'ARCHIVE_VERIFY_FAILED=zip' },
    { success: true, content: 'ARCHIVE_READY=downloaded' },
  ]);
  const result = await download();
  assert.equal(result.ok, true);
  assert.match(calls[1], /https:\/\/gitee\.com\//);
  assert.match(result.source, /^https:\/\/gitcode\.com\/Cuty\/tp-yq\//);
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
