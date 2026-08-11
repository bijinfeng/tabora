import * as stylex from "@stylexjs/stylex"
import { createResource, Show } from "solid-js"
import { isServer } from "solid-js/web"
import { Button } from "@tabora/ui/button"

import { color, space } from "@tabora/theme/tokens.stylex"

const styles = stylex.create({
  pagination: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: space.s4,
    justifyContent: "space-between",
  },
  summary: {
    color: color.textMuted,
    fontSize: 12,
  },
  count: {
    color: color.text,
    fontVariantNumeric: "tabular-nums",
  },
  fallback: {
    alignItems: "center",
    display: "flex",
    gap: space.s4,
  },
})

type PaginationProps = {
  offset: number
  pageSize: number
  total: number
  onPrev: () => void
  onNext: () => void
}

/**
 * 列表页分页条：左侧区间摘要 + 右侧分页器。
 * SSR 渲染简单的 prev/next 按钮，客户端动态加载完整的页码分页器。
 */
export function Pagination(props: PaginationProps) {
  const from = () => (props.total === 0 ? 0 : props.offset + 1)
  const to = () => Math.min(props.offset + props.pageSize, props.total)
  const pageCount = () => Math.max(1, Math.ceil(props.total / props.pageSize))
  const currentPage = () => Math.floor(props.offset / props.pageSize) + 1

  const handleChange = (nextPage: number) => {
    const delta = nextPage - currentPage()
    const step = delta > 0 ? props.onNext : props.onPrev
    for (let i = 0; i < Math.abs(delta); i += 1) step()
  }

  // 客户端动态加载 UiPagination，SSR 时不执行
  const [uiPagination] = createResource(
    () => !isServer,
    async () => {
      const mod = await import("@tabora/ui/pagination")
      return mod.Pagination
    },
  )

  const prevNextButtons = () => (
    <div {...stylex.attrs(styles.fallback)}>
      <Button size="sm" variant="secondary" disabled={props.offset === 0} onClick={props.onPrev}>
        上一页
      </Button>
      <Button size="sm" variant="secondary" disabled={to() >= props.total} onClick={props.onNext}>
        下一页
      </Button>
    </div>
  )

  return (
    <div {...stylex.attrs(styles.pagination)}>
      <span {...stylex.attrs(styles.summary)}>
        第 <span {...stylex.attrs(styles.count)}>{from()}</span>–
        <span {...stylex.attrs(styles.count)}>{to()}</span> 条 / 共{" "}
        <span {...stylex.attrs(styles.count)}>{props.total}</span> 条
      </span>
      <Show when={uiPagination()} fallback={prevNextButtons()}>
        {(UiPag) => {
          const Comp = UiPag()
          return <Comp page={currentPage()} total={pageCount()} onChange={handleChange} />
        }}
      </Show>
    </div>
  )
}
