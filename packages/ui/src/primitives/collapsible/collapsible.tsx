import { Collapsible as KCollapsible } from "@kobalte/core/collapsible"
import type { JSX } from "solid-js"
import { ChevronRight } from "lucide-solid"

export type CollapsibleProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: JSX.Element
  indicator?: JSX.Element
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  triggerClass?: string | undefined
  triggerStyle?: JSX.CSSProperties | undefined
  arrowClass?: string | undefined
  arrowStyle?: JSX.CSSProperties | undefined
  contentClass?: string | undefined
  contentStyle?: JSX.CSSProperties | undefined
  rootAttrs?: Record<`data-${string}`, string | undefined>
  triggerAttrs?: Record<`data-${string}`, string | undefined>
  contentAttrs?: Record<`data-${string}`, string | undefined>
  children: JSX.Element
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function Collapsible(props: CollapsibleProps) {
  const rootChange = props.onOpenChange ? { onOpenChange: props.onOpenChange } : {}
  const rootStyle = optionalPartProps(props.class, props.style)
  const openControl = props.open !== undefined ? { open: props.open } : { defaultOpen: false }

  return (
    <KCollapsible {...rootStyle} {...props.rootAttrs} {...rootChange} {...openControl}>
      <KCollapsible.Trigger
        {...props.triggerAttrs}
        class={props.triggerClass}
        style={props.triggerStyle}
      >
        {props.title}
        <span class={props.arrowClass} style={props.arrowStyle} aria-hidden="true">
          {props.indicator ?? <ChevronRight size={16} strokeWidth={2} />}
        </span>
      </KCollapsible.Trigger>
      <KCollapsible.Content
        {...props.contentAttrs}
        {...optionalPartProps(props.contentClass, props.contentStyle)}
      >
        {props.children}
      </KCollapsible.Content>
    </KCollapsible>
  )
}
