/**
 * Conflict model - represents sync conflicts that need user resolution.
 * V1: placeholder for future conflict inbox implementation.
 */

export type ConflictRecord = {
  conflictId: string
  scope: "core" | "plugin"
  entityType: string
  recordKey: string
  localState: unknown
  remoteState: unknown
  localUpdatedAt: string
  remoteUpdatedAt: string
  detectedAt: string
  status: "open" | "resolved"
}

export type ConflictResolution = "keep-local" | "keep-remote" | "merged" | "ignore"

export type ConflictInbox = {
  getAll(): Promise<ConflictRecord[]>
  getById(conflictId: string): Promise<ConflictRecord | undefined>
  resolve(
    conflictId: string,
    resolution: ConflictResolution,
    mergedPayload?: unknown,
  ): Promise<void>
  clear(): Promise<void>
}

/**
 * Create a conflict inbox (V1: in-memory placeholder).
 * Future implementation will persist to IndexedDB.
 */
export function createConflictInbox(): ConflictInbox {
  const conflicts = new Map<string, ConflictRecord>()

  return {
    async getAll() {
      return Array.from(conflicts.values()).filter((c) => c.status === "open")
    },

    async getById(conflictId) {
      return conflicts.get(conflictId)
    },

    async resolve(conflictId, _resolution, _mergedPayload) {
      const conflict = conflicts.get(conflictId)
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`)
      }

      conflict.status = "resolved"
      // TODO: apply resolution to local database and trigger sync
    },

    async clear() {
      conflicts.clear()
    },
  }
}
