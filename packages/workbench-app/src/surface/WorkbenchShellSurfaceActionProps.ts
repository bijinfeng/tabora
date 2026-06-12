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
