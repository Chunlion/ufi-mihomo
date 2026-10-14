# 安全模型

## 权限与信任边界

主插件通过 UFI-TOOLS 宿主执行 root Shell，Service、Controller、核心和组件包中的可执行文件属于设备特权信任边界。认证 API 能限制无凭据请求，但不能隔离已经取得 root 的插件或不可信组件包。

固定默认 secret 是兼容缺省，代码保留用户已有非空值。它不是随机高强度凭据，也不等于可以把 `7788` 暴露到不受信任网络。API 和面板的实际监听/可达范围需要按设备配置核对；文档、日志及提交不得包含设备密钥、订阅完整 URL 或节点认证数据。

## 文件替换检查

| 对象 | 现有保护 | 不能删除的检查 |
| --- | --- | --- |
| YAML | 同目录候选、mapping 解析、旧配置/来源快照、0600、rename、落盘 hash、事务标记 | 候选解析、target/stage/source 的 symlink 拒绝、成对恢复、提交后 hash、失败传播 |
| Service | 普通文件与 symlink 检查、原 hash/备份、候选补丁、预期锚点次数、`sh -n`、保留原权限 | 提交前目标未变化检查；提交后 hash/语法；失败时恢复及恢复 hash 检查 |
| ARM64 Controller | 协议文件、允许构建 hash、每个字节段原值/目标值、完整补丁状态、独立临时文件 | 未知构建拒绝、混合/部分补丁拒绝、备份身份检查、每段复核和最终 hash |
| 组件 ZIP | 路径列表、解压大小与空间预算、暂存、解压后 symlink 检查、可执行/版本/模板/UI 预检 | 拒绝绝对路径、`..`、反斜杠异常路径和 symlink；真实执行探测；先预检后移动旧安装 |

`commitStagedYaml` 自身提供 YAML/文件事务保护；核心原生 `-t` 验证由相应调用链执行，不能笼统声称每一次文件提交都验证了 Mihomo 完整语义。

已有 symlink 检查针对具体生产路径、候选、备份、事务和锁；它们不是“所有父目录和所有 Android 文件系统都不存在竞态”的证明。组件解压后检查也不能代替对不可信压缩包及解压器行为的信任判断。

## hash 的职责

- Controller hash/字节段用于确定补丁是否适用于该构建，不能放宽成“版本字符串一致即可”。
- Service 与 YAML 的 hash 用于并发变化、提交完整性和回滚复核。
- 恢复任务记录在删除前再次核对 hash，避免检查后记录被替换。
- 安装器明确没有固定 ZIP hash；结构、协议、可执行探测与本地 checksum **不是发布者签名**，也不认证远程包来源。

现有下载镜像与组件导入仍需要可信来源。没有代码证据证明存在签名清单或公钥验证；不能在审查报告中声称已具备供应链签名验证。

## Controller 与订阅保护

HTTP 补丁仅针对 `Scripts/clashctl_arm64`，包中的 ARMv7 二进制布局不同。重复补丁应保持幂等，未知二进制保持原样并返回失败。

订阅只接受不含 userinfo 的 HTTP/HTTPS 公网地址；本地校验识别回环、私网及非标准 IP 表示，Controller 继续进行最终 URL 校验。允许 HTTP 是项目显式兼容行为，不能用文案暗示 HTTP 具有 HTTPS 的保密性。不能为了支持 HTTP 删除协议、userinfo 或目的地址验证。

控制 API 重载通过私有认证配置文件及 curl `-K` 传递认证，历史审计检查过文件 0600 和命令行不泄露 secret。设备本地 API 请求使用 `--noproxy '*'`，防止环境代理使本地重载错误绕行。

## 锁、任务与回滚

必须保留 install lock、operation lease、recovery lock 各自的职责。任务身份包括 PID 和 `/proc` 启动时间；仅 PID 存在/消失不能证明任务归属或结束。

实际恢复在 recovery lock 内重新检查资格/owner，先设置取消栅栏，再清理已确认资源。未知锁内容、未提交配置事务、缺失完成回执或活跃前端应阻止自动恢复。

回滚不能覆盖仍活跃的新运行环境；清理或恢复失败时保留旧备份、事务工作目录和错误标记。卸载必须先确认无归属进程/网络和未解决 journal，不能通过删除 journal 或锁来绕过失败。

## 日志脱敏与剩余边界

`buildF50RedactFunction`、`sanitizeSubscriptionSecrets`、`f50Diagnostic` 分别处理 Shell 与页面输出中的认证字段、Bearer、节点协议和 URL。日志文件应按现有私有权限写入；错误必须保留可诊断原因，但不能直接输出 YAML、完整订阅请求或环境变量。

模式、配置或节点数据可能进入新错误路径，新增输出需要核对其是否经过脱敏；现有正则不能证明所有新格式均自动覆盖。JS override 的 Worker、语法限制和结果校验用于受控配置生成，不应被描述为可执行任意不可信代码的完整安全沙箱。

来源：[主插件](../猫猫TProxy.js)的 `commitStagedYaml`、Service/Controller Patch、Redact、Lease/Recovery/Removal 函数；[Controller 测试](../tests/tproxy/http_subscription.test.js)、[可靠性测试](../tests/tproxy/reliability.test.js)；历史认证实测范围见 [AUDIT_HISTORY](AUDIT_HISTORY.md)。
