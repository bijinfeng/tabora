import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type CardSectionProps = {
  title?: JSX.Element
  trailing?: JSX.Element
  padded?: boolean
  class?: string
  children: JSX.Element
}

export function CardSection(props: CardSectionProps) {
  return (
    <section class={props.class} data-padded={props.padded === false ? undefined : ""}>
      <Show when={props.title || props.trailing}>
        <header class="tbr-card-section-header">
          <Show when={props.title}>
            <h3 class="tbr-card-section-title">{props.title}</h3>
          </Show>
          <Show when={props.trailing}>
            <div class="tbr-card-section-trailing">{props.trailing}</div>
          </Show>
        </header>
      </Show>
      <div class="tbr-card-section-body">{props.children}</div>
    </section>
  )
}
