import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-solid"

import type { SolidAttrs } from "../../stylex"

export type CalloutVariant = "info" | "success" | "warning" | "danger"

type BaseCalloutProps = {
  variant?: CalloutVariant
  title: JSX.Element
  description?: JSX.Element
  action?: JSX.Element
  onClose?: () => void
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  attrs?: SolidAttrs<HTMLDivElement>
  iconClass?: string | undefined
  iconStyle?: JSX.CSSProperties | undefined
  iconAttrs?: SolidAttrs<HTMLSpanElement>
  bodyClass?: string | undefined
  bodyStyle?: JSX.CSSProperties | undefined
  bodyAttrs?: SolidAttrs<HTMLSpanElement>
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  titleAttrs?: SolidAttrs<HTMLElement>
  descriptionClass?: string | undefined
  descriptionStyle?: JSX.CSSProperties | undefined
  descriptionAttrs?: SolidAttrs<HTMLSpanElement>
  actionClass?: string | undefined
  actionStyle?: JSX.CSSProperties | undefined
  actionAttrs?: SolidAttrs<HTMLSpanElement>
  closeClass?: string | undefined
  closeStyle?: JSX.CSSProperties | undefined
  closeAttrs?: SolidAttrs<HTMLButtonElement>
}

export type BannerProps = BaseCalloutProps
export type AlertProps = Omit<BaseCalloutProps, "onClose">

function calloutAttrs(props: BaseCalloutProps) {
  return {
    root: (): SolidAttrs<HTMLDivElement> =>
      props.attrs ?? { class: props.class, style: props.style },
    icon: (): SolidAttrs<HTMLSpanElement> =>
      props.iconAttrs ?? { class: props.iconClass, style: props.iconStyle },
    body: (): SolidAttrs<HTMLSpanElement> =>
      props.bodyAttrs ?? { class: props.bodyClass, style: props.bodyStyle },
    title: (): SolidAttrs<HTMLElement> =>
      props.titleAttrs ?? { class: props.titleClass, style: props.titleStyle },
    description: (): SolidAttrs<HTMLSpanElement> =>
      props.descriptionAttrs ?? { class: props.descriptionClass, style: props.descriptionStyle },
    action: (): SolidAttrs<HTMLSpanElement> =>
      props.actionAttrs ?? { class: props.actionClass, style: props.actionStyle },
    close: (): SolidAttrs<HTMLButtonElement> =>
      props.closeAttrs ?? { class: props.closeClass, style: props.closeStyle },
  }
}

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
  const attrs = calloutAttrs(props)

  return (
    <div {...attrs.root()} data-variant={variant()} role="status">
      <span {...attrs.icon()} aria-hidden="true">
        <CalloutIcon variant={variant()} />
      </span>
      <span {...attrs.body()}>
        <strong {...attrs.title()}>{props.title}</strong>
        <Show when={props.description}>
          <span {...attrs.description()}>{props.description}</span>
        </Show>
      </span>
      <Show when={props.action}>
        <span {...attrs.action()}>{props.action}</span>
      </Show>
      <Show when={props.onClose}>
        <button type="button" {...attrs.close()} aria-label="关闭" onClick={props.onClose}>
          <X size={16} strokeWidth={2} />
        </button>
      </Show>
    </div>
  )
}

export function Alert(props: AlertProps) {
  const variant = () => props.variant ?? "info"
  const attrs = calloutAttrs(props)

  return (
    <div {...attrs.root()} data-variant={variant()} role="note">
      <span {...attrs.icon()} aria-hidden="true">
        <CalloutIcon variant={variant()} />
      </span>
      <span {...attrs.body()}>
        <strong {...attrs.title()}>{props.title}</strong>
        <Show when={props.description}>
          <span {...attrs.description()}>{props.description}</span>
        </Show>
      </span>
      <Show when={props.action}>
        <span {...attrs.action()}>{props.action}</span>
      </Show>
    </div>
  )
}
