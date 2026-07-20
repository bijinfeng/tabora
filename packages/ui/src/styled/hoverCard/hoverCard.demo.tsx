import * as stylex from "@stylexjs/stylex"
import { Badge } from "../badge"
import { HoverCard } from "./hoverCard.styled"

import { demoStyles } from "../demoStyles"
export function HoverCardDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>插件信息预览</strong>
        <span>HoverCard 更适合预览性质的信息，不承担复杂操作。</span>
      </div>
      <HoverCard
        trigger="official.widget.todo"
        title="Todo Widget"
        description="贡献待办卡片，使用 Checkbox 表示完成态，并支持多实例隔离数据。"
        meta={
          <span {...stylex.attrs(demoStyles.row)}>
            <Badge variant="success">已启用</Badge>
            <span>manifest: widget</span>
          </span>
        }
      />
    </div>
  )
}
