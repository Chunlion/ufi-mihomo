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

## 2026-11-04：实机测试前最终独立复审（本轮结论）

### 结论与交付使用

**本轮范围内可以开始 F50 实机测试；四项确认的 Gist 配置缺陷已修复，没有剩余的本轮必修阻塞。** 这不是全部设备功能已通过验收。正式组件安装/升级、核心启停、真实流量下的模式切换和公网订阅/Gist 下载仍须验证。

以实际附件 `maomao-tproxy-independent-review-2026-11-04.zip` 为 JS 基线；磁盘没有请求正文所写的 `(1).zip`。该附件仅有 JS、boot_readiness.test.js、WORKLOG，未含组件包、配置专项测试或逐项原始报告。文档中的历史结论不计作本轮结果。本轮没有审查或修改自启实现、boot 脚本、kano_boot_guard.sh 或 Service 的开机入口；附件的自启测试文件不纳入本轮交付。

**继续使用原附件的猫猫TProxy.js，配套使用本次更新的 tproxy-yq.zip。JS 本轮未修改，因此不重复打包。** 本机仓库的 JS 仍为原有版本，没有用附件覆盖用户工作区；本轮 Git 仅提交下列 native 源码、定向用例、组件 ZIP 和本节日志。缺失的上一轮配置测试从本机已有独立目录取回，已检查断言并重新运行，作为复现材料随 ZIP 提供，不将其改称本轮新实现。

### 确认的问题与修复

上一轮主要修复了 JS 与 Service 的配置处理，但组件内 GistSync 的 Go 规范化器仍使用旧规则。真实调用链是 `candidate → normalizeConfig → 核心校验 → 提交`，不是只存在于未使用代码中的差异。

| 问题 | 修复后行为 | 复现证据 |
| --- | --- | --- |
| HTTP Rule Provider 明确指定的 proxy 被强制改为 DIRECT | 仅在缺失 proxy 时补 DIRECT，保留显式值 | 新增 24 个模式/IPv6/字段边界子用例中的 6 项；修复前全部失败，修复后通过 |
| 只指定 mixed-port:7890 的有效配置与自动补齐的 HTTP 7890 冲突 | 关闭冲突的缺省监听器；保留显式端口及显式冲突检查 | 同上，6 项 |
| 合法的 proxies/proxy-groups/rules:null 被拒绝 | 保留显式 null，遍历时视为空集合；错误的非 null 类型仍拒绝 | 同上，6 项；断言字段存在、值、幂等性及输入未修改 |
| sniffer/profile:null 被替换成默认对象 | 保留显式 null，不改变缺失字段的默认行为 | 同上，6 项；断言字段存在而非仅检查取值为 nil |

生产 Go 改动为 20 行新增、2 行删除，没有新锁、重试、抽象或依赖。测试新增于已有 normalize_test.go。固定默认控制密钥、现有密钥保留逻辑、Controller/Service 协议、Mihomo 版本和网络接管方式未改。

组件只更新三个成员：`Tools/kano-gist-sync`、`Tools/gist-sync-component.json`、`Tools/components.json`。ARM64 二进制由上述源码使用 Go 1.24.4 构建，组件版本保持 1.0.0-rc4、协议保持 1；两处清单中的文件哈希已更新并核对。Service、Controller、age、yq、Mihomo 核心、模板和其他成员逐字节相同。ZIP CRC 检查通过。

### 上一轮修改的独立复核

以下实现经读取实际代码与专项执行确认，本轮无需重复修改：

