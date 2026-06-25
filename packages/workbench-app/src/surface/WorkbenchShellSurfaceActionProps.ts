import type { WidgetSize } from "@tabora/plugin-api"

import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { resolveWidgetIconLabel } from "../shared/shellHelpers"
import type { AvailableWidget } from "./WorkbenchShellChrome.types"

function detectWidgetSource(pluginId: string, publisher?: string): "official" | "third-party" {
  if (publisher && /tabora|official/i.test(publisher)) return "official"
  if (/^official\./.test(pluginId)) return "official"
  return "third-party"
}

export function createWorkbenchShellSurfaceActionProps(shell: WorkbenchShell) {
  const { overlays, runtime } = shell.state
  const { catalog, controllerRuntime, tShell } = shell
  const widgetController = controllerRuntime.widgetController

  const availableWidgets: AvailableWidget[] = catalog.listWidgetContributions().map((widget) => ({
    pluginId: widget.pluginId,
    id: widget.id,
    ...(widget.icon ? { icon: widget.icon } : {}),
    title: widget.title,
    description: widget.description,
    source: detectWidgetSource(widget.pluginId, widget.pluginPublisher),
    ...(widget.pluginVersion ? { version: widget.pluginVersion } : {}),
    ...(widget.supportedSizes ? { supportedSizes: widget.supportedSizes } : {}),
    ...(widget.defaultSize ? { defaultSize: widget.defaultSize } : {}),
    ...(widget.pluginName ? { pluginName: widget.pluginName } : {}),
  }))

  return {
    addWidgetModal: {
      open: overlays.addWidgetOpen(),
      availableWidgets,
      widgetIconLabel: resolveWidgetIconLabel,
      ...(tShell ? { tShell } : {}),
      onAdd: (pluginId: string, widgetId: string, size?: WidgetSize) => {
        void widgetController.addWidget(pluginId, widgetId, size)
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
