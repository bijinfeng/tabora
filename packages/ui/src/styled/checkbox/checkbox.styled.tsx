import { Checkbox as Primitive } from "../../primitives/checkbox/checkbox"
import type { CheckboxProps } from "../../primitives/checkbox/checkbox"
import "./styles.css"

export function Checkbox(props: CheckboxProps) {
  return <Primitive {...props} class="tbr-checkbox" />
}

export type { CheckboxProps }
