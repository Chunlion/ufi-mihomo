const fs=require('fs'),vm=require('vm');
const ctx={CryptoJS:require('./vendor/crypto-js.js'),crypto:require('crypto').webcrypto,TextEncoder,Uint8Array,DataView,BigInt};
if(process.argv.includes('--http'))ctx.crypto={getRandomValues:ctx.crypto.getRandomValues.bind(ctx.crypto)};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('gist-sync/plugin-gist.js','utf8')+'\nthis.seal=f50GistSeal;',ctx);
const input=JSON.parse(fs.readFileSync(0,'utf8'));
Promise.resolve(ctx.seal(input.key,input.action,input.request)).then(value=>process.stdout.write(JSON.stringify(value))).catch(error=>{console.error(error);process.exitCode=1;});
