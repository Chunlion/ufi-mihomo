"""Isolated Linux service adapter: real Mihomo lifecycle/API, no firewall claims."""
import json,os,signal,subprocess,sys,time,urllib.request
from pathlib import Path
ROOT=Path('/data/clash');TEST=Path('/test')
def config():
    return json.loads(subprocess.check_output([str(ROOT/'Tools/yq_linux_arm64'),'e','-o=json','.',str(ROOT/'Proxy/config.yaml')]))
def api():
    req=urllib.request.Request('http://127.0.0.1:7788/configs',headers={'Authorization':'Bearer '+config()['secret']})
    with urllib.request.urlopen(req,timeout=2) as r:return json.load(r)
def pid():
    p=TEST/'core.pid'
    return int(p.read_text()) if p.exists() else 0
def stop():
    number=pid()
    if number:
        try:
            if os.readlink(f'/proc/{number}/exe')!=str(ROOT/'Proxy/Clash.Core'):raise RuntimeError('Core process identity changed')
            os.kill(number,signal.SIGTERM)
            for _ in range(100):
                if not Path(f'/proc/{number}/exe').exists():break
                time.sleep(.03)
        except FileNotFoundError:pass
        (TEST/'core.pid').unlink(missing_ok=True)
def start():
    subprocess.run([str(ROOT/'Proxy/Clash.Core'),'-t','-d',str(ROOT/'Proxy'),'-f',str(ROOT/'Proxy/config.yaml')],stdout=subprocess.DEVNULL,check=True)
    with (TEST/'mihomo.log').open('ab') as log:
        child=subprocess.Popen([str(ROOT/'Proxy/Clash.Core'),'-d',str(ROOT/'Proxy'),'-f',str(ROOT/'Proxy/config.yaml')],stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
    (TEST/'core.pid').write_text(str(child.pid))
    for _ in range(200):
        try:api();print('START_STATE=started_verified_process');return
        except Exception:time.sleep(.03)
    raise RuntimeError('Genuine Mihomo API did not become ready')
def verify():
    expected=config();actual=api()
    for name in ['port','socks-port','mixed-port','tproxy-port','allow-lan','ipv6','mode','unified-delay']:
        if name in expected and actual.get(name)!=expected[name]:raise RuntimeError('Actual Mihomo runtime mismatch: '+name)
    assert 'traffic_mode=off' in (ROOT/'Policy/options.conf').read_text()
    (TEST/'policy-verified.json').write_text(json.dumps({'mode':'off','live_api_verified':True}))
    print('ISOLATED_OFF_POLICY_VERIFIED=1')
args=sys.argv[1:]
if args[0] in ['start','restart']:
    if (TEST/'deny-restart').exists():raise RuntimeError('Injected service restart denial')
    if args[0]=='restart':stop()
    start()
elif args[0]=='stop':stop()
elif args==['policy','apply'] or args==['policy','verify']:verify()
else:raise RuntimeError('Unsupported integration service action')
