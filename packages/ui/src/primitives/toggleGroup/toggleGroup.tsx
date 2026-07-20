import { ToggleGroup as KToggleGroup } from "@kobalte/core/toggle-group"
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
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  itemClass?: string | undefined
  itemSelectedClass?: string | undefined
  itemDisabledClass?: string | undefined
  "aria-label": string
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ") || undefined
}

export function ToggleGroup(props: ToggleGroupProps) {
  return (
    <KToggleGroup
      {...(props.class ? { class: props.class } : {})}
      {...(props.style ? { style: props.style } : {})}
      aria-label={props["aria-label"]}
      multiple={true}
      {...(props.disabled !== undefined ? { disabled: props.disabled } : {})}
      value={props.value}
      onChange={(value) => {
        if (Array.isArray(value)) props.onChange(value)
        else props.onChange(value ? [value] : [])
      }}
    >
      <For each={props.options}>
        {(option) => (
          <KToggleGroup.Item
            class={joinClasses(
              props.itemClass,
              props.value.includes(option.value) ? props.itemSelectedClass : undefined,
              props.disabled || option.disabled ? props.itemDisabledClass : undefined,
            )}
            value={option.value}
            disabled={Boolean(props.disabled || option.disabled)}
          >
            {option.label}
          </KToggleGroup.Item>
        )}
      </For>
    </KToggleGroup>
  )
}
