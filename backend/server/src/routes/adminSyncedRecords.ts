import type { FastifyInstance, preHandlerHookHandler } from "fastify"

import type { DbHandle } from "../db"

const RECORD_TYPES = ["workspace", "pluginInstance", "plugin", "pluginData"] as const

type Options = {
  handle: DbHandle
  requireAdmin: preHandlerHookHandler
}

function parseListQuery(query: Record<string, unknown>) {
  const type =
    typeof query.type === "string" && RECORD_TYPES.includes(query.type as never)
      ? (query.type as string)
      : undefined
  const deleted = query.deleted === "true" ? true : query.deleted === "false" ? false : undefined
  const search = typeof query.search === "string" && query.search ? query.search : undefined
  const limit = Math.min(Number(query.limit ?? 50) || 50, 200)
  const offset = Math.max(Number(query.offset ?? 0) || 0, 0)
  return { type, deleted, search, limit, offset }
}

/** 管理员专用：跨 owner 巡检同步记录。全部经 requireAdmin 守卫。 */
export async function adminSyncedRecordRoutes(app: FastifyInstance, options: Options) {
  const { handle, requireAdmin } = options
  const queries = handle.syncedRecords

  app.get("/admin-api/synced-records", { preHandler: requireAdmin }, async (request) => {
    const params = parseListQuery(request.query as Record<string, unknown>)
    const { rows, total } = await queries.list(params)
    return { records: rows, total }
  })

  app.get("/admin-api/synced-records/stats", { preHandler: requireAdmin }, async () => {
    const [byType, tombstones] = await Promise.all([
      queries.countsByType(),
      queries.countTombstones(),
    ])
    const total = Object.values(byType).reduce((sum, n) => sum + n, 0)
    return { byType, tombstones, total }
  })

  app.delete<{ Params: { id: string } }>(
    "/admin-api/synced-records/:id",
    { preHandler: requireAdmin },
    async (request, reply) => {
      await queries.remove(request.params.id)
      return reply.code(204).send()
    },
  )
}
