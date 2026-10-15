await page.goto('http://192.168.0.1:2333/',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>typeof runShellWithRoot==='function');
const fs=await import('node:fs/promises');
const source=await fs.readFile('C:/Users/Cuty/Desktop/Github/Tproxy-F50/gist-sync/plugin-gist.js','utf8');
return await page.evaluate(async source=>{
 const api=new Function('hostRunShellWithRoot','shellQuote',source+'\nreturn {exec:f50GistExec,message:f50GistMessage};')(runShellWithRoot,v=>"'"+String(v).replace(/'/g,"'\\''")+"'");
 const result=await api.exec(['status']);
 if(result.code!=='components_missing' && !(result.ok && result.version==='1.0.0-rc4' && result.protocol===1 && result.ageReady))throw Error('Unexpected device component status: '+result.code);
 return {result,message:api.message(result.code),userAgent:navigator.userAgent,origin:location.origin};
},source);