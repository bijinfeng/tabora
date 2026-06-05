# 布局插件化契约重构 实现计划

> **归档状态：** 本计划已不在默认实施路径中。仅在用户明确要求继续或审查该计划时使用；当前事实源以 `docs/README.md` 登记的 PRD、设计、技术方案 V2 和回归基准为准。

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 把布局从 shell 硬编码分发改为协议驱动，让布局成为真正的第三方可实现插件，并用两个官方布局（独立 package）+ 一个第三方 DIY 布局验证架构。

**架构：** 在 `plugin-api` 落地 `LayoutViewProps`/`RegionSlot`/`LayoutHostAPI` 契约与最小强制 schema；在 `orchestrator` 用 `createLayoutEngine` 产出 `RegionSlot` 并构造 `LayoutHostAPI`（卡片壳经 `InstanceRenderer` 注入，不反向依赖 shell）；在 `workbench-shell` 抽出 `WidgetCardShell`/`LayoutBoundary`/浮层容器；把官方两个布局拆成独立 package（`plugins/layout-dashboard`、`plugins/layout-stream`），新增 `plugins/layout-diy-masonry`；重写 `App.tsx` 的 `renderActiveLayout` 为通用 region 遍历 + 安全布局 fallback。

**技术栈：** pnpm workspace、Solid、TypeScript（ESM、双引号、无分号）、Tailwind v4、Vitest + happy-dom、Zod、tsdown。

**关联设计：** `docs/superpowers/specs/2026-06-02-layout-plugin-contract-design.md`

---

## 文件结构

**契约层（plugin-api，纯类型）**

- 创建 `packages/plugin-api/src/layout.ts`：`LayoutViewProps`、`RegionSlot`、`LayoutHostAPI`、`HostSurface`、`HostActionItem`。
- 修改 `packages/plugin-api/src/index.ts`：导出 `./layout`。
- 修改 `packages/plugin-api/src/manifestSchema.ts`：layout schema 增加最小强制规则（含 widget region、view 必填）。
- 修改 `packages/plugin-api/src/manifestSchema.test.ts`：新增最小强制规则用例。

**引擎层（orchestrator）**

- 创建 `packages/orchestrator/src/layout-engine.tsx`：`createLayoutEngine`、`InstanceRenderer`、`HostActionsSource`、`LayoutEngineDeps`。
- 创建 `packages/orchestrator/src/layout-engine.test.ts`：引擎单元测试。
- 修改 `packages/orchestrator/src/index.ts`：导出 `createLayoutEngine` 及相关类型；移除 `createRegionRenderer` 导出。
- 删除 `packages/orchestrator/src/region-renderer.tsx`（被 layout-engine 取代）。

**宿主容器（workbench-shell）**

- 创建 `packages/workbench-shell/src/WidgetCardShell.tsx`：`WidgetCardShell`、`WidgetHostCallbacks`。
- 创建 `packages/workbench-shell/src/WidgetCardShell.test.tsx`。
- 创建 `packages/workbench-shell/src/LayoutBoundary.tsx`：`LayoutBoundary`。
- 创建 `packages/workbench-shell/src/LayoutBoundary.test.tsx`。
- 修改 `packages/workbench-shell/src/index.ts`：导出新组件。
- 修改 `packages/workbench-shell/src/styles.css`：迁入 widget-card 样式。

**布局 package（plugins/）**

- 创建 `plugins/layout-dashboard/`（package.json、tsconfig.json、src/index.tsx、src/styles.css、src/index.test.tsx）。
- 创建 `plugins/layout-stream/`（同结构）。
- 创建 `plugins/layout-diy-masonry/`（同结构，第三方验证）。

**装配（official-plugins + playground）**

- 修改 `packages/official-plugins/package.json`：加三个布局 workspace 依赖。
- 修改 `packages/official-plugins/src/index.ts`：import 三个布局 package，删除内联布局引用。
- 删除 `packages/official-plugins/src/layout-workbench-dashboard.tsx`、`layout-workbench-stream.tsx`。
- 修改 `apps/playground/src/App.tsx`：`renderActiveLayout` 通用化 + `renderSafeLayout` + InstanceRenderer 实现。

---

## 任务 1：契约类型（plugin-api/layout.ts）

**文件：**

- 创建：`packages/plugin-api/src/layout.ts`
- 修改：`packages/plugin-api/src/index.ts`

- [ ] **步骤 1：创建契约类型文件**

创建 `packages/plugin-api/src/layout.ts`：

```ts
import type { JSX } from "solid-js"
import type { ExtensionPoint } from "./manifest"
import type { PluginInstance } from "./workspace"

export type RegionSlot = {
  regionId: string
  title: string
  accepts: ExtensionPoint[]
  instances: PluginInstance[]
  isEmpty: boolean
  render: () => JSX.Element
  renderInstance: (instance: PluginInstance) => JSX.Element
}

export type HostSurface = "rail" | "toolbar" | "menu"

export type HostActionId = "home" | "add-widget" | "plugins" | "settings" | "theme" | "command"

export type HostActionItem = {
  id: HostActionId
  label: string
  icon: string
  shortcut?: string
  isActive?: boolean
  run: () => void
}

export type LayoutHostAPI = {
  getGlobalActions: (surface: HostSurface) => HostActionItem[]
  openSettings: (panelId?: string) => void
  openCommandPalette: () => void
  openAddWidget: () => void
  toggleTheme: () => void
  isDark: () => boolean
}

export type LayoutViewProps = {
  regions: Record<string, RegionSlot>
  isMobile: boolean
  host: LayoutHostAPI
}
```

- [ ] **步骤 2：导出新模块**

修改 `packages/plugin-api/src/index.ts`，在末尾追加一行：

```ts
export * from "./layout"
```

完整文件应为：

```ts
export * from "./manifest"
export * from "./manifestSchema"
export * from "./security"
export * from "./workspace"
export * from "./layout"
```

- [ ] **步骤 3：类型检查**

运行：`pnpm --filter @tabora/plugin-api exec tsc --noEmit -p tsconfig.json`
预期：无错误（`solid-js` 已是 plugin-api 的可用类型依赖；若 tsc 报找不到 solid-js，确认 `packages/plugin-api/package.json` 的 devDependencies 含 `solid-js`，没有则在步骤 5 前补上 `"solid-js": "catalog:ui"`）。

- [ ] **步骤 4：Commit**

```bash
git add packages/plugin-api/src/layout.ts packages/plugin-api/src/index.ts
git commit -m "feat(plugin-api): 新增布局插件契约类型"
```

---

## 任务 2：最小强制 schema（manifestSchema）

**文件：**

- 修改：`packages/plugin-api/src/manifestSchema.ts:59-71`
- 测试：`packages/plugin-api/src/manifestSchema.test.ts`

- [ ] **步骤 1：编写失败的测试**

在 `packages/plugin-api/src/manifestSchema.test.ts` 末尾追加（先确认文件顶部已 `import { pluginManifestSchema } from "./manifestSchema"`，若导出名不同则对齐）：

```ts
describe("layout 最小强制规则", () => {
  const baseLayout = {
    id: "x.layout",
    title: "X",
    view: "x.layout.view",
    regions: [{ id: "grid", title: "网格", accepts: ["widget"], required: true }],
    defaultRegions: { grid: [] },
    supportsResponsive: true,
  }

  function manifestWith(layout: unknown) {
    return {
      id: "x",
      name: "X",
      version: "1.0.0",
      entry: "./x",
      engine: { platform: "^0.1.0" },
      contributes: { layouts: [layout] },
    }
  }

  it("合格：含 widget region + view", () => {
    expect(pluginManifestSchema.safeParse(manifestWith(baseLayout)).success).toBe(true)
  })

  it("不合格：无 widget region", () => {
    const layout = {
      ...baseLayout,
      regions: [{ id: "side", title: "侧栏", accepts: ["search"], required: false }],
    }
    expect(pluginManifestSchema.safeParse(manifestWith(layout)).success).toBe(false)
  })

  it("不合格：缺 view 字段", () => {
    const { view: _view, ...noView } = baseLayout
    expect(pluginManifestSchema.safeParse(manifestWith(noView)).success).toBe(false)
  })

  it("合格：缺 search/settings region 仍通过", () => {
    expect(pluginManifestSchema.safeParse(manifestWith(baseLayout)).success).toBe(true)
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --filter @tabora/plugin-api exec vitest run src/manifestSchema.test.ts`
预期：FAIL——"不合格：无 widget region" 和 "不合格：缺 view 字段" 失败（当前 schema `view` 可选、且不校验 widget region）。