- 数组整体替换的深合并、未知字段/原型名字段保留、Unicode YAML 标量转义、重复键拒绝及 Anchor/Alias/Merge Key 显式键优先。
- Provider 绑定保留独立别名、filter/override/header/health-check 和手动 file/inline 定义，策略组 use 的子集、顺序及重复项保持；本地缓存转换不等于删除原始 HTTP 定义。
- 受管 DNS/TUN 子键与用户参数的边界、null sniffer/profile、端口缺省冲突、模板/上传/历史订阅/Gist 来源恢复以及保存密钥的现有实现。
- Service 版本迁移、重复补丁幂等、无效配置回滚和来源标记同步。未找到应为追求体积而删除的确定无用生产代码，不进行体积重构。
- Gist 的 parseJSON 已逐键拒绝重复 JSON 键；不能仅因其 yq 表达式不同就重复增加一套校验。原有配置和错误恢复机制保留。

### 本轮实际测试结果

| 项目与命令 | 结果 | 边界 |
| --- | --- | --- |
| `node --check 猫猫TProxy.js` | PASS | 检查实际附件 JS，未修改 JS |
| `node scripts/verify_plugin.js`，测试工具与历史 Git 对象补齐后，使用名称筛选尝试排除 boot/autostart | **838 PASS / 3 FAIL / 10 SKIP** | 三项失败均是排除范围的自启测试夹具引用缺失常量；没有据此审计或修复自启。不得把此结果写成全套 PASS。10 个可选配置测试在专项命令另行执行 |
| `node --test --test-concurrency=1 tests/tproxy/config_semantics.test.js tests/tproxy/config_lifecycle.test.js tests/tproxy/config_recovery.test.js`，真实 yq、Controller、Mihomo 1.19.32 | **61 PASS / 0 FAIL / 0 SKIP** | 生命周期保存、来源切换、失败恢复与真实 Controller 集成均实际执行 |
| `node --test tests/tproxy/config_recovery.test.js`，Mihomo 1.19.33、真实 ARM64 Controller 经 QEMU | **34 PASS / 0 FAIL / 0 SKIP** | 包含两份真实配置、template/uploaded/legacy/Gist 分支；HTTP 下载正文由本地 fixture 提供，不是公网请求 |
| 4 分片 `node --test tests/tproxy/real_templates.test.js` | **97 PASS / 0 FAIL / 0 SKIP** | 93 个样本子测试 + 4 个父测试；分类排除不是标准核心通过 |
| 真实 Mihomo 1.19.32 原始/处理后配置检查 | **149 次；69/69 原始可通过样本处理后仍通过** | 75 原始 + 74 处理后；原始失败详见下节 |
| 使用已导出的同批配置重新执行 Mihomo 1.19.33 `-t` | **149 次；69/69 原始可通过样本处理后仍通过** | 与组件同版本的官方 Linux AMD64 核心；没有改包内 Android 核心 |
| `go test -json -count=1 -skip '(?i)boot\|daemon' ./...`，gist-sync/native | **252 PASS / 0 FAIL / 1 SKIP** | 统计包含父测试与子测试；唯一 SKIP 是原有 TestRealF50Hardware 占位用例。其常量跳过不会因手动设备测试而变成 PASS |
| `go test -run TestFinalReviewConfigBoundaries -count=1` | PASS，24 子用例 | 最终断言含 null 字段存在性、重复处理与输入不变 |
| 使用更新后 Gist 二进制/清单的安装及发布定向测试 | **50 PASS / 0 FAIL / 0 SKIP** | 43 项安装模拟 + 7 项发布一致性；不是设备整包安装 |
| F50 上执行 ARM64 定向测试二进制 `-test.run TestFinalReviewConfigBoundaries -test.v` | **24 子用例 PASS** | 在真实 Android ARM64 执行修复后的规范化函数；不是一次公网 Gist 同步 |
| F50 临时目录的六模式配置生命周期 | **12 个完整周期 PASS** | 每模式两轮真实 Controller prepare、Service 配置恢复、Android Mihomo 校验、全字段比较；未启动测试核心或下发接管规则 |
| F50 当前运行配置的核心 `-t`、API、面板、显式代理 | PASS：API 200、面板 200、代理 204 | 设备主插件及 Gist 程序随后已替换并复查；未进行整包安装 |
| 包内 Service 与本次 JS 生成的相关 Shell `sh -n`、ZIP 成员/清单一致性、最终 Git Diff | PASS | 不包含自启功能审计 |

