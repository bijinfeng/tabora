import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"

const SIZE_SPAN: Record<WidgetSize, number> = { S: 1, M: 2, L: 2, XL: 4 }

export function gridColumnSpan(size?: WidgetSize): number {
  return SIZE_SPAN[size ?? "M"] ?? 2
}

export function assignGridOrder(
  instances: PluginInstance[],
  updatedAt = new Date().toISOString(),
): PluginInstance[] {
  return instances.map((instance, index) => ({
    ...instance,
    grid: {
      x: index,
      y: 0,
      colSpan: gridColumnSpan(instance.size),
      rowSpan: 1,
    },
    updatedAt,
  }))
}
