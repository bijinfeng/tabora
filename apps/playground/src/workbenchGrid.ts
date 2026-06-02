import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"

const SIZE_SPAN: Record<WidgetSize, number> = { S: 1, M: 2, L: 2, XL: 4 }

export function gridColumnSpan(size?: WidgetSize): number {
  return SIZE_SPAN[size ?? "M"] ?? 2
}

export function assignGridOrder(
  instances: PluginInstance[],
  updatedAt = new Date().toISOString(),
): PluginInstance[] {
  const regionIndex = new Map<string, number>()

  return instances.map((instance) => {
    if (instance.extensionPoint !== "widget") {
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
        rowSpan: 1,
      },
      updatedAt,
    }
  })
}
