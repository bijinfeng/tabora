import { randomUUID } from "node:crypto"

import { Hono } from "hono"

import type { DbHandle } from "../db"
import type { OwnedRow } from "../db/syncedRecords"
import { findSensitiveFieldPath } from "../sync/sensitiveFilter"
import type { SyncEnv } from "../userGuard"

const RECORD_TYPES = ["workspace", "pluginInstance", "plugin", "pluginData"] as const
const MAX_PUSH_BATCH = 100
const MAX_PULL_LIMIT = 1000

type PushRecord = {
  type: string
  id: string
  data: unknown
  version: number | null
  client_timestamp: string
  device_id: string
  deleted: boolean
}

function toEpochMs(value: string | Date): number {
  return value instanceof Date ? value.getTime() : Date.parse(value)
}

function isConflict(row: OwnedRow, record: PushRecord): boolean {
  if (record.version !== null && record.version !== row.version) return true
  return toEpochMs(record.client_timestamp) <= toEpochMs(row.recordUpdatedAt)
}

function validPushRecord(v: unknown): v is PushRecord {
  if (typeof v !== "object" || v === null) return false
  const r = v as Record<string, unknown>
  return (
    RECORD_TYPES.includes(r.type as never) &&
    typeof r.id === "string" &&
    r.id.length > 0 &&
    typeof r.client_timestamp === "string" &&
    typeof r.device_id === "string" &&
    typeof r.deleted === "boolean"
  )
}

function toPullRecord(row: OwnedRow) {
  return {
    type: row.recordType,
    id: row.recordId,
    data: row.deleted ? null : row.data,
    version: row.version,
    updated_at: new Date(row.recordUpdatedAt).toISOString(),
    deleted: row.deleted,
    device_id: row.deviceId,
  }
}
/** 客户端同步端点：POST 推送、GET 增量拉取。owner 隔离，state-based LWW。 */
export function createSyncRecordRoutes(handle: DbHandle) {
  const app = new Hono<SyncEnv>()
  const q = handle.syncedRecords

  app.post("/records", async (c) => {
    const userId = c.get("userId")
    const body = (await c.req.json().catch(() => null)) as unknown
    if (!Array.isArray(body) || body.length === 0 || body.length > MAX_PUSH_BATCH) {
      return c.json({ error: { message: "invalid payload" } }, 400)
    }

    const accepted: string[] = []
    const conflicts: Array<Record<string, unknown>> = []
    const rejected: Array<{ id: string; reason: string }> = []

    for (const raw of body) {
      if (!validPushRecord(raw)) {
        const rawId = (raw as { id?: unknown })?.id
        rejected.push({
          id: typeof rawId === "string" ? rawId : "?",
          reason: "invalid record",
        })
        continue
      }
      const record = raw
      const sensitive = findSensitiveFieldPath(record.data)
      if (sensitive !== null) {
        rejected.push({ id: record.id, reason: `sensitive field: ${sensitive}` })
        continue
      }

      const existing = await q.findOwned(userId, record.type, record.id)
      if (existing && isConflict(existing, record)) {
        conflicts.push({
          type: record.type,
          id: record.id,
          server_version: existing.version,
          server_data: existing.deleted ? null : existing.data,
          server_updated_at: new Date(existing.recordUpdatedAt).toISOString(),
          server_device_id: existing.deviceId,
        })
        continue
      }

      await q.upsertOwned({
        id: existing?.id ?? randomUUID(),
        ownerId: userId,
        recordType: record.type,
        recordId: record.id,
        data: record.data,
        version: (existing?.version ?? 0) + 1,
        deviceId: record.device_id,
        deleted: record.deleted,
        recordUpdatedAt: new Date(),
      })
      accepted.push(record.id)
    }

    return c.json({
      data: { accepted, conflicts, rejected, server_time: new Date().toISOString() },
    })
  })

  app.get("/records", async (c) => {
    const userId = c.get("userId")
    const since = c.req.query("since")
    const sinceMs = since ? toEpochMs(since) : null
    const rows = await q.pullOwnedSince(userId, sinceMs, MAX_PULL_LIMIT)
    return c.json({
      data: { records: rows.map(toPullRecord), server_time: new Date().toISOString() },
    })
  })

  return app
}
