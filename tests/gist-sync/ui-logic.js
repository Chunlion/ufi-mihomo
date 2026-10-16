const fs=require('fs'),vm=require('vm'),assert=require('assert');
let state={ok:true,settings:{revision:4,generation:'g1',url:'https://gist.githubusercontent.com/u/abcde/raw/one.age',auto:false,intervalHours:6},identitySet:true,ageReady:true,jobs:[]};
const elements=new Map();function elem(){return {value:'',checked:false,disabled:false,placeholder:'',textContent:'',isConnected:true,classList:{add(){}}};}
const root=elem();root.querySelector=selector=>{if(!elements.has(selector))elements.set(selector,elem());return elements.get(selector);};
const q=id=>root.querySelector('#mm_gist_'+id),requests=[];
let action='',confirm=false,closed=false;
const ctx={document:{body:{},createElement:elem},window:{confirm:()=>confirm},MutationObserver:class{observe(){} disconnect(){}},Date,Promise,Number,setTimeout,URL,TextEncoder,
 ensureAdvanced:async()=>true,createFixedToast:()=>({el:root,close:()=>{closed=true;root.isConnected=false;}}),
 f50GistMessage:c=>String(c||'unknown'),f50InstallGistComponents:async()=>true,
 f50GistExec:async args=>{
  if(args[0]==='status')return JSON.parse(JSON.stringify(state));
  if(args[0]==='job')return {status:'finished',result:{ok:true,code:action==='sync'?'synced':action==='test'?'test_passed':'up_to_date',settingsSaved:action==='save',downloaded:true,decrypted:true,validated:true}};
  return {ok:true};
 },f50GistDispatch:async (a,r)=>{action=a;requests.push([a,JSON.parse(JSON.stringify(r))]);if(a==='save'){state.settings.revision++;state.settings.url=r.url;state.settings.auto=r.auto;state.settings.intervalHours=r.intervalHours;}return {ok:true,job:'0123456789abcdef0123456789abcdef'};}
};
vm.createContext(ctx);const glue=fs.readFileSync('gist-sync/plugin-gist.js','utf8');vm.runInContext(glue.slice(glue.indexOf('  const f50GistCleanUrl'))+'\nthis.f50GistCleanUrl=f50GistCleanUrl;this.f50GistValidUrl=f50GistValidUrl;',ctx);vm.runInContext(fs.readFileSync('gist-sync/ui-gist.js','utf8')+'\nthis.button=gistSyncBtn;',ctx);
const checks=[];const check=(n,f)=>{f();checks.push({name:n,passed:true});};
(async()=>{
 await ctx.button.onclick();
 check('Saved URL visible and secret never echoed',()=>{assert.equal(q('url').value,state.settings.url);assert.equal(q('key').value,'');});
 for(const url of ['', 'https://gist.github.com/u/abcde', 'https://gist.githubusercontent.com:443/u/abcde/raw/two.age', 'https://gist.githubusercontent.com/u/abcde/raw/../raw/two.age']){
  q('url').value=url;await q('test').onclick();
  check('Invalid form link rejected before device dispatch: '+url,()=>assert.equal(requests.length,0));
 }
 const url='https://gist.githubusercontent.com/u/abcde/raw/two.age';q('url').value='\u200b '+url+' \ufeff';q('key').value='not-a-real-secret';q('key').oninput();
 await q('test').onclick();
 check('Test uses edited URL, pending key and captured revision',()=>{assert.deepEqual(requests[0],['test',{url,identity:'not-a-real-secret',auto:false,intervalHours:6,revision:4}]);});
 check('Test leaves saved source unchanged and clears password field',()=>{assert(state.settings.url.endsWith('one.age'));assert.equal(q('key').value,'');});
 check('Pasted invisible edge characters are removed',()=>assert.equal(q('url').value,url));
 await q('refresh').onclick();
 check('Status refresh does not overwrite unsaved URL',()=>assert.equal(q('url').value,url));
 await q('save').onclick();
 check('Save retains pending key after Test without applying config',()=>{assert.equal(requests[1][0],'save');assert.equal(requests[1][1].identity,'not-a-real-secret');assert.equal(requests.length,2);});
 q('url').value='https://gist.githubusercontent.com/u/abcde/raw/EDITED.age';
 await q('save').onclick();
 check('Save uses the edited URL without synchronizing',()=>{assert.equal(requests[2][0],'save');assert.equal(requests[2][1].url,q('url').value);assert.equal(requests[2][1].replaceLocal,undefined);});
 q('url').value='https://gist.githubusercontent.com/u/abcde/raw/'+'a'.repeat(40)+'/x.age';
 check('Pinned revision remains accepted',()=>assert(ctx.f50GistValidUrl(q('url').value)));
 check('Status and action results remain concise',()=>{assert(!q('status').textContent.includes('SHA-256'));assert(!q('status').textContent.includes('控制面'));assert(!q('result').textContent.includes('未执行 / 未确认'));});
 for(const interval of [1,6,12,24]){
  q('interval').value=String(interval);await q('save').onclick();
  check('Interval '+interval+' saves and restores',()=>assert.equal(q('interval').value,String(interval)));
  q('interval').value='6';confirm=true;await q('refresh').onclick();
  check('Reopening saved interval '+interval+' restores device setting',()=>assert.equal(q('interval').value,String(interval)));
 }
 await q('sync').onclick();
 check('Sync uses saved settings without transmitting the pending key',()=>{assert.equal(requests.at(-1)[0],'sync');assert.equal(requests.at(-1)[1].identity,undefined);assert.equal(requests.at(-1)[1].url,undefined);});
 check('Raw download query is normalized',()=>assert(ctx.f50GistValidUrl(url+'?raw=1')));
 const beforeClose=requests.length;
 q('close').onclick();
 check('Close clears secret and does not cancel native task',()=>{assert(closed);assert.equal(requests.length,beforeClose);assert.equal(q('key').value,'');});
 fs.writeFileSync('build/gist-sync/ui-test-results.json',JSON.stringify(checks,null,2)+'\n');console.log('PASS',checks.length,'mock-DOM UI behavior checks');
})().catch(e=>{console.error(e);process.exit(1);});
