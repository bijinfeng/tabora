import type { JSX } from "solid-js"

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger"

export type BadgeProps = {
  variant?: BadgeVariant
  class?: string
  children: JSX.Element
}

export function Badge(props: BadgeProps) {
  return (
    <span class={props.class} data-variant={props.variant ?? "neutral"}>
      {props.children}
    </span>
  )
}
