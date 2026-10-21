"""Replace Scripts/Clash.Service inside tproxy-yq.zip with the refreshed file."""
from pathlib import Path
import os, sys, tempfile, zipfile

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'tproxy-yq.zip'
source = Path(sys.argv[1])
data = source.read_bytes()
with zipfile.ZipFile(PACKAGE) as z:
    entries = [(i.filename, i, z.read(i.filename)) for i in z.infolist()]
assert any(name == 'Scripts/Clash.Service' for name, _, _ in entries), 'member missing'
with tempfile.NamedTemporaryFile(dir=PACKAGE.parent, prefix='.gist-package-', suffix='.zip', delete=False) as tmp:
    temporary = Path(tmp.name)
try:
    with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name, info, content in entries:
            if name == 'Scripts/Clash.Service':
                content = data
            item = zipfile.ZipInfo(name, (2026, 10, 15, 0, 0, 0))
            item.create_system = 3
            item.compress_type = zipfile.ZIP_DEFLATED
            item.external_attr = info.external_attr
            z.writestr(item, content)
    os.replace(temporary, PACKAGE)
finally:
    temporary.unlink(missing_ok=True)
print(f'updated Scripts/Clash.Service ({len(data)} bytes)')
