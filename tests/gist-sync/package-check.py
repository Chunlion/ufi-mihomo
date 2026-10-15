"""Verify built package members, manifests and preservation of original components."""
from pathlib import Path
import hashlib,io,json,struct,subprocess,zipfile
ROOT=Path(__file__).resolve().parents[2]
sha=lambda b:hashlib.sha256(b).hexdigest()
original=subprocess.check_output(['git','show','adc9458:tproxy-yq.zip'],cwd=ROOT)
with zipfile.ZipFile(io.BytesIO(original)) as old,zipfile.ZipFile(ROOT/'tproxy-yq.zip') as current:
    assert current.testzip() is None
    modified=[]
    for name in old.namelist():
        if name.endswith('/'):continue
        assert name in current.namelist(),name+' removed'
        if old.read(name)!=current.read(name):modified.append(name)
    assert modified==['Tools/components.json'] or set(modified)=={'Tools/components.json'},modified
    full=json.loads(current.read('Tools/full-component-release.json'))
    for name,expected in full['files'].items():assert sha(current.read(name))==expected,name
    gist=json.loads(current.read('Tools/gist-sync-component.json'))
    for name,expected in gist['files'].items():assert sha(current.read(name))==expected,name
    for name in ['Tools/age','Tools/kano-gist-sync']:
        binary=current.read(name);assert binary[:4]==b'\x7fELF';assert struct.unpack('<H',binary[18:20])[0]==183
        assert (current.getinfo(name).external_attr>>16)&0o111
    assert current.read('Tools/kano-gist-sync')==(ROOT/'build/gist-sync/bin/kano-gist-sync-linux-arm64').read_bytes()
source=(ROOT/'猫猫TProxy.js').read_text(encoding='utf-8');release=json.loads((ROOT/'gist-sync/release.json').read_text())
if release['published']:
    assert release['urls'] and all(url.startswith('https://') for url in release['urls'])
    assert release['sha256']==sha((ROOT/'tproxy-yq.zip').read_bytes())
    for url in release['urls']:assert url in source
    assert '"published":true' in source
else:
    assert release['urls']==[]
    assert '"published":false' in source
assert sha((ROOT/'tproxy-yq.zip').read_bytes()) in source
assert (ROOT/'dist/gist-sync/猫猫TProxy.js').read_bytes()==(ROOT/'猫猫TProxy.js').read_bytes()
assert (ROOT/'dist/gist-sync/tproxy-yq-gistsync-full.zip').read_bytes()==(ROOT/'tproxy-yq.zip').read_bytes()
metadata=subprocess.check_output(['go','version','-m',str(ROOT/'build/gist-sync/bin/kano-gist-sync-linux-arm64')],text=True)
assert 'vcs.revision=' not in metadata and 'vcs.modified=' not in metadata,'Git state must not change the rebuilt package hash'
print(json.dumps({'original_components_byte_identical':True,'metadata_changes':modified,'full_manifest_members':len(full['files']),'gist_manifest_members':len(gist['files']),'arm64_elf_verified':True,'published':release['published']},indent=2))
