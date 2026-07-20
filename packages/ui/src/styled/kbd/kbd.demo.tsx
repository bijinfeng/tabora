import { Kbd } from "./kbd.styled"

import { demoStyles, sx } from "../demoStyles"
export function KbdDemo() {
  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>常用快捷键</strong>
        <span>适合命令面板、提示说明和文档中的键盘操作指引。</span>
      </div>
      <div {...sx(demoStyles.row, demoStyles.rowCompact)}>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
        <span>打开命令面板</span>
      </div>
      <div {...sx(demoStyles.row, demoStyles.rowCompact)}>
        <Kbd>Esc</Kbd>
        <span>关闭当前浮层</span>
      </div>
    </div>
  )
}
