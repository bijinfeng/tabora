import { Match, Switch } from "solid-js"
import type { JSX } from "solid-js"
import type { HostActionId } from "@tabora/plugin-api"

function IconSvg(props: { size: number; children: JSX.Element }): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width={props.size}
      height={props.size}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      {props.children}
    </svg>
  )
}

function PlusIcon(props: { size: number }): JSX.Element {
  return (
    <IconSvg size={props.size}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </IconSvg>
  )
}

function DashboardIcon(props: { size: number }): JSX.Element {
  return (
    <IconSvg size={props.size}>
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
    </IconSvg>
  )
}

function ThemeIcon(props: { size: number }): JSX.Element {
  return (
    <IconSvg size={props.size}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
    </IconSvg>
  )
}

function SettingsIcon(props: { size: number }): JSX.Element {
  return (
    <IconSvg size={props.size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </IconSvg>
  )
}

function SearchIcon(props: { size: number }): JSX.Element {
  return (
    <IconSvg size={props.size}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </IconSvg>
  )
}

export function HostActionIcon(props: {
  id: HostActionId
  icon?: string
  size?: number
}): JSX.Element {
  const size = () => props.size ?? 18

  return (
    <Switch fallback={<span aria-hidden="true">{props.icon}</span>}>
      <Match when={props.id === "home"}>
        <span class="dash-rail-home-mark" aria-hidden="true">
          T
        </span>
      </Match>
      <Match when={props.id === "add-widget"}>
        <PlusIcon size={size()} />
      </Match>
      <Match when={props.id === "settings"}>
        <SettingsIcon size={size()} />
      </Match>
      <Match when={props.id === "command"}>
        <SearchIcon size={size()} />
      </Match>
      <Match when={props.id === "plugins" || props.id === "plugin-manager"}>
        <span aria-hidden="true">◈</span>
      </Match>
      <Match when={props.id === "theme"}>
        <ThemeIcon size={size()} />
      </Match>
      <Match when={props.id === "layout-switch"}>
        <DashboardIcon size={size()} />
      </Match>
      <Match when={props.id === "shortcuts"}>
        <span aria-hidden="true">?</span>
      </Match>
    </Switch>
  )
}
