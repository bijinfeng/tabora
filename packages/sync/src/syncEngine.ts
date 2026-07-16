import type { TaboraDatabase, SyncMetaRepository, PluginDataRow } from "@tabora/storage"
import type { Workspace, PluginInstance, PluginRecord } from "@tabora/plugin-api"
import type { DirectusGatewayClient } from "./directusGatewayClient"
import type { LocalChangeQueue } from "./localChangeQueue"
import { rejectSensitiveFields } from "./sensitiveFilter"

/**
 * Minimal auth session dependency: the sync engine only needs to know whether
 * a session currently exists before attempting a push/pull cycle.
 */
export type SyncAuthSession = {
  getSession(): Promise<unknown | null>
}

export type SyncEngineConfig = {
  database: TaboraDatabase
  gatewayClient: DirectusGatewayClient
  changeQueue: LocalChangeQueue
  syncMetaRepo: SyncMetaRepository
  authSession: SyncAuthSession
  /**
   * Lazily resolve the device id. Evaluated on each push so a deviceId that is
   * generated/persisted after the engine is constructed is picked up (avoids
   * capturing an empty string by value in the closure).
   */
  getDeviceId: () => Promise<string>
}

export type SyncResult = {
  success: boolean
  pushedCount: number
  pulledCount: number
  conflicts: number
  errors: string[]
}

/**
 * A normalized remote record shared by the pull path and the conflict
 * (server-wins) path. `deleted` records are applied as tombstones (delete),
 * otherwise the payload is written to the matching table.
 */
type RemoteRecord = {
  scope: "core" | "plugin"
  entityType: string
  recordKey: string
  payload: unknown
  deleted: boolean
}

/**
 * Apply a single remote record to the local database. Dispatches by
 * scope/entityType to the appropriate table and put/delete operation.
 */
async function applyRemoteRecord(database: TaboraDatabase, record: RemoteRecord): Promise<void> {
  if (record.deleted) {
    if (record.scope === "core" && record.entityType === "workspace") {
      await database.workspaces.delete(record.recordKey)
    } else if (record.scope === "core" && record.entityType === "pluginInstance") {
      await database.pluginInstances.delete(record.recordKey)
    } else if (record.scope === "core" && record.entityType === "plugin") {
      await database.plugins.delete(record.recordKey)
    } else if (record.scope === "plugin") {
      await database.pluginData.delete(record.recordKey)
    }
    return
  }

  if (record.scope === "core" && record.entityType === "workspace") {
    await database.workspaces.put(record.payload as Workspace)
  } else if (record.scope === "core" && record.entityType === "pluginInstance") {
    await database.pluginInstances.put(record.payload as PluginInstance)
  } else if (record.scope === "core" && record.entityType === "plugin") {
    await database.plugins.put(record.payload as PluginRecord)
  } else if (record.scope === "plugin") {
    await database.pluginData.put(record.payload as PluginDataRow)
  }
}

/**
 * Sync engine - orchestrates push/pull/merge cycles.
 * This is the main sync coordinator.
 */
