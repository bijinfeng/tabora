import type {
  PluginInstance,
  SearchProviderContribution,
  SearchWidgetEntry,
  WidgetContribution,
  WorkbenchSearchSettings,
} from "@tabora/plugin-api"
import type { CommandActionMap } from "@tabora/orchestrator"

export type WidgetContributionResolver = (
  pluginId: string,
  contributionId: string,
) => Pick<WidgetContribution, "title" | "icon"> | undefined

export type BuildSearchableWidgetEntriesOptions = {
  instances: PluginInstance[]
  resolveWidgetContribution: WidgetContributionResolver
  buildFocusAction: (instanceId: string) => () => void
}

export type CommandExecutionContext = {
  instance?: PluginInstance
}

export type CreateCommandExecutorOptions = {
  actions: CommandActionMap
  pluginCommandIds?: string[] | Set<string>
  runPluginCommand?: (commandId: string, context: CommandExecutionContext) => void
}

export type CommandExecutor = (commandId: string, context: CommandExecutionContext) => void

export function resolveWidgetTitle(
  instance: Pick<PluginInstance, "pluginId" | "contributionId">,
  resolveWidgetContribution: WidgetContributionResolver,
): string {
  return (
    resolveWidgetContribution(instance.pluginId, instance.contributionId)?.title ??
    instance.contributionId
  )
}

export function resolveWidgetIconLabel(icon?: string): string {
  switch (icon) {
    case "target":
      return "◎"
    case "link":
      return "↗"
    case "pencil":
      return "✎"
    case "check-square":
      return "✓"
    case "sun":
      return "☼"
    default:
      return "▦"
  }
}

export function buildSearchableWidgetEntries(
  options: BuildSearchableWidgetEntriesOptions,
): SearchWidgetEntry[] {
  return options.instances
    .filter((instance) => instance.extensionPoint === "widget")
    .map((instance) => {
      const widget = options.resolveWidgetContribution(instance.pluginId, instance.contributionId)
      const title = widget?.title ?? instance.contributionId
      return {
        instanceId: instance.id,
        icon: resolveWidgetIconLabel(widget?.icon),
        name: title,
        desc: `定位到 ${title} 卡片`,
        action: options.buildFocusAction(instance.id),
      }
    })
}

export function createCommandExecutor(options: CreateCommandExecutorOptions): CommandExecutor {
  const pluginCommandIds =
    options.pluginCommandIds instanceof Set
      ? options.pluginCommandIds
      : new Set(options.pluginCommandIds ?? [])

  return (commandId, context) => {
    const action = options.actions[commandId]
    if (action) {
      action()
      return
    }

    if (pluginCommandIds.has(commandId)) {
      options.runPluginCommand?.(commandId, context)
    }
  }
}

export function resolveEnabledProviderIds(
  settings: WorkbenchSearchSettings,
  providers: SearchProviderContribution[],
): string[] {
  if (settings.enabledProviderIds) return settings.enabledProviderIds
  return providers.map((provider) => provider.id)
}

export function resolveEnabledSearchProviders(
  settings: WorkbenchSearchSettings,
  providers: SearchProviderContribution[],
): SearchProviderContribution[] {
  const ids = new Set(resolveEnabledProviderIds(settings, providers))
  return providers.filter((provider) => ids.has(provider.id))
}

export function resolveDefaultProviderForSearch(
  settings: WorkbenchSearchSettings,
  providers: SearchProviderContribution[],
): string {
  if (settings.defaultProviderId) return settings.defaultProviderId
  const enabled = resolveEnabledSearchProviders(settings, providers)
  if (enabled[0]) return enabled[0].id
  return ""
}
