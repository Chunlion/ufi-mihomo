await page.goto('http://192.168.0.1:2333/',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>typeof runShellWithRoot==='function');
return await page.evaluate(async()=>{
 const command=`set -e
echo ARCH=$(uname -m)
echo ANDROID=$(getprop ro.build.version.release)
echo SDK=$(getprop ro.build.version.sdk)
echo CONTROLLER=$(cat /data/clash/Tools/f50-controller.version 2>/dev/null || true)
if [ -f /data/clash/Policy/options.conf ]; then sed -n '/^traffic_mode=/p;/^tun_stack=/p;/^ipv6=/p' /data/clash/Policy/options.conf; fi
for p in /proc/[0-9]*/exe; do exe=$(readlink "$p" 2>/dev/null || true); case "$exe" in /data/clash/Proxy/Clash.Core) echo CORE_PID=$(basename "$(dirname "$p")");; esac; done
for rel in Proxy/config.yaml Proxy/config.yaml.bak Tools/config_source.conf; do
 if [ -f "/data/clash/$rel" ]; then printf 'FILE_%s_SHA256=' "$rel"; sha256sum "/data/clash/$rel" | awk '{print $1}'; fi
done
for rel in Tools/gist-sync/activation Proxy/config.yaml.kano_tx; do [ ! -e "/data/clash/$rel" ] || echo PENDING_TRANSACTION=1; done
df -Pk /data | tail -n 1 | awk '{print "DATA_AVAILABLE_KB=" $4}'
if [ -x /data/clash/Tools/age ]; then /data/clash/Tools/age --version; else echo AGE_MISSING=1; fi
if [ -x /data/clash/Tools/kano-gist-sync ]; then /data/clash/Tools/kano-gist-sync version; else echo GIST_SYNC_MISSING=1; fi
echo DEVICE_INSPECT_DONE=1`;
 const r=await runShellWithRoot(command,15000);
 if(!r?.success || !String(r?.content||'').includes('DEVICE_INSPECT_DONE=1'))throw Error('Device inventory incomplete');
 return {success:r?.success,output:String(r?.content||'').slice(0,6000),host:document.title,userAgent:navigator.userAgent};
});
