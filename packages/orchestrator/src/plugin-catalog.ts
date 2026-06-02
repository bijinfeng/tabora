import type {
  BackgroundProviderContribution,
  LayoutContribution,
  SearchContribution,
  SearchProviderContribution,
  SettingsPanelContribution,
  SettingsPanelViewProps,
  ThemeContribution,
  WidgetContribution,
} from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export type PluginCatalog = ReturnType<typeof createPluginCatalog>

export type PluginCatalogOptions = {
  fallbackWidgetIcon?: string
  fallbackWidgetDescription?: (widget: WidgetContribution) => string
}

export type WidgetContributionDescriptor = WidgetContribution & {
  pluginId: string
  pluginName: string
  description: string
}

export type SettingsPanelDescriptor = SettingsPanelContribution & {
  pluginId: string
}

function byContributionOrder<T extends { title: string }>(left: T, right: T): number {
  return left.title.localeCompare(right.title)
}

export function createPluginCatalog(plugins: BuiltinPlugin[], options: PluginCatalogOptions = {}) {
  const fallbackWidgetIcon = options.fallbackWidgetIcon ?? "panel"
  const fallbackWidgetDescription =
    options.fallbackWidgetDescription ??
    ((widget: WidgetContribution) => `添加 ${widget.title} 卡片`)

  function pluginIds(): string[] {
    return plugins.map((plugin) => plugin.manifest.id)
  }

  function listThemes(): ThemeContribution[] {
    return plugins.flatMap((plugin) => plugin.manifest.contributes.themes ?? [])
  }

  function listSearchProviders(): SearchProviderContribution[] {
    return plugins.flatMap((plugin) => plugin.manifest.contributes.searchProviders ?? [])
  }

  function listBackgroundProviders(): BackgroundProviderContribution[] {
    return plugins.flatMap((plugin) => plugin.manifest.contributes.backgroundProviders ?? [])
  }

  function listLayouts(): LayoutContribution[] {
    return plugins.flatMap((plugin) => plugin.manifest.contributes.layouts ?? [])
  }

  function listWidgetContributions(): WidgetContributionDescriptor[] {
    return plugins
      .flatMap((plugin) =>
        (plugin.manifest.contributes.widgets ?? []).map((widget) => ({
          ...widget,
          pluginId: plugin.manifest.id,
          pluginName: plugin.manifest.name,
          icon: widget.icon ?? fallbackWidgetIcon,
          description: widget.description ?? fallbackWidgetDescription(widget),
        })),
      )
      .sort(byContributionOrder)
  }

  function listSettingsPanels(): SettingsPanelDescriptor[] {
    return plugins
      .flatMap((plugin) =>
        (plugin.manifest.contributes.settingsPanels ?? []).map((panel) => ({
          ...panel,
          pluginId: plugin.manifest.id,
        })),
      )
      .sort(
        (left, right) =>
          (left.order ?? 10_000) - (right.order ?? 10_000) || left.title.localeCompare(right.title),
      )
  }

  function findLayoutContribution(layoutId: string): LayoutContribution | undefined {
    return listLayouts().find((layout) => layout.id === layoutId)
  }

  function findWidgetContribution(
    pluginId: string,
    contributionId: string,
  ): WidgetContributionDescriptor | undefined {
    return listWidgetContributions().find(
      (widget) => widget.pluginId === pluginId && widget.id === contributionId,
    )
  }

  function findSearchContribution(
    pluginId: string,
    contributionId: string,
  ): SearchContribution | undefined {
    const plugin = plugins.find((candidate) => candidate.manifest.id === pluginId)
    return plugin?.manifest.contributes.searches?.find((search) => search.id === contributionId)
  }

  function pluginSummaries(): SettingsPanelViewProps["plugins"] {
    return plugins.map((plugin) => ({
      id: plugin.manifest.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      enabled: plugin.enabled,
      permissions: plugin.manifest.permissions ?? [],
      contributes: plugin.manifest.contributes,
    }))
  }

  return {
    plugins,
    pluginIds,
    listThemes,
    listSearchProviders,
    listBackgroundProviders,
    listLayouts,
    listWidgetContributions,
    listSettingsPanels,
    findLayoutContribution,
    findWidgetContribution,
    findSearchContribution,
    pluginSummaries,
  }
}
