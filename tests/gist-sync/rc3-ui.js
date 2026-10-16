const fs=require('fs'),vm=require('vm'),assert=require('assert'),cp=require('child_process'),os=require('os'),path=require('path');
const ctx={crypto:require('crypto').webcrypto,TextEncoder,Uint8Array,DataView,BigInt,CryptoJS:require('./vendor/crypto-js.js'),shellQuote:v=>"'"+String(v).replace(/'/g,"'\\''")+"'"};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('gist-sync/plugin-gist.js','utf8')+'\nthis.api={parse:f50GistParse,exec:f50GistExec,dispatch:f50GistDispatch};',ctx);
const checks=[];function check(name,fn){fn();checks.push({name,result:'PASS'});}
const tag='0123456789abcdef',frame=(value,rc=0)=>({success:true,content:`\nF50_GIST_BEGIN_${tag}\n${typeof value==='string'?value:JSON.stringify(value)}\nF50_GIST_END_${tag}=${rc}\n`});
const parse=(r,cmd='version')=>ctx.api.parse(r,tag,cmd);
check('compatible component versions use the same protocol',()=>{
 for(const version of ['1.0.0-rc4','1.1.0'])assert.equal(parse(frame({ok:true,version,protocol:1})).ok,true);
 assert.equal(parse(frame({ok:true,version:'1.1.0',protocol:2})).code,'component_version_mismatch');
});
for(const [name,input,expected] of [
 ['missing helper',frame({ok:false,code:'components_missing'},127),'components_missing'],
 ['permission denied',frame({ok:false,code:'component_not_executable'},126),'component_not_executable'],
 ['nonzero exit overrides success',frame({ok:true,version:'1.0.0-rc4',protocol:1},1),'device_execution_failed'],
 ['timeout exit',frame({ok:true},124),'operation_timeout'],
 ['wrong version',frame({ok:true,version:'1.0.0-rc1'}),'component_version_mismatch'],
 ['empty host output',{success:true,content:''},'device_state_unknown'],
 ['unframed shell error',{success:true,content:'/system/bin/sh: missing'},'response_format_invalid'],
 ['aborted host request',{success:false,content:'signal is aborted'},'operation_timeout'],
 ['malformed JSON',frame('{'),'response_format_invalid'],
 ['JSON array',frame([]),'response_format_invalid'],
 ['missing success field',frame({version:'1.0.0-rc4',protocol:1}),'response_format_invalid'],
 ['malformed completion marker',{success:true,content:frame({ok:true}).content.replace('=0','=0truncated')},'response_format_invalid'],
 ['echoed command text',{success:true,content:"printf '\\nF50_GIST_BEGIN_"+tag+"\\n'"},'response_format_invalid'],
])check(name,()=>assert.equal(parse(input).code,expected));
check('nested host content is accepted only with valid framed response',()=>assert.equal(parse({success:true,content:'command echo',data:frame({ok:true,version:'1.0.0-rc4',protocol:1})}).ok,true));
check('job receipt schema is checked',()=>assert.equal(parse(frame({id:'a'.repeat(32),status:'finished',result:{ok:true}}),'job').ok,true));
check('unknown job cannot become success',()=>assert.equal(parse(frame({status:'finished'}),'job').code,'response_format_invalid'));
check('status missing settings is rejected',()=>assert.equal(parse(frame({ok:true,version:'1.0.0-rc4',protocol:1}),'status').code,'response_format_invalid'));
const ui=fs.readFileSync('gist-sync/ui-gist.js','utf8');
check('Apply is the single main save-and-sync action',()=>{assert(ui.includes('id="mm_gist_apply"'));assert(!ui.includes('id="mm_gist_save"'));assert(!ui.includes('id="mm_gist_sync"'));assert(ui.includes("formAction('apply')"));});
check('Gist page has no standalone install or age download actions',()=>{assert(!/mm_gist_(install|age)["']/.test(ui));assert(!ui.includes('upload_img'));assert(!ui.includes('install-age'));assert(ui.includes('mm_gist_recover'));assert(ui.includes('mm_gist_delete'));});
check('all four interval options have explicit contrasting styles',()=>{const values=[...ui.matchAll(/<option[^>]+value="(\d+)"/g)].map(m=>Number(m[1]));assert.deepEqual(values,[1,6,12,24]);assert.equal((ui.match(/background:#111827!important;color:#fff!important/g)||[]).length,5);assert(ui.includes('height:30px'));assert(!ui.includes('min-height:42px')); assert(ui.includes('color-scheme:dark!important'));assert(!ui.includes('color-scheme:light'));});
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gist-rc3-protocol-'));
 try {
  ctx.hostRunShellWithRoot=async script=>{const r=cp.spawnSync('sh',['-s'],{input:script.replaceAll('/data/clash',dir),encoding:'utf8'});return {success:true,content:r.stdout};};
  assert.equal((await ctx.api.exec(['status'])).code,'components_missing');checks.push({name:'actual Shell missing helper emits explicit error',result:'PASS'});
  fs.mkdirSync(path.join(dir,'Tools'));fs.mkdirSync(path.join(dir,'Scripts'));
  fs.writeFileSync(path.join(dir,'Tools/kano-gist-sync'),'#!/bin/sh\nprintf \'%s\\n\' \'{"ok":true,"version":"1.0.0-rc1"}\'\n',{mode:0o755});
  assert.equal((await ctx.api.exec(['status'])).code,'component_version_mismatch');checks.push({name:'actual Shell rejects old binary protocol',result:'PASS'});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 const source=fs.readFileSync('猫猫TProxy.js','utf8');
 const install=source.slice(source.indexOf('async function installF50PackageAtDevicePath('),source.indexOf('async function installF50PackageFromNetwork('));
 for(const scenario of ['status_unknown','scheduler_unknown','ready']){
  let calls=0,finished=null,color='';
  const sandbox={lastInstallDiagnostic:null,buildF50InspectScript:()=>'',buildF50InstallScript:()=>'',
   operationStage(){},invalidateStatusSnapshot(){},invalidateBinarySnapshot(){},
   runShellWithRoot:async()=>({success:true,deviceCompleted:true,deviceExitCode:0,content:++calls===1?'F50_INSPECT_OK=1':'F50_INSTALL_COMPONENTS_OK=1\nF50_INSTALL_TRANSACTION_STATE=complete\nKANO_INSTALL_OK=1\nF50_INSTALL_STATUS=installed_stopped'}),
   f50GistExec:async args=>({ok:args[0]==='version'?scenario!=='status_unknown':scenario!=='scheduler_unknown',version:'1.0.0-rc4',code:'device_state_unknown'}),
   f50GistMessage:String,f50Diagnostic:()=>({}),safeTextToHtml:String,
   operationFinish:ok=>{finished=ok;},createToast:(message,kind)=>{color=kind;}};
  vm.createContext(sandbox);vm.runInContext(install+'\nthis.install=installF50PackageAtDevicePath;',sandbox);
  const result=await sandbox.install('/fixture.zip');
  assert.equal(result,true);assert.equal(finished,true);assert.equal(sandbox.lastInstallDiagnostic.ok,true);
  assert.equal(sandbox.lastInstallDiagnostic.gistReady,scenario==='ready');
  if(scenario!=='ready')assert.notEqual(color,'green');
  checks.push({name:'post-install '+scenario+' never reports unconfirmed Gist success',result:'PASS'});
 }
 fs.writeFileSync('build/gist-sync/rc3-ui-results.json',JSON.stringify(checks,null,2)+'\n');console.log('PASS',checks.length,'RC3 protocol/UI checks');
})().catch(e=>{console.error(e);process.exit(1);});
