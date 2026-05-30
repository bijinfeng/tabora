import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type PopoverProps = {
  open: boolean
  onClose: () => void
  title?: JSX.Element
  class?: string
  children: JSX.Element
}

export function Popover(props: PopoverProps) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Show when={props.open}>
        <div class="tbr-popover" role="dialog">
          <Show when={props.title}>
            <div class="tbr-popover-title">{props.title}</div>
          </Show>
          <div class="tbr-popover-body">{props.children}</div>
        </div>
        <div style={{ position: "fixed", inset: 0, "z-index": 49 }} onClick={props.onClose} />
      </Show>
    </div>
  )
}
