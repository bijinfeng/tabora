import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color } from "@tabora/theme/tokens.stylex"
import { Spinner as SpinnerPrimitive } from "../../primitives/spinner/spinner"
import type { SpinnerProps } from "../../primitives/spinner/spinner"

const spin = stylex.keyframes({
  to: {
    transform: "rotate(360deg)",
  },
})

const styles = stylex.create({
  root: {
    animationDuration: "600ms",
    animationIterationCount: "infinite",
    animationName: spin,
    animationTimingFunction: "linear",
    borderRadius: "50%",
    display: "inline-block",
    "@media (prefers-reduced-motion: reduce)": {
      animationName: "none",
      opacity: 0.5,
    },
  },
  sm: {
    borderColor: color.line,
    borderStyle: "solid",
    borderTopColor: color.accent,
    borderWidth: 1.5,
    height: 14,
    width: 14,
  },
  md: {
    borderColor: color.line,
    borderStyle: "solid",
    borderTopColor: color.accent,
    borderWidth: 2,
    height: 20,
    width: 20,
  },
  lg: {
    borderColor: color.line,
    borderStyle: "solid",
    borderTopColor: color.accent,
    borderWidth: 3,
    height: 28,
    width: 28,
  },
})

export type StyledSpinnerProps = Omit<SpinnerProps, "attrs" | "class" | "style"> & {
  xstyle?: StyleXStyles
}

export function Spinner(props: StyledSpinnerProps) {
  const attrs = () =>
    stylex.attrs(
      styles.root,
      props.size === "sm" && styles.sm,
      (!props.size || props.size === "md") && styles.md,
      props.size === "lg" && styles.lg,
      props.xstyle,
    )

  return <SpinnerPrimitive {...props} attrs={attrs()} />
}

export type { StyledSpinnerProps as SpinnerProps }
