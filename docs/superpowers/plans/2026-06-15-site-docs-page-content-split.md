# Site Docs：docsPageContent.ts 拆分（A1）实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 `apps/site/src/routes/docs/docsPageContent.ts` 拆分为“类型 / 解析逻辑 / 按 locale 的内容数据 / 入口 barrel”，保持对外 import 路径与导出 API 不变。

**架构：** 新增 `docsPageContent.*.ts` 分片文件；`docsPageContent.ts` 退化为稳定入口（re-export + `getDocsPageContent(locale)`）。

**技术栈：** TypeScript + Solid（apps/site），Vitest，pnpm workspace。

---

## 文件结构（将创建/修改）

**创建：**

- `apps/site/src/routes/docs/docsPageContent.types.ts`
- `apps/site/src/routes/docs/docsPageContent.resolve.ts`
- `apps/site/src/routes/docs/docsPageContent.content.zh-CN.ts`
- `apps/site/src/routes/docs/docsPageContent.content.en.ts`
- `apps/site/src/routes/docs/docsPageContent.content.ts`

**修改：**

- `apps/site/src/routes/docs/docsPageContent.ts`

**回归：**

- `apps/site/src/routes/docs/docsPageContent.test.ts`
- `apps/site/src/routes/docs/DocsHomePage.tsx`

---

## 任务 1：建立回归基线（红灯前置）

- [ ] **步骤 1：确认工作区干净**

运行：

```bash
git status --short --untracked-files=all
```

- [ ] **步骤 2：运行 docsPageContent 相关测试**

运行：

```bash
pnpm --filter @tabora/site test -- docsPageContent.test.ts
```

预期：PASS

- [ ] **步骤 3：记录当前入口导出（人工核对）**

入口文件：

- `apps/site/src/routes/docs/docsPageContent.ts`

需要保持的导出（名称与签名不变）：

```ts
export const defaultDocsSectionId
export const docsGuideSectionIds
export type DocsGuideSectionId
export function getDocsSectionPath(id: string): string
export function getDocsComponentSpecs(content: DocsPageContent): DocsComponentSpec[]
export function resolveDocsPage(content: DocsPageContent, requestedId?: string): DocsResolvedPage
export function getDocsPageContent(locale: SiteLocale): DocsPageContent
```

- [ ] **步骤 4：Commit（仅当你新增了任何基线文件）**

本任务通常不需要提交。

---

## 任务 2：拆分类型（types）

**文件：**

- 创建：`apps/site/src/routes/docs/docsPageContent.types.ts`
- 修改：`apps/site/src/routes/docs/docsPageContent.ts`
- 测试：`apps/site/src/routes/docs/docsPageContent.test.ts`

- [ ] **步骤 1：新增 types 文件并迁移类型定义**

目标结构（示意）：

```ts
import type { DocsExampleId } from "./docsExamples"

export type DocsSidebarGroup = { /* ... */ }
export type DocsCodeBlock = { /* ... */ }
export type DocsDemoSection = { /* ... */ }
export type DocsTable = { /* ... */ }
export type DocsRegisteredDemo = { title: string; exampleId: DocsExampleId }
export type DocsLegacyDemo = { title: string; previewHtml: string; codeBlock: DocsCodeBlock }
export type DocsComponentDemo = DocsRegisteredDemo | DocsLegacyDemo
export type DocsComponentSpec = { /* ... */ }
export type DocsPageContent = { /* ... */ }
export type DocsResolvedPage = /* ... */
```

- [ ] **步骤 2：入口文件改为重导出 types（不改对外路径）**

在 `docsPageContent.ts` 中保留：

```ts
export type { DocsPageContent, DocsComponentSpec, DocsResolvedPage } from "./docsPageContent.types"
```

（实际按需要导出全部 `Docs*` 类型）

- [ ] **步骤 3：运行测试验证不回归**

运行：

```bash
pnpm --filter @tabora/site test -- docsPageContent.test.ts
```

预期：PASS

- [ ] **步骤 4：Commit**

```bash
git add apps/site/src/routes/docs/docsPageContent.types.ts apps/site/src/routes/docs/docsPageContent.ts
git commit -m "refactor(site): split docs page content types"
```

---

## 任务 3：拆分解析逻辑（resolve）

**文件：**

- 创建：`apps/site/src/routes/docs/docsPageContent.resolve.ts`
- 修改：`apps/site/src/routes/docs/docsPageContent.ts`
- 测试：`apps/site/src/routes/docs/docsPageContent.test.ts`

- [ ] **步骤 1：新增 resolve 文件并迁移常量与函数**

目标结构（示意）：

