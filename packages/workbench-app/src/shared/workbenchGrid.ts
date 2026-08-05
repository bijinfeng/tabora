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

// 把网格行高同步为单列宽度，使每个单元格为正方，1x1/2x1/2x2/4x2 呈现真实比例。
export function syncSquareGridUnit(grid: HTMLElement): void {
  const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean)
  if (cols.length <= 1) {
    grid.style.removeProperty("--tbr-grid-unit")
    return
  }
  const colWidth = Number.parseFloat(cols[0]!)
  if (Number.isFinite(colWidth) && colWidth > 0) {
    grid.style.setProperty("--tbr-grid-unit", `${colWidth}px`)
  }
}

// 在元素挂载时监听尺寸变化并保持正方单元；返回清理函数。
export function observeSquareGridUnit(grid: HTMLElement): () => void {
  if (typeof ResizeObserver === "undefined") {
    syncSquareGridUnit(grid)
    return () => {}
  }
  const observer = new ResizeObserver(() => syncSquareGridUnit(grid))
  observer.observe(grid)
  syncSquareGridUnit(grid)
  return () => observer.disconnect()
}

export function assignGridOrder(
  instances: PluginInstance[],
  updatedAt = new Date().toISOString(),
): PluginInstance[] {
  const regionCounters = new Map<string, number>()
  for (const instance of instances) {
    if (instance.contribution.kind !== "widget" || !instance.size) continue
    const next = instance.grid ? instance.grid.x + 1 : 0
    regionCounters.set(
      instance.regionId,
      Math.max(regionCounters.get(instance.regionId) ?? 0, next),
    )
  }

  return instances.map((instance) => {
    if (instance.contribution.kind !== "widget" || !instance.size) {
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
