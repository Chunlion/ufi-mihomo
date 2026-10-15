// Refresh only when intentionally reviewing a changed generated Shell contract.
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');
const {parse,visit,semantics}=require('./compact_plugin');
const h=require('../tests/tproxy/optimization_harness');
const {source,shellApi,slice,run,quote}=h;
const baseline=cp.execFileSync('git',['show','b21155e:猫猫TProxy.js'],{encoding:'utf8',maxBuffer:2*1024*1024}).replace(/\r\n/g,'\n');
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const names=[];visit(parse(baseline),n=>{if(n.type==='FunctionDeclaration'&&n.id.name.startsWith('build'))names.push(n.id.name);});names.push('buildOwnedCoreFunctions','buildApiCurl');
function builders(text){const extra=`const CLASH_DIR='/data/clash',CLASH_CORE=CLASH_DIR+'/Proxy/Clash.Core',CLASH_SERVICE=CLASH_DIR+'/Scripts/Clash.Service';\n`+slice('const buildOwnedCoreFunctions','const removePluginOwnedArtifactsCmd',text)+slice('function buildStatusSnapshotCommand()','async function readStatusSnapshot',text)+slice('const buildApiCurl =','const callMihomoApi =',text)+`\nbuildF50InstallScript.builders={${names.join(',')}};`;return shellApi(text,extra).install.builders;}
const before=builders(baseline),after=builders(source),service=quote('/data/clash/Scripts/Clash.Service');
const variants={buildF50EmergencyScript:[[],['',true],['mm_fixture',true]],buildF50LeaseFunctions:[[true],[false]],buildF50ServiceCurlPatchScript:[[service]],buildF50OriginalServicePatchScript:[[service]],buildF50StartScript:[['start'],['restart']],buildF50MaintenanceFunctions:['all','start','inspect','install','cleanup','final','remove'].map(n=>[n]),buildF50InstallScript:[['/data/upload.zip']],buildApiCurl:[['/version','GET',null,{apiBase:'http://127.0.0.1:7788',secret:'fixture'}],['/configs','PATCH',{fixture:true},{apiBase:'http://127.0.0.1:7788',secret:'fixture'},'/data/api.out']]};
const generated={};for(const name of names)for(const args of variants[name]||[[]]){const a=before[name](...args),b=after[name](...args);if(hash(a)!==hash(b))generated[name+JSON.stringify(args)]={before:hash(a),after:hash(b)};}
const api=shellApi(),old=shellApi(h.original),operations={},network={};
for(const name of ['scan','artifact_paths','remove_artifacts']){const get=x=>slice('f50_'+name+'() {','\n}\n',x);network[name]={before:hash(get(old.maintenance())),after:hash(get(api.maintenance()))};}
for(const op of ['inspect','cleanup','final','uninstall']){const get=x=>op==='uninstall'?x.uninstall().map(s=>s.script).join('\n'):x[op]();operations[op]={before:hash(get(old)),after:hash(get(api))};}
const oldLabels=run(slice('  const labels = {','  let summary',baseline)+'\nlabels'),labels=run(slice('const F50_DIAGNOSTIC_LABELS','function f50Diagnostic')+'\nF50_DIAGNOSTIC_LABELS');
const additions=Object.fromEntries(Object.entries(labels).filter(([k])=>!Object.hasOwn(oldLabels,k)));
const output={review:'Intentional GistSync additions; unchanged outputs still compare directly to historical baseline. Regeneration is never part of verification.',generated,network,operations,labels:additions,sourceSHA256:hash(source)};
fs.writeFileSync('tests/gist-sync/expected-contracts.json',JSON.stringify(output,null,2)+'\n');console.log('Review required: '+Object.keys(generated).length+' changed generated Shell variants pinned');
