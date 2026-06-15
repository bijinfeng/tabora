import { RadioGroup as KRadioGroup } from "@kobalte/core/radio-group"
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
  "aria-label"?: string
}

export function RadioGroup<V extends string>(props: RadioGroupProps<V>) {
  return (
    <KRadioGroup
      {...(props.class ? { class: props.class } : {})}
      data-direction={props.direction ?? "vertical"}
      name={props.name}
      value={props.value}
      onChange={(value) => props.onChange(value as V)}
      orientation={props.direction === "horizontal" ? "horizontal" : "vertical"}
      {...(props["aria-label"] ? { "aria-label": props["aria-label"] } : {})}
    >
      <div role="presentation" class="tbr-radio-group-list">
        <For each={props.options}>
          {(opt) => (
            <KRadioGroup.Item
              class="tbr-radio-item"
              value={opt.value}
              {...(opt.disabled !== undefined ? { disabled: opt.disabled } : {})}
            >
              <KRadioGroup.ItemInput class="tbr-radio-input" />
              <KRadioGroup.ItemControl class="tbr-radio-control" />
              <span class="tbr-radio-content">
                <KRadioGroup.ItemLabel class="tbr-radio-label">{opt.label}</KRadioGroup.ItemLabel>
                {opt.description && (
                  <KRadioGroup.ItemDescription class="tbr-radio-desc">
                    {opt.description}
                  </KRadioGroup.ItemDescription>
                )}
              </span>
            </KRadioGroup.Item>
          )}
        </For>
      </div>
    </KRadioGroup>
  )
}
