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
  class?: string
  "aria-label": string
}

export function SegmentedControl<V extends string>(props: SegmentedControlProps<V>) {
  return (
    <ToggleGroup
      class={`tbr-segmented ${props.class ?? ""}`}
      data-size={props.size ?? "md"}
      value={props.value}
      onChange={(v) => v && props.onChange(v as V)}
      aria-label={props["aria-label"]}
    >
      <For each={props.options}>
        {(opt) => (
          <ToggleGroup.Item class="tbr-segmented-item" value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </ToggleGroup.Item>
        )}
      </For>
    </ToggleGroup>
  )
}
