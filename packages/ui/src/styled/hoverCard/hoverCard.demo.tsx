import { HoverCard } from "./hoverCard.styled"

export function HoverCardDemo() {
  return (
    <HoverCard
      trigger="official.widget.todo"
      title="Todo Widget"
      description="贡献待办卡片，使用 Checkbox 表示完成态。"
      meta="manifest: widget"
    />
  )
}
