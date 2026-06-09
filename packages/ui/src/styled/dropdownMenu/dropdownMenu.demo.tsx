import { createSignal } from "solid-js"

import { Button } from "../button"
import { DropdownMenu } from "./dropdownMenu.styled"

export function DropdownMenuDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <DropdownMenu
      open={open()}
      onClose={() => setOpen(false)}
      items={[
        { id: "expand", label: "展开" },
        { id: "resize", label: "调整尺寸", shortcut: "R" },
        { id: "remove", label: "移除", danger: true },
      ]}
    >
      <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
        打开菜单
      </Button>
    </DropdownMenu>
  )
}
