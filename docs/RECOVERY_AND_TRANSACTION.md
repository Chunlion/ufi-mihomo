# 恢复与事务

## 三种锁和任务身份

| 协调对象 | 路径 | 职责 |
| --- | --- | --- |
| install lock | `/data/clash.install.lock.d` | 串行化安装及文件树的暂存、旧目录移动、激活和收尾；`pid` 是已知锁内容 |
| operation lease | `/dev/kano_tproxy_operation.lock` | 多页面、Service boot/CLI 与设备写操作互斥；owner、cancelled、frontend 属于租约状态 |
| recovery lock | `/dev/kano_tproxy_recovery.lock` | 恢复资格复核、前端活动写入、任务登记/目录清理的协调，避免检查与执行之间竞态 |
| task registry | `/dev/kano_tproxy_tasks` | `F50_TASK_V2` 任务标签、请求序号、子进程/管理进程 PID 和启动时间、状态、退出码 |

租约不是“有一个目录就可以删掉”。Service 的递归标志也不是已持有租约的证明，仍需核对 owner 和取消状态。浏览器活动按设备 uptime 保存期限，当前机制为 120 秒有效期、20 秒续期；设备任务身份另以 PID+启动时间判定。

## 安装阶段

`buildF50InstallScript` 建立 `.f50-install.*` 工作目录，以 `F50_INSTALL_JOURNAL_V1` 写入 phase、root、backup、stage、旧运行状态和停止锁存。典型阶段：

```text
created → preflight → cleanup_intent → backup_rename_intent
        → commit_intent → activation_intent → complete
失败且可恢复 → restored
```

1. 申请安装锁，检查根目录、空间、ZIP 路径/大小、暂存 symlink、组件可执行性、协议、Service 语法、模板和面板。
2. 在暂存树中执行 Controller/Service 补丁，保留用户数据。补丁包缺少核心时，使用已有核心合并，不能凭空视为完整新安装。
3. 再检查旧环境；旧服务可能在上传/解包期间启动。必要清理后再次复制用户数据，包含原生恢复可能更新的配置/缓存。
4. 写停止锁存；旧目录移动为 rollback backup，再提交新目录。激活是否启动取决于旧实例明确停止状态及配置就绪状态。
5. 组件完成后设 `SUCCESS=1`，写完成 journal、备份回执，释放已知锁内容，清理暂存并确认路径消失。

`installed_stopped` 是明确停止的旧实例升级语义；配置不就绪可以是 `installed_needs_configuration`。不能因为核心没运行就自动启动所有实例。

## 成功状态必须分层

| 状态 | 可用证据 | 不可推导的结论 |
| --- | --- | --- |
| 安装中 | 锁、journal phase、任务记录 | 不能因超时/页面离开就认定失败已回滚 |
| 组件已安装 | `F50_INSTALL_COMPONENTS_OK=1` | 不等于所有收尾完成或公网可用 |
| 核心启动确认 | `START_STATE=started_verified_process`、`F50_START_OK`、Service 返回 | 不等于全部 Provider、API、面板或网络连接已验证 |
| Service body 完成 | `F50_SERVICE_BODY_FINALIZED=1` | 不等于外层租约释放和最终 Shell 退出成功 |
| 安装事务完整完成 | 退出 0、`F50_INSTALL_TRANSACTION_STATE=complete`、`KANO_INSTALL_OK=1` | 不能替代本次设备流量验收 |
| 组件完成但收尾失败 | components=1、`finalize_failed`、`KANO_INSTALL_OK=0`、非零退出 | 不能改成全成功，也不能盲目回滚已完成激活的组件 |
| 失败/回滚 | `F50_ROLLBACK=*`、保留材料和最终复查 | “发出恢复命令”不等于恢复成功 |

组件完成之前的失败可以进入安装回滚；`SUCCESS=1` 之后 journal/备份回执/锁/暂存收尾失败应保留新组件、旧备份和必要材料。不能将这个规则推广为“任何核心启动后的错误都不回滚”：Service 激活失败仍可能发生在组件完成界线之前。

面板 HTTP 探测警告与核心激活失败也不同。现有安装测试要求面板探测失败时保留已成功启动的组件，同时报告健康层未通过；不能用面板错误强制清除一个可用核心。

## 配置与多文件事务

`commitStagedYaml` 使用 `<target>.kano_tx`：`format=F50_CONFIG_TX_V1`、config/source 快照及 had/absent、`ready`、`committed`。运行配置和来源文件，或 template/base 文件，需要成对提交和恢复。

`ready` 已写而 `committed` 未写时恢复旧对；缺失、未知格式、symlink 或恢复失败都需返回失败并留存证据。`committed` 后才可以清理事务。落盘相同内容和来源时走 unchanged 路径，不为无变化操作重新写文件。

订阅保存、HTTP 390 回退和网络设置还有多文件快照：订阅 URL/模式/options、Provider 状态、运行配置来源和网络名单需要一致。恢复时不能只恢复 config，却留下新的来源标记或旧缓存引用。

## 网络恢复与卸载

1. 只读资格检查检查安装事务、租约 owner、任务格式、PID/starttime、完成回执、前端期限和未提交配置事务。
2. 真正恢复获取 recovery lock，重新核对资格或 resume owner，设置取消栅栏。
3. 尝试原生 Service recover，再仅按归属清理捕获进程和网络。再次检查进程重生、剩余规则和 journal。
4. 锁和记录只删除已确认条目；unknown、active、未回执、部分恢复不能自动强清。
5. 卸载先确认无归属运行资源及恢复材料，再处理限定文件/自启动；最终探针区分 clean、residual、unknown。

回滚清理失败时，不覆盖活跃的新目录；输出 `F50_RECOVERY_BACKUP` / `F50_RECOVERY_WORK` 并保留材料。`transport_unknown`、超时、回执丢失不能触发自动重复写请求。

## audit.1 / audit.2 的可确认范围

历史 audit.2 报告确认安装/收尾/恢复隔离测试覆盖：锁 pid/目录删除失败、未知锁条目、删除假成功、journal/备份回执失败、任务回执丢失、租约释放响应丢失、暂存清理失败和业务错误被收尾覆盖。当前实现按上述状态层级处理这些问题。

audit.1 原始差异和 audit.2 开发交付说明在本次可达材料中不完整，因此不能给每项修复编造原始提交归属；**历史背景待补充**。audit.2 的实机报告也未在生产安装中注入这些故障，隔离通过不代表实机故障注入通过。audit.5 的前端活动、恢复复核和任务登记竞态修复有独立原始报告，见 [AUDIT_HISTORY](AUDIT_HISTORY.md)。

来源：[主插件](../猫猫TProxy.js)的 Install/Lease/Recovery/ConfigTransaction/Removal 函数；[安装事务测试](../tests/tproxy/optimization_install.test.js)、[任务与配置测试](../tests/tproxy/reliability.test.js)。
