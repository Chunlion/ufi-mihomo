"""Verify built package members, manifests and the delivery copies."""
from pathlib import Path
import hashlib,json,struct,subprocess,zipfile
ROOT=Path(__file__).resolve().parents[2]
sha=lambda b:hashlib.sha256(b).hexdigest()
with zipfile.ZipFile(ROOT/'tproxy-yq.zip') as current:
    assert current.testzip() is None
    gist=json.loads(current.read('Tools/gist-sync-component.json'))
    for name,expected in gist['files'].items():assert sha(current.read(name))==expected,name
    for name in ['Tools/age','Tools/kano-gist-sync']:
        binary=current.read(name);assert binary[:4]==b'\x7fELF';assert struct.unpack('<H',binary[18:20])[0]==183
        assert (current.getinfo(name).external_attr>>16)&0o111
    assert current.read('Tools/kano-gist-sync')==(ROOT/'build/gist-sync/bin/kano-gist-sync-linux-arm64').read_bytes()
source=(ROOT/'猫猫TProxy.js').read_text(encoding='utf-8');release=json.loads((ROOT/'gist-sync/release.json').read_text())
assert gist['version']==release['version']
assert gist['protocol']==release['protocol']==1
assert 'F50_FULL_COMPONENT_RELEASE' not in source
assert (ROOT/'dist/gist-sync/猫猫TProxy.js').read_bytes()==(ROOT/'猫猫TProxy.js').read_bytes()
assert (ROOT/'dist/gist-sync/tproxy-yq-gistsync-full.zip').read_bytes()==(ROOT/'tproxy-yq.zip').read_bytes()
metadata=subprocess.check_output(['go','version','-m',str(ROOT/'build/gist-sync/bin/kano-gist-sync-linux-arm64')],text=True)
assert 'vcs.revision=' not in metadata and 'vcs.modified=' not in metadata,'Git state must not change the rebuilt package hash'
print(json.dumps({'gist_manifest_members':len(gist['files']),'arm64_elf_verified':True},indent=2))
