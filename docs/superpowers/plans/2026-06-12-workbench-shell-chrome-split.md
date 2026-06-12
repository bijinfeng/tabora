# WorkbenchShellChrome.tsx 拆分实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 `packages/workbench-app/src/surface/WorkbenchShellChrome.tsx` 重构为稳定入口 + 多个单一职责实现文件，同时保持现有导出路径、渲染行为和相邻宿主调用点不变。

**架构：** 保留 `WorkbenchShellChrome.tsx` 作为稳定入口，新增 5 个按导出组件划分的实现文件，并用一个仅包含局部共享类型的 `WorkbenchShellChrome.types.ts` 收口共用类型。优先通过轻量导出测试和现有 `WorkbenchShellSurfaceHost` 回归测试保护拆分过程，只做物理搬运，不改变 JSX、copy key 或交互逻辑。

**技术栈：** SolidJS、TypeScript、Vitest、pnpm workspace

---

## 文件结构

**创建：**

- `packages/workbench-app/src/surface/WorkbenchShellChrome.test.tsx`：锁定 `WorkbenchShellChrome.tsx` 的稳定导出
- `packages/workbench-app/src/surface/WorkbenchShellChrome.types.ts`：收口宿主壳组件共用的局部类型
- `packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx`：承载添加卡片弹窗实现
- `packages/workbench-app/src/surface/WorkbenchSettingsAboutContent.tsx`：承载宿主关于页内容实现
- `packages/workbench-app/src/surface/SafeWorkbenchLayout.tsx`：承载安全回退布局实现
- `packages/workbench-app/src/surface/WorkbenchExpandOverlay.tsx`：承载展开 overlay 实现
- `packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx`：承载右键菜单 overlay 实现

**修改：**

- `packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`：收敛为稳定 re-export 入口
- `packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.tsx`：如有必要，仅做 import 稳定性回归确认
- `packages/workbench-app/src/surface/WorkbenchShellSurfaceSettingsProps.tsx`：继续从稳定入口消费 `WorkbenchSettingsAboutContent`
- `packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`：复用现有宿主集成回归，必要时补最小断言

**验证：**

- `pnpm --filter @tabora/workbench-app test -- WorkbenchShellChrome.test.tsx`
- `pnpm --filter @tabora/workbench-app test -- WorkbenchShellSurfaceHost.test.tsx`
- `pnpm --filter @tabora/workbench-app test`
- `pnpm check`

### 任务 1：先用轻量测试锁定稳定导出

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellChrome.test.tsx`

- [ ] **步骤 1：编写导出稳定性测试**

创建测试文件，直接从稳定入口导入 5 个组件，并断言它们仍然是函数导出：

```tsx
import { describe, expect, it } from "vitest"

import {
  SafeWorkbenchLayout,
  WorkbenchAddWidgetModal,
  WorkbenchContextMenuOverlay,
  WorkbenchExpandOverlay,
  WorkbenchSettingsAboutContent,
} from "./WorkbenchShellChrome"

describe("WorkbenchShellChrome exports", () => {
  it("keeps the stable chrome component exports", () => {
    expect(typeof WorkbenchAddWidgetModal).toBe("function")
    expect(typeof WorkbenchSettingsAboutContent).toBe("function")
    expect(typeof SafeWorkbenchLayout).toBe("function")
    expect(typeof WorkbenchExpandOverlay).toBe("function")
    expect(typeof WorkbenchContextMenuOverlay).toBe("function")
  })
})
```

- [ ] **步骤 2：运行新测试验证通过**

运行：`pnpm --filter @tabora/workbench-app test -- WorkbenchShellChrome.test.tsx`

预期：PASS，新增测试通过。

- [ ] **步骤 3：提交导出稳定性测试**

```bash
git add packages/workbench-app/src/surface/WorkbenchShellChrome.test.tsx
git commit -m "test(workbench-app): 补充 shell chrome 导出回归"
```

### 任务 2：抽离共享类型与基础内容组件

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellChrome.types.ts`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchSettingsAboutContent.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`

- [ ] **步骤 1：创建共享类型文件**

将 `WorkbenchShellChrome.tsx` 中真正跨组件共享的局部类型迁入新文件：

```ts
import type { PluginInstance, WidgetViewProps, WidgetSize } from "@tabora/plugin-api"
import type { JSX } from "solid-js"

export type SolidView<Props = Record<string, unknown>> = (props: Props) => JSX.Element

export type AvailableWidget = {
  pluginId: string
  id: string
  icon?: string
  title: string
  description?: string
}

export type WidgetContextSection = {
  items: Array<{
    label: string
    danger?: boolean
    isCurrent?: boolean
    run: () => void
  }>
}

