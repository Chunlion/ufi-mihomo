# 本轮构建与测试报告

源码 SHA-256：`03c00549ba701adbf26cd76a4d38e47c94800a4b083997d78c1a2ba62359d3fa`
完整包 SHA-256：`29a48b34825b7404e4c1823a69ebf7ed54ed7f5f969cfe0c21de56a80a2aec10`

原功能回归：412 PASS，0 FAIL，0 NOT RUN。
Go 测试的硬件占位项仍为 BLOCKED，不计为设备通过。

本次为用户精简界面的定向验证；未重跑的组件测试保留原记录，程序哈希与集成测试一致。
所有失败尝试保留在 `evidence.jsonl` 和 `logs/`。

- **clean repository component build** — STATIC / PASS；退出码 `0`；10.101 秒。
  命令：`D:\Python\Python313\python.exe scripts/build_gist_sync.py`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064429943138900-clean_repository_component_build.stdout.log`；stderr：`reports\gist-sync\logs\1792064429943138900-clean_repository_component_build.stderr.log`。

- **pinned genuine test tools** — STATIC / PASS；退出码 `0`；2.975 秒。
  命令：`D:\Python\Python313\python.exe scripts/gist_test_tools.py`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064432921905600-pinned_genuine_test_tools.stdout.log`；stderr：`reports\gist-sync\logs\1792064432921905600-pinned_genuine_test_tools.stderr.log`。

- **ZIP reader permission** — STATIC / PASS；退出码 `0`；0.147 秒。
  命令：`wsl -d Debian -- chmod 755 /mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/.cache/gist-sync/bin/tar`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064433069283300-ZIP_reader_permission.stdout.log`；stderr：`reports\gist-sync\logs\1792064433069283300-ZIP_reader_permission.stderr.log`。

- **syntax 猫猫TProxy.js** — STATIC / PASS；退出码 `0`；0.09 秒。
  命令：`node --check 猫猫TProxy.js`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064433161617400-syntax___TProxy_js.stdout.log`；stderr：`reports\gist-sync\logs\1792064433161617400-syntax___TProxy_js.stderr.log`。

- **syntax gist-sync/plugin-gist.js** — STATIC / PASS；退出码 `0`；0.094 秒。
  命令：`node --check gist-sync/plugin-gist.js`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064433257383400-syntax_gist-sync_plugin-gist_js.stdout.log`；stderr：`reports\gist-sync\logs\1792064433257383400-syntax_gist-sync_plugin-gist_js.stderr.log`。

- **syntax gist-sync/ui-gist.js** — STATIC / PASS；退出码 `0`；0.099 秒。
  命令：`node --check gist-sync/ui-gist.js`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064433358357000-syntax_gist-sync_ui-gist_js.stdout.log`；stderr：`reports\gist-sync\logs\1792064433358357000-syntax_gist-sync_ui-gist_js.stderr.log`。

- **Shell syntax Clash.GistSync** — STATIC / PASS；退出码 `0`；0.143 秒。
  命令：`wsl -d Debian -- sh -n /mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/build/gist-sync/clash/Scripts/Clash.GistSync`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064433503502000-Shell_syntax_Clash_GistSync.stdout.log`；stderr：`reports\gist-sync\logs\1792064433503502000-Shell_syntax_Clash_GistSync.stderr.log`。

- **BusyBox syntax Clash.GistSync** — STATIC / PASS；退出码 `0`；0.154 秒。
  命令：`wsl -d Debian -- busybox ash -n /mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/build/gist-sync/clash/Scripts/Clash.GistSync`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064433659808400-BusyBox_syntax_Clash_GistSync.stdout.log`；stderr：`reports\gist-sync\logs\1792064433659808400-BusyBox_syntax_Clash_GistSync.stderr.log`。

- **Shell syntax Clash.ConfigCommit** — STATIC / PASS；退出码 `0`；0.137 秒。
  命令：`wsl -d Debian -- sh -n /mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/build/gist-sync/clash/Scripts/Clash.ConfigCommit`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064433799095400-Shell_syntax_Clash_ConfigCommit.stdout.log`；stderr：`reports\gist-sync\logs\1792064433799095400-Shell_syntax_Clash_ConfigCommit.stderr.log`。

- **BusyBox syntax Clash.ConfigCommit** — STATIC / PASS；退出码 `0`；0.163 秒。
  命令：`wsl -d Debian -- busybox ash -n /mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/build/gist-sync/clash/Scripts/Clash.ConfigCommit`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064433963690700-BusyBox_syntax_Clash_ConfigCommit.stdout.log`；stderr：`reports\gist-sync\logs\1792064433963690700-BusyBox_syntax_Clash_ConfigCommit.stderr.log`。