```ts
import type { DocsComponentSpec, DocsPageContent, DocsResolvedPage } from "./docsPageContent.types"

export const defaultDocsSectionId = "quickstart"
export const docsGuideSectionIds = [
  "quickstart",
  "manifest",
  "runtime",
  "contributions",
  "tokens",
] as const
export type DocsGuideSectionId = (typeof docsGuideSectionIds)[number]

export function getDocsSectionPath(id: string) {
  /* ... */
}
export function getDocsComponentSpecs(content: DocsPageContent): DocsComponentSpec[] {
  /* ... */
}
export function resolveDocsPage(
  content: DocsPageContent,
  requestedId = defaultDocsSectionId,
): DocsResolvedPage {
  /* ... */
}
```

- [ ] **步骤 2：入口文件重导出 resolve**

```ts
export {
  defaultDocsSectionId,
  docsGuideSectionIds,
  getDocsSectionPath,
  getDocsComponentSpecs,
  resolveDocsPage,
} from "./docsPageContent.resolve"
export type { DocsGuideSectionId } from "./docsPageContent.resolve"
```

- [ ] **步骤 3：运行测试验证不回归**

运行：

```bash
pnpm --filter @tabora/site test -- docsPageContent.test.ts
```

预期：PASS

- [ ] **步骤 4：Commit**

```bash
git add apps/site/src/routes/docs/docsPageContent.resolve.ts apps/site/src/routes/docs/docsPageContent.ts
git commit -m "refactor(site): split docs page content resolver"
```

---

## 任务 4：拆分 locale 内容数据（content）

**文件：**

- 创建：`apps/site/src/routes/docs/docsPageContent.content.zh-CN.ts`
- 创建：`apps/site/src/routes/docs/docsPageContent.content.en.ts`
- 创建：`apps/site/src/routes/docs/docsPageContent.content.ts`
- 修改：`apps/site/src/routes/docs/docsPageContent.ts`
- 测试：`apps/site/src/routes/docs/docsPageContent.test.ts`

- [ ] **步骤 1：将 `zh-CN` 内容对象迁移到独立文件**

```ts
import type { DocsPageContent } from "./docsPageContent.types"

export const zhCNDocsPageContent: DocsPageContent = {
  /* 原 docsPageContent["zh-CN"] 完整搬运 */
}
```

- [ ] **步骤 2：将 `en` 内容对象迁移到独立文件**

```ts
import type { DocsPageContent } from "./docsPageContent.types"

export const enDocsPageContent: DocsPageContent = {
  /* 原 docsPageContent["en"] 完整搬运 */
}
```

- [ ] **步骤 3：聚合 content map**

`docsPageContent.content.ts`：

```ts
import type { SiteLocale } from "../../app/AppShell"
import type { DocsPageContent } from "./docsPageContent.types"
import { enDocsPageContent } from "./docsPageContent.content.en"
import { zhCNDocsPageContent } from "./docsPageContent.content.zh-CN"

export const docsPageContentByLocale: Record<SiteLocale, DocsPageContent> = {
  "zh-CN": zhCNDocsPageContent,
  en: enDocsPageContent,
}
```

- [ ] **步骤 4：入口文件提供 `getDocsPageContent(locale)`**

`docsPageContent.ts`：

```ts
import type { SiteLocale } from "../../app/AppShell"
import { docsPageContentByLocale } from "./docsPageContent.content"

export function getDocsPageContent(locale: SiteLocale) {
  return docsPageContentByLocale[locale]
}
```

- [ ] **步骤 5：运行测试验证不回归**

运行：

```bash
pnpm --filter @tabora/site test -- docsPageContent.test.ts
```

预期：PASS

- [ ] **步骤 6：Commit**

```bash
git add \
  apps/site/src/routes/docs/docsPageContent.content.zh-CN.ts \
  apps/site/src/routes/docs/docsPageContent.content.en.ts \
  apps/site/src/routes/docs/docsPageContent.content.ts \
  apps/site/src/routes/docs/docsPageContent.ts
git commit -m "refactor(site): split docs page content by locale"
```

---

## 任务 5：收口验证与交付

- [ ] **步骤 1：跑 site 测试（如项目配置支持）**

运行：

```bash
pnpm --filter @tabora/site test
```

- [ ] **步骤 2：全仓门禁**

运行：

```bash
pnpm check
```

预期：全部通过（format/lint/typecheck/architecture）

- [ ] **步骤 3：最终状态检查**

运行：

```bash
git status --short --untracked-files=all
```

预期：干净

---

## 执行方式

计划已完成并保存到 `docs/superpowers/plans/2026-06-15-site-docs-page-content-split.md`。两种执行方式：

1. 子代理驱动（推荐）- 每个任务调度一个新的子代理，任务间进行审查，快速迭代
2. 内联执行 - 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点
