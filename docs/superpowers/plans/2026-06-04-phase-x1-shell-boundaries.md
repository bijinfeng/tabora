# Phase X1: Shell 工程边界收口 Implementation Plan

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 把 `apps/playground` 从事实上的平台核心收缩为组合根，建立 `workbench-app` / `host-adapters` / `workbench-shell` 的清晰边界，并让 extension 改为独立 shell entry，在不改变当前用户行为的前提下为后续 X2-X8 协议演进提供稳定工程基础。

**架构：** 以“先收组合根，再迁状态和 host surfaces，最后切断 app 间源码依赖”为主线。当前分支已经完成 X1 起步工作：新增 `@tabora/workbench-app`、`@tabora/host-adapters` 最小包骨架，并让 playground 通过 `apps/playground/src/workbenchComposition.ts` 显式接入 composition 占位。后续任务在这个基线上继续，把 runtime/bootstrap、host adapter、样式入口、错误边界和 extension shell 逐步收口，不在本计划内引入新的 contribution 协议。

**技术栈：** pnpm workspace、Solid、TypeScript（ESM、双引号、无分号）、Vite、WXT、Dexie、Vitest、tsdown。

**关联 spec：**

- `docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md`
- `docs/superpowers/specs/2026-05-29-tabora-execution-roadmap.md`

---

## 文件结构

**当前已存在的 X1 起步落点**

- `packages/workbench-app/src/index.ts`：当前仅提供 composition 占位类型和 `createWorkbenchComposition()`。
- `packages/host-adapters/src/index.ts`：当前仅提供 `HostAdapter` / `HostCapabilities` 和 web/extension adapter 构造器。
- `apps/playground/src/workbenchComposition.ts`：playground 对 `workbench-app` 的最小接线。

**本计划将新增或修改的主要文件**

**跨 shell 组合层**

- 修改 `packages/workbench-app/src/index.ts`：从“纯占位类型”扩展为公共 bootstrap 导出面。
- 创建 `packages/workbench-app/src/bootstrap.ts`：集中创建 database、repositories、plugin catalog、kernel。
- 创建 `packages/workbench-app/src/bootstrap.test.ts`：验证 bootstrap 组装结果。
- 视需要创建 `packages/workbench-app/src/types.ts`：避免 `index.ts` 继续膨胀。

**host adapter 层**

- 修改 `packages/host-adapters/src/index.ts`：从静态 capability 描述扩展为 host service contract 的稳定导出面。
- 创建 `packages/host-adapters/src/web.ts`：web host adapter。
- 创建 `packages/host-adapters/src/extension.ts`：extension host adapter。
- 创建 `packages/host-adapters/src/domEffects.ts`：`window` / `document` 相关副作用实现。
- 创建 `packages/host-adapters/src/index.test.ts`：adapter contract 基础测试。

**playground shell**

- 修改 `apps/playground/src/App.tsx`：只保留组合根和 UI 编排，逐步移除基础设施对象创建。
- 修改 `apps/playground/src/workbenchComposition.ts`：从简单 wrapper 改为装配 playground runtime/bootstrap。
- 视需要创建 `apps/playground/src/runtimeBootstrap.ts`：短期过渡文件，后续再整体迁入 `workbench-app`。
- 修改 `apps/playground/src/bootstrap.tsx`：统一样式入口加载顺序。

**extension shell**

- 修改 `apps/extension/entrypoints/newtab/main.tsx`：不再 import `@tabora/playground/src/App`。
- 创建 `apps/extension/entrypoints/newtab/App.tsx`：extension 自己的 shell entry，复用 `workbench-app` 和 `host-adapters`。
- 修改 `apps/extension/package.json`：补齐 `@tabora/workbench-app`、`@tabora/host-adapters`、`@tabora/workbench-shell` 依赖。
- 修改 `apps/extension/wxt.config.ts`：删除 `@tabora/playground/src` alias，切断 app 间源码 import。

**宿主容器与错误边界**

- 修改 `packages/workbench-shell/src/PluginViewBoundary.tsx`：从同步 `try/catch` 改为 Solid `ErrorBoundary`。
- 修改 `packages/workbench-shell/src/PluginViewBoundary.test.tsx`：对齐新的 fallback 行为。
- 创建 `packages/workbench-shell/src/ToastHost.tsx`：统一 toast surface。
- 创建 `packages/workbench-shell/src/ToastHost.test.tsx`。
- 创建 `packages/workbench-shell/src/SurfaceHosts.tsx`：承接 modal/fullscreen/expand/context-menu/add-widget 等 surface 的最小复用容器。
- 修改 `packages/workbench-shell/src/index.ts`：导出新增 surface 组件。
- 修改 `packages/workbench-shell/src/styles.css`：收口宿主 surface 样式。

