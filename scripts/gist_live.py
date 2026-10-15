"""Download the authorized Raw URL twice using verified HTTPS, without Gist API or keys."""
from pathlib import Path
import hashlib,json,os,subprocess
ROOT=Path(__file__).resolve().parents[1]
raw=os.environ.get('F50_GIST_LIVE_URL','')
if not raw:raise SystemExit('F50_GIST_LIVE_URL is required; do not put private URLs on the command line')
hashes=[];sizes=[]
for i in range(2):
    target=ROOT/f'.cache/gist-sync/live-{i}.age'
    subprocess.run(['node','scripts/gist_fetch.mjs',raw,str(target)],cwd=ROOT,check=True)
    data=target.read_bytes();assert data.startswith((b'age-encryption.org/v1',b'-----BEGIN AGE ENCRYPTED FILE-----'))
    hashes.append(hashlib.sha256(data).hexdigest());sizes.append(len(data))
report={'tls_verified':True,'http_status':200,'sizes':sizes,'sha256':hashes,'changed_between_reads':hashes[0]!=hashes[1],'production_decryption':'BLOCKED: production identity not supplied','transport':'Node fetch; production Go client tested separately'}
(ROOT/'reports/gist-sync/live.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,indent=2))