- **Gist UI and protocol rc3-ui.js** — MOCK / PASS；退出码 `0`；0.277 秒。
  命令：`wsl -d Debian -- node /mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/tests/gist-sync/rc3-ui.js`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064434249354200-Gist_UI_and_protocol_rc3-ui_js.stdout.log`；stderr：`reports\gist-sync\logs\1792064434249354200-Gist_UI_and_protocol_rc3-ui_js.stderr.log`。

- **Gist UI and protocol ui-logic.js** — MOCK / PASS；退出码 `0`；0.189 秒。
  命令：`wsl -d Debian -- node /mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/tests/gist-sync/ui-logic.js`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064434440281100-Gist_UI_and_protocol_ui-logic_js.stdout.log`；stderr：`reports\gist-sync\logs\1792064434440281100-Gist_UI_and_protocol_ui-logic_js.stderr.log`。

- **full original regression including ARM64 emulation** — MOCK / PASS；退出码 `0`；73.111 秒。
  命令：`wsl -d Debian -- env PATH=/mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/.cache/gist-sync/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin F50_TEST_YQ=/mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/.cache/gist-sync/tools/yq-linux-amd64 F50_TEST_QEMU=/mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/.cache/gist-sync/tools/qemu-aarch64 node /mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/scripts/verify_plugin.js`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064507553267000-full_original_regression_including_ARM64_emulation.stdout.log`；stderr：`reports\gist-sync\logs\1792064507553267000-full_original_regression_including_ARM64_emulation.stderr.log`。

- **package hashes, ELF and original component preservation** — STATIC / PASS；退出码 `0`；2.885 秒。
  命令：`D:\Python\Python313\python.exe tests/gist-sync/package-check.py`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064510439472600-package_hashes__ELF_and_original_component_preservation.stdout.log`；stderr：`reports\gist-sync\logs\1792064510439472600-package_hashes__ELF_and_original_component_preservation.stderr.log`。

- **Tabbit real interactions with simulated device API** — MOCK / PASS；退出码 `0`；59.527 秒。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id final-browser-1792064510444118400 --timeout-ms 120000`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064569970275700-Tabbit_real_interactions_with_simulated_device_API.stdout.log`；stderr：`reports\gist-sync\logs\1792064569970275700-Tabbit_real_interactions_with_simulated_device_API.stderr.log`。

- **final source size report** — STATIC / PASS；退出码 `0`；0.641 秒。
  命令：`node scripts/report_plugin.js`。
  环境：Windows；wsl 命令运行于 Debian；Tabbit 为普通 Chromium。
  stdout：`reports\gist-sync\logs\1792064570613774500-final_source_size_report.stdout.log`；stderr：`reports\gist-sync\logs\1792064570613774500-final_source_size_report.stderr.log`。

## 真实组件覆盖

genuine production CLI, age, yq, Mihomo; local TLS fixture; isolated Off service adapter

- INTEGRATION PASS：post-install initialization makes first read-only fingerprint available。
- INTEGRATION PASS：production CLI HTTPS download, genuine age decrypt, YAML and Mihomo -t。
- INTEGRATION PASS：real files, backup, atomic commit and matching state while stopped。
- INTEGRATION PASS：genuine Mihomo hot reload and runtime confirmation。
- INTEGRATION PASS：reencrypted unchanged config keeps genuine core PID。
- INTEGRATION PASS：real age decrypt followed by invalid YAML preserves current files。
- INTEGRATION PASS：corrupt ciphertext never reaches commit。
- INTEGRATION PASS：local edit conflict is never silently overwritten。
- INTEGRATION PASS：genuine age rejects wrong identity without a configuration write。
- INTEGRATION PASS：genuine age rejects truncated authenticated ciphertext。
- INTEGRATION PASS：real HTTPS 503 retries then preserves configuration。
- INTEGRATION PASS：real in-flight HTTPS cancellation cannot commit。
- INTEGRATION PASS：source revision change fences the old downloader before commit。
- INTEGRATION PASS：SIGKILL recovery at download_complete。
- INTEGRATION PASS：SIGKILL recovery at decrypt_complete。
- INTEGRATION PASS：SIGKILL recovery at before_commit。
- INTEGRATION PASS：SIGKILL recovery at after_commit。
- INTEGRATION PASS：SIGKILL recovery at before_state_record。
- INTEGRATION PASS：actual read-only configuration filesystem fails safely and recovers。
- INTEGRATION PASS：genuine API connection loss, denied restart, rollback and later recovery。
- INTEGRATION PASS：detached daemon, due work, repeated saves, boot hook and disable。
- INTEGRATION PASS：private identity absent from logs, receipts and leftover work。

