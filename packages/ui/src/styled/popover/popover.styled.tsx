import { Popover as P } from "../../primitives/popover/popover"
import type { PopoverProps } from "../../primitives/popover/popover"
import "./styles.css"
export function Popover(props: PopoverProps) {
  return <P {...props} />
}
export type { PopoverProps }
