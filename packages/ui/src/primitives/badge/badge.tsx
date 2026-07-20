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

export type BadgeColorVariant = "neutral" | "accent" | "success" | "warning" | "danger"

export type BadgeProps = {
  variant?: BadgeVariant
  size?: "sm" | "md"
  dotColor?: BadgeColorVariant
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  children?: JSX.Element
}

export function Badge(props: BadgeProps) {
  return (
    <span
      class={props.class}
      style={props.style}
      data-variant={props.variant ?? "neutral"}
      data-size={props.size ?? "md"}
      data-dot-color={props.variant === "dot" ? (props.dotColor ?? "accent") : undefined}
    >
      <Show when={props.variant !== "dot"}>{props.children}</Show>
    </span>
  )
}
