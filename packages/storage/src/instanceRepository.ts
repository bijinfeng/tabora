import type { PluginInstance } from "@tabora/plugin-api"
import type { TaboraDatabase } from "./database"

export type InstanceRepository = {
  getAll(): Promise<PluginInstance[]>
  getByWorkspace(workspaceId: string): Promise<PluginInstance[]>
  getByRegion(workspaceId: string, regionId: string): Promise<PluginInstance[]>
  get(id: string): Promise<PluginInstance | undefined>
  save(instance: PluginInstance): Promise<void>
  remove(id: string): Promise<void>
}

export function createInstanceRepository(database: TaboraDatabase): InstanceRepository {
  return {
    getAll() {
      return database.pluginInstances.toArray()
    },
    async getByWorkspace(workspaceId) {
      return database.pluginInstances.where("workspaceId").equals(workspaceId).toArray()
    },
    async getByRegion(workspaceId, regionId) {
      const instances = await database.pluginInstances
        .where("[workspaceId+regionId]")
        .equals([workspaceId, regionId])
        .toArray()
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
    get(id) {
      return database.pluginInstances.get(id)
    },
    async save(instance) {
      await database.pluginInstances.put(instance)
    },
    async remove(id) {
      await database.pluginInstances.delete(id)
    },
  }
}
