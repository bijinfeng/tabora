import { Checkbox as KCheckbox } from "@kobalte/core/checkbox"
import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { Check, Minus } from "lucide-solid"

export type CheckboxProps = {
  checked: boolean | "indeterminate"
  onChange: (checked: boolean) => void
  disabled?: boolean
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  inputClass?: string | undefined
  inputStyle?: JSX.CSSProperties | undefined
  controlClass?: string | undefined
  controlStyle?: JSX.CSSProperties | undefined
  labelClass?: string | undefined
  labelStyle?: JSX.CSSProperties | undefined
  "aria-label"?: string
  label?: JSX.Element
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function Checkbox(props: CheckboxProps) {
  return (
    <KCheckbox
      class={props.class}
      style={props.style}
      checked={props.checked === true}
      indeterminate={props.checked === "indeterminate"}
      onChange={(v) => props.onChange(v)}
      disabled={props.disabled ?? false}
    >
      <KCheckbox.Input
        {...optionalPartProps(props.inputClass, props.inputStyle)}
        {...(props["aria-label"] !== undefined ? { "aria-label": props["aria-label"] } : {})}
      />
      <KCheckbox.Control class={props.controlClass} style={props.controlStyle}>
        <KCheckbox.Indicator>
          <Show
            when={props.checked === "indeterminate"}
            fallback={<Check size={16} strokeWidth={2} />}
          >
            <Minus size={16} strokeWidth={2} />
          </Show>
        </KCheckbox.Indicator>
      </KCheckbox.Control>
      <Show when={props.label}>
        <KCheckbox.Label class={props.labelClass} style={props.labelStyle}>
          {props.label}
        </KCheckbox.Label>
      </Show>
    </KCheckbox>
  )
}
