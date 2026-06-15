import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type ListRowProps = {
  leading?: JSX.Element
  primary: JSX.Element
  secondary?: JSX.Element
  trailing?: JSX.Element
  onClick?: () => void
  divider?: boolean
  danger?: boolean
  selected?: boolean
  interactive?: boolean
  class?: string
}

export function ListRow(props: ListRowProps) {
  const isInteractive = () => props.interactive ?? Boolean(props.onClick)
  const inner = (
    <>
      <Show when={props.leading}>
        <div class="tbr-list-row-leading">{props.leading}</div>
      </Show>
      <div class="tbr-list-row-main">
        <div class="tbr-list-row-primary">{props.primary}</div>
        <Show when={props.secondary}>
          <div class="tbr-list-row-secondary">{props.secondary}</div>
        </Show>
      </div>
      <Show when={props.trailing}>
        <div class="tbr-list-row-trailing">{props.trailing}</div>
      </Show>
    </>
  )
  return props.onClick ? (
    <button
      type="button"
      class={props.class}
      data-divider={props.divider ? "" : undefined}
      data-danger={props.danger ? "" : undefined}
      data-selected={props.selected ? "" : undefined}
      data-interactive={isInteractive() ? "" : undefined}
      aria-pressed={props.selected ? true : undefined}
      onClick={() => props.onClick?.()}
    >
      {inner}
    </button>
  ) : (
    <div
      class={props.class}
      data-divider={props.divider ? "" : undefined}
      data-danger={props.danger ? "" : undefined}
      data-selected={props.selected ? "" : undefined}
      data-interactive={isInteractive() ? "" : undefined}
    >
      {inner}
    </div>
  )
}
