import type {
  BackgroundProviderContribution,
  BackgroundRendererContribution,
  CommandContribution,
  ContributionRef,
  KeybindingContribution,
  PluginManifest,
  PluginRecord,
  SettingsPanelData,
  SearchContribution,
  SearchProviderContribution,
  SettingsPanelContribution,
  SettingsHostActionId,
  SettingsHostReadId,
  ThemeContribution,
  WidgetContribution,
  WorkspacePresetContribution,
} from "@tabora/plugin-api"
import {
  normalizeSettingsPanelDescriptor,
  type SettingsPanelDescriptor as NavigatorSettingsPanelDescriptor,
} from "./settings-navigator"

export type PluginCatalog = ReturnType<typeof createPluginCatalog>

export type PluginCatalogOptions = {
  fallbackWidgetIcon?: string
  fallbackWidgetDescription?: (widget: WidgetContribution) => string
  builtinThemes?: { pluginId: string; themes: ThemeContribution[] }
  builtinSearchProviders?: { pluginId: string; providers: SearchProviderContribution[] }
  builtinBackgroundProviders?: { pluginId: string; providers: BackgroundProviderContribution[] }
}

export type WidgetContributionDescriptor = WidgetContribution & {
  ref?: ContributionRef
  pluginId: string
  pluginName: string
  pluginVersion: string
  pluginPublisher?: string
  description: string
}

export type SearchProviderContributionDescriptor = SearchProviderContribution & {
  ref: ContributionRef & { kind: "search-provider" }
  pluginId: string
  pluginName: string
}

export type SettingsPanelDescriptor = NavigatorSettingsPanelDescriptor

type ContributionDescriptor<T, K extends ContributionRef["kind"]> = T & {
  ref: ContributionRef & { kind: K }
}

export type SearchContributionDescriptor = ContributionDescriptor<SearchContribution, "search">
export type ThemeContributionDescriptor = ContributionDescriptor<ThemeContribution, "theme">
export type BackgroundProviderContributionDescriptor = ContributionDescriptor<
  BackgroundProviderContribution,
  "background-provider"
>
export type BackgroundRendererContributionDescriptor = ContributionDescriptor<
  BackgroundRendererContribution,
  "background-renderer"
>
export type SettingsPanelContributionDescriptor = ContributionDescriptor<
  SettingsPanelContribution,
  "settings-panel"
>
export type CommandContributionDescriptor = ContributionDescriptor<CommandContribution, "command">
export type KeybindingContributionDescriptor = ContributionDescriptor<
  KeybindingContribution,
  "keybinding"
>
export type WorkspacePresetContributionDescriptor = ContributionDescriptor<
  WorkspacePresetContribution,
  "workspace-preset"
>

function byContributionOrder<T extends { title: string }>(left: T, right: T): number {
  return left.title.localeCompare(right.title)
}

type CatalogPlugin = {
  manifest: PluginManifest
  enabled: boolean
  installation?: {
    grantedSettingsHostActions?: SettingsHostActionId[]
    grantedSettingsHostReads?: SettingsHostReadId[]
  }
}

