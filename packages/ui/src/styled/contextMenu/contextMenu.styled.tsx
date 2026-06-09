import { ContextMenu as Primitive } from "../../primitives/contextMenu/contextMenu"
import type { ContextMenuItem, ContextMenuProps } from "../../primitives/contextMenu/contextMenu"
import "./styles.css"

export function ContextMenu(props: ContextMenuProps) {
  return <Primitive {...props} class={`tbr-context-menu ${props.class ?? ""}`} />
}

export type { ContextMenuItem, ContextMenuProps }
