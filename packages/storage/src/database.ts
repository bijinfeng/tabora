import Dexie, { type Table } from "dexie"
import type { PluginInstance, PluginPermission, PluginRecord, Workspace } from "@tabora/plugin-api"

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

export type PermissionGrant = {
  id: string
  pluginId: string
  permission: PluginPermission
  grantedAt: string
}

export type EventLog = {
  id: string
  eventName: string
  pluginId?: string
  payload?: unknown
  createdAt: string
}

export type SearchHistoryRecord = {
  id: string
  workspaceId: string
  query: string
  providerId: string
  createdAt: string
}

export type ShortcutBindingRecord = {
  id: string
  commandId: string
  key: string
  source: "platform" | "plugin" | "user"
  pluginId?: string
  updatedAt: string
}

export type WorkspaceSnapshot = {
  id: string
  workspaceId: string
  layoutId: string
  regions: Workspace["regions"]
  instances: PluginInstance[]
  createdAt: string
}

export class TaboraDatabase extends Dexie {
  plugins!: Table<PluginRecord, string>
  workspaces!: Table<Workspace, string>
  pluginInstances!: Table<PluginInstance, string>
  pluginData!: Table<PluginDataRow, string>
  meta!: Table<StorageMeta, string>
  permissionGrants!: Table<PermissionGrant, string>
  eventLogs!: Table<EventLog, string>
  searchHistory!: Table<SearchHistoryRecord, string>
  shortcutBindings!: Table<ShortcutBindingRecord, string>
  workspaceSnapshots!: Table<WorkspaceSnapshot, string>

  constructor(name: string) {
    super(name)

    this.version(1).stores({
      plugins: "id, enabled, source",
      workspaces: "id, activeLayoutId, activeThemeId",
      pluginInstances:
        "id, workspaceId, [workspaceId+regionId], pluginId, contributionId, regionId, enabled",
      pluginData: "id, pluginId, workspaceId, instanceId, key",
      meta: "key",
      permissionGrants: "id, pluginId, grantedAt",
      eventLogs: "id, eventName, pluginId, createdAt",
      searchHistory: "id, workspaceId, providerId, createdAt",
      shortcutBindings: "id, commandId, key, source, pluginId",
      workspaceSnapshots: "id, workspaceId, layoutId, createdAt",
    })
  }
}

export function createTaboraDatabase(name = "tabora"): TaboraDatabase {
  return new TaboraDatabase(name)
}
