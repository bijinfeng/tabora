import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { demoStyles } from "../demoStyles"
import { CheckableTag, Tag } from "./tag.styled"

export function TagDemo() {
  const [selected, setSelected] = createSignal(true)
  const [visible, setVisible] = createSignal(true)

  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>标签状态</strong>
        <span>关闭标签或切换可选择标签。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        {visible() && (
          <Tag closable onClose={() => setVisible(false)}>
            设计
          </Tag>
        )}
        <CheckableTag checked={selected()} onChange={setSelected}>
          工作
        </CheckableTag>
      </div>
    </div>
  )
}
