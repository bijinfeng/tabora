import type { WidgetSize } from "./manifest"

export type WidgetGridSpan = {
  colSpan: number
  rowSpan: number
}

export const WIDGET_GRID_GEOMETRY: Record<WidgetSize, WidgetGridSpan> = {
  S: { colSpan: 1, rowSpan: 1 }, // 1x1 正方
  M: { colSpan: 2, rowSpan: 1 }, // 2x1
  L: { colSpan: 2, rowSpan: 2 }, // 2x2
  XL: { colSpan: 4, rowSpan: 2 }, // 4x2
}

export function widgetGridSpan(size: WidgetSize): WidgetGridSpan {
  return WIDGET_GRID_GEOMETRY[size]
}

export function widgetGridColumnSpan(size: WidgetSize): number {
  return widgetGridSpan(size).colSpan
}

export function widgetGridRowSpan(size: WidgetSize): number {
  return widgetGridSpan(size).rowSpan
}
