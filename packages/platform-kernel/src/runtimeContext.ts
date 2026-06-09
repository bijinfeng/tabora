import type { PluginPermission } from "@tabora/plugin-api"
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

export type PluginRuntimeContext = {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
  ui: PluginUiBridge
  permissions: PermissionBridge
  logger: {
    warn(message: string): void
    error(message: string): void
  }
}

export function createPluginRuntimeContext(options: {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
  grantedPermissions?: PluginPermission[]
  registrationDisposers?: ViewRegistrationDisposer[]
}): PluginRuntimeContext {
  const grantedPermissions = options.grantedPermissions ?? []
  const registry: ExtensionRegistry = {
    ...options.registry,
    views: {
      ...options.registry.views,
      register(viewId, view) {
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

  return {
    pluginId: options.pluginId,
    events: options.events,
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
