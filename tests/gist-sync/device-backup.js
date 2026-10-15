await page.goto('http://192.168.0.1:2333/',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>typeof runShellWithRoot==='function');
return await page.evaluate(async()=>{
 const command=`set -e
umask 077
backup=/data/local/tmp/maomao-rc4-backup-$(date -u +%Y%m%dT%H%M%SZ)
[ ! -e "$backup" ] || { echo BACKUP_EXISTS=1; exit 1; }
mkdir -m 700 "$backup"
for rel in Proxy/config.yaml Tools/config_source.conf Policy/options.conf; do
 [ -f "/data/clash/$rel" ] || { echo BACKUP_REQUIRED_FILE_MISSING=1; exit 1; }
 hash=$(sha256sum "/data/clash/$rel" | awk '{print $1}')
 printf '%s  %s\n' "$hash" "$rel" >> "$backup/critical.sha256"
done
cp -a /data/clash "$backup/clash"
if [ -f /sdcard/ufi_tools_boot.sh ]; then cp -p /sdcard/ufi_tools_boot.sh "$backup/ufi_tools_boot.sh"; fi
(cd "$backup/clash" && sha256sum -c "$backup/critical.sha256" >/dev/null)
(cd /data/clash && sha256sum -c "$backup/critical.sha256" >/dev/null)
(cd "$backup/clash" && find . -type f -exec sha256sum '{}' +) > "$backup/manifest.sha256"
(cd "$backup/clash" && sha256sum -c "$backup/manifest.sha256" >/dev/null)
for tool in iptables-save ip6tables-save; do
 if command -v "$tool" >/dev/null 2>&1; then
  if "$tool" > "$backup/$tool.txt" 2>"$backup/$tool.err"; then echo "$tool=0" >> "$backup/network-exit.txt"; else echo "$tool=$?" >> "$backup/network-exit.txt"; fi
 else echo "$tool=missing" >> "$backup/network-exit.txt"; fi
done
ip -4 rule show > "$backup/ip4-rule.txt"
ip -6 rule show > "$backup/ip6-rule.txt"
ip -4 route show table all > "$backup/ip4-route.txt"
ip -6 route show table all > "$backup/ip6-route.txt"
printf '%s\n' "$backup" > /data/local/tmp/maomao-rc4-backup.path
chmod 600 /data/local/tmp/maomao-rc4-backup.path
echo "BACKUP_PATH=$backup"
echo "BACKUP_BYTES=$(du -sk "$backup" | awk '{print $1*1024}')"
cat "$backup/network-exit.txt"
echo DEVICE_BACKUP_VERIFIED=1`;
 const result=await runShellWithRoot('(\n'+command+'\n) 2>&1\nrc=$?\nprintf "\\nBACKUP_EXIT=%s\\n" "$rc"',60000);
 const output=String(result?.content||'');
 if(!result?.success||!output.includes('DEVICE_BACKUP_VERIFIED=1')||!output.includes('BACKUP_EXIT=0'))throw Error('Device backup not verified: '+output.slice(-1000));
 return {success:true,output};
});
