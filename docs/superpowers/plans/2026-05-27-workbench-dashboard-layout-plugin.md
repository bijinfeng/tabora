# Workbench Dashboard Layout Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Tabora 的整体工作台骨架由官方 layout 插件贡献，而不是由 `apps/playground` 写死为顶部搜索和主网格。

**Architecture:** `@tabora/plugin-api` 继续定义 layout contribution 协议；`@tabora/official-plugins` 新增 `official.layout.workbench-dashboard`，声明 `rail`、`topbar`、`mainGrid` 三个区域和默认实例。`apps/playground` 作为宿主读取 workspace 的 `activeLayoutId`，根据 layout contribution 渲染宿主容器和 region slots；layout 插件只声明整体布局语义，不拥有业务内容或宿主私有状态。

**Tech Stack:** Solid、TypeScript、pnpm workspace、Vitest、Vite+、IndexedDB/Dexie。

---

## File Structure

- Modify: `packages/plugin-api/src/manifest.ts`
  - Add an optional `view` field to `LayoutContribution` so a layout plugin can register a layout view explicitly.
- Modify: `packages/plugin-api/src/manifestSchema.ts`
  - Validate optional layout `view`.
- Modify: `packages/plugin-api/src/manifestSchema.test.ts`
  - Cover a dashboard layout contribution with `rail`, `topbar`, `mainGrid`, and `view`.
- Create: `packages/official-plugins/src/layout-workbench-dashboard.tsx`
  - Export `WorkbenchDashboardLayout` and `officialLayoutWorkbenchDashboard`.
- Modify: `packages/official-plugins/src/index.ts`
  - Export and load `officialLayoutWorkbenchDashboard`; keep `officialLayoutTopSearchGrid` only if needed as a legacy layout.
- Modify: `apps/playground/src/App.tsx`
  - Use `official.layout.workbench-dashboard` as default layout.
  - Load instances by layout regions instead of assuming `mainGrid` only.
  - Render `rail`, `topbar`, and `mainGrid` slots through the active layout contribution.
  - Move add-widget, plugins, and settings actions into rail entry points.
- Modify: `apps/playground/src/app.css`
  - Add shell, rail, content, topbar, and grid styles matching the design system.
- Modify: `docs/product/tabora-official-plugins-design.md`
  - Mark the workbench dashboard layout as the next implementation target and clarify that the whole layout is a plugin contribution.
- Modify: `docs/technical/tabora-plugin-workbench-technical-design.md`
  - Clarify host/layout split after implementation.
- Test: `packages/plugin-api/src/manifestSchema.test.ts`
- Test: `apps/playground/src/workbenchGrid.test.tsx`

---

### Task 1: Extend Layout Contribution Contract

**Files:**

- Modify: `packages/plugin-api/src/manifest.ts`
- Modify: `packages/plugin-api/src/manifestSchema.ts`
- Test: `packages/plugin-api/src/manifestSchema.test.ts`

- [x] **Step 1: Write the failing schema test**

Add this test to `packages/plugin-api/src/manifestSchema.test.ts`:

```ts
it("accepts a dashboard layout contribution with a registered view", () => {
  const result = pluginManifestSchema.safeParse({
    id: "official.layout.workbench-dashboard",
    name: "Workbench Dashboard Layout",
    version: "0.0.0",
    entry: "./layout-workbench-dashboard",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.workbench-dashboard",
          title: "工作台仪表盘布局",
          view: "official.layout.workbench-dashboard.view",
          regions: [
            {
              id: "rail",
              title: "工作台导航",
              accepts: ["layout"],
              required: true,
              maxInstances: 1,
            },
            {
              id: "topbar",
              title: "顶部搜索区",
              accepts: ["search"],
              required: true,
              maxInstances: 1,
            },
            {
              id: "mainGrid",
              title: "主网格",
              accepts: ["widget"],
              required: true,
            },
          ],
          defaultRegions: {
            rail: [],
            topbar: [{ instanceId: "search-main" }],
            mainGrid: [
              { instanceId: "today-focus-1" },
              { instanceId: "quick-links-1" },
              { instanceId: "notes-1" },
              { instanceId: "todo-1" },
            ],
          },
          supportsResponsive: true,
        },
      ],
    },
  })

  expect(result.success).toBe(true)
})
```

