import type { JSX } from "solid-js"
import type {
  PluginManifest,
  SettingsPanelProvider,
  SettingsPanelProviderContext,
  SettingsPanelViewProps,
  SettingsSurface,
} from "@tabora/plugin-api"
import type {
  SettingsPanelDescriptor as NavigatorSettingsPanelDescriptor,
  SettingsSectionId,
} from "@tabora/orchestrator"

export type PluginLike = { manifest: Pick<PluginManifest, "id" | "contributes"> }

export type SettingsPanelDescriptor = NavigatorSettingsPanelDescriptor

export type { SettingsSectionId }

export type SettingsHostProps = {
  open: boolean
  panels: SettingsPanelDescriptor[]
  surface: SettingsSurface
  /** Renders the mobile settings landing page instead of a section detail view. */
  showIndex?: boolean
  /** Keeps an explicit settings route visible when its section has no available panel. */
  preserveActiveSection?: boolean
  activeSectionId: SettingsSectionId | null
  onSectionChange: (sectionId: SettingsSectionId) => void
  onClose: () => void
  /** Returns from a mobile section detail page to the settings landing page. */
  onBack?: () => void
  getView: (viewId: string) => ((props: SettingsPanelViewProps) => JSX.Element) | undefined
  getSettingsProvider: (providerId: string) => SettingsPanelProvider | undefined
  providerContext?: (
    panel: SettingsPanelDescriptor,
    surface: SettingsSurface,
  ) => SettingsPanelProviderContext
  panelProps: (
    panel: SettingsPanelDescriptor,
    instanceId: string | undefined,
    surface: SettingsSurface,
  ) => SettingsPanelViewProps
  /** Instance-scoped panels are hidden unless the host explicitly supplies this target. */
  instanceId?: string
  aboutContent?: JSX.Element
  copy?: SettingsHostCopy
}

export type SettingsHostCopy = {
  sidebarTitle: string
  pluginGroupTitle: string
  pluginInstalledNav: string
  pluginsActiveTitle: string
  closeAriaLabel: string
  backAriaLabel?: string
  searchPlaceholder?: string
  aboutUnavailable: string
  emptySection: string
  panelMissing: (panelId: string) => string
  sectionTitle: (sectionId: SettingsSectionId) => string
  sectionDescription?: (sectionId: SettingsSectionId) => string
  sectionMeta?: (sectionId: SettingsSectionId) => string
  workspaceGroupTitle?: string
  extensionGroupTitle?: string
  accountNavName?: string
  accountNavMeta?: string
  accountNavAvatar?: string
  windowSubtitle?: string
  statusReady?: string
  statusSectionChanged?: (sectionTitle: string) => string
  cancelLabel?: string
}
