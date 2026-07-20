import * as stylex from "@stylexjs/stylex"
import { Kbd } from "./kbd.styled"

import { demoStyles } from "../demoStyles"
export function KbdDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>常用快捷键</strong>
        <span>适合命令面板、提示说明和文档中的键盘操作指引。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row, demoStyles.rowCompact)}>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
        <span>打开命令面板</span>
      </div>
      <div {...stylex.attrs(demoStyles.row, demoStyles.rowCompact)}>
        <Kbd>Esc</Kbd>
        <span>关闭当前浮层</span>
      </div>
    </div>
  )
}
