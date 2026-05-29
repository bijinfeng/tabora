import type { PluginRecord } from "@tabora/plugin-api"
import type { TaboraDatabase } from "./database"

export type PluginRecordRepository = {
  get(id: string): Promise<PluginRecord | undefined>
  getAll(): Promise<PluginRecord[]>
  save(record: PluginRecord): Promise<void>
  remove(id: string): Promise<void>
}

export function createPluginRecordRepository(database: TaboraDatabase): PluginRecordRepository {
  return {
    get(id) {
      return database.plugins.get(id)
    },
    getAll() {
      return database.plugins.toArray()
    },
    async save(record) {
      await database.plugins.put(record)
    },
    async remove(id) {
      await database.plugins.delete(id)
    },
  }
}
