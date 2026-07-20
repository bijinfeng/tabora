import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Skeleton as P, SkeletonText as PT } from "../../primitives/skeleton/skeleton"
import type { SkeletonProps, SkeletonTextProps } from "../../primitives/skeleton/skeleton"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const pulse = stylex.keyframes({
  "0%": {
    opacity: 1,
  },
  "50%": {
    opacity: 0.4,
  },
  "100%": {
    opacity: 1,
  },
})

const styles = stylex.create({
  root: {
    animationDuration: "1.5s",
    animationIterationCount: "infinite",
    animationName: pulse,
    animationTimingFunction: "ease-in-out",
    backgroundColor: "rgb(var(--tbr-color-line) / 0.5)",
    borderRadius: "var(--tbr-radius-2)",
  },
  rounded: {
    borderRadius: 999,
  },
})

export type StyledSkeletonProps = SkeletonProps & {
  xstyle?: StyleXStyles
}

export type StyledSkeletonTextProps = SkeletonTextProps & {
  xstyle?: StyleXStyles
  lineXstyle?: StyleXStyles
}

export function Skeleton(props: StyledSkeletonProps) {
  const compiled = () => stylex.props(styles.root, props.rounded && styles.rounded, props.xstyle)

  return (
    <P
      {...props}
      class={joinClassNames(compiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(compiled().style), props.style)}
    />
  )
}

export function SkeletonText(props: StyledSkeletonTextProps) {
  const rootCompiled = () => stylex.props(props.xstyle)
  const lineCompiled = () => stylex.props(styles.root, props.lineXstyle)

  return (
    <PT
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      lineClass={joinClassNames(lineCompiled().className, props.lineClass)}
      lineStyle={mergeSolidStyles(toSolidStyle(lineCompiled().style), props.lineStyle)}
    />
  )
}

export type { StyledSkeletonProps as SkeletonProps, StyledSkeletonTextProps as SkeletonTextProps }
