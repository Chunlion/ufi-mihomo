# F50 实机测试与最小故障修复

日期：2026-10-18（Asia/Shanghai）。

## 环境与基线

- 真实中兴 F50，Android 13，ABI 为 arm64-v8a；UFI-TOOLS v4.1.5。
- Mihomo v1.19.32；插件 v9.0.0，Controller/Service 协议 8.0.0-compat.2.3。
- JS 基线为用户交付 ZIP 中的“猫猫TProxy-二轮最终版.js”。该文件比仓库原 JS 新，本轮以附件为修改基线。
- 通过现有 UFI Root 接口执行设备命令、插件按钮及实际网络请求。本机链接检查不计作设备下载。
- 测试前为 TProxy IPv4、DNS 劫持开启，已有两个设备绕过项及 Gist + age 设置；Gist 自动同步间隔为 6 小时。

## 本轮修改

1. 仅将下载源数组调整为 GitCode → Gitee → GitHub Raw。URL、失败切换、120 秒总时限、低速窗口、缓存及 ZIP 检查逻辑未改。
2. 修复组件 Service 的 IPv6 NAT 缺失分支：原脚本中的换行转义被写成了 /n，回车过滤被写成了 /r。只更正这一段 DNS helper，并将既有标记 KANO_IPV6_DNS_SPLIT 从 1 更新为 2。
3. JS 的现有 Service 补丁流程替换已安装的 v1 DNS helper，识别原来已接入的 f50_run_controller 调用；没有增加第二套兼容层、锁、重试或事务。
4. DNS 修复时的 tproxy-yq.zip 仅替换 Scripts/Clash.Service 内上述 DNS 段；其他组件保留。该阶段 ZIP 为 67,024,759 字节。

最终 JS 已通过后台现有保存接口写入设备；回读全文与本地一致，其他插件原文不变。重新加载页面后，实际载入的完整 JS 与交付文件一致。

## 下载源实测

插件在线入口两次有效更新均使用首个 GitCode 来源，下载 67,024,509 字节，通过 unzip -t。为补齐 HTTP 状态及备用源结果，另在 F50 上使用同一 curl、相同下载参数分别执行 GET；不以浏览器 HEAD 替代完整下载。

| 来源 | F50 实际结果 | 完整下载 / ZIP |
|---|---|---|
| GitCode：https://gitcode.com/Cuty/tp-yq/releases/download/v1/tproxy-yq.zip | HTTP 302 → 200，curl=0 | PASS：67,024,509 字节，unzip -t 无错误 |
| Gitee：https://gitee.com/womye/123/releases/download/v1/tproxy-yq.zip | HTTP 302 → 302 → 200，curl=0 | PASS：67,024,509 字节，unzip -t 无错误 |
| GitHub Raw：https://raw.githubusercontent.com/Chunlion/ufi-mihomo/main/tproxy-yq.zip | GET 为 HTTP 000、curl=28、0 字节，约 21 秒结束 | FAIL：下载超时，未形成可校验 ZIP |

- GitCode 未复现 401/403/404；F50 匿名 GET 可用，无需增加来源、代理或重试。
- GitHub Raw 的后续设备 HEAD 请求可达，返回 200，Content-Length 为 67,024,719。完整 GET 的首个诊断保留了退出码和下载量，但未捕获 curl stderr，因此不能进一步断言是连接阶段还是低速阶段超时，也不能认定 URL 持续失效。
- 首源实际成功，插件没有进入备用源。**NOT RUN：真实首源故障下的整条自动切换。** 已静态核对：每个来源单次尝试；失败后进入下一来源，全部失败才返回错误。
- 缓存静态核对 **PASS**：仅 allowCached=true 时检查现有非空 ZIP 并执行 unzip -t；在线安装入口明确传 false。新文件通过 ZIP 检查后才替换缓存；安装结束沿用原有缓存清理。未改缓存行为。

## 故障、修复与原用例复测

