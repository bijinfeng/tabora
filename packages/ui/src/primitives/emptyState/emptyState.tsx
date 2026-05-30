import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type EmptyStateProps = {
  title: JSX.Element
  description?: JSX.Element
  action?: JSX.Element
  compact?: boolean
  class?: string
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <div class={props.class} data-compact={props.compact ? "" : undefined}>
      <div class="tbr-empty-state-title">{props.title}</div>
      <Show when={props.description}>
        <div class="tbr-empty-state-desc">{props.description}</div>
      </Show>
      <Show when={props.action}>
        <div class="tbr-empty-state-action">{props.action}</div>
      </Show>
    </div>
  )
}
