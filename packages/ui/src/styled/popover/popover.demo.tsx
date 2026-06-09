import { createSignal } from "solid-js"

import { Button } from "../button"
import { Popover } from "./popover.styled"

export function PopoverDemo() {
  const [open, setOpen] = createSignal(true)

  return (
    <div class="docs-relative">
      <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
        切换 Popover
      </Button>
      <Popover open={open()} onClose={() => setOpen(false)} title="背景来源">
        <p>当前使用默认 Refined Sage 背景。</p>
      </Popover>
    </div>
  )
}
