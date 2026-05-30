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
  return (
    <input
      type="range"
      class={`tbr-slider ${props.class ?? ""}`}
      value={props.value}
      min={props.min ?? 0}
      max={props.max ?? 100}
      step={props.step ?? 1}
      aria-label={props["aria-label"]}
      onInput={(e) => props.onChange(Number(e.currentTarget.value))}
    />
  )
}
