import type { TaboraDatabase } from "./database"

export type PluginDataRepository = {
  get<T = unknown>(pluginId: string, key: string): Promise<T | undefined>
  getAll<T = unknown>(pluginId: string): Promise<T[]>
  save<T = unknown>(pluginId: string, key: string, value: T): Promise<void>
  remove(pluginId: string, key: string): Promise<void>
}

export function createPluginDataRepository(database: TaboraDatabase): PluginDataRepository {
  return {
    async get(pluginId, key) {
      const id = `${pluginId}:${key}`
      const row = await database.pluginData.get(id)
      return row?.value as any
    },
    async getAll(pluginId) {
      const rows = await database.pluginData.where("pluginId").equals(pluginId).toArray()
      return rows.map((r) => r.value) as any[]
    },
    async save(pluginId, key, value) {
      const id = `${pluginId}:${key}`
      await database.pluginData.put({
        id,
        pluginId,
        key,
        value,
        updatedAt: new Date().toISOString(),
      })
    },
    async remove(pluginId, key) {
      const id = `${pluginId}:${key}`
      await database.pluginData.delete(id)
    },
  }
}
