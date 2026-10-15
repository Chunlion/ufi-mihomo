const fs=await import('node:fs/promises');
const root='C:/Users/Cuty/Desktop/Github/Tproxy-F50/';
await page.waitForFunction(()=>typeof runShellWithRoot==='function');
const proof=await page.evaluate(async()=>{
 const r=await runShellWithRoot('/data/clash/Tools/kano-gist-sync status',15000);
 if(!r.success)throw Error('Device Gist status unavailable');
 let st;try{st=JSON.parse(String(r.content).trim());}catch{throw Error('Device status format invalid');}
 if(!st.ok)throw Error('Device status rejected');
 const hashes=await runShellWithRoot(`set -e
for path in Proxy/config.yaml Tools/config_source.conf Policy/options.conf Proxy/subscription_urls.txt Tools/gist-sync/settings.conf; do
 if [ -f "/data/clash/$path" ]; then sha256sum "/data/clash/$path"; else printf 'absent  /data/clash/%s\\n' "$path"; fi
done
echo SOURCE_INVENTORY_OK=1`,10000);
 if(!hashes.success||!hashes.content?.includes('SOURCE_INVENTORY_OK=1'))throw Error('Device source hashes unavailable');
 return {configured:!!st.settings?.generation,identitySet:st.identitySet,auto:st.settings.auto,intervalHours:st.settings.intervalHours,
  gistActive:st.gistActive??null,lastSuccess:st.state?.lastSuccess,hashes:hashes.content};
});
await fs.writeFile(root+'build/gist-sync/device-source-before.json',JSON.stringify(proof,null,2)+'\n');
return proof;
