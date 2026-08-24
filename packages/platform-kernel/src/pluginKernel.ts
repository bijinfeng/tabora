import type {
  AiRuntimeBridge,
  HostCapabilityId,
  HostPlatform,
  PluginActivationDisposer,
  PluginManifest,
  PluginModule,
  PluginNetworkBridge,
  PluginPermissionGrant,
  PluginRecord,
  SettingsHostActionId,
  SettingsHostReadId,
} from "@tabora/plugin-api"
import { pluginManifestSchema, validatePluginManifestComposition } from "@tabora/plugin-api"

import { createEventBus } from "./eventBus"
import { createExtensionRegistry, type ExtensionRegistrationDisposer } from "./extensionRegistry"
import {
  collectPluginManifestSettingsProviderIds,
  collectPluginManifestViewIds,
  createPluginRuntimeContext,
  type PluginI18nService,
} from "./runtimeContext"

export type PluginPackageSource = "builtin" | "local-trusted" | "remote-untrusted"

/** Loader output: module code and static assets, without user state. */
export type LoadedPluginPackage = {
  module: PluginModule
  source: PluginPackageSource
  styleAssetUrls?: Record<string, string>
  preload?(): Promise<void>
}

export function createBuiltinPluginPackage(
  module: PluginModule,
  options: Pick<LoadedPluginPackage, "styleAssetUrls" | "preload"> = {},
): LoadedPluginPackage {
  return {
    module,
    source: "builtin",
    ...options,
  }
}

/** Host-owned install state. Manifest permissions are requests, never implicit grants. */
export type InstalledPluginRecord = {
  pluginId: string
  source: PluginPackageSource
  desiredEnabled: boolean
  grantedPermissions: PluginPermissionGrant[]
  grantedSettingsHostActions: SettingsHostActionId[]
  grantedSettingsHostReads: SettingsHostReadId[]
}

/** Host-owned, ephemeral lifecycle state. */
export type PluginRuntimeState = {
  status: "inactive" | "activating" | "active" | "disabled" | "error" | "skipped"
  error?: string
  disabledReason?: string
}

/** Runtime projection for shell/catalog use. It never mutates the plugin module. */
export type PluginRuntimePlugin = {
  package: LoadedPluginPackage
  module: PluginModule
  manifest: PluginManifest
  installation: InstalledPluginRecord
  state: PluginRuntimeState
  readonly enabled: boolean
}

export type PluginLifecycleStore = {
  get?(id: string): Promise<PluginRecord | undefined>
  save(record: PluginRecord): Promise<void>
}

export type PluginKernelOptions = {
  lifecycleStore?: PluginLifecycleStore
  hostPlatform?: HostPlatform
  hostCapabilities?: Partial<Record<HostCapabilityId, boolean>>
  permissionGrants?: Readonly<Record<string, PluginPermissionGrant[] | undefined>>
  /** Host policy grants for settings-panel host action requests. */
  settingsHostActionGrants?: Readonly<Record<string, SettingsHostActionId[] | undefined>>
  /** Host policy grants for custom settings view read projections. */
  settingsHostReadGrants?: Readonly<Record<string, SettingsHostReadId[] | undefined>>
  ai?: AiRuntimeBridge
  network?: PluginNetworkBridge
  i18n?: PluginI18nService
  /** Executable code from remote-untrusted packages always requires a sandbox and is refused here. */
  admittedSources?: ReadonlySet<Exclude<PluginPackageSource, "remote-untrusted">>
  /** Plugin ids the host resolves itself (dashboard layout, builtin theme/search/background packs). */
  hostBuiltinPluginIds?: ReadonlySet<string>
}

export type PluginKernel = {
  registry: ReturnType<typeof createExtensionRegistry>
  events: ReturnType<typeof createEventBus>
  plugins: PluginRuntimePlugin[]
  discover(packages: LoadedPluginPackage[]): Promise<void>
  activateEnabledPlugins(): Promise<void>
  setPluginEnabled(pluginId: string, enabled: boolean): Promise<void>
}

function pluginEnabled(plugin: PluginRuntimePlugin): boolean {
  return (
    plugin.installation.desiredEnabled &&
    plugin.state.status !== "disabled" &&
    plugin.state.status !== "error" &&
    plugin.state.status !== "skipped"
  )
}

