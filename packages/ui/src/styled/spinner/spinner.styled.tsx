import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Spinner as SpinnerPrimitive } from "../../primitives/spinner/spinner"
import type { SpinnerProps } from "../../primitives/spinner/spinner"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const spin = stylex.keyframes({
  to: {
    transform: "rotate(360deg)",
  },
})

const styles = stylex.create({
  root: {
    animationDuration: "0.6s",
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
    borderColor: "rgb(var(--tbr-color-line))",
    borderStyle: "solid",
    borderTopColor: "rgb(var(--tbr-color-accent))",
    borderWidth: 1.5,
    height: 14,
    width: 14,
  },
  md: {
    borderColor: "rgb(var(--tbr-color-line))",
    borderStyle: "solid",
    borderTopColor: "rgb(var(--tbr-color-accent))",
    borderWidth: 2,
    height: 20,
    width: 20,
  },
  lg: {
    borderColor: "rgb(var(--tbr-color-line))",
    borderStyle: "solid",
    borderTopColor: "rgb(var(--tbr-color-accent))",
    borderWidth: 3,
    height: 28,
    width: 28,
  },
})

export type StyledSpinnerProps = SpinnerProps & {
  xstyle?: StyleXStyles
}

export function Spinner(props: StyledSpinnerProps) {
  const compiled = () =>
    stylex.props(
      styles.root,
      props.size === "sm" && styles.sm,
      (!props.size || props.size === "md") && styles.md,
      props.size === "lg" && styles.lg,
      props.xstyle,
    )

  return (
    <SpinnerPrimitive
      {...props}
      class={joinClassNames(compiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(compiled().style), props.style)}
    />
  )
}

export type { StyledSpinnerProps as SpinnerProps }
