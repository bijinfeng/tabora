# WorkbenchShellSurfaceProps 拆分实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 `WorkbenchShellSurfaceProps` 重构为总入口 + overlay/settings/action 三个 builder，并去掉 `pluginModal` / `fullscreenOverlay` 的重复 props 组装，同时保持 `WorkbenchShellSurfaceHost` 的消费方式与行为不变。

**架构：** 保留 `createWorkbenchShellSurfaceProps(shell)` 作为唯一出口，把原来内联的 8 组 surface props 组装拆到 3 个按职责聚合的 builder 文件。overlay builder 内部增加局部 helper，统一 `pluginModal` / `fullscreenOverlay` 的同构逻辑，不扩散成跨文件抽象。

**技术栈：** TypeScript、Solid、Vitest、pnpm workspace

---

## 文件结构

**创建：**

- `packages/workbench-app/src/surface/WorkbenchShellSurfaceOverlayProps.tsx`：组装 `expandOverlay`、`pluginModal`、`fullscreenOverlay`、`contextMenuOverlay`
- `packages/workbench-app/src/surface/WorkbenchShellSurfaceSettingsProps.tsx`：组装 `settingsHost` 与 `aboutContent`
- `packages/workbench-app/src/surface/WorkbenchShellSurfaceActionProps.ts`：组装 `addWidgetModal`、`toastHost`、`commandPalette`

**修改：**

- `packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`：收敛成总入口，汇总 3 个 builder 的结果
- `packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx`：补充与重构后职责对应的回归断言

**验证：**

- `packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx`
- `pnpm --filter @tabora/workbench-app test -- src/surface/WorkbenchShellSurfaceProps.test.tsx`
- `pnpm check`

### 任务 1：先补 surface props 回归测试

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx`

- [ ] **步骤 1：补一组覆盖 overlay 与 settings/action 关键行为的失败测试**

在现有测试文件中新增 2 个用例，确保后续拆分后仍维持当前行为：

```tsx
it("maps plugin modal and fullscreen overlays from shell state", () => {
  const shell = createWorkbenchShellSurfaceStub()
  shell.state.overlays.setModalViewId("plugin.modal.view")
  shell.state.overlays.setFullscreenViewId("plugin.fullscreen.view")

  const props = createWorkbenchShellSurfaceProps(shell)

  expect(props.pluginModal.viewId).toBe("plugin.modal.view")
  expect(props.fullscreenOverlay.viewId).toBe("plugin.fullscreen.view")
  expect(typeof props.pluginModal.getView).toBe("function")
  expect(typeof props.fullscreenOverlay.getView).toBe("function")
})

it("exposes settings host close and section change handlers from overlays", () => {
  const shell = createWorkbenchShellSurfaceStub()
  shell.state.overlays.setSettingsOpen(true)

  const props = createWorkbenchShellSurfaceProps(shell)
  props.settingsHost.onSectionChange("official.settings.workspace.search")
  props.settingsHost.onClose()

  expect(shell.state.overlays.activeSettingsSectionId()).toBe("official.settings.workspace.search")
  expect(shell.state.overlays.settingsOpen()).toBe(false)
})
```

- [ ] **步骤 2：运行单测，确认新测试在重构前通过，作为行为基线**

运行：

```bash
pnpm --filter @tabora/workbench-app test -- src/surface/WorkbenchShellSurfaceProps.test.tsx
```

预期：PASS，且包含新增 2 个测试名称。

- [ ] **步骤 3：提交测试基线**

运行：

```bash
git add packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx
git commit -m "test(workbench-app): extend surface props coverage"
```

### 任务 2：拆出 overlay builder，并去掉 modal/fullscreen 重复组装

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceOverlayProps.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`
- 测试：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx`

- [ ] **步骤 1：先写 overlay builder 的导出接口和共享 helper 草图**

在新文件中先建立最小结构：

```tsx
import type { WidgetViewProps } from "@tabora/plugin-api"

import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { renderWorkbenchWidgetIcon } from "../shared/WorkbenchShellIcons"
import { resolveWorkbenchView } from "../shared/WorkbenchShellViewBridge"

function createPluginViewOverlayProps(
  shell: WorkbenchShell,
  options: {
    viewId: () => string | null
    viewProps: () => Record<string, unknown>
    onClose: () => void
  },
) {
  const pluginViewBoundaryCopy = shell.shellCopy?.pluginViewBoundaryCopy
  const tShell = shell.tShell

  return {
    viewId: options.viewId(),
    getView: (viewId: string) => resolveWorkbenchView(shell.views, viewId),
    onClose: options.onClose,
    ...(tShell ? { tShell } : {}),
    ...(pluginViewBoundaryCopy ? { pluginViewBoundaryCopy } : {}),
  }
}

