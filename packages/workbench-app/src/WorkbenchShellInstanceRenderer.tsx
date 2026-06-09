import type { JSX } from "solid-js"
import type {
  PluginInstance,
  SearchViewProps,
  WidgetSize,
  WidgetViewProps,
} from "@tabora/plugin-api"
import {
  PluginViewBoundary,
  WidgetCardShell,
  type WidgetHostCallbacks,
} from "@tabora/workbench-shell"

import type { InstanceRenderer } from "./layoutEngine"
import { isWorkbenchInteractiveElement } from "./WorkbenchShellInteractions"
import { resolveWorkbenchView } from "./WorkbenchShellViewBridge"
import type { WidgetRenderModel } from "./shellHelpers"

type WidgetContributionLike = {
  views: { card: string }
}

type ViewRegistry = Pick<Map<string, unknown>, "has" | "get">

type SearchContributionLike = {
  id: string
  title: string
  view: string
}

export function createWorkbenchInstanceRenderer(options: {
  registryViews: ViewRegistry
  widgetContribution: (
    instance: Pick<PluginInstance, "pluginId" | "contributionId">,
  ) => WidgetContributionLike | null | undefined
  widgetRenderModel: (instance: PluginInstance) => WidgetRenderModel | null
  findSearchContribution: (
    pluginId: string,
    contributionId: string,
  ) => SearchContributionLike | undefined
  buildWidgetViewProps: (instance: PluginInstance, model: WidgetRenderModel) => WidgetViewProps
  buildSearchViewProps: (instance: PluginInstance) => SearchViewProps
  renderWidgetIcon: (icon?: string) => JSX.Element
  onPointerDown: (event: PointerEvent, instanceId: string) => void
  onPointerMove: (event: PointerEvent) => void
  onPointerUp: (event: PointerEvent) => void
  onPointerCancel: (event: PointerEvent) => void
  onOpenWidgetExpand: (instance: PluginInstance) => void
  onOpenWidgetContextMenu: (event: MouseEvent, instanceId: string) => void
  onChangeWidgetSize: (instanceId: string, size: WidgetSize) => void
  onRemoveWidget: (instanceId: string) => void
  isDragging: (instanceId: string) => boolean
}): InstanceRenderer {
  return {
    renderWidget(instance: PluginInstance) {
      const widget = options.widgetContribution(instance)
      const model = options.widgetRenderModel(instance)
      if (!model) {
        return <div class="settings-empty">卡片实例无效：{instance.id}</div>
      }

      const View = widget
        ? resolveWorkbenchView<WidgetViewProps>(options.registryViews, widget.views.card)
        : undefined
      if (!View) {
        return <div class="settings-empty">Widget view not available</div>
      }

      const hostCallbacks: WidgetHostCallbacks = {
        onPointerDown: (event: PointerEvent) => options.onPointerDown(event, instance.id),
        onPointerMove: options.onPointerMove,
        onPointerUp: options.onPointerUp,
        onPointerCancel: options.onPointerCancel,
        onDblClick: (event: MouseEvent) => {
          const target = event.target as HTMLElement
          if (isWorkbenchInteractiveElement(target)) {
            return
          }
          options.onOpenWidgetExpand(instance)
        },
        onContextMenu: (event: MouseEvent) => options.onOpenWidgetContextMenu(event, instance.id),
        onResize: (size: WidgetSize) => options.onChangeWidgetSize(instance.id, size),
        onRemove: () => options.onRemoveWidget(instance.id),
        onExpand: () => options.onOpenWidgetExpand(instance),
        isDragging: options.isDragging(instance.id),
      }

      return (
        <WidgetCardShell
          instance={instance}
          title={model.title}
          icon={options.renderWidgetIcon(model.icon)}
          supportedSizes={model.supportedSizes}
          currentSize={model.currentSize}
          callbacks={hostCallbacks}
        >
          <PluginViewBoundary instanceId={instance.id} title={model.title}>
            <div data-tabora-plugin-id={instance.pluginId}>
              {View(options.buildWidgetViewProps(instance, model))}
            </div>
          </PluginViewBoundary>
        </WidgetCardShell>
      )
    },
    renderSearch(instance: PluginInstance) {
      const search = options.findSearchContribution(instance.pluginId, instance.contributionId)
      if (!search) {
        return <div class="settings-empty">搜索贡献未找到</div>
      }

      const View = resolveWorkbenchView<SearchViewProps>(options.registryViews, search.view)
      if (!View) {
        return <div class="settings-empty">搜索视图不可用：{search.id}</div>
      }

      return (
        <PluginViewBoundary instanceId={instance.id} title={search.title}>
          <div data-tabora-plugin-id={instance.pluginId}>
            {View(options.buildSearchViewProps(instance))}
          </div>
        </PluginViewBoundary>
      )
    },
  }
}
