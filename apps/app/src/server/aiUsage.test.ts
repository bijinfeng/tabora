import { describe, expect, it } from "vitest"

import { getAiUsage, getAiUsageTracker } from "./aiUsage"

describe("platform AI usage", () => {
  it("isolates usage per user and resets it at the start of a new month", () => {
    const userId = `test-user-${Date.now()}`
    const january = new Date("2026-01-31T23:59:00.000Z")
    const tracker = getAiUsageTracker(userId, january)
    tracker.record({ totalTokens: 5 })

    expect(getAiUsage(userId, january)).toMatchObject({ requestCount: 1, totalTokens: 5 })
    expect(getAiUsage(userId, new Date("2026-02-01T00:00:00.000Z"))).toMatchObject({
      requestCount: 0,
      totalTokens: 0,
    })
  })
})