设备不具备 ip6tables nat 表。开启 TProxy IPv6 且保留 DNS 劫持时，首个相关错误为：

    sed: bad pattern '/g;/^[[:space:]]*$/d'@6 ([)
    iptables-restore: unable to initialize table 'nat/n:KANO_F50_DNS'
    F50_ERROR=ipv4_dns_apply_failed
    F50_START_OK=0

定位：组件 Scripts/Clash.Service 的 f50_ipv4_dns_rules()。仓库 ZIP 与设备实际 Service 均存在同样的错误转义；JS 的 buildF50Ipv6DnsCompatFunctions() 生成内容正确，但旧标记使其跳过了已安装的错误段。

最小修复：组件只更正 DNS 段；JS 通过原补丁入口迁移 v1 到 v2。没有关闭 DNS 劫持、删除断言或忽略失败。

复测 **PASS**：同一设备、同一 IPv6 + DNS 开启条件下，返回 F50_IPV4_DNS_VERIFIED=1、F50_START_OK=1；API 的 ipv6=true，IPv4/IPv6 TCP、UDP TProxy 规则均存在。WebUI HTTP 200，HTTP/SOCKS 代理均为 204。随后 TUN 双栈也通过，使用 Mips 和 KanoTun。

## 功能结果

| 测试项 | 结果 | 设备证据 |
|---|---|---|
| JS 语法、当前版本与源顺序 | PASS | node --check；实际载入 v9.0.0，顺序为 GitCode/Gitee/GitHub Raw |
| 已安装但停止状态的在线更新 | PASS | COMPONENTS_OK=1，installed_stopped，TRANSACTION_STATE=complete，KANO_INSTALL_OK=1 |
| 运行状态的在线更新 | PASS | OLD_RUNNING=1；更新后 installed_running、START_OK=1，事务 complete |
| 更新时保留配置、订阅与用户设置 | PASS | 停止状态更新前后核对的 8 份配置/设置内容一致；未清空用户数据 |
| Service、控制器与 Provider | PASS | Service 启动及收尾成功；API 可读，16 个 Provider 均有节点 |
| TProxy IPv4 | PASS | TCP/UDP 7895、策略规则 1776/1777 及表 17666/17667；API/WebUI/HTTP/SOCKS 检查通过 |
| TProxy IPv6 | PASS（修复后） | API ipv6=true；双栈 TProxy 规则及 IPv4 DNS 补偿通过 |
| TUN 双栈 | PASS | KanoTun 为 UP；API tun.enable=true、stack=Mips；双栈路由及代理请求通过 |
| off | PASS | 核心及显式代理继续工作；KanoTun、插件 mangle/nat 接管规则及对应策略规则均移除 |
| 停止、启动、重启核心 | PASS | 停止后无核心及接管规则；再次启动、重启后恢复，START_OK=1 |
| 恢复网络 | PASS | 返回 PROCESSES_STOPPED、F50_NETWORK_RELEASED=1、RECOVERY_VERIFIED |
| YAML 正常保存 | PASS | 原内容经现有保存入口成功写入；保存流程会整理格式，不宣称字节完全不变 |
| 无效 YAML 保存 | PASS | 输入不完整的 proxies 数组，返回 false；现有文件仍为 YAML map，Core -t 通过，核心继续运行 |
| 订阅更新 | PASS | 使用现有“更新订阅”；Gist 记录 last.ok=true、code=up_to_date |
| Gist + age 测试与实际同步 | PASS | 下载、解密、最终配置校验通过；实际同步返回“配置已更新” |
| DNS 1053 | PASS | 外部测试端 UDP 查询收到匹配事务 ID，rcode=0、3 个答案；重启后再次通过 |
| 设备绕过与策略路由 | PASS（规则/名单） | 两项名单跨模式保留；源 .248 的 ACCEPT 计数实际增长；policy verify 通过 |
| 原生 IPv6 HTTPS | PASS | 通过明确的 IPv6 DoH 地址访问，TLS 校验正常，HTTP 200、curl=0 |
| 真实重启与开机自启 | PASS | boot_id 改变；原生 Service boot 自动启动 Core PID 3781，启动、API、面板及收尾标记完整 |
| 重启后完整检查 | PASS | WebUI 200；HTTP/SOCKS 204；16 个 Provider 有节点；DNS 响应；无任务/安装锁残留 |
| 重启后 Gist 调度 | PASS | status：schedulerRunning=true、ageReady=true、identitySet=true、activationPending=false |
| 新组件 ZIP | PASS（完整性/语法） | 最终完整 ZIP 在 F50 上 unzip -t 无错误，包内 Service 通过 sh -n；DNS 段已在运行 Service 上实测 |

本地定向验证：node --test tests/tproxy/ipv6_dns.test.js，37 PASS、0 FAIL。现有 Service 补丁对原组件的迁移及第二次应用均成功，第二次未改变文件。未运行全量测试。

## 测试环境异常与边界

- 首轮浏览器请求拦截覆盖了长事务请求，出现 installation_busy、operation_busy 和停止状态。移除拦截，执行现有“恢复网络”后，按原始请求路径重测了停止及运行两种更新，均成功。该首轮结果不归为已确认的插件安装缺陷。其本轮失败暂存目录已在恢复并完成重启验证后清理；正常安装自身保留的组件回滚目录未另行删除。
- 后台厂商密码登录曾触发冷却；随后停止此类登录尝试，保留可用的 UFI 口令会话完成测试。登录冷却不计作组件下载错误；凭据未写入交付文件。
- **FAIL/未解决：** GitHub Raw 的完整设备 GET 超时；保留来源及原下载逻辑，GitCode/Gitee 可用。
- **NOT RUN：** 空白设备首次安装、破坏性安装失败注入、卸载、清空数据、设备重置。
- **NOT RUN：** 非绕过下游终端在每种模式下的完整互联网转发，以及第二个绕过设备的实际出口验证。模式 PASS 依据真实 F50 的进程、API、规则/路由、DNS 与代理请求，不扩展为所有下游设备均已验证。
- 最终 ZIP 做了设备完整性及 Service 语法检查；修复功能通过现有 JS 补丁迁移后的设备 Service 验证，没有另行重复一次最终 ZIP 整包安装。

## 最终状态与交付

- **经过真实 F50 验证**，并完成一次真实设备重启；上述 NOT RUN 项不计通过。
- 最终为 TProxy IPv4、DNS 劫持开启；原设备绕过名单保留。Gist 自动同步开启，间隔 6 小时，调度器运行。
- 仅交付完整 猫猫TProxy.js、完整 tproxy-yq.zip 和本 WORKLOG.md。

## 遗留 Gist 误报与订阅链接消失修复

本次独立复现确认是已有缺陷，不能归因于前轮测试环境异常。真实 F50 上先通过现有入口同步成功，再仅点击“重启核心”：策略指纹不变，配置指纹却改变；`x-f50-gist-sync` 被移除，HTTP Provider 字段及来源信息被改写，Gist 识别随之失效。后续同步将这次内部改写判为本地修改，订阅页也因此隐藏 Gist 概览。

原因位于 `buildF50OriginalConfigFunctions()` 生成的 `f50_restore_original_config()`：原配置完整恢复分支只处理 `subscription_original`，没有处理 Gist 使用的 `uploaded_config`。

最小修复：让带 Gist 标记的上传配置进入现有原配置恢复分支，并保留原 Provider 和来源信息。既有 helper 标记由 14 更新到 15，沿用原迁移流程。组件 ZIP 仅更新同一 Service helper；原生 Gist 程序、冲突判定及其他组件未改，没有新增锁、重试或校验机制。

| 验证项 | 结果 | 证据 |
|---|---|---|
| 原失败用例：同步后重启核心 | PASS（真实 F50） | 重启前后配置、策略指纹均相同；与已应用指纹一致，gistActive=true、activationPending=false |
| 重启后订阅设置 | PASS（真实 F50） | Gist 模式恢复，显示 1 个订阅，包含该 Provider 的链接 |
| 重启后正常“更新订阅” | PASS（真实 F50） | last.ok=true、code=up_to_date；无本地修改误报，配置和策略指纹保持不变 |
| 核心及 Provider | PASS（真实 F50） | API 200、WebUI 200、HTTP 代理 204；16 个 Provider 有节点 |
| 准备、启动、重启、开机启动配置保留 | PASS（本地定向回归） | 现有 Service 用例覆盖四条路径，断言 Gist 配置整体相同，含 HTTP Provider、手动 Provider 及来源信息；1 PASS、0 FAIL、34 SKIPPED |
| JS、组件 ZIP | PASS | node --check；包内 Service 通过 sh -n；完整 ZIP CRC 检查通过，仅 Scripts/Clash.Service 内容变化 |
| 本次修复后的真实设备重启 | NOT RUN | 本次实机复测为重启核心；开机路径由上述本地回归覆盖，不复用前轮设备重启结果冒充本次验证 |

最终 JS 已保存到 F50，回读及页面实际载入内容均与本地一致；其他插件原文保留。设备已通过现有同步入口恢复 Gist 配置，最终 Service helper 为 15。最终完整 ZIP 为 67,024,933 字节。本问题无剩余阻塞；前述下载超时及 NOT RUN 边界仍保留。

## v9.1.0-beta.1 优化清单实施

日期：2026-10-25（Asia/Shanghai），基于 020c5e9。四区代码审查（Shell 生成器 / 安装与私网 / Gist 与模板 / 面板前端）产出 90 项清单，本轮全部处置。

### 范围与处置

- 88 项落实；2 项经 ttyd 实机探测后不改：`sleep 0.1`（FANCY_SLEEP 可用）与 `iptables -w`（v1.8.8 legacy 支持）；1 项评估放弃：启动路径 secret/panel 两次 yq 探针合并会改变“secret 静默跳过、panel 硬失败”的既有语义，收益仅一次 yq 启动。
- 版本 9.0.0 → 9.1.0-beta.1；`F50_COMPAT_VERSION` 与 Service/控制器协议 8.0.0-compat.2.3 不变。净删约 340 行。

### 主要修改

- 真实缺陷：私网 textarea 空值注入示例网段；`allowDownload` 形参静默失效；`f50ReleaseLease` 成功后 `leasePromise` 残留导致同操作后续命令被设备端拒绝；Zashboard 守卫 `repaired` 误报；启动错误分类补小写 `*tun*`；本地转换失败结果补齐 type/errorType/proxyCount；`tun.stack` 纳入 CONTROLLED_TUN_KEYS；用户网段与 PRIVATE 同段时过滤后置 DIRECT 死规则；空间预估恒计 old_kb；install.journal 死文件与重复 unzip -l。
- 性能：Service 补丁五标记 + sh -n 快路径（命中即 `F50_SERVICE_PATCH_COMMITTED=1` 直接返回）；插件侧启动以 `F50_SERVICE_CAPTURED=1` 单层捕获，去掉 Service 侧二次 re-exec/双写日志；组件包下载轮询 1s→2.5s；`readYamlObject` 增加 `generatedMarker` 输出合并 4 处“读 YAML + 查生成标记”双往返；yq `--yaml-fix-merge-anchor-to-spec` 探测整页一次；preflight yq 4→3 次；`timeout 5s awk '{print}'` → `cat`；扫描结果创建时直绑事件；Gist 弹窗 MutationObserver 改轮询内 `el.isConnected`。
- 清理与统一：受保护日志清单、进程 comm 白名单、CLASH_ROOT 兜底链、开机检测 awk、zashboard 相对路径、诊断端口（含十六进制）、Service/控制器路径全部收敛为模块级 JS 常量单一来源；约 22 处防御冗余与 9 处死代码删除；`operationFinish` 改为首次写入为准，早退路径保留外层兜底收尾（新增用例锁定两种语义）。
- 测试同步：测试沙箱补注入共享常量；`expected-contracts.json` 更新 scan/firewall_plan/remove_artifacts/disable_unsupported_ipv6_dns_hijack 的契约哈希与 operations 哈希；`panel_postcheck_failed` 标签随死代码移除并入 removedLabels；探测函数改名（normalizeIpv6DnsCapability → reportIpv6NatLimitation）用例同步。

### 验证（真实 F50，Mihomo v1.19.33）

| 验证项 | 结果 | 证据 |
|---|---|---|
| node --check 与全量 node --test | PASS | 与改动前基线逐文件一致（基线既有失败均为 Windows tar/spawnSync 环境问题，与本轮无关） |
| 新版实际载入 | PASS（真实 F50） | 网络设置 DNS 端口输入框为 readonly-only（旧版 readonly+disabled 双属性）；由用户经插件功能上传后刷新页面 |
| 诊断与状态 | PASS（真实 F50） | 总览“正常”；“7788 已监听”文案来自新版 PORT_CONTROLLER 代码路径，新诊断脚本端到端跑通 |
| HTTP 7890 / SOCKS 7891 | PASS（真实 F50） | 重启前后各一次 204 |
| DNS 1053 | PASS（真实 F50） | gstatic.com / example.com 正常解析 |
| TProxy 接管 | PASS（真实 F50） | POLICY_VERIFIED=tproxy、POLICY_RULES_VERIFIED、POLICY_APPLY_OK；两台下游客机 TCP/UDP 按规则分流（内核日志） |
| Service 补丁快路径 | PASS（真实 F50） | 启动输出首行 F50_SERVICE_PATCH_COMMITTED=1，不再跑完整补丁管线 |
| 重启 / 停止 / 启动 | PASS（真实 F50） | 11.9s 完成重启；停止后无残留；再启动 16.4s 恢复，16 来源 183 节点 |
| 操作锁残留 | PASS（真实 F50） | 任务回到“空闲”，无锁残留 |

### 边界

- NOT RUN：在线安装/更新、卸载、清空数据、Gist 同步（设备生产在线，下游有活跃业务流量，避免扰动）；网络设置保存路径由本地回归与重启路径覆盖。
- ttyd 的 mount 命名空间不可见 UFI 应用私有目录，设备端文件哈希比对不可行；以页面行为特征与诊断输出作为新版载入证据。
- 两个辅助插件（USB 网络模式 v2.4.6、开机自启修复）的审查清单尚未实施，待后续轮次。

## 2026-10-26：b3c03ec 实机回归

设备为用户确认的 F50，核心 Mihomo v1.19.33；验证 main / b3c03ec 对应插件及组件。结果**未全绿**，本轮没有修改业务代码。

### 通过项目

| 项目 | 结果与证据 |
|---|---|
| 插件载入、组件升级及 Service 迁移 | PASS：实际安装事务 complete、KANO_INSTALL_OK=1；Service preservation=21；最终页面脚本与仓库一致 |
| 原配置保留 | PASS：升级及核心重启后，config.yaml、config_source.conf、Policy/options.conf 校验值与升级前备份一致 |
| 自定义配置与固定接管字段 | PASS：实际写入并重启，验证 global 模式、IPv6、自定义代理端口、日志、unified-delay、UI、DNS、sniffer、profile 保留；控制端口、DNS/TProxy 端口及 TUN 开关按设备模式纠正；结束后恢复原配置 |
| 前端与原生端口校验 | PASS：真实页面执行 TProxy/TUN/off 三种模式的 15 组检查；ARM64 测试程序在 F50 上运行 TestNormalizationUserOverrides、TestNormalizationLocalPorts，均通过 |
| 无改动保存、空订阅及失败收尾 | PASS：相同设置不改配置指纹，空订阅应用模板被前置拒绝；内部先成功、外层后失败时，实际进度界面最终显示 failed |
| Gist 测试、同步及调度 | PASS：实际下载、解密、校验成功；同步 up_to_date，loaded/runtimeVerified=true，未重复改写配置；自动同步设置及调度器最终恢复 |
| 订阅与 Gist 联合更新、操作租约 | PASS：旧 original 标记未阻断更新，读取到的 16 个 Provider 均有节点；同一操作释放租约后可继续执行设备命令，最终无锁残留 |
| TProxy IPv4、关闭透明接管 | PASS：模拟下游 HTTPS 均为 200、curl=0，规则校验通过；关闭接管时核心保持运行；结束后恢复 TProxy |
| TUN mixed / gVisor / MIPS 的 IPv4 | PASS：每种栈均实际切换，接口、带标记路由及规则校验通过，模拟下游 HTTPS 为 200、curl=0；各项结束后恢复 TProxy |
| TUN 自动选择及 IPv6 路由 | PASS（控制面）：当前核心实际选择 MIPS，IPv6 接口及返回路由存在；不代表下游 IPv6 访问通过 |
| 停止、清理及重新启动 | PASS：停止后核心数量为 0，无 KANO_F50 接管规则及 KanoTun 接口；再启动后 API 200、任务空闲 |
| 面板、DNS 及代理端口 | PASS：面板就绪，控制 API 200，A/AAAA 查询返回地址；最终 HTTP/SOCKS/混合端口访问国内 HTTPS 均为 200、curl=0 |
| 网络设置界面 | PASS：私网输入框与已保存内容一致，DNS 端口只读且未 disabled；当前保存的私网网段非空，未据此认定空值渲染已实测 |

### 未通过项目

| 项目 | 实际表现与恢复情况 |
|---|---|
| TUN system 的 IPv4 下游访问 | FAIL：设置、接口、路由、API 及规则校验通过，但模拟下游 HTTPS 超时，curl=28；原因未确认，已恢复 TProxy |
| 模拟下游 IPv6 | FAIL：TProxy/TUN 均取得 AAAA 地址，但测试 ULA 源地址的下游 HTTPS 超时，curl=28；TUN 下 F50 自身访问同一 IPv6 目标为 200、curl=0，不能据此认定全部 IPv6 出口异常；已恢复 IPv6 关闭 |
| 保存订阅并应用模板 | FAIL：两次实际应用均在订阅下载阶段返回 EOF；事务回滚成功，原配置指纹一致，原 Provider 仍已加载 |
| 海外代理连通性 | FAIL：Google/Cloudflare 请求超时，抽样节点延迟接口返回 504；节点加载成功不等于连通成功，未改动用户节点或选择 |

### 未完成验证

- 私网定向代理完整链路：静态出站表没有可直接确认的实际协议节点，22 条选择链落到表外名称，抽样单节点接口返回 404；未完成有效固定出站的保存和真实远端私网访问。
- 真实下游终端公网 IPv6：本轮下游测试使用设备内网络命名空间及测试 ULA，不能替代真实终端验证。
- 空私网网段重新打开界面：当前保存值非空，未验证该分支。
- 活跃跨页任务、浏览器崩溃及不完整回执恢复：仅实测正常租约释放与再获取，未注入这些故障。
- 新版整机重启后开机自启：仅确认原开机入口存在、核心启动正常，本轮未重启整台设备。
- 空白首次安装、卸载、清空配置、破坏性失败注入，以及其他设备、系统或核心版本：NOT RUN。

### 测试问题与耗时

- 早期路由检查漏带实际接管标记，后改用 0x10000000，确认 TUN 路由指向 KanoTun；自动栈验收按 Service 的版本探测结果确认 MIPS，没有沿用备用栈默认值。
- 测试恢复定时器继承前端任务标记，曾使停止检查返回 unreceipted_active_task。定时器退出、确认无未完成任务或锁后，正常停止/启动复测通过；后续测试定时器清除了该标记，未据此修改业务代码。
- 进度界面的实测使用正式支持的操作名称；自定义测试名称不会启用进度卡片。
- 早期测试错误地提前调整电脑 Sparkle TUN，已恢复原状态；TProxy 验证不需要修改电脑网卡。用户明确电脑代理走 F50 后，未再调整电脑网卡或代理设置。
- 快速模式切换单项总耗时 21.827–43.381 秒，正常停止/核对/再启动共 43.107 秒，两次模板应用含回滚分别为 69.836 秒、69.899 秒。这些包含检查、请求和恢复，不能当作连续断网时长；未采集持续丢包数据。

### 最终状态

F50 恢复 TProxy、IPv6 关闭、tun_stack=auto、规则模式，只有一个核心进程；三个原文件校验值不变，面板及 API 正常，无操作锁、安装锁、测试接口或活动 Gist 作业。Gist 自动同步开启、间隔 6 小时、调度器运行，原密钥和地址保留。正式插件与仓库一致，临时测试入口已移除，其他插件设置未变。逐项测试证据仅本地留存，未提交设备配置、凭据或原始设备日志。

## 2026-10-27：历史改动交叉路径修复

向前审查 GistSync 与配置处理路径，隔离复现并修复三类问题：

- 原生 Gist 应用强制切到 rule，与用户 global/direct 模式冲突，连回滚也会失败并残留事务。应用及回滚现沿用各自配置的模式，缺省仍为 rule。
- “保存并更新”提前覆盖手动订阅列表，候选校验或配置应用失败后列表未恢复。新列表现先参与候选生成，随现有已验证事务收尾后保存；中断可继续收尾，并保留并发编辑保护。配置不变时，仅在检查成功后保存列表，不重载核心。
- 原生私网校验仍限制选择链 32 层、策略名 128 字符，与前端不一致。移除这两项限制，保留环检测、非法字符、出站类型及网段校验。

验证：WSL 原生完整测试 `go test ./... -count=1` 通过；新增 global/direct 应用与回滚、五个事务失败阶段、收尾恢复、禁用及空列表、并发编辑保护、64 层选择链与环检测、200 字符策略名的回归用例。末次无配置变更分支调整后，定向测试通过。

已用 Go 1.24.4 重建 ARM64/AMD64 程序及完整组件包，打包校验通过。本轮没有部署到 F50，没有修改电脑网络；这些结果为本地隔离验证，不替代实机验证，也未关闭上一节记录的实机失败项。
