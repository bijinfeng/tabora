# Site Docs：docsPageContent.ts 拆分设计（A1）

## 背景

`apps/site/src/routes/docs/docsPageContent.ts` 当前同时承载：

- 类型定义（`Docs*`）
- 解析与工具函数（`resolveDocsPage`、`getDocsComponentSpecs`、路由 id 常量）
- 文档内容数据（`zh-CN`、`en` 两份大对象）

文件规模持续增长后：

- diff 与 review 粒度变差（改英文容易同时触碰中文块）
- 逻辑与数据耦合，维护门槛升高
- 单文件内聚性不足，后续扩写 docs 内容更容易引入回归

本轮目标是治理“巨型内容文件”，在**不改变对外 API 与 import 路径**的前提下，把文件按职责拆分。

## 目标

- 保持对外 import 路径不变：仍通过 `./docsPageContent` 引入。
- 保持导出 API 不变：
  - `defaultDocsSectionId`
  - `docsGuideSectionIds`、`DocsGuideSectionId`
  - `getDocsSectionPath`
  - `getDocsComponentSpecs`
  - `resolveDocsPage`
  - `getDocsPageContent(locale)`
  - 以及所有 `Docs*` 类型
- 只做物理拆分与重导出：不改文案、不改 id、不改数据结构、不改测试期望。
- 将内容数据按 locale 拆分，提升后续维护与 review 质量。

## 非目标

- 不重写 docs 的内容组织方式（不引入生成器、DSL、markdown 管线）。
- 不改变 docs 路由规则与页面结构。
- 不更改 `docsExamples` registry 的设计或引入方式。
- 不引入新的依赖包。

## 拆分方案（A1）

保持原入口文件作为稳定“barrel”，新增分片文件：

```txt
apps/site/src/routes/docs/
  docsPageContent.ts
  docsPageContent.types.ts
  docsPageContent.resolve.ts
  docsPageContent.content.ts
  docsPageContent.content.zh-CN.ts
  docsPageContent.content.en.ts
```

### 1) docsPageContent.types.ts

仅放类型定义：

- `DocsSidebarGroup`
- `DocsCodeBlock`
- `DocsDemoSection`
- `DocsTable`
- `DocsRegisteredDemo`
- `DocsLegacyDemo`
- `DocsComponentDemo`
- `DocsComponentSpec`
- `DocsPageContent`
- `DocsGuideSectionId`（由 `docsGuideSectionIds` 推导）
- `DocsResolvedGuidePage` / `DocsResolvedComponentPage` / `DocsResolvedMissingPage` / `DocsResolvedPage`

### 2) docsPageContent.resolve.ts

仅放解析与工具函数 + guide section id 常量：

- `defaultDocsSectionId`
- `docsGuideSectionIds`
- `getDocsSectionPath`
- `getDocsComponentSpecs`
- `resolveDocsPage`

约束：

- 该文件只依赖 `docsPageContent.types.ts`，不直接引用任何 locale 内容对象。
- `resolveDocsPage` 的行为保持不变：guide 先匹配，再匹配 component spec，最后 fallback missing。

### 3) docsPageContent.content.\*.ts

按 locale 拆数据：

- `docsPageContent.content.zh-CN.ts`：导出 `zhCNDocsPageContent: DocsPageContent`
- `docsPageContent.content.en.ts`：导出 `enDocsPageContent: DocsPageContent`

### 4) docsPageContent.content.ts

聚合成 `Record<SiteLocale, DocsPageContent>`：

- 统一导出 `docsPageContentByLocale`

### 5) docsPageContent.ts（稳定入口）

保持对外路径与 API：

- 重导出 `types` 与 `resolve` 的所有需要对外暴露的符号
- 提供 `getDocsPageContent(locale)`：从 `docsPageContentByLocale` 取值并返回

## 兼容性与回归策略

### 兼容性原则

- 外部调用方（例如 `DocsHomePage.tsx`、`docsPageContent.test.ts`）不需要改 import 路径。
- 允许在内部新增分片文件，但必须保证所有 export 名称与签名保持一致。

### 测试策略

当前已有回归覆盖：

- `apps/site/src/routes/docs/docsPageContent.test.ts`

本轮拆分完成后：

- 该测试文件应保持不变或仅做必要的 import 细节调整（原则上不需要）。
- 通过运行 `pnpm check` 验证格式、lint、typecheck、architecture 不回归。

## 风险与缓解

- 风险：拆分过程中漏导出或导出路径变化，导致页面或测试 import 失败。
  - 缓解：坚持“入口 barrel 不变”，并以 `docsPageContent.test.ts` 作为最小回归门禁。
- 风险：循环依赖（types/resolve/content 相互 import）。
  - 缓解：严格单向依赖：`types` → `resolve`，`content.*` → `content`，入口 `docsPageContent.ts` 只做聚合。

## 交付清单

- 新增分片文件并迁移代码
- 入口 `docsPageContent.ts` 对外 API 保持稳定
- `pnpm check` 通过
- `docsPageContent.test.ts` 通过
