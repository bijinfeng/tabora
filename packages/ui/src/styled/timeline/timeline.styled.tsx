import { Timeline as Primitive } from "../../primitives/timeline/timeline"
import type { TimelineItem, TimelineProps } from "../../primitives/timeline/timeline"
import "./styles.css"

export function Timeline(props: TimelineProps) {
  return <Primitive {...props} class={`tbr-timeline ${props.class ?? ""}`} />
}

export type { TimelineItem, TimelineProps }
