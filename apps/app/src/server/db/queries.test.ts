import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { buildTables } from "./schemaFactory"
import { createSqliteDb } from "./sqlite"

/**
 * 覆盖邮件队列 / 审计日志 / 用户查询层的可观察行为。
 *
 * 这些路径曾整体误用 Kysely 风格的 `.where((eb) => eb.eq(...))` 回调：drizzle 传给回调的是
 * 字段 Proxy 而非 expression builder，解构出的操作符为 undefined，运行时抛
 * `TypeError: eq is not a function`（生产日志中邮件队列每 5s 复现一次）。
 * 把 count() 当作 select 字段函数传入的写法则更安静 —— 不抛错，但聚合值退化成 NaN。
 * 因为 db 被标注为 any，两类缺陷都无法被类型检查发现，只能靠这里的行为断言兜住。
 */

type Handle = ReturnType<typeof createSqliteDb>

const tables = buildTables("sqlite") as { emailQueue: unknown; auditLog: unknown }

let handle: Handle

beforeEach(() => {
  handle = createSqliteDb(":memory:")
  handle.migrate()
})

afterEach(() => {
  handle.close()
})

/** 直接写入队列行，用于控制 enqueue 不暴露的 createdAt / attempts / status。 */
async function insertQueueRow(row: Record<string, unknown> = {}): Promise<void> {
  await handle.db.insert(tables.emailQueue as never).values({
    to: "a@example.com",
    subject: "subject",
    html: "<p>body</p>",
    text: null,
    status: "pending",
    attempts: 0,
    maxAttempts: 3,
    lastError: null,
    sentAt: null,
    createdAt: new Date(),
    scheduledFor: null,
    ...row,
  } as never)
}

