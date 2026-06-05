import type { SettingsPanelContribution } from "@tabora/plugin-api"

export type SettingsSectionId = "general" | "appearance" | "search" | "plugins" | "about"
export type SettingsPanelScope = "global" | "workspace" | "plugin" | "instance"

export type SettingsPanelDescriptor = SettingsPanelContribution & {
  pluginId: string
  scope: SettingsPanelScope
}

type SettingsPanelInput = SettingsPanelContribution & {
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
  panels: SettingsPanelInput[],
  requested?: string | null,
): string | null {
  if (requested && panels.some((panel) => panel.id === requested)) return requested
  return panels[0]?.id ?? null
}

export function resolveSettingsSectionId(
  panelId?: string | null,
  section?: SettingsSectionId | null,
): SettingsSectionId {
  if (section) return section
  if (!panelId) return "general"
  if (panelId === "official.settings.plugins") return "plugins"
  if (panelId.includes(".appearance")) return "appearance"
  if (panelId.includes(".search")) return "search"
  if (panelId.includes(".workbench")) return "general"
  return "about"
}

export function normalizeSettingsPanelDescriptor(
  panel: SettingsPanelInput,
): SettingsPanelDescriptor {
  return {
    ...panel,
    scope: panel.scope ?? "workspace",
  }
}

export function createSettingsNavigator(panels: SettingsPanelInput[]) {
  const normalizedPanels = panels.map(normalizeSettingsPanelDescriptor)
  const sections = SETTINGS_SECTIONS.reduce(
    (result, section) => {
      result[section.id] = { ...section, panels: [] }
      return result
    },
    {} as Record<SettingsSectionId, SettingsNavigatorSection>,
  )

  for (const panel of normalizedPanels) {
    sections[resolveSettingsSectionId(panel.id, panel.section)].panels.push(panel)
  }

  function initialSectionId(requested?: string | null): SettingsSectionId {
    const panelId = resolveInitialSettingsPanelId(normalizedPanels, requested)
    const panel = normalizedPanels.find((candidate) => candidate.id === panelId)
    return resolveSettingsSectionId(panelId, panel?.section)
  }

  return { sections, initialSectionId }
}
