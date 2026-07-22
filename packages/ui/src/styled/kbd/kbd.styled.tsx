import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, radius } from "@tabora/theme/tokens.stylex"
import { Kbd as P } from "../../primitives/kbd/kbd"
import type { KbdProps } from "../../primitives/kbd/kbd"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: color.surfaceSoft,
    borderColor: color.line,
    borderRadius: radius.r1,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    display: "inline-flex",
    fontFamily: font.mono,
    fontSize: 10,
    fontWeight: font.medium,
    height: 20,
    paddingBlock: 0,
    paddingInline: 6,
  },
})

export type StyledKbdProps = Omit<KbdProps, "attrs" | "class" | "style"> & {
  xstyle?: StyleXStyles
}

export function Kbd(props: StyledKbdProps) {
  const attrs = () => stylex.attrs(styles.root, props.xstyle)

  return <P {...props} attrs={attrs()} />
}
export type { StyledKbdProps as KbdProps }