describe("emailQueue 查询层", () => {
  it("enqueue 后 getPending 返回待发送记录", async () => {
    const id = await handle.emailQueue.enqueue({
      to: "user@example.com",
      subject: "hello",
      html: "<p>hi</p>",
    })

    const pending = await handle.emailQueue.getPending(10)

    expect(pending).toHaveLength(1)
    expect(pending[0]).toMatchObject({ id, to: "user@example.com", status: "pending" })
  })

  it("getPending 纳入 failed 且排除重试已耗尽的记录", async () => {
    await insertQueueRow({ subject: "retriable", status: "failed", attempts: 1, maxAttempts: 3 })
    await insertQueueRow({ subject: "exhausted", status: "failed", attempts: 3, maxAttempts: 3 })

    const subjects = (await handle.emailQueue.getPending(10)).map((r) => r.subject)

    expect(subjects).toEqual(["retriable"])
  })

  it("getPending 排除已发送与仍在处理中的记录", async () => {
    await insertQueueRow({ subject: "sent", status: "sent" })
    await insertQueueRow({ subject: "processing", status: "processing" })
    await insertQueueRow({ subject: "waiting", status: "pending" })

    const subjects = (await handle.emailQueue.getPending(10)).map((r) => r.subject)

    expect(subjects).toEqual(["waiting"])
  })

  it("getPending 按 scheduledFor 过滤未到期记录", async () => {
    const past = new Date(Date.now() - 60_000)
    const future = new Date(Date.now() + 600_000)
    await insertQueueRow({ subject: "due", scheduledFor: past })
    await insertQueueRow({ subject: "not-due", scheduledFor: future })
    await insertQueueRow({ subject: "unscheduled", scheduledFor: null })

    const subjects = (await handle.emailQueue.getPending(10)).map((r) => r.subject)

    expect(subjects.sort()).toEqual(["due", "unscheduled"])
  })

  it("getPending 按 createdAt 升序返回（FIFO）", async () => {
    await insertQueueRow({ subject: "newer", createdAt: new Date(2026, 0, 2) })
    await insertQueueRow({ subject: "older", createdAt: new Date(2026, 0, 1) })

    const subjects = (await handle.emailQueue.getPending(10)).map((r) => r.subject)

    expect(subjects).toEqual(["older", "newer"])
  })

  it("markSent 移出待发送集合并记录 sentAt", async () => {
    const id = await handle.emailQueue.enqueue({ to: "a@b.c", subject: "s", html: "<p>h</p>" })

    await handle.emailQueue.markSent(id)

    expect(await handle.emailQueue.getPending(10)).toHaveLength(0)
    const { rows } = await handle.emailQueue.getHistory(10, 0)
    expect(rows[0]).toMatchObject({ id, status: "sent" })
    expect(rows[0]?.sentAt).toBeInstanceOf(Date)
  })

  it("markProcessing 移出待发送集合", async () => {
    const id = await handle.emailQueue.enqueue({ to: "a@b.c", subject: "s", html: "<p>h</p>" })

    await handle.emailQueue.markProcessing(id)

    expect(await handle.emailQueue.getPending(10)).toHaveLength(0)
  })

  it("markFailed 未达上限时退回 pending 并累加 attempts", async () => {
    const id = await handle.emailQueue.enqueue({
      to: "a@b.c",
      subject: "s",
      html: "<p>h</p>",
      maxAttempts: 3,
    })

    await handle.emailQueue.markFailed(id, "smtp down")

    const pending = await handle.emailQueue.getPending(10)
    expect(pending[0]).toMatchObject({ id, status: "pending", attempts: 1, lastError: "smtp down" })
  })

  it("markFailed 达到上限时置为 failed 并不再重试", async () => {
    const id = await handle.emailQueue.enqueue({
      to: "a@b.c",
      subject: "s",
      html: "<p>h</p>",
      maxAttempts: 1,
    })

    await handle.emailQueue.markFailed(id, "permanent")

    expect(await handle.emailQueue.getPending(10)).toHaveLength(0)
    const { rows } = await handle.emailQueue.getHistory(10, 0)
    expect(rows[0]).toMatchObject({ id, status: "failed", attempts: 1 })
  })

  it("getStats 按状态聚合出数字计数", async () => {
    await insertQueueRow({ status: "pending" })
    await insertQueueRow({ status: "pending" })
    await insertQueueRow({ status: "sent" })
    await insertQueueRow({ status: "failed" })

    expect(await handle.emailQueue.getStats()).toEqual({
      pending: 2,
      processing: 0,
      sent: 1,
      failed: 1,
    })
  })

  it("getHistory 按 createdAt 倒序分页并返回总数", async () => {
    await insertQueueRow({ subject: "first", createdAt: new Date(2026, 0, 1) })
    await insertQueueRow({ subject: "second", createdAt: new Date(2026, 0, 2) })
    await insertQueueRow({ subject: "third", createdAt: new Date(2026, 0, 3) })

    const page = await handle.emailQueue.getHistory(2, 0)

    expect(page.total).toBe(3)
    expect(page.rows.map((r) => r.subject)).toEqual(["third", "second"])

    const next = await handle.emailQueue.getHistory(2, 2)
    expect(next.rows.map((r) => r.subject)).toEqual(["first"])
    expect(next.total).toBe(3)
  })

  it("cleanupOld 只删除超期的已发送记录", async () => {
    const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
    await insertQueueRow({ subject: "old-sent", status: "sent", createdAt: old })
    await insertQueueRow({ subject: "old-failed", status: "failed", createdAt: old })
    await insertQueueRow({ subject: "recent-sent", status: "sent", createdAt: new Date() })

    expect(await handle.emailQueue.cleanupOld(30)).toBe(1)

    const remaining = (await handle.emailQueue.getHistory(10, 0)).rows.map((r) => r.subject)
    expect(remaining.sort()).toEqual(["old-failed", "recent-sent"])
  })
})

/** 直接写入审计行，用于控制 create 不暴露的 createdAt。 */
async function insertAuditRow(row: Record<string, unknown> = {}): Promise<void> {
  await handle.db.insert(tables.auditLog as never).values({
    userId: null,
    action: "action",
    resourceType: null,
    resourceId: null,
    details: null,
    ipAddress: null,
    userAgent: null,
    createdAt: new Date(),
    ...row,
  } as never)
}

