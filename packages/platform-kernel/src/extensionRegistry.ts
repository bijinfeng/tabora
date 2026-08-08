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

export function createExtensionRegistry(): ExtensionRegistry {
  const views = createRegistrationStore<ViewComponent>("View")
  const settings = createRegistrationStore<SettingsPanelProvider>("Settings provider")
  const commands = createRegistrationStore<PluginCommandHandler>("Command handler")

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
  }
}
