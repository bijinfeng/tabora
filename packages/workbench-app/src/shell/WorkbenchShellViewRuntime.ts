import type { PluginInstance, SearchViewProps } from "@tabora/plugin-api"

import { createWorkbenchInstanceRenderer } from "./WorkbenchShellInstanceRenderer"
import { buildWorkbenchWidgetViewProps } from "../shared/WorkbenchShellViewBridge"
import type { WorkbenchContextMenuState } from "./WorkbenchShellState"
import type { WidgetRenderModel } from "../shared/shellHelpers"

type BuildWidgetViewBaseOptions = Omit<
  Parameters<typeof buildWorkbenchWidgetViewProps>[0],
  "instance" | "model"
>

type InstanceRendererOptions = Omit<
  Parameters<typeof createWorkbenchInstanceRenderer>[0],
  | "buildWidgetViewProps"
  | "buildSearchViewProps"
  | "onOpenWidgetContextMenu"
  | "onChangeWidgetSize"
  | "onRemoveWidget"
  | "onOpenWidgetExpand"
>

export function createWorkbenchShellViewRuntime(
  options: InstanceRendererOptions &
    BuildWidgetViewBaseOptions & {
      buildInlineSearchViewProps: (instance: PluginInstance) => SearchViewProps
      setContextMenu: (menu: WorkbenchContextMenuState | null) => void
    },
) {
  const buildWidgetViewProps = (instance: PluginInstance, model: WidgetRenderModel) =>
    buildWorkbenchWidgetViewProps({
      instance,
      model,
      pluginDataRepo: options.pluginDataRepo,
      saveInstance: options.saveInstance,
      setInstances: options.setInstances,
      removeWidget: options.removeWidget,
      changeWidgetSize: options.changeWidgetSize,
      setModalViewId: options.setModalViewId,
      setModalProps: options.setModalProps,
      openWidgetExpand: options.openWidgetExpand,
      showToast: options.showToast,
      openExternalForPlugin: options.openExternalForPlugin,
    })

  const instanceRenderer = createWorkbenchInstanceRenderer({
    registryViews: options.registryViews,
    widgetContribution: options.widgetContribution,
    widgetRenderModel: options.widgetRenderModel,
    findSearchContribution: options.findSearchContribution,
    buildWidgetViewProps,
    buildSearchViewProps: options.buildInlineSearchViewProps,
    renderWidgetIcon: options.renderWidgetIcon,
    onOpenWidgetExpand: options.openWidgetExpand,
    onOpenWidgetContextMenu: (event, instanceId) => {
      event.preventDefault()
      options.setContextMenu({ x: event.clientX, y: event.clientY, instanceId })
    },
    onChangeWidgetSize: (instanceId, size) => {
      void options.changeWidgetSize(instanceId, size)
    },
    onRemoveWidget: (instanceId) => {
      void options.removeWidget(instanceId)
    },
    isDragging: options.isDragging,
    sortableIndex: options.sortableIndex,
    ...(options.widgetShellCopy ? { widgetShellCopy: options.widgetShellCopy } : {}),
    ...(options.pluginViewBoundaryCopy
      ? { pluginViewBoundaryCopy: options.pluginViewBoundaryCopy }
      : {}),
  })

  return {
    buildWidgetViewProps,
    instanceRenderer,
  }
}
