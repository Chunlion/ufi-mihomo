"""Prepare pinned, genuine Linux test components without installing system packages."""
from pathlib import Path
import gzip,hashlib,io,json,os,subprocess,tarfile
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.cache/gist-sync/tools'
sha=lambda b:hashlib.sha256(b).hexdigest()

def fetch(url,path,digest=None):
    args=['node','scripts/gist_fetch.mjs',url,str(path)]
    if digest:args.append(digest)
    subprocess.run(args,cwd=ROOT,check=True)
    return path.read_bytes()

def main():
    CACHE.mkdir(parents=True,exist_ok=True)
    spec=json.loads((ROOT/'gist-sync/test-tools.json').read_text())
    core=spec['mihomo'];archive=CACHE/'mihomo-linux-amd64.gz'
    if not archive.exists() or sha(archive.read_bytes())!=core['archive_sha256']:fetch(core.get('download_api',core['source']),archive,core['archive_sha256'])
    (CACHE/'mihomo-linux-amd64').write_bytes(gzip.decompress(archive.read_bytes()))
    yq=spec['yq'];target=CACHE/'yq-linux-amd64'
    if not target.exists() or sha(target.read_bytes())!=yq['binary_sha256']:fetch(yq['source'],target,yq['binary_sha256'])
    age=spec['age_amd64'];directory=CACHE/'age-amd64';directory.mkdir(exist_ok=True)
    if not all((directory/n).exists() for n in ['age','age-keygen']):
        data=fetch(age['source'],CACHE/'age-linux-amd64.tar.gz')
        with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as tar:
            for name in ['age','age-keygen']:(directory/name).write_bytes(tar.extractfile('age/'+name).read())
    for name,key in [('age','binary_sha256'),('age-keygen','keygen_sha256')]:
        if sha((directory/name).read_bytes())!=age[key]:raise ValueError('Pinned age test binary mismatch')
    qemu=spec['qemu'];archive=CACHE/'qemu-user.deb'
    if not archive.exists() or sha(archive.read_bytes())!=qemu['archive_sha256']:fetch(qemu['source'],archive,qemu['archive_sha256'])
    command=['sh','-c','set -eu; dpkg-deb --fsys-tarfile .cache/gist-sync/tools/qemu-user.deb | /usr/bin/tar -xOf - ./usr/bin/qemu-aarch64 > .cache/gist-sync/tools/qemu-aarch64; chmod 755 .cache/gist-sync/tools/qemu-aarch64']
    if os.name=='nt':command=['wsl','-d','Debian','--',*command]
    subprocess.run(command,cwd=ROOT,check=True)
    report={p.relative_to(CACHE).as_posix():{'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size} for p in [CACHE/'mihomo-linux-amd64',target,directory/'age',directory/'age-keygen']}
    (ROOT/'reports/gist-sync/test-tools.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
