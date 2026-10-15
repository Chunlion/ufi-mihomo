"""Write source-bound evidence and a complete user delivery."""
from pathlib import Path
import hashlib,json,shutil,subprocess,zipfile

ROOT=Path(__file__).resolve().parents[1]
REPORTS=ROOT/'reports/gist-sync'
DIST=ROOT/'dist/gist-sync'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    source=ROOT/'猫猫TProxy.js'
    run=json.loads((REPORTS/'latest-run.json').read_text(encoding='utf-8'))
    build=json.loads((ROOT/'build/gist-sync/build.json').read_text(encoding='utf-8'))
    assert run['status']=='LOCAL_PASS_EXTERNAL_BLOCKED'
    assert run['plugin_sha256']==sha(source)==build['plugin_sha256']
    assert build['package_sha256']==sha(ROOT/'tproxy-yq.zip')
    device=json.loads((REPORTS/'device-plugin-update.json').read_text(encoding='utf-8'))
    assert device['sourceSHA256']==sha(source) and device['otherPluginsPreserved']
    live=json.loads((REPORTS/'device-live.json').read_text(encoding='utf-8'))
    assert live['result']=='PASS' and live['before']==live['after']
    assert all(live['before'].get(k) for k in ['config','policy','source'])
    assert live['outcome']['code']=='age_decrypt_failed' and live['outcome']['downloaded'] and not live['outcome']['written']
    for row in run['rows']:
        assert row['exit_code']==0 or row.get('environment_blocked'),row['name']
    regression=json.loads((ROOT/'reports/v9.0.0-regression.json').read_text(encoding='utf-8'))
    assert regression['totals']['failed']==0 and regression['totals']['notRun']==0
    baseline=json.loads((REPORTS/'baseline.json').read_text(encoding='utf-8'))
    def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT).decode('utf-8').strip()
    proof={'snapshot':'before local task commit','root':git('rev-parse','--show-toplevel'),'branch':git('branch','--show-current'),
           'head':git('rev-parse','HEAD'),'initial_status':baseline['initial_status'],
           'status':git('status','--short'),'diff_stat':git('diff',baseline['head'],'--stat'),
           'files':git('diff',baseline['head'],'--name-status'),'pushed':False}
    (REPORTS/'git-proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    difference=f"""# 修改差异

仓库：`{proof['root']}`；分支 `{proof['branch']}`；本轮基线 `{baseline['head']}`。
初始只有用户已有的未跟踪 `AGENTS.md`，保持原样且不纳入提交。
RC2/RC3 是独立交付来源；维护源码、构建和测试均已纳入本仓库，没有初始化替代仓库。

- 主插件纳入 Gist 设置、下载、解密、配置事务、互斥、来源保护及恢复；Controller 协议、固定 Secret 和网络规则保留。
- 默认完整组件包增加 age、同步程序、脚本和清单；安装前校验文件哈希、程序退出状态及版本；重复升级保留设置与私钥。在线包未发布，停止使用缺少 GistSync 的旧镜像。
- JS 与 Gist 共用配置事务生成器。Go、模块 UI、构建和测试脚本纳入仓库。
- 响应带边界和退出码，组件缺失有准确分类；私钥请求通过设备一次性公钥加密，不调用图片上传。
- select 明确颜色、字体和高度。移除独立安装入口。实测修复重复 DOM ID、无事务恢复时空错误码。
- 采用用户提供的精简界面。空链接不再提交设备任务，清理粘贴链接两端的不可见字符；主按钮统一为“应用”，同一设备任务保存设置并同步 YAML，后台按所选间隔继续更新。首次状态查询的 yq 目录在初始化时建立。
- 订阅设置读取 Gist 的订阅与内置节点；手动订阅通过同一设备同步任务保存并合并，后续自动同步持续保留，按 URL 去重，不重建本地模板。新增手动 Provider 下载采用 DIRECT，确认实际节点后才报告加载成功；下载失败验证原配置回滚。
- 新增真实组件、SIGKILL、只读目录、API 失联、来源切换、取消和后台调度验证。旧测试补齐依赖；变化的 Shell 输出使用审查快照精确断言，验证器不会更新预期。

```text
{proof['diff_stat']}
```

完整源码差异见 `changes.patch`。F50 完整包升级已验证；真实 Gist 解密与配置校验已通过，F50 生产配置应用和 Android WebView 尚未验证。
"""
    (REPORTS/'CHANGES.md').write_text(difference,encoding='utf-8')
    patch=subprocess.check_output(['git','diff',baseline['head'],'--','猫猫TProxy.js','.gitattributes','.gitignore','README.md','scripts','gist-sync','tests','docs'],cwd=ROOT)
    (REPORTS/'changes.patch').write_bytes(patch)
    lines=['# 本轮构建与测试报告','',f'源码 SHA-256：`{sha(source)}`',
           f'完整包 SHA-256：`{sha(ROOT/"tproxy-yq.zip")}`','',
           f"原功能回归：{regression['totals']['passed']} PASS，0 FAIL，0 NOT RUN。",
           'Go 测试的硬件占位项仍为 BLOCKED，不计为设备通过。','',
           ('本次为用户精简界面的定向验证；未重跑的组件测试保留原记录，程序哈希与集成测试一致。' if run.get('scope')=='UI revision' else '以下为最后一次完整构建验证。'),
           '所有失败尝试保留在 `evidence.jsonl` 和 `logs/`。','']
    for row in run['rows']:
        result='BLOCKED（实际命令 FAIL）' if row.get('environment_blocked') else row['result']
        lines += [f"- **{row['name']}** — {row['category']} / {result}；退出码 `{row['exit_code']}`；{row['elapsed_seconds']} 秒。",
                  '  命令：`'+subprocess.list2cmdline(row['command'])+'`。',
                  '  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。',
                  f"  stdout：`{row['stdout']}`；stderr：`{row['stderr']}`。",'']
    integration=json.loads((REPORTS/'integration.json').read_text(encoding='utf-8'))
    lines+=['## 真实组件覆盖','',integration['components'],'']
    lines += [f"- INTEGRATION PASS：{x['name']}。" for x in integration['tests']]
    lines += ['', '## Gist 与手动订阅合并', '',
              '从当前源码重新构建。订阅设置读取 Gist 的 Provider 和内置节点；手动来源沿用 subscription_urls.txt，经加密请求在设备锁内保存。每次同步从 Gist 原文重新合并，按规范化 URL 去重，不替换原规则、策略组或同名 Provider。',
              '真实 age/yq/Mihomo 测试覆盖连续同步、后台到期更新、上游新增同一 URL、禁用及删除、节点实际加载和下载失败后的配置恢复。不同 URL 可能包含同一节点，不跨来源删除节点。',
              '复现并修复新增 Provider 下载受 MATCH 规则影响的启动依赖；仅新增的手动 Provider 使用 DIRECT。占位 COMPATIBLE 节点不算加载成功。最初后台测试未达到调度期限；测试显式设置持久化期限为过去后验证独立进程，未缩短产品同步间隔。早期失败日志保留。',
              '浏览器使用仓库真实对话框及模拟设备 API，验证 Gist 来源读取、隐藏模板替换、修改、禁用、清空及重新打开；属于 MOCK，不代表 Android WebView 或生产配置应用。']
    lines+=['','## F50 本轮实测','',
            '用户已授权备份后安装升级，不切换模式。完整备份位于设备 root 专用目录，指针 `/data/local/tmp/maomao-rc4-backup.path`。',
            '完整包升级及事务收尾成功；配置、来源、策略哈希与备份一致。核心只有一个，API HTTP 200，保持 TProxy。',
            '宿主已保存当前精简 JS，重新打开后逐字回读一致，其余六个插件未变。',
            '旧页面空链接触发 invalid_gist_url 已实机复现。新版空/错误链接在页面拦截，未新建设备任务。',
            '正式 ARM64 同步程序通过真实 HTTPS 下载用户 Gist，密文 SHA 与电脑下载一致；独立错误私钥被拒绝，确认配置指纹保持不变。此项是预期失败的负向测试。随后设备保存的私钥通过真实 Gist 只读解密与配置校验，未应用生产配置，证据见 `device-saved-test.json`。','']
    evidence=[json.loads(x) for x in (REPORTS/'evidence.jsonl').read_text(encoding='utf-8').splitlines() if x]
    names={'reproduce empty link invalid_gist_url on old installed UI','upgrade approved complete package retaining production mode','verify actual upgraded components core and configuration','persist user minimal plugin preserving other six entries','verify real downloader and confirmed fingerprint after initialization fix','actual minimal UI input download and negative decryption','actual F50 empty-link rejection and minimal UI','deploy compact 30px interval with single Apply action','verify compact interval matches actual Apply button','validate real saved Gist with device-held identity without applying','upgrade single Apply worker with original installer','verify core and configuration after Apply upgrade','actual F50 Apply button encrypted request and wrong-key protection','genuine initial status and full transaction regression','Raw URL boundary regression'}
    names.update({'backup F50 current saved settings before source merge upgrade','backup current host plugins before source merge upgrade',
                  'upgrade complete components with persistent source merge','verify upgraded source merge components and original network mode',
                  'deploy source merge UI preserving other plugins','validate saved real Gist including manual source overlay without applying',
                  'verify production source settings preserved after merge upgrade'})
    for row in evidence:
        if row['name'] not in names:continue
        lines += [f"- **{row['name']}** — {row['category']} / {row['result']}；退出码 `{row['exit_code']}`。",
                  '  命令：`'+subprocess.list2cmdline(row['command'])+'`；环境：'+('Tabbit / F50 Android 13 ARM64。' if row['category'].startswith('DEVICE') else 'Windows / Debian WSL。'),
                  f"  stdout：`{row['stdout']}`；stderr：`{row['stderr']}`。",'']
    lines += ['', '## BLOCKED 与限制','',
              '- 真实 TProxy/TUN/Off 数据流量、设备重启及长时间自动同步未执行；本次只授权安装升级、不切换模式。',
              '- 最初没有测试私钥；随后设备已保存用户设置，正式程序使用设备持有的私钥通过真实 Gist 下载、解密、YAML 和 Mihomo 校验，未写入生产配置，见 `device-saved-test.json`。早期网络下载证据见 `live.json`。',
              '- 电脑 WSL 的 Go LIVE 被 Fake-IP 检查阻止；F50 正式程序已成功下载相同 Gist。电脑失败退出码和日志保留，没有放开 SSRF 或 TLS 检查。',
              '- F50 主按钮输入拦截、紧凑暗色菜单及重新打开已通过。早期完整交互测试的断言错误及标签页关闭记录保留；设备已有用户设置后，测试按保护条件停止，未替换密钥。真实 Gist 使用设备保存密钥完成只读验证，未点击应用覆盖生产配置。',
              '- 普通浏览器交互使用真实 Chromium 与模拟设备 API，截图和颜色见 `browser-ui.png/json`。Android WebView 原生下拉弹窗未验证。',
              '- 后台测试使用实际独立进程，将持久化到期时间设为过去，没有等待 24 小时或重启设备。期限/重试有 UNIT 覆盖；F50 长时间网络恢复待验证。',
              '- 正常配置链路使用正式 AMD64 程序、真实 age/yq/Mihomo 和隔离 TLS。Off 服务适配器确认实际 API，不证明 Android 防火墙执行。仅测试二进制提供挂起点，以 SIGKILL 复现崩溃。',
              '- 在线完整包尚未发布。没有推送或正式发布；组件仅安装到已授权设备。','',
              '构建、安全边界与实机准备步骤见 `docs/gist-sync.md`。']
    (REPORTS/'TEST-REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    DIST.mkdir(parents=True,exist_ok=True)
    (DIST/'升级说明.txt').write_text('导入配套 JS，再在原组件管理中导入完整 ZIP。GistSync 和 age 一次安装，升级保留设置和私钥。Gist 页已采用精简界面，填写链接、私钥后点击应用即可更新 YAML。在线组件包尚未发布；本次 F50 已升级，保持 TProxy。真实 Gist 只读解密校验通过；F50 生产配置应用、模式切换及 Android WebView 未验证。\n',encoding='utf-8')
    for name in ['TEST-REPORT.md','CHANGES.md','changes.patch','git-proof.json']:
        shutil.copyfile(REPORTS/name,DIST/name)
    files=[DIST/name for name in ['猫猫TProxy.js','tproxy-yq-gistsync-full.zip','升级说明.txt','TEST-REPORT.md','CHANGES.md','changes.patch','git-proof.json']]
    sums=''.join(sha(p)+'  '+p.name+'\n' for p in files)
    (DIST/'SHA256SUMS').write_text(sums,encoding='utf-8')
    output=DIST/'Maomao-TProxy-GistSync-1.0.0-rc4-user.zip'
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in [*files,DIST/'SHA256SUMS']:z.write(p,p.name)
        for p in REPORTS.rglob('*'):
            if p.is_file() and p.name not in ['changes.patch','git-proof.json','TEST-REPORT.md','CHANGES.md']:
                z.write(p,'reports/gist-sync/'+p.relative_to(REPORTS).as_posix())
    with zipfile.ZipFile(output) as z:
        assert z.testzip() is None
        for p in files:assert z.read(p.name)==p.read_bytes()
    (DIST/'SHA256SUMS').write_text(sums+sha(output)+'  '+output.name+'\n',encoding='utf-8')
    for line in (DIST/'SHA256SUMS').read_text(encoding='utf-8').splitlines():
        expected,name=line.split('  ',1);assert sha(DIST/name)==expected,name
    print('Delivery members and all SHA-256 verified: '+output.name)

if __name__=='__main__':main()
