import { Popover as KPopover } from "@kobalte/core/popover"
import type { JSX } from "solid-js"
import { Show, splitProps } from "solid-js"

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
  trigger: JSX.Element
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
    "trigger",
    "children",
    "arrowClass",
    "arrowStyle",
    "titleClass",
    "titleStyle",
    "bodyClass",
    "bodyStyle",
  ])
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
        class={local.triggerClass}
        style={local.triggerStyle}
        classList={local.triggerClassList}
        disabled={local.triggerDisabled}
        {...(local.triggerId !== undefined ? { id: local.triggerId } : {})}
        {...(local.triggerTitle !== undefined ? { title: local.triggerTitle } : {})}
        {...(local.triggerAriaLabel !== undefined ? { "aria-label": local.triggerAriaLabel } : {})}
      >
        {local.trigger}
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
