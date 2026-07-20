import { createSignal } from "solid-js"

import { demoStyles, sx } from "../demoStyles"
import { Badge } from "../badge"
import { Button } from "../button"
import { Popover } from "./popover.styled"

export function PopoverDemo() {
  const [open, setOpen] = createSignal(true)

  return (
    <div {...sx(demoStyles.controlStack, demoStyles.relative)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>背景来源</strong>
        <span>适合承载不打断主流程的轻量说明和快捷切换，而不是完整设置页。</span>
      </div>
      <div {...sx(demoStyles.row)}>
        <Badge variant="accent">workspace</Badge>
      </div>
      <Popover
        open={open()}
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        title="工作区状态说明"
        trigger={
          <Button size="sm" variant="secondary">
            切换背景说明
          </Button>
        }
      >
        <div {...sx(demoStyles.stackCompact)}>
          <p>当前使用默认 Refined Sage 背景，亮色模式下会优先保留内容区对比度。</p>
          <span>上次切换：2 分钟前</span>
          <span>可在工作区外观设置中切换为图片或纯色背景。</span>
        </div>
      </Popover>
    </div>
  )
}
