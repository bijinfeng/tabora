import * as stylex from "@stylexjs/stylex"
import { Badge } from "../badge"
import { Timeline } from "./timeline.styled"

import { demoStyles } from "../demoStyles"
export function TimelineDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>最近同步记录</strong>
        <span>适合展示按时间推进的事件链，比如导入、同步、发布或错误恢复。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Badge variant="success">同步正常</Badge>
      </div>
      <Timeline
        items={[
          { title: "创建插件", description: "manifest 已验证", meta: "09:00" },
          { title: "注册 widget", description: "runtime view 已加载", meta: "09:02" },
          { title: "持久化布局", description: "工作区状态已写入 IndexedDB", meta: "09:05" },
        ]}
      />
    </div>
  )
}
