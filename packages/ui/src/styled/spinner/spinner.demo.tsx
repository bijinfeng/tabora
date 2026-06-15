import { Badge } from "../badge"
import { Spinner } from "./spinner.styled"

export function SpinnerDemo() {
  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>插件同步中</strong>
        <span>短时加载更适合用 Spinner，而不是完整骨架屏。</span>
      </div>
      <div class="docs-row">
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
        <Badge variant="accent">短时操作</Badge>
      </div>
      <span class="docs-inline-status">
        <Spinner size="sm" />
        加载中...
      </span>
    </div>
  )
}
