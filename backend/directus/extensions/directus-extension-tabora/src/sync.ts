import { z } from "zod"
import { asyncRoute, parseBody, requireUserId } from "./http"
import { findSensitiveFieldPath } from "./syncSensitiveFilter"
import type { SyncedRecordRow, TaboraDatabase, TaboraEndpointContext, TaboraRouter } from "./types"

const RECORD_TYPES = ["workspace", "pluginInstance", "plugin", "pluginData"] as const
const MAX_PUSH_BATCH = 100
const MAX_PULL_LIMIT = 1000

const pushRecordSchema = z.object({
  type: z.enum(RECORD_TYPES),
  id: z.string().min(1).max(255),
  data: z.unknown().nullable(),
  version: z.number().int().positive().nullable(),
  client_timestamp: z.iso.datetime(),
  device_id: z.string().min(1).max(255),
  deleted: z.boolean(),
})

const pushBodySchema = z.array(pushRecordSchema).min(1).max(MAX_PUSH_BATCH)

const pullQuerySchema = z.object({
  since: z.iso.datetime().optional(),
  types: z
    .string()
    .transform((value) => value.split(","))
    .pipe(z.array(z.enum(RECORD_TYPES)))
    .optional(),
})

type PushRecord = z.output<typeof pushRecordSchema>

/**
 * 归一化时间戳比较：raw knex + pg 对 timestamp 列返回 JS Date 对象，
 * 而客户端提交与内存测试库中是 ISO 字符串，统一转 epoch 毫秒再比较。
 */
function toEpochMs(value: string | Date): number {
  return value instanceof Date ? value.getTime() : Date.parse(value)
}

function toResponseRecord(row: SyncedRecordRow) {
  return {
    type: row.record_type,
    id: row.record_id,
    data: row.deleted ? null : row.data,
    version: row.version,
    updated_at: new Date(row.record_updated_at).toISOString(),
    deleted: row.deleted,
    device_id: row.device_id,
  }
}

function isConflict(row: SyncedRecordRow, record: PushRecord): boolean {
  if (record.version !== null && record.version !== row.version) {
    return true
  }

  return toEpochMs(record.client_timestamp) <= toEpochMs(row.record_updated_at)
}

/**
 * 测试用内存 DB 只支持等值 where，故 since/types/limit 目前在应用层过滤；
 * 生产量级需把过滤与 LIMIT 下推到 SQL（配合 (user_id, record_updated_at) 索引），
 * 留待接入真实 Postgres 集成测试时处理。
 */
async function readUserRecords(
  database: TaboraDatabase,
  userId: string,
): Promise<SyncedRecordRow[]> {
  return (await database
    .select("*")
    .from("synced_records")
    .where({ user_id: userId })
    .orderBy("record_updated_at", "asc")) as SyncedRecordRow[]
}

export function registerSyncEndpoints(router: TaboraRouter, context: TaboraEndpointContext): void {
  router.get(
    "/sync/records",
    asyncRoute(async (request, response) => {
      const userId = requireUserId(request)
      const query = parseBody(pullQuerySchema, request.query ?? {})

      let rows = await readUserRecords(context.database, userId)

      if (query.since) {
        const sinceMs = toEpochMs(query.since)
        rows = rows.filter((row) => toEpochMs(row.record_updated_at) > sinceMs)
      }

      if (query.types) {
        const types = query.types
        rows = rows.filter((row) =>
          types.includes(row.record_type as (typeof RECORD_TYPES)[number]),
        )
      }

      const records = rows.slice(0, MAX_PULL_LIMIT).map(toResponseRecord)

      return response.json({
        data: {
          records,
          server_time: new Date().toISOString(),
        },
      })
    }),
  )

  router.post(
    "/sync/records",
    asyncRoute(async (request, response) => {
      const userId = requireUserId(request)
      const records = parseBody(pushBodySchema, request.body)

      const accepted: string[] = []
      const conflicts: Array<{
        type: string
        id: string
        server_version: number
        server_data: unknown
        server_updated_at: string
        server_device_id: string
      }> = []
      const rejected: Array<{ id: string; reason: string }> = []

      await context.database.transaction(async (transaction) => {
        for (const record of records) {
          const sensitivePath = findSensitiveFieldPath(record.data)
          if (sensitivePath !== null) {
            rejected.push({ id: record.id, reason: `sensitive field: ${sensitivePath}` })
            continue
          }

          const row = (await transaction("synced_records")
            .where({ user_id: userId, record_type: record.type, record_id: record.id })
            .forUpdate()
            .first()) as SyncedRecordRow | undefined

          if (row && isConflict(row, record)) {
            conflicts.push({
              type: record.type,
              id: record.id,
              server_version: row.version,
              server_data: row.data,
              server_updated_at: new Date(row.record_updated_at).toISOString(),
              server_device_id: row.device_id,
            })
            continue
          }

          const now = new Date().toISOString()
          const payload = {
            user_id: userId,
            device_id: record.device_id,
            record_type: record.type,
            record_id: record.id,
            data: record.deleted ? null : record.data,
            version: (row?.version ?? 0) + 1,
            record_updated_at: now,
            deleted: record.deleted,
          }

          if (row) {
            await transaction("synced_records").where({ id: row.id }).update(payload)
          } else {
            await transaction("synced_records").insert(payload)
          }

          accepted.push(record.id)
        }
      })

      return response.json({
        data: {
          accepted,
          conflicts,
          rejected,
          server_time: new Date().toISOString(),
        },
      })
    }),
  )
}
