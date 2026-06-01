import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import {
  createTaboraDatabase,
  createInstanceRepository,
  createPluginDataRepository,
  createWorkspaceRepository,
} from "@tabora/storage"
import { createWorkspaceSession } from "./workspaceSession"
import { exportWorkspaceData, importWorkspaceData } from "./workspaceTransfer"

function deleteTestDatabase() {
  const request = indexedDB.deleteDatabase("tabora-workspace-transfer-test")
  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

describe("workspaceTransfer", () => {
  beforeEach(() => deleteTestDatabase())

  it("exports only the target workspace instances and plugin data", async () => {
    const database = createTaboraDatabase("tabora-workspace-transfer-test")
    const workspaceRepo = createWorkspaceRepository(database)
    const instanceRepo = createInstanceRepository(database)

    const workspaceA = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      name: "工作区 A",
    })
    const workspaceB = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      name: "工作区 B",
    })

    await database.pluginData.put({
      id: "official.search.command-bar:search-history:workspace-a",
      pluginId: "official.search.command-bar",
      workspaceId: workspaceA.id,
      key: "search-history",
      value: ["a"],
      updatedAt: "2026-06-02T00:00:00.000Z",
    })
    await database.pluginData.put({
      id: "official.search.command-bar:search-history:workspace-b",
      pluginId: "official.search.command-bar",
      workspaceId: workspaceB.id,
      key: "search-history",
      value: ["b"],
      updatedAt: "2026-06-02T00:00:00.000Z",
    })

    const json = await exportWorkspaceData({
      workspace: workspaceA,
      instanceRepo,
      database,
    })
    const parsed = JSON.parse(json) as {
      workspace: { id: string }
      instances: Array<{ workspaceId: string }>
      pluginData: Array<{ workspaceId: string }>
    }

    expect(parsed.workspace.id).toBe(workspaceA.id)
    expect(parsed.instances.every((instance) => instance.workspaceId === workspaceA.id)).toBe(true)
    expect(parsed.pluginData.every((row) => row.workspaceId === workspaceA.id)).toBe(true)
  })

  it("imports workspace data and renames on id collision", async () => {
    const sourceDb = createTaboraDatabase("tabora-workspace-transfer-test")
    const sourceWorkspaceRepo = createWorkspaceRepository(sourceDb)
    const sourceInstanceRepo = createInstanceRepository(sourceDb)

    const workspace = await createWorkspaceSession({
      workspaceRepo: sourceWorkspaceRepo,
      instanceRepo: sourceInstanceRepo,
      name: "导出工作区",
    })

    await sourceDb.pluginData.put({
      id: "official.search.command-bar:search-history:source",
      pluginId: "official.search.command-bar",
      workspaceId: workspace.id,
      key: "search-history",
      value: ["hello"],
      updatedAt: "2026-06-02T00:00:00.000Z",
    })

    const exported = await exportWorkspaceData({
      workspace,
      instanceRepo: sourceInstanceRepo,
      database: sourceDb,
    })

    const targetDb = createTaboraDatabase("tabora-workspace-transfer-target-test")
    const targetWorkspaceRepo = createWorkspaceRepository(targetDb)
    const targetInstanceRepo = createInstanceRepository(targetDb)
    const targetPluginDataRepo = createPluginDataRepository(targetDb)

    await targetWorkspaceRepo.save(workspace)

    const result = await importWorkspaceData({
      json: exported,
      workspaceRepo: targetWorkspaceRepo,
      instanceRepo: targetInstanceRepo,
      pluginDataRepo: targetPluginDataRepo,
      database: targetDb,
      availablePluginIds: [
        "official.search.command-bar",
        "official.widgets.today-focus",
        "official.widgets.quick-links",
        "official.widgets.notes",
        "official.widgets.todo",
      ],
    })

    expect(result.workspace.id).not.toBe(workspace.id)
    expect(result.workspace.name).toContain("(导入)")
    expect(result.instances.every((instance) => instance.workspaceId === result.workspace.id)).toBe(
      true,
    )
    const importedRows = await targetDb.pluginData
      .where("workspaceId")
      .equals(result.workspace.id)
      .toArray()
    expect(importedRows.length).toBeGreaterThan(0)
  })
})
