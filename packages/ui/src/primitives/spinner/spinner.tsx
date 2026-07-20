import type { JSX } from "solid-js"

import type { SolidAttrs } from "../../stylex"

export type SpinnerProps = {
  size?: "sm" | "md" | "lg"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  attrs?: SolidAttrs<HTMLSpanElement>
  "aria-label"?: string
}

export function Spinner(props: SpinnerProps) {
  const attrs = (): SolidAttrs<HTMLSpanElement> =>
    props.attrs ?? { class: props.class, style: props.style }

  return (
    <span
      {...attrs()}
      data-size={props.size ?? "md"}
      role="status"
      aria-label={props["aria-label"] ?? "加载中"}
    />
  )
}
