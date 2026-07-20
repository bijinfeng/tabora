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
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  triggerClass?: string | undefined
  triggerStyle?: JSX.CSSProperties | undefined
  triggerClassList?: Record<string, boolean>
  /** 让触发器渲染为消费方自己的元素时，把额外属性透传到触发器 div 上 */
  triggerProps?: Record<string, unknown>
  /** 触发器元素 ref（可与外部 ref 合并） */
  triggerRef?: (element: HTMLDivElement) => void
  children?: JSX.Element
  contentClass?: string | undefined
  contentStyle?: JSX.CSSProperties | undefined
  itemClass?: string | undefined
  itemStyle?: JSX.CSSProperties | undefined
  itemDangerClass?: string | undefined
  itemDangerStyle?: JSX.CSSProperties | undefined
  separatorClass?: string | undefined
  separatorStyle?: JSX.CSSProperties | undefined
  iconClass?: string | undefined
  iconStyle?: JSX.CSSProperties | undefined
  labelClass?: string | undefined
  labelStyle?: JSX.CSSProperties | undefined
  trailingClass?: string | undefined
  trailingStyle?: JSX.CSSProperties | undefined
  kbdClass?: string | undefined
  kbdStyle?: JSX.CSSProperties | undefined
  "aria-label"?: string
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
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
        {...optionalPartProps(triggerClass(), props.triggerStyle ?? props.style)}
        {...(props.triggerClassList !== undefined ? { classList: props.triggerClassList } : {})}
        {...(props.triggerRef ? { ref: props.triggerRef } : {})}
        {...(triggerExtra() as Record<string, never>)}
      >
        {props.children}
      </KContextMenu.Trigger>
      <KContextMenu.Portal>
        <KContextMenu.Content
          {...optionalPartProps(props.contentClass, props.contentStyle)}
          aria-label={props["aria-label"]}
        >
          <For each={props.items}>
            {(item) =>
              item.separator ? (
                <KContextMenu.Separator
                  {...optionalPartProps(props.separatorClass, props.separatorStyle)}
                />
              ) : (
                <KContextMenu.Item
                  class={[props.itemClass, item.danger ? props.itemDangerClass : undefined]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    item.danger ? { ...props.itemStyle, ...props.itemDangerStyle } : props.itemStyle
                  }
                  data-danger={item.danger ? "" : undefined}
                  {...(item.disabled !== undefined ? { disabled: item.disabled } : {})}
                  onSelect={() => props.onSelect(item.key)}
                >
                  {item.icon && (
                    <span class={props.iconClass} style={props.iconStyle}>
                      {item.icon}
                    </span>
                  )}
                  <span class={props.labelClass} style={props.labelStyle}>
                    {item.label}
                  </span>
                  {item.trailing && (
                    <span class={props.trailingClass} style={props.trailingStyle}>
                      {item.trailing}
                    </span>
                  )}
                  {item.shortcut && (
                    <kbd class={props.kbdClass} style={props.kbdStyle}>
                      {item.shortcut}
                    </kbd>
                  )}
                </KContextMenu.Item>
              )
            }
          </For>
        </KContextMenu.Content>
      </KContextMenu.Portal>
    </KContextMenu>
  )
}
