import type { JSX } from "solid-js"
import { For } from "solid-js"

export type BreadcrumbItem = {
  label: JSX.Element
  href?: string
  current?: boolean
  onClick?: () => void
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  separator?: string
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  wrapClass?: string | undefined
  wrapStyle?: JSX.CSSProperties | undefined
  separatorClass?: string | undefined
  separatorStyle?: JSX.CSSProperties | undefined
  currentClass?: string | undefined
  currentStyle?: JSX.CSSProperties | undefined
  linkClass?: string | undefined
  linkStyle?: JSX.CSSProperties | undefined
}

export function Breadcrumb(props: BreadcrumbProps) {
  return (
    <nav class={props.class} style={props.style} aria-label="路径导航">
      <For each={props.items}>
        {(item, i) => (
          <span class={props.wrapClass} style={props.wrapStyle}>
            {i() > 0 && (
              <span class={props.separatorClass} style={props.separatorStyle} aria-hidden="true">
                {props.separator ?? "/"}
              </span>
            )}
            {item.current ? (
              <span class={props.currentClass} style={props.currentStyle} aria-current="page">
                {item.label}
              </span>
            ) : item.href ? (
              <a class={props.linkClass} style={props.linkStyle} href={item.href}>
                {item.label}
              </a>
            ) : (
              <button
                type="button"
                class={props.linkClass}
                style={props.linkStyle}
                onClick={item.onClick}
              >
                {item.label}
              </button>
            )}
          </span>
        )}
      </For>
    </nav>
  )
}
