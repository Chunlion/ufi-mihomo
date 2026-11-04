"""Package twelve upstream YAMLs and existing offline core inputs for F50 file tests."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

SAMPLES = [
    'THEYAMLS/General_Config/666OS/Lite_en.yaml',
    'THEYAMLS/General_Config/666OS/Pro_en.yaml',
    'THEYAMLS/General_Config/666OS/Mini_en.yaml',
    'THEYAMLS/General_Config/HenryChiao/MihomoAIO.yaml',
    'THEYAMLS/General_Config/HenryChiao/MihomoProMax.yaml',
    'THEYAMLS/General_Config/AIsouler/mihomoconfig.yaml',
    'THEYAMLS/General_Config/JohnsonRan/AIB.yaml',
    'THEYAMLS/General_Config/ameyukisora/mihomo.yaml',
    'THEYAMLS/General_Config/Kerronex/config.yaml',
    'THEYAMLS/General_Config/iKeLee/Clash_Sample.yaml',
    'THEYAMLS/Official_Examples/Metacubex/rule-set_config.yaml',
    'THEYAMLS/General_Config/Accademia/BlackList-02-Min.AntiAD.yaml',
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--templates', required=True, type=Path)
    parser.add_argument('--inputs', required=True, type=Path,
                        help='F50_TEMPLATE_CORE_INPUTS exported by real_templates.test.js')
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    revision = subprocess.check_output(
        ['git', '-C', str(args.templates), 'rev-parse', 'HEAD'], text=True).strip()
    with ZipFile(repo / 'tproxy-yq.zip') as package:
        component = {name: package.read(name) for name in [
            'Scripts/Clash.ConfigCommit', 'Tools/components.json', 'Tools/gist-sync-component.json']}
    manifest = {
        'upstreamCommit': revision,
        'pluginSha256': hashlib.sha256((repo / '猫猫TProxy.js').read_bytes()).hexdigest(),
        'samples': [],
    }
    with ZipFile(args.output, 'w', ZIP_DEFLATED) as bundle:
        for index, name in enumerate(SAMPLES, 1):
            sample = f'{index:02d}'
            raw = (args.templates / name).read_bytes()
            bundle.writestr(f'cases/{sample}/raw/input.yaml', raw)
            manifest['samples'].append({
                'id': sample, 'path': name, 'sha256': hashlib.sha256(raw).hexdigest()})
            source = args.inputs / name.removesuffix('.yaml')
            for phase, folder in [('upstream', source), ('processed', source / 'processed')]:
                bundle.writestr(f'cases/{sample}/{phase}/input.yaml',
                                (folder / 'config.yaml').read_bytes())
                for file in (folder / 'fixtures').glob('*'):
                    bundle.writestr(f'cases/{sample}/{phase}/fixtures/{file.name}', file.read_bytes())
            if index == 1:
                for name in ['Country.mmdb', 'ASN.mmdb']:
                    bundle.writestr('resources/' + name, (source / name).read_bytes())
        for name, data in component.items():
            bundle.writestr('component/' + name, data)
        bundle.writestr('manifest.json', json.dumps(manifest, indent=2) + '\n')
        bundle.writestr('run.sh', Path(__file__).with_name('real_templates_device.sh').read_bytes())
    print(f'{len(SAMPLES)} upstream YAMLs packaged: {args.output}')


if __name__ == '__main__':
    main()
