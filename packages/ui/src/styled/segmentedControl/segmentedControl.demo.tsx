import { createSignal } from "solid-js"

import { SegmentedControl } from "./segmentedControl.styled"

export function SegmentedControlDemo() {
  const [value, setValue] = createSignal<"sm" | "md" | "lg">("md")

  return (
    <SegmentedControl
      value={value()}
      onChange={setValue}
      aria-label="尺寸"
      options={[
        { value: "sm", label: "小" },
        { value: "md", label: "中" },
        { value: "lg", label: "大" },
      ]}
    />
  )
}
