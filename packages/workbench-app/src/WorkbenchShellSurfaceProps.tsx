import type { SettingsPanelViewProps, WidgetViewProps } from "@tabora/plugin-api"

import type { WorkbenchShell } from "./WorkbenchShellContext"
import { WorkbenchSettingsAboutContent } from "./WorkbenchShellChrome"
import { renderWorkbenchWidgetIcon } from "./WorkbenchShellIcons"
import { resolveWorkbenchView } from "./WorkbenchShellViewBridge"
import { resolveWidgetIconLabel } from "./shellHelpers"

// 直接从 shell bundle 读取，产出 surface host 子组件所需的 8 组 props。
// 替代了原先「组合根把 ~50 个本地变量拍平成 57 个参数」的中间层。
export function createWorkbenchShellSurfaceProps(shell: WorkbenchShell) {
  const { state, catalog, views, controllerRuntime, buildSettingsPanelProps } = shell
  const { overlays, workspace, runtime } = state
  const widgetController = controllerRuntime.widgetController

  return {
    content: shell.layoutContent(),
    addWidgetModal: {
      open: overlays.addWidgetOpen(),
      availableWidgets: catalog.listWidgetContributions(),
      widgetIconLabel: resolveWidgetIconLabel,
      onAdd: (pluginId: string, widgetId: string) => {
        void widgetController.addWidget(pluginId, widgetId)
        overlays.setAddWidgetOpen(false)
      },
      onClose: () => overlays.setAddWidgetOpen(false),
    },
    settingsHost: {
      open: overlays.settingsOpen(),
      panels: catalog.listSettingsPanels(),
      activeSectionId: overlays.activeSettingsSectionId(),
      onSectionChange: overlays.setActiveSettingsSectionId,
      onClose: () => overlays.setSettingsOpen(false),
      getView: (viewId: string) => resolveWorkbenchView<SettingsPanelViewProps>(views, viewId),
      panelProps: buildSettingsPanelProps,
      aboutContent: (
        <WorkbenchSettingsAboutContent
          workspaceName={workspace.workspaceState()?.name ?? "未加载"}
          enabledPluginCount={
            catalog.pluginSummaries(runtime.pluginRecords()).filter((plugin) => plugin.enabled)
              .length
          }
        />
      ),
    },
    expandOverlay: {
      expandState: overlays.expandState(),
      getView: (viewId: string) => resolveWorkbenchView<WidgetViewProps>(views, viewId),
      widgetIconForProps: (viewProps: WidgetViewProps) =>
        renderWorkbenchWidgetIcon(widgetController.widgetContribution(viewProps)?.icon),
      onClose: widgetController.closeExpand,
    },
    pluginModal: {
      viewId: overlays.modalViewId(),
      modalProps: overlays.modalProps(),
      getView: (viewId: string) => resolveWorkbenchView(views, viewId),
      onClose: () => overlays.setModalViewId(null),
    },
    fullscreenOverlay: {
      viewId: overlays.fullscreenViewId(),
      fullscreenProps: overlays.fullscreenProps(),
      getView: (viewId: string) => resolveWorkbenchView(views, viewId),
      onClose: () => overlays.setFullscreenViewId(null),
    },
    contextMenuOverlay: {
      menu: overlays.ctxMenu(),
      sections: widgetController.buildContextMenuModel()?.sections ?? [],
      onClose: () => overlays.setCtxMenu(null),
    },
    toastHost: {
      toasts: runtime.toasts(),
      onAction: (commandId: string) => controllerRuntime.runCommand(commandId, {}),
    },
    commandPalette: controllerRuntime.searchSurfaces.buildCommandPaletteProps(),
  }
}

export type WorkbenchShellSurfaceProps = ReturnType<typeof createWorkbenchShellSurfaceProps>
