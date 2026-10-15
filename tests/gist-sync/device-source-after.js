const fs=await import('node:fs/promises');
const root='C:/Users/Cuty/Desktop/Github/Tproxy-F50/';
const before=JSON.parse(await fs.readFile(root+'build/gist-sync/device-source-before.json','utf8'));
const lines=before.hashes.split('\n').filter(line=>/^[a-f0-9]{64}  \/data\/clash\//.test(line));
assert.equal(lines.length,5);
const quote=v=>"'"+String(v).replace(/'/g,"'\\''")+"'";
const proof=await page.evaluate(async({manifest,before})=>{
 const hashes=await runShellWithRoot(`set -e\nprintf '%s\\n' ${manifest} | sha256sum -c\necho SOURCES_PRESERVED=1`,12000);
 if(!hashes.success||!hashes.content?.includes('SOURCES_PRESERVED=1'))throw Error('Production configuration or saved source settings changed');
 const r=await runShellWithRoot('/data/clash/Tools/kano-gist-sync status',15000);
 let st;try{st=JSON.parse(String(r.content).trim());}catch{throw Error('Device status format invalid');}
 if(!r.success||!st.ok||st.manualSources!==1||!st.identitySet||st.settings.auto!==before.auto||st.settings.intervalHours!==before.intervalHours)throw Error('Source merge capability or preserved settings unavailable');
 return {category:'DEVICE',result:'PASS',sourceSettingsPreserved:true,productionConfigPreserved:true,manualSources:st.manualSources,gistActive:st.gistActive,
  configured:!!st.settings.generation,identitySet:st.identitySet,auto:st.settings.auto,intervalHours:st.settings.intervalHours,checks:hashes.content};
},{manifest:quote(lines.join('\n')),before});
await fs.writeFile(root+'reports/gist-sync/device-source-upgrade.json',JSON.stringify(proof,null,2)+'\n');
return proof;