export type ExpandState = {
  instanceId: string
  title: string
  viewId: string
  mode: "expand" | "settings"
  props: WidgetViewProps
}

export type SafeLayoutModel = {
  title: string
  icon?: string
  currentSize: WidgetSize
  supportedSizes: WidgetSize[]
}
```

- [ ] **步骤 2：搬运添加卡片弹窗组件**

创建 `WorkbenchAddWidgetModal.tsx`，原样搬运实现，并改为从类型文件取 `AvailableWidget`：

```tsx
import { For, Show } from "solid-js"

import type { ShellTranslation } from "../i18n"
import type { AvailableWidget } from "./WorkbenchShellChrome.types"

export function WorkbenchAddWidgetModal(props: {
  open: boolean
  availableWidgets: AvailableWidget[]
  widgetIconLabel: (icon?: string) => string
  tShell?: ShellTranslation
  onAdd: (pluginId: string, widgetId: string) => void
  onClose: () => void
}) {
  return <Show when={props.open}>{/* 将当前同名组件的完整 JSX 原样剪切到此处 */}</Show>
}
```

执行要求：

- `Show`、`For`、`.modal-*`、`.add-widget-modal-*` 相关 JSX 必须从当前 `WorkbenchShellChrome.tsx` 同名组件中原样剪切
- 不修改按钮点击行为、文案 key 或 DOM 层级

- [ ] **步骤 3：搬运关于页组件**

创建 `WorkbenchSettingsAboutContent.tsx`，保持原 JSX 和 copy key 不变：

```tsx
import type { ShellTranslation } from "../i18n"

export function WorkbenchSettingsAboutContent(props: {
  workspaceName: string
  enabledPluginCount: number
  tShell?: ShellTranslation
}) {
  return (
    <div class="settings-panel-stack-host">{/* 将当前同名组件的完整 JSX 原样剪切到此处 */}</div>
  )
}
```

执行要求：

- `widget-card`、`card-header`、`card-body` 结构保持不变
- `chrome.settings.about.*` copy key 保持不变

- [ ] **步骤 4：将入口文件临时收敛为混合模式**

先让 `WorkbenchShellChrome.tsx` 仅保留已拆组件的显式导出，并继续保留尚未迁移的 3 个组件原实现，避免一次性大改。此时文件结构应调整为：

```ts
export { WorkbenchAddWidgetModal } from "./WorkbenchAddWidgetModal"
export { WorkbenchSettingsAboutContent } from "./WorkbenchSettingsAboutContent"
```

并保留当前文件中尚未迁出的以下导出实现不动：

- `SafeWorkbenchLayout`
- `WorkbenchExpandOverlay`
- `WorkbenchContextMenuOverlay`

- [ ] **步骤 5：运行局部测试确认入口仍可消费**

运行：

- `pnpm --filter @tabora/workbench-app test -- WorkbenchShellChrome.test.tsx`
- `pnpm --filter @tabora/workbench-app test -- WorkbenchShellSurfaceHost.test.tsx`

预期：PASS。

- [ ] **步骤 6：提交类型与基础内容拆分**

```bash
git add \
  packages/workbench-app/src/surface/WorkbenchShellChrome.types.ts \
  packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx \
  packages/workbench-app/src/surface/WorkbenchSettingsAboutContent.tsx \
  packages/workbench-app/src/surface/WorkbenchShellChrome.tsx
git commit -m "refactor(workbench-app): 拆分 shell chrome 基础组件"
```

### 任务 3：拆出 SafeWorkbenchLayout

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/SafeWorkbenchLayout.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`

- [ ] **步骤 1：搬运 SafeWorkbenchLayout 到独立文件**

创建 `SafeWorkbenchLayout.tsx`，保留现有依赖和渲染逻辑，只把共享类型改为来自类型文件：

