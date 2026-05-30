import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type FieldProps = {
  label: JSX.Element
  helper?: JSX.Element
  error?: JSX.Element
  required?: boolean
  htmlFor?: string
  class?: string
  children: JSX.Element
}

export function Field(props: FieldProps) {
  return (
    <div class={props.class}>
      <label class="tbr-field-label" for={props.htmlFor}>
        {props.label}
        <Show when={props.required}>
          <span class="tbr-field-required" aria-hidden="true">
            *
          </span>
        </Show>
      </label>
      {props.children}
      <Show when={props.helper}>
        <div class="tbr-field-helper">{props.helper}</div>
      </Show>
      <Show when={props.error}>
        <div class="tbr-field-error" role="alert">
          {props.error}
        </div>
      </Show>
    </div>
  )
}
