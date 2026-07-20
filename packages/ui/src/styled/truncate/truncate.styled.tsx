import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Truncate as P } from "../../primitives/truncate/truncate"
import type { TruncateProps } from "../../primitives/truncate/truncate"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    minWidth: 0,
  },
})

export type StyledTruncateProps = TruncateProps & {
  xstyle?: StyleXStyles
}

export function Truncate(props: StyledTruncateProps) {
  const compiled = () => stylex.attrs(styles.root, props.xstyle)

  return <P {...props} class={joinClassNames(compiled().class, props.class)} style={props.style} />
}

export type { StyledTruncateProps as TruncateProps }
