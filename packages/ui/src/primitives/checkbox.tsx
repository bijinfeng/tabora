import { Checkbox as KCheckbox } from "@kobalte/core/checkbox"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  "aria-label"?: string
  label?: JSX.Element
}

export function Checkbox(props: CheckboxProps) {
  return (
    <KCheckbox
      class="tabora-checkbox"
      checked={props.checked}
      onChange={(v) => props.onChange(v)}
      disabled={props.disabled ?? false}
    >
      <KCheckbox.Input class="tabora-checkbox-input" aria-label={props["aria-label"]} />
      <KCheckbox.Control class="tabora-checkbox-control">
        <KCheckbox.Indicator>✓</KCheckbox.Indicator>
      </KCheckbox.Control>
      <Show when={props.label}>
        <KCheckbox.Label class="tabora-checkbox-label">{props.label}</KCheckbox.Label>
      </Show>
    </KCheckbox>
  )
}
