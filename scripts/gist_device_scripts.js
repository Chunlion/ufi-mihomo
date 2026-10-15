'use strict';
const fs=require('node:fs');
const h=require('../tests/tproxy/optimization_harness');
// The legacy fixture quote also rewrites Windows path separators. It must never
// quote generated Shell source for a device operation.
const productionQuote=h.run(h.slice('const shellQuote =','const templateFlowMessages')+'shellQuote');
const api=h.shellApi(h.source,'',{shellQuote:productionQuote});
const uploaded=JSON.parse(fs.readFileSync('build/gist-sync/device-upload.json','utf8')).uploaded;
const scripts={inspect:api.inspect(),install:api.install(uploaded),lease:api.lease(),
 wrapper:h.slice('let transientShellOperation','const shellQuote'),
 fence:h.slice('function buildF50GistFence','function buildF50YamlCommitBody')};
fs.writeFileSync('build/gist-sync/device-scripts.json',JSON.stringify(scripts));
if(scripts.install.includes('bearer[ /t]')||!scripts.install.includes('bearer[ \\t]'))throw Error('Device script escaping differs from production');
console.log('Exact repository installer, task wrapper and lease generated for uploaded package');
