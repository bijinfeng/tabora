import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Divider as P } from "../../primitives/divider/divider"
import type { DividerProps } from "../../primitives/divider/divider"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    borderStyle: "none",
    borderWidth: 0,
    borderTopColor: "rgb(var(--tbr-color-line))",
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
  const compiled = () => stylex.props(styles.root, props.xstyle)

  return (
    <P
      {...props}
      class={joinClassNames(compiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(compiled().style), props.style)}
    />
  )
}
export type { StyledDividerProps as DividerProps }
