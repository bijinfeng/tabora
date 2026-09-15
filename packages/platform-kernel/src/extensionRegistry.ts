import type {
  AiToolContribution,
  ContributionRef,
  ContributionRefKind,
  PluginCommandHandler,
  PluginCommandInvocation,
  PluginAiToolHandler,
  PluginViewComponent,
  SettingsPanelProvider,
} from "@tabora/plugin-api"

export type ViewComponent = PluginViewComponent
export type ExtensionRegistrationDisposer = () => void
export type ViewRegistrationDisposer = ExtensionRegistrationDisposer

export type ViewRegistry = {
  register(viewId: string, view: ViewComponent): ExtensionRegistrationDisposer
  get(viewId: string): ViewComponent
  has(viewId: string): boolean
}

export type SettingsProviderRegistry = {
  register(providerId: string, provider: SettingsPanelProvider): ExtensionRegistrationDisposer
  get(providerId: string): SettingsPanelProvider
  has(providerId: string): boolean
}

export type CommandHandlerRegistry = {
  register(commandId: string, handler: PluginCommandHandler): ExtensionRegistrationDisposer
  get(commandId: string): PluginCommandHandler
  has(commandId: string): boolean
  execute(commandId: string, invocation: PluginCommandInvocation): Promise<boolean>
}

export type AiToolContributionRef = ContributionRef<Extract<ContributionRefKind, "ai-tool">> & {
  contribution: AiToolContribution
}

export type AiToolRegistryEntry = {
  ref: AiToolContributionRef
  handler: PluginAiToolHandler
}

export type AiToolRegistry = {
  register(
    pluginId: string,
    ref: AiToolContributionRef,
    handler: PluginAiToolHandler,
  ): ExtensionRegistrationDisposer
  entries(): Iterable<AiToolRegistryEntry>
  listRegistered(pluginId?: string): ReadonlyArray<AiToolContributionRef>
  clearPluginEntries(pluginId: string): void
}

export type ExtensionRegistry = {
  views: ViewRegistry
  settings: SettingsProviderRegistry
  commands: CommandHandlerRegistry
  aiTools: AiToolRegistry
}

type RegistrationStore<T> = {
  register(id: string, value: T): ExtensionRegistrationDisposer
  get(id: string): T
  has(id: string): boolean
}

function createRegistrationStore<T>(kind: string): RegistrationStore<T> {
  const registrations = new Map<string, T>()

  return {
    register(id, value) {
      if (registrations.has(id)) {
        throw new Error(`${kind} already registered: ${id}`)
      }
      registrations.set(id, value)
      return () => {
        if (registrations.get(id) === value) {
          registrations.delete(id)
        }
      }
    },
    get(id) {
      const value = registrations.get(id)
      if (!value) {
        throw new Error(`${kind} not registered: ${id}`)
      }
      return value
    },
    has(id) {
      return registrations.has(id)
    },
  }
}

function createAiToolRegistry(): AiToolRegistry {
  const entries = new Map<string, AiToolRegistryEntry>()

  return {
    register(pluginId, ref, handler) {
      if (ref.pluginId !== pluginId) {
        throw new Error(`aiTool plugin id mismatch: registerer=${pluginId} ref=${ref.pluginId}`)
      }
      if (entries.has(ref.id)) {
        throw new Error(`aiTool already registered: ${ref.id}`)
      }
      const entry: AiToolRegistryEntry = { ref, handler }
      entries.set(ref.id, entry)
      return () => {
        if (entries.get(ref.id) === entry) {
          entries.delete(ref.id)
        }
      }
    },
    entries() {
      return entries.values()
    },
    listRegistered(pluginId?) {
      const refs: AiToolContributionRef[] = []
      for (const entry of entries.values()) {
        if (pluginId === undefined || entry.ref.pluginId === pluginId) {
          refs.push(entry.ref)
        }
      }
      return refs
    },
    clearPluginEntries(pluginId) {
      for (const [id, entry] of Array.from(entries.entries())) {
        if (entry.ref.pluginId === pluginId) {
          entries.delete(id)
        }
      }
    },
  }
}

export function createExtensionRegistry(): ExtensionRegistry {
  const views = createRegistrationStore<ViewComponent>("View")
  const settings = createRegistrationStore<SettingsPanelProvider>("Settings provider")
  const commands = createRegistrationStore<PluginCommandHandler>("Command handler")
  const aiTools = createAiToolRegistry()

  return {
    views,
    settings,
    commands: {
      ...commands,
      async execute(commandId, invocation) {
        if (!commands.has(commandId)) return false
        await commands.get(commandId)(invocation)
        return true
      },
    },
    aiTools,
  }
}
