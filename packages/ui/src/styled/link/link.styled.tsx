import { Link as P } from "../../primitives/link/link"
import type { LinkProps } from "../../primitives/link/link"
import "./styles.css"
export function Link(props: LinkProps) {
  return <P {...props} class="tbr-link" />
}
export type { LinkProps }
