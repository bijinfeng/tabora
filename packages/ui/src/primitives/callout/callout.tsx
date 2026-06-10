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
  class?: string
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
    <div class={props.class} data-variant={variant()} role="status">
      <span class="tbr-callout-icon" aria-hidden="true">
        <CalloutIcon variant={variant()} />
      </span>
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
          <X size={16} strokeWidth={2} />
        </button>
      </Show>
    </div>
  )
}

export function Alert(props: AlertProps) {
  const variant = () => props.variant ?? "info"

  return (
    <div class={props.class} data-variant={variant()} role="note">
      <span class="tbr-callout-icon" aria-hidden="true">
        <CalloutIcon variant={variant()} />
      </span>
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
