import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { builtinDefaultWorkspacePreset } from "@tabora/builtin-plugin-registry"
import {
  createTaboraDatabase,
  createInstanceRepository,
  createPluginDataRepository,
  createWorkspaceRepository,
} from "@tabora/storage"
import {
  createWorkspaceSession,
  exportWorkspaceData,
  importWorkspaceData,
} from "@tabora/workbench-app"

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
    const pluginDataRepo = createPluginDataRepository(database)

    const workspaceA = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      name: "工作区 A",
    })
    const workspaceB = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      name: "工作区 B",
    })

    const instanceAId = "widget-a-1"
    const instanceBId = "widget-b-1"
    await instanceRepo.save({
      id: instanceAId,
      workspaceId: workspaceA.id,
      pluginId: "official.widgets.notes",
      contributionId: "notes",
      extensionPoint: "widget",
      regionId: "mainGrid",
      enabled: true,
      size: "M",
      config: {},
      createdAt: "2026-06-02T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
    })
    await instanceRepo.save({
      id: instanceBId,
      workspaceId: workspaceB.id,
      pluginId: "official.widgets.notes",
      contributionId: "notes",
      extensionPoint: "widget",
      regionId: "mainGrid",
      enabled: true,
      size: "M",
      config: {},
      createdAt: "2026-06-02T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
    })
    const instancesA = await instanceRepo.getByWorkspace(workspaceA.id)

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
    await pluginDataRepo.saveForInstance("official.widgets.notes", instanceAId, "draft", {
      text: "hello",
    })

    const json = await exportWorkspaceData({
      workspace: workspaceA,
      instanceRepo,
      database,
    })
    const parsed = JSON.parse(json) as {
      workspace: { id: string }
      instances: Array<{ workspaceId: string }>
      pluginData: Array<{ workspaceId?: string; instanceId?: string }>
    }

    expect(parsed.workspace.id).toBe(workspaceA.id)
    expect(parsed.instances.every((instance) => instance.workspaceId === workspaceA.id)).toBe(true)
    expect(parsed.pluginData.some((row) => row.workspaceId === workspaceA.id)).toBe(true)
    expect(parsed.pluginData.some((row) => row.instanceId === instanceAId)).toBe(true)
    expect(
      parsed.pluginData.every((row) => {
        if (row.workspaceId) return row.workspaceId === workspaceA.id
        if (row.instanceId) return instancesA.some((instance) => instance.id === row.instanceId)
        return false
      }),
    ).toBe(true)
  })

  it("imports workspace data and renames on id collision", async () => {
    const sourceDb = createTaboraDatabase("tabora-workspace-transfer-test")
    const sourceWorkspaceRepo = createWorkspaceRepository(sourceDb)
    const sourceInstanceRepo = createInstanceRepository(sourceDb)
    const sourcePluginDataRepo = createPluginDataRepository(sourceDb)

    const workspace = await createWorkspaceSession({
      workspaceRepo: sourceWorkspaceRepo,
      instanceRepo: sourceInstanceRepo,
      defaultWorkspacePreset: builtinDefaultWorkspacePreset,
      name: "导出工作区",
    })

    const instanceId = "widget-source-1"
    await sourceInstanceRepo.save({
      id: instanceId,
      workspaceId: workspace.id,
      pluginId: "official.widgets.notes",
      contributionId: "notes",
      extensionPoint: "widget",
      regionId: "mainGrid",
      enabled: true,
      size: "M",
      config: {},
      createdAt: "2026-06-02T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
    })

    await sourceDb.pluginData.put({
      id: "official.search.command-bar:search-history:source",
      pluginId: "official.search.command-bar",
      workspaceId: workspace.id,
      key: "search-history",
      value: ["hello"],
      updatedAt: "2026-06-02T00:00:00.000Z",
    })
    await sourcePluginDataRepo.saveForInstance("official.widgets.notes", instanceId, "draft", {
      text: "hello",
    })

    const exported = await exportWorkspaceData({
      workspace,
      instanceRepo: sourceInstanceRepo,
      database: sourceDb,
    })

    const targetDb = createTaboraDatabase("tabora-workspace-transfer-target-test")
    const targetWorkspaceRepo = createWorkspaceRepository(targetDb)
    const targetInstanceRepo = createInstanceRepository(targetDb)

    await targetWorkspaceRepo.save(workspace)

    const result = await importWorkspaceData({
      json: exported,
      workspaceRepo: targetWorkspaceRepo,
      instanceRepo: targetInstanceRepo,
      database: targetDb,
      availablePluginIds: [
        "official.search.command-bar",
        "official.widgets.quick-links",
        "official.widgets.notes",
        "official.widgets.todo",
        "official.widgets.weather",
      ],
    })

    expect(result.workspace.id).not.toBe(workspace.id)
    expect(result.workspace.name).toContain("(导入)")
    expect(result.instances.every((instance) => instance.workspaceId === result.workspace.id)).toBe(
      true,
    )
    expect(
      result.instances.every((instance) =>
        instance.id.startsWith(`import:${result.workspace.id}:`),
      ),
    ).toBe(true)
    const importedRows = await targetDb.pluginData.toArray()
    expect(importedRows.length).toBeGreaterThan(0)
    const importedInstanceIds = new Set(result.instances.map((instance) => instance.id))
    expect(
      importedRows.some((row) => row.instanceId && importedInstanceIds.has(row.instanceId)),
    ).toBe(true)
    expect(
      importedRows.every((row) => {
        if (row.instanceId) {
          return (
            row.id === [row.pluginId, row.key, row.instanceId].map(encodeURIComponent).join(":")
          )
        }
        if (row.workspaceId) {
          return (
            row.id === [row.pluginId, row.key, row.workspaceId].map(encodeURIComponent).join(":")
          )
        }
        return false
      }),
    ).toBe(true)
  })
})
