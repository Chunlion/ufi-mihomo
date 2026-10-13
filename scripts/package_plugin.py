"""Package the readable plugin, license, reports and maintenance sources."""

from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parents[1]
plugin = root / '猫猫TProxy.js'
assert b'\r' not in plugin.read_bytes()
assert plugin.read_bytes().endswith(b'//</script >\n')
results = json.loads((root / 'reports/v9.0.0-regression.json').read_text(encoding='utf-8'))
assert results['totals']['failed'] == 0
files = [plugin, root / 'LICENSE', root / '.gitattributes']
files += sorted((root / 'reports').glob('v9.0.0-*'))
files += [root / 'scripts' / name for name in ('compact_plugin.js', 'verify_plugin.js', 'report_plugin.js', 'package_plugin.py', 'patch_controller_http.js')]
files += sorted((root / 'tests/tproxy').glob('*.js'))
output = root / 'dist/猫猫TProxy-v9.0.0-精简交付.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for file in files:
        archive.write(file, file.relative_to(root).as_posix())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for file in files:
        assert archive.read(file.relative_to(root).as_posix()) == file.read_bytes()
print(f'{output.name}: {output.stat().st_size} bytes, {len(files)} files; contents verified')
