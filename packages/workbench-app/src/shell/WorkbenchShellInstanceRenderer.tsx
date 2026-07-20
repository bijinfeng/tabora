import * as stylex from "@stylexjs/stylex"
import type { JSX } from "solid-js"
import { createComponent } from "solid-js"
import { useSortable } from "@dnd-kit/solid/sortable"
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
import type { ContextMenuItem } from "@tabora/ui"

import type { InstanceRenderer } from "../layout/layoutEngine"
import { isWorkbenchInteractiveElement } from "../surface/WorkbenchShellInteractions"
import { resolveWorkbenchView } from "../shared/WorkbenchShellViewBridge"
import type { WidgetRenderModel } from "../shared/shellHelpers"
import type {
  ShellTranslation,
  WorkbenchShellPluginViewBoundaryCopy,
  WorkbenchShellWidgetCopy,
} from "../i18n"
import { color } from "../stylexTokens.stylex"

type WorkbenchSortableCollisionDetector = NonNullable<
  Parameters<typeof useSortable>[0]["collisionDetector"]
>

const pointerIntersectionCollisionType = 2
const highCollisionPriority = 3

type WidgetContributionLike = {
  views: { card: string }
}

type ViewRegistry = Pick<Map<string, unknown>, "has" | "get">

type SearchContributionLike = {
  id: string
  title: string
  view: string
}

const styles = stylex.create({
  empty: {
    color: color.textMuted,
    fontSize: 13,
    paddingBlock: 24,
    paddingInline: 20,
    textAlign: "center",
  },
})

export function createWorkbenchInstanceRenderer(options: {
  registryViews: ViewRegistry
  tShell?: ShellTranslation
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
  onOpenWidgetExpand: (instance: PluginInstance) => void
  onOpenWidgetContextMenu: (event: MouseEvent, instanceId: string) => void
  buildContextMenuItems?: (instanceId: string) => {
    items: ContextMenuItem[]
    onSelect: (key: string) => void
  }
  onChangeWidgetSize: (instanceId: string, size: WidgetSize) => void
  onRemoveWidget: (instanceId: string) => void
  isDragging: (instanceId: string) => boolean
  sortableIndex: (instanceId: string) => number
  widgetShellCopy?: WorkbenchShellWidgetCopy
  pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
}): InstanceRenderer {
  return {
    renderWidget(instance: PluginInstance) {
      const widget = options.widgetContribution(instance)
      const model = options.widgetRenderModel(instance)
      if (!model) {
        return (
          <div {...stylex.props(styles.empty)}>
            {options.tShell
              ? options.tShell("placeholders.widgetInstanceInvalid", { instanceId: instance.id })
              : `卡片实例无效：${instance.id}`}
          </div>
        )
      }

      const View = widget
        ? resolveWorkbenchView<WidgetViewProps>(options.registryViews, widget.views.card)
        : undefined
      if (!View) {
        return <div {...stylex.props(styles.empty)}>Widget view not available</div>
      }

      const menu = options.buildContextMenuItems?.(instance.id)

      return (
        <SortableWidgetCard
          instance={instance}
          title={model.title}
          icon={options.renderWidgetIcon(model.icon)}
          supportedSizes={model.supportedSizes}
          currentSize={model.currentSize}
          sortableIndex={() => options.sortableIndex(instance.id)}
          {...(options.widgetShellCopy ? { copy: options.widgetShellCopy } : {})}
          {...(menu ? { contextMenuItems: menu.items, onContextMenuSelect: menu.onSelect } : {})}
          callbacks={{
            onDblClick: (event: MouseEvent) => {
              const target = event.target as HTMLElement
              if (isWorkbenchInteractiveElement(target)) {
                return
              }
              options.onOpenWidgetExpand(instance)
            },
            onContextMenu: (event: MouseEvent) =>
              options.onOpenWidgetContextMenu(event, instance.id),
            onResize: (size: WidgetSize) => options.onChangeWidgetSize(instance.id, size),
            onRemove: () => options.onRemoveWidget(instance.id),
            onExpand: () => options.onOpenWidgetExpand(instance),
            isDragging: options.isDragging(instance.id),
          }}
        >
          <PluginViewBoundary
            instanceId={instance.id}
            title={model.title}
            {...(options.pluginViewBoundaryCopy ? { copy: options.pluginViewBoundaryCopy } : {})}
          >
            <div data-tabora-plugin-id={instance.pluginId}>
              {View(options.buildWidgetViewProps(instance, model))}
            </div>
          </PluginViewBoundary>
        </SortableWidgetCard>
      )
    },
    renderSearch(instance: PluginInstance) {
      const search = options.findSearchContribution(instance.pluginId, instance.contributionId)
      if (!search) {
        return (
          <div {...stylex.props(styles.empty)}>
            {options.tShell?.("placeholders.searchContributionMissing") ?? "搜索贡献未找到"}
          </div>
        )
      }

      const View = resolveWorkbenchView<SearchViewProps>(options.registryViews, search.view)
      if (!View) {
        return (
          <div {...stylex.props(styles.empty)}>
            {options.tShell
              ? options.tShell("placeholders.searchViewUnavailable", { id: search.id })
              : `搜索视图不可用：${search.id}`}
          </div>
        )
      }

      return (
        <PluginViewBoundary
          instanceId={instance.id}
          title={search.title}
          {...(options.pluginViewBoundaryCopy ? { copy: options.pluginViewBoundaryCopy } : {})}
        >
          <div data-tabora-plugin-id={instance.pluginId}>
            {createComponent(View, options.buildSearchViewProps(instance))}
          </div>
        </PluginViewBoundary>
      )
    },
  }
}

