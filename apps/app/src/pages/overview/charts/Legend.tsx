import * as stylex from "@stylexjs/stylex"
import { For } from "solid-js"

import { chartStyles } from "./charts.styles"

type Item = { label: string; color: string }

/** 图表图例：色块 + 文案。 */
export function Legend(props: { items: Item[] }) {
  return (
    <div {...stylex.attrs(chartStyles.legend)}>
      <For each={props.items}>
        {(item) => (
          <span {...stylex.attrs(chartStyles.legendItem)}>
            <span
              {...stylex.attrs(chartStyles.legendSwatch)}
              style={{ "background-color": item.color }}
            />
            {item.label}
          </span>
        )}
      </For>
    </div>
  )
}
