# 设计决策

基线见 [PROJECT_CONTEXT](PROJECT_CONTEXT.md)。禁止改变指禁止未经明确需求、迁移方案和相关验证破坏现有契约；不代表这些设计永远不能演进。

## 决策：固定默认 Controller secret，保留已有非空值

背景：`F50_DEFAULT_SECRET` 是缺省常量；安装、启动和 YAML 提交均读取现有值，已有非空值优先保留。文档不记录常量值或设备密钥。

为什么需要：控制 API、配置重载、Provider 请求和面板连接共享配置中的认证状态。随机覆盖会让已保存的客户端认证信息失效，造成“核心活着、管理失败”。

实现：`f50_ensure_install_secret`、`f50_ensure_live_secret`、`applyRequiredF50Fields`、`commitStagedYaml` 的 secret 保护分支补全空值并保留旧值。

禁止改变原因：不能在每次安装、启动、模板生成时随机生成或覆盖非空值。仅首次缺省是否可以改成随机值，是另一项迁移设计；代码不能证明其绝对不可行。项目最早选择固定缺省而非一次性随机缺省的原始动机为 **历史背景待补充**。固定缺省不提供可靠的保密性，见 [安全模型](SECURITY_MODEL.md)。

## 决策：托管模板使用 redir-host DNS

背景：`PROFILE_BASE` 和模板生成器使用 `redir-host`；历史 Fake-IP 配置和无 DNS 劫持的域名路由曾分别处理。

为什么需要：当前接管、嗅探和私网规则围绕真实 IP、DNS 开关及显式路由建立。单独改成 Fake-IP 会引入地址池、解析映射及绕过语义变化。

实现：固定 profile 与 `buildF50TemplateObject` 生成 redir-host；用户/历史原配置保留分支仅更新 `F50_ORIGINAL_DNS_KEYS` 等必要字段，不能说所有上传 DNS 配置都会被完整覆盖。

禁止改变原因：不能以“优化 DNS”为由替换模板 DNS 模式或清除用户 DNS。最早去掉 Fake-IP 的完整决策记录为 **历史背景待补充**；当前约束可由 profile、保留分支和测试证明。

## 决策：订阅统一使用本地模板，原配置迁移必须显式确认

背景：`ee03daa` 去掉活动的原配置订阅模式；`original` / `subscription_original` 仍用作历史保护标记。

为什么需要：订阅节点与本地规则/网络约定要分离；旧配置可能包含用户字段，不能因升级或保存链接自动被模板覆盖。

实现：`prepareTemplateFromBase` 生成候选；`writeSubConfigByMode`、`saveSubSources` 按来源保护上传配置；旧原配置迁移要求显式同意、备份及成对回滚。

禁止改变原因：不能删除历史来源识别或把所有来源强制改成 template。`template.base.yaml` 是用户数据，订阅更新应保留节点 DNS 策略和覆写。

## 决策：Provider 身份、下载与核心加载结果分开

背景：支持 Mihomo HTTP Provider 和本地转换的 file Provider；本地下载成功后，核心可能仍未加载新缓存。

为什么需要：混用下载完成与加载完成，会虚报订阅更新成功；重新编号部分 Provider 会更新错误的文件。

实现：`buildManagedProxyProviders` 保留来源名和 `./proxies/<name>.yaml`；启用来源参与生成，禁用来源留在存储。Provider 更新并发为 2；`reloadLocalSubscriptionProviders` 和结果构造器核对 API 状态、缓存与节点计数。HTTP 390 回退以事务保存来源、转换模式与配置。

禁止改变原因：不能删除禁用来源、改写原 Provider 文件名、把失败统一报告为缓存已保留，或把下载成功当作核心加载成功。无订阅时生成空 mapping，不创建可误启动的 URL 占位。

## 决策：TProxy 接管与插件资源归属保持固定契约

背景：固定 TProxy 端口 `7895`，mark `0x10000000/0x10000000`，规则优先级与表号由 Controller 和恢复层共同使用。

为什么需要：恢复必须准确识别本插件资源；只改端口、mark 或表号的一端会留下旧规则或误清其他程序资源。

实现：TProxy profile 关闭 TUN；规则应用由 Controller/PolicyTools 完成；JS 清理规划器按链名、规则字段与路由 `proto 242` 判定归属。

