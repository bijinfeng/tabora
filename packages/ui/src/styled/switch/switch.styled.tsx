import { Switch as Primitive } from "../../primitives/switch/switch"
import type { SwitchProps } from "../../primitives/switch/switch"
import "./styles.css"

export function Switch(props: SwitchProps) {
  return <Primitive {...props} class="tbr-switch" />
}

export type { SwitchProps }
