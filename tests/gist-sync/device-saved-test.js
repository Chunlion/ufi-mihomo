const fs=await import('node:fs/promises');
const root='C:/Users/Cuty/Desktop/Github/Tproxy-F50/';
const glue=await fs.readFile(root+'gist-sync/plugin-gist.js','utf8');
const result=await page.evaluate(async glue=>{
 const api=new Function('hostRunShellWithRoot','shellQuote','CryptoJS',glue+'\nreturn {exec:f50GistExec,dispatch:f50GistDispatch};')(runShellWithRoot,v=>"'"+String(v).replace(/'/g,"'\\''")+"'",CryptoJS);
 const before=await api.exec(['status']);
 if(!before.ok||!before.settings?.url||!before.identitySet||before.fingerprintError)throw Error('Saved device settings unavailable');
 const started=await api.dispatch('test',{url:before.settings.url,revision:before.settings.revision});
 if(!started.ok||!started.job)throw Error('Read-only validation could not start: '+started.code);
 let job;const end=Date.now()+135000;
 while(Date.now()<end){job=await api.exec(['job',started.job]);if(job.status==='finished')break;if(!job.ok||job.status==='completion_unknown')throw Error('Read-only validation result unconfirmed');await new Promise(r=>setTimeout(r,500));}
 if(job?.status!=='finished')throw Error('Read-only validation timeout');
 const after=await api.exec(['status']);
 if(!after.ok||after.fingerprintError)throw Error('Final state unconfirmed');
 if(JSON.stringify(after.currentFingerprint)!==JSON.stringify(before.currentFingerprint)||JSON.stringify(after.settings)!==JSON.stringify(before.settings))throw Error('Device settings/configuration changed during validation');
 return {outcome:job.result,before:before.currentFingerprint,after:after.currentFingerprint,settingsUnchanged:true};
},glue);
assert.equal(result.outcome.ok,true);assert.equal(result.outcome.code,'test_passed');
assert.equal(result.outcome.downloaded,true);assert.equal(result.outcome.decrypted,true);assert.equal(result.outcome.validated,true);assert.equal(result.outcome.written,false);
await fs.writeFile(root+'reports/gist-sync/device-saved-test.json',JSON.stringify({category:'DEVICE/LIVE',result:'PASS',coverage:'real saved Gist and device-held identity; actual age decryption, YAML and Mihomo validation; no settings or production configuration write',...result},null,2)+'\n');
return result;
