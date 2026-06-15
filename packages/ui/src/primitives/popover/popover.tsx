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
  class?: string
  triggerClass?: string
  triggerClassList?: Record<string, boolean>
  triggerDisabled?: boolean
  triggerId?: string
  triggerTitle?: string
  triggerAriaLabel?: string
  trigger: JSX.Element
  children: JSX.Element
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
    "triggerClass",
    "triggerClassList",
    "triggerDisabled",
    "triggerId",
    "triggerTitle",
    "triggerAriaLabel",
    "trigger",
    "children",
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
        classList={local.triggerClassList}
        disabled={local.triggerDisabled}
        {...(local.triggerId !== undefined ? { id: local.triggerId } : {})}
        {...(local.triggerTitle !== undefined ? { title: local.triggerTitle } : {})}
        {...(local.triggerAriaLabel !== undefined ? { "aria-label": local.triggerAriaLabel } : {})}
      >
        {local.trigger}
      </KPopover.Trigger>
      <KPopover.Portal>
        <KPopover.Content class={local.class ? `tbr-popover ${local.class}` : "tbr-popover"}>
          <Show when={local.showArrow}>
            <KPopover.Arrow class="tbr-popover-arrow" size={10} />
          </Show>
          <Show when={local.title}>
            <div class="tbr-popover-title">{local.title}</div>
          </Show>
          <div class="tbr-popover-body">{local.children}</div>
        </KPopover.Content>
      </KPopover.Portal>
    </KPopover>
  )
}
