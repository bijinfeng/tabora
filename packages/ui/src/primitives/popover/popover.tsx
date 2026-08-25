import { Popover as KPopover } from "@kobalte/core/popover"
import type { Component, JSX, ValidComponent } from "solid-js"
import { Show, splitProps } from "solid-js"

export type PopoverTriggerRenderProps = {
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
  role?: string
  "data-highlighted"?: boolean
  "data-open"?: ""
  "data-closed"?: ""
  onPointerDown?: JSX.EventHandlerUnion<HTMLElement, PointerEvent>
  onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
  onKeyDown?: JSX.EventHandlerUnion<HTMLElement, KeyboardEvent>
  onMouseOver?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
  onFocus?: JSX.EventHandlerUnion<HTMLElement, FocusEvent>
  [key: string]: any
}

export type PopoverProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  title?: JSX.Element
  showArrow?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  triggerClass?: string | undefined
  triggerStyle?: JSX.CSSProperties | undefined
  triggerClassList?: Record<string, boolean>
  triggerDisabled?: boolean
  triggerId?: string
  triggerTitle?: string
  triggerAriaLabel?: string
  triggerAs?: ValidComponent
  triggerAsChild?: boolean
  trigger: JSX.Element | ((props: PopoverTriggerRenderProps) => JSX.Element)
  children: JSX.Element
  arrowClass?: string | undefined
  arrowStyle?: JSX.CSSProperties | undefined
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  bodyClass?: string | undefined
  bodyStyle?: JSX.CSSProperties | undefined
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function Popover(props: PopoverProps) {
  const [local, others] = splitProps(props, [
    "open",
    "defaultOpen",
    "onOpenChange",
    "onClose",
    "title",
    "showArrow",
    "class",
    "style",
    "triggerClass",
    "triggerStyle",
    "triggerClassList",
    "triggerDisabled",
    "triggerId",
    "triggerTitle",
    "triggerAriaLabel",
    "triggerAs",
    "triggerAsChild",
    "trigger",
    "children",
    "arrowClass",
    "arrowStyle",
    "titleClass",
    "titleStyle",
    "bodyClass",
    "bodyStyle",
  ])

  const AsChildWrapper: Component<PopoverTriggerRenderProps> = (wrapperProps) => {
    const content =
      typeof local.trigger === "function"
        ? (local.trigger as (p: PopoverTriggerRenderProps) => JSX.Element)(wrapperProps)
        : local.trigger
    return content as unknown as JSX.Element
  }

  return (
    <KPopover
      {...(local.open !== undefined ? { open: local.open } : {})}
      {...(local.defaultOpen !== undefined ? { defaultOpen: local.defaultOpen } : {})}
      onOpenChange={(open) => {
        local.onOpenChange?.(open)
        if (!open) local.onClose?.()
      }}
      {...others}
    >
      <KPopover.Trigger
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
        {local.triggerAsChild ? undefined : (local.trigger as JSX.Element)}
      </KPopover.Trigger>
      <KPopover.Portal>
        <KPopover.Content {...optionalPartProps(local.class, local.style)}>
          <Show when={local.showArrow}>
            <KPopover.Arrow {...optionalPartProps(local.arrowClass, local.arrowStyle)} size={10} />
          </Show>
          <Show when={local.title}>
            <div class={local.titleClass} style={local.titleStyle}>
              {local.title}
            </div>
          </Show>
          <div class={local.bodyClass} style={local.bodyStyle}>
            {local.children}
          </div>
        </KPopover.Content>
      </KPopover.Portal>
    </KPopover>
  )
}
