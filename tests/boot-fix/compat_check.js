'use strict';
// 设备上是 Android 的 mksh + toybox，本机是 dash/bash + GNU coreutils。
// 这一关只查两件事：1) 生成的脚本在多种 POSIX shell 下都能解析；2) 用到的外部命令/参数在
// busybox（最接近 toybox 的可得实现）里确实存在。
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Sandbox, loadPlugin } = require('./harness');

const BASH_EXE = process.env.F50_BASH || 'D:\\Program Files\\Git\\bin\\bash.exe';
const OUT = path.join(__dirname, 'compat');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const sh = (cmd) => spawnSync(BASH_EXE, ['-c', cmd], { encoding: 'utf8', windowsHide: true, timeout: 30000 });

let fails = 0;
const check = (name, ok, detail = '') => {
  if (!ok) fails += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n         ${String(detail).trim().slice(0, 300)}`}`);
};

(async () => {
  console.log('\n=== 可移植性检查（mksh / toybox 代理）===\n');

  // 1. 收集插件生成的所有 shell 脚本（不执行，只记录）
  const sbx = new Sandbox(path.join(__dirname, 'sbxc'));
  sbx.reset();
  sbx.writeBoot('touch /tmp/x\n');
  const scripts = [];
  const origRun = sbx.runShell.bind(sbx);
  sbx.runShell = (script) => {
    scripts.push(script);
    // 只放行 root 检查，其余一律不执行，纯收集脚本文本
    const stdout = /^\s*whoami\s*$/.test(script) ? 'root' : '';
    return { script, stdout, status: 0, timedOut: false };
  };
  const app = loadPlugin(sbx);
  await app.click('install').catch(() => {});
  await app.click('uninstall').catch(() => {});
  await app.click('status').catch(() => {});
  sbx.runShell = origRun;

  // 安装脚本里用 heredoc 内嵌了管理器和门，单独抽出来分别检查
  const installScript = scripts.find((s) => s.includes('F50_BOOT_FIX_INSTALLED')) || '';
  const manager = (installScript.match(/<<'F50_BOOT_FIX_EOF'\n([\s\S]*?)\nF50_BOOT_FIX_EOF/) || [])[1] || '';
  const gate = (installScript.match(/<<'F50_BOOT_GATE_EOF'\n([\s\S]*?)\nF50_BOOT_GATE_EOF/) || [])[1] || '';
  const hook = (installScript.match(/<<'F50_SERVICE_D_EOF'\n([\s\S]*?)\nF50_SERVICE_D_EOF/) || [])[1] || '';

  check('抽出管理器脚本', manager.length > 2000, `长度 ${manager.length}`);
  check('抽出门代码', gate.includes('F50_BOOT_FIX_BEGIN'), gate.slice(0, 80));
  check('抽出 service.d 钩子', hook.includes('boot_manager.sh'));

  const files = {
    manager: manager.replace(/^#!.*\n/, '#!/bin/sh\n'),
    gate,
    hook: hook.replace(/^#!.*\n/, '#!/bin/sh\n'),
    install: installScript,
    uninstall: scripts.find((s) => s.includes('F50_BOOT_FIX_REMOVED')) || '',
    inspect: scripts.find((s) => s.includes('F50_META_BEGIN')) || '',
  };
  for (const [name, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(OUT, `${name}.sh`), body);
  }

  // 2. 多种 shell 下的语法检查
  const outPosix = `/${OUT.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (m, d) => d.toLowerCase())}`;
  for (const name of Object.keys(files)) {
    if (!files[name]) { check(`${name}: 脚本非空`, false); continue; }
    for (const [label, cmd] of [
      ['dash', 'dash -n'],
      ['bash', 'bash -n'],
      ['busybox ash', 'busybox sh -n'],
    ]) {
      const r = sh(`${cmd} "${outPosix}/${name}.sh"`);
      check(`${name}.sh 语法 (${label})`, r.status === 0, (r.stderr || '') + (r.stdout || ''));
    }
  }

  // 3. bash 专属写法扫描（mksh 上会炸）
  const BASHISMS = [
    [/\blocal\s+\w/, 'local'],
    [/\[\[(?!:)/, '[[ ]]'],
    [/\[\s[^]]*==\s/, '[ == ]（应为 =）'],
    [/\bsource\s/, 'source（应为 .）'],
    [/\$\{[A-Za-z_][A-Za-z0-9_]*\[[0-9@*]/, '数组'],
    [/\$'\\/, "$'...' 转义"],
    [/\becho\s+-e\b/, 'echo -e'],
    [/\bfunction\s+\w+\s*\(/, 'function 关键字'],
    [/&>\s*\S/, '&> 重定向'],
    [/\|&/, '|& 管道'],
    [/<<</, '<<< here-string'],
  ];
  for (const [name, body] of Object.entries(files)) {
    const hits = BASHISMS.filter(([re]) => re.test(body)).map(([, label]) => label);
    check(`${name}.sh 无 bash 专属写法`, hits.length === 0, hits.join(', '));
  }

  // 4. 外部命令 + 参数在 busybox（toybox 代理）里是否可用
  const tmp = `${outPosix}/probe`;
  sh(`mkdir -p "${tmp}"; printf 'alpha\\nbeta\\n\\ngamma\\n' > "${tmp}/f.txt"; printf 'x\\r\\n' > "${tmp}/crlf.txt"`);
  const CMDS = [
    ['grep -cxF 整行精确计数', `busybox grep -cxF alpha "${tmp}/f.txt"`, '1'],
    ['grep -cF 子串计数', `busybox grep -cF lph "${tmp}/f.txt"`, '1'],
    ['grep -c -v -e 非空行计数', `busybox grep -c -v -e '^[[:space:]]*$' "${tmp}/f.txt"`, '3'],
    ['awk -v 传参', `busybox awk -v b=alpha '$0==b{n++}END{print n+0}' "${tmp}/f.txt"`, '1'],
    ['awk 八进制转义', `busybox awk 'BEGIN{ if ("\\047" == "'"'"'") print "ok"; else print "no" }'`, 'ok'],
    ['awk substr/index/match', `busybox awk 'BEGIN{ s="abcdef"; if (index(s,"cd")==3 && substr(s,2,2)=="bc" && match(s,/de/)==4) print "ok" }'`, 'ok'],
    ['awk END exit code', `busybox awk 'END{exit 3}' "${tmp}/f.txt"; echo $?`, '3'],
    ['sed 去 CR', `busybox sed 's/\\r$//' "${tmp}/crlf.txt" | busybox wc -c | tr -d ' '`, '2'],
    ['sed -i 就地替换', `cp "${tmp}/f.txt" "${tmp}/s.txt"; busybox sed -i 's#^alpha$#ALPHA#' "${tmp}/s.txt"; busybox grep -c ALPHA "${tmp}/s.txt"`, '1'],
    ['stat -c %a 取权限', `busybox stat -c %a "${tmp}/f.txt" >/dev/null && echo ok`, 'ok'],
    ['tail -n', `busybox tail -n 1 "${tmp}/f.txt"`, 'gamma'],
    ['tail -n +2 跳过首行', `busybox tail -n +2 "${tmp}/f.txt" | busybox head -n 1`, 'beta'],
    ['head -n', `busybox head -n 1 "${tmp}/f.txt"`, 'alpha'],
    ['wc -l 重定向输入', `busybox wc -l < "${tmp}/f.txt" | tr -d ' '`, '4'],
    ['wc -c 重定向输入', `busybox wc -c < "${tmp}/crlf.txt" | tr -d ' '`, '3'],
    ['cut -d. -f1 取 uptime 整数', `echo 1234.56 | busybox cut -d. -f1`, '1234'],
    ['tr -d 去空白', `printf ' 7 \\n' | busybox tr -d ' \\n'`, '7'],
    ['date 格式化', `busybox date "+%Y" >/dev/null && echo ok`, 'ok'],
    ['mkdir 原子建目录（当锁用）', `rm -rf "${tmp}/lk"; busybox mkdir "${tmp}/lk" && busybox mkdir "${tmp}/lk" 2>/dev/null; echo $?`, '1'],
    ['rmdir 释放锁', `busybox rmdir "${tmp}/lk" && echo ok`, 'ok'],
    ['mv -f 原子替换', `printf new > "${tmp}/n"; busybox mv -f "${tmp}/n" "${tmp}/f.txt" && busybox cat "${tmp}/f.txt"`, 'new'],
    ['kill -0 探测进程（shell 内建）', `dash -c 'kill -0 $$ && echo ok'`, 'ok'],
    ['command -v 探测命令', `command -v busybox >/dev/null && echo ok`, 'ok'],
    ['printf %s\\n', `busybox printf '%s\\n' hi`, 'hi'],
  ];
  for (const [name, cmd, expect] of CMDS) {
    const r = sh(cmd);
    const got = String(r.stdout || '').trim();
    check(`busybox: ${name}`, got === expect, `期望 ${expect}，实际 "${got}" ${r.stderr || ''}`);
  }

  // 5. 门代码在三种 shell 下 source / 执行的行为
  const gateFile = `${outPosix}/gate_probe.sh`;
  fs.writeFileSync(path.join(OUT, 'gate_probe.sh'), `${gate}\necho PAYLOAD_RAN\n`);
  // busybox 是原生 Windows 程序，内建的 . 不认 /c/... 形式，单独给它 Windows 风格路径
  const winOut = OUT.replace(/\\/g, '/');
  for (const [label, shell, gp] of [
    ['dash', 'dash', gateFile],
    ['bash', 'bash', gateFile],
    ['busybox ash', 'busybox sh', `${winOut}/gate_probe.sh`],
  ]) {
    const exec = sh(`cd "${outPosix}" && ${shell} "${gp}"; echo "rc=$?"`);
    check(`门在 ${label} 下直接执行不报错`, /rc=0/.test(exec.stdout || ''), exec.stdout + exec.stderr);
    const sourced = sh(`cd "${outPosix}" && ${shell} -c '. "${gp}"; echo HOST_ALIVE'`);
    check(`门在 ${label} 下被 source 不打断宿主`, /HOST_ALIVE/.test(sourced.stdout || ''), sourced.stdout + sourced.stderr);
  }

  console.log(`\n=== 可移植性检查: ${fails === 0 ? '全部通过' : `${fails} 项失败`} ===`);
  process.exit(fails === 0 ? 0 : 1);
})();
