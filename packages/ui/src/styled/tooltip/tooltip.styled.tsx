import { Tooltip as Primitive } from "../../primitives/tooltip/tooltip"
import type { TooltipProps, TooltipPlacement } from "../../primitives/tooltip/tooltip"
import "./styles.css"

export function Tooltip(props: TooltipProps) {
  return <Primitive {...props} />
}
export type { TooltipProps, TooltipPlacement }
