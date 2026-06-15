import { Badge } from "./badge.styled"

export function BadgeDemo() {
  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>插件状态</strong>
        <span>适合在列表、详情或设置页里用很小的视觉成本表达状态与计数。</span>
      </div>
      <div class="docs-row">
        <Badge>默认</Badge>
        <Badge variant="success">运行中</Badge>
        <Badge variant="warning">演示</Badge>
        <Badge variant="danger">错误</Badge>
        <Badge variant="accent">新功能</Badge>
      </div>
      <div class="docs-row">
        <Badge variant="counter">12</Badge>
        <Badge variant="dot" dotColor="success" />
        <span>权限摘要</span>
        <Badge variant="accent">external-open</Badge>
        <Badge variant="warning">需要授权</Badge>
      </div>
    </div>
  )
}
