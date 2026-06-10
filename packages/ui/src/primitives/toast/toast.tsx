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
  class?: string
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
    <div class={props.class} data-variant={variant()} role="status">
      <span class="tbr-toast-icon" aria-hidden="true">
        <ToastIcon variant={variant()} />
      </span>
      <span class="tbr-toast-body">
        <strong class="tbr-toast-title">{props.title}</strong>
        <Show when={props.description}>
          <span class="tbr-toast-desc">{props.description}</span>
        </Show>
      </span>
      <Show when={props.action}>
        <button type="button" class="tbr-toast-action" onClick={props.onAction}>
          {props.action}
        </button>
      </Show>
    </div>
  )
}
