import type { WidgetSize } from "./manifest"

export type WidgetGridSpan = {
  colSpan: number
  rowSpan: number
}

export const WIDGET_GRID_GEOMETRY: Record<WidgetSize, WidgetGridSpan> = {
  S: { colSpan: 1, rowSpan: 1 },
  M: { colSpan: 2, rowSpan: 1 },
  L: { colSpan: 2, rowSpan: 2 },
  XL: { colSpan: 2, rowSpan: 2 },
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
