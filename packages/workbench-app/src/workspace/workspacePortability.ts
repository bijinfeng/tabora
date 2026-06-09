import { workspaceExportSchema, type PluginInstance, type Workspace } from "@tabora/plugin-api"
import type { PluginDataRow } from "@tabora/storage"

const SCHEMA_VERSION = 1

export type WorkspaceExport = {
  schemaVersion: typeof SCHEMA_VERSION
  exportedAt: string
  workspace: Workspace
  instances: PluginInstance[]
  pluginData: PluginDataRow[]
}

export function createWorkspaceExport(
  workspace: Workspace,
  instances: PluginInstance[],
  pluginDataRows: PluginDataRow[],
): WorkspaceExport {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    workspace,
    instances,
    pluginData: pluginDataRows,
  }
}

export function serializeExport(data: WorkspaceExport): string {
  return JSON.stringify(data, null, 2)
}

export function parseExport(json: string): WorkspaceExport | null {
  try {
    const data = JSON.parse(json) as unknown
    const parsed = workspaceExportSchema.safeParse(data)
    if (!parsed.success) {
      const schemaVersion =
        typeof data === "object" && data !== null
          ? (data as Record<string, unknown>).schemaVersion
          : undefined
      if (schemaVersion !== SCHEMA_VERSION) {
        console.warn(`Unsupported schema version: ${String(schemaVersion)}`)
      }
      return null
    }

    return parsed.data as WorkspaceExport
  } catch {
    return null
  }
}

export type ImportResult = {
  workspace: Workspace
  instances: PluginInstance[]
  pluginDataRows: PluginDataRow[]
  warnings: string[]
}

export function prepareImport(data: WorkspaceExport, availablePluginIds: string[]): ImportResult {
  const warnings: string[] = []
  const workspaceId = data.workspace.id

  const filteredInstances = data.instances.filter((instance) => {
    if (!availablePluginIds.includes(instance.pluginId)) {
      warnings.push(`插件 "${instance.pluginId}" 不存在 (实例: ${instance.id})`)
      return false
    }
    instance.workspaceId = workspaceId
    return true
  })

  const filteredPluginData = data.pluginData.filter((row) => {
    if (!availablePluginIds.includes(row.pluginId)) {
      warnings.push(`插件 "${row.pluginId}" 数据已跳过`)
      return false
    }
    row.workspaceId = workspaceId
    return true
  })

  return {
    workspace: data.workspace,
    instances: filteredInstances,
    pluginDataRows: filteredPluginData,
    warnings,
  }
}
