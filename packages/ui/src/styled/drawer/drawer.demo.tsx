import { createSignal } from "solid-js"

import { Button } from "../button"
import { Drawer } from "./drawer.styled"

export function DrawerDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="docs-row">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        打开 Drawer
      </Button>
      <Drawer
        open={open()}
        onClose={() => setOpen(false)}
        title="插件详情"
        description="保持当前页面上下文。"
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            关闭
          </Button>
        }
      >
        <p class="docs-muted">这里可以放插件权限、版本、配置和状态信息。</p>
      </Drawer>
    </div>
  )
}
