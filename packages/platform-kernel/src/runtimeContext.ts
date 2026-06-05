import type { PluginPermission } from "@tabora/plugin-api"
import type { EventBus } from "./eventBus"
import type { ExtensionRegistry } from "./extensionRegistry"

export type RuntimeConfigScope =
  | { type: "plugin" }
  | { type: "instance"; instanceId: string }
  | { type: "workspace" }

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
  getConfig<T = unknown>(scope: RuntimeConfigScope): T | undefined
  setConfig<T = unknown>(scope: RuntimeConfigScope, value: T): Promise<void>
}

export type RuntimeConfigStore = {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

export function createPluginRuntimeContext(options: {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
  grantedPermissions?: PluginPermission[]
  configStore?: RuntimeConfigStore
}): PluginRuntimeContext {
  const config = new Map<string, unknown>()
  const grantedPermissions = options.grantedPermissions ?? []

  function keyFor(scope: RuntimeConfigScope): string {
    if (scope.type === "instance") return `instance:${scope.instanceId}`
    return scope.type
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
    registry: options.registry,
    ui: {
      openModal(viewId, props) {
        options.events.emit("ui.modal.open", { viewId, props })
      },
      closeModal() {
        options.events.emit("ui.modal.close", null)
      },
      openFullscreen(viewId, props) {
        options.events.emit("ui.fullscreen.open", { viewId, props })
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
    getConfig(scope) {
      return config.get(keyFor(scope)) as any
    },
    async setConfig(scope, value) {
      const key = keyFor(scope)
      config.set(key, value)
      await options.configStore?.set(key, value)
    },
  }
}
