# 开机自启修复 · 沙盒回归测试

在开发机上把 `开机自启修复.js` 当成真实插件跑起来，验证它对**任意插件**的启动指令都安全。

## 怎么跑

```bash
node tests/boot-fix/run_tests.js
```

```bash
node tests/boot-fix/compat_check.js
```

前者是功能回归（26 个用例），后者是可移植性检查（多 shell 语法 + 外部命令参数）。

## 它是怎么工作的

`harness.js` 用一套极简 DOM 桩把插件的 IIFE 加载进 Node，接管 `runShellWithRoot`，
把脚本里的 `/sdcard` `/data` `/proc` 改写到沙盒目录，再用 **dash** 执行。
`getprop`、`whoami`、`/proc/uptime`、`sys.boot_completed` 都是可控的桩，
所以「开机第 5 秒、系统还没就绪」这种场景可以直接构造出来。

测试走的是插件真正的按钮回调（`安装 / 修复`、`检查状态`、`立即执行一次`、`卸载`），
不是被复制出来的逻辑副本。

## 环境依赖

Git Bash 自带的 `dash`（POSIX 严格程度接近设备上的 mksh）和 `busybox`（当 toybox 的替身）。
路径可用 `F50_DASH` / `F50_BASH` / `F50_BUSYBOX` 环境变量覆盖。

注意：`busybox.exe` 是原生 Windows 程序，MSYS 会改写它命令行里以 `/` 开头的参数，
所以功能测试用的是 MSYS 自带的 GNU 工具，busybox 只在 `compat_check.js` 里做参数可用性校验。

## 覆盖了什么

一条插件指令 `exit` 或卡死之后，后面的插件还能不能起来；多行写法（if/heredoc/函数）
会不会被切坏；管理器缺失时门会不会放行；启动文件被 source 时会不会打断宿主；
安装/卸载是否逐行无损；门标记损坏、CRLF、缺 shebang、`/proc/uptime` 读不到等异常输入。
