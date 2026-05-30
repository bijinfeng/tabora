import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type BadgeVariant =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "counter"
  | "dot"

export type BadgeProps = {
  variant?: BadgeVariant
  size?: "sm" | "md"
  class?: string
  children?: JSX.Element
}

export function Badge(props: BadgeProps) {
  return (
    <span
      class={props.class}
      data-variant={props.variant ?? "neutral"}
      data-size={props.size ?? "md"}
    >
      <Show when={props.variant !== "dot"}>{props.children}</Show>
    </span>
  )
}
