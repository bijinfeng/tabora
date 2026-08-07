import { barY, defineChart } from "@tanstack/charts"
import { scaleBand } from "@tanstack/charts-scales/band"
import { scaleLinear } from "@tanstack/charts-scales/linear"
import { Chart } from "@tanstack/solid-charts"
import { createMemo } from "solid-js"

import { chartColor } from "./palette"

type Row = { type: string; count: number }

/** 同步记录按类型分布：垂直柱状图。 */
export function RecordTypesChart(props: { byType: Record<string, number> }) {
  const rows = createMemo<Row[]>(() =>
    Object.entries(props.byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
  )

  const definition = createMemo(() =>
    defineChart({
      marks: [
        barY(rows(), {
          x: "type",
          y: "count",
          fill: chartColor.accent,
          radius: 4,
        }),
      ],
      x: { scale: () => scaleBand<string>().padding(0.3) },
      y: { scale: scaleLinear, nice: true, grid: true },
    }),
  )

  return <Chart definition={definition()} height={240} ariaLabel="同步记录类型分布柱状图" />
}
