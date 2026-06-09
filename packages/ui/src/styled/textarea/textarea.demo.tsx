import { createSignal } from "solid-js"

import { Textarea } from "./textarea.styled"

export function TextareaDemo() {
  const [value, setValue] = createSignal("今日重点：整理组件使用文档。")

  return <Textarea value={value()} onInput={setValue} rows={4} aria-label="便签内容" />
}
