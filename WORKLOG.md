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
