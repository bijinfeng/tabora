import { barY, defineChart } from "@tanstack/charts"
import { scaleBand } from "@tanstack/charts-scales/band"
import { scaleLinear } from "@tanstack/charts-scales/linear"
import { Chart } from "@tanstack/solid-charts"
import { createMemo } from "solid-js"

export type BarDatum = { label: string; value: number; color?: string }

/** 通用垂直柱状图：类别在 x 轴，计数在 y 轴，支持常量或按行着色。 */
export function BarChart(props: {
  rows: BarDatum[]
  fill: string | ((row: BarDatum) => string)
  ariaLabel: string
  height?: number
}) {
  const definition = createMemo(() =>
    defineChart({
      marks: [barY(props.rows, { x: "label", y: "value", fill: props.fill, radius: 4 })],
      x: { scale: () => scaleBand<string>().padding(0.3) },
      y: { scale: scaleLinear, nice: true, grid: true },
    }),
  )

  return (
    <Chart definition={definition()} height={props.height ?? 240} ariaLabel={props.ariaLabel} />
  )
}
