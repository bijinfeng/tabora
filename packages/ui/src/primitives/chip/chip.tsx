import type { JSX } from "solid-js"
import { X } from "lucide-solid"

export type ChipProps = {
  selected?: boolean
  removable?: boolean
  onRemove?: () => void
  class?: string
  children: JSX.Element
}

export function Chip(props: ChipProps) {
  return (
    <span class={props.class} data-selected={props.selected ? "" : undefined}>
      {props.children}
      {props.removable && (
        <button
          class="tbr-chip-remove"
          onClick={(e) => {
            e.stopPropagation()
            props.onRemove?.()
          }}
          aria-label="移除"
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}
    </span>
  )
}
