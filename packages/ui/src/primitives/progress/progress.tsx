import { Progress as KProgress } from "@kobalte/core/progress"

export type ProgressProps = {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  class?: string
  "aria-label"?: string
}

export function Progress(props: ProgressProps) {
  const rootProps = () => {
    const p: Record<string, unknown> = {}
    if (props["aria-label"] !== undefined) p["aria-label"] = props["aria-label"]
    return p
  }

  return (
    <KProgress
      {...rootProps()}
      value={props.value}
      maxValue={props.max ?? 100}
      class={`tbr-progress ${props.class ?? ""}`}
      data-size={props.size ?? "md"}
    >
      <KProgress.Track class="tbr-progress-track">
        <KProgress.Fill class="tbr-progress-fill" />
      </KProgress.Track>
    </KProgress>
  )
}
