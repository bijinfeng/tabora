export type ProgressProps = {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  class?: string
  "aria-label"?: string
}

export function Progress(props: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (props.value / (props.max ?? 100)) * 100))
  return (
    <div
      class={props.class}
      data-size={props.size ?? "md"}
      role="progressbar"
      aria-valuenow={props.value}
      aria-valuemin={0}
      aria-valuemax={props.max ?? 100}
      aria-label={props["aria-label"]}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          "border-radius": "999px",
          background: "rgb(var(--tbr-color-accent))",
          transition: "width 300ms ease",
        }}
      />
    </div>
  )
}
