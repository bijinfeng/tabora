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
}

export type PluginRuntimeContext = {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
  ui: PluginUiBridge
  logger: {
    warn(message: string): void
    error(message: string): void
  }
  getConfig<T = unknown>(scope: RuntimeConfigScope): T | undefined
  setConfig<T = unknown>(scope: RuntimeConfigScope, value: T): Promise<void>
}

export function createPluginRuntimeContext(options: {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
}): PluginRuntimeContext {
  const config = new Map<string, unknown>()

  function keyFor(scope: RuntimeConfigScope): string {
    if (scope.type === "instance") {
      return `instance:${scope.instanceId}`
    }
    return scope.type
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
      config.set(keyFor(scope), value)
    },
  }
}
