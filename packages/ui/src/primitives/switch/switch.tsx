import { Switch as KSwitch } from "@kobalte/core/switch"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  loading?: boolean
  size?: "sm" | "md"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  inputClass?: string | undefined
  inputStyle?: JSX.CSSProperties | undefined
  controlClass?: string | undefined
  controlStyle?: JSX.CSSProperties | undefined
  thumbClass?: string | undefined
  thumbStyle?: JSX.CSSProperties | undefined
  labelClass?: string | undefined
  labelStyle?: JSX.CSSProperties | undefined
  "aria-label"?: string
  label?: JSX.Element
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function Switch(props: SwitchProps) {
  return (
    <KSwitch
      class={props.class}
      style={props.style}
      data-size={props.size ?? "md"}
      data-loading={props.loading ? "" : undefined}
      checked={props.checked}
      onChange={(v) => props.onChange(v)}
      disabled={props.disabled ?? props.loading ?? false}
    >
      <KSwitch.Input
        {...optionalPartProps(props.inputClass, props.inputStyle)}
        {...(props["aria-label"] !== undefined ? { "aria-label": props["aria-label"] } : {})}
      />
      <KSwitch.Control class={props.controlClass} style={props.controlStyle}>
        <KSwitch.Thumb class={props.thumbClass} style={props.thumbStyle} />
      </KSwitch.Control>
      <Show when={props.label}>
        <KSwitch.Label class={props.labelClass} style={props.labelStyle}>
          {props.label}
        </KSwitch.Label>
      </Show>
    </KSwitch>
  )
}
