import type { JSX } from "solid-js"

export type SkeletonProps = {
  width?: string
  height?: string
  rounded?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  "aria-label"?: string
}

export function Skeleton(props: SkeletonProps) {
  return (
    <div
      class={props.class}
      data-rounded={props.rounded ? "" : undefined}
      aria-hidden={props["aria-label"] === undefined ? "true" : undefined}
      aria-label={props["aria-label"]}
      style={{ ...props.style, width: props.width, height: props.height }}
    />
  )
}

export type SkeletonTextProps = {
  lines?: number
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  lineClass?: string | undefined
  lineStyle?: JSX.CSSProperties | undefined
}

export function SkeletonText(props: SkeletonTextProps) {
  const lines = props.lines ?? 3
  return (
    <div class={props.class} style={props.style} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          class={props.lineClass}
          height="12px"
          width={i === lines - 1 ? "60%" : "100%"}
          style={{ ...props.lineStyle, "margin-bottom": "8px" }}
        />
      ))}
    </div>
  )
}
