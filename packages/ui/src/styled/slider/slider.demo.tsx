import { createSignal } from "solid-js"

import { Slider } from "./slider.styled"

export function SliderDemo() {
  const [value, setValue] = createSignal(48)

  return (
    <div class="docs-control-stack">
      <Slider value={value()} onChange={setValue} aria-label="背景透明度" />
      <span class="docs-muted">当前值：{value()}</span>
    </div>
  )
}
