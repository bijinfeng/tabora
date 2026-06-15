import { createSignal } from "solid-js"

import { DropdownMenu } from "./dropdownMenu.styled"

export function DropdownMenuDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <DropdownMenu
      open={open()}
      onOpenChange={setOpen}
      items={[
        { id: "expand", label: "展开" },
        { id: "resize", label: "调整尺寸", shortcut: "R" },
        { id: "remove", label: "移除", danger: true },
      ]}
      triggerClass="tbr-btn tbr-btn--secondary tbr-btn--md"
    >
      打开菜单
    </DropdownMenu>
  )
}
