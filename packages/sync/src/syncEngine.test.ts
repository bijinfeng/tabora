import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SyncQueueRow } from "@tabora/storage"
import { createSyncEngine, type SyncEngineConfig } from "./syncEngine"

const DEVICE_ID = "device-1"

function queueRow(overrides: Partial<SyncQueueRow> = {}): SyncQueueRow {
  return {
    id: "q1",
    scope: "core",
    entityType: "workspace",
    recordKey: "w1",
    status: "pending",
    payload: { name: "W1" },
    clientUpdatedAt: "2026-07-15T08:00:00.000Z",
    deleted: false,
    queuedAt: "2026-07-15T08:00:00.000Z",
    ...overrides,
  }
}

type PushConflict = {
  type: string
  id: string
  server_version: number
  server_data: unknown
  server_updated_at: string
  server_device_id: string
}

function pushOk(
  data: Partial<{
    accepted: string[]
    conflicts: PushConflict[]
    rejected: Array<{ id: string; reason: string }>
    server_time: string
  }> = {},
) {
  return {
    ok: true as const,
    data: {
      accepted: [],
      conflicts: [],
      rejected: [],
      server_time: "2026-07-15T12:00:00.000Z",
      ...data,
    },
  }
}

type PullRecord = {
  scope: "core" | "plugin"
  entityType: string
  recordKey: string
  payload: unknown
  serverUpdatedAt: string
  deleted: boolean
}

function pullOk(records: PullRecord[] = [], cursor = "2026-07-15T12:34:56.000Z") {
  return { ok: true as const, data: { records, cursor } }
}

function setup() {
  const database = {
    workspaces: { put: vi.fn(), delete: vi.fn() },
    pluginInstances: { put: vi.fn(), delete: vi.fn() },
    plugins: { put: vi.fn(), delete: vi.fn() },
    pluginData: { put: vi.fn(), delete: vi.fn() },
  }

  const gatewayClient = {
    push: vi.fn().mockResolvedValue(pushOk()),
    pull: vi.fn().mockResolvedValue(pullOk()),
  }

  const changeQueue = {
    getPending: vi.fn().mockResolvedValue([] as SyncQueueRow[]),
    dequeue: vi.fn().mockResolvedValue(undefined),
    markAsSyncing: vi.fn().mockResolvedValue(undefined),
    markAsFailed: vi.fn().mockResolvedValue(undefined),
  }

  const syncMetaRepo = {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(undefined),
  }

  const authSession = {
    getSession: vi.fn().mockResolvedValue({ accountId: "acc-1" }),
  }

  const engine = createSyncEngine({
    database,
    gatewayClient,
    changeQueue,
    syncMetaRepo,
    authSession,
    deviceId: DEVICE_ID,
  } as unknown as SyncEngineConfig)

  return { engine, database, gatewayClient, changeQueue, syncMetaRepo, authSession }
}

