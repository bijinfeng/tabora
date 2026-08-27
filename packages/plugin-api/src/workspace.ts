import type {
  BackgroundProviderContributionRef,
  BackgroundRendererContributionRef,
  LayoutContributionRef,
  PluginManifest,
  PluginPermission,
  RegionContributionRef,
  SettingsHostActionId,
  SettingsHostReadId,
  ThemeContributionRef,
  WidgetSize,
} from "./manifest"

export type GridPlacement = {
  x: number
  y: number
  colSpan: number
  rowSpan: number
  locked?: boolean
}

export type Workspace = {
  id: string
  name: string
  activeLayout: LayoutContributionRef
  activeTheme: ThemeContributionRef
  activeBackgroundProvider: BackgroundProviderContributionRef
  activeBackgroundRenderer?: BackgroundRendererContributionRef
  config?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type PluginInstance = {
  id: string
  workspaceId: string
  /** Canonical persisted identity. */
  contribution: RegionContributionRef
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
  source: "builtin"
  enabled: boolean
  status: "active" | "disabled" | "error" | "skipped"
  installedAt: string
  updatedAt: string
  lastActivatedAt?: string
  lastError?: string
  disabledReason?: string
  manifest: PluginManifest
  grantedPermissions: PluginPermission[]
  /** Host-approved subset of settings panel action requests. */
  grantedSettingsHostActions?: SettingsHostActionId[]
  /** Host-approved subset of settings panel read requests. */
  grantedSettingsHostReads?: SettingsHostReadId[]
}
