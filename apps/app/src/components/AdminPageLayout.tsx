import * as stylex from "@stylexjs/stylex"
import { Show, type JSX } from "solid-js"

import { shared } from "../pages/shared.styles"

export function AdminPageLayout(props: {
  title: string
  description?: string
  children: JSX.Element
}) {
  return (
    <div {...stylex.attrs(shared.page)}>
      <header {...stylex.attrs(shared.pageHeader)}>
        <h1 {...stylex.attrs(shared.pageTitle)}>{props.title}</h1>
        <Show when={props.description}>
          {(description) => <p {...stylex.attrs(shared.pageDescription)}>{description()}</p>}
        </Show>
      </header>
      {props.children}
    </div>
  )
}
