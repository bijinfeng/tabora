import { DropdownMenu as KDropdownMenu } from "@kobalte/core/dropdown-menu"
import type { Component, JSX, ValidComponent } from "solid-js"
import { For, Show, splitProps } from "solid-js"

type KobalteDropdownMenuPlacement = NonNullable<Parameters<typeof KDropdownMenu>[0]["placement"]>

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

export type DropdownMenuTriggerRenderProps = {
  id?: string
  class?: string
  style?: JSX.CSSProperties
  ref?: any
  disabled?: boolean
  "aria-haspopup"?: boolean
  "aria-expanded"?: boolean
  "aria-controls"?: string
  "aria-label"?: string
  title?: string
  role?: "menuitem"
  "data-highlighted"?: boolean
  "data-open"?: ""
  "data-closed"?: ""
  "data-kb-menu-value-trigger"?: string
  onPointerDown?: JSX.EventHandlerUnion<HTMLElement, PointerEvent>
  onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
  onKeyDown?: JSX.EventHandlerUnion<HTMLElement, KeyboardEvent>
  onMouseOver?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
  onFocus?: JSX.EventHandlerUnion<HTMLElement, FocusEvent>
  [key: string]: any
}

export type DropdownMenuProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  title?: JSX.Element
  items: DropdownMenuItem[]
  side?: DropdownMenuSide
  align?: DropdownMenuAlign
  sideOffset?: number
  alignOffset?: number
  showArrow?: boolean
  triggerClass?: string | undefined
  triggerStyle?: JSX.CSSProperties | undefined
  triggerClassList?: Record<string, boolean>
  triggerDisabled?: boolean
  triggerId?: string
  triggerTitle?: string
  triggerAriaLabel?: string
  triggerAs?: ValidComponent
  triggerAsChild?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  arrowClass?: string | undefined
  arrowStyle?: JSX.CSSProperties | undefined
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  itemClass?: string | undefined
  itemStyle?: JSX.CSSProperties | undefined
  itemDangerClass?: string | undefined
  itemDangerStyle?: JSX.CSSProperties | undefined
  separatorClass?: string | undefined
  separatorStyle?: JSX.CSSProperties | undefined
  checkClass?: string | undefined
  checkStyle?: JSX.CSSProperties | undefined
  iconClass?: string | undefined
  iconStyle?: JSX.CSSProperties | undefined
  labelClass?: string | undefined
  labelStyle?: JSX.CSSProperties | undefined
  kbdClass?: string | undefined
  kbdStyle?: JSX.CSSProperties | undefined
  children: JSX.Element | ((props: DropdownMenuTriggerRenderProps) => JSX.Element)
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function DropdownMenu(props: DropdownMenuProps) {
  const [local, others] = splitProps(props, [
    "open",
    "defaultOpen",
    "onOpenChange",
    "onClose",
    "title",
    "items",
    "side",
    "align",
    "sideOffset",
    "alignOffset",
    "showArrow",
    "triggerClass",
    "triggerStyle",
    "triggerClassList",
    "triggerDisabled",
    "triggerId",
    "triggerTitle",
    "triggerAriaLabel",
    "triggerAs",
    "triggerAsChild",
    "class",
    "style",
    "arrowClass",
    "arrowStyle",
    "titleClass",
    "titleStyle",
    "itemClass",
    "itemStyle",
    "itemDangerClass",
    "itemDangerStyle",
    "separatorClass",
    "separatorStyle",
    "checkClass",
    "checkStyle",
    "iconClass",
    "iconStyle",
    "labelClass",
    "labelStyle",
    "kbdClass",
    "kbdStyle",
    "children",
  ])

  const placementMap = {
    top: { start: "top-start", end: "top-end" },
    bottom: { start: "bottom-start", end: "bottom-end" },
    left: { start: "left-start", end: "left-end" },
    right: { start: "right-start", end: "right-end" },
  } satisfies Record<DropdownMenuSide, Record<DropdownMenuAlign, KobalteDropdownMenuPlacement>>

  const placement = () => {
    const side = local.side ?? "bottom"
    const align = local.align ?? "end"
    return placementMap[side][align]
  }

  const AsChildWrapper: Component<DropdownMenuTriggerRenderProps> = (wrapperProps) => {
    const content =
      typeof local.children === "function"
        ? (local.children as (p: DropdownMenuTriggerRenderProps) => JSX.Element)(wrapperProps)
        : local.children
    return content as unknown as JSX.Element
  }

  return (
    <KDropdownMenu
      {...(local.open !== undefined ? { open: local.open } : {})}
      {...(local.defaultOpen !== undefined ? { defaultOpen: local.defaultOpen } : {})}
      placement={placement()}
      gutter={local.sideOffset ?? 6}
      shift={local.alignOffset ?? 0}
      flip={true}
      slide={true}
      overflowPadding={8}
      onOpenChange={(next) => {
        local.onOpenChange?.(next)
        if (!next) local.onClose?.()
      }}
      {...others}
    >
      <KDropdownMenu.Trigger
        as={
          (local.triggerAsChild
            ? (AsChildWrapper as unknown as ValidComponent)
            : local.triggerAs) as any
        }
        class={local.triggerClass}
        style={local.triggerStyle}
        classList={local.triggerClassList}
        disabled={local.triggerDisabled}
        {...(local.triggerId !== undefined ? { id: local.triggerId } : {})}
        {...(local.triggerTitle !== undefined ? { title: local.triggerTitle } : {})}
        {...(local.triggerAriaLabel !== undefined ? { "aria-label": local.triggerAriaLabel } : {})}
      >
        {local.triggerAsChild ? undefined : (local.children as JSX.Element)}
      </KDropdownMenu.Trigger>
      <KDropdownMenu.Portal>
        <KDropdownMenu.Content {...optionalPartProps(local.class, local.style)}>
          <Show when={local.showArrow}>
            <KDropdownMenu.Arrow
              {...optionalPartProps(local.arrowClass, local.arrowStyle)}
              size={10}
            />
          </Show>
          <Show when={local.title}>
            <div class={local.titleClass} style={local.titleStyle}>
              {local.title}
            </div>
          </Show>
          <For each={local.items}>
            {(item) =>
              item.separator ? (
                <KDropdownMenu.Separator
                  {...optionalPartProps(local.separatorClass, local.separatorStyle)}
                />
              ) : (
                <KDropdownMenu.Item
                  class={[local.itemClass, item.danger ? local.itemDangerClass : undefined]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    item.danger ? { ...local.itemStyle, ...local.itemDangerStyle } : local.itemStyle
                  }
                  {...(item.disabled !== undefined ? { disabled: item.disabled } : {})}
                  data-danger={item.danger ? "" : undefined}
                  data-checked={item.checked ? "" : undefined}
                  onSelect={() => {
                    item.onClick?.()
                  }}
                >
                  <Show when={item.checked}>
                    <span class={local.checkClass} style={local.checkStyle} aria-hidden="true" />
                  </Show>
                  {item.icon && !item.checked && (
                    <span class={local.iconClass} style={local.iconStyle}>
                      {item.icon}
                    </span>
                  )}
                  <span class={local.labelClass} style={local.labelStyle}>
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <kbd class={local.kbdClass} style={local.kbdStyle}>
                      {item.shortcut}
                    </kbd>
                  )}
                </KDropdownMenu.Item>
              )
            }
          </For>
        </KDropdownMenu.Content>
      </KDropdownMenu.Portal>
    </KDropdownMenu>
  )
}