describe("createSyncEngine (Directus contract)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("push maps pending rows and dequeues accepted entries", async () => {
    const { engine, gatewayClient, changeQueue } = setup()
    const rows = [
      queueRow({ id: "q1", scope: "core", entityType: "workspace", recordKey: "w1" }),
      queueRow({
        id: "q2",
        scope: "plugin",
        entityType: "pluginData",
        recordKey: "p1",
        payload: { note: "hi" },
        clientUpdatedAt: "2026-07-15T08:05:00.000Z",
      }),
    ]
    changeQueue.getPending.mockResolvedValue(rows)
    gatewayClient.push.mockResolvedValue(pushOk({ accepted: ["w1", "p1"] }))

    await engine.push()

    expect(gatewayClient.push).toHaveBeenCalledWith(DEVICE_ID, [
      {
        scope: "core",
        entityType: "workspace",
        recordKey: "w1",
        payload: { name: "W1" },
        clientUpdatedAt: "2026-07-15T08:00:00.000Z",
        deleted: false,
      },
      {
        scope: "plugin",
        entityType: "pluginData",
        recordKey: "p1",
        payload: { note: "hi" },
        clientUpdatedAt: "2026-07-15T08:05:00.000Z",
        deleted: false,
      },
    ])
    expect(changeQueue.dequeue).toHaveBeenCalledWith("q1")
    expect(changeQueue.dequeue).toHaveBeenCalledWith("q2")
  })

  it("push conflict (server wins): applies server_data and dequeues the entry", async () => {
    const { engine, database, gatewayClient, changeQueue } = setup()
    changeQueue.getPending.mockResolvedValue([
      queueRow({ id: "q1", scope: "core", entityType: "workspace", recordKey: "w2" }),
    ])
    gatewayClient.push.mockResolvedValue(
      pushOk({
        conflicts: [
          {
            type: "workspace",
            id: "w2",
            server_version: 3,
            server_data: { id: "w2", name: "server" },
            server_updated_at: "2026-07-15T10:00:00.000Z",
            server_device_id: "dev-server",
          },
        ],
      }),
    )

    const result = await engine.sync()

    expect(database.workspaces.put).toHaveBeenCalledWith({ id: "w2", name: "server" })
    expect(changeQueue.dequeue).toHaveBeenCalledWith("q1")
    expect(result.conflicts).toBe(1)
  })

  it("push conflict tombstone (server_data null): deletes the local record", async () => {
    const { engine, database, gatewayClient, changeQueue } = setup()
    changeQueue.getPending.mockResolvedValue([
      queueRow({ id: "q1", scope: "core", entityType: "workspace", recordKey: "w3" }),
    ])
    gatewayClient.push.mockResolvedValue(
      pushOk({
        conflicts: [
          {
            type: "workspace",
            id: "w3",
            server_version: 4,
            server_data: null,
            server_updated_at: "2026-07-15T10:30:00.000Z",
            server_device_id: "dev-server",
          },
        ],
      }),
    )

    await engine.sync()

    expect(database.workspaces.delete).toHaveBeenCalledWith("w3")
    expect(database.workspaces.put).not.toHaveBeenCalled()
    expect(changeQueue.dequeue).toHaveBeenCalledWith("q1")
  })

  it("push conflict derives plugin scope for the pluginData type", async () => {
    const { engine, database, gatewayClient, changeQueue } = setup()
    changeQueue.getPending.mockResolvedValue([
      queueRow({ id: "q1", scope: "plugin", entityType: "pluginData", recordKey: "pd1" }),
    ])
    gatewayClient.push.mockResolvedValue(
      pushOk({
        conflicts: [
          {
            type: "pluginData",
            id: "pd1",
            server_version: 2,
            server_data: { id: "pd1", value: "server" },
            server_updated_at: "2026-07-15T10:00:00.000Z",
            server_device_id: "dev-server",
          },
        ],
      }),
    )

    await engine.sync()

    expect(database.pluginData.put).toHaveBeenCalledWith({ id: "pd1", value: "server" })
    expect(changeQueue.dequeue).toHaveBeenCalledWith("q1")
  })

  it("push rejected: marks the queue entry as failed with the reason", async () => {
    const { engine, gatewayClient, changeQueue } = setup()
    changeQueue.getPending.mockResolvedValue([
      queueRow({ id: "q1", scope: "core", entityType: "workspace", recordKey: "w4" }),
    ])
    gatewayClient.push.mockResolvedValue(
      pushOk({ rejected: [{ id: "w4", reason: "sensitive field: token" }] }),
    )

    await engine.push()

    expect(changeQueue.markAsFailed).toHaveBeenCalledWith("q1", "sensitive field: token")
  })

  it("pull applies records (put + delete branches) and stores the cursor", async () => {
    const { engine, database, syncMetaRepo, gatewayClient } = setup()
    gatewayClient.pull.mockResolvedValue(
      pullOk(
        [
          {
            scope: "core",
            entityType: "workspace",
            recordKey: "w1",
            payload: { id: "w1", name: "ws" },
            serverUpdatedAt: "2026-07-15T09:00:00.000Z",
            deleted: false,
          },
          {
            scope: "plugin",
            entityType: "pluginData",
            recordKey: "p1",
            payload: { id: "p1" },
            serverUpdatedAt: "2026-07-15T09:30:00.000Z",
            deleted: true,
          },
        ],
        "2026-07-15T12:34:56.000Z",
      ),
    )

    const result = await engine.pull()

    expect(database.workspaces.put).toHaveBeenCalledWith({ id: "w1", name: "ws" })
    expect(database.pluginData.delete).toHaveBeenCalledWith("p1")
    expect(syncMetaRepo.set).toHaveBeenCalledWith("pullCursor", "2026-07-15T12:34:56.000Z")
    expect(result.applied).toBe(2)
  })

  it("sync without an active session returns failure and skips push/pull", async () => {
    const { engine, gatewayClient, authSession } = setup()
    authSession.getSession.mockResolvedValue(null)

    const result = await engine.sync()

    expect(result.success).toBe(false)
    expect(gatewayClient.push).not.toHaveBeenCalled()
    expect(gatewayClient.pull).not.toHaveBeenCalled()
  })
})