function SortableWidgetCard(props: {
  instance: PluginInstance
  title: string
  icon?: JSX.Element
  supportedSizes: WidgetSize[]
  currentSize: WidgetSize
  sortableIndex: () => number
  callbacks: WidgetHostCallbacks
  copy?: WorkbenchShellWidgetCopy
  contextMenuItems?: ContextMenuItem[]
  onContextMenuSelect?: (key: string) => void
  children: JSX.Element
}) {
  const sortable = useSortable({
    id: props.instance.id,
    get index() {
      return props.sortableIndex()
    },
    group: props.instance.regionId,
    collisionDetector: workbenchSortableCollisionDetector,
    transition: { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  })

  return (
    <WidgetCardShell
      instance={props.instance}
      title={props.title}
      icon={props.icon}
      supportedSizes={props.supportedSizes}
      currentSize={props.currentSize}
      {...(props.copy ? { copy: props.copy } : {})}
      {...(props.contextMenuItems ? { contextMenuItems: props.contextMenuItems } : {})}
      {...(props.onContextMenuSelect ? { onContextMenuSelect: props.onContextMenuSelect } : {})}
      callbacks={{
        ...props.callbacks,
        isDragging: props.callbacks.isDragging || sortable.isDragging(),
        bindSortableRoot: (element) => sortable.ref(element),
        bindSortableHandle: (element) => sortable.handleRef(element),
      }}
    >
      {props.children}
    </WidgetCardShell>
  )
}

export const workbenchSortableCollisionDetector: WorkbenchSortableCollisionDetector = (input) => {
  const pointer = input.dragOperation.position.current
  const shape = input.droppable.shape
  if (!pointer || !shape) return null

  const rect = shape.boundingRectangle
  const inset = Math.min(28, rect.width * 0.18, rect.height * 0.18)
  if (
    pointer.x < rect.left + inset ||
    pointer.x > rect.right - inset ||
    pointer.y < rect.top + inset ||
    pointer.y > rect.bottom - inset
  ) {
    return null
  }

  const distance = Math.hypot(pointer.x - shape.center.x, pointer.y - shape.center.y)
  return {
    id: input.droppable.id,
    value: 1 / Math.max(distance, 1),
    type: pointerIntersectionCollisionType,
    priority: highCollisionPriority,
  }
}
