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
    contribution: { pluginId: "official.widgets.productivity", kind: "widget", id: "notes" },
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

  it("migrates legacy instance identity only while reading storage and rewrites the canonical row", async () => {
    const database = createTaboraDatabase("tabora-instance-test")
    const repository = createInstanceRepository(database)
    await database.pluginInstances.put({
      id: "legacy-notes",
      workspaceId: "default",
      pluginId: "official.widgets.notes",
      contributionId: "notes",
      extensionPoint: "widget",
      regionId: "mainGrid",
      enabled: true,
      size: "M",
      config: {},
      createdAt: "2026-05-26T00:00:00.000Z",
      updatedAt: "2026-05-26T00:00:00.000Z",
    })

    await expect(repository.get("legacy-notes")).resolves.toMatchObject({
      contribution: { pluginId: "official.widgets.notes", kind: "widget", id: "notes" },
    })
    await expect(database.pluginInstances.get("legacy-notes")).resolves.toEqual(
      expect.objectContaining({
        contribution: { pluginId: "official.widgets.notes", kind: "widget", id: "notes" },
      }),
    )
    const raw = (await database.pluginInstances.get("legacy-notes")) as Record<string, unknown>
    expect(raw).not.toHaveProperty("pluginId")
    expect(raw).not.toHaveProperty("contributionId")
    expect(raw).not.toHaveProperty("extensionPoint")
  })
})
