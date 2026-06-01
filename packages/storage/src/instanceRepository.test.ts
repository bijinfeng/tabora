import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import type { PluginInstance } from "@tabora/plugin-api"
import { createTaboraDatabase } from "./database"
import { createInstanceRepository } from "./instanceRepository"

function deleteTestDatabase() {
  const request = indexedDB.deleteDatabase("tabora-instance-test")
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

function widgetInstance(id: string, x: number, workspaceId = "default"): PluginInstance {
  return {
    id,
    workspaceId,
    pluginId: "official.widgets.productivity",
    contributionId: "notes",
    extensionPoint: "widget",
    regionId: "mainGrid",
    enabled: true,
    size: "M",
    grid: { x, y: 0, colSpan: 2, rowSpan: 1 },
    config: {},
    createdAt: "2026-05-26T00:00:00.000Z",
    updatedAt: "2026-05-26T00:00:00.000Z",
  }
}

describe("createInstanceRepository", () => {
  beforeEach(() => deleteTestDatabase())

  it("loads region instances by persisted grid order", async () => {
    const database = createTaboraDatabase("tabora-instance-test")
    const repository = createInstanceRepository(database)

    await repository.save(widgetInstance("a-later", 1))
    await repository.save(widgetInstance("b-earlier", 0))

    await expect(repository.getByRegion("default", "mainGrid")).resolves.toMatchObject([
      { id: "b-earlier" },
      { id: "a-later" },
    ])
  })

  it("isolates instances by workspace", async () => {
    const database = createTaboraDatabase("tabora-instance-test")
    const repository = createInstanceRepository(database)

    await repository.save(widgetInstance("default-item", 0, "default"))
    await repository.save(widgetInstance("other-item", 0, "workspace-b"))

    await expect(repository.getByRegion("default", "mainGrid")).resolves.toMatchObject([
      { id: "default-item" },
    ])
    await expect(repository.getByRegion("workspace-b", "mainGrid")).resolves.toMatchObject([
      { id: "other-item" },
    ])
  })

  it("removes all instances for a workspace", async () => {
    const database = createTaboraDatabase("tabora-instance-test")
    const repository = createInstanceRepository(database)

    await repository.save(widgetInstance("default-item", 0, "default"))
    await repository.save(widgetInstance("other-item", 0, "workspace-b"))

    await repository.removeByWorkspace("workspace-b")

    await expect(repository.getByWorkspace("workspace-b")).resolves.toEqual([])
    await expect(repository.getByWorkspace("default")).resolves.toMatchObject([
      { id: "default-item" },
    ])
  })
})
