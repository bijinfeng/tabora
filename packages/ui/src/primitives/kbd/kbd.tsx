import type { JSX } from "solid-js"

export type KbdProps = {
  children: string
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
}

export function Kbd(props: KbdProps) {
  return (
    <kbd class={props.class} style={props.style}>
      {props.children}
    </kbd>
  )
}
