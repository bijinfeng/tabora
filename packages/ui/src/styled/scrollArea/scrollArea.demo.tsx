import { For } from "solid-js"

import { ScrollArea } from "./scrollArea.styled"

export function ScrollAreaDemo() {
  return (
    <ScrollArea style={{ "max-height": "96px" }} aria-label="更新日志">
      <div class="docs-long-list">
        <For
          each={["manifest 校验", "runtime context", "settings-panel", "widget 多实例", "错误边界"]}
        >
          {(item) => <div>{item}</div>}
        </For>
      </div>
    </ScrollArea>
  )
}
