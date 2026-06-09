import { CommandPalette as Primitive } from "../../primitives/commandPalette/commandPalette"
import type {
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteProps,
} from "../../primitives/commandPalette/commandPalette"
import "./styles.css"

export function CommandPalette(props: CommandPaletteProps) {
  return <Primitive {...props} class={`tbr-command ${props.class ?? ""}`} />
}

export type { CommandPaletteGroup, CommandPaletteItem, CommandPaletteProps }
