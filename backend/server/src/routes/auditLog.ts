import { Hono } from "hono"

import type { DbHandle } from "../db"
import type { SyncEnv } from "../userGuard"

type Options = { handle: DbHandle }

/**
 * 审计日志端点：查询、筛选、删除旧记录
 */
export function createAuditLogRoutes(options: Options) {
  const { handle } = options
  const app = new Hono<SyncEnv>()

  // GET /admin-api/audit-log - 查询日志（支持筛选）
  app.get("/", async (c) => {
    const url = new URL(c.req.url)
    const userId = url.searchParams.get("userId") || undefined
    const action = url.searchParams.get("action") || undefined
    const resourceType = url.searchParams.get("resourceType") || undefined
    const startDate = url.searchParams.get("startDate")
      ? new Date(url.searchParams.get("startDate")!)
      : undefined
    const endDate = url.searchParams.get("endDate")
      ? new Date(url.searchParams.get("endDate")!)
      : undefined
    const limit = Number(url.searchParams.get("limit") || "50")
    const offset = Number(url.searchParams.get("offset") || "0")

    const result = await handle.auditLog.list(
      {
        userId: userId ?? null,
        action: action ?? null,
        resourceType: resourceType ?? null,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      },
      limit,
      offset,
    )

    return c.json({
      data: result.rows,
      meta: { total: result.total, limit, offset },
    })
  })

  // GET /admin-api/audit-log/:id - 获取单条日志详情
  app.get("/:id", async (c) => {
    const id = Number(c.req.param("id"))
    const log = await handle.auditLog.getById(id)

    if (!log) {
      return c.json({ error: { message: "日志不存在" } }, 404)
    }

    return c.json({ data: log })
  })

  // GET /admin-api/audit-log/recent - 获取最近操作
  app.get("/recent", async (c) => {
    const limit = Number(new URL(c.req.url).searchParams.get("limit") || "10")
    const logs = await handle.auditLog.getRecentActions(limit)
    return c.json({ data: logs })
  })

  // DELETE /admin-api/audit-log/cleanup - 删除旧日志
  app.delete("/cleanup", async (c) => {
    const url = new URL(c.req.url)
    const daysToKeep = Number(url.searchParams.get("daysToKeep") || "90")
    const deleted = await handle.auditLog.deleteOld(daysToKeep)
    return c.json({ data: { deleted } })
  })

  return app
}
