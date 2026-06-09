import { Menubar as Primitive } from "../../primitives/menubar/menubar"
import type { MenubarItem, MenubarProps } from "../../primitives/menubar/menubar"
import "./styles.css"

export function Menubar(props: MenubarProps) {
  return <Primitive {...props} class={`tbr-menubar ${props.class ?? ""}`} />
}

export type { MenubarItem, MenubarProps }
