'use strict';
const test=require('node:test');
const {fs,assert,vm,slice,run,subscriptionApi,plain}=require('./optimization_harness');

test('Gist refresh updates the airport links before the Gist link content',async()=>{
 const gist={settings:{revision:7}},calls=[];
 const fn=subscriptionApi(slice('const updateSubProviders = async','const readCurrentSubSources = async')+'updateSubProviders',{
  ensureCompatBackend:async()=>true,readConfigSource:async()=> 'uploaded_config',
  f50GistManaged:async()=>gist,
  f50GistUpdateSources:async(st,sources)=>{calls.push('gist');assert.equal(st,gist);
   assert.equal(sources,undefined,'the manual-source merge belongs to the Gist menu, not to this update');return true;},
  readYamlObject:async()=>({ok:true,value:{'proxy-providers':{Provider1:{type:'http',url:'https://one.example/sub'}}}}),
  readCurrentSubSources:async()=>[{url:'https://one.example/sub',name:'Provider1'}],
  convertSubscriptionsLocally:async()=>{throw Error('http providers must not be converted locally');},
  forceUpdateProvidersFromConfig:async()=>{calls.push('load');return {ok:true,failed:0,providers:[{name:'Provider1',ok:true}]};},
  writeSubConfigByMode:()=>{throw Error('template overwrite');}
 });
 assert.equal(await fn([]),true);
 assert.deepEqual(calls,['load','gist'],'airport links first, then the Gist link content, each exactly once');
});

for(const managed of [true,false]) test('inline-only config requires only a managed Gist refresh / '+managed,async()=>{
 const calls=[],config={proxies:[{name:'Inline'}],'x-f50-gist-sync':managed};
 const fn=subscriptionApi(slice('const updateSubProviders = async','const readCurrentSubSources = async')+'updateSubProviders',{
  ensureCompatBackend:async()=>true,readConfigSource:async()=> 'uploaded_config',
  readYamlObject:async()=>({ok:true,value:config}),readCurrentSubSources:async()=>[],
  forceUpdateProvidersFromConfig:async()=>{calls.push('load');return {failed:1};},
  f50GistManaged:async()=>managed?{settings:{revision:7}}:null,
  f50GistUpdateSources:async(st,sources)=>{calls.push('gist');assert.equal(sources,undefined);return true;},
 });
 assert.equal(await fn([]),managed);
 assert.deepEqual(calls,managed?['gist']:[]);
});

for(const synced of [true,false]) test('a failed local download still attempts Gist without reporting full success / '+synced,async()=>{
 const calls=[],toasts=[],finished=[];
 const fn=subscriptionApi(slice('const updateSubProviders = async','const readCurrentSubSources = async')+'updateSubProviders',{
  ensureCompatBackend:async()=>true,readConfigSource:async()=> 'uploaded_config',
  readYamlObject:async()=>({ok:true,value:{'proxy-providers':{Provider1:{type:'file',path:'./proxies/Provider1.yaml'}}}}),
  readCurrentSubSources:async()=>[{name:'Provider1',url:'https://fixture.example/sub'}],
  convertSubscriptionsLocally:async()=>{calls.push('download');return {ok:false,failed:1,providers:[{ok:false,message:'download failed'}]};},
  forceUpdateProvidersFromConfig:async()=>{throw Error('failed downloads must not reload old provider files');},
  f50GistManaged:async()=>({settings:{revision:7}}),
  f50GistUpdateSources:async(st,sources)=>{calls.push('gist');assert.equal(sources,undefined);return synced;},
  createToast:(message,color)=>toasts.push([message,color]),operationFinish:(...args)=>finished.push(args),
 });
 assert.equal(await fn([]),false);
 assert.deepEqual(calls,['download','gist']);
 if(synced){assert.match(toasts.at(-1)[0],/Gist.*节点来源更新失败/);assert.equal(finished.at(-1)[0],false);}
});

test('Gist detection failure cannot turn a provider-only success into full success',async()=>{
 const calls=[],toasts=[];
 const fn=subscriptionApi(slice('const updateSubProviders = async','const readCurrentSubSources = async')+'updateSubProviders',{
  ensureCompatBackend:async()=>true,readConfigSource:async()=> 'uploaded_config',
  readYamlObject:async()=>({ok:true,value:{'x-f50-gist-sync':true,'proxy-providers':{Remote:{type:'http'}}}}),
  readCurrentSubSources:async()=>[],
  forceUpdateProvidersFromConfig:async()=>{calls.push('load');return {failed:0};},
  f50GistManaged:async()=>{calls.push('gist-status');throw Error('components_missing');},
  f50GistUpdateSources:async()=>{throw Error('unavailable Gist must not sync');},
  createToast:(message,color)=>toasts.push([message,color]),
 });
 assert.equal(await fn([]),false);
 assert.deepEqual(calls,['load','gist-status']);
 assert.deepEqual(toasts.at(-1),['components_missing','red']);
});

