/**
 * 图表配色统一走主题 CSS 变量，随明暗主题自动切换。
 * SVG fill 接受 `rgb(var(--x))` 字符串，在渲染时解析。
 */
export const chartColor = {
  accent: "rgb(var(--tbr-color-accent))",
  success: "rgb(var(--tbr-color-success))",
  warning: "rgb(var(--tbr-color-warning))",
  danger: "rgb(var(--tbr-color-danger))",
  info: "rgb(var(--tbr-color-info))",
  subtle: "rgb(var(--tbr-color-text-subtle))",
} as const
