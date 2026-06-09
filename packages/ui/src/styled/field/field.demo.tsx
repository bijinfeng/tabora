import { createSignal } from "solid-js"

import { Input } from "../input"
import { Field } from "./field.styled"

export function FieldDemo() {
  const [value, setValue] = createSignal("Tabora")

  return (
    <Field label="显示名称" helper="显示在工作区标题中。" htmlFor="docs-name">
      <Input id="docs-name" value={value()} onInput={setValue} />
    </Field>
  )
}
