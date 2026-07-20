import { createSignal, Show, type JSX } from "solid-js"
import { X, Eye, EyeOff } from "lucide-solid"

export type InputSize = "sm" | "md"
export type InputType = "text" | "search" | "url" | "email" | "password"

export type HeadlessInputProps = {
  value: string
  onInput: (value: string) => void
  placeholder?: string
  size?: InputSize
  disabled?: boolean
  invalid?: boolean
  type?: InputType
  clearable?: boolean
  leadingIcon?: JSX.Element
  trailingIcon?: JSX.Element
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  wrapperClass?: string | undefined
  wrapperStyle?: JSX.CSSProperties | undefined
  leadingIconClass?: string | undefined
  leadingIconStyle?: JSX.CSSProperties | undefined
  trailingIconClass?: string | undefined
  trailingIconStyle?: JSX.CSSProperties | undefined
  clearButtonClass?: string | undefined
  clearButtonStyle?: JSX.CSSProperties | undefined
  trailingButtonClass?: string | undefined
  trailingButtonStyle?: JSX.CSSProperties | undefined
  "aria-label"?: string
  id?: string
  onKeyDown?: (e: KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
}

export function HeadlessInput(props: HeadlessInputProps) {
  const [showPassword, setShowPassword] = createSignal(false)

  const hasValue = () => props.value.length > 0
  const isPasswordType = () => props.type === "password"
  const effectiveType = () => (isPasswordType() && showPassword() ? "text" : (props.type ?? "text"))

  const handleClear = () => {
    props.onInput("")
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword())
  }

  // Determine if wrapper is needed
  const needsWrapper =
    props.clearable || isPasswordType() || props.leadingIcon || props.trailingIcon

  // Determine padding adjustments
  const hasLeading = () => !!props.leadingIcon
  const hasTrailing = () => !!props.trailingIcon || props.clearable || isPasswordType()

  if (!needsWrapper) {
    return (
      <input
        class={props.class}
        style={props.style}
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

  // Render with wrapper for icons / clearable / password toggle
  return (
    <span class={props.wrapperClass} style={props.wrapperStyle}>
      <Show when={props.leadingIcon}>
        <span class={props.leadingIconClass} style={props.leadingIconStyle} aria-hidden="true">
          {props.leadingIcon}
        </span>
      </Show>
      <input
        class={props.class}
        style={props.style}
        data-size={props.size ?? "md"}
        data-invalid={props.invalid ? "" : undefined}
        data-has-leading={hasLeading() ? "" : undefined}
        data-has-trailing={hasTrailing() ? "" : undefined}
        type={effectiveType()}
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
      <Show when={props.trailingIcon && !props.clearable && !isPasswordType()}>
        <span class={props.trailingIconClass} style={props.trailingIconStyle} aria-hidden="true">
          {props.trailingIcon}
        </span>
      </Show>
      <Show when={props.clearable && hasValue() && !props.disabled}>
        <button
          type="button"
          class={props.clearButtonClass}
          style={props.clearButtonStyle}
          onClick={handleClear}
          aria-label="清除"
          tabIndex={-1}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </Show>
      <Show when={isPasswordType() && !props.disabled}>
        <button
          type="button"
          class={props.trailingButtonClass}
          style={props.trailingButtonStyle}
          onClick={togglePasswordVisibility}
          aria-label={showPassword() ? "隐藏密码" : "显示密码"}
          tabIndex={-1}
        >
          <Show when={showPassword()} fallback={<Eye size={16} strokeWidth={2} />}>
            <EyeOff size={16} strokeWidth={2} />
          </Show>
        </button>
      </Show>
    </span>
  )
}
