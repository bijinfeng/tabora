import { HoverCard as Primitive } from "../../primitives/hoverCard/hoverCard"
import type { HoverCardProps } from "../../primitives/hoverCard/hoverCard"
import "./styles.css"

export function HoverCard(props: HoverCardProps) {
  return <Primitive {...props} class={`tbr-hover-card ${props.class ?? ""}`} />
}

export type { HoverCardProps }
