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

export type DropdownMenuSide = "top" | "bottom" | "left" | "right"

export type DropdownMenuAlign = "start" | "end"

export type DropdownMenuProps = {
  open: boolean
  onClose: () => void
  items: DropdownMenuItem[]
  side?: DropdownMenuSide
  align?: DropdownMenuAlign
  sideOffset?: number
  alignOffset?: number
  showArrow?: boolean
  class?: string
  children: JSX.Element
}

export function DropdownMenu(props: DropdownMenuProps) {
  const side = () => props.side ?? "bottom"
  const align = () => props.align ?? "end"
  const sideOffset = () => props.sideOffset ?? 4
  const alignOffset = () => props.alignOffset ?? 0
  const menuClass = () => (props.class ? `tbr-dropdown ${props.class}` : "tbr-dropdown")
  const menuStyle = () => {
    const so = `${sideOffset()}px`
    const ao = `${alignOffset()}px`
    if (side() === "top") {
      return {
        bottom: `calc(100% + ${so})`,
        ...(align() === "start" ? { left: ao } : { right: ao }),
      }
    }
    if (side() === "left") {
      return {
        right: `calc(100% + ${so})`,
        ...(align() === "start" ? { top: ao } : { bottom: ao }),
      }
    }
    if (side() === "right") {
      return {
        left: `calc(100% + ${so})`,
        ...(align() === "start" ? { top: ao } : { bottom: ao }),
      }
    }
    return {
      top: `calc(100% + ${so})`,
      ...(align() === "start" ? { left: ao } : { right: ao }),
    }
  }
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {props.children}
      {props.open && (
        <div
          class={menuClass()}
          style={menuStyle()}
          data-side={side()}
          data-align={align()}
          data-arrow={props.showArrow ? "" : undefined}
          onClick={(e) => e.stopPropagation()}
          role="menu"
        >
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
