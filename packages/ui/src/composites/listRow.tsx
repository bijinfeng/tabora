import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type ListRowProps = {
  leading?: JSX.Element
  primary: JSX.Element
  secondary?: JSX.Element
  trailing?: JSX.Element
  onClick?: () => void
}

export function ListRow(props: ListRowProps) {
  const inner = (
    <>
      <Show when={props.leading}>
        <div class="tabora-list-row-leading">{props.leading}</div>
      </Show>
      <div class="tabora-list-row-main">
        <div class="tabora-list-row-primary">{props.primary}</div>
        <Show when={props.secondary}>
          <div class="tabora-list-row-secondary">{props.secondary}</div>
        </Show>
      </div>
      <Show when={props.trailing}>
        <div class="tabora-list-row-trailing">{props.trailing}</div>
      </Show>
    </>
  )

  return props.onClick ? (
    <button type="button" class="tabora-list-row" onClick={() => props.onClick?.()}>
      {inner}
    </button>
  ) : (
    <div class="tabora-list-row">{inner}</div>
  )
}
