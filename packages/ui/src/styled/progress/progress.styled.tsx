import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Progress as P } from "../../primitives/progress/progress"
import type { ProgressProps } from "../../primitives/progress/progress"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

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
    stylex.props(
      props.variant === "circular" && styles.circularRoot,
      props.variant !== "circular" && styles.linearRoot,
      props.variant !== "circular" && props.size === "sm" && styles.sm,
      props.variant !== "circular" && (!props.size || props.size === "md") && styles.md,
      props.variant !== "circular" && props.size === "lg" && styles.lg,
      props.xstyle,
    )
  const trackCompiled = () => stylex.props(styles.track)
  const fillCompiled = () =>
    stylex.props(styles.fill, props.indeterminate && styles.fillIndeterminate)
  const svgCompiled = () => stylex.props(styles.circularSvg)
  const circularBgCompiled = () => stylex.props(styles.circularBg)
  const circularFillCompiled = () => stylex.props(styles.circularFill)
  const circularTextCompiled = () => stylex.props(styles.circularText)

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      trackClass={joinClassNames(trackCompiled().className, props.trackClass)}
      trackStyle={mergeSolidStyles(toSolidStyle(trackCompiled().style), props.trackStyle)}
      fillClass={joinClassNames(fillCompiled().className, props.fillClass)}
      fillStyle={mergeSolidStyles(toSolidStyle(fillCompiled().style), props.fillStyle)}
      svgClass={joinClassNames(svgCompiled().className, props.svgClass)}
      svgStyle={mergeSolidStyles(toSolidStyle(svgCompiled().style), props.svgStyle)}
      circularBgClass={joinClassNames(circularBgCompiled().className, props.circularBgClass)}
      circularBgStyle={mergeSolidStyles(
        toSolidStyle(circularBgCompiled().style),
        props.circularBgStyle,
      )}
      circularFillClass={joinClassNames(circularFillCompiled().className, props.circularFillClass)}
      circularFillStyle={mergeSolidStyles(
        toSolidStyle(circularFillCompiled().style),
        props.circularFillStyle,
      )}
      circularTextClass={joinClassNames(circularTextCompiled().className, props.circularTextClass)}
      circularTextStyle={mergeSolidStyles(
        toSolidStyle(circularTextCompiled().style),
        props.circularTextStyle,
      )}
    />
  )
}
export type { StyledProgressProps as ProgressProps }
