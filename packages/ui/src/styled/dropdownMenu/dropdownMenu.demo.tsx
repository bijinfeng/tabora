import { createSignal } from "solid-js"

import { Badge } from "../badge"
import { Button } from "../button"
import { DropdownMenu } from "./dropdownMenu.styled"

export function DropdownMenuDemo() {
  const [open, setOpen] = createSignal(true)
  const [lastAction, setLastAction] = createSignal("尚未调整卡片。")

  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>今日重点卡片</strong>
        <span>下拉菜单适合承载按钮触发的一组次级动作，并保留危险操作层级。</span>
      </div>
      <div class="docs-row">
        <Badge variant="accent">2x1</Badge>
        <span>{lastAction()}</span>
      </div>
      <DropdownMenu
        open={open()}
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        items={[
          {
            id: "expand",
            label: "展开专注视图",
            onClick: () => setLastAction("已打开专注视图。"),
          },
          {
            id: "resize",
            label: "切换为宽卡",
            shortcut: "W",
            checked: true,
            onClick: () => setLastAction("卡片已切换为宽卡。"),
          },
          { id: "divider", label: "", separator: true },
          {
            id: "remove",
            label: "移除卡片",
            danger: true,
            onClick: () => setLastAction("卡片已移出当前工作区。"),
          },
        ]}
      >
        <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
          卡片操作
        </Button>
      </DropdownMenu>
    </div>
  )
}
