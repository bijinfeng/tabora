import { Kbd as P } from "../../primitives/kbd/kbd"
import type { KbdProps } from "../../primitives/kbd/kbd"
import "./styles.css"
export function Kbd(props: KbdProps) {
  return <P {...props} class="tbr-kbd" />
}
export type { KbdProps }
