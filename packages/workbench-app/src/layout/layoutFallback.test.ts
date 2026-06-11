import { createRoot } from "solid-js"
import { describe, expect, it, vi } from "vitest"
import { createLayoutFallbackTracker } from "./layoutFallback"

describe("createLayoutFallbackTracker", () => {
  it("records layout fallback state and notifies the host", () => {
    createRoot((dispose) => {
      const notify = vi.fn()
      const tracker = createLayoutFallbackTracker({ notify })
      const error = new Error("layout crashed")

      tracker.recordLayoutError("official.layout.workbench-dashboard", error)

      expect(tracker.status()).toEqual({
        layoutId: "official.layout.workbench-dashboard",
        message: "layout crashed",
      })
      expect(notify).toHaveBeenCalledWith("布局加载失败，已切换到安全布局")

      dispose()
    })
  })

  it("can clear the fallback state after recovery", () => {
    createRoot((dispose) => {
      const tracker = createLayoutFallbackTracker()

      tracker.recordLayoutError("official.layout.workbench-focus", "broken")
      tracker.clearLayoutError()

      expect(tracker.status()).toBeNull()

      dispose()
    })
  })
})
