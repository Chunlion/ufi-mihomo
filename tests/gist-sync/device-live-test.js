const fs=await import('node:fs/promises');
const root='C:/Users/Cuty/Desktop/Github/Tproxy-F50/';
const input=JSON.parse(await fs.readFile(root+'.cache/gist-sync/device-live-input.json','utf8'));
const keyPath=root+'.cache/gist-sync/device-test-identity.txt';
let identity=(await fs.readFile(keyPath,'utf8')).split(/\r?\n/).find(s=>s.startsWith('AGE-SECRET-KEY-1'));
const glue=await fs.readFile(root+'gist-sync/plugin-gist.js','utf8');
if(page.url()!=='http://192.168.0.1:2333/')await page.goto('http://192.168.0.1:2333/',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>typeof runShellWithRoot==='function');
await page.waitForFunction(async()=>{
 const r=await runShellWithRoot('[ ! -e /dev/kano_tproxy_operation.lock ] && echo DEVICE_IDLE=1',5000);
 return r?.success&&String(r.content).includes('DEVICE_IDLE=1');
},null,{timeout:20000,polling:500});
try {
 const result=await page.evaluate(async({glue,input,identity})=>{
  const api=new Function('hostRunShellWithRoot','shellQuote','CryptoJS',glue+'\nreturn {exec:f50GistExec,dispatch:f50GistDispatch};')(runShellWithRoot,v=>"'"+String(v).replace(/'/g,"'\\''")+"'",CryptoJS);
  const before=await api.exec(['status']);if(!before.ok)throw Error('Device status unavailable: '+before.code);
  if(before.fingerprintError||!['config','policy','source'].every(k=>before.currentFingerprint?.[k]))throw Error('Initial fingerprint unconfirmed: '+before.fingerprintError);
  const started=await api.dispatch('apply',{url:input.url,identity,auto:false,intervalHours:6});identity='';
  if(!started.ok||!started.job)throw Error('Device dispatch failed: '+started.code);
  const deadline=Date.now()+135000;let job;
  while(Date.now()<deadline){job=await api.exec(['job',started.job]);if(job.status==='finished')break;if(!job.ok||job.status==='completion_unknown')throw Error('Device job unconfirmed');await new Promise(r=>setTimeout(r,500));}
  if(job?.status!=='finished')throw Error('Device job timeout');
  const after=await api.exec(['status']);if(!after.ok)throw Error('Final device status unavailable');
  if(after.fingerprintError||!['config','policy','source'].every(k=>after.currentFingerprint?.[k]))throw Error('Final fingerprint unconfirmed: '+after.fingerprintError);
  return {id:started.job,outcome:job.result,before:before.currentFingerprint,after:after.currentFingerprint};
 },{glue,input,identity});
 assert.equal(result.outcome.ok,false);assert.equal(result.outcome.code,'age_decrypt_failed');
 assert.equal(result.outcome.downloaded,true);assert.equal(result.outcome.decrypted,false);assert.equal(result.outcome.written,false);
 assert.equal(result.outcome.cipherHash,input.sha256);assert.deepEqual(result.after,result.before);
 await fs.writeFile(root+'reports/gist-sync/device-live.json',JSON.stringify({category:'DEVICE/LIVE',result:'PASS',coverage:'production ARM64 Apply action, actual external Raw HTTPS download, authenticated ciphertext hash, independent wrong identity rejection, no configuration write',...result},null,2)+'\n');
 // Remove only this finished negative-test receipt; retain its recorded evidence.
 await page.evaluate(async id=>{if(!/^[a-f0-9]{32}$/.test(id))throw Error('Invalid fixture job');const r=await runShellWithRoot('rm -f /data/clash/Tools/gist-sync/jobs/'+id+'.json',5000);if(!r.success)throw Error('Test receipt cleanup failed');},result.id);
 return result;
} finally {identity='';await fs.unlink(keyPath);await fs.unlink(root+'.cache/gist-sync/device-live-input.json');}
