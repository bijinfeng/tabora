import { createSignal } from "solid-js"

import { RadioGroup } from "./radioGroup.styled"

export function RadioGroupDemo() {
  const [value, setValue] = createSignal<"light" | "dark" | "system">("system")

  return (
    <RadioGroup
      name="docs-theme"
      value={value()}
      onChange={setValue}
      options={[
        { value: "light", label: "明亮主题", description: "白天使用" },
        { value: "dark", label: "暗色主题", description: "夜间使用" },
        { value: "system", label: "跟随系统", description: "自动匹配系统" },
      ]}
    />
  )
}
