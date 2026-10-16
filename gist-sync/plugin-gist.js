  const F50_GIST_HELPER = '/data/clash/Tools/kano-gist-sync';
  function f50GistParse(response, tag, command) {
    const candidates = [response?.content, response?.data?.content, response?.data?.result, response?.result];
    const pattern = new RegExp('(?:^|\\n)F50_GIST_BEGIN_' + tag + '\\r?\\n([\\s\\S]*?)\\r?\\nF50_GIST_END_' + tag + '=(\\d+)[ \\t]*(?:\\r?\\n|$)');
    for (const content of candidates) {
      if (typeof content !== 'string') continue;
      const match = content.match(pattern);
      if (!match) continue;
      let value;
      try { value = JSON.parse(match[1].trim()); } catch (_) { return {ok:false,code:'response_format_invalid'}; }
      if (!value || Array.isArray(value) || typeof value !== 'object') return {ok:false,code:'response_format_invalid'};
      const exitCode = Number(match[2]);
      if (value.ok === false && typeof value.code === 'string' && value.code) return value;
      if (exitCode !== 0) return {ok:false,code:exitCode===124?'operation_timeout':'device_execution_failed',exitCode};
      if (response?.success === false) return {ok:false,code:'device_state_unknown'};
      if (command === 'job') {
        if (!/^[a-f0-9]{32}$/.test(value.id || '') || !['queued','running','finished','completion_unknown'].includes(value.status) ||
            (value.status === 'finished' && typeof value.result?.ok !== 'boolean')) return {ok:false,code:'response_format_invalid'};
        return {...value,ok:true};
      }
      if (value.ok !== true) return {ok:false,code:'response_format_invalid'};
      if (['status','version'].includes(command) && value.protocol !== 1) return {ok:false,code:'component_version_mismatch'};
      if (command === 'status' && (!value.settings || typeof value.settings !== 'object' ||
          ![1,6,12,24].includes(value.settings.intervalHours) || typeof value.ageReady !== 'boolean')) return {ok:false,code:'response_format_invalid'};
      return value;
    }
    const text = String(response?.content || '');
    if (/timeout|timed out|aborted/i.test(text)) return {ok:false,code:'operation_timeout'};
    return {ok:false,code:text.trim()?'response_format_invalid':'device_state_unknown'};
  }
  async function f50GistExec(args, timeout = 10000, input = '') {
    const tag = Array.from(crypto.getRandomValues(new Uint8Array(12)), b=>b.toString(16).padStart(2,'0')).join('');
    const invocation = shellQuote(F50_GIST_HELPER) + ' ' + args.map(shellQuote).join(' ') +
      (input ? ' <<\'F50_SEALED_REQUEST\'\n' + input + '\nF50_SEALED_REQUEST\n' : '\n');
    const script = `umask 077
printf '\\nF50_GIST_BEGIN_${tag}\\n'
(
if [ ! -f ${shellQuote(F50_GIST_HELPER)} ]; then printf '%s\\n' '{"ok":false,"code":"components_missing"}'; exit 127; fi
if [ ! -x ${shellQuote(F50_GIST_HELPER)} ]; then printf '%s\\n' '{"ok":false,"code":"component_not_executable"}'; exit 126; fi
${invocation}) 2>/dev/null
rc=$?
printf '\\nF50_GIST_END_${tag}=%s\\n' "$rc"
`;
    try { return f50GistParse(await hostRunShellWithRoot.call(globalThis,script,timeout),tag,args[0]); }
    catch (error) { return {ok:false,code:error?.name==='AbortError' || /timeout/i.test(error?.message || '')?'operation_timeout':'device_state_unknown'}; }
  }
  async function f50GistSeal(key, action, request) {
    if (typeof CryptoJS === 'undefined' || !crypto?.getRandomValues) throw Error('secure_transport_unavailable');
    if (key.protocol !== 1 || !/^[a-f0-9]{32}$/.test(key.id || '') || !/^[a-f0-9]{512}$/.test(key.modulus || '') || key.exponent !== 65537) throw Error('component_version_mismatch');
    const hex = bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    const wa = bytes=>CryptoJS.enc.Hex.parse(hex(bytes));
    const bytes = word=>Uint8Array.from(word.toString(CryptoJS.enc.Hex).match(/../g)||[],v=>parseInt(v,16));
    const hash = data=>bytes(CryptoJS.SHA256(wa(data)));
    const mask = (seed,length)=>{
      const out=new Uint8Array(length);
      for(let i=0;i<Math.ceil(length/32);i++){
        const input=new Uint8Array(seed.length+4);input.set(seed);new DataView(input.buffer).setUint32(seed.length,i);
        out.set(hash(input).slice(0,Math.min(32,length-i*32)),i*32);
      }return out;
    };
    const secret=crypto.getRandomValues(new Uint8Array(64));
    let wrapped;
    if (crypto.subtle) {
      const n=CryptoJS.enc.Hex.parse(key.modulus).toString(CryptoJS.enc.Base64).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      const publicKey=await crypto.subtle.importKey('jwk',{kty:'RSA',n,e:'AQAB'},{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
      wrapped=wa(new Uint8Array(await crypto.subtle.encrypt({name:'RSA-OAEP',label:new TextEncoder().encode('Maomao-GistSync-RC3')},publicKey,secret))).toString(CryptoJS.enc.Base64);
    } else {
      // The F50 HTTP host has no WebCrypto; retain its existing OAEP transport.
      if (typeof BigInt === 'undefined') throw Error('secure_transport_unavailable');
      const seed=crypto.getRandomValues(new Uint8Array(32));
      const db=new Uint8Array(223);db.set(hash(new TextEncoder().encode('Maomao-GistSync-RC3')));db[158]=1;db.set(secret,159);
      const dbMask=mask(seed,223);for(let i=0;i<223;i++)db[i]^=dbMask[i];
      const seedMask=mask(db,32);for(let i=0;i<32;i++)seed[i]^=seedMask[i];
      const encoded=new Uint8Array(256);encoded.set(seed,1);encoded.set(db,33);
      const modulus=BigInt('0x'+key.modulus);let base=BigInt('0x'+hex(encoded)),exponent=65537n,encrypted=1n;
      while(exponent){if(exponent&1n)encrypted=encrypted*base%modulus;base=base*base%modulus;exponent>>=1n;}
      wrapped=CryptoJS.enc.Hex.parse(encrypted.toString(16).padStart(512,'0')).toString(CryptoJS.enc.Base64);
    }
    const iv=crypto.getRandomValues(new Uint8Array(16));
    const data=CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(JSON.stringify(request)),wa(secret.slice(0,32)),{iv:wa(iv),mode:CryptoJS.mode.CBC,padding:CryptoJS.pad.Pkcs7}).ciphertext.toString(CryptoJS.enc.Base64);
    const iv64=wa(iv).toString(CryptoJS.enc.Base64);
    const mac=CryptoJS.HmacSHA256('1\n'+key.id+'\n'+action+'\n'+wrapped+'\n'+iv64+'\n'+data,wa(secret.slice(32))).toString(CryptoJS.enc.Base64);
    secret.fill(0);
    return {protocol:1,id:key.id,key:wrapped,iv:iv64,data,mac};
  }
  async function f50GistDispatch(action, request = {}) {
    try {
      if (!request.identity && !request.manualSources) {
        const direct=await f50GistExec(['dispatch',action],12000,JSON.stringify(request));
        if (direct.code !== 'invalid_command') return direct;
      }
      const key = await f50GistExec(['request-key'],15000);
      if (action === 'apply' && key.ok && key.apply !== true) return {ok:false,code:'component_version_mismatch'};
      if (request.manualSources && key.ok && key.manualSources !== 1) return {ok:false,code:'component_version_mismatch'};
      if (!key.ok) return key;
      const sealed=await f50GistSeal(key,action,request);
      return await f50GistExec(['dispatch-sealed',action],12000,JSON.stringify(sealed));
    } catch (error) { return {ok:false,code:['secure_transport_unavailable','component_version_mismatch'].includes(error?.message)?error.message:'request_encryption_failed'}; }
    finally { request.identity=''; }
  }

  const F50_GIST_MESSAGES = {
    manual_source_invalid:'手动订阅链接无效。',
    manual_source_limit:'手动订阅最多保存 100 条。',
    manual_sources_unreadable:'无法读取手动订阅，未更新配置。',
    manual_sources_changed:'手动订阅已变更，请重新同步。',
    manual_provider_update_failed:'手动订阅下载失败。',
    manual_provider_empty:'手动订阅没有可用节点。',
    invalid_gist_url:'Gist 链接无效，请填写完整的 Raw 下载地址。',
    invalid_gist_path:'Gist Raw 链接路径不正确。',
    invalid_gist_revision:'Gist 版本号无效。',
    invalid_gist_filename:'Gist 链接应指向 .age 加密文件。',
    invalid_age_identity:'age 私钥格式不正确。',
    age_identity_missing:'请先填写 age 私钥。',
    http_404:'Gist 文件不存在或无法访问。',
    http_403:'Gist 访问被拒绝。',
    download_timeout:'Gist 下载超时，请重试。',
    download_transport_failed:'Gist 下载失败，请检查网络。',
    yaml_runtime_not_ready:'组件初始化未完成，请在组件管理中重新导入配套完整组件包。',
    no_transaction_pending:'没有待恢复的同步事务。',
    components_missing:'当前完整组件版本不支持 Gist 同步，请在组件管理中更新。',
    base_components_missing:'原组件缺失，请在组件管理中更新完整组件包。',
    component_version_mismatch:'Gist 组件与页面版本不匹配，请更新配套 JS 和完整组件包。',
    component_not_executable:'Gist 程序无法执行，请在组件管理中重新导入完整组件包。',
    device_execution_failed:'设备端执行失败，请检查组件架构、权限和设备状态。',
    response_format_invalid:'设备返回数据格式不正确，请刷新状态；持续出现时更新配套 JS 和组件。',
    operation_timeout:'操作超时，设备任务可能仍在运行；请刷新状态后确认。',
    device_state_unknown:'设备状态暂时无法确认，请检查连接后刷新状态。',
    secure_transport_unavailable:'当前宿主缺少加密能力，未传输私钥；请更新宿主。',
    request_encryption_failed:'同步请求加密失败，未发送明文私钥。',
    request_key_expired:'一次性请求密钥已过期，请刷新状态后重试。',
    sealed_request_invalid:'加密请求校验失败，未执行操作。',
    root_required:'设备未授予 root 执行权限。',
    too_many_tasks:'同步任务正在运行，请等待或在高级维护中取消任务。',
    timeout:'设备操作超时，请刷新状态确认结果。',
    idle:'等待同步',

    test_passed:'\u4e0b\u8f7d\u3001\u89e3\u5bc6\u548c\u6700\u7ec8\u914d\u7f6e\u6821\u9a8c\u901a\u8fc7\uff1b\u672a\u5e94\u7528',
    settings_saved:'\u8bbe\u7f6e\u5df2\u4fdd\u5b58\uff1b\u672a\u5e94\u7528\u914d\u7f6e',
    up_to_date:'\u914d\u7f6e\u5df2\u662f\u6700\u65b0', synced:'配置已更新',
    saved_stopped:'\u914d\u7f6e\u5df2\u4fdd\u5b58\uff1b\u6838\u5fc3\u4fdd\u6301\u505c\u6b62\uff0c\u672a\u52a0\u8f7d',
    local_config_conflict:'\u68c0\u6d4b\u5230\u672c\u5730\u4fee\u6539\uff0c\u672a\u8986\u76d6',
    local_conflict:'\u68c0\u6d4b\u5230\u672c\u5730\u4fee\u6539\uff0c\u672a\u8986\u76d6',
    source_changed:'\u540c\u6b65\u6e90\u5df2\u66f4\u6362\uff0c\u65e7\u4efb\u52a1\u672a\u63d0\u4ea4',
    settings_changed:'\u8bbe\u7f6e\u5df2\u88ab\u5176\u4ed6\u9875\u9762\u66f4\u6539\uff1b\u8bf7\u91cd\u65b0\u8bfb\u53d6\u8868\u5355',
    operation_busy:'\u8bbe\u5907\u6b63\u5728\u6267\u884c\u5176\u4ed6\u64cd\u4f5c\uff0c\u672a\u62a2\u5360\u79df\u7ea6',
    blocked_dns_address:'DNS 返回了内网或 Fake-IP 地址，已拒绝下载。请让 Gist 域名使用真实公网 DNS。',
    dns_failed:'Gist 域名解析失败，请检查设备 DNS 和网络。',
    age_unavailable:'age 无法执行，请在组件管理中更新',
    age_decrypt_failed:'age \u89e3\u5bc6\u5931\u8d25\uff1b\u8bf7\u68c0\u67e5\u79c1\u94a5\u4e0e\u5bc6\u6587',
    committed_pending_finalize:'\u914d\u7f6e\u5df2\u63d0\u4ea4\uff0c\u4e8b\u52a1\u6536\u5c3e\u5f85\u786e\u8ba4\uff1b\u8bf7\u5148\u6062\u590d\u540c\u6b65\u4e8b\u52a1',
    sync_settings_deleted:'\u540c\u6b65\u8bbe\u7f6e\u548c\u79c1\u94a5\u5df2\u5220\u9664\uff1b\u8fd0\u884c\u914d\u7f6e\u672a\u5220\u9664',
    auto_disabled:'\u81ea\u52a8\u540c\u6b65\u5df2\u5173\u95ed',
    task_receipt_missing:'\u4efb\u52a1\u56de\u6267\u4e22\u5931\uff0c\u7ed3\u679c\u672a\u786e\u8ba4\uff1b\u4e0d\u4ee3\u8868\u5df2\u56de\u6eda',
    auto_paused_core_stopped:'\u6838\u5fc3\u5df2\u505c\u6b62\uff0c\u81ea\u52a8\u5e94\u7528\u6682\u505c'
  };
  const f50GistMessage = value => F50_GIST_MESSAGES[value] || String(value || '\u672a\u786e\u8ba4');

  async function f50GistLeave() {
    const leave=async()=>{
      const read=await readYamlObject(CLASH_CONFIG,'config.yaml');
      if (!read.ok) throw Error(read.message || '读取配置失败');
      const paused=await runShellWithRoot(`set -e
settings=/data/clash/Tools/gist-sync/settings.conf
if [ -f "$settings" ]; then
  tmp="$settings.new.$$"
  trap 'rm -f "$tmp"' EXIT
  /data/clash/Tools/yq_linux_arm64 e -p=json -o=json '.auto = false | .revision += 1' "$settings" > "$tmp"
  chmod 600 "$tmp" && mv -f "$tmp" "$settings"
fi`,8000);
      if (!paused.success) throw Error('关闭 Gist 自动同步失败');
      delete read.value['x-f50-gist-sync'];
      const written=await writeYamlObjectAtomic(CLASH_CONFIG,read.value);
      if (!written.ok) throw Error(written.content || '退出 Gist 管理失败');
      invalidateStatusSnapshot();
      return true;
    };
    return activeCriticalOperation?.leaseOwned ? leave() : runCriticalOperation('退出 Gist 管理',leave);
  }

  async function f50GistManaged() {
    const st = await f50GistExec(['status'], 15000);
    if (st.ok && st.manualSources === 1) return st.gistActive ? st : null;
    const read = await readYamlObject(CLASH_CONFIG, 'config.yaml');
    if (!read.ok) throw Error(read.message || '读取配置失败');
    if (read.value['x-f50-gist-sync'] === true || (st.ok && st.state?.applied?.config && st.state.applied.config === st.currentFingerprint?.config)) {
      if (window.confirm('Gist 同步不可用。退出 Gist 管理并保留当前配置，继续普通订阅操作？')) {
        if (await f50GistLeave()) return null;
      }
      throw Error(f50GistMessage(st.ok ? 'component_version_mismatch' : st.code));
    }
    return null;
  }

  async function f50GistUpdateSources(st, sources) {
    const op = activeCriticalOperation;
    if (op) {
      await f50ReleaseLease(op);
      if (op.uncertain || op.token.cancelled) return false;
    }
    const request = {revision:st.settings.revision};
    if (sources !== undefined) request.manualSources = normalizeStoredSubSourceList(sources).map(s=>({url:s.url,enabled:s.enabled}));
    const started = await f50GistDispatch('sync', request);
    if (!started.ok || !started.job) { createToast(safeTextToHtml(f50GistMessage(started.code)), 'red'); return false; }
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      if (op?.token.cancelled) { await f50GistExec(['cancel',started.job],15000); return false; }
      const job = await f50GistExec(['job',started.job],8000);
      if (job.status === 'finished') {
        invalidateStatusSnapshot();
        const ok = job.result?.ok === true;
        const message = ok ? 'Gist 配置已更新，手动订阅已合并' : f50GistMessage(job.result?.code)+(job.result?.warning?'\n'+f50GistMessage(job.result.warning):'');
        operationFinish(ok,message);
        createToast(safeTextToHtml(message),ok?'green':'red');
        return ok;
      }
      if (!job.ok || job.status === 'completion_unknown') {
        createToast(safeTextToHtml(f50GistMessage(job.result?.code || job.code || 'device_state_unknown')),'red'); return false;
      }
      await new Promise(resolve=>setTimeout(resolve,2000));
    }
    createToast('同步仍在设备上执行，请在 Gist 页面查看结果。','yellow');
    return false;
  }
  // Accept pasted Raw links with invisible edge characters, without relaxing the host restriction.
  const f50GistCleanUrl = value => String(value || '').replace(/^[\s\u200B-\u200D\u2060\uFEFF]+|[\s\u200B-\u200D\u2060\uFEFF]+$/g, '').replace(/\?raw=1$/, '');
  const f50GistValidUrl = value => {
    value=f50GistCleanUrl(value);
    try {
      if (value.length > 2048 || !value.startsWith('https://gist.githubusercontent.com/') || /[\s\u200B-\u200D\u2060\uFEFF\\]/.test(value)) return false;
      const u = new URL(value);
      if (u.protocol !== 'https:' || u.hostname !== 'gist.githubusercontent.com' || u.port || u.username || u.password || u.search || u.hash) return false;
      const parts = value.slice('https://gist.githubusercontent.com'.length).split('/');
      if (parts.length !== 5 && parts.length !== 6) return false;
      if (parts[0] || !/^[a-z0-9][a-z0-9-]{0,38}$/i.test(parts[1]) || !/^[a-f0-9]{5,64}$/i.test(parts[2]) || parts[3] !== 'raw') return false;
      if (parts.length === 6 && !/^[a-f0-9]{40}$/i.test(parts[4])) return false;
      const file = decodeURIComponent(parts[parts.length - 1]);
      return file.length > 0 && new TextEncoder().encode(file).length <= 255 && !/[\/\\\x00-\x1f\x7f]/.test(file) && /\.age$/i.test(file);
    } catch (_) { return false; }
  };
