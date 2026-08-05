import type { TaboraDatabase } from "@tabora/storage"
import type { LocalChange, LocalChangeQueue } from "./localChangeQueue"
import { isChangeDetectionSuppressed } from "./changeDetectionGuard"
import type { PluginSyncCollections } from "./pluginSyncCollections"

export type ChangeDetectorConfig = {
  database: TaboraDatabase
  changeQueue: LocalChangeQueue
  /** Manifest-declared record collections eligible for sync. Omit for local-only plugin data. */
  syncCollections?: PluginSyncCollections
  onChange?: () => void
}

type SourceTransaction = {
  on(event: "complete", subscriber: () => void): void
}

/**
 * Change detector - monitors Dexie tables and generates sync changes.
 * Uses Dexie hooks to capture creates/updates/deletes.
 */
export function createChangeDetector(config: ChangeDetectorConfig) {
  const { database, changeQueue } = config
  const hookDisposers: Array<() => void> = []
  let running = false

  function registerHook(table: any, event: "creating" | "updating" | "deleting", callback: any) {
    table.hook(event, callback)
    hookDisposers.push(() => table.hook(event).unsubscribe(callback))
  }

  function enqueueAfterCommit(transaction: SourceTransaction, change: LocalChange) {
    if (isChangeDetectionSuppressed(database)) return

    transaction.on("complete", () => {
      if (!running) return
      setTimeout(() => {
        if (!running) return
        void changeQueue
          .enqueue(change)
          .then(() => {
            config.onChange?.()
          })
          .catch((error: unknown) => {
            console.error("Failed to queue local sync change", error)
          })
      }, 0)
    })
  }

  function start() {
    if (running) return
    running = true
    // Monitor workspaces table
    registerHook(
      database.workspaces,
      "creating",
      (_primKey: any, obj: any, transaction: SourceTransaction) => {
        enqueueAfterCommit(transaction, {
          scope: "core",
          entityType: "workspace",
          recordKey: obj.id,
          payload: obj,
          clientUpdatedAt: obj.updatedAt ?? new Date().toISOString(),
          deleted: false,
        })
      },
    )

    registerHook(
      database.workspaces,
      "updating",
      (mods: any, _primKey: any, obj: any, transaction: SourceTransaction) => {
        enqueueAfterCommit(transaction, {
          scope: "core",
          entityType: "workspace",
          recordKey: obj.id,
          payload: { ...obj, ...mods },
          clientUpdatedAt: mods.updatedAt ?? new Date().toISOString(),
          deleted: false,
        })
      },
    )

    registerHook(
      database.workspaces,
      "deleting",
      (_primKey: any, obj: any, transaction: SourceTransaction) => {
        enqueueAfterCommit(transaction, {
          scope: "core",
          entityType: "workspace",
          recordKey: obj.id,
          payload: obj,
          clientUpdatedAt: new Date().toISOString(),
          deleted: true,
        })
      },
    )

    // Monitor pluginInstances table
    registerHook(
      database.pluginInstances,
      "creating",
      (_primKey: any, obj: any, transaction: SourceTransaction) => {
        enqueueAfterCommit(transaction, {
          scope: "core",
          entityType: "pluginInstance",
          recordKey: obj.id,
          payload: obj,
          clientUpdatedAt: obj.createdAt ?? new Date().toISOString(),
          deleted: false,
        })
      },
    )

    registerHook(
      database.pluginInstances,
      "updating",
      (mods: any, _primKey: any, obj: any, transaction: SourceTransaction) => {
        enqueueAfterCommit(transaction, {
          scope: "core",
          entityType: "pluginInstance",
          recordKey: obj.id,
          payload: { ...obj, ...mods },
          clientUpdatedAt: new Date().toISOString(),
          deleted: false,
        })
      },
    )

    registerHook(
      database.pluginInstances,
      "deleting",
      (_primKey: any, obj: any, transaction: SourceTransaction) => {
        enqueueAfterCommit(transaction, {
          scope: "core",
          entityType: "pluginInstance",
          recordKey: obj.id,
          payload: obj,
          clientUpdatedAt: new Date().toISOString(),
          deleted: true,
        })
      },
    )

    // Monitor plugins table
    registerHook(
      database.plugins,
      "creating",
      (_primKey: any, obj: any, transaction: SourceTransaction) => {
        enqueueAfterCommit(transaction, {
          scope: "core",
          entityType: "plugin",
          recordKey: obj.id,
          payload: obj,
          clientUpdatedAt: obj.installedAt ?? new Date().toISOString(),
          deleted: false,
        })
      },
    )

    registerHook(
      database.plugins,
      "updating",
      (mods: any, _primKey: any, obj: any, transaction: SourceTransaction) => {
        enqueueAfterCommit(transaction, {
          scope: "core",
          entityType: "plugin",
          recordKey: obj.id,
          payload: { ...obj, ...mods },
          clientUpdatedAt: new Date().toISOString(),
          deleted: false,
        })
      },
    )

    registerHook(
      database.plugins,
      "deleting",
      (_primKey: any, obj: any, transaction: SourceTransaction) => {
        enqueueAfterCommit(transaction, {
          scope: "core",
          entityType: "plugin",
          recordKey: obj.id,
          payload: obj,
          clientUpdatedAt: new Date().toISOString(),
          deleted: true,
        })
      },
    )

    function syncCollectionFor(value: {
      pluginId?: unknown
      collection?: unknown
      recordId?: unknown
    }) {
      if (
        typeof value.pluginId !== "string" ||
        typeof value.collection !== "string" ||
        typeof value.recordId !== "string"
      ) {
        return undefined
      }
      return config.syncCollections?.get(value.pluginId)?.get(value.collection)
    }

    function payloadForSync(value: Record<string, unknown>, excludedFields: readonly string[]) {
      const recordValue = value.value
      if (!recordValue || typeof recordValue !== "object" || Array.isArray(recordValue))
        return value
      const redactedValue = { ...(recordValue as Record<string, unknown>) }
      for (const field of excludedFields) delete redactedValue[field]
      return { ...value, value: redactedValue }
    }

    function pluginDataChange(
      value: Record<string, unknown>,
      deleted: boolean,
    ): LocalChange | undefined {
      const collection = syncCollectionFor(value)
      if (!collection || typeof value.id !== "string") return undefined
      return {
        scope: "plugin",
        // The server record type remains stable; plugin/collection identity travels in payload.
        entityType: "pluginData",
        recordKey: value.id,
        payload: payloadForSync(value, collection.excludedFields ?? []),
        clientUpdatedAt:
          typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
        deleted,
      }
    }

    // Plugin data is local-only by default. Only a manifest-declared collection may enqueue.
    registerHook(
      database.pluginData,
      "creating",
      (_primKey: any, obj: any, transaction: SourceTransaction) => {
        const change = pluginDataChange(obj, false)
        if (change) enqueueAfterCommit(transaction, change)
      },
    )

    registerHook(
      database.pluginData,
      "updating",
      (mods: any, _primKey: any, obj: any, transaction: SourceTransaction) => {
        const next = { ...obj, ...mods }
        const change = pluginDataChange(next, false)
        if (change) enqueueAfterCommit(transaction, change)
      },
    )

    registerHook(
      database.pluginData,
      "deleting",
      (_primKey: any, obj: any, transaction: SourceTransaction) => {
        const change = pluginDataChange(obj, true)
        if (change) enqueueAfterCommit(transaction, change)
      },
    )
  }

  function stop() {
    if (!running) return
    running = false
    for (const dispose of hookDisposers.splice(0)) dispose()
  }

  return {
    start,
    stop,
  }
}

export type ChangeDetector = ReturnType<typeof createChangeDetector>
