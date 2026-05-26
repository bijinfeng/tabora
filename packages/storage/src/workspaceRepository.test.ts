import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import type { Workspace } from "@tabora/plugin-api"
import { createTaboraDatabase } from "./database"
import { createWorkspaceRepository } from "./workspaceRepository"

describe("createWorkspaceRepository", () => {
  beforeEach(() => {
    const request = indexedDB.deleteDatabase("tabora-test")
    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      request.onblocked = () => resolve()
    })
  })

  it("saves and loads a workspace", async () => {
    const database = createTaboraDatabase("tabora-test")
    const repository = createWorkspaceRepository(database)
    const workspace: Workspace = {
      id: "default",
      name: "默认",
      activeLayoutId: "official.layout.top-search-grid",
      activeThemeId: "official.theme.light",
      regions: {},
      createdAt: "2026-05-26T00:00:00.000Z",
      updatedAt: "2026-05-26T00:00:00.000Z",
    }

    await repository.save(workspace)

    await expect(repository.get("default")).resolves.toEqual(workspace)
  })
})
