import { createSignal } from "solid-js"

import { Checkbox } from "./checkbox.styled"

export function CheckboxDemo() {
  const [checked, setChecked] = createSignal(false)

  return <Checkbox checked={checked()} onChange={setChecked} label="同步完成" />
}
