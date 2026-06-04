import { For, Show } from "solid-js"

export type ToastMessage = {
  id: number
  msg: string
}

export function ToastHost(props: { toasts: ToastMessage[] }) {
  return (
    <Show when={props.toasts.length > 0}>
      <div class="toast-stack" aria-live="polite" aria-atomic="true">
        <For each={props.toasts}>{(toast) => <div class="toast-item">{toast.msg}</div>}</For>
      </div>
    </Show>
  )
}
