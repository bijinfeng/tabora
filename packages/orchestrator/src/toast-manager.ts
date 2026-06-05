export type ToastType = "success" | "error" | "warning" | "info"

export type ToastAction = {
  label: string
  commandId: string
}

export type ToastOptions = {
  type?: ToastType
  duration?: number
  action?: ToastAction
}

export type ToastRecord = {
  id: string
  message: string
  type: ToastType
  duration?: number
  action?: ToastAction
}

export type ToastManager = {
  show(message: string, options?: ToastOptions): string
  dismiss(id: string): void
  list(): ToastRecord[]
  shouldAutoDismiss(id: string): boolean
}

export function createToastManager(options: { maxToasts?: number } = {}): ToastManager {
  const maxToasts = options.maxToasts ?? 3
  const toasts: ToastRecord[] = []
  let nextId = 0

  return {
    show(message, toastOptions = {}) {
      const id = `toast-${++nextId}`
      const toast: ToastRecord = {
        id,
        message,
        type: toastOptions.type ?? "info",
        ...(toastOptions.action
          ? { action: toastOptions.action }
          : { duration: toastOptions.duration ?? 2500 }),
      }
      toasts.push(toast)
      while (toasts.length > maxToasts) {
        toasts.shift()
      }
      return id
    },
    dismiss(id) {
      const index = toasts.findIndex((toast) => toast.id === id)
      if (index >= 0) {
        toasts.splice(index, 1)
      }
    },
    list() {
      return [...toasts]
    },
    shouldAutoDismiss(id) {
      const toast = toasts.find((candidate) => candidate.id === id)
      return Boolean(toast && !toast.action)
    },
  }
}
