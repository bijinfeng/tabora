import { Badge } from "../badge"
import { HoverCard } from "./hoverCard.styled"

export function HoverCardDemo() {
  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>插件信息预览</strong>
        <span>HoverCard 更适合预览性质的信息，不承担复杂操作。</span>
      </div>
      <HoverCard
        trigger="official.widget.todo"
        title="Todo Widget"
        description="贡献待办卡片，使用 Checkbox 表示完成态，并支持多实例隔离数据。"
        meta={
          <span class="docs-row">
            <Badge variant="success">已启用</Badge>
            <span>manifest: widget</span>
          </span>
        }
      />
    </div>
  )
}
