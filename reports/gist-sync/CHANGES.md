# 修改差异

仓库：`C:/Users/Cuty/Desktop/Github/Tproxy-F50`；分支 `main`；本轮基线 `adc9458d69b4caff2b6f79e8b6b773429acf0dc8`。
初始只有用户已有的未跟踪 `AGENTS.md`，保持原样且不纳入提交。
RC2/RC3 是独立交付来源；维护源码、构建和测试均已纳入本仓库，没有初始化替代仓库。

- 主插件纳入 Gist 设置、下载、解密、配置事务、互斥、来源保护及恢复；Controller 协议、固定 Secret 和网络规则保留。
- 默认完整组件包增加 age、同步程序、脚本和清单；安装前校验文件哈希、程序退出状态及版本；重复升级保留设置与私钥。在线包未发布，停止使用缺少 GistSync 的旧镜像。
- JS 与 Gist 共用配置事务生成器。Go、模块 UI、构建和测试脚本纳入仓库。
- 响应带边界和退出码，组件缺失有准确分类；私钥请求通过设备一次性公钥加密，不调用图片上传。
- select 明确颜色、字体和高度。移除独立安装入口。实测修复重复 DOM ID、无事务恢复时空错误码。
- 采用用户提供的精简界面。空链接不再提交设备任务，清理粘贴链接两端的不可见字符；主按钮统一为“应用”，同一设备任务保存设置并同步 YAML，后台按所选间隔继续更新。首次状态查询的 yq 目录在初始化时建立。
- 订阅设置读取 Gist 的订阅与内置节点；手动订阅通过同一设备同步任务保存并合并，后续自动同步持续保留，按 URL 去重，不重建本地模板。新增手动 Provider 下载采用 DIRECT，确认实际节点后才报告加载成功；下载失败验证原配置回滚。
- 新增真实组件、SIGKILL、只读目录、API 失联、来源切换、取消和后台调度验证。旧测试补齐依赖；变化的 Shell 输出使用审查快照精确断言，验证器不会更新预期。

