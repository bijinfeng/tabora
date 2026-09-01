import { randomUUID } from "node:crypto"

import type { DbHandle } from "./db"
import type { OwnedRow } from "./db/syncedRecords"
import { findSensitiveFieldPath } from "./sync/sensitiveFilter"

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

export type PushResult =
  | { status: 400; body: { error: { message: string } } }
  | {
      status: 200
      body: {
        data: {
          accepted: string[]
          conflicts: Array<Record<string, unknown>>
          rejected: Array<{ id: string; reason: string }>
          server_time: string
        }
      }
    }

/** 处理批量推送：owner 隔离，敏感字段过滤，state-based LWW 冲突判定。 */
export async function pushSyncRecords(
  handle: DbHandle,
  userId: string,
  body: unknown,
): Promise<PushResult> {
  const q = handle.syncedRecords
  if (!Array.isArray(body) || body.length === 0 || body.length > MAX_PUSH_BATCH) {
    return { status: 400, body: { error: { message: "invalid payload" } } }
  }

  const accepted: string[] = []
  const conflicts: Array<Record<string, unknown>> = []
  const rejected: Array<{ id: string; reason: string }> = []

  for (const raw of body) {
    if (!validPushRecord(raw)) {
      const rawId = (raw as { id?: unknown })?.id
      rejected.push({ id: typeof rawId === "string" ? rawId : "?", reason: "invalid record" })
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

  return {
    status: 200,
    body: { data: { accepted, conflicts, rejected, server_time: new Date().toISOString() } },
  }
}

/** 增量拉取：owner 隔离，按 since 过滤。 */
export async function pullSyncRecords(handle: DbHandle, userId: string, since: string | null) {
  const sinceMs = since ? toEpochMs(since) : null
  const rows = await handle.syncedRecords.pullOwnedSince(userId, sinceMs, MAX_PULL_LIMIT)
  return { data: { records: rows.map(toPullRecord), server_time: new Date().toISOString() } }
}
