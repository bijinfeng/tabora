import { Checkbox as KCheckbox } from "@kobalte/core/checkbox"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  class?: string
  "aria-label"?: string
  label?: JSX.Element
}

export function Checkbox(props: CheckboxProps) {
  return (
    <KCheckbox
      class={props.class}
      checked={props.checked}
      onChange={(v) => props.onChange(v)}
      disabled={props.disabled ?? false}
    >
      <KCheckbox.Input class="tbr-checkbox-input" aria-label={props["aria-label"]} />
      <KCheckbox.Control class="tbr-checkbox-control">
        <KCheckbox.Indicator>✓</KCheckbox.Indicator>
      </KCheckbox.Control>
      <Show when={props.label}>
        <KCheckbox.Label class="tbr-checkbox-label">{props.label}</KCheckbox.Label>
      </Show>
    </KCheckbox>
  )
}
