import type { Core } from "@strapi/strapi"
import { z } from "zod"
import { findSensitiveFieldPath } from "../../../utils/sensitiveFilter"
import {
  MAX_PUSH_BATCH,
  MAX_PULL_LIMIT,
  RECORD_TYPES,
  type RecordType,
  type SyncedRecordRow,
  isConflict,
  toEpochMs,
  toResponseRecord,
} from "../services/sync"

const UID = "api::synced-record.synced-record"

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

type PushRecord = z.output<typeof pushRecordSchema>

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async pull(ctx: any) {
    const userId = ctx.state.user?.id
    if (!userId) return ctx.unauthorized()

    const since = typeof ctx.query.since === "string" ? ctx.query.since : undefined
    const rawTypes = typeof ctx.query.types === "string" ? ctx.query.types : undefined
    const types = rawTypes
      ? rawTypes
          .split(",")
          .filter((t: string): t is RecordType => RECORD_TYPES.includes(t as RecordType))
      : undefined

    let rows = (await strapi.db.query(UID).findMany({
      where: { owner: userId },
      orderBy: { record_updated_at: "asc" },
    })) as SyncedRecordRow[]

    if (since) {
      const sinceMs = toEpochMs(since)
      rows = rows.filter((r) => toEpochMs(r.record_updated_at) > sinceMs)
    }
    if (types && types.length > 0) {
      rows = rows.filter((r) => types.includes(r.record_type as RecordType))
    }

    ctx.body = {
      data: {
        records: rows.slice(0, MAX_PULL_LIMIT).map(toResponseRecord),
        server_time: new Date().toISOString(),
      },
    }
  },

  async push(ctx: any) {
    const userId = ctx.state.user?.id
    if (!userId) return ctx.unauthorized()

    const parsed = pushBodySchema.safeParse(ctx.request.body)
    if (!parsed.success) return ctx.badRequest("invalid payload", parsed.error.issues)
    const records = parsed.data

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

    await strapi.db.transaction(async () => {
      for (const record of records as PushRecord[]) {
        const sensitivePath = findSensitiveFieldPath(record.data)
        if (sensitivePath !== null) {
          rejected.push({ id: record.id, reason: `sensitive field: ${sensitivePath}` })
          continue
        }

        const row = (await strapi.db.query(UID).findOne({
          where: { owner: userId, record_type: record.type, record_id: record.id },
        })) as SyncedRecordRow | null

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
          owner: userId,
          device_id: record.device_id,
          record_type: record.type,
          record_id: record.id,
          data: record.deleted ? null : record.data,
          version: (row?.version ?? 0) + 1,
          record_updated_at: now,
          deleted: record.deleted,
        }

        if (row) {
          await strapi.db.query(UID).update({ where: { id: row.id }, data: payload })
        } else {
          await strapi.db.query(UID).create({ data: payload })
        }

        accepted.push(record.id)
      }
    })

    ctx.body = {
      data: { accepted, conflicts, rejected, server_time: new Date().toISOString() },
    }
  },
})

export default controller