- [ ] **步骤 3：修改 schema 加最小强制规则**

修改 `packages/plugin-api/src/manifestSchema.ts`，把 `contributes.layouts` 的内层 object（第 60-69 行）替换为带 `view` 必填 + `.refine` 的版本：

```ts
    layouts: z
      .array(
        z
          .object({
            id: z.string().min(1),
            title: z.string().min(1),
            preview: z.string().optional(),
            view: z.string().min(1),
            regions: z.array(layoutRegionSchema).min(1),
            defaultRegions: z.record(z.string(), z.array(instanceRefSchema)),
            supportsResponsive: z.boolean(),
          })
          .refine((layout) => layout.regions.some((region) => region.accepts.includes("widget")), {
            message: "layout must declare at least one region accepting widget",
            path: ["regions"],
          }),
      )
      .optional(),
```

注意：`view` 从 `z.string().min(1).optional()` 改为 `z.string().min(1)`（必填）。

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm --filter @tabora/plugin-api exec vitest run src/manifestSchema.test.ts`
预期：PASS（全部用例通过）。

- [ ] **步骤 5：Commit**

```bash
git add packages/plugin-api/src/manifestSchema.ts packages/plugin-api/src/manifestSchema.test.ts
git commit -m "feat(plugin-api): layout schema 增加最小强制规则"
```

---

## 任务 3：布局引擎（orchestrator/layout-engine.tsx）

**文件：**

- 创建：`packages/orchestrator/src/layout-engine.tsx`
- 测试：`packages/orchestrator/src/layout-engine.test.ts`

- [ ] **步骤 1：编写失败的测试**

创建 `packages/orchestrator/src/layout-engine.test.ts`：

```ts
import { describe, expect, it, vi } from "vitest"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { PluginInstance } from "@tabora/plugin-api"
import { createLayoutEngine, type InstanceRenderer } from "./layout-engine"

const layoutPlugin: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "test.layout",
    name: "Test Layout",
    version: "1.0.0",
    entry: "./test",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "test.layout",
          title: "Test",
          view: "test.layout.view",
          regions: [
            { id: "grid", title: "网格", accepts: ["widget"], required: true },
            { id: "top", title: "顶部", accepts: ["search"], required: false },
          ],
          defaultRegions: { grid: [], top: [] },
          supportsResponsive: true,
        },
      ],
    },
  },
  activate() {},
}

