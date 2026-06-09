import { Truncate } from "./index"

export function TruncateDemo() {
  return (
    <div class="docs-truncate-box">
      <Truncate lines={2}>
        这是一段很长的插件描述，用于验证多行文本在固定宽度容器内会被稳定截断，而不会撑破卡片或影响后续内容。
      </Truncate>
    </div>
  )
}
