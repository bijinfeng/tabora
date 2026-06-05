import { For, Show } from "solid-js"
import type { ToastRecord } from "@tabora/orchestrator"

export type ToastMessage = ToastRecord

export function ToastHost(props: {
  toasts: ToastMessage[]
  onAction?: (commandId: string) => void
}) {
  return (
    <Show when={props.toasts.length > 0}>
      <div class="toast-stack" aria-live="polite" aria-atomic="true">
        <For each={props.toasts}>
          {(toast) => (
            <div class="toast-item" data-toast-type={toast.type}>
              <span>{toast.message}</span>
              <Show when={toast.action}>
                {(action) => (
                  <button
                    class="toast-action"
                    type="button"
                    onClick={() => props.onAction?.(action().commandId)}
                  >
                    {action().label}
                  </button>
                )}
              </Show>
            </div>
          )}
        </For>
      </div>
    </Show>
  )
}
