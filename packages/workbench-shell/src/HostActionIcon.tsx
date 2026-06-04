import { Match, Switch } from "solid-js"
import type { JSX } from "solid-js"
import type { HostActionId } from "@tabora/plugin-api"
import { Boxes, House, Moon, Plus, Search, Settings, Sun } from "lucide-solid"

export type HostActionIconProps = {
  /** Stable host action id, used to pick a consistent SVG icon. */
  id: HostActionId
  /**
   * Original glyph hint emitted by the host. Used to disambiguate the theme
   * action (sun vs. moon) and as a fallback for unknown action ids.
   */
  icon?: string
  size?: number
}

const ICON_SIZE = 18

/**
 * Renders a host-provided action as a crisp lucide SVG icon instead of a raw
 * unicode glyph, keeping the workbench chrome visually consistent with the
 * design prototype. Unknown ids fall back to the original glyph so third-party
 * layouts keep working.
 */
export function HostActionIcon(props: HostActionIconProps): JSX.Element {
  const size = () => props.size ?? ICON_SIZE
  // Theme button shows the state it switches TO; the host already encodes that
  // intent in the glyph (☀/☼ → light, ☾ → dark).
  const isSun = () => {
    const glyph = props.icon ?? ""
    return glyph.includes("☀") || glyph.includes("☼")
  }

  return (
    <Switch fallback={<span aria-hidden="true">{props.icon}</span>}>
      <Match when={props.id === "home"}>
        <House size={size()} />
      </Match>
      <Match when={props.id === "add-widget"}>
        <Plus size={size()} />
      </Match>
      <Match when={props.id === "settings"}>
        <Settings size={size()} />
      </Match>
      <Match when={props.id === "command"}>
        <Search size={size()} />
      </Match>
      <Match when={props.id === "plugins"}>
        <Boxes size={size()} />
      </Match>
      <Match when={props.id === "theme"}>
        {isSun() ? <Sun size={size()} /> : <Moon size={size()} />}
      </Match>
    </Switch>
  )
}
