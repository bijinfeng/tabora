import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type EmptyStateProps = {
  title: JSX.Element
  description?: JSX.Element
  action?: JSX.Element
  compact?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  descriptionClass?: string | undefined
  descriptionStyle?: JSX.CSSProperties | undefined
  actionClass?: string | undefined
  actionStyle?: JSX.CSSProperties | undefined
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <div class={props.class} style={props.style} data-compact={props.compact ? "" : undefined}>
      <div class={props.titleClass} style={props.titleStyle}>
        {props.title}
      </div>
      <Show when={props.description}>
        <div class={props.descriptionClass} style={props.descriptionStyle}>
          {props.description}
        </div>
      </Show>
      <Show when={props.action}>
        <div class={props.actionClass} style={props.actionStyle}>
          {props.action}
        </div>
      </Show>
    </div>
  )
}
