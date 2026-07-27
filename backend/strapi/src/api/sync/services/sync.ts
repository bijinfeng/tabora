export const RECORD_TYPES = ["workspace", "pluginInstance", "plugin", "pluginData"] as const
export const MAX_PUSH_BATCH = 100
export const MAX_PULL_LIMIT = 1000

export type RecordType = (typeof RECORD_TYPES)[number]

export type SyncedRecordRow = {
  id: number
  record_type: string
  record_id: string
  data: unknown
  version: number
  device_id: string
  record_updated_at: string | Date
  deleted: boolean
}

/**
 * 归一化时间戳比较：raw knex + pg 对 timestamp 列返回 JS Date 对象，
 * 而客户端提交与内存测试库中是 ISO 字符串，统一转 epoch 毫秒再比较。
 */
export function toEpochMs(value: string | Date): number {
  return value instanceof Date ? value.getTime() : Date.parse(value)
}

export function toResponseRecord(row: SyncedRecordRow) {
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

export function isConflict(
  row: SyncedRecordRow,
  record: { version: number | null; client_timestamp: string },
): boolean {
  if (record.version !== null && record.version !== row.version) return true
  return toEpochMs(record.client_timestamp) <= toEpochMs(row.record_updated_at)
}

export default () => ({ toEpochMs, isConflict, toResponseRecord })
