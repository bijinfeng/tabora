import { Badge } from "../badge"
import { Avatar } from "./avatar.styled"

import { demoStyles, sx } from "../demoStyles"
export function AvatarDemo() {
  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>插件协作成员</strong>
        <span>适合在插件详情、作者信息和协作面板里提供紧凑身份标识。</span>
      </div>
      <div {...sx(demoStyles.row)}>
        <Avatar size="sm" fallback="TB" />
        <Avatar fallback="QA" />
        <Avatar size="lg" fallback="UX" />
        <Avatar size="xl" fallback="PM" />
        <Badge variant="neutral">4 位成员在线</Badge>
      </div>
    </div>
  )
}
