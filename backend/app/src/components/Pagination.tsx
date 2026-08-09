import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"

import { space } from "@tabora/theme/tokens.stylex"

const styles = stylex.create({
  pagination: {
    alignItems: "center",
    display: "flex",
    gap: space.s4,
    justifyContent: "flex-end",
    paddingBlock: space.s4,
  },
})

type PaginationProps = {
  offset: number
  pageSize: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function Pagination(props: PaginationProps) {
  const from = () => (props.total === 0 ? 0 : props.offset + 1)
  const to = () => Math.min(props.offset + props.pageSize, props.total)

  return (
    <div {...stylex.attrs(styles.pagination)}>
      <span>
        {from()}–{to()} / 共 {props.total}
      </span>
      <Button size="sm" variant="secondary" disabled={props.offset === 0} onClick={props.onPrev}>
        上一页
      </Button>
      <Button size="sm" variant="secondary" disabled={to() >= props.total} onClick={props.onNext}>
        下一页
      </Button>
    </div>
  )
}
