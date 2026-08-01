'use strict';
const fs = require('fs');
const path = require('path');
const { Sandbox, loadPlugin, waitForState, sleep, DASH } = require('./harness');

const ROOT = path.join(__dirname, 'sbx');
const sbx = new Sandbox(ROOT);
const S = sbx.posix;

const FAST_CONFIG = [
  'MIN_UPTIME=0',
  'MAX_WAIT=6',
  'FILE_MAX_WAIT=12',
  'ENTRY_TIMEOUT=3',
  'WHOLE_TIMEOUT=10',
  'RETRY_DELAY=1',
  '',
].join('\n');

const results = [];
let currentAsserts = [];

function assert(cond, msg) {
  currentAsserts.push({ ok: !!cond, msg });
  if (!cond) throw new Error(`断言失败: ${msg}`);
}

function softAssert(cond, msg) {
  currentAsserts.push({ ok: !!cond, msg });
}

async function test(name, fn) {
  currentAsserts = [];
  const t0 = Date.now();
  try {
    await fn();
    const failed = currentAsserts.filter((a) => !a.ok);
    results.push({ name, ok: failed.length === 0, ms: Date.now() - t0, failed });
    console.log(`${failed.length === 0 ? '  PASS' : '  FAIL'}  ${name} (${Date.now() - t0}ms)`);
    failed.forEach((f) => console.log(`         ✗ ${f.msg}`));
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t0, error: String(e.message || e), failed: currentAsserts.filter((a) => !a.ok) });
    console.log(`  FAIL  ${name} (${Date.now() - t0}ms)\n         ✗ ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
const writeConfig = () => {
  fs.mkdirSync(sbx.p('data/f50_boot_fix'), { recursive: true });
  fs.writeFileSync(sbx.p('data/f50_boot_fix/config'), FAST_CONFIG);
};

const probes = () => {
  try { return fs.readdirSync(sbx.p('probe')).sort(); } catch (e) { return []; }
};

const clearProbes = () => {
  fs.rmSync(sbx.p('probe'), { recursive: true, force: true });
  fs.mkdirSync(sbx.p('probe'), { recursive: true });
};

const simulateBoot = ({ uptime = 5, bootCompleted = '0', sourced = false } = {}) => {
  sbx.setUptime(uptime);
  sbx.setBootCompleted(bootCompleted);
  const bf = `${S}/sdcard/ufi_tools_boot.sh`;
  const script = sourced
    ? `. "${bf}"\necho "HOST_CONTINUED rc=$?"\n`
    : `${DASH} "${bf}"\necho "HOST_RC=$?"\n`;
  return sbx.runShell(script, 30000, { rewrite: false });
};

const parseState = (txt) => {
  const meta = {}; const entries = [];
  (txt || '').split('\n').forEach((l) => {
    if (l.startsWith('E|')) {
      const p = l.split('|');
      entries.push({ idx: p[1], status: p[2], rc: p[3], label: p.slice(4).join('|') });
    } else if (l.includes('=')) {
      meta[l.slice(0, l.indexOf('='))] = l.slice(l.indexOf('=') + 1);
    }
  });
  return { meta, entries };
};

// 等上一条用例遗留的后台管理器跑完，否则它会往刚重建的沙盒里写状态文件
const waitQuiet = async (timeoutMs = 40000) => {
  await sleep(400);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!sbx.exists('data/local/tmp/f50_plugin_boot_manager.lock')) return;
    await sleep(300);
  }
};

const freshInstall = async (bootContent) => {
  await waitQuiet();
  sbx.reset();
  clearProbes();
  sbx.writeBoot(bootContent);
  const app = loadPlugin(sbx);
  await app.click('install');
  writeConfig();
  return app;
};

const gateOf = (text) => {
  const b = text.indexOf('# F50_BOOT_FIX_BEGIN');
  const e = text.indexOf('# F50_BOOT_FIX_END');
  return b >= 0 && e > b ? text.slice(b, e + '# F50_BOOT_FIX_END'.length) : null;
};

// ---------------------------------------------------------------------------
(async () => {
  console.log('\n=== F50 全插件开机自启修复 · 沙盒回归测试 ===\n');

  const MULTI = [
    '# 插件A：策略清理',
    `[ -d ${S}/probe ] && touch ${S}/probe/a1_cleanup || true`,
    '# 插件B：主服务',
    `touch ${S}/probe/b1_service`,
    `sleep 1; touch ${S}/probe/b2_after_sleep`,
    '# 插件C：自己的小脚本',
    `touch ${S}/probe/c1_mine && touch ${S}/probe/c2_mine`,
    '',
  ].join('\n');

  await test('T1 安装后：门在最顶部，其它插件的每一行都原样保留', async () => {
    await freshInstall(MULTI);
    const after = sbx.readBoot();
    assert(after, '启动文件仍存在');
    assert(after.startsWith('# F50_BOOT_FIX_BEGIN'), '门写在文件最顶部');
    assert((after.match(/# F50_BOOT_FIX_BEGIN/g) || []).length === 1, '只有一个 BEGIN 标记');
    assert((after.match(/# F50_BOOT_FIX_END/g) || []).length === 1, '只有一个 END 标记');
    MULTI.split('\n').filter((l) => l.trim()).forEach((line) => {
      assert(after.includes(line), `原始行仍在: ${line.slice(0, 40)}`);
    });
    const payload = after.slice(after.indexOf('# F50_BOOT_FIX_END') + 18);
    const orig = MULTI.split('\n').filter((l) => l.trim());
    const got = payload.split('\n').filter((l) => l.trim());
    assert(JSON.stringify(got) === JSON.stringify(orig), `门以下内容与原文件逐行一致 (${got.length} vs ${orig.length})`);
    assert(sbx.exists('data/f50_boot_fix/boot_manager.sh'), '管理器已安装');
  });

  await test('T2 重复点「安装/修复」：结果完全幂等，不会叠加', async () => {
    await freshInstall(MULTI);
    const first = sbx.readBoot();
    const app = loadPlugin(sbx);
    await app.click('install');
    const second = sbx.readBoot();
    assert(first === second, '第二次安装后文件字节一致');
    assert((second.match(/# F50_BOOT_FIX_BEGIN/g) || []).length === 1, '仍然只有一个门');
  });

  await test('T3 从旧版本升级：除管理器自己的门外，所有底层插件行原样保留', async () => {
    const legacyPlugin = `sleep 25; ${S}/data/plugin_legacy/start.sh --boot`;
    const old = [
      '# F50_BOOT_FIX_BEGIN',
      'if [ "${F50_BOOT_REPLAY:-0}" != "1" ]; then',
      `  ${S}/data/f50_boot_fix/boot_manager.sh >/dev/null 2>&1 &`,
      '  exit 0',
      'fi',
      '# F50_BOOT_FIX_END',
      '',
      `${S}/data/plugin_old/start.sh`,
      legacyPlugin,
      `touch ${S}/probe/other_plugin`,
      '',
    ].join('\n');
    sbx.reset(); clearProbes();
    sbx.writeBoot(old);
    const app = loadPlugin(sbx);
    await app.click('install');
    const after = sbx.readBoot();
    assert((after.match(/# F50_BOOT_FIX_BEGIN/g) || []).length === 1, '门没有重复');
    assert(after.includes(`${S}/data/plugin_old/start.sh`), '不识别或删除特定插件入口');
    assert(after.includes(legacyPlugin), '不改写特定插件的历史启动命令');
    assert(after.includes(`touch ${S}/probe/other_plugin`), '其它插件的行完好');
    assert(after.startsWith('# F50_BOOT_FIX_BEGIN'), '新门仍在最顶部');
  });

  await test('T3b 任意底层插件只有一条启动入口：不按插件名称过滤', async () => {
    await waitQuiet();
    sbx.reset(); clearProbes();
    const pluginEntry = `${S}/data/other_plugin/start.sh --boot`;
    sbx.writeBoot(pluginEntry);
    const app = loadPlugin(sbx);
    await app.click('install');
    const after = sbx.readBoot();
    assert((after.match(/# F50_BOOT_FIX_BEGIN/g) || []).length === 1, '新门安装成功');
    assert(after.includes(pluginEntry), '任意插件入口逐字保留');
  });

  await test('T3c 共享启动内容已被清空时：从首次安装备份恢复全部插件且只恢复一次', async () => {
    await waitQuiet();
    sbx.reset(); clearProbes();
    const backupEntries = [
      `${S}/data/plugin_a/start.sh`,
      `sh ${S}/data/plugin_b/boot.sh --late`,
      `touch ${S}/probe/plugin_c`,
      '',
    ].join('\n');
    await freshInstall('');
    fs.writeFileSync(sbx.p('sdcard/ufi_tools_boot.sh.before_f50_boot_manager'), backupEntries);
    fs.rmSync(sbx.p('data/f50_boot_fix/boot_backup_recovered'), { force: true });
    const repair = loadPlugin(sbx);
    await repair.click('install');
    const recovered = sbx.readBoot();
    backupEntries.split('\n').filter(Boolean).forEach((line) => {
      assert(recovered.includes(line), `恢复底层插件启动行: ${line}`);
    });
    assert(sbx.exists('data/f50_boot_fix/boot_backup_recovered'), '写入一次性恢复标记');

    sbx.writeBoot(gateOf(recovered));
    await repair.click('install');
    assert(!sbx.readBoot().includes('plugin_a/start.sh'), '恢复完成后不会反复加回用户主动清空的启动项');
  });

  await test('T4 启动文件门标记损坏（只有 BEGIN 没有 END）：拒绝写入，原文件零改动', async () => {
    const broken = [
      '# F50_BOOT_FIX_BEGIN',
      'if [ "${F50_BOOT_REPLAY:-0}" != "1" ]; then',
      `touch ${S}/probe/x1`,
      `touch ${S}/probe/x2`,
      '',
    ].join('\n');
    sbx.reset(); clearProbes();
    sbx.writeBoot(broken);
    const before = sbx.readBoot();
    const app = loadPlugin(sbx);
    await app.click('install');
    assert(sbx.readBoot() === before, '启动文件一字未动');
    const red = app.toasts.filter((t) => t.color === 'red');
    assert(red.length > 0, '有失败提示');
    assert(/门标记异常/.test(red.map((t) => t.msg).join(' ')), '提示里说明了门标记异常');
  });

  await test('T5 开机场景：门推迟执行，管理器等系统就绪后跑完所有插件', async () => {
    await freshInstall(MULTI);
    clearProbes();
    sbx.setBootCompleted('0');
    const boot = simulateBoot({ uptime: 5, bootCompleted: '0' });
    assert(/HOST_RC=0/.test(boot.stdout), '启动文件本身立刻返回 0');
    assert(probes().length === 0, '此刻还没有任何插件被执行（已推迟）');
    await sleep(1200);
    sbx.setBootCompleted('1');
    const state = await waitForState(sbx, 30000);
    const { meta, entries } = parseState(state);
    assert(meta.DONE === '1', '管理器执行完成');
    assert(meta.RUN_MODE === 'entries', '走的是逐条隔离模式');
    assert(entries.length === 4, `识别出 4 条插件指令，实际 ${entries.length}`);
    assert(entries.every((e) => e.status === 'ok'), '4 条全部成功');
    const p = probes();
    ['a1_cleanup', 'b1_service', 'b2_after_sleep', 'c1_mine', 'c2_mine'].forEach((f) => {
      assert(p.includes(f), `插件动作已发生: ${f}`);
    });
  });

  await test('T6 关键：某个插件的指令 exit，后面所有插件照常启动', async () => {
    const content = [
      `touch ${S}/probe/p1`,
      'exit 3',
      `touch ${S}/probe/p3`,
      `touch ${S}/probe/p4`,
      '',
    ].join('\n');
    // 先证明「整体重放」旧做法会漏掉后面的插件
    sbx.reset(); clearProbes();
    fs.writeFileSync(sbx.p('tmp/raw.sh'), content);
    sbx.runShell(`${DASH} "${S}/tmp/raw.sh"`, 10000, { rewrite: false });
    const rawProbes = probes();
    assert(rawProbes.includes('p1') && !rawProbes.includes('p3'),
      `旧做法（整条文件一起跑）确实会丢掉后面的插件，实测: ${rawProbes.join(',')}`);

    await freshInstall(content);
    clearProbes();
    simulateBoot({ uptime: 5, bootCompleted: '1' });
    const state = await waitForState(sbx, 30000);
    const { entries } = parseState(state);
    const p = probes();
    assert(p.includes('p1') && p.includes('p3') && p.includes('p4'),
      `新逻辑下 exit 之后的插件依然启动，实测: ${p.join(',')}`);
    const exitEntry = entries.find((e) => e.label === 'exit 3');
    assert(exitEntry && exitEntry.status === 'fail' && exitEntry.rc === '3', 'exit 3 那条被如实记为失败(rc=3)');
  });

  await test('T7 关键：某个插件卡死不退出，也不拖累后面的插件', async () => {
    const content = [
      `touch ${S}/probe/h1`,
      'sleep 45',
      `touch ${S}/probe/h3`,
      '',
    ].join('\n');
    await freshInstall(content);
    clearProbes();
    simulateBoot({ uptime: 5, bootCompleted: '1' });
    const state = await waitForState(sbx, 40000);
    const { entries } = parseState(state);
    const p = probes();
    assert(p.includes('h1') && p.includes('h3'), `卡死指令之后的插件仍然启动，实测: ${p.join(',')}`);
    const hang = entries.find((e) => e.label === 'sleep 45');
    assert(hang && hang.status === 'running', '卡住的那条被标记为「仍在运行」而不是被杀掉');
  });

  await test('T8 失败的插件指令会自动重试一次', async () => {
    const content = [
      `touch ${S}/probe/r1`,
      `if [ -f ${S}/probe/first_try ]; then touch ${S}/probe/retry_ok; else touch ${S}/probe/first_try; exit 1; fi`,
      `touch ${S}/probe/r3`,
      '',
    ].join('\n');
    await freshInstall(content);
    clearProbes();
    simulateBoot({ uptime: 5, bootCompleted: '1' });
    const state = await waitForState(sbx, 40000);
    const { entries } = parseState(state);
    const p = probes();
    assert(p.includes('retry_ok'), '重试确实执行了');
    assert(entries.some((e) => e.status === 'retry-ok'), '状态里记录了「重试后成功」');
    assert(p.includes('r3'), '后续插件不受影响');
  });

  await test('T9 多行写法（if/fi、heredoc、函数）被完整当成一条指令', async () => {
    const content = [
      `if [ -d ${S}/probe ]; then`,
      `  touch ${S}/probe/m1`,
      `  touch ${S}/probe/m2`,
      'fi',
      `cat > ${S}/probe/here.txt <<'EOF'`,
      'line-1',
      'line-2',
      'EOF',
      'my_func() {',
      `  touch ${S}/probe/m3`,
      '}',
      'my_func',
      '',
    ].join('\n');
    await freshInstall(content);
    clearProbes();
    simulateBoot({ uptime: 5, bootCompleted: '1' });
    const state = await waitForState(sbx, 30000);
    const { entries } = parseState(state);
    const p = probes();
    assert(p.includes('m1') && p.includes('m2'), 'if/fi 块被完整执行');
    assert(p.includes('here.txt'), 'heredoc 被完整执行');
    assert(fs.readFileSync(sbx.p('probe/here.txt'), 'utf8').includes('line-2'), 'heredoc 内容正确');
    const uniq = new Set(entries.map((e) => e.idx));
    assert(uniq.size === 3, `拆分为 3 条（if 块 / heredoc / 函数定义+调用），实际 ${uniq.size}`);
    assert(p.includes('m3'), '函数定义和它的调用被并在同一条里，调用成功');
  });

  await test('T9b 变量赋值和后面用到它的指令不会被拆散', async () => {
    const content = [
      `MYDIR=${S}/probe`,
      'MYNAME=v1',
      'touch "$MYDIR/$MYNAME"',
      `touch ${S}/probe/v_after`,
      '',
    ].join('\n');
    await freshInstall(content);
    clearProbes();
    simulateBoot({ uptime: 5, bootCompleted: '1' });
    await waitForState(sbx, 30000);
    const p = probes();
    assert(p.includes('v1'), `赋值对后面的指令仍然可见，实测: ${p.join(',')}`);
    assert(p.includes('v_after'), '后续指令照常执行');
  });

  await test('T10 兜底：管理器被删除（/data 被清理）时，门自动放行，绝不出现「什么都不启动」', async () => {
    await freshInstall(MULTI);
    clearProbes();
    fs.rmSync(sbx.p('data/f50_boot_fix'), { recursive: true, force: true });
    simulateBoot({ uptime: 5, bootCompleted: '0' });
    const p = probes();
    assert(p.includes('a1_cleanup') && p.includes('b1_service') && p.includes('c1_mine'),
      `管理器缺失时所有插件仍被直接执行，实测: ${p.join(',')}`);
  });

  await test('T11 启动文件被 source（而不是执行）时，不会打断宿主后续流程', async () => {
    await freshInstall(MULTI);
    clearProbes();
    const r = simulateBoot({ uptime: 5, bootCompleted: '0', sourced: true });
    assert(/HOST_CONTINUED rc=0/.test(r.stdout), `宿主脚本在门之后继续运行，实测输出: ${r.stdout.trim().slice(0, 120)}`);
  });

  await test('T12 宿主较晚调用启动文件：仍由管理器托管，不会因 uptime 较大而绕过修复', async () => {
    await freshInstall(MULTI);
    clearProbes();
    await waitQuiet();
    fs.rmSync(sbx.p('data/f50_boot_fix/last_run.txt'), { force: true });
    simulateBoot({ uptime: 9999, bootCompleted: '1' });
    const state = await waitForState(sbx, 30000);
    const { meta } = parseState(state);
    const p = probes();
    assert(p.includes('a1_cleanup') && p.includes('c2_mine'), `所有插件仍被执行，实测: ${p.join(',')}`);
    assert(meta.DONE === '1', '较晚触发仍走管理器并完整结束');
    assert(meta.TRIGGER === 'bootfile', `触发来源仍为启动文件，实际 ${meta.TRIGGER}`);
  });

  await test('T13 /sdcard 挂载晚于管理器启动：管理器会等文件出现再执行', async () => {
    await freshInstall(MULTI);
    clearProbes();
    const bootBackup = sbx.readBoot();
    fs.rmSync(sbx.bootFile(), { force: true });
    sbx.setBootCompleted('1');
    sbx.runShell(`( ${S}/data/f50_boot_fix/boot_manager.sh --trigger=test >/dev/null 2>&1 </dev/null & )`, 10000, { rewrite: false });
    await sleep(2500);
    assert(probes().length === 0, '文件还没出现时不会乱跑');
    sbx.writeBoot(bootBackup);
    const state = await waitForState(sbx, 30000);
    const { meta } = parseState(state);
    assert(meta.DONE === '1', '文件出现后管理器继续完成执行');
    assert(probes().includes('b1_service'), `插件最终被启动，实测: ${probes().join(',')}`);
  });

  await test('T14 安装之后其它插件再追加自启行：无需重装即可自动纳管', async () => {
    await freshInstall(MULTI);
    clearProbes();
    // 模拟另一个插件用 grep -qxF || echo >> 追加自己的启动行
    const newLine = `touch ${S}/probe/newplugin_z`;
    sbx.runShell(`grep -qxF '${newLine}' "${S}/sdcard/ufi_tools_boot.sh" || echo '${newLine}' >> "${S}/sdcard/ufi_tools_boot.sh"`, 10000, { rewrite: false });
    simulateBoot({ uptime: 5, bootCompleted: '1' });
    const state = await waitForState(sbx, 30000);
    const { entries } = parseState(state);
    assert(entries.length === 5, `新追加的行被自动纳管，共 5 条，实际 ${entries.length}`);
    assert(probes().includes('newplugin_z'), '新插件被启动');
  });

  await test('T15 多个触发点同时触发（启动文件 + service.d）也只执行一次', async () => {
    const counter = `${S}/probe/count`;
    const content = [`printf x >> ${counter}`, ''].join('\n');
    await freshInstall(content);
    clearProbes();
    sbx.setBootCompleted('1');
    sbx.setUptime(5);
    const mgr = `${S}/data/f50_boot_fix/boot_manager.sh`;
    sbx.runShell(`( ${mgr} --trigger=a >/dev/null 2>&1 </dev/null & ) ; ( ${mgr} --trigger=b >/dev/null 2>&1 </dev/null & )`, 10000, { rewrite: false });
    await waitForState(sbx, 30000);
    await sleep(1500);
    const count = fs.existsSync(sbx.p('probe/count')) ? fs.readFileSync(sbx.p('probe/count'), 'utf8').length : 0;
    assert(count === 1, `插件启动指令只被执行一次，实际执行 ${count} 次`);
  });

  await test('T15b 过期空锁存在时，多个触发点也只有一个能原子接管', async () => {
    const counter = `${S}/probe/stale_count`;
    const content = [`sleep 2; printf x >> ${counter}`, ''].join('\n');
    await freshInstall(content);
    await waitQuiet();
    clearProbes();
    fs.rmSync(sbx.p('data/f50_boot_fix/last_completed_boot_id'), { force: true });
    fs.rmSync(sbx.p('data/f50_boot_fix/last_run.txt'), { force: true });
    fs.mkdirSync(sbx.p('data/local/tmp/f50_plugin_boot_manager.lock'), { recursive: true });
    sbx.setBootCompleted('1');
    sbx.setUptime(5);
    const mgr = `${S}/data/f50_boot_fix/boot_manager.sh`;
    sbx.runShell(`( ${mgr} --trigger=stale-a >/dev/null 2>&1 </dev/null & ) ; ( ${mgr} --trigger=stale-b >/dev/null 2>&1 </dev/null & )`, 10000, { rewrite: false });
    await waitForState(sbx, 30000);
    await sleep(3000);
    const count = fs.existsSync(sbx.p('probe/stale_count'))
      ? fs.readFileSync(sbx.p('probe/stale_count'), 'utf8').length
      : 0;
    assert(count === 1, `过期锁只能被一个实例接管，实际执行 ${count} 次`);
  });

  await test('T16 启动文件本身有语法错误：不破坏文件，管理器退回整体重放且不崩', async () => {
    const content = [
      `touch ${S}/probe/s1`,
      'if [ 1 -eq 1 ]; then',
      `touch ${S}/probe/s2`,
      '',
    ].join('\n');
    await freshInstall(content);
    const after = sbx.readBoot();
    assert(after.includes(`touch ${S}/probe/s1`) && after.includes('if [ 1 -eq 1 ]; then'), '原内容一行没丢');
    const warned = loadPlugin(sbx);
    clearProbes();
    simulateBoot({ uptime: 5, bootCompleted: '1' });
    const state = await waitForState(sbx, 30000);
    const { meta } = parseState(state);
    assert(meta.DONE === '1', '管理器正常结束而不是卡死');
    assert(meta.RUN_MODE === 'whole', `退回整体重放，实际 ${meta.RUN_MODE}`);
    void warned;
  });

  await test('T17 CRLF 换行的启动文件：自动规整，行不丢且能正常执行', async () => {
    const content = [
      `touch ${S}/probe/w1`,
      `touch ${S}/probe/w2`,
      '',
    ].join('\r\n');
    await freshInstall(content);
    const after = sbx.readBoot();
    assert(!after.includes('\r'), '写回后不再有 CR');
    assert(after.includes(`touch ${S}/probe/w1`) && after.includes(`touch ${S}/probe/w2`), '两行都在');
    clearProbes();
    simulateBoot({ uptime: 5, bootCompleted: '1' });
    await waitForState(sbx, 30000);
    assert(probes().includes('w1') && probes().includes('w2'), '都被执行');
  });

  await test('T18 卸载：门被移除，各插件的启动行原样还原，管理器目录清理干净', async () => {
    await freshInstall(MULTI);
    const app = loadPlugin(sbx);
    await app.click('uninstall');
    const after = sbx.readBoot();
    assert(!after.includes('F50_BOOT_FIX_BEGIN'), '门已移除');
    const orig = MULTI.split('\n').filter((l) => l.trim());
    const got = after.split('\n').filter((l) => l.trim());
    assert(JSON.stringify(got) === JSON.stringify(orig), `逐行还原一致 (${got.length} vs ${orig.length})`);
    assert(!sbx.exists('data/f50_boot_fix'), '管理器目录已清理');
  });

  await test('T19 存在 Magisk service.d 时加装备用触发点，卸载时一并移除', async () => {
    sbx.reset(); clearProbes();
    fs.mkdirSync(sbx.p('data/adb/service.d'), { recursive: true });
    sbx.writeBoot(MULTI);
    const app = loadPlugin(sbx);
    await app.click('install');
    const hook = sbx.read('data/adb/service.d/f50_boot_fix.sh') || '';
    assert(hook, 'service.d 备用触发点已安装');
    assert(hook.includes('"$FIX" --trigger="$trigger"'), 'service.d 前台等待管理器完成');
    assert(!/boot_manager\.sh[^\n]*&/.test(hook), 'service.d 不再把管理器丢到易丢失的后台进程');
    assert(hook.includes('service.d-retry'), '冷启动失败后会延迟补触发一次');
    assert(app.toasts.some((t) => /service\.d/.test(t.msg)), '安装提示里说明了备用触发点');
    writeConfig();
    clearProbes();
    sbx.setBootCompleted('1');
    const hookRun = sbx.runShell(`${DASH} "${S}/data/adb/service.d/f50_boot_fix.sh"`, 30000, { rewrite: false });
    assert(hookRun.status === 0, '冷启动 service.d 入口能前台完成');
    const coldProbes = probes();
    assert(coldProbes.includes('a1_cleanup') && coldProbes.includes('c2_mine'), '冷启动入口执行了全部插件指令');
    await app.click('uninstall');
    assert(!sbx.exists('data/adb/service.d/f50_boot_fix.sh'), '卸载后备用触发点被移除');
  });

  await test('T20 「立即执行一次」按钮：不用重启就能验证所有插件的自启', async () => {
    await freshInstall(MULTI);
    clearProbes();
    const app = loadPlugin(sbx);
    await app.click('run');
    const p = probes();
    assert(p.includes('a1_cleanup') && p.includes('b2_after_sleep') && p.includes('c2_mine'),
      `一键执行跑完所有插件，实测: ${p.join(',')}`);
    const state = parseState(sbx.read('data/f50_boot_fix/last_run.txt'));
    assert(state.meta.DONE === '1' && state.meta.TRIGGER === 'manual', '状态记录了手工触发');
  });

  await test('T21 「检查状态」面板：列出所有被纳管的插件指令与上次执行结果', async () => {
    await freshInstall(MULTI);
    const app = loadPlugin(sbx);
    await app.click('run');
    await app.click('status');
    const detail = app.elements.get('#f50_boot_fix_standalone_detail').innerHTML;
    assert(/已安装/.test(detail), '显示已安装');
    // 标签上限 200 字符；沙盒路径本身就有 110+ 字符，所以只挑落在前 200 字符内的
    assert(/b1_service/.test(detail) && /c1_mine/.test(detail), '列出了各插件的启动指令');
    assert(/成功/.test(detail), '显示了执行结果');
    assert(/管理器运行日志/.test(detail) && /本次插件自启处理完成/.test(detail), '显示最近的具体运行日志');
    assert(!/⚠/.test(detail), `健康状态下没有告警，实际: ${(detail.match(/⚠[^<]*/g) || []).join(' | ')}`);
  });

  await test('T23 启动文件带 #! 头时，shebang 仍留在第一行（门插在它后面）', async () => {
    const content = ['#!/system/bin/sh', `touch ${S}/probe/sb1`, `touch ${S}/probe/sb2`, ''].join('\n');
    await freshInstall(content);
    const after = sbx.readBoot();
    assert(after.split('\n')[0] === '#!/system/bin/sh', `第一行仍是 shebang，实际: ${after.split('\n')[0]}`);
    assert(after.split('\n')[1] === '# F50_BOOT_FIX_BEGIN', '门紧跟在 shebang 之后');
    assert((after.match(/#!\/system\/bin\/sh/g) || []).length === 1, 'shebang 没有重复');
    clearProbes();
    simulateBoot({ uptime: 5, bootCompleted: '1' });
    await waitForState(sbx, 30000);
    assert(probes().includes('sb1') && probes().includes('sb2'), '插件照常启动');
    const app = loadPlugin(sbx);
    await app.click('status');
    const detail = app.elements.get('#f50_boot_fix_standalone_detail').innerHTML;
    assert(!/不在启动文件最顶部/.test(detail), '不会误报「门不在顶部」');
  });

  await test('T24 CRLF 换行 + 已装门：不会因为匹配不上而重复安装第二个门', async () => {
    await freshInstall(MULTI);
    const lf = sbx.readBoot();
    sbx.writeBoot(lf.replace(/\n/g, '\r\n'));
    const app = loadPlugin(sbx);
    await app.click('install');
    const after = sbx.readBoot();
    assert((after.match(/# F50_BOOT_FIX_BEGIN/g) || []).length === 1,
      `仍然只有一个门，实际 ${(after.match(/# F50_BOOT_FIX_BEGIN/g) || []).length} 个`);
    assert(!after.includes('\r'), 'CRLF 已被规整');
    clearProbes();
    simulateBoot({ uptime: 5, bootCompleted: '1' });
    await waitForState(sbx, 30000);
    assert(probes().includes('b1_service'), '插件照常启动');
  });

  await test('T25 /proc/uptime 读不到时，等待循环仍会超时退出而不是永远卡住', async () => {
    await freshInstall(MULTI);
    clearProbes();
    fs.writeFileSync(sbx.p('proc/uptime'), 'garbage-not-a-number\n');
    sbx.setBootCompleted('0');
    sbx.runShell(`( ${S}/data/f50_boot_fix/boot_manager.sh --trigger=test >/dev/null 2>&1 </dev/null & )`, 10000, { rewrite: false });
    const state = await waitForState(sbx, 45000);
    const { meta } = parseState(state);
    assert(meta.DONE === '1', '管理器没有卡死，最终完成');
    assert(meta.READY && /timeout/.test(meta.READY), `按超时路径继续执行，实际 READY=${meta.READY}`);
    assert(probes().includes('b1_service'), '插件最终被启动');
  });

  await test('T22 门被其它插件整体重写覆盖后，状态面板能报警', async () => {
    await freshInstall(MULTI);
    sbx.writeBoot(`${MULTI}\ntouch ${S}/probe/rewritten\n`);
    const app = loadPlugin(sbx);
    await app.click('status');
    const detail = app.elements.get('#f50_boot_fix_standalone_detail').innerHTML;
    assert(/门.*不见了|⚠/.test(detail), '面板给出了告警');
  });

  await test('T26 页面操作使用同一把忙锁，不允许安装与卸载并发执行', async () => {
    await waitQuiet();
    sbx.reset();
    sbx.writeBoot(MULTI);
    const app = loadPlugin(sbx);
    const installing = app.click('install');
    const uninstalling = app.click('uninstall');
    await Promise.all([installing, uninstalling]);
    assert(sbx.exists('data/f50_boot_fix/boot_manager.sh'), '并发点击没有卸载正在安装的管理器');
    assert((sbx.readBoot() || '').includes('# F50_BOOT_FIX_BEGIN'), '并发点击后启动门仍完整');
    assert(app.toasts.some((item) => /已有一项开机自启操作/.test(item.msg)), '第二个操作被明确拒绝');
  });

  await test('T27 管理器面板默认收起，并可由原生 details 控件展开或隐藏', async () => {
    await waitQuiet();
    sbx.reset();
    sbx.writeBoot(MULTI);
    const app = loadPlugin(sbx);
    const html = String(app.container.insertedElement?.innerHTML || '');
    assert(/<details id="f50_boot_fix_standalone_panel">/.test(html), '操作区使用可展开的 details 容器');
    assert(/<summary[^>]*>[\s\S]*全插件开机自启修复[\s\S]*<\/summary>/.test(html), '标题作为展开和隐藏入口');
    assert(!/<details[^>]*\sopen(?:\s|>)/.test(html), '面板默认保持收起以节省空间');
  });

  // -------------------------------------------------------------------------
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n=== 结果: ${passed}/${results.length} 通过 ===`);
  results.filter((r) => !r.ok).forEach((r) => {
    console.log(`\nFAIL ${r.name}`);
    if (r.error) console.log(`  ${r.error}`);
    (r.failed || []).forEach((f) => console.log(`  ✗ ${f.msg}`));
  });
  process.exit(passed === results.length ? 0 : 1);
})();