已查明的执行失败：首次缺少历史 Git 对象使测试夹具无法装载，补齐对象后相应用例通过；首次 Go 全套缺少真正的 AMD64 age/age-keygen，补齐已有官方组件后通过；一次核心路径被宿主转义为不存在路径，纠正路径后 34 项通过。设备首个 TUN 配置夹具没有正确配置 Service 的栈修正调用及明确栈选择，补齐既有调用序列后六模式字段检查通过。这些是执行准备/夹具问题，不改生产断言来制造 PASS。最终留下的三项全套 FAIL 属于明确排除范围，不作本轮自启功能结论。

### Mihomo 真实模板覆盖

来源：HenryChiao/MIHOMO_YAMLS 固定 `982bf8104b123c4b9cb9f36431bd4acdb33191da`。目录逐路径检查共 93 份 THEYAMLS：88 份可解析，其中 75 份标准候选、13 份 Smart-only；其余 5 份为已确认的上游非法 YAML/非映射输入。13 份 Smart 仅检查语义读写，**未声称通过标准 Mihomo**。Overwrite 的 71 个 YAML 包装片段、80 个 Shell conf、101 个 INI 按格式排除，未伪装成独立模板通过。

75 个标准候选中，一份 `Repcz/config_lite.yaml` 的 Subscribe 是 sequence，规范化必须拒绝，未生成处理后配置。其余 74 份实际执行模板规范化及两种保留分支的生命周期；43 份模板中的 88 个空/非法订阅占位符仅在测试副本填入不同 fixture.invalid URL。不能将它们称为真实订阅下载成功。

核心原始 75 次检查中 69 PASS，6 次失败；处理后 74 次检查中 69 PASS，5 次失败。两版核心的结果一致：

- `Ayanami0_config_geo-lite.yaml`、`qichiyuhub/fuxie.yaml`、`qichiyuhub/proxychain.yaml`：原始输入引用问题，处理后仍未通过。
- `Repcz/config_lite.yaml`：前述错误 Provider 类型，拒绝规范化，只有原始核心失败。
- `Lanlan13-14/configfull_lite.yaml`：离线资源限制。
- `liandu2024/clash-fallback-std.yaml`：OpenClash 的绝对 UI 路径超出宿主运行目录。

核心检查使用实际 yq v4.53.3、官方核心及本地 Provider/规则 fixture、包内 GeoIP/GeoSite 与 MaxMind 测试 MMDB；通过 seccomp 禁止 IPv4/IPv6 外联。Provider 的 type/path/url 被明确投影为本地文件，其他参数保留。因此验证配置消费能力，**不验证公网 Provider、订阅服务器或 IP 定位准确性**。包内 ARM64 yq 在设备生命周期实际执行，不把其余批量 AMD64 yq 检查称为 ARM64 原程序全量运行。

### 配置生命周期与模拟边界

本轮重新得到 4,840 个阶段比较、12,448 个有明确路径/预期值原因的变化记录，非预期差异 0。原始解析、深合并及输入不变、模板规范化、必需字段、网络整形、重复处理、实际写回再读取均有检查。模式序列为 `tproxy4 → tun6 → off4 → tproxy6 → tun4 → off6 → tproxy4`，包括数组顺序、DNS/节点 DNS 策略、Provider/组引用和未知字段。

批量 Service 的 888 个阶段以 Controller 输出 fixture 驱动，实际执行生产生成 Shell/真实 yq；并非 888 次真实 Controller。真实 Controller 集成另外执行两份代表配置及四种来源分支。F50 上还执行六模式各两轮真实 Controller、配置恢复及 Android v1.19.33 校验。Service 的既有 TUN 栈校正属于调用链的一部分，不能省略后把中间态 mixed 误报为最终配置漂移。

