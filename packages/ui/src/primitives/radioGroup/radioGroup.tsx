import type { JSX } from "solid-js"
import { For } from "solid-js"

export type RadioGroupOption<V extends string> = {
  value: V
  label: JSX.Element
  description?: JSX.Element
  disabled?: boolean
}

export type RadioGroupProps<V extends string> = {
  name: string
  value: V
  options: RadioGroupOption<V>[]
  onChange: (value: V) => void
  direction?: "vertical" | "horizontal"
  class?: string
}

export function RadioGroup<V extends string>(props: RadioGroupProps<V>) {
  return (
    <fieldset class={props.class} data-direction={props.direction ?? "vertical"} role="radiogroup">
      <For each={props.options}>
        {(opt) => (
          <label
            class="tbr-radio-item"
            data-checked={opt.value === props.value ? "" : undefined}
            data-disabled={opt.disabled ? "" : undefined}
          >
            <input
              class="tbr-radio-input"
              type="radio"
              name={props.name}
              value={opt.value}
              checked={opt.value === props.value}
              disabled={opt.disabled}
              onChange={() => props.onChange(opt.value)}
            />
            <span class="tbr-radio-control" />
            <span class="tbr-radio-content">
              <span class="tbr-radio-label">{opt.label}</span>
              {opt.description && <span class="tbr-radio-desc">{opt.description}</span>}
            </span>
          </label>
        )}
      </For>
    </fieldset>
  )
}
