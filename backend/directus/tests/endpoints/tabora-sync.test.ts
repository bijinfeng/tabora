import { describe, expect, it, vi } from "vitest"
import {
  createContext,
  createDatabase,
  createResponse,
  createRouter,
  findRoute,
  firstForwardedError,
  registerExtension,
} from "./tabora-test-kit"

const T_EARLY = "2026-07-16T05:00:00.000Z"
const T_MID = "2026-07-16T05:30:00.000Z"
const T_LATE = "2026-07-16T06:00:00.000Z"

type SyncedRecordRow = {
  user_id: string
  device_id: string
  record_type: string
  record_id: string
  data: unknown
  version: number
  record_updated_at: string
  deleted: boolean
}

function syncedRecord(overrides: Partial<SyncedRecordRow> = {}): SyncedRecordRow {
  return {
    user_id: "user-1",
    device_id: "device-a",
    record_type: "note",
    record_id: "note-1",
    data: { title: "hello" },
    version: 1,
    record_updated_at: T_EARLY,
    deleted: false,
    ...overrides,
  }
}

function pushRecord(overrides: Record<string, unknown> = {}) {
  return {
    type: "note",
    id: "note-1",
    data: { title: "hello" },
    version: null,
    client_timestamp: T_LATE,
    device_id: "device-a",
    deleted: false,
    ...overrides,
  }
}

async function registerSync(database?: ReturnType<typeof createDatabase>) {
  const router = createRouter()
  const { context } = createContext(database ? { database } : undefined)
  await registerExtension(router, context)
  return { router, context }
}

