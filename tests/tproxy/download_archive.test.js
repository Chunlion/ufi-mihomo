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

function downloader(responses, logs = []) {
  // Keep fixture mirrors independent of the live distribution URL.
  const mirrors = ['https://gitee.com/Cuty/tp-yq/releases/download/v1/tproxy-yq.zip','https://gitcode.com/Cuty/tp-yq/releases/download/v1/tproxy-yq.zip','https://raw.githubusercontent.com/Chunlion/ufi-mihomo/main/tproxy-yq.zip'];
  let index = 0;
  const fixtureConstants = constants.replace(/= [^;]*;/g, () => "= " + JSON.stringify(mirrors[index++]) + ";");
  const calls = [], reads = [], op = { token: { id: 'fixture' } };
  let currentLog, now = 0;
  const download = vm.runInNewContext(fixtureConstants + '\n' + source.slice(start, end) + '\ndownloadCoreArchive', {
    DOWNLOAD_ZIP: '/data/package.zip', DOWNLOAD_LOG: '/data/package.log', DOWNLOAD_SOURCE_FILE: '/data/package.source',
    shellQuote: value => `'${value}'`, operationStage() {}, getCurlBinCmd: () => '', dataSpaceGuardCmd: () => '',
    activeCriticalOperation: op, f50ShellReply: value => value,
    Date: { now: () => now }, setTimeout: (resolve, delay) => { now += delay; resolve(); },
    operationCancelled: () => Object.assign(Error('cancelled'), { name: 'OperationCancelled' }),
    f50UnknownCompletion: operation => { operation.uncertain = true; return Object.assign(Error('unconfirmed'), { name: 'OperationCancelled' }); },
    runShellWithRoot: async (script, timeout) => {
      calls.push(script);
      assert.ok(responses.length, 'unexpected download attempt');
      const result = responses.shift();
      if (result.deviceCompleted === false || result.content === 'ARCHIVE_READY=cached') return result;
      assert.equal(timeout, 10000);
      if (/^ARCHIVE_(?:READY=downloaded|DOWNLOAD_FAILED=|VERIFY_FAILED=|DOWNLOAD_STARTED=)/.test(result.content)) {
        currentLog = { success: true, content: result.content === 'ARCHIVE_DOWNLOAD_STARTED=1' ? ''
          : result.content + (result.success ? '' : '\nARCHIVE_WORKER_FAILED=1') };
        return { success: true, content: 'ARCHIVE_DOWNLOAD_STARTED=1' };
      }
      return result;
    },
    hostRunShellWithRoot: async (script, timeout) => {
      reads.push(script); assert.equal(timeout, 5000); assert.match(script, /^tail -n 100 /);
      return logs.length ? logs.shift() : currentLog;
    },
  });
  return { download, calls, reads, op };
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

test('background downloads tolerate a failed log read without restarting the worker', async () => {
  const { download, calls, reads } = downloader([{ success: true, content: 'ARCHIVE_READY=downloaded' }], [
    { success: true, content: 'downloading' }, { success: false, content: 'Load failed' },
  ]);
  assert.equal((await download()).ok, true);
  assert.equal(calls.length, 1);
  assert.equal(reads.length, 3);
  assert.match(calls[0], /--max-time 590/);
  assert.doesNotMatch(calls[0], /--speed-time|--speed-limit/);
  assert.match(calls[0], /< \/dev\/null &/);
});

test('unconfirmed background download retains the lease and never tries another source', async () => {
  const { download, calls, op } = downloader([{ success: true, content: 'ARCHIVE_DOWNLOAD_STARTED=1' }]);
  await assert.rejects(download(), { name: 'OperationCancelled' });
  assert.equal(op.uncertain, true);
  assert.equal(calls.length, 1);
});

for (const valid of [true, false]) test('device background worker verifies ZIP before replacement / ' + valid, { skip: process.platform === 'win32' }, async () => {
  const { execFile } = require('node:child_process'), { promisify } = require('node:util');
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'f50-download-'));
  const quote = value => "'" + value.replace(/'/g, "'\"'\"'") + "'";
  const archive = Buffer.from('UEsDBBQAAAAAAJm4U13uQOUFBwAAAAcAAAALAAAAZml4dHVyZS50eHRmaXh0dXJlUEsBAhQAFAAAAAAAmbhTXe5A5QUHAAAABwAAAAsAAAAAAAAAAAAAAIABAAAAAGZpeHR1cmUudHh0UEsFBgAAAAABAAEAOQAAADAAAAAAAA==', 'base64');
  const zip = path.join(dir, 'package.zip'), log = path.join(dir, 'download.log');
  const fixture = path.join(dir, 'fixture.zip'), curl = path.join(dir, 'curl');
  let launches = 0, reads = 0;
  try {
    fs.writeFileSync(fixture, valid ? archive : 'invalid zip');
    fs.writeFileSync(zip, 'previous package');
    fs.writeFileSync(log, 'ARCHIVE_READY=downloaded\n');
    fs.writeFileSync(curl, '#!/bin/sh\nwhile [ "$1" != -o ]; do shift; done\nshift\nsleep 0.1\ncp ' + quote(fixture) + ' "$1"\n', { mode: 0o700 });
    const execute = async (script, timeout) => {
      try { const r = await promisify(execFile)('sh', ['-c', script], { timeout }); return { success: true, content: r.stdout + r.stderr }; }
      catch (e) { return { success: false, content: (e.stdout || '') + (e.stderr || '') }; }
    };
    const download = vm.runInNewContext(constants + '\n' + source.slice(start, end) + '\ndownloadCoreArchive', {
      DOWNLOAD_ZIP: zip, DOWNLOAD_LOG: log, DOWNLOAD_SOURCE_FILE: path.join(dir, 'source'),
      shellQuote: quote, operationStage() {}, getCurlBinCmd: () => 'CURL_BIN=' + quote(curl),
      activeCriticalOperation: { token: {} }, f50ShellReply: value => value, setTimeout,
      f50UnknownCompletion: () => Error('worker completion unconfirmed'),
      runShellWithRoot: async (script, timeout) => { launches++; return execute(script, timeout); },
      hostRunShellWithRoot: async (script, timeout) => { reads++; return execute(script, timeout); },
    });
    const result = await download();
    assert.equal(result.ok, valid);
    assert.equal(launches, valid ? 1 : 3);
    assert.ok(reads > launches);
    assert.deepEqual(fs.readFileSync(zip), valid ? archive : Buffer.from('previous package'));
    assert.equal(fs.readdirSync(dir).some(name => name.includes('.new.')), false);
    if (!valid) assert.match(result.content, /ARCHIVE_VERIFY_FAILED=zip/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
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
    + source.slice(source.indexOf('async function ensureF50InstallLease()'), source.indexOf('  // KPR: dual-stack'))
    + '\n({network:installF50PackageFromNetwork,choose:chooseF50Package,diagnostic:()=>lastInstallDiagnostic})', {
    prior, document: { createElement: () => input, body: { appendChild() {} } },
    deviceTaskUncertain: false,
    runCriticalOperation: async (_, action) => action(), operationStage() {}, operationFinish() {},
    f50Diagnostic: content => ({ ok: false, summary: String(content), details: String(content) }),
    safeTextToHtml: String, shellQuote: JSON.stringify, createToast() {},
    activeCriticalOperation: { token: { id: 'fixture' } }, f50ShellReply: value => value,
    buildF50EmergencyScript: () => 'RECOVER_IDLE',
    hostRunShellWithRoot: async () => ({ success: false, content: 'F50_RECOVERY_STATE=active_frontend\nF50_RECOVERY_ELIGIBLE=0' }),
    operationCancelled: () => Object.assign(Error('cancelled'), { name: 'OperationCancelled' }),
    f50UnknownCompletion: (op, cause) => {
      op.uncertain = true;
      return Object.assign(Error(cause), { name: 'OperationCancelled' });
    },
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

test('uncertain device state is auto-recovered before installation proceeds', async () => {
  const op = { token: { id: 'fixture' }, leasePromise: Promise.resolve(false) };
  let recoveries = 0, downloads = 0, probes = 0;
  const { api } = installers({
    activeCriticalOperation: op,
    deviceTaskUncertain: true,
    buildF50EmergencyScript: (tag, requireIdle, releaseOnly, forUninstall) => {
      assert.equal(tag, ''); assert.equal(requireIdle, true); assert.equal(releaseOnly, true); assert.equal(forUninstall, false);
      return 'RECOVER_IDLE';
    },
    hostRunShellWithRoot: async script => { assert.equal(script, 'RECOVER_IDLE'); recoveries++; return { success: true, content: 'F50_LEASE_RELEASED=1' }; },
    runShellWithRoot: async script => { probes++; return { success: true }; },
    downloadCoreArchive: async () => { downloads++; return { ok: true }; },
    installF50PackageAtDevicePath: async () => true,
    DOWNLOAD_ZIP: '/fixture/package.zip', DOWNLOAD_LOG: '/fixture/package.log', DOWNLOAD_SOURCE_FILE: '/fixture/package.source',
  });
  assert.equal(await api.network(), true);
  assert.equal(recoveries, 1);
  assert.equal(downloads, 1);
  assert.ok(probes >= 2); // lease 探活 + 收尾清理均放行
});

test('uncertain device state stays blocked when idle recovery reports an active task', async () => {
  const op = { token: { id: 'fixture' }, leasePromise: Promise.resolve(false) };
  let downloads = 0;
  const { api } = installers({
    activeCriticalOperation: op,
    deviceTaskUncertain: true,
    buildF50EmergencyScript: () => 'RECOVER_IDLE',
    hostRunShellWithRoot: async () => ({ success: false, content: 'F50_RECOVERY_STATE=active_task\nF50_RECOVERY_ELIGIBLE=0' }),
    runShellWithRoot: async () => { throw Object.assign(Error('cancelled'), { name: 'OperationCancelled' }); },
    downloadCoreArchive: async () => { downloads++; return { ok: true }; },
    DOWNLOAD_ZIP: '/fixture/package.zip', DOWNLOAD_LOG: '/fixture/package.log', DOWNLOAD_SOURCE_FILE: '/fixture/package.source',
  });
  await assert.rejects(api.network(), { name: 'OperationCancelled' });
  assert.equal(downloads, 0);
});

test('busy device prevents package upload and cleanup', async () => {
  const { api, input, calls } = installers({ runShellWithRoot: async () => ({ success: false, content: 'F50_OPERATION_BUSY', deviceCompleted: false }) });
  await api.choose();
  await input.onchange();
  assert.deepEqual(calls, []);
  assert.match(api.diagnostic().details, /^F50_OPERATION_BUSY\nF50_RECOVERY_STATE=active_frontend/);
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

for (const entry of ['online', 'upload']) {
  for (const outcome of ['idle', 'active', 'retry_busy', 'transport_lost']) {
    test(`installation lease recovery / ${entry} / ${outcome}`, async () => {
      const op = { token: { id: 'fixture' }, leasePromise: Promise.resolve(false) };
      let attempts = 0, recoveries = 0, downloads = 0, uploads = 0;
      const { api, input } = installers({
        activeCriticalOperation: op,
        runShellWithRoot: async script => {
          if (script !== ':') return { success: true };
          if (++attempts > 1) assert.equal(op.leasePromise, null);
          return { success: attempts > 1 && outcome === 'idle', content: 'F50_OPERATION_BUSY', deviceCompleted: false };
        },
        buildF50EmergencyScript: (tag, requireIdle, releaseOnly, forUninstall) => {
          assert.equal(tag, ''); assert.equal(requireIdle, true); assert.equal(releaseOnly, true); assert.equal(forUninstall, false);
          return 'RECOVER_IDLE';
        },
        hostRunShellWithRoot: async script => {
          assert.equal(script, 'RECOVER_IDLE'); recoveries++;
          if (outcome === 'transport_lost') throw Error('transport_fixture_failure');
          return outcome === 'active' ? { success: false, content: 'F50_RECOVERY_STATE=active_task\nF50_RECOVERY_ELIGIBLE=0' }
            : { success: true, content: 'F50_LEASE_RELEASED=1' };
        },
        downloadCoreArchive: async () => { downloads++; return { ok: true }; },
        DOWNLOAD_ZIP: '/fixture/package.zip', DOWNLOAD_LOG: '/fixture/package.log', DOWNLOAD_SOURCE_FILE: '/fixture/package.source',
        uploadFileToDevice: async () => { uploads++; return '/fixture/upload.zip'; },
      });
      let action;
      if (entry === 'online') action = api.network();
      else { await api.choose(); action = input.onchange(); }
      if (outcome === 'transport_lost') {
        if (entry === 'online') await assert.rejects(action, { name: 'OperationCancelled' });
        else await action;
        assert.equal(op.uncertain, true);
      } else await action;
      assert.equal(recoveries, 1);
      assert.equal(attempts, ['idle', 'retry_busy'].includes(outcome) ? 2 : 1);
      assert.equal(downloads, entry === 'online' && outcome === 'idle' ? 1 : 0);
      assert.equal(uploads, entry === 'upload' && outcome === 'idle' ? 1 : 0);
      if (outcome === 'active') assert.match(api.diagnostic().details, /F50_RECOVERY_STATE=active_task/);
    });
  }
}
