// Refresh only when intentionally reviewing changed network or diagnostic contracts.
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');
const h=require('../tests/tproxy/optimization_harness');
const {shellApi,slice,run}=h;
const baseline=cp.execFileSync('git',['show','b21155e:猫猫TProxy.js'],{encoding:'utf8',maxBuffer:2*1024*1024}).replace(/\r\n/g,'\n');
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const api=shellApi(),old=shellApi(h.original),operations={},network={};
for(const name of ['scan','artifact_paths','remove_artifacts']){const get=x=>slice('f50_'+name+'() {','\n}\n',x);network[name]={before:hash(get(old.maintenance())),after:hash(get(api.maintenance()))};}
for(const op of ['inspect','cleanup','final','uninstall']){const get=x=>op==='uninstall'?x.uninstall().map(s=>s.script).join('\n'):x[op]();operations[op]={before:hash(get(old)),after:hash(get(api))};}
const oldLabels=run(slice('  const labels = {','  let summary',baseline)+'\nlabels'),labels=run(slice('const F50_DIAGNOSTIC_LABELS','function f50Diagnostic')+'\nF50_DIAGNOSTIC_LABELS');
const additions=Object.fromEntries(Object.entries(labels).filter(([k])=>!Object.hasOwn(oldLabels,k)));
const removedLabels=Object.keys(oldLabels).filter(k=>!Object.hasOwn(labels,k));
const output={network,operations,labels:additions,removedLabels};
fs.writeFileSync('tests/gist-sync/expected-contracts.json',JSON.stringify(output,null,2)+'\n');console.log('Network, operation and diagnostic contracts saved');
