import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { Link as P } from "../../primitives/link/link"
import type { LinkProps } from "../../primitives/link/link"

const styles = stylex.create({
  root: {
    color: color.accent,
    cursor: "pointer",
    fontWeight: font.medium,
    textDecoration: "none",
    transitionDuration: motion.fast,
    transitionProperty: "color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      color: color.accentHover,
      textDecoration: "underline",
    },
    ":focus-visible": {
      borderRadius: radius.r1,
      outline: `2px solid ${color.focus}`,
      outlineOffset: 2,
    },
  },
  muted: {
    color: color.textMuted,
    ":hover": {
      color: color.text,
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
