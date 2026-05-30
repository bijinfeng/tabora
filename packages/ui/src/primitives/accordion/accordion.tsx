import type { JSX } from "solid-js"
import { For, createSignal } from "solid-js"

export type AccordionItem = {
  id: string
  title: JSX.Element
  content: JSX.Element
  disabled?: boolean
}

export type AccordionProps = { items: AccordionItem[]; multiple?: boolean; class?: string }

export function Accordion(props: AccordionProps) {
  const [openItems, setOpenItems] = createSignal<Set<string>>(new Set())
  const toggle = (id: string) => {
    const s = new Set(openItems())
    if (s.has(id)) {
      s.delete(id)
    } else {
      if (props.multiple) s.add(id)
      else {
        s.clear()
        s.add(id)
      }
    }
    setOpenItems(s)
  }
  return (
    <div class={`tbr-accordion ${props.class ?? ""}`}>
      <For each={props.items}>
        {(item) => (
          <div class="tbr-accordion-item" data-disabled={item.disabled ? "" : undefined}>
            <button
              class="tbr-accordion-trigger"
              disabled={item.disabled}
              onClick={() => toggle(item.id)}
              aria-expanded={openItems().has(item.id)}
            >
              {item.title}
              <span
                class="tbr-accordion-arrow"
                data-open={openItems().has(item.id) ? "" : undefined}
              >
                ▾
              </span>
            </button>
            {openItems().has(item.id) && <div class="tbr-accordion-content">{item.content}</div>}
          </div>
        )}
      </For>
    </div>
  )
}