test('Gist source saves, disabled-only and empty removal all use native merge',async()=>{
 for(const input of [[],[{url:'https://example.test/sub',enabled:false}],[{url:'https://example.test/sub',enabled:true}]]) {
  let merged;const gist={settings:{revision:7}};
  const fn=subscriptionApi(slice('function validateSubscriptionMode','function buildF50CleanupScript')+slice('const saveSubSources = async','const overwriteConfigByTemplate')+'saveSubSources',{
   validateLocalSubscriptionUrl:()=>({ok:true}),
   readConfigSource:async()=> 'uploaded_config',f50GistManaged:async()=>gist,
   f50GistUpdateSources:async(st,sources)=>{assert.equal(st,gist);merged=plain(sources);return true;},
   persistSubSourceState:()=>{throw Error('source policy changed outside native lease');},
   writeSubConfigByMode:()=>{throw Error('Gist replaced by template');}
  });
  assert.equal(await fn(input),true);assert.equal(merged.length,input.length);
  if(input.length)assert.equal(merged[0].enabled,input[0].enabled);
 }
});

function glueApi(extra={}) {
 const glue=fs.readFileSync('gist-sync/plugin-gist.js','utf8');
 return run(glue.slice(glue.indexOf('  const F50_GIST_MESSAGES'),glue.indexOf('  const f50GistCleanUrl'))+'\n({managed:f50GistManaged,update:f50GistUpdateSources})',{
  activeCriticalOperation:null,CLASH_CONFIG:'fixture',Date,Promise,setTimeout,window:{confirm:()=>false},
  normalizeStoredSubSourceList:s=>s,createToast(){},safeTextToHtml:String,operationFinish(){},invalidateStatusSnapshot(){},...extra
 });
}

test('Gist detection protects local edits and detects unsupported components',async()=>{
 let status={ok:true,manualSources:1,gistActive:true};
 const api=glueApi({f50GistExec:async()=>status,readYamlObject:async()=>({ok:true,value:{'x-f50-gist-sync':true}})});
 assert.equal(await api.managed(),status);
 status={ok:true,manualSources:1,gistActive:false};assert.equal(await api.managed(),null);
 status={ok:false,code:'components_missing'};await assert.rejects(api.managed(),/组件/);
});

test('Manual source update releases frontend lease, fences source revision and checks real receipt',async()=>{
 const calls=[],messages=[],op={token:{cancelled:false},leaseOwned:true};let result={ok:true,code:'synced'};
 const api=glueApi({activeCriticalOperation:op,
  f50ReleaseLease:async()=>{calls.push('release');op.leaseOwned=false;},
  f50GistDispatch:async(action,request)=>{assert.equal(op.leaseOwned,false);calls.push([action,plain(request)]);return {ok:true,job:'a'.repeat(32)};},
  f50GistExec:async()=>({ok:true,status:'finished',result}),createToast:(message,color)=>messages.push([message,color])
 });
 const st={settings:{revision:42}},sources=[{url:'https://example.test/sub',enabled:true}];
 assert.equal(await api.update(st,sources),true);
 assert.deepEqual(calls.slice(0,2),['release',['sync',{revision:42,manualSources:sources}]]);
 result={ok:false,code:'local_config_conflict'};assert.equal(await api.update(st,[]),false);assert.equal(messages.at(-1)[1],'red');
 result={ok:false,code:'source_changed'};assert.equal(await api.update(st,sources),false);
});

test('confirmed exit from broken Gist keeps the current config and permits ordinary subscriptions',async()=>{
 const config={'x-f50-gist-sync':true,proxies:[{name:'retained'}]};let written=null;
 const api=glueApi({activeCriticalOperation:{leaseOwned:true},window:{confirm:()=>true},
  f50GistExec:async()=>({ok:false,code:'components_missing'}),readYamlObject:async()=>({ok:true,value:config}),
  runShellWithRoot:async script=>{assert.match(script,/auto = false/);return {success:true};},
  writeYamlObjectAtomic:async(p,value)=>{written=value;return {ok:true};}
 });
 assert.equal(await api.managed(),null);assert.equal(written['x-f50-gist-sync'],undefined);assert.equal(written.proxies[0].name,'retained');
});
