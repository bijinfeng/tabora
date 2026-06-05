import type { SettingsPanelContribution } from "@tabora/plugin-api"

export type SettingsSectionId = "general" | "appearance" | "search" | "plugins" | "about"

export type SettingsPanelDescriptor = SettingsPanelContribution & {
  pluginId: string
}

export type SettingsNavigatorSection = {
  id: SettingsSectionId
  title: string
  panels: SettingsPanelDescriptor[]
}

export const SETTINGS_SECTIONS: Array<{ id: SettingsSectionId; title: string }> = [
  { id: "general", title: "通用" },
  { id: "appearance", title: "外观" },
  { id: "search", title: "搜索" },
  { id: "plugins", title: "插件" },
  { id: "about", title: "关于" },
]

export function resolveInitialSettingsPanelId(
  panels: SettingsPanelDescriptor[],
  requested?: string | null,
): string | null {
  if (requested && panels.some((panel) => panel.id === requested)) return requested
  return panels[0]?.id ?? null
}

export function resolveSettingsSectionId(panelId?: string | null): SettingsSectionId {
  if (!panelId) return "general"
  if (panelId === "official.settings.plugins") return "plugins"
  if (panelId.includes(".appearance")) return "appearance"
  if (panelId.includes(".search")) return "search"
  if (panelId.includes(".workbench")) return "general"
  return "about"
}

export function createSettingsNavigator(panels: SettingsPanelDescriptor[]) {
  const sections = SETTINGS_SECTIONS.reduce(
    (result, section) => {
      result[section.id] = { ...section, panels: [] }
      return result
    },
    {} as Record<SettingsSectionId, SettingsNavigatorSection>,
  )

  for (const panel of panels) {
    sections[resolveSettingsSectionId(panel.id)].panels.push(panel)
  }

  function initialSectionId(requested?: string | null): SettingsSectionId {
    return resolveSettingsSectionId(resolveInitialSettingsPanelId(panels, requested))
  }

  return { sections, initialSectionId }
}
