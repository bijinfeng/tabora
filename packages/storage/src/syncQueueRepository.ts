import type { SyncQueueRow, TaboraDatabase } from "./database"

export type SyncQueueRepository = {
  add(item: Omit<SyncQueueRow, "id">): Promise<string>
  get(id: string): Promise<SyncQueueRow | undefined>
  getAllPending(): Promise<SyncQueueRow[]>
  getByRecord(
    scope: string,
    entityType: string,
    recordKey: string,
  ): Promise<SyncQueueRow | undefined>
  updateStatus(
    id: string,
    status: SyncQueueRow["status"],
    updates?: { lastAttemptAt?: string; failureReason?: string },
  ): Promise<void>
  remove(id: string): Promise<void>
  removeByRecord(scope: string, entityType: string, recordKey: string): Promise<void>
  clear(): Promise<void>
  count(): Promise<number>
}

export function createSyncQueueRepository(database: TaboraDatabase): SyncQueueRepository {
  return {
    async add(item) {
      const id = crypto.randomUUID()
      await database.syncQueue.add({ ...item, id })
      return id
    },
    get(id) {
      return database.syncQueue.get(id)
    },
    async getAllPending() {
      const rows = await database.syncQueue.where("status").equals("pending").toArray()
      return rows.sort((left, right) => left.queuedAt.localeCompare(right.queuedAt))
    },
    async getByRecord(scope, entityType, recordKey) {
      return database.syncQueue
        .where("[scope+entityType+recordKey]")
        .equals([scope, entityType, recordKey])
        .first()
    },
    async updateStatus(id, status, updates) {
      await database.syncQueue.update(id, { status, ...updates })
    },
    async remove(id) {
      await database.syncQueue.delete(id)
    },
    async removeByRecord(scope, entityType, recordKey) {
      await database.syncQueue
        .where("[scope+entityType+recordKey]")
        .equals([scope, entityType, recordKey])
        .delete()
    },
    async clear() {
      await database.syncQueue.clear()
    },
    count() {
      return database.syncQueue.count()
    },
  }
}
