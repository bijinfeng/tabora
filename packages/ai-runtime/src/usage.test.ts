import { describe, expect, it } from "vitest"

import { createAiUsageTracker, estimateAiRequestTokens, summarizeWorkspaceContext } from "./usage"

describe("AI usage helpers", () => {
  it("enforces request and token budgets while recording usage", () => {
    const tracker = createAiUsageTracker(() => new Date("2026-01-01T00:00:00.000Z"))
    tracker.check({ maxRequests: 1, maxTotalTokens: 10 }, 4)
    tracker.record({ inputTokens: 3, outputTokens: 2, totalTokens: 5 })
    expect(tracker.getStats()).toMatchObject({ requestCount: 1, totalTokens: 5 })
    expect(() => tracker.check({ maxRequests: 1 }, 1)).toThrow("AI request budget exceeded")
    try {
      tracker.check({ maxRequests: 1 }, 1)
    } catch (error) {
      expect(error).toMatchObject({ code: "ai_budget_exceeded" })
    }
  })

  it("estimates request tokens from system and user prompts", () => {
    expect(estimateAiRequestTokens({ prompt: "abcd", system: "efgh" })).toBe(3)
  })

  it("summarizes workspace metadata without plugin private data", () => {
    const summary = summarizeWorkspaceContext({
      workspaceId: "w1",
      workspaceName: "Today",
      activeLayoutId: "dashboard",
      widgets: [
        { instanceId: "todo-1", pluginId: "official.todo", contributionId: "todo", title: "Todo" },
      ],
    })
    expect(summary.text).toContain("Workspace: Today (w1)")
    expect(summary.text).toContain("Todo · official.todo · todo-1")
    expect(summary.estimatedTokens).toBeGreaterThan(0)
  })
})
