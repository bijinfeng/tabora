import type { ExtensionPoint } from "./manifest"
import type { PluginInstance } from "./workspace"

export type RegionSlot<TRendered = unknown> = {
  regionId: string
  title: string
  accepts: ExtensionPoint[]
  instances: PluginInstance[]
  isEmpty: boolean
  render: () => TRendered
  renderInstance: (instance: PluginInstance) => TRendered
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
  showToast: (
    message: string,
    opts?: {
      type?: "success" | "error" | "warning" | "info"
      duration?: number
      action?: { label: string; commandId: string }
    },
  ) => void
  toggleTheme: () => void
  isDark: () => boolean
}

export type LayoutViewProps<TRendered = unknown> = {
  regions: Record<string, RegionSlot<TRendered>>
  isMobile: boolean
  host: LayoutHostAPI
}
