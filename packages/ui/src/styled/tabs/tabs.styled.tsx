import { Tabs as Primitive } from "../../primitives/tabs/tabs"
import type { TabsProps } from "../../primitives/tabs/tabs"
import "./styles.css"

export function Tabs(props: TabsProps) {
  return <Primitive {...props} />
}

export type { TabsProps }
