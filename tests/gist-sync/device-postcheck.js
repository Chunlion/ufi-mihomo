const fs=await import('node:fs/promises');
const root='C:/Users/Cuty/Desktop/Github/Tproxy-F50/';
const manifest=JSON.parse(await fs.readFile(root+'build/gist-sync/clash/Tools/gist-sync-component.json','utf8'));
const checks=Object.entries(manifest.files).map(([p,hash])=>`[ "$(sha256sum '/data/clash/${p}' | awk '{print $1}')" = '${hash}' ] || exit 1`).join('\n');
const result=await page.evaluate(async checks=>{
 const script=`set -e
umask 077
backup=$(cat /data/local/tmp/maomao-rc4-backup.path)
case "$backup" in /data/local/tmp/maomao-rc4-backup-*) ;; *) exit 1;; esac
(cd /data/clash && sha256sum -c "$backup/critical.sha256")
${checks}
/data/clash/Tools/age --version
/data/clash/Tools/kano-gist-sync version
/data/clash/Tools/kano-gist-sync start-daemon
[ ! -e /data/clash.install.lock.d ] && [ ! -e /dev/kano_tproxy_operation.lock ] || exit 1
count=0
for p in /proc/[0-9]*/exe; do
 exe=$(readlink "$p" 2>/dev/null || true)
 [ "$exe" != /data/clash/Proxy/Clash.Core ] || { count=$((count+1)); echo CORE_PID=$(basename "$(dirname "$p")"); }
done
[ "$count" = 1 ] || exit 1
temp=$(mktemp -d /data/local/tmp/maomao-api-check.XXXXXX)
trap 'rm -f "$temp/header" "$temp/version.json"; rmdir "$temp"' EXIT
secret=$(/data/clash/Tools/yq_linux_arm64 e -r '.secret' /data/clash/Proxy/config.yaml)
printf 'Authorization: Bearer %s\n' "$secret" > "$temp/header"
unset secret
code=$(curl --noproxy '*' -sS --max-time 8 -H "@$temp/header" -o "$temp/version.json" -w '%{http_code}' http://127.0.0.1:7788/version)
[ "$code" = 200 ] || { echo API_HTTP=$code; exit 1; }
echo API_HTTP=$code
printf 'MIHOMO_VERSION='; /data/clash/Tools/yq_linux_arm64 e -r '.version' "$temp/version.json"
grep '^traffic_mode=' /data/clash/Policy/options.conf
echo DEVICE_POSTCHECK_OK=1`;
 const r=await runShellWithRoot('(\n'+script+'\n) 2>&1\nrc=$?\nprintf "\\nPOSTCHECK_EXIT=%s\\n" "$rc"',20000);
 const output=String(r?.content||'');
 if(!r?.success||!output.includes('DEVICE_POSTCHECK_OK=1')||!output.includes('POSTCHECK_EXIT=0'))throw Error('Post-install verification failed: '+output.slice(-1500));
 return {success:true,output};
},checks);
await fs.writeFile(root+'reports/gist-sync/device-postcheck.json',JSON.stringify(result,null,2)+'\n');
return result;
