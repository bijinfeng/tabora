import { ContextMenu as KContextMenu } from "@kobalte/core/context-menu"
import type { JSX } from "solid-js"
import { For } from "solid-js"

export type ContextMenuItem = {
  key: string
  label: JSX.Element
  icon?: JSX.Element
  shortcut?: string
  trailing?: JSX.Element
  danger?: boolean
  disabled?: boolean
  separator?: true
}

export type ContextMenuProps = {
  items: ContextMenuItem[]
  onSelect: (key: string) => void
  class?: string
  triggerClass?: string
  triggerClassList?: Record<string, boolean>
  /** 让触发器渲染为消费方自己的元素时，把额外属性透传到触发器 div 上 */
  triggerProps?: Record<string, unknown>
  /** 触发器元素 ref（可与外部 ref 合并） */
  triggerRef?: (element: HTMLDivElement) => void
  children?: JSX.Element
  "aria-label"?: string
}

export function ContextMenu(props: ContextMenuProps) {
  const triggerClass = () => {
    if (props.class && props.triggerClass) return `${props.class} ${props.triggerClass}`
    return props.class ?? props.triggerClass
  }
  const triggerExtra = (): Record<string, unknown> => {
    const extra = props.triggerProps
    if (!extra) return {}
    // class/classList 由专用 prop 控制，避免重复
    const { class: _class, classList: _classList, ...rest } = extra
    return rest
  }
  return (
    <KContextMenu>
      <KContextMenu.Trigger
        class={triggerClass()}
        classList={props.triggerClassList}
        {...(props.triggerRef ? { ref: props.triggerRef } : {})}
        {...(triggerExtra() as Record<string, never>)}
      >
        {props.children}
      </KContextMenu.Trigger>
      <KContextMenu.Portal>
        <KContextMenu.Content class="tbr-context-menu-content" aria-label={props["aria-label"]}>
          <For each={props.items}>
            {(item) =>
              item.separator ? (
                <KContextMenu.Separator class="tbr-context-menu-sep" />
              ) : (
                <KContextMenu.Item
                  class="tbr-context-menu-item"
                  data-danger={item.danger ? "" : undefined}
                  {...(item.disabled !== undefined ? { disabled: item.disabled } : {})}
                  onSelect={() => props.onSelect(item.key)}
                >
                  {item.icon && <span class="tbr-context-menu-icon">{item.icon}</span>}
                  <span class="tbr-context-menu-label">{item.label}</span>
                  {item.trailing && <span class="tbr-context-menu-trailing">{item.trailing}</span>}
                  {item.shortcut && <kbd class="tbr-context-menu-kbd">{item.shortcut}</kbd>}
                </KContextMenu.Item>
              )
            }
          </For>
        </KContextMenu.Content>
      </KContextMenu.Portal>
    </KContextMenu>
  )
}
