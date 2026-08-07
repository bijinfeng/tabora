# Plugin Agent Rules

本文件适用于 `plugins/` 下的官方、community 和 example 插件，并继承仓库根 `AGENTS.md`。

## Contract

- 插件必须显式声明当前 manifest contract，并在 `activate(context)` 中只通过公开 runtime context 注册能力。
- 插件不得 import app、workbench 内部 store、storage 实现或其他插件源码；跨插件复用只能进入职责匹配且依赖方向合法的公共 package。
- 外部打开、AI、network、clipboard、local-file 等宿主能力必须走 manifest permission 和 runtime permission API。
- widget 明确声明 view、`supportedSizes` 和 `defaultSize`；多实例数据默认按 instance 隔离，共享数据必须有产品事实源。
- manifest `styles`、view 和 contribution 保持一致；不要为旧 manifest 添加字段推断、默认补齐或 backfill。

## UI 与故障

- 内容区控件优先从稳定的 `@tabora/ui/*` subpath 导入；插件不创建全局 modal、fullscreen、settings、toast 或 context-menu host。
- 使用主题 token，不硬编码宿主颜色。卡片内容过长时内部滚动或截断，不撑破宿主尺寸。
- layout 插件只组织 region 和宿主 action，不接管具体 widget/search 业务。
- 单个 view 的异常必须能被宿主局部错误边界接住；拒绝权限或数据失败不能使整个工作台失效。

## 复用

- 新增插件内部 helper 前搜索其他插件和公共 package；相同协议级逻辑应进入合适 package，相似但含插件语义的 UI 保持局部。
- 不直接从一个插件 import 另一个插件来消除几行重复。
- 插件模板、manifest factory 或 adapter 只有在多个真实插件共享稳定 contract 时才公开。

## 验证

运行受影响插件自己的 Vitest，再按根回归摘要执行 `pnpm test`、`pnpm check`；manifest、公共 contract、样式装配或跨包变化追加 `pnpm build`。视觉或交互变化必须在 playground 中验证插件启用、实例、尺寸、错误和权限路径。
