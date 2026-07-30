import "fake-indexeddb/auto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  createSyncMetaRepository,
  createSyncQueueRepository,
  createTaboraDatabase,
} from "@tabora/storage"
import type { HostAdapter } from "@tabora/host-adapters"
import type { StrapiAuthClient } from "@tabora/auth"
import { createSyncManager } from "./syncManager"

const BASE = "http://api.test"
const DATABASE_NAME = "tabora-sync-manager-test"

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function deleteTestDatabase() {
  const request = indexedDB.deleteDatabase(DATABASE_NAME)
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe("createSyncManager", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    await deleteTestDatabase()
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(async () => {
    vi.unstubAllGlobals()
    await deleteTestDatabase()
  })

  it("resolves triggerSync only after the scheduled backend push and pull complete", async () => {
    const database = createTaboraDatabase(DATABASE_NAME)
    const syncQueueRepo = createSyncQueueRepository(database)
    const syncMetaRepo = createSyncMetaRepository(database)
    const manager = createSyncManager({
      database,
      syncQueueRepo,
      syncMetaRepo,
      apiBaseUrl: BASE,
      host: { id: "host.test", platform: "web", capabilities: {} } as HostAdapter,
      authClient: {
        getSession: vi.fn().mockResolvedValue({ jwt: "jwt-1", userId: 1 }),
      } as unknown as StrapiAuthClient,
    })
    await syncQueueRepo.add({
      scope: "core",
      entityType: "workspace",
      recordKey: "w1",
      status: "pending",
      payload: { id: "w1", name: "Workspace" },
      clientUpdatedAt: "2026-07-29T08:00:00.000Z",
      deleted: false,
      queuedAt: "2026-07-29T08:00:00.000Z",
    })
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            accepted: ["w1"],
            conflicts: [],
            rejected: [],
            server_time: "2026-07-29T08:01:00.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            records: [],
            server_time: "2026-07-29T08:01:01.000Z",
          },
        }),
      )

    const syncPromise = manager.triggerSync()
    const resolved = vi.fn()
    void syncPromise.then(resolved)
    await Promise.resolve()

    expect(resolved).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()

    await syncPromise

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${BASE}/api/sync/records`,
      expect.objectContaining({ method: "POST" }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${BASE}/api/sync/records`,
      expect.objectContaining({ method: "GET" }),
    )
    expect(await syncQueueRepo.count()).toBe(0)
    expect(resolved).toHaveBeenCalledTimes(1)

    database.close()
  }, 7_000)

  it("rejects a manual sync when there is no active auth session", async () => {
    const database = createTaboraDatabase(DATABASE_NAME)
    const syncQueueRepo = createSyncQueueRepository(database)
    const syncMetaRepo = createSyncMetaRepository(database)
    const manager = createSyncManager({
      database,
      syncQueueRepo,
      syncMetaRepo,
      apiBaseUrl: BASE,
      host: { id: "host.test", platform: "web", capabilities: {} } as HostAdapter,
      authClient: {
        getSession: vi.fn().mockResolvedValue(null),
      } as unknown as StrapiAuthClient,
    })

    await expect(manager.triggerSync()).rejects.toMatchObject({
      code: "AUTH_FAILED",
    })
    expect(fetchMock).not.toHaveBeenCalled()

    database.close()
  }, 7_000)

  it("automatically schedules sync after a committed local database change", async () => {
    const database = createTaboraDatabase(DATABASE_NAME)
    const syncQueueRepo = createSyncQueueRepository(database)
    const syncMetaRepo = createSyncMetaRepository(database)
    const manager = createSyncManager({
      database,
      syncQueueRepo,
      syncMetaRepo,
      apiBaseUrl: BASE,
      host: { id: "host.test", platform: "web", capabilities: {} } as HostAdapter,
      authClient: {
        getSession: vi.fn().mockResolvedValue({ jwt: "jwt-1", userId: 1 }),
      } as unknown as StrapiAuthClient,
    })
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            accepted: ["w-auto"],
            conflicts: [],
            rejected: [],
            server_time: "2026-07-30T02:00:00.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            records: [],
            server_time: "2026-07-30T02:00:01.000Z",
          },
        }),
      )
    manager.changeDetector.start()

    await database.workspaces.put({
      id: "w-auto",
      name: "Auto Sync",
      activeLayoutId: "official.layout.workbench-dashboard",
      activeThemeId: "official.theme.light",
      activeBackgroundProviderId: "official.background.default",
      regions: {},
      createdAt: "2026-07-30T02:00:00.000Z",
      updatedAt: "2026-07-30T02:00:00.000Z",
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 4_000 })
    expect(await syncQueueRepo.count()).toBe(0)

    database.close()
  }, 7_000)

  it("schedules a follow-up sync for changes queued while a sync is in progress", async () => {
    const database = createTaboraDatabase(DATABASE_NAME)
    const syncQueueRepo = createSyncQueueRepository(database)
    const syncMetaRepo = createSyncMetaRepository(database)
    const manager = createSyncManager({
      database,
      syncQueueRepo,
      syncMetaRepo,
      apiBaseUrl: BASE,
      host: { id: "host.test", platform: "web", capabilities: {} } as HostAdapter,
      authClient: {
        getSession: vi.fn().mockResolvedValue({ jwt: "jwt-1", userId: 1 }),
      } as unknown as StrapiAuthClient,
    })
    manager.changeDetector.start()
    await syncQueueRepo.add({
      scope: "core",
      entityType: "workspace",
      recordKey: "w-first",
      status: "pending",
      payload: { id: "w-first", name: "First" },
      clientUpdatedAt: "2026-07-30T02:10:00.000Z",
      deleted: false,
      queuedAt: "2026-07-30T02:10:00.000Z",
    })

    let resolveFirstPull!: (response: Response) => void
    const firstPull = new Promise<Response>((resolve) => {
      resolveFirstPull = resolve
    })
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            accepted: ["w-first"],
            conflicts: [],
            rejected: [],
            server_time: "2026-07-30T02:10:01.000Z",
          },
        }),
      )
      .mockReturnValueOnce(firstPull)
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            accepted: ["w-second"],
            conflicts: [],
            rejected: [],
            server_time: "2026-07-30T02:10:03.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            records: [],
            server_time: "2026-07-30T02:10:04.000Z",
          },
        }),
      )

    try {
      const firstSync = manager.triggerSync()
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 4_000 })

      await database.workspaces.put({
        id: "w-second",
        name: "Second",
        activeLayoutId: "official.layout.workbench-dashboard",
        activeThemeId: "official.theme.light",
        activeBackgroundProviderId: "official.background.default",
        regions: {},
        createdAt: "2026-07-30T02:10:02.000Z",
        updatedAt: "2026-07-30T02:10:02.000Z",
      })
      await vi.waitFor(async () => expect(await syncQueueRepo.count()).toBe(1))

      resolveFirstPull(
        jsonResponse(200, {
          data: {
            records: [],
            server_time: "2026-07-30T02:10:02.500Z",
          },
        }),
      )
      await firstSync

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4), { timeout: 4_000 })
      expect(await syncQueueRepo.count()).toBe(0)
    } finally {
      database.close()
    }
  }, 12_000)
})