**文档**

- 修改 `docs/technical/tabora-plugin-workbench-technical-design-v2.md`：同步 X1 的 package 边界与当前实现状态。
- 修改 `docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md`：把状态更新为“implementation plan 已创建”并记录当前基线。
- 修改 `docs/README.md`：登记本计划入口。

---

## 任务 0：冻结 Phase X1 基线并补文档入口

**文件：**

- 修改：`docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md`
- 修改：`docs/README.md`
- 创建：`docs/superpowers/plans/2026-06-04-phase-x1-shell-boundaries.md`

说明：

- 本任务中的 `packages/workbench-app/*`、`packages/host-adapters/*`、`apps/playground/src/workbenchComposition.ts` 检查只用于确认当前分支的 X1 基线状态，不在任务 0 内修改这些代码文件。

- [ ] **步骤 1：确认当前分支已存在的 X1 起步工作**

运行：

```bash
git status --short --untracked-files=all
sed -n '1,220p' packages/workbench-app/src/index.ts
sed -n '1,220p' packages/host-adapters/src/index.ts
sed -n '1,220p' apps/playground/src/workbenchComposition.ts
```

预期：

- 工作树里已经包含 `packages/workbench-app/*`、`packages/host-adapters/*`、`apps/playground/src/workbenchComposition.ts` 等 X1 起步文件。
- 这些文件仍是“最小骨架”，还没有承接完整 runtime/bootstrap 与 extension shell。

- [ ] **步骤 2：更新 spec 状态为“已有 implementation plan”**

把 `docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md` 头部从：

```md
状态：讨论沉淀，待拆分实施计划
```

改为：

```md
状态：implementation plan 已创建，待执行
```

并在文档用途段落后追加一小段：

```md
当前 Phase X1 已有 implementation plan：`docs/superpowers/plans/2026-06-04-phase-x1-shell-boundaries.md`。
当前分支已完成最小起步工作：新增 `@tabora/workbench-app`、`@tabora/host-adapters` 骨架，并让 playground 显式接入 `workbenchComposition` 占位。
```

- [ ] **步骤 3：在文档地图登记计划入口**

在 `docs/README.md` 的“插件系统可扩展性评估与改造方向”小节后追加：

```md
### Phase X1: Shell 工程边界收口 Implementation Plan

- `docs/superpowers/plans/2026-06-04-phase-x1-shell-boundaries.md`

用途：

- 把 `docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md` 中的 Phase X1 拆成可执行的工程任务。
- 作为收缩 `App.tsx`、建立 `workbench-app` / `host-adapters` / `workbench-shell` 边界、切断 extension 对 playground 源码依赖的直接实施入口。
```

- [ ] **步骤 4：验证文档入口存在**

运行：

```bash
rg -n "2026-06-04-phase-x1-shell-boundaries" docs/README.md docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md
```

预期：两个文件都能找到这份 plan 的路径。

- [ ] **步骤 5：Commit**

仅在这三个文档文件是本轮唯一待提交变更，或你已经先行整理好工作树时执行：

```bash
git add docs/README.md docs/superpowers/specs/2026-06-04-plugin-system-extensibility-review.md docs/superpowers/plans/2026-06-04-phase-x1-shell-boundaries.md
git commit -m "docs: add phase x1 shell boundaries implementation plan"
```

---

## 任务 1：把 runtime/bootstrap 创建逻辑迁入 `workbench-app`

**文件：**

- 创建：`packages/workbench-app/src/bootstrap.ts`
- 创建：`packages/workbench-app/src/bootstrap.test.ts`
- 修改：`packages/workbench-app/src/index.ts`
- 修改：`apps/playground/src/workbenchComposition.ts`
- 修改：`apps/playground/src/App.tsx`

- [ ] **步骤 1：为 bootstrap 导出面写失败测试**

创建 `packages/workbench-app/src/bootstrap.test.ts`：

