import { ScrollArea as Primitive } from "../../primitives/scrollArea/scrollArea"
import type { ScrollAreaProps } from "../../primitives/scrollArea/scrollArea"
import "./styles.css"

export function ScrollArea(props: ScrollAreaProps) {
  return <Primitive {...props} class={`tbr-scroll-area ${props.class ?? ""}`} />
}

export type { ScrollAreaProps }