export function createSyncEngine(config: SyncEngineConfig) {
  const { database, gatewayClient, changeQueue, syncMetaRepo, authSession, getDeviceId } = config

  async function push(): Promise<{
    accepted: number
    conflicts: number
    rejected: number
    errors: string[]
  }> {
    const pending = await changeQueue.getPending()
    const errors: string[] = []
    let accepted = 0
    let conflicts = 0
    let rejected = 0

    if (pending.length === 0) {
      return { accepted, conflicts, rejected, errors }
    }

    // Filter out sensitive fields before pushing
    const safePending = pending.filter((item) => {
      try {
        rejectSensitiveFields(item.payload)
        return true
      } catch (err) {
        errors.push(
          `Sensitive field in ${item.entityType}/${item.recordKey}: ${err instanceof Error ? err.message : "unknown"}`,
        )
        void changeQueue.markAsFailed(
          item.id,
          `Sensitive field: ${err instanceof Error ? err.message : "unknown"}`,
        )
        return false
      }
    })

    if (safePending.length === 0) {
      return { accepted, conflicts, rejected, errors }
    }

    // Mark as syncing
    await Promise.all(safePending.map((item) => changeQueue.markAsSyncing(item.id)))

    // Resolve the device id lazily (generated/persisted outside the engine).
    const deviceId = await getDeviceId()

    // Push to gateway
    const response = await gatewayClient.push(
      deviceId,
      safePending.map((item) => ({
        scope: item.scope as "core" | "plugin",
        entityType: item.entityType,
        recordKey: item.recordKey,
        payload: item.payload,
        clientUpdatedAt: item.clientUpdatedAt,
        deleted: item.deleted,
      })),
    )

    if (!response.ok) {
      errors.push(`Gateway error: ${response.error.message}`)
      // Mark all as failed
      await Promise.all(
        safePending.map((item) => changeQueue.markAsFailed(item.id, response.error.message)),
      )
      return { accepted, conflicts, rejected: safePending.length, errors }
    }

    // Process accepted: local change reached the server, drop it from the queue.
    // The push protocol only returns the record id here (no entityType), so the
    // match relies on recordKey uniqueness. recordKeys are UUIDs, so a collision
    // across entity types is not expected in practice.
    accepted = response.data.accepted.length
    await Promise.all(
      response.data.accepted.map((recordKey) => {
        const item = safePending.find((p) => p.recordKey === recordKey)
        return item ? changeQueue.dequeue(item.id) : Promise.resolve()
      }),
    )

    // Process conflicts: server wins. Overwrite the local record with the
    // server's version, then drop the pending change (no retry). Only dequeue
    // when the local apply succeeds; on failure keep the entry for a later retry.
    conflicts = response.data.conflicts.length
    for (const conflict of response.data.conflicts) {
      try {
        await applyRemoteRecord(database, {
          scope: conflict.type === "pluginData" ? "plugin" : "core",
          entityType: conflict.type,
          recordKey: conflict.id,
          payload: conflict.server_data,
          deleted: conflict.server_data === null,
        })
      } catch (err) {
        errors.push(
          `Failed to apply conflict ${conflict.type}/${conflict.id}: ${err instanceof Error ? err.message : "unknown"}`,
        )
        // Local apply failed — do NOT dequeue so the change is retried next cycle.
        continue
      }
      // Conflicts carry a `type`, so constrain the match by entityType too.
      const item = safePending.find(
        (p) => p.recordKey === conflict.id && p.entityType === conflict.type,
      )
      if (item) {
        await changeQueue.dequeue(item.id)
      }
    }

    // Process rejected: keep the entry as failed so it can be inspected/retried.
    // The protocol only returns the record id (no entityType), so this match
    // relies on recordKey (UUID) uniqueness, same as the accepted branch.
    rejected = response.data.rejected.length
    for (const rej of response.data.rejected) {
      errors.push(`Rejected ${rej.id}: ${rej.reason}`)
      const item = safePending.find((p) => p.recordKey === rej.id)
      if (item) {
        await changeQueue.markAsFailed(item.id, rej.reason)
      }
    }

    return { accepted, conflicts, rejected, errors }
  }

  async function pull(): Promise<{ applied: number; errors: string[] }> {
    const errors: string[] = []
    let applied = 0

    // Get last cursor
    const cursor = await syncMetaRepo.get("pullCursor")

    // Pull from gateway
    const response = await gatewayClient.pull(cursor ?? undefined)

    if (!response.ok) {
      errors.push(`Gateway error: ${response.error.message}`)
      return { applied, errors }
    }

    const { records, cursor: newCursor } = response.data

    // Apply records to local database
    for (const record of records) {
      try {
        await applyRemoteRecord(database, {
          scope: record.scope,
          entityType: record.entityType,
          recordKey: record.recordKey,
          payload: record.payload,
          deleted: record.deleted,
        })
        applied++
      } catch (err) {
        errors.push(
          `Failed to apply ${record.entityType}/${record.recordKey}: ${err instanceof Error ? err.message : "unknown"}`,
        )
      }
    }

    // Update cursor
    await syncMetaRepo.set("pullCursor", newCursor)

    return { applied, errors }
  }

  async function sync(): Promise<SyncResult> {
    const errors: string[] = []

    // Check session
    const session = await authSession.getSession()
    if (!session) {
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: 0,
        errors: ["No active session"],
      }
    }

    // Push local changes
    const pushResult = await push()
    errors.push(...pushResult.errors)

    // Pull remote changes
    const pullResult = await pull()
    errors.push(...pullResult.errors)

    return {
      success: errors.length === 0,
      pushedCount: pushResult.accepted,
      pulledCount: pullResult.applied,
      conflicts: pushResult.conflicts,
      errors,
    }
  }

  return {
    push,
    pull,
    sync,
  }
}

export type SyncEngine = ReturnType<typeof createSyncEngine>
