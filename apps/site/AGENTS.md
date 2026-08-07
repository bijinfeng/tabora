# Site Agent Rules

本文件适用于 `apps/site/`，并继承仓库根 `AGENTS.md`。

## 边界

- 这里是官网与组件文档站，不是 Tabora workbench shell。预览可以展示产品，但不能复制或承载真实插件运行时、storage 或 host 行为。
- 品牌、主题和基础控件复用 `@tabora/brand`、`@tabora/theme` 与 `@tabora/ui`；不要在 site 内建立第二套通用组件系统。
- 官网产品文案与产品事实源保持一致；组件文档 metadata 和 demo 以 `@tabora/ui/component-docs` 的公开入口为准。

## 实现

- 先复用现有 route shell、topnav、footer、locale、code highlight 和 section patterns。
- 重复页面结构用内容数据和共享 renderer 表达，不复制整页 JSX。
- 保持路由内容、展示组件和交互状态分离；只被一个 section 使用的内容留在该 feature 内。
- UI 任务读取 `DESIGN.md`，同时保持站点现有视觉方向；不要把工作台“安静、密集”的宿主规范机械套成营销页布局。
- 修改多语言内容时同步现有语言版本或明确说明未覆盖语言。

## 验证

按根回归摘要执行；本目录代码变更至少运行：

```bash
pnpm --dir apps/site test
pnpm --dir apps/site build
pnpm check
```

路由、响应式、主题或交互变化还需在浏览器检查受影响页面。
