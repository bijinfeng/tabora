import { Progress as KProgress } from "@kobalte/core/progress"
import { Show } from "solid-js"

export type ProgressVariant = "linear" | "circular"

export type ProgressProps = {
  value: number
  max?: number
  variant?: ProgressVariant
  size?: "sm" | "md" | "lg"
  indeterminate?: boolean
  showLabel?: boolean
  class?: string
  "aria-label"?: string
}

export function Progress(props: ProgressProps) {
  const rootProps = () => {
    const p: Record<string, unknown> = {}
    if (props["aria-label"] !== undefined) p["aria-label"] = props["aria-label"]
    return p
  }

  const variant = () => props.variant ?? "linear"
  const percentage = () => Math.round((props.value / (props.max ?? 100)) * 100)

  // Linear progress
  if (variant() === "linear") {
    return (
      <KProgress
        {...rootProps()}
        value={props.value}
        maxValue={props.max ?? 100}
        class={`tbr-progress ${props.class ?? ""}`}
        data-variant="linear"
        data-size={props.size ?? "md"}
        data-indeterminate={props.indeterminate ? "" : undefined}
      >
        <KProgress.Track class="tbr-progress-track">
          <KProgress.Fill class="tbr-progress-fill" />
        </KProgress.Track>
      </KProgress>
    )
  }

  // Circular progress
  const circleSize = () => {
    const sizes = { sm: 40, md: 48, lg: 56 }
    return sizes[props.size ?? "md"]
  }
  const radius = () => circleSize() / 2 - 4 // 4 = half of stroke-width
  const circumference = () => 2 * Math.PI * radius()
  const offset = () => circumference() * (1 - props.value / (props.max ?? 100))

  return (
    <div
      class={`tbr-progress-circular ${props.class ?? ""}`}
      data-size={props.size ?? "md"}
      {...rootProps()}
    >
      <svg
        width={circleSize()}
        height={circleSize()}
        viewBox={`0 0 ${circleSize()} ${circleSize()}`}
      >
        <circle
          class="tbr-progress-circular-bg"
          cx={circleSize() / 2}
          cy={circleSize() / 2}
          r={radius()}
        />
        <circle
          class="tbr-progress-circular-fill"
          cx={circleSize() / 2}
          cy={circleSize() / 2}
          r={radius()}
          stroke-dasharray={circumference()}
          stroke-dashoffset={offset()}
        />
      </svg>
      <Show when={props.showLabel}>
        <div class="tbr-progress-circular-text">{percentage()}%</div>
      </Show>
    </div>
  )
}
