import { Badge as BadgePrimitive } from "../../primitives/badge/badge"
import type { BadgeProps } from "../../primitives/badge/badge"
import "./styles.css"

export function Badge(props: BadgeProps) {
  return <BadgePrimitive {...props} class="tbr-badge" />
}

export type { BadgeProps, BadgeVariant } from "../../primitives/badge/badge"