- [x] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @tabora/plugin-api test -- manifestSchema
```

Expected: fail because `view` is not accepted on layout contributions.

- [x] **Step 3: Add `view` to the TypeScript contract**

Update `packages/plugin-api/src/manifest.ts`:

```ts
export type LayoutContribution = {
  id: string
  title: string
  preview?: string
  view?: string
  regions: LayoutRegion[]
  defaultRegions: Record<string, PluginInstanceRef[]>
  supportsResponsive: boolean
}
```

- [x] **Step 4: Add `view` to the Zod schema**

Update the layout schema object in `packages/plugin-api/src/manifestSchema.ts`:

```ts
z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  preview: z.string().optional(),
  view: z.string().min(1).optional(),
  regions: z.array(layoutRegionSchema).min(1),
  defaultRegions: z.record(z.string(), z.array(instanceRefSchema)),
  supportsResponsive: z.boolean(),
})
```

- [x] **Step 5: Re-run the focused test and verify it passes**

Run:

```bash
pnpm --filter @tabora/plugin-api test -- manifestSchema
```

Expected: pass.

---

### Task 2: Add Official Workbench Dashboard Layout Plugin

**Files:**

- Create: `packages/official-plugins/src/layout-workbench-dashboard.tsx`
- Modify: `packages/official-plugins/src/index.ts`

- [x] **Step 1: Create the dashboard layout plugin file**

Create `packages/official-plugins/src/layout-workbench-dashboard.tsx`:

```tsx
import type { JSX } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export type WorkbenchDashboardLayoutProps = {
  rail: JSX.Element
  topbar: JSX.Element
  mainGrid: JSX.Element
}

export function WorkbenchDashboardLayout(props: WorkbenchDashboardLayoutProps) {
  return (
    <main class="workbench-shell" data-layout="workbench-dashboard">
      <aside class="workbench-rail-region">{props.rail}</aside>
      <section class="workbench-content-region">
        <header class="workbench-topbar-region">{props.topbar}</header>
        <section class="workbench-main-grid-region">{props.mainGrid}</section>
      </section>
    </main>
  )
}

export const officialLayoutWorkbenchDashboard: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.workbench-dashboard",
    name: "Workbench Dashboard Layout",
    version: "0.0.0",
    entry: "./layout-workbench-dashboard",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.workbench-dashboard",
          title: "工作台仪表盘布局",
          view: "official.layout.workbench-dashboard.view",
          regions: [
            {
              id: "rail",
              title: "工作台导航",
              accepts: ["layout"],
              required: true,
              maxInstances: 1,
            },
            {
              id: "topbar",
              title: "顶部搜索区",
              accepts: ["search"],
              required: true,
              maxInstances: 1,
            },
            {
              id: "mainGrid",
              title: "主网格",
              accepts: ["widget"],
              required: true,
            },
          ],
          defaultRegions: {
            rail: [],
            topbar: [{ instanceId: "search-main" }],
            mainGrid: [
              { instanceId: "today-focus-1" },
              { instanceId: "quick-links-1" },
              { instanceId: "notes-1" },
              { instanceId: "todo-1" },
            ],
          },
          supportsResponsive: true,
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register(
      "official.layout.workbench-dashboard.view",
      WorkbenchDashboardLayout,
    )
  },
}
```

- [x] **Step 2: Register the plugin in the official plugin pack**

Update `packages/official-plugins/src/index.ts`:

```ts
export { officialLayoutWorkbenchDashboard } from "./layout-workbench-dashboard"
export { officialLayoutTopSearchGrid } from "./layout-top-search-grid"

