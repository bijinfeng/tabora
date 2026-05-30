import type { JSX } from "solid-js"
import { For } from "solid-js"

export type BreadcrumbItem = {
  label: JSX.Element
  href?: string
  current?: boolean
  onClick?: () => void
}

export type BreadcrumbProps = { items: BreadcrumbItem[]; separator?: string; class?: string }

export function Breadcrumb(props: BreadcrumbProps) {
  return (
    <nav class={`tbr-breadcrumb ${props.class ?? ""}`} aria-label="路径导航">
      <For each={props.items}>
        {(item, i) => (
          <span class="tbr-breadcrumb-wrap">
            {i() > 0 && (
              <span class="tbr-breadcrumb-sep" aria-hidden="true">
                {props.separator ?? "/"}
              </span>
            )}
            {item.current ? (
              <span class="tbr-breadcrumb-current" aria-current="page">
                {item.label}
              </span>
            ) : item.href ? (
              <a class="tbr-breadcrumb-link" href={item.href}>
                {item.label}
              </a>
            ) : (
              <button class="tbr-breadcrumb-link" onClick={item.onClick}>
                {item.label}
              </button>
            )}
          </span>
        )}
      </For>
    </nav>
  )
}
