import type { JSX } from "solid-js"

export type LinkProps = {
  href?: string
  external?: boolean
  muted?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  onClick?: (e: MouseEvent) => void
  children: JSX.Element
}

export function Link(props: LinkProps) {
  return (
    <a
      class={props.class}
      style={props.style}
      data-external={props.external ? "" : undefined}
      data-muted={props.muted ? "" : undefined}
      href={props.href}
      onClick={props.onClick}
    >
      {props.children}
      {props.external ? " ↗" : ""}
    </a>
  )
}
