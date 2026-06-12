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

export type WorkspaceExportSchemaIssue = {
  path: Array<string | number>
  message: string
}

export type WorkspaceExportParseErrorReason =
  | "invalid-json"
  | "unsupported-schema-version"
  | "schema-invalid"

export type WorkspaceExportParseError = {
  reason: WorkspaceExportParseErrorReason
  message: string
  schemaVersion?: unknown
  issues?: WorkspaceExportSchemaIssue[]
}

export type WorkspaceExportParseResult =
  | { ok: true; data: WorkspaceExport }
  | { ok: false; error: WorkspaceExportParseError }

function readSchemaVersion(value: unknown): unknown {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>).schemaVersion
    : undefined
}

export function parseExportResult(json: string): WorkspaceExportParseResult {
  let data: unknown
  try {
    data = JSON.parse(json) as unknown
  } catch {
    return { ok: false, error: { reason: "invalid-json", message: "导入数据不是有效的 JSON" } }
  }

  const parsed = workspaceExportSchema.safeParse(data)
  if (!parsed.success) {
    const schemaVersion = readSchemaVersion(data)
    if (schemaVersion !== SCHEMA_VERSION) {
      return {
        ok: false,
        error: {
          reason: "unsupported-schema-version",
          message: `不支持的导出版本: ${String(schemaVersion)}`,
          schemaVersion,
        },
      }
    }

    return {
      ok: false,
      error: {
        reason: "schema-invalid",
        message: "导入数据不符合当前工作区 schema",
        schemaVersion,
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.map((key) => (typeof key === "number" ? key : String(key))),
          message: issue.message,
        })),
      },
    }
  }

  return { ok: true, data: parsed.data as WorkspaceExport }
}

export function parseExport(json: string): WorkspaceExport | null {
  const result = parseExportResult(json)
  return result.ok ? result.data : null
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

  const filteredInstances = data.instances.flatMap((instance) => {
    if (!availablePluginIds.includes(instance.pluginId)) {
      warnings.push(`插件 "${instance.pluginId}" 不存在 (实例: ${instance.id})`)
      return []
    }
    return [{ ...instance, workspaceId }]
  })

  const validInstanceIds = new Set(filteredInstances.map((instance) => instance.id))

  const filteredPluginData = data.pluginData.flatMap((row) => {
    if (!availablePluginIds.includes(row.pluginId)) {
      warnings.push(`插件 "${row.pluginId}" 数据已跳过`)
      return []
    }
    if (row.instanceId && !validInstanceIds.has(row.instanceId)) {
      warnings.push(`插件 "${row.pluginId}" 数据已跳过 (实例: ${row.instanceId})`)
      return []
    }
    return [{ ...row, ...(row.workspaceId ? { workspaceId } : {}) }]
  })

  return {
    workspace: { ...data.workspace },
    instances: filteredInstances,
    pluginDataRows: filteredPluginData,
    warnings,
  }
}
