import type { JSX } from "solid-js"

import type { SolidAttrs } from "../../stylex"

export type LinkProps = {
  href?: string
  external?: boolean
  muted?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  attrs?: SolidAttrs<HTMLAnchorElement>
  onClick?: (e: MouseEvent) => void
  children: JSX.Element
}

export function Link(props: LinkProps) {
  const attrs = (): SolidAttrs<HTMLAnchorElement> =>
    props.attrs ?? { class: props.class, style: props.style }

  return (
    <a
      {...attrs()}
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
