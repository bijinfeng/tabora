import type { JSX } from "solid-js"

export type ScrollAreaProps = {
  children: JSX.Element
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  "aria-label"?: string
}

export function ScrollArea(props: ScrollAreaProps) {
  return (
    <div class={props.class} style={props.style} tabindex="0" aria-label={props["aria-label"]}>
      {props.children}
    </div>
  )
}
