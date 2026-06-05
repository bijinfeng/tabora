import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { createTaboraDatabase, type WorkspaceSnapshot } from "./database"
import { createWorkspaceSnapshotRepository } from "./workspaceSnapshotRepository"

function deleteTestDatabase() {
  const request = indexedDB.deleteDatabase("tabora-workspace-snapshot-test")
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe("createWorkspaceSnapshotRepository", () => {
  beforeEach(() => deleteTestDatabase())

  it("saves and returns the latest workspace snapshot", async () => {
    const database = createTaboraDatabase("tabora-workspace-snapshot-test")
    const repository = createWorkspaceSnapshotRepository(database)
    const first: WorkspaceSnapshot = {
      id: "snapshot-1",
      workspaceId: "workspace-1",
      layoutId: "layout-a",
      regions: {},
      instances: [],
      createdAt: "2026-06-05T00:00:00.000Z",
    }
    const second: WorkspaceSnapshot = {
      ...first,
      id: "snapshot-2",
      layoutId: "layout-b",
      createdAt: "2026-06-05T00:01:00.000Z",
    }

    await repository.save(first)
    await repository.save(second)

    await expect(repository.getLast("workspace-1")).resolves.toEqual(second)
  })
})
