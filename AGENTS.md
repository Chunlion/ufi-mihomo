# 本地 F50 配置

- F50 专用配置位于 `../Clash_Rule-Set/F50.yaml`；猫猫TProxy 的端口或接管约定变更时同步检查该文件。
- 定制 YAML 的同步与私有文件规则见 `../Clash_Rule-Set/AGENTS.md`；不得暂存、提交、推送这些配置，或在输出中展示密钥和订阅地址。
- `.githooks/pre-commit` 拒绝提交 `F50*.yaml`、`Tailscale/Sparkle/Bettbox/Egern` YAML、`private-download/`、`identity.txt`、`subscription_urls.txt`、`Tools/template.yaml`、`Proxy/config.yaml`，以及含明文 age 私钥的文件；组件包只允许携带分享版模板（成员内含 token 型 URL 或私钥即拒绝）。新克隆后执行 `git config core.hooksPath .githooks` 启用。
