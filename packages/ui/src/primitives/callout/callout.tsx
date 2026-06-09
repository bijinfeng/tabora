import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type CalloutVariant = "info" | "success" | "warning" | "danger"

type BaseCalloutProps = {
  variant?: CalloutVariant
  title: JSX.Element
  description?: JSX.Element
  action?: JSX.Element
  onClose?: () => void
  class?: string
}

export type BannerProps = BaseCalloutProps
export type AlertProps = Omit<BaseCalloutProps, "onClose">

export function Banner(props: BannerProps) {
  return (
    <div class={props.class} data-variant={props.variant ?? "info"} role="status">
      <span class="tbr-callout-icon" aria-hidden="true" />
      <span class="tbr-callout-body">
        <strong class="tbr-callout-title">{props.title}</strong>
        <Show when={props.description}>
          <span class="tbr-callout-desc">{props.description}</span>
        </Show>
      </span>
      <Show when={props.action}>
        <span class="tbr-callout-action">{props.action}</span>
      </Show>
      <Show when={props.onClose}>
        <button type="button" class="tbr-callout-close" aria-label="关闭" onClick={props.onClose}>
          x
        </button>
      </Show>
    </div>
  )
}

export function Alert(props: AlertProps) {
  return (
    <div class={props.class} data-variant={props.variant ?? "info"} role="note">
      <span class="tbr-callout-icon" aria-hidden="true" />
      <span class="tbr-callout-body">
        <strong class="tbr-callout-title">{props.title}</strong>
        <Show when={props.description}>
          <span class="tbr-callout-desc">{props.description}</span>
        </Show>
      </span>
      <Show when={props.action}>
        <span class="tbr-callout-action">{props.action}</span>
      </Show>
    </div>
  )
}
