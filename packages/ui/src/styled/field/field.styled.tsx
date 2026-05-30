import { Field as Primitive } from "../../primitives/field/field"
import type { FieldProps } from "../../primitives/field/field"
import "./styles.css"

export function Field(props: FieldProps) {
  return <Primitive {...props} class="tbr-field" />
}

export type { FieldProps }
