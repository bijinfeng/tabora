import type { ExtensionPoint, PluginManifest, PluginPermission, WidgetSize } from "./manifest"

export type GridPlacement = {
  x: number
  y: number
  colSpan: number
  rowSpan: number
  locked?: boolean
}

export type RegionState = {
  regionId: string
  accepts: ExtensionPoint[]
  instances: Array<{ instanceId: string }>
}

export type Workspace = {
  id: string
  name: string
  activeLayoutId: string
  activeThemeId: string
  activeBackgroundProviderId?: string
  activeBackgroundRendererId?: string
  config?: Record<string, unknown>
  regions: Record<string, RegionState>
  createdAt: string
  updatedAt: string
}

export type PluginInstance = {
  id: string
  pluginId: string
  contributionId: string
  extensionPoint: ExtensionPoint
  regionId: string
  enabled: boolean
  size?: WidgetSize
  grid?: GridPlacement
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type PluginRecord = {
  id: string
  version: string
  source: "builtin" | "local" | "remote"
  enabled: boolean
  installedAt: string
  updatedAt: string
  manifest: PluginManifest
  grantedPermissions: PluginPermission[]
}
