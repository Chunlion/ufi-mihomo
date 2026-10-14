# 回归测试

## 入口与运行边界

主插件测试是 Node 脚本，不依赖仓库根目录的 npm test 入口。定向修改优先运行关联文件，不默认叠加全量构建、lint 或设备操作。

```text
node tests/tproxy/run_tests.js
node --test --test-concurrency=1 tests/tproxy/<相关文件>.test.js
```

`<相关文件>` 是待替换的测试文件名，不是可直接执行的路径。汇总回归入口是：

```text
node scripts/verify_plugin.js
```

汇总脚本按顺序运行主脚本及全部 `.test.js`，收集用例/退出状态，并写入 `reports/v9.0.0-regression.json`；它会更新报告文件。不要在只读任务中为“查看状态”运行它。

## 分类和保护目标

| 分类 | 现有文件 | 必须保持的验收点 |
| --- | --- | --- |
| 安装 | `optimization_install.test.js`、`run_tests.js` | 新装、缺组件、ZIP 危险路径、真实失败码、原配置/密钥保留、启动失败 |
| 升级 | `optimization_install.test.js`、`release_consistency.test.js` | 运行实例、明确停止实例、旧锁存与实际运行组合；协议不随 9.0.0 改名；暂存 Service 先补丁 |
| 卸载 | `optimization_network.test.js`、`run_tests.js` | clean/residual/unknown、进程/规则/接口/路径残留；未知检查不报 clean |
| 恢复与事务 | `reliability.test.js`、`optimization_install.test.js` | 回滚失败保留备份、成对模板提交/恢复、候选阶段失败不破坏原文件 |
| 安装收尾 | `optimization_install.test.js` | 锁/暂存清理失败、未知锁内容、组件已完成但 finalize_failed、非零退出及安全重试限制 |
| 网络 | `optimization_network.test.js`、`run_tests.js` | CIDR 规范化/重叠、外来规则/路由保护、伪跳转注释、受管身份、UI 入口保持 |
| IPv6 / DNS | `ipv6_dns.test.js`、`subscription_update.test.js` | NAT 缺失保留偏好/IPv4 DNS、临时错误不误降级、中断 options 恢复、DNS 字段保留 |
| TUN | `ipv6_dns.test.js`、`run_tests.js` | 栈版本门槛、自动/手动选择、重载后路由重建、mixed/system 回程、verify 不修复、缺路由阻止就绪 |
| Controller | `http_subscription.test.js`、`release_consistency.test.js` | 指定字节段复建、幂等、未知构建/部分补丁/坏 decoder 保留原件、并发临时文件、协议匹配 |
| 订阅 / Provider | `optimization_subscription.test.js`、`subscription_update.test.js` | 自定义来源保护、下载后加载确认、部分更新保留文件名、计数不符、HTTP 状态、390 事务回退、迁移确认 |
| 模板 / 节点 DNS | `subscription_update.test.js`、`reliability.test.js` | 清空/删除编辑草稿、主动导入、基础模板持久化、字段保留、读取失败不写、候选失败恢复 |
| YAML 桥接 | `yaml_bridge.test.js`、`optimization.test.js` | stdout/stderr 分离、支持的 merge 特性、解析失败及坏 JSON、组件被替换/不可执行时失败 |
| 异常任务 / 取消 | `reliability.test.js`、`optimization.test.js` | 任务身份及完成回执、PID 启动时间、缺回执/超时标记不确定、取消后不写、传输失败不自动重试 |
| 面板 | `panel_open.test.js` | 验证 URL 复用、冷启动共享请求、缓存失效、旧异步结果不可恢复缓存、取消写入不阻止读取 |
| 压缩与兼容 | `compact.test.js`、`optimization.test.js` | 11 组生成 Shell 逐字节保持、raw string/反斜杠/正则保持、六种 profile 语义不变 |
| 下载镜像 | `download_archive.test.js` | Gitee→GitCode→GitHub 顺序、首成功停止、全失败保留原因 |

以上均位于 [tests/tproxy](../tests/tproxy)。Go 辅助程序的测试是 [binary-helper/main_test.go](../binary-helper/main_test.go)，在 `binary-helper` 目录运行 `go test ./...`；它不证明闭源 Controller 或 ARM64 设备行为。

## 独立插件

| 入口 | 范围 |
| --- | --- |
| `node tests/boot-fix/run_tests.js` | `开机自启修复.js` 的沙盒启动、重试和配置快照 |
| `node tests/usb-mode/run_tests.js` | `USB网络模式切换插件.js` 的模式和恢复逻辑 |

独立插件不是主插件卸载时可以顺便清除的对象。仅修改主插件文档或逻辑，不必自动运行这两个套件。

## 环境和跳过项

- Shell 测试使用宿主 Shell、tar 等工具；Windows 沙盒 harness 使用现有 Git Bash，`F50_BASH` / `F50_DASH` / `F50_BUSYBOX` 可指定已有工具。
- YAML 用例使用 `F50_TEST_YQ` 指向可在测试宿主执行的解析器，部分用例缺少时 skip。ARM64 运行用例使用 `qemu-aarch64`，缺少时 skip。
- Node 测试辅助代码使用既有第三方解析/测试库。缺依赖是环境阻塞，不能靠删测试、换成空替身或自动安装全局依赖获得绿色结果。
- 核心、网络或设备桥接的夹具覆盖范围应随结果说明；本地 Mock、Linux 隔离、QEMU、真实浏览器和真实 F50 的结论不能互相替代。

## 已有报告与本次状态

仓库 [历史回归报告](../reports/v9.0.0-regression.json)记录 2026-10-14 09:40:25 UTC、Linux、Node v20.19.2：`355 passed / 0 failed / 7 notRun`，源码基线 `6be20fc`。`1449b2b`、`b21155e` 等后续修改不能自动继承该报告的完整覆盖。

本知识库任务只新增文档，未执行代码回归，也未操作真实 F50。历史 audit.5 的外部 `tests/run-audit5.cjs` 等入口不在本仓库，不能写成当前 checkout 可直接运行的命令。其历史隔离结果和设备结果见 [AUDIT_HISTORY](AUDIT_HISTORY.md)。

## 修改后的最小验收

按上表选择最接近改动的测试；Shell 修改另做相关 `sh -n`，配置修改用原生解析/核心检查。涉及持久化 Service、安装回滚、接管和认证时，验收应包含真正的消费者及相关失败路径。

真实网络验收需单独确认核心唯一、API/面板、接管规则/回程、DNS、下游新请求和恢复后的状态。无法执行或被跳过的项目明确记录，不能用历史 PASS 或版本号补齐。
