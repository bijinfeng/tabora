import { Dialog as P } from "../../primitives/dialog/dialog"
import type { DialogProps } from "../../primitives/dialog/dialog"
import "./styles.css"
export function Dialog(props: DialogProps) {
  return <P {...props} />
}
export type { DialogProps }
