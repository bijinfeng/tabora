import {
  AiRuntimeError,
  type AiGenerateRequest,
  type AiBudget,
  type AiTokenUsage,
  type AiUsageStats,
  type AiWorkspaceContextSummary,
} from "@tabora/plugin-api"

export type AiUsageTracker = {
  check(budget: AiBudget | undefined, estimatedTokens: number): void
  record(usage?: AiTokenUsage, failed?: boolean): void
  getStats(): AiUsageStats
  reset(): void
}

export function createAiUsageTracker(now: () => Date = () => new Date()): AiUsageTracker {
  let stats = emptyStats(now().toISOString())
  return {
    check(budget, estimatedTokens) {
      if (budget?.maxRequests !== undefined && stats.requestCount >= budget.maxRequests) {
        throw new AiRuntimeError("ai_budget_exceeded", "AI request budget exceeded")
      }
      if (
        budget?.maxTotalTokens !== undefined &&
        stats.totalTokens + estimatedTokens > budget.maxTotalTokens
      ) {
        throw new AiRuntimeError("ai_budget_exceeded", "AI token budget exceeded")
      }
    },
    record(usage, failed = false) {
      stats = {
        ...stats,
        requestCount: stats.requestCount + 1,
        failureCount: stats.failureCount + (failed ? 1 : 0),
        inputTokens: stats.inputTokens + (usage?.inputTokens ?? 0),
        outputTokens: stats.outputTokens + (usage?.outputTokens ?? 0),
        totalTokens: stats.totalTokens + (usage?.totalTokens ?? 0),
      }
    },
    getStats: () => ({ ...stats }),
    reset() {
      stats = emptyStats(now().toISOString())
    },
  }
}

function emptyStats(periodStartedAt: string): AiUsageStats {
  return {
    requestCount: 0,
    failureCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    periodStartedAt,
  }
}

export function estimateAiTokens(input: string): number {
  return Math.max(1, Math.ceil(input.trim().length / 4))
}

export function estimateAiRequestTokens(request: AiGenerateRequest): number {
  return estimateAiTokens([request.system, request.prompt].filter(Boolean).join("\n"))
}

export function summarizeWorkspaceContext(
  context: AiWorkspaceContextSummary,
  maxCharacters = 4_000,
): { text: string; estimatedTokens: number } {
  const text = [
    `Workspace: ${context.workspaceName} (${context.workspaceId})`,
    `Layout: ${context.activeLayoutId}`,
    "Widgets:",
    ...context.widgets.map(
      (widget) =>
        `- ${widget.title ?? widget.contributionId} · ${widget.pluginId} · ${widget.instanceId}`,
    ),
  ]
    .join("\n")
    .slice(0, maxCharacters)
  return { text, estimatedTokens: estimateAiTokens(text) }
}
