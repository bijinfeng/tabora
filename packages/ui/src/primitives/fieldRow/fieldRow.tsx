import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type FieldRowProps = {
  label: JSX.Element
  description?: JSX.Element
  helper?: JSX.Element
  trailing?: JSX.Element
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  mainClass?: string | undefined
  mainStyle?: JSX.CSSProperties | undefined
  infoClass?: string | undefined
  infoStyle?: JSX.CSSProperties | undefined
  labelClass?: string | undefined
  labelStyle?: JSX.CSSProperties | undefined
  descriptionClass?: string | undefined
  descriptionStyle?: JSX.CSSProperties | undefined
  trailingClass?: string | undefined
  trailingStyle?: JSX.CSSProperties | undefined
  helperClass?: string | undefined
  helperStyle?: JSX.CSSProperties | undefined
}

export function FieldRow(props: FieldRowProps) {
  return (
    <div class={props.class} style={props.style}>
      <div class={props.mainClass} style={props.mainStyle}>
        <div class={props.infoClass} style={props.infoStyle}>
          <div class={props.labelClass} style={props.labelStyle}>
            {props.label}
          </div>
          <Show when={props.description}>
            <div class={props.descriptionClass} style={props.descriptionStyle}>
              {props.description}
            </div>
          </Show>
        </div>
        <Show when={props.trailing}>
          <div class={props.trailingClass} style={props.trailingStyle}>
            {props.trailing}
          </div>
        </Show>
      </div>
      <Show when={props.helper}>
        <div class={props.helperClass} style={props.helperStyle}>
          {props.helper}
        </div>
      </Show>
    </div>
  )
}
