import { ToggleGroup } from "@kobalte/core/toggle-group"
import type { JSX } from "solid-js"
import { For } from "solid-js"

export type SegmentedControlOption<V extends string> = {
  value: V
  label: JSX.Element
  disabled?: boolean
}

export type SegmentedControlProps<V extends string> = {
  value: V
  options: SegmentedControlOption<V>[]
  onChange: (value: V) => void
  size?: "sm" | "md"
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

export function SegmentedControl<V extends string>(props: SegmentedControlProps<V>) {
  return (
    <ToggleGroup
      class={props.class}
      style={props.style}
      data-size={props.size ?? "md"}
      value={props.value}
      onChange={(v) => v && props.onChange(v as V)}
      aria-label={props["aria-label"]}
    >
      <For each={props.options}>
        {(opt) => (
          <ToggleGroup.Item
            class={joinClasses(
              props.itemClass,
              props.value === opt.value ? props.itemSelectedClass : undefined,
              opt.disabled ? props.itemDisabledClass : undefined,
            )}
            value={opt.value}
            disabled={opt.disabled}
          >
            {opt.label}
          </ToggleGroup.Item>
        )}
      </For>
    </ToggleGroup>
  )
}