## F50 本轮实测

用户已授权备份后安装升级，不切换模式。完整备份位于设备 root 专用目录，指针 `/data/local/tmp/maomao-rc4-backup.path`。
完整包升级及事务收尾成功；配置、来源、策略哈希与备份一致。核心只有一个，API HTTP 200，保持 TProxy。
宿主已保存当前精简 JS，重新打开后逐字回读一致，其余六个插件未变。
旧页面空链接触发 invalid_gist_url 已实机复现。新版空/错误链接在页面拦截，未新建设备任务。
正式 ARM64 同步程序通过真实 HTTPS 下载用户 Gist，密文 SHA 与电脑下载一致；独立错误私钥被拒绝，确认配置指纹保持不变。此项是预期失败的负向测试，不是生产 Gist 解密成功。

- **genuine initial status and full transaction regression** — INTEGRATION / PASS；退出码 `0`。
  命令：`wsl -d Debian -- python3 /mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/tests/gist-sync/integration.py`；环境：Windows / Debian WSL。
  stdout：`reports\gist-sync\logs\1792051332553149300-genuine_initial_status_and_full_transaction_regression.stdout.log`；stderr：`reports\gist-sync\logs\1792051332553149300-genuine_initial_status_and_full_transaction_regression.stderr.log`。

- **reproduce empty link invalid_gist_url on old installed UI** — DEVICE / PASS；退出码 `0`。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id minimal-ui-reproduce-39`；环境：Tabbit / F50 Android 13 ARM64。
  stdout：`reports\gist-sync\logs\1792063915952436000-reproduce_empty_link_invalid_gist_url_on_old_installed_UI.stdout.log`；stderr：`reports\gist-sync\logs\1792063915952436000-reproduce_empty_link_invalid_gist_url_on_old_installed_UI.stderr.log`。

- **upgrade approved complete package retaining production mode** — DEVICE / PASS；退出码 `0`。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id minimal-install-41 --timeout-ms 180000`；环境：Tabbit / F50 Android 13 ARM64。
  stdout：`reports\gist-sync\logs\1792064081682514300-upgrade_approved_complete_package_retaining_production_mode.stdout.log`；stderr：`reports\gist-sync\logs\1792064081682514300-upgrade_approved_complete_package_retaining_production_mode.stderr.log`。

- **verify actual upgraded components core and configuration** — DEVICE / PASS；退出码 `0`。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id minimal-postcheck-42 --timeout-ms 180000`；环境：Tabbit / F50 Android 13 ARM64。
  stdout：`reports\gist-sync\logs\1792064088645109100-verify_actual_upgraded_components_core_and_configuration.stdout.log`；stderr：`reports\gist-sync\logs\1792064088645109100-verify_actual_upgraded_components_core_and_configuration.stderr.log`。

- **persist user minimal plugin preserving other six entries** — DEVICE / PASS；退出码 `0`。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id minimal-plugin-save-43 --timeout-ms 120000`；环境：Tabbit / F50 Android 13 ARM64。
  stdout：`reports\gist-sync\logs\1792064135043090300-persist_user_minimal_plugin_preserving_other_six_entries.stdout.log`；stderr：`reports\gist-sync\logs\1792064135043090300-persist_user_minimal_plugin_preserving_other_six_entries.stderr.log`。

- **actual minimal UI input download and negative decryption** — DEVICE/LIVE / FAIL；退出码 `70`。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id minimal-device-ui-46 --timeout-ms 180000`；环境：Tabbit / F50 Android 13 ARM64。
  stdout：`reports\gist-sync\logs\1792064238687345000-actual_minimal_UI_input_download_and_negative_decryption.stdout.log`；stderr：`reports\gist-sync\logs\1792064238687345000-actual_minimal_UI_input_download_and_negative_decryption.stderr.log`。

- **actual minimal UI input download and negative decryption** — DEVICE/LIVE / FAIL；退出码 `70`。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id minimal-device-ui-47 --timeout-ms 180000`；环境：Tabbit / F50 Android 13 ARM64。
  stdout：`reports\gist-sync\logs\1792064264871729200-actual_minimal_UI_input_download_and_negative_decryption.stdout.log`；stderr：`reports\gist-sync\logs\1792064264871729200-actual_minimal_UI_input_download_and_negative_decryption.stderr.log`。

