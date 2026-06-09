import type { JSX } from "solid-js"
import { For } from "solid-js"

export type MenubarItem = {
  value: string
  label: JSX.Element
  disabled?: boolean
}

export type MenubarProps = {
  value: string
  onChange: (value: string) => void
  items: MenubarItem[]
  class?: string
  "aria-label": string
}

export function Menubar(props: MenubarProps) {
  return (
    <div class={props.class} role="menubar" aria-label={props["aria-label"]}>
      <For each={props.items}>
        {(item) => (
          <button
            type="button"
            role="menuitemradio"
            class="tbr-menubar-item"
            aria-checked={props.value === item.value}
            data-active={props.value === item.value ? "" : undefined}
            disabled={item.disabled}
            onClick={() => props.onChange(item.value)}
          >
            {item.label}
          </button>
        )}
      </For>
    </div>
  )
}
