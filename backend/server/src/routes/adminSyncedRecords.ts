import { Hono } from "hono"
import type { Context } from "hono"

import type { DbHandle } from "../db"

const RECORD_TYPES = ["workspace", "pluginInstance", "plugin", "pluginData"] as const

function parseListQuery(c: Context) {
  const rawType = c.req.query("type")
  const type = rawType && RECORD_TYPES.includes(rawType as never) ? rawType : undefined
  const rawDeleted = c.req.query("deleted")
  const deleted = rawDeleted === "true" ? true : rawDeleted === "false" ? false : undefined
  const rawSearch = c.req.query("search")
  const search = rawSearch ? rawSearch : undefined
  const limit = Math.min(Number(c.req.query("limit") ?? 50) || 50, 200)
  const offset = Math.max(Number(c.req.query("offset") ?? 0) || 0, 0)
  return { type, deleted, search, limit, offset }
}

/**
 * 管理员专用：跨 owner 巡检同步记录。
 * 返回子 app，调用方挂载时套用 requireAdmin 中间件。
 */
export function createSyncedRecordRoutes(handle: DbHandle) {
  const app = new Hono()
  const queries = handle.syncedRecords

  app.get("/", async (c) => {
    const { rows, total } = await queries.list(parseListQuery(c))
    return c.json({ records: rows, total })
  })

  app.get("/stats", async (c) => {
    const [byType, tombstones] = await Promise.all([
      queries.countsByType(),
      queries.countTombstones(),
    ])
    const total = Object.values(byType).reduce((sum, n) => sum + n, 0)
    return c.json({ byType, tombstones, total })
  })

  app.delete("/:id", async (c) => {
    await queries.remove(c.req.param("id"))
    return c.body(null, 204)
  })

  return app
}
