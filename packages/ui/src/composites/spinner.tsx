export type SpinnerProps = {
  size?: "sm" | "md"
  "aria-label"?: string
}

export function Spinner(props: SpinnerProps) {
  return (
    <span
      class="tabora-spinner"
      data-size={props.size ?? "md"}
      role="status"
      aria-label={props["aria-label"] ?? "加载中"}
    />
  )
}
