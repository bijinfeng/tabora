import Dexie, { type Table } from "dexie"
import type { PluginInstance, PluginRecord, Workspace } from "@tabora/plugin-api"

export type PluginDataRow = {
  id: string
  pluginId: string
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

export type WorkspaceSnapshot = {
  id: string
  workspaceId: string
  layoutId: string
  regions: Workspace["regions"]
  instances: PluginInstance[]
  createdAt: string
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
  pluginInstances!: Table<PluginInstance, string>
  pluginData!: Table<PluginDataRow, string>
  meta!: Table<StorageMeta, string>
  workspaceSnapshots!: Table<WorkspaceSnapshot, string>
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
      workspaceSnapshots: "id, workspaceId, layoutId, createdAt",
    })

    this.version(2).stores({
      plugins: "id, enabled, source",
      workspaces: "id, activeLayoutId, activeThemeId",
      pluginInstances:
        "id, workspaceId, [workspaceId+regionId], pluginId, contributionId, regionId, enabled",
      pluginData: "id, pluginId, workspaceId, instanceId, key",
      meta: "key",
      workspaceSnapshots: "id, workspaceId, layoutId, createdAt",
      syncQueue: "id, [scope+entityType+recordKey], status, queuedAt",
      syncMeta: "key",
    })
  }
}

export function createTaboraDatabase(name = "tabora"): TaboraDatabase {
  return new TaboraDatabase(name)
}