GistSync 原有 120 种模式组合差分用例的参考是历史 baseline-normalizer 快照，不能证明它与本次附件新增行为一致。本轮因此新增四组有独立预期值的定向用例，修复前失败、修复后通过。Go 套件确实使用真实 age 加解密，但下载、Controller/Service 状态和错误注入多数为 fixture，不能等同于生产 Gist 服务已验证。

### F50 设备结果与待验证项目

已通过设备的临时目录执行验证；正式配置、options、来源标记与 Service 和测试前备份逐字节一致。当前核心持续运行，最终 TProxy/IPv4/DNS 劫持设置保留。备份位于 `/data/local/tmp/maomao-final-review-20261104/`，含敏感配置，仅留在设备；未下载到交付包。用户随后明确要求替换原插件，已通过宿主保存接口原位替换设备中唯一的猫猫TProxy 主插件，没有增加第二个插件；宿主回读的主插件正文与附件一致，刷新后的实际执行正文也逐字节一致。其他插件代码保持一致，宿主保存仅裁剪了文档末尾空白。配套 GistSync ARM64 程序及两处清单已更新，程序与本次构建产物逐字节一致。调度器原为停止状态，更新后保持停止；ageReady 和 identitySet 均为 true。替换后 API、面板再次返回 200，原核心仍运行。没有整包安装、重启核心、修改 Service 或自启文件。原主插件设置备份也留在同一设备备份目录。

| 功能 | 本轮实际覆盖 | 仍需设备业务验证 |
| --- | --- | --- |
| 安装/升级 | 43 项既有安装模拟测试、组件完整性与清单 | 冷安装、运行/停止状态升级、整包激活 |
| 配置生成/上传/模板 | 真实模板、实际文件保存、来源切换、设备临时配置消费 | UI 上传/应用到正式运行环境 |
| 订阅及 HTTP Provider 更新 | 现有模拟测试、真实 Controller 本地下载正文与缓存更新 | 真实订阅传输、远程 HTTP Provider 更新 |
| 本地 Provider 转换 | 真实 Controller 转换及新正文进入缓存的断言 | 目标订阅格式和实际网络返回 |
| DNS/节点 DNS 策略 | 字段级保存、核心消费、Controller 恢复 | 真正 DNS 请求、下游 DNS 劫持与节点域名解析 |
| TProxy/TUN/off、IPv4/IPv6 | 六组合配置整形、幂等、真实设备核心加载 | 内核能力、iptables/ip6tables、路由、TUN 接口和下游转发 |
| Gist + age | 真正 age 本地加解密、修复后规范化、事务 fixture、ARM64 定向用例 | 生产 Gist 下载、用户密钥解密、真实提交及后续调度 |
| 核心启动/停止/重启/恢复 | 原有模拟用例、配置恢复链、当前核心仍运行 | 新组件正式运行后的启停/重启及网络恢复 |
| 控制 API/面板 | 当前设备 API 200、面板 200、代理 204 | 安装新组件后复查及下游终端访问 |

不能把此前 WORKLOG 中的设备失败或历史 PASS 直接归到本次版本。本轮未重测历史的 TUN system 下游超时、IPv6 下游超时、订阅 EOF；原因尚不能由配置 `-t` 判定。它们是实机测试需优先重现的既有未决现象，不构成本轮已证明而未修复的代码缺陷。

### 复现与文件变化

运行目录需要本仓库、原附件 JS 和本次 native/组件更新。上游固定 SHA、yq 4.53.3、Mihomo 1.19.32/1.19.33、QEMU、原包 ARM64 Controller/Geo 数据、真实 age 工具需自行准备；交付不重复携带这些外部工具和私有设备备份。

