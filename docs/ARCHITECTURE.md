# 架构

基线及证据等级见 [PROJECT_CONTEXT](PROJECT_CONTEXT.md)。下列符号均来自主插件或组件包；Controller 的完整内部实现不能由 JS 包装层证明。

## 组件关系

```mermaid
flowchart TD
    UI[UFI-TOOLS 页面 / 猫猫TProxy.js] --> BR[宿主 runShellWithRoot / 操作租约与任务回执]
    BR --> CFG[模板生成 / YAML 候选与成对提交]
    CFG --> FILE[/data/clash/Proxy/config.yaml]
    BR --> SP[Service 候选补丁与安装事务]
    SP --> S[Scripts/Clash.Service]
    BOOT[/sdcard/ufi_tools_boot.sh] --> S
    S --> C[clashctl Controller]
    C --> M[Mihomo / Proxy/Clash.Core]
    FILE --> M
    C --> NET[iptables / ip6tables / ip rule / 路由表]
    M --> TUN[KanoTun]
    S --> COMP[栈恢复 / API 重载 / IPv6 回程与 DNS 兼容]
    COMP --> NET
    BR --> R[恢复 / 归属清理 / 卸载复查]
    R --> NET
    R --> S
    UI --> API[认证 API / Zashboard / Provider 更新]
    API --> M
```

这是管理关系图：实际数据包由网络接管进入 Mihomo，不是经 JS、Service、Controller 串行转发。

## 模块与定位

| 模块 | 主要入口 | 职责及边界 |
| --- | --- | --- |
| JS 入口 | 主文件 IIFE、宿主 `runShellWithRoot` 包装 | 绑定页面按钮、状态缓存、确认与进度；写请求带操作身份，读取不应被写入取消状态误阻止 |
| 配置生成 | `F50_FIXED_PROFILES`、`KPR.runtime`、`normalizeManagedTemplateObject`、`prepareTemplateFromBase` | 深合并六种 profile；按配置来源决定固定模板或保留用户字段；候选生成后再提交 |
| YAML 桥接 | `readYamlObject`、`stageTextBesideTarget`、`commitStagedYaml` | 读取、解析、同目录候选、权限、成对快照和恢复；不是直接 `yq -i` 写生产文件 |
| Service Patch | `buildF50OriginalServicePatchScript`、`buildF50ServiceCurlPatchScript` | 对候选 Service 注入兼容函数；匹配预期位置、语法验证、保持权限、原子替换、失败恢复 |
| Controller Patch | `buildF50HttpSubscriptionPatchScript`、`scripts/patch_controller_http.js` | 修改指定 ARM64 二进制的已知字节段；构建身份、前后字节及最终 hash 均须匹配 |
| 网络规则 | `buildF50NetworkHelpers`、`Clash.PolicyTools`、Controller `policy` | 策略应用与验证；清理只识别 KANO 链、特定规则和 `proto 242` 路由 |
| TUN | `verifyF50TunStack`、`buildF50Tun6CompatFunctions` | 版本门槛、恢复栈选择、重载后重建路由、mixed/system IPv6 回程验证 |
| DNS | profile DNS 字段、`buildF50Ipv6DnsCompatFunctions` | redir-host 模板；IPv6 NAT 缺失时保存偏好，仅为当前 Controller 调用拆分 DNS 行为 |
| Recovery | `buildF50RecoveryEligibilityFunctions`、`buildF50EmergencyScript`、`networkRescue` | 只读资格检查、恢复锁内复核、取消栅栏、归属清理与结果确认 |
| 卸载 | `buildUninstallStages`、`buildF50RemovalHelpers`、`buildF50FinalProbeHelpers` | 先解除运行资源，再清自启动与限定路径；残留/无法检查均不能报成功 |

`binary-helper/main.go` 是仓库保留的辅助程序源码，不是 `clashctl` 的完整替代实现。不要把两者混为一套控制器。

## 持久化状态

| 路径（相对 `/data/clash`） | 状态职责 |
| --- | --- |
| `Proxy/config.yaml` | 当前运行配置 |
| `Tools/template.base.yaml` | 用户基础模板，节点 DNS 等定制的持久来源 |
| `Tools/template.yaml` | 经基础模板、规范化和覆写得到的模板 |
| `Tools/config_source.conf` | `template.yaml` / `uploaded_config` / 历史 `subscription_original` 来源 |
| `Proxy/subscription_urls.txt` | 来源顺序、启用/禁用状态和模式头 |
| `Tools/sub_rule_mode.conf`、`Tools/sub_user_agent.conf` | 订阅规则模式与 UA |
| `Policy/options.conf` | 接管、IPv6、DNS、TUN 栈、私网等选项 |
| `Policy/device_bypass.txt`、`Proxy/mac_bypass.txt` | 设备与兼容 MAC 绕过数据 |
| `Policy/*.list`、`Proxy/Policy/*.list` | 用户策略名单及运行时安全转换结果 |
| `Policy/stopped` | 明确停止锁存；不能仅凭进程暂时不存在重写它 |

`/dev/kano_tproxy_operation.lock`、`/dev/kano_tproxy_recovery.lock` 和 `/dev/kano_tproxy_tasks` 是运行协调状态；`/data/clash.install.lock.d` 与安装日志属于文件事务。职责不同，不能合并成一个“忙碌”布尔值。

## 两条部署路径

浏览器操作经 JS 发起设备请求；原生 boot/CLI 直接执行持久化 Service，不运行页面 JS。Service 必须自身具备租约栅栏、可靠 curl、配置恢复和收尾判断。源文件、包内 Service、设备 Service 分开检查，不能用导入 JS 成功替代 Service 迁移成功。

来源：[主插件](../猫猫TProxy.js)上述符号、组件包 `Scripts/Clash.Service` / `Scripts/Clash.PolicyTools` / `Tools/f50-controller.version`、[HTTP 补丁源码](../scripts/patch_controller_http.js)。
