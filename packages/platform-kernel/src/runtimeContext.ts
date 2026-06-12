import type { PluginManifest, PluginPermission } from "@tabora/plugin-api"
import type { EventBus } from "./eventBus"
import type { ExtensionRegistry, ViewRegistrationDisposer } from "./extensionRegistry"

export type PluginUiBridge = {
  openModal(viewId: string, props?: Record<string, unknown>): void
  closeModal(): void
  openFullscreen(viewId: string, props?: Record<string, unknown>): void
  closeFullscreen(): void
  showToast(
    message: string,
    options?: {
      type?: "success" | "error" | "warning" | "info"
      duration?: number
      action?: { label: string; commandId: string }
    },
  ): void
}

export type PermissionBridge = {
  canOpenExternal(url: string): boolean
  openExternal(url: string): boolean
}

export type I18nMessageBundle = {
  locale: string
  messages: Record<string, string>
}

export type PluginI18nService = {
  locale(): string
  registerMessages(pluginId: string, bundles: I18nMessageBundle[]): void
  t(pluginId: string, key: string, vars?: Record<string, string | number>): string
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string
}

export type PluginI18nBridge = {
  locale(): string
  registerMessages(bundles: I18nMessageBundle[]): void
  t(key: string, vars?: Record<string, string | number>): string
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string
}

export type PluginRuntimeContext = {
  pluginId: string
  registry: ExtensionRegistry
  ui: PluginUiBridge
  permissions: PermissionBridge
  i18n?: PluginI18nBridge
  logger: {
    warn(message: string): void
    error(message: string): void
  }
}

function collectManifestViewIds(manifest: PluginManifest): Set<string> {
  const views = new Set<string>()

  for (const layout of manifest.contributes.layouts ?? []) {
    if (layout.view) views.add(layout.view)
  }

  for (const widget of manifest.contributes.widgets ?? []) {
    views.add(widget.views.card)
    if (widget.views.expand) views.add(widget.views.expand)
    if (widget.views.settings) views.add(widget.views.settings)
  }

  for (const search of manifest.contributes.searches ?? []) {
    views.add(search.view)
  }

  for (const renderer of manifest.contributes.backgroundRenderers ?? []) {
    views.add(renderer.view)
  }

  for (const panel of manifest.contributes.settingsPanels ?? []) {
    views.add(panel.view)
  }

  return views
}

export function createPluginRuntimeContext(options: {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
  manifest?: PluginManifest
  grantedPermissions?: PluginPermission[]
  registrationDisposers?: ViewRegistrationDisposer[]
  i18n?: PluginI18nService
}): PluginRuntimeContext {
  const grantedPermissions = options.grantedPermissions ?? []
  const declaredViews = options.manifest ? collectManifestViewIds(options.manifest) : null
  const registry: ExtensionRegistry = {
    ...options.registry,
    views: {
      ...options.registry.views,
      register(viewId, view) {
        if (
          !viewId.startsWith(`${options.pluginId}.`) &&
          (!declaredViews || !declaredViews.has(viewId))
        ) {
          throw new Error(
            `Plugin "${options.pluginId}" attempted to register undeclared view: ${viewId}`,
          )
        }
        const dispose = options.registry.views.register(viewId, view)
        options.registrationDisposers?.push(dispose)
        return dispose
      },
    },
  }

  function canOpenExternal(url: string): boolean {
    let hostname: string
    try {
      hostname = new URL(url).hostname
    } catch {
      return false
    }
    return grantedPermissions.some((permission) => {
      if (permission.type !== "external-open") return false
      return permission.hosts.some((host) => host === "*" || host === hostname)
    })
  }

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
    registry,
    ui: {
      openModal(viewId, props) {
        options.events.emit("ui.modal.open", {
          viewId,
          props: { ...(props ?? {}), pluginId: options.pluginId },
        })
      },
      closeModal() {
        options.events.emit("ui.modal.close", null)
      },
      openFullscreen(viewId, props) {
        options.events.emit("ui.fullscreen.open", {
          viewId,
          props: { ...(props ?? {}), pluginId: options.pluginId },
        })
      },
      closeFullscreen() {
        options.events.emit("ui.fullscreen.close", null)
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
