const fs=await import('node:fs/promises'),crypto=await import('node:crypto');
const root='C:/Users/Cuty/Desktop/Github/Tproxy-F50/';
if(!(await page.locator('#PluginModal').isVisible()))await page.getByRole('button',{name:'插件功能',exact:true}).click();
await page.waitForFunction(()=>document.getElementById('custom_head')?.value.includes('F50_COMPAT_VERSION'));
const expected=JSON.parse(await fs.readFile(root+'build/gist-sync/device-plugin-proof.json','utf8'));
const replacement=await fs.readFile(root+'猫猫TProxy.js','utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const original=await page.locator('#custom_head').inputValue();
const matches=[...original.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/g)].filter(m=>m[0].includes('F50_COMPAT_VERSION')&&m[0].includes('F50_PORTS'));
assert.equal(matches.length,1);
const match=matches[0],prefix=original.slice(0,match.index),suffix=original.slice(match.index+match[0].length);
assert.equal(sha(prefix+suffix),expected.otherPluginsSHA256);
const body=replacement.match(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/)[1];
const updated=prefix+'<script>'+body+'</script>'+suffix;
const otherEntries=text=>[...text.matchAll(/<!-- \[KANO_PLUGIN_START\] ([^\r\n]+?) -->([\s\S]*?)<!-- \[KANO_PLUGIN_END\] \1 -->/g)]
 .filter(m=>m[1]!=='Maomao-TProxy-GistSync-1.0.0-rc2.js').map(m=>[m[1],sha(m[2].replace(/\r\n/g,'\n').trim())]);
const originalOthers=otherEntries(original);assert.equal(originalOthers.length,6);
const backup=await page.evaluate(async()=>{
 const r=await runShellWithRoot('backup=$(cat /data/local/tmp/maomao-rc4-backup.path); [ -s "$backup/plugin-setting-files.txt" ] && [ -d "$backup/host-settings" ] && echo HOST_BACKUP_READY=1',5000);
 return r?.success&&String(r.content).includes('HOST_BACKUP_READY=1');
});
assert.equal(backup,true);
assert.deepEqual(otherEntries(updated),originalOthers);
assert.ok(updated.includes('GistSync 1.0.0-rc4;'));
// Use the same host API as savePluginSetting. The host's large CodeMirror
// editor stalls this Chromium renderer; no editor DOM state is bypassed.
if(updated!==original)await page.evaluate(async value=>{
 const response=await setCustomHead(value);
 if(response?.error)throw Error('Host plugin save rejected');
 return {result:response?.result};
},updated);
const previous=page;const fresh=await context.newPage();await usePage(fresh);
await page.goto('http://192.168.0.1:2333/',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>[...document.scripts].some(s=>s.textContent.includes('GistSync 1.0.0-rc4;')));
await page.getByRole('button',{name:'插件功能',exact:true}).click();
await page.waitForFunction(()=>document.getElementById('custom_head')?.value.includes('GistSync 1.0.0-rc4;'));
const stored=await page.locator('#custom_head').inputValue();
assert.equal(stored,updated);
assert.deepEqual(otherEntries(stored),originalOthers);
await previous.close({runBeforeUnload:false});
const result={updated:true,sourceSHA256:sha(replacement),otherPluginsSHA256:sha(prefix+suffix),otherPluginsPreserved:true,hostReloaded:true};
await fs.writeFile(root+'reports/gist-sync/device-plugin-update.json',JSON.stringify(result,null,2)+'\n');
return result;
