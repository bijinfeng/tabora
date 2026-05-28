import type { JSX } from "solid-js"

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger"

export type BadgeProps = {
  variant?: BadgeVariant
  children: JSX.Element
}

export function Badge(props: BadgeProps) {
  return (
    <span class="tabora-badge" data-variant={props.variant ?? "neutral"}>
      {props.children}
    </span>
  )
}
