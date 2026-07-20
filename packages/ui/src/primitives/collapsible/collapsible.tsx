import { Collapsible as KCollapsible } from "@kobalte/core/collapsible"
import type { JSX } from "solid-js"
import { ChevronRight } from "lucide-solid"

export type CollapsibleProps = {
  open?: boolean
  title: JSX.Element
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  triggerClass?: string | undefined
  triggerStyle?: JSX.CSSProperties | undefined
  arrowClass?: string | undefined
  arrowStyle?: JSX.CSSProperties | undefined
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

export function Collapsible(props: CollapsibleProps) {
  return (
    <KCollapsible class={props.class} style={props.style} defaultOpen={props.open ?? false}>
      <KCollapsible.Trigger class={props.triggerClass} style={props.triggerStyle}>
        {props.title}
        <span class={props.arrowClass} style={props.arrowStyle} aria-hidden="true">
          <ChevronRight size={16} strokeWidth={2} />
        </span>
      </KCollapsible.Trigger>
      <KCollapsible.Content {...optionalPartProps(props.contentClass, props.contentStyle)}>
        {props.children}
      </KCollapsible.Content>
    </KCollapsible>
  )
}
