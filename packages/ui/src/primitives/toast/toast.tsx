import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type ToastVariant = "info" | "success" | "warning" | "danger"

export type ToastProps = {
  variant?: ToastVariant
  title: JSX.Element
  description?: JSX.Element
  action?: JSX.Element
  onAction?: () => void
  class?: string
}

export function Toast(props: ToastProps) {
  return (
    <div class={props.class} data-variant={props.variant ?? "info"} role="status">
      <span class="tbr-toast-icon" aria-hidden="true" />
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
