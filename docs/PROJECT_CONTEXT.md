# 猫猫 TProxy F50 项目上下文

## 基线与证据规则

本知识库整理于 2026-10-14，以已提交代码 `b21155e` 为基线。整理时工作区存在其他未提交代码修改，未将其作为已交付行为。后续维护应同时核对当前代码和本文的基线。

- **代码事实**：能够在仓库代码、组件包、测试或 Git 提交中定位。
- **历史实机证据**：过去在指定 F50、固件和模式下实际观察到；不等于本次重新验证或所有后续提交均已验收。
- **历史背景待补充**：缺少原始决策记录，不能从当前实现反推作者动机。
- 测试用例存在、历史回归通过、设备当前运行正常是三种不同证据。

## 项目与运行环境

项目是基于 `Chunlion/ufi-mihomo` 的猫猫 TProxy 插件套件，面向中兴 F50 等运行 UFI-TOOLS 的随身 Wi-Fi。主插件是单文件浏览器 JS，通过宿主 `runShellWithRoot` 执行设备 Shell，管理 `/data/clash` 下的 Mihomo、Controller、Service、配置和接管规则。

不是普通浏览器扩展或仅运行于电脑的代理客户端。实际操作依赖设备 root、Android/Linux 网络工具及对应架构的二进制。仓库声明 AGPL-3.0；主源码标注基于上游 AGPL-3.0-or-later。

历史实机样本：中兴 F50，Android 13 / SDK 33，Linux 5.4.254 Android 内核，`arm64-v8a`，固件标识 `F50_FLYMODEM_ZYV1.0.0B09`。设备的 `uname` 曾输出 `armv8l`，不能据此否定 ARM64；Controller、Mihomo、yq 实际执行是更直接的证据。该样本不证明其他 Android、固件或 ABI 全部兼容。

## 版本与兼容契约

| 项目 | 基线状态 | 维护要求 |
| --- | --- | --- |
| 主插件发布版本 | `9.0.0` | 见主文件版本注释；同版本下 main 已有后续修复 |
| Controller / Service 协议 | `8.0.0-compat.2.3` | `F50_COMPAT_VERSION`、版本文件、Service 标记共同使用；不能随发布版本同步改名 |
| Controller | `Scripts/clashctl_arm64`；包内另有 ARMv7 版本 | 完整 Controller Go 源码未取得；现有 HTTP 补丁限定 ARM64 指定构建 |
| Mihomo | 由设备安装的核心决定 | 历史 F50 样本为 v1.19.32；不要把样本版本写成所有安装的固定版本 |
| mips TUN 栈 | 要求 Mihomo v1.19.31 或以上 | 保存和启动前检查版本；探测执行失败必须停止，不能当作旧版本降级 |
| yq | 设备 ARM64 v4 解析器 | 历史样本 v4.53.3；JSON 桥接需处理功能探测、stderr 警告和真实解析错误 |

导入新 JS 不等于更新设备持久化的 `Clash.Service`。组件包、运行时 Service 补丁与已安装 Service 应分别验收。

## 功能和数据归属

- 安装、导入/在线更新组件、启动、停止、核心重启、运行分层诊断。
- TProxy / TUN / 关闭接管，IPv4 / IPv6，TUN 栈选择、私网定向代理、设备绕过。
- 模板生成、用户配置上传/编辑、节点 DNS 策略、规则和 JS 覆写。
- 多订阅 HTTP Provider 或本地转换、缓存更新、HTTP 390 回退与显式旧配置迁移。
- 配置事务、安装回滚、操作租约、网络恢复、有限归属清理和卸载最终检查。

用户数据包括运行配置、订阅及禁用状态、Provider 缓存、两份模板、覆写、来源标记、网络选项和设备/规则名单。它们不是可随组件升级删除的生成垃圾。

默认端口：HTTP `7890`、SOCKS `7891`、Mixed `7892`、TProxy `7895`、DNS `1053`、控制 API/Zashboard `7788`；未使用的 `redir-port` 为 `0`。端口或接管约定改变时，还需核对项目 `AGENTS.md` 指定的仓库外私有 F50 配置；不得把私有配置或凭据加入提交。

## AI 和开发者使用顺序

先读本页，再按任务读取 [架构](ARCHITECTURE.md)、[设计决策](DESIGN_DECISIONS.md)、[安全边界](SECURITY_MODEL.md)、[网络模型](NETWORK_MODEL.md)、[事务与恢复](RECOVERY_AND_TRANSACTION.md)。历史与验收见 [审计历史](AUDIT_HISTORY.md)、[已知问题](KNOWN_ISSUES.md)、[回归测试](REGRESSION_TESTS.md)。

ChatGPT 负责依据当前工作区提出修改计划、风险和审查结论；Codex 执行已授权修改、定向验证并提供 diff。任何一方都不能把旧报告、版本号或模型推断当成当前设备状态。

来源：[主插件](../猫猫TProxy.js)、[README](../README.md)、组件包 `tproxy-yq.zip`；历史设备材料的名称和范围见 [AUDIT_HISTORY](AUDIT_HISTORY.md)。
