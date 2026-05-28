import type { JSX } from "solid-js"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md"

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  onClick?: (e: MouseEvent) => void
  "aria-label"?: string
  children: JSX.Element
}

export function Button(props: ButtonProps) {
  return (
    <button
      class="tabora-button"
      data-variant={props.variant ?? "secondary"}
      data-size={props.size ?? "md"}
      data-loading={props.loading ? "" : undefined}
      type={props.type ?? "button"}
      disabled={props.disabled || props.loading}
      aria-label={props["aria-label"]}
      onClick={(e) => props.onClick?.(e)}
    >
      {props.children}
    </button>
  )
}

export type IconButtonProps = {
  variant?: "ghost" | "secondary" | "danger"
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  "aria-label": string
  onClick?: (e: MouseEvent) => void
  children: JSX.Element
}

export function IconButton(props: IconButtonProps) {
  return (
    <button
      class="tabora-icon-button"
      data-variant={props.variant ?? "ghost"}
      data-size={props.size ?? "md"}
      data-loading={props.loading ? "" : undefined}
      type="button"
      disabled={props.disabled || props.loading}
      aria-label={props["aria-label"]}
      onClick={(e) => props.onClick?.(e)}
    >
      {props.children}
    </button>
  )
}
