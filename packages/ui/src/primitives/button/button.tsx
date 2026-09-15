import { splitProps, type JSX } from "solid-js"

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "ghost"
  | "link"
  | "danger"
  | "danger-subtle"
export type ButtonSize = "mini" | "sm" | "md" | "lg"
export type ButtonShape = "default" | "circle" | "round"
export type IconPlacement = "start" | "end"

type NativeButtonProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children" | "class" | "disabled" | "onClick" | "style" | "type"
>

export type HeadlessButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  href?: string
  type?: "button" | "submit" | "reset"
  class?: string | undefined
  style?: JSX.HTMLAttributes<HTMLButtonElement>["style"]
  onClick?: (e: MouseEvent) => void
  "aria-label"?: string
  icon?: JSX.Element
  iconPlacement?: IconPlacement
  children: JSX.Element
} & NativeButtonProps

/** 无样式按钮基元 — 只提供行为和 ARIA，不附加任何视觉样式 */
export function HeadlessButton(props: HeadlessButtonProps) {
  const [local, others] = splitProps(props, [
    "variant",
    "size",
    "shape",
    "loading",
    "disabled",
    "fullWidth",
    "href",
    "type",
    "class",
    "style",
    "onClick",
    "aria-label",
    "icon",
    "iconPlacement",
    "children",
  ])

  const placement = local.iconPlacement ?? "start"
  const content = (
    <>
      {local.icon && placement === "start" && local.icon}
      {local.children}
      {local.icon && placement === "end" && local.icon}
    </>
  )

  if (local.href !== undefined) {
    const linkProps = {
      ...others,
      class: local.class,
      style: local.style,
      "data-variant": local.variant ?? "secondary",
      "data-size": local.size,
      "data-shape": local.shape ?? "default",
      "data-loading": local.loading ? "" : undefined,
      "data-fullwidth": local.fullWidth ? "" : undefined,
      "data-icon-placement": local.icon ? placement : undefined,
      href: local.href,
      "aria-label": local["aria-label"],
      "aria-busy": local.loading ? true : undefined,
      "aria-disabled": local.disabled || local.loading ? true : undefined,
      onClick: (e: MouseEvent) => {
        if (local.disabled || local.loading) {
          e.preventDefault()
          return
        }
        local.onClick?.(e)
      },
    }

    return <a {...(linkProps as JSX.AnchorHTMLAttributes<HTMLAnchorElement>)}>{content}</a>
  }

  return (
    <button
      {...others}
      class={local.class}
      style={local.style}
      data-variant={local.variant}
      data-size={local.size}
      data-shape={local.shape ?? "default"}
      data-loading={local.loading ? "" : undefined}
      data-fullwidth={local.fullWidth ? "" : undefined}
      data-icon-placement={local.icon ? placement : undefined}
      type={local.type ?? "button"}
      disabled={local.disabled || local.loading}
      aria-label={local["aria-label"]}
      aria-busy={local.loading ? true : undefined}
      onClick={(e) => {
        if (!local.loading) local.onClick?.(e)
      }}
    >
      {content}
    </button>
  )
}

export type HeadlessIconButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  loading?: boolean
  disabled?: boolean
  class?: string | undefined
  style?: JSX.HTMLAttributes<HTMLButtonElement>["style"]
  "aria-label": string
  onClick?: (e: MouseEvent) => void
  children: JSX.Element
} & NativeButtonProps

/** 无样式图标按钮基元 */
export function HeadlessIconButton(props: HeadlessIconButtonProps) {
  const [local, others] = splitProps(props, [
    "variant",
    "size",
    "shape",
    "loading",
    "disabled",
    "class",
    "style",
    "aria-label",
    "onClick",
    "children",
  ])

  return (
    <button
      {...others}
      class={local.class}
      style={local.style}
      data-variant={local.variant ?? "ghost"}
      data-size={local.size ?? "md"}
      data-shape={local.shape ?? "default"}
      data-loading={local.loading ? "" : undefined}
      type="button"
      disabled={local.disabled || local.loading}
      aria-label={local["aria-label"]}
      aria-busy={local.loading ? true : undefined}
      onClick={(e) => {
        if (!local.loading) local.onClick?.(e)
      }}
    >
      {local.children}
    </button>
  )
}
