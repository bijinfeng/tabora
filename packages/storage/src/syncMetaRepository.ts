import type { SyncMetaRow, TaboraDatabase } from "./database"

export type SyncMetaRepository = {
  get(key: string): Promise<string | undefined>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  getAll(): Promise<SyncMetaRow[]>
}

export function createSyncMetaRepository(database: TaboraDatabase): SyncMetaRepository {
  return {
    async get(key) {
      const row = await database.syncMeta.get(key)
      return row?.value
    },
    async set(key, value) {
      await database.syncMeta.put({ key, value })
    },
    async remove(key) {
      await database.syncMeta.delete(key)
    },
    async clear() {
      await database.syncMeta.clear()
    },
    getAll() {
      return database.syncMeta.toArray()
    },
  }
}
