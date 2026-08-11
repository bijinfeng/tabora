import type {
  SettingsPanelContribution,
  SettingsHostActionId,
  SettingsHostReadId,
  SettingsPanelScope,
  SettingsSectionId,
  SettingsSurface,
} from "@tabora/plugin-api"

export type { SettingsPanelScope, SettingsSectionId, SettingsSurface }

export type SettingsPanelDescriptor = SettingsPanelContribution & {
  pluginId: string
  /** Host-approved subset of this panel's requested hostActions. */
  grantedHostActions?: SettingsHostActionId[]
  /** Host-approved subset of this panel's requested host reads. */
  grantedHostReads?: SettingsHostReadId[]
}

type SettingsPanelInput = SettingsPanelContribution & {
  pluginId: string
}

export function filterSettingsPanelsBySurface(
  panels: SettingsPanelInput[],
  surface: SettingsSurface,
): SettingsPanelDescriptor[] {
  return panels
    .filter((panel) => panel.surfaces.includes(surface))
    .map(normalizeSettingsPanelDescriptor)
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
  { id: "account", title: "账号" },
  { id: "ai", title: "AI" },
  { id: "sync", title: "数据同步" },
  { id: "plugins", title: "插件" },
  { id: "about", title: "关于" },
]

export function resolveInitialSettingsPanelId(
  panels: SettingsPanelInput[],
  requested?: string | null,
  surface: SettingsSurface = "desktop",
): string | null {
  const visiblePanels = filterSettingsPanelsBySurface(panels, surface)
  if (requested && visiblePanels.some((panel) => panel.id === requested)) return requested
  return visiblePanels[0]?.id ?? null
}

export function resolveSettingsSectionId(section: SettingsSectionId): SettingsSectionId {
  return section
}

export function normalizeSettingsPanelDescriptor(
  panel: SettingsPanelInput,
): SettingsPanelDescriptor {
  return panel
}

export function createSettingsNavigator(
  panels: SettingsPanelInput[],
  surface: SettingsSurface = "desktop",
) {
  const normalizedPanels = filterSettingsPanelsBySurface(panels, surface)
  const sections = SETTINGS_SECTIONS.reduce(
    (result, section) => {
      result[section.id] = { ...section, panels: [] }
      return result
    },
    {} as Record<SettingsSectionId, SettingsNavigatorSection>,
  )

  for (const panel of normalizedPanels) {
    sections[resolveSettingsSectionId(panel.section)].panels.push(panel)
  }

  function initialSectionId(requested?: string | null): SettingsSectionId {
    if (!requested) return "general"
    const panelId = resolveInitialSettingsPanelId(normalizedPanels, requested, surface)
    const panel = normalizedPanels.find((candidate) => candidate.id === panelId)
    if (panel) return resolveSettingsSectionId(panel.section)
    return (
      SETTINGS_SECTIONS.find((section) => sections[section.id].panels.length > 0)?.id ?? "general"
    )
  }

  return { sections, initialSectionId }
}
