# 开机自启修复 · 沙盒回归测试

在开发机上验证 `开机自启修复.js` 的安装、启动和卸载行为。

## 运行

```bash
node tests/boot-fix/run_tests.js
```

```bash
node tests/boot-fix/compat_check.js
```

## 环境依赖

需要 Git Bash 提供的 `dash` 和 `busybox`。可通过 `F50_DASH`、`F50_BASH`、`F50_BUSYBOX` 覆盖路径。

## 覆盖了什么

覆盖原生启动顺序、幂等安装、冷启动恢复、失败隔离、多行 Shell、安装与卸载，以及 CRLF、损坏标记、缺少 shebang 等异常输入。
