import type { JSX } from "solid-js"
import type { ExtensionPoint } from "./manifest"
import type { PluginInstance } from "./workspace"

export type RegionSlot = {
  regionId: string
  title: string
  accepts: ExtensionPoint[]
  instances: PluginInstance[]
  isEmpty: boolean
  render: () => JSX.Element
  renderInstance: (instance: PluginInstance) => JSX.Element
}

export type HostSurface = "rail" | "toolbar" | "menu"

export type HostActionId =
  | "home"
  | "add-widget"
  | "plugins"
  | "plugin-manager"
  | "settings"
  | "theme"
  | "command"
  | "layout-switch"
  | "shortcuts"

export type HostActionItem = {
  id: HostActionId
  label: string
  icon: string
  shortcut?: string
  isActive?: boolean
  run: () => void
}

export type LayoutHostAPI = {
  getGlobalActions: (surface: HostSurface) => HostActionItem[]
  openSettings: (panelId?: string) => void
  openCommandPalette: () => void
  openAddWidget: () => void
  toggleTheme: () => void
  isDark: () => boolean
}

export type LayoutViewProps = {
  regions: Record<string, RegionSlot>
  isMobile: boolean
  host: LayoutHostAPI
}
