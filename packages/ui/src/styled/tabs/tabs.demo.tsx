import { createSignal } from "solid-js"

import { Tabs } from "./tabs.styled"

export function TabsDemo() {
  const [value, setValue] = createSignal("general")

  return (
    <Tabs
      value={value()}
      onChange={setValue}
      aria-label="设置分区"
      tabs={[
        { value: "general", label: "通用", content: <p class="docs-muted">通用设置内容</p> },
        { value: "appearance", label: "外观", content: <p class="docs-muted">外观设置内容</p> },
        { value: "search", label: "搜索", content: <p class="docs-muted">搜索设置内容</p> },
      ]}
    />
  )
}
