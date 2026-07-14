import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { createTaboraDatabase } from "./database"
import { createSyncMetaRepository } from "./syncMetaRepository"

function deleteTestDatabase() {
  const request = indexedDB.deleteDatabase("tabora-sync-meta-test")
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe("createSyncMetaRepository", () => {
  beforeEach(() => deleteTestDatabase())

  it("sets and reads a value", async () => {
    const database = createTaboraDatabase("tabora-sync-meta-test")
    const repository = createSyncMetaRepository(database)

    await repository.set("pullCursor", "2026-06-05T00:00:00.000Z")

    expect(await repository.get("pullCursor")).toBe("2026-06-05T00:00:00.000Z")
  })

  it("returns undefined for a missing key", async () => {
    const database = createTaboraDatabase("tabora-sync-meta-test")
    const repository = createSyncMetaRepository(database)

    expect(await repository.get("missing")).toBeUndefined()
  })

  it("overwrites an existing value", async () => {
    const database = createTaboraDatabase("tabora-sync-meta-test")
    const repository = createSyncMetaRepository(database)

    await repository.set("deviceId", "device-123")
    await repository.set("deviceId", "device-456")

    expect(await repository.get("deviceId")).toBe("device-456")
  })

  it("removes a value", async () => {
    const database = createTaboraDatabase("tabora-sync-meta-test")
    const repository = createSyncMetaRepository(database)

    await repository.set("accountId", "account-abc")
    await repository.remove("accountId")

    expect(await repository.get("accountId")).toBeUndefined()
  })

  it("returns all meta entries and clears them", async () => {
    const database = createTaboraDatabase("tabora-sync-meta-test")
    const repository = createSyncMetaRepository(database)

    await repository.set("pullCursor", "2026-06-05T00:00:00.000Z")
    await repository.set("deviceId", "device-123")
    await repository.set("schemaVersion", "1")

    const all = await repository.getAll()
    expect(all).toHaveLength(3)
    expect(all.map((row) => row.key).sort()).toEqual(["deviceId", "pullCursor", "schemaVersion"])

    await repository.clear()
    expect(await repository.getAll()).toHaveLength(0)
  })

  it("stores serialized json values", async () => {
    const database = createTaboraDatabase("tabora-sync-meta-test")
    const repository = createSyncMetaRepository(database)

    const serialized = JSON.stringify({
      cursor: "2026-06-05T00:00:00.000Z",
      deviceId: "device-123",
    })
    await repository.set("syncState", serialized)

    const value = await repository.get("syncState")
    expect(value).toBe(serialized)
    expect(JSON.parse(value!).deviceId).toBe("device-123")
  })
})
