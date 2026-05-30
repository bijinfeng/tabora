import { Switch as KSwitch } from "@kobalte/core/switch"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  loading?: boolean
  size?: "sm" | "md"
  class?: string
  "aria-label"?: string
  label?: JSX.Element
}

export function Switch(props: SwitchProps) {
  return (
    <KSwitch
      class={props.class}
      data-size={props.size ?? "md"}
      data-loading={props.loading ? "" : undefined}
      checked={props.checked}
      onChange={(v) => props.onChange(v)}
      disabled={props.disabled ?? props.loading ?? false}
    >
      <KSwitch.Input class="tbr-switch-input" aria-label={props["aria-label"]} />
      <KSwitch.Control class="tbr-switch-control">
        <KSwitch.Thumb class="tbr-switch-thumb" />
      </KSwitch.Control>
      <Show when={props.label}>
        <KSwitch.Label class="tbr-switch-label">{props.label}</KSwitch.Label>
      </Show>
    </KSwitch>
  )
}
