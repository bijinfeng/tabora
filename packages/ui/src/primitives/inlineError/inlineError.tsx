import type { JSX } from "solid-js"

import type { SolidAttrs } from "../../stylex"

export type InlineErrorProps = {
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  attrs?: SolidAttrs<HTMLDivElement>
  children: JSX.Element
}

export function InlineError(props: InlineErrorProps) {
  const attrs = (): SolidAttrs<HTMLDivElement> =>
    props.attrs ?? { class: props.class, style: props.style }

  return (
    <div {...attrs()} role="alert">
      {props.children}
    </div>
  )
}
