export type InputSize = "sm" | "md"
export type InputType = "text" | "search" | "url" | "email"

export type InputProps = {
  value: string
  onInput: (value: string) => void
  placeholder?: string
  size?: InputSize
  disabled?: boolean
  invalid?: boolean
  type?: InputType
  "aria-label"?: string
  id?: string
  onKeyDown?: (e: KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
}

export function Input(props: InputProps) {
  return (
    <input
      class="tabora-input"
      data-size={props.size ?? "md"}
      data-invalid={props.invalid ? "" : undefined}
      type={props.type ?? "text"}
      id={props.id}
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      aria-label={props["aria-label"]}
      aria-invalid={props.invalid ? true : undefined}
      onInput={(e) => props.onInput(e.currentTarget.value)}
      onKeyDown={(e) => props.onKeyDown?.(e)}
      onFocus={() => props.onFocus?.()}
      onBlur={() => props.onBlur?.()}
    />
  )
}