```ts
import "fake-indexeddb/auto"
import { describe, expect, it } from "vitest"
import { officialPlugins } from "@tabora/official-plugins"
import { createWebHostAdapter } from "@tabora/host-adapters"
import { createWorkbenchRuntimeBootstrap } from "./bootstrap"

describe("createWorkbenchRuntimeBootstrap", () => {
  it("creates kernel, catalog, database, and repositories together", () => {
    const runtime = createWorkbenchRuntimeBootstrap({
      host: createWebHostAdapter({ id: "host.test" }),
      plugins: officialPlugins,
      databaseName: "tabora-workbench-app-bootstrap-test",
    })

    expect(runtime.host.id).toBe("host.test")
    expect(runtime.kernel.plugins).toEqual([])
    expect(runtime.catalog.plugins).toBe(officialPlugins)
    expect(runtime.repositories.workspaceRepo).toBeDefined()
    expect(runtime.repositories.instanceRepo).toBeDefined()
    expect(runtime.repositories.pluginDataRepo).toBeDefined()
    expect(runtime.repositories.pluginRecordRepo).toBeDefined()
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
pnpm --filter @tabora/workbench-app exec vitest run src/bootstrap.test.ts
```

预期：FAIL，报 `createWorkbenchRuntimeBootstrap` 或 `./bootstrap` 不存在。

- [ ] **步骤 3：实现 `bootstrap.ts`**

创建 `packages/workbench-app/src/bootstrap.ts`：

```ts
import { createPluginCatalog } from "@tabora/orchestrator"
import { createPluginKernel, type BuiltinPlugin } from "@tabora/platform-kernel"
import {
  createInstanceRepository,
  createPluginDataRepository,
  createPluginRecordRepository,
  createTaboraDatabase,
  createWorkspaceRepository,
} from "@tabora/storage"
import type { HostAdapter } from "@tabora/host-adapters"

export type WorkbenchRuntimeBootstrap = ReturnType<typeof createWorkbenchRuntimeBootstrap>

export function createWorkbenchRuntimeBootstrap(options: {
  host: HostAdapter
  plugins: BuiltinPlugin[]
  databaseName?: string
}) {
  const database = createTaboraDatabase(options.databaseName)
  const workspaceRepo = createWorkspaceRepository(database)
  const instanceRepo = createInstanceRepository(database)
  const pluginDataRepo = createPluginDataRepository(database)
  const pluginRecordRepo = createPluginRecordRepository(database)
  const catalog = createPluginCatalog(options.plugins)
  const kernel = createPluginKernel({
    lifecycleStore: pluginRecordRepo,
    recordSource: "builtin",
  })

  return {
    host: options.host,
    database,
    catalog,
    kernel,
    repositories: {
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      pluginRecordRepo,
    },
  }
}
```

- [ ] **步骤 4：把导出面接到 `index.ts`**

把 `packages/workbench-app/src/index.ts` 改成：

```ts
import type { PluginInstance, WorkbenchSearchSettings, Workspace } from "@tabora/plugin-api"
import type { HostAdapter } from "@tabora/host-adapters"

export * from "./bootstrap"

export type WorkbenchCompositionState = {
  workspace: Workspace | null
  instances: PluginInstance[]
  searchSettings: WorkbenchSearchSettings
}

export type WorkbenchComposition = {
  host: HostAdapter
  initialState: WorkbenchCompositionState
}

export type CreateWorkbenchCompositionOptions = {
  host: HostAdapter
  initialState?: Partial<WorkbenchCompositionState>
}

const DEFAULT_SEARCH_SETTINGS: WorkbenchSearchSettings = {
  defaultProviderId: "",
}

export function createWorkbenchComposition(
  options: CreateWorkbenchCompositionOptions,
): WorkbenchComposition {
  return {
    host: options.host,
    initialState: {
      workspace: options.initialState?.workspace ?? null,
      instances: options.initialState?.instances ?? [],
      searchSettings: options.initialState?.searchSettings ?? DEFAULT_SEARCH_SETTINGS,
    },
  }
}
```

- [ ] **步骤 5：让 playground composition 使用新 bootstrap**

把 `apps/playground/src/workbenchComposition.ts` 改成：

```ts
import { createWebHostAdapter } from "@tabora/host-adapters"
import {
  createWorkbenchComposition,
  createWorkbenchRuntimeBootstrap,
  type WorkbenchComposition,
} from "@tabora/workbench-app"
import { officialPlugins } from "@tabora/official-plugins"

export function createPlaygroundWorkbenchComposition(): WorkbenchComposition {
  return createWorkbenchComposition({
    host: createWebHostAdapter({
      id: "host.playground",
    }),
  })
}

export function createPlaygroundRuntimeBootstrap() {
  const composition = createPlaygroundWorkbenchComposition()
  return createWorkbenchRuntimeBootstrap({
    host: composition.host,
    plugins: officialPlugins,
  })
}
```

