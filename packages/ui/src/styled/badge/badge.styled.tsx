import { Badge as BadgePrimitive } from "../../primitives/badge/badge"
import type { BadgeProps } from "../../primitives/badge/badge"
import { tv } from "../../tokens/createVariants"
import "./styles.css"

const badgeVariants = tv({
  base: "tbr-badge",
  variants: {},
  defaultVariants: {},
})

export function Badge(props: BadgeProps) {
  return <BadgePrimitive {...props} class={badgeVariants({})} />
}

export type { BadgeProps, BadgeVariant } from "../../primitives/badge/badge"
