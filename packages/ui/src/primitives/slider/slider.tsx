import { Slider as KSlider } from "@kobalte/core/slider"

export type SliderProps = {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  class?: string
  "aria-label"?: string
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
      class={`tbr-slider ${props.class ?? ""}`}
    >
      <KSlider.Track class="tbr-slider-track">
        <KSlider.Fill class="tbr-slider-fill" />
        <KSlider.Thumb class="tbr-slider-thumb" />
      </KSlider.Track>
    </KSlider>
  )
}
