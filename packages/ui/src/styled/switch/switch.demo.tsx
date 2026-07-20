import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { demoStyles } from "../demoStyles"
import { Switch } from "./switch.styled"

export function SwitchDemo() {
  const [suggestions, setSuggestions] = createSignal(true)
  const [openPreview, setOpenPreview] = createSignal(false)

  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>搜索体验开关</strong>
        <span>适合即时生效的二元设置，不需要额外提交按钮。</span>
      </div>
      <Switch checked={suggestions()} onChange={setSuggestions} label="启用命令搜索建议" />
      <Switch checked={openPreview()} onChange={setOpenPreview} label="启用侧边预览打开结果" />
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <span>当前状态</span>
        <strong>
          {suggestions() ? "显示建议" : "只保留回车直达"} ·
          {openPreview() ? " 侧边预览" : " 当前页打开"}
        </strong>
      </div>
    </div>
  )
}
