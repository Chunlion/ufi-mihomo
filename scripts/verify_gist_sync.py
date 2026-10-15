"""Fresh repository build and classified release verification; never updates expected tests."""
from pathlib import Path
import argparse,hashlib,json,os,shutil,subprocess,sys,time
from gist_evidence import ROOT,run

WSLROOT='/mnt/'+ROOT.drive[0].lower()+ROOT.as_posix()[2:]
BUILD=ROOT/'build/gist-sync';REPORTS=ROOT/'reports/gist-sync'

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--clean',action='store_true');parser.add_argument('--browser',action='store_true');parser.add_argument('--device-readonly',action='store_true');parser.add_argument('--live',action='store_true');parser.add_argument('--revision',action='store_true',help='Recheck UI and package changes; require unchanged production binary from recorded integration');args=parser.parse_args()
    if os.name!='nt':raise SystemExit('Use Windows Python with Debian WSL; Go cross builds use the configured Windows toolchain')
    REPORTS.mkdir(parents=True,exist_ok=True)
    if args.clean and BUILD.exists():
        assert BUILD.resolve()==(ROOT/'build/gist-sync').resolve() and BUILD.resolve().is_relative_to(ROOT.resolve())
        shutil.rmtree(BUILD)
    rows=[];env=dict(os.environ,PYTHONUTF8='1',GOOS='linux',GOARCH='amd64',CGO_ENABLED='0');reused=None
    previous=REPORTS/'latest-run.json'
    if args.revision and previous.exists() and not (REPORTS/'base-run.json').exists():shutil.copyfile(previous,REPORTS/'base-run.json')
    def check(name,category,cmd,**kwargs):
        row=run(name,category,cmd,env=env,**kwargs);rows.append(row)
        if row['exit_code']:raise RuntimeError('Release verification failed: '+name)
        return row
    wsl=['wsl','-d','Debian','--']
    linuxenv=['env','PATH='+WSLROOT+'/.cache/gist-sync/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin','F50_TEST_YQ='+WSLROOT+'/.cache/gist-sync/tools/yq-linux-amd64','F50_TEST_QEMU='+WSLROOT+'/.cache/gist-sync/tools/qemu-aarch64']
    try:
        check('clean repository component build','STATIC',[sys.executable,'scripts/build_gist_sync.py'])
        check('pinned genuine test tools','STATIC',[sys.executable,'scripts/gist_test_tools.py'])
        bindir=ROOT/'.cache/gist-sync/bin';bindir.mkdir(exist_ok=True);(bindir/'tar').write_text('#!/bin/sh\nexec /usr/bin/bsdtar "$@"\n',encoding='utf-8',newline='\n')
        check('ZIP reader permission','STATIC',wsl+['chmod','755',WSLROOT+'/.cache/gist-sync/bin/tar'])
        for name in ['猫猫TProxy.js','gist-sync/plugin-gist.js','gist-sync/ui-gist.js']:
            check('syntax '+name,'STATIC',['node','--check',name])
        for name in ['Clash.GistSync','Clash.ConfigCommit']:
            check('Shell syntax '+name,'STATIC',wsl+['sh','-n',WSLROOT+'/build/gist-sync/clash/Scripts/'+name])
            check('BusyBox syntax '+name,'STATIC',wsl+['busybox','ash','-n',WSLROOT+'/build/gist-sync/clash/Scripts/'+name])
        if args.revision:
            integration=json.loads((REPORTS/'integration.json').read_text(encoding='utf-8'))
            digest=hashlib.sha256((BUILD/'bin/kano-gist-sync-linux-amd64').read_bytes()).hexdigest()
            assert digest==integration['binary_sha256'],'Production binary changed: run complete integration again'
            assert all(t['result']=='PASS' for t in integration['tests'])
            reused={'report':'reports/gist-sync/integration.json','binary_sha256':digest,'rerun':False}
        else:
            check('Go vet current source','STATIC',['go','-C','gist-sync/native','vet','./...'])
            check('compile current Go tests','STATIC',['go','-C','gist-sync/native','test','-c','-o','../../build/gist-sync/bin/native.test','.'])
            check('Go unit and process tests','UNIT',['wsl','-d','Debian','--cd',WSLROOT+'/gist-sync/native','--','../../build/gist-sync/bin/native.test','-test.v','-test.timeout=240s'],timeout=260)
            check('production CLI real transactions and daemon','INTEGRATION',wsl+['python3',WSLROOT+'/tests/gist-sync/integration.py'],timeout=300)
            check('shipped ARM64 age real decryption under QEMU','INTEGRATION',wsl+['python3',WSLROOT+'/tests/gist-sync/arm64-components.py'])
        for file in ['rc3-ui.js','ui-logic.js']:
            check('Gist UI and protocol '+file,'MOCK',wsl+['node',WSLROOT+'/tests/gist-sync/'+file])
        check('full original regression including ARM64 emulation','MOCK',wsl+linuxenv+['node',WSLROOT+'/scripts/verify_plugin.js'],timeout=600)
        check('package hashes, ELF and original component preservation','STATIC',[sys.executable,'tests/gist-sync/package-check.py'])
        if args.live:
            if not env.get('F50_GIST_LIVE_URL'):raise RuntimeError('--live requires F50_GIST_LIVE_URL (never logged)')
            check('authorized Raw HTTPS downloads and change comparison','LIVE',[sys.executable,'scripts/gist_live.py'],timeout=200)
            check('compile native LIVE test','STATIC',['go','-C','gist-sync/native','test','-c','-tags','live','-o','../../build/gist-sync/bin/live.test','.'])
            liveenv=dict(env);liveenv['WSLENV']=liveenv.get('WSLENV','')+':F50_GIST_LIVE_URL'
            row=run('production Go downloader on current external network','LIVE',wsl+[WSLROOT+'/build/gist-sync/bin/live.test','-test.run','^TestLiveGistDownload$','-test.v','-test.timeout=110s'],env=liveenv,timeout=125);rows.append(row)
            if row['exit_code']:
                output=(ROOT/row['stdout']).read_text(encoding='utf-8')
                if 'code=blocked_dns_address' not in output:raise RuntimeError('Unclassified native LIVE failure: inspect saved log')
                row['environment_blocked']='Local DNS returns blocked Fake-IP; original failed exit status preserved'
            # Keep FAIL and its original exit status in the evidence. The release
            # report separately identifies the diagnosed environment restriction.
        cli=str(Path.home()/'AppData/Local/Tabbit/LocalAgent/bin/tabbit-cli.exe');task='GistSync network validation' if args.revision else 'GistSync repo verification'
        if args.device_readonly:
            check('F50 device read-only inventory','DEVICE',[cli,'nodejs','--task',task,'--request-id','final-device-'+str(time.time_ns())],input=(ROOT/'tests/gist-sync/device-inspect.js').read_bytes(),timeout=90)
            check('F50 real host response framing','DEVICE',[cli,'nodejs','--task',task,'--request-id','final-host-'+str(time.time_ns())],input=(ROOT/'tests/gist-sync/host-bridge.js').read_bytes(),timeout=90)
        if args.browser:
            row=check('Tabbit real interactions with simulated device API','MOCK',[cli,'nodejs','--task',task,'--request-id','final-browser-'+str(time.time_ns()),'--timeout-ms','120000'],input=(ROOT/'tests/gist-sync/browser-ui.js').read_bytes(),timeout=135)
            receipt=json.loads((ROOT/row['stdout']).read_text(encoding='utf-8').splitlines()[-1]);screens=receipt.get('result',{}).get('screenshotsDelta',[])
            if screens:shutil.copyfile(screens[-1]['path'],REPORTS/'browser-ui.png')
        check('final source size report','STATIC',['node','scripts/report_plugin.js'])
        state='LOCAL_PASS_EXTERNAL_BLOCKED'
    except Exception as e:
        state='FAIL';print(str(e),flush=True)
    (REPORTS/'latest-run.json').write_text(json.dumps({'status':state,'scope':'UI revision' if args.revision else 'full release','reused_integration':reused,'plugin_sha256':hashlib.sha256((ROOT/'猫猫TProxy.js').read_bytes()).hexdigest(),'rows':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if state=='FAIL':raise SystemExit(1)
    print(state+'; device installation, production decryption and Android WebView remain separate gates')

if __name__=='__main__':main()
