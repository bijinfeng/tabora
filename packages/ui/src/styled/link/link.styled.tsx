import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Link as P } from "../../primitives/link/link"
import type { LinkProps } from "../../primitives/link/link"

const styles = stylex.create({
  root: {
    color: "rgb(var(--tbr-color-accent))",
    cursor: "pointer",
    fontWeight: 500,
    textDecoration: "none",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "color",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      color: "rgb(var(--tbr-color-accent-hover))",
      textDecoration: "underline",
    },
    ":focus-visible": {
      borderRadius: 2,
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
  },
  muted: {
    color: "rgb(var(--tbr-color-text-muted))",
    ":hover": {
      color: "rgb(var(--tbr-color-text))",
    },
  },
})

export type StyledLinkProps = Omit<LinkProps, "attrs" | "class" | "style"> & {
  xstyle?: StyleXStyles
}

export function Link(props: StyledLinkProps) {
  const attrs = () => stylex.attrs(styles.root, props.muted && styles.muted, props.xstyle)

  return <P {...props} attrs={attrs()} />
}
export type { StyledLinkProps as LinkProps }
