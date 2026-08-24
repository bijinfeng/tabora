import type {
  BackgroundProviderContribution,
  ExtensionPoint,
  LayoutContribution,
  PluginManifest,
  SearchContribution,
  SearchProviderContribution,
  SettingsPanelContribution,
  ThemeContribution,
  WidgetContribution,
} from "@tabora/plugin-api/sdk"
import { BUILTIN_THEME_PLUGIN_ID, builtinThemes } from "@tabora/theme"
import {
  BUILTIN_BACKGROUND_PROVIDER_PLUGIN_ID,
  builtinBackgroundProviders,
} from "./builtinBackgroundProviders"
import { BUILTIN_SEARCH_PROVIDER_PLUGIN_ID, builtinSearchProviders } from "./builtinSearchProviders"
import { describe, expect, it } from "vitest"

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

    // Dashboard is now built into the host, not a plugin contribution
    const isDashboardBuiltin =
      officialDefaultWorkspacePreset.layout.id === "official.layout.workbench-dashboard"

    const layout = isDashboardBuiltin
      ? { contribution: { id: officialDefaultWorkspacePreset.layout.id } }
      : layouts.find(
          ({ contribution }) => contribution.id === officialDefaultWorkspacePreset.layout.id,
        )
    // Theme is now built into the host (@tabora/theme), not a plugin contribution
    const theme =
      officialDefaultWorkspacePreset.theme.pluginId === BUILTIN_THEME_PLUGIN_ID
        ? builtinThemes.find(
            (candidate) => candidate.id === officialDefaultWorkspacePreset.theme.id,
          )
        : themes.find(
            ({ contribution }) => contribution.id === officialDefaultWorkspacePreset.theme.id,
          )?.contribution
    // Background providers are now built into the host, not a plugin contribution
    const background =
      officialDefaultWorkspacePreset.backgroundProvider.pluginId ===
      BUILTIN_BACKGROUND_PROVIDER_PLUGIN_ID
        ? builtinBackgroundProviders.find(
            (candidate) => candidate.id === officialDefaultWorkspacePreset.backgroundProvider.id,
          )
        : backgrounds.find(
            ({ contribution }) =>
              contribution.id === officialDefaultWorkspacePreset.backgroundProvider.id,
          )?.contribution
    // Search providers are now built into the host, not a plugin contribution
    const defaultSearchProvider =
      officialDefaultWorkspacePreset.search.defaultProvider.pluginId ===
      BUILTIN_SEARCH_PROVIDER_PLUGIN_ID
        ? builtinSearchProviders.find(
            (candidate) =>
              candidate.id === officialDefaultWorkspacePreset.search.defaultProvider.id,
          )
        : searchProviders.find(
            ({ contribution }) =>
              contribution.id === officialDefaultWorkspacePreset.search.defaultProvider.id,
          )?.contribution
    const enabledSearchProviders = officialDefaultWorkspacePreset.search.enabledProviders.map(
      (provider) => {
        if (provider.pluginId === BUILTIN_SEARCH_PROVIDER_PLUGIN_ID) {
          return builtinSearchProviders.find((candidate) => candidate.id === provider.id)
        }
        return searchProviders.find(
          ({ pluginId, contribution }) =>
            pluginId === provider.pluginId && contribution.id === provider.id,
        )?.contribution
      },
    )

    expect(layout?.contribution.id).toBe(officialDefaultWorkspacePreset.layout.id)
    expect(theme?.id).toBe(officialDefaultWorkspacePreset.theme.id)
    expect(background?.id).toBe(officialDefaultWorkspacePreset.backgroundProvider.id)
    expect(defaultSearchProvider?.id).toBe(officialDefaultWorkspacePreset.search.defaultProvider.id)
    expect(enabledSearchProviders.every(Boolean)).toBe(true)
    // Dashboard, theme, search providers, and background providers are now built-in, not plugins
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
        (
          listBuiltinContributions("layouts") as Array<{
            contribution: LayoutContribution
          }>
        ).map(({ contribution }) => contribution.id),
      ),
      widget: new Set(
        (
          listBuiltinContributions("widgets") as Array<{
            contribution: WidgetContribution
          }>
        ).map(({ contribution }) => contribution.id),
      ),
      search: new Set(
        (
          listBuiltinContributions("searches") as Array<{
            contribution: SearchContribution
          }>
        ).map(({ contribution }) => contribution.id),
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
        (
          listBuiltinContributions("themes") as Array<{
            contribution: ThemeContribution
          }>
        ).map(({ contribution }) => contribution.id),
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
