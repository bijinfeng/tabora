# Phase X1.5: 文件组织与包边界整理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把插件目录、官方插件集合和 builtin 装配职责整理成更清晰的工程结构，为后续 X2-X4 协议演进建立稳定边界。

**Architecture:** 保持现有运行时行为不变，优先做“目录分层 + 装配职责拆分 + 文档事实源同步”。`@tabora/official-plugins` 收缩为“官方插件集合”，新增 `@tabora/builtin-plugin-registry` 表达当前 shell 默认加载的 builtin 插件集合；playground 和 extension 改为依赖 builtin registry 而不是直接依赖 official pack。目录层面把 `plugins/` 分成 `official/`、`community/`、`examples/`，但保留各插件现有 package name，避免无关 API 震荡。

**Tech Stack:** pnpm workspace、TypeScript、Solid、Vite、WXT、Vitest、tsdown。

---

## 文件结构

**新增或移动：**

- 创建：`packages/builtin-plugin-registry/package.json`
- 创建：`packages/builtin-plugin-registry/tsconfig.json`
- 创建：`packages/builtin-plugin-registry/src/index.ts`
- 创建：`packages/builtin-plugin-registry/src/index.test.ts`
- 移动：`plugins/layout-dashboard` -> `plugins/official/layout-dashboard`
- 移动：`plugins/layout-stream` -> `plugins/official/layout-stream`
- 移动：`plugins/widget-notes` -> `plugins/official/widget-notes`
- 移动：`plugins/widget-quick-links` -> `plugins/official/widget-quick-links`
- 移动：`plugins/widget-today-focus` -> `plugins/official/widget-today-focus`
- 移动：`plugins/widget-todo` -> `plugins/official/widget-todo`
- 移动：`plugins/widget-weather` -> `plugins/official/widget-weather`
- 移动：`plugins/layout-diy-masonry` -> `plugins/community/layout-diy-masonry`
- 创建：`plugins/examples/.gitkeep`

**修改：**

- 修改：`pnpm-workspace.yaml`
- 修改：`packages/official-plugins/package.json`
- 修改：`packages/official-plugins/src/index.ts`
- 修改：`apps/playground/src/workbenchComposition.ts`
- 修改：`apps/extension/entrypoints/newtab/workbenchComposition.ts`
- 修改：`apps/playground/package.json`
- 修改：`apps/extension/package.json`
- 修改：`docs/README.md`
- 修改：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 修改：`docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md`
- 修改：`docs/superpowers/specs/2026-05-29-tabora-execution-roadmap.md`
- 修改：`AGENTS.md`

---

## Task 1: 建立 builtin registry 包并收缩 official pack 语义

**Files:**

- Create: `packages/builtin-plugin-registry/package.json`
- Create: `packages/builtin-plugin-registry/tsconfig.json`
- Create: `packages/builtin-plugin-registry/src/index.ts`
- Create: `packages/builtin-plugin-registry/src/index.test.ts`
- Modify: `packages/official-plugins/src/index.ts`
- Modify: `packages/official-plugins/package.json`

- [ ] **Step 1: 写 builtin registry 的失败测试**

创建 `packages/builtin-plugin-registry/src/index.test.ts`：

```ts
import { describe, expect, it } from "vitest"
import { builtinPlugins } from "./index"
import { officialPlugins } from "@tabora/official-plugins"

describe("builtinPlugins", () => {
  it("includes the official plugin pack plus community verification layouts", () => {
    expect(builtinPlugins.length).toBeGreaterThan(officialPlugins.length)
    expect(
      builtinPlugins.some((plugin) => plugin.manifest.id === "official.layout.workbench-dashboard"),
    ).toBe(true)
    expect(
      builtinPlugins.some((plugin) => plugin.manifest.id === "community.layout.diy-masonry"),
    ).toBe(true)
  })

  it("keeps community verification layouts out of officialPlugins", () => {
    expect(
      officialPlugins.some((plugin) => plugin.manifest.id === "community.layout.diy-masonry"),
    ).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

运行：`pnpm exec vitest run packages/builtin-plugin-registry/src/index.test.ts`

预期：FAIL，报 `@tabora/builtin-plugin-registry` 文件不存在，或 `officialPlugins` 仍包含 community layout。

- [ ] **Step 3: 创建 builtin registry 包**

创建 `packages/builtin-plugin-registry/package.json`：

```json
{
  "name": "@tabora/builtin-plugin-registry",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "exports": {
      ".": "./dist/index.js",
      "./package.json": "./package.json"
    }
  },
  "scripts": {
    "build": "vp pack src/index.ts"
  },
  "dependencies": {
    "@tabora/layout-diy-masonry": "workspace:*",
    "@tabora/official-plugins": "workspace:*"
  },
  "devDependencies": {
    "@tabora/tsconfig": "workspace:*"
  }
}
```

创建 `packages/builtin-plugin-registry/tsconfig.json`：

```json
{
  "extends": "@tabora/tsconfig/base.json",
  "include": ["src"]
}
```

创建 `packages/builtin-plugin-registry/src/index.ts`：

```ts
import { layoutDiyMasonry } from "@tabora/layout-diy-masonry"
import { officialPlugins } from "@tabora/official-plugins"

