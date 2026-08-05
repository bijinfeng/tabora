import { pluginInstanceSchema, type PluginInstance } from "@tabora/plugin-api"
import type { TaboraDatabase } from "./database"

export type InstanceRepository = {
  getAll(): Promise<PluginInstance[]>
  getByWorkspace(workspaceId: string): Promise<PluginInstance[]>
  getByRegion(workspaceId: string, regionId: string): Promise<PluginInstance[]>
  get(id: string): Promise<PluginInstance | undefined>
  save(instance: PluginInstance): Promise<void>
  removeByWorkspace(workspaceId: string): Promise<void>
  remove(id: string): Promise<void>
}

function migrateLegacyInstanceRef(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  const row = value as Record<string, unknown>
  if (row.contribution !== undefined) return row
  if (
    typeof row.pluginId !== "string" ||
    typeof row.contributionId !== "string" ||
    (row.extensionPoint !== "widget" && row.extensionPoint !== "search")
  ) {
    return row
  }

  const { pluginId, contributionId, extensionPoint, ...canonicalRow } = row
  return {
    ...canonicalRow,
    contribution: { pluginId, kind: extensionPoint, id: contributionId },
  }
}

function requiresCanonicalRewrite(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  const row = value as Record<string, unknown>
  return (
    row.contribution === undefined ||
    "pluginId" in row ||
    "contributionId" in row ||
    "extensionPoint" in row
  )
}

function parseStoredInstance(value: unknown): PluginInstance {
  return pluginInstanceSchema.parse(migrateLegacyInstanceRef(value)) as PluginInstance
}

async function normalizeRows(
  database: TaboraDatabase,
  values: unknown[],
): Promise<PluginInstance[]> {
  const instances = values.map(parseStoredInstance)
  await Promise.all(
    instances.map((instance, index) =>
      requiresCanonicalRewrite(values[index])
        ? database.pluginInstances.put(instance)
        : Promise.resolve(),
    ),
  )
  return instances
}

export function createInstanceRepository(database: TaboraDatabase): InstanceRepository {
  return {
    async getAll() {
      return normalizeRows(database, await database.pluginInstances.toArray())
    },
    async getByWorkspace(workspaceId) {
      return normalizeRows(
        database,
        await database.pluginInstances.where("workspaceId").equals(workspaceId).toArray(),
      )
    },
    async getByRegion(workspaceId, regionId) {
      const rows = await database.pluginInstances
        .where("[workspaceId+regionId]")
        .equals([workspaceId, regionId])
        .toArray()
      const instances = await normalizeRows(database, rows)
      return instances.sort((left, right) => {
        const leftGrid = left.grid
        const rightGrid = right.grid

        if (!leftGrid && !rightGrid) {
          return left.createdAt.localeCompare(right.createdAt)
        }

        if (!leftGrid) {
          return 1
        }

        if (!rightGrid) {
          return -1
        }

        return leftGrid.y - rightGrid.y || leftGrid.x - rightGrid.x
      })
    },
    async get(id) {
      const instance = await database.pluginInstances.get(id)
      if (instance === undefined) return undefined
      const normalized = parseStoredInstance(instance)
      if (requiresCanonicalRewrite(instance)) {
        await database.pluginInstances.put(normalized)
      }
      return normalized
    },
    async save(instance) {
      await database.pluginInstances.put(pluginInstanceSchema.parse(instance))
    },
    async removeByWorkspace(workspaceId) {
      await database.pluginInstances.where("workspaceId").equals(workspaceId).delete()
    },
    async remove(id) {
      await database.pluginInstances.delete(id)
    },
  }
}
