import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import type { Workspace } from "@tabora/plugin-api"
import { createWebStorageAdapter } from "./storageAdapter"

function deleteTestDatabase() {
  const request = indexedDB.deleteDatabase("tabora-storage-adapter-test")
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe("createWebStorageAdapter", () => {
  beforeEach(() => deleteTestDatabase())

  it("provides repository ports backed by IndexedDB", async () => {
    const adapter = createWebStorageAdapter("tabora-storage-adapter-test")
    const workspace: Workspace = {
      id: "default",
      name: "默认",
      activeLayoutId: "official.layout.workbench-dashboard",
      activeThemeId: "official.theme.light",
      activeBackgroundProviderId: "background.gradient-green",
      regions: {},
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
    }

    await adapter.repositories.workspaceRepo.save(workspace)

    await expect(adapter.repositories.workspaceRepo.get("default")).resolves.toEqual(workspace)
    expect(adapter.database).toBeDefined()
  })
})
