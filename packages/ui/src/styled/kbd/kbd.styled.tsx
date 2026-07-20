import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Kbd as P } from "../../primitives/kbd/kbd"
import type { KbdProps } from "../../primitives/kbd/kbd"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: 4,
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: 10,
    fontWeight: 500,
    height: 20,
    paddingBlock: 0,
    paddingInline: 6,
  },
})

export type StyledKbdProps = KbdProps & {
  xstyle?: StyleXStyles
}

export function Kbd(props: StyledKbdProps) {
  const compiled = () => stylex.props(styles.root, props.xstyle)

  return (
    <P
      {...props}
      class={joinClassNames(compiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(compiled().style), props.style)}
    />
  )
}
export type { StyledKbdProps as KbdProps }
