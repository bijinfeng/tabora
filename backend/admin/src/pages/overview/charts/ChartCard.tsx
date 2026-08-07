import * as stylex from "@stylexjs/stylex"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { type JSX, Show } from "solid-js"

import { chartStyles } from "./charts.styles"

type Props = {
  title: string
  /** 是否有数据可绘制；false 时展示空态。 */
  hasData: boolean
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
  /** 图例等标题右侧内容。 */
  aside?: JSX.Element
  children: JSX.Element
}

/** 概览页图表统一外壳：标题 + 加载/空/错误态。 */
export function ChartCard(props: Props) {
  return (
    <div {...stylex.attrs(chartStyles.card)}>
      <div {...stylex.attrs(chartStyles.cardHead)}>
        <span {...stylex.attrs(chartStyles.cardTitle)}>{props.title}</span>
        <Show when={props.aside}>{props.aside}</Show>
      </div>
      <Show when={!props.error} fallback={<InlineError>{props.error}</InlineError>}>
        <Show
          when={props.loading}
          fallback={
            <Show
              when={props.hasData}
              fallback={
                <EmptyState
                  title={props.emptyTitle ?? "暂无数据"}
                  description={props.emptyDescription ?? "有数据后将在此渲染图表。"}
                />
              }
            >
              <div {...stylex.attrs(chartStyles.canvas)}>{props.children}</div>
            </Show>
          }
        >
          <div {...stylex.attrs(chartStyles.loading)}>加载中…</div>
        </Show>
      </Show>
    </div>
  )
}