import { officialLayoutWorkbenchDashboard } from "./layout-workbench-dashboard"
import { officialLayoutTopSearchGrid } from "./layout-top-search-grid"
```

Then place `officialLayoutWorkbenchDashboard` before `officialLayoutTopSearchGrid` in `officialPlugins`:

```ts
export const officialPlugins = [
  officialThemeDefaultPack,
  officialBackgroundBasic,
  officialLayoutWorkbenchDashboard,
  officialLayoutTopSearchGrid,
  officialSearchCommandBar,
  officialSearchProvidersBasic,
  officialWidgetsProductivity,
  officialPluginManager,
]
```

- [x] **Step 3: Run package type checks through the workspace check**

Run:

```bash
pnpm check
```

Expected: pass or fail only on downstream usage still assuming the old layout. If downstream usage fails, continue to Task 3 before making a success claim.

---

### Task 3: Make Playground Consume The Active Layout Contribution

**Files:**

- Modify: `apps/playground/src/App.tsx`

- [x] **Step 1: Add layout contribution helpers**

Add these helpers near `findWidgetContribution` in `apps/playground/src/App.tsx`:

```ts
function findLayoutContribution(layoutId: string) {
  for (const plugin of officialPlugins) {
    const layout = plugin.manifest.contributes.layouts?.find((item) => item.id === layoutId)
    if (layout) return layout
  }
  return null
}

