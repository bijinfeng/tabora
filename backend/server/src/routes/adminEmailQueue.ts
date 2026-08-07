import { Hono } from "hono"

import type { DbHandle } from "../db"
import type { SyncEnv } from "../userGuard"

/**
 * 管理端邮件队列路由：查看发送历史、重试失败邮件、清理旧记录
 */
export function createAdminEmailQueueRoutes(handle: DbHandle) {
  const app = new Hono<SyncEnv>()

  // 获取邮件发送历史（分页）
  app.get("/", async (c) => {
    const limit = Number(c.req.query("limit")) || 50
    const offset = Number(c.req.query("offset")) || 0
    const { rows, total } = await handle.emailQueue.getHistory(limit, offset)
    return c.json({ data: { rows, total, limit, offset } })
  })

  // 清理已发送的旧邮件记录（保留最近 N 天）
  app.post("/cleanup", async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const daysToKeep = body.daysToKeep || 30
    const deleted = await handle.emailQueue.cleanupOld(daysToKeep)
    return c.json({ data: { deleted } })
  })

  return app
}
