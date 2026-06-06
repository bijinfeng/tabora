import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"

const SIZE_SPAN: Record<WidgetSize, number> = { S: 1, M: 2, L: 2, XL: 2 }
const SIZE_ROW_SPAN: Record<WidgetSize, number> = { S: 1, M: 1, L: 2, XL: 2 }

export function gridColumnSpan(size: WidgetSize): number {
  return SIZE_SPAN[size]
}

export function gridRowSpan(size: WidgetSize): number {
  return SIZE_ROW_SPAN[size]
}

export function assignGridOrder(
  instances: PluginInstance[],
  updatedAt = new Date().toISOString(),
): PluginInstance[] {
  const regionIndex = new Map<string, number>()

  return instances.map((instance) => {
    if (instance.extensionPoint !== "widget" || !instance.size) {
      return instance
    }

    const x = regionIndex.get(instance.regionId) ?? 0
    regionIndex.set(instance.regionId, x + 1)

    return {
      ...instance,
      grid: {
        x,
        y: 0,
        colSpan: gridColumnSpan(instance.size),
        rowSpan: gridRowSpan(instance.size),
      },
      updatedAt,
    }
  })
}
