import { Show, createEffect, createSignal } from "solid-js"
import type { JSX } from "solid-js"

export type InputNumberStepInfo = {
  offset: number
  type: "up" | "down"
}

export type InputNumberFormatterInfo = {
  input: string
  userTyping: boolean
}

export type InputNumberControls = boolean | { downIcon?: JSX.Element; upIcon?: JSX.Element }

export type InputNumberSize = "sm" | "md" | "lg"

export type InputNumberControlRenderProps = {
  canDecrement: boolean
  canIncrement: boolean
  decrement: () => void
  disabled: boolean
  increment: () => void
}

export type InputNumberProps = {
  value?: number | null
  defaultValue?: number
  size?: InputNumberSize
  min?: number
  max?: number
  step?: number
  precision?: number
  disabled?: boolean
  readOnly?: boolean
  keyboard?: boolean
  changeOnWheel?: boolean
  controls?: InputNumberControls
  formatter?: (value: number | undefined, info: InputNumberFormatterInfo) => string
  parser?: (displayValue: string | undefined) => number
  placeholder?: string
  onChange?: (value: number | null) => void
  onStep?: (value: number, info: InputNumberStepInfo) => void
  onBlur?: () => void
  onFocus?: () => void
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  inputClass?: string | undefined
  inputStyle?: JSX.CSSProperties | undefined
  /** Styled implementations use this internally to provide the control affordance. */
  renderControls?: (props: InputNumberControlRenderProps) => JSX.Element
  "aria-label"?: string
}

const clamp = (value: number, min: number | undefined, max: number | undefined) =>
  Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, value))

const round = (value: number, precision: number | undefined) =>
  precision === undefined ? value : Number(value.toFixed(precision))

export function InputNumber(props: InputNumberProps) {
  const [uncontrolledValue, setUncontrolledValue] = createSignal<number | null>(
    props.defaultValue ?? null,
  )
  const [displayValue, setDisplayValue] = createSignal("")
  const isControlled = () => props.value !== undefined
  const value = () => props.value ?? uncontrolledValue()
  const format = (nextValue: number | null, userTyping = false, input = "") =>
    nextValue === null
      ? ""
      : (props.formatter?.(nextValue, { input, userTyping }) ?? String(nextValue))

  createEffect(() => {
    const nextValue = value()
    setDisplayValue(format(nextValue))
  })

  const commit = (rawValue: string, userTyping = false) => {
    if (rawValue.trim() === "") {
      if (!isControlled()) setUncontrolledValue(null)
      props.onChange?.(null)
      return
    }

    const parsed = props.parser?.(rawValue) ?? Number(rawValue)
    if (!Number.isFinite(parsed)) return
    const nextValue = round(clamp(parsed, props.min, props.max), props.precision)
    if (!isControlled()) setUncontrolledValue(nextValue)
    props.onChange?.(nextValue)
    if (!userTyping) setDisplayValue(format(nextValue))
  }

  const stepBy = (offset: number) => {
    const nextValue = round(
      clamp((value() ?? 0) + offset * (props.step ?? 1), props.min, props.max),
      props.precision,
    )
    if (!isControlled()) setUncontrolledValue(nextValue)
    setDisplayValue(format(nextValue))
    props.onChange?.(nextValue)
    props.onStep?.(nextValue, { offset, type: offset > 0 ? "up" : "down" })
  }

  const controlsEnabled = () => props.controls !== false
  const canIncrement = () =>
    !props.disabled && !props.readOnly && (props.max === undefined || (value() ?? 0) < props.max)
  const canDecrement = () =>
    !props.disabled && !props.readOnly && (props.min === undefined || (value() ?? 0) > props.min)

  return (
    <div
      class={props.class}
      style={props.style}
      data-tbr-input-number
      data-size={props.size ?? "md"}
    >
      <input
        class={props.inputClass}
        style={props.inputStyle}
        type="text"
        inputmode="decimal"
        value={displayValue()}
        placeholder={props.placeholder}
        disabled={props.disabled}
        readonly={props.readOnly}
        aria-label={props["aria-label"]}
        onInput={(event) => {
          const nextValue = event.currentTarget.value
          setDisplayValue(nextValue)
          commit(nextValue, true)
        }}
        onBlur={() => {
          commit(displayValue())
          props.onBlur?.()
        }}
        onFocus={() => props.onFocus?.()}
        onKeyDown={(event) => {
          if (props.keyboard === false) return
          if (event.key === "ArrowUp" && canIncrement()) {
            event.preventDefault()
            stepBy(1)
          }
          if (event.key === "ArrowDown" && canDecrement()) {
            event.preventDefault()
            stepBy(-1)
          }
        }}
        onWheel={(event) => {
          if (!props.changeOnWheel || props.disabled || props.readOnly) return
          event.preventDefault()
          if (event.deltaY < 0 && canIncrement()) stepBy(1)
          if (event.deltaY > 0 && canDecrement()) stepBy(-1)
        }}
      />
      <Show when={controlsEnabled() && props.renderControls}>
        {props.renderControls?.({
          canDecrement: canDecrement(),
          canIncrement: canIncrement(),
          decrement: () => stepBy(-1),
          disabled: props.disabled === true || props.readOnly === true,
          increment: () => stepBy(1),
        })}
      </Show>
    </div>
  )
}
