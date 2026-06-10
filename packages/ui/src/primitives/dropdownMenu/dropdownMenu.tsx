import type { JSX } from "solid-js"
import { For } from "solid-js"
import { Check } from "lucide-solid"

export type DropdownMenuItem = {
  id: string
  label: JSX.Element
  icon?: JSX.Element
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  checked?: boolean
  separator?: true
  onClick?: () => void
}

export type DropdownMenuProps = {
  open: boolean
  onClose: () => void
  items: DropdownMenuItem[]
  class?: string
  children: JSX.Element
}

export function DropdownMenu(props: DropdownMenuProps) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {props.children}
      {props.open && (
        <div class="tbr-dropdown" onClick={(e) => e.stopPropagation()} role="menu">
          <For each={props.items}>
            {(item) =>
              item.separator ? (
                <div class="tbr-dropdown-sep" role="separator" />
              ) : (
                <button
                  class="tbr-dropdown-item"
                  data-danger={item.danger ? "" : undefined}
                  data-disabled={item.disabled ? "" : undefined}
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.()
                    props.onClose()
                  }}
                >
                  {item.icon && <span class="tbr-dropdown-icon">{item.icon}</span>}
                  {item.checked && (
                    <span class="tbr-dropdown-check">
                      <Check size={16} strokeWidth={2} />
                    </span>
                  )}
                  <span class="tbr-dropdown-label">{item.label}</span>
                  {item.shortcut && <kbd class="tbr-dropdown-kbd">{item.shortcut}</kbd>}
                </button>
              )
            }
          </For>
        </div>
      )}
      {props.open && (
        <div style={{ position: "fixed", inset: 0, "z-index": 49 }} onClick={props.onClose} />
      )}
    </div>
  )
}
