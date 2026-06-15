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

export type AccordionProps = { items: AccordionItem[]; multiple?: boolean; class?: string }

export function Accordion(props: AccordionProps) {
  return (
    <KAccordion
      class={`tbr-accordion ${props.class ?? ""}`}
      multiple={props.multiple ?? false}
      collapsible={true}
    >
      <For each={props.items}>
        {(item) => (
          <KAccordion.Item
            class="tbr-accordion-item"
            value={item.id}
            {...(item.disabled !== undefined ? { disabled: item.disabled } : {})}
          >
            <KAccordion.Header>
              <KAccordion.Trigger class="tbr-accordion-trigger">
                {item.title}
                <span class="tbr-accordion-arrow" aria-hidden="true">
                  <ChevronDown size={16} strokeWidth={2} />
                </span>
              </KAccordion.Trigger>
            </KAccordion.Header>
            <KAccordion.Content class="tbr-accordion-content">{item.content}</KAccordion.Content>
          </KAccordion.Item>
        )}
      </For>
    </KAccordion>
  )
}
