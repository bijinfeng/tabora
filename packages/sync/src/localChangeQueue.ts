import type { SyncQueueRepository, SyncQueueRow } from "@tabora/storage"

export type LocalChange = {
  scope: "core" | "plugin"
  entityType: string
  recordKey: string
  payload: unknown
  clientUpdatedAt: string
  deleted: boolean
}

export type LocalChangeQueue = {
  enqueue(change: LocalChange): Promise<void>
  dequeue(id: string): Promise<void>
  getPending(): Promise<Array<SyncQueueRow>>
  markAsSyncing(id: string): Promise<void>
  markAsFailed(id: string, reason: string): Promise<void>
  clear(): Promise<void>
  getByRecord(
    scope: string,
    entityType: string,
    recordKey: string,
  ): Promise<SyncQueueRow | undefined>
}

/**
 * Local change queue - wraps syncQueueRepository from @tabora/storage.
 * Manages the queue of local changes waiting to be synced to the cloud.
 */
export function createLocalChangeQueue(syncQueueRepo: SyncQueueRepository): LocalChangeQueue {
  return {
    async enqueue(change) {
      // Check if already queued
      const existing = await syncQueueRepo.getByRecord(
        change.scope,
        change.entityType,
        change.recordKey,
      )

      if (existing) {
        // Update existing entry with latest state (merge in delay window)
        await syncQueueRepo.updateStatus(existing.id, "pending", {})
        return
      }

      // Add new entry
      await syncQueueRepo.add({
        scope: change.scope,
        entityType: change.entityType,
        recordKey: change.recordKey,
        status: "pending",
        payload: change.payload,
        clientUpdatedAt: change.clientUpdatedAt,
        deleted: change.deleted,
        queuedAt: new Date().toISOString(),
      })
    },

    async dequeue(id) {
      await syncQueueRepo.remove(id)
    },

    async getPending() {
      return syncQueueRepo.getAllPending()
    },

    async markAsSyncing(id) {
      await syncQueueRepo.updateStatus(id, "syncing", {
        lastAttemptAt: new Date().toISOString(),
      })
    },

    async markAsFailed(id, reason) {
      await syncQueueRepo.updateStatus(id, "failed", {
        lastAttemptAt: new Date().toISOString(),
        failureReason: reason,
      })
    },

    async clear() {
      await syncQueueRepo.clear()
    },

    async getByRecord(scope, entityType, recordKey) {
      return syncQueueRepo.getByRecord(scope, entityType, recordKey)
    },
  }
}
