"""Build GistSync from repository sources and refresh the complete component package."""
from pathlib import Path
import hashlib,io,json,os,re,shutil,subprocess,tarfile,tempfile,urllib.request,zipfile

ROOT=Path(__file__).resolve().parents[1]
BUILD=ROOT/'build/gist-sync'
PACKAGE=ROOT/'tproxy-yq.zip'
OWNED={'Tools/kano-gist-sync','Tools/age','Tools/age.LICENSE','Scripts/Clash.GistSync','Scripts/Clash.ConfigCommit','Tools/gist-sync-component.json','Tools/full-component-release.json'}
sha=lambda b:hashlib.sha256(b).hexdigest()

def age_files():
    spec=json.loads((ROOT/'gist-sync/age.json').read_text(encoding='utf-8'))
    cache=ROOT/'.cache/gist-sync/tools'
    if (cache/'age-arm64').is_file() and (cache/'age.LICENSE').is_file():
        binary,license=(cache/'age-arm64').read_bytes(),(cache/'age.LICENSE').read_bytes()
    else:
        with zipfile.ZipFile(PACKAGE) as z:
            if {'Tools/age','Tools/age.LICENSE'} <= set(z.namelist()):
                binary,license=z.read('Tools/age'),z.read('Tools/age.LICENSE')
            else:
                with urllib.request.urlopen(spec['source'],timeout=90) as r:data=r.read(16<<20)
                if sha(data)!=spec['archive_sha256']:raise ValueError('Official age archive checksum mismatch')
                with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as archive:
                    binary=archive.extractfile('age/age').read();license=archive.extractfile('age/LICENSE').read()
    if sha(binary)!=spec['binary_sha256'] or sha(license)!=spec['license_sha256']:raise ValueError('Pinned age binary or license mismatch')
    return binary,license

def main():
    BUILD.mkdir(parents=True,exist_ok=True)
    subprocess.run(['node','scripts/sync_gist_plugin.js'],cwd=ROOT,check=True)
    release=json.loads((ROOT/'gist-sync/release.json').read_text(encoding='utf-8'))
    native=ROOT/'gist-sync/native'
    if f'const version = "{release["version"]}"' not in (native/'common.go').read_text():raise ValueError('Worker and release version differ')
    for arch in ['arm64','amd64']:
        env=dict(os.environ,GOOS='linux',GOARCH=arch,CGO_ENABLED='0')
        output=BUILD/f'bin/kano-gist-sync-linux-{arch}';output.parent.mkdir(exist_ok=True)
        subprocess.run(['go','build','-buildvcs=false','-trimpath','-ldflags=-s -w -buildid=','-o',str(output),'.'],cwd=native,env=env,check=True)
    tools=BUILD/'clash/Tools';tools.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(BUILD/'bin/kano-gist-sync-linux-arm64',tools/'kano-gist-sync')
    age,license=age_files();(tools/'age').write_bytes(age);(tools/'age.LICENSE').write_bytes(license)
    names=sorted(OWNED-{'Tools/full-component-release.json','Tools/gist-sync-component.json'})
    manifest={'version':release['version'],'protocol':release['protocol'],'platform':'linux-arm64','age_included':True,'files':{n:sha((BUILD/'clash'/n).read_bytes()) for n in names}}
    (tools/'gist-sync-component.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
    with zipfile.ZipFile(PACKAGE) as z:
        files={i.filename:z.read(i) for i in z.infolist() if not i.is_dir() and i.filename not in OWNED}
    base_files={n:sha(data) for n,data in files.items() if n!='Tools/components.json'}
    metadata=json.loads(files['Tools/components.json'])
    metadata['full_package_version']=release['version'];metadata['gist_sync']=manifest
    files['Tools/components.json']=(json.dumps(metadata,indent=2)+'\n').encode()
    for name in OWNED-{'Tools/full-component-release.json'}:files[name]=(BUILD/'clash'/name).read_bytes()
    full={'version':release['version'],'platform':'linux-arm64','base_files_sha256':sha(json.dumps(base_files,sort_keys=True).encode()),'files':{n:sha(data) for n,data in sorted(files.items())}}
    files['Tools/full-component-release.json']=(json.dumps(full,indent=2)+'\n').encode()
    with tempfile.NamedTemporaryFile(dir=PACKAGE.parent,prefix='.gist-package-',suffix='.zip',delete=False) as tmp:temporary=Path(tmp.name)
    try:
        with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
            for name,data in sorted(files.items()):
                info=zipfile.ZipInfo(name,(2026,10,15,0,0,0));info.create_system=3;info.compress_type=zipfile.ZIP_DEFLATED
                executable=name.startswith('Scripts/') or name in {'Tools/age','Tools/kano-gist-sync','Tools/yq_linux_arm64','Tools/mosdns_arm64','Proxy/Clash.Core'} or name.startswith('Tools/kano-f50-helper')
                info.external_attr=(0o100755 if executable else 0o100644)<<16;z.writestr(info,data)
        with zipfile.ZipFile(temporary) as z:
            if z.testzip() is not None:raise ValueError('Complete package CRC failed')
            for name,data in files.items():
                if z.read(name)!=data:raise ValueError('Complete package differs: '+name)
        os.replace(temporary,PACKAGE)
    finally:temporary.unlink(missing_ok=True)
    subprocess.run(['node','--check','猫猫TProxy.js'],cwd=ROOT,check=True)
    output=ROOT/'dist/gist-sync';output.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(PACKAGE,output/'tproxy-yq-gistsync-full.zip')
    shutil.copyfile(ROOT/'猫猫TProxy.js',output/'猫猫TProxy.js')
    report={'version':release['version'],'go':subprocess.check_output(['go','version'],text=True).strip(),
            'plugin_sha256':sha((ROOT/'猫猫TProxy.js').read_bytes()),'package_sha256':sha(PACKAGE.read_bytes()),'native_sha256':{a:sha((BUILD/f'bin/kano-gist-sync-linux-{a}').read_bytes()) for a in ['arm64','amd64']},'manifest':manifest}
    (BUILD/'build.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='manifest'},indent=2))

if __name__=='__main__':main()
