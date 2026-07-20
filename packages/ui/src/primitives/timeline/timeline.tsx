import type { JSX } from "solid-js"
import { For } from "solid-js"

export type TimelineItem = {
  title: JSX.Element
  description?: JSX.Element
  meta?: JSX.Element
}

export type TimelineProps = {
  items: TimelineItem[]
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  itemClass?: string | undefined
  itemStyle?: JSX.CSSProperties | undefined
  dotClass?: string | undefined
  dotStyle?: JSX.CSSProperties | undefined
  bodyClass?: string | undefined
  bodyStyle?: JSX.CSSProperties | undefined
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  descriptionClass?: string | undefined
  descriptionStyle?: JSX.CSSProperties | undefined
  metaClass?: string | undefined
  metaStyle?: JSX.CSSProperties | undefined
}

export function Timeline(props: TimelineProps) {
  return (
    <ol class={props.class} style={props.style}>
      <For each={props.items}>
        {(item) => (
          <li class={props.itemClass} style={props.itemStyle}>
            <span class={props.dotClass} style={props.dotStyle} aria-hidden="true" />
            <span class={props.bodyClass} style={props.bodyStyle}>
              <strong class={props.titleClass} style={props.titleStyle}>
                {item.title}
              </strong>
              {item.description && (
                <span class={props.descriptionClass} style={props.descriptionStyle}>
                  {item.description}
                </span>
              )}
              {item.meta && (
                <small class={props.metaClass} style={props.metaStyle}>
                  {item.meta}
                </small>
              )}
            </span>
          </li>
        )}
      </For>
    </ol>
  )
}
