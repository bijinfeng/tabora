import { createSignal } from "solid-js"

export type LayoutFallbackStatus = {
  layoutId: string
  message: string
}

export type LayoutFallbackTrackerOptions = {
  notify?: (message: string) => void
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function createLayoutFallbackTracker(options: LayoutFallbackTrackerOptions = {}) {
  const [status, setStatus] = createSignal<LayoutFallbackStatus | null>(null)

  function recordLayoutError(layoutId: string, error: unknown) {
    setStatus({ layoutId, message: errorMessage(error) })
    options.notify?.("布局加载失败，已切换到安全布局")
  }

  function clearLayoutError() {
    setStatus(null)
  }

  return { status, recordLayoutError, clearLayoutError }
}
