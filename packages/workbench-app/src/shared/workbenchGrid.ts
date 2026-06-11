import {
  widgetGridColumnSpan,
  widgetGridRowSpan,
  type PluginInstance,
  type WidgetSize,
} from "@tabora/plugin-api"

export function gridColumnSpan(size: WidgetSize): number {
  return widgetGridColumnSpan(size)
}

export function gridRowSpan(size: WidgetSize): number {
  return widgetGridRowSpan(size)
}

export function assignGridOrder(
  instances: PluginInstance[],
  updatedAt = new Date().toISOString(),
): PluginInstance[] {
  const regionCounters = new Map<string, number>()
  for (const instance of instances) {
    if (instance.extensionPoint !== "widget" || !instance.size) continue
    const next = instance.grid ? instance.grid.x + 1 : 0
    regionCounters.set(
      instance.regionId,
      Math.max(regionCounters.get(instance.regionId) ?? 0, next),
    )
  }

  return instances.map((instance) => {
    if (instance.extensionPoint !== "widget" || !instance.size) {
      return instance
    }
    if (instance.grid) {
      return instance
    }

    const x = regionCounters.get(instance.regionId) ?? 0
    regionCounters.set(instance.regionId, x + 1)

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
