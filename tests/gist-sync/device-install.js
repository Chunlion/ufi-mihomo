const fs=await import('node:fs/promises'),vm=await import('node:vm');
const root='C:/Users/Cuty/Desktop/Github/Tproxy-F50/';
const scripts=JSON.parse(await fs.readFile(root+'build/gist-sync/device-scripts.json','utf8'));
const quote=v=>"'"+String(v).replace(/'/g,"'\\''")+"'";
const op={token:{id:'rc4_device_'+Date.now()},requests:0};
const sandbox={activeCriticalOperation:op,taskCommandSequence:0,KANO_INSTALL_TOOLBOX_BIN:'/data/kano_tproxy_tools/bin',
 buildF50LeaseFunctions:()=>scripts.lease,shellQuote:quote,setInterval,clearInterval,
 operationCancelled:()=>Object.assign(Error('Device operation cancelled'),{name:'OperationCancelled'}),
 f50Diagnostic:()=>({}),createToast(){},safeTextToHtml:String,
 hostRunShellWithRoot:async(script,timeout)=>page.evaluate(async({script,timeout})=>await runShellWithRoot(script,timeout),{script,timeout})};
vm.createContext(sandbox);vm.runInContext(scripts.fence+scripts.wrapper+'\nthis.execute=runShellWithRoot;this.release=f50ReleaseLease;',sandbox);
let inspect,installed;
try {
 inspect=await sandbox.execute(scripts.inspect,25000);
 if(!inspect.success||!inspect.content.includes('F50_INSPECT_OK=1'))throw Error('Pre-install inspection failed');
 installed=await sandbox.execute(scripts.install,150000);
 await fs.writeFile(root+'reports/gist-sync/device-install.json',JSON.stringify({inspect,installed},null,2)+'\n');
 if(!installed.success||!installed.deviceCompleted||installed.deviceExitCode!==0||!/^KANO_INSTALL_OK=1$/m.test(installed.content)||!/^F50_INSTALL_TRANSACTION_STATE=complete$/m.test(installed.content))throw Error('Device install failed: '+String(installed.content).slice(-1800));
 return {success:true,inspect:inspect.content,installed:installed.content};
} finally {
 await sandbox.release(op);
 if(op.uncertain||op.leaseOwned)throw Error('Device lease release unconfirmed; inspect receipt before retry');
}
