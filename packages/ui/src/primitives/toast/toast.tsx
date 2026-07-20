import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-solid"

export type ToastVariant = "info" | "success" | "warning" | "danger"

export type ToastProps = {
  variant?: ToastVariant
  title: JSX.Element
  description?: JSX.Element
  action?: JSX.Element
  onAction?: () => void
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
}

function ToastIcon(props: { variant: ToastVariant }) {
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

export function Toast(props: ToastProps) {
  const variant = () => props.variant ?? "info"

  return (
    <div class={props.class} style={props.style} data-variant={variant()} role="status">
      <span class={props.iconClass} style={props.iconStyle} aria-hidden="true">
        <ToastIcon variant={variant()} />
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
        <button
          type="button"
          class={props.actionClass}
          style={props.actionStyle}
          onClick={props.onAction}
        >
          {props.action}
        </button>
      </Show>
    </div>
  )
}