describe("auditLog 查询层", () => {
  it("create 后 list 返回记录与总数", async () => {
    const id = await handle.auditLog.create({
      userId: "u-1",
      action: "user.delete",
      resourceType: "user",
      resourceId: "u-2",
    })

    const { rows, total } = await handle.auditLog.list({}, 50, 0)

    expect(total).toBe(1)
    expect(rows[0]).toMatchObject({ id, userId: "u-1", action: "user.delete" })
  })

  it("list 无筛选时按 createdAt 倒序分页，总数为全量", async () => {
    await insertAuditRow({ action: "first", createdAt: new Date(2026, 0, 1) })
    await insertAuditRow({ action: "second", createdAt: new Date(2026, 0, 2) })
    await insertAuditRow({ action: "third", createdAt: new Date(2026, 0, 3) })

    const page = await handle.auditLog.list({}, 2, 0)

    expect(page.total).toBe(3)
    expect(page.rows.map((r) => r.action)).toEqual(["third", "second"])
  })

  it("list 按 userId / action / resourceType 筛选并同步收敛总数", async () => {
    await insertAuditRow({ userId: "u-1", action: "login", resourceType: "session" })
    await insertAuditRow({ userId: "u-1", action: "user.delete", resourceType: "user" })
    await insertAuditRow({ userId: "u-2", action: "login", resourceType: "session" })

    const byUser = await handle.auditLog.list({ userId: "u-1" }, 50, 0)
    expect(byUser.total).toBe(2)

    const byAction = await handle.auditLog.list({ action: "login" }, 50, 0)
    expect(byAction.total).toBe(2)

    const byType = await handle.auditLog.list({ resourceType: "user" }, 50, 0)
    expect(byType.total).toBe(1)

    // 多条件为 AND 组合
    const combined = await handle.auditLog.list({ userId: "u-1", action: "login" }, 50, 0)
    expect(combined.total).toBe(1)
    expect(combined.rows[0]).toMatchObject({ userId: "u-1", action: "login" })
  })

  it("list 按时间区间筛选（含边界）", async () => {
    await insertAuditRow({ action: "jan", createdAt: new Date(2026, 0, 15) })
    await insertAuditRow({ action: "feb", createdAt: new Date(2026, 1, 15) })
    await insertAuditRow({ action: "mar", createdAt: new Date(2026, 2, 15) })

    const ranged = await handle.auditLog.list(
      { startDate: new Date(2026, 1, 1), endDate: new Date(2026, 1, 28) },
      50,
      0,
    )

    expect(ranged.total).toBe(1)
    expect(ranged.rows[0]?.action).toBe("feb")
  })

  it("getById 命中与未命中", async () => {
    const id = await handle.auditLog.create({ action: "login" })

    expect(await handle.auditLog.getById(id)).toMatchObject({ id, action: "login" })
    expect(await handle.auditLog.getById(id + 999)).toBeNull()
  })

  it("getRecentActions 按 createdAt 倒序限量返回", async () => {
    await insertAuditRow({ action: "older", createdAt: new Date(2026, 0, 1) })
    await insertAuditRow({ action: "newer", createdAt: new Date(2026, 0, 2) })

    const recent = await handle.auditLog.getRecentActions(1)

    expect(recent.map((r) => r.action)).toEqual(["newer"])
  })

  it("deleteOld 只删除超期记录并返回删除条数", async () => {
    await insertAuditRow({
      action: "stale",
      createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    })
    await insertAuditRow({ action: "fresh", createdAt: new Date() })

    expect(await handle.auditLog.deleteOld(90)).toBe(1)

    const { rows } = await handle.auditLog.list({}, 50, 0)
    expect(rows.map((r) => r.action)).toEqual(["fresh"])
  })
})

describe("users 查询层", () => {
  async function insertUser(id: string, role: string | null = null): Promise<void> {
    const now = new Date()
    await handle.db.insert((buildTables("sqlite") as { user: unknown }).user as never).values({
      id,
      name: id,
      email: `${id}@example.com`,
      emailVerified: false,
      role,
      createdAt: now,
      updatedAt: now,
    } as never)
  }

  it("getAll 返回数字总数（而非 NaN）并支持分页", async () => {
    await insertUser("u-1")
    await insertUser("u-2")
    await insertUser("u-3")

    const page = await handle.users.getAll(2, 0)

    expect(page.total).toBe(3)
    expect(page.rows).toHaveLength(2)
  })

  it("countAdmins 按逗号分隔角色识别管理员", async () => {
    await insertUser("plain", "user")
    await insertUser("admin-only", "admin")
    await insertUser("multi", "user,admin")
    await insertUser("no-role", null)

    expect(await handle.users.countAdmins()).toBe(2)
  })
})
