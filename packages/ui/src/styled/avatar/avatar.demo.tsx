import { Avatar } from "./avatar.styled"

export function AvatarDemo() {
  return (
    <div class="docs-row">
      <Avatar size="sm" fallback="TB" />
      <Avatar fallback="Tabora" />
      <Avatar size="lg" fallback="Plugin" />
      <Avatar size="xl" fallback="User" />
    </div>
  )
}
