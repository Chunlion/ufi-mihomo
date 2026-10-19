'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'), file=path.join(root,'猫猫TProxy.js');
let source=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
function between(start,end,replacement){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);if(a<0||b<0)throw Error('Missing Gist integration boundary: '+start);source=source.slice(0,a)+replacement+source.slice(b);}
between('  const F50_GIST_HELPER','  // ===== Basic helpers =====',read('gist-sync/plugin-gist.js')+'\n');
between('    const gistSyncBtn =',"    const mmBox = document.querySelector",read('gist-sync/ui-gist.js'));
function block(name){const a=source.indexOf('function '+name+'('),b=source.indexOf('\nfunction ',a+1);if(a<0||b<0)throw Error('Missing generator '+name);return source.slice(a,b);}
function arrow(name,next){const a=source.indexOf('  const '+name+' ='),b=source.indexOf('  const '+next+' =',a+1);if(a<0||b<0)throw Error('Missing generator '+name);return source.slice(a,b);}
const context={shellQuote:v=>"'"+String(v).replace(/'/g,"'\\''")+"'"};vm.createContext(context);
const profile=source.slice(source.indexOf('const F50_ZASHBOARD_UI_URL'),source.indexOf('function buildF50EmergencyScript'));
vm.runInContext(profile+block('buildF50ConfigTransactionFunctions')+arrow('prepareYqRuntimeCmd','pruneKanoBackupsCmd')+arrow('yqExecutableCheckCmd','readYamlObject')+block('buildF50YamlCommitBody')+'\nthis.body=buildF50YamlCommitBody(false);this.recover=buildF50ConfigTransactionFunctions();this.profiles=F50_FIXED_PROFILES;',context);
const dir=path.join(root,'build/gist-sync/clash/Scripts');fs.mkdirSync(dir,{recursive:true});
const header=`#!/system/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Generated from the repository's shared configuration transaction.
set -e
umask 077
ROOT=\${CLASH_ROOT:-/data/clash}
F50_OPERATION_LOCK=\${F50_OPERATION_LOCK:-/dev/kano_tproxy_operation.lock}
F50_RECOVERY_LOCK=\${F50_RECOVERY_LOCK:-/dev/kano_tproxy_recovery.lock}
[ -n "$KANO_TPROXY_TASK" ] && [ ! -L "$F50_OPERATION_LOCK" ] && [ ! -L "$F50_OPERATION_LOCK/owner" ] && [ "$(cat "$F50_OPERATION_LOCK/owner" 2>/dev/null)" = "$KANO_TPROXY_TASK" ] || { echo F50_ERROR=operation_busy; exit 1; }
if [ -e "$F50_OPERATION_LOCK/cancelled" ]; then
  [ "\${F50_GIST_RECOVERY:-0}" = 1 ] && [ -f "$F50_RECOVERY_LOCK/owner" ] || { echo F50_ERROR=operation_cancelled; exit 1; }
fi
[ "$TARGET" = "$ROOT/Proxy/config.yaml" ] && [ "$SOURCE_FILE" = "$ROOT/Tools/config_source.conf" ] || { echo F50_ERROR=invalid_target; exit 1; }
`;
fs.writeFileSync(path.join(dir,'Clash.ConfigCommit'),header+'if [ "$1" = recover ]; then\n'+context.recover+'\nf50_config_tx_recover "$TARGET" "$SOURCE_FILE"\nexit $?\nfi\n'+context.body.replace('KANO_YQ_RUNTIME=/data/kano_yq_runtime','KANO_YQ_RUNTIME=${F50_YQ_RUNTIME:-/data/kano_yq_runtime}'));
fs.copyFileSync(path.join(root,'gist-sync/Clash.GistSync'),path.join(dir,'Clash.GistSync'));
fs.writeFileSync(path.join(root,'gist-sync/native/profiles.json'),JSON.stringify(context.profiles,null,2)+'\n');
fs.writeFileSync(file,source);
console.log('Gist modules, shared transaction and profiles synchronized');
