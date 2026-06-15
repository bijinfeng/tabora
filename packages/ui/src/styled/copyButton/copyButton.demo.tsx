import { Badge } from "../badge"
import { CopyButton } from "./copyButton.styled"

export function CopyButtonDemo() {
  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>复制插件标识</strong>
        <span>适合插件管理、调试说明和命令面板里快速复制关键值。</span>
      </div>
      <div class="docs-row">
        <Badge variant="neutral">official.widget.todo</Badge>
        <CopyButton value="official.widget.todo">复制插件 ID</CopyButton>
      </div>
    </div>
  )
}
