# Tabora 文档地图与产品边界

开始较大任务时，按目标路径读取完整 `AGENTS.md` 链，然后读本文和相关源码、schema、测试；UI 任务再读 `DESIGN.md`。文档只保留产品范围、安全边界和跨模块不变量。字段、默认值、算法、流程和局部交互以相邻代码注释、schema 与测试为准。

## 产品

Tabora 是插件优先的个人工作台新标签页。平台拥有插件运行、宿主容器、持久化、权限、事件与故障隔离；搜索、背景、主题、卡片、设置和 AI 对话等具体能力由插件贡献。MVP 是由 builtin preset 装配的响应式 dashboard：用户可管理工作区和实例、调整布局、切换主题背景，并在重开后恢复状态。

不做第三方远程插件市场或沙箱、在线安装升级、团队工作区和完整 SDK 工具链。账号与同步为可选宿主装配，未装配时插件数据保持 local-only。

## 不变量

- 插件只能通过 manifest、contribution、runtime context、permission 与 storage contract 接入；平台不硬编码业务能力。
- workspace 装配、实例状态与插件业务数据分开保存；删除实例不删除插件，多实例和数据 scope 必须隔离。
- capability 与 manifest permission 的交集决定实际能力；外部打开、网络、文件和 AI 均经宿主 bridge，不能静默兜底或越过权限。
- 无效 schema、拒绝权限、插件 view 和存储失败必须局部、可理解，不能白屏。
- 官方插件与第三方插件遵守同一边界。builtin registry 聚合默认插件，组合根注入宿主，shell 不反向依赖官方插件。
- 管理台中的 provider / 模型凭据只由服务端安全存储使用；外部请求受 allowlist、超时、SSRF 防护与审计保护。
- 同步仅处理 manifest 显式声明且具备稳定记录键、更新时间、合并策略和 schema 版本的 collection；敏感字段不持久化或上传。

## 代码事实源

产品行为与协议：`@tabora/plugin-api` schema、`@tabora/platform-kernel`、`@tabora/storage`、`@tabora/workbench-app`、官方插件 manifest 和相邻 contract / integration tests。视觉与可访问性：`DESIGN.md`。扩展发布：`.github/workflows/release-extension.yml`、`apps/extension/package.json` 与 WXT 文档。FNOS：`apps/fnos/README.md`。

修改工程规则、验证命令、架构边界或测试治理时读 [`technical/tabora-regression-baseline.md`](technical/tabora-regression-baseline.md)。文档变更至少运行 `pnpm check`。
