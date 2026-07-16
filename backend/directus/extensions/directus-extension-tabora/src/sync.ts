import { z } from "zod"
import { asyncRoute, parseBody, requireUserId } from "./http"
import { findSensitiveFieldPath } from "./syncSensitiveFilter"
import type { SyncedRecordRow, TaboraDatabase, TaboraEndpointContext, TaboraRouter } from "./types"

const RECORD_TYPES = ["note", "workspace_settings", "plugin_data"] as const
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

function toResponseRecord(row: SyncedRecordRow) {
  return {
    type: row.record_type,
    id: row.record_id,
    data: row.deleted ? null : row.data,
    version: row.version,
    updated_at: row.record_updated_at,
    deleted: row.deleted,
    device_id: row.device_id,
  }
}

function isConflict(row: SyncedRecordRow, record: PushRecord): boolean {
  if (record.version !== null && record.version !== row.version) {
    return true
  }

  return record.client_timestamp <= row.record_updated_at
}

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
        const since = query.since
        rows = rows.filter((row) => row.record_updated_at > since)
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
              server_updated_at: row.record_updated_at,
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
