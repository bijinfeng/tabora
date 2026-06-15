import { DropdownMenu as P } from "../../primitives/dropdownMenu/dropdownMenu"
import type {
  DropdownMenuAlign,
  DropdownMenuProps,
  DropdownMenuItem,
  DropdownMenuSide,
} from "../../primitives/dropdownMenu/dropdownMenu"
import "./styles.css"
export function DropdownMenu(props: DropdownMenuProps) {
  return <P {...props} />
}
export type { DropdownMenuAlign, DropdownMenuProps, DropdownMenuItem, DropdownMenuSide }
