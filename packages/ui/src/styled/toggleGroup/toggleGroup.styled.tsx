import { ToggleGroup as Primitive } from "../../primitives/toggleGroup/toggleGroup"
import type { ToggleGroupOption, ToggleGroupProps } from "../../primitives/toggleGroup/toggleGroup"
import "./styles.css"

export function ToggleGroup(props: ToggleGroupProps) {
  return <Primitive {...props} class={`tbr-toggle-group ${props.class ?? ""}`} />
}

export type { ToggleGroupOption, ToggleGroupProps }