- [ ] **步骤 6：让 `App.tsx` 停止直接 new 基础设施对象**

把 `apps/playground/src/App.tsx` 里这段：

```ts
const database = createTaboraDatabase()
const workspaceRepo = createWorkspaceRepository(database)
const instanceRepo = createInstanceRepository(database)
const pluginDataRepo = createPluginDataRepository(database)
const pluginRecordRepo = createPluginRecordRepository(database)
const pluginCatalog = createPluginCatalog(officialPlugins)

const kernel = createPluginKernel({
  lifecycleStore: pluginRecordRepo,
  recordSource: "builtin",
})
```

替换为：

```ts
const runtime = createPlaygroundRuntimeBootstrap()
const database = runtime.database
const workspaceRepo = runtime.repositories.workspaceRepo
const instanceRepo = runtime.repositories.instanceRepo
const pluginDataRepo = runtime.repositories.pluginDataRepo
const pluginRecordRepo = runtime.repositories.pluginRecordRepo
const pluginCatalog = runtime.catalog
const kernel = runtime.kernel
```

同时删除不再使用的 import：

```ts
import { officialPlugins } from "@tabora/official-plugins"
import { createPluginCatalog } from "@tabora/orchestrator"
import { createPluginKernel } from "@tabora/platform-kernel"
import {
  createInstanceRepository,
  createPluginDataRepository,
  createPluginRecordRepository,
  createTaboraDatabase,
  createWorkspaceRepository,
} from "@tabora/storage"
```

并新增：

```ts
import { createPlaygroundRuntimeBootstrap } from "./workbenchComposition"
```

- [ ] **步骤 7：运行定向验证**

运行：

```bash
pnpm --filter @tabora/workbench-app exec vitest run src/bootstrap.test.ts
pnpm --filter @tabora/playground build
```

预期：

- `bootstrap.test.ts` PASS。
- `playground build` PASS，行为无变化。

- [ ] **步骤 8：Commit**

```bash
git add packages/workbench-app/src/bootstrap.ts packages/workbench-app/src/bootstrap.test.ts packages/workbench-app/src/index.ts apps/playground/src/workbenchComposition.ts apps/playground/src/App.tsx
git commit -m "refactor(workbench-app): centralize runtime bootstrap"
```

---

## 任务 2：收口 host adapter 的稳定导出面

**文件：**

- 创建：`packages/host-adapters/src/web.ts`
- 创建：`packages/host-adapters/src/extension.ts`
- 创建：`packages/host-adapters/src/index.test.ts`
- 修改：`packages/host-adapters/src/index.ts`

- [ ] **步骤 1：为 adapter factory 导出面写失败测试**

创建 `packages/host-adapters/src/index.test.ts`：

```ts
import { describe, expect, it } from "vitest"
import { createExtensionHostAdapter, createWebHostAdapter } from "./index"

describe("host adapters", () => {
  it("creates web adapter with expected platform defaults", () => {
    const adapter = createWebHostAdapter({ id: "host.playground" })

    expect(adapter.platform).toBe("web")
    expect(adapter.capabilities.canOpenExternal).toBe(true)
    expect(adapter.id).toBe("host.playground")
  })

  it("creates extension adapter with extension platform", () => {
    const adapter = createExtensionHostAdapter()

    expect(adapter.platform).toBe("extension")
    expect(adapter.id).toBe("host.extension")
  })
})
```

- [ ] **步骤 2：把 web/extension 拆成独立文件**

创建 `packages/host-adapters/src/web.ts`：

```ts
import type { HostAdapter } from "./index"

export function createWebHostAdapter(overrides: Partial<HostAdapter> = {}): HostAdapter {
  return {
    id: overrides.id ?? "host.web",
    platform: overrides.platform ?? "web",
    capabilities: {
      canOpenExternal: true,
      canApplyTheme: true,
      canApplyBackground: true,
      canImportExportWorkspace: true,
      canRunLegacyMigration: true,
      ...overrides.capabilities,
    },
  }
}
```

创建 `packages/host-adapters/src/extension.ts`：

