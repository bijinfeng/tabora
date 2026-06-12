import type { Workspace } from "@tabora/plugin-api"
import type { InstanceRepository, TaboraDatabase, WorkspaceRepository } from "@tabora/storage"

import {
  createWorkspaceExport,
  parseExportResult,
  prepareImport,
  serializeExport,
} from "./workspacePortability"

function encodeIdPart(value: string): string {
  return encodeURIComponent(value)
}

function buildPluginDataId(options: {
  pluginId: string
  key: string
  workspaceId?: string
  instanceId?: string
}): string {
  const base = [options.pluginId, options.key]
  if (options.instanceId) return [...base, options.instanceId].map(encodeIdPart).join(":")
  if (options.workspaceId) return [...base, options.workspaceId].map(encodeIdPart).join(":")
  return base.map(encodeIdPart).join(":")
}

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
  const instanceRows =
    instances.length > 0
      ? await options.database.pluginData
          .where("instanceId")
          .anyOf(instances.map((instance) => instance.id))
          .toArray()
      : []
  const pluginDataRows = Array.from(
    new Map([...dataRows, ...instanceRows].map((row) => [row.id, row])).values(),
  )
  const exportData = createWorkspaceExport(options.workspace, instances, pluginDataRows)
  return serializeExport(exportData)
}

export async function importWorkspaceData(options: {
  json: string
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  database: TaboraDatabase
  availablePluginIds: string[]
}): Promise<{
  workspace: Workspace
  instances: ReturnType<typeof prepareImport>["instances"]
  warnings: string[]
}> {
  const parsed = parseExportResult(options.json)
  if (!parsed.ok) {
    const issue = parsed.error.issues?.[0]
    const message = issue
      ? `${parsed.error.message} (${issue.path.join(".")}): ${issue.message}`
      : parsed.error.message
    throw new Error(message)
  }

  const imported = prepareImport(parsed.data, options.availablePluginIds)
  const existing = await options.workspaceRepo.get(imported.workspace.id)
  const nextWorkspaceId = existing
    ? `${imported.workspace.id}-import-${Date.now()}`
    : imported.workspace.id
  const nextWorkspaceName = existing ? `${imported.workspace.name} (导入)` : imported.workspace.name

  const instanceIdMap = new Map<string, string>(
    imported.instances.map((instance) => [instance.id, `import:${nextWorkspaceId}:${instance.id}`]),
  )

  const nextInstances = imported.instances.map((instance) => ({
    ...instance,
    id: instanceIdMap.get(instance.id) ?? instance.id,
    workspaceId: nextWorkspaceId,
  }))

  const nextRegions: Workspace["regions"] = Object.fromEntries(
    Object.entries(imported.workspace.regions).map(([regionKey, region]) => [
      regionKey,
      {
        ...region,
        instances: region.instances.flatMap(({ instanceId }) => {
          const mapped = instanceIdMap.get(instanceId)
          return mapped ? [{ instanceId: mapped }] : []
        }),
      },
    ]),
  )

  const pluginDataRows = imported.pluginDataRows.flatMap((row) => {
    const mappedInstanceId = row.instanceId ? instanceIdMap.get(row.instanceId) : undefined
    if (row.instanceId && !mappedInstanceId) return []

    const instanceScoped = Boolean(mappedInstanceId)
    const mappedWorkspaceId = instanceScoped
      ? undefined
      : row.workspaceId
        ? nextWorkspaceId
        : undefined

    const nextRow = {
      ...row,
      ...(mappedWorkspaceId ? { workspaceId: mappedWorkspaceId } : {}),
      ...(mappedInstanceId ? { instanceId: mappedInstanceId } : {}),
    }

    return [
      {
        ...nextRow,
        id: buildPluginDataId({
          pluginId: nextRow.pluginId,
          key: nextRow.key,
          ...(mappedWorkspaceId ? { workspaceId: mappedWorkspaceId } : {}),
          ...(mappedInstanceId ? { instanceId: mappedInstanceId } : {}),
        }),
      },
    ]
  })

  const workspace: Workspace = {
    ...imported.workspace,
    id: nextWorkspaceId,
    name: nextWorkspaceName,
    regions: nextRegions,
  }

  await options.workspaceRepo.save(workspace)
  for (const instance of nextInstances) {
    await options.instanceRepo.save(instance)
  }
  if (pluginDataRows.length > 0) {
    await options.database.pluginData.bulkPut(pluginDataRows)
  }

  return {
    workspace: { ...workspace },
    instances: nextInstances,
    warnings: imported.warnings,
  }
}
