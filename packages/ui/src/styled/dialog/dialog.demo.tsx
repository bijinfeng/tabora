import { createSignal } from "solid-js"

import { Button } from "../button"
import { Dialog } from "./dialog.styled"

export function DialogDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="docs-row">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        打开 Dialog
      </Button>
      <Dialog
        open={open()}
        onClose={() => setOpen(false)}
        title="确认移除卡片"
        description="该操作只影响当前工作区，可以稍后重新添加。"
        destructive
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              移除
            </Button>
          </>
        }
      />
    </div>
  )
}
