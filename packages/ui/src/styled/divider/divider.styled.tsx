import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color } from "@tabora/theme/tokens.stylex"
import { Divider as P } from "../../primitives/divider/divider"
import type { DividerProps } from "../../primitives/divider/divider"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    borderStyle: "none",
    borderWidth: 0,
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    marginBlock: 12,
    marginInline: 0,
  },
})

export type StyledDividerProps = DividerProps & {
  xstyle?: StyleXStyles
}

export function Divider(props: StyledDividerProps) {
  const compiled = () => stylex.attrs(styles.root, props.xstyle)

  return <P {...props} class={joinClassNames(compiled().class, props.class)} style={props.style} />
}
export type { StyledDividerProps as DividerProps }
