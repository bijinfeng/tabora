import type { JSX } from "solid-js"

export type HeadlessTextareaProps = {
  value: string
  onInput: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  size?: "sm" | "md"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  "aria-label"?: string
  id?: string
}

export function HeadlessTextarea(props: HeadlessTextareaProps) {
  return (
    <textarea
      class={props.class}
      style={props.style}
      id={props.id}
      rows={props.rows ?? 4}
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      readOnly={props.readOnly}
      aria-label={props["aria-label"]}
      aria-invalid={props.invalid ? true : undefined}
      data-invalid={props.invalid ? "" : undefined}
      data-size={props.size ?? "md"}
      onInput={(e) => props.onInput(e.currentTarget.value)}
    />
  )
}

export type TextareaProps = HeadlessTextareaProps
