import { Progress as KProgress } from "@kobalte/core/progress"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type ProgressVariant = "linear" | "circular"

export type ProgressProps = {
  value: number
  max?: number
  variant?: ProgressVariant
  size?: "sm" | "md" | "lg"
  indeterminate?: boolean
  showLabel?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  trackClass?: string | undefined
  trackStyle?: JSX.CSSProperties | undefined
  fillClass?: string | undefined
  fillStyle?: JSX.CSSProperties | undefined
  svgClass?: string | undefined
  svgStyle?: JSX.CSSProperties | undefined
  circularBgClass?: string | undefined
  circularBgStyle?: JSX.CSSProperties | undefined
  circularFillClass?: string | undefined
  circularFillStyle?: JSX.CSSProperties | undefined
  circularTextClass?: string | undefined
  circularTextStyle?: JSX.CSSProperties | undefined
  "aria-label"?: string
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
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
        class={props.class}
        style={props.style}
        data-variant="linear"
        data-size={props.size ?? "md"}
        data-indeterminate={props.indeterminate ? "" : undefined}
      >
        <KProgress.Track {...optionalPartProps(props.trackClass, props.trackStyle)}>
          <KProgress.Fill {...optionalPartProps(props.fillClass, props.fillStyle)} />
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
    <div class={props.class} style={props.style} data-size={props.size ?? "md"} {...rootProps()}>
      <svg
        class={props.svgClass}
        style={props.svgStyle}
        width={circleSize()}
        height={circleSize()}
        viewBox={`0 0 ${circleSize()} ${circleSize()}`}
      >
        <circle
          class={props.circularBgClass}
          style={props.circularBgStyle}
          cx={circleSize() / 2}
          cy={circleSize() / 2}
          r={radius()}
        />
        <circle
          class={props.circularFillClass}
          style={props.circularFillStyle}
          cx={circleSize() / 2}
          cy={circleSize() / 2}
          r={radius()}
          stroke-dasharray={String(circumference())}
          stroke-dashoffset={String(offset())}
        />
      </svg>
      <Show when={props.showLabel}>
        <div class={props.circularTextClass} style={props.circularTextStyle}>
          {percentage()}%
        </div>
      </Show>
    </div>
  )
}