export function createPluginCatalog(plugins: CatalogPlugin[], options: PluginCatalogOptions = {}) {
  const fallbackWidgetIcon = options.fallbackWidgetIcon ?? "panel"
  const fallbackWidgetDescription =
    options.fallbackWidgetDescription ??
    ((widget: WidgetContribution) => `添加 ${widget.title} 卡片`)
  const activePlugins = () => plugins.filter((plugin) => plugin.enabled)

  function pluginIds(): string[] {
    return plugins.map((plugin) => plugin.manifest.id)
  }

  function listThemes(): ThemeContributionDescriptor[] {
    const builtin = (options.builtinThemes?.themes ?? []).map((theme) => ({
      ...theme,
      ref: {
        pluginId: options.builtinThemes!.pluginId,
        kind: "theme" as const,
        id: theme.id,
      },
    }))
    const contributed = activePlugins().flatMap((plugin) =>
      (plugin.manifest.contributes.themes ?? []).map((theme) => ({
        ...theme,
        ref: { pluginId: plugin.manifest.id, kind: "theme" as const, id: theme.id },
      })),
    )
    return [...builtin, ...contributed]
  }

  function listSearchProviders(): SearchProviderContributionDescriptor[] {
    const builtin = (options.builtinSearchProviders?.providers ?? []).map((provider) => ({
      ...provider,
      ref: {
        pluginId: options.builtinSearchProviders!.pluginId,
        kind: "search-provider" as const,
        id: provider.id,
      },
      pluginId: options.builtinSearchProviders!.pluginId,
      pluginName: "Builtin Search Providers",
    }))
    const contributed = activePlugins().flatMap((plugin) =>
      (plugin.manifest.contributes.searchProviders ?? []).map((provider) => ({
        ...provider,
        ref: {
          pluginId: plugin.manifest.id,
          kind: "search-provider" as const,
          id: provider.id,
        },
        pluginId: plugin.manifest.id,
        pluginName: plugin.manifest.name,
      })),
    )
    return [...builtin, ...contributed]
  }

  function listBackgroundProviders(): BackgroundProviderContributionDescriptor[] {
    const builtin = (options.builtinBackgroundProviders?.providers ?? []).map((provider) => ({
      ...provider,
      ref: {
        pluginId: options.builtinBackgroundProviders!.pluginId,
        kind: "background-provider" as const,
        id: provider.id,
      },
    }))
    const contributed = activePlugins().flatMap((plugin) =>
      (plugin.manifest.contributes.backgroundProviders ?? []).map((provider) => ({
        ...provider,
        ref: {
          pluginId: plugin.manifest.id,
          kind: "background-provider" as const,
          id: provider.id,
        },
      })),
    )
    return [...builtin, ...contributed]
  }

  function listBackgroundRenderers(): BackgroundRendererContributionDescriptor[] {
    return activePlugins().flatMap((plugin) =>
      (plugin.manifest.contributes.backgroundRenderers ?? []).map((renderer) => ({
        ...renderer,
        ref: {
          pluginId: plugin.manifest.id,
          kind: "background-renderer" as const,
          id: renderer.id,
        },
      })),
    )
  }

  function listWidgetContributions(): WidgetContributionDescriptor[] {
    return activePlugins()
      .flatMap((plugin) =>
        (plugin.manifest.contributes.widgets ?? []).map((widget) => ({
          ...widget,
          ref: { pluginId: plugin.manifest.id, kind: "widget" as const, id: widget.id },
          pluginId: plugin.manifest.id,
          pluginName: plugin.manifest.name,
          pluginVersion: plugin.manifest.version,
          ...(plugin.manifest.publisher ? { pluginPublisher: plugin.manifest.publisher } : {}),
          icon: widget.icon ?? fallbackWidgetIcon,
          description: widget.description ?? fallbackWidgetDescription(widget),
        })),
      )
      .sort(byContributionOrder)
  }

  function listSettingsPanels(): SettingsPanelDescriptor[] {
    return activePlugins()
      .flatMap((plugin) =>
        (plugin.manifest.contributes.settingsPanels ?? []).map((panel) => ({
          ...normalizeSettingsPanelDescriptor({ ...panel, pluginId: plugin.manifest.id }),
          ref: { pluginId: plugin.manifest.id, kind: "settings-panel", id: panel.id },
          grantedHostActions: (panel.hostActions ?? []).filter((action) =>
            plugin.installation?.grantedSettingsHostActions?.includes(action),
          ),
          grantedHostReads: (panel.hostReads ?? []).filter((read) =>
            plugin.installation?.grantedSettingsHostReads?.includes(read),
          ),
        })),
      )
      .sort(
        (left, right) =>
          (left.order ?? 10_000) - (right.order ?? 10_000) || left.title.localeCompare(right.title),
      )
  }

  function resolveContribution(ref: ContributionRef): unknown {
    if (ref.kind === "theme") {
      return listThemes().find((item) => item.ref?.pluginId === ref.pluginId && item.id === ref.id)
    }
    if (ref.kind === "search-provider") {
      return listSearchProviders().find(
        (item) => item.ref?.pluginId === ref.pluginId && item.id === ref.id,
      )
    }
    if (ref.kind === "background-provider") {
      return listBackgroundProviders().find(
        (item) => item.ref?.pluginId === ref.pluginId && item.id === ref.id,
      )
    }
    const plugin = activePlugins().find((item) => item.manifest.id === ref.pluginId)
    if (!plugin) return undefined
    switch (ref.kind) {
      case "widget":
        return listWidgetContributions().find(
          (item) => item.ref?.pluginId === ref.pluginId && item.id === ref.id,
        )
      case "search":
        return plugin.manifest.contributes.searches
          ?.map((item) => ({ ...item, ref }))
          .find((item) => item.id === ref.id)
      case "settings-panel":
        return plugin.manifest.contributes.settingsPanels
          ?.map((item) => ({ ...item, ref }))
          .find((item) => item.id === ref.id)
      case "background-renderer":
        return plugin.manifest.contributes.backgroundRenderers
          ?.map((item) => ({ ...item, ref }))
          .find((item) => item.id === ref.id)
      case "command":
        return plugin.manifest.contributes.commands
          ?.map((item) => ({ ...item, ref }))
          .find((item) => item.id === ref.id)
      case "keybinding":
        return plugin.manifest.contributes.keybindings
          ?.map((item) => ({ ...item, ref }))
          .find((item) => item.id === ref.id)
      case "workspace-preset":
        return plugin.manifest.contributes.workspacePresets
          ?.map((item) => ({ ...item, ref }))
          .find((item) => item.id === ref.id)
      default:
        return undefined
    }
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
    const plugin = activePlugins().find((candidate) => candidate.manifest.id === pluginId)
    return plugin?.manifest.contributes.searches?.find((search) => search.id === contributionId)
  }

  function pluginSummaries(
    records: Array<
      Pick<PluginRecord, "id"> &
        Partial<Pick<PluginRecord, "enabled" | "status" | "lastError" | "disabledReason">>
    > = [],
  ): NonNullable<SettingsPanelData["plugins"]> {
    const recordsById = new Map(records.map((record) => [record.id, record]))
    return plugins.map((plugin) => {
      const record = recordsById.get(plugin.manifest.id)
      return {
        id: plugin.manifest.id,
        name: plugin.manifest.name,
        version: plugin.manifest.version,
        enabled: record?.enabled ?? plugin.enabled,
        ...(record?.status ? { status: record.status } : {}),
        ...(record?.lastError ? { lastError: record.lastError } : {}),
        ...(record?.disabledReason ? { disabledReason: record.disabledReason } : {}),
        permissions: plugin.manifest.permissions ?? [],
        contributionKinds: (
          Object.entries(plugin.manifest.contributes) as Array<
            [keyof PluginManifest["contributes"], unknown]
          >
        )
          .filter(([, contributions]) => Array.isArray(contributions) && contributions.length > 0)
          .map(([kind]) => {
            const contributionKinds = {
              widgets: "widget",
              searches: "search",
              searchProviders: "search-provider",
              backgroundProviders: "background-provider",
              backgroundRenderers: "background-renderer",
              themes: "theme",
              settingsPanels: "settings-panel",
              commands: "command",
              keybindings: "keybinding",
              workspacePresets: "workspace-preset",
            } as const
            return contributionKinds[kind]
          }),
        ...(plugin.manifest.requiredCapabilities
          ? { requiredCapabilities: plugin.manifest.requiredCapabilities }
          : {}),
        ...(plugin.manifest.supportedPlatforms
          ? { supportedPlatforms: plugin.manifest.supportedPlatforms }
          : {}),
      }
    })
  }

  return {
    plugins,
    pluginIds,
    listThemes,
    listSearchProviders,
    listBackgroundProviders,
    listBackgroundRenderers,
    listWidgetContributions,
    listSettingsPanels,
    findWidgetContribution,
    findSearchContribution,
    resolveContribution,
    pluginSummaries,
  }
}
