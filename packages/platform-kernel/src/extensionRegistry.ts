import type {
  PluginCommandHandler,
  PluginCommandInvocation,
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

export type ExtensionRegistry = {
  views: ViewRegistry
  settings: SettingsProviderRegistry
  commands: CommandHandlerRegistry
}

export function createExtensionRegistry(): ExtensionRegistry {
  const views = new Map<string, ViewComponent>()
  const settingsProviders = new Map<string, SettingsPanelProvider>()
  const commandHandlers = new Map<string, PluginCommandHandler>()

  function rejectDuplicate(kind: string, id: string): void {
    throw new Error(`${kind} already registered: ${id}`)
  }

  return {
    views: {
      register(viewId, view) {
        if (views.has(viewId)) rejectDuplicate("View", viewId)
        views.set(viewId, view)
        return () => {
          if (views.get(viewId) === view) {
            views.delete(viewId)
          }
        }
      },
      get(viewId) {
        const view = views.get(viewId)
        if (!view) throw new Error(`View not registered: ${viewId}`)
        return view
      },
      has(viewId) {
        return views.has(viewId)
      },
    },
    settings: {
      register(providerId, provider) {
        if (settingsProviders.has(providerId)) rejectDuplicate("Settings provider", providerId)
        settingsProviders.set(providerId, provider)
        return () => {
          if (settingsProviders.get(providerId) === provider) {
            settingsProviders.delete(providerId)
          }
        }
      },
      get(providerId) {
        const provider = settingsProviders.get(providerId)
        if (!provider) throw new Error(`Settings provider not registered: ${providerId}`)
        return provider
      },
      has(providerId) {
        return settingsProviders.has(providerId)
      },
    },
    commands: {
      register(commandId, handler) {
        if (commandHandlers.has(commandId)) rejectDuplicate("Command handler", commandId)
        commandHandlers.set(commandId, handler)
        return () => {
          if (commandHandlers.get(commandId) === handler) {
            commandHandlers.delete(commandId)
          }
        }
      },
      get(commandId) {
        const handler = commandHandlers.get(commandId)
        if (!handler) throw new Error(`Command handler not registered: ${commandId}`)
        return handler
      },
      has(commandId) {
        return commandHandlers.has(commandId)
      },
      async execute(commandId, invocation) {
        const handler = commandHandlers.get(commandId)
        if (!handler) return false
        await handler(invocation)
        return true
      },
    },
  }
}
