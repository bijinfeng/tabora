export type EventPayloads = {
  "ui.modal.open": { viewId: string; props?: Record<string, unknown> }
  "ui.modal.close": null
  "ui.fullscreen.open": { viewId: string; props?: Record<string, unknown> }
  "ui.fullscreen.close": null
  "host.external.open": { url: string }
  "theme.changed": { themeId: string }
}

export type EventHandler<P = unknown> = (payload: P) => void

export interface EventBus {
  emit(eventName: string, payload: unknown): void
  on(eventName: string, handler: EventHandler): () => void
}

export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<EventHandler>>()

  return {
    emit(eventName, payload) {
      for (const handler of handlers.get(eventName) ?? []) {
        handler(payload)
      }
    },
    on(eventName, handler) {
      const eventHandlers = handlers.get(eventName) ?? new Set<EventHandler>()
      eventHandlers.add(handler)
      handlers.set(eventName, eventHandlers)
      return () => {
        eventHandlers.delete(handler)
      }
    },
  }
}
