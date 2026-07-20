import type { JSX } from "solid-js"
import { For } from "solid-js"

import type { SolidAttrs } from "../../stylex"

export type TimelineItem = {
  title: JSX.Element
  description?: JSX.Element
  meta?: JSX.Element
}

export type TimelineProps = {
  items: TimelineItem[]
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  attrs?: SolidAttrs<HTMLOListElement>
  itemClass?: string | undefined
  itemStyle?: JSX.CSSProperties | undefined
  itemAttrs?: SolidAttrs<HTMLLIElement>
  dotClass?: string | undefined
  dotStyle?: JSX.CSSProperties | undefined
  dotAttrs?: SolidAttrs<HTMLSpanElement>
  bodyClass?: string | undefined
  bodyStyle?: JSX.CSSProperties | undefined
  bodyAttrs?: SolidAttrs<HTMLSpanElement>
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  titleAttrs?: SolidAttrs<HTMLElement>
  descriptionClass?: string | undefined
  descriptionStyle?: JSX.CSSProperties | undefined
  descriptionAttrs?: SolidAttrs<HTMLSpanElement>
  metaClass?: string | undefined
  metaStyle?: JSX.CSSProperties | undefined
  metaAttrs?: SolidAttrs<HTMLElement>
}

export function Timeline(props: TimelineProps) {
  const attrs = (): SolidAttrs<HTMLOListElement> =>
    props.attrs ?? { class: props.class, style: props.style }
  const itemAttrs = (): SolidAttrs<HTMLLIElement> =>
    props.itemAttrs ?? { class: props.itemClass, style: props.itemStyle }
  const dotAttrs = (): SolidAttrs<HTMLSpanElement> =>
    props.dotAttrs ?? { class: props.dotClass, style: props.dotStyle }
  const bodyAttrs = (): SolidAttrs<HTMLSpanElement> =>
    props.bodyAttrs ?? { class: props.bodyClass, style: props.bodyStyle }
  const titleAttrs = (): SolidAttrs<HTMLElement> =>
    props.titleAttrs ?? { class: props.titleClass, style: props.titleStyle }
  const descriptionAttrs = (): SolidAttrs<HTMLSpanElement> =>
    props.descriptionAttrs ?? { class: props.descriptionClass, style: props.descriptionStyle }
  const metaAttrs = (): SolidAttrs<HTMLElement> =>
    props.metaAttrs ?? { class: props.metaClass, style: props.metaStyle }

  return (
    <ol {...attrs()}>
      <For each={props.items}>
        {(item) => (
          <li {...itemAttrs()}>
            <span {...dotAttrs()} aria-hidden="true" />
            <span {...bodyAttrs()}>
              <strong {...titleAttrs()}>{item.title}</strong>
              {item.description && <span {...descriptionAttrs()}>{item.description}</span>}
              {item.meta && <small {...metaAttrs()}>{item.meta}</small>}
            </span>
          </li>
        )}
      </For>
    </ol>
  )
}
