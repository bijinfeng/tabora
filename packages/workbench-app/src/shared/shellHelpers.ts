import type {
  SearchProviderContributionRef,
  PluginInstance,
  SearchProviderContribution,
  SearchWidgetEntry,
  WidgetContribution,
  WidgetSize,
  WorkbenchSearchSettings,
} from "@tabora/plugin-api"
import { sameContributionRef } from "@tabora/plugin-api"
import type { CommandActionMap } from "@tabora/orchestrator"

export type WidgetContributionResolver = (
  pluginId: string,
  contributionId: string,
) => Pick<WidgetContribution, "title" | "icon"> | undefined

export type WidgetRenderModel = {
  title: string
  description?: string
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
  source?: "palette" | "shortcut" | "context-menu" | "programmatic"
}

export type CreateCommandExecutorOptions = {
  actions: CommandActionMap
  pluginCommandIds?: string[] | Set<string>
  runPluginCommand?: (commandId: string, context: CommandExecutionContext) => Promise<boolean>
}

export type CommandExecutor = (
  commandId: string,
  context: CommandExecutionContext,
) => Promise<boolean>

export function resolveWidgetIconLabel(icon?: string): string {
  switch (icon) {
    case "target":
      return "target"
    case "link":
      return "link"
    case "pencil":
      return "pencil"
    case "check-square":
      return "check-square"
    case "sun":
      return "sun"
    default:
      return "layout-dashboard"
  }
}

export function resolveWidgetRenderModel(
  instance: Pick<PluginInstance, "size">,
  widget: Pick<WidgetContribution, "title" | "description" | "icon" | "supportedSizes"> | undefined,
): WidgetRenderModel | null {
  if (!widget || !instance.size || !widget.supportedSizes.includes(instance.size)) return null

  return {
    title: widget.title,
    ...(widget.description ? { description: widget.description } : {}),
    ...(widget.icon ? { icon: widget.icon } : {}),
    currentSize: instance.size,
    supportedSizes: widget.supportedSizes,
  }
}

export function buildSearchableWidgetEntries(
  options: BuildSearchableWidgetEntriesOptions,
): SearchWidgetEntry[] {
  return options.instances
    .filter((instance) => instance.contribution.kind === "widget")
    .flatMap((instance) => {
      const widget = options.resolveWidgetContribution(
        instance.contribution.pluginId,
        instance.contribution.id,
      )
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

  return async (commandId, context) => {
    const action = options.actions[commandId]
    if (action) {
      await action()
      return true
    }

    if (pluginCommandIds.has(commandId) && options.runPluginCommand) {
      return options.runPluginCommand(commandId, context)
    }

    return false
  }
}

export function resolveEnabledProviderIds(settings: WorkbenchSearchSettings): string[] {
  return settings.enabledProviders.map((provider) => provider.id)
}

type SearchProviderWithRef = SearchProviderContribution & { ref: SearchProviderContributionRef }

export function resolveEnabledSearchProviders<TProvider extends SearchProviderWithRef>(
  settings: WorkbenchSearchSettings,
  providers: TProvider[],
): TProvider[] {
  return providers.filter((provider) =>
    settings.enabledProviders.some((ref) => sameContributionRef(provider.ref, ref)),
  )
}

export function resolveDefaultProviderForSearch(
  settings: WorkbenchSearchSettings,
  providers: SearchProviderWithRef[],
): string {
  return providers.some((provider) => sameContributionRef(provider.ref, settings.defaultProvider))
    ? settings.defaultProvider.id
    : ""
}
