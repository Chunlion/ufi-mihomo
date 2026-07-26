# ufi-mihomo

中兴 F50 等 UFI-TOOLS 随身 WiFi 的 mihomo (Clash.Meta) 透明代理插件套件。

## 组件

| 文件 | 说明 |
|---|---|
| `猫猫TProxy_Go.js` | 主插件（推荐）。TProxy/TUN 双模式透明代理管理，内置 Go 内核读取加速（自动安装，Shell 兜底），订阅本地转换、图形化规则、设备绕过、诊断工具等 |
| `猫猫TProxy.js` | 纯 Shell 版本。功能同上但无 Go 加速与本地订阅转换，适用于不便安装二进制的场景 |
| `猫猫开机自启修复.js` | 全插件开机自启修复。以门控+回放机制统一托管 `/sdcard/ufi_tools_boot.sh` 中各插件的自启命令，等待系统就绪后再执行 |
| `binary-helper/` | Go 内核源码（`kano-f50-helper`）。为插件提供快照读取、控制器解析、订阅转换（Clash YAML / v2ray 分享链接）等 JSON 接口 |
| `dist/kano-f50-helper-linux-arm64` | Go 内核预编译二进制（linux/arm64，插件按 size+sha256+version 三重校验后安装） |

## 安装

1. 打开 UFI-TOOLS 管理页（默认 `192.168.0.1:2333`）→ 插件功能
2. 上传 `猫猫TProxy_Go.js` 与 `猫猫开机自启修复.js` 并提交
3. 刷新页面，展开「猫猫」面板 → 安装/启动核心
4. Go 内核会在后台自动安装；也可在「网络与设备 → Go内核」手动管理

## 构建 Go 内核

```bash
cd binary-helper
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o kano-f50-helper-linux-arm64 .
```

> 注意：插件以精确的 size + sha256 + version 校验二进制，任何源码改动都需要同步更新
> `猫猫TProxy_Go.js` 中的 `KANO_HELPER_VERSION` / `KANO_HELPER_SIZE` / `KANO_HELPER_SHA256` / `KANO_HELPER_DOWNLOAD_URL` 四个常量。

## License

AGPL-3.0
