import { VisuallyHidden } from "../../primitives/visuallyHidden"

export function VisuallyHiddenDemo() {
  return (
    <p class="docs-muted">
      下面这段文本只对辅助技术可见：
      <VisuallyHidden>这个按钮会保存当前插件设置。</VisuallyHidden>
    </p>
  )
}
