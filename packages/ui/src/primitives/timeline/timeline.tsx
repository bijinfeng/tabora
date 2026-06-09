import type { JSX } from "solid-js"
import { For } from "solid-js"

export type TimelineItem = {
  title: JSX.Element
  description?: JSX.Element
  meta?: JSX.Element
}

export type TimelineProps = {
  items: TimelineItem[]
  class?: string
}

export function Timeline(props: TimelineProps) {
  return (
    <ol class={props.class}>
      <For each={props.items}>
        {(item) => (
          <li class="tbr-timeline-item">
            <span class="tbr-timeline-dot" aria-hidden="true" />
            <span class="tbr-timeline-body">
              <strong>{item.title}</strong>
              {item.description && <span>{item.description}</span>}
              {item.meta && <small>{item.meta}</small>}
            </span>
          </li>
        )}
      </For>
    </ol>
  )
}
