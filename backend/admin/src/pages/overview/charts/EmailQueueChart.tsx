import { barY, defineChart } from "@tanstack/charts"
import { scaleBand } from "@tanstack/charts-scales/band"
import { scaleLinear } from "@tanstack/charts-scales/linear"
import { Chart } from "@tanstack/solid-charts"
import { createMemo } from "solid-js"

import { chartColor } from "./palette"

type Row = { status: string; count: number; color: string }

type EmailQueue = {
  pending: number
  active: number
  completed: number
  failed: number
}

/** 邮件队列各状态计数：垂直柱状图，按状态着色。 */
export function EmailQueueChart(props: { queue: EmailQueue }) {
  const rows = createMemo<Row[]>(() => [
    { status: "待发", count: props.queue.pending, color: chartColor.warning },
    { status: "发送中", count: props.queue.active, color: chartColor.info },
    { status: "已完成", count: props.queue.completed, color: chartColor.success },
    { status: "失败", count: props.queue.failed, color: chartColor.danger },
  ])

  const definition = createMemo(() =>
    defineChart({
      marks: [
        barY(rows(), {
          x: "status",
          y: "count",
          fill: (row: Row) => row.color,
          radius: 4,
        }),
      ],
      x: { scale: () => scaleBand<string>().padding(0.3) },
      y: { scale: scaleLinear, nice: true, grid: true },
    }),
  )

  return <Chart definition={definition()} height={240} ariaLabel="邮件队列状态柱状图" />
}
