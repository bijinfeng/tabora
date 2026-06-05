import type {
  HostCapabilityId,
  HostPlatform,
  PluginManifest,
  PluginRecord,
} from "@tabora/plugin-api"
import { createEventBus } from "./eventBus"
import { createExtensionRegistry } from "./extensionRegistry"
import { createPluginRuntimeContext, type PluginRuntimeContext } from "./runtimeContext"

export type BuiltinPlugin = {
  manifest: PluginManifest
  enabled: boolean
  activate(context: PluginRuntimeContext): void | Promise<void>
}

export type PluginLifecycleStore = {
  save(record: PluginRecord): Promise<void>
}

export type PluginKernelOptions = {
  lifecycleStore?: PluginLifecycleStore
  recordSource?: PluginRecord["source"]
  hostPlatform?: HostPlatform
  hostCapabilities?: Partial<Record<HostCapabilityId, boolean>>
}

export type PluginKernel = {
  registry: ReturnType<typeof createExtensionRegistry>
  events: ReturnType<typeof createEventBus>
  plugins: BuiltinPlugin[]
  discover(plugins: BuiltinPlugin[]): Promise<void>
  activateEnabledPlugins(): Promise<void>
  setPluginEnabled(pluginId: string, enabled: boolean): Promise<void>
}

export function createPluginKernel(options: PluginKernelOptions = {}): PluginKernel {
  const events = createEventBus()
  const registry = createExtensionRegistry()
  const plugins: BuiltinPlugin[] = []
  const lifecycleStore = options.lifecycleStore
  const recordSource = options.recordSource ?? "builtin"

  function compatibilityReason(plugin: BuiltinPlugin): string | undefined {
    const { supportedPlatforms, requiredCapabilities } = plugin.manifest
    if (
      options.hostPlatform &&
      supportedPlatforms &&
      !supportedPlatforms.includes(options.hostPlatform)
    ) {
      return `Unsupported platform "${options.hostPlatform}"`
    }

    if (requiredCapabilities?.length) {
      const missing = requiredCapabilities.filter(
        (capability) => options.hostCapabilities?.[capability] !== true,
      )
      if (missing.length) return `Missing host capabilities: ${missing.join(", ")}`
    }

    return undefined
  }

  function buildRecord(plugin: BuiltinPlugin, overrides?: Partial<PluginRecord>): PluginRecord {
    return {
      id: plugin.manifest.id,
      version: plugin.manifest.version,
      source: recordSource,
      enabled: plugin.enabled,
      status: plugin.enabled ? "active" : "disabled",
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      manifest: plugin.manifest,
      grantedPermissions: plugin.manifest.permissions ?? [],
      ...overrides,
    }
  }

  return {
    registry,
    events,
    plugins,
    async discover(discoveredPlugins) {
      plugins.splice(0, plugins.length, ...discoveredPlugins)

      if (lifecycleStore) {
        for (const plugin of discoveredPlugins) {
          const reason = compatibilityReason(plugin)
          const record = buildRecord(plugin, {
            installedAt: new Date().toISOString(),
            ...(reason
              ? {
                  enabled: false,
                  status: "skipped",
                  disabledReason: reason,
                }
              : {}),
          })
          await lifecycleStore.save(record)
        }
      }
    },
    async activateEnabledPlugins() {
      for (const plugin of plugins) {
        if (!plugin.enabled) {
          continue
        }
        const reason = compatibilityReason(plugin)
        if (reason) {
          if (lifecycleStore) {
            await lifecycleStore.save(
              buildRecord(plugin, {
                enabled: false,
                status: "skipped",
                disabledReason: reason,
              }),
            )
          }
          continue
        }
        try {
          const context = createPluginRuntimeContext({
            pluginId: plugin.manifest.id,
            events,
            registry,
            grantedPermissions: plugin.manifest.permissions ?? [],
          })
          await plugin.activate(context)

          if (lifecycleStore) {
            await lifecycleStore.save(
              buildRecord(plugin, {
                status: "active",
                lastActivatedAt: new Date().toISOString(),
              }),
            )
          }
        } catch (error: unknown) {
          console.error(
            `Plugin "${plugin.manifest.id}" failed to activate:`,
            error instanceof Error ? error.message : String(error),
          )
          if (lifecycleStore) {
            await lifecycleStore.save(
              buildRecord(plugin, {
                status: "error",
                lastError: error instanceof Error ? error.message : String(error),
                lastActivatedAt: new Date().toISOString(),
              }),
            )
          }
        }
      }
    },
    async setPluginEnabled(pluginId, enabled) {
      const plugin = plugins.find((p) => p.manifest.id === pluginId)
      if (!plugin) return
      const reason = compatibilityReason(plugin)
      if (enabled && reason) {
        plugin.enabled = false
        if (lifecycleStore) {
          await lifecycleStore.save(
            buildRecord(plugin, {
              enabled: false,
              status: "skipped",
              disabledReason: reason,
              updatedAt: new Date().toISOString(),
            }),
          )
        }
        return
      }
      plugin.enabled = enabled

      if (lifecycleStore) {
        const overrides: Partial<PluginRecord> = {
          enabled,
          status: enabled ? "active" : "disabled",
          updatedAt: new Date().toISOString(),
        }
        if (!enabled) {
          overrides.disabledReason = "用户手动禁用"
        }
        await lifecycleStore.save(buildRecord(plugin, overrides))
      }

      if (enabled) {
        try {
          const context = createPluginRuntimeContext({
            pluginId: plugin.manifest.id,
            events,
            registry,
            grantedPermissions: plugin.manifest.permissions ?? [],
          })
          await plugin.activate(context)
        } catch (error: unknown) {
          console.error(
            `Plugin "${pluginId}" failed to activate:`,
            error instanceof Error ? error.message : String(error),
          )
        }
      }
    },
  }
}
