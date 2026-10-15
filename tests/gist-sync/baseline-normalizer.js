const F50_ZASHBOARD_UI_URL = 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip';
const F50_PORTS = {http:7890, socks:7891, mixed:7892, tproxy:7895, dns:1053, controller:7788};
const F50_MIPS_MIN_VERSION = '1.19.31';
function f50TunStack(options = {}) {
  const stack = options.tun_stack || 'auto';
  if (!['auto', 'mixed', 'gvisor', 'system', 'mips'].includes(stack)) throw new Error('TUN 协议栈无效');
  return stack === 'auto' ? (options.ipv6 === 'on' ? 'gvisor' : 'mixed') : stack;
}
const F50_DEFAULT_SECRET = '123456';
// 深合并：plain object 递归合并，数组直接整体替换；返回全新对象，不修改入参。
function f50IsPlainObject(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
function f50DeepClone(v) {
  if (Array.isArray(v)) return v.map(f50DeepClone);
  if (f50IsPlainObject(v)) { const o = {}; for (const k of Object.keys(v)) Object.defineProperty(o, k, {value:f50DeepClone(v[k]),enumerable:true,writable:true,configurable:true}); return o; }
  return v;
}
function f50DeepMerge(base, delta) {
  if (Array.isArray(delta)) return f50DeepClone(delta);
  if (f50IsPlainObject(delta)) {
    const out = {};
    if (f50IsPlainObject(base)) for (const k of Object.keys(base)) Object.defineProperty(out, k, {value:f50DeepClone(base[k]),enumerable:true,writable:true,configurable:true});
    for (const k of Object.keys(delta)) {
      const bv = f50IsPlainObject(base) ? base[k] : undefined;
      Object.defineProperty(out, k, {value:(f50IsPlainObject(bv) && f50IsPlainObject(delta[k])) ? f50DeepMerge(bv, delta[k]) : f50DeepClone(delta[k]),enumerable:true,writable:true,configurable:true});
    }
    return out;
  }
  return f50DeepClone(delta);
}
const PROFILE_BASE = {"allow-lan":true,"dns":{"default-nameserver":["223.5.5.5","119.29.29.29"],"direct-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"direct-nameserver-follow-policy":true,"enable":true,"enhanced-mode":"redir-host","nameserver":["https://1.1.1.1/dns-query#RULES","https://8.8.8.8/dns-query#RULES"],"nameserver-policy":{"+.lan":["223.5.5.5","119.29.29.29"],"+.local":["223.5.5.5","119.29.29.29"]},"prefer-h3":false,"proxy-server-nameserver":["https://dns.alidns.com/dns-query","https://doh.pub/dns-query"],"respect-rules":false,"use-hosts":true,"use-system-hosts":false},"external-controller":`0.0.0.0:${F50_PORTS.controller}`,"external-ui":"WebUI/zashboard","find-process-mode":"off","geo-auto-update":false,"geodata-loader":"memconservative","geodata-mode":true,"log-level":"info","mixed-port":F50_PORTS.mixed,"mode":"rule","port":F50_PORTS.http,"profile":{"store-fake-ip":false,"store-selected":true},"redir-port":0,"sniffer":{"enable":true,"force-dns-mapping":true,"override-destination":true,"parse-pure-ip":true,"skip-domain":["Mijia Cloud","dlg.io.mi.com"],"skip-dst-address":["0.0.0.0/8","10.0.0.0/8","100.64.0.0/10","127.0.0.0/8","169.254.0.0/16","172.16.0.0/12","192.168.0.0/16","::1/128","fc00::/7","fe80::/10"],"sniff":{"HTTP":{"override-destination":true,"ports":[80,"8080-8880"]},"QUIC":{"override-destination":true,"ports":[443,8443]},"TLS":{"override-destination":true,"ports":[443,8443]}}},"socks-port":F50_PORTS.socks,"secret":F50_DEFAULT_SECRET};
const PROFILE_DELTA = {
  "tproxy4": {"bind-address":"0.0.0.0","dns":{"ipv6":false,"listen":`0.0.0.0:${F50_PORTS.dns}`},"ipv6":false,"tproxy-port":F50_PORTS.tproxy,"tun":{"enable":false}},
  "tproxy6": {"bind-address":"*","dns":{"ipv6":true,"listen":`[::]:${F50_PORTS.dns}`},"ipv6":true,"tproxy-port":F50_PORTS.tproxy,"tun":{"enable":false}},
  "tun4": {"bind-address":"0.0.0.0","dns":{"ipv6":false,"listen":`0.0.0.0:${F50_PORTS.dns}`},"ipv6":false,"tproxy-port":0,"tun":{"auto-detect-interface":true,"auto-redirect":false,"auto-route":false,"device":"KanoTun","dns-hijack":[],"enable":true,"mtu":1500,"stack":"mixed","strict-route":false}},
  "tun6": {"bind-address":"*","dns":{"ipv6":true,"listen":`[::]:${F50_PORTS.dns}`},"ipv6":true,"tproxy-port":0,"tun":{"auto-detect-interface":true,"auto-redirect":false,"auto-route":false,"device":"KanoTun","dns-hijack":[],"enable":true,"inet6-address":["fdfe:dcba:9876::1/126"],"mtu":1500,"stack":"gvisor","strict-route":false}},
  "off4": {"bind-address":"0.0.0.0","dns":{"ipv6":false,"listen":`0.0.0.0:${F50_PORTS.dns}`},"ipv6":false,"tproxy-port":0,"tun":{"enable":false}},
  "off6": {"bind-address":"*","dns":{"ipv6":true,"listen":`[::]:${F50_PORTS.dns}`},"ipv6":true,"tproxy-port":0,"tun":{"enable":false}},
};
const F50_FIXED_PROFILES = {};
for (const name of Object.keys(PROFILE_DELTA)) F50_FIXED_PROFILES[name] = f50DeepMerge(PROFILE_BASE, PROFILE_DELTA[name]);
for (const profile of Object.values(F50_FIXED_PROFILES)) {
  profile['external-ui'] = 'WebUI/zashboard';
  profile['external-ui-url'] = F50_ZASHBOARD_UI_URL;
  profile['unified-delay'] = true;
  delete profile['external-ui-name'];
}
// Controller protocol and wrapper contract; independent of the plugin release version.
const F50_COMPAT_VERSION = '8.0.0-compat.2.3';
const F50_ORIGINAL_MANAGED_KEYS = ['mode', 'port', 'socks-port', 'mixed-port', 'redir-port', 'tproxy-port', 'allow-lan', 'bind-address', 'ipv6', 'external-controller', 'external-ui', 'external-ui-url'];
const F50_ORIGINAL_DNS_KEYS = ['enable', 'listen', 'ipv6'];
const F50_ORIGINAL_TUN_KEYS = [...new Set(Object.values(PROFILE_DELTA).flatMap((profile) => Object.keys(profile.tun)))];

function createPrivateRouteLogic() {
  'use strict';
  const PRIVATE = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'fc00::/7'];
  const META = 'x-kano-private-route';
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function address(bits, family) {
    if (family === 4) return bits.match(/.{8}/g).map((b) => parseInt(b, 2)).join('.');
    const groups = bits.match(/.{16}/g).map((b) => parseInt(b, 2).toString(16));
    let best = -1, length = 1;
    for (let i = 0; i < 8;) {
      if (groups[i] !== '0') { i++; continue; }
      let j = i; while (j < 8 && groups[j] === '0') j++;
      if (j - i > length) { best = i; length = j - i; }
      i = j;
    }
    return best < 0 ? groups.join(':') : groups.slice(0, best).join(':') + '::' + groups.slice(best + length).join(':');
  }
  function cidr(value) {
    const text = String(value == null ? '' : value).trim();
    const parts = text.split('/');
    if (!parts[0] || parts.length > 2 || (parts.length === 2 && !/^(0|[1-9]\d{0,2})$/.test(parts[1]))) throw new Error('Invalid IP/CIDR: ' + text);
    let raw = parts[0], family = raw.includes(':') ? 6 : 4, bits;
    if (family === 4) {
      const octets = raw.split('.');
      if (octets.length !== 4 || octets.some((s) => !/^(0|[1-9]\d{0,2})$/.test(s) || Number(s) > 255)) throw new Error('Invalid IPv4: ' + text);
      bits = octets.map((s) => Number(s).toString(2).padStart(8, '0')).join('');
    } else {
      if (raw.includes('.')) {
        const pos = raw.lastIndexOf(':');
        const v4 = cidr(raw.slice(pos + 1));
        if (v4.family !== 4) throw new Error('Invalid embedded IPv4');
        raw = raw.slice(0, pos + 1) + [v4.bits.slice(0, 16), v4.bits.slice(16)].map((b) => parseInt(b, 2).toString(16)).join(':');
      }
      if (!/^[0-9a-f:]+$/i.test(raw) || raw.split('::').length > 2) throw new Error('Invalid IPv6: ' + text);
      const halves = raw.split('::');
      const left = halves[0] ? halves[0].split(':') : [];
      const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
      if ([...left, ...right].some((s) => !/^[0-9a-f]{1,4}$/i.test(s)) ||
          (halves.length === 1 ? left.length !== 8 : left.length + right.length >= 8)) throw new Error('Invalid IPv6: ' + text);
      bits = [...left, ...Array(8 - left.length - right.length).fill('0'), ...right]
        .map((s) => parseInt(s, 16).toString(2).padStart(16, '0')).join('');
    }
    const width = family === 4 ? 32 : 128;
    const prefix = parts.length === 2 ? Number(parts[1]) : width;
    if (prefix > width) throw new Error('Invalid prefix: ' + text);
    bits = bits.slice(0, prefix).padEnd(width, '0');
    return { family, prefix, bits, text: address(bits, family) + '/' + prefix };
  }
  const contains = (a, b) => a.family === b.family && a.prefix <= b.prefix && a.bits.slice(0, a.prefix) === b.bits.slice(0, a.prefix);
  const overlaps = (a, b) => contains(a, b) || contains(b, a);
  function compact(values) {
    const nets = values.map((v) => typeof v === 'string' ? cidr(v) : v)
      .sort((a, b) => a.family - b.family || a.prefix - b.prefix || a.bits.localeCompare(b.bits));
    const result = [];
    for (const n of nets) if (!result.some((p) => contains(p, n))) result.push(n);
    return result.sort((a, b) => a.family - b.family || a.bits.localeCompare(b.bits) || a.prefix - b.prefix).map((n) => n.text);
  }
  function subtractOne(base, cut) {
    if (!overlaps(base, cut)) return [base.text];
    if (contains(cut, base)) return [];
    return ['0', '1'].flatMap((bit) => {
      const bits = (base.bits.slice(0, base.prefix) + bit).padEnd(base.bits.length, '0');
      return subtractOne(cidr(address(bits, base.family) + '/' + (base.prefix + 1)), cut);
    });
  }
  function subtract(bases, exceptions) {
    let result = compact(bases);
    for (const target of exceptions.map(cidr)) {
      result = result.flatMap((base) => subtractOne(cidr(base), target));
      if (result.length > 4096) throw new Error('CIDR expansion exceeds 4096 entries');
    }
    return compact(result);
  }
  function normalize(input = {}) {
    const enabled = input.enabled === true || input.enabled === 'on';
    const raw = Array.isArray(input.cidrs) ? input.cidrs : String(input.cidrs || '').replace(/#[^\n]*/g, '').split(/[\s,;]+/);
    const values = raw.map((v) => String(v).trim()).filter(Boolean);
    if (values.length > 64) throw new Error('最多配置 64 个私网网段');
    const cidrs = compact(values);
    for (const n of cidrs) if (!PRIVATE.some((p) => contains(cidr(p), cidr(n)))) {
      throw new Error('仅支持 IPv4 RFC1918 或 IPv6 ULA（fc00::/7）：' + n);
    }
    const policy = String(input.policy || '').trim();
    if (policy.length > 128 || /[,\r\n\x00-\x1f\x7f]/.test(policy)) throw new Error('代理组名含不支持的字符');
    if (enabled && (!cidrs.length || !policy)) throw new Error('启用前请填写网段并选择代理出站');
    if (enabled && ['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE', 'GLOBAL'].includes(policy.toUpperCase())) throw new Error('不能选择内置策略 ' + policy);
    return { enabled, cidrs, policy };
  }
  function fromOptions(o = {}) {
    return normalize({ enabled: o.private_route_enabled, cidrs: o.private_route_cidrs || '', policy: o.private_route_policy || '' });
  }
  function checkConnected(state, connected) {
    for (const t of state.cidrs.map(cidr)) for (const item of connected) {
      const local = cidr(typeof item === 'string' ? item : item.cidr);
      if (overlaps(t, local)) throw new Error('远端网段 ' + t.text + ' 与 F50 直连网段 ' + local.text + ' 重叠');
    }
  }
  function strip(config) {
    const out = clone(config), meta = out[META];
    if (!meta || ![1, 2].includes(meta.version)) return out;
    const rules = Array.isArray(out.rules) ? out.rules.slice() : [];
    const inserted = Array.isArray(meta.rules) ? meta.rules : [];
    if (inserted.every((r, i) => rules[i] === r)) rules.splice(0, inserted.length);
    else for (const r of inserted) { const i = rules.indexOf(r); if (i >= 0) rules.splice(i, 1); }
    if (rules.length || meta.rulesPresent !== false) out.rules = rules; else delete out.rules;
    for (const [key, saved] of Object.entries(meta.tun || {})) {
      if (!out.tun || !equal(out.tun[key], saved.applied)) continue;
      if (saved.present) out.tun[key] = clone(saved.before); else delete out.tun[key];
    }
    if (out.tun && !Object.keys(out.tun).length && meta.tunPresent === false) delete out.tun;
    delete out[META];
    return out;
  }
  function list(tun, key) {
    if (tun[key] == null) return [];
    if (!Array.isArray(tun[key]) || tun[key].some((v) => typeof v !== 'string')) throw new Error('tun.' + key + ' must be a string array');
    return tun[key];
  }
  function transform(config, input, mode = 'tproxy', connected = []) {
    const state = normalize(input);
    if (!['tproxy', 'tun', 'off'].includes(mode)) throw new Error('Invalid traffic mode');
    const out = strip(config);
    if (!state.enabled || mode === 'off') return out;
    checkConnected(state, connected);
    if (String(out.mode || 'rule').toLowerCase() !== 'rule') throw new Error('私网定向代理需要 Mihomo 规则模式');
    if (state.cidrs.some((n) => cidr(n).family === 6) && out.ipv6 !== true) throw new Error('远端网段包含 IPv6，请先勾选 IPv6 接管');
    const groups = out['proxy-groups'] || [], proxies = out.proxies || [];
    if (!Array.isArray(groups) || !Array.isArray(proxies)) throw new Error('Invalid proxy definitions');
    const target = [...groups, ...proxies].find((p) => p && p.name === state.policy);
    if (!target) throw new Error('配置中不存在出站：' + state.policy);
    if (['direct', 'reject', 'reject-drop', 'pass'].includes(String(target.type || '').toLowerCase())) throw new Error('所选出站不是代理');
    if (own(out, 'rules') && !Array.isArray(out.rules)) throw new Error('rules must be an array');
    const meta = { version: 2, mode, cidrs: state.cidrs, policy: state.policy, rules: [], tun: {}, rulesPresent: own(out, 'rules'), tunPresent: own(out, 'tun') };
    const rule = (n, policy) => (cidr(n).family === 4 ? 'IP-CIDR,' : 'IP-CIDR6,') + n + ',' + policy + ',no-resolve';
    meta.rules = [...state.cidrs.map((n) => rule(n, state.policy)), ...PRIVATE.map((n) => rule(n, 'DIRECT'))];
    out.rules = [...meta.rules, ...(out.rules || [])];
    if (mode === 'tun') {
      if (out.tun != null && (typeof out.tun !== 'object' || Array.isArray(out.tun))) throw new Error('tun must be an object');
      const tun = out.tun || (out.tun = {});
      const set = (key, value) => {
        meta.tun[key] = { present: own(tun, key), ...(own(tun, key) ? { before: clone(tun[key]) } : {}), applied: clone(value) };
        tun[key] = value;
      };
      const excluded = [...PRIVATE, ...list(tun, 'route-exclude-address'),
        ...list(tun, 'inet4-route-exclude-address'), ...list(tun, 'inet6-route-exclude-address')];
      set('route-exclude-address', subtract(excluded, state.cidrs));
      for (const key of ['inet4-route-exclude-address', 'inet6-route-exclude-address']) if (own(tun, key)) set(key, []);
      const included = [...list(tun, 'route-address'), ...list(tun, 'inet4-route-address'), ...list(tun, 'inet6-route-address')];
      if (included.length) {
        set('route-address', compact([...included, ...state.cidrs]));
        for (const key of ['inet4-route-address', 'inet6-route-address']) if (own(tun, key)) set(key, []);
      }
      set('dns-hijack', []);
    }
    out[META] = meta;
    return out;
  }
  function runtime(config, options = {}, connected = [], preserveConfig = false) {
  const source = strip(config);
  const mode = options.traffic_mode || 'tproxy';
  if (!['tproxy', 'tun', 'off'].includes(mode)) throw new Error('Invalid traffic mode');
  const profile = F50_FIXED_PROFILES[mode + (options.ipv6 === 'on' ? '6' : '4')];
  const out = clone(preserveConfig ? source : profile);
  for (const key of Object.keys(source)) {
    if (key.startsWith('x-') && !own(out, key)) out[key] = clone(source[key]);
  }
  for (const key of preserveConfig ? F50_ORIGINAL_MANAGED_KEYS : ['proxies', 'proxy-providers', 'proxy-groups', 'rules', 'rule-providers', 'sub-rules', 'hosts', 'secret', 'x-f50-provider-sources']) {
    if (preserveConfig) out[key] = clone(profile[key]);
    else if (own(source, key)) out[key] = clone(source[key]);
  }
  if (preserveConfig) {
    out.dns = clone(source.dns || profile.dns);
    out.tun = clone(source.tun || {});
    if (!f50IsPlainObject(out.dns) || !f50IsPlainObject(out.tun)) throw new Error('dns and tun must be mappings');
    for (const key of F50_ORIGINAL_DNS_KEYS) out.dns[key] = clone(profile.dns[key]);
    for (const key of F50_ORIGINAL_TUN_KEYS) {
      if (own(profile.tun, key)) out.tun[key] = clone(profile.tun[key]);
      else delete out.tun[key];
    }
    for (const key of ['external-controller-tls', 'external-controller-unix', 'external-controller-pipe', 'external-ui-name', 'interface-name', 'routing-mark']) delete out[key];
  }
  if (!preserveConfig && own(source.dns || {}, 'proxy-server-nameserver-policy')) {
    out.dns['proxy-server-nameserver-policy'] = clone(source.dns['proxy-server-nameserver-policy']);
  }
  if (mode === 'tun') out.tun.stack = f50TunStack(options);
  if (own(out,'proxies') && !Array.isArray(out.proxies)) throw new Error('proxies must be a list');
  if (!own(out,'proxies')) out.proxies = [];
  if (own(out,'proxy-groups') && !Array.isArray(out['proxy-groups'])) throw new Error('proxy-groups must be a list');
  if (!own(out,'proxy-groups')) out['proxy-groups'] = [];
  if (own(out,'rules') && !Array.isArray(out.rules)) throw new Error('rules must be a list');
  if (!own(out,'rules')) out.rules = ['MATCH,DIRECT'];
  for (const key of ['proxies','proxy-groups']) for(const node of out[key] || []) {
    if(node && typeof node==='object'){delete node['interface-name'];delete node['routing-mark'];}
  }
  for(const key of ['proxy-providers','rule-providers']) for(const provider of Object.values(out[key]||{})) {
    if(provider && typeof provider==='object'){
      if(provider.override){delete provider.override['interface-name'];delete provider.override['routing-mark'];}
      if(!preserveConfig && key==='rule-providers' && provider.type==='http')provider.proxy='DIRECT';
    }
  }
  for (const name of ['cn_domain', 'private_domain', 'add_direct_domain']) {
    if (!preserveConfig && out['rule-providers']?.[name]?.behavior === 'domain') {
      out.dns['nameserver-policy']['rule-set:' + name] = ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'];
    }
  }
  out['x-f50-profile'] = '8.0.0-compat.2.3';
  // Kernel routing belongs to clashctl; TUN still needs its matching route exclusions.
  const feature = fromOptions(options);
  if (!feature.enabled || mode === 'off') return out;
  return transform(out, feature, mode, connected);
}
  function resolveSelection(proxies, name) {
    const visited = new Set();
    let current = name;
    for (let i = 0; i < 32; i++) {
      if (visited.has(current)) throw new Error('Proxy group cycle: ' + current);
      visited.add(current);
      if (['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE'].includes(String(current).toUpperCase())) throw new Error('代理组当前指向 ' + current);
      const value = proxies[current];
      if (!value) throw new Error('核心未加载出站 ' + current);
      if (value.now) { current = value.now; continue; }
      if (['direct', 'reject', 'reject-drop', 'pass', 'compatible'].includes(String(value.type || '').toLowerCase())) throw new Error('所选出站为直连或拒绝');
      if (Array.isArray(value.all) || /^(selector|select|urltest|fallback|loadbalance|relay)$/i.test(String(value.type || '').replace(/[-_]/g, ''))) throw new Error('请选择固定节点或能确认当前出站的手动选择组');
      return current;
    }
    throw new Error('Proxy group nesting exceeds 32');
  }
  return { PRIVATE, META, cidr, address, compact, contains, overlaps, subtract, normalize, fromOptions, checkConnected, strip, transform, runtime, resolveSelection };
}

module.exports={profiles:F50_FIXED_PROFILES,KPR:createPrivateRouteLogic()};
