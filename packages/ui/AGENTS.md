# UI Package Agent Rules

本文件适用于 `packages/ui/`，并继承仓库根 `AGENTS.md`。UI 变更必须先读根 `DESIGN.md`。

## 边界

- `@tabora/ui` 只提供业务无关的基础组件、低层可访问 primitive、稳定样式入口和组件文档 metadata。
- 不引入 workbench host 容器、插件业务、路由、storage、kernel、official plugins 或 app 依赖。
- 优先组合 `@kobalte/core` 和现有 primitive；不要重写已有的焦点、键盘、dismiss、portal 或 ARIA 行为。
- 宿主特有的 rail、grid、widget shell、全局 overlay/settings/toast/command host 留在 workbench 所有者中。

## 组件实现

- 新控件前先搜索现有 primitive、styled wrapper、composite 和 component docs；能扩展现有 API 时不新增平行组件。
- primitive 负责语义、状态和 a11y；styled 层负责默认视觉。不要为单个业务页面添加专用 variant。
- 使用 `@tabora/theme` token、StyleX 和现有 `xstyle`/slot 约定；不要新增 package-local class/style merge helper 或 recipe DSL。
- 业务代码应能从稳定 subpath 精确导入。新增 public subpath 时同步 source facade、`package.json` source/publish exports、build entry、测试和 component docs；每一项都必须有真实消费者。
- props 保持小且语义化；不公开成组的内部 slot class/style 参数，不用 pass-through wrapper 隐藏 Kobalte API。
- 可交互组件覆盖键盘、focus-visible、disabled、可访问名称和必要的受控/非受控 contract。

## 验证

本目录变更至少运行：

```bash
pnpm --dir packages/ui test
pnpm --dir packages/ui build
pnpm check
```

公共 export、样式产物或消费边界变化追加根 `pnpm build`；视觉组件还需在组件文档站或真实消费页面做明暗主题与键盘检查。
