"""Execute the shipped ARM64 age with real ciphertext through a CPU emulator."""
from pathlib import Path
import json,os,subprocess,tempfile
ROOT=Path(__file__).resolve().parents[2];TOOLS=ROOT/'.cache/gist-sync/tools';BUILD=ROOT/'build/gist-sync'
with tempfile.TemporaryDirectory(prefix='age-arm64-') as d:
    d=Path(d);key=d/'key';subprocess.run([str(TOOLS/'age-amd64/age-keygen'),'-o',str(key)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
    recipient=subprocess.check_output([str(TOOLS/'age-amd64/age-keygen'),'-y',str(key)])
    plain=b'proxies: []\nrules: [MATCH,DIRECT]\n';cipher=subprocess.check_output([str(TOOLS/'age-amd64/age'),'-r',recipient.decode().strip()],input=plain)
    actual=subprocess.check_output([str(TOOLS/'qemu-aarch64'),str(BUILD/'clash/Tools/age'),'-d','-i',str(key)],input=cipher)
    assert actual==plain
    for bad in [cipher[:-20],b'not an age ciphertext']:
        r=subprocess.run([str(TOOLS/'qemu-aarch64'),str(BUILD/'clash/Tools/age'),'-d','-i',str(key)],input=bad,stdout=subprocess.PIPE,stderr=subprocess.PIPE);assert r.returncode!=0
    version=json.loads(subprocess.check_output([str(TOOLS/'qemu-aarch64'),str(BUILD/'clash/Tools/kano-gist-sync'),'version']))
    assert version['goarch']=='arm64' and version['version']=='1.0.0-rc4' and version['protocol']==1
print('PASS genuine ARM64 age decryption, corrupted ciphertext rejection and worker ELF execution; emulator, not F50')