```ts
import type { HostAdapter } from "./index"

export function createExtensionHostAdapter(overrides: Partial<HostAdapter> = {}): HostAdapter {
  return {
    id: overrides.id ?? "host.extension",
    platform: overrides.platform ?? "extension",
    capabilities: {
      canOpenExternal: true,
      canApplyTheme: true,
      canApplyBackground: true,
      canImportExportWorkspace: true,
      canRunLegacyMigration: true,
      ...overrides.capabilities,
    },
  }
}
```

- [ ] **步骤 3：精简 `index.ts` 为 contract + re-export**

把 `packages/host-adapters/src/index.ts` 改成：

```ts
export type HostPlatform = "web" | "extension" | "desktop-webview"

export type HostCapabilities = {
  canOpenExternal: boolean
  canApplyTheme: boolean
  canApplyBackground: boolean
  canImportExportWorkspace: boolean
  canRunLegacyMigration: boolean
}

export type HostAdapter = {
  id: string
  platform: HostPlatform
  capabilities: HostCapabilities
}

export function defineHostAdapter(adapter: HostAdapter): HostAdapter {
  return adapter
}

export { createWebHostAdapter } from "./web"
export { createExtensionHostAdapter } from "./extension"
```

- [ ] **步骤 4：运行定向验证**

运行：

```bash
pnpm --filter @tabora/host-adapters exec vitest run src/index.test.ts
pnpm --filter @tabora/host-adapters build
```

预期：全部 PASS。

- [ ] **步骤 5：Commit**

```bash
git add packages/host-adapters/src/index.ts packages/host-adapters/src/web.ts packages/host-adapters/src/extension.ts packages/host-adapters/src/index.test.ts
git commit -m "refactor(host-adapters): split adapter factories by platform"
```

---

## 任务 3：把 extension newtab 从 playground 源码 import 切到独立 shell

**文件：**

- 创建：`apps/extension/entrypoints/newtab/App.tsx`
- 修改：`apps/extension/entrypoints/newtab/main.tsx`
- 修改：`apps/extension/package.json`
- 修改：`apps/extension/wxt.config.ts`

- [ ] **步骤 1：补齐 extension 的 workspace 依赖**

在 `apps/extension/package.json` 的 `dependencies` 中追加：

```json
"@tabora/host-adapters": "workspace:*",
"@tabora/workbench-app": "workspace:*",
"@tabora/workbench-shell": "workspace:*"
```

- [ ] **步骤 2：创建 extension 自己的 App 入口**

创建 `apps/extension/entrypoints/newtab/App.tsx`：

```tsx
import { App as PlaygroundApp } from "@tabora/playground/src/App"

export function App() {
  return <PlaygroundApp />
}
```

说明：这一步仍是壳层包装，目的是先让 extension 有自己的 entry 文件；后续任务再移除对 playground `App` 的转发。

- [ ] **步骤 3：让 `main.tsx` 只依赖 extension 本地入口**

把 `apps/extension/entrypoints/newtab/main.tsx` 改成：

```tsx
import { render } from "solid-js/web"
import "@tabora/ui/styles.css"

import { App } from "./App"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element #root was not found")
}

render(() => <App />, root)
```

- [ ] **步骤 4：删除跨 app alias**

在 `apps/extension/wxt.config.ts` 里删除：

```ts
    resolve: {
      alias: {
        "@tabora/playground/src": path.resolve(__dirname, "../playground/src"),
      },
    },
```

同时删除不再需要的：

```ts
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
```

- [ ] **步骤 5：运行定向验证**

运行：

```bash
pnpm --filter @tabora/extension build
```

预期：PASS，且源码层已不存在 `@tabora/playground/src` alias 依赖。

- [ ] **步骤 6：静态核对跨 app import**

运行：

```bash
rg -n "@tabora/playground/src" apps/extension apps/playground
```

预期：只允许出现在过渡包装文件时的受控引用；在本任务结束后应为 0 匹配。

- [ ] **步骤 7：Commit**

```bash
git add apps/extension/package.json apps/extension/entrypoints/newtab/App.tsx apps/extension/entrypoints/newtab/main.tsx apps/extension/wxt.config.ts
git commit -m "refactor(extension): create dedicated newtab shell entry"
```

---

## 任务 4：统一 shell 样式入口

**文件：**

- 创建：`packages/workbench-shell/src/stylePreset.ts`
- 修改：`apps/playground/src/bootstrap.tsx`
- 修改：`apps/extension/entrypoints/newtab/main.tsx`
- 修改：`apps/extension/entrypoints/newtab/App.tsx`

