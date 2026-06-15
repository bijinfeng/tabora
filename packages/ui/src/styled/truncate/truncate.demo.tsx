import { Truncate } from "./index"

export function TruncateDemo() {
  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>长描述截断</strong>
        <span>适合列表、卡片和结果项里需要控制高度的摘要文本。</span>
      </div>
      <div class="docs-truncate-box">
        <Truncate lines={2}>
          这是一段很长的插件描述，用于验证多行文本在固定宽度容器内会被稳定截断，而不会撑破卡片或影响后续内容。
        </Truncate>
      </div>
    </div>
  )
}
