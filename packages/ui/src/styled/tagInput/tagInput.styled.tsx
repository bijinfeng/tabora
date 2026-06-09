import { TagInput as Primitive } from "../../primitives/tagInput/tagInput"
import type { TagInputProps } from "../../primitives/tagInput/tagInput"
import "./styles.css"

export function TagInput(props: TagInputProps) {
  return <Primitive {...props} class={`tbr-tag-input ${props.class ?? ""}`} />
}

export type { TagInputProps }
