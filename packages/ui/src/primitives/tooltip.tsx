import { Tooltip as KTooltip } from "@kobalte/core/tooltip"
import type { JSX } from "solid-js"

export type TooltipPlacement = "top" | "bottom" | "left" | "right"

export type TooltipProps = {
  content: JSX.Element
  placement?: TooltipPlacement
  children: JSX.Element
}

export function Tooltip(props: TooltipProps) {
  return (
    <KTooltip placement={props.placement ?? "top"}>
      <KTooltip.Trigger as="span" class="tabora-tooltip-trigger">
        {props.children}
      </KTooltip.Trigger>
      <KTooltip.Portal>
        <KTooltip.Content class="tabora-tooltip-content">{props.content}</KTooltip.Content>
      </KTooltip.Portal>
    </KTooltip>
  )
}
