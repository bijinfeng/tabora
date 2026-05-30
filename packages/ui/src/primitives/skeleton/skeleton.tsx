export type SkeletonProps = {
  width?: string
  height?: string
  rounded?: boolean
  class?: string
  style?: Record<string, string>
}

export function Skeleton(props: SkeletonProps) {
  return (
    <div
      class={props.class}
      data-rounded={props.rounded ? "" : undefined}
      aria-hidden="true"
      style={{ width: props.width, height: props.height }}
    />
  )
}

export function SkeletonText(props: { lines?: number; class?: string }) {
  const lines = props.lines ?? 3
  return (
    <div class={props.class} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          height="12px"
          width={i === lines - 1 ? "60%" : "100%"}
          style={{ "margin-bottom": "8px" }}
        />
      ))}
    </div>
  )
}