function normalizeGrantedPermissions(
  requested: PluginPermissionGrant[],
  proposed: PluginPermissionGrant[],
): PluginPermissionGrant[] {
  const normalized: PluginPermissionGrant[] = []
  for (const grant of proposed) {
    const request = requested.find((candidate) => candidate.type === grant.type)
    if (!request) continue
    if (grant.type === "ai" && request.type === "ai") {
      const access = grant.access.filter((item) => request.access.includes(item))
      if (access.length) normalized.push({ type: "ai", access })
      continue
    }
    if (grant.type === "external-open" && request.type === "external-open") {
      const hosts = grant.hosts.filter(
        (host) => request.hosts.includes("*") || request.hosts.includes(host),
      )
      if (hosts.length) normalized.push({ type: grant.type, hosts })
      continue
    }
    if (grant.type === "network" && request.type === "network") {
      const hosts = grant.hosts.filter(
        (host) => request.hosts.includes("*") || request.hosts.includes(host),
      )
      if (hosts.length) normalized.push({ type: grant.type, hosts })
      continue
    }
  }
  return normalized
}

function normalizeGrantedSettingsHostActions(
  requested: SettingsHostActionId[],
  proposed: SettingsHostActionId[],
): SettingsHostActionId[] {
  return [...new Set(proposed.filter((action) => requested.includes(action)))]
}

function normalizeGrantedSettingsHostReads(
  requested: SettingsHostReadId[],
  proposed: SettingsHostReadId[],
): SettingsHostReadId[] {
  return [...new Set(proposed.filter((read) => requested.includes(read)))]
}