```sh
# 在仓库中，F50_TEST_YQ 等路径均需是 Linux 绝对路径。
export F50_TEST_YQ=/path/to/yq-v4.53.3
export F50_TEMPLATE_REPO=/path/to/MIHOMO_YAMLS
export F50_TEST_QEMU=/path/to/qemu-aarch64
export F50_TEST_CONTROLLER=/path/to/clashctl_arm64
export F50_TEST_MIHOMO=/path/to/mihomo-v1.19.33
export F50_TEST_GEODATA_DIR=/path/to/geodata
export F50_TEST_NO_NETWORK=/path/to/no-network
export F50_TEMPLATE_CORE_INPUTS=/path/to/core-inputs
export GOMAXPROCS=1
node --check 猫猫TProxy.js
gcc -O2 -Wall tests/tproxy/no_network.c -o "$F50_TEST_NO_NETWORK"
# N 分别为 0、1、2、3，报告文件分别留存。
F50_TEMPLATE_SHARD=$N/4 F50_TEMPLATE_REPORT=/path/to/templates-$N.json \
  node --test tests/tproxy/real_templates.test.js
node --test --test-concurrency=1 tests/tproxy/config_semantics.test.js \
  tests/tproxy/config_lifecycle.test.js tests/tproxy/config_recovery.test.js
cd gist-sync/native
go test -run 'TestFinalReviewConfigBoundaries|TestNormalization' -count=1
go test -json -count=1 -skip '(?i)boot|daemon' ./...
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -buildvcs=false -trimpath \
  '-ldflags=-s -w -buildid= -X main.version=1.0.0-rc4' -o kano-gist-sync .
```

Git 变更：`gist-sync/native/normalize.go`、`gist-sync/native/normalize_test.go`、`tproxy-yq.zip`、已有 `WORKLOG.md` 追加本节。交付 ZIP 另外补齐必要的既有配置测试和逐样本字段/核心报告，便于复核，不包含未修改的主 JS、独立 Service、自启文件、工具二进制、语料仓库或私人配置。

## 2026-11-04：覆写链路审计与缺陷修复

对未提交的覆写相关改动（配置整形、模板/上传 provider 绑定、Service 恢复 yq）做代码审计后，修复了 5 个实际缺陷；审计结论与逐条证据见本节。

### 修复项

| 问题 | 修复 | 回归用例 |
| --- | --- | --- |
| 组的 `use` 引用被删除的 provider 时展开成空数组，核心以 ``proxy group[0]: G: `use` or `proxies` missing`` 拒绝整份配置 | 映射为空时保留空数组语义；仅当整组 `use` 为空且没有 `proxies` 时才回落到全部 provider | `a group whose only provider disappeared falls back...` |
| 绑定第三段不看名字，旧订阅遗留的任意 http provider 会按位置被新订阅接管，`override`/`filter` 一起搬过去 | 只有受管槽位（`^Provider\d+$`）能按位置回收 | `an unmatched custom http provider is dropped rather than recycled...` |
| `x-f50-overridden` 不再清理，上一轮的纠正记录永久留在配置里，面板每次"配置自检"都误报 | 无纠正项时删除该键（`docs/2026-10-21-配置覆写优化实施.md:99` 的原始约定） | `a stale correction marker is cleared...` |
| IPv6 TUN 切 IPv4 不再清除 `inet6-address`，preserve 模式里它与用户手填无法区分，值却来自上一轮 tun6 的固定 profile | `ipv6 !== 'on'` 时删除并记入 `x-f50-overridden` | `switching an original config to IPv4 TUN drops the IPv6 address...` |
| 端口冲突置零静默发生，与其它强制纠正的可观测性不一致 | 写入 `x-f50-overridden`，判定基准改用 profile 默认值以保持整形幂等 | `a conflicting default listener is closed and recorded...` |

