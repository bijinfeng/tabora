import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Progress as P } from "../../primitives/progress/progress"
import type { ProgressProps } from "../../primitives/progress/progress"
import { joinClassNames } from "../../stylex"

const indeterminateMotion = stylex.keyframes({
  "0%": {
    transform: "translateX(-100%)",
  },
  "100%": {
    transform: "translateX(350%)",
  },
})

const styles = stylex.create({
  linearRoot: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderRadius: 999,
    overflow: "hidden",
    width: "100%",
  },
  sm: {
    height: 4,
  },
  md: {
    height: 6,
  },
  lg: {
    height: 8,
  },
  track: {
    height: "100%",
    width: "100%",
  },
  fill: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    borderRadius: 999,
    height: "100%",
    transitionDuration: "300ms",
    transitionProperty: "width",
    transitionTimingFunction: "ease",
  },
  fillIndeterminate: {
    animationDuration: "1.5s",
    animationIterationCount: "infinite",
    animationName: indeterminateMotion,
    animationTimingFunction: "ease-in-out",
    width: "40%",
  },
  circularRoot: {
    display: "inline-flex",
    position: "relative",
  },
  circularSvg: {
    transform: "rotate(-90deg)",
  },
  circularBg: {
    fill: "none",
    stroke: "rgb(var(--tbr-color-surface-soft))",
    strokeWidth: 4,
  },
  circularFill: {
    fill: "none",
    stroke: "rgb(var(--tbr-color-accent))",
    strokeLinecap: "round",
    strokeWidth: 4,
    transitionDuration: "300ms",
    transitionProperty: "stroke-dashoffset",
    transitionTimingFunction: "ease",
  },
  circularText: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text))",
    display: "flex",
    fontSize: 11,
    fontWeight: 700,
    inset: 0,
    justifyContent: "center",
    position: "absolute",
  },
})

export type StyledProgressProps = ProgressProps & {
  xstyle?: StyleXStyles
}

export function Progress(props: StyledProgressProps) {
  const rootCompiled = () =>
    stylex.attrs(
      props.variant === "circular" && styles.circularRoot,
      props.variant !== "circular" && styles.linearRoot,
      props.variant !== "circular" && props.size === "sm" && styles.sm,
      props.variant !== "circular" && (!props.size || props.size === "md") && styles.md,
      props.variant !== "circular" && props.size === "lg" && styles.lg,
      props.xstyle,
    )
  const trackCompiled = () => stylex.attrs(styles.track)
  const fillCompiled = () =>
    stylex.attrs(styles.fill, props.indeterminate && styles.fillIndeterminate)
  const svgCompiled = () => stylex.attrs(styles.circularSvg)
  const circularBgCompiled = () => stylex.attrs(styles.circularBg)
  const circularFillCompiled = () => stylex.attrs(styles.circularFill)
  const circularTextCompiled = () => stylex.attrs(styles.circularText)

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      trackClass={joinClassNames(trackCompiled().class, props.trackClass)}
      trackStyle={props.trackStyle}
      fillClass={joinClassNames(fillCompiled().class, props.fillClass)}
      fillStyle={props.fillStyle}
      svgClass={joinClassNames(svgCompiled().class, props.svgClass)}
      svgStyle={props.svgStyle}
      circularBgClass={joinClassNames(circularBgCompiled().class, props.circularBgClass)}
      circularBgStyle={{ ...props.circularBgStyle }}
      circularFillClass={joinClassNames(circularFillCompiled().class, props.circularFillClass)}
      circularFillStyle={{ ...props.circularFillStyle }}
      circularTextClass={joinClassNames(circularTextCompiled().class, props.circularTextClass)}
      circularTextStyle={{ ...props.circularTextStyle }}
    />
  )
}
export type { StyledProgressProps as ProgressProps }
