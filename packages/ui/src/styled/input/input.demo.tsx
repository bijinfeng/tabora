import { createSignal } from "solid-js"

import { Input } from "./input.styled"

export function InputDemo() {
  const [value, setValue] = createSignal("Tabora")

  return (
    <div class="docs-control-stack">
      <Input value={value()} onInput={setValue} aria-label="工作区名称" />
      <Input value="invalid-key" onInput={() => {}} invalid aria-label="错误示例" />
    </div>
  )
}
