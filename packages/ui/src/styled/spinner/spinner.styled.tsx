import { Spinner as SpinnerPrimitive } from "../../primitives/spinner/spinner"
import type { SpinnerProps } from "../../primitives/spinner/spinner"
import "./styles.css"

export function Spinner(props: SpinnerProps) {
  return <SpinnerPrimitive {...props} class="tbr-spinner" />
}

export type { SpinnerProps }
