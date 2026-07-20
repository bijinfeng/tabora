import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type FieldProps = {
  label: JSX.Element
  helper?: JSX.Element
  error?: JSX.Element
  required?: boolean
  htmlFor?: string
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  labelClass?: string | undefined
  labelStyle?: JSX.CSSProperties | undefined
  requiredClass?: string | undefined
  requiredStyle?: JSX.CSSProperties | undefined
  helperClass?: string | undefined
  helperStyle?: JSX.CSSProperties | undefined
  errorClass?: string | undefined
  errorStyle?: JSX.CSSProperties | undefined
  children: JSX.Element
}

export function Field(props: FieldProps) {
  return (
    <div class={props.class} style={props.style}>
      <label class={props.labelClass} style={props.labelStyle} for={props.htmlFor}>
        {props.label}
        <Show when={props.required}>
          <span class={props.requiredClass} style={props.requiredStyle} aria-hidden="true">
            *
          </span>
        </Show>
      </label>
      {props.children}
      <Show when={props.helper}>
        <div class={props.helperClass} style={props.helperStyle}>
          {props.helper}
        </div>
      </Show>
      <Show when={props.error}>
        <div class={props.errorClass} style={props.errorStyle} role="alert">
          {props.error}
        </div>
      </Show>
    </div>
  )
}
