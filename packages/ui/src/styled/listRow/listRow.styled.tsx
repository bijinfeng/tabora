import { ListRow as Primitive } from "../../primitives/listRow/listRow"
import type { ListRowProps } from "../../primitives/listRow/listRow"
import "./styles.css"

export function ListRow(props: ListRowProps) {
  return <Primitive {...props} class={`tbr-list-row ${props.class ?? ""}`.trim()} />
}

export type { ListRowProps }