function instance(
  id: string,
  regionId: string,
  ep: PluginInstance["extensionPoint"],
): PluginInstance {
  return {
    id,
    workspaceId: "ws",
    pluginId: "p",
    contributionId: "c",
    extensionPoint: ep,
    regionId,
    enabled: true,
    config: {},
    grid: { x: 0, y: 0, colSpan: 1, rowSpan: 1 },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

function makeRenderer(calls: string[]): InstanceRenderer {
  return {
    renderWidget: (inst) => {
      calls.push(`widget:${inst.id}`)
      return null
    },
    renderSearch: (inst) => {
      calls.push(`search:${inst.id}`)
      return null
    },
  }
}

function makeEngine(instances: PluginInstance[], calls: string[]) {
  return createLayoutEngine({
    catalog: {
      findLayoutContribution: (id) =>
        layoutPlugin.manifest.contributes.layouts!.find((l) => l.id === id),
    } as never,
    instanceRenderer: makeRenderer(calls),
    hostActions: {
      getGlobalActions: () => [
        { id: "settings", label: "设置", icon: "settings", run: vi.fn() },
        { id: "command", label: "搜索", icon: "search", run: vi.fn() },
      ],
      openSettings: vi.fn(),
      openCommandPalette: vi.fn(),
      openAddWidget: vi.fn(),
      toggleTheme: vi.fn(),
      isDark: () => false,
    },
  })
}

describe("createLayoutEngine.buildRegionSlots", () => {
  it("按 region 映射实例，isEmpty 准确，跨 region 不串", () => {
    const calls: string[] = []
    const insts = [instance("w1", "grid", "widget"), instance("s1", "top", "search")]
    const slots = makeEngine(insts, calls).buildRegionSlots("test.layout", insts)
    expect(slots.grid.instances.map((i) => i.id)).toEqual(["w1"])
    expect(slots.top.instances.map((i) => i.id)).toEqual(["s1"])
    expect(slots.grid.isEmpty).toBe(false)
    expect(slots.grid.accepts).toEqual(["widget"])
  })

  it("render() 对每个实例调一次对应 renderer", () => {
    const calls: string[] = []
    const insts = [instance("w1", "grid", "widget"), instance("w2", "grid", "widget")]
    const slots = makeEngine(insts, calls).buildRegionSlots("test.layout", insts)
    slots.grid.render()
    expect(calls).toEqual(["widget:w1", "widget:w2"])
  })

  it("renderInstance 只渲染单个实例", () => {
    const calls: string[] = []
    const insts = [instance("w1", "grid", "widget"), instance("w2", "grid", "widget")]
    const slots = makeEngine(insts, calls).buildRegionSlots("test.layout", insts)
    slots.grid.renderInstance(insts[1]!)
    expect(calls).toEqual(["widget:w2"])
  })

  it("空 region isEmpty 为 true", () => {
    const calls: string[] = []
    const slots = makeEngine([], calls).buildRegionSlots("test.layout", [])
    expect(slots.grid.isEmpty).toBe(true)
  })
})

describe("createLayoutEngine.buildHostAPI", () => {
  it("getGlobalActions 返回含 settings/command 的完整集，与布局无关", () => {
    const calls: string[] = []
    const host = makeEngine([], calls).buildHostAPI()
    const ids = host.getGlobalActions("rail").map((a) => a.id)
    expect(ids).toContain("settings")
    expect(ids).toContain("command")
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --filter @tabora/orchestrator exec vitest run src/layout-engine.test.ts`
预期：FAIL，报错找不到 `./layout-engine` 模块。

- [ ] **步骤 3：实现 layout-engine**

创建 `packages/orchestrator/src/layout-engine.tsx`：

```tsx
import { For } from "solid-js"
import type { JSX } from "solid-js"
import type { LayoutHostAPI, PluginInstance, RegionSlot } from "@tabora/plugin-api"
import type { PluginCatalog } from "./plugin-catalog"

export type InstanceRenderer = {
  renderWidget: (instance: PluginInstance, callbacks?: unknown) => JSX.Element
  renderSearch: (instance: PluginInstance) => JSX.Element
  renderSettings?: (instance: PluginInstance) => JSX.Element
}

export type HostActionsSource = LayoutHostAPI

export type LayoutEngineDeps = {
  catalog: Pick<PluginCatalog, "findLayoutContribution">
  instanceRenderer: InstanceRenderer
  hostActions: HostActionsSource
}

function byGrid(a: PluginInstance, b: PluginInstance): number {
  return (a.grid?.y ?? 0) - (b.grid?.y ?? 0) || (a.grid?.x ?? 0) - (b.grid?.x ?? 0)
}

export function createLayoutEngine(deps: LayoutEngineDeps) {
  function renderOne(instance: PluginInstance): JSX.Element {
    if (instance.extensionPoint === "search") {
      return deps.instanceRenderer.renderSearch(instance)
    }
    if (instance.extensionPoint === "settings-panel" && deps.instanceRenderer.renderSettings) {
      return deps.instanceRenderer.renderSettings(instance)
    }
    return deps.instanceRenderer.renderWidget(instance)
  }

  function buildRegionSlots(
    layoutId: string,
    instances: PluginInstance[],
  ): Record<string, RegionSlot> {
    const layout = deps.catalog.findLayoutContribution(layoutId)
    const slots: Record<string, RegionSlot> = {}
    for (const region of layout?.regions ?? []) {
      const regionInstances = instances
        .filter((inst) => inst.regionId === region.id && inst.enabled !== false)
        .sort(byGrid)
      slots[region.id] = {
        regionId: region.id,
        title: region.title,
        accepts: region.accepts,
        instances: regionInstances,
        isEmpty: regionInstances.length === 0,
        render: () => <For each={regionInstances}>{(inst) => renderOne(inst)}</For>,
        renderInstance: (inst) => renderOne(inst),
      }
    }
    return slots
  }

  function buildHostAPI(): LayoutHostAPI {
    return deps.hostActions
  }

  return { buildRegionSlots, buildHostAPI }
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm --filter @tabora/orchestrator exec vitest run src/layout-engine.test.ts`
预期：PASS（全部用例通过）。

- [ ] **步骤 5：Commit**

```bash
git add packages/orchestrator/src/layout-engine.tsx packages/orchestrator/src/layout-engine.test.ts
git commit -m "feat(orchestrator): 新增 createLayoutEngine 产出 RegionSlot"
```

---

## 任务 4：orchestrator 导出切换 + 删除旧 region-renderer

**文件：**

- 修改：`packages/orchestrator/src/index.ts`
- 删除：`packages/orchestrator/src/region-renderer.tsx`

- [ ] **步骤 1：确认旧 region-renderer 无人使用**

运行：`rg "createRegionRenderer|region-renderer" --type ts --type tsx -l`
预期：仅 `packages/orchestrator/src/index.ts` 引用（App.tsx 当前未用它）。若有其他引用，先记录，本任务结束前一并切换；正常情况下应只有 index.ts。

- [ ] **步骤 2：修改 index.ts 导出**

把 `packages/orchestrator/src/index.ts` 改为：

```ts
export { createPluginCatalog } from "./plugin-catalog"
export type {
  PluginCatalog,
  PluginCatalogOptions,
  SettingsPanelDescriptor,
  WidgetContributionDescriptor,
} from "./plugin-catalog"
export { createLayoutEngine } from "./layout-engine"
export type { InstanceRenderer, HostActionsSource, LayoutEngineDeps } from "./layout-engine"
export {
  buildSearchUrl,
  findProviderByToken,
  matchProvidersByToken,
  resolveDefaultProvider,
  routeSearchQuery,
  type SearchRoute,
} from "./search-model"
```

- [ ] **步骤 3：删除旧文件**

```bash
git rm packages/orchestrator/src/region-renderer.tsx
```

- [ ] **步骤 4：类型检查 + 全包测试**

运行：`pnpm --filter @tabora/orchestrator exec vitest run`
预期：PASS（plugin-catalog 与 layout-engine 测试通过，无对已删文件的引用）。

- [ ] **步骤 5：Commit**

```bash
git add packages/orchestrator/src/index.ts
git commit -m "refactor(orchestrator): 用 layout-engine 取代 region-renderer"
```

---

## 任务 5：WidgetCardShell（workbench-shell）

**文件：**

- 创建：`packages/workbench-shell/src/WidgetCardShell.tsx`
- 测试：`packages/workbench-shell/src/WidgetCardShell.test.tsx`
- 修改：`packages/workbench-shell/src/index.ts`

注：widget-card 相关 CSS 已在 `packages/workbench-shell/src/styles.css`，本任务不迁样式。

- [ ] **步骤 1：编写失败的测试**

创建 `packages/workbench-shell/src/WidgetCardShell.test.tsx`：

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { PluginInstance } from "@tabora/plugin-api"
import { WidgetCardShell, type WidgetHostCallbacks } from "./WidgetCardShell"

function makeInstance(): PluginInstance {
  return {
    id: "w1",
    workspaceId: "ws",
    pluginId: "p",
    contributionId: "c",
    extensionPoint: "widget",
    regionId: "grid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

function makeCallbacks(): WidgetHostCallbacks {
  return {
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onDblClick: vi.fn(),
    onContextMenu: vi.fn(),
    onResize: vi.fn(),
    onRemove: vi.fn(),
    onExpand: vi.fn(),
    isDragging: false,
  }
}

function mount(cb: WidgetHostCallbacks) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const dispose = render(
    () => (
      <WidgetCardShell
        instance={makeInstance()}
        title="便签"
        supportedSizes={["S", "M", "L"]}
        currentSize="M"
        callbacks={cb}
      >
        <div data-testid="content">内容</div>
      </WidgetCardShell>
    ),
    host,
  )
  return { host, dispose }
}

describe("WidgetCardShell", () => {
  it("渲染标题和子内容", () => {
    const { host, dispose } = mount(makeCallbacks())
    expect(host.textContent).toContain("便签")
    expect(host.querySelector("[data-testid='content']")).toBeTruthy()
    dispose()
  })

  it("点击尺寸按钮触发 onResize 带正确 size", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const buttons = [...host.querySelectorAll("button.widget-size-btn")] as HTMLButtonElement[]
    const lBtn = buttons.find((b) => b.textContent?.trim() === "L")
    lBtn!.click()
    expect(cb.onResize).toHaveBeenCalledWith("L")
    dispose()
  })

  it("点击删除触发 onRemove", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const removeBtn = host.querySelector("button.card-danger") as HTMLButtonElement
    removeBtn.click()
    expect(cb.onRemove).toHaveBeenCalled()
    dispose()
  })

  it("右键触发 onContextMenu", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement
    card.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }))
    expect(cb.onContextMenu).toHaveBeenCalled()
    dispose()
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --filter @tabora/workbench-shell exec vitest run src/WidgetCardShell.test.tsx`
预期：FAIL，找不到 `./WidgetCardShell` 模块。

- [ ] **步骤 3：实现 WidgetCardShell**

创建 `packages/workbench-shell/src/WidgetCardShell.tsx`：

```tsx
import { For } from "solid-js"
import type { JSX } from "solid-js"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"

export type WidgetHostCallbacks = {
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
  onDblClick: (e: MouseEvent) => void
  onContextMenu: (e: MouseEvent) => void
  onResize: (size: WidgetSize) => void
  onRemove: () => void
  onExpand: () => void
  isDragging: boolean
}

export type WidgetCardShellProps = {
  instance: PluginInstance
  title: string
  icon?: JSX.Element
  supportedSizes: WidgetSize[]
  currentSize: WidgetSize
  children: JSX.Element
  callbacks: WidgetHostCallbacks
}

export function WidgetCardShell(props: WidgetCardShellProps) {
  return (
    <div
      class="grid-item"
      classList={{ dragging: props.callbacks.isDragging }}
      data-widget-instance-id={props.instance.id}
      aria-label={props.title}
      tabIndex={0}
      draggable="true"
      onDragStart={props.callbacks.onDragStart}
      onDragOver={props.callbacks.onDragOver}
      onDrop={props.callbacks.onDrop}
      onDblClick={props.callbacks.onDblClick}
      onContextMenu={props.callbacks.onContextMenu}
    >
      <div class="widget-card">
        <div class="card-header">
          <div class="card-title">
            {props.icon}
            <span class="card-title-text">{props.title}</span>
          </div>
          <div class="card-actions">
            <div class="widget-size-bar">
              <For each={props.supportedSizes}>
                {(size) => (
                  <button
                    class="widget-size-btn"
                    classList={{ active: props.currentSize === size }}
                    onClick={() => props.callbacks.onResize(size)}
                  >
                    {size}
                  </button>
                )}
              </For>
            </div>
            <button
              class="card-action-btn"
              aria-label={`展开 ${props.title}`}
              onClick={() => props.callbacks.onExpand()}
            >
              ⤢
            </button>
            <button class="card-action-btn card-danger" onClick={() => props.callbacks.onRemove()}>
              ×
            </button>
          </div>
        </div>
        <div class="card-body">{props.children}</div>
      </div>
    </div>
  )
}
```

- [ ] **步骤 4：导出组件**

修改 `packages/workbench-shell/src/index.ts`，在末尾追加：

```ts
export {
  WidgetCardShell,
  type WidgetCardShellProps,
  type WidgetHostCallbacks,
} from "./WidgetCardShell"
```

- [ ] **步骤 5：运行测试验证通过**

运行：`pnpm --filter @tabora/workbench-shell exec vitest run src/WidgetCardShell.test.tsx`
预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add packages/workbench-shell/src/WidgetCardShell.tsx packages/workbench-shell/src/WidgetCardShell.test.tsx packages/workbench-shell/src/index.ts
git commit -m "feat(workbench-shell): 抽出 WidgetCardShell 卡片壳"
```

---

## 任务 6：LayoutBoundary（workbench-shell）

**文件：**

- 创建：`packages/workbench-shell/src/LayoutBoundary.tsx`
- 测试：`packages/workbench-shell/src/LayoutBoundary.test.tsx`
- 修改：`packages/workbench-shell/src/index.ts`

- [ ] **步骤 1：编写失败的测试**

创建 `packages/workbench-shell/src/LayoutBoundary.test.tsx`：

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { LayoutBoundary } from "./LayoutBoundary"

function Boom(): never {
  throw new Error("布局崩了")
}

describe("LayoutBoundary", () => {
  it("子组件抛错时渲染 fallback 并调用 onError", () => {
    const onError = vi.fn()
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <LayoutBoundary fallback={<div data-testid="safe">安全布局</div>} onError={onError}>
          <Boom />
        </LayoutBoundary>
      ),
      host,
    )
    expect(host.querySelector("[data-testid='safe']")).toBeTruthy()
    expect(onError).toHaveBeenCalled()
    dispose()
  })

  it("子组件正常时渲染子内容", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <LayoutBoundary fallback={<div>safe</div>} onError={vi.fn()}>
          <div data-testid="ok">正常</div>
        </LayoutBoundary>
      ),
      host,
    )
    expect(host.querySelector("[data-testid='ok']")).toBeTruthy()
    dispose()
  })
})
```

- [ ] **步骤 2：运行测试验证失败**

运行：`pnpm --filter @tabora/workbench-shell exec vitest run src/LayoutBoundary.test.tsx`
预期：FAIL，找不到 `./LayoutBoundary` 模块。

- [ ] **步骤 3：实现 LayoutBoundary**

创建 `packages/workbench-shell/src/LayoutBoundary.tsx`：

```tsx
import { ErrorBoundary } from "solid-js"
import type { JSX } from "solid-js"

export type LayoutBoundaryProps = {
  fallback: JSX.Element
  onError?: (error: unknown) => void
  children: JSX.Element
}

export function LayoutBoundary(props: LayoutBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(error) => {
        props.onError?.(error)
        return props.fallback
      }}
    >
      {props.children}
    </ErrorBoundary>
  )
}
```

- [ ] **步骤 4：导出组件**

修改 `packages/workbench-shell/src/index.ts`，在末尾追加：

```ts
export { LayoutBoundary, type LayoutBoundaryProps } from "./LayoutBoundary"
```

- [ ] **步骤 5：运行测试验证通过**

运行：`pnpm --filter @tabora/workbench-shell exec vitest run src/LayoutBoundary.test.tsx`
预期：PASS。

- [ ] **步骤 6：Commit**

```bash
git add packages/workbench-shell/src/LayoutBoundary.tsx packages/workbench-shell/src/LayoutBoundary.test.tsx packages/workbench-shell/src/index.ts
git commit -m "feat(workbench-shell): 新增 LayoutBoundary 布局错误边界"
```

---

## 任务 7：layout-dashboard 独立 package

**文件：**

- 创建：`plugins/layout-dashboard/package.json`、`tsconfig.json`、`src/index.tsx`、`src/styles.css`、`src/index.test.tsx`

- [ ] **步骤 1：创建 package.json**

创建 `plugins/layout-dashboard/package.json`：

```json
{
  "name": "@tabora/layout-dashboard",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.tsx",
    "./styles.css": "./src/styles.css",
    "./package.json": "./package.json"
  },
  "scripts": {
    "test": "vitest"
  },
  "dependencies": {
    "@tabora/plugin-api": "workspace:*",
    "@tabora/platform-kernel": "workspace:*",
    "solid-js": "catalog:ui"
  },
  "devDependencies": {
    "@tabora/tsconfig": "workspace:*"
  }
}
```

- [ ] **步骤 2：创建 tsconfig.json**

创建 `plugins/layout-dashboard/tsconfig.json`：

```json
{
  "extends": "@tabora/tsconfig/base.json",
  "include": ["src"]
}
```

- [ ] **步骤 3：创建布局 view + 插件入口**

创建 `plugins/layout-dashboard/src/index.tsx`：

```tsx
import { For, Show } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function DashboardLayout(props: LayoutViewProps) {
  return (
    <main class="layout-dashboard" data-layout="dashboard">
      <aside class="dash-rail" aria-label="工作台导航">
        <div class="dash-rail-logo">T</div>
        <For each={props.host.getGlobalActions("rail")}>
          {(action) => (
            <button
              class="dash-rail-btn"
              classList={{ active: action.isActive }}
              aria-label={action.label}
              title={action.label}
              type="button"
              onClick={() => action.run()}
            >
              {action.icon}
            </button>
          )}
        </For>
      </aside>
      <section class="dash-content">
        <header class="dash-topbar">
          <div class="dash-greeting">
            <span>
              {(() => {
                const h = new Date().getHours()
                return h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好"
              })()}
            </span>
          </div>
          <Show when={props.regions["topbar"]}>{props.regions["topbar"]!.render()}</Show>
        </header>
        <section class="dash-grid">
          <Show when={props.regions["mainGrid"]}>{props.regions["mainGrid"]!.render()}</Show>
        </section>
      </section>
    </main>
  )
}

export const layoutDashboard: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.workbench-dashboard",
    name: "Workbench Dashboard Layout",
    version: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.workbench-dashboard",
          title: "工作台仪表盘布局",
          view: "official.layout.workbench-dashboard.view",
          regions: [
            {
              id: "topbar",
              title: "顶部搜索区",
              accepts: ["search"],
              required: false,
              maxInstances: 1,
            },
            { id: "mainGrid", title: "主网格", accepts: ["widget"], required: true },
          ],
          defaultRegions: {
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
    context.registry.views.register("official.layout.workbench-dashboard.view", DashboardLayout)
  },
}
```

注意：相比旧实现，移除了 `accepts:["layout"]` 的 rail region（rail 改为 host actions chrome）。布局 ID 与 view ID 保持不变，确保已持久化的 workspace activeLayoutId 仍能匹配。

- [ ] **步骤 4：创建样式**

创建 `plugins/layout-dashboard/src/styles.css`（迁移 dashboard 专属样式；从 `packages/official-plugins/src/styles.css` 取 `workbench-rail`/`workbench-topbar`/`dash-greeting` 等 dashboard 类，重命名到 `.dash-*` 前缀。若 official-plugins 中无对应类，按下述最小样式起步）：

```css
.layout-dashboard {
  display: flex;
  min-height: 100vh;
}
.dash-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 56px;
  padding: 12px 0;
  border-right: 1px solid var(--color-border, #e5e7eb);
}
.dash-rail-logo {
  font-weight: 700;
  margin-bottom: 8px;
}
.dash-rail-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
}
.dash-rail-btn:hover,
.dash-rail-btn.active {
  background: var(--color-surface-hover, #f3f4f6);
}
.dash-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.dash-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
}
.dash-grid {
  padding: 0 24px 24px;
}
```

- [ ] **步骤 5：编写隔离测试**

创建 `plugins/layout-dashboard/src/index.test.tsx`：

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { LayoutHostAPI, RegionSlot } from "@tabora/plugin-api"
import { DashboardLayout, layoutDashboard } from "./index"

function makeHost(): LayoutHostAPI {
  return {
    getGlobalActions: (surface) =>
      surface === "rail"
        ? [
            { id: "settings", label: "设置", icon: "⚙", run: vi.fn() },
            { id: "command", label: "搜索", icon: "⌘", run: vi.fn() },
          ]
        : [],
    openSettings: vi.fn(),
    openCommandPalette: vi.fn(),
    openAddWidget: vi.fn(),
    toggleTheme: vi.fn(),
    isDark: () => false,
  }
}

function makeSlot(id: string): RegionSlot {
  return {
    regionId: id,
    title: id,
    accepts: ["widget"],
    instances: [],
    isEmpty: true,
    render: () => <div data-testid={`region-${id}`}>{id}</div>,
    renderInstance: () => null,
  }
}

describe("DashboardLayout", () => {
  it("渲染 rail 强制入口与 mainGrid", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <DashboardLayout
          isMobile={false}
          host={makeHost()}
          regions={{ topbar: makeSlot("topbar"), mainGrid: makeSlot("mainGrid") }}
        />
      ),
      host,
    )
    expect(host.querySelectorAll("button.dash-rail-btn").length).toBe(2)
    expect(host.querySelector("[data-testid='region-mainGrid']")).toBeTruthy()
    dispose()
  })
})

describe("layoutDashboard manifest", () => {
  it("声明 widget region 且 view 必填", () => {
    const layout = layoutDashboard.manifest.contributes.layouts![0]!
    expect(layout.regions.some((r) => r.accepts.includes("widget"))).toBe(true)
    expect(layout.view).toBeTruthy()
  })
})
```

- [ ] **步骤 6：安装依赖并运行测试**

运行：`pnpm install` 然后 `pnpm --filter @tabora/layout-dashboard exec vitest run`
预期：PASS（两个 describe 通过）。

- [ ] **步骤 7：Commit**

```bash
git add plugins/layout-dashboard pnpm-lock.yaml
git commit -m "feat(layout-dashboard): 官方仪表盘布局独立 package"
```

---

## 任务 8：layout-stream 独立 package

**文件：**

- 创建：`plugins/layout-stream/package.json`、`tsconfig.json`、`src/index.tsx`、`src/styles.css`、`src/index.test.tsx`

- [ ] **步骤 1：创建 package.json**

创建 `plugins/layout-stream/package.json`（依赖面与 layout-dashboard 逐字相同，仅 name 改为 `@tabora/layout-stream`）：

```json
{
  "name": "@tabora/layout-stream",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.tsx",
    "./styles.css": "./src/styles.css",
    "./package.json": "./package.json"
  },
  "scripts": {
    "test": "vitest"
  },
  "dependencies": {
    "@tabora/plugin-api": "workspace:*",
    "@tabora/platform-kernel": "workspace:*",
    "solid-js": "catalog:ui"
  },
  "devDependencies": {
    "@tabora/tsconfig": "workspace:*"
  }
}
```

- [ ] **步骤 2：创建 tsconfig.json**

创建 `plugins/layout-stream/tsconfig.json`：

```json
{
  "extends": "@tabora/tsconfig/base.json",
  "include": ["src"]
}
```

- [ ] **步骤 3：创建布局 view + 插件入口**

创建 `plugins/layout-stream/src/index.tsx`：

```tsx
import { For, Show } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function StreamLayout(props: LayoutViewProps) {
  return (
    <main class="layout-stream" data-layout="stream">
      <header class="stream-toolbar">
        <span class="stream-toolbar-logo">
          Tabora <span>Stream</span>
        </span>
        <div class="stream-toolbar-spacer" />
        <For each={props.host.getGlobalActions("toolbar")}>
          {(action) => (
            <button class="stream-toolbar-btn" type="button" onClick={() => action.run()}>
              <span aria-hidden="true">{action.icon}</span> {action.label}
            </button>
          )}
        </For>
      </header>
      <section class="stream-region">
        <div class="stream-hero">
          <div class="stream-hero-greeting">下午好 ☀</div>
        </div>
        <Show when={props.regions["stream"]}>{props.regions["stream"]!.render()}</Show>
      </section>
    </main>
  )
}

export const layoutStream: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.workbench-stream",
    name: "Workbench Stream Layout",
    version: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.workbench-stream",
          title: "工作台流式布局",
          view: "official.layout.workbench-stream.view",
          regions: [{ id: "stream", title: "卡片流", accepts: ["widget"], required: true }],
          defaultRegions: {
            stream: [
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
    context.registry.views.register("official.layout.workbench-stream.view", StreamLayout)
  },
}
```

- [ ] **步骤 4：创建样式**

创建 `plugins/layout-stream/src/styles.css`：

```css
.layout-stream {
  min-height: 100vh;
}
.stream-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
.stream-toolbar-spacer {
  flex: 1;
}
.stream-toolbar-btn {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  padding: 6px 12px;
  background: transparent;
  cursor: pointer;
}
.stream-region {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}
.stream-hero {
  margin-bottom: 16px;
}
.stream-hero-greeting {
  font-size: 24px;
  font-weight: 600;
}
```

- [ ] **步骤 5：编写隔离测试**

创建 `plugins/layout-stream/src/index.test.tsx`：

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { LayoutHostAPI, RegionSlot } from "@tabora/plugin-api"
import { StreamLayout, layoutStream } from "./index"

function makeHost(): LayoutHostAPI {
  return {
    getGlobalActions: () => [{ id: "command", label: "搜索", icon: "⌘", run: vi.fn() }],
    openSettings: vi.fn(),
    openCommandPalette: vi.fn(),
    openAddWidget: vi.fn(),
    toggleTheme: vi.fn(),
    isDark: () => false,
  }
}

function makeSlot(): RegionSlot {
  return {
    regionId: "stream",
    title: "stream",
    accepts: ["widget"],
    instances: [],
    isEmpty: true,
    render: () => <div data-testid="region-stream">stream</div>,
    renderInstance: () => null,
  }
}

describe("StreamLayout", () => {
  it("工具条渲染强制入口，渲染 stream region", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => <StreamLayout isMobile={false} host={makeHost()} regions={{ stream: makeSlot() }} />,
      host,
    )
    expect(host.querySelector("button.stream-toolbar-btn")).toBeTruthy()
    expect(host.querySelector("[data-testid='region-stream']")).toBeTruthy()
    dispose()
  })
})

describe("layoutStream manifest", () => {
  it("声明 widget region 且只有一个 region", () => {
    const layout = layoutStream.manifest.contributes.layouts![0]!
    expect(layout.regions.length).toBe(1)
    expect(layout.regions[0]!.accepts).toContain("widget")
  })
})
```

- [ ] **步骤 6：安装依赖并运行测试**

运行：`pnpm install` 然后 `pnpm --filter @tabora/layout-stream exec vitest run`
预期：PASS。

- [ ] **步骤 7：Commit**

```bash
git add plugins/layout-stream pnpm-lock.yaml
git commit -m "feat(layout-stream): 官方流式布局独立 package"
```

---

## 任务 9：layout-diy-masonry 第三方验证 package

**文件：**

- 创建：`plugins/layout-diy-masonry/package.json`、`tsconfig.json`、`src/index.tsx`、`src/styles.css`、`src/index.test.tsx`

这是对"架构是否真支持第三方布局"的直接回答：依赖面与官方两个逐字相同，故意做差异化（单 region + 瀑布流 renderInstance + 浮动菜单 + emoji 图标）。

- [ ] **步骤 1：创建 package.json**

创建 `plugins/layout-diy-masonry/package.json`（依赖面与 layout-dashboard、layout-stream **逐字相同**）：

```json
{
  "name": "@tabora/layout-diy-masonry",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.tsx",
    "./styles.css": "./src/styles.css",
    "./package.json": "./package.json"
  },
  "scripts": {
    "test": "vitest"
  },
  "dependencies": {
    "@tabora/plugin-api": "workspace:*",
    "@tabora/platform-kernel": "workspace:*",
    "solid-js": "catalog:ui"
  },
  "devDependencies": {
    "@tabora/tsconfig": "workspace:*"
  }
}
```

- [ ] **步骤 2：创建 tsconfig.json**

创建 `plugins/layout-diy-masonry/tsconfig.json`：

```json
{
  "extends": "@tabora/tsconfig/base.json",
  "include": ["src"]
}
```

- [ ] **步骤 3：创建布局 view + 插件入口**

创建 `plugins/layout-diy-masonry/src/index.tsx`。注意三处差异化验证点：(a) 只声明 masonry 单 region；(b) 用 `renderInstance` 自己分列；(c) 强制入口塞进浮动菜单（surface "menu"），用 emoji 图标。

```tsx
import { createSignal, For, Show } from "solid-js"
import type { LayoutViewProps, PluginInstance } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

const COLUMN_COUNT = 3

function splitIntoColumns(instances: PluginInstance[]): PluginInstance[][] {
  const columns: PluginInstance[][] = Array.from({ length: COLUMN_COUNT }, () => [])
  instances.forEach((inst, index) => {
    columns[index % COLUMN_COUNT]!.push(inst)
  })
  return columns
}

export function MasonryLayout(props: LayoutViewProps) {
  const [menuOpen, setMenuOpen] = createSignal(false)
  const masonry = () => props.regions["masonry"]
  const columns = () => splitIntoColumns(masonry()?.instances ?? [])

  return (
    <main class="layout-masonry" data-layout="diy-masonry">
      <div class="masonry-columns">
        <For each={columns()}>
          {(column) => (
            <div class="masonry-column">
              <For each={column}>{(inst) => masonry()!.renderInstance(inst)}</For>
            </div>
          )}
        </For>
      </div>
      <div class="masonry-fab-wrap">
        <button
          class="masonry-fab"
          aria-label="打开菜单"
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
        >
          ☰
        </button>
        <Show when={menuOpen()}>
          <div class="masonry-menu" role="menu">
            <For each={props.host.getGlobalActions("menu")}>
              {(action) => (
                <button
                  class="masonry-menu-item"
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    action.run()
                    setMenuOpen(false)
                  }}
                >
                  <span aria-hidden="true">{action.icon}</span> {action.label}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </main>
  )
}

export const layoutDiyMasonry: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "community.layout.diy-masonry",
    name: "DIY Masonry Layout",
    version: "1.0.0",
    publisher: "community",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "community.layout.diy-masonry",
          title: "DIY 瀑布流布局",
          view: "community.layout.diy-masonry.view",
          regions: [{ id: "masonry", title: "瀑布流", accepts: ["widget"], required: true }],
          defaultRegions: {
            masonry: [
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
    context.registry.views.register("community.layout.diy-masonry.view", MasonryLayout)
  },
}
```

- [ ] **步骤 4：创建样式**

创建 `plugins/layout-diy-masonry/src/styles.css`：

```css
.layout-masonry {
  min-height: 100vh;
  padding: 24px;
}
.masonry-columns {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.masonry-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.masonry-fab-wrap {
  position: fixed;
  right: 24px;
  bottom: 24px;
}
.masonry-fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.masonry-menu {
  position: absolute;
  right: 0;
  bottom: 56px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 12px;
  background: var(--color-surface, #fff);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}
.masonry-menu-item {
  border: none;
  background: transparent;
  padding: 8px 12px;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  white-space: nowrap;
}
.masonry-menu-item:hover {
  background: var(--color-surface-hover, #f3f4f6);
}
```

- [ ] **步骤 5：编写验证测试**

创建 `plugins/layout-diy-masonry/src/index.test.tsx`：

```tsx
import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { LayoutHostAPI, PluginInstance, RegionSlot } from "@tabora/plugin-api"
import { MasonryLayout, layoutDiyMasonry } from "./index"

function inst(id: string): PluginInstance {
  return {
    id,
    workspaceId: "ws",
    pluginId: "p",
    contributionId: "c",
    extensionPoint: "widget",
    regionId: "masonry",
    enabled: true,
    config: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

function makeHost(settingsRun: () => void): LayoutHostAPI {
  return {
    getGlobalActions: (surface) =>
      surface === "menu"
        ? [
            { id: "settings", label: "设置", icon: "⚙", run: settingsRun },
            { id: "command", label: "搜索", icon: "⌘", run: vi.fn() },
          ]
        : [],
    openSettings: vi.fn(),
    openCommandPalette: vi.fn(),
    openAddWidget: vi.fn(),
    toggleTheme: vi.fn(),
    isDark: () => false,
  }
}

function makeSlot(instances: PluginInstance[], rendered: string[]): RegionSlot {
  return {
    regionId: "masonry",
    title: "瀑布流",
    accepts: ["widget"],
    instances,
    isEmpty: instances.length === 0,
    render: () => null,
    renderInstance: (i) => {
      rendered.push(i.id)
      return <div data-testid={`card-${i.id}`}>{i.id}</div>
    },
  }
}

describe("DIY masonry 第三方验证", () => {
  it("用 renderInstance 把卡片分列渲染", () => {
    const rendered: string[] = []
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <MasonryLayout
          isMobile={false}
          host={makeHost(vi.fn())}
          regions={{ masonry: makeSlot([inst("a"), inst("b"), inst("c"), inst("d")], rendered) }}
        />
      ),
      host,
    )
    expect(rendered).toEqual(["a", "b", "c", "d"])
    expect(host.querySelectorAll(".masonry-column").length).toBe(3)
    dispose()
  })

  it("浮动菜单含设置入口且可达（点击触发 run）", () => {
    const settingsRun = vi.fn()
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <MasonryLayout
          isMobile={false}
          host={makeHost(settingsRun)}
          regions={{ masonry: makeSlot([], []) }}
        />
      ),
      host,
    )
    ;(host.querySelector(".masonry-fab") as HTMLButtonElement).click()
    const items = [...host.querySelectorAll(".masonry-menu-item")] as HTMLButtonElement[]
    const settings = items.find((b) => b.textContent?.includes("设置"))
    expect(settings).toBeTruthy()
    settings!.click()
    expect(settingsRun).toHaveBeenCalled()
    dispose()
  })
})

describe("layoutDiyMasonry manifest", () => {
  it("只声明一个 widget region（验证最小强制）", () => {
    const layout = layoutDiyMasonry.manifest.contributes.layouts![0]!
    expect(layout.regions.length).toBe(1)
    expect(layout.regions[0]!.accepts).toEqual(["widget"])
    expect(layout.view).toBeTruthy()
  })
})
```

- [ ] **步骤 6：安装依赖并运行测试**

运行：`pnpm install` 然后 `pnpm --filter @tabora/layout-diy-masonry exec vitest run`
预期：PASS（三个 describe 全过）。这组测试通过即证明：第三方布局仅靠 plugin-api 契约就能拿到卡片渲染、强制入口可达、最小强制合格。

- [ ] **步骤 7：Commit**

```bash
git add plugins/layout-diy-masonry pnpm-lock.yaml
git commit -m "feat(layout-diy-masonry): 第三方 DIY 瀑布流布局验证 package"
```

---

## 任务 10：装配三个布局 package 到 official-plugins

**文件：**

- 修改：`packages/official-plugins/package.json`
- 修改：`packages/official-plugins/src/index.ts`
- 删除：`packages/official-plugins/src/layout-workbench-dashboard.tsx`、`packages/official-plugins/src/layout-workbench-stream.tsx`

- [ ] **步骤 1：加 workspace 依赖**

修改 `packages/official-plugins/package.json` 的 `dependencies`，新增三行（保持字母序、其余不动）：

```json
    "@tabora/layout-dashboard": "workspace:*",
    "@tabora/layout-diy-masonry": "workspace:*",
    "@tabora/layout-stream": "workspace:*",
```

- [ ] **步骤 2：改 index.ts 引入布局 package**

修改 `packages/official-plugins/src/index.ts`：把原本的内联布局 import

```ts
import { officialLayoutWorkbenchDashboard } from "./layout-workbench-dashboard"
import { officialLayoutWorkbenchStream } from "./layout-workbench-stream"
```

替换为：

```ts
import { layoutDashboard } from "@tabora/layout-dashboard"
import { layoutStream } from "@tabora/layout-stream"
import { layoutDiyMasonry } from "@tabora/layout-diy-masonry"
```

把 `export { ... officialLayoutWorkbenchDashboard, officialLayoutWorkbenchStream, ... }` 中这两个名字替换为 `layoutDashboard, layoutStream, layoutDiyMasonry`。

把 `officialPlugins` 数组里的 `officialLayoutWorkbenchDashboard,` 和 `officialLayoutWorkbenchStream,` 两行替换为：

```ts
  layoutDashboard,
  layoutStream,
  layoutDiyMasonry,
```

- [ ] **步骤 3：删除内联布局文件**

```bash
git rm packages/official-plugins/src/layout-workbench-dashboard.tsx packages/official-plugins/src/layout-workbench-stream.tsx
```

- [ ] **步骤 4：装样式入口**

修改 `apps/playground/src/bootstrap.tsx`，在 `import "@tabora/official-plugins/styles.css"` 之后追加三行：

```ts
import "@tabora/layout-dashboard/styles.css"
import "@tabora/layout-stream/styles.css"
import "@tabora/layout-diy-masonry/styles.css"
```

- [ ] **步骤 5：安装 + 构建验证**

运行：`pnpm install` 然后 `pnpm --filter @tabora/official-plugins exec tsc --noEmit -p tsconfig.json`
预期：无类型错误，三个布局 package 被正确解析。

- [ ] **步骤 6：Commit**

```bash
git add packages/official-plugins pnpm-lock.yaml apps/playground/src/bootstrap.tsx
git commit -m "refactor(official-plugins): 引入三个独立布局 package"
```

---

## 任务 11：App.tsx 通用布局分发 + InstanceRenderer + 安全布局

**文件：**

- 修改：`apps/playground/src/App.tsx`（renderActiveLayout `1092-1243`、renderMainGrid `963-1076`、renderSearchRegion `924-961`、import 区 `19-37`）

此任务是核心集成，分多步小改。每步后运行 playground 类型检查 `pnpm --filter @tabora/playground exec tsc --noEmit -p tsconfig.json`（下称 TYPECHECK）。

- [ ] **步骤 1：引入 layout-engine 与新 shell 组件**

修改 `apps/playground/src/App.tsx` 顶部 import：

`@tabora/orchestrator` 的 import 改为：

```ts
import {
  createLayoutEngine,
  createPluginCatalog,
  type InstanceRenderer,
} from "@tabora/orchestrator"
```

`@tabora/workbench-shell` 的 import 追加 `WidgetCardShell`、`LayoutBoundary`、`type WidgetHostCallbacks`：

```ts
import {
  PluginViewBoundary,
  CommandPalette,
  SettingsHost,
  WidgetCardShell,
  LayoutBoundary,
  resolveInitialSettingsSectionId,
  type SettingsSectionId,
  type WidgetHostCallbacks,
} from "@tabora/workbench-shell"
```

`@tabora/plugin-api` 的 type import 追加 `LayoutHostAPI`、`HostActionItem`、`HostSurface`、`RegionSlot`、`LayoutViewProps`。

TYPECHECK：预期当前会有"未使用"告警，下面步骤会消化，暂不 commit。

- [ ] **步骤 2：实现 InstanceRenderer.renderWidget（复用现有交互逻辑）**

在 `App()` 内、`renderMainGrid` 附近，新增 `makeInstanceRenderer`。它把现有 `renderMainGrid` 里每张卡片的交互（`onDragStart`/`onDragOver`/`onDrop`/`onDblClick`/`onContextMenu`/`changeWidgetSize`/`removeWidget`/`openWidgetExpand`）打包成 `WidgetHostCallbacks`，用 `WidgetCardShell` 包裹插件 view：

```tsx
function makeInstanceRenderer(): InstanceRenderer {
  return {
    renderWidget: (inst) => {
      const View = widgetCardView(inst)
      if (!View) return null
      const widget = widgetContribution(inst)
      const title = widget?.title ?? inst.contributionId
      const callbacks: WidgetHostCallbacks = {
        onDragStart: (e) => onDragStart(e, inst.id),
        onDragOver,
        onDrop: (e) => onDrop(e, inst.id, inst.regionId),
        onDblClick: (e) => {
          if (isInteractiveElement(e.target)) return
          openWidgetExpand(inst, e.currentTarget as HTMLElement)
        },
        onContextMenu: (e) => {
          e.preventDefault()
          setCtxMenu({ x: e.clientX, y: e.clientY, instanceId: inst.id })
        },
        onResize: (size) => void changeWidgetSize(inst.id, size),
        onRemove: () => void removeWidget(inst.id),
        onExpand: () => openWidgetExpand(inst),
        isDragging: dragId() === inst.id,
      }
      return (
        <WidgetCardShell
          instance={inst}
          title={title}
          icon={renderWidgetIcon(widget?.icon)}
          supportedSizes={widget?.supportedSizes ?? ["S", "M", "L"]}
          currentSize={inst.size ?? "M"}
          callbacks={callbacks}
        >
          <PluginViewBoundary instanceId={inst.id} title={title}>
            {View(buildWidgetViewProps(inst))}
          </PluginViewBoundary>
        </WidgetCardShell>
      )
    },
    renderSearch: (inst) => {
      const search = pluginCatalog.findSearchContribution(inst.pluginId, inst.contributionId)
      if (!search) return null
      const View = viewOrUndefined<SearchViewProps>(search.view)
      if (!View) return <div class="settings-empty">搜索视图不可用：{search.id}</div>
      return (
        <PluginViewBoundary instanceId={inst.id} title={search.title}>
          {View({
            providers: enabledSearchProviders(),
            defaultProviderId: resolveDefaultProviderForSearch(),
            openExternal,
            onDefaultProviderChange: setDefaultSearchProvider,
            searchHistory: searchHistory(),
            commands: commandItems(),
            widgets: searchableWidgets(),
            onSaveHistory: saveSearchHistory,
            onClearHistory: clearSearchHistory,
          })}
        </PluginViewBoundary>
      )
    },
  }
}
```

TYPECHECK：预期通过（所有引用的函数 `onDragStart`/`onDrop`/`changeWidgetSize` 等已存在于 App.tsx）。

- [ ] **步骤 3：实现 buildHostActions（强制入口真源）**

在 `App()` 内新增 `buildHostActions`，返回 `LayoutHostAPI`。动作集复用现有 `commandItems`/`runRailAction`/`switchTheme`/`setAddWidgetOpen`/`setCmdPaletteOpen`/`openSettings` 逻辑：

```tsx
function buildHostActions(): LayoutHostAPI {
  const allActions: HostActionItem[] = [
    { id: "home", label: "主页", icon: "home", run: () => runRailAction("home") },
    { id: "add-widget", label: "添加卡片", icon: "plus", run: () => setAddWidgetOpen(true) },
    {
      id: "command",
      label: "搜索",
      icon: "search",
      shortcut: "⌘K",
      run: () => setCmdPaletteOpen(true),
    },
    { id: "plugins", label: "插件", icon: "puzzle", run: () => runRailAction("plugins") },
    {
      id: "theme",
      label: "切换主题",
      icon: "sun",
      run: () => void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark"),
    },
    { id: "settings", label: "设置", icon: "settings", run: () => runRailAction("settings") },
  ]
  return {
    getGlobalActions: (_surface: HostSurface) => allActions,
    openSettings: (panelId) => openSettings(panelId),
    openCommandPalette: () => setCmdPaletteOpen(true),
    openAddWidget: () => setAddWidgetOpen(true),
    toggleTheme: () => void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark"),
    isDark,
  }
}
```

TYPECHECK：预期通过。

- [ ] **步骤 4：创建 engine 实例**

在 `App()` 内、`pluginCatalog` 定义之后新增：

```ts
const layoutEngine = createLayoutEngine({
  catalog: pluginCatalog,
  instanceRenderer: makeInstanceRenderer(),
  hostActions: buildHostActions(),
})
```

注意：`makeInstanceRenderer` / `buildHostActions` 是函数声明（hoisted），可在此处调用。

TYPECHECK：预期通过。

- [ ] **步骤 5：新增 renderSafeLayout**

在 `App()` 内新增安全布局（不依赖任何插件布局；复用 `buildHostActions().getGlobalActions("toolbar")` 渲染强制入口）：

```tsx
function renderSafeLayout() {
  const host = buildHostActions()
  const widgetInstances = instances().filter(
    (i) => i.extensionPoint === "widget" && i.enabled !== false,
  )
  return (
    <main class="layout-safe" data-layout="safe">
      <header class="safe-toolbar">
        <span class="safe-toolbar-logo">Tabora</span>
        <For each={host.getGlobalActions("toolbar")}>
          {(action) => (
            <button class="safe-toolbar-btn" type="button" onClick={() => action.run()}>
              {action.label}
            </button>
          )}
        </For>
      </header>
      <section class="safe-stream">
        <For each={widgetInstances}>
          {(inst) => layoutEngine.buildRegionSlots(activeLayoutId(), instances())}
        </For>
      </section>
    </main>
  )
}
```

修正：safe-layout 直接逐个渲染 widget，不经布局 region（因为活跃布局可能正是出错源）。把 `<section class="safe-stream">` 内容改为：

```tsx
<For each={widgetInstances}>{(inst) => makeInstanceRenderer().renderWidget(inst)}</For>
```

（删除上面错误的 buildRegionSlots 调用，使用本修正版。）

TYPECHECK：预期通过。

- [ ] **步骤 6：重写 renderActiveLayout**

把 `renderActiveLayout`（含 `isDashboard`/`isStream` 全部分支，原 `1092-1243`）整体替换为：

```tsx
function renderActiveLayout() {
  const layout = pluginCatalog.findLayoutContribution(activeLayoutId())
  const LayoutView = layout?.view ? viewOrUndefined<LayoutViewProps>(layout.view) : undefined
  if (!LayoutView) return <>{renderSafeLayout()}</>
  const regions = layoutEngine.buildRegionSlots(activeLayoutId(), instances())
  const host = layoutEngine.buildHostAPI()
  return (
    <LayoutBoundary
      fallback={renderSafeLayout()}
      onError={() => showToast("布局渲染失败，已回退安全布局")}
    >
      {LayoutView({ regions, isMobile: false, host })}
    </LayoutBoundary>
  )
}
```

- [ ] **步骤 7：清理无用的旧渲染函数**

删除现已无引用的 `renderMainGrid`、`renderSearchRegion`、`runRailAction` 中仅被旧分支使用的部分。注意：

- `renderMainGrid` 的"添加卡片"modal（`add-widgets` section）需要保留——把它抽成独立 `renderAddWidgetModal()`，在 App return 的根层渲染（与 ctxMenu/expand 浮层同级），因为它不再属于任何 region。
- `runRailAction` 仍被 `buildHostActions` 使用，保留。
- 确认 `renderSearchRegion` 逻辑已搬进 `makeInstanceRenderer.renderSearch`，删除原函数。

运行：`rg "renderMainGrid|renderSearchRegion" apps/playground/src/App.tsx`
预期：无残留引用（除已删除的定义外）。

TYPECHECK：预期通过。

- [ ] **步骤 8：抽出 ctxMenu / expand 浮层（确认仍在根层渲染）**

确认 App return 根层的 `<Show when={ctxMenu()}>`、`<Show when={expandState()}>`、`renderAddWidgetModal()`、toast stack 都在布局外层渲染，不受 `renderActiveLayout` 影响。这些是全局单例浮层，本任务不强制抽成独立 shell 组件（见设计 §8.3，可后续优化），但必须确认它们在 `renderActiveLayout()` 之外。

- [ ] **步骤 9：补 safe-layout 样式**

在 `packages/workbench-shell/src/styles.css` 末尾追加（safe-layout 属平台内建，样式归 shell）：

```css
.layout-safe {
  min-height: 100vh;
}
.safe-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
.safe-toolbar-btn {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  padding: 6px 12px;
  background: transparent;
  cursor: pointer;
}
.safe-stream {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}
```

- [ ] **步骤 10：类型检查 + 单元测试**

运行：`pnpm --filter @tabora/playground exec tsc --noEmit -p tsconfig.json` 然后 `pnpm test`
预期：类型检查通过；现有 playground 测试（`workbenchDashboard.e2e.test.tsx` 等）通过或按新结构更新。若 e2e 测试断言旧的 `isDashboard` DOM 结构（如 `.workbench-rail`），更新选择器为新的 `.dash-rail`。

- [ ] **步骤 11：Commit**

```bash
git add apps/playground/src/App.tsx packages/workbench-shell/src/styles.css
git commit -m "refactor(playground): renderActiveLayout 通用化 + 安全布局回退"
```

---

## 任务 12：集成验证（playground + 全套验证）

**文件：**

- 修改：`apps/playground/src/workbenchDashboard.e2e.test.tsx`（按新结构对齐选择器，新增 safe-layout 回退用例）

- [ ] **步骤 1：更新/新增集成测试**

在 `apps/playground/src/workbenchDashboard.e2e.test.tsx` 中：

1. 把断言旧 DOM 结构的选择器（`.workbench-rail`、`.workbench-topbar-region`、`.workbench-main-grid-region` 等）改为新结构（`.dash-rail`、`.dash-topbar`、`.dash-grid`）。
2. 新增 safe-layout 回退用例：把 workspace 的 `activeLayoutId` 置为不存在的 ID（如 `"nope.layout"`），断言渲染出 `[data-layout='safe']` 且 widget 卡片仍在、强制入口（`.safe-toolbar-btn`）可见。

具体断言示例（融入现有测试风格）：

```tsx
it("activeLayoutId 指向不存在布局时回退安全布局", async () => {
  // 构造 workspace.activeLayoutId = "nope.layout" 的 session（复用现有 seed/mount helper）
  // 等待渲染后：
  const root = document.querySelector("[data-layout='safe']")
  expect(root).toBeTruthy()
  expect(document.querySelector(".safe-toolbar-btn")).toBeTruthy()
})
```

注：若现有 e2e helper 不便注入自定义 activeLayoutId，则在 `layout-engine.test.ts` 层补一个"findLayoutContribution 返回 undefined 时 buildRegionSlots 返回空对象"的单元用例，集成层只保留 DOM 选择器对齐。二者至少其一覆盖回退路径。

- [ ] **步骤 2：运行单元 + 集成测试**

运行：`pnpm test`
预期：全部 PASS。

- [ ] **步骤 3：lint + 类型检查**

运行：`pnpm check`
预期：本次新增/修改文件无新错误。

- [ ] **步骤 4：构建（验证依赖隔离）**

运行：`pnpm build`
预期：全部 package 构建通过。三个布局 package 仅靠 plugin-api/platform-kernel/solid-js 即可构建成功——这即是"布局只依赖公开契约"的硬证据。

- [ ] **步骤 5：手动验证（playground）**

运行：`pnpm dev`，在浏览器验证：

1. 默认 dashboard 布局首屏：rail 入口、topbar 搜索、mainGrid 卡片都在。
2. ⌘L 或设置里切换到 stream 布局：卡片数据完整保留。
3. 切换到 "DIY 瀑布流布局"：卡片按 3 列瀑布流排布；右下浮动菜单可打开；菜单里点"设置"能打开设置（强制入口可达）。
4. DIY 布局下：卡片可拖拽排序、双击展开、右键菜单、尺寸调整——交互与官方布局一致（证明交互来自协议注入）。
5. 切回 dashboard：数据完整。

- [ ] **步骤 6：依赖隔离静态核对**

运行：`rg "@tabora/orchestrator|@tabora/workbench-shell|@tabora/ui|@tabora/official-plugins" plugins/layout-dashboard plugins/layout-stream plugins/layout-diy-masonry`
预期：无任何匹配。三个布局 package 的源码与 package.json 都不含这些内部包依赖。

- [ ] **步骤 7：Commit**

```bash
git add apps/playground/src/workbenchDashboard.e2e.test.tsx
git commit -m "test(playground): 布局通用化集成测试与安全布局回退"
```

---

## 任务 13：文档同步

**文件：**

- 修改：`docs/technical/tabora-plugin-workbench-technical-design-v2.md`
- 修改：`docs/superpowers/specs/2026-06-02-layout-plugin-contract-design.md`（状态更新为已实现）

注意：start 时 git status 显示 `docs/technical/tabora-plugin-workbench-technical-design-v2.md` 已被他人/用户修改。**先 `git stash` 或确认不回滚他人改动**——仅追加本次实现落地的说明，不覆盖既有未提交内容。若该文件仍有未提交改动，跳过自动编辑，改为在 final 回复中提示用户手动同步对应章节。

- [ ] **步骤 1：更新技术方案 V2**

在 `docs/technical/tabora-plugin-workbench-technical-design-v2.md`：

- §3.2：注明 `LayoutViewProps` / `RegionSlot` 已落地于 `packages/plugin-api/src/layout.ts`。
- §4.2：注明 `LayoutHostAPI` 已落地，`getGlobalActions(surface)` 由 orchestrator `buildHostAPI` 提供。
- §16/§17：包结构更新为 `plugins/layout-dashboard`、`plugins/layout-stream`、`plugins/layout-diy-masonry` 独立 package；标注布局分发已去硬编码。

- [ ] **步骤 2：更新设计 spec 状态**

把 `docs/superpowers/specs/2026-06-02-layout-plugin-contract-design.md` 头部 `状态：设计已确认，待编写实现计划` 改为 `状态：已实现`。

- [ ] **步骤 3：验证文档格式**

运行：`pnpm check`
预期：文档格式通过且无新错误。

- [ ] **步骤 4：Commit**

```bash
git add docs/
git commit -m "docs: 同步布局插件化契约落地状态"
```

---

## 自检结果

- **规格覆盖度**：spec §5 契约 → 任务 1-2；§6 引擎 → 任务 3-4；§8 卡片壳 → 任务 5；§9 LayoutBoundary/safe-layout → 任务 6、11；§7 三 package → 任务 7-9；§7.5/7.6 装配与 App 重写 → 任务 10-11；§10 测试 → 各任务内联 + 任务 12；§11 文档 → 任务 13。全部覆盖。
- **类型一致性**：`InstanceRenderer`（任务 3 定义）在任务 11 使用一致；`WidgetHostCallbacks`（任务 5 定义）在任务 11 构造一致；`LayoutHostAPI`/`HostActionItem`（任务 1 定义）在任务 3、7-9、11 使用一致；`RegionSlot.render/renderInstance`（任务 1）在任务 3 产出、任务 7-9 消费一致。
- **占位符**：任务 11 步骤 5 含一处"先错后修正"的演示性纠正，已明确标注最终版代码；其余无 TODO/待定。

---

**计划已完成并保存到 `docs/superpowers/plans/2026-06-02-layout-plugin-contract.md`。两种执行方式：**

**1. 子代理驱动（推荐）** - 每个任务调度一个新的子代理，任务间进行审查，快速迭代

**2. 内联执行** - 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点

**选哪种方式？**
