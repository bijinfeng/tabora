import type { JSX } from "solid-js"

import type { SolidAttrs } from "../../stylex"

export type KbdProps = {
  children: string
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  attrs?: SolidAttrs<HTMLElement>
}

export function Kbd(props: KbdProps) {
  const attrs = (): SolidAttrs<HTMLElement> =>
    props.attrs ?? { class: props.class, style: props.style }

  return <kbd {...attrs()}>{props.children}</kbd>
}
