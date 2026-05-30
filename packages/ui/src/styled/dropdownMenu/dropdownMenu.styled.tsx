import { DropdownMenu as P } from "../../primitives/dropdownMenu/dropdownMenu"
import type {
  DropdownMenuProps,
  DropdownMenuItem,
} from "../../primitives/dropdownMenu/dropdownMenu"
import "./styles.css"
export function DropdownMenu(props: DropdownMenuProps) {
  return <P {...props} />
}
export type { DropdownMenuProps, DropdownMenuItem }
