const fs=require('fs');
const {KPR}=require('./baseline-normalizer.js');
const cases=JSON.parse(fs.readFileSync(0,'utf8'));
const output=cases.map(c=>{try{return {ok:true,value:KPR.runtime(c.config,c.options,c.connected||[],false)}}catch(e){return {ok:false}}});
process.stdout.write(JSON.stringify(output));
