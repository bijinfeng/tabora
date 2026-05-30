import { Avatar as P } from "../../primitives/avatar/avatar"
import type { AvatarProps } from "../../primitives/avatar/avatar"
import "./styles.css"
export function Avatar(props: AvatarProps) {
  return <P {...props} class="tbr-avatar" />
}
export type { AvatarProps }
