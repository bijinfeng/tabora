import { Dialog as KDialog } from "@kobalte/core/dialog"
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
    <KDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
    >
      <KDialog.Portal>
        <KDialog.Overlay class={`tbr-dialog-overlay ${props.class ?? ""}`} />
        <KDialog.Content
          class="tbr-dialog-panel"
          data-destructive={props.destructive ? "" : undefined}
          data-size={props.size ?? "md"}
          style={{ width: sizes[props.size ?? "md"], "max-width": "90vw" }}
        >
          <KDialog.Title class="tbr-dialog-header">{props.title}</KDialog.Title>
          <Show when={props.description}>
            <KDialog.Description class="tbr-dialog-body">{props.description}</KDialog.Description>
          </Show>
          {props.children}
          <Show when={props.footer}>
            <div class="tbr-dialog-footer">{props.footer}</div>
          </Show>
        </KDialog.Content>
      </KDialog.Portal>
    </KDialog>
  )
}
