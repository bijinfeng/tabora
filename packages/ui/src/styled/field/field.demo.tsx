import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { demoStyles } from "../demoStyles"
import { Badge } from "../badge"
import { Input } from "../input"
import { Field } from "./field.styled"

export function FieldDemo() {
  const [value, setValue] = createSignal("Tabora")

  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>工作区显示名称</strong>
        <span>用 Field 把标签、说明和输入绑定在一起，避免表单语义松散。</span>
      </div>
      <Field label="显示名称" helper="显示在工作区标题中。" htmlFor="docs-name">
        <Input id="docs-name" value={value()} onInput={setValue} />
      </Field>
      <div {...stylex.attrs(demoStyles.row)}>
        <Badge variant="neutral">当前值</Badge>
        <span>{value()}</span>
      </div>
    </div>
  )
}
