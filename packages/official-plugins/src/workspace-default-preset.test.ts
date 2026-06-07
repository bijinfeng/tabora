import { describe, expect, it } from "vitest"
import type {
  BackgroundProviderContribution,
  ExtensionPoint,
  LayoutContribution,
  PluginManifest,
  SearchProviderContribution,
  SettingsPanelContribution,
  ThemeContribution,
  WidgetContribution,
  SearchContribution,
} from "@tabora/plugin-api"

import { officialDefaultWorkspacePreset, officialPlugins } from "./index"

type ContributionMap = NonNullable<PluginManifest["contributes"]>

function listBuiltinContributions<K extends keyof ContributionMap>(key: K) {
  return officialPlugins.flatMap((plugin) =>
    (plugin.manifest.contributes[key] ?? []).map((contribution) => ({
      pluginId: plugin.manifest.id,
      contribution,
    })),
  )
}

function resolveContributionKey(extensionPoint: ExtensionPoint) {
  switch (extensionPoint) {
    case "layout":
      return "layouts"
    case "widget":
      return "widgets"
    case "search":
      return "searches"
    case "search-provider":
      return "searchProviders"
    case "background-provider":
      return "backgroundProviders"
    case "background-renderer":
      return "backgroundRenderers"
    case "theme":
      return "themes"
    case "settings-panel":
      return "settingsPanels"
  }
}

describe("officialDefaultWorkspacePreset", () => {
  const builtinPluginIds = new Set(officialPlugins.map((plugin) => plugin.manifest.id))

  it("references only builtin plugin manifest ids in preset.plugins", () => {
    expect(
      officialDefaultWorkspacePreset.plugins.filter((pluginId) => !builtinPluginIds.has(pluginId)),
    ).toEqual([])
  })

  it("references current builtin layout, theme, background, and search provider ids", () => {
    const presetPluginIds = new Set(officialDefaultWorkspacePreset.plugins)
    const layouts = listBuiltinContributions("layouts") as Array<{
      pluginId: string
      contribution: LayoutContribution
    }>
    const themes = listBuiltinContributions("themes") as Array<{
      pluginId: string
      contribution: ThemeContribution
    }>
    const backgrounds = listBuiltinContributions("backgroundProviders") as Array<{
      pluginId: string
      contribution: BackgroundProviderContribution
    }>
    const searchProviders = listBuiltinContributions("searchProviders") as Array<{
      pluginId: string
      contribution: SearchProviderContribution
    }>

    const layout = layouts.find(
      ({ contribution }) => contribution.id === officialDefaultWorkspacePreset.layoutId,
    )
    const theme = themes.find(
      ({ contribution }) => contribution.id === officialDefaultWorkspacePreset.themeId,
    )
    const background = backgrounds.find(
      ({ contribution }) => contribution.id === officialDefaultWorkspacePreset.backgroundProviderId,
    )
    const defaultSearchProvider = searchProviders.find(
      ({ contribution }) =>
        contribution.id === officialDefaultWorkspacePreset.search.defaultProviderId,
    )
    const enabledSearchProviders = officialDefaultWorkspacePreset.search.enabledProviderIds.map(
      (providerId) => searchProviders.find(({ contribution }) => contribution.id === providerId),
    )

    expect(layout?.contribution.id).toBe(officialDefaultWorkspacePreset.layoutId)
    expect(theme?.contribution.id).toBe(officialDefaultWorkspacePreset.themeId)
    expect(background?.contribution.id).toBe(officialDefaultWorkspacePreset.backgroundProviderId)
    expect(defaultSearchProvider?.contribution.id).toBe(
      officialDefaultWorkspacePreset.search.defaultProviderId,
    )
    expect(enabledSearchProviders.every(Boolean)).toBe(true)
    expect(presetPluginIds.has(layout?.pluginId ?? "")).toBe(true)
    expect(presetPluginIds.has(theme?.pluginId ?? "")).toBe(true)
    expect(presetPluginIds.has(background?.pluginId ?? "")).toBe(true)
    expect(presetPluginIds.has(defaultSearchProvider?.pluginId ?? "")).toBe(true)
  })

  it("includes every preset instance plugin in preset.plugins", () => {
    const presetPluginIds = new Set(officialDefaultWorkspacePreset.plugins)

    expect(
      officialDefaultWorkspacePreset.instances
        .map((instance) => instance.pluginId)
        .filter((pluginId) => !presetPluginIds.has(pluginId)),
    ).toEqual([])
  })

  it("references existing contributions for every preset instance", () => {
    const contributionIdsByPoint: Record<ExtensionPoint, Set<string>> = {
      layout: new Set(
        (listBuiltinContributions("layouts") as Array<{ contribution: LayoutContribution }>).map(
          ({ contribution }) => contribution.id,
        ),
      ),
      widget: new Set(
        (listBuiltinContributions("widgets") as Array<{ contribution: WidgetContribution }>).map(
          ({ contribution }) => contribution.id,
        ),
      ),
      search: new Set(
        (listBuiltinContributions("searches") as Array<{ contribution: SearchContribution }>).map(
          ({ contribution }) => contribution.id,
        ),
      ),
      "search-provider": new Set(
        (
          listBuiltinContributions("searchProviders") as Array<{
            contribution: SearchProviderContribution
          }>
        ).map(({ contribution }) => contribution.id),
      ),
      "background-provider": new Set(
        (
          listBuiltinContributions("backgroundProviders") as Array<{
            contribution: BackgroundProviderContribution
          }>
        ).map(({ contribution }) => contribution.id),
      ),
      "background-renderer": new Set(),
      theme: new Set(
        (listBuiltinContributions("themes") as Array<{ contribution: ThemeContribution }>).map(
          ({ contribution }) => contribution.id,
        ),
      ),
      "settings-panel": new Set(
        (
          listBuiltinContributions("settingsPanels") as Array<{
            contribution: SettingsPanelContribution
          }>
        ).map(({ contribution }) => contribution.id),
      ),
    }

    const pluginContributions = new Map(
      officialPlugins.map((plugin) => [plugin.manifest.id, plugin.manifest.contributes]),
    )

    expect(
      officialDefaultWorkspacePreset.instances.flatMap((instance) => {
        const pluginContributes = pluginContributions.get(instance.pluginId)
        const key = resolveContributionKey(instance.extensionPoint)
        const contributionIds = contributionIdsByPoint[instance.extensionPoint]
        const belongsToPlugin = (pluginContributes?.[key] ?? []).some(
          (contribution) => contribution.id === instance.contributionId,
        )

        if (!contributionIds.has(instance.contributionId) || !belongsToPlugin) {
          return [`${instance.pluginId}:${instance.extensionPoint}:${instance.contributionId}`]
        }

        return []
      }),
    ).toEqual([])
  })
})
