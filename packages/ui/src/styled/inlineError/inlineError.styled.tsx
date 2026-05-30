import { InlineError as Primitive } from "../../primitives/inlineError/inlineError"
import type { InlineErrorProps } from "../../primitives/inlineError/inlineError"
import "./styles.css"

export function InlineError(props: InlineErrorProps) {
  return <Primitive {...props} class="tbr-inline-error" />
}

export type { InlineErrorProps }
