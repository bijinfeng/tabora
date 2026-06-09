import type { JSX } from "solid-js"
import { Show } from "solid-js"

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
    <Show when={props.open}>
      <div class={props.class} role="dialog" aria-modal="true">
        <button type="button" class="tbr-drawer-scrim" aria-label="关闭" onClick={props.onClose} />
        <aside
          class="tbr-drawer-panel"
          data-side={props.side ?? "right"}
          data-size={props.size ?? "md"}
        >
          <header class="tbr-drawer-header">
            <div>
              <h2 class="tbr-drawer-title">{props.title}</h2>
              <Show when={props.description}>
                <p class="tbr-drawer-desc">{props.description}</p>
              </Show>
            </div>
            <button
              type="button"
              class="tbr-drawer-close"
              aria-label="关闭"
              onClick={props.onClose}
            >
              x
            </button>
          </header>
          <div class="tbr-drawer-body">{props.children}</div>
          <Show when={props.footer}>
            <footer class="tbr-drawer-footer">{props.footer}</footer>
          </Show>
        </aside>
      </div>
    </Show>
  )
}
