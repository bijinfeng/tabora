import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"

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
  onResize: (instanceId: string, size: WidgetSize) => void
  onExpand: (instanceId: string) => void
  onRemove: (instanceId: string) => void
}

export function createWidgetContextMenuModel(
  options: WidgetContextMenuModelOptions,
): WidgetContextMenuModel {
  const instanceId = options.instance.id
  const currentSize = options.instance.size ?? "M"

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
