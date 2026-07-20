import { Accordion as KAccordion } from "@kobalte/core/accordion"
import type { JSX } from "solid-js"
import { For } from "solid-js"
import { ChevronDown } from "lucide-solid"

export type AccordionItem = {
  id: string
  title: JSX.Element
  content: JSX.Element
  disabled?: boolean
}

export type AccordionProps = {
  items: AccordionItem[]
  multiple?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  itemClass?: string | undefined
  itemStyle?: JSX.CSSProperties | undefined
  triggerClass?: string | undefined
  triggerStyle?: JSX.CSSProperties | undefined
  arrowClass?: string | undefined
  arrowStyle?: JSX.CSSProperties | undefined
  contentClass?: string | undefined
  contentStyle?: JSX.CSSProperties | undefined
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function Accordion(props: AccordionProps) {
  return (
    <KAccordion
      class={props.class}
      style={props.style}
      multiple={props.multiple ?? false}
      collapsible={true}
    >
      <For each={props.items}>
        {(item) => (
          <KAccordion.Item
            class={props.itemClass}
            style={props.itemStyle}
            value={item.id}
            {...(item.disabled !== undefined ? { disabled: item.disabled } : {})}
          >
            <KAccordion.Header>
              <KAccordion.Trigger class={props.triggerClass} style={props.triggerStyle}>
                {item.title}
                <span class={props.arrowClass} style={props.arrowStyle} aria-hidden="true">
                  <ChevronDown size={16} strokeWidth={2} />
                </span>
              </KAccordion.Trigger>
            </KAccordion.Header>
            <KAccordion.Content {...optionalPartProps(props.contentClass, props.contentStyle)}>
              {item.content}
            </KAccordion.Content>
          </KAccordion.Item>
        )}
      </For>
    </KAccordion>
  )
}
