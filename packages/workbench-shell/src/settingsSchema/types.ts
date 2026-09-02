import type {
  SettingsPanelNavigation,
  SettingsPanelProvider,
  SettingsPanelProviderContext,
} from "@tabora/plugin-api"

export type SettingsSchemaRendererProps = {
  provider: SettingsPanelProvider
  context: SettingsPanelProviderContext
  onNavigationChange?: (navigation: SettingsPanelNavigation | null) => void
}
