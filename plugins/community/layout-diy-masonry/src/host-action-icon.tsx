import { Match, Switch } from "solid-js"
import type { JSX } from "solid-js"
import type { HostActionId } from "@tabora/plugin-api"
import Boxes from "lucide-solid/icons/boxes"
import Circle from "lucide-solid/icons/circle"
import CircleHelp from "lucide-solid/icons/circle-help"
import House from "lucide-solid/icons/house"
import LayoutDashboard from "lucide-solid/icons/layout-dashboard"
import Moon from "lucide-solid/icons/moon"
import PanelLeft from "lucide-solid/icons/panel-left"
import Plus from "lucide-solid/icons/plus"
import Search from "lucide-solid/icons/search"
import Settings from "lucide-solid/icons/settings"
import Sun from "lucide-solid/icons/sun"

export function HostActionIcon(props: {
  id: HostActionId
  icon?: string
  size?: number
}): JSX.Element {
  const size = () => props.size ?? 18
  const isSun = () => {
    return props.icon === "sun"
  }

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
