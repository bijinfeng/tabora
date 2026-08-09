import { beforeEach, describe, expect, it } from "vitest"

import { createSqliteDb } from "./db/sqlite"
import { buildTables } from "./db/schemaFactory"
import { pullSyncRecords, pushSyncRecords } from "./syncRecords"

type Handle = ReturnType<typeof createSqliteDb>

const userTable = (buildTables("sqlite") as { user: unknown }).user

/** 直接写入 user 行以满足 syncedRecord.ownerId 外键约束（生产由 better-auth 创建）。 */
async function seedUser(handle: Handle, id: string): Promise<void> {
  const now = new Date()
  await handle.db.insert(userTable as never).values({
    id,
    name: id,
    email: `${id}@example.com`,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  } as never)
}

function makeRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    type: "workspace",
    id: "rec-1",
    data: { title: "hello" },
    version: null,
    client_timestamp: new Date().toISOString(),
    device_id: "device-a",
    deleted: false,
    ...overrides,
  }
}

describe("pushSyncRecords / pullSyncRecords", () => {
  let handle: Handle

  beforeEach(async () => {
    handle = createSqliteDb(":memory:")
    handle.migrate()
    await seedUser(handle, "user-1")
    await seedUser(handle, "user-2")
  })

  it("接受合法记录并可增量拉取", async () => {
    const res = await pushSyncRecords(handle, "user-1", [makeRecord()])
    expect(res.status).toBe(200)
    if (res.status !== 200) return
    expect(res.body.data.accepted).toEqual(["rec-1"])

    const pulled = await pullSyncRecords(handle, "user-1", null)
    expect(pulled.data.records).toHaveLength(1)
    expect(pulled.data.records[0]).toMatchObject({ type: "workspace", id: "rec-1", version: 1 })
  })

  it("非数组或超限批次返回 400", async () => {
    const empty = await pushSyncRecords(handle, "user-1", [])
    expect(empty.status).toBe(400)
    const notArray = await pushSyncRecords(handle, "user-1", { nope: true })
    expect(notArray.status).toBe(400)
  })

  it("拒绝含敏感字段的记录", async () => {
    const res = await pushSyncRecords(handle, "user-1", [
      makeRecord({ data: { token: "leak-me" } }),
    ])
    expect(res.status).toBe(200)
    if (res.status !== 200) return
    expect(res.body.data.accepted).toEqual([])
    expect(res.body.data.rejected[0]?.reason).toContain("sensitive")
  })

  it("按 owner 隔离：不同用户互不可见", async () => {
    await pushSyncRecords(handle, "user-1", [makeRecord({ id: "owned-by-1" })])
    const other = await pullSyncRecords(handle, "user-2", null)
    expect(other.data.records).toHaveLength(0)
  })

  it("旧时间戳写入触发冲突而非覆盖", async () => {
    await pushSyncRecords(handle, "user-1", [
      makeRecord({ client_timestamp: new Date(Date.now()).toISOString() }),
    ])
    const stale = await pushSyncRecords(handle, "user-1", [
      makeRecord({ client_timestamp: new Date(Date.now() - 60_000).toISOString(), version: 1 }),
    ])
    expect(stale.status).toBe(200)
    if (stale.status !== 200) return
    expect(stale.body.data.accepted).toEqual([])
    expect(stale.body.data.conflicts).toHaveLength(1)
    expect(stale.body.data.conflicts[0]).toMatchObject({ id: "rec-1", server_version: 1 })
  })

  it("tombstone 删除通过 pull 传播", async () => {
    await pushSyncRecords(handle, "user-1", [makeRecord()])
    await pushSyncRecords(handle, "user-1", [
      makeRecord({ deleted: true, client_timestamp: new Date(Date.now() + 1000).toISOString() }),
    ])
    const pulled = await pullSyncRecords(handle, "user-1", null)
    expect(pulled.data.records[0]).toMatchObject({ id: "rec-1", deleted: true, data: null })
  })
})
