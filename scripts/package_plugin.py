"""Package the readable plugin, license, reports and maintenance sources."""

from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
plugin = root / '猫猫TProxy.js'
results = json.loads((root / 'reports/v9.0.0-regression.json').read_text(encoding='utf-8'))
assert results['totals']['failed'] == 0
assert results['totals']['passed'] > 0
source = plugin.read_bytes()
assert b'//</script >' in source
source_hash = hashlib.sha256(source).hexdigest()
assert results['source']['bytes'] == len(source)
assert results['source']['sha256'] == source_hash, 'Regression report does not match plugin'
size = json.loads((root / 'reports/v9.0.0-size.json').read_text(encoding='utf-8'))
assert size['final'] == len(source)
assert size['sha256'] == source_hash, 'Size report does not match plugin'
files = [plugin, root / 'LICENSE', root / '.gitattributes']
files += sorted((root / 'reports').glob('v9.0.0-*'))
files += [root / 'scripts' / name for name in ('compact_plugin.js', 'verify_plugin.js', 'report_plugin.js', 'package_plugin.py', 'patch_controller_http.js', 'update_package_core.py')]
files += sorted((root / 'tests/tproxy').glob('*.js'))
output = root / 'dist/猫猫TProxy-v9.0.0-精简交付.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for file in files:
        archive.write(file, file.relative_to(root).as_posix())
with zipfile.ZipFile(output) as archive:
    for file in files:
        assert archive.read(file.relative_to(root).as_posix()) == file.read_bytes()
delivery = {'source': results['source'], 'regressionDate': results['date'], 'totals': results['totals'],
            'zip': {'path': output.relative_to(root).as_posix(), 'bytes': output.stat().st_size,
                    'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'files': len(files)}}
(root / 'dist/v9.0.0-delivery.json').write_text(json.dumps(delivery, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{output.name}: {delivery["zip"]["bytes"]} bytes, {len(files)} files; contents verified')
print(f'SHA-256: {delivery["zip"]["sha256"]}')

# The full GistSync delivery is generated from the same source-bound reports.
import subprocess, sys
subprocess.run([sys.executable, str(root / 'scripts/package_gist_sync.py')], cwd=root, check=True)
