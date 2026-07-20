import { createSignal } from "solid-js"
import { Pencil, Copy, ArrowUp, Lock, Trash2 } from "lucide-solid"

import { demoStyles, sx } from "../demoStyles"
import { Button } from "../button"
import { DropdownMenu } from "./dropdownMenu.styled"

export function DropdownMenuDemo() {
  const [open, setOpen] = createSignal(true)
  const [lastAction, setLastAction] = createSignal("尚未调整卡片。")

  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>卡片操作菜单</strong>
        <span>操作溢出菜单，支持图标、快捷键、已选中态、禁用项、分割线与危险操作。</span>
      </div>
      <div {...sx(demoStyles.row)}>
        <span>{lastAction()}</span>
      </div>
      <DropdownMenu
        open={open()}
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        items={[
          {
            id: "edit",
            label: "编辑",
            icon: <Pencil size={14} strokeWidth={2} />,
            shortcut: "⌘E",
            onClick: () => setLastAction("已进入编辑。"),
          },
          {
            id: "copy",
            label: "复制",
            icon: <Copy size={14} strokeWidth={2} />,
            shortcut: "⌘C",
            onClick: () => setLastAction("已复制卡片。"),
          },
          {
            id: "wide",
            label: "切换为宽卡",
            checked: true,
            onClick: () => setLastAction("卡片已切换为宽卡。"),
          },
          {
            id: "pin",
            label: "置顶",
            icon: <ArrowUp size={14} strokeWidth={2} />,
            onClick: () => setLastAction("卡片已置顶。"),
          },
          {
            id: "lock",
            label: "锁定（不可用）",
            icon: <Lock size={14} strokeWidth={2} />,
            disabled: true,
          },
          { id: "divider", label: "", separator: true },
          {
            id: "remove",
            label: "删除",
            icon: <Trash2 size={14} strokeWidth={2} />,
            shortcut: "⌫",
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
