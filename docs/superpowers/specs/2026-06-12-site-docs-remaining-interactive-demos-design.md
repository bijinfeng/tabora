# Site Docs 剩余组件交互 Demo 替换设计

**目标：** 将 `/docs` 页面剩余仍使用 `previewHtml + codeBlock.code` 的组件规范区块，统一替换为真实的 Solid 组件 demo（可交互），并保证预览渲染与代码展示来自同一份 `*.demo.tsx` 源文件。

**范围：**

- 浮层与菜单：`tabs`、`dialog`、`drawer`、`tooltip`
- 反馈与通知：`toast`、`progress`、`skeleton`、`empty`
- 标签与结构：`badge`、`table`、`card`
- 站点侧 docs 示例注册表与测试

**非目标：**

- 不做 demo 自动扫描或自动注册
- 不重构 `@tabora/ui/component-docs` 的整套 metadata / demos 体系
- 不处理本轮构建中的 chunk warning，除非实现时顺手消除

---

## 约束与原则

- demo 文件继续与组件源码同目录，遵守垂直切片原则，例如 `packages/ui/src/styled/dialog/dialog.demo.tsx`
- 每个组件只保留一个 demo 文件；`/docs` 侧每个组件只引用一个 `exampleId`
- 预览使用真实 Solid 组件渲染；代码展示和复制使用同一个 demo 文件的 `?raw` 源码
- `dialog`、`drawer`、`toast` 等带状态的组件，demo 必须可直接操作并能看到交互结果
- 不再为这些组件维护额外的 HTML 字符串示例或独立代码块字符串

---

## 现状

当前 `/docs` 已完成输入控件和选择控件的第一批迁移：

- 站点侧由 `apps/site/src/routes/docs/docsExamples.tsx` 负责 `exampleId -> { render, source }`
- `render` 使用 `lazy()` + `Suspense` 加载 `@tabora/ui` 的 demo 组件
- `source` 通过 `?raw` 读取同一 demo 文件源码

但 `docsPageContent.ts` 中剩余 11 个组件仍走旧链路：

- `previewHtml` 负责预览
- `codeBlock.code` 负责展示和复制

这与“源码单一事实源”的目标冲突，也让未来维护仍需改两处。

---

## 方案选择

采用“扩展现有 `docsExamples.tsx` 注册表 + 继续复用 `@tabora/ui` 已存在 demo 文件”的轻量方案。

不选自动发现/自动注册的原因：

- 这轮只覆盖 11 个明确组件，静态注册表足够
- 自动发现会引入文件命名约定、类型推导和构建复杂度，不符合当前 YAGNI
- 现有 `docsExamples.tsx` 已证明可行，继续沿用能保持实现连续性

---

## 接线设计

### 1. `@tabora/ui` demo 文件

优先复用已有的以下 demo 文件：

- `packages/ui/src/styled/tabs/tabs.demo.tsx`
- `packages/ui/src/styled/dialog/dialog.demo.tsx`
- `packages/ui/src/styled/drawer/drawer.demo.tsx`
- `packages/ui/src/styled/tooltip/tooltip.demo.tsx`
- `packages/ui/src/styled/toast/toast.demo.tsx`
- `packages/ui/src/styled/progress/progress.demo.tsx`
- `packages/ui/src/styled/skeleton/skeleton.demo.tsx`
- `packages/ui/src/styled/emptyState/emptyState.demo.tsx`
- `packages/ui/src/styled/badge/badge.demo.tsx`
- `packages/ui/src/styled/table/table.demo.tsx`
- `packages/ui/src/styled/cardSection/cardSection.demo.tsx`

其中如果 demo 只是静态展示，需要增强到可直接体验的程度：

- `dialog`：按钮可打开，支持关闭
- `drawer`：按钮可打开，支持关闭
- `toast`：按钮触发后可见提示
- `tabs`：切换后内容实际变化
- `tooltip`：hover/focus 能看到提示
- `progress`：允许本地 `createSignal()` 驱动进度变化

`skeleton`、`empty`、`badge`、`table`、`card` 即使交互较轻，也必须由真实组件渲染，而不是字符串模板。

### 2. 站点侧示例注册表

`apps/site/src/routes/docs/docsExamples.tsx` 新增 11 个 `DocsExampleId`：

- `tabs`
- `dialog`
- `drawer`
- `tooltip`
- `toast`
- `progress`
- `skeleton`
- `empty`
- `badge`
- `table`
- `card`

每个条目仍只负责两件事：

- `source`: 读取对应 `*.demo.tsx?raw`
- `render`: 通过 `lazy(() => import(...))` 懒加载 demo 组件

继续保留当前统一包装：

- `DocsExample.language = "tsx"`
- `render` 外层包裹 `.docs-render`
- `Suspense` fallback 仍使用 `null`

### 3. `/docs` 内容数据

`apps/site/src/routes/docs/docsPageContent.ts` 中剩余 11 个组件规范，统一改成：

```ts
demos: [{ title: "示例", exampleId: "dialog" }]
```

英文内容对应：

```ts
demos: [{ title: "Example", exampleId: "dialog" }]
```

同时删除这些组件对应的：

- `previewHtml`
- `codeBlock`

这样 `DocsComponentDemo` 在站点内容层只剩注册表示例引用；legacy demo 类型虽然短期仍可保留给未迁移区块，但这 11 个组件不再使用它。

---

## 文件影响

- `apps/site/src/routes/docs/docsExamples.tsx`
  - 扩展剩余 11 个 example 注册项
- `apps/site/src/routes/docs/docsPageContent.ts`
  - 将剩余 11 个组件从 legacy demo 改为 `exampleId`
- `apps/site/src/routes/docs/docsExamples.test.ts`
  - 增补新 `exampleId` 的注册表断言
- `apps/site/src/routes/docs/docsPageContent.test.ts`
  - 更新剩余组件的 `exampleId` 断言
- `packages/ui/src/styled/*/*.demo.tsx`
  - 仅在原 demo 不够交互时补足最小状态逻辑

---

## 测试策略

- `docsExamples.test.ts`
  - 验证新增组件能从注册表取到 `language: "tsx"`
  - 验证源码来自对应 `*.demo.tsx`，至少包含导出函数名或关键交互代码
- `docsPageContent.test.ts`
  - 验证剩余 11 个组件使用 `exampleId`
  - 验证这些 demo 条目不再含 `previewHtml`
- 回归验证：
  - `pnpm test`
  - `pnpm check`
  - `pnpm build`

---

## 风险与处理

- `docsExamples.tsx` 会继续增长
  - 这轮接受该成本；若未来继续大规模扩张，再抽出声明式 helper，但本轮不提前设计
- 某些 `@tabora/ui` demo 可能更偏组件文档页，而不是官网 `/docs` 视觉语境
  - 允许在 demo 内加入最小包装和本地状态，但不新增第二份 docs 专用 demo
- 动态 import 仍可能出现 `INEFFECTIVE_DYNAMIC_IMPORT` 警告
  - 这是构建层优化问题，不影响这轮“同源交互 demo”目标
