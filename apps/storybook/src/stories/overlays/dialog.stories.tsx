import { Button, Dialog } from "@tabora/ui"
import { createSignal } from "solid-js"

export default {
  title: "Overlays/Dialog",
  component: Dialog,
}

export const Default = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          打开对话框
        </Button>
        <Dialog
          open={open()}
          onClose={() => setOpen(false)}
          title="确认操作"
          description="确定要执行此操作吗？此操作不可撤销。"
          size="md"
        />
      </>
    )
  },
}

export const WithFooter = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          打开对话框
        </Button>
        <Dialog
          open={open()}
          onClose={() => setOpen(false)}
          title="删除确认"
          description="此操作将永久删除所有选中的记录。"
          destructive
          size="md"
          footer={
            <div style={{ display: "flex", gap: "8px", "justify-content": "flex-end" }}>
              <Button variant="ghost" size="sm">
                取消
              </Button>
              <Button variant="danger" size="sm">
                删除
              </Button>
            </div>
          }
        />
      </>
    )
  },
}

export const Small = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          打开对话框
        </Button>
        <Dialog
          open={open()}
          onClose={() => setOpen(false)}
          title="提示"
          description="简短的消息提示。"
          size="sm"
        />
      </>
    )
  },
}

export const Large = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          打开对话框
        </Button>
        <Dialog
          open={open()}
          onClose={() => setOpen(false)}
          title="使用条款"
          description="请仔细阅读以下使用条款和隐私政策。"
          size="lg"
        >
          <div style={{ "max-height": "200px", overflow: "auto" }}>
            <p>条款内容第1条：这里是详细的服务协议条款内容。</p>
            <p>条款内容第2条：用户须遵守平台使用规范。</p>
            <p>条款内容第3条：禁止滥用和恶意行为。</p>
          </div>
        </Dialog>
      </>
    )
  },
}

export const TitleOnly = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          打开对话框
        </Button>
        <Dialog open={open()} onClose={() => setOpen(false)} title="操作成功" size="md" />
      </>
    )
  },
}

export const Destructive = {
  render: () => {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          打开对话框
        </Button>
        <Dialog
          open={open()}
          onClose={() => setOpen(false)}
          title="确认删除"
          description="此操作不可撤销，确定要继续吗？"
          destructive
          size="md"
        />
      </>
    )
  },
}