- **actual minimal UI input download and negative decryption** — DEVICE/LIVE / FAIL；退出码 `70`。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id minimal-device-ui-49 --timeout-ms 180000`；环境：Tabbit / F50 Android 13 ARM64。
  stdout：`reports\gist-sync\logs\1792064320518925500-actual_minimal_UI_input_download_and_negative_decryption.stdout.log`；stderr：`reports\gist-sync\logs\1792064320518925500-actual_minimal_UI_input_download_and_negative_decryption.stderr.log`。

- **verify real downloader and confirmed fingerprint after initialization fix** — DEVICE/LIVE / PASS；退出码 `0`。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id minimal-live-native-50 --timeout-ms 180000`；环境：Tabbit / F50 Android 13 ARM64。
  stdout：`reports\gist-sync\logs\1792064406241104900-verify_real_downloader_and_confirmed_fingerprint_after_initialization_fix.stdout.log`；stderr：`reports\gist-sync\logs\1792064406241104900-verify_real_downloader_and_confirmed_fingerprint_after_initialization_fix.stderr.log`。

- **Raw URL boundary regression** — UNIT / PASS；退出码 `0`。
  命令：`wsl -d Debian -- /mnt/c/Users/Cuty/Desktop/Github/Tproxy-F50/build/gist-sync/bin/native.test -test.run ^TestURLValidation$ -test.v`；环境：Windows / Debian WSL。
  stdout：`reports\gist-sync\logs\1792064616021026100-Raw_URL_boundary_regression.stdout.log`；stderr：`reports\gist-sync\logs\1792064616021026100-Raw_URL_boundary_regression.stderr.log`。

- **actual F50 empty-link rejection and minimal UI** — DEVICE / PASS；退出码 `0`。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id minimal-device-input-51`；环境：Tabbit / F50 Android 13 ARM64。
  stdout：`reports\gist-sync\logs\1792064658512016400-actual_F50_empty-link_rejection_and_minimal_UI.stdout.log`；stderr：`reports\gist-sync\logs\1792064658512016400-actual_F50_empty-link_rejection_and_minimal_UI.stderr.log`。

- **actual F50 empty-link rejection and minimal UI** — DEVICE / PASS；退出码 `0`。
  命令：`C:\Users\Cuty\AppData\Local\Tabbit\LocalAgent\bin\tabbit-cli.exe nodejs --task "GistSync network validation" --request-id minimal-device-input-53`；环境：Tabbit / F50 Android 13 ARM64。
  stdout：`reports\gist-sync\logs\1792064729809312500-actual_F50_empty-link_rejection_and_minimal_UI.stdout.log`；stderr：`reports\gist-sync\logs\1792064729809312500-actual_F50_empty-link_rejection_and_minimal_UI.stderr.log`。


## BLOCKED 与限制

- 真实 TProxy/TUN/Off 数据流量、设备重启及长时间自动同步未执行；本次只授权安装升级、不切换模式。
- 生产私钥未提供，没有解密用户真实 Gist。Raw HTTPS、状态码、大小、两次 SHA 和变化检测见 `live.json`；Node 的成功不替代生产 Go 客户端 LIVE 成功。
- 电脑 WSL 的 Go LIVE 被 Fake-IP 检查阻止；F50 正式程序已成功下载相同 Gist。电脑失败退出码和日志保留，没有放开 SSRF 或 TLS 检查。
- F50 页面完整交互测试未完成：浏览器标签页在提交/等待期间关闭，相关 FAIL 原样保留。已读回实际设备回执，任务正确下载后因测试私钥不匹配失败，未写配置；没有把页面测试整体标为 PASS。
- 普通浏览器交互使用真实 Chromium 与模拟设备 API，截图和颜色见 `browser-ui.png/json`。Android WebView 原生下拉弹窗未验证。
- 后台测试使用实际独立进程，将持久化到期时间设为过去，没有等待 24 小时或重启设备。期限/重试有 UNIT 覆盖；F50 长时间网络恢复待验证。
- 正常配置链路使用正式 AMD64 程序、真实 age/yq/Mihomo 和隔离 TLS。Off 服务适配器确认实际 API，不证明 Android 防火墙执行。仅测试二进制提供挂起点，以 SIGKILL 复现崩溃。
- 在线完整包尚未发布。没有推送或正式发布；组件仅安装到已授权设备。

构建、安全边界与实机准备步骤见 `docs/gist-sync.md`。
