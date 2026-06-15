import { HoverCard as KHoverCard } from "@kobalte/core/hover-card"
import type { JSX } from "solid-js"
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
  return (
    <span class={props.class}>
      <KHoverCard>
        <KHoverCard.Trigger class="tbr-hover-card-trigger">{props.trigger}</KHoverCard.Trigger>
        <KHoverCard.Portal>
          <KHoverCard.Content class="tbr-hover-card-content">
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
          </KHoverCard.Content>
        </KHoverCard.Portal>
      </KHoverCard>
    </span>
  )
}
