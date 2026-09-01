import type { WidgetSize } from "./manifest"

// Dashboard 用 10 列逻辑网格，行高由布局 view 按单列宽度同步（见 dashboard-layout.tsx），
// 使 S 恒为正方形，其它尺寸由列/行跨度组合得到。尺寸只表达跨度，卡片外壳不再用
// aspect-ratio 控制高度，插件按宿主给定内容区适配。XL 占 4/10 宽以便并排多张宽卡。
// 这是插件开发者可依赖的固定语义跨度，改动会影响所有官方与第三方 widget 布局。
export type WidgetGridSpan = {
  colSpan: number
  rowSpan: number
}

export const WIDGET_GRID_GEOMETRY: Record<WidgetSize, WidgetGridSpan> = {
  S: { colSpan: 1, rowSpan: 1 }, // 1x1 纯展示：时钟、天气、小数据
  M: { colSpan: 2, rowSpan: 1 }, // 2x1 轻交互：快捷链接、开关
  L: { colSpan: 2, rowSpan: 2 }, // 2x2 中等交互：待办、便签
  XL: { colSpan: 4, rowSpan: 2 }, // 4x2 丰富交互：复杂表单、图表
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
