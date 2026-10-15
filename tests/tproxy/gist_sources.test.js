'use strict';
const test=require('node:test');
const {fs,assert,vm,slice,run,subscriptionApi,plain}=require('./optimization_harness');

test('Gist refresh bypasses template replacement and ProviderN assumptions',async()=>{
 const gist={settings:{revision:7}},calls=[];
 const fn=subscriptionApi(slice('const updateSubProviders = async','const readCurrentSubSources = async')+'updateSubProviders',{
  ensureCompatBackend:async()=>true,readConfigSource:async()=> 'uploaded_config',
  f50GistManaged:async()=>gist,f50GistUpdateSources:async(...args)=>{calls.push(args);return true;},
  readYamlObject:()=>{throw Error('legacy provider-only path');},writeSubConfigByMode:()=>{throw Error('template overwrite');}
 });
 assert.equal(await fn([]),true);assert.deepEqual(calls,[[gist]]);
});

test('Gist source saves, disabled-only and empty removal all use native merge',async()=>{
 for(const input of [[],[{url:'https://example.test/sub',enabled:false}],[{url:'https://example.test/sub',enabled:true}]]) {
  let merged;const gist={settings:{revision:7}};
  const fn=subscriptionApi(slice('function validateSubscriptionMode','function buildF50CleanupScript')+slice('const saveSubSources = async','const overwriteConfigByTemplate')+'saveSubSources',{
   validateLocalSubscriptionUrl:()=>({ok:true}),showSuspiciousSubSourcesError:()=>false,
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
  activeCriticalOperation:null,CLASH_CONFIG:'fixture',Date,Promise,setTimeout,
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