function findSearchContribution(pluginId: string, contributionId: string) {
  const plugin = officialPlugins.find((p) => p.manifest.id === pluginId)
  return plugin?.manifest.contributes.searches?.find((search) => search.id === contributionId)
}
```

- [x] **Step 2: Update default workspace layout and regions**

Replace `defaultWorkspace()` with:

```ts
function defaultWorkspace(): Workspace {
  return {
    id: "default",
    name: "默认工作区",
    activeLayoutId: "official.layout.workbench-dashboard",
    activeThemeId: "official.theme.light",
    regions: {
      rail: {
        regionId: "rail",
        accepts: ["layout"],
        instances: [],
      },
      topbar: {
        regionId: "topbar",
        accepts: ["search"],
        instances: [{ instanceId: "search-main" }],
      },
      mainGrid: {
        regionId: "mainGrid",
        accepts: ["widget"],
        instances: [
          { instanceId: "today-focus-1" },
          { instanceId: "quick-links-1" },
          { instanceId: "notes-1" },
          { instanceId: "todo-1" },
        ],
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
```

- [x] **Step 3: Keep default instance loading scoped to mainGrid for this slice**

For this task, continue loading widget instances with:

```ts
let loaded = await instanceRepo.getByRegion("mainGrid")
```

This keeps the slice small. A later task can load all regions from `workspace.regions` once search instances are persisted and rendered by instance ID.

- [x] **Step 4: Render through the layout plugin view**

In the JSX, replace the current topbar/grid/add-widget structure with a local layout render block:

```tsx
{
  ;(() => {
    const layout = findLayoutContribution("official.layout.workbench-dashboard")
    const LayoutView = layout?.view
      ? (kernel.registry.views.get(layout.view) as SolidView | undefined)
      : undefined

    const rail = (
      <nav class="workbench-rail" aria-label="工作台导航">
        <button class="rail-action active" type="button" aria-label="主页">
          主页
        </button>
        <button class="rail-action" type="button" aria-label="添加卡片">
          添加
        </button>
        <button class="rail-action" type="button" aria-label="插件">
          插件
        </button>
        <button class="rail-action" type="button" aria-label="设置">
          设置
        </button>
      </nav>
    )

    const topbar = <div class="topbar">{SearchView()({})}</div>

    const mainGrid = (
      <>
        <section class="workbench-grid">
          {/* keep the existing <For each={instances()}> widget rendering block here */}
        </section>
        <section class="add-widgets">{/* keep the existing add widget bar here */}</section>
      </>
    )

    return LayoutView ? LayoutView({ rail, topbar, mainGrid }) : mainGrid
  })()
}
```

Move the existing widget `<For each={instances()}>` block into the `workbench-grid` section and the existing add widget bar into the `add-widgets` section.

- [x] **Step 5: Run playground build**

Run:

```bash
pnpm --filter @tabora/playground build
```

Expected: pass.

---

### Task 4: Add Today Focus Widget To Complete The Default Core Set

**Files:**

- Modify: `packages/official-plugins/src/widgets-productivity.tsx`
- Modify: `apps/playground/src/App.tsx`

- [x] **Step 1: Add the widget component**

Add this component to `packages/official-plugins/src/widgets-productivity.tsx`:

```tsx
export function TodayFocusCard() {
  const [focus, setFocus] = createSignal("")
  const [done, setDone] = createSignal(false)

  onMount(() => {
    const saved = localStorage.getItem("today-focus-content")
    const savedDone = localStorage.getItem("today-focus-done")
    if (saved) setFocus(saved)
    setDone(savedDone === "true")
  })

  function updateFocus(value: string) {
    setFocus(value)
    localStorage.setItem("today-focus-content", value)
  }

  function updateDone(value: boolean) {
    setDone(value)
    localStorage.setItem("today-focus-done", String(value))
  }

  return (
    <div class="today-focus-widget">
      <label class="today-focus-label">
        <span>今天最重要的一件事</span>
        <input
          class="today-focus-input"
          value={focus()}
          onInput={(e) => updateFocus(e.currentTarget.value)}
          placeholder="写下今日重点"
        />
      </label>
      <label class="today-focus-done">
        <input
          type="checkbox"
          checked={done()}
          onChange={(e) => updateDone(e.currentTarget.checked)}
        />
        <span>{done() ? "已完成" : "尚未完成"}</span>
      </label>
    </div>
  )
}
```

- [x] **Step 2: Add the widget contribution**

Add this contribution before `quick-links`:

```ts
{
  id: "today-focus",
  title: "今日重点",
  supportedSizes: ["S", "M", "L"],
  defaultSize: "M",
  allowMultipleInstances: true,
  views: { card: "official.widgets.today-focus.card" },
},
```

- [x] **Step 3: Register the view**

Add to `activate(context)`:

```ts
context.registry.views.register("official.widgets.today-focus.card", TodayFocusCard)
```

- [x] **Step 4: Add the default instance**

Add this item to `defaultInstances()` in `apps/playground/src/App.tsx` before `quick-links-1`:

```ts
{
  id: "today-focus-1",
  pluginId: "official.widgets.productivity",
  contributionId: "today-focus",
  extensionPoint: "widget",
  regionId: "mainGrid",
  enabled: true,
  size: "M",
  config: {},
  createdAt: now,
  updatedAt: now,
},
```

- [x] **Step 5: Run test and playground build**

Run:

```bash
pnpm test
pnpm --filter @tabora/playground build
```

Expected: pass.

---

### Task 5: Style The Host Shell And Rail

**Files:**

- Modify: `apps/playground/src/app.css`

- [x] **Step 1: Add shell styles**

Add these styles near the existing layout styles:

```css
.workbench-shell {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  min-height: calc(100vh - 80px);
  max-width: 1200px;
  margin: 0 auto;
  gap: 20px;
}

.workbench-rail-region {
  min-width: 0;
}

.workbench-content-region {
  min-width: 0;
}

.workbench-rail {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 8px;
  border: 1px solid rgb(var(--color-line));
  border-radius: 12px;
  background: rgba(var(--color-surface), 0.82);
}

.rail-action {
  min-height: 40px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: rgb(var(--color-muted));
  font-size: 12px;
  cursor: pointer;
}

.rail-action:hover,
.rail-action:focus-visible {
  border-color: rgb(var(--color-line));
  background: rgba(var(--color-accent), 0.08);
  color: rgb(var(--color-text));
  outline: none;
}

.rail-action.active {
  border-color: rgb(var(--color-accent));
  background: rgba(var(--color-accent), 0.12);
  color: rgb(var(--color-accent));
}
```

- [x] **Step 2: Adjust topbar/grid centering inside the layout**

Update `.toolbar`, `.topbar`, `.workbench-grid`, and `.add-widgets` max-width usage so they no longer fight the layout shell:

```css
.toolbar {
  display: flex;
  justify-content: flex-end;
  max-width: 1200px;
  margin: 0 auto 12px;
}

.topbar {
  display: flex;
  justify-content: stretch;
  margin-bottom: 20px;
}

.search-wrapper {
  width: 100%;
  max-width: none;
}

.search-bar {
  width: 100%;
}

.workbench-grid {
  max-width: none;
  margin: 0;
}

.add-widgets {
  max-width: none;
  margin: 24px 0 0;
}
```

- [x] **Step 3: Add mobile rail fallback**

Add inside the existing `@media (max-width: 760px)` block:

```css
.workbench-shell {
  grid-template-columns: 1fr;
  min-height: auto;
}

.workbench-rail {
  position: static;
  flex-direction: row;
  overflow-x: auto;
}

.rail-action {
  flex: 1 0 auto;
}
```

- [x] **Step 4: Run full check**

Run:

```bash
pnpm check
```

Expected: pass.

---

### Task 6: Update Product And Technical Facts

**Files:**

- Modify: `docs/product/tabora-official-plugins-design.md`
- Modify: `docs/technical/tabora-plugin-workbench-technical-design.md`

- [x] **Step 1: Update official plugin implementation status**

In `docs/product/tabora-official-plugins-design.md`, update the implementation gap row for default layout from:

```md
| 默认布局 | 当前仍为顶部搜索 + 主网格 | 演进为轻 rail + 命令搜索 + 主网格 |
```

to:

```md
| 默认布局 | 已开始由 `official.layout.workbench-dashboard` 插件贡献整体布局，宿主按 layout contribution 渲染 rail / topbar / mainGrid | 继续补齐 settings host、动态 region 装配和更完整响应式 |
```

- [x] **Step 2: Update technical design host/layout split**

In `docs/technical/tabora-plugin-workbench-technical-design.md`, update the current implementation note under default workbench assembly to state:

```md
当前实现已从 `official.layout.top-search-grid` 演进到 `official.layout.workbench-dashboard` 竖切：整体布局由 layout contribution 声明，宿主读取 `activeLayoutId` 后渲染 rail、topbar 和 mainGrid 的宿主容器。宿主仍负责真实 DOM 容器、焦点、滚动、错误边界、实例增删改和持久化；layout 插件只贡献区域结构和默认装配语义。
```

- [x] **Step 3: Run document validation**

Run:

```bash
pnpm check
```

Expected: pass.

---

### Task 7: Fresh Verification

**Files:**

- No source edits unless verification finds a bug.

- [x] **Step 1: Run unit tests**

Run:

```bash
pnpm test
```

Expected: pass.

- [x] **Step 2: Run static checks**

Run:

```bash
pnpm check
```

Expected: pass.

- [x] **Step 3: Run production build**

Run:

```bash
pnpm build
```

Expected: pass.

- [x] **Step 4: Start playground for browser verification**

Run:

```bash
pnpm --filter @tabora/playground exec vite --host 127.0.0.1 --port 5173 --strictPort
```

Expected: dev server starts at `http://127.0.0.1:5173`.

Note: 2026-05-28 已补充 `apps/playground/src/workbenchDashboard.e2e.test.tsx`，由
Vitest 启动 Vite server 和本机 headless Chrome，对同等浏览器关键路径做自动化验证。

- [x] **Step 5: Browser-check key paths**

Open `http://127.0.0.1:5173` and verify:

- Default page shows a left rail, top command search, and main grid.
- Main grid includes 今日重点、快捷入口、便签、待办 by default on a fresh database.
- Adding widgets still appends cards to the grid.
- Size selector still only shows supported sizes.
- Drag ordering still works.
- No horizontal scrolling appears at desktop width or mobile width.
- Modal expansion for notes still works.

---

## Self-Review Notes

- Spec coverage: this plan covers the user correction that the whole layout must be a plugin and keeps the host responsible for generic rendering mechanisms.
- Placeholder scan: no placeholder tasks remain; each code-changing step contains concrete code or exact edit text.
- Type consistency: layout `view` is added to both TypeScript and Zod contracts before official plugin usage.
- Known follow-up: this plan intentionally keeps search provider dynamism, `@tabora/ui`, settings host, and instance-scoped plugin data for later plans so the layout plugin slice stays small and verifiable.
