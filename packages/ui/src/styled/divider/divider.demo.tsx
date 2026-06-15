import { Divider } from "./divider.styled"

export function DividerDemo() {
  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>设置分组分隔</strong>
        <span>用弱分隔把同一块里的不同信息区间切开，而不是增加多层边框。</span>
      </div>
      <div class="docs-stack">
        <span>搜索源配置</span>
        <Divider />
        <span>快捷键偏好</span>
      </div>
    </div>
  )
}
