import type { SettingsPanelProvider } from "@tabora/plugin-api"

export type ViewComponent = (...args: any[]) => unknown
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

export type ExtensionRegistry = {
  views: ViewRegistry
  settings: SettingsProviderRegistry
}

export function createExtensionRegistry(): ExtensionRegistry {
  const views = new Map<string, ViewComponent>()
  const settingsProviders = new Map<string, SettingsPanelProvider>()

  return {
    views: {
      register(viewId, view) {
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
  }
}
