import { Button, DropdownMenu } from "@tabora/ui"
import type { DropdownMenuItem } from "@tabora/ui"
import type { Meta, StoryObj } from "storybook-solidjs"
import { createSignal } from "solid-js"

const basicItems: DropdownMenuItem[] = [
  { id: "1", label: "编辑", onClick: () => {} },
  { id: "2", label: "复制", onClick: () => {} },
  { id: "sep1", label: "", separator: true },
  { id: "3", label: "删除", danger: true, onClick: () => {} },
]

const advancedItems: DropdownMenuItem[] = [
  { id: "1", label: "新建文件", icon: <span>+</span>, shortcut: "Cmd+N", onClick: () => {} },
  { id: "2", label: "打开文件", icon: <span>O</span>, shortcut: "Cmd+O", onClick: () => {} },
  { id: "sep1", label: "", separator: true },
  { id: "3", label: "分享", icon: <span>S</span>, disabled: true, onClick: () => {} },
  { id: "4", label: "重命名", shortcut: "F2", onClick: () => {} },
  { id: "sep2", label: "", separator: true },
  { id: "5", label: "已启用功能", checked: true, onClick: () => {} },
  {
    id: "6",
    label: "删除",
    icon: <span>D</span>,
    danger: true,
    shortcut: "Del",
    onClick: () => {},
  },
]

const meta = {
  title: "Overlays/DropdownMenu",
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <DropdownMenu open={open()} onClose={() => setOpen(false)} items={basicItems}>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          打开菜单
        </Button>
      </DropdownMenu>
    )
  },
}

export const WithIconsAndShortcuts: Story = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <DropdownMenu open={open()} onClose={() => setOpen(false)} items={advancedItems}>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          打开菜单
        </Button>
      </DropdownMenu>
    )
  },
}

export const DangerAction: Story = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <DropdownMenu
        open={open()}
        onClose={() => setOpen(false)}
        items={
          [
            { id: "1", label: "编辑", onClick: () => {} },
            { id: "sep1", label: "", separator: true },
            { id: "2", label: "删除项目", danger: true, onClick: () => {} },
          ] satisfies DropdownMenuItem[]
        }
      >
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          打开菜单
        </Button>
      </DropdownMenu>
    )
  },
}
