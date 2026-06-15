import { Kbd } from "./kbd.styled"

export function KbdDemo() {
  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>常用快捷键</strong>
        <span>适合命令面板、提示说明和文档中的键盘操作指引。</span>
      </div>
      <div class="docs-row compact">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
        <span>打开命令面板</span>
      </div>
      <div class="docs-row compact">
        <Kbd>Esc</Kbd>
        <span>关闭当前浮层</span>
      </div>
    </div>
  )
}
