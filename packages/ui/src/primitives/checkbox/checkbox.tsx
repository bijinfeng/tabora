import { Checkbox as KCheckbox } from "@kobalte/core/checkbox"
import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { Check, Minus } from "lucide-solid"

export type CheckboxProps = {
  checked: boolean | "indeterminate"
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
      checked={props.checked === true}
      indeterminate={props.checked === "indeterminate"}
      onChange={(v) => props.onChange(v)}
      disabled={props.disabled ?? false}
    >
      <KCheckbox.Input class="tbr-checkbox-input" aria-label={props["aria-label"]} />
      <KCheckbox.Control class="tbr-checkbox-control">
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
        <KCheckbox.Label class="tbr-checkbox-label">{props.label}</KCheckbox.Label>
      </Show>
    </KCheckbox>
  )
}
