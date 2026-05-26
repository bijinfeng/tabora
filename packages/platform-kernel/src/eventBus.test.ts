import { describe, expect, it } from "vitest"
import { createEventBus } from "./eventBus"

describe("createEventBus", () => {
  it("delivers emitted payloads to subscribers", () => {
    const events = createEventBus()
    const received: unknown[] = []

    const unsubscribe = events.on("theme.changed", (payload) => received.push(payload))
    events.emit("theme.changed", { themeId: "official.theme.light" })
    unsubscribe()
    events.emit("theme.changed", { themeId: "official.theme.dark" })

    expect(received).toEqual([{ themeId: "official.theme.light" }])
  })
})
