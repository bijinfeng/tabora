import { createSignal } from "solid-js"

export type LayoutErrorStatus = {
  layoutId: string
  message: string
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function createLayoutErrorTracker() {
  const [status, setStatus] = createSignal<LayoutErrorStatus | null>(null)

  function recordLayoutError(layoutId: string, error: unknown) {
    setStatus({ layoutId, message: errorMessage(error) })
  }

  function clearLayoutError() {
    setStatus(null)
  }

  return { status, recordLayoutError, clearLayoutError }
}
