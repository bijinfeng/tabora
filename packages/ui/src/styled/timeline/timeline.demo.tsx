import { Timeline } from "./timeline.styled"

export function TimelineDemo() {
  return (
    <Timeline
      items={[
        { title: "创建插件", description: "manifest 已验证", meta: "09:00" },
        { title: "注册 widget", description: "runtime view 已加载", meta: "09:02" },
      ]}
    />
  )
}
