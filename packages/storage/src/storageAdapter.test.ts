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
    const adapter = createWebStorageAdapter("tabora-storage-adapter-test", { enableSync: true })
    const workspace: Workspace = {
      id: "default",
      name: "默认",
      activeLayout: {
        pluginId: "official.layout.workbench-dashboard",
        kind: "layout",
        id: "official.layout.workbench-dashboard",
      },
      activeTheme: { pluginId: "official.theme", kind: "theme", id: "official.theme.light" },
      activeBackgroundProvider: {
        pluginId: "official.background",
        kind: "background-provider",
        id: "background.gradient-green",
      },
      config: {
        search: {
          defaultProvider: {
            pluginId: "official.search",
            kind: "search-provider",
            id: "official.search.google",
          },
          enabledProviders: [
            {
              pluginId: "official.search",
              kind: "search-provider",
              id: "official.search.google",
            },
          ],
        },
      },
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z",
    }

    await adapter.repositories.workspaceRepo.save(workspace)

    await expect(adapter.repositories.workspaceRepo.get("default")).resolves.toEqual(workspace)
    expect(adapter.database).toBeDefined()
    expect(adapter.sync).toBeDefined()
  })

  it("keeps sync queue infrastructure absent until a host explicitly enables account sync", () => {
    const adapter = createWebStorageAdapter("tabora-storage-adapter-test")

    expect(adapter.sync).toBeUndefined()
  })
})
