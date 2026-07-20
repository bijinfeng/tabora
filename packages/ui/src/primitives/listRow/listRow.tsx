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
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  leadingClass?: string | undefined
  leadingStyle?: JSX.CSSProperties | undefined
  mainClass?: string | undefined
  mainStyle?: JSX.CSSProperties | undefined
  primaryClass?: string | undefined
  primaryStyle?: JSX.CSSProperties | undefined
  secondaryClass?: string | undefined
  secondaryStyle?: JSX.CSSProperties | undefined
  trailingClass?: string | undefined
  trailingStyle?: JSX.CSSProperties | undefined
}

export function ListRow(props: ListRowProps) {
  const isInteractive = () => props.interactive ?? Boolean(props.onClick)
  const inner = (
    <>
      <Show when={props.leading}>
        <div class={props.leadingClass} style={props.leadingStyle}>
          {props.leading}
        </div>
      </Show>
      <div class={props.mainClass} style={props.mainStyle}>
        <div class={props.primaryClass} style={props.primaryStyle}>
          {props.primary}
        </div>
        <Show when={props.secondary}>
          <div class={props.secondaryClass} style={props.secondaryStyle}>
            {props.secondary}
          </div>
        </Show>
      </div>
      <Show when={props.trailing}>
        <div class={props.trailingClass} style={props.trailingStyle}>
          {props.trailing}
        </div>
      </Show>
    </>
  )
  return props.onClick ? (
    <button
      type="button"
      class={props.class}
      style={props.style}
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
      style={props.style}
      data-divider={props.divider ? "" : undefined}
      data-danger={props.danger ? "" : undefined}
      data-selected={props.selected ? "" : undefined}
      data-interactive={isInteractive() ? "" : undefined}
    >
      {inner}
    </div>
  )
}
