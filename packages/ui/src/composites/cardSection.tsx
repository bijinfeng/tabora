import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type CardSectionProps = {
  title?: JSX.Element
  trailing?: JSX.Element
  padded?: boolean
  children: JSX.Element
}

export function CardSection(props: CardSectionProps) {
  return (
    <section class="tabora-card-section" data-padded={props.padded === false ? undefined : ""}>
      <Show when={props.title || props.trailing}>
        <header class="tabora-card-section-header">
          <Show when={props.title}>
            <h3 class="tabora-card-section-title">{props.title}</h3>
          </Show>
          <Show when={props.trailing}>
            <div class="tabora-card-section-trailing">{props.trailing}</div>
          </Show>
        </header>
      </Show>
      <div class="tabora-card-section-body">{props.children}</div>
    </section>
  )
}
