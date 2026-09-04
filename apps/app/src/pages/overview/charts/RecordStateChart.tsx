import { barX, defineChart, stack } from "@tanstack/charts"
import { scaleBand } from "@tanstack/charts-scales/band"
import { scaleLinear } from "@tanstack/charts-scales/linear"
import { createMemo, createSignal, onMount, Show } from "solid-js"
import { Dynamic } from "solid-js/web"

import { chartColor } from "./palette"

type Row = { group: string; state: string; count: number }
type SolidChart = typeof import("@tanstack/solid-charts").Chart

/** 活跃 vs 已删除（tombstone）占比：单条水平堆叠条。 */
export function RecordStateChart(props: { total: number; tombstones: number }) {
  const [Chart, setChart] = createSignal<SolidChart>()
  const rows = createMemo<Row[]>(() => {
    const active = Math.max(0, props.total - props.tombstones)
    return [
      { group: "记录", state: "活跃", count: active },
      { group: "记录", state: "已删除", count: props.tombstones },
    ]
  })

  const definition = createMemo(() =>
    defineChart({
      marks: [
        barX(rows(), {
          x: "count",
          y: "group",
          color: "state",
          layout: stack(),
          radius: 4,
        }),
      ],
      x: { scale: scaleLinear, nice: true, grid: true },
      y: { scale: () => scaleBand<string>().padding(0.6), axis: false },
      color: {
        domain: ["活跃", "已删除"],
        range: [chartColor.accent, chartColor.subtle],
      },
    }),
  )

  onMount(async () => {
    const { Chart } = await import("@tanstack/solid-charts")
    setChart(() => Chart)
  })

  return (
    <Show when={Chart()}>
      {(ChartComponent) => (
        <Dynamic
          component={ChartComponent()}
          definition={definition()}
          height={120}
          ariaLabel="活跃与已删除记录占比条"
        />
      )}
    </Show>
  )
}
