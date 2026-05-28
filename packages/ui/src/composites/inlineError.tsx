import type { JSX } from "solid-js"

export type InlineErrorProps = {
  children: JSX.Element
}

export function InlineError(props: InlineErrorProps) {
  return (
    <div class="tabora-inline-error" role="alert">
      {props.children}
    </div>
  )
}