禁止改变原因：不能全局 flush、按端口或表号单独认定归属、删除所有同名进程。变更必须同时更新生成、验证、恢复及私有配置约定。完整 Controller 源码缺失的边界见 [NETWORK_MODEL](NETWORK_MODEL.md)。

## 决策：TUN 路由由 Controller/Service 统一管理

背景：`KanoTun` profile 设置 `auto-route=false`、`auto-redirect=false`、空 `dns-hijack`；旧 Controller 会写回 mixed。

为什么需要：让核心和外部 Controller 同时自动加路由，会产生接管冲突；配置重载重建 TUN 后，原接管路由可能失效。

实现：保存 `tun_stack`；Service 在重载前恢复选择，执行核心原生配置检查，重载后 `policy apply` / `policy verify`；自动模式优先满足版本要求的 mips，旧版本 IPv4 回退 mixed、双栈回退 gVisor。

禁止改变原因：不能仅修改 JS 的 profile 就宣称实际栈已切换；不能开启第二套自动路由或把版本执行失败当作旧版本。手动 mixed/gVisor/system/mips 选择应保留。

## 决策：IPv6 能力分层，不永久清除 DNS 偏好

背景：历史 F50 缺少 IPv6 NAT，但不意味着 IPv6 TUN、IPv6 解析或 IPv4 DNS 劫持不可用。

为什么需要：旧 Controller 共用 DNS 开关，会因 IPv6 NAT 缺失连带关闭 IPv4 劫持。mixed/system 还需要 TUN 内部网段的回程路由。

实现：`f50_run_controller` 暂存 options，为当前受租约保护的调用临时关闭旧 DNS 开关，恢复原偏好后单独建立/验证 IPv4 DNS；mixed/system 在表 `17667` 建立从实际 `KanoTun` 地址取得的 IPv6 前缀路由。

禁止改变原因：不能把缺少 NAT 当作关闭全部 IPv6 的理由；不能把偏好临时降级永久保存；不能硬编码运营商地址或删除只读 verify 的失败判断。

## 决策：按设备绕过只在 TProxy 生效，TUN 暂停效果但保留名单

背景：`kprSaveNetworkState` 的注释明确要求保存名单；PolicyTools 在非 TProxy 模式暂停其效果。

为什么需要：模式切换后用户仍可能回到 TProxy；TUN 路由模型不同，沿用 TProxy 绕过效果不能自动保证正确。

实现：`Policy/device_bypass.txt` 和兼容 MAC 文件保留；TProxy IPv4 DNS 兼容规则在私网豁免及重定向前处理设备源地址/MAC 豁免。

禁止改变原因：不能因切换 TUN 清空名单，也不能宣称相同绕过名单在所有模式均生效。IPv6/多网口覆盖须单独验证。

## 决策：私网定向代理使用可撤销的配置整形

背景：普通私网直连与远端私网代理可能冲突，尤其与本机连接网段重叠时。

为什么需要：简单在规则末尾追加 CIDR 可能被前面的 DIRECT 命中；整形若不记录旧值，回退会破坏用户 TUN 配置。

实现：`createPrivateRouteLogic` 校验 IPv4/IPv6 CIDR、目标策略及连接网段，前置 `IP-CIDR` / `IP-CIDR6` 规则并记录 `x-kano-private-route`；TUN 排除网段按集合运算调整，切回模式恢复原字段。

禁止改变原因：不能绕过重叠检查、用字符串前缀代替 CIDR 运算，或无条件删除用户字段。

## 决策：发布版本与协议版本分开，成功结果分层

背景：v9 首次发布主要调整版本注释；Controller 合约未变。audit.5 证明“核心已启动”和“Service 收尾成功”不是同一状态。

为什么需要：改协议标签会导致版本探测失败；用 PID 存在代替完整成功会隐藏 API 重载、锁释放或回执失败。

实现：`F50_COMPAT_VERSION` 保持协议版本；安装组件完成、Service body、租约释放和任务回执分别确认。

禁止改变原因：不能随版本号升级协议、吞掉收尾失败，或在回执未知时自动重试写操作。状态模型见 [RECOVERY_AND_TRANSACTION](RECOVERY_AND_TRANSACTION.md)。
