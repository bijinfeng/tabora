import { createSignal } from "solid-js"

import { demoStyles, sx } from "../demoStyles"
import { Button } from "../button"
import { Badge } from "../badge"
import { Drawer } from "./drawer.styled"

export function DrawerDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.row)}>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          打开 Drawer
        </Button>
        <span>用于在不离开当前页面的情况下查看更完整的上下文信息。</span>
      </div>
      <Drawer
        open={open()}
        onClose={() => setOpen(false)}
        title="插件运行详情"
        description="保持当前页面上下文，同时查看更多状态和操作。"
        footer={
          <div {...sx(demoStyles.row)}>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              关闭
            </Button>
            <Button onClick={() => setOpen(false)}>查看完整日志</Button>
          </div>
        }
      >
        <div {...sx(demoStyles.stack)}>
          <div {...sx(demoStyles.row)}>
            <Badge variant="accent">widget</Badge>
            <Badge variant="success">运行中</Badge>
          </div>
          <p {...sx(demoStyles.muted)}>最近一次同步发生在 2 分钟前，当前实例没有未处理错误。</p>
          <div {...sx(demoStyles.stackCompact)}>
            <strong>权限摘要</strong>
            <span>external-open、local storage</span>
          </div>
          <div {...sx(demoStyles.stackCompact)}>
            <strong>最近事件</strong>
            <span>00:01 拉取配置成功</span>
            <span>00:03 渲染首屏卡片</span>
            <span>00:05 持久化布局状态</span>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
