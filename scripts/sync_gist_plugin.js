'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
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
vm.runInContext(profile+block('buildF50ConfigTransactionFunctions')+arrow('prepareYqRuntimeCmd','requireMikeFarahYqV4Cmd')+arrow('yqVersionCheckCmd','readYamlObject')+block('buildF50YamlCommitBody')+'\nthis.body=buildF50YamlCommitBody(false);this.recover=buildF50ConfigTransactionFunctions();this.profiles=F50_FIXED_PROFILES;',context);
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
if(process.argv.includes('--finalize')){
 const release=JSON.parse(read('gist-sync/release.json'));
 const manifestPath='build/gist-sync/clash/Tools/gist-sync-component.json';
 const manifest=JSON.parse(read(manifestPath));
 const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
 const entries={'Tools/gist-sync-component.json':digest(fs.readFileSync(path.join(root,manifestPath))),...manifest.files};
 let verify='f50_gist_verify_bundle() {\n  groot=$1\n';
 for(const [relative,hash] of Object.entries(entries)){
  const code=relative.endsWith('gist-sync-component.json')?'gist_manifest_mismatch':'gist_component_hash_mismatch';
  verify+=`  [ -f "$groot/${relative}" ] && [ ! -L "$groot/${relative}" ] && [ "$(sha256sum "$groot/${relative}" | awk '{print $1}')" = '${hash}' ] || { f50_install_fail ${code}; return 1; }\n`;
 }
 verify+=`  chmod 755 "$groot/Tools/age" "$groot/Tools/kano-gist-sync" "$groot/Scripts/Clash.GistSync" "$groot/Scripts/Clash.ConfigCommit" || { f50_install_fail gist_permission_failed; return 1; }
  sh -n "$groot/Scripts/Clash.GistSync" && sh -n "$groot/Scripts/Clash.ConfigCommit" || { f50_install_fail gist_script_invalid; return 1; }
  gist_probe=$(f50_limit 5 "$groot/Tools/kano-gist-sync" version 2>/dev/null) || { f50_install_fail gist_runtime_probe_failed; return 1; }
  printf '%s' "$gist_probe" | grep -q '"version":"${release.version}"' && printf '%s' "$gist_probe" | grep -Eq '"protocol":1([,}])' || { f50_install_fail gist_runtime_probe_failed; return 1; }
  age_probe=$(f50_limit 5 "$groot/Tools/age" --version 2>/dev/null) && [ "$age_probe" = v1.3.2 ] || { f50_install_fail gist_age_runtime_probe_failed; return 1; }
}
`;
 between('f50_gist_verify_bundle() {','[ -f "$PKG/Tools/gist-sync-component.json" ]',verify);
 const zip=fs.readFileSync(path.join(root,'tproxy-yq.zip'));
 const metadata={version:release.version,sha256:digest(zip),published:release.published};
 source=source.replace(/  const F50_FULL_COMPONENT_RELEASE = Object\.freeze\([^\n]+/, '  const F50_FULL_COMPONENT_RELEASE = Object.freeze('+JSON.stringify(metadata)+');');
 ['URL','FALLBACK_URL','REPO_URL'].forEach((suffix,i)=>{source=source.replace(new RegExp("  const CLASH_PACKAGE_"+suffix+" = [^\\n]*"),"  const CLASH_PACKAGE_"+suffix+" = "+context.shellQuote(release.urls[i]||'')+';');});
}
fs.writeFileSync(file,source);
console.log('Gist modules, shared transaction, profiles'+(process.argv.includes('--finalize')?' and component pins':'')+' synchronized');
