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

export class TaboraDatabase extends Dexie {
  plugins!: Table<PluginRecord, string>
  workspaces!: Table<Workspace, string>
  pluginInstances!: Table<PluginInstance, string>
  pluginData!: Table<PluginDataRow, string>
  meta!: Table<StorageMeta, string>

  constructor(name: string) {
    super(name)

    this.version(1).stores({
      plugins: "id, enabled, source",
      workspaces: "id, activeLayoutId, activeThemeId",
      pluginInstances: "id, pluginId, contributionId, regionId, enabled",
      pluginData: "id, pluginId, instanceId, key",
    })

    this.version(2)
      .stores({
        plugins: "id, enabled, source",
        workspaces: "id, activeLayoutId, activeThemeId",
        pluginInstances: "id, pluginId, contributionId, regionId, enabled",
        pluginData: "id, pluginId, instanceId, key",
        meta: "key",
      })
      .upgrade(async (tx) => {
        await tx.table("meta").put({ key: "schemaVersion", value: "2" })
        await tx.table("meta").put({ key: "migratedAt", value: new Date().toISOString() })
      })

    this.version(3)
      .stores({
        plugins: "id, enabled, source",
        workspaces: "id, activeLayoutId, activeThemeId",
        pluginInstances:
          "id, workspaceId, [workspaceId+regionId], pluginId, contributionId, regionId, enabled",
        pluginData: "id, pluginId, workspaceId, instanceId, key",
        meta: "key",
      })
      .upgrade(async (tx) => {
        await tx
          .table("pluginInstances")
          .toCollection()
          .modify((row: PluginInstance & { workspaceId?: string }) => {
            row.workspaceId ??= "default"
          })

        await tx
          .table("pluginData")
          .toCollection()
          .modify((row: PluginDataRow) => {
            row.workspaceId ??= "default"
          })

        await tx.table("meta").put({ key: "schemaVersion", value: "3" })
        await tx.table("meta").put({ key: "migratedAt", value: new Date().toISOString() })
      })
  }
}

export function createTaboraDatabase(name = "tabora"): TaboraDatabase {
  return new TaboraDatabase(name)
}
