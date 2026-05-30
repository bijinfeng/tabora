import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type DialogProps = {
  open: boolean
  onClose: () => void
  title: JSX.Element
  description?: JSX.Element
  children?: JSX.Element
  footer?: JSX.Element
  destructive?: boolean
  size?: "sm" | "md" | "lg"
  class?: string
}

export function Dialog(props: DialogProps) {
  const sizes = { sm: "320px", md: "420px", lg: "560px" }
  return (
    <Show when={props.open}>
      <div
        class={`tbr-dialog-overlay ${props.class ?? ""}`}
        onClick={props.onClose}
        role="dialog"
        aria-modal="true"
        aria-label={typeof props.title === "string" ? props.title : undefined}
      >
        <div
          class="tbr-dialog-panel"
          data-destructive={props.destructive ? "" : undefined}
          data-size={props.size ?? "md"}
          style={{ width: sizes[props.size ?? "md"], "max-width": "90vw" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="tbr-dialog-header">{props.title}</div>
          <Show when={props.description}>
            <div class="tbr-dialog-body">{props.description}</div>
          </Show>
          {props.children}
          <Show when={props.footer}>
            <div class="tbr-dialog-footer">{props.footer}</div>
          </Show>
        </div>
      </div>
    </Show>
  )
}
