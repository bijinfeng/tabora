import { createSignal } from "solid-js"

import { Button } from "../button"
import { Textarea } from "./textarea.styled"

export function TextareaDemo() {
  const initialValue = [
    "发布说明草稿",
    "",
    "1. 更新 Input / Select / Dialog 示例",
    "2. 补充真实工作台语境下的状态反馈",
    "3. 检查移动端下代码区可读性",
  ].join("\n")

  const [value, setValue] = createSignal(initialValue)

  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>发布说明草稿</strong>
        <span>适合展示较长文本编辑、草稿回滚和字符摘要。</span>
      </div>
      <Textarea value={value()} onInput={setValue} rows={6} aria-label="发布说明草稿" />
      <div class="docs-row">
        <Button size="sm" variant="secondary" onClick={() => setValue(initialValue)}>
          恢复草稿
        </Button>
        <span>{value().length} 字符</span>
      </div>
    </div>
  )
}
