import type { SettingsSurface } from "@tabora/plugin-api"
import { createSettingsNavigator, normalizeSettingsPanelDescriptor } from "@tabora/orchestrator"
import type { SettingsSectionId } from "@tabora/orchestrator"
import type { PluginLike, SettingsPanelDescriptor } from "./types"

export function collectSettingsPanels(plugins: PluginLike[]): SettingsPanelDescriptor[] {
  const panels: SettingsPanelDescriptor[] = []
  for (const plugin of plugins) {
    for (const panel of plugin.manifest.contributes.settingsPanels ?? []) {
      panels.push(normalizeSettingsPanelDescriptor({ ...panel, pluginId: plugin.manifest.id }))
    }
  }
  return panels.sort(
    (l, r) => (l.order ?? 10_000) - (r.order ?? 10_000) || l.title.localeCompare(r.title),
  )
}

export function resolveInitialSettingsSectionId(
  panels: SettingsPanelDescriptor[],
  requested?: string | null,
  surface: SettingsSurface = "desktop",
): SettingsSectionId {
  return createSettingsNavigator(panels, surface).initialSectionId(requested)
}
