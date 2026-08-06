import * as stylex from "@stylexjs/stylex"
import { EmptyState } from "@tabora/ui/empty-state"

import { space } from "@tabora/theme/tokens.stylex"

const styles = stylex.create({
  wrap: {
    display: "flex",
    justifyContent: "center",
    paddingBlock: space.s8,
  },
})

type PlaceholderPageProps = {
  title: string
  description: string
}

/** 未实现模块的占位视图，统一走 @tabora/ui EmptyState。 */
export function PlaceholderPage(props: PlaceholderPageProps) {
  return (
    <div {...stylex.attrs(styles.wrap)}>
      <EmptyState title={props.title} description={props.description} />
    </div>
  )
}
