import type { PluginInstance, WidgetContextMenuContribution, WidgetSize } from "@tabora/plugin-api"
import type { CommandActionMap } from "./command-catalog"

export type ContextMenuItem = {
  id: string
  label: string
  isCurrent?: boolean
  danger?: boolean
  run: () => void
}

export type ContextMenuSection = {
  id: string
  items: ContextMenuItem[]
}

export type WidgetContextMenuModel = {
  instanceId: string
  sections: ContextMenuSection[]
}

export type WidgetContextMenuModelOptions = {
  instance: PluginInstance
  supportedSizes: WidgetSize[]
  contextMenus?: WidgetContextMenuContribution[]
  commandActions?: CommandActionMap
  onResize: (instanceId: string, size: WidgetSize) => void
  onExpand: (instanceId: string) => void
  onRemove: (instanceId: string) => void
}

function pluginContextMenuItems(
  contextMenus: WidgetContextMenuContribution[],
  commandActions: CommandActionMap,
): ContextMenuItem[] {
  return [...contextMenus]
    .sort(
      (left, right) =>
        (left.order ?? 0) - (right.order ?? 0) || left.label.localeCompare(right.label),
    )
    .flatMap((item) => {
      if (!item.commandId) return []
      const action = commandActions[item.commandId]
      if (!action) return []

      const menuItem: ContextMenuItem = {
        id: item.id,
        label: item.label,
        run: action,
      }
      if (item.danger) menuItem.danger = true

      return [menuItem]
    })
}

export function createWidgetContextMenuModel(
  options: WidgetContextMenuModelOptions,
): WidgetContextMenuModel {
  const instanceId = options.instance.id
  const currentSize = options.instance.size ?? "M"
  const pluginItems = pluginContextMenuItems(
    options.contextMenus ?? [],
    options.commandActions ?? {},
  )

  return {
    instanceId,
    sections: [
      {
        id: "size",
        items: options.supportedSizes.map((size) => ({
          id: `size-${size}`,
          label: `尺寸 ${size}`,
          isCurrent: currentSize === size,
          run: () => options.onResize(instanceId, size),
        })),
      },
      {
        id: "expand",
        items: [
          {
            id: "expand",
            label: "展开详情",
            run: () => options.onExpand(instanceId),
          },
        ],
      },
      ...(pluginItems.length > 0 ? [{ id: "plugin", items: pluginItems }] : []),
      {
        id: "remove",
        items: [
          {
            id: "remove",
            label: "移除实例",
            danger: true,
            run: () => options.onRemove(instanceId),
          },
        ],
      },
    ],
  }
}
