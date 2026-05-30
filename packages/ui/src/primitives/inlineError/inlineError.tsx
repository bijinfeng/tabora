import type { JSX } from "solid-js"

export type InlineErrorProps = {
  class?: string
  children: JSX.Element
}

export function InlineError(props: InlineErrorProps) {
  return (
    <div class={props.class} role="alert">
      {props.children}
    </div>
  )
}
