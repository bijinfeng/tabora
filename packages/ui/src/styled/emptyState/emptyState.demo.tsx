import { Button } from "../button"
import { EmptyState } from "./emptyState.styled"

export function EmptyStateDemo() {
  return (
    <EmptyState
      title="暂无卡片"
      description="添加第一张 widget 后会显示在这里。"
      action={<Button size="sm">添加卡片</Button>}
    />
  )
}
