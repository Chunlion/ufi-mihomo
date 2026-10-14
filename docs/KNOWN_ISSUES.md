# 已知问题与验收缺口

基线见 [PROJECT_CONTEXT](PROJECT_CONTEXT.md)。这里区分现有实现限制、历史验证缺口和已修复问题；不把缺少测试写成必然故障。

## 现有实现限制

| 限制 | 影响与维护约束 | 证据 |
| --- | --- | --- |
| Controller 完整源码未取得 | 无法仅凭仓库复建全部控制器逻辑；辅助程序不是完整替代 | README、`binary-helper`、HTTP 补丁源码 |
| HTTP 二进制补丁绑定构建 hash/字节布局 | 未知构建会失败；新二进制必须重新核对，不能直接复用偏移或放宽检查 | `buildF50HttpSubscriptionPatchScript` |
| HTTP 补丁只覆盖 ARM64 | 包内 ARMv7 不因此获得同样补丁保证 | Controller patch 循环及测试 |
| 指定 F50 缺少 IPv6 NAT | IPv4 DNS 保留，但 IPv6 53 端口 NAT 重定向不可宣称可用 | IPv6 DNS 兼容函数、真实设备报告 |
| mips 有核心版本门槛 | 低于 v1.19.31 使用定义的自动回退；探测执行失败直接失败 | Tun6Compat 和 IPv6 测试 |
| 不同 Android/ABI/PATH/工具行为 | 旧系统、iptables 能力、curl 路径、Shell 与文件权限需实际探测 | 安装/Service 预检及历史设备样本 |
| 固定默认 secret 与 LAN 监听 | 缺省不是高强度保密凭据；已有密钥需保留，暴露面需单独审查 | 认证字段保护与固定 profile |
| 组件包无签名认证链 | ZIP 结构、版本和 checksum 不认证发布者；可执行包必须可信 | 安装器无固定 ZIP hash 的明确注释 |
| TUN 暂停设备绕过 | 名单保存但不保证生效；切回 TProxy 恢复使用 | `kprSaveNetworkState` 注释与 PolicyTools |
| YAML 注释/排版不保留 | JSON 桥接和配置整形保留受支持语义，不能承诺原文字节不变 | README、YAML 写入流程 |
| root 文件事务不是跨进程/断电万能保证 | journal、锁和快照用于恢复；未知或未解决状态会阻止写入/卸载 | Install/ConfigTransaction/Recovery |

## 历史验证缺口

- audit.5 原生开机启动器未保存最终 Shell 退出码；已有阶段标记和请求证据，不能补写 boot exit 0。
- 本文没有证明 `b21155e` 的所有功能都经过真实 F50 测试；同一 9.0.0 版本下多次后续修改应按提交区分。
- 当前材料不证明所有真实安装/回滚/收尾故障、未知租约、回执丢失、断电或强杀场景均在 F50 注入通过。
- 2026-10-13 四栈定向 HTTP 成功，不等于全部 UDP、运营商、下游设备、设备重启和 24–48 小时稳定性均通过。
- audit.2 的下游 IPv6 TProxy 完整往返未验收；后来 TUN IPv6 证据不能替代这个场景。
- 在其他固件和 ARMv7 上的完整验收、所有真实 override Worker 情况及跨页面故障注入，需要按改动范围补证。
- 回归可能因缺 yq 或 `qemu-aarch64` 跳过；跳过项必须报告。历史 355/0/7 报告对应 `6be20fc`，不覆盖所有后续代码。

## 已修复但必须防回退

| 历史问题 | 当前修复 | 保留的边界 |
| --- | --- | --- |
| TUN 停止把 `[detached]` 传给 ip | 重建规范删除字段、归属清理 | 不删除未知规则；后续修改仍需停止路径验证 |
| 开机找不到 curl，核心活着但收尾失败 | 绝对 curl 发现和独立 Service 迁移 | 更新 JS 不等于更新设备 Service |
| IPv6 NAT 缺失连带关闭 IPv4 DNS | 临时分拆旧 Controller 开关并恢复偏好 | IPv6 NAT 缺失本身仍存在 |
| mixed/system IPv6 HTTP 超时 | 表 17667 回程路由及策略重应用 | 后续实机 HTTP 200；不能扩写为全网络协议保证 |
| 自定义配置本地 Provider 只重载旧缓存 | 下载已保存来源，再核对核心加载 | 下载/响应未知不能保证缓存已保留 |
| 空节点 DNS 策略重新打开又被填回 | 区分已保存空策略与主动导入 | 其他模板字段仍应保留 |
| yq 警告混入 JSON | JSON stdout 与 stderr 分离，功能探测 | 解析失败、坏 JSON 和退出码仍需失败 |

## 需要人工补齐

1. audit.1 和 audit.2 原始 DIFF-REPORT、源码基线、开发日期及逐项修复归属。
2. 最早选择固定缺省 secret 与 redir-host 的原始原因；一次性随机缺省是否曾被评估。
3. 用户希望承诺支持的固件、ABI、下游设备和性能/长期稳定性验收标准。

来源：[AUDIT_HISTORY](AUDIT_HISTORY.md)列出的提交和原始报告；当前代码符号见 [ARCHITECTURE](ARCHITECTURE.md)。
