const fs=await import('node:fs/promises');
const root='C:/Users/Cuty/Desktop/Github/Tproxy-F50/';
await page.evaluate(()=>{
 if(location.origin!=='http://192.168.0.1:2333')throw Error('Unexpected upload origin');
 const input=document.createElement('input');input.type='file';input.id='codex_gist_component_bundle';input.hidden=true;document.body.append(input);
});
await page.locator('#codex_gist_component_bundle').setInputFiles(root+'dist/gist-sync/tproxy-yq-gistsync-full.zip');
const result=await page.evaluate(async()=>{
 const input=document.getElementById('codex_gist_component_bundle'),file=input.files[0];
 const form=new FormData();form.append('file',file);
 const response=await fetch(`${KANO_baseURL}/upload_img`,{method:'POST',headers:common_headers,body:form});
 if(!response.ok)throw Error('Component upload HTTP '+response.status);
 const result=await response.json();input.remove();
 if(typeof result.url!=='string'||result.url.includes('..')||result.url.includes('://'))throw Error('Invalid device upload path');
 return {uploaded:'/data/data/com.minikano.f50_sms/files/'+result.url.replace(/^\/+/,''),bytes:file.size};
});
await fs.writeFile(root+'build/gist-sync/device-upload.json',JSON.stringify(result));
return result;
