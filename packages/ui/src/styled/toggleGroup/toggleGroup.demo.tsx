import { createSignal } from "solid-js"

import { ToggleGroup } from "./toggleGroup.styled"

export function ToggleGroupDemo() {
  const [value, setValue] = createSignal(["mon", "wed"])

  return (
    <ToggleGroup
      value={value()}
      onChange={setValue}
      aria-label="工作日"
      options={[
        { value: "mon", label: "周一" },
        { value: "tue", label: "周二" },
        { value: "wed", label: "周三" },
        { value: "thu", label: "周四" },
        { value: "fri", label: "周五" },
      ]}
    />
  )
}
