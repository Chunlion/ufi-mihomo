"""Package the current GistSync plugin and complete components."""
from pathlib import Path
import hashlib,json,zipfile

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist/gist-sync'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    build=json.loads((ROOT/'build/gist-sync/build.json').read_text(encoding='utf-8'))
    source=ROOT/'猫猫TProxy.js';package=ROOT/'tproxy-yq.zip'
    assert build['plugin_sha256']==sha(source),'Plugin changed: rebuild first'
    assert build['package_sha256']==sha(package),'Components changed: rebuild first'
    DIST.mkdir(parents=True,exist_ok=True)
    (DIST/'升级说明.txt').write_text('先导入猫猫TProxy.js，再在组件管理中在线安装/更新，或导入完整 ZIP。升级保留配置、Gist 设置和私钥。在线更新优先仓库 main，失败后回退镜像。\n',encoding='utf-8')
    files={source.name:source,'tproxy-yq-gistsync-full.zip':package,'LICENSE':ROOT/'LICENSE','升级说明.txt':DIST/'升级说明.txt'}
    sums=''.join(sha(p)+'  '+name+'\n' for name,p in files.items())
    (DIST/'SHA256SUMS').write_text(sums,encoding='utf-8',newline='\n')
    output=DIST/('Maomao-TProxy-GistSync-'+build['version']+'-user.zip')
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for name,p in files.items():z.write(p,name)
        z.write(DIST/'SHA256SUMS','SHA256SUMS')
    with zipfile.ZipFile(output) as z:
        for name,p in files.items():assert z.read(name)==p.read_bytes(),name
        assert z.read('SHA256SUMS').decode('utf-8')==sums
    print(output.name+' '+sha(output))

if __name__=='__main__':main()
