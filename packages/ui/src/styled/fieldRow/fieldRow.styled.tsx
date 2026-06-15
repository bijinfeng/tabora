import { FieldRow as Primitive } from "../../primitives/fieldRow/fieldRow"
import type { FieldRowProps } from "../../primitives/fieldRow/fieldRow"
import "./styles.css"

export function FieldRow(props: FieldRowProps) {
  return <Primitive {...props} class={`tbr-field-row ${props.class ?? ""}`.trim()} />
}

export type { FieldRowProps }
