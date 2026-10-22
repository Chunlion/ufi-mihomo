# 项目记忆

## 发布流程：顺序不能错

`package_plugin.py` 靠 sha 断言校验前置报告，顺序必须如下：

1. `python3 scripts/build_gist_sync.py`
   **注意**：第 31 行会调 `sync_gist_plugin.js` **改写主插件**（同步 gist 文案，2026-10-21 那次 +439 字节）。
2. `node scripts/verify_plugin.js` → `reports/v9.0.0-regression.json`
3. `node scripts/report_plugin.js` → `reports/v9.0.0-size.json`
4. `python3 scripts/package_plugin.py` → dist 主包，并调用 `package_gist_sync.py`

顺序错的典型报错：`AssertionError: Plugin changed: rebuild first` 或 `source.bytes` 不匹配。跑完第 1 步必须重跑 2~4，否则报告与新插件 sha 对不上。

**漏第 4 步的后果**：`dist/` 里躺的是旧插件（`2f33e73` 就漏过，交付包与源码不一致）。这一条**不能**用测试兜底——测试红会让 `package_plugin.py` 的 `failed==0` 断言不通过，dist 永远重建不了，形成死锁。只能靠流程。

## Gist 托管：更新订阅 = 机场链接 + Gist 各刷一次

`updateSubProviders` 的自定义配置分支（`configSource === 'uploaded_config'`，Gist 托管也走这里）顺序固定：先 `convertSubscriptionsLocally` + `forceUpdateProvidersFromConfig({refreshRemote:true})` 更新机场链接，再 `f50GistUpdateSources(gist)` 同步 Gist 内容。**不要**在函数开头短路成 Gist 同步，否则机场链接永远不刷新。

- `f50GistUpdateSources(st, sources)` 的第二个参数只有 `saveSubSources`「保存并更新」才传（合并手动链接）；更新订阅保持 `undefined`。
- `f50GistManaged()` 会抛异常，调用点必须 try/catch，否则前面成功的机场更新会一起作废。
- Gist 函数维护源是 `gist-sync/plugin-gist.js`：`build_gist_sync.py` 会用 `  const F50_GIST_HELPER` → `  // ===== Basic helpers =====` 之间的内容覆盖主插件。改 gist 逻辑必须改这个源文件。

## 无法按 git 作者区分「谁写的提交」

226 个提交的 author/committer 全是 `Chunlion <w1074754192@gmail.com>`（只有 `dda40ff` 来自 GitHub 网页端 noreply），提交 body 也筛不出来（200+ 个都是空 body）。要区分「我生成的 / 别人或别的工具生成的」，只能用**本会话已知的提交哈希 + 时间戳**在 `git log --date=iso` 里夹逼。仓库里的 `.codex/` 说明有另一个 AI 工具在并行产出，遇到夹在会话提交之间的陌生哈希先按「非本会话」处理。

## 更新订阅时的「重建配置」必须有提示

`updateSubProviders` 里 `!modeReady`（provider 数量/类型/路径与订阅设置不符）会走 `saveSubSources(..., {applyToCustom:true})` 整份重建 config.yaml 并重启核心。这条分支**必须 toast**——否则用户手改的 provider 定义会被无声覆盖。地址变化另有文案，两者不能混用。（2026-10-22 修，见 `7e41d67`）

## 全量回归只能在 WSL 跑

Windows 不可作为判据：`tests/tproxy/*` 大量用例用 `spawnSync('sh')` + fixture 脚本，Git Bash 不解析 `C:/...` 形式的 PATH 条目（`ip6tables` 直接 127 not found），15s 超时也会被打爆。qemu 用例（`http_subscription`）同样如此：Windows 侧会撞 `native()` 的 30s 超时（stdout 全空）。

Windows 侧若必须单跑：`export PATH="/tmp/f50-bintar:$PATH"`（先 `cp /c/Windows/System32/tar.exe /tmp/f50-bintar/tar.exe`，这就是 bsdtar；`/tmp` 每次会被清），且 `F50_TEST_QEMU` 必须给 **Windows 风格路径**（`C:/Users/...`）——Git Bash 环境变量里的 `/c/Users/...` 经 `linuxPath()` 会变成 `/mnt//Users/...`。

```
wsl -d Debian -- bash -c 'export PATH=/tmp/f50-shim:/usr/local/bin:/usr/bin:/bin; cd /mnt/c/.../Tproxy-F50 && F50_TEST_YQ=$PWD/.cache/gist-sync/tools/yq-linux-amd64 F50_TEST_QEMU=$PWD/.cache/gist-sync/tools/qemu-aarch64 node scripts/verify_plugin.js'
```

- `bash -c` 里**不要展开 `$PATH`**：Windows PATH 含 `Program Files (x86)`，括号会直接把 bash 语法打炸。准确说是**外层 Git Bash 会展开命令串里所有 `$VAR`**（`$YQ` 会变空串）；要在 WSL 内用变量必须写 `\$VAR`，或多行逻辑写进脚本文件再 `sh script.sh`。
- WSL 的 GNU tar 读不了 zip，但测试用 `tar -xOf *.zip`：先 `ln -sf /usr/bin/bsdtar /tmp/f50-shim/tar` 并前置 PATH。
- 不要前置整个 `/c/Windows/System32`，会劫持 `find`/`timeout` 制造假失败。