- [ ] **步骤 1：创建 shell 样式 preset 描述**

创建 `packages/workbench-shell/src/stylePreset.ts`：

```ts
export const workbenchShellStyleModules = [
  "@tabora/ui/styles.css",
  "@tabora/official-plugins/styles.css",
  "@tabora/layout-dashboard/styles.css",
  "@tabora/layout-stream/styles.css",
  "@tabora/layout-diy-masonry/styles.css",
  "@tabora/workbench-shell/styles.css",
] as const
```

注：这里先落“清单常量”，不尝试动态 import CSS。

- [ ] **步骤 2：在 `index.ts` 导出 preset**

在 `packages/workbench-shell/src/index.ts` 末尾追加：

```ts
export { workbenchShellStyleModules } from "./stylePreset"
```

- [ ] **步骤 3：同步 playground 和 extension 的样式入口**

把 `apps/playground/src/bootstrap.tsx` 保持为：

```tsx
import { render } from "solid-js/web"
import "./app.css"
import "@tabora/ui/styles.css"
import "@tabora/official-plugins/styles.css"
import "@tabora/layout-dashboard/styles.css"
import "@tabora/layout-stream/styles.css"
import "@tabora/layout-diy-masonry/styles.css"
import "@tabora/workbench-shell/styles.css"
import { App } from "./App"
```

把 `apps/extension/entrypoints/newtab/main.tsx` 对齐为：

```tsx
import { render } from "solid-js/web"
import "@tabora/ui/styles.css"
import "@tabora/official-plugins/styles.css"
import "@tabora/layout-dashboard/styles.css"
import "@tabora/layout-stream/styles.css"
import "@tabora/layout-diy-masonry/styles.css"
import "@tabora/workbench-shell/styles.css"

import { App } from "./App"
```

- [ ] **步骤 4：运行构建验证**

运行：

```bash
pnpm --filter @tabora/playground build
pnpm --filter @tabora/extension build
```

预期：两个 shell 都 PASS；extension 不再因样式缺失出现明显构建差异。

- [ ] **步骤 5：Commit**

```bash
git add packages/workbench-shell/src/stylePreset.ts packages/workbench-shell/src/index.ts apps/playground/src/bootstrap.tsx apps/extension/entrypoints/newtab/main.tsx
git commit -m "refactor(shell): align playground and extension style entry"
```

---

## 任务 5：把 `PluginViewBoundary` 改成真正的 Solid 错误边界

**文件：**

- 修改：`packages/workbench-shell/src/PluginViewBoundary.tsx`
- 修改：`packages/workbench-shell/src/PluginViewBoundary.test.tsx`

- [ ] **步骤 1：先写新的测试期望**

把 `packages/workbench-shell/src/PluginViewBoundary.test.tsx` 改写为覆盖两件事：

```ts
import { ErrorBoundary } from "solid-js"
```

不需要；测试文件保持当前 imports，只改断言：

```ts
it("renders a scoped fallback when a plugin view throws", () => {
  const root = mount(() => {
    throw new Error("boom")
  })

  expect(root.textContent).toContain("Broken Widget")
  expect(root.textContent).toContain("插件视图加载失败")
  expect(root.textContent).toContain("broken-widget")
  expect(root.textContent).toContain("boom")
  expect(root.textContent).not.toContain("location.reload")
})
```

并新增：

```ts
it("renders a retry button without relying on full page reload", () => {
  const root = mount(() => {
    throw new Error("retry-me")
  })

  const button = root.querySelector("button")
  expect(button?.textContent).toBe("重试")
})
```

- [ ] **步骤 2：用 Solid `ErrorBoundary` 重写实现**

把 `packages/workbench-shell/src/PluginViewBoundary.tsx` 改成：

```tsx
import { ErrorBoundary } from "solid-js"
import type { JSX } from "solid-js"

export function createPluginErrorFallback(
  error: unknown,
  instanceId: string,
  title: string,
  reset?: () => void,
): JSX.Element {
  return (
    <div class="plugin-error-fallback" role="alert" data-instance-id={instanceId}>
      <strong>{title}</strong>
      <span>插件视图加载失败</span>
      <small>{instanceId}</small>
      <pre>{error instanceof Error ? error.message : String(error)}</pre>
      <button class="plugin-error-retry-btn" type="button" onClick={() => reset?.()}>
        重试
      </button>
    </div>
  )
}

export function PluginViewBoundary(props: {
  instanceId: string
  title: string
  children: JSX.Element
}) {
  return (
    <ErrorBoundary
      fallback={(error, reset) =>
        createPluginErrorFallback(error, props.instanceId, props.title, reset)
      }
    >
      {props.children}
    </ErrorBoundary>
  )
}
```

