import type { LayoutContribution, PluginManifest, SearchContribution } from "@tabora/plugin-api"

type PluginLike = {
  manifest: Pick<PluginManifest, "id" | "contributes">
}

export type WorkbenchRailAction = {
  id: "home" | "add-widget" | "plugins" | "settings"
  ariaLabel: string
  label: string
  isActive?: boolean
  targetId?: string
  settingsPanelId?: string
}

export const WORKBENCH_RAIL_ACTIONS: WorkbenchRailAction[] = [
  {
    id: "home",
    ariaLabel: "主页",
    label: "主页",
    isActive: true,
  },
  {
    id: "add-widget",
    ariaLabel: "添加卡片",
    label: "添加",
    targetId: "add-widgets",
  },
  {
    id: "plugins",
    ariaLabel: "插件",
    label: "插件",
    settingsPanelId: "official.settings.plugins",
  },
  {
    id: "settings",
    ariaLabel: "设置",
    label: "设置",
    settingsPanelId: "official.settings.workspace.appearance",
  },
]

export function findLayoutContribution(
  plugins: PluginLike[],
  layoutId: string,
): LayoutContribution | undefined {
  for (const plugin of plugins) {
    const layout = plugin.manifest.contributes.layouts?.find((item) => item.id === layoutId)
    if (layout) return layout
  }
}

export function findSearchContribution(
  plugins: PluginLike[],
  pluginId: string,
  contributionId: string,
): SearchContribution | undefined {
  const plugin = plugins.find((p) => p.manifest.id === pluginId)
  return plugin?.manifest.contributes.searches?.find((search) => search.id === contributionId)
}
