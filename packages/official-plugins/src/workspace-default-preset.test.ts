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
} from "@tabora/plugin-api/sdk"

import { officialDefaultWorkspacePreset, officialPlugins } from "./index"

type ContributionMap = NonNullable<PluginManifest["contributes"]>

function listBuiltinContributions<K extends keyof ContributionMap>(key: K) {
  return officialPlugins.flatMap((plugin) =>
    (plugin.module.manifest.contributes[key] ?? []).map((contribution) => ({
      pluginId: plugin.module.manifest.id,
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
  const builtinPluginIds = new Set(officialPlugins.map((plugin) => plugin.module.manifest.id))

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
      ({ pluginId, contribution }) =>
        pluginId === officialDefaultWorkspacePreset.layout.pluginId &&
        contribution.id === officialDefaultWorkspacePreset.layout.id,
    )
    const theme = themes.find(
      ({ pluginId, contribution }) =>
        pluginId === officialDefaultWorkspacePreset.theme.pluginId &&
        contribution.id === officialDefaultWorkspacePreset.theme.id,
    )
    const background = backgrounds.find(
      ({ pluginId, contribution }) =>
        pluginId === officialDefaultWorkspacePreset.backgroundProvider.pluginId &&
        contribution.id === officialDefaultWorkspacePreset.backgroundProvider.id,
    )
    const defaultSearchProvider = searchProviders.find(
      ({ pluginId, contribution }) =>
        pluginId === officialDefaultWorkspacePreset.search.defaultProvider.pluginId &&
        contribution.id === officialDefaultWorkspacePreset.search.defaultProvider.id,
    )
    const enabledSearchProviders = officialDefaultWorkspacePreset.search.enabledProviders.map(
      (provider) =>
        searchProviders.find(
          ({ pluginId, contribution }) =>
            pluginId === provider.pluginId && contribution.id === provider.id,
        ),
    )

    expect(layout?.contribution.id).toBe(officialDefaultWorkspacePreset.layout.id)
    expect(theme?.contribution.id).toBe(officialDefaultWorkspacePreset.theme.id)
    expect(background?.contribution.id).toBe(officialDefaultWorkspacePreset.backgroundProvider.id)
    expect(defaultSearchProvider?.contribution.id).toBe(
      officialDefaultWorkspacePreset.search.defaultProvider.id,
    )
    expect(enabledSearchProviders.every(Boolean)).toBe(true)
    expect(presetPluginIds.has(layout?.pluginId ?? "")).toBe(true)
    expect(presetPluginIds.has(theme?.pluginId ?? "")).toBe(true)
    expect(presetPluginIds.has(background?.pluginId ?? "")).toBe(true)
    expect(presetPluginIds.has(defaultSearchProvider?.pluginId ?? "")).toBe(true)
  })

  it("enables the four search providers shown in the dashboard prototype", () => {
    expect(
      officialDefaultWorkspacePreset.search.enabledProviders.map((provider) => provider.id),
    ).toEqual([
      "official.search.google",
      "official.search.bing",
      "official.search.baidu",
      "official.search.duckduckgo",
      "official.search.github",
    ])
  })

  it("includes every preset instance plugin in preset.plugins", () => {
    const presetPluginIds = new Set(officialDefaultWorkspacePreset.plugins)

    expect(
      officialDefaultWorkspacePreset.instances
        .map((instance) => instance.contribution.pluginId)
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
      officialPlugins.map((plugin) => [
        plugin.module.manifest.id,
        plugin.module.manifest.contributes,
      ]),
    )

    expect(
      officialDefaultWorkspacePreset.instances.flatMap((instance) => {
        const pluginContributes = pluginContributions.get(instance.contribution.pluginId)
        const key = resolveContributionKey(instance.contribution.kind)
        const contributionIds = contributionIdsByPoint[instance.contribution.kind]
        const belongsToPlugin = (pluginContributes?.[key] ?? []).some(
          (contribution) => contribution.id === instance.contribution.id,
        )

        if (!contributionIds.has(instance.contribution.id) || !belongsToPlugin) {
          return [
            `${instance.contribution.pluginId}:${instance.contribution.kind}:${instance.contribution.id}`,
          ]
        }

        return []
      }),
    ).toEqual([])
  })
})