- [ ] **步骤 3：运行定向验证**

运行：

```bash
pnpm --filter @tabora/workbench-shell test
```

预期：`PluginViewBoundary.test.tsx` PASS，其余 workbench-shell 测试不回归。

- [ ] **步骤 4：Commit**

```bash
git add packages/workbench-shell/src/PluginViewBoundary.tsx packages/workbench-shell/src/PluginViewBoundary.test.tsx
git commit -m "fix(workbench-shell): use solid error boundary for plugin views"
```

---

## 任务 6：从 `App.tsx` 抽出 host surfaces 最小复用容器

**文件：**

- 创建：`packages/workbench-shell/src/ToastHost.tsx`
- 创建：`packages/workbench-shell/src/ToastHost.test.tsx`
- 修改：`packages/workbench-shell/src/index.ts`
- 修改：`packages/workbench-shell/src/styles.css`
- 修改：`apps/playground/src/App.tsx`

- [ ] **步骤 1：为 `ToastHost` 写失败测试**

创建 `packages/workbench-shell/src/ToastHost.test.tsx`：

```ts
import { render } from "@solidjs/testing-library"
import { describe, expect, it } from "vitest"
import { ToastHost } from "./ToastHost"

describe("ToastHost", () => {
  it("renders toast messages in order", () => {
    const view = render(() => (
      <ToastHost toasts={[{ id: 1, msg: "A" }, { id: 2, msg: "B" }]} />
    ))

    expect(view.getByText("A")).toBeTruthy()
    expect(view.getByText("B")).toBeTruthy()
  })
})
```

- [ ] **步骤 2：实现最小 `ToastHost`**

创建 `packages/workbench-shell/src/ToastHost.tsx`：

```tsx
import { For, Show } from "solid-js"

export type ToastMessage = {
  id: number
  msg: string
}

export function ToastHost(props: { toasts: ToastMessage[] }) {
  return (
    <Show when={props.toasts.length > 0}>
      <div class="toast-stack" aria-live="polite" aria-atomic="true">
        <For each={props.toasts}>{(toast) => <div class="toast-item">{toast.msg}</div>}</For>
      </div>
    </Show>
  )
}
```

- [ ] **步骤 3：导出并接入 playground**

在 `packages/workbench-shell/src/index.ts` 追加：

```ts
export { ToastHost, type ToastMessage } from "./ToastHost"
```

把 `apps/playground/src/App.tsx` 里现有 toast JSX 替换为：

```tsx
<ToastHost toasts={toasts()} />
```

并新增 import：

```ts
import { ToastHost } from "@tabora/workbench-shell"
```

- [ ] **步骤 4：补样式并验证**

在 `packages/workbench-shell/src/styles.css` 里保留当前 `.toast-stack` / `.toast-item` 样式，若样式仍在 `apps/playground/src/app.css`，移动到这里并删除 playground 侧重复定义。

运行：

```bash
pnpm --filter @tabora/workbench-shell test
pnpm --filter @tabora/playground build
```

预期：PASS，且 playground 不再自己维护 toast surface 的 DOM 结构。

- [ ] **步骤 5：Commit**

```bash
git add packages/workbench-shell/src/ToastHost.tsx packages/workbench-shell/src/ToastHost.test.tsx packages/workbench-shell/src/index.ts packages/workbench-shell/src/styles.css apps/playground/src/App.tsx
git commit -m "refactor(workbench-shell): extract toast host surface"
```

---

## 任务 7：把 extension 彻底切到 `workbench-app` + `host-adapters`

**文件：**

- 修改：`apps/extension/entrypoints/newtab/App.tsx`
- 修改：`apps/extension/entrypoints/newtab/main.tsx`
- 视需要创建：`apps/extension/entrypoints/newtab/workbenchComposition.ts`

- [ ] **步骤 1：创建 extension 自己的 composition**

创建 `apps/extension/entrypoints/newtab/workbenchComposition.ts`：

