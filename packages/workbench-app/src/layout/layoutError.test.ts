import { createRoot } from "solid-js"
import { describe, expect, it } from "vitest"

import { createLayoutErrorTracker } from "./layoutError"

describe("createLayoutErrorTracker", () => {
  it("records the layout error for the visible unavailable state", () => {
    createRoot((dispose) => {
      const tracker = createLayoutErrorTracker()

      tracker.recordLayoutError("official.layout.workbench-dashboard", new Error("layout crashed"))

      expect(tracker.status()).toEqual({
        layoutId: "official.layout.workbench-dashboard",
        message: "layout crashed",
      })

      dispose()
    })
  })

  it("can clear the error after a different layout becomes active", () => {
    createRoot((dispose) => {
      const tracker = createLayoutErrorTracker()

      tracker.recordLayoutError("official.layout.workbench-dashboard", "broken")
      tracker.clearLayoutError()

      expect(tracker.status()).toBeNull()

      dispose()
    })
  })
})
