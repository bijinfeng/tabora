import type { JSX } from "solid-js"
import { For } from "solid-js"

export type ContextMenuItem = {
  key: string
  label: JSX.Element
  icon?: JSX.Element
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  separator?: true
}

export type ContextMenuProps = {
  items: ContextMenuItem[]
  onSelect: (key: string) => void
  class?: string
  children?: JSX.Element
  "aria-label"?: string
}

export function ContextMenu(props: ContextMenuProps) {
  return (
    <div class={props.class}>
      {props.children}
      <div class="tbr-context-menu-content" role="menu" aria-label={props["aria-label"]}>
        <For each={props.items}>
          {(item) =>
            item.separator ? (
              <div class="tbr-context-menu-sep" role="separator" />
            ) : (
              <button
                type="button"
                class="tbr-context-menu-item"
                role="menuitem"
                data-danger={item.danger ? "" : undefined}
                disabled={item.disabled}
                onClick={() => props.onSelect(item.key)}
              >
                {item.icon && <span class="tbr-context-menu-icon">{item.icon}</span>}
                <span class="tbr-context-menu-label">{item.label}</span>
                {item.shortcut && <kbd class="tbr-context-menu-kbd">{item.shortcut}</kbd>}
              </button>
            )
          }
        </For>
      </div>
    </div>
  )
}