export { officialPlugins }

export const builtinPlugins = [...officialPlugins, layoutDiyMasonry]
```

- [ ] **Step 4: 收缩 `officialPlugins` 到官方插件集合**

把 `packages/official-plugins/src/index.ts` 中：

```ts
import { layoutDiyMasonry } from "@tabora/layout-diy-masonry"
```

删除，并把：

```ts
  layoutDiyMasonry,
```

从 export 列表和 `officialPlugins` 数组中删除。

同时在 `packages/official-plugins/package.json` 的 `dependencies` 中删除：

```json
"@tabora/layout-diy-masonry": "workspace:*"
```

- [ ] **Step 5: 运行测试确认通过**

运行：

```bash
pnpm exec vitest run packages/builtin-plugin-registry/src/index.test.ts
pnpm --filter @tabora/official-plugins build
pnpm --filter @tabora/builtin-plugin-registry build
```

预期：全部 PASS。

- [ ] **Step 6: Commit**

```bash
git add packages/builtin-plugin-registry packages/official-plugins
git commit -m "refactor(registry): split builtin plugin registry from official pack"
```

---

## Task 2: 调整 shell 装配入口到 builtin registry

**Files:**

- Modify: `apps/playground/src/workbenchComposition.ts`
- Modify: `apps/extension/entrypoints/newtab/workbenchComposition.ts`
- Modify: `apps/playground/package.json`
- Modify: `apps/extension/package.json`

- [ ] **Step 1: 写装配入口的失败测试**

在 `packages/builtin-plugin-registry/src/index.test.ts` 末尾追加：

```ts
it("exposes the current builtin list for shell bootstrap", () => {
  expect(builtinPlugins.map((plugin) => plugin.manifest.id)).toContain(
    "community.layout.diy-masonry",
  )
})
```

说明：本步不新增独立文件，复用 Task 1 的测试文件即可。

- [ ] **Step 2: 修改 playground / extension composition**

把 `apps/playground/src/workbenchComposition.ts` 中：

```ts
import { officialPlugins } from "@tabora/official-plugins"
```

替换为：

```ts
import { builtinPlugins } from "@tabora/builtin-plugin-registry"
```

并将：

```ts
    plugins: officialPlugins,
```

替换为：

```ts
    plugins: builtinPlugins,
```

对 `apps/extension/entrypoints/newtab/workbenchComposition.ts` 做同样替换。

- [ ] **Step 3: 补齐 app 依赖**

在 `apps/playground/package.json` 和 `apps/extension/package.json` 的 `dependencies` 中追加：

```json
"@tabora/builtin-plugin-registry": "workspace:*"
```

同时删除这两个文件中不再需要的：

```json
"@tabora/official-plugins": "workspace:*"
```

仅在对应文件已经不再直接 import `@tabora/official-plugins` 时删除。

- [ ] **Step 4: 运行定向验证**

运行：

```bash
pnpm --filter @tabora/playground build
pnpm --filter @tabora/extension build
rg -n "@tabora/official-plugins" apps/playground apps/extension
```

预期：

- 两个 build PASS。
- app 层只保留样式 import `@tabora/official-plugins/styles.css`，不再把它作为 builtin 插件列表来源。

- [ ] **Step 5: Commit**

```bash
git add apps/playground apps/extension
git commit -m "refactor(shell): bootstrap builtin plugins from registry"
```

---

## Task 3: 分层 `plugins/` 目录结构

**Files:**

- Move: `plugins/layout-dashboard` -> `plugins/official/layout-dashboard`
- Move: `plugins/layout-stream` -> `plugins/official/layout-stream`
- Move: `plugins/widget-notes` -> `plugins/official/widget-notes`
- Move: `plugins/widget-quick-links` -> `plugins/official/widget-quick-links`
- Move: `plugins/widget-today-focus` -> `plugins/official/widget-today-focus`
- Move: `plugins/widget-todo` -> `plugins/official/widget-todo`
- Move: `plugins/widget-weather` -> `plugins/official/widget-weather`
- Move: `plugins/layout-diy-masonry` -> `plugins/community/layout-diy-masonry`
- Create: `plugins/examples/.gitkeep`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: 扩展 workspace glob**

把 `pnpm-workspace.yaml` 中：

```yaml
- plugins/*
```

替换为：

```yaml
- plugins/*
- plugins/*/*
```

- [ ] **Step 2: 移动插件目录**

运行以下命令：

```bash
mkdir -p plugins/official plugins/community plugins/examples
mv plugins/layout-dashboard plugins/official/layout-dashboard
mv plugins/layout-stream plugins/official/layout-stream
mv plugins/widget-notes plugins/official/widget-notes
mv plugins/widget-quick-links plugins/official/widget-quick-links
mv plugins/widget-today-focus plugins/official/widget-today-focus
mv plugins/widget-todo plugins/official/widget-todo
mv plugins/widget-weather plugins/official/widget-weather
mv plugins/layout-diy-masonry plugins/community/layout-diy-masonry
touch plugins/examples/.gitkeep
```

- [ ] **Step 3: 运行安装与构建检查**

运行：

```bash
pnpm install
pnpm --filter @tabora/layout-dashboard build
pnpm --filter @tabora/layout-stream build
pnpm --filter @tabora/layout-diy-masonry build
pnpm --filter @tabora/plugin-todo build
```

预期：workspace 能重新识别移动后的插件包，定向 build PASS。

- [ ] **Step 4: Commit**

```bash
git add pnpm-workspace.yaml plugins
git commit -m "refactor(plugins): organize official and community plugin directories"
```

---

## Task 4: 同步工程文档与仓库结构说明

**Files:**

- Modify: `docs/README.md`
- Modify: `docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- Modify: `docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md`
- Modify: `docs/superpowers/specs/2026-05-29-tabora-execution-roadmap.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: 更新 `AGENTS.md` 工程结构**

把工程结构章节补充为包含：

```txt
packages/
  built-in-plugin-registry/
  official-plugins/
  workbench-app/
  host-adapters/

