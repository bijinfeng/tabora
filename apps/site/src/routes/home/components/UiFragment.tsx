import { Show } from "solid-js"

export function UiFragment(props: { variant: number }) {
  return (
    <div class="ui-fragment" aria-hidden="true">
      <Show when={props.variant === 0}>
        <div class="ui-line" />
        <div class="ui-pill" />
      </Show>
      <Show when={props.variant === 1}>
        <div class="ui-pill" />
        <div class="ui-pill" />
        <div class="ui-pill" />
      </Show>
      <Show when={props.variant === 2}>
        <div class="ui-block" />
      </Show>
    </div>
  )
}
