import type { EventBus } from "./eventBus"
import type { ExtensionRegistry } from "./extensionRegistry"

export type RuntimeConfigScope =
  | { type: "plugin" }
  | { type: "instance"; instanceId: string }
  | { type: "workspace" }

export type PluginRuntimeContext = {
  pluginId: string
  events: EventBus
  registry: ExtensionRegistry
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
    logger: {
      warn(message) {
        console.warn(`[${options.pluginId}] ${message}`)
      },
      error(message) {
        console.error(`[${options.pluginId}] ${message}`)
      },
    },
    getConfig(scope) {
      return config.get(keyFor(scope)) as unknown
    },
    async setConfig(scope, value) {
      config.set(keyFor(scope), value)
    },
  }
}
