import { TreeView as Primitive } from "../../primitives/treeView/treeView"
import type { TreeViewItem, TreeViewProps } from "../../primitives/treeView/treeView"
import "./styles.css"

export function TreeView(props: TreeViewProps) {
  return <Primitive {...props} class={`tbr-tree ${props.class ?? ""}`} />
}

export type { TreeViewItem, TreeViewProps }
