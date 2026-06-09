import { Badge } from "./badge.styled"

export function BadgeDemo() {
  return (
    <div class="docs-row">
      <Badge>默认</Badge>
      <Badge variant="success">运行中</Badge>
      <Badge variant="warning">演示</Badge>
      <Badge variant="danger">错误</Badge>
      <Badge variant="accent">新功能</Badge>
      <Badge variant="counter">12</Badge>
      <Badge variant="dot" dotColor="success" />
    </div>
  )
}
