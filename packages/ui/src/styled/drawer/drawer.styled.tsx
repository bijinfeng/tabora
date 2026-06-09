import { Drawer as Primitive } from "../../primitives/drawer/drawer"
import type { DrawerProps } from "../../primitives/drawer/drawer"
import "./styles.css"

export function Drawer(props: DrawerProps) {
  return <Primitive {...props} class={`tbr-drawer ${props.class ?? ""}`} />
}

export type { DrawerProps }
