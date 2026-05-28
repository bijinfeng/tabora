import { Switch as KSwitch } from "@kobalte/core/switch"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  "aria-label"?: string
  label?: JSX.Element
}

export function Switch(props: SwitchProps) {
  return (
    <KSwitch
      class="tabora-switch"
      checked={props.checked}
      onChange={(v) => props.onChange(v)}
      disabled={props.disabled ?? false}
    >
      <KSwitch.Input class="tabora-switch-input" aria-label={props["aria-label"]} />
      <KSwitch.Control class="tabora-switch-control">
        <KSwitch.Thumb class="tabora-switch-thumb" />
      </KSwitch.Control>
      <Show when={props.label}>
        <KSwitch.Label class="tabora-switch-label">{props.label}</KSwitch.Label>
      </Show>
    </KSwitch>
  )
}
