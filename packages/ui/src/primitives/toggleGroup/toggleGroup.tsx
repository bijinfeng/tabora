import type { JSX } from "solid-js"
import { For } from "solid-js"

export type ToggleGroupOption = {
  value: string
  label: JSX.Element
  disabled?: boolean
}

export type ToggleGroupProps = {
  value: string[]
  onChange: (value: string[]) => void
  options: ToggleGroupOption[]
  disabled?: boolean
  class?: string
  "aria-label": string
}

export function ToggleGroup(props: ToggleGroupProps) {
  const toggle = (value: string) => {
    props.onChange(
      props.value.includes(value)
        ? props.value.filter((item) => item !== value)
        : [...props.value, value],
    )
  }

  return (
    <div class={props.class} role="group" aria-label={props["aria-label"]}>
      <For each={props.options}>
        {(option) => {
          const selected = () => props.value.includes(option.value)
          return (
            <button
              type="button"
              class="tbr-toggle-group-item"
              data-selected={selected() ? "" : undefined}
              aria-pressed={selected()}
              disabled={props.disabled || option.disabled}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </button>
          )
        }}
      </For>
    </div>
  )
}
