import type { PluginInstance } from "./workspace"

export type HostSurface = "rail" | "toolbar" | "menu"

export type HostActionId =
  | "home"
  | "add-widget"
  | "plugins"
  | "plugin-manager"
  | "settings"
  | "theme"
  | "command"
  | "shortcuts"

export type HostActionItem = {
  id: HostActionId
  label: string
  icon: string
  shortcut?: string
  isActive?: boolean
  run: () => void
}

export type AddWidgetContext = {
  activeGroupLabel?: string
  onAdded?: (instance: PluginInstance) => void
}

export type LayoutHostAPI = {
  getGlobalActions: (surface: HostSurface) => HostActionItem[]
  openSettings: (panelId?: string) => void
  openCommandPalette: () => void
  openAddWidget: (context?: AddWidgetContext) => void
  readLayoutState: <T = unknown>(key: string) => T | undefined
  writeLayoutState: (key: string, value: unknown) => void
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

/**
 * Dashboard layout props — the host-builtin dashboard consumes typed instance lists
 * instead of dynamic region slots. Layout is no longer a plugin extension point.
 */
export type DashboardLayoutProps<TRendered = unknown> = {
  searchInstances: PluginInstance[]
  widgetInstances: PluginInstance[]
  isMobile: boolean
  host: LayoutHostAPI
  renderSearch: (instance: PluginInstance) => TRendered
  renderWidget: (instance: PluginInstance) => TRendered
}
