import type { PluginInstance } from "@tabora/plugin-api"
import type { TaboraDatabase } from "./database"

export type InstanceRepository = {
  getAll(): Promise<PluginInstance[]>
  getByRegion(regionId: string): Promise<PluginInstance[]>
  get(id: string): Promise<PluginInstance | undefined>
  save(instance: PluginInstance): Promise<void>
  remove(id: string): Promise<void>
}

export function createInstanceRepository(database: TaboraDatabase): InstanceRepository {
  return {
    getAll() {
      return database.pluginInstances.toArray()
    },
    async getByRegion(regionId) {
      const instances = await database.pluginInstances.where("regionId").equals(regionId).toArray()
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
