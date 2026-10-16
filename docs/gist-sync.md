# GistSync 维护与复测

仓库中的 `猫猫TProxy.js` 是主插件，`gist-sync/plugin-gist.js` 和 `ui-gist.js` 是对应模块的维护源。构建时将模块同步回主插件，从原有事务生成 `Clash.ConfigCommit`，再从 Go 源码构建同步程序。不要只修改交付 ZIP。

Windows 需要 Node.js、Python 3、Go 1.26.3，以及 Debian WSL。测试还需要 WSL 的 Python、Node、OpenSSL、iproute2、BusyBox、libarchive-tools 和 dpkg-deb。测试工具按 `gist-sync/test-tools.json` 校验；QEMU 只解出一个可执行文件，不安装系统服务或注册 binfmt。

```powershell
$env:PYTHONUTF8='1'
py -3 scripts/build_gist_sync.py
py -3 scripts/verify_gist_sync.py --clean
```

仅修改界面时可用 `py -3 scripts/verify_gist_sync.py --revision --browser`。它重新构建、检查界面和组件包，并要求程序哈希与已通过的集成测试一致；不会把沿用的测试写成重新执行。

第二条从空的 `build/gist-sync` 重建并记录测试命令、标准输出、错误输出和退出码。不会删除 `.cache`、用户配置或历史证据。结果在 `reports/gist-sync/`。正式打包入口：

```powershell
node scripts/report_plugin.js
py -3 scripts/package_plugin.py
```

`build_helper.py` 的默认完整构建也会调用 GistSync 构建。`--skip-package` 保留原语义，不更新组件包。Mihomo、原控制器、yq、Zashboard 等原组件继续从仓库现有 `tproxy-yq.zip` 保留；本项目未取得原控制器的完整源码，不能声称它也由 Go 源码重建。

`tests/gist-sync/expected-contracts.json` 固定新增功能造成的 Shell 输出变化；未变输出仍逐字比较历史基线。`snapshot_gist_contracts.js` 是维护者审查变更时手动使用的更新工具，验证流程不会自动刷新预期值。网络、文件事务及 UI 行为另有执行测试，快照不能代替这些测试。

## 安装与升级

将配套 JS 导入宿主，再在原组件管理中导入完整 ZIP。Gist 页面填写链接和私钥，点击“应用”即保存并同步；维护操作收在“更多”中。组件校验及可执行性检查在替换旧安装前完成；升级保留 `Tools/gist-sync` 中的设置和私钥，清理任务、运行态和临时工作目录。成功安装与事务收尾分别报告；收尾失败时保留恢复线索。

原「在线安装/更新」优先下载仓库 main 的 `tproxy-yq.zip`，失败后依次回退 Gitee、GitCode。发布新包无需同步修改提交地址、包哈希或插件版本；仍检查 ZIP 完整性、组件可执行性和 Gist 协议。旧包不含 GistSync 时保留已安装组件；首次安装旧包仍可使用原有功能，Gist 需更新完整包。`gist-sync/release.json` 仅记录构建版本和协议；age 构建来源校验及包内哈希清单保留。也可继续导入完整 ZIP。

Gist 配置应用后，订阅设置会读取其中的订阅和内置节点；手动链接仍保存在原 `Proxy/subscription_urls.txt`。每次手动或后台同步从最新 Gist 重新合并，按 URL 去重，保留 Gist 规则及策略组；删除、禁用手动链接不会删除 Gist 原有来源。手动订阅使用 HTTP Provider，核心运行时确认实际节点加载；失败进入原事务回滚。不同 URL 的订阅可能包含相同节点，不跨来源删除节点。

## 私钥与错误处理

Gist 私钥不调用 `upload_img`。浏览器用设备一次性公钥加密请求，设备通过已有 root shell 接口接收密文，校验认证码、用途、有效期并消费请求钥匙。私钥只保存在设备受限目录（目录 0700、文件 0600），不会返回到状态页。生成的测试私钥只存在隔离测试目录，测试结束清理。

HTTP 宿主缺乏可验证的页面完整性，受控宿主、同源脚本或设备 root 仍可取得输入或明文。加密请求不能解决主动篡改页面的问题，不能宣称私钥绝对安全。未审计到宿主服务端所有日志代码；只验证本功能不经图片上传、普通任务回执及日志不含私钥。

`invalid_response` 的可复现链路是：旧设备缺少同步程序，Shell 的非 JSON 错误或空响应落入前端通用解析失败。新版先检查组件、版本和权限，再读取带随机边界及退出码的响应，分别报告组件缺失、版本不符、设备失败、格式错误、超时或状态未知。真实宿主的组件缺失路径另有 DEVICE 证据。

`invalid_gist_url` 已在旧 F50 页面复现：空链接仍提交 test 任务。精简界面在提交前拦截空链接及错误格式，清理粘贴内容两端的不可见字符。填写链接和私钥后点击“应用”，同一设备任务保存设置并更新当前 YAML；启用自动同步后按间隔继续更新。

生产下载器拒绝内网及 Fake-IP 地址。电脑 WSL 的原生下载曾被 Fake-IP 检查阻止，失败记录保留。F50 的正式 ARM64 程序已成功下载同一真实 Gist，密文 SHA 与电脑下载一致；独立错误私钥得到解密失败，配置未写入。没有放开地址限制或 TLS 校验，随后使用设备已保存的私钥完成真实 Gist 解密、YAML 和 Mihomo 校验，未应用生产配置。

## 证据边界

- STATIC：语法、包内文件、架构、清单、哈希及原组件保留检查。
- UNIT：Go 单元测试，含可控 HTTP、进程和错误注入；这些不是外网或设备证据。
- MOCK：原组件安装/恢复测试中的设备替身、普通浏览器中的模拟设备接口。QEMU 执行原 ARM64 控制器，但网络输入仍是夹具。
- INTEGRATION：生产 AMD64 同步程序、真实 age/yq/Mihomo、本地 TLS 服务、真实文件/进程/HTTP。挂载、PID 和网络命名空间隔离；服务适配器仅测试 Off 和核心 API，不实现 F50 防火墙。断电测试通过仅在测试二进制启用的挂起点执行 SIGKILL；正常链路使用正式构建二进制。
- LIVE：用户授权 Raw URL 的真实外网请求；设备保存的私钥完成真实 Gist 解密验证，没有导出私钥。
- DEVICE：F50 完整备份、用户授权后的完整包升级、实际程序执行、核心 API、配置及来源哈希、宿主 JS 保存回读，以及真实 Raw 下载和错误密钥验证。升级前后保持 TProxy。

调度集成测试让持久化期限到期，实际运行独立后台进程，验证保存、关闭自动同步和 boot 入口。没有实际等待 24 小时，没有重启真实设备。长时间网络恢复、Android WebView 及 TProxy/TUN/Off 数据流量仍未验证。

## F50 升级记录

用户已允许备份后安装升级，暂不切换模式。完整备份及原宿主 JS 留在设备 root 专用目录，指针为 `/data/local/tmp/maomao-rc4-backup.path`。实际安装和收尾均成功，配置、来源及策略文件与备份哈希一致，核心 API 返回 200。首次状态目录缺失的初始化问题已修复，当前配置指纹不再为空。

没有覆盖生产配置、切换模式或重启设备。已通过设备保存的私钥进行真实 Gist 只读解密校验，没有将私钥写入命令行、日志或仓库。网络模式回归和真实重启需另行授权。
