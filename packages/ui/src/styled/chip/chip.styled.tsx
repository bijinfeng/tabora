import { Chip as P } from "../../primitives/chip/chip"
import type { ChipProps } from "../../primitives/chip/chip"
import "./styles.css"
export function Chip(props: ChipProps) {
  return <P {...props} class="tbr-chip" />
}
export type { ChipProps }