```text
.gitattributes                                     |   8 +
 .gitignore                                         |   3 +
 README.md                                          |   8 +-
 dist/v9.0.0-delivery.json                          |  18 +-
 ...62\276\347\256\200\344\272\244\344\273\230.zip" | Bin 253933 -> 278967 bytes
 docs/gist-sync.md                                  |  61 ++
 gist-sync/Clash.GistSync                           |   6 +
 gist-sync/age.json                                 |   7 +
 gist-sync/native/api.go                            | 190 ++++++
 gist-sync/native/cli_integration_test.go           |  41 ++
 gist-sync/native/common.go                         | 414 ++++++++++++
 gist-sync/native/config.go                         | 328 +++++++++
 gist-sync/native/daemon.go                         | 288 ++++++++
 gist-sync/native/download.go                       | 297 +++++++++
 gist-sync/native/download_test.go                  | 178 +++++
 gist-sync/native/go.mod                            |   3 +
 gist-sync/native/hardening_test.go                 |  70 ++
 gist-sync/native/housekeeping.go                   |  88 +++
 gist-sync/native/housekeeping_test.go              |  88 +++
 gist-sync/native/jobs.go                           | 284 ++++++++
 gist-sync/native/live_test.go                      |  38 ++
 gist-sync/native/locks.go                          | 335 ++++++++++
 gist-sync/native/main.go                           | 151 +++++
 gist-sync/native/normalize.go                      | 575 ++++++++++++++++
 gist-sync/native/normalize_test.go                 |  85 +++
 gist-sync/native/process_test.go                   | 423 ++++++++++++
 gist-sync/native/profiles.json                     | 681 +++++++++++++++++++
 gist-sync/native/real_age_test.go                  | 114 ++++
 gist-sync/native/sealed.go                         | 164 +++++
 gist-sync/native/sealed_test.go                    | 103 +++
 gist-sync/native/settings.go                       | 450 +++++++++++++
 gist-sync/native/sources.go                        | 207 ++++++
 gist-sync/native/sources_test.go                   | 153 +++++
 gist-sync/native/transaction.go                    | 492 ++++++++++++++
 gist-sync/native/transaction_test.go               | 459 +++++++++++++
 gist-sync/plugin-gist.js                           | 205 ++++++
 gist-sync/release.json                             |   6 +
 gist-sync/test-tools.json                          |  24 +
 gist-sync/ui-gist.js                               | 116 ++++
 reports/gist-sync/CHANGES.md                       | 734 +++++++++++++++++++++
 reports/gist-sync/DEVICE-PLAN.md                   |  17 +
 reports/gist-sync/TEST-REPORT.md                   | 212 ++++++
 reports/gist-sync/base-run.json                    | 678 +++++++++++++++++++
 reports/gist-sync/baseline.json                    |  12 +
 reports/gist-sync/browser-ui.json                  | 110 +++
 reports/gist-sync/browser-ui.png                   | Bin 0 -> 78966 bytes
 reports/gist-sync/changes.patch                    | Bin 0 -> 511960 bytes
 reports/gist-sync/device-input.json                |  30 +
 reports/gist-sync/device-input.png                 | Bin 0 -> 369570 bytes
 reports/gist-sync/device-install.json              |  14 +
 reports/gist-sync/device-live.json                 |  33 +
 reports/gist-sync/device-observed-user-state.json  |  29 +
 reports/gist-sync/device-plugin-update.json        |   7 +
 reports/gist-sync/device-postcheck.json            |   4 +
 reports/gist-sync/device-saved-test.json           |  35 +
 reports/gist-sync/evidence.jsonl                   | 341 ++++++++++
 reports/gist-sync/git-proof.json                   |  13 +
 reports/gist-sync/integration.json                 | 150 +++++
 reports/gist-sync/latest-run.json                  | 572 ++++++++++++++++
 reports/gist-sync/live.json                        |  15 +
 ...08058188200-F50_read-only_inspection.stderr.log | Bin 0 -> 69 bytes
 ...08058188200-F50_read-only_inspection.stdout.log | Bin
 ...28118845400-F50_read-only_inspection.stderr.log | Bin 0 -> 45 bytes
 ...28118845400-F50_read-only_inspection.stdout.log | Bin 0 -> 839 bytes
 ...211894700-repository_component_build.stderr.log | Bin
 ...211894700-repository_component_build.stdout.log | Bin 0 -> 613 bytes
 ...900-official_Mihomo_release_metadata.stderr.log | Bin 0 -> 219 bytes
 ...900-official_Mihomo_release_metadata.stdout.log | Bin
 ...ial_Mihomo_metadata_via_OpenSSL_curl.stderr.log | Bin 0 -> 56 bytes
 ...ial_Mihomo_metadata_via_OpenSSL_curl.stdout.log | Bin
 ...ficial_Mihomo_metadata_with_Node_TLS.stderr.log | Bin
 ...ficial_Mihomo_metadata_with_Node_TLS.stdout.log | Bin 0 -> 126 bytes
 ...800-pinned_genuine_integration_tools.stderr.log | Bin 0 -> 1953 bytes
 ...800-pinned_genuine_integration_tools.stdout.log | Bin
 ...-pinned_tools_via_official_asset_API.stderr.log | Bin
 ...-pinned_tools_via_official_asset_API.stdout.log | Bin 0 -> 698 bytes
 ...epository_build_before_genuine_chain.stderr.log | Bin
 ...epository_build_before_genuine_chain.stdout.log | Bin 0 -> 613 bytes
 ...ction_binary_genuine_component_chain.stderr.log | Bin 0 -> 2131 bytes
 ...ction_binary_genuine_component_chain.stdout.log | Bin
 ...ect_download_by_repository_Go_client.stderr.log | Bin
 ...ect_download_by_repository_Go_client.stdout.log | Bin 0 -> 155 bytes
 ...n_chain_in_isolated_Linux_filesystem.stderr.log | Bin 0 -> 2383 bytes
 ...n_chain_in_isolated_Linux_filesystem.stdout.log | Bin 0 -> 89 bytes
 ...diagnose_genuine_transaction_failure.stderr.log | Bin 0 -> 2383 bytes
 ...diagnose_genuine_transaction_failure.stdout.log | Bin 0 -> 186 bytes
 ...uine_chain_with_complete_POSIX_tools.stderr.log | Bin
 ...uine_chain_with_complete_POSIX_tools.stdout.log | Bin 0 -> 523 bytes
 ...046751895009600-system_DNS_diagnosis.stderr.log | Bin
 ...046751895009600-system_DNS_diagnosis.stdout.log | Bin 0 -> 101 bytes
 ...sted_public_DNS_over_HTTPS_diagnosis.stderr.log | Bin 0 -> 625 bytes
 ...sted_public_DNS_over_HTTPS_diagnosis.stdout.log | Bin
 ...icated_public_resolver_hostname_path.stderr.log | Bin
 ...icated_public_resolver_hostname_path.stdout.log | Bin 0 -> 123 bytes
 ...actual_user_Gist_HTTPS_with_Node_TLS.stderr.log | Bin
 ...actual_user_Gist_HTTPS_with_Node_TLS.stdout.log | Bin 0 -> 125 bytes
 ...ter_authenticated_Fake-IP_resolution.stderr.log | Bin
 ...ter_authenticated_Fake-IP_resolution.stdout.log | Bin 0 -> 147 bytes
 ...ry_build_after_transport_diagnostics.stderr.log | Bin
 ...ry_build_after_transport_diagnostics.stdout.log | Bin 0 -> 613 bytes
 ...ent_transaction_faults_and_scheduler.stderr.log | Bin 0 -> 3406 bytes
 ...ent_transaction_faults_and_scheduler.stdout.log | Bin 0 -> 1247 bytes
 ...ed_component_fault_tests_iteration_2.stderr.log | Bin 0 -> 2357 bytes
 ...ed_component_fault_tests_iteration_2.stdout.log | Bin 0 -> 1247 bytes
 ..._repository_full_original_regression.stderr.log | Bin
 ..._repository_full_original_regression.stdout.log | Bin 0 -> 9188 bytes
 ...th_independently_resolved_public_DNS.stderr.log | Bin 0 -> 732 bytes
 ...th_independently_resolved_public_DNS.stdout.log | Bin 0 -> 161 bytes
 ...dge_missing-component_classification.stderr.log | Bin 0 -> 45 bytes
 ...dge_missing-component_classification.stdout.log | Bin 0 -> 820 bytes
 ...23100-build_after_no-op_recovery_fix.stderr.log | Bin
 ...23100-build_after_no-op_recovery_fix.stdout.log | Bin 0 -> 613 bytes
 ...0_host_bridge_on_acquired_device_tab.stderr.log | Bin 0 -> 45 bytes
 ...0_host_bridge_on_acquired_device_tab.stdout.log | Bin 0 -> 676 bytes
 ...ed_component_fault_tests_iteration_3.stderr.log | Bin 0 -> 2404 bytes
 ...ed_component_fault_tests_iteration_3.stdout.log | Bin 0 -> 1303 bytes
 ...sk_state_after_attachment_transition.stderr.log | Bin 0 -> 45 bytes
 ...sk_state_after_attachment_transition.stdout.log | Bin 0 -> 526 bytes
 ..._with_atomic_test_driver_replacement.stderr.log | Bin 0 -> 2400 bytes
 ..._with_atomic_test_driver_replacement.stdout.log | Bin 0 -> 1462 bytes
 ...inal_regression_with_BSD_ZIP_support.stderr.log | Bin
 ...inal_regression_with_BSD_ZIP_support.stdout.log | Bin 0 -> 9189 bytes
 ...t_root_shell_and_new_response_parser.stderr.log | Bin 0 -> 45 bytes
 ...t_root_shell_and_new_response_parser.stdout.log | Bin 0 -> 550 bytes
 ...ase_observations_across_real_SIGKILL.stderr.log | Bin 0 -> 2271 bytes
 ...ase_observations_across_real_SIGKILL.stdout.log | Bin 0 -> 1556 bytes
 ...terministic_blocked_fault_boundaries.stderr.log | Bin 0 -> 2235 bytes
 ...terministic_blocked_fault_boundaries.stdout.log | Bin 0 -> 1610 bytes
 ...s_with_explicit_simulated_device_API.stderr.log | Bin 0 -> 45 bytes
 ...s_with_explicit_simulated_device_API.stdout.log | Bin 0 -> 1047 bytes
 ...ns_including_verified-state_recovery.stderr.log | Bin 0 -> 2054 bytes
 ...ns_including_verified-state_recovery.stdout.log | Bin 0 -> 1754 bytes
 ...ions_after_isolated_script_scope_fix.stderr.log | Bin 0 -> 45 bytes
 ...ions_after_isolated_script_scope_fix.stdout.log | Bin 0 -> 974 bytes
 ...e_current_repository_fresh_execution.stderr.log | Bin
 ...e_current_repository_fresh_execution.stdout.log | Bin 0 -> 19663 bytes
 ...l_regression_updated_exact_contracts.stderr.log | Bin
 ...l_regression_updated_exact_contracts.stdout.log | Bin 0 -> 9013 bytes
 ...d_with_unique_Gist_dialog_element_ID.stderr.log | Bin
 ...d_with_unique_Gist_dialog_element_ID.stdout.log | Bin 0 -> 613 bytes
 ..._and_disabled_boot_scheduler_fencing.stderr.log | Bin
 ..._and_disabled_boot_scheduler_fencing.stdout.log | Bin 0 -> 1565 bytes
 ...t_original_start_fixture_diagnostics.stderr.log | Bin
 ...t_original_start_fixture_diagnostics.stdout.log | Bin 0 -> 5901 bytes
 ...ith_its_current_real_YAML_dependency.stderr.log | Bin
 ...ith_its_current_real_YAML_dependency.stdout.log | Bin 0 -> 5978 bytes
 ...er_interaction_with_unique_dialog_ID.stderr.log | Bin 0 -> 45 bytes
 ...er_interaction_with_unique_dialog_ID.stdout.log | Bin 0 -> 3250 bytes
 ...nts_including_genuine_runtime_outage.stderr.log | Bin
 ...nts_including_genuine_runtime_outage.stdout.log | Bin 0 -> 1656 bytes
 ...after_fixture_dependency_integration.stderr.log | Bin
 ...after_fixture_dependency_integration.stdout.log | Bin 0 -> 2205 bytes
 ...atibility_and_transaction_regression.stderr.log | Bin
 ...atibility_and_transaction_regression.stdout.log | Bin 0 -> 20246 bytes
 ...tor_for_previously_unavailable_tests.stderr.log | Bin
 ...tor_for_previously_unavailable_tests.stdout.log | Bin 0 -> 128 bytes
 ...emulator_without_system_installation.stderr.log | Bin
 ...emulator_without_system_installation.stdout.log | Bin 0 -> 135 bytes
 ...ller_tests_under_actual_CPU_emulator.stderr.log | Bin
 ...ller_tests_under_actual_CPU_emulator.stdout.log | Bin 0 -> 2881 bytes
 ...ild_before_reviewed_contract_refresh.stderr.log | Bin
 ...ild_before_reviewed_contract_refresh.stdout.log | Bin 0 -> 613 bytes
 ...700-clean_repository_component_build.stderr.log | Bin
 ...700-clean_repository_component_build.stdout.log | Bin 0 -> 613 bytes
 ...0687771700-pinned_genuine_test_tools.stderr.log | Bin
 ...0687771700-pinned_genuine_test_tools.stdout.log | Bin 0 -> 570 bytes
 ...48380831760000-ZIP_reader_permission.stderr.log | Bin
 ...48380831760000-ZIP_reader_permission.stdout.log | Bin
 ...92048380898909400-syntax___TProxy_js.stderr.log | Bin
 ...92048380898909400-syntax___TProxy_js.stdout.log | Bin
 ...1800-syntax_gist-sync_plugin-gist_js.stderr.log | Bin
 ...1800-syntax_gist-sync_plugin-gist_js.stdout.log | Bin
 ...18643700-syntax_gist-sync_ui-gist_js.stderr.log | Bin
 ...18643700-syntax_gist-sync_ui-gist_js.stdout.log | Bin
 ...70866200-Shell_syntax_Clash_GistSync.stderr.log | Bin
 ...70866200-Shell_syntax_Clash_GistSync.stdout.log | Bin
 ...990900-BusyBox_syntax_Clash_GistSync.stderr.log | Bin
 ...990900-BusyBox_syntax_Clash_GistSync.stdout.log | Bin
 ...7300-Shell_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...7300-Shell_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...48382225981500-Go_vet_current_source.stderr.log | Bin
 ...48382225981500-Go_vet_current_source.stdout.log | Bin
 ...83030201400-compile_current_Go_tests.stderr.log | Bin
 ...83030201400-compile_current_Go_tests.stdout.log | Bin
 ...1764421300-Go_unit_and_process_tests.stderr.log | Bin
 ...1764421300-Go_unit_and_process_tests.stdout.log | Bin 0 -> 19663 bytes
 ...ion_CLI_real_transactions_and_daemon.stderr.log | Bin
 ...ion_CLI_real_transactions_and_daemon.stdout.log | Bin 0 -> 1656 bytes
 ...ARM64_age_real_decryption_under_QEMU.stderr.log | Bin
 ...ARM64_age_real_decryption_under_QEMU.stdout.log | Bin 0 -> 111 bytes
 ...23900-Gist_UI_and_protocol_rc3-ui_js.stderr.log | Bin
 ...23900-Gist_UI_and_protocol_rc3-ui_js.stdout.log | Bin 0 -> 32 bytes
 ...200-Gist_UI_and_protocol_ui-logic_js.stderr.log | Bin
 ...200-Gist_UI_and_protocol_ui-logic_js.stdout.log | Bin 0 -> 37 bytes
 ...regression_including_ARM64_emulation.stderr.log | Bin
 ...regression_including_ARM64_emulation.stdout.log | Bin 0 -> 946 bytes
 ..._and_original_component_preservation.stderr.log | Bin
 ..._and_original_component_preservation.stdout.log | Bin 0 -> 240 bytes
 ...TTPS_downloads_and_change_comparison.stderr.log | Bin
 ...TTPS_downloads_and_change_comparison.stdout.log | Bin 0 -> 705 bytes
 ...00011397200-compile_native_LIVE_test.stderr.log | Bin
 ...00011397200-compile_native_LIVE_test.stdout.log | Bin
 ...wnloader_on_current_external_network.stderr.log | Bin
 ...wnloader_on_current_external_network.stdout.log | Bin 0 -> 155 bytes
 ...02400-F50_device_read-only_inventory.stderr.log | Bin 0 -> 45 bytes
 ...02400-F50_device_read-only_inventory.stdout.log | Bin 0 -> 955 bytes
 ...72900-F50_real_host_response_framing.stderr.log | Bin 0 -> 45 bytes
 ...72900-F50_real_host_response_framing.stdout.log | Bin 0 -> 562 bytes
 ...teractions_with_simulated_device_API.stderr.log | Bin 0 -> 45 bytes
 ...teractions_with_simulated_device_API.stdout.log | Bin 0 -> 3465 bytes
 ...71413003000-final_source_size_report.stderr.log | Bin
 ...71413003000-final_source_size_report.stdout.log | Bin 0 -> 1488 bytes
 ...nt_build_without_Git-state_embedding.stderr.log | Bin
 ...nt_build_without_Git-state_embedding.stdout.log | Bin 0 -> 613 bytes
 ...500-clean_repository_component_build.stderr.log | Bin
 ...500-clean_repository_component_build.stdout.log | Bin 0 -> 613 bytes
 ...7916842100-pinned_genuine_test_tools.stderr.log | Bin
 ...7916842100-pinned_genuine_test_tools.stdout.log | Bin 0 -> 570 bytes
 ...48618055155800-ZIP_reader_permission.stderr.log | Bin
 ...48618055155800-ZIP_reader_permission.stdout.log | Bin
 ...92048618122193000-syntax___TProxy_js.stderr.log | Bin
 ...92048618122193000-syntax___TProxy_js.stdout.log | Bin
 ...9900-syntax_gist-sync_plugin-gist_js.stderr.log | Bin
 ...9900-syntax_gist-sync_plugin-gist_js.stdout.log | Bin
 ...46102000-syntax_gist-sync_ui-gist_js.stderr.log | Bin
 ...46102000-syntax_gist-sync_ui-gist_js.stdout.log | Bin
 ...15185800-Shell_syntax_Clash_GistSync.stderr.log | Bin
 ...15185800-Shell_syntax_Clash_GistSync.stdout.log | Bin
 ...564000-BusyBox_syntax_Clash_GistSync.stderr.log | Bin
 ...564000-BusyBox_syntax_Clash_GistSync.stdout.log | Bin
 ...4000-Shell_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...4000-Shell_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...48619342521000-Go_vet_current_source.stderr.log | Bin
 ...48619342521000-Go_vet_current_source.stdout.log | Bin
 ...20156707200-compile_current_Go_tests.stderr.log | Bin
 ...20156707200-compile_current_Go_tests.stdout.log | Bin
 ...8631432200-Go_unit_and_process_tests.stderr.log | Bin
 ...8631432200-Go_unit_and_process_tests.stdout.log | Bin 0 -> 19663 bytes
 ...ion_CLI_real_transactions_and_daemon.stderr.log | Bin
 ...ion_CLI_real_transactions_and_daemon.stdout.log | Bin 0 -> 1656 bytes
 ...ARM64_age_real_decryption_under_QEMU.stderr.log | Bin
 ...ARM64_age_real_decryption_under_QEMU.stdout.log | Bin 0 -> 111 bytes
 ...27200-Gist_UI_and_protocol_rc3-ui_js.stderr.log | Bin
 ...27200-Gist_UI_and_protocol_rc3-ui_js.stdout.log | Bin 0 -> 32 bytes
 ...300-Gist_UI_and_protocol_ui-logic_js.stderr.log | Bin
 ...300-Gist_UI_and_protocol_ui-logic_js.stdout.log | Bin 0 -> 37 bytes
 ...regression_including_ARM64_emulation.stderr.log | Bin
 ...regression_including_ARM64_emulation.stdout.log | Bin 0 -> 946 bytes
 ..._and_original_component_preservation.stderr.log | Bin
 ..._and_original_component_preservation.stdout.log | Bin 0 -> 240 bytes
 ...ll_backup_and_integrity_verification.stderr.log | Bin 0 -> 45 bytes
 ...ll_backup_and_integrity_verification.stdout.log | Bin 0 -> 741 bytes
 ...TTPS_downloads_and_change_comparison.stderr.log | Bin
 ...TTPS_downloads_and_change_comparison.stdout.log | Bin 0 -> 705 bytes
 ...39918545000-compile_native_LIVE_test.stderr.log | Bin
 ...39918545000-compile_native_LIVE_test.stdout.log | Bin
 ...wnloader_on_current_external_network.stderr.log | Bin
 ...wnloader_on_current_external_network.stdout.log | Bin 0 -> 155 bytes
 ...46600-F50_device_read-only_inventory.stderr.log | Bin 0 -> 45 bytes
 ...46600-F50_device_read-only_inventory.stdout.log | Bin 0 -> 839 bytes
 ...40000-F50_real_host_response_framing.stderr.log | Bin 0 -> 45 bytes
 ...40000-F50_real_host_response_framing.stdout.log | Bin 0 -> 781 bytes
 ...teractions_with_simulated_device_API.stderr.log | Bin 0 -> 45 bytes
 ...teractions_with_simulated_device_API.stdout.log | Bin 0 -> 3799 bytes
 ...only_root-shell_response_shape_probe.stderr.log | Bin 0 -> 45 bytes
 ...only_root-shell_response_shape_probe.stdout.log | Bin 0 -> 547 bytes
 ...12044141400-final_source_size_report.stderr.log | Bin
 ...12044141400-final_source_size_report.stdout.log | Bin 0 -> 1488 bytes
 ...kup_with_verified_shell_exit_framing.stderr.log | Bin 0 -> 45 bytes
 ...kup_with_verified_shell_exit_framing.stdout.log | Bin 0 -> 442 bytes
 ...lugin_management_before_installation.stderr.log | Bin 0 -> 45 bytes
 ...lugin_management_before_installation.stdout.log | Bin 0 -> 7994 bytes
 ...00-open_existing_host_plugin_manager.stderr.log | Bin 0 -> 45 bytes
 ...00-open_existing_host_plugin_manager.stdout.log | Bin 0 -> 9792 bytes
 ..._visible_plugin_import_controls_only.stderr.log | Bin 0 -> 45 bytes
 ..._visible_plugin_import_controls_only.stdout.log | Bin 0 -> 1763 bytes
 ...ct_host_plugin_import_event_handlers.stderr.log | Bin 0 -> 45 bytes
 ...ct_host_plugin_import_event_handlers.stdout.log | Bin 0 -> 2664 bytes
 ...-inspect_plugin_replacement_contract.stderr.log | Bin 0 -> 45 bytes
 ...-inspect_plugin_replacement_contract.stdout.log | Bin 0 -> 10437 bytes
 ...authorized_complete_component_bundle.stderr.log | Bin 0 -> 45 bytes
 ...authorized_complete_component_bundle.stdout.log | Bin 0 -> 369 bytes
 ...rce_field_without_exporting_contents.stderr.log | Bin 0 -> 45 bytes
 ...rce_field_without_exporting_contents.stdout.log | Bin 0 -> 324 bytes
 ...iginal_transaction_and_task_receipts.stderr.log | Bin 0 -> 45 bytes
 ...iginal_transaction_and_task_receipts.stdout.log | Bin 0 -> 1641 bytes
 ..._after_rejected_upgrade_and_rollback.stderr.log | Bin 0 -> 45 bytes
 ..._after_rejected_upgrade_and_rollback.stdout.log | Bin 0 -> 832 bytes
 ..._command_transport_redaction_failure.stderr.log | Bin 0 -> 45 bytes
 ..._command_transport_redaction_failure.stdout.log | Bin 0 -> 966 bytes
 ..._under_actual_installer_toolbox_PATH.stderr.log | Bin 0 -> 45 bytes
 ..._under_actual_installer_toolbox_PATH.stdout.log | Bin 0 -> 1058 bytes
 ..._corrected_production_script_quoting.stderr.log | Bin 0 -> 45 bytes
 ..._corrected_production_script_quoting.stdout.log | Bin 0 -> 1710 bytes
 ...on_preservation__core_and_actual_API.stderr.log | Bin 0 -> 45 bytes
 ...on_preservation__core_and_actual_API.stdout.log | Bin 0 -> 691 bytes
 ...gin_and_preserve_surrounding_plugins.stderr.log | Bin 0 -> 45 bytes
 ...gin_and_preserve_surrounding_plugins.stdout.log | Bin 0 -> 838 bytes
 ..._to_exact_repository_plugin_baseline.stderr.log | Bin 0 -> 45 bytes
 ..._to_exact_repository_plugin_baseline.stdout.log | Bin 0 -> 838 bytes
 ...ript_tag_metadata_in_plugin_settings.stderr.log | Bin 0 -> 45 bytes
 ...ript_tag_metadata_in_plugin_settings.stdout.log | Bin 0 -> 306 bytes
 ...settings_against_repository_baseline.stderr.log | Bin 0 -> 45 bytes
 ...settings_against_repository_baseline.stdout.log | Bin 0 -> 665 bytes
 ..._settings_without_exporting_contents.stderr.log | Bin 0 -> 45 bytes
 ..._settings_without_exporting_contents.stdout.log | Bin 0 -> 744 bytes
 ...ackup_using_exact_Shell_source_bytes.stderr.log | Bin 0 -> 45 bytes
 ...ackup_using_exact_Shell_source_bytes.stdout.log | Bin 0 -> 592 bytes
 ..._plugin_semantics_before_replacement.stderr.log | Bin 0 -> 45 bytes
 ..._plugin_semantics_before_replacement.stdout.log | Bin 0 -> 670 bytes
 ...tion_boundaries_and_version_metadata.stderr.log | Bin 0 -> 45 bytes
 ...tion_boundaries_and_version_metadata.stdout.log | Bin 0 -> 641 bytes
 ...from_current_repository_after_backup.stderr.log | Bin 0 -> 45 bytes
 ...from_current_repository_after_backup.stdout.log | Bin 0 -> 1696 bytes
 ...inspect_named_plugin_editor_controls.stderr.log | Bin 0 -> 45 bytes
 ...inspect_named_plugin_editor_controls.stdout.log | Bin 0 -> 1169 bytes
 ..._editor_preserving_six_other_entries.stderr.log | Bin 0 -> 45 bytes
 ..._editor_preserving_six_other_entries.stdout.log | Bin 0 -> 1009 bytes
 ...pect_active_host_code_editor_surface.stderr.log | Bin 0 -> 45 bytes
 ...pect_active_host_code_editor_surface.stdout.log | Bin 0 -> 709 bytes
 ...d_browser_group_after_editor_timeout.stderr.log | Bin 0 -> 45 bytes
 ...d_browser_group_after_editor_timeout.stdout.log | Bin 0 -> 670 bytes
 ...t_page_after_stalled_editor_renderer.stderr.log | Bin 0 -> 167 bytes
 ...t_page_after_stalled_editor_renderer.stdout.log | Bin
 ...age_using_supported_browser_deadline.stderr.log | Bin 0 -> 45 bytes
 ...age_using_supported_browser_deadline.stdout.log | Bin 0 -> 420 bytes
 ...host_API_and_verify_exact_round_trip.stderr.log | Bin 0 -> 45 bytes
 ...host_API_and_verify_exact_round_trip.stdout.log | Bin 0 -> 1175 bytes
 ...fresh_page_after_beforeunload_prompt.stderr.log | Bin 0 -> 45 bytes
 ...fresh_page_after_beforeunload_prompt.stdout.log | Bin 0 -> 630 bytes
 ...cit_authorized_beforeunload_handling.stderr.log | Bin 0 -> 45 bytes
 ...cit_authorized_beforeunload_handling.stdout.log | Bin 0 -> 2441 bytes
 ...six-plugin_preservation_verification.stderr.log | Bin 0 -> 45 bytes
 ...six-plugin_preservation_verification.stdout.log | Bin 0 -> 709 bytes
 ..._generation_for_device_negative_test.stderr.log | Bin 0 -> 142 bytes
 ..._generation_for_device_negative_test.stdout.log | Bin
 ...wnload_and_independent_key_rejection.stderr.log | Bin 0 -> 45 bytes
 ...wnload_and_independent_key_rejection.stdout.log | Bin 0 -> 757 bytes
 ..._operation_lease_after_busy_response.stderr.log | Bin 0 -> 45 bytes
 ..._operation_lease_after_busy_response.stdout.log | Bin 0 -> 289 bytes
 ...endent_identity_after_busy_gate_test.stderr.log | Bin 0 -> 142 bytes
 ...endent_identity_after_busy_gate_test.stdout.log | Bin
 ..._after_observed_operation_quiescence.stderr.log | Bin 0 -> 45 bytes
 ..._after_observed_operation_quiescence.stdout.log | Bin 0 -> 725 bytes
 ...ist_UI_entry_points_on_upgraded_host.stderr.log | Bin 0 -> 45 bytes
 ...ist_UI_entry_points_on_upgraded_host.stdout.log | Bin 0 -> 387 bytes
 ...first-use_runtime_initialization_fix.stderr.log | Bin
 ...first-use_runtime_initialization_fix.stdout.log | Bin 0 -> 602 bytes
 ...atus_and_full_transaction_regression.stderr.log | Bin
 ...atus_and_full_transaction_regression.stdout.log | Bin 0 -> 1746 bytes
 ...pect_current_Gist_minimal_UI_context.stderr.log | Bin 0 -> 267 bytes
 ...pect_current_Gist_minimal_UI_context.stdout.log | Bin
 ...nect_Tabbit_minimal_UI_investigation.stderr.log | Bin 0 -> 45 bytes
 ...nect_Tabbit_minimal_UI_investigation.stdout.log | Bin 0 -> 652 bytes
 ...actual_F50_page_for_minimal_revision.stderr.log | Bin 0 -> 45 bytes
 ...actual_F50_page_for_minimal_revision.stdout.log | Bin 0 -> 4676 bytes
 ...tual_Gist_form_without_exposing_link.stderr.log | Bin 0 -> 45 bytes
 ...tual_Gist_form_without_exposing_link.stdout.log | Bin 0 -> 1368 bytes
 ...00-read_current_host_plugin_controls.stderr.log | Bin 0 -> 45 bytes
 ...00-read_current_host_plugin_controls.stdout.log | Bin 0 -> 499 bytes
 ..._active_Gist_form_URL_classification.stderr.log | Bin 0 -> 45 bytes
 ..._active_Gist_form_URL_classification.stdout.log | Bin 0 -> 747 bytes
 ...69300-inspect_Gist_button_visibility.stderr.log | Bin 0 -> 45 bytes
 ...69300-inspect_Gist_button_visibility.stdout.log | Bin 0 -> 875 bytes
 ...8000-read_Gist_action_group_headings.stderr.log | Bin 0 -> 45 bytes
 ...8000-read_Gist_action_group_headings.stdout.log | Bin 0 -> 420 bytes
 ...d_Gist_URL_shape_after_opening_group.stderr.log | Bin 0 -> 45 bytes
 ...d_Gist_URL_shape_after_opening_group.stdout.log | Bin 0 -> 954 bytes
 ...invalid_gist_url_on_old_installed_UI.stderr.log | Bin 0 -> 45 bytes
 ...invalid_gist_url_on_old_installed_UI.stdout.log | Bin 0 -> 317 bytes
 ...UI_URL_validation_and_saved_settings.stderr.log | Bin
 ...UI_URL_validation_and_saved_settings.stdout.log | Bin 0 -> 37 bytes
 ...revised_protocol_and_dropdown_checks.stderr.log | Bin
 ...revised_protocol_and_dropdown_checks.stdout.log | Bin 0 -> 32 bytes
 ...omplete_package_with_user_minimal_UI.stderr.log | Bin
 ...omplete_package_with_user_minimal_UI.stdout.log | Bin 0 -> 602 bytes
 ...complete_package_after_first-use_fix.stderr.log | Bin 0 -> 45 bytes
 ...complete_package_after_first-use_fix.stdout.log | Bin 0 -> 371 bytes
 ...te_package_retaining_production_mode.stderr.log | Bin 0 -> 45 bytes
 ...te_package_retaining_production_mode.stdout.log | Bin 0 -> 1702 bytes
 ...ed_components_core_and_configuration.stderr.log | Bin 0 -> 45 bytes
 ...ed_components_core_and_configuration.stdout.log | Bin 0 -> 683 bytes
 ..._plugin_preserving_other_six_entries.stderr.log | Bin 0 -> 45 bytes
 ..._plugin_preserving_other_six_entries.stdout.log | Bin 0 -> 795 bytes
 ...00-read_plugin_modal_closing_control.stderr.log | Bin 0 -> 45 bytes
 ...00-read_plugin_modal_closing_control.stdout.log | Bin 0 -> 634 bytes
 ...put_download_and_negative_decryption.stderr.log | Bin 0 -> 45 bytes
 ...put_download_and_negative_decryption.stdout.log | Bin 0 -> 723 bytes
 ...put_download_and_negative_decryption.stderr.log | Bin 0 -> 45 bytes
 ...put_download_and_negative_decryption.stdout.log | Bin 0 -> 1378 bytes
 ...est_outcome_after_browser_tab_closed.stderr.log | Bin 0 -> 45 bytes
 ...est_outcome_after_browser_tab_closed.stdout.log | Bin 0 -> 677 bytes
 ...put_download_and_negative_decryption.stderr.log | Bin 0 -> 45 bytes
 ...put_download_and_negative_decryption.stdout.log | Bin 0 -> 974 bytes
 ...fingerprint_after_initialization_fix.stderr.log | Bin 0 -> 45 bytes
 ...fingerprint_after_initialization_fix.stdout.log | Bin 0 -> 1104 bytes
 ...900-clean_repository_component_build.stderr.log | Bin
 ...900-clean_repository_component_build.stdout.log | Bin 0 -> 602 bytes
 ...2921905600-pinned_genuine_test_tools.stderr.log | Bin
 ...2921905600-pinned_genuine_test_tools.stdout.log | Bin 0 -> 552 bytes
 ...64433069283300-ZIP_reader_permission.stderr.log | Bin
 ...64433069283300-ZIP_reader_permission.stdout.log | Bin
 ...92064433161617400-syntax___TProxy_js.stderr.log | Bin
 ...92064433161617400-syntax___TProxy_js.stdout.log | Bin
 ...3400-syntax_gist-sync_plugin-gist_js.stderr.log | Bin
 ...3400-syntax_gist-sync_plugin-gist_js.stdout.log | Bin
 ...58357000-syntax_gist-sync_ui-gist_js.stderr.log | Bin
 ...58357000-syntax_gist-sync_ui-gist_js.stdout.log | Bin
 ...03502000-Shell_syntax_Clash_GistSync.stderr.log | Bin
 ...03502000-Shell_syntax_Clash_GistSync.stdout.log | Bin
 ...808400-BusyBox_syntax_Clash_GistSync.stderr.log | Bin
 ...808400-BusyBox_syntax_Clash_GistSync.stdout.log | Bin
 ...5400-Shell_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...5400-Shell_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...54200-Gist_UI_and_protocol_rc3-ui_js.stderr.log | Bin
 ...54200-Gist_UI_and_protocol_rc3-ui_js.stdout.log | Bin 0 -> 32 bytes
 ...100-Gist_UI_and_protocol_ui-logic_js.stderr.log | Bin
 ...100-Gist_UI_and_protocol_ui-logic_js.stdout.log | Bin 0 -> 37 bytes
 ...regression_including_ARM64_emulation.stderr.log | Bin
 ...regression_including_ARM64_emulation.stdout.log | Bin 0 -> 946 bytes
 ..._and_original_component_preservation.stderr.log | Bin
 ..._and_original_component_preservation.stdout.log | Bin 0 -> 230 bytes
 ...teractions_with_simulated_device_API.stderr.log | Bin 0 -> 45 bytes
 ...teractions_with_simulated_device_API.stdout.log | Bin 0 -> 3449 bytes
 ...70613774500-final_source_size_report.stderr.log | Bin
 ...70613774500-final_source_size_report.stdout.log | Bin 0 -> 1488 bytes
 ...ompile_anonymized_URL_boundary_cases.stderr.log | Bin
 ...ompile_anonymized_URL_boundary_cases.stdout.log | Bin
 ...21026100-Raw_URL_boundary_regression.stderr.log | Bin
 ...21026100-Raw_URL_boundary_regression.stdout.log | Bin 0 -> 1858 bytes
 ..._empty-link_rejection_and_minimal_UI.stderr.log | Bin 0 -> 45 bytes
 ..._empty-link_rejection_and_minimal_UI.stdout.log | Bin 0 -> 1640 bytes
 ...ct_actual_host_Gist_dialog_rendering.stderr.log | Bin 0 -> 45 bytes
 ...ct_actual_host_Gist_dialog_rendering.stdout.log | Bin 0 -> 2739 bytes
 ..._empty-link_rejection_and_minimal_UI.stderr.log | Bin 0 -> 45 bytes
 ..._empty-link_rejection_and_minimal_UI.stdout.log | Bin 0 -> 1640 bytes
 ...l_minimal_plugin_and_full_components.stderr.log | Bin 0 -> 7636 bytes
 ...l_minimal_plugin_and_full_components.stdout.log | Bin 0 -> 156 bytes
 ...l_minimal_plugin_and_full_components.stderr.log | Bin 0 -> 6084 bytes
 ...l_minimal_plugin_and_full_components.stdout.log | Bin 0 -> 242 bytes
 ...vice_upload_after_successful_upgrade.stderr.log | Bin 0 -> 45 bytes
 ...vice_upload_after_successful_upgrade.stdout.log | Bin 0 -> 2197 bytes
 ...vice_upload_after_successful_upgrade.stderr.log | Bin 0 -> 45 bytes
 ...vice_upload_after_successful_upgrade.stdout.log | Bin 0 -> 270 bytes
 ...A256_and_archive_member_verification.stderr.log | Bin 0 -> 6696 bytes
 ...A256_and_archive_member_verification.stdout.log | Bin 0 -> 242 bytes
 ...A256_and_archive_member_verification.stderr.log | Bin 0 -> 568 bytes
 ...A256_and_archive_member_verification.stdout.log | Bin 0 -> 242 bytes
 ...0-build_matching_dark_interval_style.stderr.log | Bin
 ...0-build_matching_dark_interval_style.stdout.log | Bin 0 -> 602 bytes
 ...500-dark_select_protocol_and_options.stderr.log | Bin
 ...500-dark_select_protocol_and_options.stdout.log | Bin 0 -> 32 bytes
 ...l_persistence_and_link_UI_regression.stderr.log | Bin
 ...l_persistence_and_link_UI_regression.stdout.log | Bin 0 -> 37 bytes
 ...menu_to_F50_preserving_other_plugins.stderr.log | Bin 0 -> 45 bytes
 ...menu_to_F50_preserving_other_plugins.stdout.log | Bin 0 -> 729 bytes
 ...le_Apply_device_action_and_dark_menu.stderr.log | Bin
 ...le_Apply_device_action_and_dark_menu.stdout.log | Bin 0 -> 602 bytes
 ...800-clean_repository_component_build.stderr.log | Bin
 ...800-clean_repository_component_build.stdout.log | Bin 0 -> 602 bytes
 ...7059752400-pinned_genuine_test_tools.stderr.log | Bin
 ...7059752400-pinned_genuine_test_tools.stdout.log | Bin 0 -> 552 bytes
 ...65597207530000-ZIP_reader_permission.stderr.log | Bin
 ...65597207530000-ZIP_reader_permission.stdout.log | Bin
 ...92065597302477600-syntax___TProxy_js.stderr.log | Bin
 ...92065597302477600-syntax___TProxy_js.stdout.log | Bin
 ...5500-syntax_gist-sync_plugin-gist_js.stderr.log | Bin
 ...5500-syntax_gist-sync_plugin-gist_js.stdout.log | Bin
 ...74956700-syntax_gist-sync_ui-gist_js.stderr.log | Bin
 ...74956700-syntax_gist-sync_ui-gist_js.stdout.log | Bin
 ...45327700-Shell_syntax_Clash_GistSync.stderr.log | Bin
 ...45327700-Shell_syntax_Clash_GistSync.stdout.log | Bin
 ...263300-BusyBox_syntax_Clash_GistSync.stderr.log | Bin
 ...263300-BusyBox_syntax_Clash_GistSync.stdout.log | Bin
 ...7400-Shell_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...7400-Shell_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...65598774754300-Go_vet_current_source.stderr.log | Bin
 ...65598774754300-Go_vet_current_source.stdout.log | Bin
 ...99967640300-compile_current_Go_tests.stderr.log | Bin
 ...99967640300-compile_current_Go_tests.stdout.log | Bin
 ...0060071400-Go_unit_and_process_tests.stderr.log | Bin
 ...0060071400-Go_unit_and_process_tests.stdout.log | Bin 0 -> 20690 bytes
 ...900-clean_repository_component_build.stderr.log | Bin
 ...900-clean_repository_component_build.stdout.log | Bin 0 -> 602 bytes
 ...0480884900-pinned_genuine_test_tools.stderr.log | Bin
 ...0480884900-pinned_genuine_test_tools.stdout.log | Bin 0 -> 552 bytes
 ...65670631768400-ZIP_reader_permission.stderr.log | Bin
 ...65670631768400-ZIP_reader_permission.stdout.log | Bin
 ...92065670728456200-syntax___TProxy_js.stderr.log | Bin
 ...92065670728456200-syntax___TProxy_js.stdout.log | Bin
 ...7100-syntax_gist-sync_plugin-gist_js.stderr.log | Bin
 ...7100-syntax_gist-sync_plugin-gist_js.stdout.log | Bin
 ...15125200-syntax_gist-sync_ui-gist_js.stderr.log | Bin
 ...15125200-syntax_gist-sync_ui-gist_js.stdout.log | Bin
 ...58376900-Shell_syntax_Clash_GistSync.stderr.log | Bin
 ...58376900-Shell_syntax_Clash_GistSync.stdout.log | Bin
 ...103600-BusyBox_syntax_Clash_GistSync.stderr.log | Bin
 ...103600-BusyBox_syntax_Clash_GistSync.stdout.log | Bin
 ...2300-Shell_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...2300-Shell_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...65672176951700-Go_vet_current_source.stderr.log | Bin
 ...65672176951700-Go_vet_current_source.stdout.log | Bin
 ...73338485700-compile_current_Go_tests.stderr.log | Bin
 ...73338485700-compile_current_Go_tests.stdout.log | Bin
 ...4442839400-Go_unit_and_process_tests.stderr.log | Bin
 ...4442839400-Go_unit_and_process_tests.stdout.log | Bin 0 -> 19893 bytes
 ...ion_CLI_real_transactions_and_daemon.stderr.log | Bin
 ...ion_CLI_real_transactions_and_daemon.stdout.log | Bin 0 -> 1868 bytes
 ...ARM64_age_real_decryption_under_QEMU.stderr.log | Bin
 ...ARM64_age_real_decryption_under_QEMU.stdout.log | Bin 0 -> 111 bytes
 ...79400-Gist_UI_and_protocol_rc3-ui_js.stderr.log | Bin
 ...79400-Gist_UI_and_protocol_rc3-ui_js.stdout.log | Bin 0 -> 32 bytes
 ...600-Gist_UI_and_protocol_ui-logic_js.stderr.log | Bin
 ...600-Gist_UI_and_protocol_ui-logic_js.stdout.log | Bin 0 -> 37 bytes
 ...regression_including_ARM64_emulation.stderr.log | Bin
 ...regression_including_ARM64_emulation.stdout.log | Bin 0 -> 946 bytes
 ..._and_original_component_preservation.stderr.log | Bin
 ..._and_original_component_preservation.stdout.log | Bin 0 -> 230 bytes
 ..._complete_components_to_approved_F50.stderr.log | Bin 0 -> 45 bytes
 ..._complete_components_to_approved_F50.stdout.log | Bin 0 -> 481 bytes
 ...teractions_with_simulated_device_API.stderr.log | Bin 0 -> 45 bytes
 ...teractions_with_simulated_device_API.stdout.log | Bin 0 -> 3558 bytes
 ...32259119800-final_source_size_report.stderr.log | Bin
 ...32259119800-final_source_size_report.stdout.log | Bin 0 -> 1488 bytes
 ...Apply_worker_with_original_installer.stderr.log | Bin 0 -> 45 bytes
 ...Apply_worker_with_original_installer.stdout.log | Bin 0 -> 1700 bytes
 ...nd_configuration_after_Apply_upgrade.stderr.log | Bin 0 -> 45 bytes
 ...nd_configuration_after_Apply_upgrade.stdout.log | Bin 0 -> 680 bytes
 ...ngle_Apply_UI_and_matching_dark_menu.stderr.log | Bin 0 -> 45 bytes
 ...ngle_Apply_UI_and_matching_dark_menu.stdout.log | Bin 0 -> 788 bytes
 ...pply_input_and_matching_dark_options.stderr.log | Bin 0 -> 45 bytes
 ...pply_input_and_matching_dark_options.stdout.log | Bin 0 -> 743 bytes
 ..._control_theme_for_matching_interval.stderr.log | Bin 0 -> 45 bytes
 ..._control_theme_for_matching_interval.stdout.log | Bin 0 -> 735 bytes
 ...900-clean_repository_component_build.stderr.log | Bin
 ...900-clean_repository_component_build.stdout.log | Bin 0 -> 602 bytes
 ...9452229800-pinned_genuine_test_tools.stderr.log | Bin
 ...9452229800-pinned_genuine_test_tools.stdout.log | Bin 0 -> 552 bytes
 ...65979605572700-ZIP_reader_permission.stderr.log | Bin
 ...65979605572700-ZIP_reader_permission.stdout.log | Bin
 ...92065979708872100-syntax___TProxy_js.stderr.log | Bin
 ...92065979708872100-syntax___TProxy_js.stdout.log | Bin
 ...1300-syntax_gist-sync_plugin-gist_js.stderr.log | Bin
 ...1300-syntax_gist-sync_plugin-gist_js.stdout.log | Bin
 ...08418300-syntax_gist-sync_ui-gist_js.stderr.log | Bin
 ...08418300-syntax_gist-sync_ui-gist_js.stdout.log | Bin
 ...78329600-Shell_syntax_Clash_GistSync.stderr.log | Bin
 ...78329600-Shell_syntax_Clash_GistSync.stdout.log | Bin
 ...536400-BusyBox_syntax_Clash_GistSync.stderr.log | Bin
 ...536400-BusyBox_syntax_Clash_GistSync.stdout.log | Bin
 ...1700-Shell_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...1700-Shell_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...45100-Gist_UI_and_protocol_rc3-ui_js.stderr.log | Bin
 ...45100-Gist_UI_and_protocol_rc3-ui_js.stdout.log | Bin 0 -> 32 bytes
 ...200-Gist_UI_and_protocol_ui-logic_js.stderr.log | Bin
 ...200-Gist_UI_and_protocol_ui-logic_js.stdout.log | Bin 0 -> 37 bytes
 ...ted_request_and_wrong-key_protection.stderr.log | Bin 0 -> 45 bytes
 ...ted_request_and_wrong-key_protection.stdout.log | Bin 0 -> 735 bytes
 ...ithout_modifying_saved_Gist_settings.stderr.log | Bin 0 -> 45 bytes
 ...ithout_modifying_saved_Gist_settings.stdout.log | Bin 0 -> 879 bytes
 ...regression_including_ARM64_emulation.stderr.log | Bin
 ...regression_including_ARM64_emulation.stdout.log | Bin 0 -> 946 bytes
 ..._and_original_component_preservation.stderr.log | Bin
 ..._and_original_component_preservation.stdout.log | Bin 0 -> 230 bytes
 ...teractions_with_simulated_device_API.stderr.log | Bin 0 -> 45 bytes
 ...teractions_with_simulated_device_API.stdout.log | Bin 0 -> 3454 bytes
 ...11830081300-final_source_size_report.stderr.log | Bin
 ...11830081300-final_source_size_report.stdout.log | Bin 0 -> 1488 bytes
 ...ve_host-matched_dark_Apply_interface.stderr.log | Bin 0 -> 45 bytes
 ...ve_host-matched_dark_Apply_interface.stdout.log | Bin 0 -> 792 bytes
 ...options_and_primary_Apply_validation.stderr.log | Bin 0 -> 45 bytes
 ...options_and_primary_Apply_validation.stdout.log | Bin 0 -> 1654 bytes
 ...evice-held_identity_without_applying.stderr.log | Bin 0 -> 45 bytes
 ...evice-held_identity_without_applying.stdout.log | Bin 0 -> 1208 bytes
 ...g_button_height_for_compact_interval.stderr.log | Bin 0 -> 45 bytes
 ...g_button_height_for_compact_interval.stdout.log | Bin 0 -> 491 bytes
 ...700-clean_repository_component_build.stderr.log | Bin
 ...700-clean_repository_component_build.stdout.log | Bin 0 -> 602 bytes
 ...2910604100-pinned_genuine_test_tools.stderr.log | Bin
 ...2910604100-pinned_genuine_test_tools.stdout.log | Bin 0 -> 552 bytes
 ...66223066058800-ZIP_reader_permission.stderr.log | Bin
 ...66223066058800-ZIP_reader_permission.stdout.log | Bin
 ...92066223140791900-syntax___TProxy_js.stderr.log | Bin
 ...92066223140791900-syntax___TProxy_js.stdout.log | Bin
 ...5900-syntax_gist-sync_plugin-gist_js.stderr.log | Bin
 ...5900-syntax_gist-sync_plugin-gist_js.stdout.log | Bin
 ...68817200-syntax_gist-sync_ui-gist_js.stderr.log | Bin
 ...68817200-syntax_gist-sync_ui-gist_js.stdout.log | Bin
 ...30315300-Shell_syntax_Clash_GistSync.stderr.log | Bin
 ...30315300-Shell_syntax_Clash_GistSync.stdout.log | Bin
 ...208000-BusyBox_syntax_Clash_GistSync.stderr.log | Bin
 ...208000-BusyBox_syntax_Clash_GistSync.stdout.log | Bin
 ...6100-Shell_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...6100-Shell_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stderr.log | Bin
 ...00-BusyBox_syntax_Clash_ConfigCommit.stdout.log | Bin
 ...79000-Gist_UI_and_protocol_rc3-ui_js.stderr.log | Bin
 ...79000-Gist_UI_and_protocol_rc3-ui_js.stdout.log | Bin 0 -> 32 bytes
 ...600-Gist_UI_and_protocol_ui-logic_js.stderr.log | Bin
 ...600-Gist_UI_and_protocol_ui-logic_js.stdout.log | Bin 0 -> 37 bytes
 ...px_interval_with_single_Apply_action.stderr.log | Bin 0 -> 45 bytes
 ...px_interval_with_single_Apply_action.stdout.log | Bin 0 -> 792 bytes
 ...interval_matches_actual_Apply_button.stderr.log | Bin 0 -> 45 bytes
 ...interval_matches_actual_Apply_button.stdout.log | Bin 0 -> 1637 bytes
 ...regression_including_ARM64_emulation.stderr.log | Bin
 ...regression_including_ARM64_emulation.stdout.log | Bin 0 -> 946 bytes
 ..._and_original_component_preservation.stderr.log | Bin
 ..._and_original_component_preservation.stdout.log | Bin 0 -> 230 bytes
 ...teractions_with_simulated_device_API.stderr.log | Bin 0 -> 45 bytes
 ...teractions_with_simulated_device_API.stdout.log | Bin 0 -> 3482 bytes
 ...44017104800-final_source_size_report.stderr.log | Bin
 ...44017104800-final_source_size_report.stdout.log | Bin 0 -> 1488 bytes
 ..._visual_check_with_saved_link_masked.stderr.log | Bin 0 -> 45 bytes
 ..._visual_check_with_saved_link_masked.stdout.log | Bin 0 -> 1689 bytes
 ...ackage_compact_single_Apply_delivery.stderr.log | Bin 0 -> 1775 bytes
 ...ackage_compact_single_Apply_delivery.stdout.log | Bin 0 -> 242 bytes
 ...Apply_package_integrity_verification.stderr.log | Bin
 ...Apply_package_integrity_verification.stdout.log | Bin 0 -> 242 bytes
 .../regression/cleanup.test.js.stderr.log          | Bin
 .../regression/cleanup.test.js.stdout.log          | Bin 0 -> 7220 bytes
 .../regression/compact.test.js.stderr.log          | Bin
 .../regression/compact.test.js.stdout.log          | Bin 0 -> 1426 bytes
 .../regression/download_archive.test.js.stderr.log | Bin
 .../regression/download_archive.test.js.stdout.log | Bin 0 -> 1127 bytes
 .../http_subscription.test.js.stderr.log           | Bin
 .../http_subscription.test.js.stdout.log           | Bin 0 -> 2796 bytes
 .../regression/ipv6_dns.test.js.stderr.log         | Bin
 .../regression/ipv6_dns.test.js.stdout.log         | Bin 0 -> 6300 bytes
 .../regression/optimization.test.js.stderr.log     | Bin
 .../regression/optimization.test.js.stdout.log     | Bin 0 -> 4397 bytes
 .../optimization_install.test.js.stderr.log        | Bin
 .../optimization_install.test.js.stdout.log        | Bin 0 -> 4762 bytes
 .../optimization_network.test.js.stderr.log        | Bin
 .../optimization_network.test.js.stdout.log        | Bin 0 -> 3485 bytes
 .../optimization_subscription.test.js.stderr.log   | Bin
 .../optimization_subscription.test.js.stdout.log   | Bin 0 -> 6826 bytes
 .../regression/panel_open.test.js.stderr.log       | Bin
 .../regression/panel_open.test.js.stdout.log       | Bin 0 -> 3099 bytes
 .../release_consistency.test.js.stderr.log         | Bin
 .../release_consistency.test.js.stdout.log         | Bin 0 -> 777 bytes
 .../regression/reliability.test.js.stderr.log      | Bin
 .../regression/reliability.test.js.stdout.log      | Bin 0 -> 7284 bytes
 .../gist-sync/regression/run_tests.js.stderr.log   | Bin
 .../gist-sync/regression/run_tests.js.stdout.log   | Bin 0 -> 5290 bytes
 .../subscription_update.test.js.stderr.log         | Bin
 .../subscription_update.test.js.stdout.log         | Bin 0 -> 7111 bytes
 .../regression/yaml_bridge.test.js.stderr.log      | Bin
 .../regression/yaml_bridge.test.js.stdout.log      | Bin 0 -> 856 bytes
 reports/gist-sync/test-tools.json                  |  18 +
 reports/gist-sync/user-revision.json               |  13 +
 reports/v9.0.0-regression.json                     | 116 +++-
 reports/v9.0.0-size.json                           |  64 +-
 scripts/build_gist_sync.py                         |  76 +++
 scripts/build_helper.py                            |   2 +
 scripts/compact_plugin.js                          |   1 +
 scripts/gist_device_scripts.js                     |  14 +
 scripts/gist_evidence.py                           |  45 ++
 scripts/gist_fetch.mjs                             |  16 +
 scripts/gist_live.py                               |  14 +
 scripts/gist_test_tools.py                         |  36 +
 scripts/package_gist_sync.py                       | 127 ++++
 scripts/package_plugin.py                          |   4 +
 scripts/snapshot_gist_contracts.js                 |  20 +
 scripts/sync_gist_plugin.js                        |  57 ++
 scripts/verify_gist_sync.py                        |  82 +++
 scripts/verify_plugin.js                           |   4 +-
 tests/gist-sync/arm64-components.py                |  15 +
 tests/gist-sync/baseline-normalizer.js             | 285 ++++++++
 tests/gist-sync/browser-sources.js                 |  43 ++
 tests/gist-sync/browser-ui.js                      |  43 ++
 tests/gist-sync/device-backup.js                   |  39 ++
 tests/gist-sync/device-host-backup.js              |   7 +
 tests/gist-sync/device-host-backup.sh              |  18 +
 tests/gist-sync/device-input.js                    |  41 ++
 tests/gist-sync/device-inspect.js                  |  22 +
 tests/gist-sync/device-install.js                  |  23 +
 tests/gist-sync/device-live-test.js                |  34 +
 tests/gist-sync/device-plugin-source.js            |  18 +
 tests/gist-sync/device-plugin-update.js            |  43 ++
 tests/gist-sync/device-plugin-verify.js            |  18 +
 tests/gist-sync/device-postcheck.js                |  39 ++
 tests/gist-sync/device-redaction.js                |  11 +
 tests/gist-sync/device-saved-test.js               |  21 +
 tests/gist-sync/device-source-after.js             |  17 +
 tests/gist-sync/device-source-inventory.js         |  19 +
 tests/gist-sync/device-ui.js                       |  51 ++
 tests/gist-sync/device-upload.js                   |  18 +
 tests/gist-sync/expected-contracts.json            | 145 ++++
 tests/gist-sync/host-bridge.js                     |  10 +
 tests/gist-sync/integration.py                     | 345 ++++++++++
 tests/gist-sync/live-network.py                    |  17 +
 tests/gist-sync/mock-age.py                        |  16 +
 tests/gist-sync/mock-yq.py                         |  31 +
 tests/gist-sync/normalize-reference.js             |   5 +
 tests/gist-sync/package-check.py                   |  30 +
 tests/gist-sync/rc3-ui.js                          |  57 ++
 tests/gist-sync/seal-request.js                    |   6 +
 tests/gist-sync/service-integration.py             |  47 ++
 tests/gist-sync/ui-logic.js                        |  50 ++
 tests/gist-sync/vendor/CryptoJS-LICENSE            |  24 +
 tests/gist-sync/vendor/crypto-js.js                |   1 +
 tests/tproxy/cleanup.test.js                       |  14 +-
 tests/tproxy/download_archive.test.js              |  11 +-
 tests/tproxy/gist_sources.test.js                  |  58 ++
 tests/tproxy/optimization_harness.js               |   6 +-
 tests/tproxy/optimization_install.test.js          |  34 +-
 tests/tproxy/optimization_network.test.js          |  14 +-
 tests/tproxy/release_consistency.test.js           |   8 +-
 tests/tproxy/run_tests.js                          |  11 +-
 tests/tproxy/subscription_update.test.js           |   1 +
 tproxy-yq.zip                                      | Bin 60632949 -> 67043278 bytes
 "\347\214\253\347\214\253TProxy.js"                | 674 +++++++++++++++----
 724 files changed, 13114 insertions(+), 202 deletions(-)
```

完整源码差异见 `changes.patch`。F50 完整包升级已验证；真实 Gist 解密与配置校验已通过，F50 生产配置应用和 Android WebView 尚未验证。