```tsx
import { TaboraMark } from "@tabora/brand"
import type { PluginInstance, WidgetViewProps, WidgetSize } from "@tabora/plugin-api"
import { PluginViewBoundary, WidgetCardShell } from "@tabora/workbench-shell"
import { Moon, Sun } from "lucide-solid"
import { For } from "solid-js"
import type { JSX } from "solid-js"

import type {
  ShellTranslation,
  WorkbenchShellPluginViewBoundaryCopy,
  WorkbenchShellWidgetCopy,
} from "../i18n"
import type { SafeLayoutModel, SolidView } from "./WorkbenchShellChrome.types"

export function SafeWorkbenchLayout(props: {
  isDark: boolean
  instances: PluginInstance[]
  tShell?: ShellTranslation
  widgetContribution: (
    instance: Pick<PluginInstance, "pluginId" | "contributionId">,
  ) => { icon?: string; views: { card: string } } | null | undefined
  resolveWidgetModel: (instance: PluginInstance) => SafeLayoutModel | null
  getView: (viewId: string) => SolidView<WidgetViewProps> | undefined
  renderWidgetIcon: (icon?: string) => JSX.Element
  buildWidgetViewProps: (instance: PluginInstance, model: SafeLayoutModel) => WidgetViewProps
  onOpenCommandPalette: () => void
  onToggleTheme: () => void
  onOpenSettings: () => void
  onOpenExpand: (instance: PluginInstance) => void
  onOpenContextMenu: (event: MouseEvent, instanceId: string) => void
  onResize: (instanceId: string, size: WidgetSize) => void
  onRemove: (instanceId: string) => void
  isDragging: (instanceId: string) => boolean
  widgetShellCopy?: WorkbenchShellWidgetCopy
  pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
}) {
  return <div class="safe-layout">{/* 将当前同名组件的完整 JSX 原样剪切到此处 */}</div>
}
```

执行要求：

- 顶部 toolbar、`WidgetCardShell`、`PluginViewBoundary` 包裹逻辑全部原样搬运
- `placeholders.widgetInstanceInvalid` 和 `chrome.toolbar.*` 文案 key 保持不变
- 不在本任务继续拆 widget 渲染子块

- [ ] **步骤 2：把入口文件改成显式 re-export**

更新 `WorkbenchShellChrome.tsx`，让它只负责转发导出：

```ts
export { WorkbenchAddWidgetModal } from "./WorkbenchAddWidgetModal"
export { WorkbenchSettingsAboutContent } from "./WorkbenchSettingsAboutContent"
export { SafeWorkbenchLayout } from "./SafeWorkbenchLayout"
export { WorkbenchExpandOverlay } from "./WorkbenchExpandOverlay"
export { WorkbenchContextMenuOverlay } from "./WorkbenchContextMenuOverlay"
```

- [ ] **步骤 3：运行导出测试与局部宿主测试**

运行：

- `pnpm --filter @tabora/workbench-app test -- WorkbenchShellChrome.test.tsx`
- `pnpm --filter @tabora/workbench-app test -- WorkbenchShellSurfaceHost.test.tsx`

预期：PASS。

- [ ] **步骤 4：提交安全布局拆分**

```bash
git add \
  packages/workbench-app/src/surface/SafeWorkbenchLayout.tsx \
  packages/workbench-app/src/surface/WorkbenchShellChrome.tsx
git commit -m "refactor(workbench-app): 拆分 safe workbench layout"
```

### 任务 4：拆出 expand overlay 与 context menu overlay

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchExpandOverlay.tsx`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`

- [ ] **步骤 1：搬运展开 overlay**

创建 `WorkbenchExpandOverlay.tsx`，保持缺失视图 fallback、`PluginViewBoundary` 包裹和 footer 文案逻辑不变：

```tsx
import type { WidgetViewProps } from "@tabora/plugin-api"
import { PluginViewBoundary } from "@tabora/workbench-shell"
import { X } from "lucide-solid"
import { Show } from "solid-js"
import type { JSX } from "solid-js"

import type { ShellTranslation, WorkbenchShellPluginViewBoundaryCopy } from "../i18n"
import type { ExpandState, SolidView } from "./WorkbenchShellChrome.types"

export function WorkbenchExpandOverlay(props: {
  expandState: ExpandState | null
  getView: (viewId: string) => SolidView<WidgetViewProps> | undefined
  widgetIconForProps: (props: WidgetViewProps) => JSX.Element
  onClose: () => void
  tShell?: ShellTranslation
  pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
}) {
  return <Show when={props.expandState}>{/* 将当前同名组件的完整 JSX 原样剪切到此处 */}</Show>
}
```

执行要求：

- `settings-panel-missing` fallback 必须保留
- `chrome.expand.*` 相关 copy key 和 `aria-label` 保持不变
- `PluginViewBoundary` 的包裹位置保持不变

- [ ] **步骤 2：搬运右键菜单 overlay**

创建 `WorkbenchContextMenuOverlay.tsx`，只依赖 `WidgetContextSection` 类型：

```tsx
import { For, Show } from "solid-js"

import type { ShellTranslation } from "../i18n"
import type { WidgetContextSection } from "./WorkbenchShellChrome.types"

export function WorkbenchContextMenuOverlay(props: {
  menu: { x: number; y: number; instanceId: string } | null
  sections: WidgetContextSection[]
  tShell?: ShellTranslation
  onClose: () => void
}) {
  return <Show when={props.menu}>{/* 将当前同名组件的完整 JSX 原样剪切到此处 */}</Show>
}
```

