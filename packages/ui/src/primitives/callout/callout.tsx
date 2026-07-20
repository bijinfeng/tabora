import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-solid"

export type CalloutVariant = "info" | "success" | "warning" | "danger"

type BaseCalloutProps = {
  variant?: CalloutVariant
  title: JSX.Element
  description?: JSX.Element
  action?: JSX.Element
  onClose?: () => void
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  iconClass?: string | undefined
  iconStyle?: JSX.CSSProperties | undefined
  bodyClass?: string | undefined
  bodyStyle?: JSX.CSSProperties | undefined
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  descriptionClass?: string | undefined
  descriptionStyle?: JSX.CSSProperties | undefined
  actionClass?: string | undefined
  actionStyle?: JSX.CSSProperties | undefined
  closeClass?: string | undefined
  closeStyle?: JSX.CSSProperties | undefined
}

export type BannerProps = BaseCalloutProps
export type AlertProps = Omit<BaseCalloutProps, "onClose">

function CalloutIcon(props: { variant: CalloutVariant }) {
  switch (props.variant) {
    case "success":
      return <CircleCheck size={16} strokeWidth={2} />
    case "warning":
      return <TriangleAlert size={16} strokeWidth={2} />
    case "danger":
      return <CircleAlert size={16} strokeWidth={2} />
    case "info":
      return <Info size={16} strokeWidth={2} />
  }
}

export function Banner(props: BannerProps) {
  const variant = () => props.variant ?? "info"

  return (
    <div class={props.class} style={props.style} data-variant={variant()} role="status">
      <span class={props.iconClass} style={props.iconStyle} aria-hidden="true">
        <CalloutIcon variant={variant()} />
      </span>
      <span class={props.bodyClass} style={props.bodyStyle}>
        <strong class={props.titleClass} style={props.titleStyle}>
          {props.title}
        </strong>
        <Show when={props.description}>
          <span class={props.descriptionClass} style={props.descriptionStyle}>
            {props.description}
          </span>
        </Show>
      </span>
      <Show when={props.action}>
        <span class={props.actionClass} style={props.actionStyle}>
          {props.action}
        </span>
      </Show>
      <Show when={props.onClose}>
        <button
          type="button"
          class={props.closeClass}
          style={props.closeStyle}
          aria-label="关闭"
          onClick={props.onClose}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </Show>
    </div>
  )
}

export function Alert(props: AlertProps) {
  const variant = () => props.variant ?? "info"

  return (
    <div class={props.class} style={props.style} data-variant={variant()} role="note">
      <span class={props.iconClass} style={props.iconStyle} aria-hidden="true">
        <CalloutIcon variant={variant()} />
      </span>
      <span class={props.bodyClass} style={props.bodyStyle}>
        <strong class={props.titleClass} style={props.titleStyle}>
          {props.title}
        </strong>
        <Show when={props.description}>
          <span class={props.descriptionClass} style={props.descriptionStyle}>
            {props.description}
          </span>
        </Show>
      </span>
      <Show when={props.action}>
        <span class={props.actionClass} style={props.actionStyle}>
          {props.action}
        </span>
      </Show>
    </div>
  )
}
