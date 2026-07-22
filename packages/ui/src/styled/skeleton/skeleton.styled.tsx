import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { radius } from "@tabora/theme/tokens.stylex"
import { Skeleton as P, SkeletonText as PT } from "../../primitives/skeleton/skeleton"
import type { SkeletonProps, SkeletonTextProps } from "../../primitives/skeleton/skeleton"
import { joinClassNames } from "../../stylex"

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
    animationDuration: "1500ms",
    animationIterationCount: "infinite",
    animationName: pulse,
    animationTimingFunction: "ease-in-out",
    backgroundColor: "rgb(var(--tbr-color-line) / 0.5)",
    borderRadius: radius.r2,
  },
  rounded: {
    borderRadius: radius.pill,
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
  const compiled = () => stylex.attrs(styles.root, props.rounded && styles.rounded, props.xstyle)

  return <P {...props} class={joinClassNames(compiled().class, props.class)} style={props.style} />
}

export function SkeletonText(props: StyledSkeletonTextProps) {
  const rootCompiled = () => stylex.attrs(props.xstyle)
  const lineCompiled = () => stylex.attrs(styles.root, props.lineXstyle)

  return (
    <PT
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      lineClass={joinClassNames(lineCompiled().class, props.lineClass)}
      lineStyle={props.lineStyle}
    />
  )
}

export type { StyledSkeletonProps as SkeletonProps, StyledSkeletonTextProps as SkeletonTextProps }
