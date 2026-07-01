import type { PluginInstance, WidgetContextMenuContribution, WidgetSize } from "@tabora/plugin-api"

export type ContextMenuItem = {
  id: string
  label: string
  isCurrent?: boolean
  danger?: boolean
  /** 右侧灰色提示文案，如展开卡片的「双击」 */
  hint?: string
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
  availableCommandIds?: string[] | Set<string>
  hasCommand?: (commandId: string) => boolean
  runCommand?: (commandId: string, context: { instance: PluginInstance }) => void
  hasInstanceSettings?: boolean
  onResize: (instanceId: string, size: WidgetSize) => void
  onExpand: (instanceId: string) => void
  onOpenSettings?: (instanceId: string) => void
  onRemove: (instanceId: string) => void
}

function pluginContextMenuItems(
  instance: PluginInstance,
  contextMenus: WidgetContextMenuContribution[],
  hasCommand: (commandId: string) => boolean,
  runCommand: ((commandId: string, context: { instance: PluginInstance }) => void) | undefined,
): ContextMenuItem[] {
  if (!runCommand) return []

  return [...contextMenus]
    .sort(
      (left, right) =>
        (left.order ?? 0) - (right.order ?? 0) || left.label.localeCompare(right.label),
    )
    .flatMap((item) => {
      const commandId = item.commandId
      if (!commandId) return []
      if (!hasCommand(commandId)) return []

      const menuItem: ContextMenuItem = {
        id: item.id,
        label: item.label,
        run: () => runCommand(commandId, { instance }),
      }
      if (item.danger) menuItem.danger = true

      return [menuItem]
    })
}

function createCommandResolver(
  options: WidgetContextMenuModelOptions,
): (commandId: string) => boolean {
  if (options.hasCommand) return options.hasCommand
  if (!options.availableCommandIds) return () => false
  const availableCommandIds =
    options.availableCommandIds instanceof Set
      ? options.availableCommandIds
      : new Set(options.availableCommandIds)
  return (commandId) => availableCommandIds.has(commandId)
}

export function createWidgetContextMenuModel(
  options: WidgetContextMenuModelOptions,
): WidgetContextMenuModel {
  const instanceId = options.instance.id
  const currentSize = options.instance.size
  const pluginItems = pluginContextMenuItems(
    options.instance,
    options.contextMenus ?? [],
    createCommandResolver(options),
    options.runCommand,
  )
  const settingsSection =
    options.hasInstanceSettings && options.onOpenSettings
      ? [
          {
            id: "settings",
            items: [
              {
                id: "settings",
                label: "实例设置",
                run: () => options.onOpenSettings?.(instanceId),
              },
            ],
          },
        ]
      : []

  return {
    instanceId,
    sections: [
      {
        id: "expand",
        items: [
          {
            id: "expand",
            label: "展开卡片",
            hint: "双击",
            run: () => options.onExpand(instanceId),
          },
        ],
      },
      {
        id: "size",
        items: options.supportedSizes.map((size) => ({
          id: `size-${size}`,
          label: `尺寸 ${size}`,
          isCurrent: currentSize === size,
          run: () => options.onResize(instanceId, size),
        })),
      },
      ...(pluginItems.length > 0 ? [{ id: "plugin", items: pluginItems }] : []),
      ...settingsSection,
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
