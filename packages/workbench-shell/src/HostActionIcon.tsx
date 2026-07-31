import { Match, Switch } from "solid-js"
import type { JSX } from "solid-js"
import type { HostActionId } from "@tabora/plugin-api"
import Boxes from "lucide-solid/icons/boxes"
import Circle from "lucide-solid/icons/circle"
import House from "lucide-solid/icons/house"
import Moon from "lucide-solid/icons/moon"
import Plus from "lucide-solid/icons/plus"
import Search from "lucide-solid/icons/search"
import Settings from "lucide-solid/icons/settings"
import Sun from "lucide-solid/icons/sun"

export type HostActionIconProps = {
  /** Stable host action id, used to pick a consistent SVG icon. */
  id: HostActionId
  /**
   * Original glyph hint emitted by the host. Used to disambiguate the theme
   * action (sun vs. moon).
   */
  icon?: string
  size?: number
}

const ICON_SIZE = 18

/**
 * Renders a host-provided action as a crisp lucide SVG icon instead of a raw
 * unicode glyph, keeping the workbench chrome visually consistent with the
 * design prototype. Unknown ids use a neutral Lucide fallback.
 */
export function HostActionIcon(props: HostActionIconProps): JSX.Element {
  const size = () => props.size ?? ICON_SIZE
  const isSun = () => props.icon === "sun"

  return (
    <Switch fallback={<Circle size={size()} />}>
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
