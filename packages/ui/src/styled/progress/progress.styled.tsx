import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
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
    backgroundColor: color.surfaceSoft,
    borderRadius: radius.pill,
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
    backgroundColor: color.accent,
    borderRadius: radius.pill,
    height: "100%",
    transitionDuration: motion.normal,
    transitionProperty: "width",
    transitionTimingFunction: motion.ease,
  },
  fillIndeterminate: {
    animationDuration: motion.normal,
    animationIterationCount: "infinite",
    animationName: indeterminateMotion,
    animationTimingFunction: motion.ease,
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
    stroke: color.surfaceSoft,
    strokeWidth: 4,
  },
  circularFill: {
    fill: "none",
    stroke: color.accent,
    strokeLinecap: "round",
    strokeWidth: 4,
    transitionDuration: motion.normal,
    transitionProperty: "stroke-dashoffset",
    transitionTimingFunction: motion.ease,
  },
  circularText: {
    alignItems: "center",
    color: color.text,
    display: "flex",
    fontSize: 11,
    fontWeight: font.bold,
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
