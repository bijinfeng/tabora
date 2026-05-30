import { Divider as P } from "../../primitives/divider/divider"
import type { DividerProps } from "../../primitives/divider/divider"
import "./styles.css"
export function Divider(props: DividerProps) {
  return <P {...props} class="tbr-divider" />
}
export type { DividerProps }
