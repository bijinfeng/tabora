import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type CardSectionProps = {
  title?: JSX.Element
  trailing?: JSX.Element
  padded?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  headerClass?: string | undefined
  headerStyle?: JSX.CSSProperties | undefined
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  trailingClass?: string | undefined
  trailingStyle?: JSX.CSSProperties | undefined
  bodyClass?: string | undefined
  bodyStyle?: JSX.CSSProperties | undefined
  children: JSX.Element
}

export function CardSection(props: CardSectionProps) {
  return (
    <section
      class={props.class}
      style={props.style}
      data-padded={props.padded === false ? undefined : ""}
    >
      <Show when={props.title || props.trailing}>
        <header class={props.headerClass} style={props.headerStyle}>
          <Show when={props.title}>
            <h3 class={props.titleClass} style={props.titleStyle}>
              {props.title}
            </h3>
          </Show>
          <Show when={props.trailing}>
            <div class={props.trailingClass} style={props.trailingStyle}>
              {props.trailing}
            </div>
          </Show>
        </header>
      </Show>
      <div class={props.bodyClass} style={props.bodyStyle}>
        {props.children}
      </div>
    </section>
  )
}
