import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { InlineError as Primitive } from "../../primitives/inlineError/inlineError"
import type { InlineErrorProps } from "../../primitives/inlineError/inlineError"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-danger) / 0.05)",
    borderColor: "rgb(var(--tbr-color-danger) / 0.25)",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-danger))",
    display: "flex",
    fontSize: 11,
    gap: 6,
    paddingBlock: 6,
    paddingInline: 10,
  },
})

export type StyledInlineErrorProps = Omit<InlineErrorProps, "attrs" | "class" | "style"> & {
  xstyle?: StyleXStyles
}

export function InlineError(props: StyledInlineErrorProps) {
  const attrs = () => stylex.attrs(styles.root, props.xstyle)

  return <Primitive {...props} attrs={attrs()} />
}

export type { StyledInlineErrorProps as InlineErrorProps }
