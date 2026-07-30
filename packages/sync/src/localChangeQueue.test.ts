import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { createSyncQueueRepository, createTaboraDatabase } from "@tabora/storage"
import { createLocalChangeQueue } from "./localChangeQueue"

const DATABASE_NAME = "tabora-local-change-queue-test"

function deleteTestDatabase() {
  const request = indexedDB.deleteDatabase(DATABASE_NAME)
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe("createLocalChangeQueue", () => {
  beforeEach(() => deleteTestDatabase())

  it("coalesces repeated changes with the latest payload and timestamp", async () => {
    const database = createTaboraDatabase(DATABASE_NAME)
    const queue = createLocalChangeQueue(createSyncQueueRepository(database))

    await queue.enqueue({
      scope: "core",
      entityType: "workspace",
      recordKey: "w1",
      payload: { id: "w1", name: "old" },
      clientUpdatedAt: "2026-07-29T08:00:00.000Z",
      deleted: false,
    })
    await queue.enqueue({
      scope: "core",
      entityType: "workspace",
      recordKey: "w1",
      payload: { id: "w1", name: "new" },
      clientUpdatedAt: "2026-07-29T08:05:00.000Z",
      deleted: true,
    })

    const pending = await queue.getPending()
    expect(pending).toHaveLength(1)
    expect(pending[0]).toMatchObject({
      payload: { id: "w1", name: "new" },
      clientUpdatedAt: "2026-07-29T08:05:00.000Z",
      deleted: true,
      status: "pending",
    })

    database.close()
    await deleteTestDatabase()
  })
})
