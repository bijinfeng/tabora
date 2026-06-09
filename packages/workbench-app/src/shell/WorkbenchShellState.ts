import type { WorkbenchSearchSettings } from "@tabora/plugin-api"
import type { ToastManager } from "@tabora/orchestrator"

import { createWorkbenchAppearanceStore } from "../appearance/WorkbenchAppearanceStore"
import { createWorkbenchOverlayStore } from "../surface/WorkbenchOverlayStore"
import { createWorkbenchRuntimeStore } from "../runtime/WorkbenchRuntimeStore"
import { createWorkbenchSearchStore } from "../search/WorkbenchSearchStore"
import { createWorkbenchWidgetStore } from "../widget/WorkbenchWidgetStore"
import { createWorkbenchWorkspaceStore } from "../workspace/WorkbenchWorkspaceStore"

// 既有类型导入点（ControllerRuntime / LayoutRuntime / ViewRuntime）继续从这里取，保持零改动。
export type { WorkbenchContextMenuState } from "../surface/WorkbenchOverlayStore"

export type CreateWorkbenchShellStateOptions = {
  initialSearchSettings: WorkbenchSearchSettings
  initialVisualState: {
    layoutId: string
    themeId: string
    backgroundId: string
  }
  darkThemeId: string
  createToastManager?: () => ToastManager
}

// 组合根：把 shell 状态按 domain 分片为独立 store 模块，统一对外暴露 { runtime, workspace, appearance, widgets, overlays, search }。
// 各模块对外契约仍是 `() => T` accessor + setter，调用方无需感知内部是 signal 还是 store。
export function createWorkbenchShellState(options: CreateWorkbenchShellStateOptions) {
  const runtime = createWorkbenchRuntimeStore({ createToastManager: options.createToastManager })
  const workspace = createWorkbenchWorkspaceStore()
  const appearance = createWorkbenchAppearanceStore({
    initialLayoutId: options.initialVisualState.layoutId,
    initialThemeId: options.initialVisualState.themeId,
    initialBackgroundId: options.initialVisualState.backgroundId,
    darkThemeId: options.darkThemeId,
  })
  const widgets = createWorkbenchWidgetStore()
  const overlays = createWorkbenchOverlayStore()
  const search = createWorkbenchSearchStore({
    initialSearchSettings: options.initialSearchSettings,
  })

  return { runtime, workspace, appearance, widgets, overlays, search }
}

export type WorkbenchShellStateBundle = ReturnType<typeof createWorkbenchShellState>
