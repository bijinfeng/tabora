import { describe, it, expect } from "vitest"
import {
  isConflict,
  toEpochMs,
  toResponseRecord,
  type SyncedRecordRow,
} from "../src/api/sync/services/sync"

const base: SyncedRecordRow = {
  id: 1,
  record_type: "workspace",
  record_id: "w1",
  data: { a: 1 },
  version: 3,
  device_id: "dev-1",
  record_updated_at: "2026-07-27T00:00:00.000Z",
  deleted: false,
}

describe("sync service 纯函数", () => {
  it("version 不一致 → 冲突", () => {
    expect(isConflict(base, { version: 2, client_timestamp: "2026-07-28T00:00:00.000Z" })).toBe(
      true,
    )
  })
  it("client_timestamp 不晚于服务端 → 冲突", () => {
    expect(isConflict(base, { version: null, client_timestamp: "2026-07-26T00:00:00.000Z" })).toBe(
      true,
    )
  })
  it("version null 且时间更新 → 不冲突", () => {
    expect(isConflict(base, { version: null, client_timestamp: "2026-07-28T00:00:00.000Z" })).toBe(
      false,
    )
  })
  it("toResponseRecord: deleted 时 data 为 null", () => {
    expect(toResponseRecord({ ...base, deleted: true }).data).toBeNull()
  })
  it("toEpochMs 兼容 Date 与字符串", () => {
    expect(toEpochMs(new Date("2026-07-27T00:00:00Z"))).toBe(toEpochMs("2026-07-27T00:00:00Z"))
  })
})
