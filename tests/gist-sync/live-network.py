"""Use independently resolved public Gist DNS in a private mount namespace only."""
from pathlib import Path
import ipaddress,json,os,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
if '--inside' not in sys.argv:
    subprocess.run(['unshare','-m',sys.executable,str(Path(__file__).resolve()),'--inside'],check=True)
else:
    subprocess.run(['mount','--make-rprivate','/'],check=True)
    reply=json.loads((ROOT/'.cache/gist-sync/dns.json').read_text())
    assert reply['Status']==0 and reply['Question'][0]['name'].rstrip('.')=='gist.githubusercontent.com'
    ips=[a['data'] for a in reply['Answer'] if a['type']==1]
    assert ips and all(ipaddress.ip_address(a).is_global for a in ips)
    with tempfile.NamedTemporaryFile(mode='w',prefix='gist-live-hosts-') as f:
        f.write(Path('/etc/hosts').read_text()+'\n'+ips[0]+' gist.githubusercontent.com\n');f.flush()
        subprocess.run(['mount','--bind',f.name,'/etc/hosts'],check=True)
        try:result=subprocess.run([str(ROOT/'build/gist-sync/bin/live.test'),'-test.run','^TestLiveGistDownload$','-test.v','-test.timeout=110s']);sys.exit(result.returncode)
        finally:subprocess.run(['umount','/etc/hosts'],check=True)
