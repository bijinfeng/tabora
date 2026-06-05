import { createSignal, onCleanup } from "solid-js"

const MOBILE_QUERY = "(max-width: 768px)"

export type WorkbenchResponsiveState = {
  isMobile: () => boolean
}

export function createWorkbenchResponsiveState(query = MOBILE_QUERY): WorkbenchResponsiveState {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return { isMobile: () => false }
  }

  const media = window.matchMedia(query)
  const [isMobile, setIsMobile] = createSignal(media.matches)
  const update = (event: MediaQueryListEvent) => setIsMobile(event.matches)

  media.addEventListener("change", update)
  onCleanup(() => media.removeEventListener("change", update))

  return { isMobile }
}
