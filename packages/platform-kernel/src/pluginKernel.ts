import type { PluginManifest } from "@tabora/plugin-api"
import { createEventBus } from "./eventBus"
import { createExtensionRegistry } from "./extensionRegistry"
import { createPluginRuntimeContext, type PluginRuntimeContext } from "./runtimeContext"

export type BuiltinPlugin = {
  manifest: PluginManifest
  enabled: boolean
  activate(context: PluginRuntimeContext): void | Promise<void>
}

export type PluginKernel = {
  registry: ReturnType<typeof createExtensionRegistry>
  events: ReturnType<typeof createEventBus>
  discover(plugins: BuiltinPlugin[]): Promise<void>
  activateEnabledPlugins(): Promise<void>
}

export function createPluginKernel(): PluginKernel {
  const events = createEventBus()
  const registry = createExtensionRegistry()
  const plugins: BuiltinPlugin[] = []

  return {
    registry,
    events,
    async discover(discoveredPlugins) {
      plugins.splice(0, plugins.length, ...discoveredPlugins)
    },
    async activateEnabledPlugins() {
      for (const plugin of plugins) {
        if (!plugin.enabled) {
          continue
        }
        const context = createPluginRuntimeContext({
          pluginId: plugin.manifest.id,
          events,
          registry,
          grantedPermissions: plugin.manifest.permissions ?? [],
        })
        await plugin.activate(context)
      }
    },
  }
}
