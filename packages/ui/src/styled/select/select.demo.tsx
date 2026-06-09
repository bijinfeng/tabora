import { createSignal } from "solid-js"

import { Select } from "./select.styled"

const searchSourceOptions = [
  { value: "google", label: "Google" },
  { value: "github", label: "GitHub" },
  { value: "docs", label: "文档" },
] as const

export function SelectDemo() {
  const [value, setValue] = createSignal<"google" | "github" | "docs">("google")

  return (
    <Select
      value={value()}
      onChange={setValue}
      aria-label="默认搜索源"
      options={[...searchSourceOptions]}
    />
  )
}
