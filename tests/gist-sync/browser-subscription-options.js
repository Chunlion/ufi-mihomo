const fs=await import('node:fs/promises');
const source=await fs.readFile('C:/Users/Cuty/Desktop/Github/Tproxy-F50/猫猫TProxy.js','utf8');
const part=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)+start.length));
const fixture=`
let settings={ok:true,configured:true,auto:true,intervalHours:24,rescueConfigured:false},saved=null,custom=false,missing=false;
const SUB_RULE_MODE_TEMPLATE='template',SUB_CONVERT_MODE_PROVIDER='provider',SUB_CONVERT_MODE_LOCAL='local';
const loadSubscriptionPreferences=async()=>missing?null:settings;
const readCurrentSubSources=async()=>[{url:'https://example.test/sub',enabled:true}],readSavedSubConvertMode=async()=>'provider',readCurrentSubRuleMode=async()=>'template',readConfigSource=async()=>custom?'uploaded_config':'template.yaml';
const f50GistManaged=async()=>null,operationStage=()=>{},operationFinish=()=>{},createToast=()=>{};
const setText=(e,text)=>{if(e)e.textContent=text;},resetChildren=e=>e.replaceChildren(),askConfirm=async()=>true;
const safeTextToHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),f50GistMessage=String;
const acquireCriticalOperation=()=>({}),releaseCriticalOperation=async()=>{},setButtonBusy=(e,busy)=>{e.disabled=busy;};
const saveSubSources=async(sources,rule,mode,options)=>{saved={sources,rule,mode,options};if(options.subscriptionOptions){const p=options.subscriptionOptions;settings={...settings,auto:p.auto,intervalHours:p.intervalHours,rescueConfigured:p.rescueText?true:p.clearRescue?false:settings.rescueConfigured};}return true;};
const clearSubSourceFile=async()=>true;
`;
const viewport=page.viewportSize();
try{
  await page.evaluate(code=>{window.subscriptionFixture=new Function(code)();},fixture
    +part('const fitDialogWidth =','const askConfirm =')
    +part('const importSub = async','const subBtn =')
    +'return {open:()=>importSub(),saved:()=>saved,custom:()=>custom=true,missing:()=>missing=true};');
  await page.evaluate(()=>window.subscriptionFixture.open());
  await expect(page.locator('#mm_sub_options summary')).toHaveText(['自动更新','备用节点']);
  await page.locator('#mm_sub_options summary').nth(0).click();
  await page.locator('#mm_subscription_auto').uncheck();
  await page.locator('#mm_subscription_interval').selectOption('6');
  await page.locator('#mm_sub_options summary').nth(1).click();
  await page.locator('#mm_subscription_rescue').fill('name: Fixture\ntype: socks5\nserver: example.com\nport: 1080');
  await expect(page.locator('#mm_sub_convert_mode')).toBeDisabled();
  await expect(page.locator('#mm_sub_convert_mode')).toHaveValue('local');
  await page.locator('#mm_sub_submit_btn').click();
  const saved=await page.evaluate(()=>window.subscriptionFixture.saved());
  expect(saved.mode).toEqual('local');expect(saved.options.subscriptionOptions.auto).toEqual(false);expect(saved.options.subscriptionOptions.intervalHours).toEqual(6);
  await page.evaluate(()=>window.subscriptionFixture.open());
  await page.locator('#mm_sub_options summary').nth(1).click();
  await expect(page.locator('#mm_subscription_rescue')).toHaveValue('');
  await expect(page.locator('#mm_subscription_rescue_status')).toHaveText('已保存备用节点');
  await page.setViewportSize({width:390,height:844});
  await expect.poll(async()=>{const b=await page.locator('#mm_sub_input_toast .kano-dialog').boundingBox();return b&&b.width>100&&b.x>=0&&b.x+b.width<=391;}).toBeTruthy();
  await page.locator('#mm_subscription_rescue_clear').check();
  await expect(page.locator('#mm_sub_convert_mode')).toBeEnabled();
  await page.locator('#mm_sub_convert_mode').selectOption('provider');
  await page.locator('#mm_sub_submit_btn').click();
  await page.evaluate(()=>{window.subscriptionFixture.custom();return window.subscriptionFixture.open();});
  await expect(page.locator('#mm_subscription_auto')).toBeDisabled();
  await page.locator('#mm_sub_replace_custom').check();
  await expect(page.locator('#mm_subscription_auto')).toBeEnabled();
  await page.locator('#mm_sub_close_btn').click();
  await page.evaluate(()=>{window.subscriptionFixture.missing();return window.subscriptionFixture.open();});
  await expect(page.locator('#mm_subscription_auto')).toBeDisabled();
  await expect(page.locator('#mm_sub_submit_btn')).toBeEnabled();
  return {category:'MOCK',menuPlacement:true,combinedSave:true,rescueMode:true,customConfigProtected:true,oldComponentsCompatible:true,mobileLayout:true};
}finally{
  await page.evaluate(()=>{document.getElementById('mm_sub_input_toast')?.remove();delete window.subscriptionFixture;});
  if(viewport)await page.setViewportSize(viewport);
}
