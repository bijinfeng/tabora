import type {
  PluginInstance,
  SearchProviderContribution,
  SearchWidgetEntry,
  WidgetContribution,
  WidgetSize,
  WorkbenchSearchSettings,
} from "@tabora/plugin-api"
import type { CommandActionMap } from "@tabora/orchestrator"

export type WidgetContributionResolver = (
  pluginId: string,
  contributionId: string,
) => Pick<WidgetContribution, "title" | "icon"> | undefined

export type WidgetRenderModel = {
  title: string
  icon?: string
  currentSize: WidgetSize
  supportedSizes: WidgetSize[]
}

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

export type CommandExecutor = (commandId: string, context: CommandExecutionContext) => boolean

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

export function resolveWidgetRenderModel(
  instance: Pick<PluginInstance, "size">,
  widget: Pick<WidgetContribution, "title" | "icon" | "supportedSizes"> | undefined,
): WidgetRenderModel | null {
  if (!widget || !instance.size || !widget.supportedSizes.includes(instance.size)) return null

  return {
    title: widget.title,
    ...(widget.icon ? { icon: widget.icon } : {}),
    currentSize: instance.size,
    supportedSizes: widget.supportedSizes,
  }
}

export function buildSearchableWidgetEntries(
  options: BuildSearchableWidgetEntriesOptions,
): SearchWidgetEntry[] {
  return options.instances
    .filter((instance) => instance.extensionPoint === "widget")
    .flatMap((instance) => {
      const widget = options.resolveWidgetContribution(instance.pluginId, instance.contributionId)
      if (!widget) return []
      return [
        {
          instanceId: instance.id,
          icon: resolveWidgetIconLabel(widget.icon),
          name: widget.title,
          desc: `定位到 ${widget.title} 卡片`,
          action: options.buildFocusAction(instance.id),
        },
      ]
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
      return true
    }

    if (pluginCommandIds.has(commandId) && options.runPluginCommand) {
      options.runPluginCommand(commandId, context)
      return true
    }

    return false
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
