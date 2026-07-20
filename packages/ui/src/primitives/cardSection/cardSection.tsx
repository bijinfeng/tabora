import type { JSX } from "solid-js"
import { Show } from "solid-js"

import type { SolidAttrs } from "../../stylex"

export type CardSectionProps = {
  title?: JSX.Element
  trailing?: JSX.Element
  padded?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  attrs?: SolidAttrs<HTMLElement>
  headerClass?: string | undefined
  headerStyle?: JSX.CSSProperties | undefined
  headerAttrs?: SolidAttrs<HTMLElement>
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  titleAttrs?: SolidAttrs<HTMLElement>
  trailingClass?: string | undefined
  trailingStyle?: JSX.CSSProperties | undefined
  trailingAttrs?: SolidAttrs<HTMLDivElement>
  bodyClass?: string | undefined
  bodyStyle?: JSX.CSSProperties | undefined
  bodyAttrs?: SolidAttrs<HTMLDivElement>
  children: JSX.Element
}

export function CardSection(props: CardSectionProps) {
  const attrs = (): SolidAttrs<HTMLElement> =>
    props.attrs ?? { class: props.class, style: props.style }
  const headerAttrs = (): SolidAttrs<HTMLElement> =>
    props.headerAttrs ?? { class: props.headerClass, style: props.headerStyle }
  const titleAttrs = (): SolidAttrs<HTMLElement> =>
    props.titleAttrs ?? { class: props.titleClass, style: props.titleStyle }
  const trailingAttrs = (): SolidAttrs<HTMLDivElement> =>
    props.trailingAttrs ?? { class: props.trailingClass, style: props.trailingStyle }
  const bodyAttrs = (): SolidAttrs<HTMLDivElement> =>
    props.bodyAttrs ?? { class: props.bodyClass, style: props.bodyStyle }

  return (
    <section {...attrs()} data-padded={props.padded === false ? undefined : ""}>
      <Show when={props.title || props.trailing}>
        <header {...headerAttrs()}>
          <Show when={props.title}>
            <h3 {...titleAttrs()}>{props.title}</h3>
          </Show>
          <Show when={props.trailing}>
            <div {...trailingAttrs()}>{props.trailing}</div>
          </Show>
        </header>
      </Show>
      <div {...bodyAttrs()}>{props.children}</div>
    </section>
  )
}