export function createPluginKernel(options: PluginKernelOptions = {}): PluginKernel {
  const events = createEventBus()
  const registry = createExtensionRegistry()
  const plugins: PluginRuntimePlugin[] = []
  const activePlugins = new Map<
    string,
    {
      plugin: PluginRuntimePlugin
      explicitDisposer: PluginActivationDisposer | undefined
      registrationDisposers: ExtensionRegistrationDisposer[]
    }
  >()
  // Local plugins must be admitted by a host-specific loader that verifies package origin and
  // style isolation. The generic kernel therefore executes builtin code only by default.
  const admittedSources =
    options.admittedSources ??
    new Set<Exclude<PluginPackageSource, "remote-untrusted">>(["builtin"])

  function sourceAdmissionReason(pluginPackage: LoadedPluginPackage): string | undefined {
    if (pluginPackage.source === "remote-untrusted") {
      return "Remote untrusted executable plugins require a sandboxed runtime"
    }
    if (!admittedSources.has(pluginPackage.source)) {
      return `Plugin source is not admitted by this host: ${pluginPackage.source}`
    }
    return undefined
  }

  function registrationConflictReason(
    target: PluginRuntimePlugin,
    peers: PluginRuntimePlugin[],
  ): string | undefined {
    const targetRegistrations = [
      ...Array.from(collectPluginManifestViewIds(target.manifest)).map((id) => ({
        kind: "view",
        id,
      })),
      ...Array.from(collectPluginManifestSettingsProviderIds(target.manifest)).map((id) => ({
        kind: "settings provider",
        id,
      })),
      ...(target.manifest.contributes.commands ?? []).map((command) => ({
        kind: "command",
        id: command.id,
      })),
    ]
    if (targetRegistrations.length === 0) return undefined

    const peerRegistrationOwners = new Map<string, string>()
    for (const peer of peers) {
      for (const viewId of collectPluginManifestViewIds(peer.manifest)) {
        peerRegistrationOwners.set(`view:${viewId}`, peer.manifest.id)
      }
      for (const providerId of collectPluginManifestSettingsProviderIds(peer.manifest)) {
        peerRegistrationOwners.set(`settings provider:${providerId}`, peer.manifest.id)
      }
      for (const command of peer.manifest.contributes.commands ?? []) {
        peerRegistrationOwners.set(`command:${command.id}`, peer.manifest.id)
      }
    }

    const conflicts = Array.from(
      new Set(
        targetRegistrations
          .map((registration) => ({
            ...registration,
            owner: peerRegistrationOwners.get(`${registration.kind}:${registration.id}`),
          }))
          .filter((entry): entry is { kind: string; id: string; owner: string } =>
            Boolean(entry.owner),
          )
          .map((entry) => `${entry.kind} ${entry.id} (already provided by "${entry.owner}")`),
      ),
    )

    return conflicts.length > 0 ? `Conflicting registrations: ${conflicts.join(", ")}` : undefined
  }

  function compatibilityReason(plugin: PluginRuntimePlugin): string | undefined {
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

    if (
      plugin.manifest.permissions?.some((permission) => permission.type === "network") &&
      options.hostCapabilities?.network !== true
    ) {
      return "Missing host capabilities: network"
    }

    if (
      plugin.manifest.permissions?.some((permission) => permission.type === "network") &&
      !options.network
    ) {
      return "Missing host network bridge"
    }

    return undefined
  }

  function buildRecord(
    plugin: PluginRuntimePlugin,
    overrides?: Partial<PluginRecord>,
  ): PluginRecord {
    return {
      id: plugin.manifest.id,
      version: plugin.manifest.version,
      source: plugin.package.source,
      enabled: plugin.installation.desiredEnabled,
      status:
        plugin.state.status === "inactive" || plugin.state.status === "activating"
          ? "disabled"
          : plugin.state.status,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      manifest: plugin.manifest,
      grantedPermissions: plugin.installation.grantedPermissions,
      grantedSettingsHostActions: plugin.installation.grantedSettingsHostActions,
      grantedSettingsHostReads: plugin.installation.grantedSettingsHostReads,
      ...(plugin.state.error ? { lastError: plugin.state.error } : {}),
      ...(plugin.state.disabledReason ? { disabledReason: plugin.state.disabledReason } : {}),
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
        logDisposerError(pluginId, "extension registration disposer", error)
      }
    }

    activePlugins.delete(pluginId)
  }

  async function activatePlugin(plugin: PluginRuntimePlugin): Promise<boolean> {
    const pluginId = plugin.manifest.id
    if (activePlugins.has(pluginId)) return false

    const registrationDisposers: ExtensionRegistrationDisposer[] = []
    const context = createPluginRuntimeContext({
      pluginId,
      events,
      registry,
      manifest: plugin.manifest,
      requestedPermissions: plugin.manifest.permissions ?? [],
      grantedPermissions: plugin.installation.grantedPermissions,
      registrationDisposers,
      ...(options.ai ? { ai: options.ai } : {}),
      ...(options.network ? { network: options.network } : {}),
      ...(options.i18n ? { i18n: options.i18n } : {}),
    })

    plugin.state = { status: "activating" }
    try {
      const explicitDisposer = await plugin.module.activate(context)
      activePlugins.set(pluginId, {
        plugin,
        explicitDisposer: explicitDisposer ?? undefined,
        registrationDisposers,
      })
      plugin.state = { status: "active" }
      return true
    } catch (error: unknown) {
      for (let index = registrationDisposers.length - 1; index >= 0; index -= 1) {
        const dispose = registrationDisposers[index]
        if (!dispose) continue
        try {
          dispose()
        } catch (disposerError: unknown) {
          logDisposerError(pluginId, "extension registration disposer", disposerError)
        }
      }
      plugin.state = {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      }
      throw error
    }
  }

  /**
   * Every activation path, including a manual re-enable, must cross the same preload
   * boundary. Lazy packages use this to resolve their module/CSS chunk before they can
   * expose registrations to the shell.
   */
  async function preloadPlugin(plugin: PluginRuntimePlugin): Promise<void> {
    await plugin.package.preload?.()
  }

  return {
    registry,
    events,
    plugins,
    async discover(discoveredPackages) {
      const sourceRejections = discoveredPackages
        .map((pluginPackage) => ({
          pluginId: pluginPackage.module.manifest.id,
          reason: sourceAdmissionReason(pluginPackage),
        }))
        .filter((entry): entry is { pluginId: string; reason: string } => Boolean(entry.reason))
      if (sourceRejections.length > 0) {
        throw new Error(
          `Rejected plugin source: ${sourceRejections
            .map((entry) => `${entry.pluginId}: ${entry.reason}`)
            .join("; ")}`,
        )
      }
      const parsedManifests: PluginManifest[] = []
      for (const pluginPackage of discoveredPackages) {
        const parsed = pluginManifestSchema.safeParse(pluginPackage.module.manifest)
        if (!parsed.success) {
          throw new Error(
            `Invalid plugin manifest "${pluginPackage.module.manifest.id}": ${parsed.error.issues
              .map((issue) => issue.message)
              .join(", ")}`,
          )
        }
        parsedManifests.push(parsed.data as PluginManifest)
      }
      validatePluginManifestComposition(parsedManifests, {
        ...(options.hostBuiltinPluginIds
          ? { hostBuiltinPluginIds: options.hostBuiltinPluginIds }
          : {}),
      })
      const seenPluginIds = new Set<string>()
      for (const pluginPackage of discoveredPackages) {
        const pluginId = pluginPackage.module.manifest.id
        if (seenPluginIds.has(pluginId)) {
          throw new Error(`Duplicate plugin package id: ${pluginId}`)
        }
        seenPluginIds.add(pluginId)
      }
      const persistedRecordsById = new Map(
        options.lifecycleStore?.get
          ? (
              await Promise.all(
                discoveredPackages.map(async (pluginPackage) => {
                  const record = await options.lifecycleStore!.get!(
                    pluginPackage.module.manifest.id,
                  )
                  return record ? ([record.id, record] as const) : undefined
                }),
              )
            ).filter((entry): entry is readonly [string, PluginRecord] => Boolean(entry))
          : [],
      )
      const previousById = new Map(plugins.map((plugin) => [plugin.manifest.id, plugin]))
      const nextPlugins = discoveredPackages.map<PluginRuntimePlugin>((pluginPackage) => {
        const previous = previousById.get(pluginPackage.module.manifest.id)
        const persisted = persistedRecordsById.get(pluginPackage.module.manifest.id)
        const requestedPermissions = pluginPackage.module.manifest.permissions ?? []
        const persistedOrPreviousGrant =
          previous?.installation.grantedPermissions ?? persisted?.grantedPermissions
        const runtimePlugin: PluginRuntimePlugin = {
          package: pluginPackage,
          module: pluginPackage.module,
          manifest: pluginPackage.module.manifest,
          installation: {
            pluginId: pluginPackage.module.manifest.id,
            source: pluginPackage.source,
            desiredEnabled: previous?.installation.desiredEnabled ?? persisted?.enabled ?? true,
            grantedPermissions: normalizeGrantedPermissions(
              requestedPermissions,
              persistedOrPreviousGrant ??
                options.permissionGrants?.[pluginPackage.module.manifest.id] ??
                [],
            ),
            grantedSettingsHostActions: normalizeGrantedSettingsHostActions(
              pluginPackage.module.manifest.contributes.settingsPanels?.flatMap(
                (panel) => panel.hostActions ?? [],
              ) ?? [],
              previous?.installation.grantedSettingsHostActions ??
                persisted?.grantedSettingsHostActions ??
                options.settingsHostActionGrants?.[pluginPackage.module.manifest.id] ??
                [],
            ),
            grantedSettingsHostReads: normalizeGrantedSettingsHostReads(
              pluginPackage.module.manifest.contributes.settingsPanels?.flatMap(
                (panel) => panel.hostReads ?? [],
              ) ?? [],
              previous?.installation.grantedSettingsHostReads ??
                persisted?.grantedSettingsHostReads ??
                options.settingsHostReadGrants?.[pluginPackage.module.manifest.id] ??
                [],
            ),
          },
          state: previous?.state ?? { status: "inactive" },
          get enabled() {
            return pluginEnabled(runtimePlugin)
          },
        }
        return runtimePlugin
      })
      const nextPluginsById = new Map(nextPlugins.map((plugin) => [plugin.manifest.id, plugin]))
      const conflictReasons = new Map<string, string>()
      for (const plugin of nextPlugins) {
        const reason = registrationConflictReason(
          plugin,
          nextPlugins.filter((peer) => peer !== plugin),
        )
        if (reason) conflictReasons.set(plugin.manifest.id, reason)
      }
      for (const [pluginId, active] of activePlugins) {
        const nextPlugin = nextPluginsById.get(pluginId)
        if (
          !nextPlugin ||
          nextPlugin.package !== active.plugin.package ||
          compatibilityReason(nextPlugin)
        ) {
          runPluginDisposers(pluginId)
        }
      }

      plugins.splice(0, plugins.length, ...nextPlugins)

      for (const plugin of plugins) {
        const reason = compatibilityReason(plugin) ?? conflictReasons.get(plugin.manifest.id)
        if (reason) {
          plugin.installation.desiredEnabled = false
          plugin.state = { status: "skipped", disabledReason: reason }
        }
      }

      if (options.lifecycleStore) {
        for (const plugin of plugins) {
          await options.lifecycleStore.save(buildRecord(plugin))
        }
      }
    },
    async activateEnabledPlugins() {
      const preloadResults = new Map<
        PluginRuntimePlugin,
        Promise<{ ok: true } | { ok: false; error: unknown }>
      >()
      for (const plugin of plugins) {
        if (!pluginEnabled(plugin) || !plugin.package.preload) continue
        preloadResults.set(
          plugin,
          plugin.package.preload().then(
            () => ({ ok: true }),
            (error: unknown) => ({ ok: false, error }),
          ),
        )
      }

      for (const plugin of plugins) {
        if (!pluginEnabled(plugin)) continue
        const reason = compatibilityReason(plugin)
        if (reason) {
          plugin.installation.desiredEnabled = false
          plugin.state = { status: "skipped", disabledReason: reason }
          if (options.lifecycleStore) await options.lifecycleStore.save(buildRecord(plugin))
          continue
        }
        try {
          const preloadResult = await preloadResults.get(plugin)
          if (preloadResult && !preloadResult.ok) throw preloadResult.error
          const activated = await activatePlugin(plugin)
          if (options.lifecycleStore && activated) {
            await options.lifecycleStore.save(
              buildRecord(plugin, { lastActivatedAt: new Date().toISOString() }),
            )
          }
        } catch (error: unknown) {
          plugin.state = {
            status: "error",
            error: error instanceof Error ? error.message : String(error),
          }
          console.error(
            `Plugin "${plugin.manifest.id}" failed to activate:`,
            error instanceof Error ? error.message : String(error),
          )
          if (options.lifecycleStore) {
            await options.lifecycleStore.save(
              buildRecord(plugin, {
                lastError: error instanceof Error ? error.message : String(error),
                lastActivatedAt: new Date().toISOString(),
              }),
            )
          }
        }
      }
    },
    async setPluginEnabled(pluginId, enabled) {
      const plugin = plugins.find((candidate) => candidate.manifest.id === pluginId)
      if (!plugin) return
      const conflictReason = enabled
        ? registrationConflictReason(
            plugin,
            plugins.filter(
              (peer) => peer.manifest.id !== pluginId && peer.installation.desiredEnabled,
            ),
          )
        : undefined
      const reason = compatibilityReason(plugin)
      if (enabled && (reason || conflictReason)) {
        const disabledReason = reason ?? conflictReason
        runPluginDisposers(pluginId)
        plugin.installation.desiredEnabled = false
        plugin.state = {
          status: "skipped",
          ...(disabledReason ? { disabledReason } : {}),
        }
        if (options.lifecycleStore) await options.lifecycleStore.save(buildRecord(plugin))
        return
      }

      if (!enabled) {
        runPluginDisposers(pluginId)
        plugin.installation.desiredEnabled = false
        plugin.state = { status: "disabled", disabledReason: "用户手动禁用" }
        if (options.lifecycleStore) await options.lifecycleStore.save(buildRecord(plugin))
        return
      }

      if (activePlugins.has(pluginId)) {
        plugin.installation.desiredEnabled = true
        return
      }

      plugin.installation.desiredEnabled = true
      try {
        await preloadPlugin(plugin)
        await activatePlugin(plugin)
        if (options.lifecycleStore) {
          await options.lifecycleStore.save(
            buildRecord(plugin, { lastActivatedAt: new Date().toISOString() }),
          )
        }
      } catch (error: unknown) {
        plugin.state = {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }
        console.error(
          `Plugin "${pluginId}" failed to activate:`,
          error instanceof Error ? error.message : String(error),
        )
        if (options.lifecycleStore) {
          await options.lifecycleStore.save(
            buildRecord(plugin, {
              lastError: error instanceof Error ? error.message : String(error),
              lastActivatedAt: new Date().toISOString(),
            }),
          )
        }
      }
    },
  }
}