## 防回退：c57e4e8 夹带删除

`c57e4e8 "Fix F50 IPv6 DNS compatibility scripts"` 修 DNS 时顺手删了无关功能，2026-10-21 已恢复：

- `isPrivateOrReservedIpv4/Ipv6` 与 `validateLocalSubscriptionUrl` 的回环/私网/保留地址拒绝。`docs/SECURITY_MODEL.md:35` 明确要求「不能删除目的地址验证」。
- `dataSpaceGuardCmd`（安装/下载前 /data 可用空间检查）。定义必须放在 `rotateClashLogCmd` **之后**，否则 `run_tests.js` 的 slice 起点取不到。

同一提交还删了 `runShellWithRootRetry`（唯一调用点也没了，等价语义由 `runShellWithRoot` 承担，对应测试已删除并留注释）。

## 组件包内核升级

`python3 scripts/update_package_core.py <core文件> <v1.19.x>`，core 文件要先 gunzip（脚本不收 .gz）。

必须下 **Android arm64-v8** 资产（`mihomo-android-arm64-v8-vX.gz`，AArch64 ELF、链 `/system/bin/linker64`）——包里一直是这个构建，脚本也强制校验这两点。换内核后按发布四步重建 dist。

Android 二进制在 qemu 下跑不了（缺 linker64），要验行为就下 amd64 版到 WSL，用 `.cache/mihomo/verify_provider_api.py` 驱动（断言 PUT 触发重下载、`use:` 组刷新、provider 文件重写）。

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

## yq 合并的两个坑（设备端 v4.53.3，与 `.cache/gist-sync/tools/yq-linux-amd64` 同源）

- `select(cond) | {}` 在条件为假时**仍会产出 1 个文档**（空流的右侧照样执行一次）→ 整个合并输出两份 YAML → `yaml: duplicate mapping key`。空值兜底必须写 `select(tag == "!!map") // {}`，只有 `//` 会吃掉空流。
- `{} * "on"` / `{} * [1,2]` 直接报 `cannot multiply`；`omit()` 对非 map 是静默直通，`pick()` 才报错。合并用户手改值前先归一：`with_entries(select((.value | tag) == "!!map" or (.key | test("^(dns|tun|sniffer|profile)$") | not)))`。

## 设备 fetch-batch（本地转换）的行为事实

qemu + stub curl/converter 实测（2026-10-22，控制器 8.0.0-compat.2.3）：

- **每次调用都真实下载**：连跑两次（不同 URL）→ curl 2 次、converter 2 次，没有「复用旧结果」的短路。curl 调用形如 `-q --silent --show-error --http1.1 --noproxy * --proto =http,https --max-redirs 0 --resolve host:port:ip -A <UA> -D <headers> -w '\n%{http_code}'`，**body 走 stdout，末尾追加 `\n<状态码>`**（无 `-o`）。
- **「Mihomo YAML」判定只接受 JSON**：YAML 文本一律转 converter；converter 缺失 → `subscription is not Mihomo YAML and local URI converter failed`。converter 输出也必须是 **JSON object**，输出 YAML → `subscription is not a YAML/JSON object`。
- **沙箱构造不出成功提交**：任何合法节点都停在 `node validation failed: `（原因串为空）。所以别断言 `ok:true`，改断言「下载次数」这类可观测行为（见 `http_subscription.test.js` 的 re-fetches 用例）。

## 安装脚本体积预算只剩 15 字节

`optimization_network.test.js` 要求 install 脚本比旧版基线小 25000 字节，`2f33e73` 时 saving=25015。新增 installer 文本必须先想好去哪省：
- 解释性注释放 JS 侧（`function buildXxx()` 上方），生成的 shell 里每行都算字节，中文 1 字符=3 字节；
- 能一行绑定别写五行（如上面那条 with_entries 归一，比 5 个 `as $x` 绑定省 240 字节）。

## 测试维护约定

- `run_tests.js` 用字符串标记 slice 取片段：重命名/移动符号时必须同步改标记，否则报 `missing source markers`。常量从闭包提到顶层后同样要补切片（KPR 切片在 `run_tests.js` 和 `optimization_network.test.js` 各有一处）；`run_tests.js` 那处只能用不依赖 `PROFILE_DELTA` 的窄区间（`const CONTROLLED_TOP_KEYS` → `function buildF50EmergencyScript`），用 `const F50_ORIGINAL_MANAGED_KEYS` 开头会把 `F50_ORIGINAL_TUN_KEYS` 也带进来而沙箱里没有 `PROFILE_DELTA`。
- `tests/gist-sync/expected-contracts.json` 是维护脚本的 hash 快照。改了 maintenance 函数要么更新快照，要么让测试红着——不允许跳过断言。
- 函数声明正则要同时接受 `() {` 和 `() (`（POSIX 子 shell 形式），只认前者会误报「未声明」。
- 新增 sandbox 依赖时，注意同一个文件里可能有多个 sandbox，容易漏掉其中一个（`download_archive.test.js` 就漏过 `dataSpaceGuardCmd`）。