export function createWorkbenchShellSurfaceOverlayProps(shell: WorkbenchShell) {
  const { overlays } = shell.state
  const widgetController = shell.controllerRuntime.widgetController
  const tShell = shell.tShell

  return {
    expandOverlay: {
      expandState: overlays.expandState(),
      getView: (viewId: string) => resolveWorkbenchView<WidgetViewProps>(shell.views, viewId),
      widgetIconForProps: (viewProps: WidgetViewProps) =>
        renderWorkbenchWidgetIcon(widgetController.widgetContribution(viewProps)?.icon),
      onClose: widgetController.closeExpand,
      ...(tShell ? { tShell } : {}),
      ...(shell.shellCopy?.pluginViewBoundaryCopy
        ? { pluginViewBoundaryCopy: shell.shellCopy.pluginViewBoundaryCopy }
        : {}),
    },
    pluginModal: {
      ...createPluginViewOverlayProps(shell, {
        viewId: overlays.modalViewId,
        viewProps: overlays.modalProps,
        onClose: () => overlays.setModalViewId(null),
      }),
      modalProps: overlays.modalProps(),
    },
    fullscreenOverlay: {
      ...createPluginViewOverlayProps(shell, {
        viewId: overlays.fullscreenViewId,
        viewProps: overlays.fullscreenProps,
        onClose: () => overlays.setFullscreenViewId(null),
      }),
      fullscreenProps: overlays.fullscreenProps(),
    },
    contextMenuOverlay: {
      menu: overlays.ctxMenu(),
      sections: widgetController.buildContextMenuModel()?.sections ?? [],
      ...(tShell ? { tShell } : {}),
      onClose: () => overlays.setCtxMenu(null),
    },
  }
}
```

- [ ] **步骤 2：让总入口改为消费 overlay builder**

把 `WorkbenchShellSurfaceProps.tsx` 从直接内联 overlay props 改为只汇总 builder 返回值：

```tsx
import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { createWorkbenchShellSurfaceActionProps } from "./WorkbenchShellSurfaceActionProps"
import { createWorkbenchShellSurfaceOverlayProps } from "./WorkbenchShellSurfaceOverlayProps"
import { createWorkbenchShellSurfaceSettingsProps } from "./WorkbenchShellSurfaceSettingsProps"

export function createWorkbenchShellSurfaceProps(shell: WorkbenchShell) {
  return {
    content: shell.layoutContent(),
    ...createWorkbenchShellSurfaceActionProps(shell),
    ...createWorkbenchShellSurfaceSettingsProps(shell),
    ...createWorkbenchShellSurfaceOverlayProps(shell),
  }
}
```

- [ ] **步骤 3：运行 surface props 单测，确认 overlay 重构没有回归**

运行：

```bash
pnpm --filter @tabora/workbench-app test -- src/surface/WorkbenchShellSurfaceProps.test.tsx
```

预期：PASS。

- [ ] **步骤 4：提交 overlay 拆分**

运行：

```bash
git add \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceOverlayProps.tsx \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx
git commit -m "refactor(workbench-app): split surface overlay props"
```

### 任务 3：拆出 settings builder，收敛 aboutContent 派生

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceSettingsProps.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`
- 测试：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx`

- [ ] **步骤 1：实现 settings builder**

在新文件中搬运 `settingsHost` 逻辑，仅保留 settings 自己的依赖：

```tsx
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { WorkbenchSettingsAboutContent } from "./WorkbenchShellChrome"
import { resolveWorkbenchView } from "../shared/WorkbenchShellViewBridge"
import { createWorkbenchShellSettingsHostCopy } from "../i18n"