plugins/
  official/
    layout-dashboard/
    layout-stream/
    widget-notes/
    widget-quick-links/
    widget-today-focus/
    widget-todo/
    widget-weather/
  community/
    layout-diy-masonry/
  examples/
```

并补一条规则：

```md
- `@tabora/official-plugins` 表示官方插件集合，不负责 shell 默认 builtin 装配。
- shell 默认装配来源应走独立 builtin registry，而不是直接把 official pack 当作 runtime bootstrap 列表。
```

- [ ] **Step 2: 更新文档地图**

在 `docs/README.md` 的插件系统 / 技术方案相关段落中明确：

- `plugins/official` / `plugins/community` / `plugins/examples` 的目录语义。
- `@tabora/official-plugins` 是官方插件集合。
- `@tabora/builtin-plugin-registry` 是当前 shell 默认加载列表。

- [ ] **Step 3: 更新技术方案与阶段 spec**

在 `docs/technical/tabora-plugin-workbench-technical-design-v2.md` 和 `docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md` 中同步：

- `packages/official-plugins` 不再承担 builtin registry 职责。
- 新增 `packages/builtin-plugin-registry`。
- `plugins/` 已分层。
- Phase X1.5 的状态从“待执行”更新为“已完成”。

在 `docs/superpowers/specs/2026-05-29-tabora-execution-roadmap.md` 中同步当前基线，避免继续把 app 间 import 或官方/community 混放描述为现状。

- [ ] **Step 4: 运行文档校验**

运行：

```bash
pnpm check
rg -n "builtin-plugin-registry|plugins/official|plugins/community|plugins/examples" AGENTS.md docs
```

预期：`pnpm check` PASS，文档中能找到新结构说明。

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md docs
git commit -m "docs: sync plugin directory and registry boundaries"
```

---

## Task 5: Phase X1.5 收尾验证

**Files:**

- Modify: `docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md`

- [ ] **Step 1: 运行项目级验证**

运行：

```bash
pnpm check
pnpm test
pnpm build
```

预期：全部 PASS。

- [ ] **Step 2: 验证 app 层不再直接把 official pack 当作 builtin 装配来源**

运行：

```bash
rg -n "officialPlugins" apps/playground apps/extension
```

预期：0 匹配。

运行：

```bash
rg -n "@tabora/playground/src" apps/extension
```

预期：0 匹配。

- [ ] **Step 3: 验证目录分层**

运行：

```bash
find plugins -maxdepth 2 -type d | sort
```

预期：出现 `plugins/official`、`plugins/community`、`plugins/examples`，且插件包位于分层目录下。

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md
git commit -m "chore: finalize phase x1.5 package boundary cleanup"
```

---

## 自检结果

- **规格覆盖度：** 覆盖了 X1.5 的三类核心目标：目录分层、official pack / builtin registry 职责拆分、文档入口同步。
- **范围控制：** 没有把 X2 的协议修改、X3 的 orchestrator 下沉、X4 的 commands/keybindings/context menus 混入本计划。
- **可执行性：** 每个任务都能独立提交，并带有明确验证命令。
- **已知风险：** `apps/extension/entrypoints/newtab/App.tsx` 仍通过相对路径复用 playground helper；此问题留在 X3 继续下沉 shared shell 逻辑，不在 X1.5 内扩大范围。
