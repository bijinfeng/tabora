import { Dialog as KDialog } from "@kobalte/core/dialog"
import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { X } from "lucide-solid"

export type DrawerProps = {
  open: boolean
  onClose: () => void
  title: JSX.Element
  description?: JSX.Element
  footer?: JSX.Element
  side?: "right" | "left"
  size?: "sm" | "md" | "lg"
  class?: string
  children: JSX.Element
}

export function Drawer(props: DrawerProps) {
  return (
    <KDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
    >
      <KDialog.Portal>
        <div class={props.class ? `tbr-drawer ${props.class}` : "tbr-drawer"}>
          <KDialog.Overlay class="tbr-drawer-scrim" aria-label="关闭" />
          <KDialog.Content
            class="tbr-drawer-panel"
            data-side={props.side ?? "right"}
            data-size={props.size ?? "md"}
          >
            <header class="tbr-drawer-header">
              <div>
                <KDialog.Title class="tbr-drawer-title">{props.title}</KDialog.Title>
                <Show when={props.description}>
                  <KDialog.Description class="tbr-drawer-desc">
                    {props.description}
                  </KDialog.Description>
                </Show>
              </div>
              <KDialog.CloseButton type="button" class="tbr-drawer-close" aria-label="关闭">
                <X size={16} strokeWidth={2} />
              </KDialog.CloseButton>
            </header>
            <div class="tbr-drawer-body">{props.children}</div>
            <Show when={props.footer}>
              <footer class="tbr-drawer-footer">{props.footer}</footer>
            </Show>
          </KDialog.Content>
        </div>
      </KDialog.Portal>
    </KDialog>
  )
}
