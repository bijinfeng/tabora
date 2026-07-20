import { Tooltip as KTooltip } from "@kobalte/core/tooltip"
import type { JSX } from "solid-js"

export type TooltipPlacement = "top" | "bottom" | "left" | "right"

export type TooltipProps = {
  content: JSX.Element
  placement?: TooltipPlacement
  class?: string | undefined
  triggerClass?: string | undefined
  triggerStyle?: JSX.CSSProperties | undefined
  contentClass?: string | undefined
  contentStyle?: JSX.CSSProperties | undefined
  children: JSX.Element
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function Tooltip(props: TooltipProps) {
  return (
    <KTooltip placement={props.placement ?? "top"}>
      <KTooltip.Trigger as="span" class={props.triggerClass} style={props.triggerStyle}>
        {props.children}
      </KTooltip.Trigger>
      <KTooltip.Portal>
        <KTooltip.Content
          {...optionalPartProps(props.contentClass ?? props.class, props.contentStyle)}
        >
          {props.content}
        </KTooltip.Content>
      </KTooltip.Portal>
    </KTooltip>
  )
}
