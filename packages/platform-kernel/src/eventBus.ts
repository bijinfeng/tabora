export type EventHandler = (payload: unknown) => void

export type EventBus = {
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
