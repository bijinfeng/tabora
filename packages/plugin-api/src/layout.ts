import type { RegionContentKind } from "./manifest"

/** Read-only instance projection exposed to layout plugins; it omits persistence metadata. */
export type LayoutInstance = {
  id: string
  contribution: {
    pluginId: string
    kind: RegionContentKind
    id: string
  }
  regionId: string
  enabled: boolean
  size?: "S" | "M" | "L" | "XL"
  grid?: { x: number; y: number; colSpan: number; rowSpan: number; locked?: boolean }
  config: Readonly<Record<string, unknown>>
}

export type RegionSlot<TRendered = unknown> = {
  regionId: string
  title: string
  accepts: RegionContentKind[]
  instances: LayoutInstance[]
  isEmpty: boolean
  render: () => TRendered
  renderInstance: (instance: LayoutInstance) => TRendered
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
  onAdded?: (instance: LayoutInstance) => void
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

export type LayoutViewProps<TRendered = unknown> = {
  regions: Record<string, RegionSlot<TRendered>>
  isMobile: boolean
  host: LayoutHostAPI
}
