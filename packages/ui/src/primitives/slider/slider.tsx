import { Slider as KSlider } from "@kobalte/core/slider"
import type { JSX } from "solid-js"

export type SliderProps = {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  trackClass?: string | undefined
  trackStyle?: JSX.CSSProperties | undefined
  fillClass?: string | undefined
  fillStyle?: JSX.CSSProperties | undefined
  thumbClass?: string | undefined
  thumbStyle?: JSX.CSSProperties | undefined
  "aria-label"?: string
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function Slider(props: SliderProps) {
  const rootProps = () => {
    const p: Record<string, unknown> = {}
    if (props["aria-label"] !== undefined) p["aria-label"] = props["aria-label"]
    return p
  }

  return (
    <KSlider
      {...rootProps()}
      value={[props.value]}
      minValue={props.min ?? 0}
      maxValue={props.max ?? 100}
      step={props.step ?? 1}
      onChange={(values) => props.onChange(values[0] ?? 0)}
      class={props.class}
      style={props.style}
    >
      <KSlider.Track {...optionalPartProps(props.trackClass, props.trackStyle)}>
        <KSlider.Fill {...optionalPartProps(props.fillClass, props.fillStyle)} />
        <KSlider.Thumb {...optionalPartProps(props.thumbClass, props.thumbStyle)} />
      </KSlider.Track>
    </KSlider>
  )
}
