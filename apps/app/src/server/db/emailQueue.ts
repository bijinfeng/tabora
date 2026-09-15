import { and, count, desc, eq, isNull, lt, lte, or } from "drizzle-orm"

export type EmailQueueStatus = "pending" | "processing" | "sent" | "failed"

export interface EmailQueueRecord {
  id: number
  to: string
  subject: string
  html: string
  text: string | null
  status: EmailQueueStatus
  attempts: number
  maxAttempts: number
  lastError: string | null
  sentAt: Date | null
  createdAt: Date
  scheduledFor: Date | null
}

export interface CreateEmailQueueInput {
  to: string
  subject: string
  html: string
  text?: string
  scheduledFor?: Date
  maxAttempts?: number
}

/**
 * 邮件发送队列查询层
 */
export function createEmailQueueQueries(db: any, schema: { emailQueue: any }) {
  const { emailQueue } = schema

  async function enqueue(input: CreateEmailQueueInput): Promise<number> {
    const result = await db
      .insert(emailQueue)
      .values({
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text || null,
        status: "pending",
        attempts: 0,
        maxAttempts: input.maxAttempts || 3,
        lastError: null,
        sentAt: null,
        createdAt: new Date(),
        scheduledFor: input.scheduledFor || null,
      })
      .returning({ id: emailQueue.id })

    return result[0].id
  }

  async function getPending(limit = 10): Promise<EmailQueueRecord[]> {
    const now = new Date()
    return (await db
      .select()
      .from(emailQueue)
      .where(
        and(
          or(eq(emailQueue.status, "pending"), eq(emailQueue.status, "failed")),
          or(isNull(emailQueue.scheduledFor), lte(emailQueue.scheduledFor, now)),
          lt(emailQueue.attempts, emailQueue.maxAttempts),
        ),
      )
      .orderBy(emailQueue.createdAt)
      .limit(limit)) as EmailQueueRecord[]
  }

  async function markProcessing(id: number): Promise<void> {
    await db.update(emailQueue).set({ status: "processing" }).where(eq(emailQueue.id, id))
  }

  async function markSent(id: number): Promise<void> {
    await db
      .update(emailQueue)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(emailQueue.id, id))
  }

  async function markFailed(id: number, error: string): Promise<void> {
    const rows = (await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.id, id))
      .limit(1)) as EmailQueueRecord[]
    const record = rows[0]

    if (!record) return

    const newAttempts = record.attempts + 1
    const newStatus = newAttempts >= record.maxAttempts ? "failed" : "pending"

    await db
      .update(emailQueue)
      .set({
        status: newStatus,
        attempts: newAttempts,
        lastError: error,
      })
      .where(eq(emailQueue.id, id))
  }

  async function getHistory(limit = 50, offset = 0) {
    const rows = (await db
      .select()
      .from(emailQueue)
      .orderBy(desc(emailQueue.createdAt))
      .limit(limit)
      .offset(offset)) as EmailQueueRecord[]

    const totalRows = await db.select({ value: count() }).from(emailQueue)

    return { rows, total: Number(totalRows[0]?.value ?? 0) }
  }

  async function cleanupOld(daysToKeep = 30): Promise<number> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysToKeep)

    const result = await db
      .delete(emailQueue)
      .where(and(eq(emailQueue.status, "sent"), lt(emailQueue.createdAt, cutoff)))
      .returning({ id: emailQueue.id })

    return result.length
  }

  async function getStats(): Promise<{
    pending: number
    processing: number
    sent: number
    failed: number
  }> {
    const results = (await db
      .select({ status: emailQueue.status, value: count() })
      .from(emailQueue)
      .groupBy(emailQueue.status)) as Array<{ status: string; value: number }>

    const stats = { pending: 0, processing: 0, sent: 0, failed: 0 }
    for (const row of results) {
      const status = row.status as EmailQueueStatus
      stats[status] = Number(row.value)
    }

    return stats
  }

  return {
    enqueue,
    getPending,
    markProcessing,
    markSent,
    markFailed,
    getHistory,
    cleanupOld,
    getStats,
  }
}
