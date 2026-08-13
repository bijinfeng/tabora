import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { demoStyles } from "../demoStyles"
import { Stepper } from "./stepper.styled"

export function StepperDemo() {
  const [value, setValue] = createSignal(4)

  return (
    <div {...stylex.attrs(demoStyles.row)}>
      <Stepper
        value={value()}
        min={3}
        max={6}
        onChange={setValue}
        aria-label="默认卡片列数"
        decrementAriaLabel="减少默认卡片列数"
        incrementAriaLabel="增加默认卡片列数"
      />
      <span {...stylex.attrs(demoStyles.muted)}>当前值：{value()}</span>
    </div>
  )
}
