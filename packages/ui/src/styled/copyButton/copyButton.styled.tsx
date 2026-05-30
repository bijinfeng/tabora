import { CopyButton as P } from "../../primitives/copyButton/copyButton"
import type { CopyButtonProps } from "../../primitives/copyButton/copyButton"
import "./styles.css"
export function CopyButton(props: CopyButtonProps) {
  return <P {...props} class="tbr-copy-btn" />
}
export type { CopyButtonProps }
