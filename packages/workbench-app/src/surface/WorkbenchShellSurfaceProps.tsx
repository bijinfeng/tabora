import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { resolveWidgetIconLabel } from "../shared/shellHelpers"
import { createWorkbenchShellSurfaceOverlayProps } from "./WorkbenchShellSurfaceOverlayProps"
import { createWorkbenchShellSurfaceSettingsProps } from "./WorkbenchShellSurfaceSettingsProps"

// 直接从 shell bundle 读取，产出 surface host 子组件所需的 8 组 props。
// 替代了原先「组合根把 ~50 个本地变量拍平成 57 个参数」的中间层。
export function createWorkbenchShellSurfaceProps(shell: WorkbenchShell) {
  const { state, catalog, controllerRuntime } = shell
  const { overlays, workspace, runtime } = state
  const widgetController = controllerRuntime.widgetController
  const tShell = shell.tShell

  return {
    content: shell.layoutContent(),
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
    ...createWorkbenchShellSurfaceSettingsProps(shell),
    ...createWorkbenchShellSurfaceOverlayProps(shell),
    toastHost: {
      toasts: runtime.toasts(),
      onAction: (commandId: string) => controllerRuntime.runCommand(commandId, {}),
    },
    commandPalette: controllerRuntime.searchSurfaces.buildCommandPaletteProps(),
  }
}

export type WorkbenchShellSurfaceProps = ReturnType<typeof createWorkbenchShellSurfaceProps>
