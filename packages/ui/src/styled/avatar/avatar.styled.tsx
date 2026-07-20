import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Avatar as P } from "../../primitives/avatar/avatar"
import type { AvatarProps } from "../../primitives/avatar/avatar"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    flexShrink: 0,
    fontWeight: 650,
    justifyContent: "center",
    overflow: "hidden",
  },
  sm: {
    fontSize: 10,
    height: 24,
    width: 24,
  },
  md: {
    fontSize: 12,
    height: 32,
    width: 32,
  },
  lg: {
    fontSize: 14,
    height: 40,
    width: 40,
  },
  xl: {
    fontSize: 18,
    height: 56,
    width: 56,
  },
  img: {
    height: "100%",
    objectFit: "cover",
    width: "100%",
  },
})

export type StyledAvatarProps = Omit<
  AvatarProps,
  | "attrs"
  | "class"
  | "style"
  | "imgAttrs"
  | "imgClass"
  | "imgStyle"
  | "fallbackAttrs"
  | "fallbackClass"
  | "fallbackStyle"
> & {
  xstyle?: StyleXStyles
}

export function Avatar(props: StyledAvatarProps) {
  const rootAttrs = () =>
    stylex.attrs(
      styles.root,
      props.size === "sm" && styles.sm,
      (!props.size || props.size === "md") && styles.md,
      props.size === "lg" && styles.lg,
      props.size === "xl" && styles.xl,
      props.xstyle,
    )
  const imgAttrs = () => stylex.attrs(styles.img)

  return <P {...props} attrs={rootAttrs()} imgAttrs={imgAttrs()} />
}
export type { StyledAvatarProps as AvatarProps }
