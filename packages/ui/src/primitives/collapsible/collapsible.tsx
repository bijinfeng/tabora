import type { JSX } from "solid-js"
import { Show, createSignal } from "solid-js"

export type CollapsibleProps = {
  open?: boolean
  title: JSX.Element
  class?: string
  children: JSX.Element
}

export function Collapsible(props: CollapsibleProps) {
  const [open, setOpen] = createSignal(props.open ?? false)
  return (
    <div class={`tbr-collapsible ${props.class ?? ""}`}>
      <button
        class="tbr-collapsible-trigger"
        onClick={() => setOpen(!open())}
        aria-expanded={open()}
      >
        {props.title}
        <span class="tbr-collapsible-arrow" data-open={open() ? "" : undefined}>
          ▸
        </span>
      </button>
      <Show when={open()}>
        <div class="tbr-collapsible-content">{props.children}</div>
      </Show>
    </div>
  )
}
