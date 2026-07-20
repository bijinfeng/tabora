import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { demoStyles } from "../demoStyles"
import { Badge } from "../badge"
import { TagInput } from "./tagInput.styled"

export function TagInputDemo() {
  const [tags, setTags] = createSignal(["设计", "组件", "插件"])

  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>插件标签编辑</strong>
        <span>适合编辑插件分类、搜索标签和工作区整理维度。</span>
      </div>
      <TagInput value={tags()} onChange={setTags} aria-label="插件标签" placeholder="输入标签..." />
      <div {...stylex.attrs(demoStyles.row)}>
        <Badge variant="neutral">共 {tags().length} 个标签</Badge>
      </div>
    </div>
  )
}
