import * as stylex from "@stylexjs/stylex"
import { For } from "solid-js"

import { demoStyles } from "../demoStyles"
import { Badge } from "../badge"
import { ScrollArea } from "./scrollArea.styled"

export function ScrollAreaDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>更新日志滚动区域</strong>
        <span>用于在固定高度内承载长列表，避免撑破卡片或设置面板。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Badge variant="accent">最近 5 条</Badge>
      </div>
      <ScrollArea style={{ "max-height": "96px" }} aria-label="更新日志">
        <div {...stylex.attrs(demoStyles.longList)}>
          <For
            each={[
              "manifest 校验",
              "runtime context",
              "settings-panel",
              "widget 多实例",
              "错误边界",
            ]}
          >
            {(item) => <div>{item}</div>}
          </For>
        </div>
      </ScrollArea>
    </div>
  )
}
