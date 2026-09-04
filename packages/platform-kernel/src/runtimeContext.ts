import type {
  AiPermissionAccess,
  AiRuntimeBridge,
  PluginCommandHandler,
  PluginContext,
  PluginI18nBridge,
  PluginI18nMessageBundle,
  PluginManifest,
  PluginNetworkBridge,
  PluginPermission,
  PluginSettingsRegistration,
  PluginViewRegistration,
} from "@tabora/plugin-api"
import type { EventBus } from "./eventBus"
import type { ExtensionRegistrationDisposer, ExtensionRegistry } from "./extensionRegistry"

export type I18nMessageBundle = PluginI18nMessageBundle

export type PluginI18nService = {
  locale(): string
  registerMessages(pluginId: string, bundles: I18nMessageBundle[]): void
  t(pluginId: string, key: string, vars?: Record<string, string | number>): string
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string
}

export function collectPluginManifestViewIds(manifest: PluginManifest): Set<string> {
  const views = new Set<string>()

  for (const widget of manifest.contributes.widgets ?? []) {
    views.add(widget.views.card)
    if (widget.views.expand) views.add(widget.views.expand)
    if (widget.views.expandFooter) views.add(widget.views.expandFooter)
    if (widget.views.settings) views.add(widget.views.settings)
  }

  for (const search of manifest.contributes.searches ?? []) {
    views.add(search.view)
  }

  for (const renderer of manifest.contributes.backgroundRenderers ?? []) {
    views.add(renderer.view)
  }

  for (const panel of manifest.contributes.settingsPanels ?? []) {
    if (panel.content.kind === "custom-view") views.add(panel.content.view)
  }

  return views
}

export function collectPluginManifestSettingsProviderIds(manifest: PluginManifest): Set<string> {
  const providers = new Set<string>()
  for (const panel of manifest.contributes.settingsPanels ?? []) {
    if (panel.content.kind === "schema") providers.add(panel.content.provider)
  }
  return providers
}

export function collectPluginManifestCommandIds(manifest: PluginManifest): Set<string> {
  return new Set((manifest.contributes.commands ?? []).map((command) => command.id))
}

