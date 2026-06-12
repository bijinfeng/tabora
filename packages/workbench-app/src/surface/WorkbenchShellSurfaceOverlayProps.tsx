import type { WidgetViewProps } from "@tabora/plugin-api"

import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { renderWorkbenchWidgetIcon } from "../shared/WorkbenchShellIcons"
import { resolveWorkbenchView } from "../shared/WorkbenchShellViewBridge"

function createPluginViewOverlayProps(
  shell: WorkbenchShell,
  options: {
    viewId: () => string | null
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
  const pluginViewBoundaryCopy = shell.shellCopy?.pluginViewBoundaryCopy
  const tShell = shell.tShell

  return {
    expandOverlay: {
      expandState: overlays.expandState(),
      getView: (viewId: string) => resolveWorkbenchView<WidgetViewProps>(shell.views, viewId),
      widgetIconForProps: (viewProps: WidgetViewProps) =>
        renderWorkbenchWidgetIcon(widgetController.widgetContribution(viewProps)?.icon),
      onClose: widgetController.closeExpand,
      ...(tShell ? { tShell } : {}),
      ...(pluginViewBoundaryCopy ? { pluginViewBoundaryCopy } : {}),
    },
    pluginModal: {
      ...createPluginViewOverlayProps(shell, {
        viewId: overlays.modalViewId,
        onClose: () => overlays.setModalViewId(null),
      }),
      modalProps: overlays.modalProps(),
    },
    fullscreenOverlay: {
      ...createPluginViewOverlayProps(shell, {
        viewId: overlays.fullscreenViewId,
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