另外三处口径修正：`f50_save_original_config` 的 yq 规范化失败补 `F50_ERROR=original_config_normalize_failed`（原先 `return 1` 无码，设备上只表现为服务起不来）；`readSavedSubConvertMode`、`forceUpdateProvidersFromConfig` 与诊断统计统一走新增的 `isManagedProviderEntry`（名字 + 缓存路径成对匹配），手工 file/inline provider 不再被当成订阅更新；rule-provider 的 `proxy` 按 trim 非空判断，`proxy: null`/空串也会补 `DIRECT`。

保留块版本 23 → 24（Service 文本有变，必须重打，否则已装设备不会更新），`tproxy-yq.zip` 已用 `refresh_package_service.{js,py}` 同步。

### 审计中确认**不改**的项

- **`$uploaded` 取代 `$gist`**：所有 `uploaded_config` 改走"用户配置打底"分支。插件侧已没有 `x-f50-gist-sync: true` 的写入点（只在退出 Gist 管理时删除该键、在 `f50GistManaged` 里兼容读取），继续要求它为真会让非 Gist 的自定义配置走错分支，属预期迁移，回退会破坏其它自定义配置语义。
- **`x-f50-overridden` 不进 `F50_RESTORE_EXCLUDED_KEYS`**：加回去会让 Service 分支 2 用控制器输出覆盖它，`config_recovery` 的"保留 prior metadata"断言当场变红。标记由 JS 每次整形重算，Service 只负责原样带过。
- **`rules: null` 两路差异**：模板规范化会补受管兜底规则（空规则模板无法使用），`runtime()` 保留 null 交给核心 `-t` 判定。两者输入来源不同，不强行统一。
- **Go 侧 `controlledNetworkKeys.tun` 缺 `stack`**：与 `docs/2026-10-21-配置覆写边界分析.md §7.3`「四处键集合必须一致」冲突，但修它要重编 ARM64 组件、重跑 120 组差分并更新两处清单哈希，单独一轮处理，本轮不动二进制。
- **`-P` + `explode` 改写 live `config.yaml`**：手写锚点的配置会被展开（实测 300 节点 19.8 KB → 86.7 KB）。这一步同时承担"重复键拒绝"的守卫，去掉等于放行非法 YAML，保留。
- **`F50_ORIGINAL_TUN_KEYS` 现在是死常量**：仍被 `run_tests.js` 当切片边界使用，已在源码注明，避免误删。

### 验证

| 命令 | 结果 |
| --- | --- |
| `node scripts/verify_plugin.js`（WSL，bsdtar 垫片 + 真实 yq 4.53.3） | **846 passed / 0 failed / 11 not run** |
| `node --test tests/tproxy/config_semantics.test.js` | 31 passed（新增 5 条） |
| `node tests/tproxy/run_tests.js` | 103 passed / 0 failed |
| `optimization_network` 体积断言 | install 脚本较基线省 **25277** 字节（阈值 25000） |
| 真实 mihomo 校验 `use: []` 组 | 复现 ``use or proxies missing``，修复后组不再为空 |

`real_templates`（需 `MIHOMO_YAMLS` 语料）与 10 项可选配置测试在本次环境未运行，`not run` 计数为 11。

被判为**测试锁定缺陷**而调整的两处断言：`repeated runtime shaping is idempotent`（原断言把 `x-f50-overridden` 也算进幂等比较，等于要求标志永不清除）、`provider setup / Service version 20 migrates`（用 `=21` 硬编码降级，版本升到 24 后降级失效，patch 认为已是最新，"迁移"根本没发生）。两处均改为表达原意，未放宽断言。

### 未做

`dist/` 仍是 2026-10-27 的交付包，本次未重建；要发布需按 `build_gist_sync.py` → `verify_plugin.js` → `report_plugin.js` → `package_plugin.py` 四步重跑。

Git 变更：`猫猫TProxy.js`、`tproxy-yq.zip`、`tests/tproxy/{config_semantics,optimization,optimization_subscription,reliability,run_tests,subscription_update}.test.js`、已有 `WORKLOG.md` 追加本节。
