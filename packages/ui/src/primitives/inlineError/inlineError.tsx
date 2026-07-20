import type { JSX } from "solid-js"

export type InlineErrorProps = {
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  children: JSX.Element
}

export function InlineError(props: InlineErrorProps) {
  return (
    <div class={props.class} style={props.style} role="alert">
      {props.children}
    </div>
  )
}
