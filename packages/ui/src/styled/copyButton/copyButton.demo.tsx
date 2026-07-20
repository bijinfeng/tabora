import * as stylex from "@stylexjs/stylex"
import { Badge } from "../badge"
import { CopyButton } from "./copyButton.styled"

import { demoStyles } from "../demoStyles"
export function CopyButtonDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>复制插件标识</strong>
        <span>适合插件管理、调试说明和命令面板里快速复制关键值。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Badge variant="neutral">official.widget.todo</Badge>
        <CopyButton value="official.widget.todo">复制插件 ID</CopyButton>
      </div>
    </div>
  )
}
