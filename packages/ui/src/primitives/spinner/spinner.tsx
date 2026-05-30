export type SpinnerProps = {
  size?: "sm" | "md" | "lg"
  class?: string
  "aria-label"?: string
}

export function Spinner(props: SpinnerProps) {
  return (
    <span
      class={props.class}
      data-size={props.size ?? "md"}
      role="status"
      aria-label={props["aria-label"] ?? "加载中"}
    />
  )
}
