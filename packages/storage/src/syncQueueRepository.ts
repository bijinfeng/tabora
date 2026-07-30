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
    updates?: {
      lastAttemptAt?: string | undefined
      failureReason?: string | undefined
      payload?: unknown
      clientUpdatedAt?: string
      deleted?: boolean
    },
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
      await database.syncQueue.update(id, (row) => {
        row.status = status
        if (!updates) return

        if ("lastAttemptAt" in updates) {
          if (updates.lastAttemptAt === undefined) {
            delete row.lastAttemptAt
          } else {
            row.lastAttemptAt = updates.lastAttemptAt
          }
        }
        if ("failureReason" in updates) {
          if (updates.failureReason === undefined) {
            delete row.failureReason
          } else {
            row.failureReason = updates.failureReason
          }
        }
        if ("payload" in updates) row.payload = updates.payload
        if (updates.clientUpdatedAt !== undefined) row.clientUpdatedAt = updates.clientUpdatedAt
        if (updates.deleted !== undefined) row.deleted = updates.deleted
      })
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
