import { createSignal } from "solid-js"

import { Badge } from "../badge"
import { ContextMenu } from "./contextMenu.styled"

export function ContextMenuDemo() {
  const [lastAction, setLastAction] = createSignal("右键后可直接调整卡片布局，无需离开当前网格。")

  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>右键卡片快捷操作</strong>
        <span>更适合当前对象的上下文动作，比如布局调整、固定和移除。</span>
      </div>
      <div class="docs-row">
        <Badge variant="success">已固定</Badge>
        <span>{lastAction()}</span>
      </div>
      <ContextMenu
        aria-label="今日重点卡片菜单"
        triggerClass="tbr-context-menu"
        onSelect={(key) => {
          const messages: Record<string, string> = {
            pin: "卡片已固定到工作区顶部。",
            size: "卡片已切换为双列宽布局。",
            open: "已打开完整卡片视图。",
            remove: "卡片已从当前工作区移除。",
          }

          setLastAction(messages[key] ?? "已更新卡片状态。")
        }}
        items={[
          { key: "pin", label: "固定到顶部", shortcut: "P" },
          { key: "size", label: "切换为双列宽", shortcut: "W" },
          { key: "open", label: "展开完整视图" },
          { key: "remove", label: "移除卡片", danger: true },
        ]}
      >
        <div class="tbr-context-menu-content">右键打开菜单</div>
      </ContextMenu>
    </div>
  )
}
