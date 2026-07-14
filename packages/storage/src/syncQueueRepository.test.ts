import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { createTaboraDatabase } from "./database"
import { createSyncQueueRepository } from "./syncQueueRepository"

function deleteTestDatabase() {
  const request = indexedDB.deleteDatabase("tabora-sync-queue-test")
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

function pendingItem(recordKey: string, queuedAt: string) {
  return {
    scope: "workspace",
    entityType: "plugin-instance",
    recordKey,
    status: "pending" as const,
    payload: { key: recordKey },
    clientUpdatedAt: "2026-06-05T00:00:00.000Z",
    deleted: false,
    queuedAt,
  }
}

describe("createSyncQueueRepository", () => {
  beforeEach(() => deleteTestDatabase())

  it("adds an item and reads it back by id", async () => {
    const database = createTaboraDatabase("tabora-sync-queue-test")
    const repository = createSyncQueueRepository(database)

    const id = await repository.add(pendingItem("key-1", "2026-06-05T00:00:00.000Z"))
    const item = await repository.get(id)

    expect(item).toBeDefined()
    expect(item?.scope).toBe("workspace")
    expect(item?.entityType).toBe("plugin-instance")
    expect(item?.recordKey).toBe("key-1")
    expect(item?.status).toBe("pending")
  })

  it("looks up an item by its composite record key", async () => {
    const database = createTaboraDatabase("tabora-sync-queue-test")
    const repository = createSyncQueueRepository(database)

    await repository.add(pendingItem("unique-key", "2026-06-05T00:00:00.000Z"))

    const item = await repository.getByRecord("workspace", "plugin-instance", "unique-key")
    expect(item?.recordKey).toBe("unique-key")
  })

  it("returns only pending items sorted by queuedAt", async () => {
    const database = createTaboraDatabase("tabora-sync-queue-test")
    const repository = createSyncQueueRepository(database)

    await repository.add(pendingItem("key-late", "2026-06-05T00:00:02.000Z"))
    await repository.add(pendingItem("key-early", "2026-06-05T00:00:00.000Z"))
    await repository.add({
      ...pendingItem("key-syncing", "2026-06-05T00:00:01.000Z"),
      status: "syncing",
    })

    const pending = await repository.getAllPending()
    expect(pending).toHaveLength(2)
    expect(pending[0]?.recordKey).toBe("key-early")
    expect(pending[1]?.recordKey).toBe("key-late")
  })

  it("updates status with attempt metadata", async () => {
    const database = createTaboraDatabase("tabora-sync-queue-test")
    const repository = createSyncQueueRepository(database)

    const id = await repository.add(pendingItem("key-1", "2026-06-05T00:00:00.000Z"))
    await repository.updateStatus(id, "failed", {
      lastAttemptAt: "2026-06-05T00:01:00.000Z",
      failureReason: "network error",
    })

    const item = await repository.get(id)
    expect(item?.status).toBe("failed")
    expect(item?.lastAttemptAt).toBe("2026-06-05T00:01:00.000Z")
    expect(item?.failureReason).toBe("network error")
  })

  it("removes an item by id", async () => {
    const database = createTaboraDatabase("tabora-sync-queue-test")
    const repository = createSyncQueueRepository(database)

    const id = await repository.add(pendingItem("key-1", "2026-06-05T00:00:00.000Z"))
    await repository.remove(id)

    expect(await repository.get(id)).toBeUndefined()
  })

  it("removes an item by its composite record key", async () => {
    const database = createTaboraDatabase("tabora-sync-queue-test")
    const repository = createSyncQueueRepository(database)

    await repository.add(pendingItem("key-1", "2026-06-05T00:00:00.000Z"))
    await repository.removeByRecord("workspace", "plugin-instance", "key-1")

    expect(await repository.getByRecord("workspace", "plugin-instance", "key-1")).toBeUndefined()
  })

  it("clears and counts items", async () => {
    const database = createTaboraDatabase("tabora-sync-queue-test")
    const repository = createSyncQueueRepository(database)

    expect(await repository.count()).toBe(0)
    await repository.add(pendingItem("key-1", "2026-06-05T00:00:00.000Z"))
    await repository.add(pendingItem("key-2", "2026-06-05T00:00:01.000Z"))
    expect(await repository.count()).toBe(2)

    await repository.clear()
    expect(await repository.count()).toBe(0)
  })
})
