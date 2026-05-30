import type { JSX } from "solid-js"

export type ButtonVariant = "primary" | "secondary" | "subtle" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

export type HeadlessButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  type?: "button" | "submit" | "reset"
  class?: string
  onClick?: (e: MouseEvent) => void
  "aria-label"?: string
  children: JSX.Element
}

/** 无样式按钮基元 — 只提供行为和 ARIA，不附加任何视觉样式 */
export function HeadlessButton(props: HeadlessButtonProps) {
  return (
    <button
      class={props.class}
      data-variant={props.variant}
      data-size={props.size}
      data-loading={props.loading ? "" : undefined}
      data-fullwidth={props.fullWidth ? "" : undefined}
      type={props.type ?? "button"}
      disabled={props.disabled || props.loading}
      aria-label={props["aria-label"]}
      aria-busy={props.loading ? true : undefined}
      onClick={(e) => {
        if (!props.loading) props.onClick?.(e)
      }}
    >
      {props.children}
    </button>
  )
}

export type HeadlessIconButtonProps = {
  variant?: "ghost" | "secondary" | "danger"
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  class?: string
  "aria-label": string
  onClick?: (e: MouseEvent) => void
  children: JSX.Element
}

/** 无样式图标按钮基元 */
export function HeadlessIconButton(props: HeadlessIconButtonProps) {
  return (
    <button
      class={props.class}
      data-variant={props.variant ?? "ghost"}
      data-size={props.size ?? "md"}
      data-loading={props.loading ? "" : undefined}
      type="button"
      disabled={props.disabled || props.loading}
      aria-label={props["aria-label"]}
      aria-busy={props.loading ? true : undefined}
      onClick={(e) => {
        if (!props.loading) props.onClick?.(e)
      }}
    >
      {props.children}
    </button>
  )
}

export type ButtonProps = HeadlessButtonProps
export type IconButtonProps = HeadlessIconButtonProps
