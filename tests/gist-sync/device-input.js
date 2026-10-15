const fs=await import('node:fs/promises');
const root='C:/Users/Cuty/Desktop/Github/Tproxy-F50/';
const host=pages().find(p=>p.url()==='http://192.168.0.1:2333/');
if(!host)throw Error('Open the authorized F50 host first');await usePage(host);
const jobs=()=>page.evaluate(async()=>{
 const r=await runShellWithRoot('/data/clash/Tools/kano-gist-sync status',10000);
 if(!r.success)throw Error('Device status failed');const s=JSON.parse(r.content);
 if(!s.ok||s.fingerprintError)throw Error('Device status unconfirmed');
 return s.jobs.map(j=>j.id);
});
if(await page.locator('#PluginModal').isVisible())await page.locator('#PluginModal').getByRole('button',{name:'关闭',exact:true}).click();
if(!(await page.locator('#mm_gist_sync_dialog').isVisible())){
 const group=page.locator('#mm_action_box details').filter({has:page.locator('summary').filter({hasText:'订阅与配置'})});
 if(!(await group.evaluate(e=>e.open)))await group.locator('summary').click();
 await page.getByRole('button',{name:'Gist 加密同步',exact:true}).click();
}
await page.waitForFunction(()=>!!document.querySelector('#mm_gist_status')?.textContent);
const before=await jobs();
await page.locator('#mm_gist_url').fill('');await page.locator('#mm_gist_test').click();
await expect(page.locator('#mm_gist_result')).toHaveText('请先填写 Gist Raw 链接。');
await page.locator('#mm_gist_url').fill('https://gist.github.com/fixture/abcde');await page.locator('#mm_gist_test').click();
await expect(page.locator('#mm_gist_result')).toHaveText('请填写完整的 Gist Raw .age 下载链接。');
await expect(await jobs()).toEqual(before);
assert.ok(!(await page.locator('#mm_gist_status').textContent()).match(/SHA-256|控制面|运行确认|未执行/));
const styles=await page.locator('#mm_gist_interval').evaluate(e=>({height:e.getBoundingClientRect().height,options:[...e.options].map(o=>({value:o.value,color:getComputedStyle(o).color,background:getComputedStyle(o).backgroundColor}))}));
await expect(styles.options.map(o=>o.value)).toEqual(['1','6','12','24']);assert.ok(styles.height>=42);
for(const o of styles.options)assert.notEqual(o.color,o.background);
await page.locator('#mm_gist_url').fill('');await page.locator('#mm_gist_close').click();
await page.getByRole('button',{name:'Gist 加密同步',exact:true}).click();
await expect(page.locator('#mm_gist_url')).toHaveValue('');await expect(page.locator('#mm_gist_key')).toHaveValue('');
await expect(page.locator('#mm_gist_sync_dialog')).toHaveCSS('opacity','1');
await page.screenshot({fullPage:false});
const result={category:'DEVICE',result:'PASS',coverage:'empty/malformed links rejected locally with no new jobs; concise status; four readable options; reopen; no settings or configuration writes',styles};
await fs.writeFile(root+'reports/gist-sync/device-input.json',JSON.stringify(result,null,2)+'\n');return result;
