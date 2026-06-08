import { createEmitter } from "@solid-primitives/event-bus"

export type EventPayloads = {
  "ui.modal.open": { viewId: string; props?: Record<string, unknown> }
  "ui.modal.close": null
  "ui.fullscreen.open": { viewId: string; props?: Record<string, unknown> }
  "ui.fullscreen.close": null
  "ui.toast.show": {
    message: string
    options?: {
      type?: "success" | "error" | "warning" | "info"
      duration?: number
      action?: { label: string; commandId: string }
    }
  }
  "host.external.open": { url: string }
  "theme.changed": { themeId: string }
}

export type EventHandler<P = unknown> = (payload: P) => void

export interface EventBus {
  emit(eventName: string, payload: unknown): void
  on(eventName: string, handler: EventHandler): () => void
}

export function createEventBus(): EventBus {
  const emitter = createEmitter<EventPayloads>()

  return {
    emit(eventName, payload) {
      emitter.emit(eventName as keyof EventPayloads, payload as EventPayloads[keyof EventPayloads])
    },
    on(eventName, handler) {
      return emitter.on(eventName as keyof EventPayloads, handler as EventHandler)
    },
  }
}
