import { HeadlessInput } from "../../primitives/input/input"
import type { HeadlessInputProps } from "../../primitives/input/input"
import { tv } from "../../tokens/createVariants"
import "./styles.css"

const inputVariants = tv({
  base: "tbr-input",
  variants: { size: { sm: "tbr-input--sm", md: "tbr-input--md" } },
  defaultVariants: { size: "md" },
})

export function Input(props: HeadlessInputProps) {
  return <HeadlessInput {...props} class={inputVariants({ size: props.size })} />
}

export type InputProps = HeadlessInputProps
export type InputSize = HeadlessInputProps["size"]
export type InputType = HeadlessInputProps["type"]
