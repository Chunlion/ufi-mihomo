# ufi-mihomo

中兴 F50 等 UFI-TOOLS 随身 WiFi 的 mihomo（Clash.Meta）透明代理插件套件。

## 插件

| 文件 | 说明 |
|---|---|
| `猫猫TProxy.js` | 安装、配置和管理 mihomo 透明代理 |
| `开机自启修复.js` | 可选；增强所有插件的开机启动、重试和故障恢复 |
| `USB网络模式切换插件.js` | 可选；切换 CDC-NCM、CDC-ECM 或 RNDIS，并管理自动修复和有线 ADB |

## 安装

设备 `/data` 需要至少 50 MB 可用空间。

1. 打开 UFI-TOOLS 管理页（通常为 `http://192.168.0.1:2333/`），进入“插件功能”。
2. 上传并提交 `猫猫TProxy.js`。
3. 刷新页面，展开“猫猫”，点击“安装 / 启动”。
4. 按需上传另外两个插件；使用开机修复插件时，点击“安装 / 修复”。

切换 USB 模式会短暂断开有线连接，操作前应确保可以通过 F50 的 Wi-Fi 进入管理页。

## 配置

- 订阅支持不含用户名或密码的公网 HTTP、HTTPS 地址。
- “本地模板”适合节点订阅和分享链接；“订阅原配置”只允许一个完整的 Mihomo YAML/JSON 订阅。
- 上传或编辑 `config.yaml` 后，“保存订阅”默认不会替换自定义配置；需要替换时勾选应用。
- “配置与规则 → 机场专用 DNS”支持读取当前配置、按节点域名指定多条 DNS，以及复制和粘贴 YAML。保存到基础模板后，点击“应用模板”生效；订阅更新会保留。
- 切换 TProxy、TUN 或关闭接管时，插件会调整必要的网络字段。YAML 注释和排版不会保留。
- 内核缺少 IPv6 NAT 时，保留 IPv4 DNS 劫持和 IPv6 接管；IPv6 DNS 无法通过 NAT 重定向。
- 网络设置支持选择 TUN 协议栈；自动模式优先 mips，旧内核 IPv4 回退 mixed，双栈回退 gVisor。mips 需要 [Mihomo v1.19.31](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.31) 或以上，保存和启动前检查版本；版本读取失败时停止操作。手动选择保留。启动时会在配置重载后重新应用并验证接管路由；mixed/system 双栈补齐 TUN 内部网段的 IPv6 回程路由，策略重新应用后也会恢复。

### 默认端口

| 用途 | 端口 |
|---|---:|
| HTTP 代理 | `7890` |
| SOCKS 代理 | `7891` |
| Mixed 代理 | `7892` |
| TProxy 接管 | `7895` |
| Mihomo DNS | `1053` |
| 控制 API 与 Zashboard | `7788` |

## 状态与排错

- `not_installed`：未安装。
- `damaged`：组件、架构、权限或配置预检失败。
- `installed_stopped`：安装完整，核心未运行。
- `running_api_unavailable`：核心已运行，但控制 API 不可用。
- `healthy`：核心和控制 API 均正常。

配置、安装、订阅更新或端口检查失败时，插件保留或恢复原有可用数据。具体原因以面板诊断结果为准。

## 更新与卸载

主插件发布版本为 `9.0.0`；`F50_COMPAT_VERSION`、控制器版本文件和 Service 标记仍使用协议版本 `8.0.0-compat.2.3`，无需随发布版本修改。配置迁移按配置来源和已保存订阅判断。

更新主插件后，如需使用 GitHub main 的配套组件，下载本仓库根目录的 `tproxy-yq.zip`，在猫猫面板点击“导入组件包”。“在线安装/更新”依次尝试 Gitee、GitCode、GitHub；“安装 / 启动”检测到已安装的兼容组件时只启动核心。

原 `_Go` 版用户先停用旧插件，再上传 `猫猫TProxy.js`。完整卸载使用猫猫面板中的“完整卸载”；开机修复插件需要在自己的面板中单独卸载。

## 源码

辅助程序 Go 源码在 `binary-helper/`，构建脚本为 `scripts/build_helper.py`。`clashctl` 的完整原始 Go 源码尚未取得；本次 ARM64 HTTP 兼容修复的生成代码保存在 `scripts/patch_controller_http.js`，可从仓库组件包重建修复后的控制器：

```sh
node scripts/patch_controller_http.js tproxy-yq.zip clashctl_arm64.http
```

输出文件必须不存在。设备端修复和写入校验代码在 `猫猫TProxy.js` 中。

## License

AGPL-3.0
