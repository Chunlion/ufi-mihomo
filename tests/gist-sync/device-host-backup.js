const fs=await import('node:fs/promises');
const script=await fs.readFile('C:/Users/Cuty/Desktop/Github/Tproxy-F50/tests/gist-sync/device-host-backup.sh','utf8');
return await page.evaluate(async script=>{
 const r=await runShellWithRoot('(\n'+script+'\n) 2>&1\nrc=$?\nprintf "\\nHOST_BACKUP_EXIT=%s\\n" "$rc"',30000);
 if(!r?.success||!r.content?.includes('HOST_SETTING_BACKUP_VERIFIED=1')||!r.content.includes('HOST_BACKUP_EXIT=0'))throw Error('Host settings backup failed: '+r?.content);
 return r;
},script);
