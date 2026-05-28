import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type EmptyStateProps = {
  title: JSX.Element
  description?: JSX.Element
  action?: JSX.Element
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <div class="tabora-empty-state">
      <div class="tabora-empty-state-title">{props.title}</div>
      <Show when={props.description}>
        <div class="tabora-empty-state-desc">{props.description}</div>
      </Show>
      <Show when={props.action}>
        <div class="tabora-empty-state-action">{props.action}</div>
      </Show>
    </div>
  )
}
