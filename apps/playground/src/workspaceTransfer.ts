import type { Workspace } from "@tabora/plugin-api"
import type {
  InstanceRepository,
  PluginDataRepository,
  PluginDataRow,
  TaboraDatabase,
  WorkspaceRepository,
} from "@tabora/storage"
import {
  createWorkspaceExport,
  parseExport,
  prepareImport,
  serializeExport,
} from "./workspacePortability"

export async function exportWorkspaceData(options: {
  workspace: Workspace
  instanceRepo: InstanceRepository
  database: TaboraDatabase
}): Promise<string> {
  const instances = await options.instanceRepo.getByWorkspace(options.workspace.id)
  const dataRows = await options.database.pluginData
    .where("workspaceId")
    .equals(options.workspace.id)
    .toArray()
  const exportData = createWorkspaceExport(options.workspace, instances, dataRows)
  return serializeExport(exportData)
}

export async function importWorkspaceData(options: {
  json: string
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  pluginDataRepo: PluginDataRepository
  database: TaboraDatabase
  availablePluginIds: string[]
}): Promise<{
  workspace: Workspace
  instances: ReturnType<typeof prepareImport>["instances"]
  warnings: string[]
}> {
  const data = parseExport(options.json)
  if (!data) throw new Error("导入数据格式无效")

  const result = prepareImport(data, options.availablePluginIds)
  const existing = await options.workspaceRepo.get(result.workspace.id)
  if (existing) {
    result.workspace.id = `${result.workspace.id}-import-${Date.now()}`
    result.workspace.name = `${result.workspace.name} (导入)`
    for (const inst of result.instances) {
      inst.workspaceId = result.workspace.id
    }
    for (const row of result.pluginDataRows) {
      row.workspaceId = result.workspace.id
    }
  }

  await options.workspaceRepo.save(result.workspace)
  for (const inst of result.instances) {
    await options.instanceRepo.save(inst)
  }
  for (const row of result.pluginDataRows) {
    await options.database.pluginData.put(row)
  }

  return {
    workspace: { ...result.workspace },
    instances: result.instances,
    warnings: result.warnings,
  }
}
