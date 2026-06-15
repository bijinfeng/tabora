import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type FieldRowProps = {
  label: JSX.Element
  description?: JSX.Element
  helper?: JSX.Element
  trailing?: JSX.Element
  class?: string
}

export function FieldRow(props: FieldRowProps) {
  return (
    <div class={props.class}>
      <div class="tbr-field-row-main">
        <div class="tbr-field-row-info">
          <div class="tbr-field-row-label">{props.label}</div>
          <Show when={props.description}>
            <div class="tbr-field-row-description">{props.description}</div>
          </Show>
        </div>
        <Show when={props.trailing}>
          <div class="tbr-field-row-trailing">{props.trailing}</div>
        </Show>
      </div>
      <Show when={props.helper}>
        <div class="tbr-field-row-helper">{props.helper}</div>
      </Show>
    </div>
  )
}
