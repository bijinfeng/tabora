import { groupBy } from "es-toolkit/array"
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
  const widgetsByRegion = groupBy(
    instances.filter((i) => i.extensionPoint === "widget" && i.size),
    (i) => i.regionId,
  )
  const regionCounters = new Map(Object.keys(widgetsByRegion).map((regionId) => [regionId, 0]))

  return instances.map((instance) => {
    if (instance.extensionPoint !== "widget" || !instance.size) {
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