describe("tabora sync endpoints", () => {
  it("注册 pull 与 push 同步路由", async () => {
    const { router } = await registerSync()

    expect(router.routes.map(({ method, path }) => `${method}:${path}`)).toEqual(
      expect.arrayContaining(["get:/sync/records", "post:/sync/records"]),
    )
  })

  // ---------------------------------------------------------------------------
  // Pull: GET /sync/records
  // ---------------------------------------------------------------------------

  it("pull 未登录时抛 InvalidCredentialsError", async () => {
    const { router } = await registerSync()
    const next = vi.fn()

    await findRoute(router.routes, "get", "/sync/records").handler(
      { accountability: {}, query: {} },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("INVALID_CREDENTIALS")
  })

  it("pull 返回当前用户全部记录并正确映射（deleted 记录 data 为 null）", async () => {
    const database = createDatabase({
      synced_records: [
        syncedRecord({
          record_type: "note",
          record_id: "note-1",
          data: { title: "keep" },
          version: 1,
          record_updated_at: T_EARLY,
          deleted: false,
          device_id: "device-a",
        }),
        syncedRecord({
          record_type: "note",
          record_id: "note-2",
          data: { title: "gone" },
          version: 2,
          record_updated_at: T_LATE,
          deleted: true,
          device_id: "device-b",
        }),
      ],
    })
    const { router } = await registerSync(database)
    const response = createResponse()

    await findRoute(router.routes, "get", "/sync/records").handler(
      { accountability: { user: "user-1" }, query: {} },
      response,
      vi.fn(),
    )

    const body = response.body as { data: { records: any[]; server_time: unknown } }
    expect(body.data.records).toHaveLength(2)
    expect(body.data.records[0]).toEqual(
      expect.objectContaining({
        type: "note",
        id: "note-1",
        data: { title: "keep" },
        version: 1,
        updated_at: T_EARLY,
        deleted: false,
        device_id: "device-a",
      }),
    )

    const tombstone = body.data.records.find((record) => record.id === "note-2")
    expect(tombstone).toEqual(expect.objectContaining({ id: "note-2", deleted: true, data: null }))
    expect(typeof body.data.server_time).toBe("string")
  })

  it("pull 通过 since 只返回更新过的记录", async () => {
    const database = createDatabase({
      synced_records: [
        syncedRecord({ record_id: "note-old", record_updated_at: T_EARLY }),
        syncedRecord({ record_id: "note-new", record_updated_at: T_LATE }),
      ],
    })
    const { router } = await registerSync(database)
    const response = createResponse()

    await findRoute(router.routes, "get", "/sync/records").handler(
      { accountability: { user: "user-1" }, query: { since: T_MID } },
      response,
      vi.fn(),
    )

    const body = response.body as { data: { records: any[] } }
    expect(body.data.records.map((record) => record.id)).toEqual(["note-new"])
  })

  it("pull 通过 types 过滤 record_type", async () => {
    const database = createDatabase({
      synced_records: [
        syncedRecord({ record_type: "note", record_id: "note-1" }),
        syncedRecord({ record_type: "workspace_settings", record_id: "ws-1" }),
        syncedRecord({ record_type: "plugin_data", record_id: "plugin-1" }),
      ],
    })
    const { router } = await registerSync(database)
    const response = createResponse()

    await findRoute(router.routes, "get", "/sync/records").handler(
      { accountability: { user: "user-1" }, query: { types: "note,plugin_data" } },
      response,
      vi.fn(),
    )

    const body = response.body as { data: { records: any[] } }
    expect(
      body.data.records
        .map((record) => record.type)
        .sort((left, right) => left.localeCompare(right)),
    ).toEqual(["note", "plugin_data"])
  })

  it("pull 不返回其他用户的记录", async () => {
    const database = createDatabase({
      synced_records: [
        syncedRecord({ user_id: "user-1", record_id: "mine" }),
        syncedRecord({ user_id: "user-2", record_id: "theirs" }),
      ],
    })
    const { router } = await registerSync(database)
    const response = createResponse()

    await findRoute(router.routes, "get", "/sync/records").handler(
      { accountability: { user: "user-1" }, query: {} },
      response,
      vi.fn(),
    )

    const body = response.body as { data: { records: any[] } }
    expect(body.data.records.map((record) => record.id)).toEqual(["mine"])
  })

  it("pull 拒绝非法的 since 参数", async () => {
    const { router } = await registerSync()
    const next = vi.fn()

    await findRoute(router.routes, "get", "/sync/records").handler(
      { accountability: { user: "user-1" }, query: { since: "not-a-date" } },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("INVALID_PAYLOAD")
  })

  // ---------------------------------------------------------------------------
  // Push: POST /sync/records
  // ---------------------------------------------------------------------------

  it("push 未登录时抛 InvalidCredentialsError", async () => {
    const { router } = await registerSync()
    const next = vi.fn()

    await findRoute(router.routes, "post", "/sync/records").handler(
      { accountability: {}, body: [pushRecord()] },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("INVALID_CREDENTIALS")
  })

  it("push 插入新记录（version=1）", async () => {
    const database = createDatabase({ synced_records: [] })
    const { router } = await registerSync(database)
    const response = createResponse()

    await findRoute(router.routes, "post", "/sync/records").handler(
      {
        accountability: { user: "user-1" },
        body: [pushRecord({ id: "note-new", version: null })],
      },
      response,
      vi.fn(),
    )

    const body = response.body as { data: { accepted: string[] } }
    expect(body.data.accepted).toContain("note-new")

    const rows = database.__state.synced_records as any[]
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual(
      expect.objectContaining({
        record_id: "note-new",
        user_id: "user-1",
        version: 1,
        deleted: false,
      }),
    )
  })

  it("push 更新已存在记录（version+1）", async () => {
    const database = createDatabase({
      synced_records: [
        syncedRecord({ record_id: "note-1", version: 2, record_updated_at: T_EARLY }),
      ],
    })
    const { router } = await registerSync(database)
    const response = createResponse()

    await findRoute(router.routes, "post", "/sync/records").handler(
      {
        accountability: { user: "user-1" },
        body: [pushRecord({ id: "note-1", version: 2, client_timestamp: T_LATE })],
      },
      response,
      vi.fn(),
    )

    const body = response.body as { data: { accepted: string[] } }
    expect(body.data.accepted).toContain("note-1")

    const rows = database.__state.synced_records as any[]
    expect(rows[0].version).toBe(3)
  })

  it("push version 不匹配时进入 conflicts 且不写库", async () => {
    const database = createDatabase({
      synced_records: [
        syncedRecord({
          record_id: "note-1",
          version: 5,
          data: { title: "server" },
          record_updated_at: T_EARLY,
          device_id: "device-server",
        }),
      ],
    })
    const { router } = await registerSync(database)
    const response = createResponse()

    await findRoute(router.routes, "post", "/sync/records").handler(
      {
        accountability: { user: "user-1" },
        body: [pushRecord({ id: "note-1", version: 3, client_timestamp: T_LATE })],
      },
      response,
      vi.fn(),
    )

    const body = response.body as {
      data: { accepted: string[]; conflicts: any[] }
    }
    expect(body.data.accepted).not.toContain("note-1")
    expect(body.data.conflicts).toHaveLength(1)
    expect(body.data.conflicts[0]).toEqual(
      expect.objectContaining({
        type: "note",
        id: "note-1",
        server_version: 5,
        server_data: { title: "server" },
        server_updated_at: T_EARLY,
        server_device_id: "device-server",
      }),
    )

    const rows = database.__state.synced_records as any[]
    expect(rows[0].version).toBe(5)
  })

  it("push client_timestamp 过时时进入 conflicts", async () => {
    const database = createDatabase({
      synced_records: [
        syncedRecord({ record_id: "note-1", version: 1, record_updated_at: T_LATE }),
      ],
    })
    const { router } = await registerSync(database)
    const response = createResponse()

    await findRoute(router.routes, "post", "/sync/records").handler(
      {
        accountability: { user: "user-1" },
        body: [pushRecord({ id: "note-1", version: null, client_timestamp: T_EARLY })],
      },
      response,
      vi.fn(),
    )

    const body = response.body as { data: { conflicts: any[] } }
    expect(body.data.conflicts.map((conflict) => conflict.id)).toEqual(["note-1"])
  })

  it("push tombstone（deleted:true）标记删除并清空 data", async () => {
    const database = createDatabase({
      synced_records: [
        syncedRecord({
          record_id: "note-1",
          version: 1,
          data: { title: "keep" },
          record_updated_at: T_EARLY,
          deleted: false,
        }),
      ],
    })
    const { router } = await registerSync(database)
    const response = createResponse()

    await findRoute(router.routes, "post", "/sync/records").handler(
      {
        accountability: { user: "user-1" },
        body: [pushRecord({ id: "note-1", version: 1, client_timestamp: T_LATE, deleted: true })],
      },
      response,
      vi.fn(),
    )

    const body = response.body as { data: { accepted: string[] } }
    expect(body.data.accepted).toContain("note-1")

    const rows = database.__state.synced_records as any[]
    expect(rows[0].deleted).toBe(true)
    expect(rows[0].data).toBeNull()
  })

  it("push 敏感字段进入 rejected 且不影响正常记录", async () => {
    const database = createDatabase({ synced_records: [] })
    const { router } = await registerSync(database)
    const response = createResponse()

    await findRoute(router.routes, "post", "/sync/records").handler(
      {
        accountability: { user: "user-1" },
        body: [
          pushRecord({ id: "note-secret", data: { apiKey: "x" } }),
          pushRecord({ id: "note-ok", data: { title: "safe" } }),
        ],
      },
      response,
      vi.fn(),
    )

    const body = response.body as {
      data: { accepted: string[]; rejected: Array<{ id: string; reason: string }> }
    }
    expect(body.data.accepted).toContain("note-ok")
    expect(body.data.accepted).not.toContain("note-secret")

    const rejected = body.data.rejected.find((entry) => entry.id === "note-secret")
    expect(rejected).toBeDefined()
    expect(rejected?.reason).toContain("sensitive")

    const rows = database.__state.synced_records as any[]
    expect(rows.map((row) => row.record_id)).toEqual(["note-ok"])
  })

  it("push body 非数组时抛 InvalidPayloadError", async () => {
    const { router } = await registerSync()
    const next = vi.fn()

    await findRoute(router.routes, "post", "/sync/records").handler(
      { accountability: { user: "user-1" }, body: {} },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("INVALID_PAYLOAD")
  })

  it("push 超过 100 条时抛 InvalidPayloadError", async () => {
    const { router } = await registerSync()
    const next = vi.fn()

    const body = Array.from({ length: 101 }, (_, index) => pushRecord({ id: `note-${index}` }))

    await findRoute(router.routes, "post", "/sync/records").handler(
      { accountability: { user: "user-1" }, body },
      createResponse(),
      next,
    )

    expect(firstForwardedError(next).code).toBe("INVALID_PAYLOAD")
  })
})
