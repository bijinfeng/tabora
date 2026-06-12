import type {
  HostCapabilityId,
  HostPlatform,
  PluginManifest,
  PluginRecord,
} from "@tabora/plugin-api"
import { createEventBus } from "./eventBus"
import { createExtensionRegistry, type ViewRegistrationDisposer } from "./extensionRegistry"
import {
  collectPluginManifestViewIds,
  createPluginRuntimeContext,
  type PluginI18nService,
  type PluginRuntimeContext,
} from "./runtimeContext"

export type PluginActivationDisposer = () => void

export type BuiltinPlugin = {
  manifest: PluginManifest
  styleAssetUrls?: Record<string, string>
  enabled: boolean
  activate(
    context: PluginRuntimeContext,
  ): void | PluginActivationDisposer | Promise<void | PluginActivationDisposer>
}

export type PluginLifecycleStore = {
  save(record: PluginRecord): Promise<void>
}

export type PluginKernelOptions = {
  lifecycleStore?: PluginLifecycleStore
  recordSource?: PluginRecord["source"]
  hostPlatform?: HostPlatform
  hostCapabilities?: Partial<Record<HostCapabilityId, boolean>>
  i18n?: PluginI18nService
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
  const activePlugins = new Map<
    string,
    {
      plugin: BuiltinPlugin
      explicitDisposer: PluginActivationDisposer | undefined
      registrationDisposers: ViewRegistrationDisposer[]
    }
  >()

  function viewConflictReason(target: BuiltinPlugin, peers: BuiltinPlugin[]): string | undefined {
    const targetViewIds = Array.from(collectPluginManifestViewIds(target.manifest))
    if (targetViewIds.length === 0) return undefined

    const peerViewOwners = new Map<string, string>()
    for (const peer of peers) {
      for (const viewId of collectPluginManifestViewIds(peer.manifest)) {
        peerViewOwners.set(viewId, peer.manifest.id)
      }
    }

    const conflicts = Array.from(
      new Set(
        targetViewIds
          .map((viewId) => ({ viewId, owner: peerViewOwners.get(viewId) }))
          .filter((entry): entry is { viewId: string; owner: string } => Boolean(entry.owner))
          .map((entry) => `${entry.viewId} (already provided by "${entry.owner}")`),
      ),
    )

    return conflicts.length > 0 ? `Conflicting view IDs: ${conflicts.join(", ")}` : undefined
  }

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

  function logDisposerError(pluginId: string, label: string, error: unknown): void {
    console.error(
      `Plugin "${pluginId}" ${label} failed:`,
      error instanceof Error ? error.message : String(error),
    )
  }

  function runPluginDisposers(pluginId: string): void {
    const active = activePlugins.get(pluginId)
    if (!active) return

    if (active.explicitDisposer) {
      try {
        active.explicitDisposer()
      } catch (error: unknown) {
        logDisposerError(pluginId, "activation disposer", error)
      }
    }

    for (let index = active.registrationDisposers.length - 1; index >= 0; index -= 1) {
      const dispose = active.registrationDisposers[index]
      if (!dispose) continue
      try {
        dispose()
      } catch (error: unknown) {
        logDisposerError(pluginId, "view registration disposer", error)
      }
    }

    activePlugins.delete(pluginId)
  }

  async function activatePlugin(plugin: BuiltinPlugin): Promise<boolean> {
    const pluginId = plugin.manifest.id
    if (activePlugins.has(pluginId)) return false

    const registrationDisposers: ViewRegistrationDisposer[] = []
    const context = createPluginRuntimeContext({
      pluginId,
      events,
      registry,
      manifest: plugin.manifest,
      grantedPermissions: plugin.manifest.permissions ?? [],
      registrationDisposers,
      ...(options.i18n ? { i18n: options.i18n } : {}),
    })

    try {
      const explicitDisposer = await plugin.activate(context)
      activePlugins.set(pluginId, {
        plugin,
        explicitDisposer: explicitDisposer ?? undefined,
        registrationDisposers,
      })
      return true
    } catch (error: unknown) {
      for (let index = registrationDisposers.length - 1; index >= 0; index -= 1) {
        const dispose = registrationDisposers[index]
        if (!dispose) continue
        try {
          dispose()
        } catch (disposerError: unknown) {
          logDisposerError(pluginId, "view registration disposer", disposerError)
        }
      }
      throw error
    }
  }

  return {
    registry,
    events,
    plugins,
    async discover(discoveredPlugins) {
      const nextPluginsById = new Map(
        discoveredPlugins.map((plugin) => [plugin.manifest.id, plugin]),
      )
      const conflictReasons = new Map<string, string>()
      for (const plugin of discoveredPlugins) {
        const reason = viewConflictReason(
          plugin,
          discoveredPlugins.filter((peer) => peer !== plugin),
        )
        if (reason) conflictReasons.set(plugin.manifest.id, reason)
      }
      for (const [pluginId, active] of activePlugins) {
        const nextPlugin = nextPluginsById.get(pluginId)
        if (!nextPlugin || nextPlugin !== active.plugin || compatibilityReason(nextPlugin)) {
          runPluginDisposers(pluginId)
        }
      }

      plugins.splice(0, plugins.length, ...discoveredPlugins)

      for (const plugin of discoveredPlugins) {
        if (compatibilityReason(plugin) || conflictReasons.has(plugin.manifest.id)) {
          plugin.enabled = false
        }
      }

      if (lifecycleStore) {
        for (const plugin of discoveredPlugins) {
          const reason = compatibilityReason(plugin) ?? conflictReasons.get(plugin.manifest.id)
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
          plugin.enabled = false
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
          const activated = await activatePlugin(plugin)

          if (lifecycleStore && activated) {
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
      const conflictReason = enabled
        ? viewConflictReason(
            plugin,
            plugins.filter((peer) => peer.manifest.id !== pluginId && peer.enabled),
          )
        : undefined
      const reason = compatibilityReason(plugin)
      if (enabled && (reason || conflictReason)) {
        const disabledReason = reason ?? conflictReason
        runPluginDisposers(pluginId)
        plugin.enabled = false
        if (lifecycleStore) {
          await lifecycleStore.save(
            buildRecord(plugin, {
              enabled: false,
              status: "skipped",
              ...(disabledReason ? { disabledReason } : {}),
              updatedAt: new Date().toISOString(),
            }),
          )
        }
        return
      }

      if (!enabled) {
        runPluginDisposers(pluginId)
        plugin.enabled = false

        if (lifecycleStore) {
          await lifecycleStore.save(
            buildRecord(plugin, {
              enabled: false,
              status: "disabled",
              updatedAt: new Date().toISOString(),
              disabledReason: "用户手动禁用",
            }),
          )
        }
        return
      }

      if (activePlugins.has(pluginId)) {
        plugin.enabled = true
        return
      }

      plugin.enabled = true

      try {
        await activatePlugin(plugin)
        if (lifecycleStore) {
          await lifecycleStore.save(
            buildRecord(plugin, {
              enabled: true,
              status: "active",
              lastActivatedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          )
        }
      } catch (error: unknown) {
        console.error(
          `Plugin "${pluginId}" failed to activate:`,
          error instanceof Error ? error.message : String(error),
        )
        if (lifecycleStore) {
          await lifecycleStore.save(
            buildRecord(plugin, {
              enabled: true,
              status: "error",
              lastError: error instanceof Error ? error.message : String(error),
              lastActivatedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          )
        }
      }
    },
  }
}
