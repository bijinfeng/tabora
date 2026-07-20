import { HoverCard as KHoverCard } from "@kobalte/core/hover-card"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type HoverCardProps = {
  trigger: JSX.Element
  title: JSX.Element
  description?: JSX.Element
  media?: JSX.Element
  meta?: JSX.Element
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  triggerClass?: string | undefined
  triggerStyle?: JSX.CSSProperties | undefined
  contentClass?: string | undefined
  contentStyle?: JSX.CSSProperties | undefined
  mediaClass?: string | undefined
  mediaStyle?: JSX.CSSProperties | undefined
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  descriptionClass?: string | undefined
  descriptionStyle?: JSX.CSSProperties | undefined
  metaClass?: string | undefined
  metaStyle?: JSX.CSSProperties | undefined
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function HoverCard(props: HoverCardProps) {
  return (
    <span class={props.class} style={props.style}>
      <KHoverCard>
        <KHoverCard.Trigger class={props.triggerClass} style={props.triggerStyle}>
          {props.trigger}
        </KHoverCard.Trigger>
        <KHoverCard.Portal>
          <KHoverCard.Content {...optionalPartProps(props.contentClass, props.contentStyle)}>
            <Show when={props.media}>
              <span class={props.mediaClass} style={props.mediaStyle}>
                {props.media}
              </span>
            </Show>
            <strong class={props.titleClass} style={props.titleStyle}>
              {props.title}
            </strong>
            <Show when={props.description}>
              <span class={props.descriptionClass} style={props.descriptionStyle}>
                {props.description}
              </span>
            </Show>
            <Show when={props.meta}>
              <span class={props.metaClass} style={props.metaStyle}>
                {props.meta}
              </span>
            </Show>
          </KHoverCard.Content>
        </KHoverCard.Portal>
      </KHoverCard>
    </span>
  )
}