export function createPluginRuntimeContext(options: {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
  manifest?: PluginManifest
  requestedPermissions?: PluginPermission[]
  /**
   * Granted permissions, read lazily so runtime grants take effect without recreating the context.
   * Accepts a snapshot array (kept for callers/tests that pass a fixed set) or a getter.
   */
  grantedPermissions?: PluginPermission[] | (() => PluginPermission[])
  registrationDisposers?: ExtensionRegistrationDisposer[]
  ai?: AiRuntimeBridge
  network?: PluginNetworkBridge
  i18n?: PluginI18nService
}): PluginContext {
  const grantedOption = options.grantedPermissions
  const readGrantedPermissions: () => PluginPermission[] =
    typeof grantedOption === "function" ? grantedOption : () => grantedOption ?? []
  const requestedPermissions = options.requestedPermissions ?? options.manifest?.permissions ?? []
  const declaredViews = options.manifest ? collectPluginManifestViewIds(options.manifest) : null
  const declaredSettingsProviders = options.manifest
    ? collectPluginManifestSettingsProviderIds(options.manifest)
    : new Set<string>()
  const declaredCommands = options.manifest
    ? collectPluginManifestCommandIds(options.manifest)
    : new Set<string>()

  function canAccessView(viewId: string): boolean {
    return viewId.startsWith(`${options.pluginId}.`) && (declaredViews?.has(viewId) ?? false)
  }

  function canOpenView(viewId: string): boolean {
    return canAccessView(viewId) && options.registry.views.has(viewId)
  }

  function ownsRegistration(id: string): boolean {
    return id.startsWith(`${options.pluginId}.`)
  }

  const views: PluginViewRegistration = {
    register(viewId, view) {
      if (!canAccessView(viewId)) {
        throw new Error(
          `Plugin "${options.pluginId}" attempted to register undeclared view: ${viewId}`,
        )
      }
      const dispose = options.registry.views.register(viewId, view)
      options.registrationDisposers?.push(dispose)
      return dispose
    },
  }

  const settings: PluginSettingsRegistration = {
    register(providerId, provider) {
      if (!ownsRegistration(providerId) || !declaredSettingsProviders.has(providerId)) {
        throw new Error(
          `Plugin "${options.pluginId}" attempted to register undeclared settings provider: ${providerId}`,
        )
      }
      const dispose = options.registry.settings.register(providerId, provider)
      options.registrationDisposers?.push(dispose)
      return dispose
    },
  }

  const commands = {
    register(commandId: string, handler: PluginCommandHandler) {
      if (!ownsRegistration(commandId) || !declaredCommands.has(commandId)) {
        throw new Error(
          `Plugin "${options.pluginId}" attempted to register undeclared command handler: ${commandId}`,
        )
      }
      const dispose = options.registry.commands.register(commandId, handler)
      options.registrationDisposers?.push(dispose)
      return dispose
    },
  }

  function hasGrantedHostPermission(type: "external-open" | "network", url: string): boolean {
    let hostname: string
    try {
      hostname = new URL(url).hostname
    } catch {
      return false
    }

    return [requestedPermissions, readGrantedPermissions()].every((permissions) =>
      permissions.some(
        (permission) =>
          permission.type === type &&
          permission.hosts.some((host) => host === "*" || host === hostname),
      ),
    )
  }

  function canOpenExternal(url: string): boolean {
    return hasGrantedHostPermission("external-open", url)
  }

  function canFetch(url: string): boolean {
    return options.network !== undefined && hasGrantedHostPermission("network", url)
  }

  function hasAiAccess(access: AiPermissionAccess): boolean {
    return [requestedPermissions, readGrantedPermissions()].every((permissions) =>
      permissions.some(
        (permission) => permission.type === "ai" && permission.access.includes(access),
      ),
    )
  }

  function hasAnyAiAccess(): boolean {
    return (
      requestedPermissions.some((permission) => permission.type === "ai") &&
      readGrantedPermissions().some((permission) => permission.type === "ai")
    )
  }

  function requireAiAccess(access: AiPermissionAccess): void {
    if (!hasAiAccess(access)) {
      throw new Error(
        `Plugin "${options.pluginId}" attempted to use AI ${access} without permission`,
      )
    }
  }

  const ai: AiRuntimeBridge | undefined =
    options.ai && hasAnyAiAccess()
      ? {
          generate(request) {
            requireAiAccess("generate")
            return options.ai!.generate(request)
          },
          stream(request) {
            requireAiAccess("generate")
            return options.ai!.stream(request)
          },
          ...(options.ai.createChatClient
            ? {
                createChatClient(clientOptions) {
                  requireAiAccess("generate")
                  return options.ai!.createChatClient!(clientOptions)
                },
              }
            : {}),
          ...(options.ai.createChatConnection
            ? {
                createChatConnection() {
                  requireAiAccess("generate")
                  return options.ai!.createChatConnection!()
                },
              }
            : {}),
          ...(options.ai.prepareChatAttachments
            ? {
                prepareChatAttachments(files, preparation) {
                  requireAiAccess("tools")
                  return options.ai!.prepareChatAttachments!(files, preparation)
                },
              }
            : {}),
        }
      : undefined

  const i18n: PluginI18nBridge | undefined = options.i18n
    ? {
        locale: () => options.i18n!.locale(),
        registerMessages: (bundles) => options.i18n!.registerMessages(options.pluginId, bundles),
        t: (key, vars) => options.i18n!.t(options.pluginId, key, vars),
        formatDate: (date, formatOptions) => options.i18n!.formatDate(date, formatOptions),
        formatNumber: (value, formatOptions) => options.i18n!.formatNumber(value, formatOptions),
      }
    : undefined

  return {
    pluginId: options.pluginId,
    views,
    settings,
    commands,
    ui: {
      openModal(viewId, props) {
        if (!canOpenView(viewId)) {
          throw new Error(
            `Plugin "${options.pluginId}" attempted to open undeclared modal view: ${viewId}`,
          )
        }
        options.events.emit("ui.modal.open", {
          viewId,
          props: { ...(props ?? {}), pluginId: options.pluginId },
        })
      },
      closeModal() {
        options.events.emit("ui.modal.close", { pluginId: options.pluginId })
      },
      openFullscreen(viewId, props) {
        if (!canOpenView(viewId)) {
          throw new Error(
            `Plugin "${options.pluginId}" attempted to open undeclared fullscreen view: ${viewId}`,
          )
        }
        options.events.emit("ui.fullscreen.open", {
          viewId,
          props: { ...(props ?? {}), pluginId: options.pluginId },
        })
      },
      closeFullscreen() {
        options.events.emit("ui.fullscreen.close", { pluginId: options.pluginId })
      },
      openSettings(sectionId) {
        options.events.emit("ui.settings.open", {
          pluginId: options.pluginId,
          ...(sectionId ? { sectionId } : {}),
        })
      },
      showToast(message, toastOptions) {
        options.events.emit("ui.toast.show", { message, options: toastOptions })
      },
    },
    permissions: {
      canOpenExternal,
      openExternal(url) {
        if (!canOpenExternal(url)) return false
        options.events.emit("host.external.open", { url })
        return true
      },
    },
    network: {
      canFetch,
      async fetch(url, init) {
        if (options.network === undefined) {
          throw new Error(
            `Plugin "${options.pluginId}" attempted network access without a host network bridge: ${url}`,
          )
        }
        if (!canFetch(url)) {
          throw new Error(
            `Plugin "${options.pluginId}" attempted network access without permission: ${url}`,
          )
        }
        return options.network.fetch(url, init)
      },
    },
    ...(ai ? { ai } : {}),
    ...(i18n ? { i18n } : {}),
    logger: {
      warn(message) {
        console.warn(`[${options.pluginId}] ${message}`)
      },
      error(message) {
        console.error(`[${options.pluginId}] ${message}`)
      },
    },
  }
}