export function createWorkbenchShellSurfaceSettingsProps(shell: WorkbenchShell) {
  const { overlays, workspace, runtime } = shell.state
  const { catalog, views, buildSettingsPanelProps, tShell } = shell

  return {
    settingsHost: {
      open: overlays.settingsOpen(),
      panels: catalog.listSettingsPanels(),
      activeSectionId: overlays.activeSettingsSectionId(),
      onSectionChange: overlays.setActiveSettingsSectionId,
      onClose: () => overlays.setSettingsOpen(false),
      getView: (viewId: string) => resolveWorkbenchView<SettingsPanelViewProps>(views, viewId),
      panelProps: buildSettingsPanelProps,
      ...(tShell ? { copy: createWorkbenchShellSettingsHostCopy(tShell) } : {}),
      aboutContent: (
        <WorkbenchSettingsAboutContent
          workspaceName={workspace.workspaceState()?.name ?? "未加载"}
          enabledPluginCount={
            catalog.pluginSummaries(runtime.pluginRecords()).filter((plugin) => plugin.enabled)
              .length
          }
          {...(tShell ? { tShell } : {})}
        />
      ),
    },
  }
}
```

- [ ] **步骤 2：复跑测试，确认 `aboutContent` 和 settings handler 行为未变**

运行：

```bash
pnpm --filter @tabora/workbench-app test -- src/surface/WorkbenchShellSurfaceProps.test.tsx
```

预期：PASS，且 `renders settings about content from shell summaries` 通过。

- [ ] **步骤 3：提交 settings 拆分**

运行：

```bash
git add \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceSettingsProps.tsx \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx
git commit -m "refactor(workbench-app): split surface settings props"
```

### 任务 4：拆出 action builder，收敛 add-widget / toast / command palette

**文件：**

- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceActionProps.ts`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`
- 测试：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx`

- [ ] **步骤 1：实现 action builder**

在新文件中搬运动作型 props：

```ts
import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { resolveWidgetIconLabel } from "../shared/shellHelpers"

export function createWorkbenchShellSurfaceActionProps(shell: WorkbenchShell) {
  const { overlays, runtime } = shell.state
  const { catalog, controllerRuntime, tShell } = shell
  const widgetController = controllerRuntime.widgetController

  return {
    addWidgetModal: {
      open: overlays.addWidgetOpen(),
      availableWidgets: catalog.listWidgetContributions(),
      widgetIconLabel: resolveWidgetIconLabel,
      ...(tShell ? { tShell } : {}),
      onAdd: (pluginId: string, widgetId: string) => {
        void widgetController.addWidget(pluginId, widgetId)
        overlays.setAddWidgetOpen(false)
      },
      onClose: () => overlays.setAddWidgetOpen(false),
    },
    toastHost: {
      toasts: runtime.toasts(),
      onAction: (commandId: string) => controllerRuntime.runCommand(commandId, {}),
    },
    commandPalette: controllerRuntime.searchSurfaces.buildCommandPaletteProps(),
  }
}
```

- [ ] **步骤 2：运行单测确认 add widget 和 toast command 回归通过**

运行：

```bash
pnpm --filter @tabora/workbench-app test -- src/surface/WorkbenchShellSurfaceProps.test.tsx
```

预期：PASS，且以下用例通过：

- `closes add widget after dispatching add and defaults empty context sections`
- `routes toast actions into command execution`

- [ ] **步骤 3：提交 action 拆分**

运行：

```bash
git add \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceActionProps.ts \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.ts
git commit -m "refactor(workbench-app): split surface action props"
```

### 任务 5：收尾验证与质量检查

**文件：**

- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx`
- 修改：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceOverlayProps.tsx`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceSettingsProps.tsx`
- 创建：`/home/kebai/桌面/tabora/packages/workbench-app/src/surface/WorkbenchShellSurfaceActionProps.ts`

- [ ] **步骤 1：运行目标测试与全仓检查**

运行：

```bash
pnpm --filter @tabora/workbench-app test -- src/surface/WorkbenchShellSurfaceProps.test.tsx
pnpm check
```

预期：

- 第一个命令 PASS
- 第二个命令 PASS，包含 format、lint、typecheck、architecture

- [ ] **步骤 2：检查编辑文件诊断**

使用 IDE diagnostics 确认以下文件没有新增错误：

```txt
packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx
packages/workbench-app/src/surface/WorkbenchShellSurfaceOverlayProps.tsx
packages/workbench-app/src/surface/WorkbenchShellSurfaceSettingsProps.tsx
packages/workbench-app/src/surface/WorkbenchShellSurfaceActionProps.ts
packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx
```

预期：无新增 linter / type diagnostics。

- [ ] **步骤 3：提交最终收尾**

运行：

```bash
git add \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.tsx \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceOverlayProps.tsx \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceSettingsProps.tsx \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceActionProps.ts \
  packages/workbench-app/src/surface/WorkbenchShellSurfaceProps.test.tsx
git commit -m "refactor(workbench-app): split shell surface props"
```

- [ ] **步骤 4：确认工作区干净**

运行：

```bash
git status --short --untracked-files=all
```

预期：无输出。
