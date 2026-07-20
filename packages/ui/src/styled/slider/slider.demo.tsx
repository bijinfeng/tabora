import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { demoStyles } from "../demoStyles"
import { Badge } from "../badge"
import { Slider } from "./slider.styled"

export function SliderDemo() {
  const [value, setValue] = createSignal(36)

  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>背景蒙层强度</strong>
        <span>用连续数值细调背景可读性，避免直接跳变视觉风格。</span>
      </div>
      <Slider value={value()} onChange={setValue} aria-label="背景蒙层强度" />
      <div {...stylex.attrs(demoStyles.row)}>
        <Badge variant="accent">{value()}%</Badge>
        <span {...stylex.attrs(demoStyles.muted)}>当前值越高，前景内容区对比度越稳定。</span>
      </div>
    </div>
  )
}
