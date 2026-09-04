import { createAiUsageTracker } from "@tabora/ai-runtime"

type UsageBucket = {
  month: string
  tracker: ReturnType<typeof createAiUsageTracker>
}

const buckets = new Map<string, UsageBucket>()

function currentMonth(now: Date): string {
  return now.toISOString().slice(0, 7)
}

/** Keeps platform-paid model accounting scoped to one user and calendar month. */
export function getAiUsageTracker(userId: string, now = new Date()) {
  const month = currentMonth(now)
  const current = buckets.get(userId)
  if (current?.month === month) return current.tracker

  const tracker = createAiUsageTracker(() => now)
  buckets.set(userId, { month, tracker })
  return tracker
}

export function getAiUsage(userId: string, now = new Date()) {
  return getAiUsageTracker(userId, now).getStats()
}
