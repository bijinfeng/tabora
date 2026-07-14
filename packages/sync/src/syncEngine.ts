import type { TaboraDatabase, SyncMetaRepository, PluginDataRow } from "@tabora/storage"
import type { Workspace, PluginInstance, PluginRecord } from "@tabora/plugin-api"
import type { GatewayClient } from "./gatewayClient"
import type { LocalChangeQueue } from "./localChangeQueue"
import type { AuthSessionManager } from "./authSession"
import { rejectSensitiveFields } from "./sensitiveFilter"

export type SyncEngineConfig = {
  database: TaboraDatabase
  gatewayClient: GatewayClient
  changeQueue: LocalChangeQueue
  syncMetaRepo: SyncMetaRepository
  authSession: AuthSessionManager
  deviceId: string
}

export type SyncResult = {
  success: boolean
  pushedCount: number
  pulledCount: number
  conflicts: number
  errors: string[]
}

/**
 * Sync engine - orchestrates push/pull/merge cycles.
 * This is the main sync coordinator.
 */
export function createSyncEngine(config: SyncEngineConfig) {
  const { database, gatewayClient, changeQueue, syncMetaRepo, authSession, deviceId } = config

  async function push(): Promise<{
    accepted: number
    rejected: number
    errors: string[]
  }> {
    const pending = await changeQueue.getPending()
    const errors: string[] = []
    let accepted = 0
    let rejected = 0

    if (pending.length === 0) {
      return { accepted, rejected, errors }
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
        changeQueue.markAsFailed(
          item.id,
          `Sensitive field: ${err instanceof Error ? err.message : "unknown"}`,
        )
        return false
      }
    })

    if (safePending.length === 0) {
      return { accepted, rejected, errors }
    }

    // Mark as syncing
    await Promise.all(safePending.map((item) => changeQueue.markAsSyncing(item.id)))

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
      return { accepted, rejected: safePending.length, errors }
    }

    // Process accepted
    accepted = response.data.accepted.length
    await Promise.all(
      response.data.accepted.map((recordKey) => {
        const item = safePending.find((p) => p.recordKey === recordKey)
        return item ? changeQueue.dequeue(item.id) : Promise.resolve()
      }),
    )

    // Process rejected
    rejected = response.data.rejected.length
    for (const rej of response.data.rejected) {
      errors.push(`Rejected ${rej.recordKey}: ${rej.reason}`)
      const item = safePending.find((p) => p.recordKey === rej.recordKey)
      if (item) {
        await changeQueue.markAsFailed(item.id, rej.reason)
      }
    }

    return { accepted, rejected, errors }
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
        if (record.deleted) {
          // Handle tombstone
          if (record.scope === "core" && record.entityType === "workspace") {
            await database.workspaces.delete(record.recordKey)
          } else if (record.scope === "core" && record.entityType === "pluginInstance") {
            await database.pluginInstances.delete(record.recordKey)
          } else if (record.scope === "core" && record.entityType === "plugin") {
            await database.plugins.delete(record.recordKey)
          } else if (record.scope === "plugin") {
            await database.pluginData.delete(record.recordKey)
          }
        } else {
          // Apply update
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
      conflicts: 0, // TODO: implement conflict detection
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
