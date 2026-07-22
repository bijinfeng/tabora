import { Accordion as KAccordion } from "@kobalte/core/accordion"
import { useCollapsibleContext } from "@kobalte/core/collapsible"
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
  defaultValue?: string[]
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

function AccordionArrow(props: {
  class: string | undefined
  style: JSX.CSSProperties | undefined
}) {
  const context = useCollapsibleContext()

  return (
    <span
      class={props.class}
      style={{
        ...props.style,
        transform: context.isOpen() ? "rotate(180deg)" : props.style?.transform,
      }}
      aria-hidden="true"
    >
      <ChevronDown size={10} strokeWidth={2} />
    </span>
  )
}

export function Accordion(props: AccordionProps) {
  return (
    <KAccordion
      class={props.class}
      style={props.style}
      {...(props.defaultValue !== undefined ? { defaultValue: props.defaultValue } : {})}
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
            <KAccordion.Header style={{ margin: 0 }}>
              <KAccordion.Trigger class={props.triggerClass} style={props.triggerStyle}>
                {item.title}
                <AccordionArrow class={props.arrowClass} style={props.arrowStyle} />
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
