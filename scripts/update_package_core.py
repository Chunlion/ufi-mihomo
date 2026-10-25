"""Replace Proxy/Clash.Core inside tproxy-yq.zip with a newer mihomo build.

    python3 scripts/update_package_core.py <path-to-core> <version>

Checks the replacement really is an AArch64 Android build of the requested
version (the package has always shipped MetaCubeX's android-arm64-v8 asset,
which is linked against /system/bin/linker64), then rewrites the archive:
Proxy/Clash.Core, Tools/mihomo.version and the core block of
Tools/components.json. Every other member, its order, permissions and
timestamp are preserved, so the diff stays limited to the core.

Idempotent: running it twice with the same input leaves the same archive.
"""
from pathlib import Path
import hashlib
import json
import os
import re
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'tproxy-yq.zip'
CORE = 'Proxy/Clash.Core'
VERSION_FILE = 'Tools/mihomo.version'
COMPONENTS = 'Tools/components.json'

if len(sys.argv) != 3:
    raise SystemExit('usage: python3 scripts/update_package_core.py <core-file> <version>')
source = Path(sys.argv[1])
version = sys.argv[2].strip()
if not re.fullmatch(r'v\d+\.\d+\.\d+', version):
    raise SystemExit(f'version must look like v1.19.33, got {version!r}')
data = source.read_bytes()

# Same asset family check: AArch64, Android linker, exact version string.
if data[:4] != b'\x7fELF' or int.from_bytes(data[18:20], 'little') != 0xb7:
    raise SystemExit('replacement is not an AArch64 ELF binary')
if not re.search(rb'/system/bin/linker64', data):
    raise SystemExit('replacement is not the Android arm64-v8 build (no /system/bin/linker64)')
if not re.search(rb'(?<![A-Za-z0-9_.+-])' + re.escape(version.encode()) + rb'(?![A-Za-z0-9_.+-])', data):
    raise SystemExit(f'replacement does not contain the version string {version}')

with zipfile.ZipFile(PACKAGE) as z:
    entries = [(i.filename, i, z.read(i.filename)) for i in z.infolist()]
    archive_comment = z.comment
names = [name for name, _, _ in entries]
for required in (CORE, VERSION_FILE, COMPONENTS):
    if required not in names:
        raise SystemExit(f'member missing: {required}')
member = dict((name, content) for name, _, content in entries)
before = json.loads(member[COMPONENTS])
components = json.loads(member[COMPONENTS])
components['core'] = {
    'core_sha256': hashlib.sha256(data).hexdigest(),
    'core_bytes': len(data),
    'machine': 'AArch64',
    'version': version,
    'source': f'MetaCubeX/mihomo {version} official Android arm64-v8',
}

updates = {
    CORE: data,
    VERSION_FILE: (version + '\n').encode(),
    COMPONENTS: (json.dumps(components, indent=2, ensure_ascii=False) + '\n').encode(),
}
if any(member[name] != content for name, content in updates.items()):
    with tempfile.NamedTemporaryFile(dir=PACKAGE.parent, prefix='.gist-package-', suffix='.zip', delete=False) as tmp:
        temporary = Path(tmp.name)
    try:
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            z.comment = archive_comment
            for name, info, content in entries:
                z.writestr(info, updates.get(name, content))
        os.replace(temporary, PACKAGE)
    finally:
        temporary.unlink(missing_ok=True)

print(json.dumps({
    'version': version,
    'previous': before['core'],
    'current': components['core'],
    'delta_bytes': len(data) - before['core']['core_bytes'],
}, indent=2, ensure_ascii=False))
