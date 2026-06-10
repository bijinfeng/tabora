import { Match, Switch } from "solid-js"
import type { JSX } from "solid-js"
import type { HostActionId } from "@tabora/plugin-api"
import {
  Boxes,
  CircleHelp,
  LayoutDashboard,
  Moon,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Sun,
} from "lucide-solid"

export function HostActionIcon(props: {
  id: HostActionId
  icon?: string
  size?: number
}): JSX.Element {
  const size = () => props.size ?? 18
  const isSun = () => {
    const glyph = props.icon ?? ""
    return glyph.includes("sun") || glyph.includes("☀") || glyph.includes("☼")
  }

  return (
    <Switch fallback={<span aria-hidden="true">{props.icon}</span>}>
      <Match when={props.id === "home"}>
        <span class="dash-rail-home-mark" aria-hidden="true">
          T
        </span>
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
      <Match when={props.id === "plugins" || props.id === "plugin-manager"}>
        <Boxes size={size()} />
      </Match>
      <Match when={props.id === "theme"}>
        {isSun() ? <Sun size={size()} /> : <Moon size={size()} />}
      </Match>
      <Match when={props.id === "layout-switch"}>
        {props.icon === "layout-dashboard" ? (
          <LayoutDashboard size={size()} />
        ) : (
          <PanelLeft size={size()} />
        )}
      </Match>
      <Match when={props.id === "shortcuts"}>
        <CircleHelp size={size()} />
      </Match>
    </Switch>
  )
}
