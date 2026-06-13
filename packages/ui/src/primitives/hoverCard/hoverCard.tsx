import { createUniqueId, type JSX } from "solid-js"
import { Show } from "solid-js"

export type HoverCardProps = {
  trigger: JSX.Element
  title: JSX.Element
  description?: JSX.Element
  media?: JSX.Element
  meta?: JSX.Element
  class?: string
}

export function HoverCard(props: HoverCardProps) {
  const contentId = createUniqueId()

  return (
    <span class={props.class}>
      <span class="tbr-hover-card-trigger" tabindex="0" aria-describedby={contentId}>
        {props.trigger}
      </span>
      <span class="tbr-hover-card-content" id={contentId} role="tooltip">
        <Show when={props.media}>
          <span class="tbr-hover-card-media">{props.media}</span>
        </Show>
        <strong class="tbr-hover-card-title">{props.title}</strong>
        <Show when={props.description}>
          <span class="tbr-hover-card-desc">{props.description}</span>
        </Show>
        <Show when={props.meta}>
          <span class="tbr-hover-card-meta">{props.meta}</span>
        </Show>
      </span>
    </span>
  )
}
