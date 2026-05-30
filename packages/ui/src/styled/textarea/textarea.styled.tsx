import { HeadlessTextarea } from "../../primitives/textarea/textarea"
import type { HeadlessTextareaProps } from "../../primitives/textarea/textarea"
import "./styles.css"

export function Textarea(props: HeadlessTextareaProps) {
  return <HeadlessTextarea {...props} class="tbr-textarea" />
}

export type TextareaProps = HeadlessTextareaProps
