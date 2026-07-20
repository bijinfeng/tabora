import type { JSX } from "solid-js"

export type SpinnerProps = {
  size?: "sm" | "md" | "lg"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  "aria-label"?: string
}

export function Spinner(props: SpinnerProps) {
  return (
    <span
      class={props.class}
      style={props.style}
      data-size={props.size ?? "md"}
      role="status"
      aria-label={props["aria-label"] ?? "加载中"}
    />
  )
}
