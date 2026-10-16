    const gistSyncBtn = document.createElement('button');
    gistSyncBtn.classList.add('btn');
    gistSyncBtn.textContent = 'Gist \u52a0\u5bc6\u540c\u6b65';
    gistSyncBtn.onclick = async () => {
      if (!(await ensureAdvanced())) return;
      const {el, close} = createFixedToast('mm_gist_sync_dialog', `
        <div style="pointer-events:all;width:92vw;max-width:700px;max-height:85vh;overflow:auto;font-size:.8rem;line-height:1.5;">
          <div class="title" style="margin:0 0 12px">Gist 同步</div>
          <label for="mm_gist_url">Gist Raw 链接</label>
          <input id="mm_gist_url" type="url" maxlength="2048" spellcheck="false" autocomplete="off" placeholder="https://gist.githubusercontent.com/.../raw/config.yaml.age" style="box-sizing:border-box;width:100%;padding:10px;font:inherit;background:#111827;color:#fff;border:1px solid #64748b;border-radius:8px;">
          <label for="mm_gist_key" style="display:block;margin-top:10px">age 私钥</label>
          <input id="mm_gist_key" type="password" maxlength="100" spellcheck="false" autocomplete="new-password" placeholder="AGE-SECRET-KEY-1..." style="box-sizing:border-box;width:100%;padding:10px;font:inherit;background:#111827;color:#fff;border:1px solid #64748b;border-radius:8px;">
          <small id="mm_gist_key_hint" style="display:block;margin:4px 0 8px;color:#94a3b8"></small>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:10px 0;">
            <label><input id="mm_gist_auto" type="checkbox"> 自动同步</label>
            <label>每 <select id="mm_gist_interval" aria-label="同步间隔" style="color-scheme:dark!important;background:#111827!important;color:#fff!important;font:12px Arial;box-sizing:border-box;height:30px;min-height:0;padding:4px 8px;border:1px solid #64748b;border-radius:8px;">
              <option style="background:#111827!important;color:#fff!important;font:inherit;line-height:1.5;" value="1">1 小时</option><option style="background:#111827!important;color:#fff!important;font:inherit;line-height:1.5;" value="6" selected>6 小时</option><option style="background:#111827!important;color:#fff!important;font:inherit;line-height:1.5;" value="12">12 小时</option><option style="background:#111827!important;color:#fff!important;font:inherit;line-height:1.5;" value="24">24 小时</option>
            </select></label>
          </div>
          <div class="kano-dialog-actions kano-actions-2" style="--kano-action-count:1">
            <button id="mm_gist_apply" type="button">应用</button>
          </div>
          <div id="mm_gist_result" role="status" style="white-space:pre-wrap;margin:10px 0"></div>
          <div id="mm_gist_status" role="status" style="white-space:pre-wrap;overflow-wrap:anywhere;color:#94a3b8"></div>
          <details style="margin-top:8px"><summary>更多</summary>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">
              <button id="mm_gist_test">测试连接</button><button id="mm_gist_refresh">刷新状态</button><button id="mm_gist_read">重读设置</button>
              <button id="mm_gist_recover">恢复任务</button><button id="mm_gist_cancel">取消任务</button>
              <button id="mm_gist_disable">关闭自动同步</button><button id="mm_gist_delete">删除设置</button>
            </div>
          </details>
          <div style="text-align:right;margin-top:8px"><button id="mm_gist_close">关闭</button></div>
        </div>`);
      const q = id => el.querySelector('#mm_gist_'+id);
      let opened=true, pendingKey='', revision=0, currentJob='', foreground=false, settingsLoaded=false, refreshSequence=0, currentFingerprint=null;

      const result = text => { if(opened) q('result').textContent=text; };
      const fmt = value => value && !String(value).startsWith('0001-') ? new Date(value).toLocaleString() : '\u65e0';
      q('url').onblur=()=>{q('url').value=f50GistCleanUrl(q('url').value);};
      q('key').oninput=()=>{pendingKey=q('key').value.trim();};
      const refresh = async (loadForm=false) => {
        const sequence=++refreshSequence;
        const st=await f50GistExec(['status'],15000);
        if(!opened || sequence!==refreshSequence)return null;
        if(!st.ok){settingsLoaded=false;q('status').textContent=f50GistMessage(st.code);return null;}
        if(loadForm || !settingsLoaded){
          const saved=st.settings || {};
          q('url').value=saved.deleted?'':saved.url || '';
          q('auto').checked=!!saved.auto;
          q('interval').value=String(saved.intervalHours || 6);
          revision=saved.revision || 0; settingsLoaded=true;
          pendingKey='';q('key').value='';
        }
        q('key').placeholder=pendingKey ? '\u5df2\u8f93\u5165\u65b0\u79c1\u94a5\uff0c\u5f85\u4fdd\u5b58' : st.identitySet ? '\u7559\u7a7a\u4fdd\u7559\u5df2\u4fdd\u5b58\u7684\u79c1\u94a5' : 'AGE-SECRET-KEY-1...';
        q('key_hint').textContent=pendingKey?'新私钥待保存':st.identitySet?'已保存私钥，留空表示不更换':'';
        currentFingerprint=st.currentFingerprint || null;
        const state=st.state?.generation===st.settings?.generation?st.state:null;
        const last=state?.last;
        const recent=(st.jobs||[])[0];
        if(!foreground && recent && ['queued','running'].includes(recent.status)) currentJob=recent.id;
        const syncMode=st.settings.auto
          ? (st.schedulerRunning ? '自动同步开启 · 每 '+st.settings.intervalHours+' 小时' : '自动同步开启 · 设备调度未运行')
          : '自动同步关闭';
        const lastTime=state?.lastSuccess ? '上次同步 '+fmt(state.lastSuccess) : '尚未同步';
        const errorCode=st.fingerprintError || st.stateError || (!st.ageReady ? 'age_unavailable' : '') || (last && !last.ok ? last.code : '');
        q('status').textContent=syncMode+' · '+lastTime+(st.activationPending?'\n存在待恢复的同步任务':'')+(errorCode?'\n'+f50GistMessage(errorCode):'');
        return st;
      };
      const busy=on=>{foreground=on;for(const name of ['test','apply','disable','delete','recover','read'])q(name).disabled=on;};
      const describe=out=>f50GistMessage(out?.code)+(out?.warning?'\n'+f50GistMessage(out.warning):'');
      const launch=async (action,request={})=>{
        if(foreground)return;
        busy(true);result(action==='apply'?'正在应用…':'正在处理…');
        try{
          const started=await f50GistDispatch(action,request);
          if(!started.ok || !started.job){result(f50GistMessage(started.code));return;}
          currentJob=started.job;
          result(action==='apply'?'正在应用…':'正在处理…');
          while(opened){
            const job=await f50GistExec(['job',currentJob],8000);
            if(!opened)break;
            if(job.status==='finished'){
              const out=job.result;result(describe(out));
              if(out?.settingsSaved || action==='delete')await refresh(true);else await refresh(false);
              break;
            }
            if(job.status==='completion_unknown' || job.ok===false){result(f50GistMessage(job.result?.code || job.code)+'\n\u8bf7\u5237\u65b0\u72b6\u6001\u6216\u6062\u590d\u540c\u6b65\u4e8b\u52a1\uff0c\u4e0d\u8981\u53cd\u590d\u91cd\u63d0\u4efb\u52a1\u3002');break;}
            await new Promise(resolve=>setTimeout(resolve,1500));
          }
        }catch(_){result('\u4efb\u52a1\u7ed3\u679c\u672a\u786e\u8ba4\uff1b\u8bf7\u5237\u65b0\u72b6\u6001\u3002');}
        finally{if(opened)busy(false);}
      };
      const formAction=async action=>{
        if(!settingsLoaded){result('无法读取设置，请稍后重试。');return;}
        const url=f50GistCleanUrl(q('url').value);
        if(!f50GistValidUrl(url)){
          result(url?'请填写完整的 Gist Raw .age 下载链接。':'请先填写 Gist Raw 链接。');
          return;
        }
        q('url').value=url;
        if(q('key').value.trim())pendingKey=q('key').value.trim();
        q('key').value='';
        return launch(action,{url,identity:pendingKey,auto:q('auto').checked,intervalHours:Number(q('interval').value),revision,...(action==='apply'?{replaceLocal:true,expectedLocal:currentFingerprint}:{})});
      };
      q('test').onclick=()=>formAction('test');q('apply').onclick=()=>formAction('apply');
      q('disable').onclick=()=>launch('disable');
      q('refresh').onclick=()=>refresh(false);
      q('read').onclick=()=>{if(window.confirm('\u91cd\u8bfb\u8bbe\u7f6e\u4f1a\u4e22\u5f03\u5f53\u524d\u672a\u4fdd\u5b58\u7684\u8f93\u5165\uff0c\u7ee7\u7eed\uff1f'))return refresh(true);};
      q('cancel').onclick=async()=>{if(currentJob){const r=await f50GistExec(['cancel',currentJob],15000);result(r.ok?'\u5df2\u8bf7\u6c42\u53d6\u6d88\uff1b\u4ee5\u6700\u7ec8\u56de\u6267\u4e3a\u51c6':f50GistMessage(r.code));await refresh(false);}};
      q('recover').onclick=async()=>{busy(true);try{const r=await f50GistExec(['recover'],180000);result(describe(r.result || r));await refresh(false);}finally{if(opened)busy(false);}};
      q('delete').onclick=()=>{if(window.confirm('\u5220\u9664 Gist \u94fe\u63a5\u3001\u79c1\u94a5\u548c\u540c\u6b65\u8bb0\u5f55\uff0c\u5e76\u505c\u6b62\u81ea\u52a8\u540c\u6b65\uff1f\u5f53\u524d config.yaml \u4e0d\u4f1a\u88ab\u5220\u9664\u3002'))return launch('delete');};
      q('close').onclick=()=>{opened=false;pendingKey='';q('key').value='';close();};
      const observer=new MutationObserver(()=>{if(!el.isConnected){opened=false;pendingKey='';observer.disconnect();}});
      observer.observe(document.body,{childList:true,subtree:true});
      await refresh(true);
    };
