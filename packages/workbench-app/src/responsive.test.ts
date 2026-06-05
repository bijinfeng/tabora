import { afterEach, describe, expect, it, vi } from "vitest"
import { createRoot } from "solid-js"
import { createWorkbenchResponsiveState } from "./responsive"

type Listener = (event: MediaQueryListEvent) => void

function installMatchMedia(matches: boolean) {
  const listeners = new Set<Listener>()
  const addEventListener = vi.fn((_event: string, listener: EventListenerOrEventListenerObject) => {
    if (typeof listener === "function") listeners.add(listener as Listener)
  })
  const removeEventListener = vi.fn(
    (_event: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === "function") listeners.delete(listener as Listener)
    },
  )
  const media = {
    matches,
    media: "(max-width: 768px)",
    onchange: null,
    addEventListener,
    removeEventListener,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } satisfies MediaQueryList
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  )
  return {
    media,
    setMatches(next: boolean) {
      media.matches = next
      const event = { matches: next, media: media.media } as MediaQueryListEvent
      for (const listener of listeners) listener(event)
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("createWorkbenchResponsiveState", () => {
  it("tracks whether the workbench is in a mobile viewport", () => {
    const match = installMatchMedia(false)

    createRoot((dispose) => {
      const responsive = createWorkbenchResponsiveState()
      expect(responsive.isMobile()).toBe(false)

      match.setMatches(true)
      expect(responsive.isMobile()).toBe(true)

      dispose()
      expect(match.media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function))
    })
  })

  it("falls back to desktop when matchMedia is unavailable", () => {
    createRoot((dispose) => {
      const responsive = createWorkbenchResponsiveState()
      expect(responsive.isMobile()).toBe(false)
      dispose()
    })
  })
})
