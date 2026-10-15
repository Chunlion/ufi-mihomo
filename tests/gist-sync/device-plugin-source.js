await page.waitForFunction(()=>document.getElementById('custom_head')?.value.includes('F50_COMPAT_VERSION'));
const fs=await import('node:fs/promises'),crypto=await import('node:crypto');
const root='C:/Users/Cuty/Desktop/Github/Tproxy-F50/';
const info=await page.evaluate(()=>{
 const field=document.getElementById('custom_head');
 const chunks=[...field.value.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/g)].filter(m=>m[0].includes('F50_COMPAT_VERSION')&&m[0].includes('F50_PORTS'));
 if(chunks.length!==1)throw Error('Cannot identify exactly one Maomao plugin');
 const m=chunks[0];return {source:m[0].replace(/^<script\b[^>]*>/,'').replace(/<\/script\s*>$/,''),prefix:field.value.slice(0,m.index),suffix:field.value.slice(m.index+m[0].length)};
});
const normalized=s=>s.replace(/\r\n/g,'\n').trim();
const baseline=(await fs.readFile(root+'.cache/gist-sync/baseline-plugin.js','utf8')).match(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/)[1];
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const result={matchesRepositoryBaseline:normalized(info.source)===normalized(baseline),sourceSHA256:sha(normalized(info.source)),otherPluginsSHA256:sha(info.prefix+info.suffix),sourceBytes:info.source.length};
const compact=await import('file:///C:/Users/Cuty/Desktop/Github/Tproxy-F50/scripts/compact_plugin.js');
result.sameCode=compact.semantics(compact.parse(info.source))===compact.semantics(compact.parse(baseline));
result.topLevelStatements=compact.parse(info.source).body.length;result.baselineStatements=compact.parse(baseline).body.length;result.baselineBytes=baseline.length;result.prefixBytes=info.prefix.length;result.suffixBytes=info.suffix.length;result.versions=[...info.source.matchAll(/猫猫TProxy v[0-9.]+/g)].map(m=>m[0]);
await fs.writeFile(root+'build/gist-sync/device-plugin-proof.json',JSON.stringify(result));
return result;
