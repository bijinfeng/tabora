import Dexie, { type Table } from "dexie"
import type { PluginRecord, Workspace } from "@tabora/plugin-api"

export type PluginDataRow = {
  id: string
  pluginId: string
  /** Present only for a manifest-declared, record-oriented sync collection. */
  collection?: string
  /** Stable ID within collection. It is distinct from the storage row primary key. */
  recordId?: string
  workspaceId?: string
  instanceId?: string
  key: string
  value: unknown
  updatedAt: string
}

export type StorageMeta = {
  key: string
  value: string
}

export type SyncQueueRow = {
  id: string
  scope: string
  entityType: string
  recordKey: string
  status: "pending" | "syncing" | "failed"
  payload: unknown
  clientUpdatedAt: string
  deleted: boolean
  queuedAt: string
  lastAttemptAt?: string
  failureReason?: string
}

export type SyncMetaRow = {
  key: string
  value: string
}

export class TaboraDatabase extends Dexie {
  plugins!: Table<PluginRecord, string>
  workspaces!: Table<Workspace, string>
  /** Raw rows are normalized by InstanceRepository at the storage migration boundary. */
  pluginInstances!: Table<unknown, string>
  pluginData!: Table<PluginDataRow, string>
  meta!: Table<StorageMeta, string>
  syncQueue!: Table<SyncQueueRow, string>
  syncMeta!: Table<SyncMetaRow, string>

  constructor(name: string) {
    super(name)

    this.version(1).stores({
      plugins: "id, enabled, source",
      workspaces: "id, activeLayoutId, activeThemeId",
      pluginInstances:
        "id, workspaceId, [workspaceId+regionId], pluginId, contributionId, regionId, enabled",
      pluginData: "id, pluginId, workspaceId, instanceId, key",
      meta: "key",
    })

    this.version(2).stores({
      plugins: "id, enabled, source",
      workspaces: "id, activeLayoutId, activeThemeId",
      pluginInstances:
        "id, workspaceId, [workspaceId+regionId], pluginId, contributionId, regionId, enabled",
      pluginData: "id, pluginId, workspaceId, instanceId, key",
      meta: "key",
      syncQueue: "id, [scope+entityType+recordKey], status, queuedAt",
      syncMeta: "key",
    })

    this.version(3).stores({
      plugins: "id, enabled, source",
      workspaces: "id, activeLayoutId, activeThemeId",
      pluginInstances: "id, workspaceId, [workspaceId+regionId], regionId, enabled",
      pluginData: "id, pluginId, workspaceId, instanceId, key",
      meta: "key",
      syncQueue: "id, [scope+entityType+recordKey], status, queuedAt",
      syncMeta: "key",
    })

    this.version(4).stores({
      plugins: "id, enabled, source",
      workspaces: "id, activeLayoutId, activeThemeId",
      pluginInstances: "id, workspaceId, [workspaceId+regionId], regionId, enabled",
      pluginData:
        "id, pluginId, workspaceId, instanceId, key, collection, recordId, [pluginId+collection]",
      meta: "key",
      syncQueue: "id, [scope+entityType+recordKey], status, queuedAt",
      syncMeta: "key",
    })

    // Contribution selections are canonical objects, not standalone contribution IDs; indexing
    // their former scalar fields would preserve a second identity model.
    this.version(5).stores({
      plugins: "id, enabled, source",
      workspaces: "id",
      pluginInstances: "id, workspaceId, [workspaceId+regionId], regionId, enabled",
      pluginData:
        "id, pluginId, workspaceId, instanceId, key, collection, recordId, [pluginId+collection]",
      meta: "key",
      syncQueue: "id, [scope+entityType+recordKey], status, queuedAt",
      syncMeta: "key",
    })
  }
}

export function createTaboraDatabase(name = "tabora"): TaboraDatabase {
  return new TaboraDatabase(name)
}
