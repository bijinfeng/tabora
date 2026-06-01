import { Button, Popover } from "@tabora/ui"
import { createSignal } from "solid-js"

export default {
  title: "Overlays/Popover",
  component: Popover,
}

export const Default = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <Popover open={open()} onClose={() => setOpen(false)} title="通知">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          打开弹出框
        </Button>
        <p style={{ margin: 0 }}>您有 3 条新消息等待查看。</p>
      </Popover>
    )
  },
}

export const NoTitle = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <Popover open={open()} onClose={() => setOpen(false)}>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          打开弹出框
        </Button>
        <p style={{ margin: 0 }}>此弹出框没有标题，直接展示内容区域。适用于简单的信息展示场景。</p>
      </Popover>
    )
  },
}

export const LongContent = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <Popover open={open()} onClose={() => setOpen(false)} title="使用说明">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          打开弹出框
        </Button>
        <div>
          <p style={{ margin: 0, "margin-bottom": "8px" }}>1. 点击添加按钮创建新的工作区。</p>
          <p style={{ margin: 0, "margin-bottom": "8px" }}>2. 拖拽卡片调整布局位置。</p>
          <p style={{ margin: 0 }}>3. 右键卡片可以打开更多操作菜单。</p>
        </div>
      </Popover>
    )
  },
}