```ts
import { createExtensionHostAdapter } from "@tabora/host-adapters"
import { createWorkbenchComposition, createWorkbenchRuntimeBootstrap } from "@tabora/workbench-app"
import { officialPlugins } from "@tabora/official-plugins"

export function createExtensionWorkbenchComposition() {
  return createWorkbenchComposition({
    host: createExtensionHostAdapter({
      id: "host.extension.newtab",
    }),
  })
}

export function createExtensionRuntimeBootstrap() {
  const composition = createExtensionWorkbenchComposition()
  return createWorkbenchRuntimeBootstrap({
    host: composition.host,
    plugins: officialPlugins,
    databaseName: "tabora-extension",
  })
}
```

- [ ] **步骤 2：让 extension `App.tsx` 停止转发 playground App**

把 `apps/extension/entrypoints/newtab/App.tsx` 改为先复制 playground 当前壳层实现，最少要求是：

- 从 extension 自己的 `workbenchComposition.ts` 拿 runtime。
- 不再 import `@tabora/playground/src/App`。
- 如果需要短期复用 playground 内部 helper，可以只复用纯逻辑文件，不能再复用 `App.tsx`。

最低验收标准不是“完全独立实现”，而是**切断 extension 对 `@tabora/playground/src/App` 的依赖**。

- [ ] **步骤 3：验证源码依赖已切断**

运行：

```bash
rg -n "@tabora/playground/src/App|from \"@tabora/playground/src/App\"" apps/extension
```

预期：0 匹配。

- [ ] **步骤 4：运行构建验证**

运行：

```bash
pnpm --filter @tabora/extension build
```

预期：PASS。

- [ ] **步骤 5：Commit**

```bash
git add apps/extension/entrypoints/newtab/App.tsx apps/extension/entrypoints/newtab/workbenchComposition.ts
git commit -m "refactor(extension): remove dependency on playground app"
```

---

## 任务 8：X1 收尾文档同步与全量验证

**文件：**

- 修改：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 修改：`AGENTS.md`（仅在需要补工程结构说明时）

- [ ] **步骤 1：同步技术方案中的当前状态**

在 `docs/technical/tabora-plugin-workbench-technical-design-v2.md` 中补三点：

- `packages/workbench-app`、`packages/host-adapters` 已成为当前工程结构的一部分。
- playground 已通过 composition/bootstrap 使用这两个包，而不是继续直接在 `App.tsx` 内 new 全套基础设施对象。
- extension 不再直接 import playground `App`。

- [ ] **步骤 2：运行项目级验证**

运行：

```bash
pnpm check
pnpm test
pnpm build
```

预期：

- `check` PASS。
- `test` PASS。
- `build` PASS。

如果已有与本计划无关的存量失败，先记录失败范围，再确认是否由本计划改动引入。不要把“修别人的老问题”混入 X1 收尾。

- [ ] **步骤 3：手动验证关键路径**

运行：

```bash
pnpm dev
```

手动验证：

1. playground 首屏正常渲染。
2. 命令面板可打开。
3. 设置面板可打开。
4. 主题切换可用。
5. 布局切换可用。
6. widget 拖拽、尺寸切换、双击展开、右键菜单仍正常。
7. extension newtab 构建产物可打开且样式不缺失。

- [ ] **步骤 4：Commit**

```bash
git add docs/technical/tabora-plugin-workbench-technical-design-v2.md AGENTS.md
git commit -m "docs: sync phase x1 shell boundary refactor status"
```

---

## 自检结果

- **规格覆盖度：** Phase X1 目标中的 `workbench-app` / `host-adapters` 基础落点、`App.tsx` 收缩、extension 独立 shell、真正的插件错误边界、统一样式入口、宿主 surface 迁移，均有对应任务覆盖。没有把 X2 之后的协议收口、command/keybinding/context menu contribution、experience pack、plugin loader 混入本计划。
- **范围控制：** 本计划明确把 `runtime/bootstrap`、host adapter、extension shell、样式入口、错误边界、toast surface 作为 X1 必做；把 `command` / `keybindings` / `contextMenus` / `experience-pack` / `HostCapabilities` 扩展等保留到后续阶段。
- **当前基线一致性：** 计划以当前分支已存在的 `@tabora/workbench-app`、`@tabora/host-adapters`、`apps/playground/src/workbenchComposition.ts` 为起点，没有重复规划已经开始的动作。
- **占位符扫描：** 唯一刻意保留的“过渡实现”出现在任务 3/7，且已经明确了过渡目标和最终验收标准，不属于未定义 TODO。
