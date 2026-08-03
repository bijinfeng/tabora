import type { PluginInstance, WidgetSize, WidgetViewProps } from "@tabora/plugin-api"
import type { JSX } from "solid-js"

import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { renderWorkbenchWidgetIcon } from "../shared/WorkbenchShellIcons"
import { resolveWorkbenchView } from "../shared/WorkbenchShellViewBridge"
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

  // 添加卡片弹窗的预览：解析插件真实的 card view（和工作台同一个组件、同一份
  // registry），而不是在弹窗里另画一个仿卡片。
  //
  // host 全部替换为空操作。viewRuntime.buildWidgetViewProps 给出的 host 会真的
  // 落库、移除实例、改尺寸、开 expand，而预览用的是一个 id 为 add-widget-preview
  // 的假实例——插件在预览里的任何交互都会污染真实工作台数据。
  const renderWidgetPreview = (
    pluginId: string,
    widgetId: string,
    size: WidgetSize,
  ): JSX.Element => {
    const contribution = catalog
      .listWidgetContributions()
      .find((item) => item.pluginId === pluginId && item.id === widgetId)
    if (!contribution?.views?.card) return null

    const View = resolveWorkbenchView<WidgetViewProps>(shell.views, contribution.views.card)
    if (!View) return null

    const previewInstance: PluginInstance = {
      id: `add-widget-preview:${pluginId}:${widgetId}`,
      // 预览实例不落库，workspaceId 仅为满足类型的占位值。
      workspaceId: "",
      pluginId,
      contributionId: widgetId,
      extensionPoint: "widget",
      regionId: "add-widget-preview",
      enabled: true,
      size,
      config: {},
      createdAt: "",
      updatedAt: "",
    }

    const viewProps = controllerRuntime.viewRuntime.buildWidgetViewProps(previewInstance, {
      title: contribution.title,
      ...(contribution.icon ? { icon: contribution.icon } : {}),
      currentSize: size,
      supportedSizes: contribution.supportedSizes ?? [size],
    })

    return View({
      ...viewProps,
      host: {
        updateConfig: async () => {},
        removeInstance: async () => {},
        requestResize: async () => {},
        openModal: () => {},
        closeModal: () => {},
        openExpand: () => {},
        showToast: () => {},
        openExternal: async () => false,
      },
    })
  }

  return {
    addWidgetModal: {
      open: overlays.addWidgetOpen(),
      availableWidgets,
      renderWidgetIcon: renderWorkbenchWidgetIcon,
      renderWidgetPreview,
      ...(overlays.addWidgetContext()?.activeGroupLabel
        ? { activeGroupLabel: overlays.addWidgetContext()!.activeGroupLabel }
        : {}),
      ...(tShell ? { tShell } : {}),
      onAdd: (pluginId: string, widgetId: string, size?: WidgetSize) => {
        const context = overlays.addWidgetContext()
        void widgetController.addWidget(pluginId, widgetId, size).then((instance) => {
          if (instance) context?.onAdded?.(instance)
        })
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
