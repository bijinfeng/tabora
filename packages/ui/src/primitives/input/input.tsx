import { createSignal, Show, type JSX } from "solid-js"
import { X, Eye, EyeOff } from "lucide-solid"

import type { SolidAttrs } from "../../stylex"

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
  inputAttrs?: Record<`data-${string}`, string | undefined>
  controlAttrs?: SolidAttrs<HTMLInputElement>
  wrapperClass?: string | undefined
  wrapperStyle?: JSX.CSSProperties | undefined
  wrapperAttrs?: SolidAttrs<HTMLSpanElement>
  leadingIconClass?: string | undefined
  leadingIconStyle?: JSX.CSSProperties | undefined
  leadingIconAttrs?: SolidAttrs<HTMLSpanElement>
  trailingIconClass?: string | undefined
  trailingIconStyle?: JSX.CSSProperties | undefined
  trailingIconAttrs?: SolidAttrs<HTMLSpanElement>
  clearButtonClass?: string | undefined
  clearButtonStyle?: JSX.CSSProperties | undefined
  clearButtonAttrs?: SolidAttrs<HTMLButtonElement>
  trailingButtonClass?: string | undefined
  trailingButtonStyle?: JSX.CSSProperties | undefined
  trailingButtonAttrs?: SolidAttrs<HTMLButtonElement>
  "aria-label"?: string
  id?: string
  maxLength?: number
  autofocus?: boolean
  onKeyDown?: (e: KeyboardEvent) => void
  onFocus?: () => void
  onBlur?: () => void
  ref?: (element: HTMLInputElement) => void
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
  const controlAttrs = (): SolidAttrs<HTMLInputElement> => ({
    ...props.inputAttrs,
    ...(props.controlAttrs ?? { class: props.class, style: props.style }),
  })
  const wrapperAttrs = (): SolidAttrs<HTMLSpanElement> =>
    props.wrapperAttrs ?? { class: props.wrapperClass, style: props.wrapperStyle }
  const leadingIconAttrs = (): SolidAttrs<HTMLSpanElement> =>
    props.leadingIconAttrs ?? { class: props.leadingIconClass, style: props.leadingIconStyle }
  const trailingIconAttrs = (): SolidAttrs<HTMLSpanElement> =>
    props.trailingIconAttrs ?? { class: props.trailingIconClass, style: props.trailingIconStyle }
  const clearButtonAttrs = (): SolidAttrs<HTMLButtonElement> =>
    props.clearButtonAttrs ?? { class: props.clearButtonClass, style: props.clearButtonStyle }
  const trailingButtonAttrs = (): SolidAttrs<HTMLButtonElement> =>
    props.trailingButtonAttrs ?? {
      class: props.trailingButtonClass,
      style: props.trailingButtonStyle,
    }

  if (!needsWrapper) {
    return (
      <input
        {...controlAttrs()}
        data-size={props.size ?? "md"}
        data-invalid={props.invalid ? "" : undefined}
        type={props.type ?? "text"}
        id={props.id}
        maxLength={props.maxLength}
        autofocus={props.autofocus}
        value={props.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        aria-label={props["aria-label"]}
        aria-invalid={props.invalid ? true : undefined}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        onKeyDown={(e) => props.onKeyDown?.(e)}
        onFocus={() => props.onFocus?.()}
        onBlur={() => props.onBlur?.()}
        ref={props.ref}
      />
    )
  }

  // Render with wrapper for icons / clearable / password toggle
  return (
    <span {...wrapperAttrs()}>
      <Show when={props.leadingIcon}>
        <span {...leadingIconAttrs()} aria-hidden="true">
          {props.leadingIcon}
        </span>
      </Show>
      <input
        {...controlAttrs()}
        data-size={props.size ?? "md"}
        data-invalid={props.invalid ? "" : undefined}
        data-has-leading={hasLeading() ? "" : undefined}
        data-has-trailing={hasTrailing() ? "" : undefined}
        type={effectiveType()}
        id={props.id}
        maxLength={props.maxLength}
        autofocus={props.autofocus}
        value={props.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        aria-label={props["aria-label"]}
        aria-invalid={props.invalid ? true : undefined}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        onKeyDown={(e) => props.onKeyDown?.(e)}
        onFocus={() => props.onFocus?.()}
        onBlur={() => props.onBlur?.()}
        ref={props.ref}
      />
      <Show when={props.trailingIcon && !props.clearable && !isPasswordType()}>
        <span {...trailingIconAttrs()} aria-hidden="true">
          {props.trailingIcon}
        </span>
      </Show>
      <Show when={props.clearable && hasValue() && !props.disabled}>
        <button
          type="button"
          {...clearButtonAttrs()}
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
          {...trailingButtonAttrs()}
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
