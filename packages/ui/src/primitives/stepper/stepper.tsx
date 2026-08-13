import { splitProps, type JSX } from "solid-js"

type NativeStepperProps = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "aria-label" | "children" | "class" | "style"
>

export type StepperProps = {
  value: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onChange: (value: number) => void
  class?: string | undefined
  style?: JSX.HTMLAttributes<HTMLDivElement>["style"]
  decrementClass?: string | undefined
  decrementStyle?: JSX.HTMLAttributes<HTMLButtonElement>["style"]
  valueClass?: string | undefined
  valueStyle?: JSX.HTMLAttributes<HTMLElement>["style"]
  incrementClass?: string | undefined
  incrementStyle?: JSX.HTMLAttributes<HTMLButtonElement>["style"]
  "aria-label": string
  decrementAriaLabel?: string
  incrementAriaLabel?: string
} & NativeStepperProps

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function Stepper(props: StepperProps) {
  const [local, others] = splitProps(props, [
    "value",
    "min",
    "max",
    "step",
    "disabled",
    "onChange",
    "class",
    "style",
    "decrementClass",
    "decrementStyle",
    "valueClass",
    "valueStyle",
    "incrementClass",
    "incrementStyle",
    "aria-label",
    "decrementAriaLabel",
    "incrementAriaLabel",
  ])
  const min = () => local.min ?? 0
  const max = () => Math.max(min(), local.max ?? 100)
  const step = () => Math.abs(local.step ?? 1)
  const decrementDisabled = () => local.disabled || local.value <= min()
  const incrementDisabled = () => local.disabled || local.value >= max()
  const update = (delta: number) => {
    const nextValue = clamp(local.value + delta * step(), min(), max())
    if (nextValue !== local.value && !local.disabled) local.onChange(nextValue)
  }

  return (
    <div
      {...others}
      class={local.class}
      style={local.style}
      role="group"
      aria-label={local["aria-label"]}
      data-tbr-stepper
    >
      <button
        type="button"
        class={local.decrementClass}
        style={local.decrementStyle}
        aria-label={local.decrementAriaLabel ?? "减少"}
        disabled={decrementDisabled()}
        data-stepper-decrement
        onClick={() => update(-1)}
      >
        −
      </button>
      <strong
        class={local.valueClass}
        style={local.valueStyle}
        aria-live="polite"
        data-stepper-value
      >
        {local.value}
      </strong>
      <button
        type="button"
        class={local.incrementClass}
        style={local.incrementStyle}
        aria-label={local.incrementAriaLabel ?? "增加"}
        disabled={incrementDisabled()}
        data-stepper-increment
        onClick={() => update(1)}
      >
        +
      </button>
    </div>
  )
}
