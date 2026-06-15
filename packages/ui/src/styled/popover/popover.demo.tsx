import { createSignal } from "solid-js"

import { Popover } from "./popover.styled"

export function PopoverDemo() {
  const [open, setOpen] = createSignal(true)

  return (
    <div class="docs-relative">
      <Popover
        open={open()}
        onOpenChange={setOpen}
        title="背景来源"
        triggerClass="tbr-btn tbr-btn--secondary tbr-btn--md"
        trigger="切换 Popover"
      >
        <p>当前使用默认 Refined Sage 背景。</p>
      </Popover>
    </div>
  )
}