执行要求：

- `ctx-menu-sep`、`ctx-menu-danger`、`ctx-menu-check` 相关渲染逻辑保持不变
- 点击菜单项后先执行 `item.run()` 再关闭 overlay 的顺序保持不变

- [ ] **步骤 3：确认入口文件只剩 re-export**

`WorkbenchShellChrome.tsx` 维持如下最终结构：

```ts
export { WorkbenchAddWidgetModal } from "./WorkbenchAddWidgetModal"
export { WorkbenchSettingsAboutContent } from "./WorkbenchSettingsAboutContent"
export { SafeWorkbenchLayout } from "./SafeWorkbenchLayout"
export { WorkbenchExpandOverlay } from "./WorkbenchExpandOverlay"
export { WorkbenchContextMenuOverlay } from "./WorkbenchContextMenuOverlay"
```

- [ ] **步骤 4：运行相邻回归测试**

运行：`pnpm --filter @tabora/workbench-app test -- WorkbenchShellSurfaceHost.test.tsx`

预期：PASS，现有宿主组合回归仍然覆盖添加卡片、上下文菜单、展开态和本地化 copy。

- [ ] **步骤 5：提交 overlay 组件拆分**

```bash
git add \
  packages/workbench-app/src/surface/WorkbenchExpandOverlay.tsx \
  packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx \
  packages/workbench-app/src/surface/WorkbenchShellChrome.tsx
git commit -m "refactor(workbench-app): 拆分 shell chrome overlays"
```

### 任务 5：全量收口与验证

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceSettingsProps.tsx`
- 测试：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellChrome.test.tsx`
- 测试：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`

- [ ] **步骤 1：核对调用点保持稳定**

确认这两个调用点仍通过稳定入口消费，不需要改成直接引用新文件：

```ts
// WorkbenchShellSurfaceHost.tsx
import {
  WorkbenchAddWidgetModal,
  WorkbenchContextMenuOverlay,
  WorkbenchExpandOverlay,
} from "./WorkbenchShellChrome"

// WorkbenchShellSurfaceSettingsProps.tsx
import { WorkbenchSettingsAboutContent } from "./WorkbenchShellChrome"
```

- [ ] **步骤 2：如有必要补最小断言**

仅当拆分后现有测试未覆盖稳定入口时，再为 `WorkbenchShellSurfaceHost.test.tsx` 补一个最小断言。例如继续断言本地化 copy 仍能穿透到上下文菜单或展开态：

```tsx
expect(root.textContent).toContain("Add widget")
expect(root.textContent).toContain("Current")
expect(root.textContent).toContain("Esc to close")
```

- [ ] **步骤 3：运行 workbench-app 全量测试**

运行：`pnpm --filter @tabora/workbench-app test`

预期：PASS。

- [ ] **步骤 4：运行全仓检查**

运行：`pnpm check`

预期：PASS，包含 format、lint、typecheck、architecture。

- [ ] **步骤 5：检查 diagnostics**

使用 IDE diagnostics 检查以下文件：

- `packages/workbench-app/src/surface/WorkbenchShellChrome.tsx`
- `packages/workbench-app/src/surface/WorkbenchShellChrome.types.ts`
- `packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx`
- `packages/workbench-app/src/surface/WorkbenchSettingsAboutContent.tsx`
- `packages/workbench-app/src/surface/SafeWorkbenchLayout.tsx`
- `packages/workbench-app/src/surface/WorkbenchExpandOverlay.tsx`
- `packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx`
- `packages/workbench-app/src/surface/WorkbenchShellChrome.test.tsx`
- `packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx`

预期：无新增语法或类型错误。

- [ ] **步骤 6：提交最终收尾改动**

```bash
git add \
  packages/workbench-app/src/surface/WorkbenchShellChrome.tsx \
  packages/workbench-app/src/surface/WorkbenchShellChrome.types.ts \
  packages/workbench-app/src/surface/WorkbenchAddWidgetModal.tsx \
  packages/workbench-app/src/surface/WorkbenchSettingsAboutContent.tsx \
  packages/workbench-app/src/surface/SafeWorkbenchLayout.tsx \
  packages/workbench-app/src/surface/WorkbenchExpandOverlay.tsx \
  packages/workbench-app/src/surface/WorkbenchContextMenuOverlay.tsx \
  packages/workbench-app/src/surface/WorkbenchShellChrome.test.tsx \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceHost.test.tsx
git commit -m "refactor(workbench-app): 拆分 workbench shell chrome"
```

- [ ] **步骤 7：确认工作区干净**

运行：`git status --short --untracked-files=all`

预期：无输出。
