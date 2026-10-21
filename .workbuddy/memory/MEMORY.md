# 项目记忆

## 发布流程：顺序不能错

`package_plugin.py` 靠 sha 断言校验前置报告，顺序必须如下：

1. `python3 scripts/build_gist_sync.py`
   **注意**：第 31 行会调 `sync_gist_plugin.js` **改写主插件**（同步 gist 文案，2026-10-21 那次 +439 字节）。
2. `node scripts/verify_plugin.js` → `reports/v9.0.0-regression.json`
3. `node scripts/report_plugin.js` → `reports/v9.0.0-size.json`
4. `python3 scripts/package_plugin.py` → dist 主包，并调用 `package_gist_sync.py`

顺序错的典型报错：`AssertionError: Plugin changed: rebuild first` 或 `source.bytes` 不匹配。跑完第 1 步必须重跑 2~4，否则报告与新插件 sha 对不上。

## 全量回归只能在 WSL 跑

Windows 不可作为判据：`tests/tproxy/*` 大量用例用 `spawnSync('sh')` + fixture 脚本，Git Bash 不解析 `C:/...` 形式的 PATH 条目（`ip6tables` 直接 127 not found），15s 超时也会被打爆。

```
wsl -d Debian -- bash -c 'export PATH=/tmp/f50-shim:/usr/local/bin:/usr/bin:/bin; cd /mnt/c/.../Tproxy-F50 && F50_TEST_YQ=$PWD/.cache/gist-sync/tools/yq-linux-amd64 F50_TEST_QEMU=$PWD/.cache/gist-sync/tools/qemu-aarch64 node scripts/verify_plugin.js'
```

- `bash -c` 里**不要展开 `$PATH`**：Windows PATH 含 `Program Files (x86)`，括号会直接把 bash 语法打炸。
- WSL 的 GNU tar 读不了 zip，但测试用 `tar -xOf *.zip`：先 `ln -sf /usr/bin/bsdtar /tmp/f50-shim/tar` 并前置 PATH。
- 不要前置整个 `/c/Windows/System32`，会劫持 `find`/`timeout` 制造假失败。

## 防回退：c57e4e8 夹带删除

`c57e4e8 "Fix F50 IPv6 DNS compatibility scripts"` 修 DNS 时顺手删了无关功能，2026-10-21 已恢复：

- `isPrivateOrReservedIpv4/Ipv6` 与 `validateLocalSubscriptionUrl` 的回环/私网/保留地址拒绝。`docs/SECURITY_MODEL.md:35` 明确要求「不能删除目的地址验证」。
- `dataSpaceGuardCmd`（安装/下载前 /data 可用空间检查）。定义必须放在 `rotateClashLogCmd` **之后**，否则 `run_tests.js` 的 slice 起点取不到。

同一提交还删了 `runShellWithRootRetry`（唯一调用点也没了，等价语义由 `runShellWithRoot` 承担，对应测试已删除并留注释）。

## 组件包固件：改 installer 文本必须同步刷新

`tproxy-yq.zip` 里的 `Scripts/Clash.Service` 是**已安装状态**的快照（`subscription_update.test.js` 拿它当基准，断言 installer 输出与它逐字节一致）。所以只要改了 installer 发出的文本——保留块、`KANO_ORIGINAL_CONFIG_PRESERVATION` 版本、面板修复行——就必须刷新，否则报 `all surrounding service functions and calls remain intact`。

WSL 里一条命令搞定（`/tmp` 每次会被清，必须同一条命令内取+改+回写）：

```
mkdir -p /tmp/f50-shim; ln -sf /usr/bin/bsdtar /tmp/f50-shim/tar; export PATH=/tmp/f50-shim:/usr/local/bin:/usr/bin:/bin
tar -xOf tproxy-yq.zip Scripts/Clash.Service > /tmp/f50-svc.service
node scripts/refresh_package_service.js /tmp/f50-svc.service
python3 scripts/refresh_package_service.py /tmp/f50-svc.service
```

`refresh_package_service.js` 只改两段（面板修复行 + 保留块，含块内的 lease 函数），其余字节不动；`refresh_package_service.py` 负责回写 zip 成员。两者幂等。

注意：`tests/gist-sync/package-check.py` 拿 `adc9458` 的 zip 当基线，只许 `Tools/components.json` 变——**它在改 Service 之前就已经是红的**（2fefa5a/c57e4e8 都改过 Service），不要拿它当判据。日常判据只有 `verify_plugin.js`。

## 测试维护约定

- `run_tests.js` 用字符串标记 slice 取片段：重命名/移动符号时必须同步改标记，否则报 `missing source markers`。常量从闭包提到顶层后同样要补切片（KPR 切片在 `run_tests.js` 和 `optimization_network.test.js` 各有一处）；`run_tests.js` 那处只能用不依赖 `PROFILE_DELTA` 的窄区间（`const CONTROLLED_TOP_KEYS` → `function buildF50EmergencyScript`），用 `const F50_ORIGINAL_MANAGED_KEYS` 开头会把 `F50_ORIGINAL_TUN_KEYS` 也带进来而沙箱里没有 `PROFILE_DELTA`。
- `tests/gist-sync/expected-contracts.json` 是维护脚本的 hash 快照。改了 maintenance 函数要么更新快照，要么让测试红着——不允许跳过断言。
- 函数声明正则要同时接受 `() {` 和 `() (`（POSIX 子 shell 形式），只认前者会误报「未声明」。
- 新增 sandbox 依赖时，注意同一个文件里可能有多个 sandbox，容易漏掉其中一个（`download_archive.test.js` 就漏过 `dataSpaceGuardCmd`）。
