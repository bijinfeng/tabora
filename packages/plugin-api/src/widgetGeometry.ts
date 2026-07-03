import type { WidgetSize } from "./manifest"

export type WidgetGridSpan = {
  colSpan: number
  rowSpan: number
}

export const WIDGET_GRID_GEOMETRY: Record<WidgetSize, WidgetGridSpan> = {
  S: { colSpan: 3, rowSpan: 1 }, // 3/16 列 (约 3/16 宽)，3:2 比例
  M: { colSpan: 4, rowSpan: 1 }, // 4/16 列 (1/4 宽)，16:10 比例
  L: { colSpan: 6, rowSpan: 1 }, // 6/16 列 (3/8 宽)，16:9 比例
  XL: { colSpan: 8, rowSpan: 1 }, // 8/16 列 (1/2 宽)，21:9 比例
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
